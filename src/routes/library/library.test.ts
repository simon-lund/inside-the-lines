import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Pins the Library's promise: it shows every part the design system exports, so a new part
// can't reach the model without reaching the Library too.

const read = (file: string) => readFileSync(path.resolve(file), 'utf8');
const parts = [...read('src/lib/design/index.js').matchAll(/export \{ default as (\w+) \}/g)]
	.map((m) => m[1])
	// Theme is inside Canvas.
	.filter((name) => name !== 'Theme');
const library = read('src/routes/library/+page.svelte');

describe('the Library', () => {
	it.each(parts)('shows <%s>', (name) => {
		expect(library).toMatch(new RegExp(`<${name}[\\s/>]`));
	});
});
