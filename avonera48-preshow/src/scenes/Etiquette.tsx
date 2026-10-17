import React from 'react';
import {fitText} from '@remotion/layout-utils';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {Label} from '../components/Label';
import {useShow} from '../components/ShowContext';
import {RuleIconSvg} from '../components/icons';
import {enterStyle, progress} from '../theme/anim';
import {SAFE, WIDTH, ease, fonts, rgba, type as typo} from '../theme/tokens';

const LEFT = 200;
const ZIG = 300;
const ROW_TOP = 400;
const ROW_GAP = 132;
const ICON = 92;
const TEXT_GAP = 34;
const INDEX_W = 70;

export const Etiquette: React.FC<{cues: CueMap['rules']}> = ({cues}) => {
	const frame = useCurrentFrame();
	const {colors, config} = useShow();
	const rules = config.rules.slice(0, 4);

	const titleP = progress(frame, cues.title, 26);

	const rows = rules.map((rule, i) => {
		const x = LEFT + (i % 2 === 1 ? ZIG : 0);
		const textX = x + INDEX_W + ICON + TEXT_GAP;
		const maxW = WIDTH - SAFE.x - 40 - textX;
		const fit = fitText({text: rule.text, withinWidth: maxW, fontFamily: fonts.body, fontWeight: 700}).fontSize;
		return {rule, x, y: ROW_TOP + i * ROW_GAP, size: Math.max(28, Math.min(46, Math.floor(fit)))};
	});

	// Garis zig-zag yang menghubungkan ikon, digambar bertahap
	const points = rows.map((r) => `${r.x + INDEX_W + ICON / 2},${r.y + ICON / 2}`).join(' ');
	const lastCue = cues.rules[cues.rules.length - 1] ?? cues.title;
	const spineP = progress(frame, (cues.rules[0] ?? cues.title) - 6, lastCue - (cues.rules[0] ?? 0) + 12, ease.inOut);

	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: LEFT, top: 170}}>
				<Label text="Etiket nonton" p={progress(frame, cues.label, 20)} />
				<div
					style={{
						marginTop: 20,
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize: 80,
						lineHeight: 1,
						letterSpacing: typo.displayTracking,
						color: colors.text,
						...enterStyle(titleP, {dy: 50}),
						clipPath: `inset(${(1 - titleP) * 100}% -5% -10% -5%)`,
					}}
				>
					SEBELUM SHOW <span style={{color: colors.primary}}>DIMULAI</span>
				</div>
			</div>

			<svg width={WIDTH} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				<polyline
					points={points}
					fill="none"
					stroke={rgba(colors.text, 0.16)}
					strokeWidth={2}
					strokeDasharray="1 1"
					pathLength={1}
					strokeDashoffset={1 - spineP}
				/>
			</svg>

			{rows.map(({rule, x, y, size}, i) => {
				const at = cues.rules[i] ?? 0;
				const p = progress(frame, at, 24);
				const draw = progress(frame, at + 2, 34, ease.inOut);
				const textP = progress(frame, at + 6, 26);
				return (
					<div key={i} style={{position: 'absolute', left: x, top: y, height: ICON, display: 'flex', alignItems: 'center'}}>
						<div
							style={{
								width: INDEX_W,
								fontFamily: fonts.display,
								fontWeight: 600,
								fontSize: 24,
								color: colors.accent,
								opacity: p,
							}}
						>
							{`0${i + 1}`}
						</div>
						<div
							style={{
								width: ICON,
								height: ICON,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: `1.5px solid ${rgba(colors.text, 0.2 * p)}`,
								background: rgba(colors.surface, 0.85 * p),
								boxShadow: `0 0 ${30 * (1 - draw) + 8}px ${rgba(colors.primary, 0.25 * p)}`,
								transform: `scale(${0.6 + 0.4 * p})`,
							}}
						>
							<RuleIconSvg name={rule.icon} size={44} color={colors.text} draw={draw} />
						</div>
						<div
							style={{
								marginLeft: TEXT_GAP,
								fontFamily: fonts.body,
								fontWeight: 700,
								fontSize: size,
								color: colors.text,
								whiteSpace: 'nowrap',
								...enterStyle(textP, {dx: 80, dy: 0, blur: 10}),
							}}
						>
							{rule.text}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
