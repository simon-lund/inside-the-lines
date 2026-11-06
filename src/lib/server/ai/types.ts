import type { ApiChatMessage, ProviderErrorCode } from '$lib/types';

export interface JsonRequest {
	system: string;
	messages: ApiChatMessage[];
	maxTokens: number;
	signal?: AbortSignal;
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
