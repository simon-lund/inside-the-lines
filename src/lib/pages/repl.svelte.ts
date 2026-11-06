import Bundler from '@sveltejs/repl/bundler';
import { Workspace, type File } from '@sveltejs/repl/workspace';
import { DESIGN_ALIASES, designFiles, isDesignFile, makeFile } from './design-files';

/** One file of a page as the model writes it (the design system is never among them). */
export interface PageFile {
	name: string;
	contents: string;
}

// Tailwind stays off: generated code styles itself with the design tokens, which the check can read.
const OPTIONS = { tailwind: false, aliases: DESIGN_ALIASES };

/**
 * The REPL behind every page: one workspace (the page's files plus the locked design system)
 * and one bundler that compiles it in a worker. Browser-only; create it in onMount, because
 * bundling spins up effect roots that must not start during component init.
 */
export class Repl {
	/** Bundler progress ("fetching svelte", "bundling", …); null when idle. */
	status = $state<string | null>(null);
	/** An error the page threw while mounting (bound to the viewer), or the bundler's own. */
	error = $state<Error | null>(null);
	/** The last uncaught error after mounting, from a handler or an effect. */
	runtimeError = $state<string | null>(null);

	workspace: Workspace;
	bundler: Bundler;

	constructor() {
		// The bundler must exist first: workspace callbacks can trigger a rebundle synchronously.
		this.bundler = new Bundler({
			svelte_version: __SVELTE_VERSION__,
			onstatus: (message) => (this.status = message),
			onerror: (message) => (this.error = new Error(message))
		});
		// Read-only: the code view shows the model's code; changes go through a request.
		this.workspace = new Workspace(designFiles(), { svelte_version: __SVELTE_VERSION__, readonly: true });
	}

	/**
	 * What keeps the page from running, as text for a fix request: a compile error, an error while
	 * mounting, or an uncaught one since; null while it runs.
	 */
	get failure(): string | null {
		const compiled = this.bundler.result?.error;
		if (compiled) {
			const where = compiled.filename ? `${compiled.filename}${compiled.loc ? `:${compiled.loc.line}:${compiled.loc.column}` : ''}: ` : '';
			return `${where}${compiled.message}${compiled.frame ? `\n${compiled.frame}` : ''}`;
		}
		if (this.error) return this.error.message;
		return this.runtimeError;
	}

	/** Replaces the page's files (the design system is re-seeded) and compiles once. */
	async load(files: PageFile[]): Promise<void> {
		this.error = null;
		this.runtimeError = null;
		const own = files.filter((f) => !isDesignFile(f.name)).map((f) => makeFile(f.name, f.contents));
		await this.workspace.reset([...designFiles(), ...own], OPTIONS, 'App.svelte');
		await this.rebundle();
	}

	rebundle(): Promise<void> {
		this.error = null;
		this.runtimeError = null;
		return this.bundler.bundle(this.workspace.files as File[], {
			svelte_version: this.workspace.svelte_version,
			tailwind: false,
			fragments: this.workspace.compiler_options.fragments,
			async: this.workspace.compiler_options.async,
			aliases: this.workspace.aliases
		});
	}
}
