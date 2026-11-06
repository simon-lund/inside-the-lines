import { posix } from 'node:path';
import { parse } from 'svelte/compiler';
import type { PageFileInput } from '$lib/pages/request';
import type { DesignRule, DesignViolation } from '$lib/types';

/**
 * The design guideline, as a check on the code the model writes. It reads each file's syntax
 * tree (the Svelte compiler's), not its text, and follows the page as it renders from
 * App.svelte, through the page's own components, so it knows markup from strings, a helper
 * used inside a Section from content outside one, and either branch of an {#if} from both.
 * Violations go back to the model for one repair round; whatever survives shows with the page.
 *
 * The rules, one code each (stable: the client and the repair prompt use them; typed in $lib/types):
 * - unparsable: a file does not parse
 * - missing_app: there is no App.svelte
 * - canvas_count / page_count: the page renders other than exactly one <Canvas> / <Page>
 * - section_outside_page: a <Section> outside the <Page>
 * - nested_section: a <Section> inside another
 * - content_outside_section: markup, text or a design component outside any <Section>
 * - extra_primary: more than one primary <Action> in a Section (one in each branch is fine)
 * - raw_color: a colour that is not a token (styles, style attributes, SVG paint, script values)
 * - raw_font: a font that is not the design system's
 * - external_image: an image loaded from the web
 * - emoji: emoji anywhere in a file
 * - foreign_import: an import other than 'design', 'svelte', Phosphor icons or the page's own files
 */
export type { DesignRule, DesignViolation };

// The compiler's modern AST, as far as the check reads it.
interface Node {
	type: string;
	name?: string;
	data?: string;
	attributes?: Attribute[];
	expression?: Expression;
	fragment?: Fragment;
	consequent?: Fragment;
	alternate?: Fragment | null;
	body?: Fragment;
	fallback?: Fragment | null;
	pending?: Fragment | null;
	then?: Fragment | null;
	catch?: Fragment | null;
}
interface Fragment {
	nodes: Node[];
}
interface Expression {
	type: string;
	name?: string;
	value?: unknown;
	callee?: Expression;
	expression?: Expression;
}
interface Attribute {
	type: string;
	name: string;
	/** Attributes and style directives have one; other directives (class:, on:, bind:) do not. */
	value?: true | AttributePart | AttributePart[];
}
interface AttributePart {
	type: string;
	data?: string;
	expression?: Expression;
}
interface Import {
	type: string;
	source?: { value: unknown };
	specifiers?: { type: string; local: { name: string }; imported?: { name?: string; value?: string } }[];
}
interface Root {
	fragment: Fragment;
	instance: { content: { body: Import[] } } | null;
	module: { content: { body: Import[] } } | null;
}
type Visited = { type: string } & Record<string, unknown>;

/** One file of the page, parsed, with what its names refer to. */
interface Parsed {
	name: string;
	ast: Root;
	/** Local name → design export ('Card' → 'Section'); '*' for a namespace import. */
	design: Map<string, string>;
	/** Local name → the page file it imports ('Stay' → 'lib/Stay.svelte'). */
	locals: Map<string, string>;
	/** The snippets the file defines, by name. */
	snippets: Map<string, Fragment>;
}

/** Where the walk is on the rendered page. */
interface Ctx {
	file: Parsed;
	/** The Section being rendered, with its primary actions so far; null outside any. */
	section: { primaries: number } | null;
	inPage: boolean;
	/** Inside an {#each} since the Section began: what is here renders more than once. */
	repeated: boolean;
	/** What the page component being rendered was given (its children and snippet props), and by whom. */
	slot: { from: Ctx; nodes: Node[] } | null;
	depth: number;
}

// Deep enough for any page; stops recursive components and snippets.
const MAX_DEPTH = 16;
const ALLOWED_IMPORT = /^(?:design(?:\/.*)?|svelte(?:\/.*)?|phosphor-svelte\/lib\/\w+(?:\.svelte)?|\.{1,2}\/.*)$/;
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u;
const HEX = /#[0-9a-f]{3,8}\b/i;
// Relative colours (`rgb(from var(--m-ink) …)`) start from a token, so they pass.
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\((?!\s*from\b)/i;
// A whole string that is a colour, as a script value ('#e86a33', 'hsl(20 80% 55%)').
const COLOR_VALUE = /^\s*(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\((?!\s*from\b)[^)]*\))\s*$/i;
// The CSS named colours; `transparent` and `currentColor` carry no colour of their own.
const NAMED =
	/\b(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)\b/i;
// A family named in the `font` shorthand: quoted, listed, or generic.
const FONT_FAMILY = /["',]|\b(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z]+|emoji|math)\b/i;
const PAINT_ATTRIBUTES = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color']);
const IMAGE_URL =
	/^https?:\/\/(?:\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:[?#]\S*)?|(?:images\.unsplash\.com|source\.unsplash\.com|picsum\.photos|placehold\.co|via\.placeholder\.com|loremflickr\.com)\b\S*)$/i;
const ELEMENTS = new Set(['RegularElement', 'SvelteElement', 'Component', 'SvelteComponent']);
// Structure the page is made of, rather than content in it.
const FRAME = new Set(['Theme', 'Canvas']);

/** The value with its tokens and references taken out: `var(…)`, nested too, and `url(…)`. */
function withoutTokens(value: string): string {
	let v = value;
	for (let prev = ''; v !== prev; ) {
		prev = v;
		v = v.replace(/\b(?:var|url)\([^()]*\)/g, '');
	}
	return v;
}

/** A CSS value carries a colour of its own rather than a token. */
function hasColorLiteral(value: string): boolean {
	const v = withoutTokens(value);
	return HEX.test(v) || COLOR_FUNCTION.test(v) || NAMED.test(v);
}

/** The declarations of a style attribute. */
function inlineDeclarations(css: string): { prop: string; value: string }[] {
	return css
		.split(';')
		.map((d) => d.split(/:(.*)/s))
		.filter((parts) => parts.length > 1 && parts[0].trim())
		.map(([prop, value]) => ({ prop: prop.trim(), value }));
}

/** The static text of an attribute (expressions left out), or null when it has none. */
function attributeText(attr: Attribute): string | null {
	if (attr.value === undefined || attr.value === true) return null;
	const parts = Array.isArray(attr.value) ? attr.value : [attr.value];
	return parts.map((p) => (p.type === 'Text' ? (p.data ?? '') : '')).join('') || null;
}

/** `primary`, `primary={true}` or `primary={cond}`, but not `primary={false}`. */
function isPrimary(node: Node): boolean {
	const attr = node.attributes?.find((a) => a.type === 'Attribute' && a.name === 'primary');
	if (!attr) return false;
	const parts = attr.value === undefined || attr.value === true ? [] : Array.isArray(attr.value) ? attr.value : [attr.value];
	const only = parts.length === 1 ? parts[0].expression : undefined;
	return !(only?.type === 'Literal' && only.value === false);
}

/** The snippet a render tag calls: `{@render name()}` or `{@render name?.()}`. */
function calleeName(expression: Expression | undefined): string | null {
	const call = expression?.type === 'ChainExpression' ? expression.expression : expression;
	return call?.callee?.type === 'Identifier' ? (call.callee.name ?? null) : null;
}

/** Every node of a tree with a `type`, once. */
function visit(node: unknown, fn: (n: Visited) => void, seen = new WeakSet<object>()): void {
	if (!node || typeof node !== 'object' || seen.has(node)) return;
	seen.add(node);
	if (Array.isArray(node)) {
		for (const n of node) visit(n, fn, seen);
		return;
	}
	if (typeof (node as Visited).type === 'string') fn(node as Visited);
	for (const value of Object.values(node)) visit(value, fn, seen);
}

/** The source as the compiler can parse it: scripts and style sheets wrapped in their tag. */
function asComponent(name: string, source: string): string | null {
	if (name.endsWith('.svelte')) return source;
	if (/\.(?:js|mjs)$/.test(name)) return `<script module>${source}\n</script>`;
	if (name.endsWith('.ts')) return `<script module lang="ts">${source}\n</script>`;
	if (name.endsWith('.css')) return `<style>${source}\n</style>`;
	return null;
}

class Checker {
	violations: DesignViolation[] = [];
	files = new Map<string, Parsed>();
	canvases = 0;
	pages = 0;

	report(rule: DesignRule, file: string, message: string): void {
		// One finding per rule and file is enough for the model to act on.
		if (!this.violations.some((v) => v.rule === rule && v.file === file)) this.violations.push({ rule, file, message });
	}

	// ------------------------------------------------------------ each file

	file(name: string, source: string): void {
		const component = asComponent(name, source);
		if (component === null) return;
		let ast: Root;
		try {
			ast = parse(component, { modern: true }) as unknown as Root;
		} catch (err) {
			const reason = err instanceof Error ? err.message.split('\n')[0] : 'syntax error';
			return this.report('unparsable', name, `${name} does not parse: ${reason}`);
		}
		const parsed: Parsed = { name, ast, design: new Map(), locals: new Map(), snippets: new Map() };
		this.files.set(name, parsed);

		const emoji = source.match(EMOJI);
		if (emoji) this.report('emoji', name, `${name} uses emoji (${emoji[0]}); use Phosphor icons.`);

		for (const imp of [ast.instance, ast.module].flatMap((s) => s?.content.body ?? [])) {
			if (imp.type === 'ImportDeclaration') this.imports(parsed, imp);
		}

		visit(ast, (n) => {
			if (n.type === 'Literal' && typeof n.value === 'string') this.literal(name, n.value);
			else if (n.type === 'TemplateElement') this.template(name, (n.value as { raw: string }).raw);
			else if (n.type === 'Declaration') this.declaration(name, String(n.property), String(n.value));
			else if (n.type === 'Atrule' && (n.name === 'font-face' || n.name === 'import')) {
				this.report('raw_font', name, `${name} loads a font or style sheet of its own (@${n.name}); the type comes from the design system.`);
			} else if (n.type === 'ImportExpression') {
				const from = (n.source as Expression | undefined)?.value;
				if (typeof from !== 'string' || !ALLOWED_IMPORT.test(from)) this.foreign(name, String(from ?? 'an expression'));
			} else if (n.type === 'SnippetBlock') {
				const id = (n.expression as Expression | undefined)?.name;
				if (id) parsed.snippets.set(id, n.body as Fragment);
			} else if (ELEMENTS.has(n.type)) {
				for (const attr of (n.attributes as Attribute[] | undefined) ?? []) this.attribute(name, n as unknown as Node, attr);
			}
		});
	}

	imports(file: Parsed, imp: Import): void {
		const from = String(imp.source?.value ?? '');
		if (!ALLOWED_IMPORT.test(from)) return this.foreign(file.name, from);
		for (const s of imp.specifiers ?? []) {
			const local = s.local.name;
			if (from === 'design') {
				const kind = s.type === 'ImportSpecifier' ? (s.imported?.name ?? s.imported?.value) : s.type === 'ImportNamespaceSpecifier' ? '*' : undefined;
				if (kind) file.design.set(local, kind);
			} else if (from.startsWith('design/') && s.type === 'ImportDefaultSpecifier') {
				file.design.set(local, posix.basename(from, '.svelte'));
			} else if (from.startsWith('.') && from.endsWith('.svelte') && s.type === 'ImportDefaultSpecifier') {
				file.locals.set(local, posix.join(posix.dirname(file.name), from));
			}
		}
	}

	foreign(file: string, from: string): void {
		this.report('foreign_import', file, `${file} imports '${from}': only 'design', 'svelte', Phosphor icons (phosphor-svelte/lib/…) and the page's own files.`);
	}

	declaration(file: string, prop: string, value: string): void {
		const p = prop.trim().toLowerCase();
		const family = withoutTokens(value).trim();
		if (p === 'font-family' ? family !== '' && !/^(?:inherit|initial|unset)$/i.test(family) : p === 'font' && FONT_FAMILY.test(family)) {
			this.report('raw_font', file, `${file} sets its own font (${p}: ${value.trim()}); the type comes from the design system.`);
		}
		// A mask only uses a colour's alpha.
		if (!/^(?:-webkit-)?mask/.test(p) && hasColorLiteral(value)) {
			this.report('raw_color', file, `${file} uses a colour of its own (${p}: ${value.trim().slice(0, 48)}); use the colour tokens.`);
		}
		if (/url\(\s*['"]?https?:/i.test(value)) {
			this.report('external_image', file, `${file} loads an image from the web (${p}); use <Art> or an inline SVG.`);
		}
	}

	literal(file: string, value: string): void {
		if (COLOR_VALUE.test(value)) {
			this.report('raw_color', file, `${file} has a colour of its own in its code ('${value.trim()}'); use the colour tokens, as var(--m-…).`);
		}
		if (IMAGE_URL.test(value.trim())) {
			this.report('external_image', file, `${file} loads an image from the web (${value.trim().slice(0, 60)}); use <Art> or an inline SVG.`);
		}
	}

	template(file: string, raw: string): void {
		if (COLOR_FUNCTION.test(raw)) {
			this.report('raw_color', file, `${file} builds a colour of its own in its code (${raw.trim().slice(0, 40)}…); use the colour tokens.`);
		}
	}

	attribute(file: string, element: Node, attr: Attribute): void {
		const text = attributeText(attr);
		if (!text) return;
		if (attr.type === 'StyleDirective') return this.declaration(file, attr.name, text);
		if (attr.type !== 'Attribute') return;
		const name = attr.name.toLowerCase();
		const tag = element.name ?? '';
		if (name === 'style') {
			for (const d of inlineDeclarations(text)) this.declaration(file, d.prop, d.value);
		} else if (PAINT_ATTRIBUTES.has(name) && hasColorLiteral(text)) {
			this.report('raw_color', file, `${file} paints with a colour of its own (${name}="${text}"); use the colour tokens, as ${name}="var(--m-…)".`);
		} else if (/^\s*https?:/i.test(text) && isImageSource(element, tag, name)) {
			this.report('external_image', file, `${file} loads an image from the web (<${tag} ${name}>); use <Art> or an inline SVG.`);
		} else if (tag === 'link' && name === 'href' && /^\s*https?:/i.test(text)) {
			this.report('raw_font', file, `${file} loads a font or style sheet from the web; the type comes from the design system.`);
		}
	}

	// ------------------------------------------------------- the rendered page

	/** Walks the page as it renders, from App.svelte. */
	page(): void {
		const app = this.files.get('App.svelte');
		if (!app) return;
		this.render(app.ast.fragment.nodes, { file: app, section: null, inPage: false, repeated: false, slot: null, depth: 0 });
		if (this.canvases !== 1) {
			this.report('canvas_count', 'App.svelte', `The page renders ${this.canvases} <Canvas> from 'design'; it is wrapped in exactly one.`);
		}
		if (this.pages !== 1) {
			this.report('page_count', 'App.svelte', `The page renders ${this.pages} <Page> from 'design'; there is exactly one, inside the <Canvas>.`);
		}
	}

	render(nodes: Node[], ctx: Ctx): void {
		if (ctx.depth > MAX_DEPTH) return;
		for (const node of nodes) this.node(node, ctx);
	}

	node(node: Node, ctx: Ctx): void {
		switch (node.type) {
			case 'Text':
				if (node.data?.trim()) this.outside(ctx, 'text');
				return;
			case 'ExpressionTag':
			case 'HtmlTag':
				return this.outside(ctx, 'text');
			case 'RegularElement':
			case 'SvelteElement':
				this.outside(ctx, `<${node.name}>`);
				return this.render(node.fragment?.nodes ?? [], ctx);
			case 'Component':
			case 'SvelteComponent':
			case 'SvelteSelf':
				return this.component(node, ctx);
			case 'RenderTag':
				return this.renderTag(node, ctx);
			case 'IfBlock':
				return this.branches(ctx, [
					[node.consequent, ctx],
					[node.alternate, ctx]
				]);
			case 'AwaitBlock':
				return this.branches(ctx, [
					[node.pending, ctx],
					[node.then, ctx],
					[node.catch, ctx]
				]);
			case 'EachBlock':
				return this.branches(ctx, [
					[node.body, { ...ctx, repeated: true }],
					[node.fallback, ctx]
				]);
			case 'KeyBlock':
			case 'SvelteBoundary':
				return this.render(node.fragment?.nodes ?? [], ctx);
			default:
				// Snippets render where they are rendered; the head, window, comments and tags
				// put nothing on the page.
				return;
		}
	}

	/** Children given to a design component render inside it, snippet props included. */
	children(nodes: Node[], ctx: Ctx): void {
		for (const node of nodes) {
			if (node.type === 'SnippetBlock') this.render(node.body?.nodes ?? [], ctx);
			else this.node(node, ctx);
		}
	}

	/** Only one branch renders at a time: a Section's primaries are those of its fullest branch. */
	branches(ctx: Ctx, list: [Fragment | null | undefined, Ctx][]): void {
		const start = ctx.section?.primaries ?? 0;
		let most = start;
		for (const [fragment, branch] of list) {
			if (!fragment) continue;
			if (ctx.section) ctx.section.primaries = start;
			this.render(fragment.nodes, branch);
			most = Math.max(most, ctx.section?.primaries ?? 0);
		}
		if (ctx.section) ctx.section.primaries = most;
	}

	component(node: Node, ctx: Ctx): void {
		const name = node.name ?? '';
		const children = node.fragment?.nodes ?? [];
		const [ns, member] = name.split('.');
		const design = member && ctx.file.design.get(ns) === '*' ? member : ctx.file.design.get(name);
		if (design) return this.design(design, node, children, ctx);

		const target = ctx.file.locals.get(name);
		if (target) {
			// One of the page's own components: render it here, with what it was given. A file
			// that does not parse is reported already; a missing one fails in the bundler.
			const file = this.files.get(target);
			if (file) this.render(file.ast.fragment.nodes, { ...ctx, file, slot: { from: ctx, nodes: children }, depth: ctx.depth + 1 });
			return;
		}
		// An icon, or anything else: content like any other.
		this.outside(ctx, `<${name}>`);
		this.children(children, ctx);
	}

	design(design: string, node: Node, children: Node[], ctx: Ctx): void {
		const file = ctx.file.name;
		if (FRAME.has(design)) {
			if (design === 'Canvas') this.canvases++;
			return this.children(children, ctx);
		}
		if (design === 'Page') {
			this.pages++;
			return this.children(children, { ...ctx, inPage: true, section: null, repeated: false });
		}
		if (design === 'Section') {
			if (ctx.section) this.report('nested_section', file, `${file} puts a <Section> inside another; no cards inside cards.`);
			else if (!ctx.inPage) this.report('section_outside_page', file, `${file} renders a <Section> outside the <Page>; every section goes inside it.`);
			return this.children(children, { ...ctx, section: { primaries: 0 }, repeated: false });
		}
		this.outside(ctx, `<${design}>`);
		if (design === 'Action' && ctx.section && isPrimary(node)) {
			ctx.section.primaries += ctx.repeated ? 2 : 1;
			if (ctx.section.primaries > 1) {
				this.report('extra_primary', file, `${file} gives a Section more than one primary <Action>${ctx.repeated ? ' (one inside an {#each})' : ''}; at most one per section.`);
			}
		}
		this.children(children, ctx);
	}

	renderTag(node: Node, ctx: Ctx): void {
		const name = calleeName(node.expression);
		if (!name) return;
		const slot = ctx.slot;
		if (slot) {
			// What the caller passed renders here, but is the caller's code.
			const from: Ctx = { ...ctx, file: slot.from.file, slot: slot.from.slot, depth: ctx.depth + 1 };
			if (name === 'children') return this.render(slot.nodes.filter((n) => n.type !== 'SnippetBlock'), from);
			const passed = slot.nodes.find((n) => n.type === 'SnippetBlock' && n.expression?.name === name);
			if (passed) return this.render(passed.body?.nodes ?? [], from);
		}
		const own = ctx.file.snippets.get(name);
		if (own) this.render(own.nodes, { ...ctx, depth: ctx.depth + 1 });
	}

	outside(ctx: Ctx, what: string): void {
		if (!ctx.section) {
			this.report('content_outside_section', ctx.file.name, `${ctx.file.name} renders ${what} outside a <Section>; everything on the page sits in a section.`);
		}
	}
}

function isImageSource(element: Node, tag: string, attr: string): boolean {
	if (element.type === 'Component') return attr === 'src';
	if (tag === 'img' || tag === 'source') return attr === 'src' || attr === 'srcset';
	return tag === 'image' && (attr === 'href' || attr === 'xlink:href');
}

/** Checks a page's files (the design system is never among them). */
export function checkDesign(files: PageFileInput[]): DesignViolation[] {
	const checker = new Checker();
	if (!files.some((f) => f.name === 'App.svelte')) {
		checker.report('missing_app', 'App.svelte', 'There is no App.svelte; the page starts there.');
	}
	for (const f of files) checker.file(f.name, f.contents);
	checker.page();
	return checker.violations;
}

/** The violations as the repair round sends them to the model. */
export function designReport(violations: DesignViolation[]): string {
	return violations.map((v) => `- [${v.rule}] ${v.message}`).join('\n');
}
