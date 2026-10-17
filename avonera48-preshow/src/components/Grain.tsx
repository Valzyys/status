import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/**
 * Film grain halus (~4% opacity). Pola berganti tiap 2 frame, diulang dari 24 seed.
 */
export const Grain: React.FC<{opacity?: number}> = React.memo(({opacity = 0.04}) => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2) % 24;
	return (
		<AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%" viewBox="0 0 960 540" preserveAspectRatio="none">
				<filter id={`grain-${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="960" height="540" filter={`url(#grain-${seed})`} />
			</svg>
		</AbsoluteFill>
	);
});
