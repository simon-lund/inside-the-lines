import { describe, expect, it } from 'vitest';
import { checkDesign, type DesignRule } from './design-check';
import { SEED_VIEWS } from './mercury/examples';

// Pins the studio guardrail: what passes, and what each rule catches.

const app = (body: string, imports = "import { Canvas, Module, Action } from 'mercury';") =>
	`<script>\n\t${imports}\n</script>\n\n${body}\n`;

const rules = (files: { name: string; contents: string }[]): DesignRule[] => checkDesign(files).map((v) => v.rule);

const ok = app(`<Canvas>
	<Module title="Kettle & Kite" source="Location">
		<h2 class="m-title">Kettle & Kite</h2>
		{#snippet actions()}
			<Action primary label="Get directions" />
			<Action label="See details" />
		{/snippet}
	</Module>
</Canvas>`);

describe('checkDesign', () => {
	it('passes a view built from the design system', () => {
		expect(rules([{ name: 'App.svelte', contents: ok }])).toEqual([]);
	});

	it('passes every shipped example', () => {
		for (const view of SEED_VIEWS) {
			expect(checkDesign(view.files), view.id).toEqual([]);
		}
	});

	it('requires the design system import', () => {
		const contents = app('<Canvas><Module title="x">y</Module></Canvas>', "import Card from './Card.svelte';");
		expect(rules([{ name: 'App.svelte', contents }])).toContain('no_design_system_import');
	});

	it('requires exactly one Canvas', () => {
		expect(rules([{ name: 'App.svelte', contents: app('<Module title="x">y</Module>') }])).toEqual(['canvas_count']);
		const two = app('<Canvas><Module title="x">y</Module></Canvas><Canvas></Canvas>');
		expect(rules([{ name: 'App.svelte', contents: two }])).toEqual(['canvas_count']);
	});

	it('requires at least one Module', () => {
		expect(rules([{ name: 'App.svelte', contents: app('<Canvas><div class="card">x</div></Canvas>') }])).toEqual([
			'no_module'
		]);
	});

	it('rejects nested modules', () => {
		const contents = app('<Canvas><Module title="a"><Module title="b">x</Module></Module></Canvas>');
		expect(rules([{ name: 'App.svelte', contents }])).toEqual(['nested_module']);
	});

	it('allows one primary action per module, across modules', () => {
		const twoModules = app(`<Canvas>
			<Module title="a">{#snippet actions()}<Action primary label="Go" />{/snippet}</Module>
			<Module title="b">{#snippet actions()}<Action primary label="Go" />{/snippet}</Module>
		</Canvas>`);
		expect(rules([{ name: 'App.svelte', contents: twoModules }])).toEqual([]);

		const twoPrimaries = app(
			'<Canvas><Module title="a">{#snippet actions()}<Action primary label="Go" /><Action primary label="Stop" />{/snippet}</Module></Canvas>'
		);
		expect(rules([{ name: 'App.svelte', contents: twoPrimaries }])).toEqual(['extra_primary']);
	});

	it('rejects custom colours in markup and styles, but not inside SVG artwork', () => {
		const tailwind = app('<Canvas><Module title="a"><p class="text-rose-500">x</p></Module></Canvas>');
		const arbitrary = app('<Canvas><Module title="a"><p class="bg-[#ff0000]">x</p></Module></Canvas>');
		const inline = app('<Canvas><Module title="a"><p style="color: #f00">x</p></Module></Canvas>');
		const style = `${app('<Canvas><Module title="a"><p class="x">x</p></Module></Canvas>')}<style>.x { color: rgb(255, 0, 0); }</style>`;
		const svg = app('<Canvas><Module title="a"><svg><rect fill="#ff0000" /></svg><p class="border-black/10">x</p></Module></Canvas>');

		for (const contents of [tailwind, arbitrary, inline, style]) {
			expect(rules([{ name: 'App.svelte', contents }])).toEqual(['raw_color']);
		}
		expect(rules([{ name: 'App.svelte', contents: svg }])).toEqual([]);
	});

	it('rejects emoji and external images', () => {
		const emoji = app('<Canvas><Module title="a"><p>Coffee ☕</p></Module></Canvas>');
		const img = app('<Canvas><Module title="a"><img src="https://example.com/x.png" alt="" /></Module></Canvas>');
		expect(rules([{ name: 'App.svelte', contents: emoji }])).toEqual(['emoji']);
		expect(rules([{ name: 'App.svelte', contents: img }])).toEqual(['external_image']);
	});

	it('checks component files, not just App.svelte', () => {
		const component = {
			name: 'lib/Place.svelte',
			contents: '<script>import { Module } from "mercury";</script><Module title="a"><p class="text-blue-600">x</p></Module>'
		};
		const appFile = { name: 'App.svelte', contents: app("<Canvas><Place /></Canvas>", "import { Canvas } from 'mercury';\n\timport Place from './lib/Place.svelte';") };
		expect(rules([appFile, component])).toEqual(['raw_color']);
	});
});
