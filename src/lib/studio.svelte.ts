import { parseAssistantText } from './artifact';
import type { ApiChatMessage, ErrorCode } from './types';

export type AssistantPhase = 'waiting' | 'thinking' | 'writing';

export interface UiMessage {
	id: number;
	role: 'user' | 'assistant';
	/** Exact text sent to / received from the API (assistant: includes the code fence). */
	raw: string;
	/** What the chat renders — user: the typed prompt; assistant: prose around the fence. */
	display: string;
	/** Assistant only: code extracted from the ```html fence. */
	code: string | null;
	status: 'streaming' | 'done' | 'error';
	errorCode?: ErrorCode;
	errorDetail?: string;
	stopReason?: string | null;
}

/** All client-side state of the studio — one instance per page. */
export class Studio {
	messages = $state<UiMessage[]>([]);
	/** Current editor content (kept in sync with manual edits and AI output). */
	code = $state('');
	/** Code exactly as the AI last produced it — used to detect manual edits. */
	lastAiCode = $state('');
	/** Code the preview iframe is currently running. */
	previewCode = $state('');
	/** Bumped to force a preview re-run even with unchanged code. */
	runId = $state(0);
	streaming = $state(false);
	phase = $state<AssistantPhase>('waiting');
	activeTab = $state<'preview' | 'code'>('preview');
	/** null = health check pending. */
	hasApiKey = $state<boolean | null>(null);

	private nextId = 1;
	private abortController: AbortController | null = null;
	/** True once the user clicked a tab during the current stream — stops auto-switching. */
	private userPinnedTab = false;
	private editDebounce: ReturnType<typeof setTimeout> | undefined;

	async init(): Promise<void> {
		try {
			const res = await fetch('/api/health');
			const data = (await res.json()) as { hasApiKey: boolean };
			this.hasApiKey = data.hasApiKey;
		} catch {
			this.hasApiKey = false;
		}
	}

	pinTab(tab: 'preview' | 'code'): void {
		this.activeTab = tab;
		if (this.streaming) this.userPinnedTab = true;
	}

	runPreview(): void {
		this.previewCode = this.code;
		this.runId += 1;
	}

	/** Called by the editor on every keystroke; auto-runs the preview after a pause. */
	onEditorInput(newCode: string): void {
		this.code = newCode;
		clearTimeout(this.editDebounce);
		if (!this.streaming) {
			this.editDebounce = setTimeout(() => {
				if (this.code !== this.previewCode) this.runPreview();
			}, 800);
		}
	}

	stop(): void {
		this.abortController?.abort();
	}

	reset(): void {
		this.stop();
		this.messages = [];
		this.code = '';
		this.lastAiCode = '';
		this.previewCode = '';
		this.runId += 1;
		this.activeTab = 'preview';
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
		if (this.code.trim() && this.code !== this.lastAiCode) {
			raw += `\n\n<current_code>\n\`\`\`html\n${this.code}\n\`\`\`\n</current_code>`;
		}
		if (opts.errorReport) {
			raw += `\n\n<runtime_error>\n${opts.errorReport}\n</runtime_error>`;
		}

		this.messages.push({
			id: this.nextId++,
			role: 'user',
			raw,
			display: trimmed,
			code: null,
			status: 'done'
		});

		const apiMessages: ApiChatMessage[] = this.messages
			.filter((m) => m.raw.trim().length > 0)
			.map((m) => ({ role: m.role, content: m.raw }));

		const assistant: UiMessage = {
			id: this.nextId++,
			role: 'assistant',
			raw: '',
			display: '',
			code: null,
			status: 'streaming'
		};
		this.messages.push(assistant);
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
				if (live.code) {
					this.lastAiCode = live.code;
					this.runPreview();
				}
			} else if (live.status === 'streaming') {
				this.failAssistant(live, 'network_error');
			}
		} finally {
			this.streaming = false;
			this.abortController = null;
		}
	}

	private handleEvent(
		live: UiMessage,
		event: { type: string; [key: string]: unknown }
	): void {
		switch (event.type) {
			case 'status':
				this.phase = event.status as AssistantPhase;
				break;
			case 'text': {
				live.raw += event.text as string;
				const parsed = parseAssistantText(live.raw);
				live.display = parsed.prose;
				if (parsed.code !== null) {
					live.code = parsed.code;
					this.code = parsed.code;
					// Show the code being written, like a REPL should.
					if (!this.userPinnedTab && this.activeTab !== 'code') this.activeTab = 'code';
				}
				break;
			}
			case 'done':
				live.status = 'done';
				live.stopReason = event.stopReason as string | null;
				if (live.code) {
					this.lastAiCode = live.code;
					this.code = live.code;
					this.runPreview();
					if (!this.userPinnedTab) this.activeTab = 'preview';
				}
				break;
			case 'error':
				this.failAssistant(live, event.code as ErrorCode, event.detail as string | undefined);
				break;
		}
	}

	private failAssistant(live: UiMessage, code: ErrorCode, detail?: string): void {
		live.status = 'error';
		live.errorCode = code;
		live.errorDetail = detail;
	}
}
