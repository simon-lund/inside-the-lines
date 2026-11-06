<script lang="ts">
	import KlementineFace from '$lib/app/KlementineFace.svelte';
	import type { Activity } from './pages.svelte';

	/**
	 * A page being written for the first time: her face at work, what she is on, and the last
	 * lines of the code as it arrives. The page appears once the code compiles.
	 */
	let { activity, intent }: { activity: Extract<Activity, { status: 'working' }>; intent: string } = $props();

	const TAIL = 18;
	const tail = $derived(activity.code.split('\n').slice(-TAIL).join('\n'));
	const what = $derived(
		activity.phase === 'writing' && activity.file
			? `Writing ${activity.file}`
			: activity.phase === 'thinking'
				? 'Thinking it through'
				: 'Starting'
	);
</script>

<section class="writing" aria-busy="true" aria-label="Writing the page for: {intent}">
	<KlementineFace look="working" size={56} />
	<p class="intent">{intent}</p>
	<p class="what">{what}{activity.replay ? ' · recorded' : ''}</p>
	<pre class="code" aria-hidden="true">{tail}</pre>
</section>

<style>
	.writing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: min(680px, 100%);
		margin: 10vh auto 0;
		padding: 0 var(--m-gutter);
		text-align: center;
	}
	.intent {
		margin: 10px 0 0;
		font-size: var(--m-type-headline);
		line-height: var(--m-type-headline-leading);
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	.what {
		margin: 0;
		font-size: var(--m-type-label);
		font-weight: 600;
		color: var(--m-clementine-ink);
	}
	/* The code as it arrives, fading out at the top: the page being written, on the spot. */
	.code {
		width: 100%;
		height: calc(18 * 1.6em);
		margin: 18px 0 0;
		padding: 16px 20px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		border-radius: var(--m-radius-lg);
		background: var(--m-surface);
		box-shadow: var(--m-shadow-line);
		font-family: var(--m-font-mono);
		font-size: 12px;
		line-height: 1.6;
		text-align: left;
		white-space: pre;
		color: var(--m-ink-2);
		mask-image: linear-gradient(to bottom, transparent, black 40%);
	}
</style>
