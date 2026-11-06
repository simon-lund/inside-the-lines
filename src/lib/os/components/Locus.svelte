<script lang="ts">
	import ArrowUp from 'phosphor-svelte/lib/ArrowUp';
	import KlementineFace from './KlementineFace.svelte';
	import type { Os } from '$lib/os/os.svelte';

	/**
	 * Locus — where intentions are typed, with Klementine's face looking on. Centred on the empty
	 * state, docked at the bottom of a page, where it adds a follow-up. ⌘K / Ctrl+K focuses it.
	 */
	let { os, docked }: { os: Os; docked: boolean } = $props();

	let value = $state('');
	let focused = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	const placeholder = $derived(docked ? 'Anything else?' : 'What’s on your mind?');

	// Her look, exactly one: working while a section is assembled, needing you when one failed,
	// listening while you type, otherwise idle.
	const failed = $derived(os.active?.cells.some((c) => c.items.some((i) => i.status === 'failed')) ?? false);
	const look = $derived(os.busy ? 'working' : failed ? 'needs' : focused || value ? 'listening' : 'idle');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const intent = value.trim();
		if (!intent) return;
		value = '';
		if (docked) os.addToSpace(intent);
		else os.newSpace(intent);
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			inputEl?.focus();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<form class="locus" class:docked onsubmit={submit}>
	<KlementineFace {look} size={docked ? 34 : 40} />
	<input
		bind:this={inputEl}
		bind:value
		{placeholder}
		aria-label="Intention"
		autocomplete="off"
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
	/>
	<button type="submit" class="send" disabled={!value.trim()} aria-label="Assemble">
		<ArrowUp size={18} weight="bold" aria-hidden="true" />
	</button>
</form>

<style>
	/* The composer: a 28px-round field on the layer surface, the send key inside it. */
	.locus {
		display: flex;
		align-items: center;
		gap: 12px;
		width: min(640px, 100%);
		padding: 8px 8px 8px 10px;
		border-radius: var(--m-radius-xl);
		background: var(--m-layer);
		box-shadow: var(--m-shadow-line);
		font-family: var(--m-font);
		transition: box-shadow var(--m-dur-quick) var(--m-ease-settle);
	}
	/* Docked over the page, it floats: the only thing here with a shadow. */
	.locus.docked {
		width: min(600px, calc(100vw - 32px));
		padding: 6px 6px 6px 8px;
		box-shadow: var(--m-shadow-float);
	}
	/* Focus: a 1px edge in the accent and a soft halo, as Klementine's fields. */
	.locus:focus-within {
		box-shadow:
			inset 0 0 0 1px var(--m-accent),
			0 0 0 3px var(--m-focus-halo);
	}
	.locus.docked:focus-within {
		box-shadow:
			inset 0 0 0 1px var(--m-accent),
			0 0 0 3px var(--m-focus-halo),
			var(--m-shadow-float);
	}
	.locus :global(input:focus-visible) {
		outline: none;
	}
	input {
		flex: 1;
		min-width: 0;
		height: 44px;
		background: none;
		font-size: var(--m-type-title);
		color: var(--m-ink);
	}
	input::placeholder {
		color: var(--m-ink-3);
	}
	/* The send key: the accent, on its own. */
	.send {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--m-accent);
		color: var(--m-accent-ink);
		box-shadow: var(--m-shadow-key);
		cursor: pointer;
		transition:
			opacity var(--m-dur-quick) var(--m-ease-settle),
			scale var(--m-dur-quick) var(--m-ease-settle);
	}
	.send:active:not(:disabled) {
		scale: 0.97;
		transition-duration: var(--m-dur-press);
	}
	.send:disabled {
		opacity: 0.25;
		cursor: default;
	}
	@media (prefers-reduced-motion: reduce) {
		.send:active:not(:disabled) {
			scale: none;
		}
	}
</style>
