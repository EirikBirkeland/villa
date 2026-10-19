// Turns a colour a browser picture showed back into the light that must have made it.
//
// Why: the drawing tool has to be dialled until it comes out the same shade as the browser does. The
// browser's last steps — exposure, the tone curve, sRGB, contrast — all crush the light, so a pixel
// that reads (180,160,133) on screen came from a much smaller number in the scene. This runs those
// steps backwards: give it bytes, it prints the linear light that would have produced them, so a
// stand-in colour in `src/surface-colours.js` or the sky gradient can be set from a measurement
// instead of a guess.
//
//   node tools/backlight.js "180,160,133" "106,147,163"
//   node tools/backlight.js "244,203,153" --exposure 0.76
//   node tools/backlight.js "241,225,196" --curve aces --exposure 0.88   (a picture from before v0.11.0)
//   node tools/backlight.js --round                                      (prove it undoes what it says)
//
// Defaults match the Villa's pipeline as it stands: the curve and exposure of src/tone.js, contrast
// 1.1. `--curve khronos` or `--curve aces` reads a picture made by another curve.
//
// The curve folds a whole colour at once and mixes a little white into the channels that were folded
// furthest, which cannot be undone channel by channel on its own: the peak is turned back exactly, and
// the other two channels with it under the same two assumptions the shader makes — that the brightest
// channel of the answer is the one that set the fold, and that the dark-channel offset of the curve is
// in its usual 0.04 place. `--round` prints where that leaves the round trip.

import { VILLA_TONE, KHRONOS_TONE, applyTone, tonePeak } from "../src/tone.js";

const argv = process.argv.slice(2);
const num = (name, dflt) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : dflt;
};
const flag = (name, dflt) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 && argv[i + 1] ? String(argv[i + 1]) : dflt;
};
const PRECEDING = new Set(["--exposure", "--contrast", "--curve"]);
// A sample is a colour, not a number belonging to a switch: walk the line and skip what follows a
// switch that takes a value.
const samples = [];
for (let i = 0; i < argv.length; i++) {
	if (argv[i].startsWith("--")) {
		if (PRECEDING.has(argv[i])) i++;
		continue;
	}
	samples.push(argv[i]);
}
if (argv.includes("--help")) {
	console.log('usage: node tools/backlight.js "180,160,133" "63,106,129" [--exposure 0.76] [--contrast 1.1] [--curve villa|khronos|aces] [--round]');
	process.exit(0);
}
const EXPOSURE = num("exposure", 0.76);
const CONTRAST = num("contrast", 1.1);
const CURVE = flag("curve", "villa");
const TONE = CURVE === "khronos" ? KHRONOS_TONE : VILLA_TONE;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const IN3 = [0.59719, 0.35458, 0.04823, 0.076, 0.90834, 0.01566, 0.0284, 0.13383, 0.83777];
const OUT3 = [1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.07276, -0.00327, -0.00605, 1.07602];
const mul3 = (v, m) => [
	v[0] * m[0] + v[1] * m[1] + v[2] * m[2],
	v[0] * m[3] + v[1] * m[4] + v[2] * m[5],
	v[0] * m[6] + v[1] * m[7] + v[2] * m[8],
];
/** The inverse of a 3x3 matrix held as nine numbers, row by row. */
function invert3(m) {
	const a = [m.slice(0, 3), m.slice(3, 6), m.slice(6, 9)];
	const det =
		a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
	return [
		(a[1][1] * a[2][2] - a[1][2] * a[2][1]) / det,
		(a[0][2] * a[2][1] - a[0][1] * a[2][2]) / det,
		(a[0][1] * a[1][2] - a[0][2] * a[2][0]) / det,
		(a[1][2] * a[2][0] - a[1][0] * a[2][2]) / det,
		(a[0][0] * a[2][2] - a[0][2] * a[2][0]) / det,
		(a[0][2] * a[1][0] - a[0][0] * a[1][2]) / det,
		(a[1][0] * a[2][1] - a[1][1] * a[2][0]) / det,
		(a[0][1] * a[1][2] - a[0][2] * a[2][1]) / det,
		(a[0][0] * a[1][1] - a[0][1] * a[1][0]) / det,
	];
}
const IN3INV = invert3(IN3);
const OUT3INV = invert3(OUT3);

const fit = (v) => clamp((v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081), 0, 1);
const fitBack = (s) => {
	let lo = 0;
	let hi = 8;
	for (let i = 0; i < 80; i++) {
		const mid = (lo + hi) / 2;
		if (fit(mid) < s) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
};
/** Undo sRGB and the contrast nudge. */
const decode = (byte) => {
	let s = byte / 255;
	s = s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	if (CONTRAST !== 1) {
		// Undo mix(rgb, rgb*rgb*(3-2rgb), contrast-1) by bisection on the smoothstep.
		const want = s;
		let lo = 0;
		let hi = 1;
		for (let i = 0; i < 60; i++) {
			const mid = (lo + hi) / 2;
			const mixed = mid + (mid * mid * (3 - 2 * mid) - mid) * (CONTRAST - 1);
			if (mixed < want) lo = mid;
			else hi = mid;
		}
		s = (lo + hi) / 2;
	}
	return s;
};
/** The byte the browser would paint for a linear light, the whole chain forwards again. */
function forward(light) {
	const lit = light.map((v) => v * EXPOSURE);
	if (CURVE === "aces") {
		const t = mul3(lit, IN3);
		const back = clampArr(mul3([fit(t[0]), fit(t[1]), fit(t[2])], OUT3));
		return back.map(encode);
	}
	const folded = applyTone(lit, TONE);
	return clampArr(folded).map(encode);
}
function clampArr(v) {
	return v.map((x) => clamp(x, 0, 1));
}
function encode(x) {
	const v = clamp(x, 0, 1);
	let s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
	if (CONTRAST !== 1) s = clamp(s + (s * s * (3 - 2 * s) - s) * (CONTRAST - 1), 0, 1);
	return Math.round(s * 255);
}

/** Down the curve: from what the picture shows to the light the exposure was multiplying. */
function downFromCurve(shown) {
	const peak = Math.max(...shown);
	if (CURVE === "aces") {
		const outOfAces = mul3(shown, OUT3INV).map((v) => fitBack(v));
		return mul3(outOfAces, IN3INV).map((v) => Math.max(0, v));
	}
	// The brightest channel of the answer is the one that set the fold, so the fold's own height comes
	// straight off it; bisect the curve for it, since the curve has no inverse written down.
	let lo = 0;
	let hi = 40;
	for (let i = 0; i < 80; i++) {
		const mid = (lo + hi) / 2;
		if (tonePeak(mid, TONE) < peak) lo = mid;
		else hi = mid;
	}
	const p = (lo + hi) / 2;
	// The curve takes a little off every channel — a steady 0.04, or, near black, just enough to keep
	// the darkest of them off the floor. Put it back before anything else, asked of the answer.
	const offset = offsetBack(Math.min(...shown));
	if (p < TONE.knee) return shown.map((v) => v + offset);
	const newPeak = tonePeak(p, TONE);
	const scale = p / newPeak;
	const g = 1 - 1 / (TONE.desat * (p - newPeak) + 1);
	const folded = shown.map((v) => ((v - g * newPeak) / (1 - g)) * scale);
	return folded.map((v) => v + offset);
}

/**
 * The offset the curve took off, from the darkest channel of what it left. `x` is the light it took it
 * from: the curve leaves x - (x - 6.25x^2) = 6.25x^2 there, so out of the darkest byte comes x, and
 * with it the offset — until x is over 0.08, where the offset is simply the library's 0.04.
 */
function offsetBack(darkest) {
	const x = Math.sqrt(Math.max(0, darkest)) / 2.5;
	return x < 0.08 ? x - 6.25 * x * x : 0.04;
}

for (const sample of samples) {
	const c = sample.split(",").map(Number);
	if (c.length !== 3 || c.some((v) => !isFinite(v))) {
		console.log(`${sample}: not three numbers`);
		continue;
	}
	if (c.some((v) => v >= 255)) console.log(`${sample}: at the ceiling — the light above it is gone and this cannot bring it back`);
	const shown = [decode(c[0]), decode(c[1]), decode(c[2])];
	const lit = downFromCurve(shown).map((v) => Math.max(0, v) / EXPOSURE);
	const luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
	console.log(
		`${sample}  L${luma.toFixed(0)}  ->  linear light ${lit.map((v) => v.toFixed(3)).join(", ")}` +
			`  (mean ${(lit[0] + lit[1] + lit[2]) / 3})`,
	);
}

if (argv.includes("--round")) {
	console.log(`\nround trip through the ${CURVE} curve at exposure ${EXPOSURE}, contrast ${CONTRAST}:`);
	console.log("light                  bytes                read back");
	for (const light of [[0.1, 0.12, 0.1], [0.35, 0.3, 0.25], [0.6, 0.5, 0.4], [0.9, 0.7, 0.5], [1.6, 1.0, 0.7], [2.6, 2.1, 1.6], [3.9, 3.4, 2.6]]) {
		const bytes = forward(light).join(",");
		const back = downFromCurve(bytes.split(",").map(decode)).map((v) => Math.max(0, v) / EXPOSURE);
		const worst = Math.max(...back.map((v, i) => Math.abs(v - light[i])));
		console.log(`${light.map((v) => v.toFixed(2)).join(",")}   (${bytes})   ${back.map((v) => v.toFixed(3)).join(",")}   off by ${worst.toFixed(3)}`);
	}
}
