import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// The vendored @sveltejs/repl is linked source (vendor/repl) — serve it
	// unbundled so its `new Worker(new URL(...))` workers resolve correctly.
	optimizeDeps: { exclude: ['@sveltejs/repl'] },
	server: { fs: { allow: ['vendor/repl'] } },
	plugins: [
		tailwindcss(),
		sveltekit({
			// Resolve the repl subpaths straight into vendor/ (not through the
			// node_modules symlink) so TS and Vite agree on one module identity.
			alias: {
				// Host-side mirror of the REPL's 'mercury' alias so the design-system
				// sources and examples type-check as real Svelte files.
				mercury: 'src/lib/mercury/src',
				'@sveltejs/repl/bundler': 'vendor/repl/src/lib/Bundler.svelte.ts',
				'@sveltejs/repl/workspace': 'vendor/repl/src/lib/Workspace.svelte.ts',
				'@sveltejs/repl/editor': 'vendor/repl/src/lib/Editor/Editor.svelte',
				'@sveltejs/repl/viewer': 'vendor/repl/src/lib/Output/Viewer.svelte'
			},
			compilerOptions: {
				// Force runes mode for the project, except for libraries (node_modules
				// and the vendored repl, which contains some legacy-syntax components).
				runes: ({ filename }) => {
					const parts = filename.split(/[/\\]/);

					return parts.includes('node_modules') || parts.includes('vendor') ? undefined : true;
				}
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
