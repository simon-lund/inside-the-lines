<script>
	/**
	 * The foundation of the design system: Klementine's design system v3 (klementine.ui,
	 * theme.css) as tokens, flat and dark first, every colour written once as
	 * light-dark(<light>, <dark>); plus the reset, the type and the text roles. Canvas wraps a
	 * page in it; the app's own shell wraps itself in it too.
	 */
	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<svelte:head>
	<!-- The type travels with the design system too: a generated page gets it without asking. -->
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
	/>
</svelte:head>

{@render children?.()}

<style>
	:global(:root) {
		color-scheme: light dark;

		/* canvas: a warm paper in light, a warm near-black in dark; depth from lines, not shadows */
		--m-ground: light-dark(#f5f3ee, #1b1916);
		--m-line: light-dark(rgb(36 35 29 / 0.1), rgb(255 248 235 / 0.09));
		--m-line-strong: light-dark(rgb(36 35 29 / 0.18), rgb(255 248 235 / 0.16));
		/* the card (a page), and the layer: what floats on top (the docked composer) */
		--m-surface: light-dark(#ffffff, #262420);
		--m-layer: light-dark(#ffffff, #2e2b26);
		/* neutral steps: the tint for hover / selected, the flat recess (a placeholder tile), the well */
		--m-tint: light-dark(#ebe7de, #2e2b26);
		--m-tint-strong: light-dark(#e2ddd0, #38352f);
		--m-recess: light-dark(#ebe7de, #211f1b);
		--m-sunk: light-dark(#ebe7de, #151412);
		--m-ink: light-dark(#24231d, #f2efe7);
		--m-ink-2: light-dark(#5c594e, #bdb6a8);
		--m-ink-3: light-dark(#66625a, #aaa498);
		/* the key: a control on its own, lit from above in dark */
		--m-key: light-dark(#ffffff, #3a3731);
		--m-key-hover: light-dark(#faf9f6, #423f38);
		--m-key-highlight: light-dark(rgb(255 255 255 / 0), rgb(255 248 235 / 0.08));
		--m-key-shadow: light-dark(rgb(36 35 29 / 0.16), rgb(0 0 0 / 0.5));
		/* the accent is the page's own ink: one primary per section */
		--m-accent: light-dark(#24231d, #f2efe7);
		--m-accent-hover: light-dark(#3a3830, #ffffff);
		--m-accent-ink: light-dark(#f5f3ee, #1b1916);
		--m-focus-halo: light-dark(rgb(36 35 29 / 0.16), rgb(242 239 231 / 0.24));
		/* clementine: the assistant herself and the words that say when. Nothing else is orange. */
		--m-clementine: #f26b1d;
		--m-clementine-ink: light-dark(#a94609, #f47b33);
		--m-on-clementine: #24231d;
		/* washes with their own ink: butter is the app speaking (a recommendation), green is done */
		--m-butter: light-dark(#fbf5d3, #302d1f);
		--m-butter-ink: light-dark(#34331b, #efe7c0);
		--m-green: light-dark(#e3f1e5, #2c312a);
		--m-green-ink: light-dark(#2f6b3a, #9fd4a8);

		/* elevation: one test — is it one of many? */
		--m-shadow-line: 0 0 0 1px var(--m-line);
		--m-shadow-key: inset 0 1px 0 0 var(--m-key-highlight), 0 0 0 1px var(--m-line), 0 1px 2px 0 var(--m-key-shadow);
		--m-shadow-float:
			0 0 0 1px var(--m-line-strong), 0 2px 6px -2px light-dark(rgb(36 35 29 / 0.1), rgb(0 0 0 / 0.4)),
			0 16px 40px -12px light-dark(rgb(36 35 29 / 0.2), rgb(0 0 0 / 0.65));

		/* radii: chips 6, small 10, fields 14, cards 16, the composer 28; buttons are pills */
		--m-radius-xs: 6px;
		--m-radius-sm: 10px;
		--m-radius-md: 14px;
		--m-radius-lg: 16px;
		--m-radius-xl: 28px;

		/* space around the page, and inside it from its edge to the content */
		--m-gutter: 48px;
		--m-inset: 56px;

		/* motion: press in quickly, settle out */
		--m-dur-press: 80ms;
		--m-dur-quick: 140ms;
		--m-dur-base: 220ms;
		--m-dur-calm: 320ms;
		--m-ease-settle: cubic-bezier(0.22, 1, 0.36, 1);

		/*
		 * density: touch is the default (48px keys, the phone's type); fine is a wide window with a
		 * mouse (below), where controls and type step down by a quarter, as in Klementine.
		 */
		--m-control: 48px;
		--m-control-sm: 40px;
		--m-type-display: 1.875rem;
		--m-type-display-leading: 2.25rem;
		--m-type-headline: 1.375rem;
		--m-type-headline-leading: 1.75rem;
		--m-type-title: 1.0625rem;
		--m-type-title-leading: 1.4375rem;
		--m-type-body: 1rem;
		--m-type-body-leading: 1.5rem;
		--m-type-tab: 0.9375rem;
		--m-type-tab-leading: 1.25rem;
		--m-type-label: 0.8125rem;
		--m-type-label-leading: 1rem;
		--m-type-caption: 0.75rem;
		--m-type-caption-leading: 1rem;

		--m-font: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		--m-font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	}
	@media (pointer: fine) and (min-width: 1120px) {
		:global(:root) {
			--m-control: 36px;
			--m-control-sm: 30px;
			--m-type-display: 1.5rem;
			--m-type-display-leading: 1.875rem;
			--m-type-headline: 1.125rem;
			--m-type-headline-leading: 1.4375rem;
			--m-type-title: 0.9375rem;
			--m-type-title-leading: 1.25rem;
			--m-type-body: 0.875rem;
			--m-type-body-leading: 1.3125rem;
			--m-type-tab: 0.8125rem;
			--m-type-tab-leading: 1.125rem;
			--m-type-label: 0.75rem;
			--m-type-label-leading: 1rem;
			--m-type-caption: 0.6875rem;
			--m-type-caption-leading: 0.875rem;
			--m-inset: 44px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(:root) {
			--m-dur-press: 0ms;
			--m-dur-quick: 120ms;
			--m-dur-base: 120ms;
			--m-dur-calm: 120ms;
		}
	}
	/* The baseline the components were built on (the relevant part of Tailwind's preflight). It
	   lives here, not in an app stylesheet, so it travels with the design system into the REPL. */
	:global(*), :global(::before), :global(::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		border: 0 solid;
	}
	:global(html) {
		line-height: 1.5;
		-webkit-text-size-adjust: 100%;
	}
	:global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6) {
		font-size: inherit;
		font-weight: inherit;
	}
	:global(ol), :global(ul) {
		list-style: none;
	}
	:global(img), :global(svg), :global(video), :global(canvas) {
		display: block;
	}
	:global(a) {
		color: inherit;
		text-decoration: inherit;
	}
	:global(button), :global(input) {
		font: inherit;
		color: inherit;
		background-color: transparent;
		border-radius: 0;
	}
	:global(::placeholder) {
		opacity: 1;
		color: color-mix(in oklab, currentcolor 50%, transparent);
	}
	:global(body) {
		margin: 0;
		background: var(--m-ground);
		color: var(--m-ink);
		font-family: var(--m-font);
		font-size: var(--m-type-body);
		line-height: var(--m-type-body-leading);
		/* every time and count is tabular */
		font-variant-numeric: tabular-nums;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		-webkit-tap-highlight-color: transparent;
	}

	/* Keyboard focus: a 2px ring in the accent, 2px out. */
	:global(:focus-visible) {
		outline: 2px solid var(--m-accent);
		outline-offset: 2px;
	}



	/* Text roles used inside sections (Klementine's body, label and title roles). */
	:global(.m-title) {
		margin: 0;
		font-size: var(--m-type-headline);
		line-height: var(--m-type-headline-leading);
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	:global(.m-text) {
		margin: 0;
		font-size: var(--m-type-body);
		line-height: var(--m-type-body-leading);
		color: var(--m-ink);
	}
	:global(.m-meta) {
		margin: 0;
		font-size: var(--m-type-tab);
		line-height: var(--m-type-tab-leading);
		color: var(--m-ink-2);
		white-space: pre-line;
	}
	:global(.m-price) {
		margin: 0;
		font-size: var(--m-type-display);
		line-height: var(--m-type-display-leading);
		font-weight: 600;
		letter-spacing: -0.04em;
	}

	@media (max-width: 640px) {
		:global(:root) {
			--m-gutter: 16px;
			--m-inset: 16px;
		}
	}
</style>
