<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Copy from '@lucide/svelte/icons/copy';
	import Download from '@lucide/svelte/icons/download';
	import Eye from '@lucide/svelte/icons/eye';
	import Play from '@lucide/svelte/icons/play';
	import CodeEditor from './CodeEditor.svelte';
	import Preview from './Preview.svelte';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let copied = $state(false);

	const hasCode = $derived(studio.code.trim().length > 0);
	const statusLabel = $derived(
		!studio.streaming
			? null
			: studio.phase === 'thinking'
				? 'Thinking…'
				: studio.phase === 'writing'
					? 'Writing code…'
					: 'Working…'
	);

	async function copyCode() {
		await navigator.clipboard.writeText(studio.code);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function downloadCode() {
		const url = URL.createObjectURL(new Blob([studio.code], { type: 'text/html' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'app.html';
		a.click();
		URL.revokeObjectURL(url);
	}

	function onKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && hasCode) {
			event.preventDefault();
			studio.runPreview();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<section class="workspace">
	<div class="toolbar">
		<div class="tabs" role="tablist" aria-label="Workspace view">
			<button
				role="tab"
				aria-selected={studio.activeTab === 'preview'}
				class="tab"
				class:active={studio.activeTab === 'preview'}
				onclick={() => studio.pinTab('preview')}
			>
				<Eye size={14} aria-hidden="true" />
				Preview
			</button>
			<button
				role="tab"
				aria-selected={studio.activeTab === 'code'}
				class="tab"
				class:active={studio.activeTab === 'code'}
				onclick={() => studio.pinTab('code')}
			>
				<CodeXml size={14} aria-hidden="true" />
				Code
			</button>
		</div>

		{#if statusLabel}
			<span class="status">
				<span class="dot" aria-hidden="true"></span>
				{statusLabel}
			</span>
		{/if}

		<div class="actions">
			<button
				class="btn btn-icon"
				onclick={() => studio.runPreview()}
				disabled={!hasCode || studio.streaming}
				title="Run (Ctrl+Enter)"
				aria-label="Run"
			>
				<Play size={15} aria-hidden="true" />
			</button>
			<button
				class="btn btn-icon"
				onclick={copyCode}
				disabled={!hasCode}
				title="Copy code"
				aria-label="Copy code"
			>
				{#if copied}
					<Check size={15} color="var(--success)" aria-hidden="true" />
				{:else}
					<Copy size={15} aria-hidden="true" />
				{/if}
			</button>
			<button
				class="btn btn-icon"
				onclick={downloadCode}
				disabled={!hasCode}
				title="Download app.html"
				aria-label="Download app.html"
			>
				<Download size={15} aria-hidden="true" />
			</button>
		</div>
	</div>

	<!-- Both panes stay mounted: the editor keeps its state, the app keeps running. -->
	<div class="pane" hidden={studio.activeTab !== 'preview'}>
		<Preview {studio} />
	</div>
	<div class="pane" hidden={studio.activeTab !== 'code'}>
		<CodeEditor {studio} />
	</div>
</section>

<style>
	.workspace {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-panel);
	}

	.tabs {
		display: flex;
		gap: 2px;
		background: var(--bg-inset);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 2px;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: none;
		border-radius: 5px;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 13px;
		padding: 4px 12px;
		cursor: pointer;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}
	.tab:hover {
		color: var(--text);
	}
	.tab.active {
		background: var(--bg-elevated);
		color: var(--text);
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 12.5px;
		color: var(--text-muted);
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
		animation: blink 1.2s ease-in-out infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0.25;
		}
	}

	.actions {
		margin-left: auto;
		display: flex;
		gap: 2px;
	}

	.pane {
		flex: 1;
		min-height: 0;
	}
	.pane[hidden] {
		display: none;
	}
</style>
