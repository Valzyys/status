// Naskah voice over. Tanpa import supaya bisa dibaca script Node (gen-vo).
// {sapaan} berasal dari greeting.ts, {venue} dari show.config.ts.

export type VoId = 'vo1' | 'vo2' | 'vo3' | 'vo-countdown';

export const buildVoScripts = (params: {
	readonly greeting: string;
	readonly venue: string;
}): Record<VoId, string> => ({
	vo1: `Selamat ${params.greeting}, dan selamat datang. Show hari ini akan segera dimulai, langsung dari ${params.venue}.`,
	vo2: 'Sebelum show dimulai, mohon untuk tidak merekam atau menyebarkan ulang tayangan, dan tetap jaga chat dengan sopan.',
	vo3: 'Show akan segera dimulai. Siapkan dirimu, dan selamat menikmati!',
	'vo-countdown': 'Lima belas detik lagi. Show segera dimulai!',
});
