import { env } from '$env/dynamic/private';

export type ProviderId = 'anthropic' | 'openai' | 'mistral';

/** Everything a request needs to reach one provider. Resolved per request, so .env edits apply on restart. */
export interface AiConfig {
	provider: ProviderId;
	apiKey: string;
	/** Writes whole Svelte apps in the studio — the most capable model. */
	model: string;
	/** Assembles one module spec per click in the OS — fast beats clever here. */
	fastModel: string;
}

interface ProviderDefaults {
	keyVar: string;
	model: string;
	fastModel: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDefaults> = {
	anthropic: { keyVar: 'ANTHROPIC_API_KEY', model: 'claude-opus-5-5', fastModel: 'claude-sonnet-5-5' },
	openai: { keyVar: 'OPENAI_API_KEY', model: 'gpt-6-astra', fastModel: 'gpt-6-luna' },
	mistral: { keyVar: 'MISTRAL_API_KEY', model: 'mistral-large-latest', fastModel: 'mistral-small-latest' }
};

const ORDER: ProviderId[] = ['anthropic', 'openai', 'mistral'];

function isProviderId(value: string): value is ProviderId {
	return (ORDER as string[]).includes(value);
}

/**
 * AI_PROVIDER picks the provider explicitly; without it, the first provider whose
 * key is set wins (anthropic → openai → mistral). Returns null when no key is usable.
 */
export function resolveAiConfig(): AiConfig | null {
	const requested = env.AI_PROVIDER?.trim().toLowerCase();
	const provider =
		requested && isProviderId(requested)
			? requested
			: ORDER.find((id) => Boolean(env[PROVIDERS[id].keyVar]));
	if (!provider) return null;

	const apiKey = env[PROVIDERS[provider].keyVar];
	if (!apiKey) return null;

	return {
		provider,
		apiKey,
		model: env.AI_MODEL?.trim() || PROVIDERS[provider].model,
		fastModel: env.AI_FAST_MODEL?.trim() || PROVIDERS[provider].fastModel
	};
}

/** The provider the server would use, even when its key is missing — for setup hints. */
export function intendedProvider(): ProviderId {
	const requested = env.AI_PROVIDER?.trim().toLowerCase();
	if (requested && isProviderId(requested)) return requested;
	return ORDER.find((id) => Boolean(env[PROVIDERS[id].keyVar])) ?? 'anthropic';
}
