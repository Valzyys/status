import React, {useMemo} from 'react';
import {measureText} from '@remotion/layout-utils';
import {useCurrentFrame} from 'remotion';
import {FPS} from '../config/timeline';
import {SAFE, WIDTH, fonts, rgba} from '../theme/tokens';
import {Sparkle} from './icons';
import {useShow} from './ShowContext';

const FONT_SIZE = 25;
const ITEM_PAD = 34;
const SPARKLE = 14;
const TARGET_SPEED = 75; // px/detik
const BAND_WIDTH = WIDTH - SAFE.x * 2;

/**
 * Ticker bawah yang loop mulus: dua salinan identik digeser -50% (tanpa bergantung hasil ukur),
 * dan jumlah putaran per loop dibulatkan sehingga frame terakhir nyambung ke frame 0.
 */
export const Ticker: React.FC<{loopFrames: number}> = ({loopFrames}) => {
	const frame = useCurrentFrame();
	const {colors, config} = useShow();
	const items = config.ticker;

	const {repeat, cycles} = useMemo(() => {
		const unit = items.reduce(
			(acc, text) =>
				acc +
				measureText({text, fontFamily: fonts.body, fontSize: FONT_SIZE, fontWeight: 500}).width +
				ITEM_PAD * 2 +
				SPARKLE,
			0,
		);
		const rep = Math.max(1, Math.ceil((BAND_WIDTH * 1.1) / Math.max(1, unit)));
		const copyWidth = unit * rep;
		const c = Math.max(1, Math.round(((loopFrames / FPS) * TARGET_SPEED) / copyWidth));
		return {repeat: rep, cycles: c};
	}, [items, loopFrames]);

	const frac = (((frame % loopFrames) * cycles) / loopFrames) % 1;

	const copy = (k: number) => (
		<div key={k} style={{display: 'flex', alignItems: 'center', flexShrink: 0}}>
			{Array.from({length: repeat}).flatMap((_, r) =>
				items.map((text, i) => (
					<div key={`${r}-${i}`} style={{display: 'flex', alignItems: 'center', flexShrink: 0}}>
						<span style={{padding: `0 ${ITEM_PAD}px`, whiteSpace: 'nowrap'}}>{text}</span>
						<Sparkle size={SPARKLE} color={colors.accent} />
					</div>
				)),
			)}
		</div>
	);

	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.x,
				right: SAFE.x,
				bottom: SAFE.y,
				height: 58,
				display: 'flex',
				alignItems: 'center',
				overflow: 'hidden',
				borderTop: `1px solid ${rgba(colors.text, 0.1)}`,
				maskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
				fontFamily: fonts.body,
				fontWeight: 500,
				fontSize: FONT_SIZE,
				color: rgba(colors.text, 0.78),
			}}
		>
			<div style={{display: 'flex', width: 'max-content', transform: `translateX(${-50 * frac}%)`}}>
				{copy(0)}
				{copy(1)}
			</div>
		</div>
	);
};
