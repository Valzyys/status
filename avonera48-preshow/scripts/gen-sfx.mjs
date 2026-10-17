// Generate SFX WAV 48 kHz ke public/audio/sfx/ (deterministik, tanpa aset luar).
// Semua SFX dinormalisasi ke peak −3 dBFS.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	SR,
	TAU,
	fades,
	filter,
	midiToHz,
	normalize,
	panGains,
	reverb,
	rng,
	smoothstep,
	stereo,
	writeWav,
} from './lib/dsp.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/audio/sfx');

const sfx = {};

/** Isi buffer stereo dari fungsi sampel (t, i) → [l, r] atau mono number. */
const render = (seconds, fn) => {
	const [L, R] = stereo(seconds);
	for (let i = 0; i < L.length; i++) {
		const v = fn(i / SR, i);
		if (typeof v === 'number') {
			L[i] = v;
			R[i] = v;
		} else {
			L[i] = v[0];
			R[i] = v[1];
		}
	}
	return [L, R];
};

const mixInto = (target, src, gain = 1) => {
	for (let c = 0; c < 2; c++) for (let i = 0; i < target[c].length && i < src[c].length; i++) target[c][i] += src[c][i] * gain;
	return target;
};

// --- riser: 2.5 dtk, noise + sine sweep naik 200→2000 Hz, fade in
sfx.riser = () => {
	const dur = 2.5;
	const r = rng(11);
	const sweep = (t) => 200 * Math.pow(10, t / dur); // 200 → 2000 (log)
	const noise = filter(render(dur, () => r() * 2 - 1), 'bandpass', sweep, 2.2);
	let ph = 0;
	let ph2 = 0;
	const tone = render(dur, (t) => {
		ph += (TAU * sweep(t)) / SR;
		ph2 += (TAU * sweep(t) * 1.005) / SR;
		return 0.35 * Math.sin(ph) + 0.2 * Math.sin(ph2 * 0.5);
	});
	const out = mixInto(noise.map((c) => c.map((v) => v * 2.4)), tone);
	for (const ch of out) for (let i = 0; i < ch.length; i++) ch[i] *= Math.pow(i / ch.length, 2.2);
	return fades(reverb(out, {wet: 0.25, room: 0.8}), 0.01, 0.04);
};

// --- impact: 1.5 dtk, kick sub 50 Hz + noise burst, decay panjang
const impact = (dur, {sub = 50, start = 130, decay = 0.9, noiseDecay = 0.25, wet = 0.3, seed = 7, lp = 2500} = {}) => {
	const r = rng(seed);
	let ph = 0;
	const body = render(dur, (t) => {
		const f = sub + (start - sub) * Math.exp(-t / 0.045);
		ph += (TAU * f) / SR;
		return Math.sin(ph) * Math.exp(-t / decay) * (t < 0.003 ? t / 0.003 : 1);
	});
	const burst = filter(
		render(dur, (t) => (r() * 2 - 1) * Math.exp(-t / noiseDecay)),
		'lowpass',
		(t) => lp * Math.exp(-t * 4) + 150,
		0.8,
	);
	return fades(reverb(mixInto(body, burst, 0.55), {wet, room: 0.86, damp: 0.5}), 0.001, 0.2);
};
sfx.impact = () => impact(1.5);
sfx['soft-hit'] = () => impact(0.9, {sub: 75, start: 190, decay: 0.28, noiseDecay: 0.08, wet: 0.22, seed: 9, lp: 1600});

// --- whoosh: 0.6 dtk, bandpass noise sweep, panning L→R
const whoosh = (dir) => {
	const dur = 0.6;
	const r = rng(dir === 'in' ? 21 : 22);
	const [lo, hi] = [350, 3200];
	const sweep = (t) => {
		const u = t / dur;
		return dir === 'in' ? lo * Math.pow(hi / lo, u) : hi * Math.pow(lo / hi, u);
	};
	const n = filter(render(dur, () => r() * 2 - 1), 'bandpass', sweep, 1.4);
	const [L, R] = n;
	for (let i = 0; i < L.length; i++) {
		const u = i / L.length;
		const peakAt = dir === 'in' ? 0.72 : 0.28;
		const env = u < peakAt ? Math.pow(u / peakAt, 2) : Math.pow(1 - (u - peakAt) / (1 - peakAt), 1.6);
		const [gl, gr] = panGains(-0.8 + 1.6 * u);
		const m = (L[i] + R[i]) * 0.5 * env;
		L[i] = m * gl;
		R[i] = m * gr;
	}
	return fades(reverb(n, {wet: 0.18, room: 0.7}), 0.005, 0.03);
};
sfx['whoosh-in'] = () => whoosh('in');
sfx['whoosh-out'] = () => whoosh('out');

// --- shimmer: 1.2 dtk, sine tinggi berlapis + tremolo
sfx.shimmer = () => {
	const dur = 1.2;
	const notes = [81, 88, 93, 97, 100].map(midiToHz); // A5 E6 A6 C#7 E7
	const phases = notes.map(() => [0, 0]);
	const out = render(dur, (t) => {
		const env = Math.min(1, t / 0.06) * Math.exp(-t / 0.45);
		const trem = 0.65 + 0.35 * Math.sin(TAU * 7 * t);
		let l = 0;
		let r = 0;
		notes.forEach((f, k) => {
			const delay = k * 0.035;
			if (t < delay) return;
			phases[k][0] += (TAU * f * 0.998) / SR;
			phases[k][1] += (TAU * f * 1.002) / SR;
			const g = (1 / (k + 1.5)) * Math.min(1, (t - delay) / 0.02);
			l += Math.sin(phases[k][0]) * g;
			r += Math.sin(phases[k][1]) * g;
		});
		return [l * env * trem, r * env * trem];
	});
	return fades(reverb(out, {wet: 0.4, room: 0.88}), 0.002, 0.08);
};

// --- tick: 60 ms klik halus; tick-1..5 pitch naik (pentatonik)
const tick = (freq, seed) => {
	const r = rng(seed);
	let ph = 0;
	const out = render(0.06, (t) => {
		ph += (TAU * freq) / SR;
		const click = t < 0.003 ? (r() * 2 - 1) * (1 - t / 0.003) * 0.5 : 0;
		return Math.sin(ph) * Math.exp(-t / 0.014) + click;
	});
	return fades(filter(out, 'highpass', 300), 0.0005, 0.005);
};
sfx.tick = () => tick(2200, 31);
[0, 2, 4, 7, 9].forEach((semi, k) => {
	sfx[`tick-${k + 1}`] = () => tick(1400 * Math.pow(2, semi / 12), 40 + k);
});

// --- pop: 120 ms, sine pitch drop
sfx.pop = () => {
	let ph = 0;
	const out = render(0.12, (t) => {
		const f = 300 + 700 * Math.exp(-t / 0.018);
		ph += (TAU * f) / SR;
		return Math.sin(ph) * Math.exp(-t / 0.04) * Math.min(1, t / 0.001);
	});
	return fades(out, 0.0005, 0.01);
};

// --- swell: 2 dtk, pad naik volume
sfx.swell = () => {
	const dur = 2;
	const notes = [57, 60, 64, 69, 72].map(midiToHz); // A3 C4 E4 A4 C5
	const phases = notes.map(() => [0, 0, 0]);
	const out = render(dur, (t) => {
		const u = t / dur;
		let l = 0;
		let r = 0;
		notes.forEach((f, k) => {
			const det = [0.996, 1, 1.004];
			det.forEach((d, j) => {
				phases[k][j] += (TAU * f * d) / SR;
			});
			// triangle-ish: sine + harmonik ganjil
			const tri = (p) => Math.sin(p) - Math.sin(3 * p) / 9 + Math.sin(5 * p) / 25;
			l += tri(phases[k][0]) + 0.6 * tri(phases[k][1]);
			r += tri(phases[k][2]) + 0.6 * tri(phases[k][1]);
		});
		const env = Math.pow(smoothstep(u), 1.6);
		return [l * env, r * env];
	});
	return fades(reverb(filter(out, 'lowpass', (t) => 400 + 3200 * (t / dur), 0.9), {wet: 0.35}), 0.01, 0.12);
};

// --- beep: 150 ms, sine 880 / 1320 Hz
const beep = (f) => {
	let ph = 0;
	const out = render(0.15, (t) => {
		ph += (TAU * f) / SR;
		const env = Math.min(1, t / 0.005) * (t > 0.13 ? (0.15 - t) / 0.02 : 1);
		return (Math.sin(ph) + 0.12 * Math.sin(2 * ph)) * env;
	});
	return fades(out, 0.001, 0.003);
};
sfx.beep = () => beep(880);
sfx['beep-high'] = () => beep(1320);

// --- final-hit: 3 dtk, impact besar + reverb tail
sfx['final-hit'] = () => {
	const dur = 3;
	const base = impact(dur, {sub: 38, start: 120, decay: 1.4, noiseDecay: 0.4, wet: 0.45, seed: 77, lp: 4000});
	const chord = [45, 57, 64, 69, 73, 76].map(midiToHz); // A1 A3 E4 A4 C#5 E5 (cerah)
	const phases = chord.map(() => 0);
	const stab = render(dur, (t) => {
		let v = 0;
		chord.forEach((f, k) => {
			phases[k] += (TAU * f) / SR;
			const saw = Math.sin(phases[k]) + Math.sin(2 * phases[k]) / 2 + Math.sin(3 * phases[k]) / 3;
			v += saw / (k + 2);
		});
		return v * Math.exp(-t / 0.8) * Math.min(1, t / 0.004);
	});
	const stabWet = reverb(filter(stab, 'lowpass', (t) => 6000 * Math.exp(-t * 1.5) + 300, 0.7), {wet: 0.6, room: 0.9});
	return fades(mixInto(base, stabWet, 0.5), 0.001, 0.3);
};

let count = 0;
for (const [name, make] of Object.entries(sfx)) {
	const chans = normalize(make(), -3);
	writeWav(path.join(outDir, `${name}.wav`), chans);
	count++;
}
console.log(`[sfx] ${count} file → ${path.relative(root, outDir)}`);
