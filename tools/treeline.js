// Reads the skyline of a picture: how high up the frame the trees come, and how ragged their top edge is.
//
//   node tools/treeline.js pictures/183-west.png
//   node tools/treeline.js pictures/183-west.png [--col 8] [--from 0.05] [--to 0.75] [--print]
//
// A wood and a fence differ here. A fence has one height and a straight top; a wood has clumps of
// different heights, gaps where the sky comes down between the crowns, and a top edge that steps about
// from crown to crown. This walks every column of the picture from the top down, calls the first pixel
// that is leaf or hill rather than sky the top of the trees there, and prints what it found.
//
// What it prints, per picture:
//   sky share        how much of the frame is sky (the top band down to --to)
//   tree top         the mean and spread of that edge, in pixels and as a share of the frame's height
//   steps            how many times the edge moves by more than --col pixels between one column and the
//                    next: a smooth dome answers with two (up and back down), a ragged crown answers with many
//   sky gaps         runs of columns where the edge sits above the mean by a tenth of the frame: the
//                    holes the sky gets down through between the crowns
// --print draws the edge as a map one character per column, so a session that cannot see the picture
// can still see the shape of the skyline.

import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
	console.log("usage: node tools/treeline.js <picture.png> [--col 8] [--from 0.05] [--to 0.75] [--print]");
	process.exit(1);
}
const flag = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const minStep = Number(flag("col", 8));
const from = Number(flag("from", 0.05));
const to = Number(flag("to", 0.75));
const wantPrint = args.includes("--print");

const png = PNG.sync.read(fs.readFileSync(file));
const { width, height, data } = png;
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Sky is the pale cool thing at the top of a frame: brighter than anything leaf, and blue leaning.
// Everything the skyline can be made of — leaf, hill, roof — is either green or dark.
function isSky(x, y) {
	const i = (y * width + x) * 4;
	const r = data[i];
	const g = data[i + 1];
	const b = data[i + 2];
	return b >= g - 4 && b >= r && luminance(r, g, b) > 110;
}

const y0 = Math.floor(height * from);
const y1 = Math.floor(height * to);
const edge = new Array(width).fill(-1);
let noTree = 0;
for (let x = 0; x < width; x++) {
	let found = -1;
	for (let y = y0; y < y1; y++) {
		if (!isSky(x, y)) {
			found = y;
			break;
		}
	}
	if (found < 0) noTree++;
	edge[x] = found;
}

const found = edge.filter((e) => e >= 0);
if (!found.length) {
	console.log(`${path.basename(file)}: no skyline found between ${from} and ${to} of the frame — the trees are not in this picture`);
	process.exit(0);
}
const mean = found.reduce((a, b) => a + b, 0) / found.length;
const sorted = [...found].sort((a, b) => a - b);
const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
const std = Math.sqrt(found.reduce((a, b) => a + (b - mean) * (b - mean), 0) / found.length);

let steps = 0;
let biggest = 0;
for (let x = 1; x < width; x++) {
	if (edge[x] < 0 || edge[x - 1] < 0) continue;
	const d = Math.abs(edge[x] - edge[x - 1]);
	if (d > minStep) steps++;
	if (d > biggest) biggest = d;
}

// The sky holes: runs of columns where the trees are meaningfully lower than their mean height.
const cut = mean - height * 0.1;
let runs = 0;
let widest = 0;
let run = 0;
for (let x = 0; x < width; x++) {
	if (edge[x] >= 0 && edge[x] < cut) {
		run++;
	} else {
		if (run) runs++;
		if (run > widest) widest = run;
		run = 0;
	}
}
if (run) runs++;

const pct = (px) => ((px / height) * 100).toFixed(1);
console.log(`${path.basename(file)}  ${width}x${height}  (skyline read from ${from} to ${to} of the frame)`);
console.log(
	`  the tree line sits ${pct(mean)}% down from the top of the frame on average` +
		`  — highest crown ${pct(sorted[0])}% down, lowest ${pct(sorted[sorted.length - 1])}% down, half the columns within ${((std / height) * 100).toFixed(1)}% of that`,
);
console.log(`  columns with nothing in them down to ${to} of the frame: ${noTree} (${((noTree / width) * 100).toFixed(1)}%)`);
console.log(
	`  the edge steps more than ${minStep}px ${steps} times across the frame, the biggest step ${biggest}px` +
		`  — a row of smooth domes answers with a handful, a wood with many`,
);
console.log(`  sky comes down through the crowns in ${runs} places, the widest ${widest} px wide`);

if (wantPrint) {
	console.log(`\nthe skyline, one character per ${Math.ceil(width / 150)} columns (# where the trees are, . where the sky is)`);
	const stride = Math.max(1, Math.ceil(width / 150));
	let line = "";
	for (let x = 0; x < width; x += stride) {
		line += edge[x] < 0 ? "." : "#";
	}
	console.log(line);
	const rows = 10;
	for (let r = 0; r < rows; r++) {
		const y = y0 + ((y1 - y0) * r) / rows;
		let row = "";
		for (let x = 0; x < width; x += stride) {
			row += edge[x] >= 0 && edge[x] <= y ? "#" : " ";
		}
		console.log(`${String(Math.round(((y - y0) / (y1 - y0)) * 100)).padStart(3)} ${row}`);
	}
}
