import {
	ART_KINDS,
	ICONS,
	KINDS,
	LIMITS,
	TEXT_ROLES,
	TONES,
	type ActionSpec,
	type ArtSpec,
	type Assembly,
	type AssemblyMode,
	type Block,
	type IconName,
	type ListRowSpec,
	type ModuleSpec
} from './spec';

/**
 * The guardrail. Turns whatever the model returned into a valid Assembly: unknown
 * block types, icons and fields are dropped, strings are capped, structural rules
 * (map first, reply last, one primary action) are enforced. Every correction is
 * reported as an issue with a stable code — the server feeds them back to the model
 * when the output is unusable, and the tests pin each rule.
 */

export type IssueCode =
	| 'invalid_json'
	| 'no_flows'
	| 'too_many_flows'
	| 'too_many_modules'
	| 'module_not_object'
	| 'module_without_title'
	| 'module_without_blocks'
	| 'unknown_kind'
	| 'unknown_icon'
	| 'unknown_block_type'
	| 'invalid_block'
	| 'too_many_blocks'
	| 'map_not_first'
	| 'reply_not_last'
	| 'invalid_action'
	| 'too_many_actions'
	| 'extra_primary'
	| 'text_truncated';

export interface Issue {
	code: IssueCode;
	/** Where in the output, e.g. "flows[0][1].blocks[2]". */
	path: string;
}

export interface SanitizeResult {
	assembly: Assembly;
	issues: Issue[];
}

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
	return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Extracts the JSON object from a model reply (tolerates code fences and stray prose). */
export function parseModelJson(raw: string): unknown {
	const start = raw.indexOf('{');
	const end = raw.lastIndexOf('}');
	if (start === -1 || end <= start) return undefined;
	try {
		return JSON.parse(raw.slice(start, end + 1));
	} catch {
		return undefined;
	}
}

class Sanitizer {
	issues: Issue[] = [];
	private nextId = 0;

	constructor(private idPrefix: string) {}

	report(code: IssueCode, path: string): void {
		this.issues.push({ code, path });
	}

	/** Trimmed, control-character-free, capped string; undefined when empty or not a string. */
	str(value: unknown, max: number, path: string): string | undefined {
		if (typeof value !== 'string' && typeof value !== 'number') return undefined;
		// eslint-disable-next-line no-control-regex
		const clean = String(value).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim();
		if (!clean) return undefined;
		if (clean.length > max) {
			this.report('text_truncated', path);
			return `${clean.slice(0, max - 1).trimEnd()}…`;
		}
		return clean;
	}

	/** Initials: letters only, hard-cut — an ellipsis makes no sense in an avatar. */
	initials(value: unknown): string | undefined {
		if (typeof value !== 'string') return undefined;
		// "Mara Ellison" → "ME"; a single word is taken as initials already ("ml" → "ML").
		const words = value.split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, '')).filter(Boolean);
		const letters = (words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? ''))
			.slice(0, LIMITS.initials)
			.toUpperCase();
		return letters || undefined;
	}

	icon(value: unknown, path: string): IconName | undefined {
		if (value === undefined || value === null || value === '') return undefined;
		if (oneOf(ICONS, value)) return value;
		this.report('unknown_icon', path);
		return undefined;
	}

	art(value: unknown, path: string): ArtSpec {
		const raw = isObj(value) ? value : {};
		const art: ArtSpec = {
			kind: oneOf(ART_KINDS, raw.kind) ? raw.kind : 'product',
			tone: oneOf(TONES, raw.tone) ? raw.tone : 'neutral'
		};
		const initials = this.initials(raw.initials);
		if (initials) art.initials = initials;
		return art;
	}

	actions(value: unknown, max: number, path: string): ActionSpec[] {
		if (!Array.isArray(value)) return [];
		const out: ActionSpec[] = [];
		value.forEach((raw, i) => {
			const p = `${path}[${i}]`;
			const label = isObj(raw) ? this.str(raw.label, LIMITS.label, `${p}.label`) : undefined;
			if (!isObj(raw) || !label) {
				this.report('invalid_action', p);
				return;
			}
			if (out.length >= max) {
				this.report('too_many_actions', p);
				return;
			}
			const intent = this.str(raw.intent, LIMITS.intent, `${p}.intent`);
			// An action that says what to open opens it; everything else confirms in place.
			const effect = raw.effect === 'open' || raw.effect === 'confirm' ? raw.effect : intent ? 'open' : 'confirm';
			const action: ActionSpec = { label, effect };
			const sublabel = this.str(raw.sublabel, LIMITS.sublabel, `${p}.sublabel`);
			if (sublabel) action.sublabel = sublabel;
			const icon = this.icon(raw.icon, `${p}.icon`);
			if (icon) action.icon = icon;
			if (raw.primary === true) action.primary = true;
			if (effect === 'open') action.intent = intent ?? label;
			else action.done = this.str(raw.done, LIMITS.label, `${p}.done`) ?? 'Done';
			out.push(action);
		});
		return out;
	}

	rows(value: unknown, path: string): ListRowSpec[] {
		if (!Array.isArray(value)) return [];
		const rows: ListRowSpec[] = [];
		for (const [i, raw] of value.entries()) {
			if (rows.length >= LIMITS.rowsPerList) break;
			const p = `${path}[${i}]`;
			const label = isObj(raw) ? this.str(raw.label, LIMITS.title, `${p}.label`) : this.str(raw, LIMITS.title, p);
			if (!label) continue;
			const row: ListRowSpec = { label };
			if (isObj(raw)) {
				const sub = this.str(raw.sub, LIMITS.sublabel, `${p}.sub`);
				const trailing = this.str(raw.trailing, LIMITS.label, `${p}.trailing`);
				if (sub) row.sub = sub;
				if (trailing) row.trailing = trailing;
			}
			rows.push(row);
		}
		return rows;
	}

	block(raw: unknown, path: string): Block | undefined {
		if (!isObj(raw)) {
			this.report('invalid_block', path);
			return undefined;
		}
		const type = raw.type;
		if (oneOf(TEXT_ROLES, type)) {
			const text = this.str(raw.text, type === 'title' ? LIMITS.title : LIMITS.text, `${path}.text`);
			if (text) return { type, text };
		} else if (type === 'map') {
			const label = this.str(raw.label, LIMITS.title, `${path}.label`);
			if (label) {
				const sublabel = this.str(raw.sublabel, LIMITS.sublabel, `${path}.sublabel`);
				return sublabel ? { type, label, sublabel } : { type, label };
			}
		} else if (type === 'media') {
			const title = this.str(raw.title, LIMITS.title, `${path}.title`);
			if (title) {
				const block: Block = {
					type,
					title,
					art: this.art(raw.art, `${path}.art`),
					actions: this.actions(raw.actions, LIMITS.actionsPerMedia, `${path}.actions`)
				};
				const subtitle = this.str(raw.subtitle, LIMITS.sublabel, `${path}.subtitle`);
				if (subtitle) block.subtitle = subtitle;
				return block;
			}
		} else if (type === 'art') {
			return { type, art: this.art(raw.art, `${path}.art`) };
		} else if (type === 'list') {
			const rows = this.rows(raw.rows, `${path}.rows`);
			if (rows.length > 0) return { type, numbered: raw.numbered === true, rows };
		} else if (type === 'message') {
			const text = this.str(raw.text, LIMITS.text, `${path}.text`);
			if (text) {
				// "ME" in capitals is someone's initials (Mara Ellison), not the person.
				const isMe = typeof raw.from !== 'string' || ['me', 'Me'].includes(raw.from.trim());
				const from = isMe ? 'me' : (this.initials(raw.from) ?? 'me');
				const time = this.str(raw.time, LIMITS.label, `${path}.time`);
				return time ? { type, text, from, time } : { type, text, from };
			}
		} else if (type === 'divider') {
			const label = this.str(raw.label, LIMITS.label, `${path}.label`);
			if (label) return { type, label };
		} else if (type === 'reply') {
			return { type, placeholder: this.str(raw.placeholder, LIMITS.label, `${path}.placeholder`) ?? 'Reply…' };
		} else {
			this.report('unknown_block_type', path);
			return undefined;
		}
		this.report('invalid_block', path);
		return undefined;
	}

	module(raw: unknown, path: string): ModuleSpec | undefined {
		if (!isObj(raw)) {
			this.report('module_not_object', path);
			return undefined;
		}
		const title = this.str(raw.title, LIMITS.title, `${path}.title`);
		if (!title) {
			this.report('module_without_title', path);
			return undefined;
		}

		const kind = oneOf(KINDS, raw.kind) ? raw.kind : 'generic';
		if (raw.kind !== undefined && kind !== raw.kind) this.report('unknown_kind', `${path}.kind`);

		const blocks: Block[] = [];
		const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
		rawBlocks.forEach((rb, i) => {
			const p = `${path}.blocks[${i}]`;
			const block = this.block(rb, p);
			if (!block) return;
			if (block.type === 'map' && blocks.length > 0) {
				this.report('map_not_first', p);
				return;
			}
			if (blocks.at(-1)?.type === 'reply') {
				this.report('reply_not_last', `${path}.blocks[${i - 1}]`);
				blocks.pop();
			}
			if (blocks.length >= LIMITS.blocksPerModule) {
				this.report('too_many_blocks', p);
				return;
			}
			blocks.push(block);
		});
		if (blocks.length === 0) {
			this.report('module_without_blocks', path);
			return undefined;
		}

		const actions = this.actions(raw.actions, LIMITS.actionsPerModule, `${path}.actions`);
		// One primary action per module, counting the ones inside media blocks.
		let primarySeen = false;
		const demote = (list: ActionSpec[], p: string) =>
			list.forEach((a, i) => {
				if (!a.primary) return;
				if (primarySeen) {
					delete a.primary;
					this.report('extra_primary', `${p}[${i}]`);
				}
				primarySeen = true;
			});
		blocks.forEach((b, i) => {
			if (b.type === 'media') demote(b.actions, `${path}.blocks[${i}].actions`);
		});
		demote(actions, `${path}.actions`);

		const module: ModuleSpec = {
			id: `${this.idPrefix}-${this.nextId++}`,
			title,
			source: this.str(raw.source, LIMITS.source, `${path}.source`) ?? '',
			kind,
			blocks,
			actions
		};
		const icon = this.icon(raw.icon, `${path}.icon`);
		if (icon) module.icon = icon;
		return module;
	}
}

const FLOW_LIMITS: Record<AssemblyMode, { flows: number; modules: number }> = {
	space: { flows: LIMITS.flowsPerSpace, modules: LIMITS.modulesPerFlow },
	flow: { flows: 1, modules: LIMITS.modulesPerFlow },
	module: { flows: 1, modules: 1 }
};

/**
 * Sanitizes a parsed model reply of the shape `{ "title"?: string, "flows": Module[][] }`.
 * The result always satisfies the spec; it may hold zero flows when nothing was usable.
 */
export function sanitizeAssembly(raw: unknown, mode: AssemblyMode, idPrefix: string): SanitizeResult {
	const s = new Sanitizer(idPrefix);
	const limits = FLOW_LIMITS[mode];

	if (!isObj(raw)) {
		s.report('invalid_json', '$');
		return { assembly: { title: null, flows: [] }, issues: s.issues };
	}

	// Tolerate a bare module list for a single flow.
	const rawFlows: unknown[] = Array.isArray(raw.flows)
		? raw.flows.map((f) => (Array.isArray(f) ? f : [f]))
		: [];

	const flows: ModuleSpec[][] = [];
	rawFlows.forEach((rawFlow, fi) => {
		if (flows.length >= limits.flows) {
			s.report('too_many_flows', `flows[${fi}]`);
			return;
		}
		const modules: ModuleSpec[] = [];
		(rawFlow as unknown[]).forEach((rm, mi) => {
			const p = `flows[${fi}][${mi}]`;
			if (modules.length >= limits.modules) {
				s.report('too_many_modules', p);
				return;
			}
			const module = s.module(rm, p);
			if (module) modules.push(module);
		});
		if (modules.length > 0) flows.push(modules);
	});
	if (flows.length === 0) s.report('no_flows', 'flows');

	const title = mode === 'space' ? (s.str(raw.title, LIMITS.title, 'title') ?? null) : null;
	return { assembly: { title, flows }, issues: s.issues };
}

/** Issues that make the output unusable — worth one repair round with the model. */
export function isFatal(issues: Issue[]): boolean {
	return issues.some((i) => i.code === 'invalid_json' || i.code === 'no_flows');
}
