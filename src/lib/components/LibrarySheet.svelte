<script lang="ts">
	import BookMarked from '@lucide/svelte/icons/book-marked';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let title = $state('');
	let justSaved = $state(false);

	// Suggest a title from the conversation each time the sheet opens.
	$effect(() => {
		if (studio.libraryOpen && !title) title = studio.suggestedTitle();
	});

	const canSave = $derived(title.trim().length > 0 && !studio.libraryBusy && !studio.streaming);

	async function save() {
		if (!canSave) return;
		if (await studio.saveView(title)) {
			title = '';
			justSaved = true;
			setTimeout(() => (justSaved = false), 1800);
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function remove(id: string, name: string) {
		if (!confirm(`Delete "${name}" from the library?`)) return;
		void studio.deleteView(id);
	}
</script>

<Sheet.Root bind:open={studio.libraryOpen}>
	<Sheet.Content side="right" class="flex w-[380px] flex-col gap-0 p-0 sm:max-w-[380px]">
		<Sheet.Header class="border-b">
			<Sheet.Title class="flex items-center gap-2">
				<BookMarked class="size-4" aria-hidden="true" />
				Library
			</Sheet.Title>
			<Sheet.Description>Views you have assembled, ready to reuse.</Sheet.Description>
		</Sheet.Header>

		<form
			class="flex gap-2 border-b p-4"
			onsubmit={(e) => {
				e.preventDefault();
				void save();
			}}
		>
			<Input bind:value={title} placeholder="Name the current view…" aria-label="View title" />
			<Button type="submit" size="sm" disabled={!canSave} class="shrink-0">
				{#if studio.libraryBusy === 'saving'}
					<LoaderCircle class="animate-spin" aria-hidden="true" />
				{/if}
				{justSaved ? 'Saved' : 'Save'}
			</Button>
		</form>

		{#if studio.libraryError}
			<p class="px-4 pt-3 text-xs text-destructive">{studio.libraryError}</p>
		{/if}

		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if studio.library === null}
				<!-- loading: rows mirror the list geometry -->
				<div class="flex flex-col gap-2 p-4">
					{#each [0, 1, 2] as i (i)}
						<div class="h-14 animate-pulse rounded-md bg-muted"></div>
					{/each}
				</div>
			{:else if studio.library.length === 0}
				<!-- empty: nothing saved yet -->
				<div class="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
					<FolderOpen class="mb-1 size-9 text-muted-foreground/40" strokeWidth={1.5} aria-hidden="true" />
					<p class="text-sm font-medium">Nothing saved yet.</p>
					<p class="text-xs text-muted-foreground">
						Assemble a view with the AI, then name it above to keep it.
					</p>
				</div>
			{:else}
				<ul class="flex flex-col p-2">
					{#each studio.library as view (view.id)}
						<li class="group flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
							<button
								type="button"
								class="flex min-w-0 flex-1 flex-col items-start text-left"
								onclick={() => studio.loadView(view.id)}
								disabled={studio.libraryBusy !== null || studio.streaming}
							>
								<span class="w-full truncate text-sm font-medium">{view.title}</span>
								<span class="text-xs text-muted-foreground">
									{formatDate(view.createdAt)} · {view.fileCount} {view.fileCount === 1 ? 'file' : 'files'}
								</span>
							</button>
							<Button
								variant="ghost"
								size="icon-xs"
								class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
								onclick={() => remove(view.id, view.title)}
								disabled={studio.libraryBusy !== null}
								title="Delete"
								aria-label="Delete {view.title}"
							>
								<Trash2 aria-hidden="true" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
