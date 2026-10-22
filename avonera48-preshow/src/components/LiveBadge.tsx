import React from 'react';
import {useCurrentFrame} from 'remotion';
import {sec} from '../config/timeline';
import {SAFE, fonts, rgba} from '../theme/tokens';
import {useShow} from './ShowContext';

/** Kanan atas: badge dengan titik berdenyut (periode 1.2 dtk). */
export const LiveBadge: React.FC<{label?: string}> = ({label = 'PRE-SHOW'}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();
	const t = (frame % sec(1.2)) / sec(1.2);
	const ring = 1 - Math.pow(1 - t, 3);
	return (
		<div
			style={{
				position: 'absolute',
				right: SAFE.x,
				top: SAFE.y,
				height: 52,
				display: 'flex',
				alignItems: 'center',
				gap: 16,
				padding: '0 24px 0 20px',
				borderRadius: 26,
				border: `1px solid ${rgba(colors.primary, 0.55)}`,
				background: rgba(colors.primary, 0.1),
				fontFamily: fonts.body,
				fontWeight: 800,
				fontSize: 19,
				letterSpacing: '0.28em',
				color: colors.text,
			}}
		>
			<div style={{position: 'relative', width: 12, height: 12}}>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: '50%',
						background: colors.primary,
						transform: `scale(${1 + ring * 1.8})`,
						opacity: 0.6 * (1 - ring),
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: '50%',
						background: colors.primary,
						boxShadow: `0 0 ${10 + 8 * (1 - t)}px ${rgba(colors.primary, 0.9)}`,
					}}
				/>
			</div>
			<span style={{marginRight: '-0.28em'}}>{label}</span>
		</div>
	);
};
