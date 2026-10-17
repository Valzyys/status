import React from 'react';
import type {RuleIcon, SocialPlatform} from '../config/show.config';

// Ikon garis buatan sendiri: grid 24, stroke 2, rounded. `draw` (0–1) menggambar stroke.

type IconProps = {
	readonly size?: number;
	readonly color: string;
	readonly draw?: number;
	readonly strokeWidth?: number;
};

const Svg: React.FC<IconProps & {children: (p: React.SVGProps<SVGElement>) => React.ReactNode}> = ({
	size = 24,
	color,
	draw = 1,
	strokeWidth = 2,
	children,
}) => {
	const stroke = {
		pathLength: 1,
		strokeDasharray: '1 1',
		strokeDashoffset: 1 - draw,
	} satisfies React.SVGProps<SVGElement>;
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			style={{overflow: 'visible', display: 'block'}}
		>
			{children(stroke)}
		</svg>
	);
};

type StrokeProps = React.SVGProps<SVGElement>;
const P = (d: string, s: StrokeProps) => <path d={d} {...(s as React.SVGProps<SVGPathElement>)} />;

const RULE_PATHS: Record<RuleIcon, (s: StrokeProps) => React.ReactNode> = {
	'no-record': (s) => (
		<>
			{P('M5 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', s)}
			{P('M16 10.5l5-3v9l-5-3', s)}
			{P('M3 3l18 18', s)}
		</>
	),
	chat: (s) => (
		<>
			{P('M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', s)}
			{P('M7.5 9h9', s)}
			{P('M7.5 12.5h5.5', s)}
		</>
	),
	'no-spam': (s) => (
		<>
			{P('M4 10v4h3l7 4V6l-7 4H4z', s)}
			{P('M17.5 9.5a3.5 3.5 0 0 1 0 5', s)}
			{P('M3 3l18 18', s)}
		</>
	),
	wifi: (s) => (
		<>
			{P('M2.5 9a14 14 0 0 1 19 0', s)}
			{P('M5.5 12.5a9.5 9.5 0 0 1 13 0', s)}
			{P('M8.7 16a5 5 0 0 1 6.6 0', s)}
			{P('M12 19.5h.01', s)}
		</>
	),
};

export const RuleIconSvg: React.FC<IconProps & {name: RuleIcon}> = ({name, ...rest}) => (
	<Svg {...rest}>{(s) => RULE_PATHS[name](s)}</Svg>
);

const SOCIAL_PATHS: Record<SocialPlatform, (s: StrokeProps) => React.ReactNode> = {
	instagram: (s) => (
		<>
			{P('M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z', s)}
			{P('M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8z', s)}
			{P('M17.3 6.7h.01', s)}
		</>
	),
	x: (s) => (
		<>
			{P('M4 4l16 16', s)}
			{P('M20 4L4 20', s)}
		</>
	),
	tiktok: (s) => (
		<>
			{P('M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5', s)}
			{P('M14 3c.6 2.6 2.4 4.4 5 4.6', s)}
		</>
	),
	youtube: (s) => (
		<>
			{P('M6 5h12a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z', s)}
			{P('M10 9l5 3-5 3z', s)}
		</>
	),
	web: (s) => (
		<>
			{P('M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0-18z', s)}
			{P('M3 12h18', s)}
			{P('M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z', s)}
		</>
	),
};

export const SocialIconSvg: React.FC<IconProps & {platform: SocialPlatform}> = ({platform, ...rest}) => (
	<Svg {...rest}>{(s) => SOCIAL_PATHS[platform](s)}</Svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
	<Svg {...props}>
		{(s) => (
			<>
				{P('M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', s)}
				{P('M4 10h16', s)}
				{P('M8 3v4', s)}
				{P('M16 3v4', s)}
			</>
		)}
	</Svg>
);

export const PinIcon: React.FC<IconProps> = (props) => (
	<Svg {...props}>
		{(s) => (
			<>
				{P('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', s)}
				{P('M12 7a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5z', s)}
			</>
		)}
	</Svg>
);

/** Separator ✦ sebagai SVG (bukan emoji). */
export const Sparkle: React.FC<{size?: number; color: string}> = ({size = 14, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
		<path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z" fill={color} />
	</svg>
);
