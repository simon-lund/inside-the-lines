<script lang="ts">
	import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { viaOf, type Flow, type Os } from '$lib/os/os.svelte';
	import ModuleError from './ModuleError.svelte';
	import ModuleSkeleton from './ModuleSkeleton.svelte';
	import SpecModule from './SpecModule.svelte';

	/**
	 * One flow: everything one intention produced, as one group in the band. A line runs
	 * across the group and says where each module came from — the intention at its start,
	 * the action that opened a module above that module. New slots slide in and scroll into view.
	 */
	let { os, flow }: { os: Os; flow: Flow } = $props();

	const reducedMotion =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Only slots created in this session slide in — a reload shouldn't replay the whole space.
	function enter(node: HTMLElement, key: string) {
		if (!os.isFresh(key) || reducedMotion) return {};
		requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }));
		return fly(node, { x: 48, duration: 380, opacity: 0 });
	}
</script>

<div class="flow" role="list" aria-label={flow.intent}>
	{#each flow.items as item, i (item.key)}
		{@const via = viaOf(item)}
		<div class="slot" role="listitem" animate:flip={{ duration: reducedMotion ? 0 : 320 }} in:enter={item.key}>
			<div class="caption">
				{#if i === 0}
					<!-- the group's start: the intention typed into Locus -->
					<span class="label intent">
						<Sparkles size={13} strokeWidth={2} aria-hidden="true" />
						<span class="text">{flow.intent}</span>
					</span>
				{:else if via}
					<!-- opened from another module -->
					<span class="label">
						<CornerDownRight size={13} strokeWidth={2} aria-hidden="true" />
						<span class="text">{via.action}<span class="from">&nbsp;· from {via.from}</span></span>
					</span>
				{/if}
			</div>

			<div class="card">
				{#if item.status === 'pending'}
					<!-- loading: module being assembled -->
					<ModuleSkeleton label={item.request.intent} />
				{:else if item.status === 'failed'}
					<!-- error: local to this slot, with retry -->
					<ModuleError
						intent={item.request.intent}
						code={item.code}
						keyVar={os.health?.keyVar}
						onretry={() => os.retry(flow.key, item.key)}
						ondismiss={() => os.dismiss(flow.key, item.key)}
					/>
				{:else}
					<!-- data: the assembled module -->
					<SpecModule
						module={item.module}
						onopen={(action) => os.open(flow.key, item.key, action)}
						onmore={() => (os.target = { flowKey: flow.key, itemKey: item.key, title: item.module.title })}
					/>
					<button
						type="button"
						class="close"
						title="Remove from flow"
						aria-label="Remove {item.module.title} from flow"
						onclick={() => os.dismiss(flow.key, item.key)}
					>
						<X size={12} strokeWidth={2.4} aria-hidden="true" />
					</button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.flow {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 32px;
		flex: 0 0 auto;
	}
	/* The line that holds the group together, behind the captions. */
	.flow::before {
		content: '';
		position: absolute;
		top: 10px;
		left: 0;
		right: 0;
		border-top: 1px solid var(--m-pill-hover);
	}
	.slot {
		flex: 0 0 auto;
		max-width: 100%;
	}
	.caption {
		display: flex;
		height: 20px;
		margin-bottom: 16px;
		/* As wide as the card below, never wider: long captions truncate instead. */
		width: 0;
		min-width: 100%;
	}
	.label {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		padding-right: 12px;
		/* Masks the line behind the text. */
		background: var(--m-bg);
		font-size: 12.5px;
		color: var(--m-muted);
	}
	.text {
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.label.intent {
		color: var(--m-text);
		font-weight: 500;
	}
	.label.intent :global(svg) {
		color: var(--m-accent);
	}
	.label :global(svg) {
		flex: 0 0 auto;
	}
	.from {
		color: var(--m-faint);
	}
	.card {
		position: relative;
	}
	.close {
		position: absolute;
		top: -9px;
		right: -9px;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border: none;
		border-radius: 50%;
		background: var(--m-card);
		color: var(--m-muted);
		box-shadow: var(--m-shadow);
		cursor: pointer;
		opacity: 0;
		transition: opacity 150ms ease;
	}
	.slot:hover .close,
	.close:focus-visible {
		opacity: 1;
	}
	.close:hover {
		color: var(--m-text);
	}
	/* Phones: a module fills the screen but for an edge where the next one peeks in. */
	@media (max-width: 640px) {
		.flow {
			gap: 16px;
		}
		.slot {
			max-width: calc(100vw - 48px);
		}
	}
</style>
