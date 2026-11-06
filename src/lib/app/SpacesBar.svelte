<script lang="ts">
	import Books from 'phosphor-svelte/lib/Books';
	import Plus from 'phosphor-svelte/lib/Plus';
	import X from 'phosphor-svelte/lib/X';
	import type { Snippet } from 'svelte';
	import type { Pages } from '$lib/pages/pages.svelte';
	import Brand from './Brand.svelte';

	/**
	 * The top of the app, in two rows: the name and the Library; below it, once there is a page,
	 * one tab per page and a new-page button, then `trailing` (what the open page offers) at the end.
	 */
	let { pages, trailing }: { pages: Pages; trailing?: Snippet } = $props();
</script>

<header class="bar">
	<div class="top">
		<Brand />
		<a class="library" href="/library"><Books size={18} aria-hidden="true" />Library</a>
	</div>

	{#if pages.pages.length > 0}
		<div class="row">
			<nav class="spaces" aria-label="Pages">
				{#each pages.pages as page (page.key)}
					<span class="space" class:active={page.key === pages.activeKey}>
						<button type="button" class="space-name" onclick={() => pages.select(page.key)}>{page.title}</button>
						<button type="button" class="space-close" aria-label="Close {page.title}" onclick={() => pages.close(page.key)}>
							<X size={12} weight="bold" aria-hidden="true" />
						</button>
					</span>
				{/each}
				<button
					type="button"
					class="space new"
					class:active={pages.activeKey === null}
					onclick={() => pages.select(null)}
				>
					<Plus size={16} weight="bold" aria-hidden="true" />
					New page
				</button>
			</nav>
			{#if trailing}<div class="trailing">{@render trailing()}</div>{/if}
		</div>
	{/if}
</header>

<style>
	.bar {
		display: flex;
		flex-direction: column;
		gap: 14px;
		font-family: var(--m-font);
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 24px;
	}
	/* The tabs scroll; what the open page offers stays at the end. */
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.trailing {
		flex-shrink: 0;
		margin-left: auto;
	}
	.spaces {
		display: flex;
		align-items: center;
		gap: 2px;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	/* Tabs are a set: flat; the open one is a tint, never raised. */
	.space {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		border-radius: 999px;
		color: var(--m-ink-2);
		transition: background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.space:hover {
		background: var(--m-tint);
	}
	.space.active {
		background: var(--m-tint);
		color: var(--m-ink);
		font-weight: 600;
	}
	.space-name,
	.new {
		height: var(--m-control-sm);
		padding: 0 4px 0 14px;
		color: inherit;
		cursor: pointer;
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.new {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0 14px;
	}
	.space-close {
		display: grid;
		place-items: center;
		height: var(--m-control-sm);
		padding: 0 12px 0 4px;
		color: var(--m-ink-3);
		cursor: pointer;
		opacity: 0;
	}
	.space:hover .space-close,
	.space-close:focus-visible {
		opacity: 1;
	}
	.space-close:hover {
		color: var(--m-ink);
	}
	.library {
		display: inline-flex;
		margin-left: auto;
		align-items: center;
		gap: 6px;
		height: var(--m-control-sm);
		padding: 0 12px;
		border-radius: 999px;
		color: var(--m-ink-2);
		transition: background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.library:hover {
		background: var(--m-tint);
		color: var(--m-ink);
	}
	/* Phones: the tabs fade out at the edge they scroll past. */
	@media (max-width: 640px) {
		.spaces {
			mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
			padding-right: 24px;
		}
	}
	/* Touch has no hover: the open tab shows its close button. */
	@media (hover: none) {
		.space.active .space-close {
			opacity: 1;
		}
	}
</style>
