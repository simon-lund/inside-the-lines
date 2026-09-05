Vendored from https://github.com/sveltejs/svelte.dev packages/repl
commit 3817d6ed3ad5cadfc3f50224459424225b791cb4 (2026-09-05), MIT.

Local changes:
- package.json: removed scripts, devDependencies, files, and the workspace-protocol deps @sveltejs/site-kit + icons.
- src/lib/vendored-site-kit/: copied site-kit codemirror + polyfills modules (same repo/commit).
- Workspace.svelte.ts + workers/*/index.ts: site-kit imports point at the vendored copies.
- Editor/codemirror.css: fold/close icon url(icons/…) refs inlined as data URIs (icons pkg not vendored).
