<script>
	/** A stylised map with a pin — flush with the module header. */
	/** @type {{ label?: string, sublabel?: string, height?: number }} */
	let { label = '', sublabel = '', height = 150 } = $props();
</script>

<div class="m-map" style:height="{height}px">
	<svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
		<rect width="420" height="150" fill="#eef0f2" />
		<g stroke="#ffffff" stroke-linecap="round">
			<path d="M-10 40 L430 60" stroke-width="7" />
			<path d="M-10 110 L430 95" stroke-width="7" />
			<path d="M120 -10 L100 160" stroke-width="6" />
			<path d="M300 -10 L320 160" stroke-width="6" />
			<path d="M-10 75 L430 80" stroke-width="3" />
			<path d="M210 -10 L215 160" stroke-width="3" />
			<path d="M40 -10 L30 160" stroke-width="3" />
		</g>
		<g fill="#d9e6d3">
			<rect x="330" y="105" width="70" height="40" rx="6" />
			<rect x="20" y="10" width="60" height="26" rx="5" />
		</g>
		<g fill="#c7d3e0" opacity="0.7">
			<rect x="140" y="12" width="52" height="22" rx="4" />
			<rect x="235" y="118" width="46" height="20" rx="4" />
		</g>
		<g fill="#a8a8b0">
			<circle cx="60" cy="50" r="2.5" /><circle cx="160" cy="98" r="2.5" /><circle cx="250" cy="45" r="2.5" /><circle cx="360" cy="70" r="2.5" /><circle cx="80" cy="128" r="2.5" />
		</g>
	</svg>
	<div class="m-pin">
		<svg width="26" height="30" viewBox="0 0 24 28" aria-hidden="true">
			<path d="M12 27s-9-8.5-9-15a9 9 0 0 1 18 0c0 6.5-9 15-9 15Z" fill="var(--m-accent)" />
			<circle cx="12" cy="12" r="3.5" fill="#fff" />
		</svg>
		{#if label}
			<div class="m-pin-label">
				<strong>{label}</strong>
				{#if sublabel}<span>{sublabel}</span>{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.m-map {
		position: relative;
		margin: -24px -28px 20px;
		overflow: hidden;
	}
	.m-map svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.m-pin {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-13px, -30px);
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}
	.m-pin-label {
		display: flex;
		flex-direction: column;
		margin-top: 2px;
		font-size: 9px;
		line-height: 1.3;
		color: var(--m-accent);
		max-width: 90px;
	}
	.m-pin-label span {
		color: var(--m-muted);
	}
</style>
