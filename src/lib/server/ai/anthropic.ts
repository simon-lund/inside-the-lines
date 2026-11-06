import Anthropic from '@anthropic-ai/sdk';
import type { AiConfig } from './config';
import { ProviderError, type TextEvent, type TextRequest } from './types';

function toProviderError(err: unknown): unknown {
	if (err instanceof Anthropic.AuthenticationError) return new ProviderError('provider_auth', err.message);
	if (err instanceof Anthropic.RateLimitError) return new ProviderError('provider_rate_limit', err.message);
	if (err instanceof Anthropic.APIError) return new ProviderError('provider_api_error', err.message);
	return err;
}

/** Streams prose and code. Writing whole pages takes thought, so thinking is adaptive. */
export async function* streamAnthropic(cfg: AiConfig, req: TextRequest): AsyncGenerator<TextEvent> {
	const client = new Anthropic({ apiKey: cfg.apiKey });
	const runner = client.beta.messages.stream(
		{
			model: cfg.model,
			max_tokens: 64000,
			thinking: { type: 'adaptive' },
			// Server-side refusal fallbacks: on a policy decline the API re-runs the request on a
			// fallback model within the same call.
			betas: ['server-side-fallback-2026-07-01'],
			fallbacks: 'default',
			// Every request re-sends the page's code, so caching the prefix saves most input cost.
			cache_control: { type: 'ephemeral' },
			system: req.system,
			messages: req.messages
		},
		{ signal: req.signal }
	);

	try {
		for await (const event of runner) {
			if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
				yield { type: 'thinking' };
			} else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
				yield { type: 'text', text: event.delta.text };
			}
		}
		const final = await runner.finalMessage();
		yield { type: 'done', stopReason: final.stop_reason };
	} catch (err) {
		throw toProviderError(err);
	}
}
