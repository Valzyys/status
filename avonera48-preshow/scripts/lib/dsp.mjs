// DSP kecil & deterministik untuk membuat SFX/BGM tanpa aset eksternal.
import fs from 'node:fs';
import path from 'node:path';

export const SR = 48000;
export const TAU = Math.PI * 2;

/** PRNG ber-seed (mulberry32) supaya hasil generate selalu identik. */
export const rng = (seed) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

export const stereo = (seconds) => {
	const n = Math.round(seconds * SR);
	return [new Float32Array(n), new Float32Array(n)];
};

export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const dbToGain = (db) => Math.pow(10, db / 20);
export const smoothstep = (t) => {
	const c = Math.min(1, Math.max(0, t));
	return c * c * (3 - 2 * c);
};

/** Pan equal-power, p = -1 (kiri) … 1 (kanan). */
export const panGains = (p) => {
	const a = ((p + 1) / 4) * Math.PI;
	return [Math.cos(a), Math.sin(a)];
};

/** Biquad RBJ. type: 'lowpass' | 'highpass' | 'bandpass'. */
export class Biquad {
	constructor(type, freq, q = 0.707) {
		this.type = type;
		this.q = q;
		this.x1 = this.x2 = this.y1 = this.y2 = 0;
		this.set(freq);
	}
	set(freq, q = this.q) {
		const f = Math.min(SR * 0.45, Math.max(10, freq));
		const w = (TAU * f) / SR;
		const cos = Math.cos(w);
		const alpha = Math.sin(w) / (2 * q);
		let b0, b1, b2;
		if (this.type === 'lowpass') {
			b0 = (1 - cos) / 2;
			b1 = 1 - cos;
			b2 = (1 - cos) / 2;
		} else if (this.type === 'highpass') {
			b0 = (1 + cos) / 2;
			b1 = -(1 + cos);
			b2 = (1 + cos) / 2;
		} else {
			b0 = alpha;
			b1 = 0;
			b2 = -alpha;
		}
		const a0 = 1 + alpha;
		this.b0 = b0 / a0;
		this.b1 = b1 / a0;
		this.b2 = b2 / a0;
		this.a1 = (-2 * cos) / a0;
		this.a2 = (1 - alpha) / a0;
	}
	process(x) {
		const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
		this.x2 = this.x1;
		this.x1 = x;
		this.y2 = this.y1;
		this.y1 = y;
		return y;
	}
}

/** Terapkan filter (bisa time-varying lewat freqAt(t)) ke tiap channel. */
export const filter = (chans, type, freqAt, q = 0.707, step = 32) => {
	for (const ch of chans) {
		const f = new Biquad(type, typeof freqAt === 'function' ? freqAt(0) : freqAt, q);
		for (let i = 0; i < ch.length; i++) {
			if (typeof freqAt === 'function' && i % step === 0) f.set(freqAt(i / SR));
			ch[i] = f.process(ch[i]);
		}
	}
	return chans;
};

/** Reverb Freeverb (Jezar) stereo. */
export const reverb = (chans, {room = 0.84, damp = 0.4, wet = 0.3, dry = 1, width = 1} = {}) => {
	const scale = SR / 44100;
	const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
	const apT = [556, 441, 341, 225];
	const make = (spread) => ({
		combs: combT.map((t) => ({buf: new Float32Array(Math.round((t + spread) * scale)), i: 0, store: 0})),
		aps: apT.map((t) => ({buf: new Float32Array(Math.round((t + spread) * scale)), i: 0})),
	});
	const sides = [make(0), make(23)];
	const [L, R] = chans;
	const n = L.length;
	const outL = new Float32Array(n);
	const outR = new Float32Array(n);
	const wet1 = wet * (width / 2 + 0.5);
	const wet2 = wet * ((1 - width) / 2);
	for (let i = 0; i < n; i++) {
		const input = (L[i] + R[i]) * 0.015;
		const res = [0, 0];
		for (let s = 0; s < 2; s++) {
			let acc = 0;
			for (const c of sides[s].combs) {
				const o = c.buf[c.i];
				c.store = o * (1 - damp) + c.store * damp;
				c.buf[c.i] = input + c.store * room;
				if (++c.i >= c.buf.length) c.i = 0;
				acc += o;
			}
			for (const a of sides[s].aps) {
				const b = a.buf[a.i];
				a.buf[a.i] = acc + b * 0.5;
				if (++a.i >= a.buf.length) a.i = 0;
				acc = b - acc;
			}
			res[s] = acc;
		}
		outL[i] = L[i] * dry + res[0] * wet1 + res[1] * wet2;
		outR[i] = R[i] * dry + res[1] * wet1 + res[0] * wet2;
	}
	return [outL, outR];
};

export const peak = (chans) => {
	let p = 0;
	for (const ch of chans) for (let i = 0; i < ch.length; i++) p = Math.max(p, Math.abs(ch[i]));
	return p;
};

export const normalize = (chans, peakDb = -3) => {
	const p = peak(chans);
	if (p === 0) return chans;
	const g = dbToGain(peakDb) / p;
	for (const ch of chans) for (let i = 0; i < ch.length; i++) ch[i] *= g;
	return chans;
};

export const fades = (chans, inSec = 0.002, outSec = 0.01) => {
	const ni = Math.round(inSec * SR);
	const no = Math.round(outSec * SR);
	for (const ch of chans) {
		for (let i = 0; i < ni && i < ch.length; i++) ch[i] *= i / ni;
		for (let i = 0; i < no && i < ch.length; i++) ch[ch.length - 1 - i] *= i / no;
	}
	return chans;
};

/**
 * Lipat sampel setelah `loopSamples` kembali ke awal (wrap), lalu potong.
 * Untuk sistem linear (filter, reverb) hasilnya periodik sempurna → loop tanpa jahitan.
 */
export const wrapLoop = (chans, loopSamples) =>
	chans.map((ch) => {
		const out = new Float32Array(loopSamples);
		for (let i = 0; i < ch.length; i++) out[i % loopSamples] += ch[i];
		return out;
	});

export const writeWav = (file, chans) => {
	const n = chans[0].length;
	const nc = chans.length;
	const data = Buffer.alloc(n * nc * 2);
	let o = 0;
	for (let i = 0; i < n; i++) {
		for (let c = 0; c < nc; c++) {
			const v = Math.max(-1, Math.min(1, chans[c][i]));
			data.writeInt16LE(Math.round(v * 32767), o);
			o += 2;
		}
	}
	const header = Buffer.alloc(44);
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + data.length, 4);
	header.write('WAVE', 8);
	header.write('fmt ', 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(nc, 22);
	header.writeUInt32LE(SR, 24);
	header.writeUInt32LE(SR * nc * 2, 28);
	header.writeUInt16LE(nc * 2, 32);
	header.writeUInt16LE(16, 34);
	header.write('data', 36);
	header.writeUInt32LE(data.length, 40);
	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, Buffer.concat([header, data]));
};
