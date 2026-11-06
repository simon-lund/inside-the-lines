<script>
	import Icon from './Icon.svelte';

	/**
	 * An action: a key on its own, always a pill. `primary` is the accent key (the page's ink),
	 * one per section; the rest are plain keys. `sublabel` adds a small note ("Free cancellation
	 * until Nov 11"). Pressing gives a little.
	 */
	/**
	 * @type {{
	 *   label: string,
	 *   sublabel?: string,
	 *   icon?: import('svelte').Component<any>,
	 *   primary?: boolean,
	 *   disabled?: boolean,
	 *   onclick?: (event: MouseEvent) => void,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { label, sublabel = '', icon, primary = false, disabled = false, onclick, children } = $props();
</script>

<button type="button" class="m-action" class:primary class:two-line={!!sublabel} {onclick} {disabled}>
	{#if icon}
		<span class="m-action-icon"><Icon kind={icon} size={18} /></span>
	{/if}
	<span class="m-action-text">
		<span class="m-action-label">{label}</span>
		{#if sublabel}<small class="m-action-sub">{sublabel}</small>{/if}
	</span>
	{@render children?.()}
</button>

<style>
	.m-action {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: var(--m-control);
		padding: 0 calc(var(--m-control) / 2);
		border-radius: 999px;
		background: var(--m-key);
		box-shadow: var(--m-shadow-key);
		color: var(--m-ink);
		font-size: var(--m-type-body);
		line-height: var(--m-type-body-leading);
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
		transition:
			scale var(--m-dur-quick) var(--m-ease-settle),
			background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.m-action.two-line {
		padding-block: 5px;
	}
	.m-action:hover:not(:disabled) {
		background: var(--m-key-hover);
	}
	.m-action:active:not(:disabled) {
		scale: 0.97;
		transition-duration: var(--m-dur-press);
	}
	.m-action:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.m-action.primary {
		background: var(--m-accent);
		color: var(--m-accent-ink);
	}
	.m-action.primary:hover:not(:disabled) {
		background: var(--m-accent-hover);
	}
	.m-action-icon {
		display: inline-flex;
		margin-left: -4px;
	}
	.m-action-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}
	.m-action-sub {
		font-size: var(--m-type-caption);
		line-height: var(--m-type-caption-leading);
		font-weight: 500;
		color: var(--m-ink-2);
	}
	.m-action.primary .m-action-sub {
		color: color-mix(in srgb, var(--m-accent-ink) 72%, transparent);
	}
	@media (prefers-reduced-motion: reduce) {
		.m-action:active:not(:disabled) {
			scale: none;
		}
	}
</style>
