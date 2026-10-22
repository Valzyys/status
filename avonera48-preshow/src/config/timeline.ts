// Timing semua scene, SFX, dan VO. Dipakai bersama oleh visual (scenes/*) dan audio (AudioBed)
// supaya animasi dan suara tidak pernah meleset.

import type {VoId} from './vo';

export const FPS = 30; // ganti ke 60 bila perlu; semua timing dihitung dari detik.
export const TRANSITION_FRAMES = 18;
export const LOOP_SECONDS = 180;
export const STANDBY_SECONDS = 30;
export const COUNTDOWN_OUTRO_SECONDS = 4;

export const sec = (s: number): number => Math.round(s * FPS);

export type SfxName =
	| 'riser'
	| 'impact'
	| 'soft-hit'
	| 'whoosh-in'
	| 'whoosh-out'
	| 'shimmer'
	| 'tick'
	| 'tick-1'
	| 'tick-2'
	| 'tick-3'
	| 'tick-4'
	| 'tick-5'
	| 'pop'
	| 'swell'
	| 'beep'
	| 'beep-high'
	| 'final-hit';

export type SfxCue = {readonly sfx: SfxName; readonly at: number; readonly gainDb: number};
export type VoCue = {readonly vo: VoId; readonly at: number};

export type SceneId =
	| 'opening'
	| 'info'
	| 'interlude'
	| 'rules'
	| 'partner'
	| 'connect'
	| 'stayTuned';

const BASE_SECONDS: Record<SceneId, number> = {
	opening: 12,
	info: 20,
	interlude: 38,
	rules: 35,
	partner: 15,
	connect: 25,
	stayTuned: 35,
};

const ORDER: readonly SceneId[] = [
	'opening',
	'info',
	'interlude',
	'rules',
	'partner',
	'connect',
	'stayTuned',
];

// ---------------------------------------------------------------------------
// Cue per scene. Semua angka = frame lokal relatif ke awal <Sequence> scene.
// `o` = offset dari awal sequence ke awal nominal scene (setengah transisi).
// ---------------------------------------------------------------------------

const openingCues = (o: number) => ({
	beamStart: o + sec(0.2),
	beamEnd: o + sec(2.8),
	titleStart: o + sec(1.9),
	titleFull: o + sec(2.6),
	subtitleStart: o + sec(4.6),
});

const infoCues = (o: number) => ({
	label: o + sec(0.4),
	date: o + sec(1.0),
	time: o + sec(1.5),
	timeLand: o + sec(1.95),
	venue: o + sec(2.0),
});

export const INTERLUDE_LAMPS = 5;
export const INTERLUDE_PHRASES = ['LAMPU MENYALA', 'PANGGUNG SIAP', 'SEBENTAR LAGI'] as const;

const interludeCues = (o: number, nominalFrames: number) => {
	const lamps = Array.from({length: INTERLUDE_LAMPS}, (_, i) => o + sec(1.5 + i * 1.1));
	const phraseStart = o + sec(8);
	const phraseEnd = o + nominalFrames - sec(1.5);
	const each = Math.floor((phraseEnd - phraseStart) / INTERLUDE_PHRASES.length);
	const phrases = INTERLUDE_PHRASES.map((_, i) => ({
		from: phraseStart + i * each,
		duration: each,
	}));
	return {lamps, phrases};
};

const rulesCues = (o: number, count: number) => ({
	label: o + sec(0.3),
	title: o + sec(0.5),
	rules: Array.from({length: count}, (_, i) => o + sec(3.2 + i * 2.4)),
});

const partnerCues = (o: number, nominalFrames: number) => ({
	label: o + sec(0.4),
	marquee: o + sec(0.8),
	exit: o + nominalFrames - sec(1.0),
});

const connectCues = (o: number, socialCount: number) => ({
	text: o + sec(0.5),
	qr: o + sec(0.8),
	socials: Array.from({length: socialCount}, (_, i) => o + sec(2.0) + i * 4),
});

const stayTunedCues = (o: number, durationInFrames: number) => ({
	title: o + sec(0.6),
	bars: o + sec(1.5),
	/** Mulai kembali ke komposisi frame 0 (loop mulus). */
	resetStart: durationInFrames - sec(2.5),
	resetEnd: durationInFrames - sec(0.5),
});

export type CueMap = {
	opening: ReturnType<typeof openingCues>;
	info: ReturnType<typeof infoCues>;
	interlude: ReturnType<typeof interludeCues>;
	rules: ReturnType<typeof rulesCues>;
	partner: ReturnType<typeof partnerCues>;
	connect: ReturnType<typeof connectCues>;
	stayTuned: ReturnType<typeof stayTunedCues>;
};

export type SceneTimeline<K extends SceneId = SceneId> = {
	readonly id: K;
	/** Frame absolut awal <Sequence> (termasuk overlap transisi). */
	readonly from: number;
	readonly durationInFrames: number;
	readonly nominalFrom: number;
	readonly nominalDuration: number;
	readonly cues: CueMap[K];
	readonly sfx: readonly SfxCue[];
	readonly vo: readonly VoCue[];
};

export type LoopTimeline = {
	readonly totalFrames: number;
	readonly scenes: readonly SceneTimeline[];
	readonly get: <K extends SceneId>(id: K) => SceneTimeline<K> | undefined;
	/** Intensitas tambahan lampu panggung (0–1) di frame absolut. */
	readonly activityAt: (frame: number) => number;
	/** Penguatan BGM (dB) di frame absolut. */
	readonly bgmBoostDbAt: (frame: number) => number;
};

const buildScene = (
	id: SceneId,
	from: number,
	durationInFrames: number,
	nominalFrom: number,
	nominalDuration: number,
	counts: {rules: number; socials: number},
): SceneTimeline => {
	const o = nominalFrom - from;
	switch (id) {
		case 'opening': {
			const cues = openingCues(o);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [
					{sfx: 'riser', at: o, gainDb: -12},
					{sfx: 'impact', at: cues.titleFull, gainDb: -10},
					{sfx: 'shimmer', at: cues.subtitleStart, gainDb: -13},
				],
				vo: [{vo: 'vo1', at: o + sec(4)}],
			};
		}
		case 'info': {
			const cues = infoCues(o);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [
					{sfx: 'whoosh-in', at: cues.date, gainDb: -14},
					{sfx: 'whoosh-in', at: cues.time, gainDb: -13},
					{sfx: 'soft-hit', at: cues.timeLand, gainDb: -11},
					{sfx: 'whoosh-in', at: cues.venue, gainDb: -14},
				],
				vo: [],
			};
		}
		case 'interlude': {
			const cues = interludeCues(o, nominalDuration);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [
					{sfx: 'swell', at: (cues.lamps[0] ?? o) - sec(0.6), gainDb: -12},
					...cues.lamps.map(
						(at, i): SfxCue => ({
							sfx: `tick-${Math.min(i + 1, 5)}` as SfxName,
							at,
							gainDb: -14,
						}),
					),
					...cues.phrases.map(
						(p): SfxCue => ({sfx: 'whoosh-in', at: p.from, gainDb: -17}),
					),
				],
				vo: [],
			};
		}
		case 'rules': {
			const cues = rulesCues(o, counts.rules);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: cues.rules.map((at): SfxCue => ({sfx: 'pop', at, gainDb: -13})),
				vo: [{vo: 'vo2', at: o + sec(1.6)}],
			};
		}
		case 'partner': {
			const cues = partnerCues(o, nominalDuration);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [
					{sfx: 'whoosh-in', at: o + sec(0.2), gainDb: -14},
					{sfx: 'whoosh-out', at: cues.exit, gainDb: -14},
				],
				vo: [],
			};
		}
		case 'connect': {
			const cues = connectCues(o, counts.socials);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [{sfx: 'shimmer', at: cues.qr, gainDb: -13}],
				vo: [],
			};
		}
		case 'stayTuned': {
			const cues = stayTunedCues(o, durationInFrames);
			return {
				id,
				from,
				durationInFrames,
				nominalFrom,
				nominalDuration,
				cues,
				sfx: [],
				vo: [{vo: 'vo3', at: o + sec(3)}],
			};
		}
	}
};

const smooth = (t: number): number => {
	const c = Math.min(1, Math.max(0, t));
	return c * c * (3 - 2 * c);
};

export const buildLoopTimeline = (opts: {
	hasSponsors: boolean;
	hasSocials: boolean;
	ruleCount: number;
	socialCount: number;
}): LoopTimeline => {
	const seconds: Record<SceneId, number> = {...BASE_SECONDS};
	// Scene kosong di-skip; durasinya dialihkan supaya total tetap 180 dtk.
	if (!opts.hasSponsors) {
		seconds.interlude += seconds.partner;
		seconds.partner = 0;
	}
	if (!opts.hasSocials) {
		seconds.stayTuned += seconds.connect;
		seconds.connect = 0;
	}

	const totalFrames = sec(LOOP_SECONDS);
	const half = TRANSITION_FRAMES / 2;
	const ids = ORDER.filter((id) => seconds[id] > 0);

	let t = 0;
	const nominal = ids.map((id) => {
		const nominalFrom = sec(t);
		t += seconds[id];
		return {id, nominalFrom, nominalEnd: sec(t)};
	});

	const scenes = nominal.map((n, i) => {
		const from = i === 0 ? 0 : n.nominalFrom - half;
		const end = i === nominal.length - 1 ? totalFrames : n.nominalEnd + half;
		return buildScene(n.id, from, end - from, n.nominalFrom, n.nominalEnd - n.nominalFrom, {
			rules: opts.ruleCount,
			socials: opts.socialCount,
		});
	});

	const get = <K extends SceneId>(id: K): SceneTimeline<K> | undefined =>
		scenes.find((s): s is SceneTimeline<K> => s.id === id);

	const stay = get('stayTuned');

	const activityAt = (frame: number): number => {
		if (!stay) return 0;
		const local = frame - stay.from;
		const up = smooth((local - sec(1)) / sec(4));
		const down = 1 - smooth((local - (stay.cues.resetStart - sec(3))) / sec(3));
		return Math.max(0, Math.min(up, down));
	};

	const bgmBoostDbAt = (frame: number): number => {
		if (!stay) return 0;
		const local = frame - stay.from;
		const up = smooth(local / sec(3));
		const down = 1 - smooth((local - (stay.durationInFrames - sec(4))) / sec(3.5));
		return 3 * Math.max(0, Math.min(up, down));
	};

	return {totalFrames, scenes, get, activityAt, bgmBoostDbAt};
};

// ---------------------------------------------------------------------------
// FinalCountdown
// ---------------------------------------------------------------------------

export type CountdownTimeline = {
	readonly totalFrames: number;
	/** Frame saat angka 00:00 dan hit besar. */
	readonly zeroFrame: number;
	readonly sfx: readonly SfxCue[];
	readonly vo: readonly VoCue[];
};

export const buildCountdownTimeline = (minutes: number): CountdownTimeline => {
	const zeroFrame = sec(minutes * 60);
	const totalFrames = zeroFrame + sec(COUNTDOWN_OUTRO_SECONDS);
	const beeps: SfxCue[] = [];
	for (let s = 10; s >= 1; s--) {
		const at = zeroFrame - sec(s);
		if (at < 0) continue;
		beeps.push({sfx: s <= 3 ? 'beep-high' : 'beep', at, gainDb: s <= 3 ? -10 : -13});
	}
	const vo: VoCue[] = zeroFrame - sec(15) >= 0 ? [{vo: 'vo-countdown', at: zeroFrame - sec(15)}] : [];
	return {
		totalFrames,
		zeroFrame,
		sfx: [
			...beeps,
			{sfx: 'riser', at: Math.max(0, zeroFrame - sec(2.5)), gainDb: -14},
			{sfx: 'final-hit', at: zeroFrame, gainDb: -7},
		],
		vo,
	};
};
