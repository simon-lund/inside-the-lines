/** Stable machine-readable error codes — the UI branches on these, never on `detail` prose. */
export type ProviderErrorCode = 'provider_auth' | 'provider_rate_limit' | 'provider_api_error';

export type ErrorCode =
	| 'missing_api_key'
	| 'invalid_request'
	| ProviderErrorCode
	| 'stream_error'
	| 'page_without_code'
	| 'nothing_to_repair'
	| 'network_error';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	missing_api_key: 'There’s no API key yet. Add one to .env and restart the server.',
	invalid_request: 'Something in the app went wrong. Reload the page and try again.',
	provider_auth: 'The AI provider turned the key down. Check the key in .env.',
	provider_rate_limit: 'The AI provider is busy. Wait a moment, then try again.',
	provider_api_error: 'The AI provider had a problem. Try again in a moment.',
	stream_error: 'The answer broke off. Try again.',
	page_without_code: 'She answered without writing the page. Try again, or put it differently.',
	nothing_to_repair: 'The page is inside the lines already.',
	network_error: 'The app can’t be reached. Check that the server is running.'
};

/** What /api/health reports: which provider and model the server will use. */
export interface HealthInfo {
	hasApiKey: boolean;
	provider: 'anthropic' | 'openai' | 'mistral';
	/** Env var the provider's key is read from — shown in setup hints. */
	keyVar: string;
	model: string;
}

/** One message in the wire format sent to the AI routes (role + plain text content). */
export interface ApiChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

/** A rule of the design guideline; $lib/server/design-check says what each one checks. */
export type DesignRule =
	| 'unparsable'
	| 'missing_app'
	| 'canvas_count'
	| 'page_count'
	| 'section_outside_page'
	| 'nested_section'
	| 'content_outside_section'
	| 'extra_primary'
	| 'raw_color'
	| 'raw_font'
	| 'external_image'
	| 'emoji'
	| 'foreign_import';

/** One place the code leaves the guideline; `message` is prose for the model and the code view. */
export interface DesignViolation {
	rule: DesignRule;
	file: string;
	message: string;
}

/** What /api/page streams (server → client), one SSE event at a time. */
export type PageStreamEvent =
	/** thinking: the model is thinking; writing: text is arriving. replay: a recorded answer. */
	| { type: 'status'; status: 'thinking' | 'writing'; replay: boolean }
	| { type: 'text'; text: string }
	/** The design check of the page as it stands after this answer (before done). */
	| { type: 'check'; violations: DesignViolation[] }
	| { type: 'done'; stopReason: string | null }
	| { type: 'error'; code: ErrorCode; detail: string };
