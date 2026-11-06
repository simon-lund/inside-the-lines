import item from './examples/Item.svelte?raw';
import music from './examples/Music.svelte?raw';
import conversation from './examples/Conversation.svelte?raw';
import place from './examples/Place.svelte?raw';

import type { ViewFile } from '$lib/types';
export type { ViewFile };

export interface SeedView {
	id: string;
	title: string;
	prompt: string;
	files: ViewFile[];
}

const MODULES: Record<string, { component: string; source: string }> = {
	Place: { component: place, source: 'Kettle & Kite — a café, with directions and details' },
	Conversation: { component: conversation, source: 'a conversation with Mara Lindqvist' },
	Music: { component: music, source: 'Low Tide, a single by Juno Vale' },
	Item: { component: item, source: 'the Black Knit Runner sneaker from Atelier Nord' }
};

function singleApp(name: string): string {
	return `<script>
	import { Canvas } from 'mercury';
	import ${name} from './lib/${name}.svelte';
</script>

<Canvas>
	<${name} />
</Canvas>
`;
}

function single(id: string, name: string, title: string): SeedView {
	return {
		id,
		title,
		prompt: `Show me ${MODULES[name].source}`,
		files: [
			{ name: 'App.svelte', contents: singleApp(name) },
			{ name: `lib/${name}.svelte`, contents: MODULES[name].component }
		]
	};
}

const canvasApp = `<script>
	import { Canvas } from 'mercury';
	import Place from './lib/Place.svelte';
	import Conversation from './lib/Conversation.svelte';
	import Music from './lib/Music.svelte';
	import Item from './lib/Item.svelte';
</script>

<Canvas>
	<Place />
	<Conversation />
	<Music />
	<Item />
</Canvas>
`;

/** Reference modules (after Mercury OS's originals, with made-up content), seeded into the library on first run. */
export const SEED_VIEWS: SeedView[] = [
	{
		id: 'module-canvas',
		title: 'Canvas — all four modules',
		prompt: 'Assemble a canvas with a place, a conversation, a song and a product',
		files: [
			{ name: 'App.svelte', contents: canvasApp },
			...Object.entries(MODULES).map(([name, m]) => ({ name: `lib/${name}.svelte`, contents: m.component }))
		]
	},
	single('kettle-and-kite', 'Place', 'Kettle & Kite — Location'),
	single('mara-conversation', 'Conversation', 'Mara Lindqvist — Conversation'),
	single('low-tide', 'Music', 'Low Tide — Music'),
	single('black-knit-runner', 'Item', 'Black Knit Runner — Item from Northline')
];
