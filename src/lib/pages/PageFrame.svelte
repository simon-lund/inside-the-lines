<script lang="ts">
	import Viewer from '@sveltejs/repl/viewer';
	import type { Log } from '@sveltejs/repl/console';
	import type { Repl } from './repl.svelte';

	/**
	 * A generated page, running: the REPL's sandboxed iframe, filling the space it is given and
	 * scrolling on its own. It follows the system's light or dark theme like the rest of the app.
	 */
	let { repl, bottomInset = 0 }: { repl: Repl; bottomInset?: number } = $props();

	const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

	// Room at the end of the page for whatever floats over the frame (the docked composer).
	const injectedCSS = $derived(`.canvas { padding-bottom: ${bottomInset}px !important; }`);

	// The console stays hidden; an uncaught error in it is what a fix request needs.
	function onLog(logs: Log[]) {
		const last = logs.findLast((l) => l.command === 'error')?.args?.[0] as { message?: string } | string | undefined;
		if (last !== undefined) repl.runtimeError = typeof last === 'string' ? last : (last.message ?? String(last));
	}
</script>

<div class="frame">
	<Viewer bundler={repl.bundler} bind:error={repl.error} status={repl.status} theme={dark ? 'dark' : 'light'} {injectedCSS} {onLog} />
</div>

<style>
	.frame {
		position: relative;
		height: 100%;
		min-height: 0;
		background: var(--m-ground);
		/* The REPL's own error views, drawn with the design tokens. */
		--sk-bg-1: var(--m-layer);
		--sk-bg-3: var(--m-sunk);
		--sk-fg-4: var(--m-ink-3);
		--sk-fg-accent: var(--m-clementine);
		--sk-border: var(--m-line);
		--sk-font-ui-small: 500 var(--m-type-label) / var(--m-type-label-leading) var(--m-font);
	}
	/* An error while running: a quiet card at the top, the dock below says what to do. */
	.frame :global(.message.error) {
		margin: 12px var(--m-gutter) 0;
		border: 0;
		border-radius: var(--m-radius-md);
		background: var(--m-layer);
		box-shadow: var(--m-shadow-float);
		color: var(--m-ink);
	}
	.frame :global(.message.error)::before {
		color: var(--m-clementine-ink);
		border-color: currentColor;
	}
	.frame > :global(*) {
		height: 100%;
	}
	.frame :global(iframe) {
		background: var(--m-ground);
	}
</style>
