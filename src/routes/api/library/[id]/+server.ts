import { json } from '@sveltejs/kit';
import { deleteView, getView, isValidId } from '$lib/server/library';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!isValidId(params.id)) {
		return json({ code: 'invalid_request', detail: 'Malformed view id.' }, { status: 400 });
	}
	const view = await getView(params.id);
	if (!view) {
		return json({ code: 'view_not_found', detail: `No saved view "${params.id}".` }, { status: 404 });
	}
	return json({ view });
};

export const DELETE: RequestHandler = async ({ params }) => {
	if (!isValidId(params.id)) {
		return json({ code: 'invalid_request', detail: 'Malformed view id.' }, { status: 400 });
	}
	const removed = await deleteView(params.id);
	if (!removed) {
		return json({ code: 'view_not_found', detail: `No saved view "${params.id}".` }, { status: 404 });
	}
	return new Response(null, { status: 204 });
};
