import type { PageFileInput } from './request';

/** The design system's folder in a page's workspace: present in every page, never the model's to change. */
export const DESIGN_PREFIX = 'design/';

export function isDesignFile(name: string): boolean {
	return name.startsWith(DESIGN_PREFIX);
}

/** Applies an answer: emitted files replace or add, an empty file deletes, design/ is never touched. */
export function mergeFiles(current: PageFileInput[], emitted: PageFileInput[]): PageFileInput[] {
	const next = new Map(current.map((f) => [f.name, f.contents]));
	for (const f of emitted) {
		if (isDesignFile(f.name)) continue;
		if (f.contents.trim() === '') next.delete(f.name);
		else next.set(f.name, f.contents);
	}
	return [...next].map(([name, contents]) => ({ name, contents }));
}
