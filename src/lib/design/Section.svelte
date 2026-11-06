<script>
	import Icon from './Icon.svelte';

	/**
	 * One section of a page: a heading (icon, kicker, title), its content, and what you
	 * can do next. No frame of its own — the page is the surface, sections are its parts.
	 */
	/**
	 * @type {{
	 *   title: string,
	 *   kicker?: string,
	 *   icon?: import('svelte').Component<any>,
	 *   children?: import('svelte').Snippet,
	 *   actions?: import('svelte').Snippet
	 * }}
	 */
	let { title, kicker = '', icon, children, actions } = $props();
</script>

<section class="m-section">
	<header class="m-section-header">
		{#if icon || kicker}
			<p class="m-section-kicker">
				{#if icon}<span class="m-section-icon"><Icon kind={icon} size={16} /></span>{/if}
				{kicker}
			</p>
		{/if}
		<h2 class="m-section-title">{title}</h2>
	</header>
	<div class="m-section-body">{@render children?.()}</div>
	{#if actions}
		<div class="m-section-actions">{@render actions()}</div>
	{/if}
</section>

<style>
	.m-section {
		padding: 28px var(--m-inset) 32px;
		border-top: 1px solid var(--m-line);
	}
	.m-section-kicker {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 6px;
		font-size: var(--m-type-label);
		line-height: var(--m-type-label-leading);
		font-weight: 600;
		letter-spacing: 0.01em;
		color: var(--m-ink-2);
	}
	.m-section-icon {
		display: inline-flex;
		color: var(--m-ink-2);
	}
	.m-section-title {
		margin: 0;
		font-size: var(--m-type-headline);
		line-height: var(--m-type-headline-leading);
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	.m-section-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 16px;
	}
	.m-section-body :global(.m-text),
	.m-section-body :global(.m-meta),
	.m-section-body :global(.m-price) {
		margin: 0;
	}
	.m-section-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}
	@media (max-width: 640px) {
		.m-section {
			padding-block: 22px 26px;
		}
	}
</style>
