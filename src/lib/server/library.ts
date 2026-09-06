import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SEED_VIEWS } from '$lib/mercury/examples';
import type { LibrarySummary, LibraryView, ViewFile } from '$lib/types';

/** Saved views live as JSON files in ./library (committed, human-readable). */
const DIR = path.resolve('library');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export function isValidId(id: string): boolean {
	return ID_RE.test(id);
}

function slugify(title: string): string {
	return (
		title
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'view'
	);
}

async function ensureDir(): Promise<void> {
	try {
		await readdir(DIR);
	} catch {
		await mkdir(DIR, { recursive: true });
		// First run: seed the reference examples so the library is never empty.
		const base = Date.now() - SEED_VIEWS.length * 1000;
		await Promise.all(
			SEED_VIEWS.map((seed, i) =>
				writeFile(
					path.join(DIR, `${seed.id}.json`),
					JSON.stringify({ ...seed, createdAt: new Date(base + i * 1000).toISOString() }, null, '\t')
				)
			)
		);
	}
}

export async function listViews(): Promise<LibrarySummary[]> {
	await ensureDir();
	const names = (await readdir(DIR)).filter((n) => n.endsWith('.json'));
	const views = await Promise.all(
		names.map(async (n) => JSON.parse(await readFile(path.join(DIR, n), 'utf8')) as LibraryView)
	);
	return views
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map(({ id, title, prompt, createdAt, files }) => ({
			id,
			title,
			prompt,
			createdAt,
			fileCount: files.length
		}));
}

export async function getView(id: string): Promise<LibraryView | null> {
	await ensureDir();
	try {
		return JSON.parse(await readFile(path.join(DIR, `${id}.json`), 'utf8')) as LibraryView;
	} catch {
		return null;
	}
}

export async function saveView(input: {
	title: string;
	prompt: string;
	files: ViewFile[];
}): Promise<LibraryView> {
	await ensureDir();
	const slug = slugify(input.title);
	let id = slug;
	// Never overwrite: suffix until free.
	for (let i = 2; (await getView(id)) !== null; i++) id = `${slug}-${i}`;
	const view: LibraryView = { id, ...input, createdAt: new Date().toISOString() };
	await writeFile(path.join(DIR, `${id}.json`), JSON.stringify(view, null, '\t'));
	return view;
}

export async function deleteView(id: string): Promise<boolean> {
	await ensureDir();
	try {
		await rm(path.join(DIR, `${id}.json`));
		return true;
	} catch {
		return false;
	}
}
