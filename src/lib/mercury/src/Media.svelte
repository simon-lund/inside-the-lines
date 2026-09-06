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
		margin-bottom: 8px;
	}
	.m-media-art {
		flex-shrink: 0;
		width: 132px;
		height: 132px;
		border-radius: 6px;
		overflow: hidden;
		background: #dcdce2;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
	}
	.m-media-art :global(img),
	.m-media-art :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.m-media-info {
		flex: 1;
		min-width: 0;
		padding-top: 6px;
	}
	.m-media-sub {
		margin: 0;
		font-size: 14px;
		color: var(--m-muted);
	}
</style>
