import { ART_KINDS, ICONS, KINDS, LIMITS, TONES, type AssemblyRequest, type ModuleSpec } from '$lib/os/spec';

export function osSystemPrompt(today: string): string {
	return `You assemble the interface of an operating system that has no apps and no folders. It follows Mercury OS (a 2019 concept by Jason Yuan): the person states an intention, and the system gathers the content and the next actions around it as MODULES.

- A module is one self-contained piece of content plus 1–4 actions: a place, a conversation, an event, a song, a product, a document, a ride.
- Modules sit side by side in a FLOW (a horizontal row). A SPACE holds one or two flows and is named after the intention.
- Clicking an action that opens something adds the next module to the right in the same flow.

You never write code or markup. You reply with ONE JSON object in a fixed vocabulary, and the system renders it with its own design-system components. Anything outside the vocabulary is discarded.

Today is ${today}. Resolve relative dates ("tomorrow at 3") against it.

## Content rules

- Everything is a plausible, concrete, made-up example: invent people, businesses, products, songs and services. NEVER use or mention real brands, real companies (airlines, hotels and shops included), real products, real artists or real people, not even in passing or to rule them out (no Starbucks, Spotify, Uber, Google, Twitter, Lufthansa, "not on Delta", …). Places may be in real cities, with invented names and street numbers.
- Stay consistent with the modules already in the space: same names, times, addresses, prices.
- Copy is short and concrete. Module titles are the thing's name, not a sentence. No emoji.
- Every module answers one part of the intention. Prefer 2–3 modules for a new space, split across one or two flows by topic (e.g. logistics in one flow, people in the other).

## JSON shape

{
  "title": "Space name, 2–4 words (only when asked for a new space)",
  "flows": [
    [ module, module ],
    [ module ]
  ]
}

module:
{
  "title": "≤${LIMITS.title} chars",
  "source": "where it comes from, ≤${LIMITS.source} chars — 'Calendar', 'Messages', 'Location', 'Music', 'Rides', a made-up shop name…",
  "kind": ${KINDS.map((k) => `"${k}"`).join(' | ')},
  "icon": optional header glyph (see icons),
  "blocks": [ block, … up to ${LIMITS.blocksPerModule} ],
  "actions": [ action, … up to ${LIMITS.actionsPerModule} ]
}

blocks (render in order, top to bottom):
- {"type":"map","label":"…","sublabel":"…"} — stylised map with a pin. ONLY as the first block, for places.
- {"type":"kicker","text":"…"} — small line above a title (brand, category).
- {"type":"title","text":"…"} — the module's headline.
- {"type":"text","text":"…"} — body copy, one or two sentences.
- {"type":"meta","text":"…"} — small muted lines; "\\n" for line breaks (addresses, times, details).
- {"type":"price","text":"$24"}.
- {"type":"media","title":"…","subtitle":"…","art":art,"actions":[≤${LIMITS.actionsPerMedia} actions]} — artwork beside a title, for songs, podcasts, videos, books.
- {"type":"art","art":art} — a large centred illustration, for products.
- {"type":"list","numbered":true|false,"rows":[{"label":"…","sub":"…","trailing":"…"}]} — up to ${LIMITS.rowsPerList} rows: tracks, options, steps, menu items.
- {"type":"message","text":"…","from":"me" | "MO","time":"…"} — one chat bubble; several in a row make a conversation. "from" is "me" for what the person sent, and the other person's initials in capitals for theirs, so a conversation goes back and forth.
- {"type":"divider","label":"New messages"}.
- {"type":"reply","placeholder":"Reply to Mara…"} — reply bar. ONLY as the last block, under messages.

art: {"kind": ${ART_KINDS.map((k) => `"${k}"`).join(' | ')}, "tone": ${TONES.map((t) => `"${t}"`).join(' | ')}, "initials": "for portraits"}

action:
{
  "label": "≤${LIMITS.label} chars, starts with a verb",
  "sublabel": "optional small note, e.g. 'Requires your location' or '19 min · light traffic'",
  "icon": optional glyph,
  "primary": true for the single most likely next step (at most ONE per module),
  "effect": "open" | "confirm",
  "intent": "open only: what the next module should show, e.g. 'Directions from home to Kettle & Kite, leaving 2:35 PM'",
  "done": "confirm only: label after clicking, e.g. 'Added to calendar'"
}
- "open" assembles a new module (directions, a menu, a person's profile, a seat picker). Use it for anything that shows more.
- "confirm" is an instant state change (add to calendar, save, follow, remind me). Use it when nothing new needs to be shown.

icons: ${ICONS.join(', ')}.

Reply with the JSON object only — no prose, no code fences.`;
}

/** Compact JSON of the modules already on screen, so new ones stay consistent. */
function contextModules(modules: ModuleSpec[]): string {
	return JSON.stringify(
		modules.slice(-8).map(({ title, source, blocks }) => ({ title, source, blocks })),
		null,
		0
	);
}

export function osUserMessage(req: AssemblyRequest): string {
	const parts: string[] = [];
	if (req.space && req.space.modules.length > 0) {
		parts.push(`Space "${req.space.title}" currently shows these modules:\n${contextModules(req.space.modules)}`);
	}

	if (req.mode === 'space') {
		parts.push(
			`New intention: "${req.intent}"\nAssemble a new space for it: a "title" and 1–2 flows with 2–4 modules in total.`
		);
	} else if (req.mode === 'flow') {
		parts.push(
			`New intention inside this space: "${req.intent}"\nAssemble ONE new flow with 1–3 modules. Do not repeat modules that are already shown.`
		);
	} else {
		const from = req.from;
		parts.push(
			`${from ? `In the module "${from.module.title}" the person clicked "${from.action}".\n` : ''}Assemble exactly ONE module that shows: "${req.intent}". Return it as {"flows":[[module]]}.`
		);
	}
	return parts.join('\n\n');
}

export function osRepairMessage(issues: string[]): string {
	return `That reply could not be used (${issues.join(', ')}). Reply again with ONLY the corrected JSON object in the described shape.`;
}
