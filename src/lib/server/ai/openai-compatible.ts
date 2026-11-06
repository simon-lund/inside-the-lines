import type { AiConfig, ProviderId } from './config';
import { ProviderError, type JsonRequest } from './types';

/**
 * OpenAI and Mistral both speak the Chat Completions wire format, so one plain-fetch
 * adapter covers both. Only parameters documented by both are sent.
 */
const BASE_URL: Partial<Record<ProviderId, string>> = {
	openai: 'https://api.openai.com/v1',
	mistral: 'https://api.mistral.ai/v1'
};

function toChatMessages(req: JsonRequest) {
	return [{ role: 'system', content: req.system }, ...req.messages];
}

async function post(cfg: AiConfig, body: Record<string, unknown>, signal?: AbortSignal) {
	const res = await fetch(`${BASE_URL[cfg.provider]}/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
		body: JSON.stringify(body),
		signal
	});
	if (res.ok) return res;

	const detail = (await res.text().catch(() => '')).slice(0, 500) || res.statusText;
	if (res.status === 401 || res.status === 403) throw new ProviderError('provider_auth', detail);
	if (res.status === 429) throw new ProviderError('provider_rate_limit', detail);
	throw new ProviderError('provider_api_error', `${res.status}: ${detail}`);
}

export async function completeOpenAiCompatible(cfg: AiConfig, req: JsonRequest): Promise<string> {
	const body: Record<string, unknown> = { model: cfg.model, messages: toChatMessages(req) };
	// Mistral documents JSON mode on Chat Completions; for OpenAI the prompt asks for JSON
	// and the server-side validator is the real check either way.
	if (cfg.provider === 'mistral') body.response_format = { type: 'json_object' };

	const res = await post(cfg, body, req.signal);
	const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
	return data.choices?.[0]?.message?.content ?? '';
}
