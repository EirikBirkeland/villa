// The lawn's broad tones: which parts of the garden are lush and which have dried out, and how far its
// mown bands wander off the line.
//
// Why this exists. A six-metre tile of grass, laid again and again across forty metres of garden, gives
// every patch the same green and lands every mown band in the same place: a printed thing, however well
// the tile itself is painted. A pattern cannot answer a pattern. What a real lawn has that a tile cannot
// is shapes bigger than the tile, so the lawn carries two more things, both asked in metres of ground
// and not in the tile (see `groundPatch` in noise.js):
//
//   lawnTone(x, z)   three multipliers, one per colour channel, for how the grass lies in a place: deep
//                    cool green where it is lush, straw-pale and warm where the dry season has got at
//                    it, with a little light and dark in it for where the sward is thick and where it
//                    has been walked thin, and the mower's stripes eight metres across. Averaged to one
//                    across the garden, so the patches can vary the lawn without brightening or dimming
//                    it whole. Every one of these sizes is bigger than the six-metre tile on purpose —
//                    see `mowStripes` below for why a stripe inside the tile is no stripe at all.
//   lawnBend(x, z)   how far the pattern is nudged sideways, in metres, so the mown bands wander the way
//                    a real mower's do instead of running dead straight for sixty metres.
//
// Both are read in the browser, where they go into the lawn's own corners — `tintFromGround` and the
// `bend` argument of `groundUVs` in mesh.js — and both are read again by tools/draw.js at every pixel it
// lays down (`broad` in surface-colours.js). One set of numbers, two readers: that is how the CPU
// drawing stays honest about the garden instead of drawing the flat one it used to draw.
//
// What the multipliers are, and how big. They multiply the grass colour in the engine's own light and
// are not screen bytes: 0.8 of a channel is a fifth of the light in it gone. Small numbers, then, on
// purpose, and these are the ones that were kept. Measured in Chromium over the west lawn with the tone
// turned on and then off again at twelve places (the plan `tools/lawnprobe.json`), a place moves by
// (2, -8, -6) on average and by as much as 25 of a channel at the driest and the lusher of them; the
// mean of the whole lawn stays within a point or two of where it was, which is what the averaging below
// is for. Seen from twenty metres straight down, where the grass fills the frame and nothing else does,
// the colour of one metre patch differs from another's by 15 of red where it differed by 7 before any
// of this, and the lawn's own six-metre repeat shows a tenth less in a picture.

import { groundPatch } from "./noise.js";

/**
 * How far apart the lawn's corners stand, in metres. The tone can only change as fast as this, and the
 * shapes it makes are a good deal bigger, so two metres is more than enough: it is the bend of a mown
 * band and the pale of a dry patch that is being carried, not the colour of one blade. At two metres a
 * strip 260 m across costs 130 x 66 corners, and the whole lawn about eighteen thousand, which is
 * nothing against the two million pixels the software renderer is pushing.
 */
export const lawnVertexSpacing = 2;

/** Where the lawn is: the garden as far as the hedge, in metres. */
const garden = { x0: -33, x1: 33, z0: -22, z1: 26 };

// The two ends of the same grass. `parched` is a Thai lawn in the hot months: still alive, still green
// in it, but straw-pale and warm where the water does not reach. `lush` is the same grass where it does:
// deeper, cooler, a shade more blue in it. Note what is left nearly alone between them — the green,
// which carries four fifths of the light in grass. Dry grass is pale, not dark: the first attempt took
// the green down along with the dryness and the west lawn came out seventeen points darker, a lawn in
// shadow instead of a lawn in the dry season.
//
// And note what pale means. The end that was here before took the red up by a third and the blue down by
// more than a third — [1.3, 1.02, 0.64] — which is not straw at all but the laterite under the lawn,
// and a browser said so: measured straight down over the west lawn (`tools/lawnedge.json`'s camera,
// `pictures/46-lawn-over-before.png`, a rectangle that is nothing but grass), one 40 px block differed
// from another by a warmth of 47 to 126, where sun against shade is worth one or two and dust against
// damp ten. The dry places were not dry grass, they were patches of bare earth in a yellow field, and the
// whole lawn read as pond-scum green with rust in it. Straw is PALE: every channel up a little, the blue
// the least of them but not down. These are the bytes that came out of that.
const lush = [0.9, 1.07, 1.02];
const parched = [1.16, 1.04, 0.86];

// The sizes the garden is allowed to vary at, in metres. Everything here is bigger than the six-metre
// grass tile, which is the whole point: a patch of dry grass has to be bigger than the pattern it sits
// on before it reads as a place and not as a speckle. Too big is as bad as too small, though — the
// first attempt wandered over forty metres and gave the whole west half of the garden straw and the
// whole east half green, which is a gradient and not a lawn.
const dryWidth = 21;
const dryDetail = 7;
const swardWidth = 14;
const swardDetail = 6;

/** How dry a place is, 0 (green) to 1 (straw). About two places in five come out dry. */
function dryness(x, z) {
	const d = groundPatch(x, z, { broad: dryWidth, fine: dryDetail, seed: 6061 });
	return Math.min(1, Math.max(0, (d - 0.52) / 0.26));
}

/**
 * How thick the sward is, about a sixth of a stop either way: where the grass is tall and where it has
 * been walked thin. This is the only place the lawn's light goes up and down. The dryness moves its
 * colour and leaves its light alone, and keeping the two fields apart is what stops the dry patches
 * reading as patches of shade.
 */
function sward(x, z) {
	return (groundPatch(x - 60, z + 34, { broad: swardWidth, fine: swardDetail, seed: 2177 }) - 0.5) * 0.3;
}

// The mower's stripes, laid in the ground and not in the tile.
//
// They were in the tile before, and that is why nothing in the garden showed them: `mownBands` in
// src/textures.js rules six bands across the six-metre tile, so every tile carries exactly as much lit
// stripe as shaded stripe, and at fifteen metres the engine averages a tile to one texel and the stripes
// are simply gone. A pattern cannot answer a pattern — the same fault the garden's broad patches had, in
// the other direction. What survives to the far border is a stripe WIDER than the tile, and a real lawn
// has those too: the bands a ride-on leaves are a metre apiece, but a sward also dries and lies down in
// bands several metres wide, and it is those the eye reads from across the garden.
//
// So: a stripe of eight metres across, which the two-metre corner grid can carry (a little over two
// corners to a half-band, and the sine is at its flattest where the corners are furthest apart), and
// pulled sideways by a slow field so the bands curve across the garden instead of ruling it.
const mowWidth = 8;
const mowDepth = 0.13;

/** -1 to 1: where a place stands between the lit stripe and the shaded one. */
function mowStripes(x, z) {
	// Measured along the east: a band is eight metres of ground in that direction, so the bands themselves
	// run north and south, which is the way a mower's passes lie here and the way the late sun rakes them.
	const along = x * 0.985 + z * 0.174;
	const bend = (groundPatch(x + 33, z - 58, { broad: 27, fine: 11, seed: 7717 }) - 0.5) * 5.5;
	return Math.sin(((along + bend) / mowWidth) * Math.PI * 2);
}

function rawTone(x, z) {
	const d = dryness(x, z);
	// The stripes move the light, and a lit stripe is a warm one and a shaded stripe a cool one: a real
	// band differs in both, and paying the whole change in green leaves a stripe that reads as a shadow.
	const stripe = mowDepth * mowStripes(x, z);
	const lift = (1 + sward(x, z)) * (1 + stripe);
	return [
		(lush[0] + (parched[0] - lush[0]) * d) * lift * (1 + stripe * 0.7),
		(lush[1] + (parched[1] - lush[1]) * d) * lift * (1 - stripe * 0.25),
		(lush[2] + (parched[2] - lush[2]) * d) * lift,
	];
}

// What those multipliers average across the garden, so that putting the patches in cannot quietly
// repaint it: each channel is divided back to an average of one. Measured two metres at a time, which
// is the spacing the corners are standing at anyway.
const gardenMean = (() => {
	const sum = [0, 0, 0];
	let n = 0;
	for (let x = garden.x0; x <= garden.x1; x += 2) {
		for (let z = garden.z0; z <= garden.z1; z += 2) {
			const t = rawTone(x, z);
			sum[0] += t[0];
			sum[1] += t[1];
			sum[2] += t[2];
			n++;
		}
	}
	return sum.map((s) => s / n);
})();

/**
 * How the grass in a place differs from the lawn's own colour: three multipliers, one per channel, that
 * average to one across the garden. Read as light, the way every colour multiplier in this Villa is.
 */
export function lawnTone(x, z) {
	const t = rawTone(x, z);
	return [t[0] / gardenMean[0], t[1] / gardenMean[1], t[2] / gardenMean[2]];
}

/**
 * How far off its grid the grass pattern sits here, in metres: up to a metre and a half, over a
 * wavelength of thirty to forty. That is a gentle pull — the grass scale changes by a few per cent and
 * the mown bands describe long shallow curves across the garden instead of ruling it like a grid.
 */
export function lawnBend(x, z) {
	return [
		(groundPatch(x + 90, z - 20, { broad: 44, fine: 16, seed: 4409 }) - 0.5) * 3.0,
		(groundPatch(x - 15, z + 71, { broad: 38, fine: 13, seed: 5303 }) - 0.5) * 3.0,
	];
}
