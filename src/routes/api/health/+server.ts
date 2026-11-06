import { json } from '@sveltejs/kit';
import { intendedProvider, PROVIDERS, resolveAiConfig } from '$lib/server/ai';
import type { HealthInfo } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const cfg = resolveAiConfig();
	const provider = cfg?.provider ?? intendedProvider();
	const info: HealthInfo = {
		hasApiKey: cfg !== null,
		provider,
		keyVar: PROVIDERS[provider].keyVar,
		model: cfg?.model ?? PROVIDERS[provider].model
	};
	return json(info);
};
