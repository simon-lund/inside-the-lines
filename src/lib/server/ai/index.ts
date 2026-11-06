import { completeAnthropic, streamAnthropic } from './anthropic';
import type { AiConfig } from './config';
import { completeOpenAiCompatible, streamOpenAiCompatible } from './openai-compatible';
import type { JsonRequest, TextEvent, TextRequest } from './types';

export { resolveAiConfig, intendedProvider, PROVIDERS, type AiConfig, type ProviderId } from './config';
export { ProviderError, type TextEvent } from './types';

/** Streams prose + code from the main model (studio). */
export function streamText(cfg: AiConfig, req: TextRequest): AsyncGenerator<TextEvent> {
	return cfg.provider === 'anthropic' ? streamAnthropic(cfg, req) : streamOpenAiCompatible(cfg, req);
}

/** One non-streamed answer from the fast model, expected to be JSON (OS). */
export function completeJson(cfg: AiConfig, req: JsonRequest): Promise<string> {
	return cfg.provider === 'anthropic' ? completeAnthropic(cfg, req) : completeOpenAiCompatible(cfg, req);
}
