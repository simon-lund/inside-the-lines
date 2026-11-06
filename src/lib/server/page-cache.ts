import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PageRequest } from '$lib/pages/request';

/**
 * Recordings of the model's answers, keyed by the request and the code it was made for. The same
 * click on the same page replays the same answer, so the examples work without an API key and
 * demos are instant.
 *
 * - recordings/   committed recordings (read-only at runtime)
 * - .page-cache/  everything generated locally (gitignored); copy files into recordings/ to ship them
 */
const SHIPPED_DIR = path.resolve('recordings');
const LOCAL_DIR = path.resolve('.page-cache');

export function pageCacheKey(req: PageRequest): string {
	const normalize = (s: string | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
	const code = [...req.files]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((f) => `${f.name}\u001e${f.contents}`)
		.join('\u001d');
	const parts = [req.kind, normalize(req.intent), normalize(req.label), req.detail ?? '', code];
	return createHash('sha256').update(parts.join('\u001f')).digest('hex').slice(0, 24);
}

export interface Recording {
	/** The whole request, code included: a reviewer sees what was answered, a test can re-key and re-check it. */
	request: PageRequest;
	/** The model's answer as it streamed: prose and file fences. */
	answer: string;
}

export async function readRecording(key: string): Promise<string | null> {
	for (const dir of [SHIPPED_DIR, LOCAL_DIR]) {
		try {
			const recording = JSON.parse(await readFile(path.join(dir, `${key}.json`), 'utf8')) as Recording;
			if (typeof recording.answer === 'string') return recording.answer;
		} catch {
			/* not recorded here */
		}
	}
	return null;
}

export async function writeRecording(key: string, req: PageRequest, answer: string): Promise<void> {
	const recording: Recording = { request: req, answer };
	await mkdir(LOCAL_DIR, { recursive: true });
	await writeFile(path.join(LOCAL_DIR, `${key}.json`), JSON.stringify(recording, null, '\t'));
}
