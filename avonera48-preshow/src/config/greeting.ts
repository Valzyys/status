// Sapaan otomatis dari jam show + format tanggal Indonesia.
// Tanpa import supaya bisa dipakai juga oleh script Node (gen-vo).

export type Greeting = 'pagi' | 'siang' | 'sore' | 'malam';

const parseMinutes = (time: string): number => {
	const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
	if (!match) {
		throw new Error(`show.time harus berformat HH:mm, dapat "${time}"`);
	}
	const h = Number(match[1]);
	const m = Number(match[2]);
	if (h > 23 || m > 59) {
		throw new Error(`show.time tidak valid: "${time}"`);
	}
	return h * 60 + m;
};

/**
 * 04:00–10:59 pagi · 11:00–14:59 siang · 15:00–17:59 sore · 18:00–03:59 malam
 */
export const greetingFromTime = (time: string): Greeting => {
	const minutes = parseMinutes(time);
	if (minutes >= 4 * 60 && minutes < 11 * 60) return 'pagi';
	if (minutes >= 11 * 60 && minutes < 15 * 60) return 'siang';
	if (minutes >= 15 * 60 && minutes < 18 * 60) return 'sore';
	return 'malam';
};

export const resolveGreeting = (show: {
	readonly time: string;
	readonly greeting: string;
}): Greeting => {
	const g = show.greeting;
	if (g === 'pagi' || g === 'siang' || g === 'sore' || g === 'malam') {
		return g;
	}
	return greetingFromTime(show.time);
};

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];

export type IndoDate = {
	readonly dayName: string;
	readonly day: number;
	readonly monthName: string;
	readonly year: number;
	/** "Minggu, 18 Oktober 2026" */
	readonly full: string;
	/** "18 Oktober 2026" */
	readonly long: string;
};

export const formatIndoDate = (iso: string): IndoDate => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
	if (!match) {
		throw new Error(`show.date harus berformat YYYY-MM-DD, dapat "${iso}"`);
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	// UTC supaya hasilnya tidak bergantung zona waktu mesin render.
	const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
	const dayName = DAYS[weekday] ?? '';
	const monthName = MONTHS[month - 1] ?? '';
	const long = `${day} ${monthName} ${year}`;
	return {dayName, day, monthName, year, long, full: `${dayName}, ${long}`};
};
