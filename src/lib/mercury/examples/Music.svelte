<script>
	import { Module, Media, Actions, Action, ListRow } from 'mercury';

	const tracks = ['Blue', 'Four Seasons'];
	/** @type {string | null} */
	let playing = $state(null);
	let saved = $state(false);
</script>

<Module title="Four Seasons" source="Music from Spotify" kind="spotify">
	<Media title="Four Seasons" subtitle="Single by Taeyeon">
		{#snippet art()}
			<svg viewBox="0 0 132 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<defs>
					<linearGradient id="fs-bg" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stop-color="#4a4a52" />
						<stop offset="1" stop-color="#17171a" />
					</linearGradient>
				</defs>
				<rect width="132" height="132" fill="url(#fs-bg)" />
				<path d="M22 132c4-32 24-48 46-48s40 16 44 48Z" fill="#cfcfd6" />
				<circle cx="70" cy="50" r="21" fill="#e6e6ea" />
				<path d="M48 44c4-20 38-22 44-4-6-8-16-10-24-6-9 4-14 4-20 10Z" fill="#26262b" />
				<path d="M44 52c-2 22 2 40 8 54h-6c-6-14-8-32-2-54Z" fill="#2e2e33" />
			</svg>
		{/snippet}
		<Actions>
			<Action
				icon="play"
				label={playing ? 'Pause' : 'Play'}
				onclick={() => (playing = playing ? null : tracks[0])}
			/>
			<Action icon={saved ? 'check' : 'save'} label={saved ? 'Saved' : 'Save'} onclick={() => (saved = true)} />
		</Actions>
	</Media>

	{#each tracks as track, i (track)}
		<ListRow
			index={i + 1}
			label={track}
			trailing={playing === track ? 'Playing' : ''}
			onclick={() => (playing = track)}
		/>
	{/each}
</Module>
