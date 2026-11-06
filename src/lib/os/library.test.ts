import { describe, expect, it } from 'vitest';
import { LIBRARY } from './library';
import { sanitizeAssembly } from './sanitize';
import { BLOCK_TYPES } from './spec';

// The Library shows what the model may build, so it must itself be valid output
// and show every block the vocabulary has.

describe('Library', () => {
	it('passes the validator unchanged, section by section', () => {
		for (const { id, ...section } of LIBRARY) {
			const { assembly, issues } = sanitizeAssembly({ sections: [section] }, 'section', 'lib');
			expect(issues, id).toEqual([]);
			expect({ ...assembly.sections[0], id }).toEqual({ id, ...section });
		}
	});

	it('shows every block type', () => {
		const shown = new Set(LIBRARY.flatMap((s) => s.blocks.map((b) => b.type)));
		expect(BLOCK_TYPES.filter((t) => !shown.has(t))).toEqual([]);
	});
});
