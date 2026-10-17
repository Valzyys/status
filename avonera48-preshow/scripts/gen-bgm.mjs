// Fallback BGM procedural (royalty-free, dibuat dari nol) → public/audio/bgm/generated/
//   loop.wav       180 dtk  ambient pad Am–F–C–G ±85 BPM, loop mulus
//   standby.wav     30 dtk  ambient pelan, loop mulus
//   countdown.wav   60 dtk  lebih tegang (pulse bass tiap beat), loop mulus
// Loop mulus: semua not dijadwalkan periodik, lalu ekor (release + reverb) dilipat ke awal
// (wrapLoop) sehingga sampel terakhir menyambung sempurna ke sampel pertama.
// Jika ada public/audio/bgm/bgm.mp3 milik sendiri, file itu yang dipakai untuk PreShowLoop.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	Biquad,
	SR,
	TAU,
	filter,
	midiToHz,
	normalize,
	panGains,
	reverb,
	rng,
	smoothstep,
	wrapLoop,
	writeWav,
} from './lib/dsp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/audio/bgm/generated');
const TAIL = 8; // detik ekstra untuk release + reverb yang nanti dilipat

const CHORDS = [
	{bass: 45, notes: [57, 60, 64, 67, 71]}, // Am9
	{bass: 41, notes: [57, 60, 64, 65, 69]}, // Fmaj7
	{bass: 48, notes: [55, 60, 64, 67, 71]}, // Cmaj7
	{bass: 43, notes: [55, 59, 62, 67, 69]}, // Gadd9
];

const tri = (p) => Math.sin(p) - Math.sin(3 * p) / 9 + Math.sin(5 * p) / 25;

/**
 * @param {object} spec
 * @param {number} spec.seconds  panjang loop (harus kelipatan siklus akor)
 * @param {number} spec.bpm
 * @param {number} spec.chordBeats  durasi tiap akor dalam beat
 * @param {(t:number)=>number} spec.arc  energi 0–1, periodik terhadap `seconds`
 */
const renderTrack = (spec) => {
	const {seconds, bpm, chordBeats, arc, seed} = spec;
	const beat = 60 / bpm;
	const chordDur = chordBeats * beat;
	const nChords = Math.round(seconds / chordDur);
	if (Math.abs(nChords * chordDur - seconds) > 1e-6) {
		throw new Error(`Durasi ${seconds}s bukan kelipatan akor ${chordDur}s`);
	}
	const total = Math.round((seconds + TAIL) * SR);
	const wetBus = [new Float32Array(total), new Float32Array(total)];
	const dryBus = [new Float32Array(total), new Float32Array(total)];
	const r = rng(seed);

	const addNote = (bus, startSec, durSec, fn, pan = 0) => {
		const s0 = Math.max(0, Math.round(startSec * SR));
		const s1 = Math.min(total, Math.round((startSec + durSec) * SR));
		const [gl, gr] = panGains(pan);
		for (let i = s0; i < s1; i++) {
			const v = fn((i - s0) / SR, i / SR);
			bus[0][i] += v * gl;
			bus[1][i] += v * gr;
		}
	};

	for (let c = 0; c < nChords; c++) {
		const chord = CHORDS[c % CHORDS.length];
		const start = c * chordDur;
		const attack = Math.min(1.2, chordDur * 0.4);
		const release = Math.min(2.2, chordDur * 0.6);
		const env = (lt) =>
			lt < attack ? smoothstep(lt / attack) : lt < chordDur ? 1 : Math.max(0, 1 - (lt - chordDur) / release);

		// Pad: 3 voice detune tipis per not, stereo spread
		if (spec.pad) {
			chord.notes.forEach((m, k) => {
				const f = midiToHz(m);
				[-7, 0, 7].forEach((cents, v) => {
					const fv = f * Math.pow(2, cents / 1200);
					const ph0 = r() * TAU;
					addNote(
						wetBus,
						start,
						chordDur + release,
						(lt, t) => tri(ph0 + TAU * fv * t) * env(lt) * spec.pad * 0.05 * (1 - k * 0.08),
						(v - 1) * 0.6,
					);
				});
			});
		}

		// Sub bass
		if (spec.sub) {
			const f = midiToHz(chord.bass);
			addNote(dryBus, start, chordDur + release, (lt, t) => Math.sin(TAU * f * t) * env(lt) * spec.sub * 0.22);
		}

		// Arpeggio bell (8th notes) mengikuti nada akor
		if (spec.arp) {
			const tones = [...chord.notes.slice(1), ...chord.notes.slice(1).map((n) => n + 12)];
			const pattern = [0, 2, 4, 6, 7, 5, 3, 1];
			const step = beat / 2;
			const steps = Math.round(chordDur / step);
			for (let s = 0; s < steps; s++) {
				if (spec.arpDensity && r() > spec.arpDensity) continue;
				const at = start + s * step;
				const m = tones[pattern[(s + c * 3) % pattern.length] % tones.length];
				const f = midiToHz(m);
				const accent = s % 4 === 0 ? 1 : 0.7;
				const pan = Math.sin(s * 1.7 + c) * 0.5;
				addNote(
					wetBus,
					at,
					1.6,
					(lt, t) =>
						(Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t) * Math.exp(-lt / 0.15)) *
						Math.exp(-lt / 0.45) *
						Math.min(1, lt / 0.004) *
						spec.arp *
						0.06 *
						accent *
						arc(at % seconds),
					pan,
				);
			}
		}

		// Pulse bass tiap beat/8th (countdown)
		if (spec.pulse) {
			const f = midiToHz(chord.bass + 12);
			const step = beat / 2;
			for (let s = 0; s < Math.round(chordDur / step); s++) {
				const at = start + s * step;
				const accent = s % 2 === 0 ? 1 : 0.6;
				addNote(dryBus, at, step, (lt, t) => {
					const saw = Math.sin(TAU * f * t) + Math.sin(TAU * 2 * f * t) / 2 + Math.sin(TAU * 3 * f * t) / 3;
					return saw * Math.exp(-lt / 0.09) * Math.min(1, lt / 0.003) * spec.pulse * 0.12 * accent;
				});
			}
		}
	}

	// Drum halus: kick + shaker (shaker di bus sendiri supaya bisa di-high-pass)
	const hatBus = [new Float32Array(total), new Float32Array(total)];
	const nBeats = Math.round(seconds / beat);
	for (let b = 0; b < nBeats; b++) {
		const at = b * beat;
		const e = arc(at);
		if (spec.kick && (spec.kickEvery === 1 || b % 2 === 0)) {
			addNote(dryBus, at, 0.5, (lt) => {
				const f = 48 + 70 * Math.exp(-lt / 0.03);
				return Math.sin(TAU * f * lt - (70 * 0.03 * TAU) * (Math.exp(-lt / 0.03) - 1)) * Math.exp(-lt / 0.22) * spec.kick * 0.35 * e;
			});
		}
		if (spec.hat) {
			const div = spec.hatDiv ?? 2;
			for (let k = 0; k < div; k++) {
				const hatAt = at + (k * beat) / div;
				const acc = k % 2 === 1 ? 1 : 0.55;
				addNote(hatBus, hatAt, 0.08, (lt) => (r() * 2 - 1) * Math.exp(-lt / 0.025) * spec.hat * 0.05 * acc * e, k % 2 ? 0.3 : -0.3);
			}
		}
	}
	if (spec.hat) {
		filter(hatBus, 'highpass', 6500, 0.7);
		for (let c = 0; c < 2; c++) for (let i = 0; i < total; i++) dryBus[c][i] += hatBus[c][i] * 2.2;
	}

	// Air: noise lembut di frekuensi tinggi, bernapas pelan
	if (spec.air) {
		const air = [new Float32Array(total), new Float32Array(total)];
		for (let i = 0; i < total; i++) {
			const t = i / SR;
			const breathe = 0.6 + 0.4 * Math.sin((TAU * t) / (seconds / 2));
			air[0][i] = (r() * 2 - 1) * spec.air * 0.012 * breathe;
			air[1][i] = (r() * 2 - 1) * spec.air * 0.012 * breathe;
		}
		filter(air, 'bandpass', 5200, 0.5);
		for (let c = 0; c < 2; c++) for (let i = 0; i < total; i++) wetBus[c][i] += air[c][i];
	}

	// Low-pass pad/arp dengan cutoff yang ikut energi (periodik)
	filter(wetBus, 'lowpass', (t) => spec.cutoff * (0.75 + 0.5 * arc(t % seconds)), 0.6, 64);

	// Ping-pong delay untuk arp/pad (LTI → aman di-wrap)
	const d = Math.round(beat * 0.75 * SR);
	for (let i = d; i < total; i++) {
		wetBus[0][i] += wetBus[1][i - d] * 0.28;
		wetBus[1][i] += wetBus[0][i - d] * 0.28;
	}

	const wet = reverb(wetBus, {room: 0.88, damp: 0.45, wet: spec.reverb ?? 0.45, dry: 0.8, width: 1});
	const dry = reverb(dryBus, {room: 0.7, damp: 0.6, wet: 0.12, dry: 1});
	const mix = [new Float32Array(total), new Float32Array(total)];
	for (let c = 0; c < 2; c++) for (let i = 0; i < total; i++) mix[c][i] = wet[c][i] + dry[c][i];

	// LFO volume pelan (periode membagi habis durasi loop)
	const lfoPeriod = seconds / Math.max(1, Math.round(seconds / 15));
	for (let c = 0; c < 2; c++) {
		for (let i = 0; i < total; i++) mix[c][i] *= 0.88 + 0.12 * Math.sin((TAU * i) / SR / lfoPeriod);
	}

	const looped = wrapLoop(mix, Math.round(seconds * SR));
	// DC/rumble cleanup setelah wrap memakai filter yang state-nya "dipanaskan" dengan ekor loop
	const hp = looped.map((ch) => {
		const f = new Biquad('highpass', 25, 0.7);
		const warm = Math.round(SR * 2);
		for (let i = ch.length - warm; i < ch.length; i++) f.process(ch[i]);
		return ch.map((v) => f.process(v));
	});
	return normalize(hp, -1);
};

// Energi untuk loop 180 dtk: tipis di opening, penuh di tengah, kembali tipis di 10 dtk
// terakhir supaya titik loop menyambung dengan opening.
const loopArc = (t) => smoothstep((t - 8) / 16) * (1 - smoothstep((t - 168) / 12));

const tracks = {
	loop: () =>
		renderTrack({
			seconds: 180,
			bpm: 256 / 3, // ≈85.33 BPM → siklus 4 akor = 22.5 dtk, 8 siklus pas 180 dtk
			chordBeats: 8,
			arc: (t) => 0.25 + 0.75 * loopArc(t),
			pad: 1,
			sub: 0.8,
			arp: 0.9,
			kick: 0.7,
			hat: 0.8,
			air: 1,
			cutoff: 2200,
			seed: 180,
		}),
	standby: () =>
		renderTrack({
			seconds: 30,
			bpm: 64, // siklus 4 akor × 2 bar = 30 dtk
			chordBeats: 8,
			arc: () => 0.5,
			pad: 1,
			sub: 0.6,
			arp: 0.6,
			arpDensity: 0.35,
			air: 1.2,
			cutoff: 1500,
			reverb: 0.55,
			seed: 30,
		}),
	countdown: () =>
		renderTrack({
			seconds: 60,
			bpm: 96, // 4 akor × 1 bar = 10 dtk → 6 siklus
			chordBeats: 4,
			arc: () => 1,
			pad: 0.8,
			sub: 0.5,
			arp: 0.8,
			pulse: 1,
			kick: 1,
			kickEvery: 1,
			hat: 1,
			hatDiv: 4,
			air: 0.8,
			cutoff: 2800,
			reverb: 0.35,
			seed: 60,
		}),
};

fs.mkdirSync(outDir, {recursive: true});
for (const [name, make] of Object.entries(tracks)) {
	const t0 = Date.now();
	writeWav(path.join(outDir, `${name}.wav`), make());
	console.log(`[bgm] ${name}.wav (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
const user = ['bgm.mp3', 'bgm.wav'].find((f) => fs.existsSync(path.join(root, 'public/audio/bgm', f)));
if (user) {
	console.log(`[bgm] Ditemukan public/audio/bgm/${user} → dipakai untuk PreShowLoop (generated/loop.wav jadi cadangan).`);
}
