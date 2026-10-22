import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {sec} from '../config/timeline';
import {AudioBars} from '../components/AudioBars';
import {Label} from '../components/Label';
import {useShow} from '../components/ShowContext';
import {useFitFontSize} from '../components/useFit';
import {progress} from '../theme/anim';
import {ease, fonts, mix, rgba, type as typo} from '../theme/tokens';

const LINES = ['SHOW AKAN', 'SEGERA DIMULAI'] as const;

export const StayTuned: React.FC<{
	cues: CueMap['stayTuned'];
	bgmSrc: string | null;
	/** Frame absolut awal scene, untuk sinkron visualizer dengan BGM. */
	sceneFrom: number;
}> = ({cues, bgmSrc, sceneFrom}) => {
	const frame = useCurrentFrame();
	const {colors} = useShow();

	const size = useFitFontSize(LINES[1], 1500, {
		fontFamily: fonts.display,
		fontWeight: 800,
		letterSpacing: typo.displayTracking,
		max: 168,
		min: 100,
	});

	// Bernapas 1.00 ↔ 1.02, periode 4 dtk
	const breathe = 1 + 0.01 * (1 - Math.cos((frame / sec(4)) * Math.PI * 2));
	// Kembali ke komposisi frame 0 di akhir (loop mulus)
	const reset = progress(frame, cues.resetStart, cues.resetEnd - cues.resetStart, ease.out);
	const barsP = progress(frame, cues.bars, 30);

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				opacity: 1 - reset,
				filter: reset > 0 ? `blur(${reset * 16}px)` : undefined,
			}}
		>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -30}}>
				<Label text="Stay tuned" p={progress(frame, cues.title - 8, 22)} align="center" color={colors.accent} />
				<div
					style={{
						marginTop: 34,
						transform: `scale(${breathe})`,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize: size,
						lineHeight: 1.02,
						letterSpacing: typo.displayTracking,
						filter: `drop-shadow(0 0 40px ${rgba(colors.primary, 0.28)})`,
					}}
				>
					{LINES.map((line, li) => (
						<div key={line} style={{display: 'flex', gap: '0.26em'}}>
							{line.split(' ').map((w, k, words) => {
								const p = progress(frame, cues.title + li * 8 + k * 4, 24);
								return (
									<span key={k} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.06em'}}>
										<span
											style={{
												display: 'inline-block',
												transform: `translateY(${(1 - p) * 105}%)`,
												filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
												// Gradien menerus sepanjang baris: tiap kata mengambil potongannya sendiri.
												backgroundImage:
													li === 1
														? `linear-gradient(90deg, ${mix(colors.text, colors.primary, (0.7 * k) / words.length)}, ${mix(colors.text, colors.primary, (0.7 * (k + 1)) / words.length)})`
														: undefined,
												backgroundClip: li === 1 ? 'text' : undefined,
												WebkitBackgroundClip: li === 1 ? 'text' : undefined,
												color: li === 1 ? 'transparent' : colors.text,
											}}
										>
											{w}
										</span>
									</span>
								);
							})}
						</div>
					))}
				</div>
				<div style={{marginTop: 70}}>
					<AudioBars src={bgmSrc} audioFrame={sceneFrom + frame} height={70} p={barsP} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
