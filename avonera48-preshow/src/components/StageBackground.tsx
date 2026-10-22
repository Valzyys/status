import React from 'react';
import {AbsoluteFill} from 'remotion';
import {mix, rgba} from '../theme/tokens';
import {Bokeh} from './Bokeh';
import {Grain} from './Grain';
import {useShow} from './ShowContext';
import {StageLights} from './StageLights';

export type StageBackgroundProps = {
	readonly loopFrames: number;
	readonly activity?: number;
	readonly intensity?: number;
	readonly particles?: number;
};

/**
 * Background berlapis: gradien dasar → sorot lampu → bokeh → grain → vignette.
 */
export const StageBackground: React.FC<StageBackgroundProps> = ({
	loopFrames,
	activity = 0,
	intensity = 0,
	particles = 56,
}) => {
	const {colors} = useShow();
	return (
		<AbsoluteFill style={{backgroundColor: colors.bg}}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 1400px 700px at 50% -10%, ${mix(colors.surface, colors.bg, 0.2)} 0%, ${colors.bg} 70%), linear-gradient(to bottom, ${colors.bg} 0%, ${mix(colors.bg, colors.surface, 0.6)} 100%)`,
					backgroundBlendMode: 'screen',
				}}
			/>
			<StageLights activity={activity} intensity={intensity} />
			<Bokeh loopFrames={loopFrames} count={particles} />
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 75% 70% at 50% 45%, transparent 50%, ${rgba('#000000', 0.7)} 100%)`,
				}}
			/>
			<Grain />
		</AbsoluteFill>
	);
};
