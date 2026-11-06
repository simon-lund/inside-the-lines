import { streamAnthropic } from './anthropic';
import type { AiConfig } from './config';
import { streamOpenAiCompatible } from './openai-compatible';
import type { TextEvent, TextRequest } from './types';

export { resolveAiConfig, intendedProvider, PROVIDERS, type AiConfig, type ProviderId } from './config';
export { ProviderError, type TextEvent } from './types';

/** Streams prose and code from the model. */
export function streamText(cfg: AiConfig, req: TextRequest): AsyncGenerator<TextEvent> {
	return cfg.provider === 'anthropic' ? streamAnthropic(cfg, req) : streamOpenAiCompatible(cfg, req);
}
