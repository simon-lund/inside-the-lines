<script>
	/**
	 * Placeholder artwork in the system's palette — so generated views never depend
	 * on external images that may not load. Fills its container (e.g. Media's art slot);
	 * `size="lg"` renders a wide centred illustration for products and places.
	 */
	/**
	 * @type {{
	 *   kind?: 'album' | 'portrait' | 'product' | 'landscape',
	 *   tone?: 'neutral' | 'warm' | 'cool' | 'green' | 'rose',
	 *   initials?: string,
	 *   size?: 'fill' | 'lg'
	 * }}
	 */
	let { kind = 'product', tone = 'neutral', initials = '', size = 'fill' } = $props();
</script>

<div class="m-art" data-tone={tone} data-size={size}>
	{#if kind === 'album'}
		<svg viewBox="0 0 132 132" aria-hidden="true">
			<rect width="132" height="132" fill="var(--a-deep)" />
			<circle cx="92" cy="40" r="26" fill="var(--a-light)" opacity="0.9" />
			<path d="M0 98c22-16 44-16 66-4s44 12 66-2v40H0Z" fill="var(--a-mid)" />
			<path d="M0 112c26-10 50-8 72 2s42 8 60 0v18H0Z" fill="var(--a-light)" opacity="0.35" />
		</svg>
	{:else if kind === 'portrait'}
		<svg viewBox="0 0 132 132" aria-hidden="true">
			<rect width="132" height="132" fill="var(--a-light)" />
			{#if initials}
				<text x="66" y="78" text-anchor="middle" font-size="40" font-weight="600" fill="var(--a-deep)">{initials}</text>
			{:else}
				<circle cx="66" cy="52" r="22" fill="var(--a-mid)" />
				<path d="M24 132c4-30 22-44 42-44s38 14 42 44Z" fill="var(--a-mid)" />
			{/if}
		</svg>
	{:else if kind === 'landscape'}
		<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
			<rect width="320" height="180" fill="var(--a-light)" />
			<circle cx="236" cy="56" r="22" fill="var(--a-mid)" opacity="0.7" />
			<path d="M0 132l70-50 60 40 54-34 72 52 64-30v70H0Z" fill="var(--a-mid)" />
			<path d="M0 156l84-30 80 26 76-20 80 22v26H0Z" fill="var(--a-deep)" />
		</svg>
	{:else}
		<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
			<rect width="320" height="180" fill="var(--a-light)" opacity="0.35" />
			<ellipse cx="160" cy="150" rx="86" ry="10" fill="var(--a-deep)" opacity="0.12" />
			<rect x="104" y="34" width="112" height="110" rx="22" fill="var(--a-mid)" />
			<rect x="124" y="54" width="72" height="12" rx="6" fill="var(--a-light)" opacity="0.8" />
			<rect x="124" y="74" width="44" height="8" rx="4" fill="var(--a-light)" opacity="0.5" />
		</svg>
	{/if}
</div>

<style>
	.m-art {
		--a-light: #e4e4ea;
		--a-mid: #9a9aa4;
		--a-deep: #3a3a40;
		display: block;
		width: 100%;
		height: 100%;
	}
	.m-art[data-tone='warm'] {
		--a-light: #f6e3cf;
		--a-mid: #d79a62;
		--a-deep: #6b3d1f;
	}
	.m-art[data-tone='cool'] {
		--a-light: #dde6f3;
		--a-mid: #7f9cc4;
		--a-deep: #26364f;
	}
	.m-art[data-tone='green'] {
		--a-light: #dcebdc;
		--a-mid: #7fae86;
		--a-deep: #23422a;
	}
	.m-art[data-tone='rose'] {
		--a-light: #f4dfe2;
		--a-mid: #d08c97;
		--a-deep: #5c2630;
	}
	.m-art[data-size='lg'] {
		height: auto;
		margin: 8px 0 16px;
		border-radius: var(--m-radius-sm);
		overflow: hidden;
	}
	.m-art svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.m-art text {
		font-family: var(--m-font);
	}
</style>
