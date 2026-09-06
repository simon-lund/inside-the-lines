<script lang="ts">
	import Viewer from '@sveltejs/repl/viewer';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import X from '@lucide/svelte/icons/x';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Studio } from '$lib/studio.svelte';

	let { studio }: { studio: Studio } = $props();

	let dismissed = $state<string | null>(null);

	// One error surface: runtime errors from the iframe, or bundle failures.
	const activeError = $derived(
		studio.previewError ?? ((studio.bundler.result?.error as Error | undefined) || null)
	);
	const showToast = $derived(activeError !== null && dismissed !== activeError?.message);

	function askAiToFix() {
		if (!activeError) return;
		const report = `${activeError.name ?? 'Error'}: ${activeError.message}`;
		studio.previewError = null;
		studio.pinTab('preview');
		void studio.send('The app has an error — please fix it.', { errorReport: report });
	}
</script>

<div class="relative h-full min-h-0 bg-background [&>:first-child]:h-full">
	<!-- Passing onLog hides the Viewer's built-in console pane; errors still arrive via bind:error. -->
	<Viewer
		bundler={studio.bundler}
		bind:error={studio.previewError}
		status={studio.bundlerStatus}
		theme="dark"
		onLog={() => {}}
	/>

	{#if showToast && activeError}
		<div class="absolute right-3.5 bottom-3.5 left-3.5 z-10 animate-in fade-in slide-in-from-bottom-2">
			<Alert.Root variant="destructive" class="bg-card shadow-lg">
				<TriangleAlert aria-hidden="true" />
				<Alert.Title>The app has an error</Alert.Title>
				<Alert.Description class="truncate font-mono text-xs">{activeError.message}</Alert.Description>
				<Alert.Action class="flex items-center gap-1">
					<Button
						variant="outline"
						size="xs"
						onclick={askAiToFix}
						disabled={studio.streaming || studio.hasApiKey !== true}
					>
						<WandSparkles aria-hidden="true" />
						Fix with AI
					</Button>
					<Button
						variant="ghost"
						size="icon-xs"
						onclick={() => (dismissed = activeError?.message ?? null)}
						title="Dismiss"
						aria-label="Dismiss error"
					>
						<X aria-hidden="true" />
					</Button>
				</Alert.Action>
			</Alert.Root>
		</div>
	{/if}
</div>
