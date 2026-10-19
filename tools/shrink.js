// tools/shrink.js — make a small copy of a picture, so a session can look at one without
// swallowing a 1.4 MB file whole.
//
//   node tools/shrink.js pictures/196-home.png pictures/tmp-small.png 320
//
// The number is the width in pixels; the height follows the picture's own shape. It only resamples
// (box averages over each block), it adds nothing and takes nothing away, and it prints what it made.
// Read the small picture with the same eyes as the big one: it is for judging the whole view — where
// the light is, what fills the frame, whether a thing reads — and not for the last shade of a colour.

import fs from "node:fs";
import { PNG } from "pngjs";

const [inPath, outPath, wantWidth] = process.argv.slice(2);
if (!inPath || !outPath) {
	console.log('usage: node tools/shrink.js <in.png> <out.png> [width = 320]');
	process.exit(0);
}
const png = PNG.sync.read(fs.readFileSync(inPath));
const w = Math.max(8, Math.min(png.width, parseInt(wantWidth || "320", 10)));
const h = Math.max(1, Math.round((w / png.width) * png.height));
const out = new PNG({ width: w, height: h });

// A straight average of the source block each output pixel covers.
const sx = png.width / w;
const sy = png.height / h;
for (let y = 0; y < h; y++) {
	for (let x = 0; x < w; x++) {
		const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
		const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
		let r = 0, g = 0, b = 0, n = 0;
		for (let yy = y0; yy < y1; yy++) {
			for (let xx = x0; xx < x1; xx++) {
				const i = (png.width * yy + xx) << 2;
				r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
			}
		}
		const o = (w * y + x) << 2;
		out.data[o] = Math.round(r / n);
		out.data[o + 1] = Math.round(g / n);
		out.data[o + 2] = Math.round(b / n);
		out.data[o + 3] = 255;
	}
}
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`shrink: ${inPath} ${png.width}x${png.height} -> ${outPath} ${w}x${h}`);
