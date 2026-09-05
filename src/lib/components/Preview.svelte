<script lang="ts">
	import AppWindow from '@lucide/svelte/icons/app-window';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import X from '@lucide/svelte/icons/x';
	import { buildPreviewDocument } from '$lib/artifact';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let errors = $state<string[]>([]);

	const doc = $derived(studio.previewCode ? buildPreviewDocument(studio.previewCode) : '');

	// Each run starts with a clean slate of errors.
	$effect(() => {
		void studio.runId;
		errors = [];
	});

	function onMessage(event: MessageEvent) {
		// Only trust messages from our own (sandboxed, origin "null") iframe.
		if (!iframeEl || event.source !== iframeEl.contentWindow) return;
		const data = event.data as { __studio?: string; message?: string } | null;
		if (data?.__studio === 'runtime_error' && typeof data.message === 'string') {
			if (errors.length < 5 && !errors.includes(data.message)) {
				errors.push(data.message);
			}
		}
	}

	function askAiToFix() {
		const report = errors.join('\n');
		errors = [];
		studio.pinTab('preview');
		void studio.send('The preview throws a runtime error — please fix it.', { errorReport: report });
	}
</script>

<svelte:window onmessage={onMessage} />

<div class="preview">
	{#if !doc}
		<!-- empty: nothing has been run yet -->
		<div class="empty">
			<AppWindow size={40} strokeWidth={1.25} aria-hidden="true" />
			<p class="empty-title">Nothing running yet</p>
			<p class="empty-hint">Ask the AI to build something — the app will appear here.</p>
		</div>
	{:else}
		{#key studio.runId}
			<iframe
				bind:this={iframeEl}
				title="App preview"
				srcdoc={doc}
				sandbox="allow-scripts allow-forms allow-modals"
			></iframe>
		{/key}
	{/if}

	{#if errors.length > 0}
		<div class="error-toast" role="alert">
			<TriangleAlert size={15} aria-hidden="true" />
			<div class="error-text">
				<p class="error-title">
					{errors.length === 1 ? 'Runtime error' : `${errors.length} runtime errors`}
				</p>
				<p class="error-detail">{errors[0]}</p>
			</div>
			<button
				class="btn btn-outline fix"
				onclick={askAiToFix}
				disabled={studio.streaming || studio.hasApiKey !== true}
			>
				<WandSparkles size={13} aria-hidden="true" />
				Fix with AI
			</button>
			<button class="btn btn-icon" onclick={() => (errors = [])} title="Dismiss" aria-label="Dismiss errors">
				<X size={14} aria-hidden="true" />
			</button>
		</div>
	{/if}
</div>

<style>
	.preview {
		position: relative;
		height: 100%;
		min-height: 0;
		background: var(--bg-inset);
	}

	iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: none;
		background: #fff;
	}

	.empty {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		text-align: center;
		color: var(--text-faint);
		padding: 24px;
	}
	.empty > :global(svg) {
		opacity: 0.4;
		margin-bottom: 8px;
	}
	.empty-title {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
	}
	.empty-hint {
		margin: 0;
		font-size: 13px;
		max-width: 280px;
	}

	.error-toast {
		position: absolute;
		left: 14px;
		right: 14px;
		bottom: 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--bg-elevated);
		border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent);
		border-radius: var(--radius);
		padding: 10px 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		animation: rise 200ms ease;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	.error-toast > :global(svg) {
		flex-shrink: 0;
		color: var(--danger);
	}
	.error-text {
		flex: 1;
		min-width: 0;
	}
	.error-title {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
	}
	.error-detail {
		margin: 0;
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fix {
		flex-shrink: 0;
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
	}
	.fix:hover:not(:disabled) {
		background: var(--accent-dim);
		color: var(--accent-strong);
	}
</style>
