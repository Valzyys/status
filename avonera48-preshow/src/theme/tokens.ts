import {loadFont as loadUnbounded} from '@remotion/google-fonts/Unbounded';
import {loadFont as loadJakarta} from '@remotion/google-fonts/PlusJakartaSans';
import {Easing} from 'remotion';

export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Safe area 5% tiap sisi. */
export const SAFE = {
	x: Math.round(WIDTH * 0.05),
	y: Math.round(HEIGHT * 0.05),
} as const;

const unbounded = loadUnbounded('normal', {
	weights: ['400', '600', '800'],
	subsets: ['latin'],
});
const jakarta = loadJakarta('normal', {
	weights: ['400', '500', '700', '800'],
	subsets: ['latin'],
});

export const fonts = {
	display: unbounded.fontFamily,
	body: jakarta.fontFamily,
} as const;

export const waitForFonts = (): Promise<unknown> =>
	Promise.all([unbounded.waitUntilDone(), jakarta.waitUntilDone()]);

export const ease = {
	/** Masuk: cepat lalu mengendap. */
	in: Easing.bezier(0.16, 1, 0.3, 1),
	/** Keluar: pelan lalu cepat. */
	out: Easing.bezier(0.7, 0, 0.84, 0),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

export const type = {
	labelTracking: '0.32em',
	displayTracking: '-0.035em',
} as const;

/** Jeda stagger antar elemen (frame). */
export const STAGGER = 3;

export const hexToRgb = (hex: string): [number, number, number] => {
	const clean = hex.replace('#', '');
	const full =
		clean.length === 3
			? clean
					.split('')
					.map((c) => c + c)
					.join('')
			: clean;
	const n = parseInt(full, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgba = (hex: string, alpha: number): string => {
	const [r, g, b] = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Campur dua warna hex, t=0 → a, t=1 → b. */
export const mix = (a: string, b: string, t: number): string => {
	const ca = hexToRgb(a);
	const cb = hexToRgb(b);
	const c = ca.map((v, i) => Math.round(v + ((cb[i] ?? 0) - v) * t));
	return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

/** Beri alpha pada warna "rgb(r, g, b)" hasil `mix()`. */
export const withAlpha = (rgb: string, alpha: number): string =>
	rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha.toFixed(3)})`);
