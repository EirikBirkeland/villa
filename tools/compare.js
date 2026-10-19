// Puts two pictures of the same view side by side and says how far apart they are.
//
// Why: `tools/draw.js` draws the Villa without a browser, and its whole use is that it should agree
// with what a browser pictures. This is how that agreement is measured: a real browser picture on one
// side, a drawn one on the other, and the gap between them in numbers. It compares any two pictures of
// the Villa with each other just as well, which is how a change is checked against the last one.
//
//   node tools/compare.js pictures/019-home.png pictures/drawn-home.png
//   node tools/compare.js a.png b.png --grid 8x5      coarser cells
//   node tools/compare.js a.png b.png --cells         list the ten cells that differ most
//
// Both pictures are sampled to the size of the smaller, so a 640x360 drawing can be read against a
// 1280x720 browser picture. The gap is given as mean colour per cell, mean luminance of the whole
// picture, and the mean of |difference| per channel. A cell where one picture is warm and the other
// cool is called out, because that is the kind of error a plain average hides.

import { PNG } from "pngjs";
import * as fs from "node:fs";

const argv = process.argv.slice(2);
const args = argv.filter((a) => !a.startsWith("--"));
const flags = new Map();
for (let i = 0; i < argv.length; i++) {
	if (!argv[i].startsWith("--")) continue;
	const key = argv[i].slice(2);
	if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) flags.set(key, argv[++i]);
	else flags.set(key, true);
}
if (flags.has("help") || args.length < 2) {
	console.log(
		[
			"compare — how far apart two pictures of the Villa are",
			"",
			"  node tools/compare.js <left.png> <right.png> [--grid 10x6] [--cells]",
			"",
			"  --grid 10x6     how many cells to cut the frame into",
			"  --cells         also list the cells that differ most",
		].join("\n"),
	);
	process.exit(0);
}

const [leftPath, rightPath] = args;
const [GX, GY] = String(flags.get("grid") || "10x6").split("x").map(Number);

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hex = (c) => c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join();

function readPng(path) {
	return PNG.sync.read(fs.readFileSync(path));
}

const a0 = readPng(leftPath);
const b0 = readPng(rightPath);
const W = Math.min(a0.width, b0.width);
const H = Math.min(a0.height, b0.height);

/** Sample a picture down to WxH in RGB, so two sizes can be compared cell by cell. */
function fit(img) {
	const out = new Uint8Array(W * H * 3);
	for (let y = 0; y < H; y++) {
		const sy = Math.min(img.height - 1, Math.floor(((y + 0.5) / H) * img.height));
		for (let x = 0; x < W; x++) {
			const sx = Math.min(img.width - 1, Math.floor(((x + 0.5) / W) * img.width));
			const from = (sy * img.width + sx) * 4; // pngjs always hands back red, green, blue and alpha
			const to = (y * W + x) * 3;
			out[to] = img.data[from];
			out[to + 1] = img.data[from + 1];
			out[to + 2] = img.data[from + 2];
		}
	}
	return out;
}
const A = fit(a0);
const B = fit(b0);

const cellW = Math.floor(W / GX);
const cellH = Math.floor(H / GY);
const cells = [];
for (let cy = 0; cy < GY; cy++) {
	for (let cx = 0; cx < GX; cx++) {
		let ar = 0, ag = 0, ab = 0, br = 0, bg = 0, bb = 0, n = 0;
		for (let y = cy * cellH; y < (cy + 1) * cellH; y++) {
			for (let x = cx * cellW; x < (cx + 1) * cellW; x++) {
				const j = (y * W + x) * 3;
				ar += A[j];
				ag += A[j + 1];
				ab += A[j + 2];
				br += B[j];
				bg += B[j + 1];
				bb += B[j + 2];
				n++;
			}
		}
		cells.push({ cx, cy, a: [ar / n, ag / n, ab / n], b: [br / n, bg / n, bb / n] });
	}
}

const whole = (rgb) => {
	let r = 0, g = 0, b = 0;
	for (let i = 0; i < W * H; i++) {
		r += rgb[i * 3];
		g += rgb[i * 3 + 1];
		b += rgb[i * 3 + 2];
	}
	return [r / (W * H), g / (W * H), b / (W * H)];
};
const la = whole(A);
const lb = whole(B);
const gap = (c) => (Math.abs(c.a[0] - c.b[0]) + Math.abs(c.a[1] - c.b[1]) + Math.abs(c.a[2] - c.b[2])) / 3;
const warmth = (c) => c[0] - c[2];
let dsum = 0;
let hueMismatch = 0;
for (const c of cells) {
	dsum += gap(c);
	// One cell warm and the other cool by a good margin: the two do not agree on what time of day it is.
	if (Math.abs(warmth(c.a) - warmth(c.b)) > 18) hueMismatch++;
}

console.log(`${leftPath} against ${rightPath}  (${W}x${H}, ${GX}x${GY} cells)`);
console.log(
	`  whole picture   left rgb ${la.map((v) => v.toFixed(0)).join(",")} L${luma(...la).toFixed(0)}   ` +
		`right rgb ${lb.map((v) => v.toFixed(0)).join(",")} L${luma(...lb).toFixed(0)}   ` +
		`luminance gap ${(luma(...lb) - luma(...la)).toFixed(0)}`,
);
console.log(`  mean gap per channel ${(dsum / cells.length).toFixed(1)} of 255; cells that disagree on warm or cool: ${hueMismatch}`);

console.log("  cell colours, left then right:");
for (let cy = 0; cy < GY; cy++) {
	const left = [];
	const right = [];
	for (let cx = 0; cx < GX; cx++) {
		const c = cells[cy * GX + cx];
		left.push(hex(c.a));
		right.push(hex(c.b));
	}
	console.log(`  row ${cy} L | ${left.join(" ")}`);
	console.log(`        R | ${right.join(" ")}`);
}

if (flags.has("cells")) {
	const worst = [...cells].sort((x, y) => gap(y) - gap(x)).slice(0, 10);
	console.log("  the cells furthest apart:");
	for (const c of worst) {
		console.log(`    cell ${c.cx},${c.cy}: left ${hex(c.a)} (L${luma(...c.a).toFixed(0)})  right ${hex(c.b)} (L${luma(...c.b).toFixed(0)})  gap ${gap(c).toFixed(0)}`);
	}
}
