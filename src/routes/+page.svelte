<script lang="ts">
	import { onMount } from 'svelte';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Chat from '$lib/components/Chat.svelte';
	import Workspace from '$lib/components/Workspace.svelte';
	import { Studio } from '$lib/studio.svelte';

	const studio = new Studio();

	onMount(() => {
		void studio.init();
		if (import.meta.env.DEV) {
			(window as unknown as { __studio: Studio }).__studio = studio;
		}
	});

	function newSession() {
		const dirty =
			studio.messages.length > 0 || Object.keys(studio.workspace.modified).length > 0;
		if (dirty && !confirm('Clear the chat and the current app?')) return;
		studio.reset();
	}
</script>

<svelte:head>
	<title>AI Studio</title>
</svelte:head>

<div class="app">
	<header>
		<div class="brand">
			<span class="logo" aria-hidden="true"></span>
			<h1>AI Studio</h1>
		</div>
		<span class="model" title="Model used for generation">Claude Opus 5</span>
		<button class="btn btn-outline" onclick={newSession}>
			<SquarePen size={14} aria-hidden="true" />
			New session
		</button>
	</header>

	<main>
		<Chat {studio} />
		<Workspace {studio} />
	</main>
</div>

<style>
	.app {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-panel);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-right: auto;
	}
	.logo {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, var(--accent-strong), var(--accent) 60%, #5f8de0);
		box-shadow: 0 0 10px rgba(138, 180, 248, 0.45);
	}
	h1 {
		margin: 0;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.model {
		font-size: 12px;
		color: var(--text-muted);
		border: 1px solid var(--border);
		border-radius: 99px;
		padding: 3px 10px;
	}

	main {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(320px, 400px) 1fr;
	}

	/* Small screens: stack the workspace above the chat. */
	@media (max-width: 860px) {
		main {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr minmax(240px, 40%);
		}
		main > :global(*:first-child) {
			order: 2;
			border-right: none;
			border-top: 1px solid var(--border);
		}
	}
</style>
