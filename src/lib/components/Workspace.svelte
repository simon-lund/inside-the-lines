<script lang="ts">
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import Check from '@lucide/svelte/icons/check';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Copy from '@lucide/svelte/icons/copy';
	import Download from '@lucide/svelte/icons/download';
	import Eye from '@lucide/svelte/icons/eye';
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import FileEditor from './FileEditor.svelte';
	import Preview from './Preview.svelte';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let copied = $state(false);

	// The toolbar shows the AI's state; bundler progress is the Viewer's banner.
	const statusLabel = $derived(
		studio.streaming
			? studio.phase === 'thinking'
				? 'Thinking…'
				: studio.phase === 'writing'
					? 'Writing code…'
					: 'Working…'
			: null
	);

	async function copyCurrentFile() {
		const current = studio.workspace.current;
		if (!current) return;
		await navigator.clipboard.writeText(current.contents);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function downloadCurrentFile() {
		const current = studio.workspace.current;
		if (!current) return;
		const url = URL.createObjectURL(new Blob([current.contents], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = current.basename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function onKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			void studio.rebundle();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<section class="flex min-h-0 min-w-0 flex-col">
	<div class="flex items-center gap-3 border-b bg-card px-3 py-2">
		<Tabs.Root
			value={studio.activeTab}
			onValueChange={(value) => studio.pinTab(value as 'preview' | 'code')}
		>
			<Tabs.List>
				<Tabs.Trigger value="preview">
					<Eye aria-hidden="true" />
					Preview
				</Tabs.Trigger>
				<Tabs.Trigger value="code">
					<CodeXml aria-hidden="true" />
					Code
				</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		{#if statusLabel}
			<span class="flex items-center gap-2 text-xs text-muted-foreground">
				<span class="size-1.5 animate-pulse rounded-full bg-(--accent-text)" aria-hidden="true"></span>
				{statusLabel}
			</span>
		{/if}

		<div class="ml-auto flex gap-0.5">
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => (studio.libraryOpen = true)}
				title="Save to library"
				aria-label="Save to library"
			>
				<Bookmark aria-hidden="true" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => studio.rebundle()}
				disabled={studio.streaming}
				title="Re-run (Ctrl+Enter)"
				aria-label="Re-run"
			>
				<Play aria-hidden="true" />
			</Button>
			<Button variant="ghost" size="icon-sm" onclick={copyCurrentFile} title="Copy current file" aria-label="Copy current file">
				{#if copied}
					<Check class="text-emerald-400" aria-hidden="true" />
				{:else}
					<Copy aria-hidden="true" />
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={downloadCurrentFile}
				title="Download current file"
				aria-label="Download current file"
			>
				<Download aria-hidden="true" />
			</Button>
		</div>
	</div>

	<!-- Both panes stay mounted: the editor keeps its state, the app keeps running. -->
	<div class="min-h-0 flex-1" hidden={studio.activeTab !== 'preview'}>
		<Preview {studio} />
	</div>
	<div class="min-h-0 flex-1" hidden={studio.activeTab !== 'code'}>
		<FileEditor {studio} />
	</div>
</section>
