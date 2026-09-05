// Local declarations for the vendored site-kit codemirror module (see VENDOR.md).
import type { Extension } from '@codemirror/state';
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export function autocomplete_for_svelte(
	selected: () => string | undefined,
	files: () => string[]
): Extension[];

export function completion_for_javascript(
	context: CompletionContext,
	selected: () => string | undefined,
	files: () => string[]
): CompletionResult | null;
