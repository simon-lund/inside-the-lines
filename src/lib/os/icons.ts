import type { Component } from 'svelte';
import ArrowRight from '@lucide/svelte/icons/arrow-right';
import Bed from '@lucide/svelte/icons/bed';
import Bell from '@lucide/svelte/icons/bell';
import Book from '@lucide/svelte/icons/book';
import Bookmark from '@lucide/svelte/icons/bookmark';
import Calendar from '@lucide/svelte/icons/calendar';
import Camera from '@lucide/svelte/icons/camera';
import Car from '@lucide/svelte/icons/car';
import Check from '@lucide/svelte/icons/check';
import Clock from '@lucide/svelte/icons/clock';
import Cloud from '@lucide/svelte/icons/cloud';
import Coffee from '@lucide/svelte/icons/coffee';
import CreditCard from '@lucide/svelte/icons/credit-card';
import File from '@lucide/svelte/icons/file';
import Gift from '@lucide/svelte/icons/gift';
import Heart from '@lucide/svelte/icons/heart';
import Link from '@lucide/svelte/icons/link';
import List from '@lucide/svelte/icons/list';
import Mail from '@lucide/svelte/icons/mail';
import Map from '@lucide/svelte/icons/map';
import MapPin from '@lucide/svelte/icons/map-pin';
import MessageCircle from '@lucide/svelte/icons/message-circle';
import Music from '@lucide/svelte/icons/music';
import Navigation from '@lucide/svelte/icons/navigation';
import Phone from '@lucide/svelte/icons/phone';
import Plane from '@lucide/svelte/icons/plane';
import Play from '@lucide/svelte/icons/play';
import Plus from '@lucide/svelte/icons/plus';
import Search from '@lucide/svelte/icons/search';
import Send from '@lucide/svelte/icons/send';
import Share from '@lucide/svelte/icons/share-2';
import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Star from '@lucide/svelte/icons/star';
import Sun from '@lucide/svelte/icons/sun';
import Ticket from '@lucide/svelte/icons/ticket';
import TrainFront from '@lucide/svelte/icons/train-front';
import User from '@lucide/svelte/icons/user';
import Users from '@lucide/svelte/icons/users';
import Utensils from '@lucide/svelte/icons/utensils';
import Video from '@lucide/svelte/icons/video';
import type { IconName } from './spec';

/** The spec's glyph names → lucide components. Exhaustive by type, so a new name can't be forgotten. */
export const ICON_COMPONENTS: Record<IconName, Component> = {
	generic: Sparkles,
	location: MapPin,
	navigate: Navigation,
	map: Map,
	car: Car,
	train: TrainFront,
	plane: Plane,
	calendar: Calendar,
	clock: Clock,
	bell: Bell,
	mail: Mail,
	message: MessageCircle,
	phone: Phone,
	send: Send,
	share: Share,
	user: User,
	users: Users,
	music: Music,
	play: Play,
	video: Video,
	camera: Camera,
	book: Book,
	file: File,
	link: Link,
	search: Search,
	list: List,
	bag: ShoppingBag,
	cart: ShoppingCart,
	card: CreditCard,
	gift: Gift,
	ticket: Ticket,
	coffee: Coffee,
	food: Utensils,
	bed: Bed,
	sun: Sun,
	cloud: Cloud,
	star: Star,
	heart: Heart,
	save: Bookmark,
	check: Check,
	plus: Plus,
	arrow: ArrowRight
};
