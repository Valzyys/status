import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {Label} from '../components/Label';
import {useShow} from '../components/ShowContext';
import {PinIcon} from '../components/icons';
import {useFitFontSize} from '../components/useFit';
import {enterStyle, progress} from '../theme/anim';
import {STAGGER, fonts, rgba, type as typo} from '../theme/tokens';

const LEFT = 200;
const RIGHT = 200;
const VENUE_WIDTH = 1180;

export const InfoShow: React.FC<{cues: CueMap['info']}> = ({cues}) => {
	const frame = useCurrentFrame();
	const {colors, date, config} = useShow();
	const {time, timezone, venue} = config.show;

	const labelP = progress(frame, cues.label, 20);
	const dateP = progress(frame, cues.date, 26);
	const venueP = progress(frame, cues.venue, 26);
	const dividerP = progress(frame, cues.date + 6, 40);
	const landGlow = progress(frame, cues.timeLand, 30);

	const venueSize = useFitFontSize(venue, VENUE_WIDTH, {
		fontFamily: fonts.body,
		fontWeight: 700,
		max: 58,
		min: 34,
	});

	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: LEFT, top: 190}}>
				<Label text="Today's Show" p={labelP} />
			</div>

			{/* Tanggal — kiri atas */}
			<div style={{position: 'absolute', left: LEFT, top: 238, ...enterStyle(dateP, {dy: 0, dx: -60})}}>
				<div
					style={{
						fontFamily: fonts.body,
						fontWeight: 700,
						fontSize: 30,
						letterSpacing: '0.22em',
						textTransform: 'uppercase',
						color: colors.accent,
					}}
				>
					{date.dayName}
				</div>
				<div
					style={{
						marginTop: 8,
						fontFamily: fonts.display,
						fontWeight: 600,
						fontSize: 66,
						letterSpacing: '-0.02em',
						color: colors.text,
					}}
				>
					{date.long}
				</div>
			</div>

			{/* Jam — paling besar, kanan */}
			<div
				style={{
					position: 'absolute',
					right: RIGHT,
					top: 372,
					display: 'flex',
					alignItems: 'flex-start',
					gap: 22,
				}}
			>
				<div
					style={{
						display: 'flex',
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize: 270,
						lineHeight: 1,
						letterSpacing: typo.displayTracking,
						color: colors.text,
						fontVariantNumeric: 'tabular-nums',
						textShadow: `0 0 ${60 * (1 - landGlow) + 20}px ${rgba(colors.primary, 0.35 * (1 - landGlow) + 0.12)}`,
					}}
				>
					{time.split('').map((ch, i) => {
						const p = progress(frame, cues.time + i * STAGGER, 22);
						return (
							<span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: 12}}>
								<span
									style={{
										display: 'inline-block',
										transform: `translateY(${(1 - p) * 100}%)`,
										filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
										color: ch === ':' ? colors.primary : undefined,
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
						marginTop: 30,
						fontFamily: fonts.display,
						fontWeight: 600,
						fontSize: 60,
						color: colors.accent,
						...enterStyle(progress(frame, cues.timeLand - 4, 20), {dy: -30, dx: 0}),
					}}
				>
					{timezone}
				</div>
			</div>

			{/* Garis pembagi */}
			<div
				style={{
					position: 'absolute',
					left: LEFT,
					top: 706,
					width: (1920 - LEFT - RIGHT) * dividerP,
					height: 1,
					background: `linear-gradient(90deg, ${rgba(colors.text, 0.35)}, ${rgba(colors.text, 0.04)})`,
				}}
			/>

			{/* Venue — kiri bawah */}
			<div style={{position: 'absolute', left: LEFT, top: 740, width: VENUE_WIDTH + 90, ...enterStyle(venueP, {dy: 40})}}>
				<div
					style={{
						fontFamily: fonts.body,
						fontWeight: 700,
						fontSize: 20,
						letterSpacing: typo.labelTracking,
						color: colors.muted,
						marginBottom: 16,
					}}
				>
					VENUE
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
					<div style={{flexShrink: 0}}>
						<PinIcon size={50} color={colors.primary} draw={progress(frame, cues.venue + 4, 30)} />
					</div>
					<div
						style={{
							fontFamily: fonts.body,
							fontWeight: 700,
							fontSize: venueSize,
							lineHeight: 1.15,
							color: colors.text,
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{venue}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
