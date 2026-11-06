<script>
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import Check from '@lucide/svelte/icons/check';
	import Command from '@lucide/svelte/icons/command';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Mic from '@lucide/svelte/icons/mic';
	import Music from '@lucide/svelte/icons/music';
	import Navigation from '@lucide/svelte/icons/navigation';
	import Play from '@lucide/svelte/icons/play';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	/**
	 * Glyphs come from lucide. `kind` is either a built-in name or any lucide
	 * component (import it from '@lucide/svelte/icons/<name>' and pass it in).
	 * @type {{ kind?: string | import('svelte').Component<any>, size?: number }}
	 */
	let { kind = 'generic', size = 14 } = $props();

	/** @type {Record<string, import('svelte').Component<any>>} */
	const LUCIDE = {
		location: MapPin,
		social: MessageCircle,
		music: Music,
		shop: ShoppingBag,
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
	const Glyph = $derived(typeof kind === 'string' ? (LUCIDE[kind] ?? Sparkles) : kind);
</script>

<Glyph {size} strokeWidth={2} aria-hidden="true" />
