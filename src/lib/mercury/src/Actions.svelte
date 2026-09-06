<script>
	/** A row of actions inside module content (the module's own action bar lives below the body). */
	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<div class="m-actions-row">{@render children?.()}</div>

<style>
	.m-actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 14px 0 4px;
	}
</style>
