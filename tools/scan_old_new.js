// Two picture sets, side by side, so a session can say what it changed in numbers a reader can check.
//
//   node tools/scan_old_new.js 025 042
//
// Reads tools/cameras.txt for the view names, so `025-home.png` is weighed against `042-home.png`.
// Prints the average colour, how much of each frame is white or black or in colour, and how much
// sits at either end of the scale — the ends are where a picture loses detail.

import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function weigh(file) {
	const { width, height, data } = PNG.sync.read(fs.readFileSync(file));
	let r = 0, g = 0, b = 0, white = 0, black = 0, colour = 0, bright = 0, dark = 0;
	// The lit band on its own: everything at L200 and above, what colour it came out, and how much
	// channel spread is left in it. That is where a sunlit Villa is won or lost.
	let lit = 0, litR = 0, litG = 0, litB = 0, litSpread = 0;
	const n = width * height;
	for (let i = 0; i < n; i++) {
		const p = i * 4;
		const R = data[p], G = data[p + 1], B = data[p + 2];
		r += R; g += G; b += B;
		if (R > 246 && G > 246 && B > 246) white++;
		if (R < 9 && G < 9 && B < 9) black++;
		const spread = Math.max(R, G, B) - Math.min(R, G, B);
		if (spread > 24) colour++;
		const l = luminance(R, G, B);
		if (l >= 240) bright++;
		if (l <= 31) dark++;
		if (l >= 200) { lit++; litR += R; litG += G; litB += B; litSpread += spread; }
	}
	const pc = (v) => (100 * v) / n;
	return {
		l: Math.round(luminance(r / n, g / n, b / n)),
		white: pc(white), black: pc(black), colour: pc(colour), bright: pc(bright), dark: pc(dark),
		lit: pc(lit),
		litColour: lit ? `${Math.round(litR / lit)},${Math.round(litG / lit)},${Math.round(litB / lit)} s${Math.round(litSpread / lit)}` : "-",
	};
}

const [oldBase, newBase, dir = "pictures"] = process.argv.slice(2);
if (!oldBase || !newBase) {
	console.log("usage: node tools/scan_old_new.js <old number> <new number> [folder]");
	process.exit(1);
}
const views = fs.readFileSync(new URL("cameras.txt", import.meta.url), "utf8")
	.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"))
	.map((l) => l.trim().split(/\s+/)[0]);

const f1 = (v) => v.toFixed(1);
const pair = (a, c) => `${f1(a)} -> ${f1(c)}`;
console.log("view          luminance        white %        black %      in colour %    bright L>=240   dark L<=31     lit L>=200 % and its colour");
for (let i = 0; i < views.length; i++) {
	const name = views[i];
	let a, c;
	try {
		a = weigh(path.join(dir, `${String(+oldBase + i).padStart(3, "0")}-${name}.png`));
		c = weigh(path.join(dir, `${String(+newBase + i).padStart(3, "0")}-${name}.png`));
	} catch (e) {
		console.log(`${name.padEnd(13)}${e.message}`);
		continue;
	}
	console.log(
		name.padEnd(13) +
		`${String(a.l).padStart(3)} -> ${String(c.l).padEnd(3)} (${c.l - a.l >= 0 ? "+" : ""}${c.l - a.l})   ` +
		`${pair(a.white, c.white).padEnd(14)} ${pair(a.black, c.black).padEnd(12)} ` +
		`${pair(a.colour, c.colour).padEnd(14)} ${pair(a.bright, c.bright).padEnd(15)} ${pair(a.dark, c.dark).padEnd(13)} ` +
		`${pair(a.lit, c.lit).padEnd(9)} ${a.litColour} -> ${c.litColour}`
	);
}
