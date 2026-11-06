<script lang="ts">
	import Check from 'phosphor-svelte/lib/Check';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		Action,
		Actions,
		Art,
		Checklist,
		ListRow,
		MapView,
		Media,
		Section,
		Summary,
		Table
	} from '$lib/design/index.js';
	import { ICON_COMPONENTS } from '$lib/os/icons';
	import type { ActionSpec, SectionSpec } from '$lib/os/spec';

	/**
	 * Renders one section spec with the design-system components — the only way a
	 * section reaches the page. "open" actions bubble up; "confirm" actions are local
	 * click-dummy state.
	 */
	let { section, onopen }: { section: SectionSpec; onopen: (action: ActionSpec) => void } = $props();

	const confirmed = new SvelteSet<string>();

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

{#snippet sectionActions()}
	{#each section.actions as a, i (i)}{@render action(a)}{/each}
{/snippet}

<Section
	title={section.title}
	kicker={section.kicker}
	actions={section.actions.length > 0 ? sectionActions : undefined}
>
	{#each section.blocks as block, i (i)}
		{#if block.type === 'text'}
			<p class="m-text">{block.text}</p>
		{:else if block.type === 'meta'}
			<p class="m-meta">{block.text}</p>
		{:else if block.type === 'price'}
			<p class="m-price">{block.text}</p>
		{:else if block.type === 'map'}
			<MapView places={block.places} />
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
			<div>
				{#each block.rows as row, r (r)}
					<ListRow index={block.numbered ? r + 1 : ''} label={row.label} sub={row.sub} trailing={row.trailing} />
				{/each}
			</div>
		{:else if block.type === 'table'}
			<Table columns={block.columns} rows={block.rows} pick={block.pick} />
		{:else if block.type === 'summary'}
			<Summary rows={block.rows} total={block.total} />
		{:else if block.type === 'checklist'}
			<Checklist items={block.items} />
		{/if}
	{/each}
</Section>
