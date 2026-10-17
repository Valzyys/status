import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AudioBed} from '../audio/AudioBed';
import type {AudioManifest} from '../audio/manifest';
import type {ShowConfig} from '../config/show.config';
import {STANDBY_SECONDS, sec} from '../config/timeline';
import {FontGate} from '../components/FontGate';
import {InfoChip} from '../components/InfoChip';
import {LiveBadge} from '../components/LiveBadge';
import {ShowProvider, useShow} from '../components/ShowContext';
import {StageBackground} from '../components/StageBackground';
import {useFitFontSize} from '../components/useFit';
import {fonts, mix, rgba, type as typo} from '../theme/tokens';

export type StandbyProps = {
	readonly config: ShowConfig;
	readonly audio: AudioManifest | null;
};

const LOOP = sec(STANDBY_SECONDS);
const PILLS = 9;
const CHASE = sec(1.5); // 900 / 45 = 20 putaran → mulus

/** Loader: deretan "lampu" yang menyala bergelombang (bukan spinner). */
const LightChase: React.FC = () => {
	const frame = useCurrentFrame();
	const {colors} = useShow();
	const t = (frame % CHASE) / CHASE;
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 14, height: 64}}>
			{Array.from({length: PILLS}, (_, i) => {
				const phase = (t - i / PILLS + 1) % 1;
				const v = Math.pow(Math.max(0, Math.cos(phase * Math.PI * 2)), 1.5);
				return (
					<div
						key={i}
						style={{
							width: 10,
							height: 18 + 44 * v,
							borderRadius: 5,
							background: mix(colors.primary, colors.accent, i / (PILLS - 1)),
							opacity: 0.25 + 0.75 * v,
							boxShadow: `0 0 ${18 * v}px ${rgba(colors.accent, 0.6 * v)}`,
						}}
					/>
				);
			})}
		</div>
	);
};

const Inner: React.FC<{audio: AudioManifest | null}> = ({audio}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();
	const title = 'MOHON TUNGGU SEBENTAR';
	const size = useFitFontSize(title, 1500, {
		fontFamily: fonts.display,
		fontWeight: 800,
		letterSpacing: typo.displayTracking,
		max: 112,
		min: 70,
	});
	const breathe = 1 + 0.008 * (1 - Math.cos((frame / sec(7.5)) * Math.PI * 2));

	return (
		<AbsoluteFill>
			<StageBackground loopFrames={LOOP} particles={44} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<LightChase />
				<div
					style={{
						marginTop: 54,
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize: size,
						letterSpacing: typo.displayTracking,
						color: colors.text,
						transform: `scale(${breathe})`,
						textShadow: `0 0 40px ${rgba(colors.primary, 0.3)}`,
					}}
				>
					{title}
				</div>
				<div style={{marginTop: 24, fontFamily: fonts.body, fontWeight: 500, fontSize: 38, color: colors.muted}}>
					Kami sedang menyiapkan tayangan terbaik untukmu
				</div>
			</AbsoluteFill>
			<InfoChip />
			<LiveBadge label="STANDBY" />
			{audio ? <AudioBed manifest={audio} bgm="standby" loopFrames={LOOP} sfx={[]} vo={[]} /> : null}
		</AbsoluteFill>
	);
};

export const Standby: React.FC<StandbyProps> = ({config, audio}) => (
	<ShowProvider config={config}>
		<FontGate>
			<Inner audio={audio} />
		</FontGate>
	</ShowProvider>
);
