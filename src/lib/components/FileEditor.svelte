<script lang="ts">
	import Editor from '@sveltejs/repl/editor';
	import { cn } from '$lib/utils.js';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();
</script>

<div class="flex h-full min-h-0 flex-col bg-background">
	<div class="flex shrink-0 gap-0.5 overflow-x-auto border-b bg-card px-2 pt-1.5" role="tablist" aria-label="Files">
		{#each studio.workspace.file_nodes as file (file.name)}
			{@const active = studio.workspace.current?.name === file.name}
			<button
				role="tab"
				aria-selected={active}
				class={cn(
					'inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-transparent px-3 py-1 font-mono text-xs whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
					active && 'border-border bg-background text-foreground'
				)}
				onclick={() => studio.workspace.select(file.name)}
			>
				{file.name}
				{#if studio.workspace.modified[file.name]}
					<span class="size-1.5 rounded-full bg-(--accent-text)" title="Modified" aria-label="Modified"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- While the AI writes, the editor is display-only. -->
	<div class={cn('min-h-0 flex-1 [&>.container]:h-full', studio.streaming && 'pointer-events-none opacity-85')}>
		<Editor workspace={studio.workspace} />
	</div>
</div>
