<script lang="ts">
	import Editor from '@sveltejs/repl/editor';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();
</script>

<div class="wrapper">
	<div class="file-tabs" role="tablist" aria-label="Files">
		{#each studio.workspace.file_nodes as file (file.name)}
			<button
				role="tab"
				class="file-tab"
				class:active={studio.workspace.current?.name === file.name}
				aria-selected={studio.workspace.current?.name === file.name}
				onclick={() => studio.workspace.select(file.name)}
			>
				{file.name}
				{#if studio.workspace.modified[file.name]}
					<span class="dot" title="Modified" aria-label="Modified"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- While the AI writes, the editor is display-only. -->
	<div class="editor-host" class:locked={studio.streaming}>
		<Editor workspace={studio.workspace} />
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		background: var(--bg-inset);
	}

	.file-tabs {
		display: flex;
		gap: 2px;
		padding: 6px 8px 0;
		border-bottom: 1px solid var(--border);
		overflow-x: auto;
		flex-shrink: 0;
		background: var(--bg-panel);
	}

	.file-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid transparent;
		border-bottom: none;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: none;
		color: var(--text-muted);
		font: inherit;
		font-size: 12.5px;
		font-family: var(--font-mono);
		padding: 5px 12px;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}
	.file-tab:hover {
		color: var(--text);
	}
	.file-tab.active {
		background: var(--bg-inset);
		border-color: var(--border);
		color: var(--text);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}

	.editor-host {
		flex: 1;
		min-height: 0;
	}
	.editor-host.locked {
		pointer-events: none;
		opacity: 0.85;
	}
	.editor-host > :global(.container) {
		height: 100%;
	}
</style>
