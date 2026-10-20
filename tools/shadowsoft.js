// How soft a shadow edge is, counted off a picture.
//
// A shadow edge is a step in brightness. A hard one goes from lit to shaded in a pixel or two; a soft one
// spends half a dozen pixels on the crossing. This walks every row of each picture, looks for the biggest
// sideways step in it, and measures how far apart the 10% and the 90% marks of that step are — the width of
// the crossing. The median over the twenty biggest steps in the frame is the number to compare between
// pictures. Steps that are really object edges (a post against grass) are as real as shadow edges, so this
// is a comparison between pictures of the same view, not a claim about the world.
//
//   node tools/shadowsoft.js pictures/a.png pictures/b.png ...
import fs from "node:fs";
import { PNG } from "pngjs";

const files = process.argv.slice(2);
if (files.length < 1) {
	console.log("usage: node tools/shadowsoft.js <picture.png> [...more]");
	process.exit(1);
}

for (const file of files) {
	const png = PNG.sync.read(fs.readFileSync(file));
	const lum = (x, y) => {
		const i = (png.width * y + x) << 2;
		return 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
	};
	const widths = [];
	for (let y = 4; y < png.height - 4; y += 2) {
		let best = 0;
		let bestX = -1;
		for (let x = 6; x < png.width - 6; x++) {
			const step = Math.abs(lum(x + 3, y) - lum(x - 3, y));
			if (step > best) {
				best = step;
				bestX = x;
			}
		}
		// A step under 12 of 255 across six pixels is texture, not a shadow edge.
		if (best < 12 || bestX < 0) continue;
		// Which way does it step, and where do the ten and ninety per cents of that step fall?
		const before = lum(bestX - 4, y);
		const after = lum(bestX + 4, y);
		const low = Math.min(before, after);
		const high = Math.max(before, after);
		const span = high - low;
		if (span < 12) continue;
		const lo = low + span * 0.1;
		const hi = low + span * 0.9;
		let left = bestX;
		let right = bestX;
		for (let x = bestX; x > 1; x--) {
			const v = lum(x, y);
			if ((after > before && v < lo) || (after < before && v > hi)) {
				left = x;
				break;
			}
			left = x;
		}
		for (let x = bestX; x < png.width - 2; x++) {
			const v = lum(x, y);
			if ((after > before && v > hi) || (after < before && v < lo)) {
				right = x;
				break;
			}
			right = x;
		}
		widths.push({ w: right - left, step: span });
	}
	widths.sort((a, b) => b.step - a.step);
	const top = widths.slice(0, 20).map((d) => d.w);
	const median = top.length ? top.slice().sort((a, b) => a - b)[Math.floor(top.length / 2)] : -1;
	const mean = top.length ? top.reduce((s, w) => s + w, 0) / top.length : -1;
	console.log(
		`${file}  steps found ${widths.length}  biggest twenty: median crossing ${median}px  mean ${mean.toFixed(1)}px`,
	);
}
