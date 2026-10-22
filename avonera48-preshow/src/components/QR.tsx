import React, {useMemo} from 'react';
import QRCode from 'qrcode';

/**
 * QR code digambar sebagai SVG dari matriks modul. `reveal` (0–1) memunculkan modul
 * secara diagonal dari pojok kiri atas.
 */
export const QR: React.FC<{value: string; size: number; reveal: number; fg: string; bg: string}> = ({
	value,
	size,
	reveal,
	fg,
	bg,
}) => {
	const matrix = useMemo(() => {
		const qr = QRCode.create(value, {errorCorrectionLevel: 'M'});
		const n = qr.modules.size;
		const cells: Array<[number, number]> = [];
		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; x++) {
				if (qr.modules.get(y, x)) cells.push([x, y]);
			}
		}
		return {n, cells};
	}, [value]);

	const quiet = 2;
	const total = matrix.n + quiet * 2;
	const front = reveal * (matrix.n * 2 + 8);

	return (
		<svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges">
			<rect width={total} height={total} fill={bg} />
			{matrix.cells.map(([x, y]) => {
				const local = Math.min(1, Math.max(0, (front - (x + y)) / 8));
				if (local <= 0) return null;
				const s = local;
				return (
					<rect
						key={`${x}-${y}`}
						x={x + quiet + (1 - s) / 2}
						y={y + quiet + (1 - s) / 2}
						width={s + 0.02}
						height={s + 0.02}
						fill={fg}
					/>
				);
			})}
		</svg>
	);
};
