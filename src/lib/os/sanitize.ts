import {
	ART_KINDS,
	ICONS,
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
	type PlaceSpec,
	type SectionSpec,
	type SummaryRowSpec
} from './spec';

/**
 * The guardrail. Turns whatever the model returned into a valid Assembly: unknown
 * block types, icons and fields are dropped, strings are capped, structural rules
 * (one map and one primary action per section, tables with even rows) are enforced. Every correction is
 * reported as an issue with a stable code — the server feeds them back to the model
 * when the output is unusable, and the tests pin each rule.
 */

export type IssueCode =
	| 'invalid_json'
	| 'no_sections'
	| 'too_many_sections'
	| 'section_not_object'
	| 'section_without_title'
	| 'section_without_blocks'
	| 'unknown_icon'
	| 'unknown_block_type'
	| 'invalid_block'
	| 'too_many_blocks'
	| 'extra_map'
	| 'too_many_rows'
	| 'table_row_mismatch'
	| 'invalid_action'
	| 'too_many_actions'
	| 'extra_primary'
	| 'text_truncated';

export interface Issue {
	code: IssueCode;
	/** Where in the output, e.g. "sections[1].blocks[2]". */
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
			const p = `${path}[${i}]`;
			if (rows.length >= LIMITS.rowsPerList) {
				this.report('too_many_rows', p);
				break;
			}
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

	/** Strings from an array, capped in length and count. */
	strings(value: unknown, max: number, count: number, path: string): string[] {
		if (!Array.isArray(value)) return [];
		const out: string[] = [];
		for (const [i, raw] of value.entries()) {
			const text = this.str(raw, max, `${path}[${i}]`);
			if (!text) continue;
			if (out.length >= count) {
				this.report('too_many_rows', `${path}[${i}]`);
				break;
			}
			out.push(text);
		}
		return out;
	}

	places(value: unknown, path: string): PlaceSpec[] {
		const out: PlaceSpec[] = [];
		(Array.isArray(value) ? value : []).forEach((raw, i) => {
			const p = `${path}[${i}]`;
			const label = isObj(raw) ? this.str(raw.label, LIMITS.label, `${p}.label`) : undefined;
			if (!label) return;
			if (out.length >= LIMITS.placesPerMap) return this.report('too_many_rows', p);
			const sublabel = this.str((raw as Obj).sublabel, LIMITS.sublabel, `${p}.sublabel`);
			out.push(sublabel ? { label, sublabel } : { label });
		});
		return out;
	}

	summaryRow(raw: unknown, path: string): SummaryRowSpec | undefined {
		if (!isObj(raw)) return undefined;
		const label = this.str(raw.label, LIMITS.title, `${path}.label`);
		const value = this.str(raw.value, LIMITS.label, `${path}.value`);
		return label && value ? { label, value } : undefined;
	}

	block(raw: unknown, path: string): Block | undefined {
		if (!isObj(raw)) {
			this.report('invalid_block', path);
			return undefined;
		}
		const type = raw.type;
		if (oneOf(TEXT_ROLES, type)) {
			const text = this.str(raw.text, type === 'price' ? LIMITS.label : LIMITS.text, `${path}.text`);
			if (text) return { type, text };
		} else if (type === 'map') {
			const places = this.places(raw.places, `${path}.places`);
			if (places.length > 0) return { type, places };
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
		} else if (type === 'table') {
			const columns = this.strings(raw.columns, LIMITS.cell, LIMITS.tableColumns, `${path}.columns`);
			if (columns.length >= 2) {
				const rows: string[][] = [];
				(Array.isArray(raw.rows) ? raw.rows : []).forEach((rawRow, i) => {
					const p = `${path}.rows[${i}]`;
					if (!Array.isArray(rawRow)) return;
					if (rows.length >= LIMITS.tableRows) return this.report('too_many_rows', p);
					// One cell per column: pad short rows, cut long ones.
					if (rawRow.length !== columns.length) this.report('table_row_mismatch', p);
					rows.push(columns.map((_, c) => this.str(rawRow[c], LIMITS.cell, `${p}[${c}]`) ?? '—'));
				});
				if (rows.length > 0) {
					const pick = raw.pick;
					const valid = typeof pick === 'number' && Number.isInteger(pick) && pick >= 0 && pick < rows.length;
					return valid ? { type, columns, rows, pick } : { type, columns, rows };
				}
			}
		} else if (type === 'summary') {
			const rows: SummaryRowSpec[] = [];
			(Array.isArray(raw.rows) ? raw.rows : []).forEach((rawRow, i) => {
				const row = this.summaryRow(rawRow, `${path}.rows[${i}]`);
				if (!row) return;
				if (rows.length >= LIMITS.summaryRows) return this.report('too_many_rows', `${path}.rows[${i}]`);
				rows.push(row);
			});
			if (rows.length > 0) {
				const total = this.summaryRow(raw.total, `${path}.total`);
				return total ? { type, rows, total } : { type, rows };
			}
		} else if (type === 'checklist') {
			const items = this.strings(raw.items, LIMITS.checklistItem, LIMITS.checklistItems, `${path}.items`);
			if (items.length > 0) return { type, items };
		} else {
			this.report('unknown_block_type', path);
			return undefined;
		}
		this.report('invalid_block', path);
		return undefined;
	}

	section(raw: unknown, path: string): SectionSpec | undefined {
		if (!isObj(raw)) {
			this.report('section_not_object', path);
			return undefined;
		}
		const title = this.str(raw.title, LIMITS.title, `${path}.title`);
		if (!title) {
			this.report('section_without_title', path);
			return undefined;
		}

		const blocks: Block[] = [];
		const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
		rawBlocks.forEach((rb, i) => {
			const p = `${path}.blocks[${i}]`;
			const block = this.block(rb, p);
			if (!block) return;
			if (block.type === 'map' && blocks.some((b) => b.type === 'map')) {
				this.report('extra_map', p);
				return;
			}
			if (blocks.length >= LIMITS.blocksPerSection) {
				this.report('too_many_blocks', p);
				return;
			}
			blocks.push(block);
		});
		if (blocks.length === 0) {
			this.report('section_without_blocks', path);
			return undefined;
		}

		const actions = this.actions(raw.actions, LIMITS.actionsPerSection, `${path}.actions`);
		// One primary action per section, counting the ones inside media blocks.
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

		const section: SectionSpec = { id: `${this.idPrefix}-${this.nextId++}`, title, blocks, actions };
		const kicker = this.str(raw.kicker, LIMITS.kicker, `${path}.kicker`);
		if (kicker) section.kicker = kicker;
		return section;
	}
}

/** How many sections each mode may add: a whole page, or a follow-up / opened section. */
function maxSections(mode: AssemblyMode, opened: boolean): number {
	if (mode === 'page') return LIMITS.sectionsPerPage;
	return opened ? 1 : LIMITS.sectionsPerFollowUp;
}

/**
 * Sanitizes a parsed model reply of the shape `{ "title"?, "lede"?, "sections": Section[] }`.
 * `opened` marks a section requested by an action, which adds exactly one.
 * The result always satisfies the spec; it may hold zero sections when nothing was usable.
 */
export function sanitizeAssembly(raw: unknown, mode: AssemblyMode, idPrefix: string, opened = false): SanitizeResult {
	const s = new Sanitizer(idPrefix);
	const max = maxSections(mode, opened);

	if (!isObj(raw)) {
		s.report('invalid_json', '$');
		return { assembly: { title: null, lede: null, sections: [] }, issues: s.issues };
	}

	const sections: SectionSpec[] = [];
	(Array.isArray(raw.sections) ? raw.sections : []).forEach((rs, i) => {
		const p = `sections[${i}]`;
		if (sections.length >= max) {
			s.report('too_many_sections', p);
			return;
		}
		const section = s.section(rs, p);
		if (section) sections.push(section);
	});
	if (sections.length === 0) s.report('no_sections', 'sections');

	const page = mode === 'page';
	const title = page ? (s.str(raw.title, LIMITS.title, 'title') ?? null) : null;
	const lede = page ? (s.str(raw.lede, LIMITS.lede, 'lede') ?? null) : null;
	return { assembly: { title, lede, sections }, issues: s.issues };
}

/** Issues that make the output unusable — worth one repair round with the model. */
export function isFatal(issues: Issue[]): boolean {
	return issues.some((i) => i.code === 'invalid_json' || i.code === 'no_sections');
}
