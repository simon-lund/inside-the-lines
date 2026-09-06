<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Square from '@lucide/svelte/icons/square';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import MessageBubble from './MessageBubble.svelte';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let input = $state('');
	let listEl = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let stickToBottom = true;

	const SUGGESTIONS = [
		'A pomodoro timer with a satisfying tick',
		'A markdown notepad with live preview',
		"Conway's Game of Life",
		'A color palette generator'
	];

	const canSend = $derived(input.trim().length > 0 && !studio.streaming && studio.hasApiKey === true);

	// Follow the stream unless the user scrolled up to read something.
	$effect(() => {
		void studio.messages.at(-1)?.raw;
		void studio.messages.length;
		if (listEl && stickToBottom) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});

	function onScroll() {
		if (!listEl) return;
		stickToBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 100;
	}

	function submit(prompt?: string) {
		const text = prompt ?? input;
		if (!text.trim() || studio.streaming || studio.hasApiKey !== true) return;
		if (prompt === undefined) {
			input = '';
			if (textareaEl) textareaEl.style.height = 'auto';
		}
		stickToBottom = true;
		void studio.send(text);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	function autosize() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 160)}px`;
	}
</script>

<aside
	class="flex min-h-0 flex-col border-r bg-card max-md:order-2 max-md:border-t max-md:border-r-0"
>
	<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" bind:this={listEl} onscroll={onScroll}>
		{#if studio.messages.length === 0}
			<!-- empty conversation: welcome + starting points -->
			<div class="m-auto flex flex-col items-center gap-1.5 px-2 py-6 text-center">
				<Sparkles class="mb-1.5 size-9 text-(--accent-text) opacity-50" strokeWidth={1.5} aria-hidden="true" />
				<p class="text-[15px] font-medium">Build something.</p>
				<p class="mb-3 max-w-[260px] text-[13px] text-muted-foreground">
					Describe a mini app and Claude writes it straight into the editor — then iterate together.
				</p>
				<div class="flex w-full max-w-[280px] flex-col gap-2">
					{#each SUGGESTIONS as suggestion (suggestion)}
						<Button
							variant="outline"
							size="sm"
							class="w-full justify-start font-normal text-muted-foreground hover:text-foreground"
							onclick={() => submit(suggestion)}
							disabled={studio.hasApiKey !== true}
						>
							{suggestion}
						</Button>
					{/each}
				</div>
			</div>
		{:else}
			{#each studio.messages as message (message.id)}
				<MessageBubble {studio} {message} />
			{/each}
		{/if}
	</div>

	{#if studio.hasApiKey === false}
		<!-- missing key: the one setup step, spelled out -->
		<div class="px-3 pb-2.5">
			<Alert.Root>
				<KeyRound aria-hidden="true" />
				<Alert.Title>API key needed</Alert.Title>
				<Alert.Description>
					Add <code class="rounded bg-muted px-1 font-mono text-[11.5px]">ANTHROPIC_API_KEY=sk-ant-…</code>
					to <code class="rounded bg-muted px-1 font-mono text-[11.5px]">.env</code> in the project root,
					then restart the dev server.
				</Alert.Description>
			</Alert.Root>
		</div>
	{/if}

	<div class="flex items-end gap-2 border-t p-3">
		<Textarea
			bind:ref={textareaEl}
			bind:value={input}
			onkeydown={onKeydown}
			oninput={autosize}
			rows={1}
			class="max-h-40 min-h-0 resize-none rounded-xl"
			placeholder={studio.hasApiKey === false ? 'Waiting for an API key…' : 'Describe what to build or change…'}
			disabled={studio.hasApiKey !== true}
			aria-label="Message"
		/>
		{#if studio.streaming}
			<Button
				variant="outline"
				size="icon"
				class="shrink-0 rounded-full hover:border-destructive hover:text-destructive"
				onclick={() => studio.stop()}
				title="Stop generating"
				aria-label="Stop generating"
			>
				<Square class="size-3.5" fill="currentColor" aria-hidden="true" />
			</Button>
		{:else}
			<Button
				size="icon"
				class="shrink-0 rounded-full"
				onclick={() => submit()}
				disabled={!canSend}
				title="Send"
				aria-label="Send"
			>
				<ArrowUp strokeWidth={2.4} aria-hidden="true" />
			</Button>
		{/if}
	</div>
</aside>
