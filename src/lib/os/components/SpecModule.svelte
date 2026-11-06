<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		Action,
		Actions,
		Art,
		Bubble,
		Divider,
		ListRow,
		MapView,
		Media,
		Module,
		Reply
	} from '$lib/mercury/src/index.js';
	import { ICON_COMPONENTS } from '$lib/os/icons';
	import type { ActionSpec, ModuleSpec } from '$lib/os/spec';

	/**
	 * Renders one module spec with the design-system components — the only way a
	 * module reaches the screen. "open" actions bubble up; "confirm" actions and
	 * replies are local click-dummy state.
	 */
	let {
		module,
		onopen,
		onmore
	}: {
		module: ModuleSpec;
		onopen: (action: ActionSpec) => void;
		onmore: () => void;
	} = $props();

	const confirmed = new SvelteSet<string>();
	let replies = $state<string[]>([]);

	function click(action: ActionSpec) {
		if (action.effect === 'open') onopen(action);
		else confirmed.add(action.label);
	}

	const iconOf = (action: ActionSpec) =>
		confirmed.has(action.label) ? Check : action.icon ? ICON_COMPONENTS[action.icon] : undefined;
</script>

{#snippet action(a: ActionSpec)}
	<Action
		label={confirmed.has(a.label) ? (a.done ?? a.label) : a.label}
		sublabel={a.sublabel}
		icon={iconOf(a)}
		primary={a.primary}
		onclick={() => click(a)}
	/>
{/snippet}

{#snippet moduleActions()}
	{#each module.actions as a, i (i)}{@render action(a)}{/each}
{/snippet}

<Module
	title={module.title}
	source={module.source}
	kind={module.kind}
	icon={module.icon ? ICON_COMPONENTS[module.icon] : undefined}
	width={400}
	actions={module.actions.length > 0 ? moduleActions : undefined}
	{onmore}
>
	{#each module.blocks as block, i (i)}
		{#if block.type === 'map'}
			<MapView label={block.label} sublabel={block.sublabel} />
		{:else if block.type === 'kicker'}
			<p class="m-kicker">{block.text}</p>
		{:else if block.type === 'title'}
			<h2 class="m-title">{block.text}</h2>
		{:else if block.type === 'text'}
			<p class="m-text">{block.text}</p>
		{:else if block.type === 'meta'}
			<p class="m-meta">{block.text}</p>
		{:else if block.type === 'price'}
			<p class="m-price">{block.text}</p>
		{:else if block.type === 'media'}
			<Media title={block.title} subtitle={block.subtitle}>
				{#snippet art()}
					<Art kind={block.art.kind} tone={block.art.tone} initials={block.art.initials} />
				{/snippet}
				{#if block.actions.length > 0}
					<Actions>
						{#each block.actions as a, j (j)}{@render action(a)}{/each}
					</Actions>
				{/if}
			</Media>
		{:else if block.type === 'art'}
			<Art kind={block.art.kind} tone={block.art.tone} initials={block.art.initials} size="lg" />
		{:else if block.type === 'list'}
			{#each block.rows as row, r (r)}
				<ListRow index={block.numbered ? r + 1 : ''} label={row.label} sub={row.sub} trailing={row.trailing} />
			{/each}
		{:else if block.type === 'message'}
			<Bubble
				text={block.text}
				time={block.time}
				avatar={block.from === 'me' ? '' : block.from}
				outgoing={block.from === 'me'}
			/>
		{:else if block.type === 'divider'}
			<Divider label={block.label} />
		{:else if block.type === 'reply'}
			{#each replies as reply, r (r)}
				<Bubble text={reply} time="Just now" outgoing />
			{/each}
			<Reply placeholder={block.placeholder} onsend={(text: string) => replies.push(text)} />
		{/if}
	{/each}

</Module>
