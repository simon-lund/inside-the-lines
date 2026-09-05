<script lang="ts">
	import Viewer from '@sveltejs/repl/viewer';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import X from '@lucide/svelte/icons/x';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let dismissed = $state<string | null>(null);

	// One error surface: runtime errors from the iframe, or bundle failures.
	const activeError = $derived(
		studio.previewError ?? ((studio.bundler.result?.error as Error | undefined) || null)
	);
	const showToast = $derived(activeError !== null && dismissed !== activeError?.message);

	function askAiToFix() {
		if (!activeError) return;
		const report = `${activeError.name ?? 'Error'}: ${activeError.message}`;
		studio.previewError = null;
		studio.pinTab('preview');
		void studio.send('The app has an error — please fix it.', { errorReport: report });
	}
</script>

<div class="preview">
	<Viewer
		bundler={studio.bundler}
		bind:error={studio.previewError}
		status={studio.bundlerStatus}
		theme="dark"
	/>

	{#if showToast && activeError}
		<div class="error-toast" role="alert">
			<TriangleAlert size={15} aria-hidden="true" />
			<div class="error-text">
				<p class="error-title">The app has an error</p>
				<p class="error-detail">{activeError.message}</p>
			</div>
			<button
				class="btn btn-outline fix"
				onclick={askAiToFix}
				disabled={studio.streaming || studio.hasApiKey !== true}
			>
				<WandSparkles size={13} aria-hidden="true" />
				Fix with AI
			</button>
			<button
				class="btn btn-icon"
				onclick={() => (dismissed = activeError?.message ?? null)}
				title="Dismiss"
				aria-label="Dismiss error"
			>
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
	.preview > :global(.wrapper),
	.preview > :global(:first-child) {
		height: 100%;
	}

	.error-toast {
		position: absolute;
		left: 14px;
		right: 14px;
		bottom: 14px;
		z-index: 10;
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
