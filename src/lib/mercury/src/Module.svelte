<script>
	import Icon from './Icon.svelte';

	/**
	 * A Mercury module: one self-contained piece of content with its actions.
	 * Header = source identity, body = content, actions = what you can do next,
	 * footer = the escape hatch to everything else.
	 */
	/**
	 * @type {{
	 *   title: string,
	 *   source?: string,
	 *   kind?: 'location' | 'social' | 'music' | 'shop' | 'generic',
	 *   icon?: import('svelte').Component<any>,
	 *   mic?: boolean,
	 *   more?: string,
	 *   width?: number,
	 *   children?: import('svelte').Snippet,
	 *   actions?: import('svelte').Snippet,
	 *   onmore?: () => void
	 * }}
	 */
	let {
		title,
		source = '',
		kind = 'generic',
		icon = undefined,
		mic = true,
		more = 'More actions',
		width = 420,
		children,
		actions,
		onmore
	} = $props();
</script>

<section class="m-module" style:width="{width}px">
	<header class="m-header">
		<span class="m-header-icon" data-kind={kind}><Icon kind={icon ?? kind} size={12} /></span>
		<span class="m-header-title">
			{title}{#if source}<span class="m-header-source">&nbsp;· {source}</span>{/if}
		</span>
		{#if mic}
			<span class="m-mic" title="Talk to this module"><Icon kind="mic" size={14} /></span>
		{/if}
	</header>

	<div class="m-body">
		{@render children?.()}
	</div>

	{#if actions}
		<div class="m-actions">
			{@render actions()}
		</div>
	{/if}

	{#if more}
		<footer class="m-more">
			<button type="button" class="m-more-btn" onclick={onmore}>
				<Icon kind="command" size={11} />
				{more}
			</button>
		</footer>
	{/if}
</section>

<style>
	.m-module {
		flex: 0 0 auto;
		max-width: 100%;
		background: var(--m-card);
		border-radius: var(--m-radius);
		box-shadow: var(--m-shadow);
		overflow: hidden;
	}
	.m-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		background: var(--m-header);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--m-text);
	}
	.m-header-icon {
		display: inline-grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		color: var(--m-muted);
	}
	.m-header-icon[data-kind='social'] {
		color: #3b82f6;
	}
	.m-header-icon[data-kind='music'] {
		color: #22a35a;
	}
	.m-header-icon[data-kind='shop'] {
		color: #111;
	}
	.m-header-icon[data-kind='location'] {
		color: #3b3b40;
	}
	.m-header-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.m-header-source {
		font-weight: 400;
		color: var(--m-muted);
	}
	.m-mic {
		color: var(--m-faint);
		display: inline-flex;
	}
	.m-body {
		padding: 24px 28px 8px;
	}
	.m-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 28px 8px;
	}
	.m-more {
		padding: 10px 28px 18px;
	}
	.m-more-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 12px;
		color: var(--m-muted);
		cursor: pointer;
	}
	.m-more-btn:hover {
		color: var(--m-text);
	}
</style>
