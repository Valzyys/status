import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {sec} from '../config/timeline';
import {HEIGHT, mix} from '../theme/tokens';
import {useShow} from './ShowContext';

const PANEL_W = 500;
const POINTS = 24;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Siluet tirai panggung kiri-kanan + valance atas, bergoyang pelan. */
export const Curtain: React.FC<{light?: number}> = React.memo(({light = 0}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();

	const tone = useMemo(
		() => ({
			deep: mix(colors.bg, colors.primary, 0.16),
			mid: mix(colors.bg, colors.primary, 0.3),
			high: mix(colors.bg, colors.primary, 0.48),
		}),
		[colors],
	);

	const folds = (lit: number) =>
		`repeating-linear-gradient(90deg, ${tone.deep} 0px, ${tone.mid} 24px, ${mix(tone.mid, tone.high, lit)} 40px, ${tone.mid} 56px, ${tone.deep} 80px)`;

	const panel = (side: 'left' | 'right') => {
		const pts: string[] = [];
		for (let i = 0; i <= POINTS; i++) {
			const t = i / POINTS;
			const sway = Math.sin(frame / sec(6) * Math.PI * 2 + t * 3 + (side === 'left' ? 0 : 1.7)) * 10 * t;
			const inner = 1 - 0.62 * smooth(Math.min(1, t * 1.15)) + sway / PANEL_W;
			pts.push(`${(inner * 100).toFixed(2)}% ${(t * 100).toFixed(2)}%`);
		}
		const poly = `polygon(0% 0%, ${pts.join(', ')}, 0% 100%)`;
		return (
			<div
				style={{
					position: 'absolute',
					top: 0,
					[side]: 0,
					width: PANEL_W,
					height: HEIGHT,
					transform: side === 'right' ? 'scaleX(-1)' : undefined,
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						clipPath: poly,
						background: `linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.45) 100%), linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.55)), ${folds(light)}`,
						backgroundPosition: `0 0, 0 0, ${Math.sin(frame / sec(7.5) * Math.PI * 2) * 6}px 0`,
					}}
				/>
			</div>
		);
	};

	return (
		<AbsoluteFill>
			{panel('left')}
			{panel('right')}
			{/* Valance atas dengan tepi bergelombang */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: '100%',
					height: 150,
					background: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), ${folds(light * 0.6)}`,
					maskImage:
						'linear-gradient(black, black), radial-gradient(ellipse 50% 100% at 50% 0%, black 97%, transparent 100%)',
					maskSize: '100% 104px, 160px 46px',
					maskPosition: '0 0, 0 104px',
					maskRepeat: 'no-repeat, repeat-x',
				}}
			/>
		</AbsoluteFill>
	);
});
