import { describe, expect, it } from 'vitest';
import { isFatal, parseModelJson, sanitizeAssembly, type IssueCode } from './sanitize';
import { LIMITS, type AssemblyMode, type SectionSpec } from './spec';

// Pins the guardrail: every rule the page relies on to stay on-design has a test here.

function section(overrides: Record<string, unknown> = {}) {
	return {
		title: 'Kettle & Kite',
		blocks: [{ type: 'text', text: 'Small-batch coffee on a sunny corner.' }],
		actions: [],
		...overrides
	};
}

function one(raw: unknown, mode: AssemblyMode = 'section') {
	const { assembly, issues } = sanitizeAssembly(raw, mode, 't');
	return {
		section: assembly.sections[0] as SectionSpec | undefined,
		assembly,
		issues,
		codes: issues.map((i) => i.code)
	};
}

const withBlocks = (...blocks: unknown[]) => one({ sections: [section({ blocks })] });

function codes(list: { code: IssueCode }[]) {
	return list.map((i) => i.code);
}

describe('parseModelJson', () => {
	it('reads JSON wrapped in code fences and prose', () => {
		expect(parseModelJson('Sure!\n```json\n{"sections":[]}\n```')).toEqual({ sections: [] });
	});

	it('returns undefined for non-JSON', () => {
		expect(parseModelJson('no braces here')).toBeUndefined();
		expect(parseModelJson('{ broken')).toBeUndefined();
	});
});

describe('sanitizeAssembly — structure', () => {
	it('keeps a valid section unchanged apart from its id', () => {
		const { section: s, issues } = one({ sections: [section({ kicker: 'Coffee shop' })] });
		expect(issues).toEqual([]);
		expect(s).toEqual({
			id: 't-0',
			title: 'Kettle & Kite',
			kicker: 'Coffee shop',
			blocks: [{ type: 'text', text: 'Small-batch coffee on a sunny corner.' }],
			actions: []
		});
	});

	it('treats non-objects and empty pages as fatal', () => {
		expect(isFatal(sanitizeAssembly(undefined, 'section', 't').issues)).toBe(true);
		expect(codes(sanitizeAssembly('not json', 'section', 't').issues)).toEqual(['invalid_json']);
		expect(isFatal(sanitizeAssembly({ sections: [] }, 'section', 't').issues)).toBe(true);
		expect(codes(sanitizeAssembly({ sections: [] }, 'section', 't').issues)).toEqual(['no_sections']);
	});

	it('caps sections: a page, a follow-up, an opened section', () => {
		const sections = Array.from({ length: 8 }, () => section());
		const page = sanitizeAssembly({ title: 'Lisbon', sections }, 'page', 't');
		expect(page.assembly.sections).toHaveLength(LIMITS.sectionsPerPage);
		expect(codes(page.issues)).toEqual(['too_many_sections', 'too_many_sections']);

		expect(sanitizeAssembly({ sections }, 'section', 't').assembly.sections).toHaveLength(LIMITS.sectionsPerFollowUp);
		expect(sanitizeAssembly({ sections }, 'section', 't', true).assembly.sections).toHaveLength(1);
	});

	it('only keeps a title and lede for new pages', () => {
		const raw = { title: 'Lisbon weekend', lede: 'Two nights in Alfama.', sections: [section()] };
		expect(sanitizeAssembly(raw, 'page', 't').assembly).toMatchObject({ title: 'Lisbon weekend', lede: 'Two nights in Alfama.' });
		expect(sanitizeAssembly(raw, 'section', 't').assembly).toMatchObject({ title: null, lede: null });
	});

	it('drops sections that are not objects, have no title or no usable blocks', () => {
		const result = one({
			sections: ['Casa Miradouro', section({ title: '' }), section({ blocks: [{ type: 'html', html: '<b>' }] })]
		});
		expect(result.assembly.sections).toEqual([]);
		expect(result.codes).toEqual([
			'section_not_object',
			'section_without_title',
			'unknown_block_type',
			'section_without_blocks',
			'no_sections'
		]);
	});
});

describe('sanitizeAssembly — vocabulary', () => {
	it('drops unknown action icons, and icons on sections', () => {
		const { section: s, codes: c } = one({
			sections: [section({ icon: 'coffee', actions: [{ label: 'Go', icon: 'rocket' }] })]
		});
		expect(s).not.toHaveProperty('icon');
		expect(s?.actions[0]).toEqual({ label: 'Go', effect: 'confirm', done: 'Done' });
		expect(c).toEqual(['unknown_icon']);
	});

	it('drops unknown block types, messaging included, and unknown fields', () => {
		const { section: s, codes: c } = withBlocks(
			{ type: 'text', text: 'Hi', style: 'color: red' },
			{ type: 'iframe', src: 'x' },
			{ type: 'message', text: 'Are we still on?', from: 'ML' },
			{ type: 'reply', placeholder: 'Reply…' }
		);
		expect(s?.blocks).toEqual([{ type: 'text', text: 'Hi' }]);
		expect(c).toEqual(['unknown_block_type', 'unknown_block_type', 'unknown_block_type']);
	});

	it('normalizes art to known kinds and tones, initials from names', () => {
		const { section: s } = withBlocks(
			{ type: 'art', art: { kind: 'hologram', tone: '#ff00ff', initials: 'mara' } },
			{ type: 'art', art: { kind: 'portrait', tone: 'rose', initials: 'Mara Lindqvist' } }
		);
		expect(s?.blocks).toEqual([
			{ type: 'art', art: { kind: 'product', tone: 'neutral', initials: 'MAR' } },
			{ type: 'art', art: { kind: 'portrait', tone: 'rose', initials: 'ML' } }
		]);
	});

	it('caps text length and reports it', () => {
		const { section: s, codes: c } = one({ sections: [section({ title: 'x'.repeat(200) })] });
		expect(s?.title).toHaveLength(LIMITS.title);
		expect(s?.title.endsWith('…')).toBe(true);
		expect(c).toEqual(['text_truncated']);
	});

	it('caps list rows and accepts plain-string rows', () => {
		const rows = Array.from({ length: 10 }, (_, i) => `Row ${i}`);
		const { section: s, codes: c } = withBlocks({ type: 'list', rows });
		expect(s?.blocks[0]).toMatchObject({ type: 'list', numbered: false });
		expect((s?.blocks[0] as { rows: unknown[] }).rows).toHaveLength(LIMITS.rowsPerList);
		expect(c).toEqual(['too_many_rows']);
	});
});

describe('sanitizeAssembly — page blocks', () => {
	it('keeps up to four places on a map, and one map per section', () => {
		const places = Array.from({ length: 6 }, (_, i) => ({ label: `Stop ${i}` }));
		const { section: s, codes: c } = withBlocks({ type: 'map', places }, { type: 'map', places: [{ label: 'Again' }] });
		expect(s?.blocks).toHaveLength(1);
		expect((s?.blocks[0] as { places: unknown[] }).places).toHaveLength(LIMITS.placesPerMap);
		expect(c).toEqual(['too_many_rows', 'too_many_rows', 'extra_map']);
	});

	it('drops a map without places', () => {
		const { codes: c } = withBlocks({ type: 'map', label: 'Cafe' }, { type: 'text', text: 'x' });
		expect(c).toEqual(['invalid_block']);
	});

	it('evens out table rows to the columns and keeps a valid pick', () => {
		const { section: s, codes: c } = withBlocks({
			type: 'table',
			columns: ['Gift', 'Price', 'Why'],
			rows: [
				['Trail vest', '$89', 'Hers is falling apart'],
				['Headlamp', '$42'],
				['Wool socks', '$24', 'Warm', 'extra']
			],
			pick: 0
		});
		expect(s?.blocks[0]).toEqual({
			type: 'table',
			columns: ['Gift', 'Price', 'Why'],
			rows: [
				['Trail vest', '$89', 'Hers is falling apart'],
				['Headlamp', '$42', '—'],
				['Wool socks', '$24', 'Warm']
			],
			pick: 0
		});
		expect(c).toEqual(['table_row_mismatch', 'table_row_mismatch']);
	});

	it('needs two columns for a table and ignores an out-of-range pick', () => {
		expect(withBlocks({ type: 'table', columns: ['Only'], rows: [['a']] }).codes).toEqual(['invalid_block', 'section_without_blocks', 'no_sections']);
		const { section: s } = withBlocks({ type: 'table', columns: ['A', 'B'], rows: [['1', '2']], pick: 3 });
		expect(s?.blocks[0]).not.toHaveProperty('pick');
	});

	it('keeps summary rows with a label and value, and an optional total', () => {
		const { section: s } = withBlocks({
			type: 'summary',
			rows: [{ label: 'Flights', value: '$598' }, { label: 'No value' }, { label: 'Stay', value: '$342' }],
			total: { label: 'Total', value: '$940' }
		});
		expect(s?.blocks[0]).toEqual({
			type: 'summary',
			rows: [
				{ label: 'Flights', value: '$598' },
				{ label: 'Stay', value: '$342' }
			],
			total: { label: 'Total', value: '$940' }
		});
	});

	it('caps checklist items', () => {
		const items = Array.from({ length: 12 }, (_, i) => `Pack item ${i}`);
		const { section: s } = withBlocks({ type: 'checklist', items });
		expect((s?.blocks[0] as { items: string[] }).items).toHaveLength(LIMITS.checklistItems);
	});

	it('caps blocks per section', () => {
		const blocks = Array.from({ length: 12 }, () => ({ type: 'text', text: 'Line' }));
		const { section: s, codes: c } = withBlocks(...blocks);
		expect(s?.blocks).toHaveLength(LIMITS.blocksPerSection);
		expect(c).toEqual(Array(12 - LIMITS.blocksPerSection).fill('too_many_blocks'));
	});
});

describe('sanitizeAssembly — actions', () => {
	it('keeps at most one primary action, counting media actions first', () => {
		const { section: s, codes: c } = one({
			sections: [
				section({
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
		});
		const media = s?.blocks[0] as { actions: { primary?: boolean }[] };
		expect(media.actions[0].primary).toBe(true);
		expect(s?.actions.map((a) => a.primary ?? false)).toEqual([false, false]);
		expect(c).toEqual(['extra_primary', 'extra_primary']);
	});

	it('infers the effect: an intent opens, anything else confirms', () => {
		const { section: s } = one({
			sections: [section({ actions: [{ label: 'Get directions', intent: 'Directions to the cafe' }, { label: 'Save' }] })]
		});
		expect(s?.actions).toEqual([
			{ label: 'Get directions', effect: 'open', intent: 'Directions to the cafe' },
			{ label: 'Save', effect: 'confirm', done: 'Done' }
		]);
	});

	it('falls back to the label as intent for open actions', () => {
		const { section: s } = one({ sections: [section({ actions: [{ label: 'See menu', effect: 'open' }] })] });
		expect(s?.actions[0]).toEqual({ label: 'See menu', effect: 'open', intent: 'See menu' });
	});

	it('drops actions without a label and caps the count', () => {
		const actions = [{ label: '' }, ...Array.from({ length: 5 }, (_, i) => ({ label: `Do ${i}` }))];
		const { section: s, codes: c } = one({ sections: [section({ actions })] });
		expect(s?.actions).toHaveLength(LIMITS.actionsPerSection);
		expect(c).toEqual(['invalid_action', 'too_many_actions', 'too_many_actions']);
	});
});
