import type { ErrorCode, HealthInfo } from '$lib/types';
import type { ActionSpec, Assembly, AssemblyRequest, ModuleSpec } from './spec';

/** What opened a module: an action clicked (or an intention typed) on another module. */
export interface Via {
	from: string;
	action: string;
}

/** One slot in a flow — exactly one of: a module, a module being assembled, a failed assembly. */
export type FlowItem =
	| { key: string; status: 'ready'; module: ModuleSpec; via?: Via }
	| { key: string; status: 'pending'; request: AssemblyRequest }
	| { key: string; status: 'failed'; request: AssemblyRequest; code: ErrorCode; detail?: string };

/** Everything one intention produced, plus the modules opened from it — one group in the band. */
export interface Flow {
	key: string;
	intent: string;
	items: FlowItem[];
}

export interface Space {
	key: string;
	title: string;
	intent: string;
	flows: Flow[];
}

/** Where "More actions" points the next Locus intention; null = a new flow in the space. */
export interface LocusTarget {
	flowKey: string;
	itemKey: string;
	title: string;
}

// v2: flows carry their intention and items what opened them; v1 spaces are not migrated.
const STORAGE_KEY = 'mercury-os-prototype:spaces:v2';

const newKey = () => crypto.randomUUID();

/** What opened an item, for every status: kept on ready modules, read from the request otherwise. */
export function viaOf(item: FlowItem): Via | undefined {
	if (item.status === 'ready') return item.via;
	const from = item.request.from;
	return from ? { from: from.module.title, action: from.action } : undefined;
}

/** All client-side state of the OS — one instance per page, browser-only. */
export class Os {
	spaces = $state<Space[]>([]);
	/** null = the empty state (Locus centred, ready for a new intention). */
	activeKey = $state<string | null>(null);
	health = $state<HealthInfo | null>(null);
	target = $state<LocusTarget | null>(null);

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

	/** Locus from the empty state: a new space named after the intention. */
	newSpace(intent: string): void {
		const pending = this.pendingItem({ mode: 'space', intent });
		const space: Space = { key: newKey(), title: intent, intent, flows: [{ key: newKey(), intent, items: [pending] }] };
		this.spaces.push(space);
		this.activeKey = space.key;
		void this.run(space.key, space.flows[0].key, pending.key);
	}

	/** Locus inside a space: a new flow at the end of the band, or — with a target — one module after the target. */
	addToSpace(intent: string): void {
		const space = this.active;
		if (!space) return this.newSpace(intent);

		const target = this.target;
		this.target = null;
		if (target) {
			const flow = space.flows.find((f) => f.key === target.flowKey);
			const from = flow?.items.find((i) => i.key === target.itemKey);
			if (flow && from?.status === 'ready') {
				this.insertAfter(space, flow, from.key, { mode: 'module', intent, from: { module: from.module, action: intent } });
				return;
			}
		}

		const pending = this.pendingItem({ mode: 'flow', intent });
		const flow: Flow = { key: newKey(), intent, items: [pending] };
		space.flows.push(flow);
		void this.run(space.key, flow.key, pending.key);
	}

	/** An "open" action: the next module appears right after the clicked one. */
	open(flowKey: string, itemKey: string, action: ActionSpec): void {
		const space = this.active;
		const flow = space?.flows.find((f) => f.key === flowKey);
		const from = flow?.items.find((i) => i.key === itemKey);
		if (!space || !flow || from?.status !== 'ready') return;
		this.insertAfter(space, flow, itemKey, {
			mode: 'module',
			intent: action.intent ?? action.label,
			from: { module: from.module, action: action.label }
		});
	}

	retry(flowKey: string, itemKey: string): void {
		const space = this.active;
		const flow = space?.flows.find((f) => f.key === flowKey);
		const idx = flow?.items.findIndex((i) => i.key === itemKey) ?? -1;
		const item = flow?.items[idx];
		if (!space || !flow || item?.status !== 'failed') return;
		flow.items[idx] = { key: item.key, status: 'pending', request: item.request };
		void this.run(space.key, flow.key, item.key);
	}

	/** Removes one item; an emptied flow disappears with it. */
	dismiss(flowKey: string, itemKey: string): void {
		const space = this.active;
		const flow = space?.flows.find((f) => f.key === flowKey);
		if (!space || !flow) return;
		flow.items = flow.items.filter((i) => i.key !== itemKey);
		if (flow.items.length === 0) space.flows = space.flows.filter((f) => f.key !== flowKey);
		if (this.target?.itemKey === itemKey) this.target = null;
		this.persist();
	}

	closeSpace(key: string): void {
		this.spaces = this.spaces.filter((s) => s.key !== key);
		if (this.activeKey === key) this.activeKey = this.spaces.at(-1)?.key ?? null;
		this.target = null;
		this.persist();
	}

	/** True while any module of the active space is being assembled. */
	get busy(): boolean {
		return this.active?.flows.some((f) => f.items.some((i) => i.status === 'pending')) ?? false;
	}

	// -------------------------------------------------------------- internals

	private pendingItem(request: AssemblyRequest): FlowItem {
		const item: FlowItem = { key: newKey(), status: 'pending', request };
		this.fresh.add(item.key);
		return item;
	}

	private insertAfter(space: Space, flow: Flow, itemKey: string, request: AssemblyRequest): void {
		const pending = this.pendingItem(request);
		const idx = flow.items.findIndex((i) => i.key === itemKey);
		flow.items.splice(idx + 1, 0, pending);
		void this.run(space.key, flow.key, pending.key);
	}

	/** Modules already on screen in a space — context that keeps new ones consistent. */
	private readyModules(space: Space): ModuleSpec[] {
		return space.flows.flatMap((f) => f.items.flatMap((i) => (i.status === 'ready' ? [i.module] : [])));
	}

	private async run(spaceKey: string, flowKey: string, itemKey: string): Promise<void> {
		const findItem = () => {
			const space = this.spaces.find((s) => s.key === spaceKey);
			const flow = space?.flows.find((f) => f.key === flowKey);
			const idx = flow?.items.findIndex((i) => i.key === itemKey) ?? -1;
			return space && flow && idx !== -1 ? { space, flow, idx, item: flow.items[idx] } : null;
		};

		const start = findItem();
		if (!start || start.item.status !== 'pending') return;
		const request: AssemblyRequest = {
			...start.item.request,
			space: { title: start.space.title, modules: this.readyModules(start.space) }
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

		// The space, flow or item may have been closed while we waited.
		const now = findItem();
		if (!now || now.item.status !== 'pending') return;

		if (failure || !assembly) {
			now.flow.items[now.idx] = { key: itemKey, status: 'failed', request: now.item.request, ...failure! };
			return;
		}

		const via = viaOf(now.item);
		const toItems = (modules: ModuleSpec[]): FlowItem[] =>
			modules.map((module) => {
				// Re-key: replayed recordings reuse module ids.
				const item: FlowItem = { key: newKey(), status: 'ready', module: { ...module, id: newKey() }, via };
				this.fresh.add(item.key);
				return item;
			});

		// module: one module in place of the slot. space / flow: every module of the intention,
		// in this one flow — the model may group them into several, the band shows one group.
		const modules = assembly.flows.flat();
		const mode = now.item.request.mode;
		now.flow.items.splice(now.idx, 1, ...toItems(mode === 'module' ? modules.slice(0, 1) : modules));
		if (mode === 'space' && assembly.title) now.space.title = assembly.title;
		this.persist();
	}

	/** Saves ready modules only — pending and failed slots are session-local. */
	private persist(): void {
		const snapshot = this.spaces.map((s) => ({
			...s,
			flows: s.flows
				.map((f) => ({ ...f, items: f.items.filter((i) => i.status === 'ready') }))
				.filter((f) => f.items.length > 0)
		}));
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			/* storage full or blocked — the session still works */
		}
	}
}
