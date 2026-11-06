<script lang="ts">
	import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
	import Warning from 'phosphor-svelte/lib/Warning';
	import X from 'phosphor-svelte/lib/X';
	import { Action, Section } from '$lib/design/index.js';
	import { ERROR_MESSAGES, type ErrorCode } from '$lib/types';

	/**
	 * Error state of one section, built from the design system itself. Local: a failed
	 * section never affects the rest of the page.
	 */
	let {
		intent,
		code,
		keyVar,
		onretry,
		ondismiss
	}: {
		/** What failed; empty when the line above already says it. */
		intent: string;
		code: ErrorCode;
		/** Env var for the setup hint when no key is configured. */
		keyVar?: string;
		onretry: () => void;
		ondismiss: () => void;
	} = $props();

	const message = $derived(
		code === 'missing_api_key'
			? `This one isn’t recorded, and there’s no API key yet. Add ${keyVar ?? 'one'} to .env and restart the server, or try one of the four examples.`
			: (ERROR_MESSAGES[code] ?? 'Something went wrong. Try again in a moment.')
	);
</script>

{#snippet actions()}
	<Action primary icon={ArrowCounterClockwise} label="Try again" onclick={onretry} />
	<Action icon={X} label="Remove" onclick={ondismiss} />
{/snippet}

<Section title="Couldn’t build this" kicker={intent} icon={intent ? Warning : undefined} {actions}>
	<p class="m-text">{message}</p>
</Section>
