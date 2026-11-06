import { json } from '@sveltejs/kit';
import { parseAssistantText } from '$lib/pages/artifact';
import { mergeFiles } from '$lib/pages/merge';
import { parsePageRequest, type PageRequest } from '$lib/pages/request';
import { ProviderError, resolveAiConfig, streamText } from '$lib/server/ai';
import { checkDesign, designReport } from '$lib/server/design-check';
import { pageCacheKey, readRecording, writeRecording } from '$lib/server/page-cache';
import { pageSystemPrompt, pageUserMessage } from '$lib/server/page-prompt';
import type { ErrorCode, PageStreamEvent } from '$lib/types';
import type { RequestHandler } from './$types';

const encoder = new TextEncoder();
const sse = (event: PageStreamEvent) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fail(status: number, code: ErrorCode, detail: string) {
	return json({ code, detail }, { status });
}

/** The design check of the page as this answer leaves it; null when the answer has no code. */
function checkAnswer(req: PageRequest, answer: string): PageStreamEvent | null {
	const emitted = parseAssistantText(answer).files.map(({ name, contents }) => ({ name, contents }));
	return emitted.length > 0 ? { type: 'check', violations: checkDesign(mergeFiles(req.files, emitted)) } : null;
}

/**
 * Writes a page, or a change to one, as a stream: status, then the model's text (prose and file
 * fences), then the design check of the result, then done. A recorded answer replays as the same
 * stream, quickly, and is checked the same way.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail(400, 'invalid_request', 'Body must be JSON.');
	}
	const req = parsePageRequest(body);
	if (!req) return fail(400, 'invalid_request', 'Expected {kind, intent, files, label?, detail?}.');
	if (req.kind === 'repair') {
		// The violations come from the code itself, never from the client.
		const violations = checkDesign(req.files);
		if (violations.length === 0) return fail(409, 'nothing_to_repair', 'The design check finds nothing to repair.');
		req.detail = designReport(violations);
	}

	const key = pageCacheKey(req);
	const recorded = await readRecording(key);
	const cfg = recorded === null ? resolveAiConfig() : null;
	if (recorded === null && !cfg) return fail(503, 'missing_api_key', 'No AI provider key is set on the server.');

	const abort = new AbortController();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			// After a client disconnect the controller is cancelled — writes then throw.
			const emit = (event: PageStreamEvent) => {
				try {
					controller.enqueue(sse(event));
				} catch {
					/* stream already cancelled */
				}
			};
			try {
				if (recorded !== null) {
					// A replay still shows the code being written, just fast.
					emit({ type: 'status', status: 'writing', replay: true });
					for (let i = 0; i < recorded.length && !abort.signal.aborted; i += 160) {
						emit({ type: 'text', text: recorded.slice(i, i + 160) });
						await sleep(8);
					}
					const check = checkAnswer(req, recorded);
					if (check) emit(check);
					emit({ type: 'done', stopReason: 'end_turn' });
					return;
				}

				const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
				const events = streamText(cfg!, {
					system: pageSystemPrompt(today),
					messages: [{ role: 'user', content: pageUserMessage(req) }],
					signal: abort.signal
				});
				let answer = '';
				let writing = false;
				for await (const event of events) {
					if (event.type === 'thinking' && !writing) {
						emit({ type: 'status', status: 'thinking', replay: false });
					} else if (event.type === 'text') {
						if (!writing) {
							writing = true;
							emit({ type: 'status', status: 'writing', replay: false });
						}
						answer += event.text;
						emit({ type: 'text', text: event.text });
					} else if (event.type === 'done') {
						// Only a complete answer with code is worth replaying.
						const check = checkAnswer(req, answer);
						if (check && event.stopReason === 'end_turn') await writeRecording(key, req, answer);
						if (check) emit(check);
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

	return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' } });
};
