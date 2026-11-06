import { describe, expect, it } from 'vitest';
import { FIXTURE_PAGE } from '$lib/pages/fixture';
import { checkDesign, designReport, type DesignRule } from './design-check';

// Pins the guideline: every rule has a test that it fires, and one that the nearest legitimate
// pattern passes. A false positive costs a repair round, so the passes matter as much.

type Files = Record<string, string>;

const APP = `<script>
	import { Canvas, Page } from 'design';
	import Part from './lib/Part.svelte';
</script>

<Canvas>
	<Page title="Picnic">
		<Part />
	</Page>
</Canvas>
`;

/** A page of App.svelte and one section component, `lib/Part.svelte`, with what it renders. */
function part(markup: string, script = "import { Section, Action, Summary } from 'design';", files: Files = {}): Files {
	return { 'App.svelte': APP, 'lib/Part.svelte': `<script>\n\t${script}\n</script>\n\n${markup}\n`, ...files };
}

/** A Section in lib/Part.svelte holding the markup. */
const inSection = (markup: string, script?: string) => part(`<Section title="Food">\n${markup}\n</Section>`, script);

/** A Section in lib/Part.svelte with a paragraph styled by the rule. */
const styled = (rule: string) => part(`<Section title="Food"><p class="a">x</p></Section>\n<style>.a:not(.red) { ${rule}; }</style>`);

function rules(files: Files): DesignRule[] {
	return checkDesign(Object.entries(files).map(([name, contents]) => ({ name, contents }))).map((v) => v.rule);
}

describe('checkDesign', () => {
	it('passes the hand-written fixture page', () => {
		expect(checkDesign(FIXTURE_PAGE)).toEqual([]);
	});

	it('passes a plain section', () => {
		expect(rules(inSection('<p class="m-text">Sandwiches for four.</p>'))).toEqual([]);
	});

	it('reports a file that does not parse, and nothing it cannot read', () => {
		expect(rules(part('<Section title="Food">\n<p>open'))).toEqual(['unparsable']);
		expect(rules({ ...part(''), 'lib/data.js': 'export const x = ;' })).toContain('unparsable');
	});

	it('reports a page without App.svelte', () => {
		expect(rules({ 'lib/Part.svelte': '<p>hi</p>' })).toEqual(['missing_app']);
	});

	describe('structure', () => {
		it('wants exactly one Canvas from design', () => {
			const noCanvas = APP.replace(/<\/?Canvas>/g, '');
			expect(rules({ ...inSection(''), 'App.svelte': noCanvas })).toEqual(['canvas_count']);
			// A component of the page's own named Canvas is not the design system's.
			const own = APP.replace("import Part from './lib/Part.svelte';", "import Part from './lib/Part.svelte';\n\timport Canvas from './lib/Canvas.svelte';").replace("{ Canvas, Page }", '{ Page }');
			expect(rules({ ...inSection(''), 'App.svelte': own, 'lib/Canvas.svelte': '{@render children?.()}' })).toContain('canvas_count');
		});

		it('wants exactly one Page', () => {
			const two = APP.replace('</Page>', '</Page>\n\t<Page title="Again"><Part /></Page>');
			expect(rules({ ...inSection(''), 'App.svelte': two })).toEqual(['page_count']);
		});

		it('counts the design system through aliases, namespaces and deep imports', () => {
			const aliased = APP.replace('{ Canvas, Page }', '{ Canvas as Sheet, Page }').replace(/Canvas>/g, 'Sheet>');
			expect(rules({ ...inSection(''), 'App.svelte': aliased })).toEqual([]);
			const ns = `<script>\n\timport * as D from 'design';\n\timport Part from './lib/Part.svelte';\n</script>\n<D.Canvas><D.Page title="P"><Part /></D.Page></D.Canvas>`;
			expect(rules({ ...inSection(''), 'App.svelte': ns })).toEqual([]);
			expect(rules(part('<Card title="Food"><p>x</p></Card>', "import Card from 'design/Section.svelte';"))).toEqual([]);
		});

		it('wants every Section inside the Page', () => {
			const beside = APP.replace('</Canvas>', '\t<Part />\n</Canvas>');
			expect(rules({ ...inSection(''), 'App.svelte': beside })).toEqual(['section_outside_page']);
		});

		it('reports a Section inside a Section, also across components', () => {
			expect(rules(inSection('<Section title="Inner"><p>x</p></Section>'))).toEqual(['nested_section']);
			const inner = { 'lib/Inner.svelte': `<script>import { Section } from 'design';</script>\n<Section title="Inner" />` };
			expect(rules({ ...inSection('<Inner />', "import { Section } from 'design';\n\timport Inner from './Inner.svelte';"), ...inner })).toEqual([
				'nested_section'
			]);
		});

		it('reports content outside a Section', () => {
			expect(rules(part('<h2>Food</h2>'))).toEqual(['content_outside_section']);
			expect(rules(part('Just text'))).toEqual(['content_outside_section']);
			expect(rules(part('<Summary rows={[]} />'))).toEqual(['content_outside_section']);
			const heading = APP.replace('<Part />', '<h2>Plan</h2>\n\t\t<Part />');
			expect(rules({ ...inSection(''), 'App.svelte': heading })).toEqual(['content_outside_section']);
		});

		it('follows the page into helpers, wrappers and snippets', () => {
			// A helper whose own top level is plain markup, used inside a Section.
			const helper = { 'lib/Timeline.svelte': '<ol class="timeline"><li>9:30</li></ol>' };
			expect(rules({ ...inSection('<Timeline />', "import { Section } from 'design';\n\timport Timeline from './Timeline.svelte';"), ...helper })).toEqual([]);
			// A wrapper that is the Section, given the content as children.
			const card = { 'lib/Card.svelte': "<script>import { Section } from 'design'; let { children } = $props();</script>\n<Section title=\"x\">{@render children?.()}</Section>" };
			expect(rules({ ...part('<Card><p>Inside</p></Card>', "import Card from './Card.svelte';"), ...card })).toEqual([]);
			// A snippet defined at the top level, rendered inside the Section.
			expect(rules(part('{#snippet row(x)}<p>{x}</p>{/snippet}\n<Section title="Food">{@render row(1)}</Section>'))).toEqual([]);
			// Sections from an {#each}.
			expect(rules(part('{#each [1, 2] as n}<Section title="Day {n}"><p>x</p></Section>{/each}'))).toEqual([]);
		});
	});

	describe('primary actions', () => {
		const action = (attrs: string) => `<Action ${attrs} label="Go" />`;

		it('reports two primaries in one Section', () => {
			expect(rules(inSection(action('primary') + action('primary')))).toEqual(['extra_primary']);
		});

		it('reports a primary repeated by an {#each}', () => {
			expect(rules(inSection(`{#each [1, 2] as n}${action('primary')}{/each}`))).toEqual(['extra_primary']);
		});

		it('allows one per branch, one per Section, and primary={false}', () => {
			expect(rules(inSection(`{#if a}${action('primary')}{:else if b}${action('primary')}{:else}${action('')}{/if}`))).toEqual([]);
			expect(rules(part(`<Section title="A">${action('primary')}</Section><Section title="B">${action('primary')}</Section>`))).toEqual([]);
			expect(rules(inSection(action('primary') + action('primary={false}')))).toEqual([]);
			expect(rules(inSection(`{#snippet actions()}${action('primary')}${action('')}{/snippet}`))).toEqual([]);
		});
	});

	describe('colour', () => {
		it('reports colours of its own in styles', () => {
			expect(rules(styled('color: #e86a33'))).toEqual(['raw_color']);
			expect(rules(styled('background: white'))).toEqual(['raw_color']);
			expect(rules(styled('box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)'))).toEqual(['raw_color']);
			expect(rules(styled('--accent: oklch(70% 0.1 40)'))).toEqual(['raw_color']);
		});

		it('reports colours in style attributes, style directives and SVG paint', () => {
			expect(rules(inSection('<p style="color: #333">x</p>'))).toEqual(['raw_color']);
			expect(rules(inSection('<p style:color="red">x</p>'))).toEqual(['raw_color']);
			expect(rules(inSection('<svg><circle r="4" fill="#fff" /></svg>'))).toEqual(['raw_color']);
		});

		it('reports colours in the code', () => {
			expect(rules(inSection('<p style:color={c}>x</p>', "import { Section } from 'design';\n\tconst c = '#e66';"))).toEqual(['raw_color']);
			expect(rules(inSection('<p style:color={c}>x</p>', "import { Section } from 'design';\n\tconst h = 20;\n\tconst c = `hsl(${h} 80% 50%)`;"))).toEqual([
				'raw_color'
			]);
		});

		it('passes tokens, mixes of tokens and colourless values', () => {
			const ok = [
				'color: var(--m-ink-2)',
				'background: color-mix(in oklab, var(--m-clementine) 20%, transparent)',
				'box-shadow: 0 0 0 2px var(--m-accent), var(--m-shadow-line)',
				'border-color: currentColor',
				'background: rgb(from var(--m-ink) r g b / 0.5)',
				'mask-image: linear-gradient(to bottom, transparent, black 40%)',
				'transition: background-color 0.2s'
			];
			for (const d of ok) expect(rules(styled(d)), d).toEqual([]);
			expect(rules(inSection('<svg><path fill="var(--m-tint)" stroke="none" /><rect fill="url(#abc)" /></svg>'))).toEqual([]);
			// Text that looks like a hex code is just text.
			expect(rules(inSection('<p>Order #4821 · the red one</p>'))).toEqual([]);
		});
	});

	it('reports a font of its own, and passes the type tokens', () => {
		expect(rules(styled('font-family: Georgia, serif'))).toEqual(['raw_font']);
		expect(rules(styled('font: 600 14px/1.4 "Inter"'))).toEqual(['raw_font']);
		expect(rules(inSection('<p style="font-family: monospace">x</p>'))).toEqual(['raw_font']);
		expect(rules(styled('font-family: var(--m-font-mono); font: inherit'))).toEqual([]);
	});

	it('reports images from the web, and passes links', () => {
		expect(rules(inSection('<img src="https://images.unsplash.com/photo-1" alt="" />'))).toEqual(['external_image']);
		expect(rules(styled('background: url(https://example.com/a.jpg)'))).toEqual(['external_image']);
		expect(rules(inSection('<img {src} alt="" />', "import { Section } from 'design';\n\tconst src = 'https://picsum.photos/400';"))).toEqual(['external_image']);
		expect(rules(inSection('<a href="https://example.com">Menu</a>'))).toEqual([]);
	});

	it('reports emoji in markup and in data', () => {
		expect(rules(inSection('<p>Picnic 🧺</p>'))).toEqual(['emoji']);
		expect(rules(inSection('<p>{x}</p>', "import { Section } from 'design';\n\tconst x = 'Sun ☀️';"))).toEqual(['emoji']);
		expect(rules(inSection('<p>≈ $40 · 2–3 h ★ ✓</p>'))).toEqual([]);
	});

	it('reports foreign imports, and passes svelte, icons and own files', () => {
		expect(rules(inSection('', "import { Section } from 'design';\n\timport confetti from 'canvas-confetti';"))).toEqual(['foreign_import']);
		expect(rules(inSection('', "import { Section } from 'design';\n\tconst m = import('https://esm.sh/x');"))).toEqual(['foreign_import']);
		const ok = "import { Section } from 'design';\n\timport { fade } from 'svelte/transition';\n\timport Basket from 'phosphor-svelte/lib/Basket';\n\timport { foods } from './foods.js';";
		expect(rules({ ...inSection('<Basket />', ok), 'lib/foods.js': "export const foods = ['Bread'];" })).toEqual([]);
		// A data module with a default export parses too.
		expect(rules({ ...inSection('', "import { Section } from 'design';\n\timport foods from './foods.js';"), 'lib/foods.js': "export default ['Bread'];" })).toEqual([]);
	});

	it('reports each rule once per file', () => {
		const violations = checkDesign([
			{ name: 'App.svelte', contents: APP },
			{ name: 'lib/Part.svelte', contents: "<script>import { Section } from 'design';</script>\n<Section title=\"x\"><p style=\"color: red\">a</p><p style=\"color: blue\">b</p></Section>" }
		]);
		expect(violations).toHaveLength(1);
		expect(designReport(violations)).toMatch(/^- \[raw_color\] lib\/Part\.svelte uses a colour of its own/);
	});
});
