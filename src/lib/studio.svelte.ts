import Bundler from '@sveltejs/repl/bundler';
import { Workspace, type File } from '@sveltejs/repl/workspace';
import { parseAssistantText, serializeFiles, type ParsedFile } from './artifact';
import { FRAMEWORK_ALIASES, isFrameworkFile, makeFile, mercuryFiles } from './mercury/files';
import type { ApiChatMessage, ErrorCode, LibrarySummary, ViewFile } from './types';

export type AssistantPhase = 'waiting' | 'thinking' | 'writing';

export interface UiMessage {
	id: number;
	role: 'user' | 'assistant';
	/** Exact text sent to / received from the API (assistant: includes file fences). */
	raw: string;
	/** What the chat renders — user: the typed prompt; assistant: prose around the fences. */
	display: string;
	/** Assistant only: names of the files this message emitted. */
	fileNames: string[];
	status: 'streaming' | 'done' | 'error';
	errorCode?: ErrorCode;
	errorDetail?: string;
	stopReason?: string | null;
}

const STARTER_APP = `<script>
	import { Canvas, Module, Action } from 'mercury';
	let nudges = $state(0);
</script>

<Canvas>
	<Module title="Studio" source="Getting started" kind="generic">
		<h2 class="m-title">Assemble something.</h2>
		<p class="m-text">
			Describe what you're trying to do. Mercury modules gather the content and the actions
			around that intent — no apps, no folders.
		</p>
		<p class="m-meta">{nudges} {nudges === 1 ? 'nudge' : 'nudges'} so far</p>

		{#snippet actions()}
			<Action primary label="Nudge" onclick={() => nudges++} />
			<Action label="Open the library" sublabel="Saved views live there" />
		{/snippet}
	</Module>
</Canvas>
`;

const WORKSPACE_OPTIONS = { tailwind: true, aliases: FRAMEWORK_ALIASES };

/** All client-side state of the studio — one instance per page, browser-only (ssr = false). */
export class Studio {
	messages = $state<UiMessage[]>([]);
	streaming = $state(false);
	phase = $state<AssistantPhase>('waiting');
	activeTab = $state<'preview' | 'code'>('preview');
	/** null = health check pending. */
	hasApiKey = $state<boolean | null>(null);
	/** Bundler progress message ("downloading svelte", "bundling", …). */
	bundlerStatus = $state<string | null>(null);
	/** Runtime error reported by the preview iframe (bound to the Viewer). */
	previewError = $state<Error | null>(null);
	svelteVersion = $state<string | null>(null);
	/** Show the protected mercury/ design-system files in the editor. */
	showFramework = $state(false);

	/** Saved views; null until the first fetch completes. */
	library = $state<LibrarySummary[] | null>(null);
	libraryOpen = $state(false);
	libraryBusy = $state<'saving' | 'loading' | 'deleting' | null>(null);
	libraryError = $state<string | null>(null);

	workspace: Workspace;
	bundler: Bundler;

	/** Files exactly as the AI last produced them — used to detect manual edits. */
	private lastAiFiles: Record<string, string> = {};
	private nextId = 1;
	private abortController: AbortController | null = null;
	/** True once the user clicked a tab during the current stream — stops auto-switching. */
	private userPinnedTab = false;
	private lastApply = 0;

	constructor() {
		// The bundler must exist first: workspace callbacks can trigger a rebundle synchronously.
		this.bundler = new Bundler({
			svelte_version: 'latest',
			onstatus: (message) => (this.bundlerStatus = message),
			onversion: (version) => (this.svelteVersion = version),
			onerror: (message) => (this.previewError = new Error(message))
		});

		this.workspace = new Workspace([...mercuryFiles(), makeFile('App.svelte', STARTER_APP)], {
			initial: 'App.svelte',
			svelte_version: 'latest',
			onupdate: () => this.#onWorkspaceChange(),
			onreset: () => this.#onWorkspaceChange()
		});
	}

	/** Called from onMount — bundle() spins up $effect roots, which must not happen during component init. */
	async init(): Promise<void> {
		// reset() applies tailwind + the 'mercury' alias and fires exactly one bundle.
		void this.workspace.reset(
			[...mercuryFiles(), makeFile('App.svelte', STARTER_APP)],
			WORKSPACE_OPTIONS,
			'App.svelte'
		);
		void this.refreshLibrary();
		try {
			const res = await fetch('/api/health');
			const data = (await res.json()) as { hasApiKey: boolean };
			this.hasApiKey = data.hasApiKey;
		} catch {
			this.hasApiKey = false;
		}
	}

	rebundle(): Promise<void> {
		this.previewError = null;
		return this.bundler.bundle(this.workspace.files as File[], {
			svelte_version: this.workspace.svelte_version,
			tailwind: this.workspace.tailwind,
			fragments: this.workspace.compiler_options.fragments,
			async: this.workspace.compiler_options.async,
			aliases: this.workspace.aliases
		});
	}

	#onWorkspaceChange(): void {
		// While the AI streams we apply many partial updates — bundle once at the end.
		if (!this.streaming) void this.rebundle();
	}

	pinTab(tab: 'preview' | 'code'): void {
		this.activeTab = tab;
		if (this.streaming) this.userPinnedTab = true;
	}

	/** The user's own files (design-system files excluded), serialized for context / export. */
	textFiles(): ViewFile[] {
		return this.workspace.file_nodes
			.filter((f) => f.text && !isFrameworkFile(f.name))
			.map((f) => ({ name: f.name, contents: f.contents }));
	}

	private editedSinceAi(): boolean {
		const files = this.textFiles();
		const names = Object.keys(this.lastAiFiles);
		if (files.length !== names.length) return true;
		return files.some((f) => this.lastAiFiles[f.name] !== f.contents);
	}

	stop(): void {
		this.abortController?.abort();
	}

	reset(): void {
		this.stop();
		this.messages = [];
		this.lastAiFiles = {};
		this.previewError = null;
		this.activeTab = 'preview';
		void this.workspace.reset(
			[...mercuryFiles(), makeFile('App.svelte', STARTER_APP)],
			WORKSPACE_OPTIONS,
			'App.svelte'
		);
	}

	// ---------------------------------------------------------------- library

	async refreshLibrary(): Promise<void> {
		try {
			const res = await fetch('/api/library');
			const data = (await res.json()) as { views: LibrarySummary[] };
			this.library = data.views;
			this.libraryError = null;
		} catch {
			this.libraryError = 'Could not load the library.';
			this.library ??= [];
		}
	}

	/** Title suggestion for the save form: the first thing the user asked for. */
	suggestedTitle(): string {
		return this.messages.find((m) => m.role === 'user')?.display.slice(0, 60) ?? '';
	}

	async saveView(title: string): Promise<boolean> {
		const files = this.textFiles();
		if (!title.trim() || files.length === 0 || this.libraryBusy) return false;
		this.libraryBusy = 'saving';
		this.libraryError = null;
		try {
			const res = await fetch('/api/library', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), prompt: this.suggestedTitle(), files })
			});
			if (!res.ok) throw new Error(`save failed (${res.status})`);
			await this.refreshLibrary();
			return true;
		} catch {
			this.libraryError = 'Saving failed.';
			return false;
		} finally {
			this.libraryBusy = null;
		}
	}

	/** Loads a saved view into the workspace as a fresh session (framework files re-seeded). */
	async loadView(id: string): Promise<void> {
		if (this.libraryBusy || this.streaming) return;
		this.libraryBusy = 'loading';
		this.libraryError = null;
		try {
			const res = await fetch(`/api/library/${id}`);
			if (!res.ok) throw new Error(`load failed (${res.status})`);
			const { view } = (await res.json()) as { view: { files: ViewFile[] } };
			this.messages = [];
			// The model has no history of these files — send them as context on the next message.
			this.lastAiFiles = {};
			this.previewError = null;
			this.activeTab = 'preview';
			this.libraryOpen = false;
			await this.workspace.reset(
				[...mercuryFiles(), ...view.files.map((f) => makeFile(f.name, f.contents))],
				WORKSPACE_OPTIONS,
				'App.svelte'
			);
		} catch {
			this.libraryError = 'Loading failed.';
		} finally {
			this.libraryBusy = null;
		}
	}

	async deleteView(id: string): Promise<void> {
		if (this.libraryBusy) return;
		this.libraryBusy = 'deleting';
		try {
			const res = await fetch(`/api/library/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error(`delete failed (${res.status})`);
			await this.refreshLibrary();
		} catch {
			this.libraryError = 'Deleting failed.';
		} finally {
			this.libraryBusy = null;
		}
	}

	// ------------------------------------------------------------------- chat

	/** Re-send the last user prompt after an error (context blocks are rebuilt fresh). */
	retryLast(): void {
		const lastUser = [...this.messages].reverse().find((m) => m.role === 'user');
		if (!lastUser || this.streaming) return;
		const idx = this.messages.indexOf(lastUser);
		this.messages = this.messages.slice(0, idx);
		void this.send(lastUser.display);
	}

	async send(prompt: string, opts: { errorReport?: string } = {}): Promise<void> {
		const trimmed = prompt.trim();
		if (!trimmed || this.streaming || this.hasApiKey === false) return;

		// Attach hidden context: manual edits and runtime errors the model must see.
		let raw = trimmed;
		if (this.editedSinceAi()) {
			raw += `\n\n<current_code>\n${serializeFiles(this.textFiles())}\n</current_code>`;
		}
		if (opts.errorReport) {
			raw += `\n\n<runtime_error>\n${opts.errorReport}\n</runtime_error>`;
		}

		this.messages.push({
			id: this.nextId++,
			role: 'user',
			raw,
			display: trimmed,
			fileNames: [],
			status: 'done'
		});

		const apiMessages: ApiChatMessage[] = this.messages
			.filter((m) => m.raw.trim().length > 0)
			.map((m) => ({ role: m.role, content: m.raw }));

		this.messages.push({
			id: this.nextId++,
			role: 'assistant',
			raw: '',
			display: '',
			fileNames: [],
			status: 'streaming'
		});
		// Work against the reactive proxy so field updates propagate.
		const live = this.messages[this.messages.length - 1];

		this.streaming = true;
		this.phase = 'waiting';
		this.userPinnedTab = false;
		this.abortController = new AbortController();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: apiMessages }),
				signal: this.abortController.signal
			});

			if (!res.ok || !res.body) {
				const err = (await res.json().catch(() => null)) as {
					code?: ErrorCode;
					detail?: string;
				} | null;
				this.failAssistant(live, err?.code ?? 'network_error', err?.detail);
				return;
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const parts = buffer.split('\n\n');
				buffer = parts.pop() ?? '';
				for (const part of parts) {
					if (!part.startsWith('data: ')) continue;
					this.handleEvent(live, JSON.parse(part.slice(6)));
				}
			}
			// A stream that ends without a done/error event broke off mid-flight.
			if (live.status === 'streaming') {
				this.failAssistant(live, 'stream_error');
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				// User pressed stop — keep whatever arrived.
				live.status = 'done';
				live.stopReason = 'aborted';
				this.finishFiles(live, /* reconcile */ false);
			} else if (live.status === 'streaming') {
				this.failAssistant(live, 'network_error');
			}
		} finally {
			this.streaming = false;
			this.abortController = null;
		}
	}

	private handleEvent(live: UiMessage, event: { type: string; [key: string]: unknown }): void {
		switch (event.type) {
			case 'status':
				this.phase = event.status as AssistantPhase;
				break;
			case 'text': {
				live.raw += event.text as string;
				const parsed = parseAssistantText(live.raw);
				live.display = parsed.prose;
				if (parsed.files.length > 0) {
					live.fileNames = parsed.files.map((f) => f.name);
					// Show the code being written, like a REPL should — throttled so the
					// editor isn't re-dispatched on every token.
					const now = Date.now();
					if (now - this.lastApply > 250) {
						this.lastApply = now;
						this.applyFiles(parsed.files, false);
					}
					if (!this.userPinnedTab && this.activeTab !== 'code') this.activeTab = 'code';
				}
				break;
			}
			case 'done':
				live.status = 'done';
				live.stopReason = event.stopReason as string | null;
				this.finishFiles(live, true);
				break;
			case 'error':
				this.failAssistant(live, event.code as ErrorCode, event.detail as string | undefined);
				break;
		}
	}

	/** Writes streamed files into the workspace; on the final pass, removes files the AI dropped. */
	private applyFiles(parsed: ParsedFile[], reconcile: boolean): void {
		for (const pf of parsed) {
			// The design system is not the model's to rewrite.
			if (isFrameworkFile(pf.name)) continue;
			const existing = this.workspace.file_nodes.find((f) => f.name === pf.name);
			if (!existing) {
				this.workspace.add(makeFile(pf.name, pf.contents));
			} else if (existing.contents !== pf.contents) {
				this.workspace.update_file({ ...existing, contents: pf.contents });
			}
		}

		// Keep the file that is currently being written in view.
		const open = parsed.find((f) => !f.closed && !isFrameworkFile(f.name));
		if (open && this.workspace.current?.name !== open.name) {
			this.workspace.select(open.name);
		}

		if (reconcile) {
			for (const file of [...this.workspace.file_nodes]) {
				if (isFrameworkFile(file.name)) continue;
				if (!parsed.some((pf) => pf.name === file.name) && this.workspace.file_nodes.length > 1) {
					this.workspace.remove(file);
				}
			}
		}
	}

	private finishFiles(live: UiMessage, reconcile: boolean): void {
		const parsed = parseAssistantText(live.raw).files.filter((f) => !isFrameworkFile(f.name));
		if (parsed.length === 0) return;

		this.applyFiles(parsed, reconcile);
		this.workspace.select(parsed[0].name);
		this.workspace.mark_saved();
		this.lastAiFiles = Object.fromEntries(this.textFiles().map((f) => [f.name, f.contents]));
		void this.rebundle();
		if (!this.userPinnedTab) this.activeTab = 'preview';
	}

	private failAssistant(live: UiMessage, code: ErrorCode, detail?: string): void {
		live.status = 'error';
		live.errorCode = code;
		live.errorDetail = detail;
	}
}
