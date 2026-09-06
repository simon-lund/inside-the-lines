<script>
	/** A labelled rule, e.g. "NEW MESSAGES". */
	/** @type {{ label?: string }} */
	let { label = '' } = $props();
</script>

<div class="m-divider" role="separator">
	<span class="m-divider-line"></span>
	{#if label}<span class="m-divider-label">{label}</span><span class="m-divider-line"></span>{/if}
</div>

<style>
	.m-divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 6px 0 16px;
	}
	.m-divider-line {
		flex: 1;
		height: 1px;
		background: var(--m-border);
	}
	.m-divider-label {
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--m-faint);
	}
</style>
