# Svelte AI Studio

A minimal Google-AI-Studio-style playground: chat with Claude in the sidebar, and it writes a
complete single-file web app straight into the REPL on the right — **Code** tab (editable
CodeMirror editor) and **Preview** tab (sandboxed iframe).

## How it works

- `POST /api/chat` proxies the Anthropic API (Claude Opus 5, streaming, adaptive thinking,
  server-side refusal fallbacks, prompt caching) and re-emits the response as SSE.
- The model is instructed to answer with prose plus exactly one ` ```html ` fence containing a
  complete standalone document. The client parses the fence *while streaming*: prose goes to the
  chat, code types live into the editor, and on completion the preview (re)runs.
- The preview iframe runs with `sandbox="allow-scripts allow-forms allow-modals"` (no
  `allow-same-origin` → isolated origin). An injected reporter posts uncaught errors back to the
  studio, which offers a one-click **Fix with AI**.
- Manual edits in the Code tab auto-run the preview (debounced) and are sent to the model as
  `<current_code>` context on the next message.
- Generated apps get a built-in UI stack via CDN (taught to the model in the system prompt):
  Tailwind v4 (`@tailwindcss/browser@4`), Basecoat 1.0.2 (shadcn/ui as plain HTML —
  `class="btn" data-variant="…"` etc.), and lucide icons. Preview therefore needs internet.

## Setup

```bash
cp .env.example .env   # then put your key in it: ANTHROPIC_API_KEY=sk-ant-…
npm install
npm run dev
```
