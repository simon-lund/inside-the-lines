/**
 * The module spec: the only thing the OS model is allowed to produce.
 *
 * The studio lets the model write Svelte and checks the result afterwards. The OS
 * goes one step further — the model only fills in this vocabulary, and fixed
 * design-system components render it. Anything outside the vocabulary is dropped
 * by `sanitize.ts` before it reaches the screen, so an off-design module cannot exist.
 */

export const KINDS = ['location', 'social', 'music', 'shop', 'generic'] as const;
export type Kind = (typeof KINDS)[number];

/** Glyph names the model may use; each maps to one lucide icon (see os/icons.ts). */
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
 * - open: the model assembles the next module, placed right after this one in the flow
 * - confirm: an instant local state change ("Add to calendar" → "Added")
 */
export type ActionEffect = 'open' | 'confirm';

export interface ActionSpec {
	label: string;
	sublabel?: string;
	icon?: IconName;
	primary?: boolean;
	effect: ActionEffect;
	/** open: what the next module should be about, in the user's words. */
	intent?: string;
	/** confirm: the label after the click. */
	done?: string;
}

export interface ListRowSpec {
	label: string;
	sub?: string;
	trailing?: string;
}

export const TEXT_ROLES = ['kicker', 'title', 'text', 'meta', 'price'] as const;
export type TextRole = (typeof TEXT_ROLES)[number];

export type Block =
	| { type: TextRole; text: string }
	/** Stylised map; only valid as the first block. */
	| { type: 'map'; label: string; sublabel?: string }
	| { type: 'media'; title: string; subtitle?: string; art: ArtSpec; actions: ActionSpec[] }
	| { type: 'art'; art: ArtSpec }
	| { type: 'list'; numbered: boolean; rows: ListRowSpec[] }
	/** from: 'me' for outgoing, otherwise the sender's initials. */
	| { type: 'message'; text: string; time?: string; from: string }
	| { type: 'divider'; label: string }
	/** Reply bar; only valid as the last block. */
	| { type: 'reply'; placeholder: string };

export interface ModuleSpec {
	id: string;
	title: string;
	source: string;
	kind: Kind;
	icon?: IconName;
	blocks: Block[];
	actions: ActionSpec[];
}

/** A space's flows as the model returns them; the client wraps them in its own state. */
export interface Assembly {
	/** Name of the space (only for mode 'space'). */
	title: string | null;
	flows: ModuleSpec[][];
}

/**
 * Where the requested modules go — exactly one of:
 * - space: a new intention from the empty state → new space, 1–2 flows
 * - flow: an intention typed inside a space → one new flow
 * - module: an action clicked on a module → one module after it in the same flow
 */
export type AssemblyMode = 'space' | 'flow' | 'module';

export interface AssemblyRequest {
	mode: AssemblyMode;
	intent: string;
	/** Context so new modules stay consistent with what is already on screen. */
	space?: { title: string; modules: ModuleSpec[] };
	/** mode 'module': the module and action that were clicked. */
	from?: { module: ModuleSpec; action: string };
}

export const LIMITS = {
	flowsPerSpace: 2,
	modulesPerFlow: 3,
	blocksPerModule: 8,
	actionsPerModule: 4,
	actionsPerMedia: 2,
	rowsPerList: 6,
	title: 60,
	source: 40,
	text: 280,
	label: 28,
	sublabel: 40,
	intent: 200,
	initials: 3
} as const;
