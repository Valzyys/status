import {staticFile} from 'remotion';
import type {SfxName} from '../config/timeline';
import type {VoId} from '../config/vo';

// Manifest ditulis oleh scripts/build-manifest.mjs (bagian dari `npm run audio`).
// Berisi file yang benar-benar ada + durasi + loudness, sehingga composition tahu
// aset mana yang bisa diputar tanpa crash.

export type AudioAsset = {
	readonly file: string;
	readonly duration: number;
	readonly lufs?: number | null;
	readonly generated?: boolean;
};

export type BgmKind = 'loop' | 'standby' | 'countdown';

export type AudioManifest = {
	readonly bgm: Partial<Record<BgmKind, AudioAsset>>;
	readonly sfx: Partial<Record<SfxName, AudioAsset>>;
	readonly vo: Partial<Record<VoId, AudioAsset>>;
};

export const EMPTY_MANIFEST: AudioManifest = {bgm: {}, sfx: {}, vo: {}};

export const loadManifest = async (): Promise<AudioManifest> => {
	try {
		const res = await fetch(staticFile('audio/manifest.json'));
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = (await res.json()) as Partial<AudioManifest>;
		return {bgm: json.bgm ?? {}, sfx: json.sfx ?? {}, vo: json.vo ?? {}};
	} catch (err) {
		console.warn(
			'[audio] public/audio/manifest.json tidak ditemukan — render tanpa audio. Jalankan `npm run audio`.',
			err,
		);
		return EMPTY_MANIFEST;
	}
};
