/** Stable machine-readable error codes — the UI branches on these, never on `detail` prose. */
export type ProviderErrorCode = 'provider_auth' | 'provider_rate_limit' | 'provider_api_error';

export type ErrorCode =
	| 'missing_api_key'
	| 'invalid_request'
	| ProviderErrorCode
	| 'os_invalid_output'
	| 'network_error';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	missing_api_key: 'There’s no API key yet. Add one to .env and restart the server.',
	invalid_request: 'Something in the app went wrong. Reload the page and try again.',
	provider_auth: 'The AI provider turned the key down. Check the key in .env.',
	provider_rate_limit: 'The AI provider is busy. Wait a moment, then try again.',
	provider_api_error: 'The AI provider had a problem. Try again in a moment.',
	os_invalid_output: 'She couldn’t build this one. Try again, or put it differently.',
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
