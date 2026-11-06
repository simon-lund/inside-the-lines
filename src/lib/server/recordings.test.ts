import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_INTENTS } from '$lib/app/examples';
import { parseAssistantText } from '$lib/pages/artifact';
import { mergeFiles } from '$lib/pages/merge';
import { checkDesign } from './design-check';
import { pageCacheKey, type Recording } from './page-cache';

// Pins what ships in recordings/: the examples work without an API key only while each answer
// still replays (its key matches its request) and still passes the design check (else the app
// would start a repair round, which needs a key). After changing either, run `npm run record`.

const DIR = path.resolve('recordings');
const recordings = (existsSync(DIR) ? readdirSync(DIR) : [])
	.filter((name) => name.endsWith('.json'))
	.map((name) => ({ name, ...(JSON.parse(readFileSync(path.join(DIR, name), 'utf8')) as Recording) }));

describe('shipped recordings', () => {
	it('have a first page for every example intention', () => {
		const pages = recordings.filter((r) => r.request.kind === 'page' && r.request.files.length === 0).map((r) => r.request.intent);
		expect(pages.sort()).toEqual([...EXAMPLE_INTENTS].sort());
	});

	it.each(recordings.map((r) => [r.name, r] as const))('%s replays for its request', (name, r) => {
		expect(`${pageCacheKey(r.request)}.json`).toBe(name);
	});

	it.each(recordings.map((r) => [r.name, r] as const))('%s leaves the page inside the lines', (_, r) => {
		const emitted = parseAssistantText(r.answer).files.map(({ name, contents }) => ({ name, contents }));
		expect(emitted.length).toBeGreaterThan(0);
		expect(checkDesign(mergeFiles(r.request.files, emitted))).toEqual([]);
	});
});
