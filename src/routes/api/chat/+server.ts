import Anthropic from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { MODEL, SYSTEM_PROMPT } from '$lib/server/prompt';
import type { ApiChatMessage, ErrorCode, StreamEvent } from '$lib/types';
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

function toErrorCode(err: unknown): ErrorCode {
	if (err instanceof Anthropic.AuthenticationError) return 'anthropic_auth';
	if (err instanceof Anthropic.RateLimitError) return 'anthropic_rate_limit';
	if (err instanceof Anthropic.APIError) return 'anthropic_api_error';
	return 'stream_error';
}

export const POST: RequestHandler = async ({ request }) => {
	if (!env.ANTHROPIC_API_KEY) {
		return json(
			{ code: 'missing_api_key', detail: 'ANTHROPIC_API_KEY is not set on the server.' },
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

	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	const runner = client.beta.messages.stream({
		model: MODEL,
		max_tokens: 64000,
		thinking: { type: 'adaptive' },
		// Server-side refusal fallbacks: on a policy decline the API re-runs the
		// request on a fallback model within the same call.
		betas: ['server-side-fallback-2026-07-01'],
		fallbacks: 'default',
		// Auto-cache the conversation prefix — repeated turns re-send the whole
		// history (including large code fences), so this saves most input cost.
		cache_control: { type: 'ephemeral' },
		system: SYSTEM_PROMPT,
		messages
	});

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
			let sentWriting = false;
			try {
				for await (const event of runner) {
					if (event.type === 'content_block_start') {
						if (event.content_block.type === 'thinking') {
							emit({ type: 'status', status: 'thinking' });
						} else if (event.content_block.type === 'text' && !sentWriting) {
							sentWriting = true;
							emit({ type: 'status', status: 'writing' });
						}
					} else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
						emit({ type: 'text', text: event.delta.text });
					}
				}
				const final = await runner.finalMessage();
				emit({ type: 'done', stopReason: final.stop_reason });
			} catch (err) {
				emit({
					type: 'error',
					code: toErrorCode(err),
					detail: err instanceof Error ? err.message : 'Unknown error'
				});
			} finally {
				try {
					controller.close();
				} catch {
					/* stream already cancelled */
				}
			}
		},
		cancel() {
			runner.abort();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-store'
		}
	});
};
