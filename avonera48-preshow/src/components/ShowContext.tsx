import React, {createContext, useContext, useMemo} from 'react';
import type {ShowConfig} from '../config/show.config';
import {formatIndoDate, resolveGreeting} from '../config/greeting';
import type {Greeting, IndoDate} from '../config/greeting';

export type ShowData = {
	readonly config: ShowConfig;
	readonly colors: ShowConfig['colors'];
	readonly greeting: Greeting;
	readonly date: IndoDate;
	/** "Minggu, 18 Oktober 2026 · 14:00 WIB" */
	readonly scheduleLine: string;
};

const Ctx = createContext<ShowData | null>(null);

export const ShowProvider: React.FC<{config: ShowConfig; children: React.ReactNode}> = ({
	config,
	children,
}) => {
	const value = useMemo<ShowData>(() => {
		const date = formatIndoDate(config.show.date);
		return {
			config,
			colors: config.colors,
			greeting: resolveGreeting(config.show),
			date,
			scheduleLine: `${date.full} · ${config.show.time} ${config.show.timezone}`,
		};
	}, [config]);
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useShow = (): ShowData => {
	const v = useContext(Ctx);
	if (!v) throw new Error('useShow() harus dipakai di dalam <ShowProvider>');
	return v;
};
