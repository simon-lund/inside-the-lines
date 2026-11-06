/** Stable machine-readable error codes — the UI branches on these, never on `detail` prose. */
export type ProviderErrorCode = 'provider_auth' | 'provider_rate_limit' | 'provider_api_error';

export type ErrorCode =
	| 'missing_api_key'
	| 'invalid_request'
	| ProviderErrorCode
	| 'os_invalid_output'
	| 'stream_error'
	| 'network_error';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	missing_api_key: 'No API key configured. Add one to .env (see .env.example) and restart the dev server.',
	invalid_request: 'The request was malformed — this is a bug in the app.',
	provider_auth: 'The AI provider rejected the API key. Check the key in .env.',
	provider_rate_limit: 'Rate limited by the AI provider. Wait a moment, then retry.',
	provider_api_error: 'The AI provider returned an error.',
	os_invalid_output: 'The model answered outside the design vocabulary twice. Try again or rephrase.',
	stream_error: 'The response stream broke off.',
	network_error: 'Could not reach the app server.'
};

/** What /api/health reports: which provider and models the server will use. */
export interface HealthInfo {
	hasApiKey: boolean;
	provider: 'anthropic' | 'openai' | 'mistral';
	/** Env var the provider's key is read from — shown in setup hints. */
	keyVar: string;
	model: string;
	fastModel: string;
}

/** One message in the wire format sent to the AI routes (role + plain text content). */
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

/** One file of a saved/loaded view (design-system files are never included). */
export interface ViewFile {
	name: string;
	contents: string;
}

/** A saved view as stored on the server. */
export interface LibraryView {
	id: string;
	title: string;
	prompt: string;
	createdAt: string;
	files: ViewFile[];
}

/** Library listing entry (no file contents). */
export interface LibrarySummary {
	id: string;
	title: string;
	prompt: string;
	createdAt: string;
	fileCount: number;
}
