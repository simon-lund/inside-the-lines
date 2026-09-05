<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup, EditorView } from 'codemirror';
	import { Compartment, EditorState } from '@codemirror/state';
	import { placeholder } from '@codemirror/view';
	import { html } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let host = $state<HTMLDivElement | null>(null);
	let view: EditorView | undefined;
	const readOnly = new Compartment();
	/** Guards against echoing programmatic (AI/preview) updates back into studio state. */
	let applyingExternal = false;

	onMount(() => {
		view = new EditorView({
			parent: host!,
			state: EditorState.create({
				doc: studio.code,
				extensions: [
					basicSetup,
					html(),
					oneDark,
					placeholder('<!-- Nothing here yet — ask the AI to build something, or just start typing. -->'),
					readOnly.of(EditorState.readOnly.of(false)),
					EditorView.updateListener.of((update) => {
						if (update.docChanged && !applyingExternal) {
							studio.onEditorInput(update.state.doc.toString());
						}
					}),
					EditorView.theme({
						'&': { height: '100%', fontSize: '13px', backgroundColor: 'var(--bg-inset)' },
						'.cm-gutters': { backgroundColor: 'var(--bg-inset)' },
						'.cm-scroller': { fontFamily: 'var(--font-mono)' },
						'&.cm-focused': { outline: 'none' }
					})
				]
			})
		});
		return () => view?.destroy();
	});

	// AI/reset → editor sync; manual typing flows the other way via the update listener.
	$effect(() => {
		const code = studio.code;
		if (!view) return;
		const current = view.state.doc.toString();
		if (code === current) return;
		applyingExternal = true;
		view.dispatch({
			changes: { from: 0, to: current.length, insert: code },
			// While the AI streams, follow the write head like a terminal.
			effects: studio.streaming ? [EditorView.scrollIntoView(code.length)] : []
		});
		applyingExternal = false;
	});

	// Lock the editor while the AI is writing into it.
	$effect(() => {
		const locked = studio.streaming;
		view?.dispatch({ effects: readOnly.reconfigure(EditorState.readOnly.of(locked)) });
	});
</script>

<div class="editor" bind:this={host}></div>

<style>
	.editor {
		height: 100%;
		min-height: 0;
		background: var(--bg-inset);
	}
	.editor :global(.cm-editor) {
		height: 100%;
	}
</style>
