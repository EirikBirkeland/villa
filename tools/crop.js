// Cuts a rectangle out of a picture and writes it on its own, so a part of the Villa can be looked
// at close up instead of in a whole frame shrunk down. A zoom of the horizon, a window, one shrub.
//
//   node tools/crop.js pictures/177-home.png /tmp/blobs.png 700 60 580 320
//   node tools/crop.js pictures/177-home.png /tmp/blobs.png 700 60 580 320 --scale 2
//
// The numbers are the left, top, width and height in pixels of the picture asked for. --scale draws
// each pixel of the crop as that many pixels of the crop made bigger, which is the only way to see a
// one-pixel wire or a leaf edge once a viewer shrinks the file.

import fs from "fs";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
const [file, out, x, y, w, h] = args;
const scaleAt = args.indexOf("--scale");
const scale = scaleAt >= 0 ? Number(args[scaleAt + 1]) || 1 : 1;
if (!file || !out || [x, y, w, h].some((v) => v === undefined)) {
	console.log("usage: node tools/crop.js <in.png> <out.png> <x> <y> <w> <h> [--scale N]");
	process.exit(1);
}

const src = PNG.sync.read(fs.readFileSync(file));
const bw = Math.round(w);
const bh = Math.round(h);
const s = Math.max(1, Math.round(scale || 1));
const dst = new PNG({ width: bw * s, height: bh * s });

for (let row = 0; row < bh * s; row++) {
	for (let col = 0; col < bw * s; col++) {
		const sy = Math.min(src.height - 1, Math.round(y) + Math.floor(row / s));
		const sx = Math.min(src.width - 1, Math.round(x) + Math.floor(col / s));
		const i = (sy * src.width + sx) * 4;
		const o = (row * bw * s + col) * 4;
		dst.data[o] = src.data[i];
		dst.data[o + 1] = src.data[i + 1];
		dst.data[o + 2] = src.data[i + 2];
		dst.data[o + 3] = 255;
	}
}
fs.writeFileSync(out, PNG.sync.write(dst));
console.log(`wrote ${out} (${bw}x${bh} from ${file}, x${x} y${y}${s > 1 ? `, ${s}x bigger` : ""})`);
