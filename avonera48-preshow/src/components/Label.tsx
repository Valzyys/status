import React from 'react';
import {fonts, rgba, type as typo} from '../theme/tokens';
import {useShow} from './ShowContext';

/** Label kecil uppercase dengan tracking lebar + garis aksen yang tumbuh. */
export const Label: React.FC<{
	text: string;
	p: number;
	align?: 'left' | 'center';
	color?: string;
	size?: number;
}> = ({text, p, align = 'left', color, size = 22}) => {
	const {colors} = useShow();
	const line = (
		<div
			style={{
				width: 56 * p,
				height: 2,
				background: colors.accent,
				boxShadow: `0 0 12px ${rgba(colors.accent, 0.6)}`,
			}}
		/>
	);
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: align === 'center' ? 'center' : 'flex-start',
				gap: 18,
				fontFamily: fonts.body,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: typo.labelTracking,
				textTransform: 'uppercase',
				color: color ?? colors.muted,
			}}
		>
			{line}
			<span
				style={{
					opacity: p,
					transform: `translateX(${(1 - p) * -20}px)`,
					clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
					marginRight: align === 'center' ? `-${typo.labelTracking}` : 0,
				}}
			>
				{text}
			</span>
			{align === 'center' ? line : null}
		</div>
	);
};
