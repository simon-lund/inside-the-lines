<script>
	/**
	 * Options side by side. `pick` marks the recommended row. Scrolls sideways on
	 * narrow screens instead of squeezing the columns.
	 */
	/** @type {{ columns: string[], rows: string[][], pick?: number }} */
	let { columns, rows, pick = -1 } = $props();
</script>

<div class="m-table-wrap">
	<table class="m-table">
		<thead>
			<tr>
				{#each columns as column, c (c)}<th>{column}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, r (r)}
				<tr class:pick={r === pick}>
					{#each row as cell, c (c)}
						<td>
							{cell}
							{#if r === pick && c === 0}<span class="m-table-pick">Pick</span>{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.m-table-wrap {
		overflow-x: auto;
	}
	.m-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	th {
		padding: 0 14px 10px 0;
		font-size: var(--m-type-label);
		line-height: var(--m-type-label-leading);
		font-weight: 600;
		letter-spacing: 0.01em;
		text-align: left;
		color: var(--m-ink-2);
		white-space: nowrap;
	}
	td {
		padding: 12px 14px 12px 0;
		border-top: 1px solid var(--m-line);
		vertical-align: top;
		color: var(--m-ink-2);
	}
	td:first-child {
		font-weight: 600;
		color: var(--m-ink);
	}
	/* The pick: a tint, not height (it is one of many rows). */
	tr.pick td {
		background: var(--m-tint);
		border-top-color: transparent;
	}
	tr.pick + tr td {
		border-top-color: transparent;
	}
	tr.pick td:first-child {
		border-radius: var(--m-radius-sm) 0 0 var(--m-radius-sm);
		padding-left: 12px;
	}
	tr.pick td:last-child {
		border-radius: 0 var(--m-radius-sm) var(--m-radius-sm) 0;
	}
	/* The recommendation is the app speaking: the butter wash with its ink. */
	.m-table-pick {
		display: inline-block;
		margin-left: 8px;
		padding: 1px 8px;
		border-radius: 999px;
		background: var(--m-butter);
		color: var(--m-butter-ink);
		font-size: var(--m-type-caption);
		line-height: var(--m-type-caption-leading);
		font-weight: 600;
		vertical-align: 1px;
	}
</style>
