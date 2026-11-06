import type { ViewFile } from './types';

/**
 * The studio's guardrail. The model writes real Svelte here, so the design system
 * can't constrain it structurally the way the OS spec does — instead every answer is
 * checked against the rules the prompt teaches. Violations go back to the model for
 * one automatic repair round; whatever survives is shown on the message.
 *
 * Codes are stable (the UI and the repair prompt use them); messages are prose.
 */

export type DesignRule =
	| 'no_design_system_import'
	| 'canvas_count'
	| 'no_module'
	| 'nested_module'
	| 'extra_primary'
	| 'raw_color'
	| 'emoji'
	| 'external_image';

export interface DesignViolation {
	rule: DesignRule;
	file: string;
	message: string;
}

const MERCURY_IMPORT = /import\s+[^;]*?from\s+['"]mercury['"]/;
// Chromatic Tailwind palettes; neutrals (black/white/gray…) are allowed for spacing tweaks.
const TAILWIND_COLOR =
	/\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b|\b[a-z]+-\[(?:#|rgb|hsl|oklch)/;
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;
const EMOJI = /\p{Extended_Pictographic}/u;
const EXTERNAL_IMG = /<img\b[^>]*\bsrc\s*=\s*["']https?:/i;

/** Markup with <script> blocks and inline <svg> artwork removed — colours inside SVG placeholders are fine. */
function markupOutsideSvg(contents: string): string {
	return contents
		.replace(/<script\b[\s\S]*?<\/script>/gi, '')
		.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
}

/** Splits markup into top-level <Module>…</Module> segments, flagging nesting. */
function moduleSegments(markup: string): { segments: string[]; nested: boolean } {
	const tag = /<Module\b|<\/Module>/g;
	const segments: string[] = [];
	let depth = 0;
	let start = 0;
	let nested = false;
	for (const match of markup.matchAll(tag)) {
		if (match[0] === '</Module>') {
			depth = Math.max(0, depth - 1);
			if (depth === 0) segments.push(markup.slice(start, match.index + match[0].length));
		} else {
			if (depth === 0) start = match.index;
			else nested = true;
			depth += 1;
		}
	}
	return { segments, nested };
}

export function checkDesign(files: ViewFile[]): DesignViolation[] {
	const violations: DesignViolation[] = [];
	const svelteFiles = files.filter((f) => f.name.endsWith('.svelte'));
	const app = svelteFiles.find((f) => f.name === 'App.svelte');

	if (app && !MERCURY_IMPORT.test(app.contents)) {
		violations.push({
			rule: 'no_design_system_import',
			file: app.name,
			message: "App.svelte does not import from 'mercury' — views must be built from the design system."
		});
	}

	const canvases = svelteFiles.reduce((n, f) => n + (markupOutsideSvg(f.contents).match(/<Canvas\b/g)?.length ?? 0), 0);
	if (app && canvases !== 1) {
		violations.push({
			rule: 'canvas_count',
			file: app.name,
			message: `The view renders ${canvases} <Canvas> elements; wrap it in exactly one.`
		});
	}

	if (svelteFiles.length > 0 && !svelteFiles.some((f) => /<Module\b/.test(f.contents))) {
		violations.push({ rule: 'no_module', file: app?.name ?? svelteFiles[0].name, message: 'No <Module> is used — content belongs in modules.' });
	}

	for (const file of svelteFiles) {
		const markup = markupOutsideSvg(file.contents);
		const { segments, nested } = moduleSegments(markup);

		if (nested) {
			violations.push({ rule: 'nested_module', file: file.name, message: 'A <Module> is nested inside another — no cards inside cards.' });
		}
		for (const segment of segments) {
			const primaries = segment.match(/<Action\b[^>]*\bprimary\b/g)?.length ?? 0;
			if (primaries > 1) {
				const title = segment.match(/title=["{]([^"}]*)/)?.[1] ?? 'a module';
				violations.push({
					rule: 'extra_primary',
					file: file.name,
					message: `${title} has ${primaries} primary actions; at most one.`
				});
			}
		}
		if (TAILWIND_COLOR.test(markup) || COLOR_LITERAL.test(markup.replace(/<style\b[\s\S]*?<\/style>/gi, ''))) {
			violations.push({
				rule: 'raw_color',
				file: file.name,
				message: 'Custom colours in markup — the design system owns colour (inline SVG artwork excepted).'
			});
		}
		if (/<style\b[\s\S]*?(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()[\s\S]*?<\/style>/i.test(file.contents)) {
			violations.push({ rule: 'raw_color', file: file.name, message: 'Custom colours in a <style> block — use the design system instead.' });
		}
		if (EMOJI.test(markup)) {
			violations.push({ rule: 'emoji', file: file.name, message: 'Emoji in the view — use icons from the icon packs.' });
		}
		if (EXTERNAL_IMG.test(file.contents)) {
			violations.push({ rule: 'external_image', file: file.name, message: 'External image URL — use <Art> or an inline SVG placeholder.' });
		}
	}
	return violations;
}

/** The hidden context block sent to the model for an automatic repair round. */
export function designReport(violations: DesignViolation[]): string {
	return violations.map((v) => `- [${v.rule}] ${v.file}: ${v.message}`).join('\n');
}
