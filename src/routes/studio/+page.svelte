<script lang="ts">
	import { onMount } from 'svelte';
	import BookMarked from '@lucide/svelte/icons/book-marked';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Chat from '$lib/components/Chat.svelte';
	import LibrarySheet from '$lib/components/LibrarySheet.svelte';
	import Workspace from '$lib/components/Workspace.svelte';
	import { Studio } from '$lib/studio.svelte';

	const studio = new Studio();

	onMount(() => {
		void studio.init();
		if (import.meta.env.DEV) {
			(window as unknown as { __studio: Studio }).__studio = studio;
		}
	});

	function newSession() {
		const dirty =
			studio.messages.length > 0 || Object.keys(studio.workspace.modified).length > 0;
		if (dirty && !confirm('Clear the chat and the current app?')) return;
		studio.reset();
	}
</script>

<svelte:head>
	<title>Studio · Mercury OS prototype</title>
</svelte:head>

<div class="flex h-screen flex-col">
	<header class="flex items-center gap-3 border-b bg-card px-4 py-2">
		<div class="mr-auto flex items-center gap-2.5">
			<span
				class="size-3.5 rounded-full bg-(--accent-text) shadow-[0_0_10px_var(--accent-text)]"
				aria-hidden="true"
			></span>
			<h1 class="text-[15px] font-medium tracking-tight">Mercury Studio</h1>
		</div>
		{#if studio.health}
			<Badge variant="outline" title="Provider and model used for generation">
				{studio.health.provider} · {studio.health.model}
			</Badge>
		{/if}
		<Button variant="ghost" size="sm" href="/">
			<LayoutGrid aria-hidden="true" />
			OS
		</Button>
		<Button variant="ghost" size="sm" onclick={() => (studio.libraryOpen = true)}>
			<BookMarked aria-hidden="true" />
			Library
		</Button>
		<Button variant="outline" size="sm" onclick={newSession}>
			<SquarePen aria-hidden="true" />
			New session
		</Button>
	</header>

	<main
		class="grid min-h-0 flex-1 grid-cols-[minmax(320px,400px)_1fr] max-md:grid-cols-1 max-md:grid-rows-[1fr_minmax(240px,40%)]"
	>
		<Chat {studio} />
		<Workspace {studio} />
	</main>
</div>

<LibrarySheet {studio} />
