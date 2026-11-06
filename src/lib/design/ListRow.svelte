<script>
	/**
	 * A numbered or plain row in a list (steps, a day plan, tracks). A trailing time ("9:30 AM",
	 * "14:00") is a word that says when, so it takes the clementine ink.
	 */
	/** @type {{ index?: string | number, label: string, sub?: string, trailing?: string, onclick?: (event: MouseEvent) => void }} */
	let { index = '', label, sub = '', trailing = '', onclick } = $props();

	const isWhen = $derived(/^\d{1,2}(:\d{2})?\s?(am|pm)?$/i.test(trailing.trim()) && /[:apm]/i.test(trailing));
</script>

<button type="button" class="m-row" onclick={onclick}>
	{#if index !== ''}<span class="m-row-index">{index}</span>{/if}
	<span class="m-row-main">
		<span class="m-row-label">{label}</span>
		{#if sub}<span class="m-row-sub">{sub}</span>{/if}
	</span>
	{#if trailing}<span class="m-row-trailing" class:when={isWhen}>{trailing}</span>{/if}
</button>

<style>
	/* A row in a set: flat; hover is a tint behind the label, never height. */
	.m-row {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		min-height: 44px;
		padding: 10px 0;
		border-top: 1px solid var(--m-line);
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
		color: var(--m-ink);
		text-align: left;
		cursor: pointer;
	}
	.m-row:hover .m-row-label {
		text-decoration: underline;
		text-decoration-color: var(--m-line-strong);
		text-underline-offset: 3px;
	}
	.m-row-index {
		min-width: 16px;
		font-size: var(--m-type-label);
		font-weight: 600;
		color: var(--m-ink-3);
	}
	.m-row-main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.m-row-label {
		font-weight: 500;
	}
	.m-row-sub,
	.m-row-trailing {
		font-size: var(--m-type-label);
		line-height: var(--m-type-label-leading);
		color: var(--m-ink-2);
	}
	.m-row-trailing {
		font-weight: 500;
	}
	.m-row-trailing.when {
		font-weight: 600;
		color: var(--m-clementine-ink);
	}
</style>
