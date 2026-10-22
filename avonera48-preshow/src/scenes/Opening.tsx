import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {useShow} from '../components/ShowContext';
import {useFitFontSize} from '../components/useFit';
import {progress} from '../theme/anim';
import {SAFE, WIDTH, ease, fonts, mix, rgba, type as typo, withAlpha} from '../theme/tokens';

const LEFT = 200;
const SUBTITLE = 'Show akan segera dimulai';

export const Opening: React.FC<{cues: CueMap['opening']}> = ({cues}) => {
	const frame = useCurrentFrame();
	const {colors, greeting} = useShow();
	const word = greeting.toUpperCase();

	// --- Beam yang menyapu kiri → kanan lalu mengendap di belakang judul
	const sweep = progress(frame, cues.beamStart, cues.beamEnd - cues.beamStart, ease.inOut);
	const dir = interpolate(sweep, [0, 1], [236, 196]);
	const beamAlpha =
		interpolate(frame, [cues.beamStart, cues.beamStart + 20, cues.beamEnd, cues.beamEnd + 30], [0, 0.34, 0.34, 0.14], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	const warm = mix(colors.text, colors.accent, 0.3);

	// --- Judul
	const fontSize = useFitFontSize(word, WIDTH - LEFT - SAFE.x - 80, {
		fontFamily: fonts.display,
		fontWeight: 800,
		letterSpacing: typo.displayTracking,
		max: 250,
		min: 120,
	});
	const preP = progress(frame, cues.titleStart - 8, 22);
	const bloom = interpolate(
		frame,
		[cues.titleFull - 4, cues.titleFull + 4, cues.titleFull + 40],
		[0, 1, 0.35],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
	const lineP = progress(frame, cues.titleFull, 26);

	// --- Subjudul diketik per huruf
	const typed = Math.max(0, Math.min(SUBTITLE.length, Math.floor((frame - cues.subtitleStart) / 2)));
	const caretOn = frame >= cues.subtitleStart - 10 && Math.floor(frame / 15) % 2 === 0;
	const subP = progress(frame, cues.subtitleStart - 10, 10);

	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `conic-gradient(from ${dir - 11}deg at 1180px -120px, transparent 0deg, ${withAlpha(warm, beamAlpha * 0.3)} 6deg, ${withAlpha(warm, beamAlpha)} 11deg, ${withAlpha(warm, beamAlpha * 0.3)} 16deg, transparent 22deg, transparent 360deg)`,
					maskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
					mixBlendMode: 'screen',
				}}
			/>
			{/* Bloom di belakang judul */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 700px 260px at ${LEFT + 420}px 520px, ${rgba(colors.primary, 0.32 * bloom)}, transparent 70%)`,
				}}
			/>
			<div style={{position: 'absolute', left: LEFT, top: 330}}>
				<div
					style={{
						fontFamily: fonts.display,
						fontWeight: 600,
						fontSize: 46,
						letterSpacing: '0.42em',
						color: colors.muted,
						opacity: preP,
						transform: `translateY(${(1 - preP) * 24}px)`,
						filter: preP < 1 ? `blur(${(1 - preP) * 10}px)` : undefined,
						marginBottom: 6,
					}}
				>
					SELAMAT
				</div>
				<div
					style={{
						display: 'flex',
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize,
						lineHeight: 1.05,
						letterSpacing: typo.displayTracking,
						filter: `drop-shadow(0 0 ${40 * bloom}px ${rgba(colors.primary, 0.75 * bloom)})`,
					}}
				>
					{word.split('').map((ch, i) => {
						const p = progress(frame, cues.titleStart + i * 3, 18);
						return (
							<span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0 0.02em 0.06em'}}>
								<span
									style={{
										display: 'inline-block',
										transform: `translateY(${(1 - p) * 105}%)`,
										filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
										backgroundImage: `linear-gradient(180deg, ${colors.text} 35%, ${mix(colors.text, colors.primary, 0.55)} 100%)`,
										backgroundClip: 'text',
										WebkitBackgroundClip: 'text',
										color: 'transparent',
									}}
								>
									{ch}
								</span>
							</span>
						);
					})}
				</div>
				<div
					style={{
						marginTop: 22,
						width: 460 * lineP,
						height: 3,
						background: `linear-gradient(90deg, ${colors.primary}, ${rgba(colors.primary, 0)})`,
					}}
				/>
				<div
					style={{
						marginTop: 34,
						height: 56,
						display: 'flex',
						alignItems: 'center',
						fontFamily: fonts.body,
						fontWeight: 500,
						fontSize: 42,
						color: rgba(colors.text, 0.82),
						opacity: subP,
					}}
				>
					<span>{SUBTITLE.slice(0, typed)}</span>
					<span
						style={{
							width: 3,
							height: 44,
							marginLeft: 6,
							background: colors.accent,
							opacity: caretOn ? 1 : 0,
						}}
					/>
				</div>
			</div>
		</AbsoluteFill>
	);
};
