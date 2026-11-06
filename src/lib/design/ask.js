/**
 * Asks for more from inside a generated page: the host (the app around the REPL) hears it
 * and builds what was asked, on the same page. A no-op outside the REPL's iframe.
 * @param {string} intent what to show, in the person's words ("Seat picker for the Friday flight")
 * @param {string} [label] the label of the control that asked (for context)
 */
export function ask(intent, label = '') {
	if (typeof window === 'undefined' || window.parent === window) return;
	window.parent.postMessage({ type: 'inside-the-lines:ask', intent, label }, '*');
}
