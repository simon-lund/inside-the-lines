<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import FileCode2 from '@lucide/svelte/icons/file-code-2';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Studio, UiMessage } from '$lib/studio.svelte';
	import { ERROR_MESSAGES } from '$lib/types';

	let { studio, message }: { studio: Studio; message: UiMessage } = $props();

	const isThinkingPlaceholder = $derived(
		message.status === 'streaming' && !message.display && message.fileNames.length === 0
	);
	const chipLabel = $derived(
		message.fileNames.length === 1 ? message.fileNames[0] : `${message.fileNames.length} files`
	);
	const isLast = $derived(studio.messages.at(-1)?.id === message.id);
	const phaseLabel = $derived(
		studio.phase === 'thinking' ? 'Thinking…' : studio.phase === 'writing' ? 'Writing…' : 'Working…'
	);
</script>

{#if message.role === 'user'}
	<div class="flex justify-end">
		<div class="max-w-[88%] rounded-2xl rounded-br-sm bg-muted px-3.5 py-2 whitespace-pre-wrap [overflow-wrap:anywhere]">
			{message.display}
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#if message.status === 'error'}
			<Alert.Root variant="destructive">
				<CircleAlert aria-hidden="true" />
				<Alert.Title>Something went wrong</Alert.Title>
				<Alert.Description>{ERROR_MESSAGES[message.errorCode ?? 'stream_error']}</Alert.Description>
				<Alert.Action>
					<Button variant="outline" size="xs" onclick={() => studio.retryLast()} disabled={studio.streaming}>
						<RotateCcw aria-hidden="true" />
						Retry
					</Button>
				</Alert.Action>
			</Alert.Root>
		{:else if isThinkingPlaceholder}
			<p class="shimmer-text text-[13.5px]">{phaseLabel}</p>
		{:else}
			{#if message.display}
				<p class="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.display}</p>
			{/if}
			{#if message.fileNames.length > 0}
				<Button
					variant="outline"
					size="sm"
					class="self-start font-normal {message.status === 'streaming' ? 'animate-pulse border-(--accent-text)' : ''}"
					onclick={() => studio.pinTab('code')}
					title="Open in the code view"
				>
					{#if message.status === 'streaming'}
						<LoaderCircle class="animate-spin" aria-hidden="true" />
					{:else}
						<FileCode2 aria-hidden="true" />
					{/if}
					<span class="font-mono text-xs">{chipLabel}</span>
					<span class="text-xs text-muted-foreground">
						{message.status === 'streaming' ? 'writing…' : 'view code'}
					</span>
				</Button>
			{/if}
			{#if message.status === 'done' && message.designIssues?.length}
				<!-- design check: what the guardrail caught in this answer -->
				<Alert.Root>
					<ShieldCheck aria-hidden="true" />
					<Alert.Title>
						Design check: {message.designIssues.length}
						{message.designIssues.length === 1 ? 'issue' : 'issues'}
					</Alert.Title>
					<Alert.Description>
						<ul class="list-disc pl-4 text-xs">
							{#each message.designIssues as issue, i (i)}
								<li>{issue.message}</li>
							{/each}
						</ul>
					</Alert.Description>
					{#if isLast}
						<Alert.Action>
							<Button
								variant="outline"
								size="xs"
								onclick={() => studio.fixDesign(message)}
								disabled={studio.streaming || studio.hasApiKey !== true}
							>
								<WandSparkles aria-hidden="true" />
								Fix with AI
							</Button>
						</Alert.Action>
					{/if}
				</Alert.Root>
			{/if}
			{#if message.stopReason === 'refusal'}
				<p class="text-xs text-muted-foreground italic">The model declined this request.</p>
			{:else if message.stopReason === 'max_tokens'}
				<p class="text-xs text-muted-foreground italic">
					The response hit the length limit and may be incomplete.
				</p>
			{:else if message.stopReason === 'aborted'}
				<p class="text-xs text-muted-foreground italic">Stopped.</p>
			{/if}
		{/if}
	</div>
{/if}
