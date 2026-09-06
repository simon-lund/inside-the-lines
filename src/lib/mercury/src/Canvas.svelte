<script>
	/**
	 * The Mercury canvas: a light surface on which modules are laid out.
	 * Defines the design tokens every other Mercury component uses.
	 */
	/** @type {{ children?: import('svelte').Snippet, align?: 'start' | 'center' }} */
	let { children, align = 'start' } = $props();
</script>

<div class="mercury-canvas" style:align-items={align === 'center' ? 'center' : 'flex-start'}>
	{@render children?.()}
</div>

<style>
	:global(:root) {
		--m-bg: #f6f6f8;
		--m-card: #ffffff;
		--m-header: #f4f4f7;
		--m-text: #1c1c1e;
		--m-muted: #6f6f76;
		--m-faint: #a8a8b0;
		--m-pill: #f1f1f4;
		--m-pill-hover: #e6e6eb;
		--m-border: #ececf0;
		--m-accent: #e5484d;
		--m-radius: 14px;
		--m-radius-sm: 10px;
		--m-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 14px 36px rgba(0, 0, 0, 0.07);
		--m-font:
			-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
	}
	:global(body) {
		margin: 0;
	}
	.mercury-canvas {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 56px 48px;
		display: flex;
		flex-wrap: wrap;
		gap: 40px;
		background: var(--m-bg);
		color: var(--m-text);
		font-family: var(--m-font);
		font-size: 15px;
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;
	}

	/* Text roles shared by every module */
	:global(.m-title) {
		margin: 0 0 6px;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.25;
	}
	:global(.m-text) {
		margin: 0 0 12px;
		font-size: 15px;
		color: var(--m-text);
	}
	:global(.m-meta) {
		margin: 0;
		font-size: 13px;
		line-height: 1.45;
		color: var(--m-muted);
		white-space: pre-line;
	}
	:global(.m-kicker) {
		margin: 0 0 2px;
		font-size: 14px;
		color: var(--m-muted);
	}
	:global(.m-price) {
		margin: 8px 0 0;
		font-size: 16px;
		color: var(--m-text);
	}
</style>
