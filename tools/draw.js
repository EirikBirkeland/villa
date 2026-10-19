// Draws a picture of the Villa without a browser.
//
// Why: this sandbox cannot start Chromium (about two thousand unreaped processes hold the process
// slots it needs — see NOTES.md and tools/headroom.js), so the usual way of looking at the Villa is
// shut. This builds the Villa in Node with Babylon's NullEngine, exactly as tools/feet.js builds it,
// and then draws every triangle here on the CPU: sun and shadows, the sky's fill, the water, the
// lamps, the haze, and the same tone mapping the browser runs last.
//
// It is dumber than a graphics card on purpose. No bump maps, no glossy reflections of the scene, no
// film grain; the patterns come from src/surface-colours.js rather than from the painted canvases,
// canvases, and the sky is a gradient with a sun in it. So read its pictures for shape, placement,
// how much of the frame is filled and how much is dark — and never let it clear a release. Only a
// real browser picture does that.
//
//   node tools/draw.js --out pictures/drawn-home.png
//   node tools/draw.js --out pictures/drawn-rear.png --view "0,1.6,-19,0,0.06"
//   node tools/draw.js --out /tmp/one.png --pick "320,180;640,300"     what owns those pixels
//   node tools/draw.js --out /tmp/one.png --debug                      how each surface is lit
//   node tools/draw.js --help
//
// A view is "x,y,z,yaw,pitch" in metres and radians, the same shape tools/look.js takes. The six the
// browser pictures are named for:
//   home   2.4,1.74,10.5,3.2,0.06    where a visitor starts, looking at the villa
//   rear   0,1.6,-19,0,0.06          the back of the house from the north lawn
//   path   -3,1.7,19,2.9,0.02        the villa from the south path
//   sala   3.5,1.6,11,2.25,-0.02     the sala from the south paving
//   west   -11,1.7,6.8,1.57,-0.02     east along the west paving to the villa
//   pool   0,2.1,-1.5,0,0.1          turning round on the terrace

import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as zlib from "node:zlib";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
// The Villa's own modules read the library off a global, the way a browser page does.
global.BABYLON = BABYLON;
const { NullEngine, Vector3, ShadowGenerator, VertexBuffer } = BABYLON;

const { SURFACES, SKY_LIGHT } = await import("../src/surface-colours.js");
const { VILLA_TONE, KHRONOS_TONE, applyTone } = await import("../src/tone.js");
const { lawnTone } = await import("../src/lawn.js");
const { paverTone } = await import("../src/paving.js");
const { teakTone } = await import("../src/teak.js");
const { bedTone } = await import("../src/court.js");
const { makeGround } = await import("../src/ground.js");
const { buildGround, buildBoundary, buildDistance, buildLights, buildFog, sunDirection } = await import("../src/world.js");
const { buildVilla } = await import("../src/villa.js");
const { buildPool } = await import("../src/pool.js");
const { buildGarden } = await import("../src/garden.js");
const { buildProps } = await import("../src/props.js");

// ---------------------------------------------------------------- the knobs

const argv = process.argv.slice(2);
const flags = new Map();
for (let i = 0; i < argv.length; i++) {
	if (!argv[i].startsWith("--")) continue;
	const key = argv[i].slice(2);
	if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) flags.set(key, argv[++i]);
	else flags.set(key, true);
}
const flag = (name, dflt) => (flags.has(name) ? String(flags.get(name)) : String(dflt));
const num = (name, dflt) => (flags.has(name) ? Number(flags.get(name)) : dflt);

if (flags.has("help")) {
	console.log(
		[
			"draw — a picture of the Villa, drawn on the CPU, with no browser",
			"",
			"  node tools/draw.js --out pictures/drawn-home.png [--view \"x,y,z,yaw,pitch\"]",
			"",
			"  --size 640x360             the picture, like the browser's",
			"  --view x,y,z,yaw,pitch     where the visitor stands and looks",
			"  --fov 0.85                 the eye's wide angle, in radians",
			"  --sun 160,24               azimuth and height of the sun, in degrees",
			"  --exposure 0.76              brightness; 1 is the engine's own",
	"  --tonemap villa            villa (the Villa's own curve) | khronos | aces | standard | lin",
			"  --sunGain 5.5                how strong the sun is",
			"  --hemiGain 0.55            how strong the sky's and the ground's fill is",
			"  --pointGain 0.05           how much the lamps throw about",
			"  --envFloor 0.05            the sky's reflection off everything, the floor under the shade",
			"  --skyGain 1.15             the sky dome",
			"  --vignette 1.2             the dark at the edges, the weight the Villa runs on; 0 turns it off",
			"  --bloom 0.2                how much the bright things spill; 0 turns it off",
			"  --bloomThreshold 0.5       how bright a thing has to be to spill, after the tone mapping (1 is white)",
			"  --shadow 512 | off         the sun's own map, in pixels",
			"  --castcheck                say how this drawing's casting meshes differ from the Villa's own list",
			"  --nofog                    no haze",
			"  --time 0.35                the minute hand: ripples on the water",
			"  --pick 320,180;...         name the surface behind those pixels",
			"  --debug                    how each kind of surface is being lit",
			"",
			"The picture says how much of it came out black and which surfaces made that black, because",
			"a drawing with no bounced light goes dark in corners the browser lights up. Read it next to",
			"a browser picture (tools/pixels.js) whenever one can be taken.",
		].join("\n"),
	);
	process.exit(0);
}

const OUT = flag("out", "pictures/drawn.png");
const size = flag("size", "1280x720").split("x").map(Number);
const W = size[0];
const H = size[1] || size[0];
const FOV = num("fov", 0.85);
const TIME = num("time", 0.35);
const EXPOSURE = num("exposure", 0.76);
// The same curve the browser runs, from src/tone.js: "villa" is what ships, "khronos" is the
// library's own numbers, "lin" is no curve at all. "neutral" is the old name for khronos.
const TONE_CURVE_RAW = flag("tonemap", "villa");
const TONE_CURVE = TONE_CURVE_RAW === "neutral" ? "khronos" : TONE_CURVE_RAW;
const TONE_PARAMS = { ...(TONE_CURVE === "khronos" ? KHRONOS_TONE : VILLA_TONE) };
for (const knob of ["knee", "white", "desat"]) if (flags.has(knob)) TONE_PARAMS[knob] = num(knob, TONE_PARAMS[knob]);
const CONTRAST = num("contrast", 1.1);
const BLOOM_WEIGHT = num("bloom", 0.2);
const BLOOM_THRESHOLD = num("bloomThreshold", 0.5);
const VIGNETTE_WEIGHT = num("vignette", 1.2);
const VIGNETTE_STRETCH = num("vignetteStretch", 0.35);
const VIGNETTE_FOV = num("vignetteFov", 0.5);
// The library's own default field of view for this, and the dark colour in src/main.js.
const VIGNETTE_COLOUR = [0.13, 0.1, 0.08];
const SHADOW_SIZE = flag("shadow", "512") === "off" ? 0 : num("shadow", 512);
const FOG_ON = !flags.has("nofog");
const SUN_FROM = flag("sun", `${SKY_LIGHT.sunAzimuth},${SKY_LIGHT.sunElevation}`).split(",").map(Number);
const VIEW = flag("view", "").split(",").map(Number);
const PICK = flags.has("pick") ? String(flags.get("pick")).split(";") : [];

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => {
	const t = clamp((x - a) / (b - a || 1e-6), 0, 1);
	return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------- colour

/** A canvas colour, 0..255, turned into the linear light the maths happens in. */
const lin255 = (v) => Math.pow(clamp(v / 255, 0, 1), 2.2);
const byte8 = (v) => Math.round(clamp(v, 0, 1) * 255);

/**
 * The fill light for everything the sun misses, measured off the browser's own pictures rather than
 * taken from the hemisphere light's colour: a plaster wall with the sun behind it reads about
 * (91,97,92) there — nearly neutral, not the deep blue of that light — because the dome, the paving
 * and the water all bounce at it. This drawing has no global illumination, so this is the whole of
 * its shade.
 */
const AMB_SKY = [0.66, 0.72, 0.88];
const AMB_GROUND = [0.36, 0.3, 0.22];

/** Babylon's own ACES fit, copied out of the library so the drawing and the browser agree on it. */
function aces(v) {
	const a = v * (v + 0.0245786) - 0.000090537;
	const b = v * (0.983729 * v + 0.432951) + 0.238081;
	return clamp(a / b, 0, 1);
}

/**
 * The curve the Villa ships, and the library's own when --tonemap khronos is asked for. Both are in
 * src/tone.js, which holds the shader text the browser compiles and this CPU copy, worked in the same
 * order, so a drawing cannot drift from the picture. Everything under the knee is left on a straight
 * line; over it the whole colour is scaled so its brightest channel lands at the curve's white point,
 * and a little white is mixed in for the stretch that was folded away. Both halves work on the colour
 * as a whole and not one channel at a time, which is why a sunlit surface keeps its own hue where
 * ACES, which fits every channel apart, washed them all to the same pale sand.
 */
const out_identity = [0, 0, 0];
function neutral(v) {
	if (TONE_CURVE === "lin") {
		for (let c = 0; c < 3; c++) out_identity[c] = v[c];
		return out_identity;
	}
	return applyTone(v, TONE_PARAMS);
}
const IN3 = [0.59719, 0.35458, 0.04823, 0.076, 0.90834, 0.01566, 0.0284, 0.13383, 0.83777];
const OUT3 = [1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.07276, -0.00327, -0.00605, 1.07602];
const mul3 = (v, m) => [
	v[0] * m[0] + v[1] * m[1] + v[2] * m[2],
	v[0] * m[3] + v[1] * m[4] + v[2] * m[5],
	v[0] * m[6] + v[1] * m[7] + v[2] * m[8],
];

/**
 * Linear light to what the screen would show before gamma. On the neutral curve that is one step: the
 * curve takes the whole colour at once. On ACES it is three — in through the input matrix, through
 * the fit one channel at a time, back out through the output matrix — and the matrices go across the
 * whole colour at once, the way the browser's shader does it. Read one channel at a time it turned
 * every colour into cream — a sky of (0.14,0.26,0.55) came out a washed lilac instead of a blue — so
 * the drawing lost its colour while the Villa kept its own.
 */
function toneLinear(r, g, b, out) {
	const lit = [Math.max(0, r * EXPOSURE), Math.max(0, g * EXPOSURE), Math.max(0, b * EXPOSURE)];
	let back;
	if (TONE_CURVE === "aces") {
		const t = mul3(lit, IN3);
		back = mul3([aces(t[0]), aces(t[1]), aces(t[2])], OUT3);
	} else if (TONE_CURVE === "standard") {
		back = lit.map((v) => 1 - Math.exp(-1.590579 * v));
	} else {
		back = neutral(lit);
	}
	for (let c = 0; c < 3; c++) out[c] = clamp(back[c], 0, 1);
	return out;
}

/**
 * The last two steps the browser takes, and in this order: sRGB first, then the contrast, which the
 * library works in encoded values — a nudge of the way to `x*x*(3-2x)`, by `contrast - 1`.
 */
function encode(x) {
	const v = clamp(x, 0, 1);
	let s = clamp(v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055, 0, 1);
	if (CONTRAST !== 1) s = clamp(s + (s * s * (3 - 2 * s) - s) * (CONTRAST - 1), 0, 1);
	return byte8(s);
}

function tonemap(r, g, b) {
	const t = toneLinear(r, g, b, [0, 0, 0]);
	return [encode(t[0]), encode(t[1]), encode(t[2])];
}

/**
 * How much each pixel is dimmed at the edges of the frame - the Villa's vignette, done with the
 * library's own maths rather than a guess. Out from the middle, scaled by a width and a height that
 * come from a field of view and the shape of the picture, the square of that distance plus one
 * raised to minus twice the weight, and the answer mixed between a dark colour and no change at all.
 * In the library this happens in raw light, after the exposure and before the tone mapping, which is
 * why it bites harder than it looks: at the corners of a 16:9 frame a weight of 1.2 leaves about
 * two thirds of the light, and the 2.6 the Villa used to run on left a third.
 */
function vignetteFactors(w, h) {
	const out = new Float32Array(w * h).fill(1);
	if (!(VIGNETTE_WEIGHT > 0)) return out;
	const halfHeight = Math.tan(0.5 * VIGNETTE_FOV);
	const halfWidth = halfHeight * (w / h);
	const square = Math.sqrt(halfWidth * halfHeight);
	const mix = (from) => from * (1 - VIGNETTE_STRETCH) + square * VIGNETTE_STRETCH;
	const ax = mix(halfWidth);
	const ay = mix(halfHeight);
	for (let y = 0; y < h; y++) {
		const vy = -((y + 0.5) / h) * 2 + 1;
		for (let x = 0; x < w; x++) {
			const vx = ((x + 0.5) / w) * 2 - 1;
			const term = ax * vx * (ax * vx) + ay * vy * (ay * vy) + 1;
			out[y * w + x] = Math.pow(term, -2 * VIGNETTE_WEIGHT);
		}
	}
	return out;
}

/**
 * Bloom: whatever is bright spills a little into the air around it. The browser gets this from the
 * rendering pipeline - weight 0.2, a wide blur. This drawing has no true HDR to work in, so the
 * spill is taken after the tone mapping instead of before: 0.5 here is about where the browser
 * starts to bloom, which is a little brighter than sunlit stone. Without it the drawn
 * picture has no spill of light in it at all: lamp glass stays a hard coin, sunlit stone stays a
 * hard sheet, and every dark corner is darker than the Villa's is.
 */
function addBloom(disp, w, h, threshold, weight) {
	/** Take the bright parts down to a small map: a stride x stride box each, thinning as it goes. */
	const brightPass = (stride) => {
		const bw = Math.max(1, Math.floor(w / stride));
		const bh = Math.max(1, Math.floor(h / stride));
		const small = new Float32Array(bw * bh * 3);
		for (let y = 0; y < bh; y++) {
			for (let x = 0; x < bw; x++) {
				let r = 0;
				let g = 0;
				let b = 0;
				for (let dy = 0; dy < stride; dy++) {
					const yy = Math.min(h - 1, y * stride + dy);
					for (let dx = 0; dx < stride; dx++) {
						const xx = Math.min(w - 1, x * stride + dx);
						const j = (yy * w + xx) * 3;
						r += disp[j];
						g += disp[j + 1];
						b += disp[j + 2];
					}
				}
				const n = stride * stride;
				r /= n;
				g /= n;
				b /= n;
				const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
				const over = l > threshold ? (l - threshold) / l : 0;
				const j = (y * bw + x) * 3;
				small[j] = r * over;
				small[j + 1] = g * over;
				small[j + 2] = b * over;
			}
		}
		return { small, bw, bh };
	};

	/** A box blur, twice across and twice down, so the smear has no edge you can point at. */
	const blur = (buf, bw, bh, radius) => {
		const tmp = new Float32Array(bw * bh * 3);
		for (let pass = 0; pass < 2; pass++) {
			for (const axis of [0, 1]) {
				const src = axis === 0 ? buf : tmp;
				for (let y = 0; y < bh; y++) {
					for (let x = 0; x < bw; x++) {
						let r = 0;
						let g = 0;
						let b = 0;
						let n = 0;
						for (let k = -radius; k <= radius; k++) {
							const u = axis === 0 ? clamp(x + k, 0, bw - 1) : x;
							const v = axis === 0 ? y : clamp(y + k, 0, bh - 1);
							const j = (v * bw + u) * 3;
							r += src[j];
							g += src[j + 1];
							b += src[j + 2];
							n++;
						}
						const j = (y * bw + x) * 3;
						tmp[j] = r / n;
						tmp[j + 1] = g / n;
						tmp[j + 2] = b / n;
					}
				}
				buf.set(tmp);
			}
		}
	};

	// Two widths: a near spill around the bright thing and a wider haze over the whole frame.
	for (const [stride, weightOf] of [
			[4, weight],
			[16, weight * 0.6],
		]) {
		const { small, bw, bh } = brightPass(stride);
		blur(small, bw, bh, 2);
		// Back up with a bilinear read, so the smear has no blocky edge.
		for (let y = 0; y < h; y++) {
			const fy = clamp((y + 0.5) / stride - 0.5, 0, bh - 1.001);
			const y0 = Math.floor(fy);
			const y1 = Math.min(bh - 1, y0 + 1);
			const ty = fy - y0;
			for (let x = 0; x < w; x++) {
				const fx = clamp((x + 0.5) / stride - 0.5, 0, bw - 1.001);
				const x0 = Math.floor(fx);
				const x1 = Math.min(bw - 1, x0 + 1);
				const tx = fx - x0;
				const j = (y * w + x) * 3;
				for (let c = 0; c < 3; c++) {
					const at = (ax, ay) => small[(ay * bw + ax) * 3 + c];
					const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx;
					const next = at(x0, y1) * (1 - tx) + at(x1, y1) * tx;
					disp[j + c] += (top * (1 - ty) + next * ty) * weightOf;
				}
			}
		}
	}
}

// ---------------------------------------------------------------- noise, for the patterns

function hash2(a, b) {
	let n = (Math.floor(a) * 374761393 + Math.floor(b) * 668265263) | 0;
	n = (n ^ (n >> 13)) | 0;
	n = (n * 1274126177) | 0;
	return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
/** A smooth field of blobs, `cells` of them across one repeat. */
function blobs(u, v, cells, seed) {
	const x = u * cells + seed;
	const y = v * cells - seed;
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const fx = x - xi;
	const fy = y - yi;
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);
	const a = hash2(xi, yi);
	const b = hash2(xi + 1, yi);
	const c = hash2(xi, yi + 1);
	const d = hash2(xi + 1, yi + 1);
	return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/**
 * What a surface reads as, at a point given in repeats of its own pattern: the tint, then the tiles
 * or boards of its grid, then the clouds of colour washed over it. The same information
 * src/surface-colours.js gives, which is the same the browser paints in src/textures.js.
 */
function albedoAt(s, u, v, out) {
	let r = s.tint ? s.tint[0] : 130;
	let g = s.tint ? s.tint[1] : 130;
	let b = s.tint ? s.tint[2] : 130;

	if (s.grid) {
		const q = s.grid;
		const cu = Math.floor(u * q.u);
		const cv = Math.floor(v * q.v);
		const t = hash2(cu + (q.seed || 1), cv - (q.seed || 1));
		r = q.low[0] + (q.high[0] - q.low[0]) * t;
		g = q.low[1] + (q.high[1] - q.low[1]) * t;
		b = q.low[2] + (q.high[2] - q.low[2]) * t;
		const fu = u * q.u - cu;
		const fv = v * q.v - cv;
		// The gap between tiles and boards is not a hard line. A seam a pixel wide would alias into
		// black seams here, while in the browser the painted seam is soft and mostly averaged away.
		const seam =
			1 - smooth(q.gap * 0.6, q.gap * 2.4, Math.min(fu, 1 - fu)) +
			1 - smooth(q.gap * 0.6, q.gap * 2.4, Math.min(fv, 1 - fv));
		const grout = clamp(seam, 0, 1);
		r += (q.grout[0] - r) * grout;
		g += (q.grout[1] - g) * grout;
		b += (q.grout[2] - b) * grout;
		if (grout < 0.5 && q.round) {
			// roof tiles: each one bulges, so the top of the row catches more light than the lip
			const crown = 0.82 + 0.3 * Math.sin(Math.PI * Math.min(fu, fv));
			r *= crown;
			g *= crown;
			b *= crown;
		}
	}

	if (s.mow) {
		// The lines a mower leaves: a wave across the pattern, the same one textures.js paints.
		const k = 1 - s.mow.at * (0.5 - 0.5 * Math.cos(v * s.mow.bands * Math.PI * 2));
		r *= k;
		g *= k;
		b *= k;
	}

	if (s.mix) {
		// Two kinds of ground next to each other — thick sward and thin — crossed over in the middle of
		// the field and left alone at its edges. The same `mixByField` src/textures.js paints.
		const n = blobs(u, v, s.mix.cells, s.mix.seed || 5);
		const t = smooth(0.3, 0.7, n);
		r += (s.mix.low[0] + (s.mix.high[0] - s.mix.low[0]) * t - r) * s.mix.at;
		g += (s.mix.low[1] + (s.mix.high[1] - s.mix.low[1]) * t - g) * s.mix.at;
		b += (s.mix.low[2] + (s.mix.high[2] - s.mix.low[2]) * t - b) * s.mix.at;
	}

	for (const w of s.wash || []) {
		const n = blobs(u, v, w.cells, w.seed || 3);
		const t = smooth(0.18, 0.82, n);
		r += (w.low[0] + (w.high[0] - w.low[0]) * t - r) * w.at;
		g += (w.low[1] + (w.high[1] - w.low[1]) * t - g) * w.at;
		b += (w.low[2] + (w.high[2] - w.low[2]) * t - b) * w.at;
	}

	if (s.bare) {
		// Where the grass thins out the soil is there, and a little grit in the bare places.
		const n = blobs(u, v, s.bare.cells, s.bare.seed);
		const t = smooth(s.bare.from, s.bare.to, n);
		r += (s.bare.colour[0] - r) * t * s.bare.at;
		g += (s.bare.colour[1] - g) * t * s.bare.at;
		b += (s.bare.colour[2] - b) * t * s.bare.at;
		const grit = smooth(0.72, 0.92, blobs(u, v, 32, s.bare.seed + 1)) * t;
		r += (150 - r) * grit * 0.3;
		g += (122 - g) * grit * 0.3;
		b += (88 - b) * grit * 0.3;
	}

	for (const q of [].concat(s.grain || [])) {
		// The sward's own streaks: one random number per texel of the painted tile, averaged along a short
		// leaning line, and multiplied over everything under it. `src/textures.js` lays two of these — the
		// crowd of blades and the grain between them — and a CPU drawing cannot paint a hundred and seventy
		// thousand walked blades, so it paints their SPREAD instead: one short, hard streak for the crowd and
		// one long soft one for the grain, in the order the tile paints them.
		const at = (a, b) => hash2(Math.floor(a * q.cells), Math.floor(b * q.cells));
		let sum = 0;
		let weight = 0;
		for (let k = 0; k < q.length; k++) {
			const uu = u + (q.shear * k) / q.cells;
			const vv = v - k / q.cells;
			sum += at(uu, vv) + at(uu + 1 / q.cells, vv);
			weight += 2;
		}
		for (let k = 0; k < q.second; k++) {
			sum += 0.6 * at(u - (0.4 * k) / q.cells, v - k / q.cells);
			weight += 0.6;
		}
		const k = 1 + (sum / weight - 0.5) * q.at * 2;
		r *= k;
		g *= k;
		b *= k;
	}

	out[0] = lin255(r);
	out[1] = lin255(g);
	out[2] = lin255(b);
	return out;
}

/** The planes that are cut into leaves: true where the leaf is, false where the air shows through. */
function isWhole(s, u, v) {
	if (!s.cut) return true;
	const fu = u - Math.floor(u);
	const fv = v - Math.floor(v);
	if (s.cut === "tuft") {
		// Blades, not a leaf: narrow strips rising from the bottom edge of the square to heights that
		// wander, which is what leaves the holes in a clump. `v` runs from the canvas's own bottom row
		// — the ground line, where the leaves come out of the crown — upwards, which is what the
		// hand-written UVs in `makeTufts` now say and the browser confirms.
		const column = Math.floor(fu * 16);
		const blade = fu * 16 - column;
		if (blade < 0.12 || blade > 0.9) return false;
		const rise = 0.34 + 0.62 * (Math.sin(column * 2.4) * 0.5 + 0.5);
		return fv < rise;
	}
	if (s.cut === "crown") {
		// Leaf, cut the way `canopyClusterCanvas` paints it: a head of big leaf over a dark interior, so a
		// card is a handful of leaf and not a board. The drawing has no alpha, so this is a shape test —
		// seven blobs to a repeat, which is the leaf's own size (two metres of crown to a cluster,
		// and a leaf twenty to thirty-six centimetres across), and the threshold is where the tile is
		// nineteen parts in twenty leaf: the canvas leaves five parts in a hundred of air, and the ragged edge
		// is the whole point of the cards, so a drawing that cut none of them would draw the belt as a row of
		// green tables.
		return blobs(u, v, 7, 731) > 0.1;
	}
	if (s.cut === "scatter") {
		// Leaves with air between them, cut the way `bushEdgeCanvas` paints them: a scatter of small
		// ellipses over a transparent tile, laid a little thicker than three parts out of four. The bush's
		// own leaf is about a ninth of its repeat, so nine blobs to a repeat is the leaf's own size, and
		// the threshold is where three quarters of the tile is leaf. A drawing that cut none of this would
		// draw every bush as a green ball, which is the fault this shell exists to cure.
		return blobs(u, v, 9, 455) > 0.33;
	}
	// No surface in `src/surface-colours.js` asks for any other cut: the banana's blade went geometric in
	// the fifty-third session and its oval test went with it. A name nobody recognises is a mistake in one
	// of the two files, and the drawing says so rather than quietly painting a board.
	throw new Error(`isWhole: no shape test for a surface cut named "${s.cut}"`);
}

// ---------------------------------------------------------------- the Villa, built for real

const engine = new NullEngine();
const scene = new BABYLON.Scene(engine);

const mats = new Proxy(
	{},
	{
		get: (cache, key) => (cache[key] = cache[key] || new BABYLON.PBRMaterial(String(key), scene)),
		set: (cache, key, value) => (cache[key] = value),
	},
);

// A stand-in for the sun's shadow lamp: it shades nothing here (the shadow map is drawn by this
// tool, below), but it keeps the list of what the Villa asked to have cast, and it complains about
// anything that is not a mesh the way Babylon's real addShadowCaster would.
const casters = [];
const noShadows = {
	addShadowCaster(mesh) {
		if (!(mesh instanceof BABYLON.Mesh)) throw new Error(`a shadow caster must be a mesh, and this is ${mesh}`);
		casters.push(mesh);
	},
};
buildGround(scene, mats);
buildBoundary(scene, mats);
buildDistance(scene, mats);
const sun = sunDirection(SUN_FROM[0], SUN_FROM[1]);
const lights = buildLights(scene, sun);
if (FOG_ON) buildFog(scene);
buildVilla(scene, mats, noShadows);
const pool = buildPool(scene, mats, noShadows);
buildGarden(scene, mats, noShadows);
buildProps(scene, mats, noShadows);

const sunLight = lights.light;
const hemiLight = lights.hemi;
const bounceLight = lights.bounce;
const pointLights = scene.lights.filter((l) => l.getClassName && l.getClassName() === "PointLight");
const FOG_COLOUR = scene.fogColor ? [scene.fogColor.r, scene.fogColor.g, scene.fogColor.b] : [0.6, 0.66, 0.68];
const FOG_DENSITY = scene.fogDensity || 0;

// How strong each light is, read off the scene so this follows the Villa when the Villa changes.
// The gains are what the drawing needs on top: the engine's own numbers run through a full PBR
// shader with an environment cube, and this does not, so they are dialled until a browser picture
// and a drawn one agree — most lately against the sunlit paving of pictures/023-west.png (which
// needs a light of 0.7,0.4,0.2 on a paver) and the shaded plaster of pictures/019-home.png (which
// needs 0.22,0.23,0.21 on plaster).
const SUN_GAIN = num("sunGain", 5.5) * (sunLight.intensity / 60);
const HEMI_GAIN = num("hemiGain", 0.55) * (hemiLight.intensity / 4);
const BOUNCE_GAIN = num("bounceGain", 0.6) * (bounceLight.intensity / 1.6);
const POINT_GAIN = num("pointGain", 0.05);
const ENV_FLOOR = num("envFloor", 0.05);
const SKY_GAIN = num("skyGain", 1.15);
const SUN_DIFFUSE = [sunLight.diffuse.r, sunLight.diffuse.g, sunLight.diffuse.b]; // light colours are already linear
const BOUNCE_DIFFUSE = [bounceLight.diffuse.r, bounceLight.diffuse.g, bounceLight.diffuse.b];
const SUN_DIR = sun.clone().normalize();

// ---------------------------------------------------------------- the sun's axes
//
// The shadow map is drawn by this tool itself, on the CPU, from the sun's point of view: Babylon's own
// map cannot be read back on the Null engine. So these three vectors are the sun's right, up and
// forward, and a place is looked up in the map by where it falls along them.

const lightForward = sunLight.direction.clone().normalize();
const lightRight = Vector3.Cross(new Vector3(0, 1, 0), lightForward).normalize();
const lightUp = Vector3.Cross(lightForward, lightRight).normalize();

// ---------------------------------------------------------------- the eye

const START = [2.4, 1.74, 10.5];
const eyePos = new Vector3(
	VIEW.length > 2 ? VIEW[0] : START[0],
	VIEW.length > 2 ? VIEW[1] : START[1],
	VIEW.length > 2 ? VIEW[2] : START[2],
);
const yaw = VIEW.length > 3 ? VIEW[3] : 3.2;
const pitch = VIEW.length > 4 ? VIEW[4] : 0.06;

function makeEye(position, yaw, pitch, fov, w, h) {
	const cp = Math.cos(pitch);
	const fwd = new Vector3(Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp).normalize();
	const worldUp = new Vector3(0, 1, 0);
	const right = Vector3.Cross(worldUp, fwd).normalize();
	const up = Vector3.Cross(fwd, right).normalize();
	return { position, fwd, right, up, tanHalf: Math.tan(fov / 2), aspect: w / h };
}
const eye = makeEye(eyePos, yaw, pitch, FOV, W, H);

function project(point) {
	const dx = point.x - eye.position.x;
	const dy = point.y - eye.position.y;
	const dz = point.z - eye.position.z;
	return {
		cz: dx * eye.fwd.x + dy * eye.fwd.y + dz * eye.fwd.z,
		cx: dx * eye.right.x + dy * eye.right.y + dz * eye.right.z,
		cy: dx * eye.up.x + dy * eye.up.y + dz * eye.up.z,
	};
}

// ---------------------------------------------------------------- the frame buffer

const colour = new Float32Array(W * H * 3);
const depth = new Float32Array(W * H).fill(Infinity);
const owner = new Int16Array(W * H).fill(-1);
const names = ["sky and haze"];
const indexOfName = new Map();
const lit = new Float32Array(W * H * 2); // how much sun, how much total light: for --debug
const where = new Float32Array(W * H * 3); // where in the world that pixel is, for --pick
const nrm = new Float32Array(W * H * 3); // and which way its face is turned
const who = new Array(W * H); // and which mesh it belongs to, for --pick

function nameIndex(name) {
	if (!indexOfName.has(name)) {
		indexOfName.set(name, names.length);
		names.push(name);
	}
	return indexOfName.get(name);
}

function skyDirection(x, y) {
	const nx = ((x + 0.5) / W) * 2 - 1;
	const ny = -(((y + 0.5) / H) * 2 - 1);
	return eye.fwd
		.add(eye.right.scale(nx * eye.tanHalf * eye.aspect))
		.add(eye.up.scale(ny * eye.tanHalf))
		.normalize();
}

/**
 * The dome, fitted to the browser's own sky: read off pictures/023-west.png and pictures/019-home.png
 * with tools/pixels.js, then run back through tools/backlight.js into light:
 *
 *   24° up, the far side from the sun      (0.12, 0.29, 0.36)
 *   19° up, the far side                 (0.15, 0.32, 0.37)
 *   24° up, 70° round toward the sun      (0.21, 0.51, 0.64)
 *   19° up, 70° round                    (0.27, 0.62, 0.69)
 *   14° up, 70° round                    (0.39, 0.79, 0.77)
 *   down at the horizon, paler and brighter (0.45, 0.70, 0.60)
 *
 * So four bands - high and low, on the sun's side and off it - mixed by how high you look and by how
 * near the sun you are looking, plus a glow and a disc about the sun. The Villa's own sky is
 * Preetham's; these are what its numbers came to at these settings.
 */
function skyColour(dir) {
	const e = Math.asin(clamp(dir.y, -1, 1));
	const up = smooth(0.08, 0.42, e); // 0 down at the horizon, 1 by about 25 degrees up
	// high and low on the side the sun is not on, then the same two on its side
	const off = [0.42 + (0.12 - 0.42) * up, 0.6 + (0.285 - 0.6) * up, 0.58 + (0.36 - 0.58) * up];
	const lit = [0.55 + (0.21 - 0.55) * up, 1.05 + (0.51 - 1.05) * up, 0.9 + (0.64 - 0.9) * up];
	const towardSun = smooth(0.0, 0.45, clamp(dir.dot(SUN_DIR), 0, 1));
	const base = [
		off[0] + (lit[0] - off[0]) * towardSun,
		off[1] + (lit[1] - off[1]) * towardSun,
		off[2] + (lit[2] - off[2]) * towardSun,
	];
	const sd = clamp(dir.dot(SUN_DIR), 0, 1);
	const glow = Math.pow(sd, 220) * 0.6 + Math.pow(sd, 26) * 0.12 + Math.pow(sd, 5) * 0.05;
	const disc = smooth(0.9975, 0.9996, sd);
	return [
		base[0] * SKY_GAIN + glow * 1.5 + disc * 4,
		base[1] * SKY_GAIN + glow * 1.4 + disc * 3.6,
		base[2] * SKY_GAIN + glow * 1.2 + disc * 3.1,
	];
}

function fogMix(rgb, distance) {
	if (!FOG_ON || !FOG_DENSITY) return rgb;
	const k = 1 - Math.exp(-Math.pow(FOG_DENSITY * distance, 2));
	return [rgb[0] + (FOG_COLOUR[0] - rgb[0]) * k, rgb[1] + (FOG_COLOUR[1] - rgb[1]) * k, rgb[2] + (FOG_COLOUR[2] - rgb[2]) * k];
}

// The sky goes in first, so everything has something to stand against.
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		const i = (y * W + x) * 3;
		const c = skyColour(skyDirection(x, y));
		colour[i] = c[0];
		colour[i + 1] = c[1];
		colour[i + 2] = c[2];
		owner[y * W + x] = 0;
	}
}

// ---------------------------------------------------------------- shading

let shadeAlpha = 1; // set by shade for a surface whose pattern is also its opacity
const albedo = new Float64Array(3);
const rgbOut = [0, 0, 0];
const POINTS = pointLights.map((p) => ({ x: p.position.x, y: p.position.y, z: p.position.z, r: p.diffuse.r, g: p.diffuse.g, b: p.diffuse.b, i: p.intensity }));

function shade(s, world, n, toEye, u, v, skin) {
	shadeAlpha = 1;
	if (s.glow && s.unlit && !s.tint) {
		rgbOut[0] = s.glow[0] * 2.4;
		rgbOut[1] = s.glow[1] * 2.4;
		rgbOut[2] = s.glow[2] * 2.4;
		return rgbOut;
	}
	albedoAt(s, u, v, albedo);

	// The garden's broad patches of lush and dry grass, the deck's of dust and damp, the dirt of the
	// court's borders under its planting, and the teak floors' of weather — silvered out in the sun,
	// oiled under a roof, dark where the roof lets go. The browser
	// carries these at the meshes' own corners, because a pattern three to six metres across cannot make
	// shapes forty metres wide; the drawing asks the same fields (src/lawn.js, src/paving.js, src/teak.js,
	// and src/court.js for the borders) at the very spot it is shading, so the two cannot disagree about
	// where the lawn has gone pale, where the stone is damp or which boards the weather has got at. Their
	// bent texture coordinates come along
	// of their own accord, since this drawing reads the mesh's own.
	const broadField = s.broad === "lawn" ? lawnTone : s.broad === "paver" ? paverTone : s.broad === "teak" ? teakTone : s.broad === "bed" ? bedTone : null;
	if (broadField) {
		const tone = broadField(world.x, world.z);
		albedo[0] *= tone[0];
		albedo[1] *= tone[1];
		albedo[2] *= tone[2];
	}

	// A colour written at the corners of the mesh — a shrub's own hollows and tips, one tone per crown
	// of the belt, the stands of trees along the far ridge. The engine multiplies these into the albedo
	// before any light is thrown at them, and so does this; `surfaceOf` only hands them over for the
	// surfaces that say `vertex`, so no surface is ever multiplied in twice.
	if (skin) {
		albedo[0] *= skin[0];
		albedo[1] *= skin[1];
		albedo[2] *= skin[2];
	}

	// A thing lit by itself — the pool's water, which `materials.js` paints turquoise and lights from
	// under — is its own colour plus that colour glowing, with no sun and no sky in it at all.
	if (s.unlit && s.tint) {
		const g0 = s.glow || [0, 0, 0];
		return rippleScale(s, albedo[0] * (1 + g0[0]), albedo[1] * (1 + g0[1]), albedo[2] * (1 + g0[2]), u, v);
	}

	const ndl = Math.max(0, n.dot(SUN_DIR));
	const litSun = sunAt(world, ndl);
	const isGlass = s.blend === "glass";
	// Glass has almost no diffuse in it. Before this the Villa's whole front was shaded like a pale
	// wall and then laid over what is behind it at 36%, which came out as a lit board: the browser
	// showed (127,116,106) there and this gave (162,177,166). A window keeps only a tenth of the sun.
	const sunTerm = SUN_GAIN * litSun * ndl * (isGlass ? 0.1 : 1);
	const ndl2 = Math.max(0, n.dot(BOUNCE_DIR));
	// Glass has no diffuse in it either: what a window shows is what is behind it and what it mirrors.
	// The sun term was cut to a tenth long ago; the sky's fill and the bounce off the ground were not,
	// so the front of glass was being lit like a pale matte wall and came out a cool grey sheet
	// (115,117,103) where the browser paints a dim warm room behind it (85,81,66).

	const turn = clamp(0.5 + 0.5 * n.y, 0, 1);
	const soft = isGlass ? 0.05 : 1;
	const ambR = HEMI_GAIN * (AMB_SKY[0] * turn + AMB_GROUND[0] * (1 - turn));
	const ambG = HEMI_GAIN * (AMB_SKY[1] * turn + AMB_GROUND[1] * (1 - turn));
	const ambB = HEMI_GAIN * (AMB_SKY[2] * turn + AMB_GROUND[2] * (1 - turn));

	let r = albedo[0] * (SUN_DIFFUSE[0] * sunTerm + (BOUNCE_DIFFUSE[0] * BOUNCE_GAIN * ndl2 + ambR) * soft);
	let g = albedo[1] * (SUN_DIFFUSE[1] * sunTerm + (BOUNCE_DIFFUSE[1] * BOUNCE_GAIN * ndl2 + ambG) * soft);
	let b = albedo[2] * (SUN_DIFFUSE[2] * sunTerm + (BOUNCE_DIFFUSE[2] * BOUNCE_GAIN * ndl2 + ambB) * soft);

	// The thing's own light. The engine adds a material's `emissiveColor` to whatever the sun and the
	// sky manage, and `materials.js` gives the leaves and the hedge a little so that a backlit leaf in
	// the shade is a dark green leaf and not a black cut-out. It is small — 0.08 of green — but 0.08
	// of green is a byte of about 68 once it has been through the tone mapping, which is the whole of
	// a shaded leaf.
	if (s.glow) {
		r += s.glow[0];
		g += s.glow[1];
		b += s.glow[2];
	}

	// The lamps: a dozen small point lights, each with the engine's fall-off.
	for (const p of POINTS) {
		const dx = p.x - world.x;
		const dy = p.y - world.y;
		const dz = p.z - world.z;
		const d2 = dx * dx + dy * dy + dz * dz;
		if (d2 > 49) continue;
		const d = Math.sqrt(d2);
		const nd = Math.max(0, (dx * n.x + dy * n.y + dz * n.z) / d);
		const k = (p.i * POINT_GAIN * nd) / (1 + d2 * 0.4);
		r += albedo[0] * p.r * k;
		g += albedo[1] * p.g * k;
		b += albedo[2] * p.b * k;
	}

	// A sheen off the dome for anything smooth: water, metal, glazed tile.
	if (s.glossy || s.alpha !== undefined) {
		if (isGlass) {
			// Glass is a mirror at a graze and near-clear head on, so it gets the sky where its own
			// reflection lands, weighted the way glass really is: about 4% straight on, nearly all of
			// it along the horizon. That is why a window is a bright band at its edges and dark to look
			// through in the middle.
			const ndv = clamp(n.dot(toEye), 0, 1);
			const mirror = n.scale(2 * ndv).subtract(toEye);
			const refl = skyColour(mirror);
			const k = 0.04 + 0.96 * Math.pow(1 - ndv, 5);
			r += refl[0] * k;
			g += refl[1] * k;
			b += refl[2] * k;
		} else {
			const fres = Math.pow(clamp(1 - toEye.dot(n), 0, 1), 3);
			const k = (s.glossy === undefined ? 0.05 : s.glossy) * (0.25 + 0.75 * fres);
			r += AMB_SKY[0] * k * 1.6;
			g += AMB_SKY[1] * k * 1.7;
			b += AMB_SKY[2] * k * 1.9;
		}
	}
	// And a floor under everything, however matte: in the browser every material reflects the sky
	// cube a little, and the bloom spreads it, so nothing there ever falls to flat black. Without
	// this a drawn picture blacks out whole hedge faces that read dark green in the Villa.
	r += ENV_FLOOR;
	g += ENV_FLOOR * 1.05;
	b += ENV_FLOOR * 1.15;

	// A surface that makes its own light but is still lit — the pattern of light on the pool's floor,
	// and the few leaves that hold a little glow — adds that on top of what the sun and the sky give.
	if (s.glow && !s.unlit) {
		r += s.glow[0] * 1.3;
		g += s.glow[1] * 1.3;
		b += s.glow[2] * 1.3;
	}

	return rippleScale(s, r, g, b, u, v);
}

/** The moving water and the light net under it: both shift as the minute hand goes round. */
function rippleScale(s, r, g, b, u, v) {
	if (s.pattern === "water") {
		const t = TIME * Math.PI * 2;
		const rip = Math.sin(u * 26 + t + Math.sin(v * 19 - t * 0.7) * 1.6) * 0.5 + Math.sin(v * 31 - t * 1.3) * 0.5;
		const k = 0.78 + 0.34 * (rip * 0.5 + 0.5);
		return [r * k, g * k, b * k];
	}
	if (s.pattern === "caustics") {
		// The net of light on the pool floor is thin lines and not a sheet: where there is no line the
		// surface is clear, and where there is, it is pale aqua — the same canvas, same see-through.
		// `src/textures.js` paints the real net from a honeycomb of scattered points; the stand-in here is
		// two blob fields at seven and eleven cells (the same two pitches: eighteen cm and eleven) cut hard
		// so only their crests survive, and ridden by a slow field so the brightness of the net wanders
		// over four or five cells instead of flickering at every crossing.
		const t = TIME * 40;
		const un = u + t * 0.01;
		const vn = v - t * 0.008;
		const net =
			smooth(0.58, 0.95, Math.max(blobs(un, vn, 7, 3), blobs(un - t * 0.008, vn + t * 0.011, 11, 5) * 0.6)) *
			(0.62 + 0.38 * blobs(u, v, 3, 9));
		shadeAlpha = net;
		const g = s.glow || [0.6, 0.9, 1];
		return [r + g[0] * net * 1.7, g[1] * net * 1.9, b + g[2] * net * 1.8];
	}
	return [r, g, b];
}
const BOUNCE_DIR = bounceLight.direction.clone().normalize();

// ---------------------------------------------------------------- the triangles

const skipped = new Set(["skyDome"]);

function surfaceOf(mesh) {
	const key = mesh.material && mesh.material.name ? mesh.material.name : "";
	return SURFACES[key] || SURFACES.fallback;
}

/** The three axes a pattern lies along, so tiles follow the face they are painted on. */
function triBasis(a, b, c, uv, scale) {
	const ab = b.subtract(a);
	const ac = c.subtract(a);
	const d1 = uv[1].x - uv[0].x;
	const d2 = uv[2].x - uv[0].x;
	const d3 = uv[1].y - uv[0].y;
	const d4 = uv[2].y - uv[0].y;
	const det = d1 * d4 - d2 * d3;
	if (Math.abs(det) < 1e-9) return { r: new Vector3(1, 0, 0), u: new Vector3(0, 0, 1) };
	return {
		r: ab.scale(d4 / det).subtract(ac.scale(d2 / det)),
		u: ac.scale(d1 / det).subtract(ab.scale(d3 / det)),
	};
}

const planeCache = new Map();

function triangles(mesh) {
	const key = `${mesh.uniqueId}|${mesh.name}|${mesh.position.x}|${mesh.position.y}|${mesh.position.z}|${mesh.rotation.x}|${mesh.rotation.y}|${mesh.rotation.z}|${mesh.scaling.x}|${mesh.scaling.y}|${mesh.scaling.z}`;
	const seen = planeCache.get(key);
	if (seen) return seen;

	const pos = mesh.getVerticesData(VertexBuffer.PositionKind);
	const nor = mesh.getVerticesData(VertexBuffer.NormalKind);
	const uvs = mesh.getVerticesData(VertexBuffer.UVKind);
	// The colour written at every corner of the mesh, which the engine multiplies into whatever pattern
	// that mesh wears — the shrub's own shading, the jungle's crowns each wearing its own tone, the far
	// ridge's stands of taller and lesser trees. Only read for surfaces that say `vertex` in
	// src/surface-colours.js: the lawn, the deck and the teak carry their patches the same way in the
	// browser, but this drawing already multiplies those in at every pixel from the fields themselves
	// (`broad` in that file), and doing it twice would double the garden's patches.
	const cols = surfaceOf(mesh).vertex ? mesh.getVerticesData(VertexBuffer.ColorKind) : null;
	const idx = mesh.getIndices();
	if (!pos || !idx) return null;
	const world = mesh.computeWorldMatrix(true);
	const s = surfaceOf(mesh);
	const scale = s.scale === undefined ? 1 : s.scale;
	const tris = [];
	for (let i = 0; i < idx.length; i += 3) {
		const ia = idx[i] * 3;
		const ib = idx[i + 1] * 3;
		const ic = idx[i + 2] * 3;
		// The three corners' own colours, when the mesh carries them: the same multipliers the engine
		// multiplies into the pattern, read straight off the mesh so the two cannot drift apart.
		const tint = cols
			? [
					[cols[(ia / 3) * 4], cols[(ia / 3) * 4 + 1], cols[(ia / 3) * 4 + 2]],
					[cols[(ib / 3) * 4], cols[(ib / 3) * 4 + 1], cols[(ib / 3) * 4 + 2]],
					[cols[(ic / 3) * 4], cols[(ic / 3) * 4 + 1], cols[(ic / 3) * 4 + 2]],
				]
			: null;
		const va = Vector3.TransformCoordinates(new Vector3(pos[ia], pos[ia + 1], pos[ia + 2]), world);
		const vb = Vector3.TransformCoordinates(new Vector3(pos[ib], pos[ib + 1], pos[ib + 2]), world);
		const vc = Vector3.TransformCoordinates(new Vector3(pos[ic], pos[ic + 1], pos[ic + 2]), world);
		const hasUV = !!uvs;
		const uv = hasUV
			? [
					{ x: uvs[idx[i] * 2], y: uvs[idx[i] * 2 + 1] },
					{ x: uvs[idx[i + 1] * 2], y: uvs[idx[i + 1] * 2 + 1] },
					{ x: uvs[idx[i + 2] * 2], y: uvs[idx[i + 2] * 2 + 1] },
				]
			: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 0, y: 1 },
				];
		// Without normals in the mesh, the face's own square is square enough — wound the same way
		// Babylon winds a face, which is the opposite way round to `first edge × second edge`: on a
		// plain box, whose faces are seen from outside, that product points *into* the box. Getting
		// this backwards hides a face from the drawing and shows one that a renderer would throw out.
		const na = nor
			? Vector3.TransformNormal(new Vector3(nor[ia], nor[ia + 1], nor[ia + 2]), world).normalize()
			: vc.subtract(va).cross(vb.subtract(va)).normalize();
		tris.push({ a: va, b: vb, c: vc, n: na, uv, basis: triBasis(va, vb, vc, uv, scale), s, scale, mesh, tint });
	}
	planeCache.set(key, tris);
	return tris;
}

// ---------------------------------------------------------------- the sun's own map of the garden
//
// Drawn here on the CPU: every casting mesh is flattened along the sun's direction into a depth
// map, and a place is in shade when something stands between it and the sun. The box of the map is
// fitted to the casters, the same way the engine fits its own.

let SHADOW = null;

function buildShadowMap(size) {
	const visible = (m) => m.isVisible && m.isEnabled() && !skipped.has(m.name) && m.getTotalVertices() > 0;
	const asked = new Set(casters.filter(visible));
	const guess = new Set(scene.meshes.filter((m) => visible(m) && (m.checkCollisions || m.receiveShadows)));
	if (flags.has("castcheck")) {
		const onlyGuess = [...guess].filter((m) => !asked.has(m));
		const onlyAsked = [...asked].filter((m) => !guess.has(m));
		console.log(`  cast check — the Villa asks for ${asked.size}, this drawing guesses ${guess.size}, they agree on ${asked.size - onlyAsked.length}`);
		const name = (m) => m.name;
		if (onlyGuess.length) console.log(`  in the drawing only (${onlyGuess.length}): ${onlyGuess.map(name).slice(0, 24).join(", ")}`);
		if (onlyAsked.length) console.log(`  in the Villa only (${onlyAsked.length}): ${onlyAsked.map(name).slice(0, 24).join(", ")}`);
	}
	const list = [...asked];
	let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, d0 = 1e9, d1 = -1e9;
	const note = (p) => {
		const u = p.dot(lightRight);
		const v = p.dot(lightUp);
		const d = p.dot(lightForward);
		if (u < u0) u0 = u;
		if (u > u1) u1 = u;
		if (v < v0) v0 = v;
		if (v > v1) v1 = v;
		if (d < d0) d0 = d;
		if (d > d1) d1 = d;
	};
	for (const m of list) for (const p of m.getBoundingInfo().boundingBox.vectorsWorld) note(p);
	// A little room at the front, so nothing self-shades at the near edge of the map.
	d0 -= 0.5;
	const depth = new Float32Array(size * size).fill(Infinity);
	const su = size / (u1 - u0);
	const sv = size / (v1 - v0);
	const sd = 1 / (d1 - d0);
	let trianglesDrawn = 0;

	for (const m of list) {
		const tris = triangles(m);
		if (!tris) continue;
		for (const t of tris) {
			const q = [t.a, t.b, t.c].map((p) => ({
				x: (p.dot(lightRight) - u0) * su,
				y: size - 1 - (p.dot(lightUp) - v0) * sv,
				d: (p.dot(lightForward) - d0) * sd,
			}));
			const x0 = q[0].x, y0 = q[0].y, x1 = q[1].x, y1 = q[1].y, x2 = q[2].x, y2 = q[2].y;
			const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
			if (Math.abs(area) < 1e-9) continue;
			const inv = 1 / area;
			const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
			const maxX = Math.min(size - 1, Math.ceil(Math.max(x0, x1, x2)));
			const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
			const maxY = Math.min(size - 1, Math.ceil(Math.max(y0, y1, y2)));
			trianglesDrawn++;
			for (let py = minY; py <= maxY; py++) {
				for (let px = minX; px <= maxX; px++) {
					const sx = px + 0.5;
					const sy = py + 0.5;
					const w0 = ((x2 - x1) * (sy - y1) - (y2 - y1) * (sx - x1)) * inv;
					if (w0 < 0) continue;
					const w1 = ((x0 - x2) * (sy - y2) - (y0 - y2) * (sx - x2)) * inv;
					if (w1 < 0) continue;
					const w2 = 1 - w0 - w1;
					if (w2 < 0) continue;
					const d = w0 * q[0].d + w1 * q[1].d + w2 * q[2].d;
					const i = py * size + px;
					if (d < depth[i]) depth[i] = d;
				}
			}
		}
	}
	return { size, depth, u0, v0, d0, su, sv, sd, casters: list.length, trianglesDrawn };
}

if (SHADOW_SIZE) SHADOW = buildShadowMap(SHADOW_SIZE);

/** How much sun reaches a place: 1 in the light, 0 in a shadow. */
function sunAt(p, ndl) {
	if (!SHADOW) return 1;
	const s = SHADOW;
	// Lift the place off the surface it is on, so a flat face does not shade itself.
	const q = p.add(SUN_DIR.scale(0.04 + 0.1 * (1 - ndl)));
	const u = (q.dot(lightRight) - s.u0) * s.su;
	const v = s.size - 1 - (q.dot(lightUp) - s.v0) * s.sv;
	if (u < 0 || v < 0 || u >= s.size || v >= s.size) return 1;
	const here = (q.dot(lightForward) - s.d0) * s.sd;
	const x0 = Math.floor(u);
	const y0 = Math.floor(v);
	const at = (x, y) => s.depth[y * s.size + x];
	const bias = 0.0025 + 0.004 * (1 - ndl);
	// Four taps, so the edge of a shadow is not a hard stair.
	for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
		const d = at(Math.min(s.size - 1, x0 + dx), Math.min(s.size - 1, y0 + dy));
		if (d + bias >= here) return 1;
	}
	return 0;
}

// Which side of a face you may see it from is not a matter of taste. A renderer throws away every
// triangle whose face points away from the eye — that is why a box is a box and not a bag of
// see-through panels — and until this was put in, this drawing drew both sides of everything and
// could not see a wrongly wound surface at all. Four of the lawn strips, the pool's water and its
// two caustics sheets and both soffits were wound that way: whole surfaces that a browser never drew.
// A material that says `backFaceCulling = false` (the leaves) is exempt, as is a surface the notes
// in src/surface-colours.js mark `double`.
const CULL = !flags.has("nocull");
const facing = new Map();

const traced = new Set();
function drawMesh(mesh, transparent) {
	const s = surfaceOf(mesh);
	const alpha = s.alpha === undefined ? 1 : s.alpha;
	if ((alpha < 1) !== transparent) return;
	const tris = triangles(mesh);
	if (!tris) return;
	const name = mesh.material ? mesh.material.name : mesh.name;
	const own = nameIndex(name);
	const twoSided = s.double === true || mesh instanceof BABYLON.LinesMesh || (mesh.material && mesh.material.backFaceCulling === false);
	const tally = facing.get(mesh.name) || { seen: 0, turned: 0 };
	facing.set(mesh.name, tally);
	const NEAR = 0.06; // the same near plane the walking camera has

	for (const tri of tris) {
		const centre = tri.a.add(tri.b).add(tri.c).scale(1 / 3);
		const toEye = eye.position.subtract(centre);
		const distance = toEye.length();
		const towards = tri.n.dot(toEye);
		if (CULL && !twoSided && towards <= 0) {
			tally.turned++;
			continue;
		}
		tally.seen++;
		// A two-sided face is still lit from whichever side you look at it.
		const faceSign = towards < 0 ? -1 : 1;
		const n = tri.n.scale(faceSign);
		const viewDir = toEye.scale(1 / (distance || 1));
		const kFog = FOG_ON && FOG_DENSITY ? 1 - Math.exp(-Math.pow(FOG_DENSITY * distance, 2)) : 0;

		let pts = [
			Object.assign(project(tri.a), { world: tri.a, uv: tri.uv[0], tint: tri.tint ? tri.tint[0] : null }),
			Object.assign(project(tri.b), { world: tri.b, uv: tri.uv[1], tint: tri.tint ? tri.tint[1] : null }),
			Object.assign(project(tri.c), { world: tri.c, uv: tri.uv[2], tint: tri.tint ? tri.tint[2] : null }),
		];
		if (pts[0].cz < NEAR || pts[1].cz < NEAR || pts[2].cz < NEAR) pts = clipNear(pts, NEAR);
		if (pts.length < 3) continue;

		// A clipped triangle is a fan: the same shading, one polygon at a time.
		for (let k = 1; k + 1 < pts.length; k++) paintTriangle(pts[0], pts[k], pts[k + 1], n, viewDir, tri, kFog, alpha, own, mesh);
	}
}

/** Cut a triangle off at the eye, so the lawn you are standing on is still drawn. */
function clipNear(pts, near) {
	const out = [];
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		const ain = a.cz >= near;
		const bin = b.cz >= near;
		if (ain) out.push(a);
		if (ain !== bin) {
			const t = (near - a.cz) / (b.cz - a.cz);
			out.push({
				cz: near,
				cx: a.cx + (b.cx - a.cx) * t,
				cy: a.cy + (b.cy - a.cy) * t,
				world: a.world.add(b.world.subtract(a.world).scale(t)),
				uv: { x: a.uv.x + (b.uv.x - a.uv.x) * t, y: a.uv.y + (b.uv.y - a.uv.y) * t },
				tint: a.tint ? [a.tint[0] + (b.tint[0] - a.tint[0]) * t, a.tint[1] + (b.tint[1] - a.tint[1]) * t, a.tint[2] + (b.tint[2] - a.tint[2]) * t] : null,
			});
		}
	}
	return out;
}

function paintTriangle(a, b, c, n, viewDir, tri, kFog, alpha, own, mesh) {
	const toPx = (p) => [(0.5 + 0.5 * (p.cx / p.cz) / (eye.tanHalf * eye.aspect)) * W, (0.5 - 0.5 * (p.cy / p.cz) / eye.tanHalf) * H];
	const [x0, y0] = toPx(a);
	const [x1, y1] = toPx(b);
	const [x2, y2] = toPx(c);
	if (Math.max(x0, x1, x2) < 0 || Math.min(x0, x1, x2) > W || Math.max(y0, y1, y2) < 0 || Math.min(y0, y1, y2) > H) return;
	const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
	const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
	const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
	const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
	const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
	if (Math.abs(area) < 1e-7) return;
	const inv = 1 / area;

	for (let py = minY; py <= maxY; py++) {
		for (let px = minX; px <= maxX; px++) {
			const sx = px + 0.5;
			const sy = py + 0.5;
			const w0 = ((x2 - x1) * (sy - y1) - (y2 - y1) * (sx - x1)) * inv;
			if (w0 < 0) continue;
			const w1 = ((x0 - x2) * (sy - y2) - (y0 - y2) * (sx - x2)) * inv;
			if (w1 < 0) continue;
			const w2 = 1 - w0 - w1;
			if (w2 < 0) continue;

			const i = py * W + px;
			const z = 1 / (w0 / a.cz + w1 / b.cz + w2 / c.cz);
			if (z >= depth[i]) continue;

			// Screen-space weights only tell where a pixel sits on the triangle once they are divided
			// by how far each corner is: without that the pattern on a big near-flat plane — the lawn
			// a visitor stands on, the paving — runs off into the distance the wrong way.
			const iz = w0 / a.cz + w1 / b.cz + w2 / c.cz;
			const l0 = w0 / a.cz / iz;
			const l1 = w1 / b.cz / iz;
			const l2 = 1 - l0 - l1;

			const scale = tri.scale;
			const u = (l0 * a.uv.x + l1 * b.uv.x + l2 * c.uv.x) * scale;
			const v = (l0 * a.uv.y + l1 * b.uv.y + l2 * c.uv.y) * scale;
			if (!isWhole(tri.s, u, v)) continue; // a leaf that is not there

			const world = a.world.scale(l0).add(b.world.scale(l1)).add(c.world.scale(l2));
			// The mesh's own corner colours, interpolated the same way the pattern's coordinates are.
			const skin = a.tint
				? [
						l0 * a.tint[0] + l1 * b.tint[0] + l2 * c.tint[0],
						l0 * a.tint[1] + l1 * b.tint[1] + l2 * c.tint[1],
						l0 * a.tint[2] + l1 * b.tint[2] + l2 * c.tint[2],
					]
				: null;
			const col = shade(tri.s, world, n, viewDir, u, v, skin);
			const seeThrough = alpha * shadeAlpha;
			if (seeThrough < 0.02) continue;
			let r = col[0];
			let g = col[1];
			let bl = col[2];
			if (kFog) {
				r += (FOG_COLOUR[0] - r) * kFog;
				g += (FOG_COLOUR[1] - g) * kFog;
				bl += (FOG_COLOUR[2] - bl) * kFog;
			}
			const j = i * 3;
			if (seeThrough >= 1) {
				colour[j] = r;
				colour[j + 1] = g;
				colour[j + 2] = bl;
				depth[i] = z;
			} else {
				colour[j] += (r - colour[j]) * seeThrough;
				colour[j + 1] += (g - colour[j + 1]) * seeThrough;
				colour[j + 2] += (bl - colour[j + 2]) * seeThrough;
			}
			owner[i] = own;
			where[i * 3] = world.x;
			where[i * 3 + 1] = world.y;
			where[i * 3 + 2] = world.z;
			nrm[i * 3] = n.x;
			nrm[i * 3 + 1] = n.y;
			nrm[i * 3 + 2] = n.z;
			who[i] = mesh.name;
			lit[i * 2] = Math.max(0, n.dot(SUN_DIR));
			lit[i * 2 + 1] = (r + g + bl) / 3;
		}
	}
}

const meshes = scene.meshes.filter((m) => m.isVisible && m.isEnabled() && m.getTotalVertices() > 0 && !skipped.has(m.name));
const started = Date.now();
// Opaque first, then the see-through things over the top, furthest first.
for (const m of meshes) drawMesh(m, false);
const seeThrough = meshes
	.filter((m) => {
		const s = surfaceOf(m);
		return s.alpha !== undefined && s.alpha < 1;
	})
	.map((m) => {
		const c = m.getBoundingInfo().boundingBox.centerWorld;
		const p = project(c);
		return { m, far: p.cz };
	})
	.sort((a, b) => b.far - a.far)
	.map((e) => e.m);
for (const m of seeThrough) drawMesh(m, true);

// The corners go dark, with the browser's own vignette, in raw light before the tone mapping.
{
	const vig = vignetteFactors(W, H);
	for (let i = 0; i < W * H; i++) {
		const v = vig[i];
		const j = i * 3;
		for (let c = 0; c < 3; c++) colour[j + c] *= VIGNETTE_COLOUR[c] + (1 - VIGNETTE_COLOUR[c]) * v;
	}
}

// Tone-map into display values first, then let the bright things spill, then gamma-encode once.
const display = new Float32Array(W * H * 3);
const toneScratch = [0, 0, 0];
for (let i = 0; i < W * H; i++) {
	toneLinear(colour[i * 3], colour[i * 3 + 1], colour[i * 3 + 2], toneScratch);
	display[i * 3] = toneScratch[0];
	display[i * 3 + 1] = toneScratch[1];
	display[i * 3 + 2] = toneScratch[2];
}
if (BLOOM_WEIGHT > 0) addBloom(display, W, H, BLOOM_THRESHOLD, BLOOM_WEIGHT);


const bytes = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H * 3; i++) bytes[i] = encode(display[i]);

const dir = OUT.split("/");
if (dir.length > 1) fs.mkdirSync(dir.slice(0, -1).join("/"), { recursive: true });
fs.writeFileSync(OUT, png(W, H, bytes));

function png(w, h, rgb) {
	const raw = Buffer.alloc((w * 3 + 1) * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const from = (y * w + x) * 3;
			const to = y * (w * 3 + 1) + 1 + x * 3;
			raw[to] = rgb[from];
			raw[to + 1] = rgb[from + 1];
			raw[to + 2] = rgb[from + 2];
		}
	}
	const table = [];
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	const crc = (buf) => {
		let c = 0xffffffff;
		for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	};
	const chunk = (type, data) => {
		const head = Buffer.alloc(4);
		head.writeUInt32BE(data.length);
		const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
		const tail = Buffer.alloc(4);
		tail.writeUInt32BE(crc(body));
		return Buffer.concat([head, body, tail]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk("IHDR", ihdr),
		chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

// ---------------------------------------------------------------- what the picture says

let black = 0;
let blown = 0;
const blackBy = new Map();
const cover = new Map();
for (let i = 0; i < W * H; i++) {
	const name = names[owner[i]] || "nothing";
	cover.set(name, (cover.get(name) || 0) + 1);
	const l = 0.2126 * bytes[i * 3] + 0.7152 * bytes[i * 3 + 1] + 0.0722 * bytes[i * 3 + 2];
	if (l < 8) blackBy.set(name, (blackBy.get(name) || 0) + 1);
	if (l < 8) black++;
	if (bytes[i * 3] > 240 && bytes[i * 3 + 1] > 240 && bytes[i * 3 + 2] > 230) blown++;
}
const list = (map, n) =>
	[...map.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([k, c]) => `${k} ${((c / (W * H)) * 100).toFixed(0)}%`)
		.join(", ");

// What each kind of surface was actually painted as, in the very numbers tools/cover.js prints for a
// browser picture, so the two eyes can be read against each other surface by surface instead of one
// whole frame against another. This is how the drawing's glass was found to be a cool grey sheet over
// a warm room: the browser painted the panes at 79,76,62 and this was painting them at 100,105,96.
const paint = new Map();
for (let i = 0; i < W * H; i++) {
	const name = names[owner[i]] || "nothing";
	let row = paint.get(name);
	if (!row) paint.set(name, (row = { n: 0, sum: [0, 0, 0], sq: [0, 0, 0], low: null, lowL: 1e9, high: null, highL: -1 }));
	const rgb = [bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]];
	const l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
	row.n++;
	for (let c = 0; c < 3; c++) {
		row.sum[c] += rgb[c];
		row.sq[c] += rgb[c] * rgb[c];
	}
	if (l < row.lowL) (row.lowL = l), (row.low = rgb);
	if (l > row.highL) (row.highL = l), (row.high = rgb);
}
const runsOf = (row) => row.sum.map((s, c) => Math.round(Math.sqrt(Math.max(0, row.sq[c] / row.n - (s / row.n) * (s / row.n)))));

console.log(`${OUT}: ${W}x${H}, ${meshes.length} meshes, ${names.length - 1} kinds of surface, ${((Date.now() - started) / 1000).toFixed(1)} s`);
console.log(
	`  sun at azimuth ${SUN_FROM[0]}°, ${SUN_FROM[1]}° high; shadow map ${SHADOW ? `${SHADOW.size} across ${SHADOW.casters} casting meshes` : "off"}`,
);
console.log(`  gains — sun ${SUN_GAIN.toFixed(2)}, sky fill ${HEMI_GAIN.toFixed(2)}, bounce ${BOUNCE_GAIN.toFixed(2)}, lamps ${POINT_GAIN}, dome ${SKY_GAIN}, exposure ${EXPOSURE}`);
console.log(`  what fills the frame: ${list(cover, 12)}`);
console.log("  what each kind was painted as — the same numbers tools/cover.js prints for a browser picture");
for (const [name, row] of [...paint.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10)) {
	const mean = row.sum.map((s) => Math.round(s / row.n));
	console.log(
		`    ${name.padEnd(14)} ${((row.n / (W * H)) * 100).toFixed(1)}%  mean ${String(mean).padEnd(14)} runs ${String(runsOf(row)).padEnd(10)} darkest ${String(row.low).padEnd(13)} brightest ${String(row.high)}`,
	);
}
{
	let seen = 0;
	let turned = 0;
	for (const f of facing.values()) {
		seen += f.seen;
		turned += f.turned;
	}
	const hollow = [...facing.entries()].filter(([, f]) => f.seen === 0 && f.turned > 0).sort((a, b) => b[1].turned - a[1].turned);
	console.log(
		CULL
			? `  faces — ${seen} triangles turned toward the eye, ${turned} thrown out for facing away (what a renderer does)${hollow.length ? `; NOTHING of these faces the eye: ${hollow.map(([n, f]) => `${n} (${f.turned})`).slice(0, 12).join(", ")}` : ""}`
		: `  faces — culling is off (--nocull): both sides of every plane drawn`,
	);
}
console.log(
	blown
		? `  blew out to white on ${((blown / (W * H)) * 100).toFixed(1)}% of the frame - a sunlit surface with no pattern left in it`
		: "  nothing blew out to white",
);
console.log(
	black
		? `  came out black on ${((black / (W * H)) * 100).toFixed(1)}% of the frame: ${list(blackBy, 6)} - this drawing has bloom but no bounced light, so a dark corner here can read all right in the browser`
		: "  nothing came out black",
);

for (const spot of PICK) {
	const [x, y] = spot.split(",").map(Number);
	if (!(x >= 0 && y >= 0 && x < W && y < H)) {
		console.log(`  pick ${x},${y}: outside the picture (${W}x${H}) — pixels run from 0 to ${W - 1} and 0 to ${H - 1}`);
		continue;
	}
	const i = Math.floor(y) * W + Math.floor(x);
	const t = tonemap(colour[i * 3], colour[i * 3 + 1], colour[i * 3 + 2]);
	const d = depth[i] === Infinity ? "—" : depth[i].toFixed(1);
	console.log(`  pick ${x},${y}: rgb ${t[0]},${t[1]},${t[2]}  ${names[owner[i]] || "nothing"} (${who[i] || "nothing"}) at ${d} m  place ${where[i*3].toFixed(2)},${where[i*3+1].toFixed(2)},${where[i*3+2].toFixed(2)}  face ${nrm[i*3].toFixed(2)},${nrm[i*3+1].toFixed(2)},${nrm[i*3+2].toFixed(2)}`);
}

if (flags.has("debug")) {
	const byName = new Map();
	for (let i = 0; i < W * H; i++) {
		const name = names[owner[i]] || "nothing";
		const e = byName.get(name) || { n: 0, sun: 0, l: 0, min: 999, max: -999 };
		e.n++;
		e.sun += lit[i * 2];
		const v = lit[i * 2 + 1];
		e.l += v;
		e.min = Math.min(e.min, v);
		e.max = Math.max(e.max, v);
		byName.set(name, e);
	}
	console.log("  how each surface is lit — mean cosine to the sun, and mean and range of light as drawn");
	for (const [k, e] of [...byName.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 14)) {
		console.log(
			`  ${k.padEnd(13)} ${(e.n / (W * H) * 100).toFixed(1).padStart(5)}% of the frame  sun ${e.sun === 0 ? "behind it" : (e.sun / e.n).toFixed(2)}  light ${(e.l / e.n).toFixed(3)} (${e.min.toFixed(2)}-${e.max.toFixed(2)})`,
		);
	}
}
