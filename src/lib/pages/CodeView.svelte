<script lang="ts">
	import Editor from '@sveltejs/repl/editor';
	import { List, ListRow } from '$lib/design/index.js';
	import type { PageEntry } from './pages.svelte';
	import type { Repl } from './repl.svelte';

	/**
	 * The page as code: the files she wrote, read-only, beside what the design check finds in
	 * them. A finding opens the file it is in.
	 */
	let { repl, page }: { repl: Repl; page: PageEntry } = $props();

	// App.svelte first, where the page starts; the rest by name.
	const files = $derived(
		page.files.map((f) => f.name).sort((a, b) => (a === 'App.svelte' ? -1 : b === 'App.svelte' ? 1 : a.localeCompare(b)))
	);
	const current = $derived(repl.workspace.current?.name);
	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
	const findingsIn = (name: string) => page.issues.filter((i) => i.file === name).length;

	function open(name: string) {
		if (files.includes(name)) repl.workspace.select(name);
	}
</script>

<div class="code">
	<aside>
		<section>
			<h2 class="m-meta">Design check</h2>
			{#if page.issues.length === 0}
				<p class="clean">Inside the lines: {count(files.length, 'file', 'files')}, nothing outside the guideline.</p>
			{:else}
				<List>
					{#each page.issues as issue (issue.rule + issue.file)}
						<ListRow label={issue.message} sub={issue.rule} onclick={() => open(issue.file)} />
					{/each}
				</List>
			{/if}
		</section>
		<section>
			<h2 class="m-meta">Files</h2>
			<List>
				{#each files as name (name)}
					{@const n = findingsIn(name)}
					<ListRow
						label={name}
						trailing={n > 0 ? count(n, 'finding', 'findings') : ''}
						current={name === current}
						onclick={() => open(name)}
					/>
				{/each}
			</List>
		</section>
	</aside>
	<div class="editor"><Editor workspace={repl.workspace} /></div>
</div>

<style>
	.code {
		display: grid;
		grid-template-columns: minmax(240px, 320px) 1fr;
		height: 100%;
		min-height: 0;
		border-top: 1px solid var(--m-line);
	}
	aside {
		display: flex;
		flex-direction: column;
		gap: 32px;
		min-height: 0;
		overflow: auto;
		/* Room below for the docked composer. */
		padding: 20px var(--m-gutter) 160px;
		border-right: 1px solid var(--m-line);
	}
	h2 {
		margin: 0 0 6px;
	}
	.clean {
		margin: 0;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
		color: var(--m-ink-2);
	}
	/* The REPL's editor, drawn with the design tokens: quiet ink, keywords in clementine. */
	.editor {
		min-height: 0;
		overflow: hidden;
		background: var(--m-surface);
		--shiki-color-text: var(--m-ink);
		--shiki-token-keyword: var(--m-clementine-ink);
		--shiki-token-function: var(--m-green-ink);
		--shiki-token-string: var(--m-ink-2);
		--shiki-token-comment: var(--m-ink-3);
		--sk-code-atom: var(--m-clementine-ink);
		--sk-fg-1: var(--m-ink);
		--sk-fg-2: var(--m-ink-2);
		--sk-fg-3: var(--m-ink-3);
		--sk-bg-2: var(--m-surface);
		--sk-bg-3: var(--m-surface);
		--sk-bg-4: var(--m-tint-strong);
		--sk-bg-selection: var(--m-tint-strong);
		--sk-bg-unfocused-selection: var(--m-tint);
		--sk-bg-highlight: var(--m-tint);
		--sk-border: var(--m-line);
		--sk-border-radius: var(--m-radius-sm);
		--sk-font-mono: 400 13px/1.7 var(--m-font-mono);
		--sk-font-ui-small: 400 12px/1.4 var(--m-font);
		--sk-shadow: var(--m-shadow-float);
	}
	.editor :global(.cm-content) {
		padding-block: 20px 160px;
	}
	@media (max-width: 720px) {
		.code {
			grid-template-columns: 1fr;
			grid-template-rows: auto 70vh;
			height: auto;
		}
		aside {
			overflow: visible;
			padding-bottom: 20px;
			border-right: 0;
			border-bottom: 1px solid var(--m-line);
		}
	}
</style>
