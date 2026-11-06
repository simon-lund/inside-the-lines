<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Canvas } from '$lib/mercury/src/index.js';
	import Flow from '$lib/os/components/Flow.svelte';
	import Locus from '$lib/os/components/Locus.svelte';
	import SpacesBar from '$lib/os/components/SpacesBar.svelte';
	import { EXAMPLE_INTENTS } from '$lib/os/examples';
	import { Os } from '$lib/os/os.svelte';

	const os = new Os();

	onMount(() => {
		void os.init();
		if (import.meta.env.DEV) (window as unknown as { __os: Os }).__os = os;
	});

	// A mouse wheel only scrolls vertically: when the page itself has nowhere to go, it moves the band.
	function wheelScrollsBand(band: HTMLElement) {
		const onwheel = (e: WheelEvent) => {
			const page = document.scrollingElement;
			if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || !page || page.scrollHeight > page.clientHeight) return;
			band.scrollLeft += e.deltaY;
			e.preventDefault();
		};
		band.addEventListener('wheel', onwheel, { passive: false });
		return { destroy: () => band.removeEventListener('wheel', onwheel) };
	}
</script>

<svelte:head>
	<title>{os.active ? `${os.active.title} · Mercury` : 'Mercury OS prototype'}</title>
</svelte:head>

<Canvas>
	<div class="os">
		<SpacesBar {os} />

		{#if !os.active}
			<!-- empty: no space open — state an intention -->
			<section class="empty" in:fade={{ duration: 200 }}>
				<h1>No apps. No folders.</h1>
				<p class="lede">Say what you want to do. The modules you need are generated on the spot.</p>
				<Locus {os} docked={false} />
				<div class="examples">
					{#each EXAMPLE_INTENTS as intent (intent)}
						<button type="button" onclick={() => os.newSpace(intent)}>{intent}</button>
					{/each}
				</div>
				{#if os.health && !os.health.hasApiKey}
					<p class="hint">
						No API key set: the examples above are recorded and work offline. Add
						<code>{os.health.keyVar}</code> to <code>.env</code> to assemble anything.
					</p>
				{/if}
			</section>
		{:else if os.active.flows.length === 0}
			<!-- empty space: every module was removed -->
			<section class="empty" in:fade={{ duration: 200 }}>
				<p class="lede">This space is empty. Add something below, or close it.</p>
			</section>
		{:else}
			<!-- data: the space's flows, side by side in one band -->
			{#key os.active.key}
				<section class="space" in:fade={{ duration: 200 }} use:wheelScrollsBand>
					{#each os.active.flows as flow (flow.key)}
						<Flow {os} {flow} />
					{/each}
				</section>
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
		font-size: 40px;
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	.lede {
		margin: 0 0 18px;
		font-size: 17px;
		color: var(--m-muted);
	}
	.examples {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 6px;
	}
	.examples button {
		border: none;
		border-radius: 999px;
		background: var(--m-pill);
		padding: 8px 14px;
		font: inherit;
		font-size: 13px;
		color: var(--m-text);
		cursor: pointer;
		transition: background-color 150ms ease;
	}
	.examples button:hover {
		background: var(--m-pill-hover);
	}
	.hint {
		margin: 12px 0 0;
		font-size: 12.5px;
		color: var(--m-muted);
	}
	code {
		font-size: 12px;
		background: var(--m-pill);
		border-radius: 4px;
		padding: 1px 5px;
	}
	/* One horizontal band. Intentions sit further apart than the modules within one. */
	.space {
		display: flex;
		align-items: flex-start;
		gap: 72px;
		overflow-x: auto;
		/* Bleed to the window edges, so modules scroll off-screen instead of clipping at the
		   canvas padding; room below for shadows and the docked Locus. */
		margin: 0 -48px;
		padding: 0 48px 120px;
		scroll-padding-inline: 48px;
		scrollbar-width: none;
	}
	.space::-webkit-scrollbar {
		display: none;
	}
	.dock {
		position: fixed;
		left: 50%;
		bottom: 24px;
		transform: translateX(-50%);
		z-index: 10;
	}
	@media (max-width: 640px) {
		h1 {
			font-size: 30px;
		}
		.space {
			gap: 40px;
			padding-inline: 16px;
			scroll-padding-inline: 16px;
		}
	}
</style>
