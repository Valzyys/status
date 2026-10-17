import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {INTERLUDE_PHRASES} from '../config/timeline';
import {Curtain} from '../components/Curtain';
import {useShow} from '../components/ShowContext';
import {useFitFontSize} from '../components/useFit';
import {progress} from '../theme/anim';
import {ease, fonts, mix, rgba, type as typo, withAlpha} from '../theme/tokens';

const TRUSS_Y = 170;
const LAMP_X0 = 560;
const LAMP_GAP = 200;

const Lamp: React.FC<{x: number; on: number; index: number}> = ({x, on, index}) => {
	const {colors} = useShow();
	const warm = mix(colors.text, colors.accent, 0.4);
	const tilt = (960 - x) * 0.012; // derajat, condong ke tengah
	const dir = 180 - tilt;
	const spread = 17;
	const a = 0.24 * on;
	const floorX = x + Math.tan((tilt * Math.PI) / 180) * 700;
	return (
		<>
			{on > 0 ? (
				<AbsoluteFill
					style={{
						background: `conic-gradient(from ${dir - spread / 2}deg at ${x}px ${TRUSS_Y + 62}px, transparent 0deg, ${withAlpha(warm, a * 0.35)} ${spread * 0.3}deg, ${withAlpha(warm, a)} ${spread * 0.5}deg, ${withAlpha(warm, a * 0.35)} ${spread * 0.7}deg, transparent ${spread}deg, transparent 360deg)`,
						maskImage: `linear-gradient(to bottom, transparent ${TRUSS_Y + 50}px, black ${TRUSS_Y + 90}px, rgba(0,0,0,0.6) 85%, transparent 100%)`,
						mixBlendMode: 'screen',
					}}
				/>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: floorX - 170,
					top: 860,
					width: 340,
					height: 80,
					borderRadius: '50%',
					background: `radial-gradient(ellipse, ${withAlpha(warm, 0.3 * on)}, transparent 70%)`,
				}}
			/>
			{/* Kepala lampu */}
			<div
				style={{
					position: 'absolute',
					left: x - 24,
					top: TRUSS_Y + 6,
					width: 48,
					height: 56,
					borderRadius: 10,
					background: mix(colors.surface, colors.bg, 0.3),
					border: `1px solid ${rgba(colors.text, 0.12)}`,
					transform: `rotate(${-tilt}deg)`,
					transformOrigin: '50% 0%',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 8,
						bottom: -6,
						width: 32,
						height: 14,
						borderRadius: '50%',
						background: on > 0 ? withAlpha(warm, 0.4 + 0.6 * on) : rgba(colors.text, 0.08),
						boxShadow: on > 0 ? `0 0 ${24 + index}px ${8 * on}px ${withAlpha(warm, 0.55 * on)}` : 'none',
					}}
				/>
			</div>
		</>
	);
};

export const StageInterlude: React.FC<{cues: CueMap['interlude']; durationInFrames: number}> = ({
	cues,
	durationInFrames,
}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();

	const dolly = 1 + 0.07 * progress(frame, 0, durationInFrames, ease.inOut);
	const lampsOn = cues.lamps.map((at) =>
		interpolate(frame, [at, at + 3, at + 6, at + 10], [0, 0.95, 0.35, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}),
	);
	const totalLight = lampsOn.reduce((a, b) => a + b, 0) / Math.max(1, lampsOn.length);
	const trussP = progress(frame, 0, 30);

	const longest = INTERLUDE_PHRASES.reduce((a, b) => (a.length > b.length ? a : b), '');
	const phraseSize = useFitFontSize(longest, 1300, {
		fontFamily: fonts.display,
		fontWeight: 800,
		letterSpacing: typo.displayTracking,
		max: 150,
		min: 90,
	});

	return (
		<AbsoluteFill style={{transform: `scale(${dolly})`, transformOrigin: '50% 58%'}}>
			{/* Rangka lampu */}
			<div
				style={{
					position: 'absolute',
					left: 420,
					top: TRUSS_Y,
					width: 1080 * trussP,
					height: 8,
					borderRadius: 4,
					background: `linear-gradient(to bottom, ${rgba(colors.text, 0.22)}, ${rgba(colors.text, 0.05)})`,
				}}
			/>
			{lampsOn.map((on, i) => (
				<Lamp key={i} x={LAMP_X0 + i * LAMP_GAP} on={on} index={i} />
			))}
			<Curtain light={totalLight} />

			{cues.phrases.map((ph, i) => {
				const local = frame - ph.from;
				if (local < -2 || local > ph.duration + 2) return null;
				const text = INTERLUDE_PHRASES[i] ?? '';
				const words = text.split(' ');
				const exit = progress(frame, ph.from + ph.duration - 16, 16, ease.out);
				const idxP = progress(frame, ph.from, 18);
				return (
					<AbsoluteFill
						key={text}
						style={{
							justifyContent: 'center',
							alignItems: 'center',
							opacity: 1 - exit,
							filter: exit > 0 ? `blur(${exit * 14}px)` : undefined,
							transform: `translateY(${-exit * 30}px)`,
						}}
					>
						<div
							style={{
								fontFamily: fonts.body,
								fontWeight: 700,
								fontSize: 22,
								letterSpacing: typo.labelTracking,
								color: colors.accent,
								opacity: idxP,
								marginBottom: 26,
								marginTop: 80,
							}}
						>
							{`0${i + 1} / 0${INTERLUDE_PHRASES.length}`}
						</div>
						<div
							style={{
								display: 'flex',
								gap: '0.28em',
								fontFamily: fonts.display,
								fontWeight: 800,
								fontSize: phraseSize,
								letterSpacing: typo.displayTracking,
								color: colors.text,
								textShadow: `0 0 50px ${rgba(colors.primary, 0.35)}`,
							}}
						>
							{words.map((w, k) => {
								const p = progress(frame, ph.from + 4 + k * 4, 22);
								return (
									<span key={k} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em'}}>
										<span
											style={{
												display: 'inline-block',
												transform: `translateY(${(1 - p) * 105}%)`,
												filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
												color: k === words.length - 1 ? undefined : rgba(colors.text, 0.92),
											}}
										>
											{w}
										</span>
									</span>
								);
							})}
						</div>
					</AbsoluteFill>
				);
			})}
		</AbsoluteFill>
	);
};
