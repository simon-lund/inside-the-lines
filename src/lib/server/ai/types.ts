import type { ApiChatMessage, ProviderErrorCode } from '$lib/types';

/** Provider-neutral stream events; the chat route re-emits them as SSE. */
export type TextEvent =
	| { type: 'thinking' }
	| { type: 'text'; text: string }
	/** stopReason is normalized: 'end_turn' | 'max_tokens' | 'refusal' | other provider values. */
	| { type: 'done'; stopReason: string | null };

export interface TextRequest {
	system: string;
	messages: ApiChatMessage[];
	signal?: AbortSignal;
}

export interface JsonRequest extends TextRequest {
	maxTokens: number;
}

/** A provider call failed; `code` is the stable code the client branches on. */
export class ProviderError extends Error {
	constructor(
		readonly code: ProviderErrorCode,
		message: string
	) {
		super(message);
		this.name = 'ProviderError';
	}
}
