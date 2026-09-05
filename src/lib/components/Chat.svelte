<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Square from '@lucide/svelte/icons/square';
	import MessageBubble from './MessageBubble.svelte';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let input = $state('');
	let listEl = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let stickToBottom = true;

	const SUGGESTIONS = [
		'A pomodoro timer with a satisfying tick',
		'A markdown notepad with live preview',
		"Conway's Game of Life",
		'A color palette generator'
	];

	const canSend = $derived(input.trim().length > 0 && !studio.streaming && studio.hasApiKey === true);

	// Follow the stream unless the user scrolled up to read something.
	$effect(() => {
		void studio.messages.at(-1)?.raw;
		void studio.messages.length;
		if (listEl && stickToBottom) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});

	function onScroll() {
		if (!listEl) return;
		stickToBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 100;
	}

	function submit(prompt?: string) {
		const text = prompt ?? input;
		if (!text.trim() || studio.streaming || studio.hasApiKey !== true) return;
		if (prompt === undefined) {
			input = '';
			if (textareaEl) textareaEl.style.height = 'auto';
		}
		stickToBottom = true;
		void studio.send(text);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	function autosize() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 160)}px`;
	}
</script>

<aside class="chat">
	<div class="messages" bind:this={listEl} onscroll={onScroll}>
		{#if studio.messages.length === 0}
			<!-- empty conversation: welcome + starting points -->
			<div class="empty">
				<Sparkles size={36} strokeWidth={1.5} aria-hidden="true" />
				<p class="empty-title">Build something.</p>
				<p class="empty-hint">
					Describe a mini app and Claude writes it straight into the editor — then iterate together.
				</p>
				<div class="suggestions">
					{#each SUGGESTIONS as suggestion (suggestion)}
						<button
							class="suggestion"
							onclick={() => submit(suggestion)}
							disabled={studio.hasApiKey !== true}
						>
							{suggestion}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			{#each studio.messages as message (message.id)}
				<MessageBubble {studio} {message} />
			{/each}
		{/if}
	</div>

	{#if studio.hasApiKey === false}
		<!-- missing key: the one setup step, spelled out -->
		<div class="key-banner" role="alert">
			<KeyRound size={15} aria-hidden="true" />
			<p>
				Add <code>ANTHROPIC_API_KEY=sk-ant-…</code> to <code>.env</code> in the project root, then
				restart the dev server.
			</p>
		</div>
	{/if}

	<div class="composer">
		<textarea
			bind:this={textareaEl}
			bind:value={input}
			onkeydown={onKeydown}
			oninput={autosize}
			rows="1"
			placeholder={studio.hasApiKey === false ? 'Waiting for an API key…' : 'Describe what to build or change…'}
			disabled={studio.hasApiKey !== true}
			aria-label="Message"
		></textarea>
		{#if studio.streaming}
			<button class="send stop" onclick={() => studio.stop()} title="Stop generating" aria-label="Stop generating">
				<Square size={14} fill="currentColor" aria-hidden="true" />
			</button>
		{:else}
			<button class="send" onclick={() => submit()} disabled={!canSend} title="Send" aria-label="Send">
				<ArrowUp size={16} strokeWidth={2.4} aria-hidden="true" />
			</button>
		{/if}
	</div>
</aside>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: var(--bg-panel);
		border-right: 1px solid var(--border);
	}

	.messages {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 18px 16px;
	}

	.empty {
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 6px;
		padding: 24px 8px;
		color: var(--text-faint);
	}
	.empty > :global(svg) {
		opacity: 0.5;
		margin-bottom: 6px;
		color: var(--accent);
	}
	.empty-title {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
	}
	.empty-hint {
		margin: 0 0 12px;
		font-size: 13px;
		max-width: 260px;
	}
	.suggestions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 280px;
	}
	.suggestion {
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 13px;
		padding: 8px 12px;
		cursor: pointer;
		text-align: left;
		transition:
			border-color 150ms ease,
			background-color 150ms ease,
			color 150ms ease;
	}
	.suggestion:hover:not(:disabled) {
		background: var(--accent-dim);
		border-color: var(--accent);
		color: var(--text);
	}
	.suggestion:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.key-banner {
		display: flex;
		gap: 9px;
		align-items: flex-start;
		margin: 0 12px 10px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
		background: var(--warning-dim);
		border-radius: var(--radius-sm);
		color: var(--warning);
		font-size: 12.5px;
	}
	.key-banner > :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.key-banner p {
		margin: 0;
		color: var(--text);
	}
	.key-banner code {
		font-family: var(--font-mono);
		font-size: 11.5px;
		background: var(--bg-inset);
		padding: 1px 5px;
		border-radius: 4px;
	}

	.composer {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		padding: 10px 12px 12px;
		border-top: 1px solid var(--border);
	}

	textarea {
		flex: 1;
		resize: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
		color: var(--text);
		font: inherit;
		padding: 9px 13px;
		max-height: 160px;
		transition: border-color 150ms ease;
	}
	textarea:focus {
		outline: none;
		border-color: var(--accent);
	}
	textarea:disabled {
		opacity: 0.5;
	}
	textarea::placeholder {
		color: var(--text-faint);
	}

	.send {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-contrast);
		cursor: pointer;
		transition:
			background-color 150ms ease,
			transform 100ms ease;
	}
	.send:hover:not(:disabled) {
		background: var(--accent-strong);
	}
	.send:active:not(:disabled) {
		transform: scale(0.92);
	}
	.send:disabled {
		background: var(--bg-elevated);
		color: var(--text-faint);
		cursor: not-allowed;
	}
	.send.stop {
		background: var(--bg-elevated);
		color: var(--text);
		border: 1px solid var(--border-strong);
	}
	.send.stop:hover {
		border-color: var(--danger);
		color: var(--danger);
		background: var(--bg-elevated);
	}
</style>
