// Reads a picture back as numbers, so the Villa can be judged without eyes.
//
//   node tools/pixels.js pictures/shot.png
//   node tools/pixels.js pictures/shot.png --grid 12x7
//   node tools/pixels.js pictures/shot.png --cells --samples
//   node tools/pixels.js pictures/shot.png --hist
//   node tools/pixels.js pictures/shot.png --shade 90x50
//   node tools/pixels.js pictures/shot.png --patch "x0,y0,x1,y1" [--block 48]
//   node tools/pixels.js pictures/shot.png --repeat "x0,y0,x1,y1"
//
// It prints how much of the picture is pure white or pure black, how much colour there is,
// and a grid of the average colour of each part of the frame.
//
// --shade prints the picture twice over as two maps of one character per cell, big enough to read
// as a picture: first how bright each cell is, then what the cell is made of (warm timber or roof
// tile, green leaf, blue sky, teal water, pale stone, dark). A session whose model cannot be shown
// the picture reads the Villa through this; one that can be shown it may still use to say where in
// the frame a fault sits.
//
// --patch answers one question about a flat stretch — lawn, water, a wall — and it is whether the
// stretch has any large shapes in it at all. A surface that is one tone everywhere reads as a
// painted board however busy its small detail is, so the blocks' own means are what matter here and
// not the pixels inside them.
//
// It also prints the warmth of each block — its red minus its blue, one number — because light and
// colour are two different faults and a plain channel spread does not tell them apart. A stretch of
// stone whose blocks differ only in warmth is dusty here and damp there; one whose blocks differ only
// in light is only lying in sun and shade, which the lighting already does.

import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
	console.log("usage: node tools/pixels.js <picture.png> [--grid WxH] [--cells] [--relief] [--thumb WxH] [--hist] [--samples] [--at x,y;x,y] [--find 'g-b>40 && g-r>20' [--where x0,y0,x1,y1]]");
	process.exit(1);
}

function readFlag(name, fallback) {
	const i = args.indexOf(`--${name}`);
	if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1];
	return fallback;
}

const [gw, gh] = readFlag("grid", "10x6").split("x").map(Number);
const wantCells = args.includes("--cells");
const wantRelief = args.includes("--relief");
const wantThumb = args.includes("--thumb") ? readFlag("thumb", "24x13") : null;
const wantSamples = args.includes("--samples");
const wantHist = args.includes("--hist");
const wantShade = args.includes("--shade") ? readFlag("shade", "90x50") : null;
const at = readFlag("at", "");
const findExpr = readFlag("find", "");
const findWhere = readFlag("where", "");
const patchRegion = readFlag("patch", "");
const patchBlock = Number(readFlag("block", 48));
const repeatRegion = readFlag("repeat", "");

const png = PNG.sync.read(fs.readFileSync(file));
const { width, height, data } = png;

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function stats(x0, x1, y0, y1) {
	let n = 0;
	let sumR = 0;
	let sumG = 0;
	let sumB = 0;
	let white = 0;
	let black = 0;
	let colour = 0;
	let darkest = 255;
	let brightest = 0;
	const seen = new Set();
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const i = (y * width + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			n++;
			sumR += r;
			sumG += g;
			sumB += b;
			const l = luminance(r, g, b);
			if (l < 8) black++;
			if (r > 246 && g > 246 && b > 246) white++;
			const spread = Math.max(r, g, b) - Math.min(r, g, b);
			if (spread > 26) colour++;
			if (l < darkest) darkest = l;
			if (l > brightest) brightest = l;
			seen.add((r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3));
		}
	}
	return {
		n,
		r: Math.round(sumR / n),
		g: Math.round(sumG / n),
		b: Math.round(sumB / n),
		white: white / n,
		black: black / n,
		colour: colour / n,
		darkest,
		brightest,
		distinct: seen.size,
	};
}

const ramp = " .:-=+*#%@";
function glyph(value, max) {
	const index = Math.min(ramp.length - 1, Math.floor((value / max) * ramp.length));
	return ramp[index] || "#";
}

const whole = stats(0, width, 0, height);
console.log(`${path.basename(file)}  ${width}x${height}`);
console.log(
	`average rgb ${whole.r},${whole.g},${whole.b}  luminance ${Math.round(luminance(whole.r, whole.g, whole.b))}` +
		`  white ${(whole.white * 100).toFixed(1)}%  black ${(whole.black * 100).toFixed(1)}%` +
		`  in colour ${(whole.colour * 100).toFixed(1)}%  distinct colours ~${whole.distinct}`,
);
console.log(`darkest ${whole.darkest}  brightest ${whole.brightest}`);

{
	const ground = stats(0, width, Math.floor(height * 0.6), height);
	const sky = stats(0, width, 0, Math.floor(height * 0.28));
	const middle = stats(0, width, Math.floor(height * 0.28), Math.floor(height * 0.6));
	const describe = (s) => `rgb ${s.r},${s.g},${s.b} L${Math.round(luminance(s.r, s.g, s.b))} blown ${(s.white * 100).toFixed(1)}%`;
	console.log(`sky (top 28%)     ${describe(sky)}`);
	console.log(`middle            ${describe(middle)}`);
	console.log(`ground (bottom)   ${describe(ground)}`);
}

console.log(`\ngrid ${gw} x ${gh} (average colour of each part of the frame)`);
for (let gy = 0; gy < gh; gy++) {
	const row = [];
	const line = [];
	for (let gx = 0; gx < gw; gx++) {
		const x0 = Math.floor((gx * width) / gw);
		const x1 = Math.floor(((gx + 1) * width) / gw);
		const y0 = Math.floor((gy * height) / gh);
		const y1 = Math.floor(((gy + 1) * height) / gh);
		const s = stats(x0, x1, y0, y1);
		const l = Math.round(luminance(s.r, s.g, s.b));
		line.push(glyph(l, 255).repeat(2));
		if (wantCells) row.push(`${String(gx)},${String(gy)} rgb ${s.r},${s.g},${s.b} L${l} w${(s.white * 100).toFixed(0)}% k${(s.black * 100).toFixed(0)}% c${(s.colour * 100).toFixed(0)}% v${s.distinct}`);
		else row.push(`${s.r},${s.g},${s.b}`);
	}
	console.log(`row ${gy} | ${line.join("|")}`);
	if (wantCells) console.log(row.join("   "));
}

if (wantRelief) {
	// The shapes, read from how the parts of the frame differ from each other:
	// rank each cell's brightness among all cells, then mark the edges where brightness jumps.
	const cells = [];
	for (let gy = 0; gy < gh; gy++) {
		for (let gx = 0; gx < gw; gx++) {
			const x0 = Math.floor((gx * width) / gw);
			const x1 = Math.floor(((gx + 1) * width) / gw);
			const y0 = Math.floor((gy * height) / gh);
			const y1 = Math.floor(((gy + 1) * height) / gh);
			const s = stats(x0, x1, y0, y1);
			cells.push({ gx, gy, l: luminance(s.r, s.g, s.b) });
		}
	}
	const sorted = cells.map((c) => c.l).sort((a, b) => a - b);
	const rank = (l) => {
		let lo = 0;
		let hi = sorted.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (sorted[mid] < l) lo = mid + 1;
			else hi = mid;
		}
		return Math.floor((lo / Math.max(1, sorted.length - 1)) * (ramp.length - 1));
	};
	console.log(`\nshapes (brightness ranked across the frame, so every shade gets its own mark)`);
	for (let gy = 0; gy < gh; gy++) {
		let line = "row " + gy + " |";
		for (let gx = 0; gx < gw; gx++) {
			const here = cells[gy * gw + gx];
			const left = gx > 0 ? cells[gy * gw + gx - 1] : here;
			const above = gy > 0 ? cells[(gy - 1) * gw + gx] : here;
			const edge = Math.abs(here.l - left.l) > 14 || Math.abs(here.l - above.l) > 14;
			line += edge ? "^" : ramp[rank(here.l)].repeat(2);
		}
		console.log(line + "|");
	}
	console.log("(^ marks where brightness jumps: the edges of things)");
}

if (wantShade) {
	// The picture twice, as one character per cell: first its brightness, then what each cell is made
	// of. Dark glyphs are dark places in the first map, so a black hole shows as a black patch of text;
	// in the second, a capital is a lit cell and a lower case a shaded one, and the letter is the family
	// of colour the cell sits in: R roof tile and timber, G leaf and grass, C water, S sky, W stone and
	// plaster, k a place with no light and no colour in it at all.
	const [sw, sh] = wantShade.split("x").map(Number);
	const shadeRamp = "@%#*+=-:. ";
	const shade = (l) => shadeRamp[Math.min(9, Math.floor((l / 255) * 10))] || "@";
	const family = (r, g, b) => {
		const l = luminance(r, g, b);
		const lit = l >= 150;
		if (Math.max(r, g, b) - Math.min(r, g, b) < 16) return l < 60 ? "k" : lit ? "W" : "w";
		const letter = b - g >= 8 ? "S" : b >= g - 6 ? "C" : g >= r ? "G" : "R";
		return lit ? letter : letter.toLowerCase();
	};
	console.log(`\nshade map ${sw} x ${sh} (dark glyphs are dark places; ^ is where brightness jumps)`);
	for (let gy = 0; gy < sh; gy++) {
		let line = "";
		for (let gx = 0; gx < sw; gx++) {
			const x0 = Math.floor((gx * width) / sw);
			const x1 = Math.floor(((gx + 1) * width) / sw);
			const y0 = Math.floor((gy * height) / sh);
			const y1 = Math.floor(((gy + 1) * height) / sh);
			const s = stats(x0, x1, y0, y1);
			line += shade(luminance(s.r, s.g, s.b));
		}
		console.log(`${String(gy).padStart(2)} ${line}`);
	}
	console.log(`\nwhat the frame is made of ${sw} x ${sh} (R timber/roof, G leaf, C water, S sky, W stone, k dark; capital = lit)`);
	for (let gy = 0; gy < sh; gy++) {
		let line = "";
		for (let gx = 0; gx < sw; gx++) {
			const x0 = Math.floor((gx * width) / sw);
			const x1 = Math.floor(((gx + 1) * width) / sw);
			const y0 = Math.floor((gy * height) / sh);
			const y1 = Math.floor(((gy + 1) * height) / sh);
			const s = stats(x0, x1, y0, y1);
			line += family(s.r, s.g, s.b);
		}
		console.log(`${String(gy).padStart(2)} ${line}`);
	}
}

if (wantThumb) {
	// A colour thumbnail small enough to read as a picture: one six-digit colour per cell.
	const [tw, th] = wantThumb.split("x").map(Number);
	console.log(`\ncolour thumbnail ${tw} x ${th} (six digits per cell: red, green, blue)`);
	for (let gy = 0; gy < th; gy++) {
		const parts = [];
		for (let gx = 0; gx < tw; gx++) {
			const x0 = Math.floor((gx * width) / tw);
			const x1 = Math.floor(((gx + 1) * width) / tw);
			const y0 = Math.floor((gy * height) / th);
			const y1 = Math.floor(((gy + 1) * height) / th);
			const s = stats(x0, x1, y0, y1);
			const hex = (v) => Math.round(v).toString(16).padStart(2, "0");
			parts.push(`${hex(s.r)}${hex(s.g)}${hex(s.b)}`);
		}
		console.log(`${String(gy).padStart(2)} ${parts.join(" ")}`);
	}
}

if (wantHist) {
	// How the light in the frame is spread out, and what the darkest and brightest parts of it are.
	// This is how a drawn picture and a browser picture of one view get compared at the dark end,
	// where a picture either still has colour in it or has fallen to soot.
	const bands = [];
	for (let i = 0; i < 16; i++) bands.push({ n: 0, r: 0, g: 0, b: 0 });
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const l = luminance(data[i], data[i + 1], data[i + 2]);
			const band = bands[Math.min(15, l >> 4)];
			band.n++;
			band.r += data[i];
			band.g += data[i + 1];
			band.b += data[i + 2];
		}
	}
	const total = width * height;
	console.log("\nhow the light is spread (percent of the frame in each band of brightness)");
	for (let i = 0; i < 16; i++) {
		const band = bands[i];
		if (!band.n) continue;
		const share = (band.n / total) * 100;
		const bar = "#".repeat(Math.max(1, Math.round(share / 2)));
		console.log(
			`  L${String(i * 16).padStart(3)}-${String(i * 16 + 15).padStart(3)}  ${String(share.toFixed(1)).padStart(5)}%  ${bar}  rgb ${Math.round(band.r / band.n)},${Math.round(band.g / band.n)},${Math.round(band.b / band.n)}`,
		);
	}

	// Where the ends of the range are in the frame, so a dark band can be named rather than guessed at.
	const ends = (from) => {
		let cut = from === "dark" ? 0 : 255;
		let count = 0;
		for (let i = 0; i < 16; i++) {
			const b = from === "dark" ? i : 15 - i;
			count += bands[b].n;
			cut = from === "dark" ? b * 16 + 15 : b * 16;
			if (count / total >= 0.01) break;
		}
		const cells = new Map();
		let n = 0;
		let r = 0;
		let g = 0;
		let b2 = 0;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4;
				const l = luminance(data[i], data[i + 1], data[i + 2]);
				const inSet = from === "dark" ? l <= cut : l >= cut;
				if (!inSet) continue;
				n++;
				r += data[i];
				g += data[i + 1];
				b2 += data[i + 2];
				const key = `${Math.floor((x * gw) / width)},${Math.floor((y * gh) / height)}`;
				cells.set(key, (cells.get(key) || 0) + 1);
			}
		}
		if (!n) return `the ${from} end: nothing`;
		const top = [...cells.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}(${Math.round((v / n) * 100)}%)`);
		return `the ${from} end (L ${from === "dark" ? "<= " + cut : ">= " + cut}): ${(n / total) * 100}% of the frame, rgb ${Math.round(r / n)},${Math.round(g / n)},${Math.round(b2 / n)}, in ${cells.size} of ${gw * gh} grid cells — mostly ${top.join(" ")}`;
	};
	console.log(`  ${ends("dark")}`);
	console.log(`  ${ends("bright")}`);
}

if (patchRegion) {
	// How much a stretch of surface varies from one part of itself to another. The number to look at
	// is `between blocks`: if a lawn's forty-eight-pixel patches are all the same colour the garden is
	// one flat tone, whatever the blades inside each patch are doing.
	const [px0, py0, px1, py1] = patchRegion.split(",").map(Number);
	const blocks = [];
	for (let y = py0; y < py1; y += patchBlock) {
		for (let x = px0; x < px1; x += patchBlock) {
			const s = stats(x, Math.min(px1, x + patchBlock), y, Math.min(py1, y + patchBlock));
			if (s.n) blocks.push({ x, y, ...s, l: luminance(s.r, s.g, s.b) });
		}
	}
	const meanOf = (key) => blocks.reduce((a, b) => a + b[key], 0) / blocks.length;
	const spreadOf = (key) => {
		const m = meanOf(key);
		return Math.sqrt(blocks.reduce((a, b) => a + (b[key] - m) * (b[key] - m), 0) / blocks.length);
	};
	const sorted = [...blocks].sort((a, b) => a.l - b.l);
	const low = sorted[0];
	const high = sorted[sorted.length - 1];
	console.log(
		`\npatches over ${px0},${py0} to ${px1},${py1} in ${patchBlock} x ${patchBlock} blocks (${blocks.length} blocks)`,
	);
	console.log(
		`  all together rgb ${Math.round(meanOf("r"))},${Math.round(meanOf("g"))},${Math.round(meanOf("b"))}` +
			`  L${Math.round(meanOf("l"))}` +
			`  between blocks: L std ${spreadOf("l").toFixed(1)}, range ${low.l.toFixed(0)} to ${high.l.toFixed(0)}`,
	);
	console.log(
		`  channel spread between blocks: r ${spreadOf("r").toFixed(1)} g ${spreadOf("g").toFixed(1)} b ${spreadOf("b").toFixed(1)}` +
			`  (one colour of spread is about ${spreadOf("l").toFixed(0)}; over ~12 the patches read as different colours, not just lighter and darker)`,
	);
	// Warmth: red minus blue, which a change of light barely moves and a change of dust and damp moves
	// a lot. This is the column that tells a dry-and-damp garden from a garden in sun and shade.
	const warmth = blocks.map((b) => b.r - b.b);
	const wMean = warmth.reduce((s, v) => s + v, 0) / warmth.length;
	const wStd = Math.sqrt(warmth.reduce((s, v) => s + (v - wMean) * (v - wMean), 0) / warmth.length);
	console.log(
		`  warmth between blocks (red minus blue): mean ${wMean.toFixed(1)}, std ${wStd.toFixed(1)}, range ${Math.min(...warmth).toFixed(1)} to ${Math.max(...warmth).toFixed(1)}  (sun against shade moves this by a point or two; dust against damp moves it by ten)`,
	);
	console.log(`  darkest patch ${low.x},${low.y} rgb ${low.r},${low.g},${low.b}   brightest patch ${high.x},${high.y} rgb ${high.r},${high.g},${high.b}`);
	if (blocks.length > 1) {
		const cols = Math.round((px1 - px0) / patchBlock);
		console.log(`  the patches, one glyph each (dark to bright)`);
		for (let row = 0; row * cols < blocks.length; row++) {
			let line = "  ";
			for (let col = 0; col < cols && row * cols + col < blocks.length; col++) line += glyph(blocks[row * cols + col].l, 255).repeat(2);
			console.log(line);
		}
	}
}

if (repeatRegion) {
	// Does this stretch of ground repeat itself? A pattern laid on a grid does, and the tell-tale is
	// that the picture matches a shifted copy of itself: take the brightness along a line of it, slide
	// it along, and see how much it lines up again at each distance. A garden that is tiled every six
	// metres answers with a peak at six metres, and a real garden answers with nothing above noise.
	const [rx0, ry0, rx1, ry1] = repeatRegion.split(",").map(Number);
	const profile = (axis) => {
		const out = [];
		for (let i = (axis === "x" ? rx0 : ry0); i < (axis === "x" ? rx1 : ry1); i++) {
			let n = 0;
			let sum = 0;
			for (let j = (axis === "x" ? ry0 : rx0); j < (axis === "x" ? ry1 : rx1); j++) {
				const p = axis === "x" ? j * width + i : i * width + j;
				const o = p * 4;
				sum += luminance(data[o], data[o + 1], data[o + 2]);
				n++;
			}
			out.push(n ? sum / n : 0);
		}
		return out;
	};
	const autocorrelate = (series) => {
		const mean = series.reduce((a, b) => a + b, 0) / series.length;
		const centred = series.map((v) => v - mean);
		const energy = centred.reduce((a, b) => a + b * b, 0);
		const out = [];
		for (let lag = 1; lag < series.length / 2; lag++) {
			let sum = 0;
			for (let i = 0; i + lag < series.length; i++) sum += centred[i] * centred[i + lag];
			out.push({ lag, r: sum / energy });
		}
		return out;
	};
	console.log(`\ndoes it repeat? (region ${rx0},${ry0} to ${rx1},${ry1}, the brightness of every line of it)`);
	for (const axis of ["x", "z"]) {
		const series = autocorrelate(profile(axis === "x" ? "x" : "y"));
		const peaks = [];
		for (let i = 4; i < series.length - 2; i++) {
			const s = series[i];
			if (s.r > series[i - 1].r && s.r >= series[i + 1].r && s.r > series[i - 2].r && s.r > series[i + 2].r) peaks.push(s);
		}
		const top = peaks.sort((a, b) => b.r - a.r).slice(0, 6).sort((a, b) => a.lag - b.lag);
		const noise = [...series].sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[8].r;
		console.log(`  along ${axis}: ` + (top.length ? top.map((p) => `${p.lag}px r=${p.r.toFixed(2)}`).join("  ") : "no peak at all"));
		console.log(`  along ${axis}: the eighth-largest wobble is r=${noise.toFixed(2)}, so a peak under that is the grass itself and not a repeat`);
	}
}

if (wantSamples) {
	console.log("\nsamples (single pixels across the frame)");
	for (let gy = 1; gy < gh + 1; gy++) {
		const y = Math.floor((height * gy) / (gh + 1));
		const picks = [];
		for (let gx = 1; gx < 9; gx++) {
			const x = Math.floor((width * gx) / 9);
			const i = (y * width + x) * 4;
			picks.push(`${data[i]},${data[i + 1]},${data[i + 2]}`);
		}
		console.log(`y=${String(y).padStart(4)}  ${picks.join(" ")}`);
	}
}

if (at) {
	console.log("\nthe pixels asked for");
	for (const pair of at.split(";")) {
		const [x, y] = pair.split(",").map(Number);
		const i = (Math.round(y) * width + Math.round(x)) * 4;
		console.log(`  ${x},${y}  rgb ${data[i]},${data[i + 1]},${data[i + 2]}  L${luminance(data[i], data[i + 1], data[i + 2]).toFixed(0)}`);
	}
}

// --find counts the pixels that answer a rule written in the channels themselves, and says where in
// the frame they lie: the way to hunt a one-pixel hairline — a grass-green pinstripe down one edge of
// the pool, say — which no grid average in this file would ever show. `--where` narrows the hunt to a
// rectangle, so a stripe can be looked for in the basin and not in the lawn beside it.
if (findExpr) {
	const [wx0, wy0, wx1, wy1] = findWhere ? findWhere.split(",").map(Number) : [0, 0, width - 1, height - 1];
	let n = 0;
	let x0 = 1e9;
	let y0 = 1e9;
	let x1 = -1e9;
	let y1 = -1e9;
	const examples = [];
	for (let y = wy0; y <= wy1; y++) {
		for (let x = wx0; x <= wx1; x++) {
			const i = (width * y + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (new Function("r", "g", "b", "return " + findExpr)(r, g, b)) {
				n++;
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
				if (examples.length < 8) examples.push(`${x},${y} (${r},${g},${b})`);
			}
		}
	}
	const share = ((100 * n) / Math.max(1, (wx1 - wx0 + 1) * (wy1 - wy0 + 1))).toFixed(3);
	console.log(`\n--find ${findExpr}${findWhere ? `  in ${findWhere}` : ""}`);
	console.log(`  ${n} pixels answer it, ${share}% of the place looked at` + (n ? `; they lie in x ${x0}..${x1}, y ${y0}..${y1}` : ""));
	for (const e of examples) console.log(`    ${e}`);
}
