<script lang="ts">
	import Sparkle from 'phosphor-svelte/lib/Sparkle';
	import X from 'phosphor-svelte/lib/X';
	import { fly } from 'svelte/transition';
	import { Page } from '$lib/design/index.js';
	import type { Os, Space } from '$lib/os/os.svelte';
	import SectionError from './SectionError.svelte';
	import SectionSkeleton from './SectionSkeleton.svelte';
	import SpecSection from './SpecSection.svelte';

	/**
	 * A Space as one live page: its cells, the first from the intention itself, every later
	 * one starting with the follow-up that was typed.
	 */
	let { os, space }: { os: Os; space: Space } = $props();

	const reducedMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Only sections created in this session move in — a reload shouldn't replay the page.
	function enter(node: HTMLElement, key: string) {
		if (!os.isFresh(key) || reducedMotion) return {};
		requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
		return fly(node, { y: 16, duration: 320, opacity: 0 });
	}
</script>

<Page title={space.title} lede={space.lede ?? ''}>
	{#each space.cells as cell, c (cell.key)}
		{#if c > 0}
			<!-- a follow-up typed on the page -->
			<p class="prompt"><Sparkle size={16} weight="fill" aria-hidden="true" />{cell.intent}</p>
		{/if}
		{#each cell.items as item, i (item.key)}
			<!-- The first item of a cell sits under its title or prompt line, which already names it. -->
			{@const named = i === 0 ? '' : item.status === 'ready' ? '' : item.request.intent}
			<div class="slot" in:enter={item.key}>
				{#if item.status === 'pending'}
					<!-- loading: section being assembled -->
					<SectionSkeleton label={named} />
				{:else if item.status === 'failed'}
					<!-- error: local to this section, with retry -->
					<SectionError
						intent={named}
						code={item.code}
						keyVar={os.health?.keyVar}
						onretry={() => os.retry(cell.key, item.key)}
						ondismiss={() => os.dismiss(cell.key, item.key)}
					/>
				{:else}
					<!-- data: the assembled section -->
					<SpecSection section={item.section} onopen={(action) => os.open(cell.key, item.key, action)} />
					<button
						type="button"
						class="remove"
						title="Remove from page"
						aria-label="Remove {item.section.title} from the page"
						onclick={() => os.dismiss(cell.key, item.key)}
					>
						<X size={16} aria-hidden="true" />
					</button>
				{/if}
			</div>
		{/each}
	{/each}
</Page>

<style>
	/* A follow-up typed on the page: the person's words, heading their part of it. */
	.prompt {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		padding: 26px var(--m-inset) 0;
		border-top: 1px solid var(--m-line);
		font-size: var(--m-type-title);
		line-height: var(--m-type-title-leading);
		font-weight: 600;
		color: var(--m-ink);
	}
	.prompt :global(svg) {
		flex: 0 0 auto;
		color: var(--m-clementine);
	}
	/* The prompt line and its first section read as one cell. */
	.prompt + .slot :global(> section) {
		border-top: none;
	}
	.slot {
		position: relative;
	}
	/* Quiet icon key: a ghost circle in ink 2, the tint on hover. */
	.remove {
		position: absolute;
		top: 20px;
		right: 18px;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		color: var(--m-ink-2);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity var(--m-dur-quick) var(--m-ease-settle),
			background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.slot:hover .remove,
	.remove:focus-visible {
		opacity: 1;
	}
	.remove:hover {
		background: var(--m-tint);
		color: var(--m-ink);
	}
	@media (max-width: 640px) {
		.prompt {
			padding-top: 22px;
		}
		/* No hover on touch: keep the remove button reachable. */
		.remove {
			opacity: 1;
			top: 14px;
			right: 4px;
		}
	}
</style>
