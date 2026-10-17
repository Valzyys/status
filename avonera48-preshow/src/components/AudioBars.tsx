import React from 'react';
import {noise2D} from '@remotion/noise';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {mix} from '../theme/tokens';
import {useShow} from './ShowContext';

const BARS = 64;
const BAR_W = 6;
const BAR_GAP = 7;

type Props = {
	readonly src: string | null;
	/** Frame absolut BGM (BGM mulai di frame 0 composition). */
	readonly audioFrame: number;
	readonly height: number;
	readonly p: number;
};

const Bars: React.FC<{values: number[]; height: number; p: number}> = ({values, height, p}) => {
	const {colors} = useShow();
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: BAR_GAP, height}}>
			{values.map((v, i) => {
				const t = i / (values.length - 1);
				const env = Math.sin(Math.PI * t) * 0.75 + 0.25;
				const h = Math.max(4, v * env * height * p);
				return (
					<div
						key={i}
						style={{
							width: BAR_W,
							height: h,
							borderRadius: BAR_W / 2,
							background: mix(colors.primary, colors.accent, t),
							opacity: p,
						}}
					/>
				);
			})}
		</div>
	);
};

const ReactiveBars: React.FC<Props & {src: string}> = ({src, audioFrame, height, p}) => {
	const {fps} = useVideoConfig();
	const audioData = useAudioData(src);
	if (!audioData) return <Bars values={new Array<number>(BARS).fill(0)} height={height} p={p} />;
	const raw = visualizeAudio({fps, frame: audioFrame, audioData, numberOfSamples: 128, optimizeFor: 'speed'});
	// Spektrum frekuensi rendah lebih energik; mirror supaya simetris.
	const half = raw.slice(0, BARS / 2).map((v) => Math.min(1, Math.sqrt(v) * 1.6));
	const values = [...half.slice().reverse(), ...half];
	return <Bars values={values} height={height} p={p} />;
};

const FallbackBars: React.FC<Omit<Props, 'src'>> = ({height, p}) => {
	const frame = useCurrentFrame();
	const values = Array.from({length: BARS}, (_, i) => 0.25 + 0.6 * (0.5 + 0.5 * noise2D('bars', i * 0.18, frame * 0.06)));
	return <Bars values={values} height={height} p={p} />;
};

/** Visualizer tipis reaktif ke BGM; fallback ke gerak noise bila BGM tidak ada. */
export const AudioBars: React.FC<Props> = (props) =>
	props.src ? <ReactiveBars {...props} src={props.src} /> : <FallbackBars {...props} />;
