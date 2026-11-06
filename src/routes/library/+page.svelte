<script lang="ts">
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import { Canvas, Page } from '$lib/design/index.js';
	import Brand from '$lib/os/components/Brand.svelte';
	import SpecSection from '$lib/os/components/SpecSection.svelte';
	import { LIBRARY } from '$lib/os/library';
</script>

<svelte:head>
	<title>Library</title>
</svelte:head>

<Canvas>
	<div class="library">
		<nav class="bar" aria-label="Library">
			<Brand />
			<a class="back" href="/"><ArrowLeft size={18} aria-hidden="true" />Pages</a>
		</nav>

		<Page title="Everything she can build" lede="She picks the sections and writes what goes in them. How they look is fixed.">
			{#each LIBRARY as section (section.id)}
				<SpecSection {section} onopen={() => {}} />
			{/each}
		</Page>
	</div>
</Canvas>

<style>
	.library {
		flex: 1 1 100%;
		display: flex;
		flex-direction: column;
		gap: 48px;
		min-width: 0;
		margin-top: -28px;
		padding-bottom: 64px;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 24px;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: var(--m-control-sm);
		margin-left: auto;
		padding: 0 12px;
		border-radius: 999px;
		color: var(--m-ink-2);
		transition: background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.back:hover {
		background: var(--m-tint);
		color: var(--m-ink);
	}
	@media (max-width: 640px) {
		.library {
			gap: 20px;
		}
	}
</style>
