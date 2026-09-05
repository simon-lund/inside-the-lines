# Svelte AI Studio

A Google-AI-Studio-style playground: chat with Claude in the sidebar, and it writes a **real
multi-file Svelte 5 app** into the REPL on the right — **Code** tab (multi-file editor) and
**Preview** tab (the app compiled and running in the browser).

## How it works

- The right side runs the **Svelte playground infrastructure** (vendored `@sveltejs/repl` from
  the [sveltejs/svelte.dev](https://github.com/sveltejs/svelte.dev) monorepo, see
  `vendor/repl/VENDOR.md`): `svelte.compile()` + Rollup + Tailwind in a web worker, npm imports
  resolved at bundle time (bits-ui works), preview in a sandboxed iframe with a virtual console.
- `POST /api/chat` proxies the Anthropic API (Claude Opus 5, streaming, adaptive thinking,
  server-side refusal fallbacks, prompt caching) and re-emits the response as SSE.
- The model answers with prose plus one fenced block per file
  (` ```svelte file=App.svelte `). The client parses the fences *while streaming*: prose goes to
  the chat, files type live into the editor, and on completion the app re-bundles and the view
  switches to Preview. Files the model omits are deleted (it must always emit the full set).
- Manual edits re-bundle automatically and are sent to the model as `<current_code>` context on
  the next message. Bundle/runtime errors surface as a toast with one-click **Fix with AI**.

### Gotcha discovered the hard way

`Bundler.bundle()` creates `$effect.root`s. Calling it during component init (e.g. from a
constructor running in a component's script) silently kills the page's entire reactivity after
first paint. It must be called post-mount — see `Studio.init()`.

## Setup

```bash
cp .env.example .env   # then put your key in it: ANTHROPIC_API_KEY=sk-ant-…
npm install
npm run dev
```

The preview needs internet (the bundler worker downloads Svelte, Tailwind, and npm packages
from CDNs at runtime).
