<script>
	/** A numbered/plain row in a list (tracks, results, steps). */
	/** @type {{ index?: string | number, label: string, sub?: string, trailing?: string, onclick?: (event: MouseEvent) => void }} */
	let { index = '', label, sub = '', trailing = '', onclick } = $props();
</script>

<button type="button" class="m-row" onclick={onclick}>
	{#if index !== ''}<span class="m-row-index">{index}</span>{/if}
	<span class="m-row-main">
		<span class="m-row-label">{label}</span>
		{#if sub}<span class="m-row-sub">{sub}</span>{/if}
	</span>
	{#if trailing}<span class="m-row-trailing">{trailing}</span>{/if}
</button>

<style>
	.m-row {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		border: none;
		border-top: 1px solid var(--m-border);
		background: none;
		padding: 11px 0;
		font: inherit;
		font-size: 14px;
		color: var(--m-text);
		text-align: left;
		cursor: pointer;
	}
	.m-row:hover .m-row-label {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.m-row-index {
		width: 14px;
		font-size: 13px;
		color: var(--m-faint);
	}
	.m-row-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.m-row-sub,
	.m-row-trailing {
		font-size: 12.5px;
		color: var(--m-muted);
	}
</style>
