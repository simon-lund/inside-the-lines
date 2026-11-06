import { completeAnthropic } from './anthropic';
import type { AiConfig } from './config';
import { completeOpenAiCompatible } from './openai-compatible';
import type { JsonRequest } from './types';

export { resolveAiConfig, intendedProvider, PROVIDERS, type AiConfig, type ProviderId } from './config';
export { ProviderError } from './types';

/** One non-streamed answer, expected to be JSON. */
export function completeJson(cfg: AiConfig, req: JsonRequest): Promise<string> {
	return cfg.provider === 'anthropic' ? completeAnthropic(cfg, req) : completeOpenAiCompatible(cfg, req);
}
