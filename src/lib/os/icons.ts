import type { Component } from 'svelte';
import AirplaneTilt from 'phosphor-svelte/lib/AirplaneTilt';
import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
import Bed from 'phosphor-svelte/lib/Bed';
import Bell from 'phosphor-svelte/lib/Bell';
import BookOpen from 'phosphor-svelte/lib/BookOpen';
import BookmarkSimple from 'phosphor-svelte/lib/BookmarkSimple';
import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
import Camera from 'phosphor-svelte/lib/Camera';
import Car from 'phosphor-svelte/lib/Car';
import ChatCircle from 'phosphor-svelte/lib/ChatCircle';
import Check from 'phosphor-svelte/lib/Check';
import Clock from 'phosphor-svelte/lib/Clock';
import Cloud from 'phosphor-svelte/lib/Cloud';
import Coffee from 'phosphor-svelte/lib/Coffee';
import CreditCard from 'phosphor-svelte/lib/CreditCard';
import Envelope from 'phosphor-svelte/lib/Envelope';
import File from 'phosphor-svelte/lib/File';
import ForkKnife from 'phosphor-svelte/lib/ForkKnife';
import Gift from 'phosphor-svelte/lib/Gift';
import Heart from 'phosphor-svelte/lib/Heart';
import Link from 'phosphor-svelte/lib/Link';
import ListBullets from 'phosphor-svelte/lib/ListBullets';
import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
import MapPin from 'phosphor-svelte/lib/MapPin';
import MapTrifold from 'phosphor-svelte/lib/MapTrifold';
import MusicNotes from 'phosphor-svelte/lib/MusicNotes';
import NavigationArrow from 'phosphor-svelte/lib/NavigationArrow';
import PaperPlaneTilt from 'phosphor-svelte/lib/PaperPlaneTilt';
import Phone from 'phosphor-svelte/lib/Phone';
import Play from 'phosphor-svelte/lib/Play';
import Plus from 'phosphor-svelte/lib/Plus';
import ShareNetwork from 'phosphor-svelte/lib/ShareNetwork';
import ShoppingBag from 'phosphor-svelte/lib/ShoppingBag';
import ShoppingCart from 'phosphor-svelte/lib/ShoppingCart';
import Sparkle from 'phosphor-svelte/lib/Sparkle';
import Star from 'phosphor-svelte/lib/Star';
import Sun from 'phosphor-svelte/lib/Sun';
import Ticket from 'phosphor-svelte/lib/Ticket';
import Train from 'phosphor-svelte/lib/Train';
import User from 'phosphor-svelte/lib/User';
import Users from 'phosphor-svelte/lib/Users';
import VideoCamera from 'phosphor-svelte/lib/VideoCamera';
import type { IconName } from './spec';

/** The spec's glyph names → Phosphor icons (Klementine's set). Exhaustive by type, so a new name can't be forgotten. */
export const ICON_COMPONENTS: Record<IconName, Component> = {
	generic: Sparkle,
	location: MapPin,
	navigate: NavigationArrow,
	map: MapTrifold,
	car: Car,
	train: Train,
	plane: AirplaneTilt,
	calendar: CalendarBlank,
	clock: Clock,
	bell: Bell,
	mail: Envelope,
	message: ChatCircle,
	phone: Phone,
	send: PaperPlaneTilt,
	share: ShareNetwork,
	user: User,
	users: Users,
	music: MusicNotes,
	play: Play,
	video: VideoCamera,
	camera: Camera,
	book: BookOpen,
	file: File,
	link: Link,
	search: MagnifyingGlass,
	list: ListBullets,
	bag: ShoppingBag,
	cart: ShoppingCart,
	card: CreditCard,
	gift: Gift,
	ticket: Ticket,
	coffee: Coffee,
	food: ForkKnife,
	bed: Bed,
	sun: Sun,
	cloud: Cloud,
	star: Star,
	heart: Heart,
	save: BookmarkSimple,
	check: Check,
	plus: Plus,
	arrow: ArrowRight
};
