// Pindai public/audio → public/audio/manifest.json (file yang ada + durasi + loudness).
// Dipanggil otomatis oleh `npm run audio` dan sebelum tiap render.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const SFX = [
	'riser', 'impact', 'soft-hit', 'whoosh-in', 'whoosh-out', 'shimmer', 'tick',
	'tick-1', 'tick-2', 'tick-3', 'tick-4', 'tick-5', 'pop', 'swell', 'beep', 'beep-high', 'final-hit',
];
const VO = ['vo1', 'vo2', 'vo3', 'vo-countdown'];
const EXT = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];

const duration = (file) => {
	const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
	const d = Number.parseFloat(r.stdout);
	return Number.isFinite(d) ? Math.round(d * 1000) / 1000 : null;
};

const lufs = (file) => {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'});
	const m = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr.split('Summary:').pop() ?? '');
	return m ? Number.parseFloat(m[1]) : null;
};

const firstExisting = (candidates) => candidates.find((rel) => fs.existsSync(path.join(pub, rel)));

const asset = (rel, {measure = false, generated} = {}) => {
	const abs = path.join(pub, rel);
	const d = duration(abs);
	if (d === null) {
		console.warn(`[manifest] ⚠ tidak bisa membaca ${rel}, dilewati`);
		return null;
	}
	const out = {file: rel.split(path.sep).join('/'), duration: d};
	if (measure) out.lufs = lufs(abs);
	if (generated !== undefined) out.generated = generated;
	return out;
};

const manifest = {bgm: {}, sfx: {}, vo: {}};

const bgmSources = {
	loop: [...EXT.map((e) => `audio/bgm/bgm.${e}`)],
	standby: [...EXT.map((e) => `audio/bgm/bgm-standby.${e}`)],
	countdown: [...EXT.map((e) => `audio/bgm/bgm-countdown.${e}`)],
};
for (const [kind, userFiles] of Object.entries(bgmSources)) {
	const user = firstExisting(userFiles);
	const gen = firstExisting([`audio/bgm/generated/${kind}.wav`]);
	const rel = user ?? gen;
	if (!rel) {
		console.warn(`[manifest] ⚠ BGM ${kind} tidak ada (jalankan npm run audio)`);
		continue;
	}
	const a = asset(rel, {measure: true, generated: !user});
	if (a) manifest.bgm[kind] = a;
}

for (const name of SFX) {
	const rel = firstExisting([`audio/sfx/${name}.wav`]);
	if (!rel) continue;
	const a = asset(rel);
	if (a) manifest.sfx[name] = a;
}

for (const id of VO) {
	const rel = firstExisting(EXT.map((e) => `audio/vo/${id}.${e}`));
	if (!rel) continue;
	const a = asset(rel, {measure: true});
	if (a) manifest.vo[id] = a;
}

fs.writeFileSync(path.join(pub, 'audio/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const bgmInfo = Object.entries(manifest.bgm)
	.map(([k, v]) => `${k}=${path.basename(v.file)}${v.generated ? ' (generated)' : ''}`)
	.join(', ');
console.log(
	`[manifest] BGM: ${bgmInfo || '-'} · SFX: ${Object.keys(manifest.sfx).length} · VO: ${Object.keys(manifest.vo).join(', ') || 'tidak ada'}`,
);
