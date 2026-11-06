<script>
	/** Label/value lines with an optional total — costs, key facts. */
	/** @type {{ rows: { label: string, value: string }[], total?: { label: string, value: string } }} */
	let { rows, total } = $props();
</script>

<dl class="m-summary">
	{#each rows as row, r (r)}
		<div class="m-summary-row">
			<dt>{row.label}</dt>
			<dd>{row.value}</dd>
		</div>
	{/each}
	{#if total}
		<div class="m-summary-row total">
			<dt>{total.label}</dt>
			<dd>{total.value}</dd>
		</div>
	{/if}
</dl>

<style>
	.m-summary {
		margin: 0;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	.m-summary-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 11px 0;
		border-top: 1px solid var(--m-line);
	}
	dt {
		color: var(--m-ink-2);
	}
	dd {
		margin: 0;
		text-align: right;
		font-weight: 500;
	}
	.total {
		border-top: 1px solid var(--m-line-strong);
		font-size: var(--m-type-title);
		line-height: var(--m-type-title-leading);
		font-weight: 600;
	}
	.total dt {
		color: var(--m-ink);
	}
	.total dd {
		font-weight: 600;
	}
</style>
