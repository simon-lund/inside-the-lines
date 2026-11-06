import Anthropic from '@anthropic-ai/sdk';
import type { AiConfig } from './config';
import { ProviderError, type JsonRequest } from './types';

function toProviderError(err: unknown): unknown {
	if (err instanceof Anthropic.AuthenticationError) return new ProviderError('provider_auth', err.message);
	if (err instanceof Anthropic.RateLimitError) return new ProviderError('provider_rate_limit', err.message);
	if (err instanceof Anthropic.APIError) return new ProviderError('provider_api_error', err.message);
	return err;
}

export async function completeAnthropic(cfg: AiConfig, req: JsonRequest): Promise<string> {
	const client = new Anthropic({ apiKey: cfg.apiKey });
	try {
		const message = await client.messages.create(
			{
				model: cfg.model,
				max_tokens: req.maxTokens,
				system: req.system,
				messages: req.messages
			},
			{ signal: req.signal }
		);
		return message.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
	} catch (err) {
		throw toProviderError(err);
	}
}
