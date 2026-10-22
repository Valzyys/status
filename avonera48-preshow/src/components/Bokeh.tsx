import React, {useMemo} from 'react';
import {noise3D} from '@remotion/noise';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH, rgba} from '../theme/tokens';
import {useShow} from './ShowContext';

type Particle = {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly cycles: number;
	readonly color: 'text' | 'accent' | 'primary';
	readonly alpha: number;
	readonly soft: number;
	readonly seed: string;
};

const MARGIN = 80;

/**
 * Debu cahaya / bokeh yang melayang. Gerak berbasis noise yang ditelusuri melingkar,
 * dan drift vertikal kelipatan bulat dari `loopFrames` → posisi frame terakhir nyambung ke frame 0.
 */
export const Bokeh: React.FC<{loopFrames: number; count?: number}> = React.memo(
	({loopFrames, count = 56}) => {
		const frame = useCurrentFrame();
		const {colors} = useShow();

		const particles = useMemo<Particle[]>(
			() =>
				Array.from({length: Math.min(80, count)}, (_, i) => {
					const r = (k: string) => random(`bokeh-${i}-${k}`);
					const big = r('big') > 0.82;
					const pick = r('color');
					return {
						x: r('x') * WIDTH,
						y: r('y') * (HEIGHT + MARGIN * 2),
						size: big ? 40 + r('s') * 60 : 4 + r('s') * 14,
						cycles: 1 + Math.floor(r('c') * 2),
						color: pick < 0.55 ? 'text' : pick < 0.85 ? 'accent' : 'primary',
						alpha: big ? 0.05 + r('a') * 0.07 : 0.18 + r('a') * 0.4,
						soft: big ? 0.15 : 0.45,
						seed: `p${i}`,
					};
				}),
			[count],
		);

		const t = (frame % loopFrames) / loopFrames;
		const theta = t * Math.PI * 2;

		return (
			<AbsoluteFill style={{mixBlendMode: 'screen', overflow: 'hidden'}}>
				{particles.map((p) => {
					const cx = Math.cos(theta) * 0.9;
					const cy = Math.sin(theta) * 0.9;
					const nx = noise3D(p.seed, cx, cy, 0);
					const nf = noise3D(p.seed, cx * 2, cy * 2, 7);
					const span = HEIGHT + MARGIN * 2;
					const y = (((p.y - t * p.cycles * span) % span) + span) % span - MARGIN;
					const x = p.x + nx * 90;
					const flicker = 0.55 + 0.45 * nf;
					const c = colors[p.color];
					return (
						<div
							key={p.seed}
							style={{
								position: 'absolute',
								left: x - p.size / 2,
								top: y - p.size / 2,
								width: p.size,
								height: p.size,
								borderRadius: '50%',
								background: `radial-gradient(circle, ${rgba(c, p.alpha * flicker)} 0%, ${rgba(c, p.alpha * flicker * 0.5)} ${p.soft * 100}%, transparent 70%)`,
							}}
						/>
					);
				})}
			</AbsoluteFill>
		);
	},
);
