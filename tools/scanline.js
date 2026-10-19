// The colour of every pixel along one row or one column of a picture, printed in order.
//
//   node tools/scanline.js <picture.png> --row 300 --from 1080 --to 1200
//   node tools/scanline.js <picture.png> --col 640 --from 100 --to 300 [--step 2] [--run 3]
//
// `tools/pixels.js --at` asks named pixels one at a time, which is no use hunting a hairline: a
// two-pixel stripe of grass between a capstone and a paving slab is found by reading a line of
// pixels straight across it and seeing where the colour steps. `--run 3` collapses the print so a
// band of the same colour is one line with the pixels it covers, which is how a stripe is measured
// in pixels; `warm` (red minus blue) is on every line, because a green hairline and a dark shadow
// both read as "less light" and only the channels tell them apart.

import fs from "fs";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const get = (name, dflt) => {
	const i = args.indexOf("--" + name);
	return i >= 0 ? args[i + 1] : dflt;
};
if (!file) {
	console.log("usage: node tools/scanline.js <picture.png> --row N|--col N --from A --to B [--step 1] [--run 0]");
	process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(file));
const at = (x, y) => {
	const i = (png.width * y + x) << 2;
	return [png.data[i], png.data[i + 1], png.data[i + 2]];
};

const axis = get("row", null) !== null ? "row" : "col";
const fixed = Number(get(axis, 0));
const a = Number(get("from", 0));
const b = Number(get("to", axis === "row" ? png.width - 1 : png.height - 1));
const step = Number(get("step", 1));
const run = Number(get("run", 0));

const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const lines = [];
for (let p = a; p <= b; p += step) {
	const c = axis === "row" ? at(p, fixed) : at(fixed, p);
	lines.push({ p, c, l: lum(c), warm: c[0] - c[2] });
}

if (!run) {
	for (const s of lines) console.log(`${String(s.p).padStart(5)}  ${s.c.join(",").padStart(11)}  L${s.l.toFixed(0).padStart(3)}  warm ${s.warm}`);
} else {
	// A band is a stretch of neighbours whose channels all stay within `run` of the band's first pixel.
	let band = [lines[0]];
	const flush = (band) => {
		const first = band[0];
		const last = band[band.length - 1];
		console.log(`${String(first.p).padStart(5)}-${String(last.p).padEnd(5)} (${String(band.length).padStart(3)} px)  ${first.c.join(",").padStart(11)}  L${first.l.toFixed(0).padStart(3)}  warm ${first.warm}`);
	};
	for (const s of lines.slice(1)) {
		const f = band[0].c;
		const far = Math.abs(s.c[0] - f[0]) > run || Math.abs(s.c[1] - f[1]) > run || Math.abs(s.c[2] - f[2]) > run;
		if (far) flush(band), (band = [s]);
		else band.push(s);
	}
	flush(band);
}
