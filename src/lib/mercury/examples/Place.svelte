<script>
	import { Module, Action, MapView } from 'mercury';
</script>

<Module title="Kettle & Kite" source="Location" kind="location">
	<MapView label="Kettle & Kite" sublabel="Small-batch coffee on a sunny corner" />
	<h2 class="m-title">Kettle & Kite</h2>
	<p class="m-text">Small-batch coffee on a sunny corner.</p>
	<p class="m-meta">418 Wren Street
San Mateo, CA 94401</p>

	{#snippet actions()}
		<Action icon="navigate" label="Get directions" sublabel="Requires your location" />
		<Action label="See details" />
		<Action label="Find more cafés nearby" />
	{/snippet}
</Module>
