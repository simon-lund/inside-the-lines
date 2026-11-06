// Screenshot tour for the README: the OS (recorded example spaces, every slot state)
// and the studio (design check, protected design system).
//
//   npm run dev -- --port 5199     # in another terminal
//   npm run screenshots            # writes docs/screenshots/*.png
//
// Uses the system Chrome. The OS shots replay the recordings in os-demo/, so no API key is needed.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const OUT = process.argv[2] ?? 'docs/screenshots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name, clip) {
	await page.screenshot({ path: path.join(OUT, `${name}.png`), clip });
	console.log('saved', name);
}

// Waits until no module slot is still assembling.
async function settled(page) {
	await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 120000 });
	await sleep(700); // entry transitions
}

async function openOs(page) {
	await page.goto(BASE, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction(() => !!window.__os?.health, null, { timeout: 30000 });
	await page.evaluate(() => {
		localStorage.clear();
		window.__os.spaces = [];
		window.__os.activeKey = null;
	});
	await sleep(300);
}

async function newSpace(page, intent) {
	await page.evaluate((i) => window.__os.newSpace(i), intent);
	await settled(page);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });

try {
	const ctx = await browser.newContext({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2 });
	const page = await ctx.newPage();

	// ---- OS
	await openOs(page);
	await shot(page, 'os-empty');

	const intents = await page.evaluate(() =>
		[...document.querySelectorAll('.examples button')].map((b) => b.textContent.trim())
	);
	for (const [i, intent] of intents.entries()) {
		await newSpace(page, intent);
		await page.evaluate(() => window.scrollTo(0, 0));
		await shot(page, `os-space-${i + 1}`);
	}

	// An "open" action: the first recorded one in the first space, if any.
	await page.evaluate(() => (window.__os.activeKey = window.__os.spaces[0].key));
	await sleep(500);
	const opened = await page.evaluate(() => {
		const os = window.__os;
		for (const flow of os.active.flows) {
			for (const item of flow.items) {
				const action = item.status === 'ready' && item.module.actions.find((a) => a.effect === 'open');
				if (action) {
					os.open(flow.key, item.key, action);
					return action.label;
				}
			}
		}
		return null;
	});
	if (opened) {
		await settled(page);
		await page.evaluate(() => window.scrollTo(0, 0));
		await shot(page, 'os-open-action');
	}

	// Slot states: loading and error, injected into the second flow (or the first).
	await page.evaluate(() => {
		const os = window.__os;
		const flow = os.active?.flows.at(-1);
		if (!flow) return;
		flow.items.push(
			{
				key: 'demo-pending',
				status: 'pending',
				request: { mode: 'module', intent: 'Show the menu at Kettle & Kite', from: { module: { title: 'Kettle & Kite' }, action: 'See the menu' } }
			},
			{
				key: 'demo-failed',
				status: 'failed',
				request: { mode: 'module', intent: 'Book a table for two', from: { module: { title: 'Kettle & Kite' }, action: 'Book a table' } },
				code: 'provider_rate_limit'
			}
		);
	});
	await sleep(900);
	await page.evaluate(() => document.querySelector('[aria-busy="true"]')?.scrollIntoView({ inline: 'center', block: 'center' }));
	await sleep(500);
	await shot(page, 'os-slot-states');
	await page.evaluate(() => {
		const flow = window.__os.active?.flows.at(-1);
		if (flow) flow.items = flow.items.filter((i) => !i.key.startsWith('demo-'));
	});

	// "More actions" points Locus at a module.
	const targeted = await page.evaluate(() => {
		const os = window.__os;
		for (const flow of os.active?.flows ?? []) {
			const item = flow.items.find((i) => i.status === 'ready');
			if (item) {
				os.target = { flowKey: flow.key, itemKey: item.key, title: item.module.title };
				return true;
			}
		}
		return false;
	});
	if (targeted) {
		// Back to the top-left, so the targeted module is on screen next to the chip.
		await page.evaluate(() => {
			window.scrollTo(0, 0);
			for (const el of document.querySelectorAll('*')) {
				if (el.scrollTop || el.scrollLeft) el.scrollTo(0, 0);
			}
		});
		await sleep(500);
		await shot(page, 'os-locus-target');
		await page.evaluate(() => (window.__os.target = null));
	}

	// ---- Studio
	await page.goto(`${BASE}/studio`, { waitUntil: 'domcontentloaded' });
	await page.waitForFunction(() => window.__studio?.bundler.result && window.__studio.bundlerStatus === null, null, { timeout: 120000 });
	await page.evaluate(() => window.__studio.loadView('module-canvas'));
	await page.waitForFunction(() => window.__studio.bundlerStatus === null && window.__studio.libraryBusy === null, null, { timeout: 120000 });
	await sleep(1500);
	// Break one module on purpose, then show what the real design check reports.
	await page.evaluate(async () => {
		const s = window.__studio;
		const place = s.workspace.file_nodes.find((f) => f.name === 'lib/Place.svelte');
		s.workspace.update_file({
			...place,
			contents: place.contents
				.replace('<h2 class="m-title">', '<h2 class="m-title" style="color: #e11d48">')
				.replace('<Action label="See details" />', '<Action primary label="See details" />')
				.replace('<Action icon="navigate"', '<Action primary icon="navigate"')
		});
		const { checkDesign } = await import('/src/lib/design-check.ts');
		s.messages.push(
			{ id: 9001, role: 'user', raw: 'x', display: 'Make the café stand out more', fileNames: [], status: 'done' },
			{
				id: 9002,
				role: 'assistant',
				raw: 'x',
				display: 'Gave the café a rose accent and made both main actions prominent.',
				fileNames: ['lib/Place.svelte'],
				status: 'done',
				stopReason: 'end_turn',
				designIssues: checkDesign(s.textFiles())
			}
		);
	});
	await page.waitForFunction(() => window.__studio.bundlerStatus === null, null, { timeout: 60000 });
	await sleep(1500);
	await shot(page, 'studio-design-check');

	await page.evaluate(() => {
		window.__studio.activeTab = 'code';
		window.__studio.showFramework = true;
		window.__studio.workspace.select('mercury/Module.svelte');
	});
	await sleep(800);
	await shot(page, 'studio-design-system');
	await ctx.close();
} finally {
	await browser.close();
}
