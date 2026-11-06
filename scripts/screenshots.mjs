// Screenshot tour for the README: a page being written, the recorded example pages, an ask()
// from inside a page, the code view with the design check, the Library, and the hero in dark.
//
//   npm run dev -- --port 5199     # in another terminal
//   npm run screenshots            # writes docs/screenshots/*.png
//
// Uses the system Chrome. The pages replay the recordings in recordings/, so no API key is
// needed, but the REPL loads Svelte from a CDN, so it needs the network.
//
//   npm run screenshots -- <dir> --review   # also the empty state, an error and the phone
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const args = process.argv.slice(2);
const OUT = args.find((a) => !a.startsWith('--')) ?? 'docs/screenshots';
const REVIEW = args.includes('--review');
const VIEWPORT = { width: 1512, height: 945 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LISBON = 'Plan a weekend in Lisbon';
const GIFT = 'Find a birthday gift for my sister who runs';
const DINNER = 'Dinner for six on Saturday';
const COFFEE = 'Coffee with Mara tomorrow at 3';

async function shot(page, name) {
	await page.screenshot({ path: path.join(OUT, `${name}.png`) });
	console.log('saved', name);
}

// The whole page sheet, however tall: the window grows until the sheet fits in the frame, and
// the docked composer, pinned to the window, steps aside.
async function sheet(page, name) {
	const size = page.viewportSize();
	await page.setViewportSize({ width: size.width, height: 6000 });
	await page.evaluate(() => document.querySelector('.dock')?.style.setProperty('visibility', 'hidden'));
	await sleep(1200);
	await page.frameLocator('iframe').locator('article.m-page').screenshot({ path: path.join(OUT, `${name}.png`) });
	await page.evaluate(() => document.querySelector('.dock')?.style.removeProperty('visibility'));
	await page.setViewportSize(size);
	console.log('saved', name);
}

async function start(browser, options = {}) {
	const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: 'light', ...options });
	const page = await context.newPage();
	await page.goto(BASE, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction(() => !!window.__pages?.health && !!window.__repl, null, { timeout: 30000 });
	await page.evaluate(() => {
		localStorage.clear();
		for (const p of [...window.__pages.pages]) window.__pages.close(p.key);
	});
	await sleep(500);
	return page;
}

// Runs `act`, then waits until the answer is in and the new code has mounted.
async function settle(page, act) {
	await page.evaluate(() => (window.__before = window.__repl.bundler.result));
	await act();
	await page.waitForFunction(
		() =>
			window.__pages.active &&
			window.__pages.activityOf(window.__pages.active.key).status === 'idle' &&
			window.__repl.status === null &&
			window.__repl.bundler.result !== window.__before,
		null,
		{ timeout: 120000 }
	);
	await sleep(2500); // fonts, the map, entry transitions
}

const open = (page, intent) => settle(page, () => page.evaluate((i) => window.__pages.newPage(i), intent));

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });

try {
	const page = await start(browser);
	if (REVIEW) await shot(page, 'review-empty');

	// Svelte comes from the CDN once; after that a replay is quick.
	await open(page, DINNER);

	// A page being written: the replay, slowed down so the code can be seen arriving.
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Network.enable');
	await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: 1500, uploadThroughput: -1 });
	await page.evaluate((i) => window.__pages.newPage(i), LISBON);
	await page.waitForFunction(() => (document.querySelector('.writing .code')?.textContent ?? '').split('\n').length >= 18, null, {
		timeout: 60000
	});
	await shot(page, 'writing');
	await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
	await page.waitForFunction(() => window.__pages.activityOf(window.__pages.active.key).status === 'idle', null, { timeout: 60000 });
	await page.waitForFunction(() => window.__repl.status === null && !!window.__repl.bundler.result, null, { timeout: 60000 });
	await sleep(3000);
	await shot(page, 'hero');

	// A button inside the page calls ask(): a new section, right below the one that asked. The
	// first such button on the page, so the shot follows the recordings.
	const label = await page.evaluate(() => {
		for (const f of window.__pages.active.files) {
			const m = f.contents.match(/\bask\(\s*(['"`])(?:\\.|(?!\1).)*?\1\s*,\s*(['"`])((?:\\.|(?!\2).)*?)\2\s*\)/s);
			if (m) return m[3];
		}
		throw new Error('No ask() on the page');
	});
	await settle(page, () => page.frameLocator('iframe').getByRole('button', { name: label }).click());
	await sheet(page, 'ask');

	await open(page, GIFT);
	await sheet(page, 'page-gift');
	await page.evaluate((i) => window.__pages.select(window.__pages.pages.find((p) => p.intent === i).key), DINNER);
	await sleep(4000);
	await sheet(page, 'page-dinner');
	await open(page, COFFEE);
	await sheet(page, 'page-coffee');

	// The code view: the gift page, at the section with a block of its own.
	await page.evaluate((i) => window.__pages.select(window.__pages.pages.find((p) => p.intent === i).key), GIFT);
	await sleep(4000);
	await page.click('.toggle');
	await page.getByRole('button', { name: 'lib/ThePick.svelte' }).click();
	await sleep(800);
	await shot(page, 'code');
	await page.click('.toggle');

	if (REVIEW) {
		// A page that throws: the error card, and "Fix it" in the dock.
		await page.evaluate(async () => {
			const files = window.__pages.active.files.map((f) =>
				f.name === 'App.svelte' ? f : { ...f, contents: f.contents.replace('</Section>', '<p>{oops.value}</p>\n</Section>') }
			);
			await window.__repl.load(files);
		});
		await sleep(3000);
		await shot(page, 'review-error');
	}

	// The Library: the design system, live, however tall.
	await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' });
	await sleep(800);
	await page.locator('article.m-page').screenshot({ path: path.join(OUT, 'library.png') });
	console.log('saved', 'library');
	await page.context().close();

	const dark = await start(browser, { colorScheme: 'dark' });
	await open(dark, LISBON);
	await shot(dark, 'hero-dark');
	await dark.context().close();

	if (REVIEW) {
		const phone = await start(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
		await shot(phone, 'review-phone-empty');
		await open(phone, DINNER);
		await shot(phone, 'review-phone-page');
		await phone.context().close();
	}
} finally {
	await browser.close();
}
