// The mean colour of a list of rectangles in a picture, several pictures at a time.
//
//   node tools/bands.js pictures/1051-home.png 350,600,900,646 350,510,900,558 350,468,900,498
//   node tools/bands.js --list rects.txt /tmp/pitfill/*.png
//   node tools/bands.js --labels "near,mid,far" pictures/1051-home.png 350,600,900,646 ...
//
// `tools/pixels.js --patch` cuts a patch into blocks and compares the blocks with each other, which is the
// right question for "is this stretch flat". This asks the other question: how bright is each of several
// NAMED places, in one run, across several pictures — which is how one compares the foot of a pool against
// its far wall, or the same two places before and after a change.
//
// A rectangle is x0,y0,x1,y1 in pixels of the picture the file holds, which may not be the size the tool
// that wrote it asked for; the numbers are printed with the size on the first line so a mistake shows.

import fs from "node:fs";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
function flag(name, dflt) {
	const i = args.indexOf(name);
	return i < 0 ? dflt : args.splice(i, 2)[1];
}
const listFile = flag("--list", "");
const labelText = flag("--labels", "");
const files = args.filter((a) => !a.startsWith("--") && !/^\d+,\d+,\d+,\d+$/.test(a));
const rects = listFile
	? fs
		.readFileSync(listFile, "utf8")
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
	: args.filter((a) => /^\d+,\d+,\d+,\d+$/.test(a));
const labels = labelText ? labelText.split(",") : [];

if (!files.length || !rects.length) {
	console.log('usage: node tools/bands.js <picture.png ...> <x0,y0,x1,y1 ...> [--labels a,b,c] [--list rects.txt]');
	process.exit(0);
}
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

for (const file of files) {
	const png = PNG.sync.read(fs.readFileSync(file));
	console.log(`${file}  ${png.width}x${png.height}`);
	rects.forEach((rect, i) => {
		const [x0, y0, x1, y1] = rect.split(",").map(Number);
		let r = 0;
		let g = 0;
		let b = 0;
		let n = 0;
		let darkest = 999;
		let brightest = -1;
		let darkText = "";
		let brightText = "";
		for (let y = Math.max(0, y0); y < Math.min(png.height, y1); y++) {
			for (let x = Math.max(0, x0); x < Math.min(png.width, x1); x++) {
				const p = (png.width * y + x) << 2;
				const pr = png.data[p];
				const pg = png.data[p + 1];
				const pb = png.data[p + 2];
				r += pr;
				g += pg;
				b += pb;
				n++;
				const l = luminance(pr, pg, pb);
				if (l < darkest) {
					darkest = l;
					darkText = `${pr},${pg},${pb}`;
				}
				if (l > brightest) {
					brightest = l;
					brightText = `${pr},${pg},${pb}`;
				}
			}
		}
		if (!n) {
			console.log(`  ${labels[i] || rect}  NOTHING AT THAT PLACE`);
			return;
		}
		r = Math.round(r / n);
		g = Math.round(g / n);
		b = Math.round(b / n);
		const warm = r - b;
		console.log(
			`  ${(labels[i] || rect).padEnd(26)} ${String(r).padStart(3)},${String(g).padStart(3)},${String(b).padStart(3)}` +
				`  L${Math.round(luminance(r, g, b)).toString().padStart(3)}` +
				`  warm ${warm > 0 ? "+" : ""}${warm}` +
				`  runs L${Math.round(darkest)} (${darkText}) to L${Math.round(brightest)} (${brightText})` +
				`  [${n} px]`
		);
	});
}
