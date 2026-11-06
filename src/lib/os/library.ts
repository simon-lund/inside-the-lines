import type { SectionSpec } from './spec';

/**
 * The Library: one hand-written example per kind of section the model can build,
 * together covering every block type. Rendered by the same renderer as the pages, so
 * it shows exactly what the model is allowed to use. All people, places and products
 * are made up.
 */
export const LIBRARY: SectionSpec[] = [
	{
		id: 'stay',
		title: 'Casa Miradouro',
		kicker: 'Boutique guesthouse · Alfama',
		blocks: [
			{
				type: 'map',
				places: [
					{ label: 'Casa Miradouro', sublabel: 'Your stay' },
					{ label: 'Taberna do Cais', sublabel: 'Lunch, Sat' },
					{ label: 'Casa da Saudade', sublabel: 'Fado, Sat 9 PM' }
				]
			},
			{ type: 'text', text: 'Twelve rooms in a restored townhouse, with a rooftop terrace over the river.' },
			{ type: 'meta', text: 'Rua das Escolas Gerais 41\nCheck-in Fri, Nov 13 · 3:00 PM · 2 nights' }
		],
		actions: [
			{ label: 'Book this room', sublabel: 'Free cancellation until Nov 11', icon: 'bed', primary: true, effect: 'confirm', done: 'Booked' },
			{ label: 'Get directions', icon: 'navigate', effect: 'open', intent: 'Directions from Lisbon airport to Casa Miradouro' }
		]
	},
	{
		id: 'day-plan',
		title: 'Saturday in Alfama',
		kicker: 'Sat, Nov 14 · About 6 km on foot',
		blocks: [
			{
				type: 'list',
				numbered: true,
				rows: [
					{ label: 'Pastelaria Dona Luz', sub: 'Custard tarts and coffee', trailing: '9:30 AM' },
					{ label: 'Castle viewpoint walk', sub: 'Up through the old lanes', trailing: '11:00 AM' },
					{ label: 'Taberna do Cais', sub: 'Grilled sardines by the river', trailing: '1:30 PM' },
					{ label: 'Casa da Saudade', sub: 'Fado and dinner', trailing: '9:00 PM' }
				]
			}
		],
		actions: [
			{ label: 'Reserve fado dinner', sublabel: 'Table for 2 · 9:00 PM', icon: 'ticket', primary: true, effect: 'open', intent: 'Table reservation at Casa da Saudade, Saturday 9 PM, for two' },
			{ label: 'Add to calendar', icon: 'calendar', effect: 'confirm', done: 'Added to calendar' }
		]
	},
	{
		id: 'compare',
		title: 'Gift ideas for Dana',
		kicker: 'For a runner · under $100',
		blocks: [
			{
				type: 'table',
				columns: ['Gift', 'Price', 'Why'],
				rows: [
					['Halden Trail Vest 8L', '$89', 'Her old vest is falling apart'],
					['Brightside Headlamp', '$42', 'Dark winter morning runs'],
					['Merino trail socks, 3 pairs', '$36', 'Always welcome']
				],
				pick: 0
			}
		],
		actions: [
			{ label: 'Show more options', icon: 'search', effect: 'open', intent: 'Three more running gifts under $100 from made-up shops' }
		]
	},
	{
		id: 'product',
		title: 'Halden Trail Vest 8L',
		kicker: 'Fieldnote Outfitters',
		blocks: [
			{ type: 'art', art: { kind: 'product', tone: 'green' } },
			{ type: 'price', text: '$89' },
			{ type: 'text', text: 'A light hydration vest with two soft flasks and a phone pocket that does not bounce.' }
		],
		actions: [
			{ label: 'Buy as a gift', sublabel: 'Arrives before Nov 14', icon: 'gift', primary: true, effect: 'confirm', done: 'Ordered' },
			{ label: 'Save for later', icon: 'save', effect: 'confirm', done: 'Saved' }
		]
	},
	{
		id: 'costs',
		title: 'What it costs',
		kicker: 'Two people · Nov 13–15',
		blocks: [
			{
				type: 'summary',
				rows: [
					{ label: 'Flights, round trip', value: '$598' },
					{ label: 'Casa Miradouro, 2 nights', value: '$342' },
					{ label: 'Food and fado', value: '≈ $180' }
				],
				total: { label: 'Total', value: '≈ $1,120' }
			}
		],
		actions: [{ label: 'Send to Mara', icon: 'send', effect: 'confirm', done: 'Sent to Mara' }]
	},
	{
		id: 'packing',
		title: 'Pack for Lisbon',
		kicker: 'Mild and dry, 64°F',
		blocks: [
			{
				type: 'checklist',
				items: ['Passport', 'Walking shoes for the hills', 'Light jacket for the evenings', 'Power adapter (type F)', 'Cash for the fado house']
			}
		],
		actions: []
	},
	{
		id: 'song',
		title: 'For the flight',
		kicker: 'Music',
		blocks: [
			{
				type: 'media',
				title: 'Low Tide',
				subtitle: 'Single by Juno Vale · 3:41',
				art: { kind: 'album', tone: 'cool' },
				actions: [
					{ label: 'Play', icon: 'play', primary: true, effect: 'confirm', done: 'Playing' },
					{ label: 'Save', icon: 'save', effect: 'confirm', done: 'Saved' }
				]
			}
		],
		actions: []
	}
];
