import { json } from '@sveltejs/kit';
import { ProviderError, resolveAiConfig, streamText } from '$lib/server/ai';
import { SYSTEM_PROMPT } from '$lib/server/prompt';
import type { ApiChatMessage, StreamEvent } from '$lib/types';
import type { RequestHandler } from './$types';

const encoder = new TextEncoder();

function sse(event: StreamEvent): Uint8Array {
	return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function isChatMessage(value: unknown): value is ApiChatMessage {
	if (typeof value !== 'object' || value === null) return false;
	const { role, content } = value as Record<string, unknown>;
	return (role === 'user' || role === 'assistant') && typeof content === 'string';
}

export const POST: RequestHandler = async ({ request }) => {
	const cfg = resolveAiConfig();
	if (!cfg) {
		return json(
			{ code: 'missing_api_key', detail: 'No AI provider key is set on the server.' },
			{ status: 503 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ code: 'invalid_request', detail: 'Body must be JSON.' }, { status: 400 });
	}

	const messages = (body as { messages?: unknown }).messages;
	if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
		return json(
			{ code: 'invalid_request', detail: 'messages must be a non-empty array of {role, content}.' },
			{ status: 400 }
		);
	}

	const abort = new AbortController();
	const events = streamText(cfg, { system: SYSTEM_PROMPT, messages, signal: abort.signal });

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			// After a client disconnect the controller is cancelled — writes then throw.
			const emit = (event: StreamEvent) => {
				try {
					controller.enqueue(sse(event));
				} catch {
					/* stream already cancelled */
				}
			};
			let sentThinking = false;
			let sentWriting = false;
			try {
				for await (const event of events) {
					if (event.type === 'thinking' && !sentThinking && !sentWriting) {
						sentThinking = true;
						emit({ type: 'status', status: 'thinking' });
					} else if (event.type === 'text') {
						if (!sentWriting) {
							sentWriting = true;
							emit({ type: 'status', status: 'writing' });
						}
						emit({ type: 'text', text: event.text });
					} else if (event.type === 'done') {
						emit({ type: 'done', stopReason: event.stopReason });
					}
				}
			} catch (err) {
				if (!abort.signal.aborted) {
					emit({
						type: 'error',
						code: err instanceof ProviderError ? err.code : 'stream_error',
						detail: err instanceof Error ? err.message : 'Unknown error'
					});
				}
			} finally {
				try {
					controller.close();
				} catch {
					/* stream already cancelled */
				}
			}
		},
		cancel() {
			abort.abort();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-store'
		}
	});
};
