<script>
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import Check from '@lucide/svelte/icons/check';
	import Command from '@lucide/svelte/icons/command';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Mic from '@lucide/svelte/icons/mic';
	import Navigation from '@lucide/svelte/icons/navigation';
	import Play from '@lucide/svelte/icons/play';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	/**
	 * Glyphs come from lucide. `kind` is either a built-in name or any lucide
	 * component (import it from '@lucide/svelte/icons/<name>' and pass it in).
	 * Brand marks (twitter, spotify, shop) are the only inline SVGs.
	 * @type {{ kind?: string | import('svelte').Component<any>, size?: number }}
	 */
	let { kind = 'generic', size = 14 } = $props();

	/** @type {Record<string, import('svelte').Component<any>>} */
	const LUCIDE = {
		location: MapPin,
		mic: Mic,
		command: Command,
		navigate: Navigation,
		bag: ShoppingBag,
		play: Play,
		save: Bookmark,
		check: Check,
		arrow: ArrowRight,
		generic: Sparkles
	};
	const BRANDS = ['twitter', 'spotify', 'shop'];

	const Glyph = $derived(
		typeof kind === 'string' ? (BRANDS.includes(kind) ? null : (LUCIDE[kind] ?? Sparkles)) : kind
	);
</script>

{#if Glyph}
	<Glyph {size} strokeWidth={2} aria-hidden="true" />
{:else if kind === 'twitter'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.8A11.7 11.7 0 0 1 3.4 4.7a4.1 4.1 0 0 0 1.3 5.5 4 4 0 0 1-1.9-.5v.1a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.8.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.5a11.7 11.7 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5A8.2 8.2 0 0 0 22 5.8Z"/></svg>
{:else if kind === 'spotify'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.6.6 0 0 1-.9.2c-2.4-1.5-5.4-1.8-9-1a.6.6 0 1 1-.3-1.2c3.9-.9 7.3-.5 10 1.1.3.2.4.6.2.9Zm1.2-2.7a.8.8 0 0 1-1.1.3c-2.7-1.7-6.9-2.2-10.1-1.2a.8.8 0 1 1-.5-1.5c3.7-1.1 8.3-.6 11.4 1.3.4.2.5.7.3 1.1Zm.1-2.8C14.6 9 9.2 8.8 6.1 9.7a.9.9 0 1 1-.6-1.8c3.6-1.1 9.5-.9 13.3 1.4a.9.9 0 0 1-1 1.6Z"/></svg>
{:else if kind === 'shop'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M9.2 15.3c.6.9 1.6 1.4 2.9 1.4 1.9 0 3.1-1 3.1-2.6 0-1.3-.8-2.1-2.6-2.5l-1-.3c-.9-.2-1.3-.6-1.3-1.1 0-.7.6-1.1 1.5-1.1.8 0 1.4.4 1.8 1l1.3-.9c-.6-1-1.7-1.6-3.1-1.6-1.8 0-3.1 1-3.1 2.6 0 1.3.8 2.1 2.5 2.5l1 .2c1 .3 1.4.6 1.4 1.2 0 .7-.6 1.1-1.6 1.1-1 0-1.7-.5-2.1-1.2l-1.4.8Z" fill="#fff"/></svg>
{/if}
