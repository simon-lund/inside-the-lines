// Records the example pages through the real app, so every recording is keyed by
// exactly what a click sends. Results land in .os-cache/; review them, then copy them
// into os-demo/ to ship them.
//
//   npm run dev -- --port 5199     # with an API key in .env
//   npm run record
//
// Each example intention, plus up to two "open" actions per page: the first one on the
// page (the README's "open action" screenshot replays it) and one in another section.
// Re-running replays what is already cached and only spends calls on the rest.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settled(page) {
	await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 180000 });
	await sleep(500);
}

// Failed sections on the active page, as "code: detail" lines.
const failures = (page) =>
	page.evaluate(() =>
		(window.__os.active?.cells ?? [])
			.flatMap((c) => c.items)
			.filter((i) => i.status === 'failed')
			.map((i) => `${i.code}: ${i.detail ?? ''}`)
	);

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });
let failed = 0;

try {
	const page = await browser.newPage();
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

	for (const intent of intents) {
		await page.evaluate((i) => window.__os.newSpace(i), intent);
		await settled(page);
		console.log(`page  ${intent}`);

		// First open action on the page, then the first one in a different section.
		const picks = await page.evaluate(() => {
			const out = [];
			for (const cell of window.__os.active?.cells ?? []) {
				for (const item of cell.items) {
					if (item.status !== 'ready' || out.length >= 2) continue;
					const action = item.section.actions.find((a) => a.effect === 'open');
					if (action) out.push({ cellKey: cell.key, itemKey: item.key, title: item.section.title, label: action.label });
				}
			}
			return out;
		});
		for (const pick of picks) {
			await page.evaluate(({ cellKey, itemKey, label }) => {
				const os = window.__os;
				const item = os.active.cells.find((c) => c.key === cellKey).items.find((i) => i.key === itemKey);
				os.open(cellKey, itemKey, item.section.actions.find((a) => a.label === label));
			}, pick);
			await settled(page);
			console.log(`  open ${pick.title} → ${pick.label}`);
		}

		const errors = await failures(page);
		failed += errors.length;
		for (const e of errors) console.log(`  FAILED ${e}`);
	}
} finally {
	await browser.close();
}
if (failed > 0) process.exitCode = 1;
