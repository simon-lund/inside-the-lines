/**
 * Parsing of the model's answer while it streams. It writes a sentence of prose plus one
 * fenced block per file it adds or changes, tagged with its name:
 *
 *   ```svelte file=App.svelte
 *   …complete file contents…
 *   ```
 *
 * Everything outside those fences is prose.
 */

export interface ParsedFile {
	name: string;
	contents: string;
	/** True once the closing fence has arrived — before that the file is still streaming. */
	closed: boolean;
}

export interface ParsedAssistantText {
	/** Chat prose with all file fences removed. */
	prose: string;
	/** Files in emission order (a name emitted twice: the last one wins). */
	files: ParsedFile[];
}

const OPEN_FENCE = /```[a-zA-Z0-9]*[ \t]+file=([^\s`]+)[ \t]*\r?\n/g;
const CLOSE_FENCE = '\n```';

export function parseAssistantText(raw: string): ParsedAssistantText {
	const files: ParsedFile[] = [];
	const proseParts: string[] = [];
	let pos = 0;

	OPEN_FENCE.lastIndex = 0;
	for (;;) {
		OPEN_FENCE.lastIndex = pos;
		const open = OPEN_FENCE.exec(raw);
		if (!open) {
			proseParts.push(stripDanglingFence(raw.slice(pos)));
			break;
		}

		proseParts.push(raw.slice(pos, open.index));
		const name = open[1];
		const bodyStart = open.index + open[0].length;
		const closeIdx = raw.indexOf(CLOSE_FENCE, bodyStart);

		if (closeIdx === -1) {
			// Fence still open — the rest of the buffer is this file, still streaming.
			upsert(files, { name, contents: raw.slice(bodyStart), closed: false });
			break;
		}

		upsert(files, { name, contents: raw.slice(bodyStart, closeIdx), closed: true });
		pos = closeIdx + CLOSE_FENCE.length;
		// Skip trailing backticks/whitespace of the closing fence line.
		while (raw[pos] === '`') pos += 1;
	}

	const prose = proseParts
		.map((part) => part.trim())
		.filter(Boolean)
		.join('\n\n');
	return { prose, files };
}

function upsert(files: ParsedFile[], file: ParsedFile): void {
	const existing = files.findIndex((f) => f.name === file.name);
	if (existing === -1) files.push(file);
	else files[existing] = file;
}

/**
 * While streaming, a partially received opening fence (e.g. "``" or "```svelte fi")
 * would flash as prose for one frame — hold the whole started line back.
 */
function stripDanglingFence(text: string): string {
	const nl = text.lastIndexOf('\n');
	const lastLine = text.slice(nl + 1);
	return lastLine.startsWith('`') ? text.slice(0, nl + 1) : text;
}

const LANG_BY_EXTENSION: Record<string, string> = {
	svelte: 'svelte',
	js: 'js',
	ts: 'ts',
	json: 'json',
	css: 'css',
	html: 'html',
	md: 'md',
	svg: 'svg'
};

/** Serializes a page's files back into the fence format, for the <current_code> context. */
export function serializeFiles(files: { name: string; contents: string }[]): string {
	return files
		.map((file) => {
			const ext = file.name.split('.').pop() ?? '';
			const lang = LANG_BY_EXTENSION[ext] ?? '';
			return `\`\`\`${lang} file=${file.name}\n${file.contents}\n\`\`\``;
		})
		.join('\n\n');
}
