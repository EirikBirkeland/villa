// Every surface in the Villa gets a painted canvas, not a flat colour.
// Each maker below draws one square, seamless pattern on a canvas; texture() wraps it
// into a Babylon texture that can be repeated.

import { randomGenerator, noiseField, ridgeField, bumpFromField } from "./noise.js";

const { DynamicTexture, Texture } = BABYLON;

/**
 * Wraps a painted canvas into a repeating Babylon texture.
 *
 * Every map the Villa paints asks for a mip chain — `mipmaps` is on by default and nothing turns it
 * off — and that is not a detail of the renderer but a fact about what a pattern is. A pattern
 * minified WITHOUT a chain is not blurred: it is read at a stride, one texel in every four or six,
 * and a regular pattern comes back from a distance as a lattice of beats that its own canvas never
 * contained and that no colour dial can remove. The pool's tile bump is the measurement: its canvas is
 * 256 across a 0.8 m repeat, twenty-one texels to a mosaic tile, and at six metres a tile is four
 * pixels — so the tile's arris was sampled one texel in five and the start view's pool came out a wire
 * frame over the tiles at L76 (`pictures/s67-grid-before.png`). With the chain on, the same camera
 * reads tiles at L84 and the block-to-block variation over that water falls from 13.6 to 10.4
 * (`pictures/700-home.png`). Fifteen of the Villa's seventeen bump maps were laid without one; see
 * the changelog for 0.64.0.
 */
export function texture(scene, canvas, { name = "pattern", scale = 1, gamma = true, mipmaps = true, clamp = false } = {}) {
	const tex = new DynamicTexture(name, canvas, scene, mipmaps, Texture.TRILINEAR_SAMPLINGMODE);
	tex.update();
	// Clamped, when the canvas is an atlas and not a tile: a mesh that is inked with one cell of it must
	// not have its far edge wrapped round into the cell across. The belt's near rank is the one surface
	// laid that way — see `canopyAtlas`.
	tex.wrapU = clamp ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
	tex.wrapV = clamp ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
	tex.uScale = scale;
	tex.vScale = scale;
	tex.gammaSpace = gamma;
	tex.anisotropicFilteringLevel = 8;
	return tex;
}

function canvasOfSize(size) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	return canvas;
}

/** Paints a noise field over an existing canvas, mixing two colours, with given opacities. */
function wash(canvas, field, low, high, alpha) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let i = 0; i < size * size; i++) {
		const v = field[i];
		const o = i * 4;
		const mix = alpha;
		const source = [
			low[0] + (high[0] - low[0]) * v,
			low[1] + (high[1] - low[1]) * v,
			low[2] + (high[2] - low[2]) * v,
		];
		data[o] = data[o] * (1 - mix) + source[0] * mix;
		data[o + 1] = data[o + 1] * (1 - mix) + source[1] * mix;
		data[o + 2] = data[o + 2] * (1 - mix) + source[2] * mix;
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

function paintField(canvas, field, ramp) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let i = 0; i < size * size; i++) {
		const colour = ramp(field[i]);
		const o = i * 4;
		data[o] = colour[0];
		data[o + 1] = colour[1];
		data[o + 2] = colour[2];
		data[o + 3] = 255;
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/** A soft edge: 0 at or below `from`, 1 at or above `to`. */
function edge(from, to, x) {
	const t = Math.min(1, Math.max(0, (x - from) / (to - from || 1e-6)));
	return t * t * (3 - 2 * t);
}

/**
 * Multiplies the canvas by a wave of bands across it — the lines a mower leaves. `bands` whole
 * bands across one tile, each one `depth` darker on its far side than on its near side. Smooth on
 * purpose: hard bands would shimmer and moire once the engine shrinks the pattern at a distance.
 */
function mownBands(canvas, bands, depth) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let y = 0; y < size; y++) {
		const k = 1 - depth * (0.5 - 0.5 * Math.cos((y / size) * bands * Math.PI * 2));
		for (let x = 0; x < size; x++) {
			const o = (y * size + x) * 4;
			data[o] *= k;
			data[o + 1] *= k;
			data[o + 2] *= k;
		}
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * Multiplies the canvas by a 0..1 field centred on a half: where the field is high what is under it
 * brightens, where it is low it darkens, by `amount` at the ends of the field.
 *
 * `wash` MIXES toward one of two colours, and the two ends pull each other out: a field that never
 * leaves 0.35..0.65 leaves a couple of points of spread however loudly the wash is asked, which is how
 * the paving tile came to measure `std 4` across a whole painted stone. This scales what is already
 * there, so the spread asked for is the spread got. The fields used with it are seamless, so a pattern
 * multiplied by one still tiles.
 */
function multiplyByField(canvas, field, amount) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let i = 0; i < size * size; i++) {
		const k = 1 + (field[i] - 0.5) * amount;
		const o = i * 4;
		data[o] = Math.min(255, data[o] * k);
		data[o + 1] = Math.min(255, data[o + 1] * k);
		data[o + 2] = Math.min(255, data[o + 2] * k);
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/** Paints one colour where a field is high, and nowhere else: soil showing through thin grass. */
function barePatch(canvas, field, from, to, colour, strength) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let i = 0; i < size * size; i++) {
		const mix = edge(from, to, field[i]) * strength;
		if (mix <= 0) continue;
		const o = i * 4;
		data[o] += (colour[0] - data[o]) * mix;
		data[o + 1] += (colour[1] - data[o + 1]) * mix;
		data[o + 2] += (colour[2] - data[o + 2]) * mix;
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * Tints the pixels under a field toward one colour where the field is low and toward another where
 * it is high, with a smooth crossfade over the middle of the field and nothing at all at its edges.
 *
 * `wash` mixes between two colours ALONG a field, so the ground it paints is a gradient: one thing
 * shading into another. This paints two things that grow side by side — a thick clump of grass and a
 * thin one, dry thatch and green — which is what a field of grass density actually looks like from
 * ten metres off: patches with edges, not a wash.
 */
function mixByField(canvas, field, low, high, alpha) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	for (let i = 0; i < size * size; i++) {
		const t = edge(0.3, 0.7, field[i]);
		const o = i * 4;
		for (let c = 0; c < 3; c++) {
			const target = low[c] + (high[c] - low[c]) * t;
			data[o + c] += (target - data[o + c]) * alpha;
		}
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * Streaked white noise, multiplied over the canvas: the fine grain of a sward.
 *
 * A mown lawn between three and twenty metres off is not a crowd of individual leaves — it is a fine
 * dense grain with a direction in it, the tips of ten thousand blades, some catching the sun and most
 * not. Nothing painted as separate marks can supply that at six metres to a tile: at 1024 a texel is
 * six millimetres of ground, so a blade is a texel or two across and a stroke three texels wide is a
 * hand's breadth of grass. The first attempt at this layer painted ten thousand separate blades and a
 * browser came back with scattered green commas lying on a smooth field
 * (`pictures/s48b-grass.png`): right idea, forty times too few.
 *
 * So this is noise and not drawing. One random number per texel, averaged along a short leaning line —
 * eight texels up and four across — which turns the salt into a flock of vertical streaks, the size
 * of a blade and as dense as the paper allows. A second, shorter set leans the other way so the grain
 * is not one comb. It is multiplied over whatever is underneath, so the lawn's broad tones, its mown
 * bands and its clumps are all still there; the grain only decides where a blade catches the light.
 *
 * Tileable by construction: the random number is a hash of the texel's place modulo the tile, so the
 * streaks cross the join like everything else here.
 */
function swardGrain(canvas, { length = 8, shear = 0.5, second = 3, depth = 0.36, seed = 77 } = {}) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	// A hash of one texel: the same answer for the same place, every time.
	const hash = (x, y) => {
		let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 362437);
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
	};
	// The salt is thrown once and kept. Throwing it again for every tap of every streak — which is what
	// this did first — costs six million hashes for a 1024 tile and showed at the start of the Villa:
	// the lawn alone was most of a second of the wait before the first frame, and the visitor is meant to
	// be standing in the garden the moment the page opens, not waiting behind a salt shaker.
	const salt = new Float32Array(size * size);
	for (let y = 0; y < size; y++) {
		const row = y * size;
		for (let x = 0; x < size; x++) salt[row + x] = hash(x, y);
	}
	// How far each tap leans, and how far back, worked out once instead of once per texel.
	const near = [];
	const far = [];
	for (let k = 0; k < length; k++) near.push([Math.round(shear * k), k, 1]);
	for (let k = 0; k < second; k++) far.push([-Math.round(0.4 * k), k, 0.6]);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	const rows = new Int32Array(length + second);
	for (let y = 0; y < size; y++) {
		const row = y * size;
		for (let k = 0; k < length; k++) rows[k] = (((y - near[k][1]) % size) + size) * size % (size * size);
		for (let k = 0; k < second; k++) rows[length + k] = (((y - far[k][1]) % size) + size) * size % (size * size);
		for (let x = 0; x < size; x++) {
			let sum = 0;
			let weight = 0;
			for (let k = 0; k < length; k++) {
				let sx = x + near[k][0];
				if (sx >= size) sx -= size;
				else if (sx < 0) sx += size;
				const at = rows[k] + sx;
				// Two texels across, so the grain is two millimetres of blade and not a saw of single ones.
				sum += salt[at] + salt[rows[k] + (sx + 1 === size ? 0 : sx + 1)];
				weight += 2;
			}
			for (let k = 0; k < second; k++) {
				let sx = x + far[k][0];
				if (sx >= size) sx -= size;
				else if (sx < 0) sx += size;
				sum += far[k][2] * salt[rows[length + k] + sx];
				weight += far[k][2];
			}
			const v = sum / weight - 0.5; // minus half: half the blades lighter, half darker
			const o = (row + x) * 4;
			const k = 1 + v * depth * 2;
			data[o] *= k;
			data[o + 1] *= k;
			data[o + 2] *= k;
		}
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * The sward as a crowd of separate blades, painted straight into the canvas's bytes.
 *
 * `swardGrain` above is the sward as a MASS — a directional flock of light and dark, cheap and dense.
 * It cannot make a plant. A person standing in the garden looks down at grass two to five metres off,
 * where a pixel of the screen is four to eight millimetres of ground and a blade is five: that is the
 * one place in the Villa where a crowd of separate leaves is what the eye is actually given, and a
 * lawn with no crowd in it reads as green felt however well the felt is painted.
 *
 * Two attempts came before this one and both are photographed. The first drew its blades with canvas
 * strokes — 4,680 of them in 520 crowns, each a quadratic curve with a shadow under it — and a browser
 * came back with a smooth field sprinkled with small dark V's (`pictures/s54-tile-grass.png`). The
 * second went to sixty thousand blades and their own noise fields for tone, and came back a sheet of
 * green scribbles (`pictures/s54-tile-crowd.png`): right crowd, wrong ground. Both failures are the
 * same one and it is worth saying plainly: **a blade that is not the tone of the ground it stands on is
 * a mark, not a plant.** So the tone below is read back out of the pixels that are already painted, and
 * every blade inherits the light of its own place — which is also what keeps the mown bands and the
 * garden's broad patches alive under the crowd instead of being pasted over.
 *
 * Painted by hand into the pixel buffer rather than with strokes: a stroke costs a path, a state change
 * and a composite, and a hundred and eighty thousand of those took the boot past a second. Each blade is
 * a walked line of six to fourteen texels — three to eight centimetres of leaf — that lays its own
 * shadow a hair right and below itself before it lies down. That shadow is what makes the crowd read as
 * depth, and it is also the height `bumpFromCanvas` reads.
 *
 * Three things make it a crowd and not a salt shaker:
 *
 *   the crown. A bunch of grass grows out of one root: ten leaves within three centimetres, leaning
 *   roughly together and lit roughly together. Light and dark therefore arrive in handfuls at 3-20 cm,
 *   the one scale of a close crowd that still survives to ten metres, where a single blade does not.
 *   the lay. Which way the blades point wanders across the tile in metre-wide families, so the crowd
 *   never combs into one direction the way a single shear does.
 *   the spread. Each blade is paid its own lightness within its crown, over half the lawn's own ramp.
 *   Half a real sward is in shadow and a quarter of it is a lit tip; a spread of a tenth is a wash.
 *
 * The crowd is dense enough to repaint most of the tile — near two hundred thousand blades over a
 * million texels — and its own average is measured back to the byte the wash left it at with `lift`,
 * because every standing view in this folder is measured against the lawn's own mean.
 */
function swardCrowd(canvas, { crowns = 16000, perCrown = 11, seed = 411, lay, ramp, spread = 0.52, crownSpread = 0.26, ink = 0.8, shadeInk = 0.4, lift = 0.13, shadeDepth = 0.5 } = {}) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const data = image.data;
	const rand = randomGenerator(seed);
	const step = size / 1024; // one blade is drawn for a 1024 tile and scaled with the tile
	const at = (field, x, y) => {
		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const fx = x - x0;
		const fy = y - y0;
		const g = (a, b) => field[(((b % size) + size) % size) * size + (((a % size) + size) % size)];
		return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
	};
	// One pixel of ink, wrapped over the tile's edge so a blade that walks off one side arrives on the other.
	const put = (x, y, col, mix) => {
		const xi = x < 0 ? x + size : x >= size ? x - size : x;
		const yi = y < 0 ? y + size : y >= size ? y - size : y;
		const o = ((yi | 0) * size + (xi | 0)) * 4;
		data[o] += (col[0] - data[o]) * mix;
		data[o + 1] += (col[1] - data[o + 1]) * mix;
		data[o + 2] += (col[2] - data[o + 2]) * mix;
	};
	// What v is painted at one place. The lawn's ramp is straight in green, so the green byte that is
	// already in the buffer says what light the blade has to stand in.
	const vAt = (x, y) => {
		const o = (((y | 0) % size) * size + ((x | 0) % size)) * 4;
		return Math.min(1, Math.max(0, (data[o + 1] - 86) / 68));
	};
	// Crowns go on a jittered grid and not on plain salt: thrown at random they clump and leave smooth
	// ground between the clumps, which is the one thing a crowd may not do. One crown to a cell, tossed
	// about inside it, covers the tile evenly at any count.
	const here = Math.max(80, Math.round(crowns * step * step));
	const cells = Math.max(2, Math.round(Math.sqrt(here)));
	const cell = size / cells;
	for (let gy = 0; gy < cells; gy++) {
	for (let gx = 0; gx < cells; gx++) {
		const cx = ((gx + rand()) * cell) % size;
		const cy = ((gy + rand()) * cell) % size;
		// The crown's own light: the ground it is standing on, moved by as much as a quarter of the ramp,
		// so a crown is a handful of one tone and not twelve separate coin tosses.
		const base = Math.min(1, Math.max(0, vAt(cx, cy) + (rand() - 0.5) * crownSpread));
		const lean = (at(lay, cx, cy) - 0.5) * 2.4;
		const count = Math.max(4, Math.round(perCrown * (0.6 + rand())));
		for (let b = 0; b < count; b++) {
			let x = cx + (rand() - 0.5) * 5 * step;
			let y = cy + (rand() - 0.5) * 5 * step;
			let ang = lean + (rand() - 0.5) * 2.2;
			const long = (6 + rand() * 8) * step;
			const steps = Math.max(4, Math.round(long));
			const curl = (rand() - 0.5) * 0.12;
			const wide = rand() > 0.68; // some leaves are two texels of leaf and not one
			const v = Math.min(1, Math.max(0, base + (rand() - 0.5) * spread + lift));
			const straw = rand() > 0.986; // a dead straw, because a mown lawn always has some
			const root = straw ? [92, 80, 48] : ramp(Math.max(0, v - shadeDepth));
			const body = straw ? [126, 118, 76] : ramp(v);
			const tip = straw ? [148, 139, 94] : ramp(Math.min(1, v + 0.18));
			for (let s = 0; s < steps; s++) {
				ang += curl;
				x += Math.cos(ang) * step;
				y += Math.sin(ang) * step;
				// Its own shadow first, a hair right and below: the depth of the sward, and the height the
				// bump map is made from. Then the leaf, its top third catching the sky.
				put(x + 1.2 * step, y + 1.5 * step, root, shadeInk);
				const col = s > steps * 0.6 ? tip : body;
				put(x, y, col, ink);
				if (wide) put(x, y + step, col, ink * 0.7);
			}
		}
	}
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * Lawn. One tile is about six metres across, so everything in it is sized to still be there when
 * you are twenty metres off: mown bands a metre wide, bare soil a metre and a half across, broad
 * tonal patches of three metres, and blades only for when you stand on it. The old pattern was all
 * speckle and no scale — 32 cells of green across nine metres, which the engine averaged into one
 * flat green sheet, and a garden that reads as one flat colour reads as nothing at all.
 *
 * The second fault was the opposite of the first, and was found by looking: measured twenty metres
 * off, a 60 x 60 patch of this lawn ran from L43 to L228, with the brightest pixels of it at
 * (233,247,78) — at the ceiling of the picture, where the tone curve has taken the colour out of
 * them. So close to a sunlit lawn the eye sees no grass at all, only a glowing pale sheet with
 * black speckles in it, which is a fair thing to call translucent. Three things were wrong: the
 * fine field was washed on at 0.42 across a 94-point range (19 cm blobs, about two pixels at twenty
 * metres: shimmer, not pattern); nothing was painted at the half-metre scale a person steps over;
 * and the pattern's own top end started at (180,196,84), which leaves the sun nowhere to go.
 * So now: clumps at half a metre, a fine field kept narrow and weak, and a top end stopped at
 * about (150,168,84) with more blue in the whole of it, so the green is grass and not highlighter.
 *
 * The third fault was the opposite again, and it only shows when you are standing ON the lawn: the
 * wash and the fields above are soft at every size, so a person at eye height looking down at grass
 * two metres off saw softness — a printed sheet, and not one blade (`pictures/s48-grass.png`, and the
 * tile itself in `pictures/s48-tile-grass-3x.png`: soft blobs and nothing crisp, the same fault the
 * far rank of the belt was caught with). Two layers fix it, and the tile is painted at 1024 for their
 * sake, where a texel is six millimetres of ground: `swardCrowd`, the crowd of separate blades a person
 * two to five metres off is actually shown, and `swardGrain`, the flock of lit tips between them.
 */
export function grassCanvas(size = 1024, { seed = 5, crowns = 16000, perCrown = 11 } = {}) {
	const canvas = canvasOfSize(size);
	const broad = noiseField(size, 4, 2, 11);
	// The clumps a person could step over: thick grass here, thin and strawy there, half a metre
	// across — the scale that was missing, and the one a lawn is actually read at outdoors.
	const clump = noiseField(size, 9, 2, 97);
	const thin = noiseField(size, 5, 3, 71);
	const fine = noiseField(size, 26, 2, 23);
	// Which way the blades lie. A mower lays a sward down in families, and a real lawn points in half
	// a dozen directions across a garden; one shear across the whole tile is a comb and not a crowd.
	const layField = noiseField(size, 6, 2, 611);
	// v near 0 -> deep shade green, v near 1 -> sunlit yellow-green. The blue is lifted through the
	// whole of it: a lawn ten metres away has sky in it, and a green with no blue in it is a paint chart.
	paintField(canvas, broad, (v) => [44 + v * 58, 86 + v * 68, 46 + v * 34]);
	mownBands(canvas, 6, 0.16);
	// Thick sward keeps its shade; thin sward shows the pale roots and goes strawy at the same time.
	mixByField(canvas, clump, [46, 88, 54], [150, 158, 88], 0.34);
	// The grass itself, kept narrow: wide and strong here it is only static at a distance.
	wash(canvas, fine, [56, 94, 46], [136, 160, 78], 0.24);
	// Where the grass is thin the soil comes through: red-brown laterite, the ground under a Thai lawn.
	// This used to be a spill. At 0.6-0.8 of the field and 0.86 strength the bare places took a fifth of
	// the lawn, and the sun lifted the colour to (193,133,42) — a glowing rust the eye reads as a stain
	// and not as earth (`pictures/1014-grass.png`, read at those patches with `tools/pixels.js --at`).
	// The ramp now starts high up the field, so bare ground is a rarity and not a pattern; the colour is
	// a third darker and stands more red than orange; and it lies at two-thirds, so the thin sward still
	// shows through the thin place it is under.
	barePatch(canvas, thin, 0.72, 0.94, [92, 62, 40], 0.66);
	// and a little grit in the bare places, so dirt is not one flat brown
	barePatch(canvas, fine, 0.78, 0.96, [118, 94, 66], 0.24);
	// The grain of the sward goes over all of it: the tips of the blades, half of them catching the
	// sun. Kept weak on purpose now — it is the tooth between the blades, and the crowd below is the
	// shape. At 0.46 it combed the whole tile in one direction and read as brushed velvet.
	swardGrain(canvas, { length: 9, shear: 0.55, second: 3, depth: 0.26, seed: 77 });

	// ---- the sward: the crowd itself -----------------------------------------
	//
	// The last layer and the biggest: about a hundred and eighty thousand separate blades, in crowns of a
	// dozen, each with its own shadow under it. See `swardCrowd` for why the strokes this replaces could
	// not do the work. The ramp is the lawn's own, the same bytes `paintField` laid down at the top of this
	// function: the crowd is a shape change and not a colour one, and it is paid for out of that
	// same average and measured to stay there.
	swardCrowd(canvas, {
		crowns,
		perCrown,
		seed,
		lay: layField,
		ramp: (v) => [44 + v * 58, 86 + v * 68, 46 + v * 34],
	});
	return canvas;
}

/**
 * A clump of grass standing up out of the ground, painted on a clear square so that a plane cut by
 * its own alpha is a tuft and not a board.
 *
 * The lawn's own pattern (`grassCanvas`) is a carpet read from a few metres off: every stroke in it
 * is a five-pixel fleck lying flat, which is right across the garden and wrong at a visitor's feet,
 * where grass is a crowd of narrow leaves arcing out of one crown. These are those leaves, and they
 * are the only thing in the Villa that stands *up* out of the ground rather than being painted on it.
 *
 * The bottom edge of the square is the ground: nothing is painted below it, so the plane it is cut on
 * can be set straight down on the lawn and its foot is in the grass instead of hovering over it.
 *
 * WHY IT HAS BEEN WRITTEN THREE TIMES. The first tile was thirty-four canvas strokes spread evenly
 * along the bottom edge, each a bright spike with a black collar: photographed at two metres a clump
 * was a handful of sweetcorn seedlings (`pictures/s56-fringe-before.png`). The second tile — three
 * hundred filled leaves gathered on one crown in the middle of the square — was better paint and the
 * same plant. Photographed at three metres (`pictures/s57-clump-maize.png`) it was still MAIZE:
 * a dozen strap leaves standing straight up out of one point, each a quarter of the clump across, each
 * with a pale stripe down its own middle, and the paving visible straight through between them. Six
 * sessions of these notes have the same three words for it: "a little maize plant". Both tiles failed
 * the same way, which is that a clump is not a sprinkling of leaves at all. A clump is a MASS with a
 * SHAPE, and the shape is a dome:
 *
 *   dense. Eight hundred blades to the square instead of three hundred, and narrow — a hundredth of
 *     the tile across, which is 4 mm at a 40 cm clump — so that from three metres off the eye gets a
 *     crowd and not a count. The square is 56.5% air (`tools/canvassave.js`) where the maize tile was
 *     72.4%, and what shows through the gaps left is the shade inside the clump and not the scene
 *     behind it.
 *   a DOME and not a fan. A leaf's height is asked for the one thing that decides it — how far its own
 *     foot stands off the crown's middle. The leaves at the edge are short and thrown out; the leaves
 *     in the middle are tall and nearly up. That is the whole difference between a fountain and a sheaf
 *     of cut corn.
 *   an outline that wanders. Two waves across the crown at random phase and random size, so there is a
 *     plume where a shoulder of leaves all grew tall and a hollow where they did not. Without them
 *     every clump is a smooth dome, and a smooth dark dome six metres off is a cabbage: this is the
 *     fault the second tile was left holding, and it took a browser picture to see it
 *     (`pictures/s57-verge-maize.png`).
 *   feet over a patch and not a point. The feet are scattered across half the width of the square,
 *     because a clump is a crown two handspans across in the soil and not a bouquet tied at one stem.
 *   no pale stripe down the middle. Every leaf is one colour with its TOP third a step lighter, because
 *     that is where the sun gets it. A pale midrib is a maize leaf; a lit tip is a clump.
 *   the leaves arc over and hang. A leaf's own weight is why its tip comes back down under its own
 *     peak; leaves that only ever go up are cut grass in a vase.
 *   dark low down where the leaves shut one another out of the sun, and it is the lawn's own darkest
 *     green, not black: a clump with a soot foot is a plant in a pot sitting on a mat.
 *
 * THE RAMP IS THE LAWN'S, MOVED. `grassCanvas` lays its tile with [44+v*58, 86+v*68, 46+v*34]; this
 * one is [74+v*50, 130+v*62, 52+v*24] — richer in red at the foot, poorer at the top, and bluer
 * throughout. A clump is a vertical thing: it sees less of the sky's fill and none of the bounce off
 * the ground, the sun rakes its sides instead of lighting them square, and eight hundred leaves shade
 * one another. What the ramp is worth is not settled here but on the screen: on the `grass` camera,
 * where the clumps are 2.4% of the frame over a lawn at 102,129,38, Chromium paints them at
 * 89,119,26 — ten points of light poorer, which is a self-shaded mass, and not the twenty-four it was
 * when the tile was a sooty one. Two thirds of that payment is the top light below and about a third
 * is this material's own lamp: see `mats.tuft` in src/materials.js.
 *
 * One repeat covers one clump. About one leaf in sixteen has died and is straw: the lawn's own straw,
 * warm and grey, duller and SMALLER than the living leaf it lies among, because a broad tan blade
 * among green ones is a dead maize leaf and not a garden.
 */
/**
 * How a clump of one age is painted. `spread` is how far the feet scatter off the crown's middle,
 * `tall` how high the tallest leaf stands, `splay` how far the outer leaves are thrown out, `straw`
 * how many more leaves have died, `stray` how many grew too fast and stand over their neighbours, and
 * `blades` how crowded the crown is. Four of them, because one clump painted once and copied nine
 * hundred times is a plantation, which is the fault these four exist to kill: see `tuftAtlas` below.
 */
export const tuftShapes = [
	{ name: "young", spread: 0.28, tall: 1.15, splay: 0.5, straw: 0.8, stray: 0.06, blades: 0.86 },
	{ name: "middle", spread: 0.52, tall: 1, splay: 1, straw: 1, stray: 0.11, blades: 1 },
	{ name: "old", spread: 0.66, tall: 0.8, splay: 1.3, straw: 1.2, stray: 0.16, blades: 1.05 },
	{ name: "straggly", spread: 0.58, tall: 0.9, splay: 1.15, straw: 2.3, stray: 0.2, blades: 0.8 },
];

/**
 * One clump, painted on its own clear square. This is the body of `tuftCanvas` and of every cell of
 * `tuftAtlasCanvas`: it is kept apart so that the atlas can have four clumps of four ages at four
 * seeds without the weather of one running into its neighbour — the foot wash in particular is laid
 * `source-atop`, which paints the leaves of whatever is already down, and it must not find the
 * leaves of the clump next door already down.
 *
 * Everything is drawn for a square of 256 and scaled (`at`), so the numbers in the body are
 * millimetres of grass and not texels of an atlas somebody may one day make another size.
 */
function clumpCanvas(size, { blades = 116, seed = 331, shape = tuftShapes[1] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const at = (n) => (n * size) / 256;
	// A living leaf: a deep grass green at the foot and a lit one at the tip, and neither of them lime.
	const green = (v) => [50 + v * 54, 106 + v * 76, 36 + v * 26];
	// Dead grass: the straw the lawn's thin places show, kept warm, grey and SMALL, since a broad tan
	// blade among green ones is a dead maize leaf and not a garden.
	const straw = (v) => [92 + v * 26, 86 + v * 24, 50 + v * 16];
	const ink = (c) => `rgb(${Math.round(Math.min(255, c[0]))},${Math.round(Math.min(255, c[1]))},${Math.round(Math.min(255, c[2]))})`;
	const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
	const dim = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
	const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

	/**
	 * One leaf, drawn as a WALK. `steps` equal strides are taken out of the crown's foot, each turned a
	 * little further than the last: `bend` is the whole turn over the leaf's length in radians, so a leaf
	 * that turns nothing stands straight up and a leaf that turns two radians arcs right over and hangs
	 * its tip below its own peak — which is what a long leaf does under its own weight, and the one thing
	 * that most makes a clump a plant and not a sheaf of cut corn. `climb` is how far above the ground
	 * line the leaf's highest point is asked to come: the walk is trimmed to that height, and the leaf is
	 * shortened rather than squashed if it would otherwise walk out of the square. `wide` is its width at
	 * its widest, a quarter of the way up; it is narrow at the foot and a point at the end.
	 */
	function blade({ foot, bend, climb, wide, v, dry, shade }) {
		const steps = 11;
		const start = -Math.PI / 2 + bend * 0.16; // it leaves the crown already leaning its way
		const stride = (climb / steps) * 1.2; // over-strided, then trimmed to the true height below
		const spine = [[foot, size]]; // the ground line: the square's bottom edge, and nothing below it
		let x = foot;
		let y = size;
		for (let i = 0; i < steps; i++) {
			const ang = start + (bend * (i + 0.5)) / steps;
			x += Math.cos(ang) * stride;
			y += Math.sin(ang) * stride;
			spine.push([x, y]);
		}
		const high = size - Math.min(...spine.map((p) => p[1]));
		const reach = Math.max(...spine.map((p) => Math.abs(p[0] - foot)));
		const room = Math.max(at(3), bend >= 0 ? size * 0.985 - foot : foot - size * 0.015);
		const k = Math.min(climb / (high || 1), room / (reach || 1), (size * 0.94) / (high || 1));
		for (let i = 1; i <= steps; i++) {
			spine[i] = [foot + (spine[i][0] - foot) * k, size + (spine[i][1] - size) * k];
		}
		const left = [];
		const right = [];
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const here = spine[i];
			const before = spine[Math.max(0, i - 1)];
			const after = spine[Math.min(steps, i + 1)];
			const dx = after[0] - before[0];
			const dy = after[1] - before[1];
			const len = Math.hypot(dx, dy) || 1;
			// Narrow at the foot, fullest a quarter of the way up, and then away to a point: a leaf of
			// even width from foot to tip is a ribbon and a clump of ribbons is a paper flower.
			const half = (wide / 2) * (0.42 + 0.58 * Math.min(1, t * 4)) * Math.pow(1 - t, 0.7);
			const nx = (-dy / len) * half;
			const ny = (dx / len) * half;
			left.push([here[0] + nx, here[1] + ny]);
			right.push([here[0] - nx, here[1] - ny]);
		}
		const lit = dry ? straw(1) : green(1);
		const body = dim(dry ? straw(v) : green(v), shade);
		const band = (listA, listB, colour) => {
			ctx.fillStyle = ink(colour);
			ctx.beginPath();
			ctx.moveTo(listA[0][0], listA[0][1]);
			for (const p of listA) ctx.lineTo(p[0], p[1]);
			for (let i = listB.length - 1; i >= 0; i--) ctx.lineTo(listB[i][0], listB[i][1]);
			ctx.closePath();
			ctx.fill();
		};
		band(left, right, body);
		// The sun gets the top of the leaf and nothing else: the same leaf above its own lower two-fifths,
		// a step up the ramp. On a leaf that has bent over this lights the part that hangs, which is
		// right — it is the part lying out in the open. A pale stripe down the whole leaf is a midrib,
		// and a midrib is the thing that made the second tile maize.
		const cut = Math.round(steps * 0.42);
		band(left.slice(cut), right.slice(cut), mix(body, lit, 0.3));
	}

	// ---- the crown, and the leaves out of it ---------------------------------
	// Three layers, back to front, and the first one is the reason a clump has any inside. A clump is not
	// a sprinkling of leaves over a gap: what shows between the leaves is the SHADE inside the plant, so
	// the back layer is a crowd of short leaves painted at little more than half their own light, packed
	// into the middle of the crown. Over that the body of the plant, and in front the few longest,
	// brightest leaves — the ones that grew at the sun and bent over — which are what break the outline.
	// `spread` is how far, as a fraction of the square's width, the feet are scattered off its middle:
	// feet on a point is a bouquet, feet over a patch is a crown.
	const layers = [
		{ share: 0.36, spread: 0.3, tall: 0.52, vFrom: 0.0, vMore: 0.3, shade: 0.55, straw: 0.07, bendFrom: 0.2, bendTo: 0.8 },
		{ share: 0.42, spread: 0.5, tall: 0.84, vFrom: 0.14, vMore: 0.5, shade: 0.85, straw: 0.06, bendFrom: 0.5, bendTo: 1.4 },
		{ share: 0.22, spread: 0.44, tall: 1.0, vFrom: 0.45, vMore: 0.55, shade: 1.0, straw: 0.04, bendFrom: 0.9, bendTo: 2.1 },
	];
	for (const layer of layers) {
		const spread = layer.spread * shape.spread;
		// A clump's own outline. Two waves across the crown, at random phase and random size, so the
		// silhouette wanders: a plume here where a shoulder of leaves all grew tall, a hollow there where
		// they did not. Without this the outline of every clump is a smooth dome, and a smooth dark dome
		// six metres off is a cabbage.
		const crestA = 0.1 + rand() * 0.13;
		const phaseA = rand() * 6.283;
		const cyclesA = 0.8 + rand() * 1.6;
		const crestB = 0.06 + rand() * 0.1;
		const phaseB = rand() * 6.283;
		const cyclesB = 2.5 + rand() * 4.5;
		for (let i = 0; i < Math.round(blades * layer.share * shape.blades); i++) {
			const off = (rand() + rand() - 1) * spread; // -spread..spread across the square
			const foot = size * (0.5 + off);
			// How far this leaf stands off the crown's middle, 0 to 1. THE MOUND IS THIS NUMBER: the
			// leaves at the edge are short and thrown out, the leaves in the middle are tall and nearly
			// up, and a clump whose height does not care where its foot is has no shape at all.
			const edge = Math.min(1, Math.abs(off) / (spread || 1));
			// Which way this leaf grew away from the middle: -1 at the crown's west edge, 0 in its
			// middle, 1 at its east edge.
			const lean = off / (spread || 1);
			// A clump is not a cushion: one leaf in nine is a stray that got at the sun and stands a hand
			// over its neighbours, and it is those few that make the top ragged.
			const stray = rand() < shape.stray ? 1.25 : 1;
			const wander =
				1 + crestA * Math.sin(phaseA + lean * cyclesA * 6.283) + crestB * Math.sin(phaseB + lean * cyclesB * 6.283);
			const tall = layer.tall * shape.tall * (1 - 0.4 * Math.pow(edge, 1.25)) * (0.6 + rand() * 0.42) * stray * wander;
			const climb = Math.max(size * 0.05, size * tall * 0.9);
			// Which way the leaf bends: outward for the leaves that grew at the crown's edge, either way
			// for the ones in its middle, and one in five flops back across its own neighbours so the
			// mass has no obvious grain to it.
			let sign = Math.abs(lean) < 0.35 ? (rand() < 0.5 ? -1 : 1) : Math.sign(lean);
			if (rand() < 0.4) sign = -sign;
			const bend =
				sign * (layer.bendFrom + rand() * (layer.bendTo - layer.bendFrom)) * (0.5 + 0.5 * edge) * shape.splay;
			// Dark low down and bright up top, and a leaf's own say in the matter on top of that.
			const v = clamp(layer.vFrom + Math.pow(rand(), 0.9) * layer.vMore + (wander - 1) * 0.25, 0, 1);
			const dry = rand() < layer.straw * shape.straw;
			blade({
				foot,
				bend,
				climb,
				wide: at(2.2 + rand() * 2.6) * (dry ? 0.7 : 1),
				v,
				dry,
				shade: layer.shade,
			});
		}
	}

	// ---- the foot of the clump ----------------------------------------------
	// Where the leaves pass out of the crown they are in each other's shade. The first tile painted
	// this as thirty near-black stubs and a clump sat on the lawn with a soot stain under it; this is
	// the same shade done as a wash over the bottom of the leaves, in the lawn's own darkest green and
	// no darker, laid with `source-atop` so it paints the leaves and not the air round them.
	const footShade = ctx.createLinearGradient(0, size, 0, size * 0.8);
	footShade.addColorStop(0, "rgba(20,44,22,0.26)");
	footShade.addColorStop(1, "rgba(20,44,22,0)");
	ctx.globalCompositeOperation = "source-atop";
	ctx.fillStyle = footShade;
	ctx.fillRect(0, size * 0.8, size, size * 0.2);
	// and a little light on the crown of the clump, the same way round: this is the sun on the tops of
	// the leaves, and it is what stops a clump reading as one flat dark shape. It is kept small because
	// a clump paler than the grass about it looks like a plant in a pot, and because the lamp in
	// `mats.tuft` pays for the same light a second time.
	const tipLight = ctx.createLinearGradient(0, size * 0.06, 0, size * 0.6);
	tipLight.addColorStop(0, "rgba(168,200,110,0.13)");
	tipLight.addColorStop(1, "rgba(168,200,110,0)");
	ctx.fillStyle = tipLight;
	ctx.fillRect(0, 0, size, size * 0.6);
	// ---- the borders of the square ------------------------------------------
	// And the alpha is eased off over the outer two per cent, on all four sides. A leaf that happens to
	// touch the border otherwise leaves ink right up to the edge of its cell, and a coarse mip level of
	// a square inked to its own border is a bar with a ruled top: which is the flat green slug the
	// seventy-fourth session found along every border in the garden. Two per cent is a little over one
	// texel of the atlas, so nothing a person could see is lost; what is lost is the straight line.
	const margin = Math.max(2, size * 0.02);
	ctx.globalCompositeOperation = "destination-out";
	const eaten = (x0, y0, x1, y1) => {
		const g = ctx.createLinearGradient(x0, y0, x1, y1);
		g.addColorStop(0, "rgba(0,0,0,0.9)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		return g;
	};
	ctx.fillStyle = eaten(0, 0, 0, margin);
	ctx.fillRect(0, 0, size, margin);
	ctx.fillStyle = eaten(0, size, 0, size - margin);
	ctx.fillRect(0, size - margin, size, margin);
	ctx.fillStyle = eaten(0, 0, margin, 0);
	ctx.fillRect(0, 0, margin, size);
	ctx.fillStyle = eaten(size, 0, size - margin, 0);
	ctx.fillRect(size - margin, 0, margin, size);
	ctx.globalCompositeOperation = "source-over";
	return canvas;
}

/** One clump on one square: what `tools/canvassave.js` paints and what the CPU drawing copies. */
export function tuftCanvas(size = 256, { blades = 430, seed = 331 } = {}) {
	return clumpCanvas(size, { blades, seed, shape: tuftShapes[1] });
}

/**
 * The skin every clump in the garden is cut from: `cols` by `cols` separate clumps, each of one age
 * and each drawn at its own seed, and a sheet is inked with exactly ONE of them.
 *
 * WHY. Every clump in the Villa used to wear the same painted square, and a browser six metres off
 * laid the garden out as nine hundred copies of one dome — the same silhouette, the same raggedness
 * in the same place, the same three dead leaves: see `pictures/s57-verge-maize.png`, which
 * is the fault plainly. The same trick settled the same fault in the jungle belt (`canopyAtlas`): one
 * skin of separate clumps, one clump to a sheet, and the shape a visitor sees wanders because the
 * clumps are four ages of plant and not one plant nine hundred times.
 *
 * The layout lives here so the painter, `makeTufts` in `src/garden.js` and `tools/draw.js` cannot
 * disagree about which cell is which.
 */
export const tuftAtlas = { size: 512, cols: 2 };

export function tuftAtlasCanvas(size = tuftAtlas.size, { cols = tuftAtlas.cols, blades = 430, seed = 331 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const cell = size / cols;
	for (let i = 0; i < cols * cols; i++) {
		const shape = tuftShapes[i % tuftShapes.length];
		const clump = clumpCanvas(cell, { blades, seed: seed + i * 977, shape });
		ctx.drawImage(clump, (i % cols) * cell, Math.floor(i / cols) * cell);
	}
	// Padded, like the shrub's skin, so that a mip level of this canvas never averages a leaf with black
	// air. It was measured worth nothing for a long while — "on the west lawn at thirty-six metres the clumps
	// moved from 93,110,42 to 94,110,42, one point of red" — and it was worth nothing because the padding
	// could not work until the air had some alpha to keep its colour in; see `padAtlas`. Measured again after
	// that was put right, the same clumps come back (100,129,31) against (97,126,31): three points of green on
	// a clump standing five and a half metres off, which is not much, but it is three points the leaf was
	// owed, and an atlas with black air is a trap for whichever surface is cut out of it next.
	return padAtlas(canvas);
}

/**
 * Poolside paving: sawn limestone pavers laid in courses, every slab its own stone.
 *
 * Cut stone, not asphalt. The first version of this pattern was a grey stone (150,141,126) with a grain
 * wash whose dark end was (96,90,80), and a browser laid the deck out at mean (133,113,87) L115 with its
 * brightest 40-pixel block at L131 while the coping beside it stood at L206 — ninety-one points darker
 * than its own kerb, so the largest surface in `path` and `west` read as dirty asphalt and the pit of
 * the grain read as tar (`pictures/tmp-deckcrop.png`, cut from `pictures/1232-path.png`). Limestone
 * sawn for a poolside is pale and warm, and what weathers it is a dust film and damp, which
 * `src/paving.js` already lays over the whole deck at a bigger scale than this tile.
 *
 * So the stone is pale and warm and the joint is a sand and not a black line. A slab's own middle tone is
 * (168,155,131), which is what the tile has to be to come out at the mean the old one was measured at,
 * (165,153,131): the joint, the grit and the dark end of the grain eat the difference between the two.
 * The joint used to be `#7b705c`, and once the washes, the paving tone and the bump had done with it it
 * came out of Chromium at (45,46,33) L46 against the slab beside it at L147 — 0.31 of its own stone,
 * twelve pixels wide in the near foreground of `pictures/705-path.png`. A sawn black grid is the one
 * thing laid stone never is. What variation is left between one 40-pixel block of the sunlit deck and
 * the next is measured, not hoped for: see the note by `paver` in `src/materials.js`.
 *
 * WHY THIS WAS PAINTED AGAIN. The pattern above was four equal squares to a repeat and two soft washes,
 * and `tools/canvasstats.js` says what that came to: `paverCanvas @512 mean 165,153,131 std 4,4,3`. Four
 * points of standard deviation in a whole painted stone is not a stone: it is a flat mid tone with a
 * smudge on it, and a browser showed the deck as exactly that — a pale sheet scored by a grid, every slab
 * the twin of every other, the joints line upon line and the whole court printed three times over inside
 * one view (`pictures/s88-paver-before.png`, four tiles of the old pattern, and the near foreground of
 * `pictures/s88-deck-before-c.png`, cut out of `pictures/2895-path.png`). Cut stone is not like that. So:
 * Before and after, side by side: `pictures/s88-paver-after.png`, `pictures/s88-deck-after-c.png`.
 *
 *   Courses, not a grid. Eight modules across the pattern — a module is 39 cm of the Villa's 3.1 m tile,
 *   which is a sawn paver off the shelf — laid in four courses of unequal height, whose slabs are
 *   squares and rectangles of different widths and whose cross-joints are staggered. A paving plan does
 *   repeat (courses do); what no paving plan does is repeat in both directions at once.
 *
 *   Every slab its own stone. Each one gets a tone of its own (about a tenth either way), a lean warm or
 *   grey, two to four veins along the bed it came off the quarry in, a scatter of grit, a bright worn
 *   arris at its edges and, now and then, a chipped corner.
 *
 *   A joint that wanders. Each of a slab's four sides is set in by its own amount, so the joint is a
 *   millimetre wide here and wide there, and a bite is out of some edges.
 *
 *   Grain multiplied and not mixed. See `multiplyByField`: three fields at the size of a slab, a few
 *   centimetres and a centimetre, laid over everything (sand in a joint is grainy too) by multiplication.
 *
 * The same canvas is the deck's bump, and the two want opposite things: a tone map wants every slab a
 * different light and a height map wants every slab the same height. `relief: true` paints the second
 * one — the joints and the arris and the grit stay, the slab-to-slab tone and the veins go, so no slab
 * stands a centimetre out of the deck because it happens to be a pale stone.
 */
export function paverCanvas(size = 1024, { joint = "#8c8069", relief = false } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(17);
	// The module every slab is measured in. Eight across the pattern, and the Villa lays 3.1 m of stone
	// to a repeat (see `pavingTileMetres` in src/world.js), so a module is 39 cm.
	const module = size / 8;
	// The joint: ten millimetres of sand between two sawn edges.
	const gap = size * 0.0033;

	ctx.fillStyle = joint;
	ctx.fillRect(0, 0, size, size);

	// The courses. `height` and `widths` are in modules, halves allowed: the heights add to eight and so
	// does every row of widths, because the pattern has to tile and a course that came to seven modules
	// would print a seam across the whole deck. `start` is where the first slab of a course begins, in
	// modules, and no two courses share one — a staggered cross-joint is what a paving plan looks like and
	// a joint that runs true both ways is what a printed grid looks like. No slab is under half a metre
	// either way: the first pass at this had a course of nineteen-centimetre strips, and a strip course
	// reads as a soldier course of setts, not as the big sawn stone a pool deck is laid in.
	const courses = [
		{ height: 2.5, start: 0, widths: [2.5, 3, 2.5] },
		{ height: 1.5, start: 1.25, widths: [3, 2, 3] },
		{ height: 2, start: 2.75, widths: [2, 3.5, 2.5] },
		{ height: 2, start: 0.5, widths: [3.5, 2, 2.5] },
	];

	/** One slab, painted where it stands, in pixels of ground. */
	function paintSlab(x0, y0, w0, h0) {
		// A trowel does not lay a joint of one width, so every side is set in by its own hand.
		const inL = gap * (0.75 + rand() * 0.6);
		const inR = gap * (0.75 + rand() * 0.6);
		const inT = gap * (0.75 + rand() * 0.6);
		const inB = gap * (0.75 + rand() * 0.6);
		const x = x0 + inL;
		const y = y0 + inT;
		const w = w0 - inL - inR;
		const h = h0 - inT - inB;
		if (w <= 1 || h <= 1) return;

		// Every slab its own stone: some a tenth darker than their neighbour, and a lean that is mostly
		// warm, because limestone weathering warm is what a deck in the sun does. The relief is asked to
		// leave all of that alone.
		const tone = relief ? 1 : 1 + (rand() * 2 - 1) * 0.085;
		const lean = relief ? 0 : rand() * 1.5 - 0.5;
		ctx.fillStyle = `rgb(${Math.round(168 * tone + lean * 7)},${Math.round(155 * tone + lean * 2)},${Math.round(131 * tone - lean * 9)})`;
		ctx.fillRect(x, y, w, h);

		ctx.save();
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.clip();

		// The bed in the stone. Limestone comes off the quarry with a drift in it, two or four pale and
		// dark lines along the bed, and a slab with no drift in it is a sheet of plaster. Each course of
		// lines takes the slab's own lean to it, so two slabs side by side never draw the same vein.
		if (!relief) {
			const drift = (rand() * 2 - 1) * 0.4;
			const veins = 2 + Math.floor(rand() * 3);
			for (let i = 0; i < veins; i++) {
				const t = (i + 0.2 + rand() * 0.6) / veins;
				const pale = rand() < 0.45;
				const a = (pale ? 0.11 : 0.09) * (0.5 + rand());
				ctx.strokeStyle = pale ? `rgba(240,231,209,${a})` : `rgba(112,100,80,${a})`;
				ctx.lineWidth = 1 + rand() * 2.6;
				ctx.beginPath();
				ctx.moveTo(x, y + h * t);
				ctx.quadraticCurveTo(
					x + w * 0.5,
					y + h * (t + drift * 0.5 + (rand() - 0.5) * 0.25),
					x + w,
					y + h * (t + drift)
				);
				ctx.stroke();
			}
		}

		// Grit: a sawn face is a thousand little fractures, some catching the sun and most not.
		const specks = Math.min(300, Math.round((w * h) / 320));
		for (let i = 0; i < specks; i++) {
			ctx.fillStyle = rand() < 0.55 ? "rgba(96,86,68,0.16)" : "rgba(241,233,213,0.16)";
			const s = 1 + rand() * 1.8;
			ctx.fillRect(x + rand() * w, y + rand() * h, s, s);
		}

		// The arris. A sawn edge is walked and hosed before the face of the slab is, and goes bright first.
		ctx.strokeStyle = relief ? "rgba(255,255,255,0.16)" : "rgba(255,247,230,0.10)";
		ctx.lineWidth = Math.max(1.4, gap * 0.55);
		ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
		ctx.restore();

		// And a bite out of an edge now and then, half in the slab and half in the joint, which is where a
		// sawn edge actually fails.
		if (rand() < 0.3) {
			const along = rand();
			const flat = rand() < 0.5;
			const cx = flat ? x + w * along : rand() < 0.5 ? x : x + w;
			const cy = flat ? (rand() < 0.5 ? y : y + h) : y + h * along;
			const r = gap * (1.1 + rand() * 1.5);
			ctx.fillStyle = joint;
			ctx.beginPath();
			ctx.ellipse(cx, cy, r * (0.7 + rand() * 0.8), r * (0.7 + rand() * 0.8), rand() * 3.14, 0, 6.2832);
			ctx.fill();
		}
	}

	let y = 0;
	for (const course of courses) {
		const h = course.height * module;
		let x = course.start * module;
		for (const width of course.widths) {
			const w = width * module;
			// A slab that straddles the seam is painted at both ends of it, or the pattern wraps with a
			// bald line down its edge and the seam is spotted inside one repeat.
			for (const off of [-size, 0, size]) {
				if (x + off < size && x + off + w > 0) paintSlab(x + off, y, w, h);
			}
			x += w;
		}
		y += h;
	}

	// Grain, over everything including the joints, at three sizes: clouds about the size of a slab and a
	// half, a mid grain of a few centimetres and a fine one of a centimetre. Multiplied and not mixed —
	// see `multiplyByField`, and the `std 4` above.
	multiplyByField(canvas, noiseField(size, 6, 2, 71), relief ? 0.07 : 0.2);
	multiplyByField(canvas, noiseField(size, 34, 3, 97), relief ? 0.09 : 0.17);
	multiplyByField(canvas, noiseField(size, 150, 2, 131), relief ? 0.06 : 0.12);
	return canvas;
}

/**
 * Small glossy mosaic tiles for the pool inside, in turquoise tones.
 *
 * THE JOINT, AND WHY IT IS NO LONGER WHITE.
 *
 * The joint used to be `#e4f0ec` — (228,240,236), about as pale as anything in the Villa — laid over tiles
 * that run from (76,150,168) to (120,196,206). That is a net of near-white standing a hundred points of
 * light above the glass it surrounds, and it is the sharpest thing in the pit: at the start camera the eye
 * is 1.94 m above the film and the basin spans five metres, so the far two thirds of the water are seen at
 * a graze and every course of mosaic is squeezed down to two or three pixels. A mip chain and anisotropic
 * filtering do their job there and average each course to one even line — and a hundred points of
 * contrast, three pixels wide, lying dead straight and dead even over half a picture, is GRAPH PAPER
 * (`pictures/s70-pool-grid-before.png`, and the sixty-ninth session's item 1). The surface above it cannot
 * save it either: with the eye that low, NdotV over the whole basin runs only 0.255 to 0.42, so every
 * Fresnel, alpha and film dial on the water is being handed that narrow a range, which is why three
 * sessions of dials moved three points apiece.
 *
 * So the joint is a dull, slightly green grey now, and every course also gets a width of its own (a trowel
 * does not saw by machine) and the whole of one patch — joint and tiles together — rides a slow field,
 * lighter here and heavier there, over three or four courses. That last part is the one that matters at a
 * distance: what made the net read as printed was not the joint but its EVENNESS, and a field of sixteen
 * per cent spread over the repeat means no two courses of the far wall come out the same.
 *
 * `grout` is the joint's bytes and `patch` the half-spread of that field, as a fraction.
 */
export function poolTileCanvas(size = 512, cells = 12, { grout = [162, 174, 180], patch = 0.16 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(29);
	const step = size / cells;
	// One slow field over the whole repeat, seamless, so a patch of darker mosaic cannot end in mid-tile
	// where the pattern wraps.
	const slow = noiseField(size, 2, 2, 61);
	const at = (gx, gy) => slow[Math.round((gy + 0.5) * step) * size + Math.round((gx + 0.5) * step)];
	const shed = (c, f) => Math.max(0, Math.min(255, Math.round(c * f)));
	ctx.fillStyle = `rgb(${grout[0]},${grout[1]},${grout[2]})`;
	ctx.fillRect(0, 0, size, size);
	for (let gy = 0; gy < cells; gy++) {
		for (let gx = 0; gx < cells; gx++) {
			const t = rand();
			const f = 1 + (at(gx, gy) - 0.5) * 2 * patch;
			// The joint first, across the whole cell, so the field above moves the net and the glass together.
			ctx.fillStyle = `rgb(${shed(grout[0], f)},${shed(grout[1], f)},${shed(grout[2], f)})`;
			ctx.fillRect(gx * step, gy * step, step, step);
			// Pool glass is pale: white, cream, and the whole blue end of the palette, and the water above
			// it is what makes it turquoise. It used to be (28+t*40, 128+t*52, 142+t*44) — a dark teal glass —
			// and now that the water is actually see-through a browser showed what that was worth: the pit
			// read (30,88,92) L78 and the pool over it (46,82,82) L74, which is a drained pool, or a green
			// one, and not a villa's swimming pool at half past five. Same ladder as the paving one: the
			// brightness has to come out of the surface, because a multiplier on the water above it is the
			// milk again. These bytes come out (76,150,168) at the dark end and (120,196,206) at the pale.
			//
			// THE GREEN OUT OF IT, measured. With those bytes the water over the floor came out (97,146,149)
			// at the start camera — green and blue level, which is printer's mint and not a pool. The film
			// above already carries the turquoise (`wem` in src/main.js costs 13 to 16 points of that), so the
			// flatness was the floor's doing and not the water's: a floor whose glass sits level between its
			// green and its blue hands that levelness straight through a half-transparent film. The glass is
			// therefore moved eighteen points of blue clear of its green, and the joint with it, so the depth
			// reads as depth and the turquoise is left to the one thing that can shimmer.
			const r = shed(74 + t * 42, f);
			const g = shed(136 + t * 44, f);
			const b = shed(186 + t * 40, f);
			ctx.fillStyle = `rgb(${r},${g},${b})`;
			const gap = 1.2 + rand() * 1.1;
			ctx.fillRect(gx * step + gap, gy * step + gap, step - gap * 2, step - gap * 2);
			// a soft highlight in one corner of each tile, so the water shimmers over them
			const shade = ctx.createLinearGradient(gx * step, gy * step, gx * step + step, gy * step + step);
			shade.addColorStop(0, "rgba(255,255,255,0.20)");
			shade.addColorStop(1, "rgba(0,40,50,0.16)");
			ctx.fillStyle = shade;
			ctx.fillRect(gx * step + gap, gy * step + gap, step - gap * 2, step - gap * 2);
		}
	}
	return canvas;
}

/**
 * Rendered plaster walls: warm sand with fine grain and faint trowel sweeps. Deep enough on purpose:
 * at the old (224,212,190) the south face in full sun came out 253,249,243 in the browser - white, with
 * no trowel and no grain left in it, and 4% of the start view was that white. This still reads bright
 * in the sun and keeps its warmth there.
 *
 * The washes are left alone on purpose, and only the pattern's size was put right (one repeat to 1.2 m
 * of wall, from six metres). Two attempts were made to strengthen the sweeps and both were refused by
 * the numbers: deepening them evenly took two points of colour out of the shaded faces, and deepening
 * them on the red took twenty — the west wall in its own shade went from 61.9% of its frame in colour to
 * 43.8% — because a plaster wall's colour IS its warmth, and a wash that takes more out of red than out
 * of blue is a wash of grey. If the sweeps are ever to be stronger, the way is to lift the bright end,
 * and a shaded wall has no bright end to lift until the sun's own ceiling (faults 1 and 16 in NOTES.md)
 * is moved.
 *
 * `spread` is how far the patches wander from `base`. One is a wall freshly trowelled; a render that
 * stands out in the weather and gets wet and dries again wears a bigger number, which is what the
 * base course of the house asks for.
 */
export function plasterCanvas(size = 512, base = [204, 182, 152], spread = 1) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	const sweeps = noiseField(size, 6, 4, 41);
	const off = (d) => [base[0] + d[0] * spread, base[1] + d[1] * spread, base[2] + d[2] * spread];
	wash(canvas, sweeps, off([-34, -34, -30]), off([22, 20, 14]), 0.5);
	const grain = noiseField(size, 96, 3, 43);
	wash(canvas, grain, off([-26, -26, -26]), off([16, 16, 16]), 0.3);
	return canvas;
}

/**
 * Teak boards, painted. There are THREE woods in the Villa and they are deliberately not the same
 * colour, which is the whole point of this function (the third, the furniture, is painted in
 * `timberCanvas` below).
 *
 * Why. Photographed in Chromium, every timber in the Villa came out one saturated orange: the terrace
 * floor (180,109,51), a front post (219,116,42), a sala post (163,93,30), the sala table (179,111,50),
 * and the start view's furniture (224,143,75). The cause is not the paint but the lamp: the sun here is
 * (1, 0.71, 0.46), so a board whose blue is a third of its red gives back a blue a fifth of its red and
 * every warm timber in the picture lands in the same marmalade. A house whose floor, posts, boards,
 * beams and chairs are all one orange has no tone hierarchy at all — the eye cannot tell what is walked
 * on from what holds the roof up.
 *
 * So the two teaks are the two a joiner would actually buy:
 *
 *   "deck"      the floor. Horizontal, walked on, and weathered: a teak deck left out of doors silvers
 *               over, and src/teak.js lays that silver across it in metres of ground. Its pattern is
 *               laid grey-tan — the blue is where it used to be 50 bytes it is now 77 — because a
 *               multiplier has nothing to work on otherwise: the old pattern's blue was so small that
 *               putting 12 per cent more of it into the weather moved the painted pixel by two points
 *               (measured, and written down in `src/teak.js`).
 *   "structure" the posts, the wall boards, the soffit, the beams and the door. Vertical, planed, and
 *               oiled rather than left to the weather: the darkest of the Villa's timbers and the
 *               greyest-brown of them, so a post stands against its own floor instead of matching it.
 *
 * The bytes are measured and not taste. `tools/tint.js` ran a ladder on a live page over the colonnade
 * camera, multiplying one material's own colour channel by channel (a canvas edit and an albedo
 * multiplier are the same lever to the engine, so the ladder could be weighed before anything was
 * painted): teakWall as built came out (163,91,32) with its brightest pixel (232,126,59); at blue x2.4,
 * green x1.25, red x0.7 the same material came out (138,100,58) with its brightest (225,165,104) and
 * its light where it was (L102 to L105) — brown, and not orange. The palettes are those factors, a
 * shade softened, moved back out of light and into bytes the way `paint()` does: the deck's old bytes
 * times [0.95, 1.12, 2.3] in light, the structure's times [0.66, 1.0, 1.7]. Where the pattern is dark
 * — the seam, the grain — the same factors are applied, so the whole sheet moves and the mean moves with
 * it.
 *
 * `grain` says which way the boards lie on the canvas. "cross" lays them across it, which is right for a
 * floor; "up" turns the whole painted sheet a quarter of a way round, which is right for a post — and
 * this is load-bearing, not decoration: a box's face runs the pattern with `v` up the face, so the old
 * square laid boards across a post as well as across a wall and a front post came out a stack of
 * plates, ringed every twenty centimetres (`pictures/tmp-post.png`). With "up", and with
 * `patternUp` on the material (see `src/mesh.js`), every face of every upright shows boards running up
 * it and grain running with them.
 */
const teakWoods = {
	// The deck: weathered teak in late sun reads a pale TAN, which means green well above blue and red
	// only modestly over green. The two things this pattern had to be talked out of are both measured:
	// a neutral-grey board under this sky's fill (0.4, 0.58, 0.88 — green over red) came back OLIVE in
	// the shade (the sala floor read 116,123,58), and a board with its blue as high as its green came
	// back SALMON in the sun (the deck read 200,104,94, and a floor is not a flamingo). So: green high,
	// blue a clear step under green, red on top of both but not by a mile. Each floor then leans this
	// one way or the other in src/teak.js — the open deck keeps the green and silvers, the sala's oiled
	// floor trades it for red.
	deck: { base: [150, 128, 76], dark: [70, 60, 40], light: [212, 190, 140], seam: [42, 32, 22], washLow: [62, 52, 36], washHigh: [198, 172, 112] },
	structure: { base: [118, 92, 72], dark: [55, 44, 30], light: [178, 166, 152], seam: [29, 23, 21], washLow: [52, 40, 31], washHigh: [156, 136, 114] },
};

/** Turns a painted square a quarter of a way round, so a pattern laid across it lies up instead. */
function quarterTurn(canvas) {
	const size = canvas.width;
	const src = context2d(canvas).getImageData(0, 0, size, size).data;
	const out = canvasOfSize(size);
	const ctx = context2d(out);
	const dst = ctx.createImageData(size, size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const from = (y * size + x) * 4;
			const to = (x * size + (size - 1 - y)) * 4;
			dst.data[to] = src[from];
			dst.data[to + 1] = src[from + 1];
			dst.data[to + 2] = src[from + 2];
			dst.data[to + 3] = src[from + 3];
		}
	}
	ctx.putImageData(dst, 0, 0);
	return out;
}

/** Teak boards: planks with long grain and dark gaps between them. See the note above `teakWoods`. */
export function teakCanvas(size = 512, planks = 6, { wood = "deck", grain = "cross" } = {}) {
	const ink = teakWoods[wood];
	if (!ink) throw new Error(`no teak wood called "${wood}"`);
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const step = size / planks;
	const rand = randomGenerator(67);
	for (let p = 0; p < planks; p++) {
		const tone = 0.86 + rand() * 0.3;
		ctx.fillStyle = `rgb(${Math.round(ink.base[0] * tone)},${Math.round(ink.base[1] * tone)},${Math.round(ink.base[2] * tone)})`;
		ctx.fillRect(0, p * step, size, step);
		// long grain: streaks that wander along the plank
		for (let s = 0; s < 26; s++) {
			const y = p * step + rand() * step;
			const dark = rand() > 0.45;
			const c = dark ? ink.dark : ink.light;
			ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.1 + rand() * 0.24})`;
			ctx.lineWidth = 0.6 + rand() * 2.1;
			ctx.beginPath();
			let x = 0;
			let cursor = y;
			ctx.moveTo(x, cursor);
			while (x < size) {
				x += 26 + rand() * 60;
				cursor = y + (rand() - 0.5) * 5;
				ctx.lineTo(x, cursor);
			}
			ctx.stroke();
		}
		const s = ink.seam;
		ctx.fillStyle = `rgba(${s[0]},${s[1]},${s[2]},0.75)`;
		ctx.fillRect(0, p * step, size, 2.4);
	}
	const grainField = noiseField(size, 64, 4, 71);
	wash(canvas, grainField, ink.washLow, ink.washHigh, 0.2);
	return grain === "up" ? quarterTurn(canvas) : canvas;
}

/** Terracotta roof: rows of half-round tiles with the light running down each one. */
export function roofTileCanvas(size = 512, columns = 12, rows = 8) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const cw = size / columns;
	const rh = size / rows;
	const rand = randomGenerator(97);
	ctx.fillStyle = "#6b2a1c";
	ctx.fillRect(0, 0, size, size);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			const x = c * cw;
			const y = r * rh;
			const tone = 0.82 + rand() * 0.36;
			const gradient = ctx.createLinearGradient(x, y, x + cw, y);
			gradient.addColorStop(0, `rgb(${Math.round(96 * tone)},${Math.round(44 * tone)},${Math.round(30 * tone)})`);
			gradient.addColorStop(0.4, `rgb(${Math.round(178 * tone)},${Math.round(86 * tone)},${Math.round(56 * tone)})`);
			gradient.addColorStop(0.75, `rgb(${Math.round(146 * tone)},${Math.round(66 * tone)},${Math.round(42 * tone)})`);
			gradient.addColorStop(1, `rgb(${Math.round(84 * tone)},${Math.round(38 * tone)},${Math.round(26 * tone)})`);
			ctx.fillStyle = gradient;
			ctx.fillRect(x, y, cw - 1, rh - 1.5);
		}
	}
	// the shadow each row throws on the row below it
	for (let r = 0; r < rows; r++) {
		const gradient = ctx.createLinearGradient(0, r * rh, 0, r * rh + rh * 0.36);
		gradient.addColorStop(0, "rgba(30,10,6,0.55)");
		gradient.addColorStop(1, "rgba(30,10,6,0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, r * rh, size, rh * 0.36);
	}
	const weather = noiseField(size, 10, 4, 103);
	wash(canvas, weather, [92, 42, 30], [172, 108, 74], 0.18);
	return canvas;
}

/**
 * Palm trunk: the bark of a coconut palm — weathered grey-tan, ringed with the scars of old
 * leaf bases, and not the chocolate colour the Villa used to wear.
 *
 * `x` runs ROUND the trunk and `y` runs UP it: one repeat of this canvas covers `pattern` metres in
 * `mats.palmBark` (forty-five centimetres as built), so a band drawn across the canvas at a constant
 * `y` is a ring around the tree.
 *
 * The version this replaces laid a band every centimetre and a half, evenly spaced, over a dark
 * chocolate ground, and a browser drew it as a corrugated pipe: the bands were too fine to read at
 * all past four metres — `tools/canvasstats.js` gave the old square a spread of 10 channels with
 * only 5 left after a 16-pixel block average, which is what a mipmap does on its way to the screen
 * — and a trunk turned away from the sun came out at the same lightness as a shaded hedge. Three
 * things are different now:
 *
 *   - **It is GREY.** A coconut trunk is a grey thing, weathered to a pale silvery tan where the sun
 *     gets it; `base` below is the trunk's own mid tone and the broad weather runs sixty points
 *     either side of it, so the mass has light and dark patches in it instead of one brown. The
 *     square now measures 145,135,112 with a spread of 9 channels and, more to the point, 7 of that
 *     spread still there after a 16-pixel block average and 6 after a 32: the old square had 5 and 4.
 *     Measured on the bark where it covers the frame, one camera three metres and a half off a trunk,
 *     the published Villa against this one — `tools/tint.js --url …/releases/v0.55.1/index.html` and
 *     the same tool without it, `--show palmBark`:
 *
 *       the published bark   mean (80, 58, 22) L60   brightest (168,116, 55)
 *       this bark            mean (129,107,71) L109  brightest (232,187,127)
 *
 *     Forty-nine points of light, and the brightest bit of a trunk still short of blown out. That is
 *     the whole of the fault: a trunk turned away from the sun used to sit at the lightness of a
 *     shaded hedge and read as a hole cut in the picture. `pictures/s58-trunk-pair.png` is one trunk
 *     both ways, and `s58-palm-close-old.png` / `s58-palm-close.png` are the whole frames.
 *   - **The scars are six to eleven centimetres apart and not a centimetre and a half.** That is what
 *     a coconut palm's leaf bases are actually spaced at, and it is also the only spacing that
 *     survives a mipmap: the old one needed a visitor within arm's reach before it was visible at
 *     all, and anywhere further off it aliased into the noise that made a trunk read as plastic.
 *   - **A scar is a RIDGE and not a line.** Each one is a thin bowed band of its own tone with a pale
 *     lip above it, where the sun rakes the lip of the old leaf base, and a soft shade under it, and
 *     it bows across the width of the trunk, because no leaf base grows on a ruled line. Between the
 *     scars the bark is SMOOTH, which is what a coconut trunk is mostly made of and what the old
 *     square never had: it was scar all the way down.
 *
 * What is left to do here, if the trunk ever wants more: a coconut's bark is shaggy with fibre in
 * vertical strips, and this only hints at that with the streaks and the dashes.
 */
export function palmBarkCanvas(size = 256) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(111);
	// The trunk's own mid tone: a grey-tan, warm but not brown.
	const base = [150, 136, 114];
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);

	// Which part of the bark has weathered pale and which lies in its own shade. Big patches — a
	// third of the repeat across — because that is the only scale of it that survives being seen
	// from across the lawn.
	const weather = noiseField(size, 3, 3, 113);
	wash(canvas, weather, [base[0] - 58, base[1] - 58, base[2] - 54], [base[0] + 46, base[1] + 46, base[2] + 42], 0.6);

	// The scars of old leaf bases: thin dark rings with a pale lip, at irregular spacing, each one
	// bowing gently across the trunk. Thin, because between them the bark of a coconut palm is smooth
	// — it is the smooth grey between the rings that a trunk is mostly made of.
	let y = rand() * 30;
	while (y < size + 14) {
		const gap = size * (0.1 + rand() * 0.22); // 4.5 to 14 cm apart at the built pattern size
		const ridge = (size / 106) * (1 + rand() * 1.5); // the thickness of the scar itself
		const bow = (size / 64) * (0.5 + rand()); // how far it dips and rises across the trunk
		const phase = rand() * Math.PI * 2;
		const lit = 0.8 + rand() * 0.5; // some scars are faint bark, some are old fibrous base
		const shade = 0.22 + rand() * 0.16;
		const lip = 0.3 + rand() * 0.3;
		const steps = 24;
		const curveAt = (at) => {
			const curve = [];
			for (let s = 0; s <= steps; s++) {
				curve.push([(s / steps) * (size + 40) - 20, at + Math.sin((s / steps) * Math.PI * 2 + phase) * bow]);
			}
			return curve;
		};
		const stroke = (curve, width, colour) => {
			ctx.strokeStyle = colour;
			ctx.lineWidth = width;
			ctx.beginPath();
			for (const [px, py] of curve) ctx.lineTo(px, py);
			ctx.stroke();
		};
		// Drawn twice where the scar straddles the top of the repeat, so the ring is a ring and not a
		// scar sawn in half where one trunk meets the next up the canvas.
		for (const at of y > size - 14 ? [y - size, y] : [y]) {
			const curve = curveAt(at);
			// the shade the ridge throws on the bark below it, the ridge, and the lip that catches the sun
			stroke(curve, ridge * 2.2, `rgba(74,66,54,${shade})`);
			stroke(curve, ridge, `rgb(${Math.round(126 * lit)},${Math.round(114 * lit)},${Math.round(94 * lit)})`);
			ctx.save();
			ctx.translate(0, -ridge * 0.9);
			stroke(curve, Math.max(1, ridge * 0.45), `rgba(236,226,204,${lip})`);
			ctx.restore();
		}
		y += gap;
	}

	// Vertical streaks: weathering running down the trunk, and rot stain under the bark. Faint, and
	// full height, so the repeat cannot show them as a band.
	for (let s = 0; s < 3; s++) {
		const x = rand() * size;
		const w = 3 + rand() * 9;
		const stain = rand() < 0.5 ? [72, 66, 56] : [210, 202, 182];
		ctx.fillStyle = `rgba(${stain[0]},${stain[1]},${stain[2]},0.08)`;
		ctx.fillRect(x, 0, w, size);
	}

	// A green-grey crust of moss and lichen in patches, at the same scale as the weather and no finer,
	// so it reads as a trunk that has stood out in the wet season and not as a green-painted pole.
	const moss = noiseField(size, 6, 2, 121);
	wash(canvas, moss, [96, 108, 78], [196, 196, 168], 0.16);

	// The fibre of it: short dashes along the scars, pale and dark.
	// (The spacing is written as fractions of `size` because this canvas is also painted at 128 for the
	// bump map, and a scar two pixels thick there is no scar at all.)
	specks(canvas, 450, 131, [[214, 204, 182], [176, 164, 138], [86, 76, 62], [120, 112, 94]], {
		min: 0.5,
		max: 1.4,
		alpha: 0.22,
		kind: "dash",
	});
	return canvas;
}

/**
 * One leaflet of a coconut palm's leaf, painted along the card it is inked on.
 *
 * A coconut leaf is not a board and it is not a picture of a feather either: it is a stalk with a hundred
 * and more separate leaflets standing off it, and that is how `palmCrown` in `src/garden.js` builds one —
 * geometry, not paint. So this canvas carries no air and no cut at all: it is leaf from edge to edge, and
 * what it paints is the INSIDE of a leaflet — the rib down the middle, the veins running out to the two
 * thin edges, and the way a leaflet darkens at its edges and dries at its tip.
 *
 * Which is also why the rib matters: the stalk of a whole frond is inked from the same band, so one canvas
 * paints both a leaflet and the bare stalk the leaflets stand on.
 *
 * `x` runs along the leaflet — from the stalk it is born on at x = 0 to its own tip at x = size. `y` runs
 * across it: the rib is at y = half, and the two halves above and below it are the two halves of the V a
 * leaflet is folded in, so a card can be inked with one half and its neighbour with the other.
 */
export function palmBladeCanvas(size = 256) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const half = size / 2;
	const rand = randomGenerator(151);
	ctx.lineCap = "round";
	// The body of the leaf: fullest light next to the rib, darkening to both edges, which are thin and
	// curl away from the sun.
	const across = ctx.createLinearGradient(0, 0, 0, size);
	across.addColorStop(0, "#2a571d");
	across.addColorStop(0.26, "#3a7425");
	across.addColorStop(0.5, "#48892c");
	across.addColorStop(0.74, "#3a7425");
	across.addColorStop(1, "#2a571d");
	ctx.fillStyle = across;
	ctx.fillRect(0, 0, size, size);
	// The veins: out from the rib to the edge, every one of them leaning a little towards the tip.
	for (let x = 3; x < size; x += 5) {
		const lean = 9 + rand() * 7;
		for (const side of [-1, 1]) {
			const tone = 0.74 + rand() * 0.5;
			ctx.strokeStyle = `rgba(${Math.round(124 * tone)},${Math.round(176 * tone)},${Math.round(76 * tone)},0.5)`;
			ctx.lineWidth = 1.5 + rand() * 1.5;
			ctx.beginPath();
			ctx.moveTo(x, half + side * 5);
			ctx.lineTo(x + lean, half + side * (half - 2));
			ctx.stroke();
		}
	}
	// The rib, and the fibrous streaks along it. This band is also the stalk of the whole frond.
	const rib = ctx.createLinearGradient(0, half - 6, 0, half + 6);
	rib.addColorStop(0, "#5d8b39");
	rib.addColorStop(0.5, "#87ad52");
	rib.addColorStop(1, "#5d8b39");
	ctx.fillStyle = rib;
	ctx.fillRect(0, half - 6, size, 12);
	for (let x = 0; x < size; x += 3 + rand() * 5) {
		ctx.fillStyle = `rgba(${90 + Math.round(rand() * 60)},${110 + Math.round(rand() * 60)},${40 + Math.round(rand() * 30)},0.45)`;
		ctx.fillRect(x, half - 5, 1.6, 10);
	}
	ctx.fillStyle = "rgba(44,62,24,0.55)";
	ctx.fillRect(0, half - 1, size, 2);
	// Old at the base where it came out of the bud, and dry along the tip where the wind has had it.
	const age = ctx.createLinearGradient(0, 0, size, 0);
	age.addColorStop(0, "rgba(66,56,24,0.5)");
	age.addColorStop(0.16, "rgba(0,0,0,0)");
	age.addColorStop(0.82, "rgba(0,0,0,0)");
	age.addColorStop(1, "rgba(126,102,38,0.55)");
	ctx.fillStyle = age;
	ctx.fillRect(0, 0, size, size);
	const grain = noiseField(size, 44, 3, 157);
	wash(canvas, grain, [32, 62, 24], [116, 174, 76], 0.26);
	return canvas;
}

/**
 * A banana's pseudostem — which is not bark at all but the rolled sheaf of the leaf bases, so it is
 * green flushed with maroon, streaked lengthways where one sheaf laps over the next, and dry and pale
 * where the sun has had it. One repeat covers half a metre of stem.
 *
 * EVERY mark on this canvas runs the length of the stem, and that is a measurement and not a habit. The
 * version before this one laid two noise washes over its sheaf bands — cells of sixteen and of
 * forty-four — which is blobs of 3 cm and of 1 cm on a stem 20 cm across. Photographed four metres off
 * (`pictures/s64-stem-net.png`) those blobs aliased into a net of little chevrons and the clump read as
 * three palm saplings wearing bark for the fourth time running; measured on the same stem the browser put
 * it at (93,105,19), a green twelve points over its own red, which is dry grass and not a living sheaf.
 * So: no fine noise at all here. Breadth comes from the sheafs themselves, from the pale lip where one
 * laps under the next, and from a slow mottle whose cells are a hand across — the only size of variation
 * that survives four metres of air without turning into a weave.
 *
 * The green is cooler too, for the same reason: blue is the channel the tone curve crushes first (this
 * canvas's old mean of (78,106,52) came out of a browser at (93,105,19): the red went UP by fifteen and
 * the blue fell by thirty-three), so a sheaf that is to READ green on the screen has to be painted a good
 * deal bluer than a leaf is.
 */
export function stalkCanvas(size = 256) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(211);
	ctx.fillStyle = "#46684a";
	ctx.fillRect(0, 0, size, size);
	// The sheafs, one beside the next round the stem: a broad band of one tone, the pale waxy lip where
	// the next one laps over it, and the dark seam underneath. Bands of constant x, because x runs round
	// the stem and y runs up it: 16-30 texels here is 3-6 cm of stem, which is the width of a sheaf a
	// thumb across.
	let x = -6;
	while (x < size) {
		const w = 16 + rand() * 14;
		// A narrow spread of tone, and a tone that wanders as it goes up: a sheaf is a foot long and its own
		// weathering runs that way, so a band that is one flat colour from foot to crown is a stripe painted
		// on a pole and not a leaf base. The patch is tall and narrow on purpose — anything squarer is a
		// cell, and a field of cells is the weave that gave the old stem its bark.
		const tone = 0.93 + rand() * 0.16;
		let y = -20;
		while (y < size) {
			const h = 26 + rand() * 40;
			const t = tone * (0.96 + rand() * 0.08);
			ctx.fillStyle = `rgb(${Math.round(78 * t)},${Math.round(116 * t)},${Math.round(68 * t)})`;
			ctx.fillRect(x, y, w, h);
			y += h;
		}
		// A fresh sheaf flushes maroon where it is still soft: some of them, not all, and never edge to
		// edge, or the stem is striped like a barber's pole.
		if (rand() < 0.3) {
			ctx.fillStyle = "rgba(96,42,36,0.3)";
			ctx.fillRect(x + 3, 0, Math.max(2, w - 6), size);
		}
		// The fibre: the sheaf is a bundle and it shows lengthways.
		for (let k = 0; k < 7; k++) {
			const fx = x + 1 + rand() * (w - 2);
			const pale = rand() < 0.4;
			ctx.fillStyle = pale ? `rgba(176,192,152,${0.05 + rand() * 0.08})` : `rgba(34,52,32,${0.05 + rand() * 0.1})`;
			ctx.fillRect(fx, 0, 1 + (rand() < 0.3 ? 1 : 0), size);
		}
		// The lip of the next sheaf: pale and waxy, and the seam it laps under. Both faint: at 0.24 and 0.42
		// they were the strongest marks on the stem and a 20 cm stem four metres off came back a barber's
		// pole (`pictures/s64-banana-wide.png`).
		ctx.fillStyle = "rgba(170,188,148,0.11)";
		ctx.fillRect(x + w - 4, 0, 3, size);
		ctx.fillStyle = "rgba(34,32,24,0.3)";
		ctx.fillRect(x + w - 1, 0, 2, size);
		x += w;
	}
	// The leaf-scars: the ridge left where an old sheath ended, and they run up the stem in a slow spiral,
	// one every twelve or fifteen centimetres. Nothing else on a pseudostem runs across the sheafs, so
	// nothing else breaks the vertical so handsomely — and each one is one line, not a field of them, so
	// there is no weave in it to alias into bark. They slope a little because the spiral does.
	for (let y = -30; y < size + 30; y += 58 + rand() * 22) {
		const slope = 0.1 + rand() * 0.16;
		const thick = 2 + Math.round(rand() * 2);
		for (let sx = 0; sx < size; sx += 4) {
			const yy = y + sx * slope;
			ctx.fillStyle = "rgba(150,168,126,0.16)";
			ctx.fillRect(sx, yy, 4, thick);
			ctx.fillStyle = "rgba(38,44,30,0.2)";
			ctx.fillRect(sx, yy + thick, 4, 1);
		}
	}
	// One slow mottle for the bloom, at a cell a hand across the stem and nothing smaller anywhere.
	const bloom = noiseField(size, 7, 2, 217);
	wash(canvas, bloom, [56, 84, 58], [116, 148, 96], 0.2);
	return canvas;
}

/**
 * The skin of a shrub: a mass of small leaves laid over one another, with the dark of the bush showing
 * between them where they run thin.
 *
 * A bush seen from two metres off is not a ball and it is not a handful of big leaves either: it is
 * hundreds of small ones, each throwing its own little shade, and that is what this paints. One repeat
 * covers 42 cm of bush, so a leaf here is about the width of a thumb — the size a clipped hedge's
 * leaves actually are — where the boundary hedge's pattern is a metre and a tenth to a repeat and the
 * big leaf canvas is one leaf to a card. None of those three was ever going to do on a bush: the hedge's
 * clumps wrapped round a sphere come out as the stripes on a watermelon, and one leaf on a sphere is a
 * sticker.
 */
export function bushCanvas(size = 256) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	// The inside of a bush is dark: light does not get through a hedge of leaves.
	ctx.fillStyle = "#28491f";
	ctx.fillRect(0, 0, size, size);
	const rand = randomGenerator(321);
	const leaf = (x, y, len, wide, lean, tone) => {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(lean);
		ctx.fillStyle = `rgb(${Math.round(56 * tone)},${Math.round(80 * tone)},${Math.round(36 * tone)})`;
		ctx.beginPath();
		ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = `rgba(${Math.round(104 * tone)},${Math.round(134 * tone)},${Math.round(64 * tone)},0.45)`;
		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(-len / 2 + 2, 0);
		ctx.lineTo(len / 2 - 2, 0);
		ctx.stroke();
		ctx.restore();
	};
	for (let i = 0; i < 420; i++) {
		const x = rand() * size;
		const y = rand() * size;
		const len = size * (0.05 + rand() * 0.045);
		const wide = len * (0.44 + rand() * 0.24);
		const lean = rand() * Math.PI;
		const tone = 0.66 + rand() * 0.66;
		// Every leaf is laid again off the opposite edge if it straddles one, so the tile joins with no
		// cut line in the skin of the bush.
		for (const dx of x > size - len ? [0, -size] : [0]) {
			for (const dy of y > size - len ? [0, -size] : [0]) leaf(x + dx, y + dy, len, wide, lean, tone);
		}
	}
	// Broad patches of light and dark, so a bush is not one green: the young leaf on top, the old below.
	const broad = noiseField(size, 5, 3, 323);
	wash(canvas, broad, [30, 46, 20], [74, 100, 44], 0.34);
	return canvas;
}

/**
 * The outside of a bush: leaves with air between them, on a transparent tile.
 *
 * A shrub's outline is a tangle of leaf tips, and no amount of painting a solid ball will say so: the
 * edge of the ball is the edge, and it is smooth. So the bush's solid heart — which wears
 * `bushCanvas`, and is what you see in the gaps — is dressed in a shell of this, cut out by
 * `alphaCutOff` so the tile's gaps are sky and the tile's leaves are the silhouette. The leaves are the
 * same size as the ones on the heart, four and a half decimetres of bush to a repeat, laid a little
 * thicker than three parts out of four: more gaps than that and the shell stops reading as a bush and
 * starts reading as a wire frame with parsley on it.
 *
 * `leafFrom` and `leafMore` are a leaf's length as a share of the tile, `shade` scales every colour and
 * `rib` is how much lighter than its own leaf a midrib is. The hedge's crest takes the defaults, because
 * a crest card is half a metre across and its leaf has to be a hedge's leaf at that size. The bush's own
 * shell is dressed in smaller, darker leaf than this now that `bushLeafage` stands the lit sprays outside
 * it: the shell is the dark inside a bush and the cards are the leaves, and when both of them were bright
 * the whole bush came out a dome of flat green paddles (`pictures/s51-pot.png`).
 */
export function bushEdgeCanvas(size = 256, { seed = 455, leafFrom = 0.07, leafMore = 0.055, sprigs = 210, shade = 1, rib = 44, base = [56, 80, 36] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const leaf = (x, y, len, wide, lean, colour, alpha) => {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(lean);
		ctx.fillStyle = `rgba(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])},${alpha})`;
		ctx.beginPath();
		ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
		ctx.fill();
		// A midrib, so a leaf is not a green blob: the eye reads a line down the middle as a leaf even
		// when the leaf itself is four pixels across.
		ctx.strokeStyle = `rgba(${Math.round(colour[0] + rib)},${Math.round(colour[1] + rib * 1.2)},${Math.round(colour[2] + rib * 0.64)},${alpha * 0.5})`;
		ctx.lineWidth = 1.1;
		ctx.beginPath();
		ctx.moveTo(-len / 2 + 2, 0);
		ctx.lineTo(len / 2 - 2, 0);
		ctx.stroke();
		ctx.restore();
	};
	for (let i = 0; i < sprigs; i++) {
		const x = rand() * size;
		const y = rand() * size;
		const len = size * (leafFrom + rand() * leafMore);
		const wide = len * (0.4 + rand() * 0.3);
		const lean = rand() * Math.PI;
		// The same two ends the heart's leaves have, and the same base: a bush's outside leaf is a lit
		// one, so the range runs a shade higher than the heart's.
		const tone = (0.8 + rand() * 0.7) * shade;
		const colour = [base[0] * tone, base[1] * tone, base[2] * tone];
		for (const dx of x > size - len ? [0, -size] : [0]) {
			for (const dy of y > size - len ? [0, -size] : [0]) leaf(x + dx, y + dy, len, wide, lean, colour, 1);
		}
	}
	return canvas;
}

/**
 * How the shrub atlas is laid out: `cols` by `cols` sprays on a `size` canvas, one spray being `cluster`
 * metres of bush. Read by the painter below and by the cutter in `src/garden.js`, so the two cannot
 * disagree about where a cell is. The canvas is 768 and not 512 so that the thirty-six sprays keep the
 * same 853 texels to the metre they had at sixteen on a 512: more sprays to choose from, and no leaf
 * drawn softer than it was.
 */
export const bushAtlas = { size: 768, cols: 6, cluster: 0.15 };

/**
 * The atlas a shrub's outside leaf is cut from: thirty-six small sprays, each with air all round it.
 *
 * The skin of a bush used to be one seamless tile laid over a crumpled ball, and at arm's length a
 * browser said plainly what that is: a ball wearing a picture of leaf (`pictures/s51-pot.png`). Two
 * things came of it. A painted leaf lies as flat as the skin it is painted on, so a bush two metres off
 * was a dome of flat green paddles; and the tile is laid in the ball's own seam, so every leaf combs
 * round to two poles and the crowd of them makes a fan — which is the shape of a spruce top and not of
 * a clipped shrub. `bushLeafage` in `src/garden.js` now stands real cards of this on the ball, one spray
 * to a card, tilted out of the skin, so a leaf catches the sun on its own face and throws a shade on the
 * leaf behind it. The same lesson as the belt's near rank and the hedge's crest: a ragged edge has to be
 * geometry, because the border of a card drawn straight across a tile of leaf is a straight line.
 *
 * One cell is `cluster` metres of bush and holds one spray, built outwards the way the belt's clusters
 * are, because a card is a flat sheet and a bush is not see-through:
 *
 *   mass   a wobbled daub of the darkest green in the atlas, a little over half the cell across, and then
 *          nibbled and speckled until it is a crowd of shaded leaf and not a daub. Without it a card is a
 *          sieve and a visitor looks clean through the bush at the wall behind it — which is exactly what
 *          the first cards of this did, and a hole in a sunlit bush showed the terracotta wall as a pink
 *          blob in the middle of the leaf (`pictures/s51-pot2.png`).
 *   twig   three or four mossy strokes out of the middle, so there is a structure there and some brown,
 *          which is what a real sprig has and a stencil has not
 *   leaf   nine to eleven BUDS scattered over the mass, each one a short fanned bunch of three to five
 *          leaves of 2 to 3.4 cm — the size a clipped privet's leaf is — all leaning the bud's own way,
 *          with a midrib and a pointed tip. The deep buds sit over the middle of the mass and the lit ones
 *          out on its rim, so the edge of a card is lit leaf and its middle is the shade inside a spray.
 *
 * **The buds are scattered and not ringed, and that was the seventh fault the browser found in this bush
 * on the trot** (`pictures/s63-urchin.png` is the bush with the ring on it). Thirty leaves laid at even
 * angles about the middle of a cell is not a spray of leaf: it is an asterisk, a star, a five-petalled
 * flower — and with only eight turns available to a card the same star came back again and again, a rank
 * of them across the front of a shrub like a hedge of green compasses. A privet spray has no centre at
 * all: leaves come out of a short stem in a fan, and the fans sit where the growth happens to be. So the
 * ring is gone, the leaves are grouped into buds, and the buds are thrown.
 *
 * **The leaf came down a half and its number up nearly three-fold** (`pictures/s61-spray-before.png` is
 * the cell before, and `pictures/s61-spray-small.png` after). Ten leaves of 5 cm on a 17 cm card is a stencil of ten paddles:
 * each card read as one big flat paddle-fan lying against the ball, and a bush is a THOUSAND small leaves
 * and not thirty big ones. At the sizes a shrub is seen at — a metre across, two metres off — a leaf has
 * to come out two or three centimetres to be a leaf at all, and a flat daub of the darkest green showing
 * between the paddles was what made the middle of a sunlit bush read as a hole.
 *
 * Nothing crosses a cell, so the texture is clamped and not wrapped and a card cut to a cell has air at
 * its border and nothing there to be cut.
 */
export function bushClusterCanvas(size = bushAtlas.size, { cols = bushAtlas.cols, cluster = bushAtlas.cluster, seed = 517, leaves = 30 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const cell = size / cols; // pixels of canvas in one spray
	const m = cell / cluster; // pixels of canvas per metre of bush
	const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

	// The tones, and they are the heart's tile's own family at a tone of its own, so a card and the skin
	// behind it are one green and not two greens on one bush. These are a sixth brighter than the ones
	// they replace, and that is the bush's own fault and not a guess: measured on a shrub two metres off,
	// with the lawn it stands on at L112 and the hedge behind it at L111, a bush came out at L56 — not a
	// darker green but a hole in the picture. See the `bushLeaf` line in `src/materials.js`, which carries
	// the rest of the payment and why it is not all taken out of the shine.
	// Trimmed a tenth, and its blue paid back a little. A shrub two metres off was the brightest thing in
	// its own part of the picture: on the west lawn view its lit leaf tops ran to (128,215,40) against the
	// boundary hedge's (88,137,22) and the lawn under it at (164,192,54), so a bush was a green floodlight
	// on the lawn and every leaf tip on it was a flare. And red paid back too, in the second pass: a privet
	// leaf is an olive green, and the lawn it stands on has red to its green in the ratio 0.79 while these
	// tones had 0.71, which is why a bush came out emerald among olive. The ratio is set at about 0.76 now.
	// The three tones are what a leaf of that bush is painted with, and there is no fourth for the mass
	// behind them: see `massTone`.
	const deep = () => [70 + rand() * 14, 96 + rand() * 16, 46 + rand() * 10];
	const mid = () => [86 + rand() * 18, 116 + rand() * 20, 54 + rand() * 14];
	const lit = () => [116 + rand() * 18, 152 + rand() * 20, 70 + rand() * 16];
	// The mass behind the leaf used to be the DARKEST green in the atlas, and that was a mistake of
	// arithmetic: the card is planted on a shell of cut-out leaf, and behind that shell is a heart wearing
	// the dark bush tile, so the middle of a card was dark leaf over dark shell over dark heart — three
	// darks in a row, and a bush came over with black holes punched in it. The shell and the heart are the
	// shade inside a bush; the card's own body is the middle of its own leaf.
	const massTone = () => [80 + rand() * 14, 106 + rand() * 16, 50 + rand() * 10];

	// One leaf: a pointed oval and a midrib. Bezier and not an ellipse, because the end of a leaf is
	// pointed and a rounded blob, four centimetres across and two metres from an eye, is only ever a blob.
	const leaf = (x, y, len, wide, lean, colour, alpha) => {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(lean);
		ctx.fillStyle = rgb(colour, alpha);
		ctx.beginPath();
		ctx.moveTo(-len / 2, 0);
		ctx.quadraticCurveTo(-len * 0.08, -wide / 2, len / 2, 0);
		ctx.quadraticCurveTo(-len * 0.08, wide / 2, -len / 2, 0);
		ctx.closePath();
		ctx.fill();
		// A third of the way up the leaf's own face, and no more. The shell's tile ran its ribs at half
		// the leaf's brightness and half the leaves came out painted paddles; a rib is a hairline, or it
		// is a stripe, and a stripe at four pixels is what the eye reads first.
		ctx.strokeStyle = rgb([colour[0] + 30, colour[1] + 34, colour[2] + 18], alpha * 0.34);
		ctx.lineWidth = Math.max(1, wide * 0.13);
		ctx.beginPath();
		ctx.moveTo(-len * 0.4, 0);
		ctx.lineTo(len * 0.4, 0);
		ctx.stroke();
		ctx.restore();
	};

	for (let cj = 0; cj < cols; cj++) {
		for (let ci = 0; ci < cols; ci++) {
			const cx = (ci + 0.5) * cell;
			const cy = (cj + 0.5) * cell;
			const tilt = rand() * Math.PI * 2;
			// One spray against the next: this one a shade younger, that one a shade older.
			const tone = 0.86 + rand() * 0.3;
			const tint = (base) => [base[0] * tone, base[1] * tone * (1 + (tone - 1) * 0.3), base[2] * tone];
			const count = Math.max(5, leaves + Math.round((rand() - 0.5) * 4));
			const w = [rand() * 6.283, rand() * 6.283, rand() * 6.283];
			// How far a leaf's bud sits out from the middle of the cell, and how far the mass reaches. A
			// leaf's tip has to stay inside its own square, so the whole spray — mass, bud, longest leaf —
			// comes to about half the cell and the border falls in air.
			const reach = cell * (0.2 + rand() * 0.06);
			// The mass is two thirds of the cell across. It has to be about that: a card on the bush's
			// silhouette has nothing behind it but the world, so every gap in that card is a hole to the
			// paving or the earth bed behind the bush, and a sunlit bed reads as a tuft of dead leaves in the
			// skirt (`pictures/1984-grass.png`). It used to be three quarters, and a flat daub of the darkest
			// green that big is what a browser called a hole in the middle of the bush.
			const rmass = cell * (0.33 + rand() * 0.05);
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(tilt);

			// The mass behind the leaf: the shade inside a spray, and the thing that stops a bush being a
			// sieve. Wobbled, and then nibbled round the edge by a ring of small dark leaf, because a smooth
			// daub is a potato and a potato is the fault this whole bush is about.
			ctx.fillStyle = rgb(massTone(), 1);
			ctx.beginPath();
			for (let k = 0; k <= 20; k++) {
				const a = (k / 20) * Math.PI * 2;
				const r = rmass * (1 + 0.16 * Math.sin(3 * a + w[0]) + 0.1 * Math.sin(5 * a + w[1]) + 0.06 * Math.sin(9 * a + w[2]));
				if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
				else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
			}
			ctx.closePath();
			ctx.fill();
			// The rim, nibbled: small leaves stuck round the edge of the mass so it is a crowd of leaf and not
			// a daub. ANGLE THROWN and not counted round, and pointing any way but along their own radius:
			// twenty-two leaves laid at even steps of a full turn, each pointing out from the middle, is a
			// flower, and the browser showed a bush freckled with dark green daisies
			// (`pictures/s63-urchin.png`). They are mid leaf now and not the darkest in the atlas, for the same
			// reason as the mass above: three darks in a row is a hole.
			for (let k = 0; k < 18; k++) {
				const a = rand() * Math.PI * 2;
				const r = rmass * (0.86 + rand() * 0.24);
				const len = m * (0.016 + rand() * 0.014);
				leaf(Math.cos(a) * r, Math.sin(a) * r, len, len * (0.5 + rand() * 0.4), rand() * Math.PI * 2, tint(rand() < 0.4 ? mid() : deep()), 1);
			}
			// And speckled inside, so no part of the mass is a flat fill: two dozen small shaded leaflets
			// lying over the daub, half of them brighter than their neighbours. The ring above nibbles
			// its edge and this takes out its middle.
			for (let k = 0; k < 26; k++) {
				const a = rand() * Math.PI * 2;
				const r = rmass * Math.sqrt(rand()) * 0.94;
				const len = m * (0.016 + rand() * 0.016);
				leaf(Math.cos(a) * r, Math.sin(a) * r, len, len * (0.45 + rand() * 0.4), a + (rand() - 0.5) * 1.8, tint(rand() < 0.5 ? mid() : deep()), 0.9);
			}

			// The twigs are GONE. They used to be four mossy strokes drawn from the middle of the cell out to
			// its rim, and that is a star: four dark arms pointing away from one centre, one per card, forty
			// cards to a bush — `pictures/s63-atlas2.png` is the atlas with them still in it and every sixth
			// cell is a five-pointed asterisk of dark green. What they were bought for was structure and a
			// little brown, and the bud's own bunch of leaves gives the structure; the brown went the same day
			// the leaf went olive, because a mossy line under olive leaf is a bruise and not a stem.
			// What is left of the twig is three short strokes laid anywhere in the mass, at any angle, and
			// under the leaf, so a cell has some darker line in it and no line has a centre to grow out of.
			ctx.strokeStyle = "rgba(58,62,34,0.55)";
			ctx.lineWidth = Math.max(1, m * 0.0035);
			for (let i = 0; i < 3; i++) {
				const a = rand() * Math.PI * 2;
				const r = rmass * rand() * 0.7;
				const dx = Math.cos(a);
				const dy = Math.sin(a);
				const run = rmass * (0.2 + rand() * 0.3);
				ctx.beginPath();
				ctx.moveTo(dx * r - dy * run, dy * r + dx * run);
				ctx.lineTo(dx * r + dy * run, dy * r - dx * run);
				ctx.stroke();
			}

			// The leaf, in buds. A bud is a short stem with three to five leaves fanned off it — along the
			// stem, at about a hand's angle apart — and the buds are thrown over the mass anywhere, each one
			// leaning ANY way it likes.
			//
			// It used to be that every leaf's angle came out of its own position: `lean = a ± half`, where `a`
			// is the angle at which the leaf sits round the middle of the cell. That is a star. Every leaf on
			// the card points away from the middle of the card, so the card is an asterisk with four to six
			// arms, and a bush is a crowd of asterisks (`pictures/s63-atlas.png` is the atlas with that in it,
			// and `pictures/s63-urchin.png` is the bush). A spray of privet has no middle to point away from:
			// the leaves go the way the twig they grow on goes, and the twigs go any way the plant liked.
			// So the only link left between where a leaf sits and which way it looks is a third-of-a-turn bias
			// toward the bud's own lean, and that is all the geometry there is.
			const buds = Math.max(5, Math.round(count / 2.4));
			for (let i = 0; i < buds; i++) {
				const roll = rand();
				const a = rand() * Math.PI * 2;
				const r = roll < 0.3 ? rmass * rand() * 0.8 : rmass * (0.4 + rand() * 0.85);
				const bx = Math.cos(a) * r;
				const by = Math.sin(a) * r;
				// Which way the bunch leans: any way at all, with a third of them biased out of the middle of
				// the mass, because that is the way new growth reaches.
				const fan = rand() * Math.PI * 2 + (rand() < 0.34 ? a : 0);
				const each = 3 + Math.floor(rand() * 3);
				const base = roll < 0.22 ? deep() : roll < 0.7 ? mid() : lit();
				for (let k = 0; k < each; k++) {
					const along = (k - (each - 1) / 2) * 0.5;
					const lean = fan + along * 0.55 + (rand() - 0.5) * 0.5;
					const step = Math.abs(along) * m * 0.012 + rand() * m * 0.006;
					const len = m * (0.015 + rand() * 0.013);
					const wide = len * (0.45 + rand() * 0.35);
					// Along the stem and a little across it, so a bud is a bunch and not a fan of the same leaf.
					const px = bx + Math.cos(fan) * step - Math.sin(fan) * (rand() - 0.5) * len * 0.5;
					const py = by + Math.sin(fan) * step + Math.cos(fan) * (rand() - 0.5) * len * 0.5;
					leaf(px, py, len, wide, lean, tint(base), 1);
				}
			}
			ctx.restore();
		}
	}
	return padAtlas(canvas);
}

/**
 * Fills the air of an atlas with the colour of the leaf next to it, and gives that air the tenth of an
 * alpha a canvas needs in order to keep a colour at all.
 *
 * A card cut out of an atlas is inked from a mip chain, and a mip level is a block average: the leaf is
 * averaged with the air round it, and the air of a canvas straight out of a 2d context is black. So the
 * farther off a card stands the darker and thinner its leaf goes, and at four metres a whole rank of leaf
 * cards came out sooty — the crowns of the potted bushes sat at (10,7,1) with the sun on them
 * (`pictures/s51-mid2.png`). The engine cannot be told to average only the leaf; the atlas can be told to
 * have no black in it, and that is the whole trick.
 *
 * So every transparent pixel is given the colour of the nearest opaque one. One sweep along each row and
 * one down each column fills the canvas, which at a 512 atlas costs the boot a couple of milliseconds and
 * the browser no draws at all.
 *
 * And then the alpha, which is the part that was wrong for six sessions. A canvas stores its pixels
 * PREMULTIPLIED: a pixel with alpha 0 has no colour, and whatever was painted into it is thrown away on
 * the way back out. `tools/atlasair.js bushClusterCanvas` says so flatly — after padding, the leaf pixels
 * of that atlas average (91,121,59) and the air still averages (4,5,2). Every drop of colour the sweeps
 * laid in the air was lost again the moment the canvas was read, which is why the padding was once measured
 * worth one point of red on a clump of grass (`tuftAtlasCanvas`), and why a shrub's leaf cards — 53% air,
 * and minified at every distance a bush is ever seen from — still painted (47,82,13) in a browser while the
 * shell BEHIND them painted (70,114,20).
 *
 * So an air pixel is left not with alpha 0 but with `air`, a quarter of what a leaf has. It is still cut
 * out at the material's own cut-off of a half, so at full size nothing about a card changes; but the colour
 * now survives the canvas, and so survives the mip chain, and a block average of leaf over air comes back
 * as leaf and not as soot.
 */
function padAtlas(canvas, { air = 64 } = {}) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const image = ctx.getImageData(0, 0, size, size);
	const d = image.data;
	const copyColour = (to, from) => {
		d[to * 4] = d[from * 4];
		d[to * 4 + 1] = d[from * 4 + 1];
		d[to * 4 + 2] = d[from * 4 + 2];
	};
	// Along the row: whatever was last seen on the left, then whatever lies on the right.
	for (let y = 0; y < size; y++) {
		let last = -1;
		let first = -1;
		for (let x = 0; x < size; x++) {
			const i = y * size + x;
			if (d[i * 4 + 3] >= 128) {
				if (last < 0) first = i;
				last = i;
				continue;
			}
			if (last >= 0) copyColour(i, last);
		}
		for (let x = size - 1; x >= 0; x--) {
			const i = y * size + x;
			if (d[i * 4 + 3] >= 128) continue;
			if (first >= 0) copyColour(i, first);
		}
	}
	// Down the column, for a row that held nothing at all.
	for (let x = 0; x < size; x++) {
		let last = -1;
		let first = -1;
		for (let y = 0; y < size; y++) {
			const i = y * size + x;
			if (d[i * 4 + 3] >= 128) {
				if (last < 0) first = i;
				last = i;
				continue;
			}
			if (last >= 0) copyColour(i, last);
		}
		for (let y = size - 1; y >= 0; y--) {
			const i = y * size + x;
			if (d[i * 4 + 3] >= 128) continue;
			if (first >= 0) copyColour(i, first);
		}
	}
	// The air's alpha, and it has to be set BEFORE the pixels go back: a canvas keeps no colour in a pixel
	// that has no alpha, so anything painted into a fully transparent pixel is gone by the time anyone asks
	// what it was. Under `air` the cut-off still throws the pixel away, so a card at full size is exactly as
	// cut out as it was; what changes is that the colour is there to be averaged by a mip level.
	for (let i = 0; i < size * size; i++) if (d[i * 4 + 3] < air) d[i * 4 + 3] = air;
	ctx.putImageData(image, 0, 0);
	return canvas;
}

/**
 * A broad simple leaf, for the garden plants near the walls.
 */
/**
 * The blade of a banana leaf, painted whole — and painted with no air in it and nothing cut out.
 *
 * The leaf used to be four flat cards hinged end to end wearing a *picture* of a leaf, ovals and all,
 * and a browser said what that is: a handful of green plates (`pictures/s53-banana-before.png`). The
 * shape is mesh now (`bananaCrown` in `src/garden.js`), so this canvas has one job left: the INSIDE of
 * a blade. A banana's own pattern is very plain and very regular — a pale rib down the middle and a
 * hundred veins running out from it to the two margins, nearly parallel — and it is that regularity,
 * at the right size, that stops a leaf reading as a painted board.
 *
 * `x` runs along the leaf: the end that joins the stalk at x = 0, the tip at x = size. `y` runs across
 * it: the rib at y = half, the two margins at the two edges — which is how the UVs `bananaCrown`
 * writes run too, so one canvas dresses one leaf and the rib band dresses its midrib as well.
 */
export function bananaBladeCanvas(size = 256) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const half = size / 2;
	const rand = randomGenerator(167);
	ctx.lineCap = "round";
	// The body of the blade: fullest light along the rib, darkening out to the two margins, which
	// curl away from the sun. A banana's green is cooler and deeper than a palm's — this is a broad
	// leaf in shade, not a grass blade in the sun.
	const across = ctx.createLinearGradient(0, 0, 0, size);
	across.addColorStop(0, "#1f4512");
	across.addColorStop(0.16, "#2c5f1d");
	across.addColorStop(0.4, "#3a7626");
	across.addColorStop(0.5, "#41822c");
	across.addColorStop(0.6, "#3a7626");
	across.addColorStop(0.84, "#2c5f1d");
	across.addColorStop(1, "#1f4512");
	ctx.fillStyle = across;
	ctx.fillRect(0, 0, size, size);
	// The veins: out from the rib to each margin, a hundred and seventy of them, all leaning a little
	// towards the tip. One repeat of this canvas is ONE LEAF (`bananaCrown` lays its UVs from end to end),
	// so on a leaf a metre and a half long a vein lands two centimetres from its neighbour, which is what
	// they are on a banana. They are the leaf's whole scale, so they are the one thing here that may not be
	// sparse.
	for (let x = 2; x < size; x += 3) {
		const lean = 6 + rand() * 5;
		for (const side of [-1, 1]) {
			const tone = 0.7 + rand() * 0.6;
			ctx.strokeStyle = `rgba(${Math.round(128 * tone)},${Math.round(178 * tone)},${Math.round(80 * tone)},0.4)`;
			ctx.lineWidth = 1 + rand() * 1.4;
			ctx.beginPath();
			ctx.moveTo(x, half + side * 4);
			ctx.lineTo(x + lean, half + side * (half - 1));
			ctx.stroke();
		}
	}
	// The rib: pale, wide, and rounded, so the midrib that `bananaCrown` builds out of mesh is inked
	// from the same band and one canvas paints both.
	const rib = ctx.createLinearGradient(0, half - 7, 0, half + 7);
	rib.addColorStop(0, "#4e7a2c");
	rib.addColorStop(0.5, "#89ab55");
	rib.addColorStop(1, "#4e7a2c");
	ctx.fillStyle = rib;
	ctx.fillRect(0, half - 7, size, 14);
	ctx.fillStyle = "rgba(40,58,22,0.5)";
	ctx.fillRect(0, half - 1, size, 2);
	// Weather: dry along the tip, pale and worn where it came out of the stalk, and a flush of maroon
	// along the margins of an old leaf, which is how a banana ages — from the edge in.
	const age = ctx.createLinearGradient(0, 0, size, 0);
	age.addColorStop(0, "rgba(96,74,26,0.42)");
	age.addColorStop(0.14, "rgba(0,0,0,0)");
	age.addColorStop(0.78, "rgba(0,0,0,0)");
	age.addColorStop(1, "rgba(118,92,34,0.6)");
	ctx.fillStyle = age;
	ctx.fillRect(0, 0, size, size);
	const edge = ctx.createLinearGradient(0, 0, 0, size);
	edge.addColorStop(0, "rgba(88,44,30,0.4)");
	edge.addColorStop(0.08, "rgba(0,0,0,0)");
	edge.addColorStop(0.92, "rgba(0,0,0,0)");
	edge.addColorStop(1, "rgba(88,44,30,0.4)");
	ctx.fillStyle = edge;
	ctx.fillRect(0, 0, size, size);
	// A few blotches, because no outdoor leaf is one colour, and the wind has nibbled these.
	for (let i = 0; i < 26; i++) {
		const x = rand() * size;
		const y = half + (rand() - 0.5) * size * 0.9;
		const w = 5 + rand() * 22;
		const h = 2 + rand() * 5;
		ctx.fillStyle = `rgba(${52 + Math.round(rand() * 40)},${58 + Math.round(rand() * 30)},${24 + Math.round(rand() * 18)},${0.12 + rand() * 0.2})`;
		ctx.fillRect(x, y, w, h);
	}
	const grain = noiseField(size, 40, 3, 167);
	wash(canvas, grain, [30, 62, 24], [116, 172, 72], 0.28);
	return canvas;
}

/** Woven outdoor fabric for cushions and umbrellas. `stripe` paints a towel's bands across it. */
export function clothCanvas(size = 256, base = [226, 216, 196], { stripe = null, band = 0.07 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	for (let y = 0; y < size; y += 4) {
		ctx.fillStyle = "rgba(120,110,92,0.16)";
		ctx.fillRect(0, y, size, 1.6);
	}
	for (let x = 0; x < size; x += 4) {
		ctx.fillStyle = "rgba(255,255,255,0.10)";
		ctx.fillRect(x, 0, 1.6, size);
	}
	const grain = noiseField(size, 64, 3, 191);
	wash(canvas, grain, [base[0] - 40, base[1] - 40, base[2] - 44], [base[0] + 20, base[1] + 20, base[2] + 18], 0.3);
	if (stripe) {
		// A towel is a field of cotton with a couple of bands near its ends — a pair of stripes, wide and
		// thin together, at each end. Painted after the wash so the bands are cloth and not a glaze over it.
		ctx.fillStyle = `rgba(${stripe[0]},${stripe[1]},${stripe[2]},0.85)`;
		const w = Math.max(2, Math.round(size * band));
		for (const at of [0.2, 0.68]) {
			ctx.fillRect(0, Math.round(size * at), size, w);
			ctx.fillRect(0, Math.round(size * at + w * 1.9), size, Math.max(2, Math.round(w * 0.45)));
		}
	}
	return canvas;
}

/**
 * The cushion of a sunbed: canvas over foam, quilted into panels.
 *
 * A sunbed's pad was a box wearing `clothCanvas`, and a browser said what that is: a slab of one pale
 * colour with a hard edge — `pictures/tmp-lounger.png` shows the back of one, and it is a concrete
 * block. Two faults, and neither is the cloth's own weave.
 *
 * The first is SCALE. The cloth's grain is 64 cells to a repeat: laid at half a metre to a repeat that
 * is one shade every eight centimetres, and eight centimetres is gone at the ten metres a lounger is
 * most looked at from. So what a cushion is made of — a panel two arm-spans wide, puffed in the middle
 * and seamed where two panels are stitched together — has to be painted at ITS size, and one repeat of
 * this canvas IS one panel (`pattern: 0.62` on the material, which is the width of a sunbed's pad).
 *
 * The second is the DRIFT. Canvas over foam is not one colour: the pile lies different ways, the rain
 * rang some of it, and a sunlit cushion therefore has soft light and soft shade across it. Without that
 * a cushion is the flattest thing in the picture and the brightest, which is the worst pair.
 *
 * The seam sits on the repeat's own edge, half on each side, so the panels line up across a cushion of
 * any length and the stitching keeps its 62 cm pitch wherever the panel happens to start.
 */
// Measured, not arranged: at the old tone a sunlit pad came out of the browser at L202..214 with its red
// channel at 247..250, which is to say clipped — and a surface at the top of the tonal range cannot show a
// seam, a puff or anything else, however loudly it is painted. Fifteen per cent darker, and the quilting
// has room above it and below it again.
//
// That fifteen per cent was taken off twice over, and the second time it came off the BASE, which was not
// what was meant: a browser at the west deck showed a pad whose sunlit top was right (212,183,146) while
// its shaded side had fallen to 57,56,48 at L56 — a lounger wearing a strip of bitumen, and the one dark
// mark on a bright deck. A sunbed's canvas is a pale warm cream, and it is painted that here now
// ([196,183,158] — what `src/surface-colours.js` has been painting for the CPU drawing all along at
// [198,180,152], so the drawing was honest and the browser was the liar).
// What actually owed the money was the SHEEN, not the colour: a cloth at roughness 0.88 has no business
// carrying a mirror's full specular, and it was the sun's white glare lying on the pad that put red at 250.
// See `mats.cushion` in src/materials.js.
export function cushionCanvas(size = 256, base = [196, 183, 158]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
	ctx.fillStyle = rgb(base);
	ctx.fillRect(0, 0, size, size);
	// The puff: each panel stands proud in its own middle and is let down where two neighbours took the
	// thread. Drawn along `v`, which is the long way of the pad and of its side faces, so a seam runs
	// across a lounger and pipes along the side of it at the same height. This is the one part of a pad
	// that survives being seen from ten metres, so it is the one part painted loud: a panel's own middle
	// is a fifth brighter than its joins, which is three or four bytes after the tone map, which is what
	// a cushion needs to stop being one pale slab.
	for (let y = 0; y < size; y++) {
		const puff = Math.sin((Math.PI * y) / size);
		ctx.fillStyle = rgb([255, 252, 244], 0.2 * puff);
		ctx.fillRect(0, y, size, 1);
		ctx.fillStyle = rgb([64, 46, 30], 0.16 * (1 - puff));
		ctx.fillRect(0, y, size, 1);
	}
	// The stitch, and its piping. Half of it lies at the bottom of the repeat and half at the top, so the
	// two halves meet at the join and one line is painted, not two.
	// Two per cent of the repeat was a seam 1.1 cm wide on the pad, which is under a pixel at three metres
	// and simply is not there. A quilted channel's shadow is nearer four centimetres wide, and that is what
	// survives as a lounger instead of a plank.
	const seam = Math.max(4, Math.round(size * 0.055));
	ctx.fillStyle = rgb([92, 74, 52], 0.6);
	ctx.fillRect(0, 0, size, seam);
	ctx.fillRect(0, size - seam, size, seam);
	ctx.fillStyle = rgb([250, 240, 222], 0.55);
	ctx.fillRect(0, seam, size, Math.max(1, seam * 0.6));
	ctx.fillRect(0, size - seam * 1.6, size, Math.max(1, seam * 0.6));
	// The weave, as the cloth has it: a shade darker than the cream, so a cushion at arm's length is a
	// woven thing and not a painted one.
	for (let y = 0; y < size; y += 4) {
		ctx.fillStyle = "rgba(110,94,72,0.15)";
		ctx.fillRect(0, y, size, 1.6);
	}
	for (let x = 0; x < size; x += 4) {
		ctx.fillStyle = "rgba(255,255,255,0.09)";
		ctx.fillRect(x, 0, 1.6, size);
	}
	// And the drifts the pad really is: broad ones over the whole panel, and a fine mottle besides.
	wash(canvas, noiseField(size, 4, 2, 401), [base[0] - 26, base[1] - 22, base[2] - 16], [base[0] + 24, base[1] + 20, base[2] + 14], 0.5);
	wash(canvas, noiseField(size, 22, 3, 407), [base[0] - 14, base[1] - 12, base[2] - 10], [base[0] + 14, base[1] + 12, base[2] + 10], 0.28);
	return canvas;
}

/**
 * A woven silk rug: a rust field with a pale gold weft in it and a dark warp, and broad drifts of
 * light and dark over the whole tile so that a five-metre rug is not one flat red sheet.
 *
 * The two drifts are symmetric about `base`, which is the byte the material would be painted flat,
 * so this is a spread of the rug's own colour and not a brightening of it. The material lays one
 * repeat across 1.2 m of rug (`pattern` in materials.js), so the weave reads at about the size a
 * knot actually is and the drifts at four metres across.
 *
 * The base is dark for a reason that was not obvious: the late sun at 24° passes the eave, comes
 * through three metres of glass and lies on the room's floor as far in as the room is deep, so a rug
 * on that floor stands in open sun even though it is indoors. At the rust a rug really is —
 * [132,66,44] — Chromium painted the sunlit part of it (245,150,84): the red within ten bytes of the
 * ceiling, and the weave gone out of it. These bytes are what leaves a sunlit rug a rust colour.
 */
export function rugCanvas(size = 256, base = [104, 52, 34]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// The weft: pale gold threads thrown across, three threads to a repeat of the pattern.
	for (let y = 0; y < size; y += 3) {
		ctx.fillStyle = "rgba(198,152,98,0.13)";
		ctx.fillRect(0, y, size, 1.2);
	}
	// The warp: darker threads standing up, which is what makes a woven thing read different ways
	// along and across it.
	for (let x = 0; x < size; x += 4) {
		ctx.fillStyle = "rgba(58,24,14,0.16)";
		ctx.fillRect(x, 0, 1.4, size);
	}
	// Drifts a metre and a half across: the pile lies different ways in different parts of a rug, and
	// that is the whole of what makes a rug read as a rug and not as a red rectangle.
	wash(canvas, noiseField(size, 4, 2, 307), [base[0] - 34, base[1] - 21, base[2] - 17], [base[0] + 34, base[1] + 21, base[2] + 17], 0.45);
	wash(canvas, noiseField(size, 26, 3, 311), [base[0] - 17, base[1] - 11, base[2] - 9], [base[0] + 17, base[1] + 11, base[2] + 9], 0.25);
	return canvas;
}

/** Pale sandstone for the pool edge and steps. */
/**
 * The pale stone that caps the pool's edge. One stone to a repeat, joints and all, because the coping
 * pieces wear their pattern at half a metre to a repeat (`patternMetres` in materials.js) and a stone
 * edge with nothing but grain in it reads as one long pale bar: measured on the start view, where this
 * is the nearest ground, a stretch of it differed between 8 x 8 pixel blocks by 2.7 of light.
 */
export function copingCanvas(size = 256, cells = 1) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	// The joint first, then the stone laid on top of it with a margin: what shows at the margin is the
	// shadow the stone's own arris throws into the groove, which is why it is the stone's colour darkened
	// and not black.
	ctx.fillStyle = "#7d7466";
	ctx.fillRect(0, 0, size, size);
	const rand = randomGenerator(217);
	const step = size / cells;
	const inset = size * 0.022;
	for (let gy = 0; gy < cells; gy++) {
		for (let gx = 0; gx < cells; gx++) {
			const tone = 0.94 + rand() * 0.12;
			ctx.fillStyle = `rgb(${Math.round(206 * tone)},${Math.round(195 * tone)},${Math.round(175 * tone)})`;
			ctx.fillRect(gx * step + inset, gy * step + inset, step - inset * 2, step - inset * 2);
		}
	}
	// Clouds of pale and dull mineral ten-odd centimetres across — the weather that got at the stone —
	// then the sand grain, then the flecks.
	const blotch = ridgeField(size, 5, 3, 223);
	wash(canvas, blotch, [158, 148, 130], [234, 226, 208], 0.26);
	const grain = noiseField(size, 72, 4, 211);
	wash(canvas, grain, [166, 154, 134], [228, 220, 202], 0.42);
	for (let i = 0; i < 700; i++) {
		ctx.fillStyle = `rgba(${90 + rand() * 90},${84 + rand() * 84},${72 + rand() * 72},${0.12 + rand() * 0.2})`;
		ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
	}
	return canvas;
}

/**
 * The water's own skin. A pool is remembered as turquoise, and a pool that only mirrors the sky
 * turns the colour of the sunset and stops looking like somewhere you could swim. So the water
 * is given colour of its own: deep turquoise with a net of pale moving light across it.
 * The same field makes its bump, so the light and the waves agree with each other.
 */
function waterField(size) {
	const ridges = ridgeField(size, 6, 3, 251);
	const ridges2 = ridgeField(size, 11, 3, 257);
	const broad = noiseField(size, 5, 3, 263);
	const field = new Float32Array(size * size);
	for (let i = 0; i < field.length; i++) {
		const net = Math.pow(Math.min(1, ridges[i] * 0.8 + ridges2[i] * 0.5), 2.4);
		field[i] = Math.min(1, net * 0.8 + broad[i] * 0.34);
	}
	return field;
}

export function poolWaterCanvas(size = 512) {
	const canvas = canvasOfSize(size);
	paintField(canvas, waterField(size), (v) => {
		const t = Math.max(0, Math.min(1, v));
		// The red floor was lifted from 18 to 40. Water with no red in it is ink: the pool is the biggest
		// single thing in the first view a visitor sees, and a sunlit pool in the afternoon has the sky's
		// warmth in it. Green and blue are untouched, so this only warms the water, it does not brighten it.
		return [40 + t * 124, 104 + t * 116, 132 + t * 100];
	});
	return canvas;
}

/**
 * The wall between the cells of a honeycomb of scattered points: a cellular net.
 *
 * For every pixel the two nearest points are found, and the pixel is bright in proportion to how much
 * nearer the nearest is than the second nearest. That difference is nought along the line that divides
 * two cells and grows away from it, so what comes out is a net of lines round cells of uneven size —
 * which is the shape a caustic net has, and the shape nothing else in this file makes. Value noise,
 * whatever it is ridged and pow'd with, keeps the square lattice it was grown on: nine cells to a tile
 * of value noise ridged and sharpened is a grid of rounded squares, and that is what the pool's floor
 * used to wear (`causticsCanvas` for the fault it made).
 *
 * `jitter` is how far a point may wander out of its own cell, in cells: at 1.25 the lattice is broken
 * enough to read as scattered and the cells are still about `cells` to a tile. `wide` is the line's
 * thickness in cells and `sharp` how hard its edges are pinched. Pass `warpX` and `warpY` (pixel
 * offsets, same length as the field) to bend the net: see `causticsCanvas` for why.
 *
 * The points wrap at the tile's edges and so does the search, which makes the net seamless: the far
 * half of a cell whose point stands on the edge is painted along the near edge too.
 */
function cellNetField(size, cells, { jitter = 1.25, seed = 1, wide = 0.3, sharp = 1.7, warpX = null, warpY = null } = {}) {
	const step = size / cells;
	const rand = randomGenerator(seed);
	const px = new Float32Array(cells * cells);
	const py = new Float32Array(cells * cells);
	for (let cy = 0; cy < cells; cy++) {
		for (let cx = 0; cx < cells; cx++) {
			px[cy * cells + cx] = (cx + 0.5 + (rand() - 0.5) * jitter) * step;
			py[cy * cells + cx] = (cy + 0.5 + (rand() - 0.5) * jitter) * step;
		}
	}
	const out = new Float32Array(size * size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const i = y * size + x;
			let sx = x + 0.5;
			let sy = y + 0.5;
			if (warpX) {
				sx += warpX[i];
				sy += warpY[i];
			}
			const cx = Math.floor(sx / step);
			const cy = Math.floor(sy / step);
			let near = Infinity;
			let second = Infinity;
			for (let by = cy - 1; by <= cy + 1; by++) {
				const wy = ((by % cells) + cells) % cells;
				for (let bx = cx - 1; bx <= cx + 1; bx++) {
					const wx = ((bx % cells) + cells) % cells;
					// The point of the wrapped cell, stood back where that cell actually is.
					const dx = px[wy * cells + wx] + (bx - wx) * step - sx;
					const dy = py[wy * cells + wx] + (by - wy) * step - sy;
					const d = dx * dx + dy * dy;
					if (d < near) {
						second = near;
						near = d;
					} else if (d < second) {
						second = d;
					}
				}
			}
			const gap = (Math.sqrt(second) - Math.sqrt(near)) / step;
			out[i] = Math.pow(Math.max(0, 1 - gap / wide), sharp);
		}
	}
	return out;
}

/**
 * Caustics: the net of bright lines the pool floor shows when the surface moves.
 *
 * It has been two shapes and both were wrong. First two soft ridge fields at seven and eleven cells,
 * pow'd at 2.2 — a pale blot the size of a dinner plate, and a browser called it crumpled foil
 * (`pictures/tmp-wc-01.png`: soft blobs and no floor under them). Then two SHARPENED ridge fields at
 * nine and sixteen cells, which gave the net of thin lines a caustic actually has and one more thing
 * nobody asked for: a grid. A ridged value field keeps the square lattice it grew on, so the net was a
 * lattice of rounded squares — and at sixteen cells to a metre-and-a-quarter repeat its lines stood
 * 7.8 cm apart against the mosaic's 6.7 cm tiles, two square grids within a centimetre of one another
 * and in register with the pool's own axes. The start view came out as graph paper (`pictures
 * /s67-grid-before.png`, the pool at six metres: a wire frame over the tiles).
 *
 * So the net is a cellular one now (`cellNetField`): cells of uneven size, lines that wander, and
 * pitches — 18 cm and 11 cm — nowhere near the tile's. Two nets are laid together, a coarse one and a
 * finer one at half the weight, because a real net has lines splitting off and rejoining. `bend` is how
 * far the sampling wanders sideways, in pixels: it is filled from a seamless field, so the net is bent
 * and still tiles, and no straight run of it can line up with a course of mosaic. `patch` is how much
 * the light sinks in places — a pool's floor is not lit evenly, the surface focuses the sun into bright
 * bands and leaves bands dark — and it is a slow field, so the brightness of the net rises and falls
 * over four or five cells rather than flickering at every crossing.
 *
 * Pale aqua, not warm white: warm light on water reads as mud.
 */
export function causticsCanvas(size = 256, { cells = 7, cells2 = 11, wide = 0.3, wide2 = 0.26, sharp = 1.7, seed = 231, bend = 26, patch = 0.45 } = {}) {
	const canvas = canvasOfSize(size);
	// One bend for both nets: it is the same sheet of water doing the bending.
	const bendX = noiseField(size, 3, 2, seed + 7);
	const bendY = noiseField(size, 3, 2, seed + 19);
	const warpX = new Float32Array(size * size);
	const warpY = new Float32Array(size * size);
	for (let i = 0; i < warpX.length; i++) {
		warpX[i] = (bendX[i] - 0.5) * bend;
		warpY[i] = (bendY[i] - 0.5) * bend;
	}
	const one = cellNetField(size, cells, { seed, wide, sharp, warpX, warpY });
	const two = cellNetField(size, cells2, { seed: seed + 37, wide: wide2, sharp, warpX, warpY });
	const light = noiseField(size, 4, 2, seed + 911);
	const field = new Float32Array(size * size);
	for (let i = 0; i < field.length; i++) {
		field[i] = Math.min(1, (one[i] + two[i] * 0.55) * (1 - patch + patch * light[i] * 1.6));
	}
	paintField(canvas, field, (v) => {
		const s = 255 * Math.min(1, v);
		return [s * 0.68, s * 0.96, s];
	});
	return canvas;
}

/**
 * The water surface's own waves, as a bump map.
 *
 * A flat water sheet is a flat mirror: the sun comes back off it as one blown disk and the sky as one
 * grey wash (the twenty-first session's bucket of milk). A few centimetres of chop is what turns that
 * disk into a field of sparkle and the wash into something that moves, so the surface gets a bump of its
 * own: a broad swell, two trains of it crossing at a shallow angle, and a fine chop worked into both.
 * The sine trains run a whole number of waves to the tile and the noise is seamless, so the pattern joins
 * up across the pool however `patternMetres` lays it.
 */
export function rippleCanvas(size = 256, { strength = 9, seed = 601 } = {}) {
	const swell = noiseField(size, 12, 3, seed);
	const chop = noiseField(size, 40, 2, seed + 11);
	const field = new Float32Array(size * size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const i = y * size + x;
			const u = (x / size) * Math.PI * 2;
			const v = (y / size) * Math.PI * 2;
			const s1 = 0.5 + 0.5 * Math.sin(u * 5 + v * 2 + swell[i] * 3.1);
			const s2 = 0.5 + 0.5 * Math.sin(u * -2 + v * 6 + chop[i] * 2.3);
			field[i] = Math.min(1, 0.42 * swell[i] + 0.22 * s1 + 0.15 * s2 + 0.28 * chop[i]);
		}
	}
	return bumpFromField(field, size, strength);
}

/**
 * A bump map made from a painted pattern: the pattern's brightness is read as height, so grout
 * sits in its grooves and planks in their ridges. Only differences matter, so a dark pattern
 * needs a stronger push than a pale one.
 */
/** A copy of a painted canvas drawn down (or up) to another size, cheaply, in the browser's own 2d. */
function shrinkCanvas(source, size) {
	const out = canvasOfSize(size);
	context2d(out).drawImage(source, 0, 0, size, size);
	return out;
}

export function bumpFromCanvas(source, strength = 26, toSize = 0) {
	// A bump made from a big colour canvas is a second canvas of that size to build, to mip and to
	// upload — and for a lawn, where the relief is a blade's width, that is paid for nothing. Given
	// `toSize` the pattern is drawn down first: one scaled draw instead of a million pixels of slope.
	if (toSize && toSize !== source.width) source = shrinkCanvas(source, toSize);
	const size = source.width;
	const image = context2d(source).getImageData(0, 0, size, size).data;
	const field = new Float32Array(size * size);
	for (let i = 0; i < size * size; i++) field[i] = (0.2126 * image[i * 4] + 0.7152 * image[i * 4 + 1] + 0.0722 * image[i * 4 + 2]) / 255;
	return bumpFromField(field, size, strength);
}

/** A bump map made from plain noise, for surfaces whose pattern carries no height worth reading. */
export function bumpCanvas(size = 256, cells = 16, seed = 401, strength = 12, octaves = 4) {
	return bumpFromField(noiseField(size, cells, octaves, seed), size, strength);
}

/** A flat grey noise map, used for roughness: it stops big smooth surfaces reading as plastic. */
export function greyNoiseCanvas(size = 256, cells = 24, seed = 301, low = 0.55, high = 1) {
	const canvas = canvasOfSize(size);
	const field = noiseField(size, cells, 4, seed);
	return paintField(canvas, field, (v) => {
		const s = 255 * (low + (high - low) * v);
		return [s, s, s];
	});
}

/** A clipped hedge: a mass of small leaves, most of them in the mass's own shade. */
/**
 * The far tree line and the hills: what a wood looks like once the haze has had it. Not leaves and
 * not rock — soft masses of a little more and a little less, with a fine speckle over the top of them
 * which is the crowns themselves seen at a hundred and twenty metres.
 *
 * Painted grey on purpose. The colour belongs to the material (`materials.js` paints that in bytes);
 * a colour painted here as well would be counted twice. What this canvas spends its bytes on is the
 * one thing the material cannot do on its own: variation. A flat far line reads as a painted board
 * against the sky, which is exactly the fault it was built to be.
 */
export function distanceCanvas(size = 256, { masses = 7, speckle = 44, seed = 511, low = 150, high = 255 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = "#eef1f2";
	ctx.fillRect(0, 0, size, size);
	// The big masses: which part of the far wood is nearer, which is further, which is a clearing.
	const broad = noiseField(size, masses, 3, seed);
	wash(canvas, broad, [low, low + 6, low + 10], [high, high, high], 0.62);
	// The speckle: one tree top against the next. At this distance that is all the detail there is.
	const fine = noiseField(size, speckle, 2, seed + 7);
	wash(canvas, fine, [low + 38, low + 44, low + 46], [255, 255, 255], 0.26);
	return canvas;
}

/**
 * How the belt's near rank is inked: `cols` clusters across a canvas `size` pixels square, and one
 * cluster worth `cluster` metres of crown. `canopyClusterCanvas` paints the atlas and `cardRank` in
 * src/world.js cuts cards to it; both read these three numbers, which is the only reason they can
 * agree about where one cluster ends.
 */
export const canopyAtlas = { size: 1024, cols: 4, cluster: 2 };

/**
 * The skin of the NEAR rank of the belt: an atlas of leaf clusters, every one of them cut to rags.
 *
 * What this replaces was one seamless tile of big leaf, laid at two metres and six tenths of crown
 * to a repeat, with each card given its own window on it wherever the window happened to fall. That is
 * what put a straight line through the wood: a card is a flat sheet and the tile is inked edge to edge,
 * so the sheet's own border cuts across whatever leaf it falls on, and ten metres off a visitor at the
 * south hedge was looking at two-and-a-half metre straight edges with black air behind them
 * (`pictures/48-near-south.png`, `pictures/s50-near-south.png`). Painting harder over the seam cannot
 * help, because the seam is the CARD and not the canvas.
 *
 * So this canvas is not one tile. It is `cols` by `cols` separate clusters — heads of leaf, each with
 * air all round it — and a card is inked with exactly ONE of them, which is why the border of a card
 * falls in air and has nothing there to be cut: the outline a visitor sees is the outside leaves of the
 * cluster, nibbled leaf by leaf. The layout is `canopyAtlas` above so the painter and the cutter cannot
 * disagree about it.
 *
 * Inside one cluster, outwards:
 *
 *   mass   the leaf that never sees the sky: one wobbled daub about half the cluster across, the
 *          darkest green here, and the thing that stops a crown being see-through
 *   twig   three to five brown strokes out of the middle of it, so the mass has a structure in it and
 *          not only a tone, and so there is brown in a canopy the way there is brown in a canopy
 *   leaf   ninety ellipses, 20 to 36 cm across — a leaf, at the near rank twenty-five to fifty pixels of
 *          the screen — thrown out from the middle to the rim: the deep ones under, the mid ones over
 *          them, the sun leaves last and outermost. They lean outwards, but only mostly: a cluster whose
 *          every leaf points at the sky is a flower and not a head of leaf
 *   tip    a handful of leaves on the rim brighter than everything under them, so a crown has lit tips
 *          and does not read as one flat tone with a dark foot
 *
 * No two clusters are alike: the count, the lean, the elongation, the tone, the wobble and the rim all
 * come off the generator in the order they are painted. `cardRank` then hangs each cluster at one of
 * eight orientations and at its own size, so sixteen clusters make a hundred and twenty-eight different
 * cards before the roll and the tilt of the card are counted at all — which is the standing lesson
 * about a stamp, learnt the hard way on the far rank (`pictures/47-crop-hill.png`).
 *
 * Nothing crosses a cell: every leaf sits wholly inside its own square, so no neighbour can bleed into
 * it and the texture can be clamped instead of wrapped.
 */
export function canopyClusterCanvas(size = canopyAtlas.size, { cols = canopyAtlas.cols, cluster = canopyAtlas.cluster, seed = 2903, leaves = 92, tips = 8, twigs = 4 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const cell = size / cols; // pixels of canvas in one cluster
	const m = cell / cluster; // pixels of canvas per metre of crown
	const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

	// The tones of leaf. These are the bytes the old tile kept its mean inside, with the floor of the
	// dark end lifted: a canopy's inside IS dark, but a browser was painting the inside of these crowns
	// at (5,17,1) — a hole in the wood and not the shade inside one — and `tools/cover.js` on the camera
	// `0,1.6,20,0,0.05` is where that was read.
	const deep = () => [50 + rand() * 18, 86 + rand() * 20, 33 + rand() * 12];
	const mid = () => [64 + rand() * 22, 106 + rand() * 26, 38 + rand() * 16];
	const sun = () => [114 + rand() * 26, 176 + rand() * 30, 68 + rand() * 20];
	const young = () => [138 + rand() * 24, 214 + rand() * 24, 88 + rand() * 18];
	const massTone = () => [46 + rand() * 14, 78 + rand() * 16, 34 + rand() * 10];

	// One leaf: an ellipse, its own midrib where it is owed one, and a shadow of itself laid a hand's
	// breadth below and to the right, which is what makes a heap of leaf look like a heap and not a
	// stencil. Drawn in the cluster's own frame, which the caller has already turned and squashed.
	const leaf = (x, y, len, wide, lean, colour, alpha, { shadow = true, rib = false } = {}) => {
		if (shadow) {
			// Under the cut-off on purpose (0.3 against the cards' 0.42): a shadow lying on a leaf darkens
			// it, and a shadow lying on air holds nothing up. A leaf's own body is what keeps the silhouette.
			ctx.save();
			ctx.translate(x + len * 0.05, y + len * 0.09);
			ctx.rotate(lean);
			ctx.fillStyle = "rgba(9,17,6,0.3)";
			ctx.beginPath();
			ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(lean);
		ctx.fillStyle = rgb(colour, alpha);
		ctx.beginPath();
		ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
		ctx.fill();
		if (rib) {
			// Either lighter or darker than its own face, whichever the leaf is: a canopy lit from behind
			// has leaves whose spine is a dark line, and a sunlit one has a pale one.
			const lift = rand() < 0.5 ? -1 : 1;
			ctx.strokeStyle = rgb([colour[0] + lift * 26, colour[1] + lift * 30, colour[2] + lift * 14], alpha * 0.5);
			ctx.lineWidth = Math.max(1, wide * 0.1);
			ctx.beginPath();
			ctx.moveTo(-len / 2 + 2, 0);
			ctx.lineTo(len / 2 - 2, 0);
			ctx.stroke();
		}
		ctx.restore();
	};

	for (let cj = 0; cj < cols; cj++) {
		for (let ci = 0; ci < cols; ci++) {
			const cx = (ci + 0.5) * cell + (rand() - 0.5) * cell * 0.06;
			const cy = (cj + 0.5) * cell + (rand() - 0.5) * cell * 0.06;
			// One tree's head against the next: this one pale and sun-yellow, that one a shade darker.
			const tone = 0.84 + rand() * 0.34;
			const squash = 0.7 + rand() * 0.3; // a cluster is longer one way than the other
			const tilt = rand() * Math.PI;
			const w = [rand() * 6.283, rand() * 6.283, rand() * 6.283];
			const tint = (base) => [base[0] * tone, base[1] * tone * (1 + (tone - 1) * 0.3), base[2] * tone * (1 - (tone - 1) * 0.2)];
			// A leaf may sit anywhere inside this radius of the middle, and it is short enough that the
			// widest of them still keeps a finger's width of air to the cell border. The leaf mass therefore
			// fills about four fifths of the cell, and a card cut to this cell is leaf to within a hand's
			// width of its own border — which is the whole point: there is nothing out there to be cut straight.
			const reach = cell * (0.36 + rand() * 0.035);

			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(tilt);
			ctx.scale(1, squash);

			// The mass behind the leaf: one wobbled daub, the darkest green in the atlas, and the floor
			// the leaves are thrown on. Without it a crown is a sieve and the sky gets clean through it.
			const rmass = reach * (0.8 + rand() * 0.16);
			ctx.fillStyle = rgb(massTone(), 1);
			ctx.beginPath();
			for (let k = 0; k <= 22; k++) {
				const a = (k / 22) * Math.PI * 2;
				const r =
					rmass *
					(1 + 0.14 * Math.sin(3 * a + w[0]) + 0.09 * Math.sin(5 * a + w[1]) + 0.05 * Math.sin(9 * a + w[2]));
				const px = Math.cos(a) * r;
				const py = Math.sin(a) * r;
				if (k === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fill();

			// The twigs, so there is a structure in the mass and a direction to read.
			for (let t = 0; t < twigs; t++) {
				const bearing = rand() * Math.PI * 2;
				const run = rmass * (0.9 + rand() * 0.7);
				const bend = (rand() - 0.5) * 0.9;
				ctx.strokeStyle = `rgba(${Math.round(58 + rand() * 22)},${Math.round(44 + rand() * 16)},${Math.round(26 + rand() * 12)},0.85)`;
				ctx.lineWidth = Math.max(1.2, cell * 0.014);
				ctx.beginPath();
				ctx.moveTo(Math.cos(bearing) * rmass * 0.15, Math.sin(bearing) * rmass * 0.15);
				ctx.quadraticCurveTo(
					Math.cos(bearing + bend * 0.5) * run * 0.6,
					Math.sin(bearing + bend * 0.5) * run * 0.6,
					Math.cos(bearing + bend) * run,
					Math.sin(bearing + bend) * run
				);
				ctx.stroke();
			}

			// The leaf, three passes deep to lit. Each pass takes its own band of radii, so the deep
			// green is what shows between the crowns and the lit leaf is what stands out against the sky.
			const pass = (count, base, from, to, leanSpread) => {
				for (let i = 0; i < count; i++) {
					const a = rand() * Math.PI * 2;
					const r = cell * (from + (to - from) * Math.sqrt(rand()));
					const x = Math.cos(a) * r;
					const y = Math.sin(a) * r;
					const len = cell * (0.1 + rand() * 0.08) * (1 - 0.18 * (r / cell));
					const lean = a + (rand() - 0.5) * leanSpread + (rand() - 0.5) * 0.4;
					leaf(x, y, len, len * (0.3 + rand() * 0.26), lean, tint(base()), 0.97, { rib: rand() < 0.22 });
				}
			};
			pass(Math.round(leaves * 0.36), deep, 0, reach / cell - 0.1, 2.6);
			pass(Math.round(leaves * 0.42), mid, 0, reach / cell - 0.06, 2.0);
			pass(Math.round(leaves * 0.22), sun, (reach / cell) * 0.3, reach / cell, 1.5);

			// The rim: the few leaves that see the sky before anything else does.
			for (let i = 0; i < tips; i++) {
				const a = rand() * Math.PI * 2;
				const r = reach * (0.86 + rand() * 0.14);
				const len = cell * (0.1 + rand() * 0.07);
				const base = rand() < 0.3 ? young : sun;
				leaf(Math.cos(a) * r, Math.sin(a) * r, len, len * (0.3 + rand() * 0.24), a + (rand() - 0.5) * 0.8, tint(base()), 0.97, { rib: rand() < 0.4 });
			}
			ctx.restore();
		}
	}
	return canvas;
}

/**
 * The skin of a wood seen from twenty-six metres away and further: crowns, and not leaves.
 *
 * `canopyClusterCanvas` is a head of leaf about two metres across, and laid one cluster to a card it is the
 * right size for the near rank, ten to twenty metres off, where one leaf is twenty-five to fifty pixels of
 * the screen and still reads as leaf. The far rank stands twenty-six
 * to fifty-two metres beyond the hedge, and the same canvas worn there is not leaf but a STAMP: the browser
 * photographed it as rows of one identical little plant, one above the other the whole way up the curtain
 * (`pictures/47-crop-hill.png`, blown up twice). Two faults in one: every spray is the SAME SHAPE, which is
 * a thing the eye can match, and sixty-odd of them fit across one crown, which is a grid.
 *
 * What a wood shows from out there is the crown and the clump, and the leaf only as grain: heads six to
 * twelve metres across, each a slightly different tone and lit on one side, each carrying a thousand clumps
 * of leaf, dark where one crown hangs over the next. So this tile is laid at four scales:
 *
 *   crowns    half a tile to one: the tone of one tree's head against the next — value noise, no shape
 *   clumps    a fifth to a tenth of a tile: a branch's worth of leaf — value noise again
 *   leaf      six hundred clusters of three to seven ellipses each, a fifth of a metre to a metre and a
 *             half across: this is the grain, and it is drawn and not noised because value noise at that
 *             scale is a smooth blur, and the screen showed one (`pictures/47-crop-hill-tile12.png`)
 *   tips      a thousand single specks, two to six to a metre: the sparkle of the near end of the rank,
 *             and nothing at all at eighty metres, which is what a leaf is out there
 *
 * Nothing here is drawn twice. Every cluster takes its own number of ellipses at its own offsets, sizes and
 * angles, and its own tone, so there is no outline in this tile for an eye to catch and match against its
 * neighbour — which is the whole difference between a wood and a wallpaper.
 */
export function farCanopyCanvas(size = 384, { seed = 1301, crowns = 2, clumps = 5, clusters = 1400, spread = 0.038, tips = 1000 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
	// The mid leaf: what the washes are laid over and what the clusters are scattered across.
	ctx.fillStyle = "#3d5a25";
	ctx.fillRect(0, 0, size, size);
	// The heads of the trees, and the shade between them. Broad, and tone and nothing else: out there a
	// crown has no outline, it is a change of light over half a tile.
	wash(canvas, noiseField(size, crowns, 2, seed), [26, 42, 16], [120, 162, 76], 0.75);
	// Branches. Laid weaker than the crowns on purpose: a wash wipes the one before it away in proportion
	// to its own strength, and the first attempt at this put the crowns under a stronger branch wash and
	// the tile came back one flat blur — twenty bytes of spread across the tile, four of a point on the
	// screen, and a browser called it a hillside.
	wash(canvas, noiseField(size, clumps, 2, seed + 11), [22, 36, 13], [132, 180, 84], 0.4);
	// The three tones of leaf: the inside of a crown, the side of one, and the top where the sun gets it.
	// The deepest of them keeps green the better of red by twenty-eight bytes and not twenty-four, because
	// a pixel whose channels sit within twenty-four of one another is not counted as being in colour at all
	// by `tools/scan_old_new.js`, and a fifth of the curtain is painted with this one.
	const tones = [
		[22, 44, 15],
		[48, 84, 29],
		[96, 152, 56],
	];
	const leaf = (x, y, len, wide, lean, colour) => {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(lean);
		ctx.fillStyle = rgb(colour, 0.92);
		ctx.beginPath();
		ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	};
	// One cluster of leaf, and one only: three to seven ellipses at their own offsets, each half to a full
	// measure of the cluster's own reach. No two clusters are the same shape, and that is the point.
	const cluster = (x, y, reach, colour) => {
		const n = 3 + Math.floor(rand() * 5);
		const draw = (px, py) => {
			for (let i = 0; i < n; i++) {
				const off = rand() * reach * 0.55;
				const dir = rand() * Math.PI * 2;
				const len = reach * (0.5 + rand() * 0.7);
				leaf(px + Math.cos(dir) * off, py + Math.sin(dir) * off, len, len * (0.3 + rand() * 0.4), rand() * Math.PI, colour);
			}
		};
		draw(x, y);
		if (x < reach) draw(x + size, y);
		if (x > size - reach) draw(x - size, y);
		if (y < reach) draw(x, y + size);
		if (y > size - reach) draw(x, y - size);
	};
	for (let i = 0; i < clusters; i++) {
		// A quarter of the leaf is inside a crown and never sees the sky, half is the side of one, and the
		// rest is the top of one. The spread between these three is the spread the screen ends up with.
		const r = rand();
		const base = r < 0.25 ? tones[0] : r < 0.75 ? tones[1] : tones[2];
		const tone = 0.8 + rand() * 0.45;
		cluster(rand() * size, rand() * size, size * (0.012 + rand() * spread), [base[0] * tone, base[1] * tone, base[2] * tone]);
	}
	// The tips: nothing at eighty metres, and the difference between a mass of leaf and a mass of paint at
	// twenty-six.
	for (let i = 0; i < tips; i++) {
		const r = rand();
		const base = r < 0.34 ? tones[0] : r < 0.8 ? tones[1] : tones[2];
		const tone = 0.8 + rand() * 0.6;
		const len = size * (0.005 + rand() * 0.013);
		leaf(rand() * size, rand() * size, len, len * (0.3 + rand() * 0.5), rand() * Math.PI, [base[0] * tone, base[1] * tone, base[2] * tone]);
	}
	return canvas;
}

/**
 * The face of the boundary hedge: leaf, and not a knit.
 *
 * What this replaces was two noise washes — six clumps to a repeat and sixty-four speckles to it, at a
 * metre and a tenth of hedge to a repeat. At that size a clump is eighteen centimetres and a speckle
 * seventeen millimetres, and a browser standing three metres off drew exactly what it was told: a green
 * stockinette, machine-knit, with a pattern that could not be seen at all from twenty metres away
 * because the speckle was one pixel wide there (`pictures/1914-southborder.png`,
 * `pictures/1912-eastlawn.png`). A hedge is a plant, and what a person sees on it is ten thousand small
 * leaves each throwing its own little shade, gathered into the sweeps a pair of shears left behind.
 *
 * So this paints leaves and their clumps, and nothing else:
 *
 *   clump   four to a repeat — thirty-five centimetres of hedge — which is the size one sweep of the
 *           shears stands proud of the next, and the size a hedge face is read at from the far lawn
 *   leaf    4-7 cm, thumb-width, each with its own midrib and its own shade laid under it; eleven hundred
 *           of them to a repeat, so the face is a heap of leaf and not a wash with dots on it
 *   tip     the two hundred and forty that catch the sun, painted last and outermost
 *   weather a broad light-and-dark a metre and a half across, so that one repeat of the tile is not
 *           obviously the same repeat as the one four metres down the run
 *
 * One repeat covers `repeat` metres of hedge face. The mean is held where the washes left it — about
 * (73,107,47) in the canvas's own bytes — because the hedge is the biggest green mass in half the
 * standing views and this is a shape change and not a lighting one.
 */
export function hedgeCanvas(size = 512, { repeat = 1.4, leaves = 1100, tips = 240, seed = 251 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const m = size / repeat; // pixels of canvas per metre of hedge
	ctx.fillStyle = "#37622c";
	ctx.fillRect(0, 0, size, size);
	// The sweeps of the shears, before any leaf is on them.
	const clumps = noiseField(size, 4, 3, seed);
	wash(canvas, clumps, [34, 66, 28], [116, 152, 66], 0.55);
	// One leaf: an ellipse, a midrib down its own middle, and a shade of itself laid a finger below,
	// which is what makes a heap of leaf read as a heap. Painted again over any edge it straddles, so the
	// tile joins with no cut in it.
	const leaf = (x, y, len, wide, lean, base, tone) => {
		const draw = (px, py) => {
			ctx.save();
			ctx.translate(px + len * 0.04, py + len * 0.07);
			ctx.rotate(lean);
			ctx.fillStyle = `rgba(10,20,7,0.34)`;
			ctx.beginPath();
			ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(lean);
			ctx.fillStyle = `rgb(${Math.round(base[0] * tone)},${Math.round(base[1] * tone)},${Math.round(base[2] * tone)})`;
			ctx.beginPath();
			ctx.ellipse(0, 0, len / 2, wide / 2, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = `rgba(${Math.round(base[0] * tone * 1.5)},${Math.round(base[1] * tone * 1.45)},${Math.round(base[2] * tone * 1.4)},0.4)`;
			ctx.lineWidth = Math.max(1, wide * 0.16);
			ctx.beginPath();
			ctx.moveTo(-len / 2 + 1.5, 0);
			ctx.lineTo(len / 2 - 1.5, 0);
			ctx.stroke();
			ctx.restore();
		};
		const reach = len * 0.6;
		draw(x, y);
		if (x < reach) draw(x + size, y);
		if (x > size - reach) draw(x - size, y);
		if (y < reach) draw(x, y + size);
		if (y > size - reach) draw(x, y - size);
	};
	// The leaf itself. Deep leaf, mid leaf and lit leaf, and every one of them paid up or down a little by
	// itself: a hedge whose ten thousand leaves are one tone is one green with dots on it.
	const classes = [
		[46, 74, 30],
		[66, 102, 42],
		[96, 136, 56],
	];
	for (let i = 0; i < leaves; i++) {
		const r = rand();
		const base = r < 0.3 ? classes[0] : r < 0.78 ? classes[1] : classes[2];
		const tone = 0.72 + rand() * 0.6;
		const len = m * (0.04 + rand() * 0.03);
		leaf(rand() * size, rand() * size, len, len * (0.4 + rand() * 0.24), rand() * Math.PI, base, tone);
	}
	for (let i = 0; i < tips; i++) {
		const tone = 1.1 + rand() * 0.4;
		const len = m * (0.038 + rand() * 0.026);
		leaf(rand() * size, rand() * size, len, len * (0.4 + rand() * 0.22), rand() * Math.PI, classes[2], tone);
	}
	// The weather: light and dark a metre and a half across. Without it the hedge repeats in one tone the
	// whole sixty metres of the run, and a repeat in one tone is a fence.
	const broad = noiseField(size, 2, 3, seed + 17);
	wash(canvas, broad, [36, 56, 25], [98, 130, 60], 0.2);
	return canvas;
}

/**
 * Scatters small dots over a canvas - grit in clay, mica in a rock, perlite in potting soil.
 * `kind` says the shape of each fleck: a dot, or a short dash laid at a random lean.
 */
function specks(canvas, count, seed, palette, { min = 0.7, max = 1.9, alpha = 0.5, kind = "dot" } = {}) {
	const size = canvas.width;
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	ctx.lineCap = "round";
	for (let i = 0; i < count; i++) {
		const colour = palette[Math.floor(rand() * palette.length)];
		const x = rand() * size;
		const y = rand() * size;
		const r = min + rand() * (max - min);
		ctx.fillStyle = `rgba(${colour[0]},${colour[1]},${colour[2]},${alpha * (0.6 + rand() * 0.5)})`;
		if (kind === "dash") {
			const lean = (rand() - 0.5) * 1.2;
			const length = r * (2.4 + rand() * 3);
			ctx.strokeStyle = ctx.fillStyle;
			ctx.lineWidth = r;
			ctx.beginPath();
			ctx.moveTo(x - length * 0.5, y - lean * length * 0.5);
			ctx.lineTo(x + length * 0.5, y + lean * length * 0.5);
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.ellipse(x, y, r, r * (0.7 + rand() * 0.6), rand() * 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	return canvas;
}

/**
 * The timber the furniture is made of: lounger frames, deck chairs, the bench, the railing, the
 * table tops. Oiled teak that has stood out of doors, so it is not one colour: sun and rain take
 * the oil out of the exposed faces and leave them pale and grey, while the faces kept out of the
 * weather stay dark and warm. Grain runs along the length of the piece, and there is a knot or two.
 *
 * This is the third of the Villa's three woods, and the warmest of them: the deck weathers grey, the
 * structure is a dark grey-brown, and furniture is oiled every season, so it keeps its honey and sits a
 * shade brighter than the boards it stands on. Photographed before this it came out (224,143,75) in the
 * sun — the brightest thing in the frame after the coping, and the same orange as the wall behind it.
 *
 * The middle byte is the colour this material used to be painted flat, [150,104,62], moved by the same
 * ladder that moved the two teaks (see `teakCanvas`): times [0.8, 0.8, 1.1] in light, which is
 * [135,94,65] in bytes. Everything else is spread about that middle, so a chair that changes pattern
 * does not change brightness.
 */
export function timberCanvas(size = 256, base = [135, 94, 65]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(411);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// Weather first, and big: silvered grey where the sun and the rain get at the wood, dark and oily
	// where they do not. Three blotches across a tile and nearly the whole way from one to the other,
	// because a chair 5 m off is sixty pixels across and the engine shrinks a pattern down to a mip of
	// its own average long before that. The first draw of this pattern was all grain and no weather,
	// and it vanished: the same sunlit chair seat with it and without it came out the same colour.
	const weather = noiseField(size, 3, 2, 401);
	wash(canvas, weather, [base[0] - 62, base[1] - 50, base[2] - 38], [base[0] + 34, base[1] + 48, base[2] + 54], 0.55);
	// the same story a second scale down, so the big blotches are not blobs
	const patches = noiseField(size, 8, 2, 411);
	wash(canvas, patches, [base[0] - 30, base[1] - 22, base[2] - 14], [base[0] + 26, base[1] + 44, base[2] + 56], 0.4);
	// long grain: streaks that wander along the length of the board, for when you stand over it
	for (let s = 0; s < 70; s++) {
		const y = rand() * size;
		const dark = rand() > 0.45;
		ctx.strokeStyle = dark ? `rgba(59,35,23,${0.1 + rand() * 0.18})` : `rgba(194,181,180,${0.08 + rand() * 0.16})`;
		ctx.lineWidth = 1 + rand() * 2.6;
		ctx.beginPath();
		let x = 0;
		let cursor = y;
		ctx.moveTo(x, cursor);
		while (x < size) {
			x += 22 + rand() * 50;
			cursor = y + (rand() - 0.5) * 5;
			ctx.lineTo(x, cursor);
		}
		ctx.stroke();
	}
	// two or three knots: the grain closes up and goes dark where a branch was
	for (let k = 0; k < 3; k++) {
		const kx = rand() * size;
		const ky = rand() * size;
		for (let ring = 5; ring >= 1; ring--) {
			ctx.strokeStyle = `rgba(50,28,17,${0.1 + (5 - ring) * 0.06})`;
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			ctx.ellipse(kx, ky, ring * 2.6, ring * 1.5, 0.2, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	// the tooth of sanded wood
	const tooth = noiseField(size, 40, 3, 431);
	wash(canvas, tooth, [base[0] - 20, base[1] - 15, base[2] - 10], [base[0] + 18, base[1] + 14, base[2] + 8], 0.22);
	return canvas;
}

/**
 * A terracotta pot: the clay itself, the rings the wheel left on it, and the weathering a pot out
 * of doors always has - pale mineral crust where the water has wicked out and dried, and the dark
 * damp of the bottom inch, which never dries off. The bytes are the flat colour the material used
 * to wear, spread about instead of replaced.
 */
export function terracottaCanvas(size = 256, base = [176, 118, 78]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(451);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// how the clay came out of the kiln: three or four patches the size of a hand, some overfired and
	// pale, some dark, which is what a terracotta pot looks like from a terrace chair
	const fired = noiseField(size, 3, 3, 441);
	wash(canvas, fired, [base[0] - 58, base[1] - 46, base[2] - 34], [base[0] + 42, base[1] + 46, base[2] + 40], 0.55);
	// the rings the wheel left: bands across the pot, each a little lighter or darker than its neighbour
	for (let y = 0; y < size; ) {
		const h = 5 + rand() * 9;
		const tone = 0.88 + rand() * 0.26;
		ctx.fillStyle = `rgba(${Math.round(base[0] * tone)},${Math.round(base[1] * tone)},${Math.round(base[2] * tone)},0.45)`;
		ctx.fillRect(0, y, size, h);
		ctx.fillStyle = "rgba(74,38,20,0.2)";
		ctx.fillRect(0, y + h, size, 1.6);
		y += h + 1.6;
	}
	// grit in the clay, and the little pale and dark flecks a fired pot's surface is made of
	specks(canvas, 700, 461, [[214, 176, 140], [126, 76, 46], [196, 150, 116], [96, 54, 32]], { min: 0.6, max: 1.8, alpha: 0.4 });
	// the weathering: mineral crust high up where water has run and dried, and the damp dark at the foot
	const crust = ctx.createLinearGradient(0, 0, 0, size * 0.3);
	crust.addColorStop(0, "rgba(228,216,194,0.55)");
	crust.addColorStop(1, "rgba(228,216,194,0)");
	ctx.fillStyle = crust;
	ctx.fillRect(0, 0, size, size * 0.3);
	const damp = ctx.createLinearGradient(0, size * 0.72, 0, size);
	damp.addColorStop(0, "rgba(44,28,18,0)");
	damp.addColorStop(1, "rgba(44,28,18,0.6)");
	ctx.fillStyle = damp;
	ctx.fillRect(0, size * 0.72, size, size * 0.28);
	const tooth = noiseField(size, 48, 3, 471);
	wash(canvas, tooth, [base[0] - 18, base[1] - 15, base[2] - 12], [base[0] + 16, base[1] + 14, base[2] + 10], 0.2);
	return canvas;
}

/**
 * The garden boulders: granite, which is a salt-and-pepper stone - a grey ground with pale quartz
 * and dark mica in it, veins of quartz across it, and crusty grey-green lichen on the weather side.
 * The bytes are near the flat colour the material used to wear, spread about instead of replaced,
 * and eight bytes above it: with the middle at [138,130,118] the lit face of the west boulder came
 * out of Chromium at L201 where the same face flat stood at L206, because a pattern's own average,
 * put through the tone curve the Villa runs on, is not the flat colour put through it. The middle
 * was lifted to get those five points back.
 */
export function rockCanvas(size = 256, base = [146, 138, 126]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(481);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// the stone's own masses: which part of it has weathered light and which lies dark. Fist-sized and
	// bigger, because that is what is left of a boulder when you are standing on the terrace.
	const masses = noiseField(size, 3, 3, 481);
	wash(canvas, masses, [base[0] - 62, base[1] - 62, base[2] - 58], [base[0] + 62, base[1] + 58, base[2] + 50], 0.75);
	// lichen: a grey-green crust over one side of it, and a darker one in the hollows
	const lichen = noiseField(size, 5, 2, 501);
	wash(canvas, lichen, [base[0] - 56, base[1] - 46, base[2] - 52], [base[0] + 46, base[1] + 54, base[2] + 34], 0.42);
	// quartz veins: a pale line or two, wandering, that the whole stone was cracked along
	for (let v = 0; v < 3; v++) {
		ctx.strokeStyle = `rgba(210,206,196,${0.2 + rand() * 0.2})`;
		ctx.lineWidth = 2 + rand() * 3;
		ctx.beginPath();
		let x = 0;
		let y = rand() * size;
		ctx.moveTo(x, y);
		while (x < size) {
			x += 18 + rand() * 40;
			y += (rand() - 0.4) * 22;
			ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
	// the salt and pepper of it: quartz, feldspar and mica
	specks(canvas, 1200, 491, [[220, 216, 206], [186, 160, 142], [58, 54, 50], [98, 92, 84]], { min: 0.6, max: 2, alpha: 0.45 });
	return canvas;
}

/**
 * Potting soil in the mouth of a pot: dark, crumbly, with a dry pale crust and a damp dark side to
 * it, grit and perlite in it and a bit of old leaf. The bytes are the flat colour the material used
 * to wear, spread about instead of replaced.
 */
export function soilCanvas(size = 256, base = [72, 54, 38]) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// where the water got in and where it has dried out, in patches the width of a hand
	const wet = noiseField(size, 4, 3, 511);
	wash(canvas, wet, [base[0] - 34, base[1] - 27, base[2] - 20], [base[0] + 52, base[1] + 44, base[2] + 34], 0.65);
	// crumbs of it, and the grit and perlite a bag of potting mix is full of
	specks(canvas, 700, 521, [[36, 24, 16], [52, 36, 24], [104, 80, 56]], { min: 1, max: 3.4, alpha: 0.55 });
	specks(canvas, 350, 531, [[156, 146, 128], [196, 190, 176], [122, 100, 76]], { min: 0.6, max: 1.6, alpha: 0.5 });
	// a little old leaf litter
	specks(canvas, 60, 541, [[126, 86, 48], [96, 66, 38], [148, 112, 66]], { min: 1.6, max: 3.6, alpha: 0.5, kind: "dash" });
	return canvas;
}

/** The 2d drawing context of a canvas, asked politely to expect readbacks. */
function context2d(canvas) {
	if (!canvas.__context) {
		canvas.__context = canvas.getContext("2d", { willReadFrequently: true });
	}
	return canvas.__context;
}

/**
 * How a butterfly's wing is drawn: the hinge on the LEFT edge (that is where the wing joins the
 * body), the FRONT of the butterfly at the TOP of the square, and an outline that runs out along the
 * front wing to a point, back in to a notch where the two wings meet, out again round the hind wing,
 * and home. In fractions of the square, and read by the painter below, so nothing else has to guess
 * where the hinge is.
 */
export const butterflyWing = {
	root: [0.045, 0.5],
	// The outline as corners with the curve that joins them: walk them in order and you are walking the
	// edge of the wing.
	outline: [
		{ to: [0.92, 0.2], via: [0.46, 0.0] }, // out along the front wing's leading edge, to its tip
		{ to: [0.57, 0.45], via: [0.8, 0.42] }, // back in along its outer edge, to the notch
		{ to: [0.62, 0.86], via: [0.76, 0.56] }, // out and round the hind wing
		{ to: [0.2, 0.74], via: [0.42, 0.94] }, // and back under it
		{ to: [0.045, 0.5], via: [0.07, 0.64] }, // home along the stalk
	],
	// The pale dots that sit in the dark border, and where on the edge they sit.
	dots: [
		[0.86, 0.25], [0.79, 0.36], [0.7, 0.43], [0.66, 0.56], [0.68, 0.7], [0.6, 0.82], [0.44, 0.85],
	],
};

/**
 * One butterfly's wing, cut out of the square and painted PALE.
 *
 * The colour is not here: it is the material's `albedoColor`, multiplied over this pattern, so three
 * butterflies of three colours are one canvas and not three. What IS here is the shape and what is
 * drawn on it: an even dark border along the whole edge — stroked, so it is as wide where the wing is
 * wide as where it is narrow, which a shrunk copy of the outline is not; a fan of veins out of the
 * hinge, which is the thing that makes a wing a wing even at eight pixels across; and a row of pale
 * dots in that border, which is what most of them have and what the eye catches when the wing beats.
 */
export function butterflyWingCanvas(size = 256, { seed = 71, veins = 6, edge = 0.026, dark = [40, 33, 26], base = [236, 232, 220] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const at = (n) => n * size;
	const path = () => {
		ctx.beginPath();
		ctx.moveTo(at(butterflyWing.root[0]), at(butterflyWing.root[1]));
		for (const leg of butterflyWing.outline) ctx.quadraticCurveTo(at(leg.via[0]), at(leg.via[1]), at(leg.to[0]), at(leg.to[1]));
		ctx.closePath();
	};
	ctx.clearRect(0, 0, size, size);
	path();
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fill();
	// The border, stroked on purpose: one width, all the way round. Half the stroke falls outside the
	// wing and is the wing's own edge, so what is left inside is half of `edge`.
	ctx.lineJoin = 'round';
	ctx.lineWidth = at(edge) * 2;
	ctx.strokeStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`;
	ctx.stroke();
	// The veins, clipped to the wing so they stop at the border and never cross it.
	ctx.save();
	path();
	ctx.clip();
	const hinge = [at(butterflyWing.root[0]), at(butterflyWing.root[1])];
	for (let i = 0; i < veins; i++) {
		const t = (i + 0.5) / veins;
		const ang = -1.35 + t * 2.5;
		const reach = at(0.62 + rand() * 0.4);
		ctx.strokeStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},${0.34 + rand() * 0.2})`;
		ctx.lineWidth = 1.5 + rand() * 1.4;
		ctx.beginPath();
		ctx.moveTo(hinge[0], hinge[1]);
		ctx.quadraticCurveTo(
			hinge[0] + Math.cos(ang) * reach * 0.6,
			hinge[1] + Math.sin(ang) * reach * 0.6,
			hinge[0] + Math.cos(ang) * reach,
			hinge[1] + Math.sin(ang) * reach,
		);
		ctx.stroke();
	}
	// A soft sheen across the field and a shade towards the hinge: a wing eight pixels across still
	// wants something in it, and a flat one reads as a plastic flake.
	const sheen = ctx.createLinearGradient(at(0.1), 0, at(0.95), at(0.6));
	sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
	sheen.addColorStop(0.55, 'rgba(255,255,255,0.05)');
	sheen.addColorStop(1, 'rgba(96,78,54,0.16)');
	ctx.fillStyle = sheen;
	ctx.fillRect(0, 0, size, size);
	ctx.restore();
	// And the dots, lying inside the border.
	for (const d of butterflyWing.dots) {
		ctx.fillStyle = `rgba(246,242,230,${0.6 + rand() * 0.3})`;
		ctx.beginPath();
		ctx.arc(at(d[0]), at(d[1]), at(0.016), 0, Math.PI * 2);
		ctx.fill();
	}
	return canvas;
}

/**
 * The shell of a cockroach: one flat brown would shade as a chocolate drop, so this is the leather-brown
 * back of the thing with darker and lighter bands across it, a scattering of finer grit on it, and a
 * damp sheen where the sun is on it. Painted as a square to be repeated over the body, once across.
 */
export function cockroachCanvas(size = 128, { seed = 91, base = [74, 44, 24] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	// No bands and no rings: laid over an ellipsoid three centimetres long, stripes come back as a
	// fingerprint on a coin, which is the opposite of an insect. What the shell wants instead is the
	// mottling of leather — clouds of lighter and darker brown, and a grit of finer specks over them.
	const blot = noiseField(size, 4, 3, seed);
	wash(canvas, blot, [base[0] - 22, base[1] - 16, base[2] - 11], [base[0] + 30, base[1] + 24, base[2] + 15], 0.5);
	specks(canvas, 260, 611, [[46, 26, 14], [64, 38, 20], [118, 88, 52]], { min: 0.6, max: 1.8, alpha: 0.4 });
	return canvas;
}

/**
 * A frog's back: wet green with dark blotches, and a grit of moist skin over them.
 *
 * The blotches are the point. A tree frog's back is not a flat green — it is a green with darker
 * clouds and a few dark eyespots, and a frog of one flat colour is a toy. They are laid as ellipses
 * and not as a noise field because a frog's marks are big and few: a field of small noise over a
 * twelve-centimetre animal reads as dirt, not as skin.
 */
export function frogSkinCanvas(size = 128, { seed = 471, base = [86, 110, 52] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	const cloud = noiseField(size, 4, 3, seed);
	wash(canvas, cloud, [base[0] - 26, base[1] - 24, base[2] - 20], [base[0] + 24, base[1] + 26, base[2] + 14], 0.55);
	const rand = randomGenerator(seed + 11);
	for (let i = 0; i < 14; i++) {
		const x = rand() * size;
		const y = rand() * size;
		const r = size * (0.045 + rand() * 0.075);
		ctx.fillStyle = `rgba(${base[0] - 52},${base[1] - 50},${base[2] - 30},${0.34 + rand() * 0.26})`;
		ctx.beginPath();
		ctx.ellipse(x, y, r, r * (0.6 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2);
		ctx.fill();
	}
	// A moist sheen: pale flecks, and a pale line along the middle for the spine ridge.
	specks(canvas, 240, seed + 5, [[52, 66, 34], [124, 146, 78], [166, 182, 116]], { min: 0.5, max: 1.5, alpha: 0.34 });
	ctx.strokeStyle = `rgba(${base[0] + 44},${base[1] + 46},${base[2] + 30},0.5)`;
	ctx.lineWidth = size * 0.022;
	ctx.beginPath();
	ctx.moveTo(size * 0.5, 0);
	ctx.lineTo(size * 0.5, size);
	ctx.stroke();
	return canvas;
}

/**
 * The skin of a koi, painted as the fish is built: the canvas runs from the TAIL at its left edge to the
 * snout at its right, and it wraps ROUND the fish — the top and bottom rows of the picture are the belly
 * and meet each other, and the middle row is the dorsal line along the back.
 *
 * That mapping is not a quirk, it is the reason the picture is painted this way: it is how the loft in
 * `src/koi.js` lays the skin on, so a saddle that is to sit along the back is a band across the middle of
 * the canvas, and a pale belly is a band at each edge. Turn the canvas a quarter and you get a herring.
 *
 * Why paint a fish at all, when a 40 cm fish five metres off through water is a blob? Because the blob has
 * to move convincingly, and a plain blob that rolls shows no more than a stone tumbling in a stream. The
 * three patterns below are the three every ornamental pond in Thailand is stocked with, and each one puts
 * its markings along the flanks and the back, where a fish seen from above through a sheet of water has
 * them — the pale belly is there for the moment a koi turns on its side in its wake, which is when it is
 * brightest in the whole picture.
 *
 *   kohaku  white with vermilion saddles, the classic
 *   gold    solid warm gold, paler underneath, with the scale lattice left showing
 *   lacery  white with vermilion saddles AND ink blotches, for the third colour in the basin
 *
 * The lattice is worth two lines: scales are not painted as scales at this size — a 3 cm scale on a fish
 * 6 m off is a hair of a pixel and a pattern of them aliases into a net — but as a faint diagonal weave
 * that survives into the mip chain and gives the flank a sheen instead of a boiled look.
 *
 * `node tools/canvassave.js koiCanvas pictures/koi.png 256 style=gold --tile 1 --cut 0` shows one.
 */
export function koiCanvas(size = 256, { style = "kohaku", seed = 61 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	const styleOf = {
		kohaku: { base: [220, 206, 178], belly: [236, 228, 204], patch: [206, 56, 24], spot: null },
		gold: { base: [222, 132, 30], belly: [240, 190, 92], patch: null, spot: null },
		lacery: { base: [217, 204, 176], belly: [234, 226, 202], patch: [204, 60, 26], spot: [42, 38, 44] },
	}[style] || { base: [220, 206, 178], belly: [236, 228, 204], patch: [206, 56, 24], spot: null };

	ctx.fillStyle = `rgb(${styleOf.base[0]},${styleOf.base[1]},${styleOf.base[2]})`;
	ctx.fillRect(0, 0, size, size);

	// The belly: pale, and it comes in softly. Two bands, one at each edge of the picture, because the two
	// edges are the same place on the fish.
	for (const at of [0, 1]) {
		const grad = ctx.createLinearGradient(0, at ? size : 0, 0, at ? size * 0.72 : size * 0.28);
		grad.addColorStop(0, `rgb(${styleOf.belly[0]},${styleOf.belly[1]},${styleOf.belly[2]})`);
		grad.addColorStop(1, `rgba(${styleOf.belly[0]},${styleOf.belly[1]},${styleOf.belly[2]},0)`);
		ctx.fillStyle = grad;
		ctx.fillRect(0, at ? size * 0.72 : 0, size, size * 0.28);
	}

	// The saddles: two or three big blotches along the back, well clear of one another, with the white showing
	// between them and the belly left alone. A koi's markings are few and big for the same reason a cow's
	// are: many small ones would be camouflage, and these are a show. They are wider along the fish than
	// they are round it, because a saddle lies over the shoulders and does not wrap to the belly.
	//
	// And they stop short of the head. u runs to 1 at the snout, and a show kohaku is judged on a CLEAN head:
	// the marking starts behind the gill. That is not only how the fish is: painted over the crown it made a
	// red mask with two black eye holes in it, which is a ghost and not a carp (`pictures/tmp-wedge.png`).
	const saddles = styleOf.patch ? (style === "gold" ? 0 : 3) : 0;
	const p = styleOf.patch || styleOf.base;
	const HEAD = 0.8; // where the plain head begins, as a fraction of the fish's length
	for (let i = 0; i < saddles; i++) {
		const cx = size * (0.14 + (i + 0.2 + rand() * 0.42) * ((HEAD - 0.22) / saddles));
		const cy = size * (0.5 + (rand() - 0.5) * 0.1);
		const rx = size * (0.082 + rand() * 0.045);
		// Taller than wide: v here is the girth, so a saddle needs to reach from the back (0.5) down the two
		// flanks (0.25 and 0.75) and stop short of the belly (0 and 1). Painted flat along the middle it reads,
		// from the bank, as a red coin on a grey fish; made any bigger it is not a kohaku but a tomato.
		const ry = rx * (1.15 + rand() * 0.35);
		const grad = ctx.createRadialGradient(cx, cy, rx * 0.3, cx, cy, rx * 1.18);
		grad.addColorStop(0, `rgb(${p[0]},${p[1]},${p[2]})`);
		grad.addColorStop(0.8, `rgb(${p[0]},${p[1]},${p[2]})`);
		grad.addColorStop(1, `rgba(${p[0]},${p[1]},${p[2]},0)`);
		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate((rand() - 0.5) * 0.5);
		ctx.scale(1, ry / rx);
		ctx.translate(-cx, -cy);
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(cx, cy, rx * 1.18, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
	// A few small spots between the saddles — `komon`, the little marks a good kohaku is judged on as much
	// as on its saddles, and here the thing that stops three big blots reading as one. Kept small: under
	// 4 cm of tea-coloured water anything under a centimetre of fish is gone anyway, and a crowd of them is
	// just noise.
	if (styleOf.patch) {
		for (let i = 0; i < 4; i++) {
			const cx = size * (0.12 + rand() * 0.62);
			const cy = size * (0.4 + rand() * 0.2);
			const r = size * (0.016 + rand() * 0.02);
			ctx.fillStyle = `rgba(${p[0]},${p[1]},${p[2]},${0.5 + rand() * 0.45})`;
			ctx.beginPath();
			ctx.ellipse(cx, cy, r * 1.4, r, rand() * Math.PI, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// Ink blotches, for the third pattern only, and kept near the back.
	if (styleOf.spot) {
		for (let i = 0; i < 3; i++) {
			const cx = size * (0.18 + rand() * 0.5);
			const cy = size * (0.4 + rand() * 0.2);
			const r = size * (0.018 + rand() * 0.022);
			ctx.fillStyle = `rgba(${styleOf.spot[0]},${styleOf.spot[1]},${styleOf.spot[2]},${0.6 + rand() * 0.35})`;
			ctx.beginPath();
			ctx.ellipse(cx, cy, r, r * (0.6 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// The scale weave: rows of shallow arcs, every other row stepped along, faint enough that it is a sheen
	// and not a net. Half a centimetre of scale to an arc is about what a young carp wears, and at this size
	// it is only ever a shimmer: anything crisper aliases into a lattice once the mip chain gets it.
	ctx.lineWidth = Math.max(1, size / 300);
	const step = size / 46;
	for (let row = 0; row < 46; row++) {
		for (let col = 0; col < 16; col++) {
			const x = col * step * 2 + (row % 2 ? step : 0);
			const y = row * step;
			ctx.strokeStyle = row % 2 ? "rgba(255,255,255,0.045)" : "rgba(70,58,44,0.04)";
			ctx.beginPath();
			ctx.arc(x, y, step * 0.95, 0.15 * Math.PI, 0.85 * Math.PI);
			ctx.stroke();
		}
	}

	// The dorsal line: the spine makes the middle of the back a shade darker and the two flanks catch more
	// light, which is the one reading that says FISH and not SAUSAGE when the animal is six metres off and
	// under a sheet of water.
	const back = ctx.createLinearGradient(0, size * 0.44, 0, size * 0.56);
	back.addColorStop(0, "rgba(96,74,52,0)");
	back.addColorStop(0.5, "rgba(96,74,52,0.13)");
	back.addColorStop(1, "rgba(96,74,52,0)");
	ctx.fillStyle = back;
	ctx.fillRect(0, size * 0.44, size, size * 0.12);

	// And a soft mottling over the whole thing, so no part of it is a flat fill.
	multiplyByField(canvas, noiseField(size, 7, 3, seed + 3), 0.13);
	specks(canvas, 260, seed + 9, [[92, 74, 56], [250, 246, 236], [186, 166, 140]], { min: 0.5, max: 1.4, alpha: 0.2 });
	return canvas;
}

/**
 * The top of a lily pad: a green disc, paler at the rim, with veins running out from the middle.
 *
 * The pad is laid on the water as a flat disc, and the engine maps a disc's top face with the middle
 * of the picture at the middle of the disc — so the veins are drawn radially from the centre, which is
 * how a pad grows, and the notch a pad wears like a bitten edge is left out: at forty centimetres
 * across and seen from five metres, a notch is two pixels and a lie costs more than it buys.
 */
// The pad's green, and it is lighter than the water it lies on. The first canvas was [44,86,40], and a
// browser showed what that means at six metres: a pad measured L47 against water at L73 — a crowd of dark
// holes on the surface. A pad is a leaf, lying flat and top side up in the sun: it is one of the brightest
// greens on the pond, and the dark of the water is what sets it off.
export function lilyPadCanvas(size = 128, { seed = 812, base = [88, 134, 66] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	const blot = noiseField(size, 5, 3, seed);
	wash(canvas, blot, [base[0] - 16, base[1] - 22, base[2] - 14], [base[0] + 30, base[1] + 34, base[2] + 18], 0.6);
	const rand = randomGenerator(seed + 3);
	// The veins: twelve to sixteen spokes out of the middle, paler than the pad, widening as they go.
	const spokes = 13 + Math.floor(rand() * 4);
	for (let i = 0; i < spokes; i++) {
		const a = (i / spokes) * Math.PI * 2 + rand() * 0.16;
		ctx.strokeStyle = `rgba(${base[0] + 46},${base[1] + 58},${base[2] + 34},0.5)`;
		ctx.lineWidth = size * 0.014;
		ctx.beginPath();
		ctx.moveTo(size * 0.5, size * 0.5);
		ctx.lineTo(size * 0.5 + Math.cos(a) * size * 0.5, size * 0.5 + Math.sin(a) * size * 0.5);
		ctx.stroke();
	}
	// The rim is paler and the middle dark, which is how a pad sits in the water: old in the middle.
	const ring = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.5);
	ring.addColorStop(0, `rgba(${base[0] - 22},${base[1] - 26},${base[2] - 16},0.55)`);
	ring.addColorStop(0.72, "rgba(0,0,0,0)");
	ring.addColorStop(1, `rgba(${base[0] + 52},${base[1] + 62},${base[2] + 36},0.4)`);
	ctx.fillStyle = ring;
	ctx.fillRect(0, 0, size, size);
	return canvas;
}

// A ripple on still water: one bright ring where the disturbance left the frog, and two fainter ones
// travelling out behind it. The strength is written into BOTH the colour and the alpha of every pixel,
// because a material may read its opacity from either channel and the two must not disagree — a ring that
// is opaque where it should be faint is a white plate on the water.
export function rippleRingCanvas(size = 128) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.clearRect(0, 0, size, size);
	const mid = size / 2;
	const ring = (at, width, strength) => {
		for (let i = 0; i < 7; i++) {
			const t = (i - 3) / 3; // straight across the band, -1 to 1
			const a = strength * Math.exp(-t * t * 2.4);
			const v = Math.round(255 * a);
			ctx.strokeStyle = `rgba(${v},${v},${v},${a})`;
			ctx.lineWidth = Math.max(1, mid * width * 0.5);
			ctx.beginPath();
			ctx.arc(mid, mid, mid * at + t * mid * width * 0.45, 0, Math.PI * 2);
			ctx.stroke();
		}
	};
	ring(0.44, 0.2, 1);
	ring(0.66, 0.16, 0.42);
	ring(0.22, 0.12, 0.22);
	return canvas;
}

/**
 * The skin of the shark (`src/shark.js`), painted the way the animal is built: the canvas runs from the
 * TAIL at its left edge to the SNOUT at its right, and it wraps ROUND the body — the top and bottom rows
 * of the picture are the belly and meet each other, and the middle row is the dorsal line. The loft in
 * `src/loft.js` lays the skin that way, so a pale belly is a band at each edge of the picture and a dark
 * back is a band across the middle.
 *
 * What makes it read as a shark and not as a grey tube is COUNTERSHADING: dark above, white below, with
 * the break high on the flank. That is not decoration — a shark seen from the surface is a dark shape on a
 * bright floor, and seen from below a white shape against the sky; the break line is where the two meet, and
 * on a real animal it is a line and not a gradient. Painted as a soft blend it came out as a fish wearing a
 * waistcoat; the break here is two rows of picture wide.
 *
 * Also on it, and each one for a reason:
 *
 *   the five gill slits, on BOTH flanks (the picture's two halves are the two sides of the animal) at
 *   u = 0.78..0.86, just behind the head. Without them the head is a smooth lozenge and reads as a seal.
 *   a lateral line: a faint dark line along each flank at the break, running the length of the fish.
 *   dermal grain: shark skin is sandpaper — placoid scales, not scales at all — so the grain is fine and
 *   even and there is no lattice or weave on it, unlike the koi.
 *   two scars across the back, because a shark that has lived is scratched up, and a pale mark along the
 *   back is the one thing that still shows when the animal is a dark shape under a bright surface.
 *
 * `node tools/canvassave.js sharkSkinCanvas pictures/sharkskin.png 256 --tile 1` shows one.
 */
export function sharkSkinCanvas(size = 256, { seed = 91, back = [46, 62, 72], belly = [198, 206, 200] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	// One column of picture per station along the body, one row per station round it.
	const image = ctx.createImageData(size, size);
	const put = (x, y, r, g, b) => {
		const i = (y * size + x) * 4;
		image.data[i] = r;
		image.data[i + 1] = g;
		image.data[i + 2] = b;
		image.data[i + 3] = 255;
	};
	const cloud = noiseField(size, 5, 3, seed + 3);
	const grain = noiseField(size, 48, 2, seed + 9);
	for (let y = 0; y < size; y++) {
		const v = y / (size - 1);
		// How far round from the belly: 0 at either edge of the picture, a half-turn at the back.
		const round = Math.min(v, 1 - v) * 2;
		// The break: pale below and dark above. The pale stops a little under half way round — at the lateral
		// line, which is where the animal's own break is — and the edge is soft, not a knife. The first cut at
		// this picture put the break two thirds of the way up, which left nearly the whole flank white and the
		// shark came out of the water the colour and shape of a rubber toy. What is scary is a dark shape with a
		// pale belly under it: the dark is the thing you notice in a pool.
		const pale = 1 - edge(0.4, 0.52, round);
		for (let x = 0; x < size; x++) {
			const u = x / (size - 1);
			const c = cloud[y * size + x] - 0.5;
			const g = grain[y * size + x] - 0.5;
			// The snout and the tail's stalk are darker than the flank: the head is a wedge of grey above
			// and white below with little room for a blend, and the peduncle is nearly all dark.
			const taper = 1 - 0.18 * edge(0.88, 1, u) - 0.12 * edge(0.1, 0, u);
			const mix = pale * (0.86 + c * 0.2 + g * 0.1);
			const r = (back[0] * (1 - mix) + belly[0] * mix) * taper;
			const gg = (back[1] * (1 - mix) + belly[1] * mix) * taper;
			const b = (back[2] * (1 - mix) + belly[2] * mix) * taper;
			put(x, y, r, gg, b);
		}
	}
	ctx.putImageData(image, 0, 0);
	// The lateral line: a faint dark seam along each flank, just above the break the countershading makes.
	for (const side of [0.26, 0.74]) {
		ctx.strokeStyle = `rgba(${back[0] - 26},${back[1] - 24},${back[2] - 18},0.5)`;
		ctx.lineWidth = Math.max(1, size * 0.008);
		ctx.beginPath();
		ctx.moveTo(size * 0.1, size * side);
		ctx.lineTo(size * 0.86, size * side);
		ctx.stroke();
	}
	// The five gill slits, both sides, below the line. They slant back a little, as they do on the animal.
	for (const side of [0.16, 0.84]) {
		for (let i = 0; i < 5; i++) {
			const at = 0.775 + i * 0.019;
			ctx.strokeStyle = `rgba(${back[0] - 34},${back[1] - 32},${back[2] - 24},${0.62 - i * 0.05})`;
			ctx.lineWidth = size * 0.011;
			ctx.beginPath();
			ctx.moveTo(size * at, size * (side - 0.055));
			ctx.lineTo(size * (at - 0.012), size * (side + 0.055));
			ctx.stroke();
		}
	}
	// Two scars across the back: pale, thin, and not symmetrical, because nothing that left them was
	// trying to decorate the animal.
	for (let i = 0; i < 2; i++) {
		const at = 0.3 + rand() * 0.4;
		ctx.strokeStyle = `rgba(${back[0] + 58},${back[1] + 60},${back[2] + 54},0.4)`;
		ctx.lineWidth = size * (0.006 + rand() * 0.006);
		ctx.beginPath();
		ctx.moveTo(size * at, size * 0.4);
		ctx.quadraticCurveTo(size * (at + 0.05), size * 0.47, size * (at + 0.02), size * 0.56);
		ctx.stroke();
	}
	return canvas;
}

/**
 * A cloud of blood, painted as an ALPHA picture (every channel carries the same number, as the pond's
 * ripple ring does) so one canvas can serve as a material's opacity and be tinted by whatever wears it.
 *
 * This is not a splat and it should not be painted like one. Blood that leaves a wound in still water is a
 * billowing cauliflower: it comes out in lumps, each lump a soft ball with a ragged edge, and the lumps
 * merge into a bigger cloud as they spread and dilute. So the picture is fourteen soft radial lobes of
 * differing size placed about the middle of the canvas, with three or four smaller ones flung past the edge
 * of the main mass — the wisps that break off. A single radial fade is a coin, and a coin floating in a
 * pool is a sticker, not blood.
 *
 * The lobes are drawn into a canvas that is mostly empty, so the cloud can grow and thin inside one mesh:
 * `src/blood.js` spends a puff at a third of its own size first and lets it fill the canvas as it dies.
 *
 * `node tools/canvassave.js bloodCanvas pictures/blood.png 128 --tile 1 --cut 0` shows one.
 */
export function bloodCanvas(size = 128, { seed = 7, lobes = 14 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	ctx.clearRect(0, 0, size, size);
	const mid = size / 2;
	const lobe = (x, y, r, strength) => {
		const skin = ctx.createRadialGradient(x, y, 0, x, y, r);
		// A lobe is densest a little inside its edge and thin at the rim, which is what a curl of dye in
		// water looks like: the front of the bill is the sharp part and the trail behind it is the fade.
		skin.addColorStop(0, `rgba(255,255,255,${strength})`);
		skin.addColorStop(0.45, `rgba(235,235,235,${strength * 0.86})`);
		skin.addColorStop(0.78, `rgba(190,190,190,${strength * 0.42})`);
		skin.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = skin;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	};
	for (let i = 0; i < lobes; i++) {
		const th = rand() * Math.PI * 2;
		const out = rand() * rand() * mid * 0.46;
		const r = mid * (0.2 + rand() * 0.36) * (1 - out / (mid * 0.9));
		lobe(mid + Math.cos(th) * out, mid + Math.sin(th) * out * 0.8, Math.max(size * 0.06, r), 0.5 + rand() * 0.5);
	}
	// The wisps that break off the main mass, out past its edge.
	for (let i = 0; i < 4; i++) {
		const th = rand() * Math.PI * 2;
		lobe(mid + Math.cos(th) * mid * 0.62, mid + Math.sin(th) * mid * 0.6, mid * (0.08 + rand() * 0.1), 0.26);
	}
	return canvas;
}

/**
 * The skin of a small house gecko: pale ash over a warm undercoat, sprinkled with rust.
 *
 * Painted as an all-over mottle and not as a map, because the animal it goes on is a handful of squashed
 * spheres a palm long — nobody is going to find a pattern in it, and what the picture needs is a skin that
 * has some life in it instead of one flat colour at 15 cm. The rust spots are the reason for the canvas at
 * all: the common house gecko of this climate is the colour of old plaster with orange spots on it, and a
 * gecko the same colour as the wall it sits on is the animal's actual problem and not mine to repeat. It is
 * kept a shade warmer and darker than the plaster for the same reason.
 */
export function geckoSkinCanvas(size = 128, { seed = 512, base = [146, 134, 120] } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
	ctx.fillRect(0, 0, size, size);
	const cloud = noiseField(size, 4, 3, seed);
	wash(canvas, cloud, [base[0] - 34, base[1] - 34, base[2] - 32], [base[0] + 26, base[1] + 26, base[2] + 24], 0.5);
	const rand = randomGenerator(seed + 7);
	// The rust spots, which are the animal's whole character: scattered, uneven, and darker at the middle of
	// each one. About forty, which at this size is what shows.
	for (let i = 0; i < 42; i++) {
		const x = rand() * size;
		const y = rand() * size;
		const r = size * (0.018 + rand() * 0.036);
		ctx.fillStyle = `rgba(${base[0] + 42},${base[1] - 6},${base[2] - 44},${0.4 + rand() * 0.35})`;
		ctx.beginPath();
		ctx.ellipse(x, y, r, r * (0.7 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2);
		ctx.fill();
	}
	// The tubercles: a gecko's back is rough with tiny bumps, and at fourteen centimetres that roughness is
	// three points of light and shade, which is enough to stop it reading as a plastic toy.
	specks(canvas, 420, seed + 3, [[base[0] - 46, base[1] - 46, base[2] - 44], [base[0] + 38, base[1] + 36, base[2] + 32], [base[0] + 62, base[1] + 24, base[2] - 18]], {
		min: 0.4,
		max: 1.3,
		alpha: 0.4,
	});
	return canvas;
}


/**
 * A gold coin stamped with a royal emblem, for the raven to drop in the yard.
 *
 * WHAT IS ON IT, and what is not. The master asked for the Thai king's motif on a gold coin, and the plain
 * reading of a Thai coin is the king's head — the face of the reigning king is on every baht in every pocket in
 * the country. It is not on this one. A living person's face is not something to draw into a toy, and a stamped
 * face at twenty-six millimetres would be a caricature even if it were attempted, so the coin wears the royal
 * *emblem* instead, which is what Thai coins and medals wear on the other face anyway:
 *
 *   the crown. The pointed crown of a Thai king: a spire in the middle with two lesser spires leaning against
 *   it, standing on a banded circlet, and a ray off the top of it.
 *   the chakra. A wheel with eight spokes under the crown, the wheel the House of Chakri bears.
 *   the talk-backs. Two scrolls curling up either side of the wheel like a pair of raised hands, which is the
 *   ornamental pair that flanks royal things in Thailand and one of the few parts of a royal seal that can be
 *   drawn without drawing the seal.
 *   the border. Forty beads inside the rim, because a coin's border is a ring of beads and nothing else, and a
 *   ring is the cheapest thing on this list to count and the easiest to get wrong.
 *
 * HOW IT IS PAINTED, and the fault that had to be found first. A struck coin has no colour: it is one metal, and
 * the whole of its read is the difference between the raised device and the sunken field. So every device here
 * is drawn twice through `relief`, once sunk and dark and once proud and bright, and every device takes the tone
 * it is *handed* rather than carrying its own. The first cut of this function handed each device a tone and then
 * filled it with a colour written into the device instead, which meant both passes painted the same mid-gold and
 * the coin came out as one flat tone with a bruise on it — see `pictures/tmp-coin.png`, and do not do that again.
 * The field is now struck dark, the devices are struck nearly white, and the offset between the two passes is the
 * depth of the blow.
 */
export function royalCoinCanvas(size = 320) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const g = canvas.getContext("2d");
	const rand = randomGenerator(0x5c1);
	const R = size * 0.5;
	const GOLD = [236, 194, 92];
	const tone = (r, gg, b, a = 1) => `rgba(${Math.round(GOLD[0] * r)}, ${Math.round(GOLD[1] * gg)}, ${Math.round(GOLD[2] * b)}, ${a})`;
	const SUNK = tone(0.44, 0.36, 0.2);
	const PROUD = tone(1.16, 1.1, 0.86);

	/**
	 * One struck device: a dark copy thrown down and to the right, and the bright one laid over it. `draw` is
	 * called twice and is expected to paint in the tone it is given — that is the whole of the arrangement, and
	 * the reason it is written down here.
	 */
	const relief = (draw, deep = size * 0.013) => {
		g.save();
		g.translate(deep, deep * 1.2);
		g.fillStyle = SUNK;
		g.strokeStyle = SUNK;
		draw();
		g.restore();
		g.fillStyle = PROUD;
		g.strokeStyle = PROUD;
		draw();
	};

	// The field: a saucer, struck down. It is DARK against the devices and that is not a matter of taste — the
	// devices only stand out of the coin if the coin is behind them.
	const field = g.createRadialGradient(R * 0.7, R * 0.62, R * 0.08, R, R, R * 1.06);
	field.addColorStop(0, tone(1.02, 0.97, 0.78));
	field.addColorStop(0.5, tone(0.7, 0.64, 0.45));
	field.addColorStop(1, tone(0.46, 0.4, 0.27));
	g.fillStyle = field;
	g.fillRect(0, 0, size, size);

	// Hammers. The coin was struck once but the blank it was struck from was hammered, and a saucer of dents is
	// what makes gold look like metal rather than like a biscuit.
	for (let i = 0; i < 850; i++) {
		const a = rand() * Math.PI * 2;
		const rr = Math.sqrt(rand()) * R * 0.93;
		g.beginPath();
		g.arc(R + Math.cos(a) * rr, R + Math.sin(a) * rr, size * (0.004 + rand() * 0.01), 0.4 + rand(), 3.5 + rand());
		g.strokeStyle = tone(0.78 + rand() * 0.34, 0.73 + rand() * 0.34, 0.56 + rand() * 0.3, 0.15);
		g.lineWidth = size * 0.0035;
		g.stroke();
	}

	// The rim and its reeding: ninety-six cuts round the edge, which is the milled edge that proves a coin is a
	// coin and, at this size, the only part of the border that catches a light from a metre away.
	g.beginPath();
	g.arc(R, R, R * 0.955, 0, Math.PI * 2);
	g.strokeStyle = tone(0.5, 0.44, 0.3, 0.85);
	g.lineWidth = size * 0.02;
	g.stroke();
	for (let i = 0; i < 96; i++) {
		const a = (i / 96) * Math.PI * 2;
		g.beginPath();
		g.moveTo(R + Math.cos(a) * R * 0.9, R + Math.sin(a) * R * 0.9);
		g.lineTo(R + Math.cos(a) * R * 1.0, R + Math.sin(a) * R * 1.0);
		g.strokeStyle = tone(0.86, 0.8, 0.6, 0.4);
		g.lineWidth = size * 0.0055;
		g.stroke();
	}

	// Forty beads inside the rim, each one struck proud with its own shadow.
	for (let i = 0; i < 40; i++) {
		const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
		const x = R + Math.cos(a) * R * 0.845;
		const y = R + Math.sin(a) * R * 0.845;
		relief(() => {
			g.beginPath();
			g.arc(x, y, size * 0.014, 0, Math.PI * 2);
			g.fill();
		});
	}

	const wheelY = R * 1.18;
	const wheelR = R * 0.21;
	// The chakra: an outer ring, eight spokes and a hub, with the field left showing between the spokes because
	// a wheel with a hole in it is a wheel and a disc with lines scratched on it is a plate.
	relief(() => {
		g.beginPath();
		g.arc(R, wheelY, wheelR, 0, Math.PI * 2);
		g.moveTo(R + wheelR * 0.68, wheelY);
		g.arc(R, wheelY, wheelR * 0.68, 0, Math.PI * 2, true);
		g.fill("evenodd");
	});
	g.save();
	g.translate(R, wheelY);
	for (let i = 0; i < 8; i++) {
		g.save();
		g.rotate((i / 8) * Math.PI * 2);
		relief(() => g.fillRect(-size * 0.008, -wheelR * 0.7, size * 0.016, wheelR * 0.72));
		g.restore();
	}
	relief(() => {
		g.beginPath();
		g.arc(0, 0, wheelR * 0.21, 0, Math.PI * 2);
		g.fill();
	});
	g.restore();

	// The crown: a banded circlet, three spires with the middle tallest, and a ray off the top of it.
	const crownY = R * 0.62;
	relief(() => {
		g.beginPath();
		g.moveTo(R - R * 0.31, crownY + R * 0.17);
		g.lineTo(R + R * 0.31, crownY + R * 0.17);
		g.lineTo(R + R * 0.27, crownY + R * 0.04);
		g.lineTo(R - R * 0.27, crownY + R * 0.04);
		g.closePath();
		g.fill();
	});
	for (const [dx, tall, wide] of [[-R * 0.19, R * 0.17, R * 0.075], [0, R * 0.3, R * 0.095], [R * 0.19, R * 0.17, R * 0.075]]) {
		relief(() => {
			g.beginPath();
			g.moveTo(R + dx - wide, crownY + R * 0.05);
			g.lineTo(R + dx + wide, crownY + R * 0.05);
			g.lineTo(R + dx + wide * 0.4, crownY - tall * 0.56);
			g.lineTo(R + dx, crownY - tall);
			g.lineTo(R + dx - wide * 0.4, crownY - tall * 0.56);
			g.closePath();
			g.fill();
		});
	}
	relief(() => {
		g.beginPath();
		g.moveTo(R - size * 0.009, crownY - R * 0.3);
		g.lineTo(R + size * 0.009, crownY - R * 0.3);
		g.lineTo(R, crownY - R * 0.44);
		g.closePath();
		g.fill();
	}, size * 0.006);

	// The two talk-backs, mirrored off the middle so they cannot disagree about their own shape. They rise and
	// lean in toward the crown, thick at the root and thin at the tip, which is what they do on a seal; the first
	// cut drew them as two even C-curves at the wheel's own height and the whole coin came out as a chamber pot
	// with two grips on it.
	for (const side of [1, -1]) {
		g.save();
		g.translate(R, R * 0.96);
		g.scale(side, 1);
		relief(() => {
			g.beginPath();
			g.moveTo(R * 0.36, R * 0.34);
			g.quadraticCurveTo(R * 0.54, R * 0.25, R * 0.55, R * 0.02);
			g.quadraticCurveTo(R * 0.57, -R * 0.28, R * 0.41, -R * 0.44);
			g.quadraticCurveTo(R * 0.34, -R * 0.51, R * 0.36, -R * 0.33);
			g.quadraticCurveTo(R * 0.38, -R * 0.1, R * 0.44, R * 0.0);
			g.quadraticCurveTo(R * 0.45, R * 0.17, R * 0.33, R * 0.19);
			g.closePath();
			g.fill();
		});
		g.restore();
	}

	// One last light across the whole coin from the top left, because metal is never evenly lit and a flat gold
	// disc is the thing that makes false gold look false.
	const shine = g.createLinearGradient(0, 0, size, size);
	shine.addColorStop(0, "rgba(255,250,226,0.22)");
	shine.addColorStop(0.45, "rgba(255,250,226,0)");
	shine.addColorStop(0.82, "rgba(66,42,6,0.16)");
	g.fillStyle = shine;
	g.fillRect(0, 0, size, size);
	return canvas;
}

/**
 * A puff thrown into the air where something was struck: a round of soft cloud with a few specks
 * thrown out past it. Painted in white on nothing, because it is used as an OPACITY pattern — the
 * colour comes from the material, so the same canvas serves for water, dust and blood.
 *
 * WHY IT IS SOFT AND NOT SHAPED. A spurt from a round is a hundredth of a second of spray, and at
 * that speed nothing has a shape yet: what a person actually sees is a bright smudge with a ragged
 * edge and a handful of dots round it. A shaped puff (a star, a crown, a mushroom) is a drawing of an
 * idea of an explosion, and it is the shape that makes a hit look pasted on. The raggedness here comes
 * from overlapping lobes at random, the same way `bloodCanvas` makes a cloud of dye.
 */
export function puffCanvas(size = 128, { seed = 31, lobes = 11 } = {}) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(seed);
	ctx.clearRect(0, 0, size, size);
	const mid = size / 2;
	const lobe = (x, y, r, strength) => {
		const skin = ctx.createRadialGradient(x, y, 0, x, y, r);
		skin.addColorStop(0, `rgba(255,255,255,${strength})`);
		skin.addColorStop(0.5, `rgba(240,240,240,${strength * 0.7})`);
		skin.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = skin;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	};
	// The body: one big lobe in the middle and a ring of smaller ones against it, so the mass has a
	// dense heart and a broken edge rather than one clean circle.
	lobe(mid, mid, mid * 0.5, 0.95);
	for (let i = 0; i < lobes; i++) {
		const th = rand() * Math.PI * 2;
		const out = mid * (0.2 + rand() * 0.28);
		lobe(mid + Math.cos(th) * out, mid + Math.sin(th) * out, mid * (0.12 + rand() * 0.2), 0.4 + rand() * 0.45);
	}
	// The spray: small dots outside the mass, which is the part that says "this was thrown" rather than
	// "this is a cloud". They are hard-edged on purpose; the smoke is soft and the drops are not.
	for (let i = 0; i < 14; i++) {
		const th = rand() * Math.PI * 2;
		const out = mid * (0.5 + rand() * 0.42);
		const x = mid + Math.cos(th) * out;
		const y = mid + Math.sin(th) * out;
		ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.6})`;
		ctx.beginPath();
		ctx.arc(x, y, size * (0.004 + rand() * 0.014), 0, Math.PI * 2);
		ctx.fill();
	}
	return canvas;
}

/**
 * The flash at a gun's muzzle: a hot core with a handful of spikes out of it.
 *
 * A real muzzle flash is a ball of burning gas with the unburnt powder jetting out in front of it, and
 * at a twentieth of a second it reads as a star and nothing else. It is painted white because it goes on
 * as an OPACITY pattern over a self-lit orange material, exactly as the blood and the ripples are
 * painted — the material owns the colour, the canvas owns the shape.
 */
export function flashCanvas(size = 128) {
	const canvas = canvasOfSize(size);
	const ctx = context2d(canvas);
	const rand = randomGenerator(0x7f3);
	const mid = size / 2;
	const ball = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.34);
	ball.addColorStop(0, "rgba(255,255,255,1)");
	ball.addColorStop(0.55, "rgba(255,255,255,0.72)");
	ball.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = ball;
	ctx.beginPath();
	ctx.arc(mid, mid, mid * 0.34, 0, Math.PI * 2);
	ctx.fill();
	// Six spikes of uneven length out of the core. Even spikes make a snowflake, and a snowflake is the
	// thing a bad muzzle flash always looks like.
	for (let i = 0; i < 6; i++) {
		const th = (i / 6) * Math.PI * 2 + rand() * 0.5;
		const len = mid * (0.42 + rand() * 0.42);
		const half = size * (0.02 + rand() * 0.03);
		ctx.save();
		ctx.translate(mid, mid);
		ctx.rotate(th);
		const spike = ctx.createLinearGradient(0, 0, len, 0);
		spike.addColorStop(0, "rgba(255,255,255,0.9)");
		spike.addColorStop(0.6, "rgba(255,255,255,0.4)");
		spike.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = spike;
		ctx.beginPath();
		ctx.moveTo(0, -half);
		ctx.lineTo(len, 0);
		ctx.lineTo(0, half);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
	return canvas;
}
