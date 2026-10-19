// crown — how flat is the top of a plant in a picture, in pixels.
//
// A clipped shrub is cut with a board, so its crown is a plateau with a ragged edge. A shrub that was
// never cut is a dome. This measures which of the two a picture actually shows: it walks down every
// column of a rectangle until it finds the first leaf pixel, and then says how much that top edge
// wanders across the middle of the plant.
//
//   node tools/crown.js pictures/bush.png 300,150,700,300
//   node tools/crown.js pictures/bush.png 300,150,700,300 --step 4 --band 0.6
//
// A rectangle is x0,y0,x1,y1 in the picture's own pixels, and it should hold the plant's crown and the
// sky or wall behind it and nothing else green — a leaf pixel is a pixel with clearly more green in it
// than red or blue, which is true of a leaf and not of sky, plaster, stone, dirt or water.
//
// `--step` is how many pixels across each reading is (default 2). `--band` is how much of the width is
// measured, centred on the middle (default 0.6, so the middle sixty per cent: the ends of a plant are
// its shoulders and they are allowed to hang low).
//
// What to read: `wanders` is the standard deviation of the top edge inside the band, in pixels, and
// `drops` is its highest pixel to its lowest. A dome drops a lot; a board cut drops a little. `plateau`
// is the share of columns that land within 3 pixels of the crown's own middle height — the flat part.

import fs from "node:fs";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
function flag(name, dflt) {
	const i = args.indexOf(name);
	return i < 0 ? dflt : Number(args.splice(i, 2)[1]);
}
const step = flag("--step", 2);
const band = flag("--band", 0.6);

const file = args.find((a) => !a.startsWith("--") && !/^\d+,\d+,\d+,\d+$/.test(a));
const rect = args.find((a) => /^\d+,\d+,\d+,\d+$/.test(a));
if (!file || !rect) {
	console.log("usage: node tools/crown.js <picture.png> <x0,y0,x1,y1> [--step n] [--band 0.6]");
	process.exit(0);
}

const png = PNG.sync.read(fs.readFileSync(file));
const [x0, y0, x1, y1] = rect.split(",").map(Number);

function leafAt(x, y) {
	const p = (png.width * y + x) << 2;
	const r = png.data[p];
	const g = png.data[p + 1];
	const b = png.data[p + 2];
	return g > r + 12 && g > b + 12;
}

const tops = [];
for (let x = x0; x <= x1; x += step) {
	let found = -1;
	for (let y = y0; y <= y1; y++) {
		if (leafAt(x, y)) {
			found = y;
			break;
		}
	}
	tops.push({ x, y: found });
}

const inside = bandFrom(tops, band);
function bandFrom(list, fraction) {
	const seen = list.filter((t) => t.y >= 0);
	if (!seen.length) return [];
	const first = seen[0].x;
	const last = seen[seen.length - 1].x;
	const lo = first + (last - first) * (1 - fraction) * 0.5;
	const hi = last - (last - first) * (1 - fraction) * 0.5;
	return list.filter((t) => t.y >= 0 && t.x >= lo && t.x <= hi);
}

const miss = tops.filter((t) => t.y < 0).length;
console.log(`${file} ${png.width}x${png.height}  rectangle ${rect}, step ${step}, band ${band}`);
console.log(`  columns read ${tops.length}, of which ${miss} found no leaf at all`);
if (!inside.length) {
	console.log("  NOTHING GREEN in that rectangle — is the rectangle on the plant, and is what it is on leaf?");
	process.exit(0);
}
const ys = inside.map((t) => t.y);
const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
const std = Math.sqrt(ys.reduce((a, b) => a + (b - mean) * (b - mean), 0) / ys.length);
const lo = Math.min(...ys);
const hi = Math.max(...ys);
const plateau = ys.filter((y) => Math.abs(y - mean) <= 3).length / ys.length;
console.log(`  the crown's top edge wanders ${std.toFixed(1)} px, drops ${hi - lo} px (${lo} to ${hi})`);
console.log(`  plateau: ${(plateau * 100).toFixed(0)}% of the band's columns are within 3 px of its middle (${mean.toFixed(0)})`);
// A picture of the edge itself: one character column per reading, the crown drawn as a line.
const spark = tops.map((t) => (t.y < 0 ? " " : "▁▂▃▄▅▆▇█"[Math.max(0, Math.min(7, Math.round(((t.y - lo) / Math.max(1, hi - lo)) * 7)))])).join("");
console.log(`  ${spark}`);
console.log("  (left to right across the rectangle; a tall bar is a LOW top edge, a flat row is a flat crown)");
