<script>
	import { Module, Action, MapView } from 'mercury';
</script>

<Module title="Philz Coffee" source="Location" kind="location">
	<MapView label="Philz Coffee" sublabel="Custom-blended java in a casual setting" />
	<h2 class="m-title">Philz Coffee</h2>
	<p class="m-text">Custom-blended java in a casual setting.</p>
	<p class="m-meta">20686 Stevens Creek Blvd
Cupertino, CA 95014</p>

	{#snippet actions()}
		<Action icon="navigate" label="Get directions" sublabel="Requires your location" />
		<Action label="See details" />
		<Action label="Find more cafés nearby" />
	{/snippet}
</Module>
