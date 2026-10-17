import React, {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {waitForFonts} from '../theme/tokens';

/**
 * Tahan render sampai font siap, supaya pengukuran teks (fitText/measureText) akurat.
 */
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
	const [handle] = useState(() => delayRender('Memuat font'));
	const [ready, setReady] = useState(false);

	useEffect(() => {
		waitForFonts()
			.then(() => {
				setReady(true);
				continueRender(handle);
			})
			.catch((err: unknown) => cancelRender(err));
	}, [handle]);

	return ready ? <>{children}</> : null;
};
