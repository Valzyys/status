import React from 'react';
import {Html5Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {SfxCue, VoCue} from '../config/timeline';
import type {AudioManifest, BgmKind} from './manifest';

// Level mix (lihat PROMPT §8.4). Sumber dinormalisasi ke referensi LUFS di bawah lewat
// trim otomatis dari manifest, lalu gain relatif ini diterapkan.
const BGM_DB = -18;
const BGM_DUCK_DB = -28;
const VO_DB = -6;
const BGM_REF_LUFS = -10;
const VO_REF_LUFS = -16;
const DUCK_DOWN_FRAMES = 8;
const DUCK_UP_FRAMES = 15;
/** Panjang crossfade di titik loop untuk BGM yang durasinya tidak pas dengan loop. */
const LOOP_XFADE_SECONDS = 3;

export const dbToGain = (db: number): number => Math.pow(10, db / 20);

const trimDb = (lufs: number | null | undefined, ref: number): number =>
	typeof lufs === 'number' && Number.isFinite(lufs) ? Math.max(-12, Math.min(12, ref - lufs)) : 0;

/** Cue VO dengan frame absolut. */
export type AbsVo = VoCue;
/** Cue SFX dengan frame absolut. */
export type AbsSfx = SfxCue;

export type AudioBedProps = {
	readonly manifest: AudioManifest;
	readonly bgm: BgmKind;
	/** Panjang loop (frame) untuk BGM yang harus nyambung mulus; null = tidak looping. */
	readonly loopFrames: number | null;
	readonly sfx: readonly AbsSfx[];
	readonly vo: readonly AbsVo[];
	/** Penguatan tambahan BGM (dB) per frame absolut. */
	readonly bgmBoostDbAt?: (frame: number) => number;
	/** Pengali volume akhir BGM (0–1) per frame absolut, mis. fade out. */
	readonly bgmEnvelopeAt?: (frame: number) => number;
	/** Pengali master (0–1) untuk semua suara per frame absolut. */
	readonly masterAt?: (frame: number) => number;
};

export const AudioBed: React.FC<AudioBedProps> = ({
	manifest,
	bgm,
	loopFrames,
	sfx,
	vo,
	bgmBoostDbAt,
	bgmEnvelopeAt,
	masterAt,
}) => {
	const {fps} = useVideoConfig();
	const master = (f: number) => (masterAt ? masterAt(f) : 1);

	// --- Interval VO untuk ducking
	const voPlaced = vo.flatMap((cue) => {
		const asset = manifest.vo[cue.vo];
		if (!asset) return [];
		const end = cue.at + Math.ceil(asset.duration * fps);
		return [{cue, asset, end}];
	});
	const duckAt = (f: number): number => {
		let d = 0;
		for (const {cue, end} of voPlaced) {
			let v = 0;
			if (f >= cue.at - DUCK_DOWN_FRAMES && f < cue.at) v = (f - (cue.at - DUCK_DOWN_FRAMES)) / DUCK_DOWN_FRAMES;
			else if (f >= cue.at && f <= end) v = 1;
			else if (f > end && f < end + DUCK_UP_FRAMES) v = 1 - (f - end) / DUCK_UP_FRAMES;
			d = Math.max(d, v);
		}
		return d;
	};

	const bgmAsset = manifest.bgm[bgm];
	const bgmTrim = bgmAsset ? trimDb(bgmAsset.lufs, BGM_REF_LUFS) : 0;
	const bgmGainAt = (f: number): number => {
		const db = BGM_DB + (BGM_DUCK_DB - BGM_DB) * duckAt(f) + (bgmBoostDbAt ? bgmBoostDbAt(f) : 0) + bgmTrim;
		return Math.min(1, dbToGain(db) * (bgmEnvelopeAt ? bgmEnvelopeAt(f) : 1) * master(f));
	};

	const renderBgm = () => {
		if (!bgmAsset) return null;
		const src = staticFile(bgmAsset.file);
		const durFrames = Math.round(bgmAsset.duration * fps);
		const exact = loopFrames !== null && Math.abs(durFrames - loopFrames) <= 1;
		if (loopFrames === null || exact) {
			return (
				<Html5Audio
					src={src}
					loop={loopFrames === null}
					loopVolumeCurveBehavior="extend"
					volume={(f) => bgmGainAt(f)}
				/>
			);
		}
		// Durasi BGM tidak pas dengan loop → crossfade di titik loop:
		// awal video memutar "ekor" musik (posisi = loopFrames mod durasi) yang memudar,
		// sementara musik dari awal masuk. Frame terakhir video → frame 0 jadi kontinu.
		const xf = Math.round(LOOP_XFADE_SECONDS * fps);
		const tailStart = loopFrames % durFrames;
		const fadeIn = (f: number) => (f >= xf ? 1 : Math.sin(((f / xf) * Math.PI) / 2));
		const fadeOut = (f: number) => (f >= xf ? 0 : Math.cos(((f / xf) * Math.PI) / 2));
		return (
			<>
				<Html5Audio
					src={src}
					loop
					loopVolumeCurveBehavior="extend"
					volume={(f) => bgmGainAt(f) * fadeIn(f)}
				/>
				<Sequence durationInFrames={xf} name="BGM loop tail">
					<Html5Audio src={src} loop trimBefore={tailStart} volume={(f) => bgmGainAt(f) * fadeOut(f)} />
				</Sequence>
			</>
		);
	};

	return (
		<>
			{renderBgm()}
			{sfx.map((cue, i) => {
				const asset = manifest.sfx[cue.sfx];
				if (!asset) return null;
				return (
					<Sequence
						key={`sfx-${i}`}
						from={cue.at}
						durationInFrames={Math.ceil(asset.duration * fps) + 1}
						name={`SFX ${cue.sfx}`}
					>
						<Html5Audio src={staticFile(asset.file)} volume={(f) => dbToGain(cue.gainDb) * master(cue.at + f)} />
					</Sequence>
				);
			})}
			{voPlaced.map(({cue, asset}, i) => {
				const gain = dbToGain(VO_DB + trimDb(asset.lufs, VO_REF_LUFS));
				return (
					<Sequence
						key={`vo-${i}`}
						from={cue.at}
						durationInFrames={Math.ceil(asset.duration * fps) + 1}
						name={`VO ${cue.vo}`}
					>
						<Html5Audio src={staticFile(asset.file)} volume={(f) => Math.min(1, gain * master(cue.at + f))} />
					</Sequence>
				);
			})}
		</>
	);
};
