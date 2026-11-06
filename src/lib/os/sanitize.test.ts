import { describe, expect, it } from 'vitest';
import { isFatal, parseModelJson, sanitizeAssembly, type IssueCode } from './sanitize';
import { LIMITS, type ModuleSpec } from './spec';

// Pins the guardrail: every rule the OS relies on to stay on-design has a test here.

function module(overrides: Record<string, unknown> = {}) {
	return {
		title: 'Kettle & Kite',
		source: 'Location',
		kind: 'location',
		blocks: [{ type: 'title', text: 'Kettle & Kite' }],
		actions: [],
		...overrides
	};
}

function one(raw: unknown, mode: 'space' | 'flow' | 'module' = 'flow') {
	const { assembly, issues } = sanitizeAssembly(raw, mode, 't');
	return { module: assembly.flows[0]?.[0] as ModuleSpec | undefined, assembly, issues, codes: issues.map((i) => i.code) };
}

function codes(list: { code: IssueCode }[]) {
	return list.map((i) => i.code);
}

describe('parseModelJson', () => {
	it('reads JSON wrapped in code fences and prose', () => {
		expect(parseModelJson('Sure!\n```json\n{"flows":[]}\n```')).toEqual({ flows: [] });
	});

	it('returns undefined for non-JSON', () => {
		expect(parseModelJson('no braces here')).toBeUndefined();
		expect(parseModelJson('{ broken')).toBeUndefined();
	});
});

describe('sanitizeAssembly — structure', () => {
	it('keeps a valid module unchanged apart from id and defaults', () => {
		const { module: m, issues } = one({ flows: [[module()]] });
		expect(issues).toEqual([]);
		expect(m).toEqual({
			id: 't-0',
			title: 'Kettle & Kite',
			source: 'Location',
			kind: 'location',
			blocks: [{ type: 'title', text: 'Kettle & Kite' }],
			actions: []
		});
	});

	it('treats non-objects and empty flows as fatal', () => {
		expect(isFatal(sanitizeAssembly(undefined, 'flow', 't').issues)).toBe(true);
		expect(isFatal(sanitizeAssembly({ flows: [] }, 'flow', 't').issues)).toBe(true);
		expect(codes(sanitizeAssembly({ flows: [] }, 'flow', 't').issues)).toEqual(['no_flows']);
	});

	it('caps flows and modules per mode', () => {
		const flows = [[module(), module(), module(), module()], [module()], [module()]];
		const space = sanitizeAssembly({ title: 'Coffee', flows }, 'space', 't');
		expect(space.assembly.flows.map((f) => f.length)).toEqual([LIMITS.modulesPerFlow, 1]);
		expect(codes(space.issues)).toEqual(['too_many_modules', 'too_many_flows']);

		const single = sanitizeAssembly({ flows }, 'module', 't');
		expect(single.assembly.flows).toHaveLength(1);
		expect(single.assembly.flows[0]).toHaveLength(1);
	});

	it('only keeps a title for new spaces', () => {
		expect(sanitizeAssembly({ title: 'Coffee', flows: [[module()]] }, 'space', 't').assembly.title).toBe('Coffee');
		expect(sanitizeAssembly({ title: 'Coffee', flows: [[module()]] }, 'flow', 't').assembly.title).toBeNull();
	});

	it('accepts a flat module list as single-module flows', () => {
		const { assembly } = sanitizeAssembly({ flows: [module()] }, 'flow', 't');
		expect(assembly.flows).toHaveLength(1);
	});

	it('drops modules without a title or without usable blocks', () => {
		const result = one({ flows: [[module({ title: '' }), module({ blocks: [{ type: 'html', html: '<b>' }] })]] });
		expect(result.assembly.flows).toEqual([]);
		expect(result.codes).toEqual(['module_without_title', 'unknown_block_type', 'module_without_blocks', 'no_flows']);
	});
});

describe('sanitizeAssembly — vocabulary', () => {
	it('falls back to the generic kind and drops unknown icons', () => {
		const { module: m, codes: c } = one({ flows: [[module({ kind: 'twitter', icon: 'rocket' })]] });
		expect(m?.kind).toBe('generic');
		expect(m?.icon).toBeUndefined();
		expect(c).toEqual(['unknown_kind', 'unknown_icon']);
	});

	it('drops unknown block types and unknown fields', () => {
		const { module: m, codes: c } = one({
			flows: [[module({ blocks: [{ type: 'text', text: 'Hi', style: 'color: red' }, { type: 'iframe', src: 'x' }] })]]
		});
		expect(m?.blocks).toEqual([{ type: 'text', text: 'Hi' }]);
		expect(c).toEqual(['unknown_block_type']);
	});

	it('normalizes art to known kinds and tones', () => {
		const { module: m } = one({
			flows: [[module({ blocks: [{ type: 'art', art: { kind: 'hologram', tone: '#ff00ff', initials: 'mara' } }] })]]
		});
		expect(m?.blocks[0]).toEqual({ type: 'art', art: { kind: 'product', tone: 'neutral', initials: 'MAR' } });
	});

	it('normalizes message senders to "me" or initials', () => {
		const { module: m } = one({
			flows: [
				[
					module({
						blocks: [
							{ type: 'message', text: 'Hey', from: 'Me' },
							{ type: 'message', text: 'Yo', from: 'ml' },
							{ type: 'message', text: 'Hi', from: 'Mara Ellison' },
							{ type: 'message', text: 'Sure', from: 'ME' }
						]
					})
				]
			]
		});
		expect(m?.blocks).toEqual([
			{ type: 'message', text: 'Hey', from: 'me' },
			{ type: 'message', text: 'Yo', from: 'ML' },
			{ type: 'message', text: 'Hi', from: 'ME' },
			{ type: 'message', text: 'Sure', from: 'ME' }
		]);
	});

	it('caps text length and reports it', () => {
		const { module: m, codes: c } = one({ flows: [[module({ title: 'x'.repeat(200) })]] });
		expect(m?.title).toHaveLength(LIMITS.title);
		expect(m?.title.endsWith('…')).toBe(true);
		expect(c).toEqual(['text_truncated']);
	});

	it('caps list rows and accepts plain-string rows', () => {
		const rows = Array.from({ length: 10 }, (_, i) => `Row ${i}`);
		const { module: m } = one({ flows: [[module({ blocks: [{ type: 'list', rows }] })]] });
		expect(m?.blocks[0]).toMatchObject({ type: 'list', numbered: false });
		expect((m?.blocks[0] as { rows: unknown[] }).rows).toHaveLength(LIMITS.rowsPerList);
	});
});

describe('sanitizeAssembly — layout rules', () => {
	it('only allows a map as the first block', () => {
		const { module: m, codes: c } = one({
			flows: [[module({ blocks: [{ type: 'title', text: 'Cafe' }, { type: 'map', label: 'Cafe' }] })]]
		});
		expect(m?.blocks.map((b) => b.type)).toEqual(['title']);
		expect(c).toEqual(['map_not_first']);
	});

	it('only allows a reply bar as the last block', () => {
		const { module: m, codes: c } = one({
			flows: [
				[
					module({
						blocks: [
							{ type: 'message', text: 'Hi', from: 'ML' },
							{ type: 'reply' },
							{ type: 'message', text: 'Again', from: 'ML' }
						]
					})
				]
			]
		});
		expect(m?.blocks.map((b) => b.type)).toEqual(['message', 'message']);
		expect(c).toEqual(['reply_not_last']);
	});

	it('caps blocks per module', () => {
		const blocks = Array.from({ length: 12 }, () => ({ type: 'text', text: 'Line' }));
		const { module: m } = one({ flows: [[module({ blocks })]] });
		expect(m?.blocks).toHaveLength(LIMITS.blocksPerModule);
	});
});

describe('sanitizeAssembly — actions', () => {
	it('keeps at most one primary action, counting media actions first', () => {
		const { module: m, codes: c } = one({
			flows: [
				[
					module({
						blocks: [
							{
								type: 'media',
								title: 'Low Tide',
								art: { kind: 'album' },
								actions: [{ label: 'Play', primary: true, effect: 'confirm' }]
							}
						],
						actions: [
							{ label: 'Save', primary: true, effect: 'confirm' },
							{ label: 'Share', primary: true, effect: 'confirm' }
						]
					})
				]
			]
		});
		const media = m?.blocks[0] as { actions: { primary?: boolean }[] };
		expect(media.actions[0].primary).toBe(true);
		expect(m?.actions.map((a) => a.primary ?? false)).toEqual([false, false]);
		expect(c).toEqual(['extra_primary', 'extra_primary']);
	});

	it('infers the effect: an intent opens, anything else confirms', () => {
		const { module: m } = one({
			flows: [[module({ actions: [{ label: 'Get directions', intent: 'Directions to the cafe' }, { label: 'Save' }] })]]
		});
		expect(m?.actions).toEqual([
			{ label: 'Get directions', effect: 'open', intent: 'Directions to the cafe' },
			{ label: 'Save', effect: 'confirm', done: 'Done' }
		]);
	});

	it('falls back to the label as intent for open actions', () => {
		const { module: m } = one({ flows: [[module({ actions: [{ label: 'See menu', effect: 'open' }] })]] });
		expect(m?.actions[0]).toEqual({ label: 'See menu', effect: 'open', intent: 'See menu' });
	});

	it('drops actions without a label and caps the count', () => {
		const actions = [{ label: '' }, ...Array.from({ length: 6 }, (_, i) => ({ label: `Do ${i}` }))];
		const { module: m, codes: c } = one({ flows: [[module({ actions })]] });
		expect(m?.actions).toHaveLength(LIMITS.actionsPerModule);
		expect(c).toEqual(['invalid_action', 'too_many_actions', 'too_many_actions']);
	});
});
