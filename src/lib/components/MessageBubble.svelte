<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import FileCode2 from '@lucide/svelte/icons/file-code-2';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import type { Studio, UiMessage } from '$lib/studio.svelte';
	import { ERROR_MESSAGES } from '$lib/types';

	let { studio, message }: { studio: Studio; message: UiMessage } = $props();

	const isThinkingPlaceholder = $derived(
		message.status === 'streaming' && !message.display && message.fileNames.length === 0
	);
	const chipLabel = $derived(
		message.fileNames.length === 1
			? message.fileNames[0]
			: `${message.fileNames.length} files`
	);
	const phaseLabel = $derived(
		studio.phase === 'thinking' ? 'Thinking…' : studio.phase === 'writing' ? 'Writing…' : 'Working…'
	);
</script>

{#if message.role === 'user'}
	<div class="row user">
		<div class="bubble">{message.display}</div>
	</div>
{:else}
	<div class="row assistant">
		{#if message.status === 'error'}
			<div class="error-card" role="alert">
				<CircleAlert size={15} aria-hidden="true" />
				<div class="error-body">
					<p>{ERROR_MESSAGES[message.errorCode ?? 'stream_error']}</p>
					<button class="btn btn-outline" onclick={() => studio.retryLast()} disabled={studio.streaming}>
						<RotateCcw size={13} aria-hidden="true" />
						Retry
					</button>
				</div>
			</div>
		{:else if isThinkingPlaceholder}
			<p class="shimmer">{phaseLabel}</p>
		{:else}
			{#if message.display}
				<p class="prose">{message.display}</p>
			{/if}
			{#if message.fileNames.length > 0}
				<button
					class="code-chip"
					class:writing={message.status === 'streaming'}
					onclick={() => studio.pinTab('code')}
					title="Open in the code view"
				>
					{#if message.status === 'streaming'}
						<LoaderCircle size={15} class="spin" aria-hidden="true" />
					{:else}
						<FileCode2 size={15} aria-hidden="true" />
					{/if}
					<span class="chip-name">{chipLabel}</span>
					<span class="chip-meta">
						{message.status === 'streaming' ? 'writing…' : 'view code'}
					</span>
				</button>
			{/if}
			{#if message.stopReason === 'refusal'}
				<p class="notice">Claude declined this request.</p>
			{:else if message.stopReason === 'max_tokens'}
				<p class="notice">The response hit the length limit and may be incomplete.</p>
			{:else if message.stopReason === 'aborted'}
				<p class="notice">Stopped.</p>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row.user {
		align-items: flex-end;
	}

	.bubble {
		max-width: 88%;
		background: var(--bg-elevated);
		border-radius: var(--radius) var(--radius) 4px var(--radius);
		padding: 8px 13px;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}

	.prose {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}

	.notice {
		margin: 0;
		font-size: 12.5px;
		color: var(--text-faint);
		font-style: italic;
	}

	.shimmer {
		margin: 0;
		font-size: 13.5px;
		color: var(--text-muted);
		background: linear-gradient(90deg, var(--text-faint) 25%, var(--text) 50%, var(--text-faint) 75%);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shimmer 1.6s linear infinite;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	.code-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		align-self: flex-start;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-panel);
		color: var(--text);
		font: inherit;
		font-size: 13px;
		padding: 8px 12px;
		cursor: pointer;
		transition:
			border-color 150ms ease,
			background-color 150ms ease;
	}
	.code-chip:hover {
		background: var(--bg-hover);
		border-color: var(--border-strong);
	}
	.code-chip.writing {
		border-color: var(--accent);
		animation: pulse-border 1.4s ease-in-out infinite;
	}
	@keyframes pulse-border {
		50% {
			border-color: var(--border);
		}
	}
	.chip-name {
		font-family: var(--font-mono);
		font-size: 12.5px;
	}
	.chip-meta {
		color: var(--text-faint);
		font-size: 12px;
	}
	.code-chip :global(.spin) {
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-card {
		display: flex;
		gap: 9px;
		border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
		background: var(--danger-dim);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		color: var(--danger);
		font-size: 13px;
	}
	.error-card > :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.error-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-start;
	}
	.error-body p {
		margin: 0;
		color: var(--text);
	}
</style>
