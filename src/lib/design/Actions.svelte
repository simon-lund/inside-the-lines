<script>
	/** A row of actions inside a block (a song's Play and Save). */
	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<div class="m-actions-row">{@render children?.()}</div>

<style>
	.m-actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}
</style>
