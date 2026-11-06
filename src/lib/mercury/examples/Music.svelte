<script>
	import { Module, Media, Actions, Action, ListRow, Art } from 'mercury';

	const tracks = ['Harbor Lights', 'Low Tide'];
	/** @type {string | null} */
	let playing = $state(null);
	let saved = $state(false);
</script>

<Module title="Low Tide" source="Music" kind="music">
	<Media title="Low Tide" subtitle="Single by Juno Vale">
		{#snippet art()}
			<Art kind="album" tone="cool" />
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
