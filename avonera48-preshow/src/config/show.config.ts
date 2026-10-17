// Single source of truth untuk semua teks & data show.
// Ganti nilai di sini lalu render ulang (`npm run render:all`).
// File ini sengaja tanpa import supaya bisa dibaca langsung oleh script Node (scripts/*.mjs).

export type GreetingSetting = 'auto' | 'pagi' | 'siang' | 'sore' | 'malam';
export type RuleIcon = 'no-record' | 'chat' | 'no-spam' | 'wifi';
export type SocialPlatform = 'instagram' | 'x' | 'tiktok' | 'youtube' | 'web';

export type ShowConfig = {
	readonly brandName: string;
	readonly colors: {
		readonly bg: string;
		readonly surface: string;
		readonly primary: string;
		readonly accent: string;
		readonly text: string;
		readonly muted: string;
	};
	readonly show: {
		/** Format YYYY-MM-DD */
		readonly date: string;
		/** Format HH:mm (24 jam) */
		readonly time: string;
		readonly timezone: string;
		readonly venue: string;
		readonly greeting: GreetingSetting;
	};
	readonly rules: ReadonlyArray<{readonly icon: RuleIcon; readonly text: string}>;
	readonly sponsors: ReadonlyArray<{readonly name: string; readonly logo: string}>;
	readonly socials: ReadonlyArray<{
		readonly platform: SocialPlatform;
		readonly handle: string;
		readonly url: string;
	}>;
	readonly streamUrl: string;
	readonly ticker: ReadonlyArray<string>;
};

export const showConfig = {
	brandName: 'Avonera48', // hanya dipakai sebagai teks di ticker/VO, BUKAN logo
	colors: {
		bg: '#07060B',
		surface: '#14111C',
		primary: '#E8457A', // TODO: warna brand asli
		accent: '#F6C453', // TODO: warna brand asli
		text: '#F5F3FA',
		muted: '#9A93AD',
	},
	show: {
		date: '2026-10-18',
		time: '14:00', // bebas: siang / sore / malam
		timezone: 'WIB',
		venue: 'JKT48 Theater, fX Sudirman', // TODO: konfirmasi venue
		greeting: 'auto', // "auto" | "pagi" | "siang" | "sore" | "malam"
	},
	rules: [
		{icon: 'no-record', text: 'Dilarang merekam / restream tayangan'},
		{icon: 'chat', text: 'Jaga chat tetap sopan & positif'},
		{icon: 'no-spam', text: 'Tidak spam, tidak promosi'},
		{icon: 'wifi', text: 'Gunakan koneksi stabil untuk kualitas terbaik'},
	],
	sponsors: [
		// { name: "Partner", logo: "sponsors/partner.svg" },
	],
	socials: [
		// { platform: "instagram", handle: "@avonera48", url: "https://..." },
	],
	streamUrl: 'https://<<domain>>', // TODO: URL stream untuk QR
	ticker: [
		'Selamat datang — show akan segera dimulai',
		'Stay tuned & siapkan dirimu!',
		'Dilarang merekam & menyebarkan ulang tayangan',
	],
} as const satisfies ShowConfig;
