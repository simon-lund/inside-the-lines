/**
 * Parsing of assistant output while it streams. The model is instructed to emit
 * at most one fenced ```html block containing a complete standalone document;
 * everything around the fence is chat prose.
 */

export interface ParsedAssistantText {
	/** Chat prose with the code fence removed. */
	prose: string;
	/** Content of the ```html fence, or null if the message has none (yet). */
	code: string | null;
	/** True once the closing fence has arrived — before that the code is still streaming. */
	closed: boolean;
}

const OPEN_FENCE = /```html[^\n]*\n/;

export function parseAssistantText(raw: string): ParsedAssistantText {
	const open = OPEN_FENCE.exec(raw);
	if (!open) {
		return { prose: stripDanglingFence(raw), code: null, closed: false };
	}

	const before = raw.slice(0, open.index).trimEnd();
	const rest = raw.slice(open.index + open[0].length);
	const closeIdx = rest.indexOf('\n```');

	if (closeIdx === -1) {
		// Fence still open — everything received so far is code.
		return { prose: before, code: rest, closed: false };
	}

	const code = rest.slice(0, closeIdx);
	const after = rest
		.slice(closeIdx + '\n```'.length)
		.replace(/^`*/, '')
		.trim();
	const prose = after ? (before ? `${before}\n\n${after}` : after) : before;
	return { prose, code, closed: true };
}

/**
 * While streaming, a partially received opening fence (e.g. "``" or "```ht")
 * would flash as prose for one frame — hold it back until it resolves.
 */
function stripDanglingFence(text: string): string {
	const m = /`{1,3}(?:h(?:t(?:m(?:l)?)?)?)?$/.exec(text);
	return m ? text.slice(0, m.index) : text;
}

/**
 * Script injected into every preview document. Reports uncaught errors to the
 * parent frame so the studio can surface them (and offer an AI fix).
 * The iframe runs without allow-same-origin, so postMessage targets '*' —
 * the parent verifies event.source instead.
 */
const CAPTURE_SCRIPT =
	'<script>(function(){var seen={};function send(m){m=String(m);if(seen[m])return;seen[m]=1;' +
	"try{parent.postMessage({__studio:'runtime_error',message:m},'*')}catch(e){}}" +
	"window.addEventListener('error',function(e){send(e.message+(e.lineno?' (line '+e.lineno+')':''))});" +
	"window.addEventListener('unhandledrejection',function(e){var r=e.reason;send('Unhandled rejection: '+((r&&r.message)||r))});" +
	'})()<\/script>';

/** Prepares user/AI code for the sandboxed iframe by injecting the error reporter. */
export function buildPreviewDocument(code: string): string {
	const headMatch = /<head[^>]*>/i.exec(code);
	if (headMatch) {
		const insertAt = headMatch.index + headMatch[0].length;
		return code.slice(0, insertAt) + CAPTURE_SCRIPT + code.slice(insertAt);
	}
	return CAPTURE_SCRIPT + code;
}
