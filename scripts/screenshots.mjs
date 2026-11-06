// Screenshot tour for the README: the recorded example pages, an opened section, the
// loading and error states, and the Library.
//
//   npm run dev -- --port 5199     # in another terminal
//   npm run screenshots            # writes docs/screenshots/*.png
//
// Uses the system Chrome. The pages replay the recordings in os-demo/, so no API key is needed.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const OUT = process.argv[2] ?? 'docs/screenshots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
	await page.screenshot({ path: path.join(OUT, `${name}.png`) });
	console.log('saved', name);
}

// The whole page sheet, however tall. The docked composer is pinned to the window, so it
// would land in the middle of a tall capture: it steps aside for the shot.
async function sheet(page, name) {
	const dock = (visibility) => page.evaluate((v) => document.querySelector('.dock')?.style.setProperty('visibility', v), visibility);
	await dock('hidden');
	await page.locator('article.m-page').screenshot({ path: path.join(OUT, `${name}.png`) });
	await dock('');
	console.log('saved', name);
}

// Waits until no section is still assembling.
async function settled(page) {
	await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 120000 });
	await sleep(700); // entry transitions
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });

try {
	const ctx = await browser.newContext({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2 });
	const page = await ctx.newPage();

	// ---- OS
	await page.goto(BASE, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction(() => !!window.__os?.health, null, { timeout: 30000 });
	await page.evaluate(() => {
		localStorage.clear();
		window.__os.spaces = [];
		window.__os.activeKey = null;
	});
	await sleep(300);

	const intents = await page.evaluate(() =>
		[...document.querySelectorAll('.examples button')].map((b) => b.textContent.trim())
	);
	for (const [i, intent] of intents.entries()) {
		await page.evaluate((x) => window.__os.newSpace(x), intent);
		await settled(page);
		await page.evaluate(() => window.scrollTo(0, 0));
		// The first page is the hero; the open-action shot shows it whole.
		if (i === 0) await shot(page, 'os-hero');
		else await sheet(page, `os-page-${i + 1}`);
	}

	// An "open" action: the first recorded one on the first page.
	await page.evaluate(() => (window.__os.activeKey = window.__os.spaces[0].key));
	await sleep(500);
	const opened = await page.evaluate(() => {
		const os = window.__os;
		for (const cell of os.active.cells) {
			for (const item of cell.items) {
				const action = item.status === 'ready' && item.section.actions.find((a) => a.effect === 'open');
				if (action) {
					os.open(cell.key, item.key, action);
					return action.label;
				}
			}
		}
		return null;
	});
	if (opened) {
		await settled(page);
		await sheet(page, 'os-open-action');
	}

	// Loading and error, as a follow-up cell at the end of the first page.
	await page.evaluate(() => {
		window.__os.active.cells.push({
			key: 'demo-cell',
			intent: 'Find a dinner place near the guesthouse',
			items: [
				{ key: 'demo-pending', status: 'pending', request: { mode: 'section', intent: 'Dinner places near the guesthouse' } },
				{ key: 'demo-failed', status: 'failed', request: { mode: 'section', intent: 'Book a table for two' }, code: 'provider_rate_limit' }
			]
		});
	});
	await sleep(900);
	await page.evaluate(() => document.querySelector('[aria-busy="true"]')?.scrollIntoView({ block: 'center' }));
	await sleep(500);
	await shot(page, 'os-states');
	await page.evaluate(() => {
		window.__os.active.cells = window.__os.active.cells.filter((c) => c.key !== 'demo-cell');
	});

	// ---- Library
	await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' });
	await sleep(500);
	await sheet(page, 'library');

	await ctx.close();

	// ---- The hero again, in dark (the theme is dark first)
	const dark = await browser.newContext({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2, colorScheme: 'dark' });
	const darkPage = await dark.newPage();
	await darkPage.goto(BASE, { waitUntil: 'domcontentloaded' });
	await darkPage.waitForFunction(() => !!window.__os?.health, null, { timeout: 30000 });
	await darkPage.evaluate((x) => {
		localStorage.clear();
		window.__os.spaces = [];
		window.__os.newSpace(x);
	}, intents[0]);
	await settled(darkPage);
	await darkPage.evaluate(() => window.scrollTo(0, 0));
	await sleep(300);
	await shot(darkPage, 'os-hero-dark');
	await dark.close();
} finally {
	await browser.close();
}
