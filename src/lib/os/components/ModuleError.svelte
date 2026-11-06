<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { Action, Module } from '$lib/mercury/src/index.js';
	import { ERROR_MESSAGES, type ErrorCode } from '$lib/types';

	/**
	 * Error state of one module slot, built from the design system itself. Local:
	 * a failed slot never affects the rest of the space.
	 */
	let {
		intent,
		code,
		keyVar,
		onretry,
		ondismiss
	}: {
		intent: string;
		code: ErrorCode;
		/** Env var for the setup hint when no key is configured. */
		keyVar?: string;
		onretry: () => void;
		ondismiss: () => void;
	} = $props();

	const message = $derived(
		code === 'missing_api_key'
			? `This one isn't recorded yet, and no API key is set. Add ${keyVar ?? 'an API key'} to .env and restart the server — or try one of the examples.`
			: (ERROR_MESSAGES[code] ?? ERROR_MESSAGES.stream_error)
	);
</script>

{#snippet actions()}
	<Action primary icon={RotateCcw} label="Try again" onclick={onretry} />
	<Action icon={X} label="Dismiss" onclick={ondismiss} />
{/snippet}

<Module title="Couldn't assemble this" source={intent} icon={TriangleAlert} mic={false} more="" width={400} {actions}>
	<p class="m-text">{message}</p>
</Module>
