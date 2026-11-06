<script>
	/** One page: a sheet with a title, one sentence below it, then its sections. */
	/**
	 * @type {{
	 *   title: string,
	 *   lede?: string,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { title, lede = '', children } = $props();
</script>

<article class="m-page">
	<header class="m-page-header">
		<h1 class="m-page-title">{title}</h1>
		{#if lede}<p class="m-page-lede">{lede}</p>{/if}
	</header>
	{@render children?.()}
</article>

<style>
	/* A card on the page: flat, drawn with the fine line. */
	.m-page {
		width: min(760px, 100%);
		margin: 0 auto;
		background: var(--m-surface);
		border-radius: var(--m-radius-lg);
		box-shadow: var(--m-shadow-line);
	}
	.m-page-header {
		padding: 40px var(--m-inset) 28px;
	}
	.m-page-title {
		margin: 0;
		font-size: var(--m-type-display);
		line-height: var(--m-type-display-leading);
		font-weight: 600;
		letter-spacing: -0.04em;
	}
	.m-page-lede {
		margin: 10px 0 0;
		font-size: var(--m-type-title);
		line-height: var(--m-type-title-leading);
		color: var(--m-ink-2);
	}
	/* Phones: the page is the screen — edge to edge, no frame. */
	@media (max-width: 640px) {
		.m-page {
			width: auto;
			margin: 0 calc(-1 * var(--m-gutter));
			border-radius: 0;
			box-shadow: none;
		}
		.m-page-header {
			padding-block: 26px 18px;
		}
	}
</style>
