import React from 'react';
import {Composition} from 'remotion';
import {loadManifest} from './audio/manifest';
import {FinalCountdown} from './compositions/FinalCountdown';
import type {FinalCountdownProps} from './compositions/FinalCountdown';
import {PreShowLoop} from './compositions/PreShowLoop';
import type {PreShowLoopProps} from './compositions/PreShowLoop';
import {Standby} from './compositions/Standby';
import type {StandbyProps} from './compositions/Standby';
import {showConfig} from './config/show.config';
import {FPS, LOOP_SECONDS, STANDBY_SECONDS, buildCountdownTimeline, sec} from './config/timeline';
import {HEIGHT, WIDTH} from './theme/tokens';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="PreShowLoop"
			component={PreShowLoop}
			width={WIDTH}
			height={HEIGHT}
			fps={FPS}
			durationInFrames={sec(LOOP_SECONDS)}
			defaultProps={{config: showConfig, audio: null} satisfies PreShowLoopProps}
			calculateMetadata={async ({props}) => ({props: {...props, audio: await loadManifest()}})}
		/>
		<Composition
			id="FinalCountdown"
			component={FinalCountdown}
			width={WIDTH}
			height={HEIGHT}
			fps={FPS}
			durationInFrames={buildCountdownTimeline(5).totalFrames}
			defaultProps={{config: showConfig, minutes: 5, audio: null} satisfies FinalCountdownProps}
			calculateMetadata={async ({props}) => {
				const minutes = Number.isFinite(props.minutes) && props.minutes > 0 ? props.minutes : 5;
				return {
					durationInFrames: buildCountdownTimeline(minutes).totalFrames,
					props: {...props, minutes, audio: await loadManifest()},
				};
			}}
		/>
		<Composition
			id="Standby"
			component={Standby}
			width={WIDTH}
			height={HEIGHT}
			fps={FPS}
			durationInFrames={sec(STANDBY_SECONDS)}
			defaultProps={{config: showConfig, audio: null} satisfies StandbyProps}
			calculateMetadata={async ({props}) => ({props: {...props, audio: await loadManifest()}})}
		/>
	</>
);
