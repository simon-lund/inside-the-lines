import type { AiConfig, ProviderId } from './config';
import { ProviderError, type TextEvent, type TextRequest } from './types';

/**
 * OpenAI and Mistral both speak the Chat Completions wire format, so one plain-fetch
 * adapter covers both. Only parameters documented by both are sent.
 */
const BASE_URL: Partial<Record<ProviderId, string>> = {
	openai: 'https://api.openai.com/v1',
	mistral: 'https://api.mistral.ai/v1'
};

// Chat Completions finish reasons → the stop reasons the client already understands.
const STOP_REASONS: Record<string, string> = {
	stop: 'end_turn',
	length: 'max_tokens',
	model_length: 'max_tokens',
	content_filter: 'refusal'
};

function toChatMessages(req: TextRequest) {
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

export async function* streamOpenAiCompatible(cfg: AiConfig, req: TextRequest): AsyncGenerator<TextEvent> {
	const res = await post(cfg, { model: cfg.model, stream: true, messages: toChatMessages(req) }, req.signal);
	if (!res.body) throw new ProviderError('provider_api_error', 'Empty response body.');

	// No thinking stream here — say so once so the client shows progress before the first token.
	yield { type: 'thinking' };

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let stopReason: string | null = null;

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.startsWith('data:')) continue;
			const data = line.slice(5).trim();
			if (!data || data === '[DONE]') continue;
			const chunk = JSON.parse(data) as {
				choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[];
			};
			const choice = chunk.choices?.[0];
			if (choice?.delta?.content) yield { type: 'text', text: choice.delta.content };
			if (choice?.finish_reason) stopReason = STOP_REASONS[choice.finish_reason] ?? choice.finish_reason;
		}
	}
	yield { type: 'done', stopReason };
}
