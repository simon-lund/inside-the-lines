/**
 * One request to /api/page, the same shape on both sides. Stateless: the page's current code
 * travels with every request, so there is no conversation to keep and a request can be replayed.
 */

/**
 * What is being asked for — exactly one of:
 * - page: a new intention from the empty state → a new page from scratch
 * - follow: a follow-up typed on the page
 * - ask: a control inside the page called ask()
 * - repair: the design check found violations in the last answer
 * - fix: the page failed to compile or run
 */
export const PAGE_KINDS = ['page', 'follow', 'ask', 'repair', 'fix'] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export interface PageFileInput {
	name: string;
	contents: string;
}

export interface PageRequest {
	kind: PageKind;
	intent: string;
	/** ask: the label of the control that asked. */
	label?: string;
	/** fix: the error. (repair: the server finds the violations in `files` itself.) */
	detail?: string;
	/** The page's files as they are now (the design system is never among them). */
	files: PageFileInput[];
}

const MAX_FILES = 40;
const MAX_CODE = 200_000;

/** Validates a request body; null when it isn't one. */
export function parsePageRequest(body: unknown): PageRequest | null {
	if (typeof body !== 'object' || body === null) return null;
	const b = body as Record<string, unknown>;
	if (!PAGE_KINDS.includes(b.kind as PageKind)) return null;
	if (typeof b.intent !== 'string' || !b.intent.trim() || b.intent.length > 500) return null;
	if (!Array.isArray(b.files) || b.files.length > MAX_FILES) return null;

	const files: PageFileInput[] = [];
	let size = 0;
	for (const f of b.files) {
		if (typeof f !== 'object' || f === null) return null;
		const { name, contents } = f as Record<string, unknown>;
		if (typeof name !== 'string' || typeof contents !== 'string' || !name || name.length > 120) return null;
		size += contents.length;
		files.push({ name, contents });
	}
	if (size > MAX_CODE) return null;

	const req: PageRequest = { kind: b.kind as PageKind, intent: b.intent.trim(), files };
	if (typeof b.label === 'string' && b.label.trim()) req.label = b.label.trim().slice(0, 80);
	if (typeof b.detail === 'string' && b.detail.trim()) req.detail = b.detail.slice(0, 8000);
	return req;
}
