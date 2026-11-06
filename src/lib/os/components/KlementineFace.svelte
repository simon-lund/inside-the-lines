<script lang="ts">
	import { onMount } from 'svelte';
	import { FACE_LOOKS, FACE_PATHS, FACE_VIEWBOX, type FaceLook } from '$lib/os/face-paths';

	/**
	 * Klementine's face on her clementine disc, looking at the pointer. One of her five looks
	 * (idle, listening, working, needs you, done); a change of look cross-fades. The gaze follows
	 * the companion rig (klementine/packages/companion): the target is the pointer's offset over
	 * 260px, the eyes lag it on a first-order filter (70ms) and the head tilts after them, later and
	 * less (140ms, 4° per unit). Under reduced motion she looks straight ahead.
	 */
	let { look = 'idle', size = 36 }: { look?: FaceLook; size?: number } = $props();

	// The companion's constants; the gaze is scaled up from the rig's 4 units, because at the size
	// of an icon the face moves as a whole inside its disc.
	const RANGE_PX = 260;
	const TRACK_MS = 70;
	const HEAD_LAG_MS = 140;
	const HEAD_TILT_DEG = 4;
	const GAZE_UNITS = 14;

	let disc = $state<HTMLSpanElement | null>(null);
	let gaze = $state({ x: 0, y: 0 });
	let tilt = $state(0);

	const clamp = (v: number) => Math.max(-1, Math.min(1, v));
	// A first-order lag: the share of the way covered in `dt`, the same at any frame rate.
	const step = (dt: number, ms: number) => 1 - Math.exp(-dt / ms);

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let target = { x: 0, y: 0 };
		let frame = 0;
		let last = 0;

		// Runs only while she is still turning; settles to rest instead of ticking forever.
		const tick = (now: number) => {
			const dt = last ? Math.min(now - last, 64) : 16;
			last = now;
			const k = step(dt, TRACK_MS);
			gaze = { x: gaze.x + (target.x - gaze.x) * k, y: gaze.y + (target.y - gaze.y) * k };
			tilt += (gaze.x * HEAD_TILT_DEG - tilt) * step(dt, HEAD_LAG_MS);
			const moving = Math.abs(target.x - gaze.x) + Math.abs(target.y - gaze.y) + Math.abs(gaze.x * HEAD_TILT_DEG - tilt) > 0.002;
			frame = moving ? requestAnimationFrame(tick) : 0;
			if (!moving) last = 0;
		};
		const wake = () => {
			if (!frame) frame = requestAnimationFrame(tick);
		};
		const onMove = (e: PointerEvent) => {
			if (!disc) return;
			const r = disc.getBoundingClientRect();
			target = {
				x: clamp((e.clientX - (r.left + r.width / 2)) / RANGE_PX),
				y: clamp((e.clientY - (r.top + r.height / 2)) / RANGE_PX)
			};
			wake();
		};
		// The pointer left the window: she looks back to you.
		const onLeave = () => {
			target = { x: 0, y: 0 };
			wake();
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		document.documentElement.addEventListener('pointerleave', onLeave);
		return () => {
			window.removeEventListener('pointermove', onMove);
			document.documentElement.removeEventListener('pointerleave', onLeave);
			cancelAnimationFrame(frame);
		};
	});
</script>

<span class="disc" bind:this={disc} style:--size="{size}px" role="img" aria-label="Klementine">
	<svg viewBox={FACE_VIEWBOX} data-look={look} aria-hidden="true">
		<g transform="translate({gaze.x * GAZE_UNITS} {gaze.y * GAZE_UNITS}) rotate({tilt} 200 205)">
			{#each FACE_LOOKS as each (each)}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own constant drawings (face-paths.ts), never input -->
				<g class="pose" data-pose={each} fill="currentColor">{@html FACE_PATHS[each]}</g>
			{/each}
		</g>
	</svg>
</span>

<style>
	/* Her disc: the clementine, with her ink on it, the same in both themes. */
	.disc {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--m-clementine);
		color: var(--m-on-clementine);
	}
	svg {
		display: block;
		width: 74%;
		overflow: visible;
		transform-origin: 50% 50%;
		transition: transform var(--m-dur-base) var(--m-ease-settle);
	}
	/* Listening: her whole face tilts a little toward you. */
	svg[data-look='listening'] {
		transform: rotate(-6deg);
	}
	.pose {
		opacity: 0;
		transition: opacity 180ms var(--m-ease-settle);
	}
	[data-look='idle'] .pose[data-pose='idle'],
	[data-look='listening'] .pose[data-pose='listening'],
	[data-look='working'] .pose[data-pose='working'],
	[data-look='needs'] .pose[data-pose='needs'],
	[data-look='done'] .pose[data-pose='done'] {
		opacity: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		svg,
		.pose {
			transition: none;
		}
	}
</style>
