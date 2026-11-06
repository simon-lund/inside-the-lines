import type { File } from '@sveltejs/repl/workspace';
import { DESIGN_PREFIX } from './merge';

export { DESIGN_PREFIX, isDesignFile } from './merge';

/**
 * The design system as REPL files: every component and module in src/lib/design, seeded into
 * each page's workspace under `design/` and importable as `'design'`. Generated code may use
 * it but never change it — files the model emits under `design/` are dropped.
 */
export const DESIGN_ALIASES: Record<string, string> = { design: 'design' };

// Picked up by glob, so a new component reaches the REPL without being listed anywhere.
const SOURCES = import.meta.glob('../design/*.{svelte,js}', { query: '?raw', import: 'default', eager: true }) as Record<
	string,
	string
>;

export function makeFile(name: string, contents: string): File {
	return { type: 'file', name, basename: name.split('/').pop() ?? name, contents, text: true };
}

/** Fresh File objects each call — the workspace mutates the ones it holds. */
export function designFiles(): File[] {
	return Object.entries(SOURCES).map(([path, contents]) => makeFile(DESIGN_PREFIX + path.split('/').pop(), contents));
}
