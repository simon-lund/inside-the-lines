<script>
	import Theme from './Theme.svelte';

	/** The surface a page is laid out on, inside the theme. */
	/** @type {{ children?: import('svelte').Snippet, align?: 'start' | 'center' }} */
	let { children, align = 'start' } = $props();
</script>

<Theme>
	<div class="canvas" style:align-items={align === 'center' ? 'center' : 'flex-start'}>
		{@render children?.()}
	</div>
</Theme>

<style>
	.canvas {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 56px var(--m-gutter);
		display: flex;
		flex-wrap: wrap;
		gap: 40px;
		background: var(--m-ground);
	}

	@media (max-width: 640px) {
		.canvas {
			padding-block: 40px;
		}
	}
</style>
