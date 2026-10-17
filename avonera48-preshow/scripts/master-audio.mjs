// Mastering audio: two-pass loudnorm → −14 LUFS integrated, true peak ≤ −1 dBTP, AAC 320k 48 kHz.
// Pakai: node scripts/master-audio.mjs <loop|countdown|standby>
//   out/raw-<kind>.mp4 → out/preshow-loop.mp4 | out/countdown-<N>m.mp4 | out/standby.mp4
// Video di-copy tanpa re-encode. Gain dibuat statis (linear) supaya loop tetap mulus.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const TARGET_I = -14;
const TARGET_TP = -1;
const TARGET_LRA = 11;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kind = process.argv[2];
if (!['loop', 'countdown', 'standby'].includes(kind)) {
	console.error('Pakai: node scripts/master-audio.mjs <loop|countdown|standby>');
	process.exit(1);
}
const raw = path.join(root, 'out', `raw-${kind}.mp4`);
if (!fs.existsSync(raw)) {
	console.error(`[master] ${path.relative(root, raw)} tidak ditemukan. Render dulu.`);
	process.exit(1);
}

const run = (args) => {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
	if (r.status !== 0) {
		console.error(r.stderr);
		throw new Error('ffmpeg gagal');
	}
	return r.stderr;
};

const probeDuration = (file) => {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
	return Number.parseFloat(r.stdout);
};

const measure = (file) => {
	const err = run(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
	const summary = err.split('Summary:').pop() ?? '';
	const num = (re) => Number.parseFloat(re.exec(summary)?.[1] ?? 'NaN');
	return {I: num(/I:\s+(-?[\d.]+) LUFS/), TP: num(/Peak:\s+(-?[\d.]+) dBFS/), LRA: num(/LRA:\s+(-?[\d.]+) LU/)};
};

const outName =
	kind === 'loop'
		? 'preshow-loop.mp4'
		: kind === 'standby'
			? 'standby.mp4'
			: `countdown-${Math.max(1, Math.round((probeDuration(raw) - 4) / 60))}m.mp4`;
const out = path.join(root, 'out', outName);

// Pass 1: ukur
const p1 = run(['-i', raw, '-af', `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`, '-f', 'null', '-']);
const json = JSON.parse(p1.slice(p1.lastIndexOf('{'), p1.lastIndexOf('}') + 1));
const inI = Number.parseFloat(json.input_i);
const inTP = Number.parseFloat(json.input_tp);
const offset = TARGET_I - inI;
const linearOk = inTP + offset <= TARGET_TP;

const encode = ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart'];

let mode;
if (linearOk) {
	// Pass 2: loudnorm linear dengan nilai terukur (gain statis)
	mode = 'loudnorm linear';
	const af =
		`loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}` +
		`:measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}` +
		`:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true:print_format=summary`;
	run(['-y', '-i', raw, '-af', af, ...encode, out]);
} else {
	// Puncak transien (impact/final-hit) terlalu tinggi untuk gain linear → gain statis + limiter
	// true-peak (tetap statis di luar transien, sehingga loop tidak "memompa").
	mode = 'static gain + true-peak limiter';
	const af = `volume=${offset.toFixed(2)}dB,alimiter=limit=${Math.pow(10, -2 / 20).toFixed(4)}:attack=3:release=60:level=false:latency=1`;
	run(['-y', '-i', raw, '-af', af, ...encode, out]);
	const m = measure(out);
	const fix = TARGET_I - m.I;
	if (Math.abs(fix) > 0.3) {
		const af2 = `volume=${(offset + fix).toFixed(2)}dB,alimiter=limit=${Math.pow(10, -2 / 20).toFixed(4)}:attack=3:release=60:level=false:latency=1`;
		run(['-y', '-i', raw, '-af', af2, ...encode, out]);
	}
}

const m = measure(out);
const okI = Math.abs(m.I - TARGET_I) <= 1;
const okTP = m.TP <= TARGET_TP + 0.05;
console.log(
	`[master] ${outName}: ${probeDuration(out).toFixed(3)} dtk · ${m.I} LUFS · true peak ${m.TP} dBTP · LRA ${m.LRA} LU · mode: ${mode} ${okI && okTP ? '✓' : '⚠ di luar target'}`,
);
fs.writeFileSync(
	path.join(root, 'out', `${outName}.loudness.json`),
	`${JSON.stringify({file: outName, integratedLufs: m.I, truePeakDbtp: m.TP, lra: m.LRA, mode}, null, 2)}\n`,
);
