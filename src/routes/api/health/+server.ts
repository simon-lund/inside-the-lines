import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { MODEL } from '$lib/server/prompt';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({ hasApiKey: Boolean(env.ANTHROPIC_API_KEY), model: MODEL });
};
