import type { File } from '@sveltejs/repl/workspace';
import action from './src/Action.svelte?raw';
import actions from './src/Actions.svelte?raw';
import avatar from './src/Avatar.svelte?raw';
import bubble from './src/Bubble.svelte?raw';
import canvas from './src/Canvas.svelte?raw';
import divider from './src/Divider.svelte?raw';
import icon from './src/Icon.svelte?raw';
import index from './src/index.js?raw';
import listRow from './src/ListRow.svelte?raw';
import mapView from './src/MapView.svelte?raw';
import media from './src/Media.svelte?raw';
import module from './src/Module.svelte?raw';
import reply from './src/Reply.svelte?raw';

/** Workspace folder holding the design system — protected, hidden by default, importable as 'mercury'. */
export const FRAMEWORK_PREFIX = 'mercury/';
export const FRAMEWORK_ALIASES: Record<string, string> = { mercury: 'mercury' };

export function isFrameworkFile(name: string): boolean {
	return name.startsWith(FRAMEWORK_PREFIX);
}

export function makeFile(name: string, contents: string): File {
	return { type: 'file', name, basename: name.split('/').pop() ?? name, contents, text: true };
}

const SOURCES: Record<string, string> = {
	'index.js': index,
	'Canvas.svelte': canvas,
	'Module.svelte': module,
	'Action.svelte': action,
	'Actions.svelte': actions,
	'Avatar.svelte': avatar,
	'Bubble.svelte': bubble,
	'Divider.svelte': divider,
	'Reply.svelte': reply,
	'ListRow.svelte': listRow,
	'Media.svelte': media,
	'MapView.svelte': mapView,
	'Icon.svelte': icon
};

/** Fresh File objects each call — the workspace mutates the ones it holds. */
export function mercuryFiles(): File[] {
	return Object.entries(SOURCES).map(([name, contents]) => makeFile(FRAMEWORK_PREFIX + name, contents));
}
