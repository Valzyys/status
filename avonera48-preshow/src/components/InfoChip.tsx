import React from 'react';
import {SAFE, fonts, rgba} from '../theme/tokens';
import {CalendarIcon} from './icons';
import {useShow} from './ShowContext';

/** Kiri atas: "Minggu, 18 Oktober 2026 · 14:00 WIB". */
export const InfoChip: React.FC = () => {
	const {colors, scheduleLine} = useShow();
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.x,
				top: SAFE.y,
				height: 52,
				maxWidth: 820,
				display: 'flex',
				alignItems: 'center',
				gap: 14,
				padding: '0 24px 0 18px',
				borderRadius: 26,
				border: `1px solid ${rgba(colors.text, 0.14)}`,
				background: rgba(colors.surface, 0.6),
				fontFamily: fonts.body,
				fontWeight: 600,
				fontSize: 22,
				color: colors.text,
				whiteSpace: 'nowrap',
			}}
		>
			<CalendarIcon size={22} color={colors.accent} />
			<span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{scheduleLine}</span>
		</div>
	);
};
