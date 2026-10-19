// The measurements that tools/pixels.js prints, as a function, so other tools can use them too.

export function luminance(r, g, b) {
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Counts over one rectangle of a picture: mean colour, how much is pure white or pure black,
 * how much of it is in colour, and how many different colours appear.
 * data is the raw RGBA bytes, as pngjs gives them.
 */
export function regionStats(data, width, x0, x1, y0, y1) {
	let n = 0;
	let sumR = 0;
	let sumG = 0;
	let sumB = 0;
	let white = 0;
	let black = 0;
	let colour = 0;
	// The bright end on its own, because that is where a picture loses a sunlit Villa: how much of
	// the frame is lit up to L200 and above, how much of that is past L230, how much is at the
	// ceiling (L248 and above, where a renderer has stopped telling one surface from the next), and
	// what colour and what channel spread the lit band holds.
	let bright = 0;
	let brightHigh = 0;
	let ceiling = 0;
	let brightSpread = 0;
	let brightR = 0;
	let brightG = 0;
	let brightB = 0;
	let spreadSum = 0;
	const seen = new Set();
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const i = (y * width + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			n++;
			sumR += r;
			sumG += g;
			sumB += b;
			const l = luminance(r, g, b);
			if (l < 8) black++;
			if (r > 246 && g > 246 && b > 246) white++;
			const spread = Math.max(r, g, b) - Math.min(r, g, b);
			if (spread > 26) colour++;
			spreadSum += spread;
			if (l >= 200) {
				bright++;
				brightR += r;
				brightG += g;
				brightB += b;
				brightSpread += spread;
			}
			if (l >= 230) brightHigh++;
			if (l >= 248) ceiling++;
			seen.add((r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3));
		}
	}
	return {
		r: sumR / n,
		g: sumG / n,
		b: sumB / n,
		l: luminance(sumR / n, sumG / n, sumB / n),
		white: white / n,
		black: black / n,
		colour: colour / n,
		spread: spreadSum / n,
		bright: bright / n,
		brightHigh: brightHigh / n,
		ceiling: ceiling / n,
		brightColour: bright ? [brightR / bright, brightG / bright, brightB / bright] : null,
		brightSpread: bright ? brightSpread / bright : 0,
		distinct: seen.size,
	};
}

/** Whole picture, plus the three horizontal bands a visitor reads it in: sky, middle, ground. */
export function pictureStats(data, width, height) {
	return {
		all: regionStats(data, width, 0, width, 0, height),
		sky: regionStats(data, width, 0, width, 0, Math.floor(height * 0.28)),
		middle: regionStats(data, width, 0, width, Math.floor(height * 0.28), Math.floor(height * 0.6)),
		ground: regionStats(data, width, 0, width, Math.floor(height * 0.6), height),
	};
}

export function describe(stats) {
	const c = (s) => `${Math.round(s.r)},${Math.round(s.g)},${Math.round(s.b)} L${Math.round(s.l)}`;
	const b = stats.all;
	const lit = b.bright
		? `lit ${Math.round(b.brightColour[0])},${Math.round(b.brightColour[1])},${Math.round(b.brightColour[2])} s${b.brightSpread.toFixed(0)} `
		: "";
	return (
		`all ${c(stats.all)} k${(stats.all.black * 100).toFixed(1)}% c${(stats.all.colour * 100).toFixed(0)}% s${stats.all.spread.toFixed(0)} v${stats.all.distinct} | ` +
		`>200 ${(b.bright * 100).toFixed(1)}% >230 ${(b.brightHigh * 100).toFixed(1)}% ceiling ${(b.ceiling * 100).toFixed(2)}% | ${lit}` +
		`sky ${c(stats.sky)} | mid ${c(stats.middle)} | ground ${c(stats.ground)}`
	);
}
