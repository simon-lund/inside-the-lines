import { json } from '@sveltejs/kit';
import { listViews, saveView } from '$lib/server/library';
import type { ViewFile } from '$lib/types';
import type { RequestHandler } from './$types';

function isViewFile(value: unknown): value is ViewFile {
	if (typeof value !== 'object' || value === null) return false;
	const { name, contents } = value as Record<string, unknown>;
	return typeof name === 'string' && name.length > 0 && typeof contents === 'string';
}

export const GET: RequestHandler = async () => {
	return json({ views: await listViews() });
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ code: 'invalid_request', detail: 'Body must be JSON.' }, { status: 400 });
	}
	const { title, prompt, files } = (body ?? {}) as Record<string, unknown>;
	if (typeof title !== 'string' || !title.trim()) {
		return json({ code: 'invalid_request', detail: 'title is required.' }, { status: 400 });
	}
	if (!Array.isArray(files) || files.length === 0 || !files.every(isViewFile)) {
		return json(
			{ code: 'invalid_request', detail: 'files must be a non-empty array of {name, contents}.' },
			{ status: 400 }
		);
	}
	const view = await saveView({
		title: title.trim(),
		prompt: typeof prompt === 'string' ? prompt : '',
		files
	});
	return json({ view }, { status: 201 });
};
