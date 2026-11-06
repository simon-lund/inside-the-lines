<script lang="ts">
	/** Loading state of a module slot — same width and chrome as a real module, no content. */
	let { label }: { label: string } = $props();
</script>

<section class="skeleton" aria-busy="true" aria-label="Assembling: {label}">
	<header>
		<span class="dot"></span>
		<span class="line" style:width="45%"></span>
	</header>
	<div class="body">
		<span class="line title"></span>
		<span class="line" style:width="85%"></span>
		<span class="line" style:width="60%"></span>
		<div class="pills">
			<span class="pill"></span>
			<span class="pill"></span>
		</div>
		<p class="intent">{label}</p>
	</div>
</section>

<style>
	.skeleton {
		flex: 0 0 auto;
		width: 400px;
		max-width: 100%;
		background: var(--m-card);
		border-radius: var(--m-radius);
		box-shadow: var(--m-shadow);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 13px 16px;
		background: var(--m-header);
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 4px;
		background: var(--m-pill-hover);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 24px 28px 22px;
	}
	.line {
		height: 11px;
		border-radius: 6px;
		background: linear-gradient(90deg, var(--m-pill) 0%, var(--m-pill-hover) 50%, var(--m-pill) 100%);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}
	.line.title {
		width: 55%;
		height: 18px;
		margin-bottom: 4px;
	}
	.pills {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.pill {
		width: 96px;
		height: 34px;
		border-radius: var(--m-radius-sm);
		background: var(--m-pill);
	}
	.intent {
		margin: 8px 0 0;
		font-size: 12px;
		color: var(--m-faint);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: -100% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line {
			animation: none;
		}
	}
</style>
