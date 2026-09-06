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
- The studio shell itself is built on **Tailwind v4 + shadcn-svelte** (`vega` preset, zinc base,
  blue accent, Inter; components in `src/lib/components/ui`). The vendored editor/viewer are
  themed through a `--sk-*`/`--shiki-*` → shadcn-token bridge at the bottom of `src/app.css`.
  The Viewer's built-in console pane is disabled (it receives an `onLog` callback).

### Gotcha discovered the hard way

`Bundler.bundle()` creates `$effect.root`s. Calling it during component init (e.g. from a
constructor running in a component's script) silently kills the page's entire reactivity after
first paint. It must be called post-mount — see `Studio.init()`.

## Mercury: views, not apps

The studio's purpose: *"No apps or folders. Mercury fluidly assembles content and actions based
on your intentions."* Two layers make that concrete:

- **The Mercury design system** (`src/lib/mercury/src`, seeded into every REPL workspace as a
  protected `mercury/` folder, imported as `'mercury'`): `Canvas`, `Module` (source header,
  body, action row, "⌘ More actions"), `Action(s)`, `Bubble`/`Divider`/`Reply`, `ListRow`,
  `Media`, `MapView`, `Avatar`, `Icon` (lucide glyphs; any lucide or phosphor-svelte component can
  be passed as `icon`). The system prompt teaches the model this vocabulary, so every assembled
  view speaks one language. The folder is hidden in the editor behind the `mercury/` toggle.
- **The library** (`./library/*.json`, `/api/library`): save the current view under a name, load
  it back later (framework files are re-seeded), delete it. Seeded on first run with the four
  reference modules (Philz Coffee, a Twitter conversation, Four Seasons, Balenciaga sneakers)
  and a canvas combining them — see `src/lib/mercury/examples`.

## Setup

```bash
cp .env.example .env   # then put your key in it: ANTHROPIC_API_KEY=sk-ant-…
npm install
npm run dev
```

The preview needs internet (the bundler worker downloads Svelte, Tailwind, and npm packages
from CDNs at runtime).
