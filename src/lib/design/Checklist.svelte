<script>
	import Check from 'phosphor-svelte/lib/Check';
	import { SvelteSet } from 'svelte/reactivity';

	/** To-dos the person ticks off on the page; ticks are local to the page. Done quiets the words, never strikes them. */
	/** @type {{ items: string[] }} */
	let { items } = $props();

	const done = new SvelteSet();

	/** @param {number} i */
	function toggle(i) {
		if (done.has(i)) done.delete(i);
		else done.add(i);
	}
</script>

<ul class="m-checklist">
	{#each items as item, i (i)}
		<li>
			<button type="button" class="m-check" class:done={done.has(i)} aria-pressed={done.has(i)} onclick={() => toggle(i)}>
				<span class="m-check-box" aria-hidden="true">
					{#if done.has(i)}<Check size={13} weight="bold" />{/if}
				</span>
				<span class="m-check-label">{item}</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.m-checklist {
		display: flex;
		flex-direction: column;
	}
	/* Rows in a set: flat, a tint on hover; 44px tall on touch. */
	.m-check {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: 44px;
		padding: 8px 0;
		border-top: 1px solid var(--m-line);
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
		text-align: left;
		cursor: pointer;
	}
	.m-check-box {
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1.5px var(--m-line-strong);
		color: var(--m-accent-ink);
		transition:
			background-color var(--m-dur-quick) var(--m-ease-settle),
			box-shadow var(--m-dur-quick) var(--m-ease-settle);
	}
	.m-check:hover .m-check-box {
		box-shadow: inset 0 0 0 1.5px var(--m-ink-3);
	}
	.m-check.done .m-check-box {
		background: var(--m-accent);
		box-shadow: none;
	}
	.m-check.done .m-check-label {
		color: var(--m-ink-3);
	}
	@media (pointer: fine) and (min-width: 1120px) {
		.m-check {
			min-height: 36px;
		}
	}
</style>
