<script>
	import Icon from './Icon.svelte';

	/** A pill action. `sublabel` adds a small note ("Requires your location"). */
	/**
	 * @type {{
	 *   label: string,
	 *   sublabel?: string,
	 *   icon?: string | import('svelte').Component<any>,
	 *   primary?: boolean,
	 *   disabled?: boolean,
	 *   onclick?: (event: MouseEvent) => void,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let {
		label,
		sublabel = '',
		icon = '',
		primary = false,
		disabled = false,
		onclick,
		children
	} = $props();
</script>

<button type="button" class="m-action" class:primary onclick={onclick} {disabled}>
	{#if icon}
		<span class="m-action-icon"><Icon kind={icon} size={12} /></span>
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
		border: none;
		border-radius: var(--m-radius-sm);
		background: var(--m-pill);
		color: var(--m-text);
		padding: 9px 14px;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		transition:
			background-color 150ms ease,
			transform 100ms ease;
	}
	.m-action:hover:not(:disabled) {
		background: var(--m-pill-hover);
	}
	.m-action:active:not(:disabled) {
		transform: scale(0.97);
	}
	.m-action:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.m-action.primary {
		background: var(--m-text);
		color: #fff;
	}
	.m-action.primary:hover:not(:disabled) {
		background: #000;
	}
	.m-action-icon {
		display: inline-flex;
		color: currentColor;
	}
	.m-action-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}
	.m-action-sub {
		font-size: 10.5px;
		font-weight: 400;
		color: var(--m-muted);
	}
	.m-action.primary .m-action-sub {
		color: rgba(255, 255, 255, 0.7);
	}
</style>
