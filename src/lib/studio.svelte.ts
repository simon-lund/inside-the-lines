import Bundler from '@sveltejs/repl/bundler';
import { Workspace, type File } from '@sveltejs/repl/workspace';
import { parseAssistantText, serializeFiles, type ParsedFile } from './artifact';
import type { ApiChatMessage, ErrorCode } from './types';

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
	let count = $state(0);
</script>

<main class="min-h-screen grid place-items-center bg-zinc-950 text-zinc-100">
	<div class="text-center space-y-4">
		<h1 class="text-2xl font-semibold tracking-tight">Hello, studio</h1>
		<p class="text-zinc-400 text-sm">Ask the AI for an app — or edit me.</p>
		<button
			class="rounded-lg bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition px-4 py-2 text-sm font-medium"
			onclick={() => count++}
		>
			clicked {count} {count === 1 ? 'time' : 'times'}
		</button>
	</div>
</main>
`;

function makeFile(name: string, contents: string): File {
	return { type: 'file', name, basename: name.split('/').pop() ?? name, contents, text: true };
}

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
		// The bundler must exist first: workspace callbacks (even the tailwind
		// setter) can trigger a rebundle synchronously during construction.
		this.bundler = new Bundler({
			svelte_version: 'latest',
			onstatus: (message) => (this.bundlerStatus = message),
			onversion: (version) => (this.svelteVersion = version),
			onerror: (message) => (this.previewError = new Error(message))
		});

		this.workspace = new Workspace([makeFile('App.svelte', STARTER_APP)], {
			initial: 'App.svelte',
			svelte_version: 'latest',
			onupdate: () => this.#onWorkspaceChange(),
			onreset: () => this.#onWorkspaceChange()
		});
	}

	/** Called from onMount — bundle() spins up $effect roots, which must not happen during component init. */
	async init(): Promise<void> {
		// The setter fires the workspace's onupdate, which triggers the first bundle.
		this.workspace.tailwind = true;
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

	/** The current editor files, serialized for context / export. */
	textFiles(): { name: string; contents: string }[] {
		return this.workspace.file_nodes
			.filter((f) => f.text)
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
		void this.workspace.reset([makeFile('App.svelte', STARTER_APP)], { tailwind: true }, 'App.svelte');
	}

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
			const existing = this.workspace.file_nodes.find((f) => f.name === pf.name);
			if (!existing) {
				this.workspace.add(makeFile(pf.name, pf.contents));
			} else if (existing.contents !== pf.contents) {
				this.workspace.update_file({ ...existing, contents: pf.contents });
			}
		}

		// Keep the file that is currently being written in view.
		const open = parsed.find((f) => !f.closed);
		if (open && this.workspace.current?.name !== open.name) {
			this.workspace.select(open.name);
		}

		if (reconcile) {
			for (const file of [...this.workspace.file_nodes]) {
				if (!parsed.some((pf) => pf.name === file.name) && this.workspace.file_nodes.length > 1) {
					this.workspace.remove(file);
				}
			}
		}
	}

	private finishFiles(live: UiMessage, reconcile: boolean): void {
		const parsed = parseAssistantText(live.raw);
		if (parsed.files.length === 0) return;

		this.applyFiles(parsed.files, reconcile);
		this.workspace.select(parsed.files[0].name);
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
