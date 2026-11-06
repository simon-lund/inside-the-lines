<script lang="ts">
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Bed from 'phosphor-svelte/lib/Bed';
	import BookmarkSimple from 'phosphor-svelte/lib/BookmarkSimple';
	import Check from 'phosphor-svelte/lib/Check';
	import Gift from 'phosphor-svelte/lib/Gift';
	import NavigationArrow from 'phosphor-svelte/lib/NavigationArrow';
	import PaperPlaneTilt from 'phosphor-svelte/lib/PaperPlaneTilt';
	import Play from 'phosphor-svelte/lib/Play';
	import Ticket from 'phosphor-svelte/lib/Ticket';
	import {
		Action,
		Actions,
		Art,
		Canvas,
		Checklist,
		Icon,
		List,
		ListRow,
		MapView,
		Media,
		Page,
		Section,
		Summary,
		Table
	} from '$lib/design/index.js';
	import Brand from '$lib/app/Brand.svelte';

	/**
	 * The Library: the design system as the model sees it. Every part it imports from 'design',
	 * live, with the made-up content of a page, and the tokens its own markup is drawn with.
	 */

	// Settling actions switch on the spot, as they do on a page.
	let done = $state<Record<string, boolean>>({});
	const toggle = (key: string) => (done[key] = !done[key]);
	let stop = $state(1);

	const ART_KINDS = [
		{ kind: 'album', tone: 'cool' },
		{ kind: 'portrait', tone: 'rose' },
		{ kind: 'product', tone: 'green' },
		{ kind: 'landscape', tone: 'warm' }
	] as const;

	const COLOURS = [
		{ token: '--m-ink', use: 'Text' },
		{ token: '--m-ink-2', use: 'Quieter text' },
		{ token: '--m-ink-3', use: 'Quietest text' },
		{ token: '--m-surface', use: 'The page' },
		{ token: '--m-tint', use: 'A soft fill' },
		{ token: '--m-tint-strong', use: 'A stronger fill' },
		{ token: '--m-recess', use: 'Set into the page' },
		{ token: '--m-line', use: 'Fine lines' },
		{ token: '--m-accent', use: 'The one primary thing' },
		{ token: '--m-clementine-ink', use: 'Words that say when' },
		{ token: '--m-butter', use: 'A recommendation' },
		{ token: '--m-green', use: 'Done' }
	];

	const TYPES = [
		{ token: '--m-type-title', sample: 'Saturday in Alfama' },
		{ token: '--m-type-body', sample: 'Twelve rooms in a restored townhouse.' },
		{ token: '--m-type-tab', sample: 'Grilled sardines by the river' },
		{ token: '--m-type-label', sample: 'Free cancellation until Nov 11' },
		{ token: '--m-type-caption', sample: 'Sat, Nov 14 · 6 km on foot' }
	];
</script>

<svelte:head>
	<title>Library</title>
</svelte:head>

<Canvas>
	<div class="library">
		<nav class="bar" aria-label="Library">
			<Brand />
			<a class="back" href="/"><ArrowLeft size={18} aria-hidden="true" />Pages</a>
		</nav>

		<Page
			title="The design system"
			lede="Every page is built from these parts, imported from 'design', and drawn with these tokens. She writes the rest; none of this can she change."
		>
			<Section title="Casa Miradouro" kicker="Section · MapView · Action · text roles" icon={Bed}>
				<MapView
					places={[
						{ label: 'Casa Miradouro', sublabel: 'Your stay' },
						{ label: 'Taberna do Cais', sublabel: 'Lunch, Sat' },
						{ label: 'Casa da Saudade', sublabel: 'Fado, Sat 9 PM' }
					]}
				/>
				<p class="m-text">Twelve rooms in a restored townhouse, with a rooftop terrace over the river.</p>
				<p class="m-meta">Rua das Escolas Gerais 41{'\n'}Check-in Fri, Nov 13 · 3:00 PM · 2 nights</p>
				{#snippet actions()}
					<Action
						primary
						icon={done.room ? Check : Bed}
						label={done.room ? 'Booked' : 'Book this room'}
						sublabel="Free cancellation until Nov 11"
						onclick={() => toggle('room')}
					/>
					<Action icon={NavigationArrow} label="Get directions" />
				{/snippet}
			</Section>

			<Section title="Saturday in Alfama" kicker="List · ListRow">
				<List>
					<ListRow index={1} label="Pastelaria Dona Luz" sub="Custard tarts and coffee" trailing="9:30 AM" current={stop === 1} onclick={() => (stop = 1)} />
					<ListRow index={2} label="Castle viewpoint walk" sub="Up through the old lanes" trailing="11:00 AM" current={stop === 2} onclick={() => (stop = 2)} />
					<ListRow index={3} label="Taberna do Cais" sub="Grilled sardines by the river" trailing="1:30 PM" current={stop === 3} onclick={() => (stop = 3)} />
					<ListRow index={4} label="Casa da Saudade" sub="Fado and dinner" trailing="9:00 PM" current={stop === 4} onclick={() => (stop = 4)} />
				</List>
				{#snippet actions()}
					<Action
						primary
						icon={done.fado ? Check : Ticket}
						label={done.fado ? 'Table reserved' : 'Reserve fado dinner'}
						sublabel="Table for 2 · 9:00 PM"
						onclick={() => toggle('fado')}
					/>
				{/snippet}
			</Section>

			<Section title="Gift ideas for Dana" kicker="Table, with the pick">
				<Table
					columns={['Gift', 'Price', 'Why']}
					rows={[
						['Halden Trail Vest 8L', '$89', 'Her old vest is falling apart'],
						['Brightside Headlamp', '$42', 'Dark winter morning runs'],
						['Merino trail socks, 3 pairs', '$36', 'Always welcome']
					]}
					pick={0}
				/>
			</Section>

			<Section title="Halden Trail Vest 8L" kicker="Art · price">
				<Art kind="product" tone="green" size="lg" />
				<p class="m-price">$89</p>
				<p class="m-text">A light hydration vest with two soft flasks and a phone pocket that does not bounce.</p>
				{#snippet actions()}
					<Action
						primary
						icon={done.vest ? Check : Gift}
						label={done.vest ? 'Ordered' : 'Buy as a gift'}
						sublabel="Arrives before Nov 14"
						onclick={() => toggle('vest')}
					/>
					<Action icon={BookmarkSimple} label={done.saved ? 'Saved' : 'Save for later'} onclick={() => toggle('saved')} />
				{/snippet}
			</Section>

			<Section title="For the flight" kicker="Media · Actions">
				<Media title="Low Tide" subtitle="Single by Juno Vale · 3:41">
					{#snippet art()}<Art kind="album" tone="cool" />{/snippet}
					<Actions>
						<Action primary icon={Play} label={done.play ? 'Playing' : 'Play'} onclick={() => toggle('play')} />
						<Action icon={BookmarkSimple} label={done.song ? 'Saved' : 'Save'} onclick={() => toggle('song')} />
					</Actions>
				</Media>
			</Section>

			<Section title="What it costs" kicker="Summary">
				<Summary
					rows={[
						{ label: 'Flights, round trip', value: '$598' },
						{ label: 'Casa Miradouro, 2 nights', value: '$342' },
						{ label: 'Food and fado', value: '≈ $180' }
					]}
					total={{ label: 'Total', value: '≈ $1,120' }}
				/>
				{#snippet actions()}
					<Action icon={done.sent ? Check : PaperPlaneTilt} label={done.sent ? 'Sent to Mara' : 'Send to Mara'} onclick={() => toggle('sent')} />
				{/snippet}
			</Section>

			<Section title="Pack for Lisbon" kicker="Checklist">
				<Checklist items={['Passport', 'Walking shoes for the hills', 'Light jacket for the evenings', 'Power adapter (type F)', 'Cash for the fado house']} />
			</Section>

			<Section title="Placeholder art" kicker="Art · four kinds, five tones">
				<div class="arts">
					{#each ART_KINDS as a (a.kind)}
						<figure>
							<div class="art"><Art kind={a.kind} tone={a.tone} /></div>
							<figcaption class="m-meta">{a.kind} · {a.tone}</figcaption>
						</figure>
					{/each}
				</div>
				<p class="m-meta">Never an image from the web: a page can't depend on one that may not load.</p>
			</Section>

			<Section title="Tokens" kicker="For her own markup · colour and type">
				<p class="m-text">
					Where no part fits (a seat map, a timeline), she writes her own markup and styles, with these and
					nothing else: no colour or font of her own.
				</p>
				<ul class="swatches">
					{#each COLOURS as c (c.token)}
						<li>
							<span class="chip" style:background="var({c.token})"></span>
							<span class="name">{c.token}</span>
							<span class="use">{c.use}</span>
						</li>
					{/each}
				</ul>
				<ul class="types">
					{#each TYPES as t (t.token)}
						<li>
							<span class="sample" style:font-size="var({t.token})">{t.sample}</span>
							<span class="name">{t.token}</span>
						</li>
					{/each}
				</ul>
				<p class="m-meta"><Icon kind={Check} size={14} /> Icons are Phosphor, coloured by the text around them.</p>
			</Section>
		</Page>
	</div>
</Canvas>

<style>
	.library {
		flex: 1 1 100%;
		display: flex;
		flex-direction: column;
		gap: 48px;
		min-width: 0;
		margin-top: -28px;
		padding-bottom: 64px;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 24px;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: var(--m-control-sm);
		margin-left: auto;
		padding: 0 12px;
		border-radius: 999px;
		color: var(--m-ink-2);
		transition: background-color var(--m-dur-quick) var(--m-ease-settle);
	}
	.back:hover {
		background: var(--m-tint);
		color: var(--m-ink);
	}
	.arts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14px;
	}
	figure {
		margin: 0;
		display: grid;
		gap: 6px;
	}
	.art {
		aspect-ratio: 1;
		border-radius: var(--m-radius-md);
		overflow: hidden;
	}
	/* The tokens, drawn with the tokens: the way her own markup is. */
	.swatches,
	.types {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px 20px;
	}
	.swatches li {
		display: grid;
		grid-template-columns: 36px 1fr;
		column-gap: 12px;
		align-items: center;
	}
	.chip {
		grid-row: span 2;
		width: 36px;
		height: 36px;
		border-radius: var(--m-radius-sm);
		box-shadow: var(--m-shadow-line);
	}
	.name {
		font-family: var(--m-font-mono);
		font-size: var(--m-type-caption);
		color: var(--m-ink);
	}
	.use {
		font-size: var(--m-type-label);
		color: var(--m-ink-2);
	}
	.types li {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 10px 0;
		border-top: 1px solid var(--m-line);
	}
	.sample {
		font-weight: 500;
	}
	@media (max-width: 640px) {
		.library {
			gap: 20px;
		}
		.arts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.types li {
			flex-direction: column;
			gap: 2px;
		}
	}
</style>
