import item from './examples/Item.svelte?raw';
import music from './examples/Music.svelte?raw';
import philz from './examples/Philz.svelte?raw';
import twitter from './examples/Twitter.svelte?raw';

import type { ViewFile } from '$lib/types';
export type { ViewFile };

export interface SeedView {
	id: string;
	title: string;
	prompt: string;
	files: ViewFile[];
}

const MODULES: Record<string, { component: string; source: string }> = {
	Philz: { component: philz, source: 'Philz Coffee — a place, with directions and details' },
	Twitter: { component: twitter, source: 'a Twitter conversation with Danny Trinh' },
	Music: { component: music, source: 'Four Seasons by Taeyeon on Spotify' },
	Item: { component: item, source: 'Balenciaga Speed sneakers from SSENSE' }
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
	import Philz from './lib/Philz.svelte';
	import Twitter from './lib/Twitter.svelte';
	import Music from './lib/Music.svelte';
	import Item from './lib/Item.svelte';
</script>

<Canvas>
	<Philz />
	<Twitter />
	<Music />
	<Item />
</Canvas>
`;

/** The Mercury reference examples, seeded into the library on first run. */
export const SEED_VIEWS: SeedView[] = [
	{
		id: 'mercury-canvas',
		title: 'Mercury canvas — all four modules',
		prompt: 'Assemble a canvas with a place, a conversation, a song and a product',
		files: [
			{ name: 'App.svelte', contents: canvasApp },
			...Object.entries(MODULES).map(([name, m]) => ({ name: `lib/${name}.svelte`, contents: m.component }))
		]
	},
	single('philz-coffee', 'Philz', 'Philz Coffee — Location'),
	single('twitter-conversation', 'Twitter', 'Danny Trinh — Twitter Conversation'),
	single('four-seasons', 'Music', 'Four Seasons — Music from Spotify'),
	single('balenciaga-sneakers', 'Item', 'Black Bonded Speed Sneakers — Item from SSENSE')
];
