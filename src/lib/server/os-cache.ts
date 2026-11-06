import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Assembly, AssemblyRequest } from '$lib/os/spec';

/**
 * Replay cache for assembled modules, keyed by the click — not by the whole space.
 * The same intention, or the same action on the same module, replays the same
 * result in any order. That keeps demos instant and makes the committed examples
 * clickable without an API key.
 *
 * - os-demo/   committed recordings (read-only at runtime)
 * - .os-cache/ everything generated locally (gitignored); copy files into os-demo/ to ship them
 */
const DEMO_DIR = path.resolve('os-demo');
const LOCAL_DIR = path.resolve('.os-cache');

export function cacheKey(req: AssemblyRequest): string {
	const normalize = (s: string | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
	const parts = [
		req.mode,
		normalize(req.intent),
		req.mode === 'space' ? '' : normalize(req.space?.title),
		normalize(req.from?.module.title),
		normalize(req.from?.action)
	];
	return createHash('sha256').update(parts.join('\u001f')).digest('hex').slice(0, 24);
}

interface CacheEntry {
	request: { mode: string; intent: string; space: string | null; from: string | null };
	assembly: Assembly;
}

export async function readCache(key: string): Promise<Assembly | null> {
	for (const dir of [DEMO_DIR, LOCAL_DIR]) {
		try {
			const entry = JSON.parse(await readFile(path.join(dir, `${key}.json`), 'utf8')) as CacheEntry;
			return entry.assembly;
		} catch {
			/* not cached here */
		}
	}
	return null;
}

export async function writeCache(key: string, req: AssemblyRequest, assembly: Assembly): Promise<void> {
	const entry: CacheEntry = {
		// Human-readable provenance, so a reviewer can tell what each recording answers.
		request: {
			mode: req.mode,
			intent: req.intent,
			space: req.space?.title ?? null,
			from: req.from ? `${req.from.module.title} → ${req.from.action}` : null
		},
		assembly
	};
	await mkdir(LOCAL_DIR, { recursive: true });
	await writeFile(path.join(LOCAL_DIR, `${key}.json`), JSON.stringify(entry, null, '\t'));
}
