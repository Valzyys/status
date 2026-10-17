// Voice over via edge-tts (Python). Teks diambil dari src/config (sapaan otomatis dari jam show).
// Wajib dijalankan ulang tiap kali show.time / greeting / venue berubah (sudah termasuk `npm run audio`).
// Gagal (tidak ada internet / edge-tts tidak terpasang) → warning, render tetap jalan tanpa VO.
// Teks juga disimpan sebagai .txt supaya bisa direkam manual dengan nama file yang sama (vo1.mp3, dst).
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveGreeting} from '../src/config/greeting.ts';
import {showConfig} from '../src/config/show.config.ts';
import {buildVoScripts} from '../src/config/vo.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/audio/vo');
const VOICES = ['id-ID-GadisNeural', 'id-ID-ArdiNeural'];
const RATE = '-5%';
const TARGET_LUFS = -16;

const greeting = resolveGreeting(showConfig.show);
const scripts = buildVoScripts({greeting, venue: showConfig.show.venue});
fs.mkdirSync(outDir, {recursive: true});

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const findCli = () => {
	for (const cmd of [['edge-tts'], ['python3', '-m', 'edge_tts'], ['python', '-m', 'edge_tts']]) {
		const r = spawnSync(cmd[0], [...cmd.slice(1), '--help'], {stdio: 'ignore'});
		if (r.status === 0) return cmd;
	}
	return null;
};

const cli = findCli();
if (!cli) {
	console.warn('[vo] ⚠ edge-tts tidak ditemukan (pip install edge-tts). Lanjut tanpa VO baru.');
}

const proxyArgs = process.env.HTTPS_PROXY ? ['--proxy', process.env.HTTPS_PROXY] : [];
let ok = 0;
let failed = 0;

for (const [id, text] of Object.entries(scripts)) {
	fs.writeFileSync(path.join(outDir, `${id}.txt`), `${text}\n`);
	const mp3 = path.join(outDir, `${id}.mp3`);
	const metaFile = path.join(outDir, `${id}.meta.json`);
	const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : null;
	const textHash = hash(text);

	if (meta && meta.hash === textHash && fs.existsSync(mp3)) {
		ok++;
		continue; // sudah up to date
	}

	let generated = false;
	if (cli) {
		const raw = path.join(outDir, `${id}.raw.mp3`);
		for (const voice of VOICES) {
			const r = spawnSync(
				cli[0],
				[...cli.slice(1), '--voice', voice, `--rate=${RATE}`, '--text', text, '--write-media', raw, ...proxyArgs],
				{encoding: 'utf8', timeout: 60_000},
			);
			if (r.status === 0 && fs.existsSync(raw) && fs.statSync(raw).size > 1000) {
				// Normalisasi loudness + 48 kHz
				const ff = spawnSync(
					'ffmpeg',
					['-y', '-loglevel', 'error', '-i', raw, '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11,aresample=48000`, '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '192k', mp3],
					{encoding: 'utf8'},
				);
				fs.rmSync(raw, {force: true});
				if (ff.status === 0) {
					fs.writeFileSync(metaFile, JSON.stringify({generator: 'edge-tts', voice, rate: RATE, hash: textHash, text}, null, 2));
					console.log(`[vo] ${id}.mp3 (${voice})`);
					generated = true;
					break;
				}
			}
			fs.rmSync(raw, {force: true});
			const reason = (r.stderr || r.error?.message || '').trim().split('\n').pop();
			console.warn(`[vo] ⚠ ${id}: ${voice} gagal${reason ? ` — ${reason}` : ''}`);
		}
	}

	if (!generated) {
		failed++;
		if (meta?.generator === 'edge-tts' && fs.existsSync(mp3)) {
			// File lama hasil TTS dengan teks berbeda (mis. sapaan berubah) → hapus supaya tidak salah ucap.
			fs.rmSync(mp3, {force: true});
			fs.rmSync(metaFile, {force: true});
			console.warn(`[vo] ⚠ ${id}.mp3 lama dihapus karena teksnya sudah tidak sesuai.`);
		} else if (fs.existsSync(mp3)) {
			console.warn(`[vo] ${id}.mp3 (rekaman manual) tetap dipakai — pastikan isinya sesuai ${id}.txt.`);
		}
	} else {
		ok++;
	}
}

console.log(`[vo] sapaan: "${greeting}" · ${ok} siap, ${failed} gagal. Teks naskah: public/audio/vo/*.txt`);
if (failed > 0) {
	console.warn('[vo] ⚠ Render tetap berjalan; VO yang tidak ada akan dilewati (BGM tidak di-duck di bagian itu).');
}
