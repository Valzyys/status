import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {Label} from '../components/Label';
import {useShow} from '../components/ShowContext';
import {enterStyle, progress} from '../theme/anim';
import {SAFE, ease, rgba} from '../theme/tokens';

const PLATE_W = 340;
const PLATE_H = 170;
const GAP = 40;
const SPEED = 1.4; // px per frame

export const Partner: React.FC<{cues: CueMap['partner']}> = ({cues}) => {
	const frame = useCurrentFrame();
	const {colors, config} = useShow();
	const sponsors = config.sponsors;
	if (sponsors.length === 0) return null;

	const unit = sponsors.length * (PLATE_W + GAP);
	const repeat = Math.max(2, Math.ceil((1920 * 2) / unit) + 1);
	const items = Array.from({length: repeat}).flatMap(() => sponsors);
	const offset = (frame * SPEED) % unit;

	const inP = progress(frame, cues.marquee, 30);
	const outP = progress(frame, cues.exit, 24, ease.out);

	return (
		<AbsoluteFill style={{opacity: 1 - outP}}>
			<div style={{position: 'absolute', top: 340, left: 0, right: 0}}>
				<Label text="Supported by" p={progress(frame, cues.label, 22)} align="center" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: SAFE.x,
					right: SAFE.x,
					top: 450,
					height: PLATE_H,
					overflow: 'hidden',
					maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
					...enterStyle(inP, {dy: 40}),
				}}
			>
				<div style={{display: 'flex', gap: GAP, transform: `translateX(${-offset}px)`}}>
					{items.map((s, i) => (
						<div
							key={i}
							style={{
								flexShrink: 0,
								width: PLATE_W,
								height: PLATE_H,
								borderRadius: 22,
								border: `1px solid ${rgba(colors.text, 0.1)}`,
								background: rgba(colors.surface, 0.7),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: 32,
								boxSizing: 'border-box',
							}}
						>
							<Img src={staticFile(s.logo)} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
						</div>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
