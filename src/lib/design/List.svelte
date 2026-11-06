<script>
	/** Holds ListRows as one list: the rows sit tight, separated by their lines. */
	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<div class="m-list">{@render children?.()}</div>

<style>
	.m-list {
		display: flex;
		flex-direction: column;
	}
</style>
