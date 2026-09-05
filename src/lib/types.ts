/** Stable machine-readable error codes — the UI branches on these, never on `detail` prose. */
export type ErrorCode =
	| 'missing_api_key'
	| 'invalid_request'
	| 'anthropic_auth'
	| 'anthropic_rate_limit'
	| 'anthropic_api_error'
	| 'stream_error'
	| 'network_error';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	missing_api_key: 'No Anthropic API key configured. Add ANTHROPIC_API_KEY to .env and restart the dev server.',
	invalid_request: 'The request was malformed — this is a bug in the studio.',
	anthropic_auth: 'The Anthropic API rejected the key. Check ANTHROPIC_API_KEY in .env.',
	anthropic_rate_limit: 'Rate limited by the Anthropic API. Wait a moment, then retry.',
	anthropic_api_error: 'The Claude API returned an error.',
	stream_error: 'The response stream broke off.',
	network_error: 'Could not reach the studio server.'
};

/** One message in the wire format sent to /api/chat (mirrors the Anthropic messages shape). */
export interface ApiChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

/** Events the /api/chat SSE stream emits (server → client). */
export type StreamEvent =
	| { type: 'status'; status: 'thinking' | 'writing' }
	| { type: 'text'; text: string }
	| { type: 'done'; stopReason: string | null }
	| { type: 'error'; code: ErrorCode; detail: string };
