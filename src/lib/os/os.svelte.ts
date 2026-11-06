import type { ErrorCode, HealthInfo } from '$lib/types';
import type { ActionSpec, Assembly, AssemblyRequest, SectionSpec } from './spec';

/** One slot on a page — exactly one of: a section, a section being assembled, a failed assembly. */
export type PageItem =
	| { key: string; status: 'ready'; section: SectionSpec }
	| { key: string; status: 'pending'; request: AssemblyRequest }
	| { key: string; status: 'failed'; request: AssemblyRequest; code: ErrorCode; detail?: string };

/**
 * Everything one intention put on the page, like a notebook cell. The first cell is the
 * page itself; every follow-up typed on the page adds one below. Sections opened by an
 * action go right below the section they came from, in the same cell.
 */
export interface Cell {
	key: string;
	intent: string;
	items: PageItem[];
}

/** One Space = one live page for one task. */
export interface Space {
	key: string;
	title: string;
	intent: string;
	lede: string | null;
	cells: Cell[];
}

// v3: a space is a page of cells; v2 (flows of modules) is not migrated.
const STORAGE_KEY = 'klementine-pages:spaces:v3';

const newKey = () => crypto.randomUUID();

/** All client-side state of the OS — one instance per page, browser-only. */
export class Os {
	spaces = $state<Space[]>([]);
	/** null = the empty state (Locus centred, ready for a new intention). */
	activeKey = $state<string | null>(null);
	health = $state<HealthInfo | null>(null);

	active = $derived(this.spaces.find((s) => s.key === this.activeKey) ?? null);

	/** Items created in this session — only these animate and scroll into view. */
	private fresh = new Set<string>();

	async init(): Promise<void> {
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Space[];
			if (Array.isArray(saved)) this.spaces = saved;
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

	isFresh(key: string): boolean {
		return this.fresh.has(key);
	}

	// ------------------------------------------------------------ intentions

	/** Locus from the empty state: a new page for the intention. */
	newSpace(intent: string): void {
		const pending = this.pendingItem({ mode: 'page', intent });
		const cell: Cell = { key: newKey(), intent, items: [pending] };
		const space: Space = { key: newKey(), title: intent, intent, lede: null, cells: [cell] };
		this.spaces.push(space);
		this.activeKey = space.key;
		void this.run(space.key, cell.key, pending.key);
	}

	/** Locus on a page: a follow-up, added as a new cell at the end of the page. */
	addToSpace(intent: string): void {
		const space = this.active;
		if (!space) return this.newSpace(intent);
		const pending = this.pendingItem({ mode: 'section', intent });
		const cell: Cell = { key: newKey(), intent, items: [pending] };
		space.cells.push(cell);
		void this.run(space.key, cell.key, pending.key);
	}

	/** An "open" action: the new section appears right below the clicked one. */
	open(cellKey: string, itemKey: string, action: ActionSpec): void {
		const space = this.active;
		const cell = space?.cells.find((c) => c.key === cellKey);
		const from = cell?.items.find((i) => i.key === itemKey);
		if (!space || !cell || from?.status !== 'ready') return;
		const pending = this.pendingItem({
			mode: 'section',
			intent: action.intent ?? action.label,
			from: { section: from.section, action: action.label }
		});
		cell.items.splice(cell.items.indexOf(from) + 1, 0, pending);
		void this.run(space.key, cell.key, pending.key);
	}

	retry(cellKey: string, itemKey: string): void {
		const space = this.active;
		const cell = space?.cells.find((c) => c.key === cellKey);
		const idx = cell?.items.findIndex((i) => i.key === itemKey) ?? -1;
		const item = cell?.items[idx];
		if (!space || !cell || item?.status !== 'failed') return;
		cell.items[idx] = { key: item.key, status: 'pending', request: item.request };
		void this.run(space.key, cell.key, item.key);
	}

	/** Removes one item; an emptied cell disappears with it. */
	dismiss(cellKey: string, itemKey: string): void {
		const space = this.active;
		const cell = space?.cells.find((c) => c.key === cellKey);
		if (!space || !cell) return;
		cell.items = cell.items.filter((i) => i.key !== itemKey);
		if (cell.items.length === 0) space.cells = space.cells.filter((c) => c.key !== cellKey);
		this.persist();
	}

	closeSpace(key: string): void {
		this.spaces = this.spaces.filter((s) => s.key !== key);
		if (this.activeKey === key) this.activeKey = this.spaces.at(-1)?.key ?? null;
		this.persist();
	}

	/** True while any section of the active page is being assembled. */
	get busy(): boolean {
		return this.active?.cells.some((c) => c.items.some((i) => i.status === 'pending')) ?? false;
	}

	// -------------------------------------------------------------- internals

	private pendingItem(request: AssemblyRequest): PageItem {
		const item: PageItem = { key: newKey(), status: 'pending', request };
		this.fresh.add(item.key);
		return item;
	}

	/** Sections already on the page — context that keeps new ones consistent. */
	private readySections(space: Space): SectionSpec[] {
		return space.cells.flatMap((c) => c.items.flatMap((i) => (i.status === 'ready' ? [i.section] : [])));
	}

	private async run(spaceKey: string, cellKey: string, itemKey: string): Promise<void> {
		const findItem = () => {
			const space = this.spaces.find((s) => s.key === spaceKey);
			const cell = space?.cells.find((c) => c.key === cellKey);
			const idx = cell?.items.findIndex((i) => i.key === itemKey) ?? -1;
			return space && cell && idx !== -1 ? { space, cell, idx, item: cell.items[idx] } : null;
		};

		const start = findItem();
		if (!start || start.item.status !== 'pending') return;
		const request: AssemblyRequest = {
			...start.item.request,
			page: { title: start.space.title, sections: this.readySections(start.space) }
		};

		let assembly: Assembly | null = null;
		let failure: { code: ErrorCode; detail?: string } | null = null;
		try {
			const res = await fetch('/api/os', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(request)
			});
			const data = await res.json().catch(() => null);
			if (res.ok && data) assembly = data as Assembly;
			else failure = { code: (data?.code as ErrorCode) ?? 'network_error', detail: data?.detail };
		} catch {
			failure = { code: 'network_error' };
		}

		// The page, cell or item may have been closed while we waited.
		const now = findItem();
		if (!now || now.item.status !== 'pending') return;

		if (failure || !assembly) {
			now.cell.items[now.idx] = { key: itemKey, status: 'failed', request: now.item.request, ...failure! };
			return;
		}

		const items = assembly.sections.map((section): PageItem => {
			// Re-key: replayed recordings reuse section ids.
			const item: PageItem = { key: newKey(), status: 'ready', section: { ...section, id: newKey() } };
			this.fresh.add(item.key);
			return item;
		});
		now.cell.items.splice(now.idx, 1, ...items);
		if (now.item.request.mode === 'page') {
			if (assembly.title) now.space.title = assembly.title;
			now.space.lede = assembly.lede;
		}
		this.persist();
	}

	/** Saves ready sections only — pending and failed slots are session-local. */
	private persist(): void {
		const snapshot = this.spaces.map((s) => ({
			...s,
			cells: s.cells
				.map((c) => ({ ...c, items: c.items.filter((i) => i.status === 'ready') }))
				.filter((c) => c.items.length > 0)
		}));
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			/* storage full or blocked — the session still works */
		}
	}
}
