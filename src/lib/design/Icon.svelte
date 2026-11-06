<script>
	/**
	 * A glyph: any Phosphor icon component (import it from 'phosphor-svelte/lib/<Name>' and pass
	 * it in). Sized here, coloured by the text around it; `weight="fill"` for a mark.
	 * @type {{ kind: import('svelte').Component<any>, size?: number, weight?: 'regular' | 'bold' | 'fill' }}
	 */
	let { kind: Glyph, size = 16, weight = 'regular' } = $props();
</script>

<Glyph {size} {weight} aria-hidden="true" />
