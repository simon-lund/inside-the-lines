<script lang="ts">
	import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
	import Code from 'phosphor-svelte/lib/Code';
	import X from 'phosphor-svelte/lib/X';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Action, Theme } from '$lib/design/index.js';
	import Locus from '$lib/app/Locus.svelte';
	import SpacesBar from '$lib/app/SpacesBar.svelte';
	import { EXAMPLE_INTENTS } from '$lib/app/examples';
	import CodeView from '$lib/pages/CodeView.svelte';
	import PageFrame from '$lib/pages/PageFrame.svelte';
	import { Pages, type Activity } from '$lib/pages/pages.svelte';
	import { Repl } from '$lib/pages/repl.svelte';
	import Writing from '$lib/pages/Writing.svelte';
	import { ERROR_MESSAGES } from '$lib/types';

	const pages = new Pages();
	let repl = $state<Repl | null>(null);
	/** The page whose code shows beside the design check; every other page opens running. */
	let codeOf = $state<string | null>(null);
	const view = $derived(codeOf !== null && codeOf === pages.activeKey ? 'code' : 'page');

	onMount(() => {
		// The REPL bundles in effect roots, which must not start during component init.
		const r = new Repl();
		repl = r;
		void pages.init(r).then(() => pages.select(pages.activeKey));

		// A control inside the page called ask(): build what it asked for, on the same page.
		const onMessage = (e: MessageEvent) => {
			const data = e.data as { type?: string; intent?: unknown; label?: unknown } | null;
			if (data?.type === 'inside-the-lines:ask' && typeof data.intent === 'string') {
				pages.askFromPage(data.intent, typeof data.label === 'string' ? data.label : '');
			}
		};
		window.addEventListener('message', onMessage);
		if (import.meta.env.DEV) Object.assign(window, { __pages: pages, __repl: r });
		return () => window.removeEventListener('message', onMessage);
	});

	const active = $derived(pages.active);
	const activity = $derived(active ? pages.activityOf(active.key) : null);
	const failure = $derived(repl?.failure ?? null);
	const errorText = (code: keyof typeof ERROR_MESSAGES) => ERROR_MESSAGES[code] ?? 'Something went wrong. Try again in a moment.';
	const things = (n: number) => `${n} ${n === 1 ? 'thing' : 'things'}`;

	/** What she is on, by what was asked. */
	function workingText(a: Extract<Activity, { status: 'working' }>): string {
		if (a.ask.kind === 'repair') return a.file ? `Bringing ${a.file} inside the lines` : 'Bringing it inside the lines';
		if (a.ask.kind === 'fix') return a.file ? `Fixing ${a.file}` : 'Finding the error';
		return a.file ? `Writing ${a.file}` : 'Thinking it through';
	}
</script>

<svelte:head>
	<title>{active ? active.title : 'New page'}</title>
</svelte:head>

<Theme>
	<div class="app">
		<div class="bar">
			<SpacesBar {pages}>
				{#snippet trailing()}
					{#if active && active.files.length > 0}
						<button
							type="button"
							class="toggle"
							aria-label="Code"
							aria-pressed={view === 'code'}
							onclick={() => (codeOf = view === 'code' ? null : pages.activeKey)}
						>
							<Code size={18} aria-hidden="true" /><span class="toggle-label">Code</span>
						</button>
					{/if}
				{/snippet}
			</SpacesBar>
		</div>

		<main>
			{#if !active}
				<!-- empty: no page open — state an intention -->
				<section class="empty" in:fade={{ duration: 200 }}>
					<h1>Say what you’re planning.<span>She builds the page for it.</span></h1>
					<Locus {pages} docked={false} />
					<div class="examples">
						{#each EXAMPLE_INTENTS as intent (intent)}
							<button type="button" onclick={() => pages.newPage(intent)}>{intent}</button>
						{/each}
					</div>
					{#if pages.health && !pages.health.hasApiKey}
						<p class="hint">
							No API key yet, so only these four work. Add <code>{pages.health.keyVar}</code> to
							<code>.env</code> for anything else.
						</p>
					{/if}
				</section>
			{:else if active.files.length === 0 && activity?.status === 'working'}
				<!-- loading: the first answer is streaming -->
				<Writing {activity} intent={active.intent} />
			{:else if active.files.length === 0}
				<!-- error: the page has no code (the request failed, or never finished) -->
				<section class="empty" in:fade={{ duration: 200 }}>
					<p class="lede">
						{activity?.status === 'failed' ? errorText(activity.code) : 'This page has nothing on it yet.'}
					</p>
					<div class="row">
						<Action primary icon={ArrowCounterClockwise} label="Try again" onclick={() => pages.retry(active.key)} />
						<Action icon={X} label="Close page" onclick={() => pages.close(active.key)} />
					</div>
				</section>
			{:else if repl}
				<!-- data: the page, running; it stays mounted under the code view, so it keeps its state -->
				<div class="layer" hidden={view === 'code'}><PageFrame {repl} bottomInset={140} /></div>
				{#if view === 'code'}<CodeView {repl} page={active} />{/if}
			{/if}
		</main>

		{#if active}
			<div class="dock">
				{#if active.files.length > 0 && activity?.status === 'working'}
					<!-- a change on its way (a follow-up, the repair round, a fix): the page stays usable meanwhile -->
					<p class="note" aria-live="polite">{workingText(activity)}{activity.replay ? ' · recorded' : ''}</p>
				{:else if active.files.length > 0 && activity?.status === 'failed'}
					<!-- the last request failed: the page is as it was, with a way to try again -->
					<p class="note failed">
						{errorText(activity.code)}
						<button type="button" onclick={() => pages.retry(active.key)}>Try again</button>
					</p>
				{:else if active.files.length > 0 && failure}
					<!-- the page does not compile or run: send the error back with the code -->
					<p class="note failed">
						This page has an error.
						<button type="button" onclick={() => pages.fix(active.key, failure)}>Fix it</button>
					</p>
				{:else if active.files.length > 0 && active.issues.length > 0}
					<!-- the repair round left findings: show them, or ask for another round -->
					<p class="note failed">
						{things(active.issues.length)} outside the lines
						{#if view === 'page'}<button type="button" onclick={() => (codeOf = active.key)}>Show</button>{/if}
						<button type="button" onclick={() => pages.repair(active.key)}>Fix</button>
					</p>
				{/if}
				<Locus {pages} docked />
			</div>
		{/if}
	</div>
</Theme>

<style>
	/* The app fills the window: the bar on top, the page below, scrolling inside its frame. */
	.app {
		height: 100dvh;
		display: grid;
		/* One column, never wider than the window: the tabs scroll instead of pushing it. */
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		background: var(--m-ground);
	}
	.bar {
		padding: 24px var(--m-gutter) 12px;
	}
	main {
		position: relative;
		min-height: 0;
		overflow: auto;
	}
	.layer {
		height: 100%;
	}
	.layer[hidden] {
		display: none;
	}
	/* The view switch, in the bar's own key: flat, a tint when the code is showing. */
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: var(--m-control-sm);
		padding: 0 12px;
		border-radius: 999px;
		font-size: var(--m-type-tab);
		color: var(--m-ink-2);
		cursor: pointer;
		transition: background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.toggle:hover {
		background: var(--m-tint);
		color: var(--m-ink);
	}
	.toggle[aria-pressed='true'] {
		background: var(--m-tint);
		color: var(--m-ink);
		font-weight: 600;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		margin: 12vh auto 0;
		width: min(640px, 100%);
		padding: 0 var(--m-gutter);
		text-align: center;
	}
	h1 {
		margin: 0 0 18px;
		font-size: 2.5rem;
		line-height: 2.75rem;
		font-weight: 600;
		letter-spacing: -0.04em;
	}
	/* The second line says what she does, a step quieter. */
	h1 span {
		display: block;
		color: var(--m-ink-2);
	}
	.lede {
		margin: 0;
		font-size: var(--m-type-title);
		color: var(--m-ink-2);
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.examples {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 6px;
	}
	/* Suggestions are a set: flat chips, a stronger tint on hover. */
	.examples button {
		height: var(--m-control-sm);
		padding: 0 16px;
		border-radius: 999px;
		background: var(--m-tint);
		font-size: var(--m-type-tab);
		font-weight: 500;
		color: var(--m-ink);
		cursor: pointer;
		transition:
			background-color var(--m-dur-quick) var(--m-ease-settle),
			scale var(--m-dur-quick) var(--m-ease-settle);
	}
	.examples button:hover {
		background: var(--m-tint-strong);
	}
	.examples button:active {
		scale: 0.97;
		transition-duration: var(--m-dur-press);
	}
	.hint {
		margin: 12px 0 0;
		font-size: var(--m-type-label);
		line-height: var(--m-type-label-leading);
		color: var(--m-ink-2);
	}
	code {
		font-family: var(--m-font-mono);
		font-size: var(--m-type-caption);
		background: var(--m-tint);
		border-radius: var(--m-radius-xs);
		padding: 1px 6px;
	}
	.dock {
		position: fixed;
		left: 50%;
		bottom: 24px;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	/* A short line above the composer: what she is writing, or what went wrong. */
	.note {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		padding: 6px 14px;
		border-radius: 999px;
		background: var(--m-layer);
		box-shadow: var(--m-shadow-float);
		font-size: var(--m-type-label);
		font-weight: 600;
		color: var(--m-clementine-ink);
	}
	.note.failed {
		color: var(--m-ink);
		font-weight: 500;
	}
	.note button {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	@media (max-width: 640px) {
		/* Phones: the switch is its icon, so the tabs keep the room. */
		.toggle-label {
			display: none;
		}
		h1 {
			font-size: 30px;
			line-height: 36px;
		}
	}
</style>
