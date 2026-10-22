import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import type {
	TransitionPresentation,
	TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {ease, rgba} from '../theme/tokens';

// Transisi custom untuk konten scene (background tetap di layer sendiri sehingga kontinu).

export type ColorProps = {readonly color: string};

/** Light-sweep wipe: batang cahaya menyapu kiri→kanan, scene lama terhapus di belakangnya. */
const LightSweep: React.FC<TransitionPresentationComponentProps<ColorProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
	passedProps,
}) => {
	const p = ease.inOut(presentationProgress);
	const edge = interpolate(p, [0, 1], [-15, 115]);
	if (presentationDirection === 'entering') {
		return (
			<AbsoluteFill style={{clipPath: `polygon(0% 0%, ${edge}% 0%, ${edge - 10}% 100%, 0% 100%)`}}>
				{children}
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{clipPath: `polygon(${edge}% 0%, 110% 0%, 110% 100%, ${edge - 10}% 100%)`}}
			>
				{children}
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `linear-gradient(100deg, transparent ${edge - 14}%, ${rgba(passedProps.color, 0.45)} ${edge - 5}%, rgba(255,255,255,0.5) ${edge - 4.5}%, ${rgba(passedProps.color, 0.45)} ${edge - 4}%, transparent ${edge + 4}%)`,
					mixBlendMode: 'screen',
					opacity: Math.sin(presentationProgress * Math.PI),
				}}
			/>
		</AbsoluteFill>
	);
};

export const lightSweep = (color: string): TransitionPresentation<ColorProps> => ({
	component: LightSweep,
	props: {color},
});

/** Mask slide: scene baru dibuka oleh topeng dari kanan, scene lama bergeser keluar ke kiri. */
const MaskSlide: React.FC<TransitionPresentationComponentProps<ColorProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
}) => {
	if (presentationDirection === 'entering') {
		const p = ease.in(presentationProgress);
		return (
			<AbsoluteFill
				style={{
					clipPath: `inset(0% 0% 0% ${(1 - p) * 100}%)`,
					transform: `translateX(${(1 - p) * 140}px)`,
				}}
			>
				{children}
			</AbsoluteFill>
		);
	}
	const p = ease.out(presentationProgress);
	return (
		<AbsoluteFill
			style={{
				transform: `translateX(${-p * 220}px)`,
				opacity: 1 - p,
				filter: `blur(${p * 10}px)`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const maskSlide = (color: string): TransitionPresentation<ColorProps> => ({
	component: MaskSlide,
	props: {color},
});

/** Zoom-blur: scene lama membesar & kabur, scene baru mengendap dari sedikit lebih kecil. */
const ZoomBlur: React.FC<TransitionPresentationComponentProps<ColorProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
}) => {
	if (presentationDirection === 'entering') {
		const p = ease.in(presentationProgress);
		return (
			<AbsoluteFill
				style={{
					transform: `scale(${0.9 + 0.1 * p})`,
					filter: p < 0.999 ? `blur(${(1 - p) * 16}px)` : undefined,
					opacity: Math.min(1, p * 1.5),
				}}
			>
				{children}
			</AbsoluteFill>
		);
	}
	const p = ease.out(presentationProgress);
	return (
		<AbsoluteFill
			style={{transform: `scale(${1 + 0.18 * p})`, filter: `blur(${p * 18}px)`, opacity: 1 - p}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const zoomBlur = (color: string): TransitionPresentation<ColorProps> => ({
	component: ZoomBlur,
	props: {color},
});
