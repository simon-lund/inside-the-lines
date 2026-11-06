import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { completeJson, ProviderError, resolveAiConfig } from '$lib/server/ai';
import { cacheKey, readCache, writeCache } from '$lib/server/os-cache';
import { osRepairMessage, osSystemPrompt, osUserMessage } from '$lib/server/os-prompt';
import { isFatal, parseModelJson, sanitizeAssembly } from '$lib/os/sanitize';
import type { AssemblyMode, AssemblyRequest, ModuleSpec } from '$lib/os/spec';
import type { ApiChatMessage, ErrorCode } from '$lib/types';
import type { RequestHandler } from './$types';

const MODES: AssemblyMode[] = ['space', 'flow', 'module'];

function fail(status: number, code: ErrorCode, detail: string) {
	return json({ code, detail }, { status });
}

function parseRequest(body: unknown): AssemblyRequest | null {
	if (typeof body !== 'object' || body === null) return null;
	const b = body as Record<string, unknown>;
	if (!MODES.includes(b.mode as AssemblyMode)) return null;
	if (typeof b.intent !== 'string' || !b.intent.trim() || b.intent.length > 500) return null;

	const req: AssemblyRequest = { mode: b.mode as AssemblyMode, intent: b.intent.trim() };
	const space = b.space as { title?: unknown; modules?: unknown } | undefined;
	if (space && typeof space.title === 'string' && Array.isArray(space.modules)) {
		req.space = { title: space.title.slice(0, 80), modules: (space.modules as ModuleSpec[]).slice(-8) };
	}
	const from = b.from as { module?: { title?: unknown }; action?: unknown } | undefined;
	if (from && typeof from.module?.title === 'string' && typeof from.action === 'string') {
		req.from = { module: from.module as ModuleSpec, action: from.action.slice(0, 80) };
	}
	return req;
}

/** Assembles modules for an intention: cache → model → sanitize (→ one repair round). */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail(400, 'invalid_request', 'Body must be JSON.');
	}
	const req = parseRequest(body);
	if (!req) return fail(400, 'invalid_request', 'Expected {mode, intent, space?, from?}.');

	const key = cacheKey(req);
	const cached = await readCache(key);
	if (cached) return json({ ...cached, cached: true });

	const cfg = resolveAiConfig();
	if (!cfg) return fail(503, 'missing_api_key', 'No AI provider key is set on the server.');

	const today = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	const system = osSystemPrompt(today);
	const messages: ApiChatMessage[] = [{ role: 'user', content: osUserMessage(req) }];
	const idPrefix = randomUUID().slice(0, 8);

	try {
		let raw = await completeJson(cfg, { system, messages, maxTokens: 6000, signal: request.signal });
		let result = sanitizeAssembly(parseModelJson(raw), req.mode, idPrefix);

		if (isFatal(result.issues)) {
			// One repair round: tell the model what was wrong, then accept or give up.
			messages.push(
				{ role: 'assistant', content: raw || '(empty)' },
				{ role: 'user', content: osRepairMessage([...new Set(result.issues.map((i) => i.code))]) }
			);
			raw = await completeJson(cfg, { system, messages, maxTokens: 6000, signal: request.signal });
			result = sanitizeAssembly(parseModelJson(raw), req.mode, idPrefix);
		}
		if (isFatal(result.issues)) {
			return fail(422, 'os_invalid_output', 'The model did not produce usable modules.');
		}

		if (result.issues.length > 0) {
			console.info(`[os] sanitized ${result.issues.length} issue(s):`, result.issues.map((i) => `${i.code}@${i.path}`).join(', '));
		}
		await writeCache(key, req, result.assembly);
		return json({ ...result.assembly, cached: false });
	} catch (err) {
		if (err instanceof ProviderError) return fail(502, err.code, err.message);
		throw err;
	}
};
