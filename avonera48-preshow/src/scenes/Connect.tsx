import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {CueMap} from '../config/timeline';
import {Label} from '../components/Label';
import {QR} from '../components/QR';
import {useShow} from '../components/ShowContext';
import {SocialIconSvg} from '../components/icons';
import {useFitFontSize} from '../components/useFit';
import {enterStyle, progress} from '../theme/anim';
import {ease, fonts, rgba, type as typo} from '../theme/tokens';

const QR_X = 250;
const QR_Y = 250;
const QR_SIZE = 470;
const TEXT_X = 860;
const TEXT_W = 1920 - 96 - 40 - TEXT_X;

export const Connect: React.FC<{cues: CueMap['connect']}> = ({cues}) => {
	const frame = useCurrentFrame();
	const {colors, config} = useShow();
	const url = config.streamUrl;
	const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

	const panelP = progress(frame, cues.qr - 6, 26);
	const qrP = progress(frame, cues.qr, 50, ease.inOut);
	const textP = progress(frame, cues.text, 26);
	const urlSize = useFitFontSize(shortUrl, TEXT_W, {fontFamily: fonts.body, fontWeight: 600, max: 34, min: 22});

	return (
		<AbsoluteFill>
			{/* Panel QR muncul dari pojok kiri atas */}
			<div
				style={{
					position: 'absolute',
					left: QR_X,
					top: QR_Y,
					padding: 22,
					borderRadius: 30,
					background: colors.text,
					boxShadow: `0 30px 80px ${rgba('#000000', 0.5)}, 0 0 60px ${rgba(colors.primary, 0.18 * panelP)}`,
					clipPath: `circle(${panelP * 150}% at 0% 0%)`,
				}}
			>
				<div style={{borderRadius: 14, overflow: 'hidden', width: QR_SIZE, height: QR_SIZE}}>
					<QR value={url} size={QR_SIZE} reveal={qrP} fg={colors.bg} bg={colors.text} />
				</div>
			</div>
			{/* Sudut aksen */}
			<div
				style={{
					position: 'absolute',
					left: QR_X - 26,
					top: QR_Y - 26,
					width: 70 * panelP,
					height: 70 * panelP,
					borderLeft: `3px solid ${colors.accent}`,
					borderTop: `3px solid ${colors.accent}`,
					borderTopLeftRadius: 18,
				}}
			/>

			<div style={{position: 'absolute', left: TEXT_X, top: 270, width: TEXT_W}}>
				<Label text="Stay connected" p={progress(frame, cues.text - 6, 22)} />
				<div
					style={{
						marginTop: 22,
						fontFamily: fonts.display,
						fontWeight: 800,
						fontSize: 76,
						lineHeight: 1.04,
						letterSpacing: typo.displayTracking,
						color: colors.text,
						...enterStyle(textP, {dy: 50}),
					}}
				>
					Scan &amp; ikuti
					<br />
					<span style={{color: colors.primary}}>kabar terbaru</span>
				</div>
				<div
					style={{
						marginTop: 22,
						fontFamily: fonts.body,
						fontWeight: 600,
						fontSize: urlSize,
						color: colors.muted,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						...enterStyle(progress(frame, cues.text + 6, 24), {dy: 30}),
					}}
				>
					{shortUrl}
				</div>
				<div style={{marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18}}>
					{config.socials.slice(0, 4).map((s, i) => {
						const at = cues.socials[i] ?? cues.text;
						const p = progress(frame, at, 24);
						return (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, ...enterStyle(p, {dx: 60, dy: 0})}}>
								<div
									style={{
										width: 60,
										height: 60,
										borderRadius: 16,
										border: `1px solid ${rgba(colors.text, 0.16)}`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
									}}
								>
									<SocialIconSvg platform={s.platform} size={30} color={colors.text} draw={progress(frame, at + 4, 30)} />
								</div>
								<div
									style={{
										fontFamily: fonts.body,
										fontWeight: 700,
										fontSize: 36,
										color: colors.text,
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										maxWidth: TEXT_W - 90,
									}}
								>
									{s.handle}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
