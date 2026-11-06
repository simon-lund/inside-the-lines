// Records the example pages through the real app, so every recording is keyed by exactly what a
// click sends, and ships them: recordings/ ends up holding exactly the answers the examples use.
//
//   npm run dev -- --port 5199     # with an API key in .env
//   npm run record
//
// For each example intention: the page, then every ask() on that first page (each from the same
// first state, so a visitor's first click on any of them replays). An answer the design check
// does not pass first time, or that does not run, is thrown away and asked again, so no example
// needs a repair round (which a visitor without an API key could not run). Re-running replays
// what is already recorded and only spends calls on the rest.
import { readdir, readFile, rm, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const SHIPPED = path.resolve('recordings');
const LOCAL = path.resolve('.page-cache');
const ATTEMPTS = 3;
const MAX_ASKS = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- recordings on disk

async function recordingsIn(dir) {
	const names = await readdir(dir).catch(() => []);
	const out = [];
	for (const name of names.filter((n) => n.endsWith('.json'))) {
		const file = path.join(dir, name);
		const data = JSON.parse(await readFile(file, 'utf8'));
		out.push({ file, name, data, mtime: (await stat(file)).mtimeMs });
	}
	return out;
}

const sameFiles = (a = [], b = []) => {
	const key = (fs) => JSON.stringify([...fs].sort((x, y) => x.name.localeCompare(y.name)).map((f) => [f.name, f.contents]));
	return key(a) === key(b);
};

/** The recording a request replays (shipped first, as the server reads them). */
async function find(req) {
	for (const dir of [SHIPPED, LOCAL]) {
		const match = (await recordingsIn(dir)).find(
			({ data: { request: r } }) =>
				r.kind === req.kind && r.intent === req.intent && (r.label ?? '') === (req.label ?? '') && sameFiles(r.files, req.files)
		);
		if (match) return match;
	}
	return null;
}

/** Throws an attempt away: what it replayed, and everything written since it began. */
async function discard(req, since) {
	const replayed = await find(req);
	if (replayed) await rm(replayed.file);
	for (const r of await recordingsIn(LOCAL)) if (r.mtime >= since) await rm(r.file, { force: true });
}

// ---------------------------------------------------------------------- the app

/** Waits until the open page is idle and its code has run; reports what happened. */
async function settle(page) {
	const kinds = new Set();
	for (let idle = 0, t = 0; idle < 3; t++) {
		if (t > 600) throw new Error('timed out waiting for the page');
		const s = await page.evaluate(() => {
			const p = window.__pages;
			const a = p.activityOf(p.active.key);
			return { status: a.status, kind: a.ask?.kind ?? null, code: a.status === 'failed' ? a.code : null };
		});
		if (s.kind) kinds.add(s.kind);
		if (s.status === 'failed') return { ok: false, why: `failed: ${s.code}`, kinds };
		idle = s.status === 'working' ? 0 : idle + 1;
		await sleep(500);
	}
	// The new code compiles and mounts in the REPL (the first time fetches svelte from the CDN).
	await page.waitForFunction(() => window.__repl.status === null && window.__repl.bundler.result !== window.__before, null, { timeout: 120000 });
	await sleep(2500);
	const end = await page.evaluate(() => ({
		files: window.__pages.active.files.map((f) => ({ name: f.name, contents: f.contents })),
		issues: window.__pages.active.issues.map((i) => `${i.rule} ${i.file}`),
		failure: window.__repl.failure
	}));
	if (kinds.has('repair') || end.issues.length > 0) return { ok: false, why: `design check: ${end.issues.join(', ') || 'repaired'}`, kinds, ...end };
	if (end.failure) return { ok: false, why: `does not run: ${end.failure.split('\n')[0]}`, kinds, ...end };
	return { ok: true, kinds, ...end };
}

/** The ask() calls in a page's code whose intention and label are plain strings. */
function asksIn(files) {
	const unquote = (s) => s.replace(/\\(['"`\\])/g, '$1');
	const seen = new Map();
	for (const f of files) {
		for (const m of f.contents.matchAll(/\bask\(\s*(['"`])((?:\\.|(?!\1).)*?)\1\s*,\s*(['"`])((?:\\.|(?!\3).)*?)\3\s*\)/gs)) {
			if (m[2].includes('${') || m[4].includes('${')) continue;
			const ask = { intent: unquote(m[2]), label: unquote(m[4]) };
			if (!seen.has(ask.label)) seen.set(ask.label, ask);
		}
	}
	return [...seen.values()];
}

async function attempt(page, req, run) {
	for (let n = 1; n <= ATTEMPTS; n++) {
		const since = Date.now();
		await run(() => page.evaluate(() => (window.__before = window.__repl.bundler.result)));
		const result = await settle(page);
		if (result.ok) return result;
		if (result.why.includes('missing_api_key')) throw new Error('No API key on the server: add one to .env and restart it.');
		console.log(`  again (${n}/${ATTEMPTS}): ${result.why}`);
		await discard(req, since);
	}
	return null;
}

// ------------------------------------------------------------------------ the run

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });
const shipped = [];
let missed = 0;

try {
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	await page.goto(BASE, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction(() => !!window.__pages?.health && !!window.__repl, null, { timeout: 30000 });
	await page.evaluate(() => {
		localStorage.clear();
		for (const p of [...window.__pages.pages]) window.__pages.close(p.key);
	});
	const intents = await page.evaluate(() => [...document.querySelectorAll('.examples button')].map((b) => b.textContent.trim()));

	for (const intent of intents) {
		const req = { kind: 'page', intent, files: [] };
		const first = await attempt(page, req, async (mark) => {
			await page.evaluate(() => {
				for (const p of [...window.__pages.pages]) window.__pages.close(p.key);
			});
			await mark();
			await page.evaluate((i) => window.__pages.newPage(i), intent);
		});
		if (!first) {
			console.log(`MISSED page  ${intent}`);
			missed++;
			continue;
		}
		shipped.push(req);
		const asks = asksIn(first.files).slice(0, MAX_ASKS);
		console.log(`page  ${intent}  (${first.files.length} files, ${asks.length} asks)`);

		for (const ask of asks) {
			const askReq = { kind: 'ask', intent: ask.intent, label: ask.label, files: first.files };
			const done = await attempt(page, askReq, async (mark) => {
				// Every ask starts from the page's first state.
				await page.evaluate(async (files) => {
					const a = window.__pages.active;
					a.files = files;
					a.issues = [];
					await window.__repl.load(files);
				}, first.files);
				await mark();
				await page.evaluate((x) => window.__pages.askFromPage(x.intent, x.label), ask);
			});
			if (done) shipped.push(askReq);
			else missed++;
			console.log(`${done ? '  ask' : 'MISSED ask'}  ${ask.label}`);
		}
	}

	// recordings/ becomes exactly the answers the examples use.
	const keep = [];
	for (const req of shipped) {
		const r = await find(req);
		if (r) keep.push(r);
		else console.log(`no recording found for ${req.kind} ${req.label ?? req.intent}`);
	}
	await mkdir(SHIPPED, { recursive: true });
	for (const name of await readdir(SHIPPED)) if (name.endsWith('.json')) await rm(path.join(SHIPPED, name));
	for (const r of keep) await writeFile(path.join(SHIPPED, r.name), JSON.stringify(r.data, null, '\t'));
	console.log(`\nrecordings/: ${keep.length} answers${missed ? `, ${missed} missed` : ''}`);
} finally {
	await browser.close();
}
if (missed) process.exitCode = 1;
