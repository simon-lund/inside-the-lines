<script>
	/** Reply bar: a text field plus a Send pill. Calls `onsend(text)` and clears. */
	/** @type {{ placeholder?: string, onsend?: (text: string) => void }} */
	let { placeholder = 'Reply…', onsend } = $props();
	let value = $state('');

	function send() {
		const text = value.trim();
		if (!text) return;
		onsend?.(text);
		value = '';
	}
</script>

<form class="m-reply" onsubmit={(e) => { e.preventDefault(); send(); }}>
	<input class="m-reply-input" bind:value {placeholder} />
	<button type="submit" class="m-reply-send" disabled={!value.trim()}>Send</button>
</form>

<style>
	.m-reply {
		display: flex;
		gap: 8px;
		margin: 8px -28px -8px;
		padding: 14px 28px;
		background: var(--m-header);
	}
	.m-reply-input {
		flex: 1;
		border: none;
		border-radius: var(--m-radius-sm);
		background: #e9e9ee;
		padding: 10px 14px;
		font: inherit;
		font-size: 13px;
		color: var(--m-text);
	}
	.m-reply-input::placeholder {
		color: var(--m-faint);
	}
	.m-reply-input:focus {
		outline: 2px solid #c9c9d2;
	}
	.m-reply-send {
		border: none;
		border-radius: var(--m-radius-sm);
		background: #fff;
		padding: 0 16px;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: var(--m-text);
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}
	.m-reply-send:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
