<script>
	/** Artwork beside a title/subtitle and inline actions (music, video, podcasts). */
	/** @type {{ title: string, subtitle?: string, art?: import('svelte').Snippet, children?: import('svelte').Snippet }} */
	let { title, subtitle = '', art, children } = $props();
</script>

<div class="m-media">
	<div class="m-media-art">{@render art?.()}</div>
	<div class="m-media-info">
		<h2 class="m-title">{title}</h2>
		{#if subtitle}<p class="m-media-sub">{subtitle}</p>{/if}
		{@render children?.()}
	</div>
</div>

<style>
	.m-media {
		display: flex;
		gap: 20px;
		align-items: flex-start;
	}
	.m-media-art {
		flex-shrink: 0;
		width: 128px;
		height: 128px;
		border-radius: var(--m-radius-sm);
		overflow: hidden;
		box-shadow: var(--m-shadow-line);
	}
	.m-media-art :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.m-media-info {
		flex: 1;
		min-width: 0;
		padding-top: 4px;
	}
	.m-media-sub {
		margin: 4px 0 0;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
		color: var(--m-ink-2);
	}
	@media (max-width: 640px) {
		.m-media-art {
			width: 104px;
			height: 104px;
		}
	}
</style>
