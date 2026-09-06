<script>
	/** Initials avatar; pass `src` for a real image. */
	/** @type {{ initials?: string, src?: string, size?: number, alt?: string }} */
	let { initials = '', src = '', size = 28, alt = '' } = $props();
</script>

{#if src}
	<img class="m-avatar" {src} {alt} style:width="{size}px" style:height="{size}px" />
{:else}
	<span class="m-avatar m-avatar-initials" style:width="{size}px" style:height="{size}px" style:font-size="{size * 0.38}px">
		{initials}
	</span>
{/if}

<style>
	.m-avatar {
		flex-shrink: 0;
		border-radius: 50%;
		object-fit: cover;
	}
	.m-avatar-initials {
		display: inline-grid;
		place-items: center;
		background: #2c2c30;
		color: #fff;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
