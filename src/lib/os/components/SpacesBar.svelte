<script lang="ts">
	import Code from '@lucide/svelte/icons/code';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import type { Os } from '$lib/os/os.svelte';

	/** Top bar: one tab per space (named after its intention), a new-space button, and the way to the studio. */
	let { os }: { os: Os } = $props();
</script>

<nav class="bar" aria-label="Spaces">
	<a
		class="brand"
		href="https://uxdesign.cc/introducing-mercury-os-f4de45a04289"
		target="_blank"
		rel="noopener noreferrer"
		title="Mercury OS by Jason Yuan, the concept this prototype makes clickable">Mercury</a
	>

	<div class="spaces">
		{#each os.spaces as space (space.key)}
			<span class="space" class:active={space.key === os.activeKey}>
				<button type="button" class="space-name" onclick={() => (os.activeKey = space.key)}>{space.title}</button>
				<button type="button" class="space-close" aria-label="Close {space.title}" onclick={() => os.closeSpace(space.key)}>
					<X size={11} strokeWidth={2.4} aria-hidden="true" />
				</button>
			</span>
		{/each}
		<button
			type="button"
			class="space new"
			class:active={os.activeKey === null}
			onclick={() => ((os.activeKey = null), (os.target = null))}
		>
			<Plus size={13} strokeWidth={2.2} aria-hidden="true" />
			New space
		</button>
	</div>

	<div class="end">
		{#if os.health}
			<span class="model" title="Provider and model that assemble modules">{os.health.provider} · {os.health.fastModel}</span>
		{/if}
		<a class="studio" href="/studio"><Code size={13} aria-hidden="true" />Studio</a>
	</div>
</nav>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 24px;
		font-family: var(--m-font);
		font-size: 13px;
	}
	/* The name links to Jason Yuan's Mercury OS; the dotted underline says so quietly. */
	.brand {
		flex-shrink: 0;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--m-text);
		text-decoration: underline dotted var(--m-faint);
		text-decoration-thickness: 1.5px;
		text-underline-offset: 4px;
	}
	.brand:hover {
		text-decoration-color: var(--m-text);
	}
	.spaces {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.space {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		border-radius: 999px;
		color: var(--m-muted);
	}
	.space.active {
		background: var(--m-card);
		color: var(--m-text);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}
	.space-name,
	.new {
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		padding: 6px 4px 6px 12px;
		cursor: pointer;
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.new {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 6px 12px;
	}
	.space-close {
		display: grid;
		place-items: center;
		border: none;
		background: none;
		padding: 6px 10px 6px 4px;
		color: var(--m-faint);
		cursor: pointer;
		opacity: 0;
	}
	.space:hover .space-close,
	.space-close:focus-visible {
		opacity: 1;
	}
	.space-close:hover {
		color: var(--m-text);
	}
	.end {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-left: auto;
		flex-shrink: 0;
	}
	.model {
		font-size: 11.5px;
		color: var(--m-faint);
	}
	.studio {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--m-muted);
		text-decoration: none;
	}
	.studio:hover {
		color: var(--m-text);
	}
	@media (max-width: 720px) {
		.model {
			display: none;
		}
	}
</style>
