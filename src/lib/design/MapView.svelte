<script>
	/**
	 * A stylised map with one pin per place (up to four). The map is decoration, not
	 * geography: pins sit at fixed spots so any set of places reads clearly. With several
	 * places the pins are numbered; on narrow maps their labels move into a legend below.
	 */
	/** @type {{ places: { label: string, sublabel?: string }[], height?: number }} */
	let { places, height = 200 } = $props();

	// Pin spots (percent of width / height) for one to four places.
	const SPOTS = [
		[[50, 54]],
		[
			[32, 62],
			[66, 40]
		],
		[
			[22, 64],
			[50, 36],
			[76, 62]
		],
		[
			[18, 42],
			[40, 70],
			[62, 36],
			[82, 66]
		]
	];
	const spots = $derived(SPOTS[Math.min(places.length, SPOTS.length) - 1] ?? []);
	const shown = $derived(places.slice(0, spots.length));
	const numbered = $derived(shown.length > 1);
</script>

<div class="m-map-wrap">
	<div class="m-map" style:height="{height}px">
		<svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
			<rect width="420" height="150" fill="var(--m-recess)" />
			<g stroke="var(--m-surface)" stroke-linecap="round">
				<path d="M-10 40 L430 60" stroke-width="7" />
				<path d="M-10 110 L430 95" stroke-width="7" />
				<path d="M120 -10 L100 160" stroke-width="6" />
				<path d="M300 -10 L320 160" stroke-width="6" />
				<path d="M-10 75 L430 80" stroke-width="3" />
				<path d="M210 -10 L215 160" stroke-width="3" />
				<path d="M40 -10 L30 160" stroke-width="3" />
			</g>
			<g fill="var(--m-green)">
				<rect x="330" y="105" width="70" height="40" rx="6" />
				<rect x="20" y="10" width="60" height="26" rx="5" />
			</g>
			<g fill="var(--m-tint-strong)">
				<rect x="140" y="12" width="52" height="22" rx="4" />
				<rect x="235" y="118" width="46" height="20" rx="4" />
			</g>
		</svg>
		{#each shown as place, i (i)}
			{@const [x, y] = spots[i]}
			<div class="m-pin" class:left={x > 60} style:left="{x}%" style:top="{y}%">
				<svg width="22" height="26" viewBox="0 0 24 28" aria-hidden="true">
					<path d="M12 27s-9-8.5-9-15a9 9 0 0 1 18 0c0 6.5-9 15-9 15Z" fill="var(--m-accent)" />
					{#if numbered}
						<text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="var(--m-accent-ink)">{i + 1}</text>
					{:else}
						<circle cx="12" cy="12" r="3.5" fill="var(--m-accent-ink)" />
					{/if}
				</svg>
				<div class="m-pin-label" class:numbered>
					<strong>{place.label}</strong>
					{#if place.sublabel}<span>{place.sublabel}</span>{/if}
				</div>
			</div>
		{/each}
	</div>
	{#if numbered}
		<ol class="m-map-legend">
			{#each shown as place, i (i)}
				<li>
					<span class="m-map-legend-n">{i + 1}</span>
					<strong>{place.label}</strong>
					{#if place.sublabel}<span>{place.sublabel}</span>{/if}
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.m-map-wrap {
		container-type: inline-size;
	}
	/* A placeholder tile: the flat recess, drawn from the theme so it follows dark and light. */
	.m-map {
		position: relative;
		border-radius: var(--m-radius-md);
		overflow: hidden;
	}
	.m-map > svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.m-pin {
		position: absolute;
		display: flex;
		align-items: flex-start;
		gap: 4px;
		transform: translate(-11px, -26px);
	}
	/* Pins on the right label towards the centre, so labels stay inside the map. */
	.m-pin.left {
		flex-direction: row-reverse;
		transform: translate(calc(-100% + 11px), -26px);
		text-align: right;
	}
	.m-pin-label {
		display: flex;
		flex-direction: column;
		margin-top: 1px;
		padding: 3px 8px;
		border-radius: var(--m-radius-xs);
		background: var(--m-layer);
		box-shadow: var(--m-shadow-line);
		font-size: var(--m-type-caption);
		line-height: var(--m-type-caption-leading);
		font-weight: 600;
		color: var(--m-ink);
		max-width: 140px;
	}
	.m-pin-label span {
		font-weight: 500;
		color: var(--m-ink-2);
	}
	.m-map-legend {
		display: none;
		gap: 8px;
		margin: 12px 0 0;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
	}
	.m-map-legend li {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.m-map-legend strong {
		font-weight: 500;
	}
	.m-map-legend span:not(.m-map-legend-n) {
		color: var(--m-ink-2);
	}
	.m-map-legend-n {
		display: inline-grid;
		place-items: center;
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--m-accent);
		color: var(--m-accent-ink);
		font-size: var(--m-type-caption);
		font-weight: 700;
	}
	/* Narrow maps: numbered pins only, names in the legend. */
	@container (max-width: 520px) {
		.m-pin-label.numbered {
			display: none;
		}
		.m-map-legend {
			display: grid;
		}
	}
</style>
