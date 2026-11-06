<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';
	import type { Os } from '$lib/os/os.svelte';

	/**
	 * Locus — where intentions are typed. Centred on the empty state, docked at the
	 * bottom inside a space. ⌘K / Ctrl+K focuses it from anywhere.
	 */
	let { os, docked }: { os: Os; docked: boolean } = $props();

	let value = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	const placeholder = $derived(
		os.target
			? `What should open next to ${os.target.title}?`
			: docked
				? 'Add to this space…'
				: 'What would you like to do?'
	);

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
		} else if (event.key === 'Escape' && os.target) {
			os.target = null;
		}
	}

	// "More actions" on a module points Locus at it — focus the field.
	$effect(() => {
		if (os.target) inputEl?.focus();
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

<form class="locus" class:docked onsubmit={submit}>
	{#if os.target}
		<span class="target">
			<CornerDownRight size={13} aria-hidden="true" />
			{os.target.title}
			<button type="button" aria-label="Stop targeting {os.target.title}" onclick={() => (os.target = null)}>
				<X size={12} aria-hidden="true" />
			</button>
		</span>
	{:else}
		<Sparkles class="glyph" size={docked ? 16 : 20} strokeWidth={1.8} aria-hidden="true" />
	{/if}
	<input bind:this={inputEl} bind:value {placeholder} aria-label="Intention" autocomplete="off" />
	<kbd aria-hidden="true">⌘K</kbd>
	<button type="submit" class="send" disabled={!value.trim()} aria-label="Assemble">
		<ArrowUp size={16} strokeWidth={2.4} aria-hidden="true" />
	</button>
</form>

<style>
	.locus {
		display: flex;
		align-items: center;
		gap: 12px;
		width: min(640px, 100%);
		padding: 10px 10px 10px 20px;
		border-radius: 999px;
		background: var(--m-card);
		box-shadow: var(--m-shadow);
		font-family: var(--m-font);
	}
	.locus.docked {
		width: min(560px, calc(100vw - 32px));
		padding: 7px 7px 7px 16px;
	}
	.locus :global(.glyph) {
		flex-shrink: 0;
		color: var(--m-accent);
	}
	input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: none;
		font: inherit;
		font-size: 18px;
		color: var(--m-text);
	}
	.docked input {
		font-size: 15px;
	}
	input::placeholder {
		color: var(--m-faint);
	}
	kbd {
		font: inherit;
		font-size: 11px;
		color: var(--m-faint);
		border: 1px solid var(--m-border);
		border-radius: 6px;
		padding: 2px 6px;
	}
	.target {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		max-width: 45%;
		padding: 5px 6px 5px 10px;
		border-radius: 999px;
		background: var(--m-pill);
		font-size: 12.5px;
		font-weight: 500;
		color: var(--m-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.target button {
		display: inline-grid;
		place-items: center;
		border: none;
		background: none;
		padding: 2px;
		color: var(--m-muted);
		cursor: pointer;
	}
	.send {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border: none;
		border-radius: 50%;
		background: var(--m-text);
		color: var(--m-card);
		cursor: pointer;
		transition: opacity 150ms ease;
	}
	.docked .send {
		width: 34px;
		height: 34px;
	}
	.send:disabled {
		opacity: 0.25;
		cursor: default;
	}
	@media (max-width: 640px) {
		kbd {
			display: none;
		}
	}
</style>
