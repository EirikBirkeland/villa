// tools/duckfoot.js — how many pixels the toy duck actually paints, and what colour they are.
//
// The duck is yellow, which is easy to find until the terrace, the pots, the string bulbs and the marigolds
// are all counted too (a loose test in the start view found 164,757 "duck" pixels, which is a tenth of the
// frame and most of it decking). So a pixel counts only when it is a fat yellow AND the water all round it
// is blue: a yellow island in cyan is the duck, and a yellow island in warm stone is a pot.
import { PNG } from "pngjs";
import fs from "node:fs";

const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf(n); return i < 0 ? d : a[i + 1]; };
const png = PNG.sync.read(fs.readFileSync(opt("--in", "pictures/tmp-duck.png")));

const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
const yellow = ([r, g, b]) => r > 170 && g > 130 && b < 130 && r - b > 140 && g - b > 55;
const blue = ([r, , b]) => b > r + 8;

let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, rs = 0, gs = 0, bs = 0;
const found = new Set();
for (let y = 6; y < png.height - 6; y++) {
	for (let x = 6; x < png.width - 6; x++) {
		const c = at(x, y);
		if (!yellow(c)) continue;
		let water = 0, ring = 0;
		for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) {
			if (dx * dx + dy * dy < 20) continue;
			ring++;
			if (blue(at(x + dx, y + dy))) water++;
		}
		if (water / ring < 0.5) continue;
		n++; found.add(`${x},${y}`);
		x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
		rs += c[0]; gs += c[1]; bs += c[2];
	}
}
// More than one thing in this Villa is yellow with blue water behind it — the wet coping catches the test at
// its lower edge — so only the biggest FLOCK of matching pixels is the duck. Everything else is reported
// alongside, because a tool that quietly reports the wrong blob is worse than no tool.
const seen = new Set();
const flocks = [];
for (const key of found) {
	if (seen.has(key)) continue;
	const stack = [key];
	const flock = [];
	seen.add(key);
	while (stack.length) {
		const [cx, cy] = stack.pop().split(",").map(Number);
		flock.push([cx, cy]);
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			for (let step = 1; step <= 2; step++) {
				const nk = `${cx + dx * step},${cy + dy * step}`;
				if (found.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
			}
		}
	}
	flocks.push(flock);
}
flocks.sort((a, b) => b.length - a.length);
const best = flocks[0] || [];
// The strong-yellow count is only the skin of the thing: a pixel in the middle of the duck's back has duck
// all round it and fails the water test. So the box is grown to everything of the same colour within 14 px
// of the biggest flock, which is the footprint a person would point at.
const near = [];
for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
	if (!yellow(at(x, y))) continue;
	for (const [px, py] of best) if (Math.abs(px - x) < 14 && Math.abs(py - y) < 14) { near.push([x, y]); break; }
}
const use = near.length ? near : best;
const bx = use.map((p) => p[0]); const by = use.map((p) => p[1]);
let br = 0, bg = 0, bb = 0;
for (const [x, y] of use) { const c = at(x, y); br += c[0]; bg += c[1]; bb += c[2]; }
console.log(`${opt("--in")} duck: ${use.length} px` + (use.length
	? `, ${Math.max(...bx) - Math.min(...bx) + 1}x${Math.max(...by) - Math.min(...by) + 1} at ${Math.min(...bx)},${Math.min(...by)}, mean ${Math.round(br / use.length)},${Math.round(bg / use.length)},${Math.round(bb / use.length)}`
	: " — none found in water")
	+ ` (strong yellow next to water: ${best.length})`);
