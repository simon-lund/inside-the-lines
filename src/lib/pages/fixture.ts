import type { PageFile } from './repl.svelte';

/**
 * A hand-written page in the shape the model writes: App.svelte plus section components, built
 * from the design system, with a little markup of its own styled only through the tokens.
 * The design check's tests start from it.
 */
export const FIXTURE_PAGE: PageFile[] = [
	{
		name: 'App.svelte',
		contents: `<script>
	import { Canvas, Page } from 'design';
	import Stay from './lib/Stay.svelte';
	import DayPlan from './lib/DayPlan.svelte';
	import Costs from './lib/Costs.svelte';
</script>

<Canvas>
	<Page title="Lisbon weekend" lede="Three nights in Alfama, Nov 13–16: a nonstop flight, a guesthouse with a roof terrace, one slow day on foot.">
		<Stay />
		<DayPlan />
		<Costs />
	</Page>
</Canvas>
`
	},
	{
		name: 'lib/Stay.svelte',
		contents: `<script>
	import { Section, MapView, Action, ask } from 'design';
	let booked = $state(false);
</script>

<Section title="Casa Miradouro" kicker="3 nights · Nov 13 to Nov 16">
	<MapView places={[{ label: 'Casa Miradouro', sublabel: 'Your stay' }, { label: 'Taberna do Cais', sublabel: 'Lunch, Sat' }, { label: 'Casa da Saudade', sublabel: 'Fado, Sat 9 PM' }]} />
	<p class="m-text">Twelve rooms in a restored townhouse, with a rooftop terrace over the river.</p>
	<p class="m-meta">Rua das Escolas Gerais 41{'\\n'}Check-in Fri, Nov 13 · 3:00 PM</p>

	{#snippet actions()}
		<Action primary label={booked ? 'Booked' : 'Book this room'} sublabel="Free cancellation until Nov 11" onclick={() => (booked = true)} />
		<Action label="See other stays" onclick={() => ask('Three other places to stay in Alfama, compared by price and rating', 'See other stays')} />
	{/snippet}
</Section>
`
	},
	{
		name: 'lib/DayPlan.svelte',
		contents: `<script>
	import { Section, Action } from 'design';
	const stops = [
		{ time: '9:30', what: 'Pastelaria Dona Luz', note: 'Custard tarts and coffee' },
		{ time: '11:00', what: 'Castle viewpoint walk', note: 'Up through the old lanes' },
		{ time: '13:30', what: 'Taberna do Cais', note: 'Grilled sardines by the river' },
		{ time: '21:00', what: 'Casa da Saudade', note: 'Fado and dinner' }
	];
	let done = $state(0);
</script>

<Section title="Saturday in Alfama" kicker="Sat, Nov 14 · About 6 km on foot">
	<ol class="timeline">
		{#each stops as stop, i}
			<li class:past={i < done}>
				<span class="time">{stop.time}</span>
				<span class="what">{stop.what}<small>{stop.note}</small></span>
			</li>
		{/each}
	</ol>

	{#snippet actions()}
		<Action primary label="Next stop" sublabel={done < stops.length ? stops[done].what : 'All done'} onclick={() => (done = Math.min(done + 1, stops.length))} />
	{/snippet}
</Section>

<style>
	/* A block of its own: a timeline, drawn only with the design tokens. */
	.timeline {
		display: grid;
		gap: 0;
		border-left: 2px solid var(--m-line-strong);
		margin-left: 6px;
	}
	li {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 12px;
		padding: 10px 0 10px 18px;
		position: relative;
		font-size: var(--m-type-tab);
	}
	li::before {
		content: '';
		position: absolute;
		left: -7px;
		top: 15px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--m-surface);
		box-shadow: inset 0 0 0 2px var(--m-accent);
	}
	li.past::before {
		background: var(--m-accent);
	}
	li.past .what {
		color: var(--m-ink-3);
	}
	.time {
		font-weight: 600;
		color: var(--m-clementine-ink);
	}
	.what {
		display: grid;
		font-weight: 500;
	}
	small {
		font-weight: 400;
		font-size: var(--m-type-label);
		color: var(--m-ink-2);
	}
</style>
`
	},
	{
		name: 'lib/Costs.svelte',
		contents: `<script>
	import { Section, Summary } from 'design';
</script>

<Section title="What it costs" kicker="Two people · Nov 13–16">
	<Summary
		rows={[
			{ label: 'Flights, round trip', value: '$598' },
			{ label: 'Casa Miradouro, 3 nights', value: '$495' },
			{ label: 'Food and fado', value: '≈ $210' }
		]}
		total={{ label: 'Total', value: '≈ $1,303' }}
	/>
</Section>
`
	}
];
