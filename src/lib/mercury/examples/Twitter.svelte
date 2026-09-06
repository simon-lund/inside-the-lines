<script>
	import { Module, Bubble, Divider, Reply } from 'mercury';

	let messages = $state([
		{
			text: 'Let me get back to you on that. My schedule is kinda crazy right now with Mercury.',
			time: 'Mon 11:25 PM',
			outgoing: true
		},
		{ divider: 'New messages' },
		{ text: 'Haha. Oh man' },
		{ text: "I'm excited to see this beast", avatar: 'DT', time: 'Mon 11:50 PM' }
	]);

	/** @param {string} text */
	function send(text) {
		messages.push({ text, outgoing: true, time: 'Just now' });
	}
</script>

<Module title="Danny Trinh @dtrinh" source="Twitter Conversation" kind="twitter">
	{#each messages as message, i (i)}
		{#if message.divider}
			<Divider label={message.divider} />
		{:else}
			<Bubble
				text={message.text}
				time={message.time}
				avatar={message.avatar}
				outgoing={message.outgoing}
			/>
		{/if}
	{/each}
	<Reply onsend={send} />
</Module>
