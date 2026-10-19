// The paving's broad tones: which parts of the poolside stone lie dusty and pale and which keep a
// darkness of damp in them.
//
// Why this exists. The paving is one pattern of stone slabs, three metres and a tenth across, laid
// again and again over about three hundred and fifty square metres of deck: so every slab in the first
// tile is the twin of the slab in the thirteenth, and the deck is a printed thing however well the tile
// itself is drawn. That is the same fault the garden had (see src/lawn.js), and the cure is the same:
// shapes far bigger than the tile, asked in metres of ground and carried at the deck's own corners.
//
//   paverTone(x, z)   three multipliers, one per colour channel, for how the stone lies in a place,
//                     averaged to one across the paved ground so that putting the patches in cannot
//                     quietly repaint the deck or brighten it.
//
//   pavingBend(x, z) how far the pattern of slabs is nudged off its grid, in metres, so the courses
//                     wander across the deck instead of marching in line with every other strip.
//
// What is actually out there on a pool deck, and what was put in.
//
//   Dust. A Thai pool deck in the hot months carries a film of dry dust blown in from the garden, and
//   limestone that has baked in the sun goes pale and warm with it. Pale, then, and warm: red up, blue
//   taken out, the green left nearly where it was — the same discovery the lawn made, that the middle
//   channel carries the light of a surface and dryness moves the two ends.
//
//   Damp. Every step out of the pool carries water onto the stone, and damp stone is darker and cooler
//   than dry. This is the one thing about a real pool deck that a pattern of slabs cannot guess at,
//   because it belongs to the water and not to the stone: it lies in a band along the coping and
//   nowhere else. It fades out over about two metres, and where it is strongest it pulls the tone all
//   the way to the damp end, so the dust is what dries out further off.
//
//   Wear. A little light and dark for where the stone has been walked and washed, on the scale of a
//   room. This is the only place the deck's light goes up and down; the dust and the damp move its
//   colour and leave its light alone.
//
// Both ends and both fields are read in the browser, where they go into the deck's own corners through
// `tintFromGround` in mesh.js, and again by tools/draw.js at every pixel it lays down (`broad` in
// surface-colours.js). One set of numbers, two readers, so the CPU drawing cannot flatten the deck.
//
// The multipliers multiply the stone colour in the engine's own light and are not screen bytes: 0.9 of
// a channel is a tenth of the light in it gone. Small numbers, then, on purpose.

import { groundPatch } from "./noise.js";
import { pavedGround } from "./court.js";
/**
 * How far apart the deck's corners stand, in metres. The tone cannot change faster than this, and the
 * narrowest things it carries — the damp band at the coping and the crust of dust a couple of metres
 * across — are about that wide, so one metre. All the paving together is about three hundred and fifty
 * square metres, so this is near four hundred corners on the whole deck: nothing beside the two million
 * pixels the software renderer is pushing, and the lawn's two-metre spacing does not have to come down
 * because a lawn's dryness is a good deal bigger than a dust drift.
 */
export const pavingVertexSpacing = 1;

/**
 * Where the stone is: `pavedGround` in src/court.js — the two side decks, the walkway, the paving
 * beyond the pool and the path out, about three hundred and fifty square metres of it. Everything
 * below walks that ground and no other, so the tone is measured over the deck the Villa actually lays:
 * this used to be one rectangle out to x = ±15.2, and since the court's outer edges came in to ±11.9
 * the three metres beyond them is lawn, whose dust and damp are not the stone's business.
 */
function samplePaved(step, at) {
	for (const g of pavedGround) {
		for (let x = g.x0; x <= g.x1; x += step) {
			for (let z = g.z0; z <= g.z1; z += step) at(x, z);
		}
	}
}

/** The pool's own mouth, as src/pool.js digs it and src/world.js lays the lawn around it. */
const pool = { x0: -5, x1: 5, z0: 2.1, z1: 7.1 };

// The two ends of the same stone. `dusty` is baked limestone under a film of garden dust: pale, warm,
// with the blue taken out. `damp` is the same stone wet: darker, cooler, a shade more blue in it.
const dusty = [1.11, 1.05, 0.89];
const damp = [0.89, 0.95, 1.11];

// The sizes the deck is allowed to vary at, in metres — all of them bigger than the three-metre slab
// pattern, which is the whole point, and all of them smaller than a deck strip, so that one strip of
// paving holds a dust patch and a damp one and does not go all one way the way a whole garden can.
// The lawn learned that (src/lawn.js): a field that wanders over forty metres is a gradient, not a
// lawn. The side strips are six metres and a half across since the court came in, so the drift is ten
// metres; the crust on top of it is a couple of metres, which is the size a visitor actually sees under
// their feet, and the tone
// could not have shown it at all until the deck's corners came down to one metre apart.
const dustWidth = 10;
const dustDetail = 3.5;
const crustWidth = 3.2;
const crustDetail = 1.3;
const wearWidth = 6;
const wearDetail = 2;

/** How far from the pool's edge a place is, in metres; nought once you are over the water. */
function fromPool(x, z) {
	const dx = Math.max(pool.x0 - x, x - pool.x1, 0);
	const dz = Math.max(pool.z0 - z, z - pool.z1, 0);
	return Math.sqrt(dx * dx + dz * dz);
}

/** How much of the damp belongs here: all of it at the coping, none of it two metres out. */
function wetness(x, z) {
	const d = fromPool(x, z);
	return Math.min(1, Math.max(0, 1 - (d - 0.55) / 1.5)) * 0.85;
}

/**
 * How dusty a place is, 0 (still its own stone) to 1 (baked pale and warm), and how walked a place is.
 *
 * Both are cut against the deck's own middle, measured over the deck at load, and not against a guess.
 * The first paving tone divided the raw field by a hand-picked range around 0.5 and the deck moved by a
 * point or two of a channel, which is nothing to see: the middle of that first field, measured over this
 * ground, sat at 0.36 and hardly anything in it reached 0.66, so nearly the whole deck came out at one
 * end of the blend and the patches were a mush. Cut at the deck's own median and its eighty-eighth
 * percentile, the field makes half the deck dry stone, a good eighth of it dusty, and a graded band
 * between — patches with edges in them, which is what a film of dust on stone looks like.
 */
function dustField(x, z) {
	// The seed was chosen, not found: out of fifty of them this is the one that leaves every deck strip
	// nearest the whole paving's own colour — no strip's mean is more than 3.0 per cent off it, where the
	// first seed tried put the west deck 3.4 per cent up in the red and the walkway 5.9 per cent under,
	// which is a warm deck beside a cool one and not a deck with dust on it.
	const drift = groundPatch(x + 40, z - 26, { broad: dustWidth, fine: dustDetail, seed: 21076 });
	// A crust on top of the drift: dust gathers thin and thick a couple of metres at a time, which is the
	// scale a person walking the deck sees. The first tone had only the drift and a whole deck strip came
	// out one flat dusty colour, ten metres of it together.
	const crust = groundPatch(x - 18, z + 63, { broad: crustWidth, fine: crustDetail, seed: 5501 });
	return 0.72 * drift + 0.28 * crust;
}

/** How walked and washed a place is: a field of its own, on the scale of a room. */
function wearField(x, z) {
	return groundPatch(x - 71, z + 19, { broad: wearWidth, fine: wearDetail, seed: 4471 });
}

/** Two quantiles of a field, read off the deck itself, half a metre at a time. */
function quantiles(field, lowQ, highQ) {
	const v = [];
	samplePaved(0.5, (x, z) => v.push(field(x, z)));
	v.sort((a, b) => a - b);
	return [v[Math.floor(lowQ * (v.length - 1))], v[Math.floor(highQ * (v.length - 1))]];
}

const dustCut = quantiles(dustField, 0.5, 0.88);
const wearMiddle = quantiles(wearField, 0.5, 0.5);

function dustiness(x, z) {
	const [lo, hi] = dustCut;
	return Math.min(1, Math.max(0, (dustField(x, z) - lo) / (hi - lo)));
}

/** How much lighter or darker a place is, about a sixteenth of a stop out at the ends. */
function wear(x, z) {
	return (wearField(x, z) - wearMiddle[0]) * 0.34;
}

function rawTone(x, z) {
	// Where the water is tracked the damp wins; further off the dust dries the stone out again.
	const dry = dustiness(x, z) * (1 - wetness(x, z));
	const lift = 1 + wear(x, z);
	return [
		(damp[0] + (dusty[0] - damp[0]) * dry) * lift,
		(damp[1] + (dusty[1] - damp[1]) * dry) * lift,
		(damp[2] + (dusty[2] - damp[2]) * dry) * lift,
	];
}

// What those multipliers average over the paved ground, so the patches vary the deck without moving
// it whole.
const pavedMean = (() => {
	const sum = [0, 0, 0];
	let n = 0;
	// Measured one metre at a time, which is the spacing its corners stand at anyway.
	samplePaved(1, (x, z) => {
		const t = rawTone(x, z);
		sum[0] += t[0];
		sum[1] += t[1];
		sum[2] += t[2];
		n++;
	});
	return sum.map((s) => s / n);
})();

/**
 * How far off its grid the paving pattern sits here, in metres: up to a metre and a half, over a
 * wavelength of about forty. The lawn does this (see `lawnBend` in src/lawn.js) and for the same reason,
 * which is that a pattern repeated in a grid is the thing a pattern must not be.
 *
 * The deck needs it more than the lawn does. The lawn's tile is six metres and its grass has no straight
 * line in it to follow; the paving's tile is three and a tenth and every line in it is a sawn edge, so
 * without a bend the courses of the west deck line up with the courses of the east deck and with the
 * walkway, and a visitor standing on the path can watch the same four-course pattern march away from
 * them four times over. A metre and a half of pull over forty is a strain of a few per cent on a slab —
 * cut stone varies by that much anyway — and it is enough to move the pattern off its grid everywhere.
 */
export function pavingBend(x, z) {
	return [
		(groundPatch(x + 61, z - 34, { broad: 41, fine: 15, seed: 8111 }) - 0.5) * 3.0,
		(groundPatch(x - 27, z + 48, { broad: 37, fine: 12, seed: 9277 }) - 0.5) * 3.0,
	];
}

/**
 * How the stone in a place differs from the paving's own colour: three multipliers, one per channel,
 * that average to one across the deck. Read as light, the way every colour multiplier here is.
 */
export function paverTone(x, z) {
	const t = rawTone(x, z);
	return [t[0] / pavedMean[0], t[1] / pavedMean[1], t[2] / pavedMean[2]];
}
