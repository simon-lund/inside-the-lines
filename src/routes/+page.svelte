<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Canvas } from '$lib/design/index.js';
		import Locus from '$lib/os/components/Locus.svelte';
	import PageView from '$lib/os/components/PageView.svelte';
	import SpacesBar from '$lib/os/components/SpacesBar.svelte';
	import { EXAMPLE_INTENTS } from '$lib/os/examples';
	import { Os } from '$lib/os/os.svelte';

	const os = new Os();

	onMount(() => {
		void os.init();
		if (import.meta.env.DEV) (window as unknown as { __os: Os }).__os = os;
	});

</script>

<svelte:head>
	<title>{os.active ? os.active.title : 'New page'}</title>
</svelte:head>

<Canvas>
	<div class="os">
		<SpacesBar {os} />

		{#if !os.active}
			<!-- empty: no space open — state an intention -->
			<section class="empty" in:fade={{ duration: 200 }}>
				<h1>Say what you’re planning.<span>She builds the page for it.</span></h1>
				<Locus {os} docked={false} />
				<div class="examples">
					{#each EXAMPLE_INTENTS as intent (intent)}
						<button type="button" onclick={() => os.newSpace(intent)}>{intent}</button>
					{/each}
				</div>
				{#if os.health && !os.health.hasApiKey}
					<p class="hint">
						No API key yet, so only these four work. Add <code>{os.health.keyVar}</code> to
						<code>.env</code> for anything else.
					</p>
				{/if}
			</section>
		{:else if os.active.cells.length === 0}
			<!-- empty page: every section was removed -->
			<section class="empty" in:fade={{ duration: 200 }}>
				<p class="lede">This page is empty. Add something below, or close it.</p>
			</section>
		{:else}
			<!-- data: the space as one page -->
			{#key os.active.key}
				<div class="page" in:fade={{ duration: 200 }}>
					<PageView {os} space={os.active} />
				</div>
			{/key}
		{/if}

		{#if os.active}
			<div class="dock"><Locus {os} docked /></div>
		{/if}
	</div>
</Canvas>

<style>
	.os {
		flex: 1 1 100%;
		display: flex;
		flex-direction: column;
		gap: 48px;
		min-width: 0;
		margin-top: -28px;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		margin: 12vh auto 0;
		width: min(640px, 100%);
		text-align: center;
	}
	h1 {
		margin: 0;
		font-size: 2.5rem;
		line-height: 2.75rem;
		font-weight: 600;
		letter-spacing: -0.04em;
	}
	h1 {
		margin-bottom: 18px;
	}
	/* The second line says what she does, a step quieter. */
	h1 span {
		display: block;
		color: var(--m-ink-2);
	}
	.examples {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 6px;
	}
	/* Suggestions are a set: flat chips, a stronger tint on hover. */
	.examples button {
		height: var(--m-control-sm);
		padding: 0 16px;
		border-radius: 999px;
		background: var(--m-tint);
		font-size: var(--m-type-tab);
		font-weight: 500;
		color: var(--m-ink);
		cursor: pointer;
		transition:
			background-color var(--m-dur-quick) var(--m-ease-settle),
			scale var(--m-dur-quick) var(--m-ease-settle);
	}
	.examples button:hover {
		background: var(--m-tint-strong);
	}
	.examples button:active {
		scale: 0.97;
		transition-duration: var(--m-dur-press);
	}
	.hint {
		margin: 12px 0 0;
		font-size: var(--m-type-label);
		line-height: var(--m-type-label-leading);
		color: var(--m-ink-2);
	}
	code {
		font-family: var(--m-font-mono);
		font-size: var(--m-type-caption);
		background: var(--m-tint);
		border-radius: var(--m-radius-xs);
		padding: 1px 6px;
	}
	.page {
		/* Keep the end of the page clear of the docked Locus. */
		padding-bottom: 120px;
	}
	.dock {
		position: fixed;
		left: 50%;
		bottom: 24px;
		transform: translateX(-50%);
		z-index: 10;
	}
	@media (max-width: 640px) {
		.os {
			gap: 20px;
		}
		h1 {
			font-size: 30px;
		}
	}
</style>
