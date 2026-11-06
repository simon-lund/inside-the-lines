import type { DesignViolation, ErrorCode, HealthInfo, PageStreamEvent } from '$lib/types';
import { parseAssistantText } from './artifact';
import { mergeFiles } from './merge';
import type { Repl } from './repl.svelte';
import type { PageFileInput, PageRequest } from './request';

/** One page: what was asked, and the code she wrote for it. */
export interface PageEntry {
	key: string;
	/** The page's name, from <Page title> in App.svelte; the intention until there is one. */
	title: string;
	intent: string;
	files: PageFileInput[];
	/** What the design check still finds in the files (after the automatic repair round). */
	issues: DesignViolation[];
}

/** One request, as the app tracks it. */
type Ask = Omit<PageRequest, 'files'>;

/**
 * What a page is doing right now — exactly one of:
 * - idle: nothing running
 * - working: a request is streaming; `file` is the one being written (null before code), `code` its text so far
 * - failed: the last request failed; it can be retried
 */
export type Activity =
	| { status: 'idle' }
	| {
			status: 'working';
			ask: Ask;
			phase: 'waiting' | 'thinking' | 'writing';
			replay: boolean;
			file: string | null;
			code: string;
			prose: string;
	  }
	| { status: 'failed'; ask: Ask; code: ErrorCode; detail?: string };

const STORAGE_KEY = 'inside-the-lines:pages:v1';
const IDLE: Activity = { status: 'idle' };
const newKey = () => crypto.randomUUID();

/** The page's name as App.svelte gives it to <Page title="…">. */
function titleOf(files: PageFileInput[]): string | null {
	const app = files.find((f) => f.name === 'App.svelte');
	return app?.contents.match(/<Page\b[^>]*?\btitle="([^"]{1,80})"/)?.[1] ?? null;
}

/** All client-side state of the app — one instance, browser-only. */
export class Pages {
	pages = $state<PageEntry[]>([]);
	/** null = the empty state (the composer centred, ready for a new intention). */
	activeKey = $state<string | null>(null);
	health = $state<HealthInfo | null>(null);
	activity = $state<Record<string, Activity>>({});

	active = $derived(this.pages.find((p) => p.key === this.activeKey) ?? null);

	private repl: Repl | null = null;

	/** Call from onMount, with the REPL created there. */
	async init(repl: Repl): Promise<void> {
		this.repl = repl;
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PageEntry[];
			if (Array.isArray(saved)) this.pages = saved.map((p) => ({ ...p, issues: p.issues ?? [] }));
		} catch {
			/* storage unavailable or corrupt — start empty */
		}
		try {
			const res = await fetch('/api/health');
			this.health = (await res.json()) as HealthInfo;
		} catch {
			this.health = null;
		}
	}

	activityOf(key: string): Activity {
		return this.activity[key] ?? IDLE;
	}

	/** True while the open page has a request running. */
	get busy(): boolean {
		return this.active !== null && this.activityOf(this.active.key).status === 'working';
	}

	// ------------------------------------------------------------ intentions

	/** The composer on the empty state: a new page for the intention. */
	newPage(intent: string): void {
		const page: PageEntry = { key: newKey(), title: intent, intent, files: [], issues: [] };
		this.pages.push(page);
		this.select(page.key);
		void this.run(page.key, { kind: 'page', intent });
	}

	/** The composer on a page: a follow-up. */
	follow(intent: string): void {
		if (!this.active) return this.newPage(intent);
		if (this.busy) return;
		void this.run(this.active.key, { kind: 'follow', intent });
	}

	/** A control inside the page called ask(). */
	askFromPage(intent: string, label: string): void {
		if (!this.active || this.busy) return;
		void this.run(this.active.key, { kind: 'ask', intent, label });
	}

	/** The page's code still leaves the guideline: another repair round. */
	repair(key: string): void {
		const page = this.pages.find((p) => p.key === key);
		if (!page || page.issues.length === 0 || this.activityOf(key).status === 'working') return;
		void this.run(key, { kind: 'repair', intent: page.intent });
	}

	/** The page does not run: send the error back with the code. */
	fix(key: string, failure: string): void {
		const page = this.pages.find((p) => p.key === key);
		if (!page || this.activityOf(key).status === 'working') return;
		void this.run(key, { kind: 'fix', intent: page.intent, detail: failure });
	}

	/** Runs the failed request again; a page left without code starts over from its intention. */
	retry(key: string): void {
		const activity = this.activityOf(key);
		const page = this.pages.find((p) => p.key === key);
		if (activity.status === 'failed') void this.run(key, activity.ask);
		else if (activity.status === 'idle' && page && page.files.length === 0) void this.run(key, { kind: 'page', intent: page.intent });
	}

	select(key: string | null): void {
		this.activeKey = key;
		const page = this.active;
		if (page && page.files.length > 0) void this.repl?.load(page.files);
	}

	close(key: string): void {
		this.pages = this.pages.filter((p) => p.key !== key);
		delete this.activity[key];
		if (this.activeKey === key) this.select(this.pages.at(-1)?.key ?? null);
		this.persist();
	}

	// -------------------------------------------------------------- internals

	private async run(key: string, ask: Ask): Promise<void> {
		const page = this.pages.find((p) => p.key === key);
		if (!page) return;
		const working: Activity = { status: 'working', ask, phase: 'waiting', replay: false, file: null, code: '', prose: '' };
		this.activity[key] = working;
		const live = this.activity[key] as Extract<Activity, { status: 'working' }>;

		const fail = (code: ErrorCode, detail?: string) => (this.activity[key] = { status: 'failed', ask, code, detail });
		let answer = '';
		let done = false;
		let violations: DesignViolation[] | null = null;
		try {
			const res = await fetch('/api/page', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...ask, files: page.files } satisfies PageRequest)
			});
			if (!res.ok || !res.body) {
				const err = (await res.json().catch(() => null)) as { code?: ErrorCode; detail?: string } | null;
				if (err?.code === 'nothing_to_repair') {
					// The check (newer than these issues) finds the page clean.
					page.issues = [];
					this.activity[key] = IDLE;
					return this.persist();
				}
				return void fail(err?.code ?? 'network_error', err?.detail);
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			for (;;) {
				const { done: end, value } = await reader.read();
				if (end) break;
				buffer += decoder.decode(value, { stream: true });
				const parts = buffer.split('\n\n');
				buffer = parts.pop() ?? '';
				for (const part of parts) {
					if (!part.startsWith('data: ')) continue;
					const event = JSON.parse(part.slice(6)) as PageStreamEvent;
					if (event.type === 'status') {
						live.phase = event.status;
						live.replay = event.replay;
					} else if (event.type === 'text') {
						answer += event.text;
						const parsed = parseAssistantText(answer);
						live.prose = parsed.prose;
						const current = parsed.files.find((f) => !f.closed) ?? parsed.files.at(-1);
						live.file = current?.name ?? null;
						live.code = current?.contents ?? '';
					} else if (event.type === 'check') {
						violations = event.violations;
					} else if (event.type === 'done') {
						done = true;
					} else if (event.type === 'error') {
						return void fail(event.code, event.detail);
					}
				}
			}
		} catch {
			return void fail('network_error');
		}
		if (!done) return void fail('stream_error');

		const emitted = parseAssistantText(answer).files.map(({ name, contents }) => ({ name, contents }));
		if (emitted.length === 0) return void fail('page_without_code');

		page.files = mergeFiles(page.files, emitted);
		page.title = titleOf(page.files) ?? page.title;
		page.issues = violations ?? [];
		this.activity[key] = IDLE;
		this.persist();
		// One repair round of its own, while the page already shows; what it leaves stays visible.
		if (page.issues.length > 0 && ask.kind !== 'repair') void this.run(key, { kind: 'repair', intent: page.intent });
		if (this.activeKey === key) await this.repl?.load(page.files);
	}

	private persist(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pages));
		} catch {
			/* storage full or blocked — the session still works */
		}
	}
}

