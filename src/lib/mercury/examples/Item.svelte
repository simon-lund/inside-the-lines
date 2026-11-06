<script>
	import { Module, Action } from 'mercury';

	const sizes = [7, 8, 9, 10];
	let size = $state(8);
	let added = $state(false);

	function nextSize() {
		size = sizes[(sizes.indexOf(size) + 1) % sizes.length];
	}
</script>

<Module title="Black Knit Runner" source="Item from Northline" kind="shop">
	<p class="m-kicker">Atelier Nord</p>
	<h2 class="m-title">Black Knit Runner</h2>
	<p class="m-price">$295</p>

	<div class="my-6 flex justify-center">
		<svg viewBox="0 0 320 190" width="300" xmlns="http://www.w3.org/2000/svg" aria-label="Black sock sneaker with white sole">
			<path
				d="M18 148c8-16 40-24 74-26 34-2 60-8 92-4 30 4 64 12 98 14 18 2 26 10 26 20 0 12-12 18-32 20-42 4-100 8-160 8-46 0-86-6-96-14-6-6-6-12-2-18Z"
				fill="#f7f7f9"
				stroke="#141416"
				stroke-width="3"
			/>
			<path
				d="M142 24c22-14 48-14 66-2 12 8 14 24 10 46-4 20-2 36 10 48 12 12 34 18 62 22-34 6-76 8-118 6-44-2-88-2-118-6 22-14 38-32 48-54 10-20 16-42 24-52 5-6 10-8 16-8Z"
				fill="#141416"
			/>
			<path d="M200 60c-10 14-14 30-10 48" stroke="#2c2c30" stroke-width="3" fill="none" stroke-linecap="round" />
			<text x="206" y="128" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="700" fill="#fff" letter-spacing="1.2">NORD</text>
		</svg>
	</div>

	{#snippet actions()}
		<Action label="Select a size" onclick={nextSize}>
			<span class="ml-1 border-l border-black/10 pl-3 text-sm">{size}</span>
		</Action>
		<Action icon={added ? 'check' : 'bag'} label={added ? 'Added to bag' : 'Add to bag'} onclick={() => (added = true)} />
		<Action label="See Details" />
	{/snippet}
</Module>
