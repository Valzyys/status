import {useMemo} from 'react';
import {fitText} from '@remotion/layout-utils';

/** Ukuran font yang muat di `width`, dibatasi [min, max]. */
export const useFitFontSize = (
	text: string,
	width: number,
	opts: {fontFamily: string; fontWeight: number; max: number; min: number; letterSpacing?: string},
): number =>
	useMemo(() => {
		if (!text) return opts.max;
		const {fontSize} = fitText({
			text,
			withinWidth: width,
			fontFamily: opts.fontFamily,
			fontWeight: opts.fontWeight,
			letterSpacing: opts.letterSpacing,
		});
		return Math.max(opts.min, Math.min(opts.max, Math.floor(fontSize)));
	}, [text, width, opts.fontFamily, opts.fontWeight, opts.max, opts.min, opts.letterSpacing]);
