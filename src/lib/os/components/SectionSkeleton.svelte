<script lang="ts">
	/** Loading state of a section — the same place on the page as the real one, no content. `label` names it when nothing above does. */
	let { label = '' }: { label?: string } = $props();
</script>

<section class="skeleton" aria-busy="true" aria-label={label ? `Building: ${label}` : 'Building'}>
	<span class="line kicker"></span>
	<span class="line title"></span>
	<span class="line" style:width="85%"></span>
	<span class="line" style:width="62%"></span>
	<div class="pills">
		<span class="pill"></span>
		<span class="pill"></span>
	</div>
	{#if label}<p class="intent">{label}</p>{/if}
</section>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 28px var(--m-inset) 32px;
		border-top: 1px solid var(--m-line);
	}
	/* Placeholder tiles: the flat recess, breathing while the section is assembled. */
	.line {
		height: 12px;
		border-radius: var(--m-radius-xs);
		background: var(--m-recess);
		animation: breathe 1.6s var(--m-ease-settle) infinite alternate;
	}
	.line.kicker {
		width: 22%;
	}
	.line.title {
		width: 48%;
		height: 22px;
		margin-bottom: 6px;
	}
	.pills {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}
	.pill {
		width: 120px;
		height: var(--m-control);
		border-radius: 999px;
		background: var(--m-recess);
	}
	.intent {
		margin: 8px 0 0;
		font-size: var(--m-type-label);
		color: var(--m-ink-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@keyframes breathe {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.45;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line {
			animation: none;
		}
	}
	@media (max-width: 640px) {
		.skeleton {
			padding-block: 22px 26px;
		}
	}
</style>
