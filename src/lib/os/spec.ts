/**
 * The page spec: the only thing the model is allowed to produce.
 *
 * A Space is one live page for one task. The model never writes UI — it fills in
 * this vocabulary (a title, then sections made of blocks and actions), and fixed
 * design-system components draw it. Anything outside the vocabulary is dropped by
 * `sanitize.ts` before it reaches the screen, so an off-design page cannot exist.
 */

/** Glyph names the model may use on actions; each maps to one Phosphor icon (see os/icons.ts). */
export const ICONS = [
	'generic',
	'location',
	'navigate',
	'map',
	'car',
	'train',
	'plane',
	'calendar',
	'clock',
	'bell',
	'mail',
	'message',
	'phone',
	'send',
	'share',
	'user',
	'users',
	'music',
	'play',
	'video',
	'camera',
	'book',
	'file',
	'link',
	'search',
	'list',
	'bag',
	'cart',
	'card',
	'gift',
	'ticket',
	'coffee',
	'food',
	'bed',
	'sun',
	'cloud',
	'star',
	'heart',
	'save',
	'check',
	'plus',
	'arrow'
] as const;
export type IconName = (typeof ICONS)[number];

export const ART_KINDS = ['album', 'portrait', 'product', 'landscape'] as const;
export type ArtKind = (typeof ART_KINDS)[number];

export const TONES = ['neutral', 'warm', 'cool', 'green', 'rose'] as const;
export type Tone = (typeof TONES)[number];

export interface ArtSpec {
	kind: ArtKind;
	tone: Tone;
	/** Shown on portraits. */
	initials?: string;
}

/**
 * What a click does — exactly one of:
 * - open: the model assembles a new section, placed right below this one
 * - confirm: an instant local state change ("Add to calendar" → "Added")
 */
export type ActionEffect = 'open' | 'confirm';

export interface ActionSpec {
	label: string;
	sublabel?: string;
	icon?: IconName;
	primary?: boolean;
	effect: ActionEffect;
	/** open: what the new section should show, in the user's words. */
	intent?: string;
	/** confirm: the label after the click. */
	done?: string;
}

export interface ListRowSpec {
	label: string;
	sub?: string;
	trailing?: string;
}

export interface PlaceSpec {
	label: string;
	sublabel?: string;
}

export interface SummaryRowSpec {
	label: string;
	value: string;
}

export const TEXT_ROLES = ['text', 'meta', 'price'] as const;
export type TextRole = (typeof TEXT_ROLES)[number];

export type Block =
	| { type: TextRole; text: string }
	/** Stylised map with one pin per place; at most one per section. */
	| { type: 'map'; places: PlaceSpec[] }
	| { type: 'media'; title: string; subtitle?: string; art: ArtSpec; actions: ActionSpec[] }
	| { type: 'art'; art: ArtSpec }
	| { type: 'list'; numbered: boolean; rows: ListRowSpec[] }
	/** Options side by side; every row has one cell per column. `pick` marks the recommended row. */
	| { type: 'table'; columns: string[]; rows: string[][]; pick?: number }
	/** Label/value lines with an optional total — costs, key facts. */
	| { type: 'summary'; rows: SummaryRowSpec[]; total?: SummaryRowSpec }
	/** To-dos the person ticks off on the page. */
	| { type: 'checklist'; items: string[] };

export type BlockType = Block['type'];

// `satisfies` makes this fail to compile when a block type is added to `Block` but not here.
const BLOCK_TYPE_SET = {
	text: true,
	meta: true,
	price: true,
	map: true,
	media: true,
	art: true,
	list: true,
	table: true,
	summary: true,
	checklist: true
} as const satisfies Record<BlockType, true>;

/** Every block type, e.g. for the Library, which shows each one. */
export const BLOCK_TYPES = Object.keys(BLOCK_TYPE_SET) as BlockType[];

export interface SectionSpec {
	id: string;
	/** The section's heading — the thing's name, not a sentence. */
	title: string;
	/** Small line above the heading: category, source, date. */
	kicker?: string;
	blocks: Block[];
	actions: ActionSpec[];
}

/** What the model returns; the client wraps the sections in its own state. */
export interface Assembly {
	/** Page name and one-sentence lede (mode 'page' only). */
	title: string | null;
	lede: string | null;
	sections: SectionSpec[];
}

/**
 * What is being assembled — exactly one of:
 * - page: a new intention from the empty state → a new page
 * - section: a follow-up typed on the page, or an "open" action clicked → new section(s);
 *   with `from` they go right below that section, without it at the end of the page
 */
export type AssemblyMode = 'page' | 'section';

export interface AssemblyRequest {
	mode: AssemblyMode;
	intent: string;
	/** Context so new sections stay consistent with what is already on the page. */
	page?: { title: string; sections: SectionSpec[] };
	/** The section and action that were clicked. */
	from?: { section: SectionSpec; action: string };
}

export const LIMITS = {
	sectionsPerPage: 6,
	sectionsPerFollowUp: 2,
	blocksPerSection: 6,
	actionsPerSection: 3,
	actionsPerMedia: 2,
	rowsPerList: 6,
	placesPerMap: 4,
	tableColumns: 4,
	tableRows: 6,
	summaryRows: 6,
	checklistItems: 8,
	checklistItem: 80,
	title: 60,
	kicker: 40,
	lede: 160,
	text: 280,
	label: 36,
	sublabel: 40,
	cell: 48,
	intent: 200,
	initials: 3
} as const;
