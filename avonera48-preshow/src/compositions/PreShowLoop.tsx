import React, {useMemo} from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation} from '@remotion/transitions';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {AudioBed} from '../audio/AudioBed';
import type {AudioManifest} from '../audio/manifest';
import type {ShowConfig} from '../config/show.config';
import {TRANSITION_FRAMES, buildLoopTimeline} from '../config/timeline';
import type {SceneTimeline} from '../config/timeline';
import {FontGate} from '../components/FontGate';
import {InfoChip} from '../components/InfoChip';
import {LiveBadge} from '../components/LiveBadge';
import {ShowProvider, useShow} from '../components/ShowContext';
import {StageBackground} from '../components/StageBackground';
import {Ticker} from '../components/Ticker';
import {Connect} from '../scenes/Connect';
import {Etiquette} from '../scenes/Etiquette';
import {InfoShow} from '../scenes/InfoShow';
import {Opening} from '../scenes/Opening';
import {Partner} from '../scenes/Partner';
import {StageInterlude} from '../scenes/StageInterlude';
import {StayTuned} from '../scenes/StayTuned';
import {lightSweep, maskSlide, zoomBlur} from '../transitions';
import type {ColorProps} from '../transitions';

export type PreShowLoopProps = {
	readonly config: ShowConfig;
	readonly audio: AudioManifest | null;
};

export const useLoopTimeline = (config: ShowConfig) =>
	useMemo(
		() =>
			buildLoopTimeline({
				hasSponsors: config.sponsors.length > 0,
				hasSocials: config.socials.length > 0,
				ruleCount: Math.min(4, config.rules.length),
				socialCount: Math.min(4, config.socials.length),
			}),
		[config],
	);

const SceneContent: React.FC<{scene: SceneTimeline; bgmSrc: string | null}> = ({scene, bgmSrc}) => {
	switch (scene.id) {
		case 'opening':
			return <Opening cues={(scene as SceneTimeline<'opening'>).cues} />;
		case 'info':
			return <InfoShow cues={(scene as SceneTimeline<'info'>).cues} />;
		case 'interlude':
			return (
				<StageInterlude cues={(scene as SceneTimeline<'interlude'>).cues} durationInFrames={scene.durationInFrames} />
			);
		case 'rules':
			return <Etiquette cues={(scene as SceneTimeline<'rules'>).cues} />;
		case 'partner':
			return <Partner cues={(scene as SceneTimeline<'partner'>).cues} />;
		case 'connect':
			return <Connect cues={(scene as SceneTimeline<'connect'>).cues} />;
		case 'stayTuned':
			return (
				<StayTuned cues={(scene as SceneTimeline<'stayTuned'>).cues} bgmSrc={bgmSrc} sceneFrom={scene.from} />
			);
	}
};

const Inner: React.FC<{audio: AudioManifest | null}> = ({audio}) => {
	const frame = useCurrentFrame();
	const {config, colors} = useShow();
	const tl = useLoopTimeline(config);

	const bgmAsset = audio?.bgm.loop;
	const bgmSrc = bgmAsset ? staticFile(bgmAsset.file) : null;

	const presentations: Array<(color: string) => TransitionPresentation<ColorProps>> = [
		lightSweep,
		maskSlide,
		zoomBlur,
	];

	const absSfx = tl.scenes.flatMap((s) => s.sfx.map((c) => ({...c, at: s.from + c.at})));
	const absVo = tl.scenes.flatMap((s) => s.vo.map((c) => ({...c, at: s.from + c.at})));

	return (
		<AbsoluteFill>
			<StageBackground loopFrames={tl.totalFrames} activity={tl.activityAt(frame)} />
			<TransitionSeries>
				{tl.scenes.flatMap((scene, i) => {
					const seq = (
						<TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationInFrames} name={scene.id}>
							<SceneContent scene={scene} bgmSrc={bgmSrc} />
						</TransitionSeries.Sequence>
					);
					if (i === tl.scenes.length - 1) return [seq];
					const make = presentations[i % presentations.length] ?? presentations[0];
					return [
						seq,
						<TransitionSeries.Transition
							key={`${scene.id}-t`}
							timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
							presentation={make ? make(colors.accent) : undefined}
						/>,
					];
				})}
			</TransitionSeries>
			<InfoChip />
			<LiveBadge />
			<Ticker loopFrames={tl.totalFrames} />
			{audio ? (
				<AudioBed
					manifest={audio}
					bgm="loop"
					loopFrames={tl.totalFrames}
					sfx={absSfx}
					vo={absVo}
					bgmBoostDbAt={tl.bgmBoostDbAt}
				/>
			) : null}
		</AbsoluteFill>
	);
};

export const PreShowLoop: React.FC<PreShowLoopProps> = ({config, audio}) => (
	<ShowProvider config={config}>
		<FontGate>
			<Inner audio={audio} />
		</FontGate>
	</ShowProvider>
);
