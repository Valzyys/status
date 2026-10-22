import type {CSSProperties} from 'react';
import {interpolate} from 'remotion';
import type {EasingFunction} from 'remotion';
import {ease} from './tokens';

/** Progres 0–1 yang di-clamp dan di-ease. */
export const progress = (
	frame: number,
	start: number,
	duration: number,
	easing: EasingFunction = ease.in,
): number =>
	interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Gelombang sinus periodik 0–1 dengan periode dalam frame. */
export const wave = (frame: number, period: number, phase = 0): number =>
	0.5 + 0.5 * Math.sin((frame / period) * Math.PI * 2 + phase);

/**
 * Masuk dengan translate + blur-to-sharp (bukan sekadar fade).
 */
export const enterStyle = (
	p: number,
	opts: {dx?: number; dy?: number; blur?: number; scale?: number} = {},
): CSSProperties => {
	const {dx = 0, dy = 40, blur = 14, scale = 1} = opts;
	const s = scale + (1 - scale) * p;
	return {
		opacity: Math.min(1, p * 1.6),
		transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) scale(${s})`,
		filter: p < 0.999 ? `blur(${blur * (1 - p)}px)` : undefined,
	};
};

/** Mask reveal dari bawah ke atas (clip-path). */
export const maskUp = (p: number): CSSProperties => ({
	clipPath: `inset(${(1 - p) * 100}% -20% -20% -20%)`,
});

/** Mask reveal dari kiri ke kanan. */
export const maskRight = (p: number): CSSProperties => ({
	clipPath: `inset(-20% ${(1 - p) * 100}% -20% -20%)`,
});
