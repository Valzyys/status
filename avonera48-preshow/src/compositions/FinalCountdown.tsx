import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AudioBed} from '../audio/AudioBed';
import type {AudioManifest} from '../audio/manifest';
import type {ShowConfig} from '../config/show.config';
import {buildCountdownTimeline, sec} from '../config/timeline';
import {FontGate} from '../components/FontGate';
import {InfoChip} from '../components/InfoChip';
import {Label} from '../components/Label';
import {ShowProvider, useShow} from '../components/ShowContext';
import {StageBackground} from '../components/StageBackground';
import {progress} from '../theme/anim';
import {ease, fonts, mix, rgba, type as typo} from '../theme/tokens';

export type FinalCountdownProps = {
	readonly config: ShowConfig;
	readonly minutes: number;
	readonly audio: AudioManifest | null;
};

const RING = 820;
const STROKE_MAX = 10;
const R = RING / 2 - 20;
const CIRC = 2 * Math.PI * R;

const pad = (n: number) => String(n).padStart(2, '0');

const Inner: React.FC<{minutes: number; audio: AudioManifest | null}> = ({minutes, audio}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {colors} = useShow();
	const tl = useMemo(() => buildCountdownTimeline(minutes), [minutes]);
	const {zeroFrame, totalFrames} = tl;

	const before = frame < zeroFrame;
	const remainingExact = Math.max(0, (zeroFrame - frame) / fps);
	const remaining = Math.ceil(remainingExact - 1e-9);
	const fraction = zeroFrame > 0 ? Math.max(0, (zeroFrame - frame) / zeroFrame) : 0;
	const intensity = Math.pow(1 - fraction, 2);

	// Detik berjalan: 0 di awal tiap detik baru
	const inSecond = ((zeroFrame - frame) % fps + fps) % fps;
	const secondPhase = inSecond === 0 ? 0 : (fps - inSecond) / fps;
	const lastMinute = remaining <= 60;
	const pulse = lastMinute && before ? Math.exp(-secondPhase * 6) : 0;
	const ringColor = lastMinute ? colors.accent : colors.primary;
	const stroke = 2 + (STROKE_MAX - 2) * fraction;

	const finalTen = before && remaining <= 10;
	const introP = progress(frame, 0, 30);

	// Outro
	const flash = interpolate(frame, [zeroFrame, zeroFrame + 4], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const showP = progress(frame, zeroFrame + 2, 24);
	const black = interpolate(frame, [totalFrames - sec(2), totalFrames - 1], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: ease.inOut,
	});

	return (
		<AbsoluteFill>
			<StageBackground loopFrames={Math.max(1, totalFrames)} intensity={before ? intensity : 1} />
			<InfoChip />
			<div style={{position: 'absolute', top: 66, left: 0, right: 0, opacity: before ? 1 : 0}}>
				<Label text="Pre-show" p={introP} align="center" color={colors.text} />
			</div>

			{before ? (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', top: 10}}>
					<svg width={RING} height={RING} style={{position: 'absolute', transform: `scale(${1 + pulse * 0.015})`}}>
						<circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={rgba(colors.text, 0.08)} strokeWidth={2} />
						<circle
							cx={RING / 2}
							cy={RING / 2}
							r={R}
							fill="none"
							stroke={ringColor}
							strokeWidth={stroke}
							strokeLinecap="round"
							strokeDasharray={`${CIRC * fraction * introP} ${CIRC}`}
							transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
							style={{filter: `drop-shadow(0 0 ${10 + pulse * 22}px ${rgba(ringColor, 0.7)})`}}
						/>
					</svg>

					{finalTen ? (
						(() => {
							const p = progress(secondPhase * fps, 0, 10);
							const out = progress(secondPhase * fps, fps - 8, 8, ease.out);
							return (
								<div
									key={remaining}
									style={{
										fontFamily: fonts.display,
										fontWeight: 800,
										fontSize: remaining === 10 ? 400 : 520,
										lineHeight: 1,
										letterSpacing: typo.displayTracking,
										color: remaining <= 3 ? colors.accent : colors.text,
										transform: `scale(${1.25 - 0.25 * p + out * 0.1})`,
										filter: `blur(${(1 - p) * 16 + out * 10}px) drop-shadow(0 0 50px ${rgba(colors.primary, 0.5)})`,
										opacity: Math.min(1, p * 1.5) * (1 - out),
										fontVariantNumeric: 'tabular-nums',
									}}
								>
									{remaining}
								</div>
							);
						})()
					) : (
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: introP}}>
							<div
								style={{
									fontFamily: fonts.body,
									fontWeight: 600,
									fontSize: 34,
									color: colors.muted,
									marginBottom: 14,
								}}
							>
								Show dimulai dalam
							</div>
							<div
								style={{
									fontFamily: fonts.display,
									fontWeight: 800,
									fontSize: 178,
									lineHeight: 1,
									letterSpacing: '-0.02em',
									color: colors.text,
									fontVariantNumeric: 'tabular-nums',
									textShadow: `0 0 ${30 + pulse * 30}px ${rgba(ringColor, 0.35 + pulse * 0.3)}`,
								}}
							>
								{pad(Math.floor(remaining / 60))}
								<span style={{color: ringColor}}>:</span>
								{pad(remaining % 60)}
							</div>
						</div>
					)}
				</AbsoluteFill>
			) : (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
					<div
						style={{
							fontFamily: fonts.display,
							fontWeight: 800,
							fontSize: 170,
							letterSpacing: typo.displayTracking,
							backgroundImage: `linear-gradient(90deg, ${colors.text}, ${mix(colors.text, colors.primary, 0.6)})`,
							backgroundClip: 'text',
							WebkitBackgroundClip: 'text',
							color: 'transparent',
							transform: `scale(${1.15 - 0.15 * showP})`,
							filter: `blur(${(1 - showP) * 20}px) drop-shadow(0 0 60px ${rgba(colors.primary, 0.5)})`,
							opacity: showP,
						}}
					>
						SHOW DIMULAI
					</div>
				</AbsoluteFill>
			)}

			<AbsoluteFill style={{backgroundColor: '#FFFFFF', opacity: flash * (frame >= zeroFrame ? 1 : 0)}} />
			<AbsoluteFill style={{backgroundColor: '#000000', opacity: black}} />

			{audio ? (
				<AudioBed
					manifest={audio}
					bgm="countdown"
					loopFrames={null}
					sfx={tl.sfx}
					vo={tl.vo}
					bgmBoostDbAt={(f) => 2 * progress(f, zeroFrame - sec(10), sec(10))}
					bgmEnvelopeAt={(f) =>
						interpolate(f, [zeroFrame - 2, zeroFrame + 6], [1, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						})
					}
					masterAt={(f) => 1 - interpolate(f, [totalFrames - sec(2), totalFrames - 1], [0, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})}
				/>
			) : null}
		</AbsoluteFill>
	);
};

export const FinalCountdown: React.FC<FinalCountdownProps> = ({config, minutes, audio}) => (
	<ShowProvider config={config}>
		<FontGate>
			<Inner minutes={minutes} audio={audio} />
		</FontGate>
	</ShowProvider>
);
