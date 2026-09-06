<script>
	import Avatar from './Avatar.svelte';

	/** One message in a conversation. Outgoing bubbles align right; `avatar` shows initials on the left. */
	/** @type {{ text?: string, time?: string, avatar?: string, outgoing?: boolean, children?: import('svelte').Snippet }} */
	let { text = '', time = '', avatar = '', outgoing = false, children } = $props();
</script>

<div class="m-bubble-row" class:outgoing>
	{#if avatar && !outgoing}
		<Avatar initials={avatar} size={26} />
	{/if}
	<div class="m-bubble-col">
		<div class="m-bubble">{text}{@render children?.()}</div>
		{#if time}<span class="m-bubble-time">{time}</span>{/if}
	</div>
</div>

<style>
	.m-bubble-row {
		display: flex;
		align-items: flex-end;
		gap: 10px;
		margin: 0 0 10px;
	}
	.m-bubble-row.outgoing {
		justify-content: flex-end;
	}
	.m-bubble-col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: 88%;
	}
	.outgoing .m-bubble-col {
		align-items: flex-end;
	}
	.m-bubble {
		background: var(--m-pill);
		border-radius: 16px;
		padding: 10px 14px;
		font-size: 14px;
		line-height: 1.45;
		white-space: pre-wrap;
	}
	.m-bubble-time {
		margin-top: 5px;
		font-size: 11px;
		color: var(--m-faint);
	}
</style>
