// Records the example spaces through the real app, so every recording is keyed by
// exactly what a click sends. Results land in .os-cache/; review them, then copy them
// into os-demo/ to ship them.
//
//   npm run dev -- --port 5199     # with an API key in .env
//   npm run record
//
// Each example intention, plus up to two "open" actions per space: the first one in
// the space (the README's "open action" screenshot replays it) and one on another
// module. Re-running replays what is already cached and only spends calls on the rest.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settled(page) {
	await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 180000 });
	await sleep(500);
}

// Failed slots in the active space, as "code: detail" lines.
const failures = (page) =>
	page.evaluate(() =>
		(window.__os.active?.flows ?? [])
			.flatMap((f) => f.items)
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
		console.log(`space  ${intent}`);

		// First open action in the space, then the first one on a different module.
		const picks = await page.evaluate(() => {
			const out = [];
			for (const flow of window.__os.active?.flows ?? []) {
				for (const item of flow.items) {
					if (item.status !== 'ready' || out.some((p) => p.itemKey === item.key)) continue;
					const action = item.module.actions.find((a) => a.effect === 'open');
					if (action && out.length < 2) out.push({ flowKey: flow.key, itemKey: item.key, title: item.module.title, label: action.label });
				}
			}
			return out;
		});
		for (const pick of picks) {
			await page.evaluate(({ flowKey, itemKey, label }) => {
				const os = window.__os;
				const item = os.active.flows.find((f) => f.key === flowKey).items.find((i) => i.key === itemKey);
				os.open(flowKey, itemKey, item.module.actions.find((a) => a.label === label));
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
