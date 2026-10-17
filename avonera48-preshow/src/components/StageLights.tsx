import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {sec} from '../config/timeline';
import {mix, rgba, withAlpha} from '../theme/tokens';
import {useShow} from './ShowContext';

type Beam = {
	readonly x: number;
	readonly tilt: number;
	readonly amp: number;
	/** Periode sway (frame). Semua periode membagi habis 30 dtk & 180 dtk → loop mulus. */
	readonly period: number;
	readonly phase: number;
	readonly spread: number;
	readonly color: string;
	readonly alpha: number;
};

export type StageLightsProps = {
	/** 0–1: gerak tambahan (scene Stay Tuned). */
	readonly activity?: number;
	/** 0–1: intensitas cahaya (FinalCountdown makin terang). */
	readonly intensity?: number;
};

/**
 * Sorot lampu panggung volumetrik dari atas (conic-gradient, tanpa blur filter → ringan dirender).
 */
export const StageLights: React.FC<StageLightsProps> = React.memo(({activity = 0, intensity = 0}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();

	const beams = useMemo<Beam[]>(() => {
		const warm = mix(colors.text, colors.accent, 0.35);
		const rose = mix(colors.text, colors.primary, 0.55);
		return [
			{x: 170, tilt: 24, amp: 7, period: sec(10), phase: 0.3, spread: 15, color: warm, alpha: 0.13},
			{x: 560, tilt: 10, amp: 9, period: sec(7.5), phase: 1.9, spread: 12, color: rose, alpha: 0.12},
			{x: 840, tilt: 4, amp: 6, period: sec(15), phase: 4.1, spread: 10, color: warm, alpha: 0.1},
			{x: 1080, tilt: -4, amp: 6, period: sec(15), phase: 0.9, spread: 10, color: warm, alpha: 0.1},
			{x: 1360, tilt: -10, amp: 9, period: sec(7.5), phase: 3.3, spread: 12, color: rose, alpha: 0.12},
			{x: 1750, tilt: -24, amp: 7, period: sec(10), phase: 5.2, spread: 15, color: warm, alpha: 0.13},
		];
	}, [colors]);

	const alphaMul = 1 + intensity * 1.4 + activity * 0.5;
	const fast = Math.sin((frame / sec(3)) * Math.PI * 2);

	return (
		<AbsoluteFill style={{mixBlendMode: 'screen'}}>
			{beams.map((b, i) => {
				const sway =
					b.amp * (1 + activity * 0.6) * Math.sin((frame / b.period) * Math.PI * 2 + b.phase) +
					activity * 9 * fast * (i % 2 === 0 ? 1 : -1);
				const dir = 180 - (b.tilt + sway);
				const s = b.spread;
				const a = Math.min(0.42, b.alpha * alphaMul);
				return (
					<AbsoluteFill
						key={i}
						style={{
							background: `conic-gradient(from ${dir - s / 2}deg at ${b.x}px -60px, transparent 0deg, ${withAlpha(b.color, a * 0.25)} ${s * 0.25}deg, ${withAlpha(b.color, a)} ${s * 0.5}deg, ${withAlpha(b.color, a * 0.25)} ${s * 0.75}deg, transparent ${s}deg, transparent 360deg)`,
							maskImage:
								'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.15) 85%, transparent 100%)',
						}}
					/>
				);
			})}
			{/* Hotspot sumber lampu */}
			<AbsoluteFill
				style={{
					background: beams
						.map(
							(b) =>
								`radial-gradient(circle at ${b.x}px 0px, ${withAlpha(b.color, Math.min(0.5, 0.22 * alphaMul))} 0px, transparent 70px)`,
						)
						.join(', '),
				}}
			/>
			{/* Pantulan di lantai panggung */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 900px 150px at 50% 104%, ${rgba(colors.primary, 0.16 + intensity * 0.12)}, transparent 70%), radial-gradient(ellipse 1300px 260px at 50% 110%, ${rgba(colors.accent, 0.07 + intensity * 0.06)}, transparent 75%)`,
				}}
			/>
		</AbsoluteFill>
	);
});
