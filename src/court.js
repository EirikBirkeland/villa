// The pool court: where its cut stone lies, and where the dirt beds are cut out of it.
//
// This one file is the plan of the paved ground, because four files read it and they must not
// disagree: `src/world.js` lays its paving slabs from these rectangles, `src/paving.js` averages the
// stone's broad tone over them (a tone measured over ground that is not there any more would be a
// tone measured over nothing), `src/garden.js` lays its grass fringes along their edges, and
// `tools/draw.js` asks this file where the dirt of a bed is so that its drawing weathers the borders
// and not the laterite at the foot of the house.
//
// The court is a band of stone down the middle, from the terrace face out past the far end of the
// pool, with a wide deck on each side of the water. It is not the whole garden: the lawn runs up to
// the stone on every side, and the dirt beds below are holes in the stone and not a picture of dirt
// laid on top of it.
//
// Why the outer edges stand at x = ±11.9. They used to stand at ±15, which made the court a 30 m
// apron of stone round a 10 x 5 m pool: photographed straight down from 26 m, the paving was 38% of
// the frame against 24% of grass, and a villa about a pool had paved itself into a plaza. Pulling
// both edges in by 3.1 m gives 108 m2 back to the lawn and still leaves 4.15 m of stone outside
// each border — room to lay a sunbed and to walk behind it — plus a metre of stone between the
// coping and the dirt, so the water can still be walked all the way round.

import { groundPatch } from "./noise.js";

/** The two outer edges of the court's stone, as a distance from the pool's centre line. */
export const courtEdge = 11.9;

/**
 * How far out the pool's own wall reaches from the water's edge, in metres of ground: src/pool.js digs the
 * pit with four walls 30 cm thick, so its shell stands at x = ±5.3 and z = 1.8 and 7.4 while the water
 * stands at ±5 and 2.1 and 7.1.
 *
 * The court's stone is laid against THAT, not against the water and not against the capstone. Three things
 * are true of the capstone's 0.42 m that no single number in the file knows: it stands 9 cm proud of the
 * paving, it overhangs the pit by 0.42 and the paving used to stop 2.5 cm beyond it. So there was a slot
 * all the way round the water, 2.5 cm wide and 7 cm deep, between the cap's outer edge and the stone, and
 * the only thing under it was the lawn — which is how the grass came to be showing at the water's edge at
 * all. Bring the stone in to the wall shell and the cap stands on stone the whole way round, the slot is
 * gone, and the grass is buried under the slab instead of meeting the pool.
 */
export const poolShell = { x: 5.3, z0: 1.8, z1: 7.4 };

/**
 * Every piece of paved ground, as `x0 x1 z0 z1` in metres of ground. `deckWest` and `deckEast` are
 * the deck as it stands before its beds are cut out of it (see `courtBeds`).
 *
 * No two of these overlap, and none of them is a hair off another: every slab is a solid box whose top face
 * lies at y = 0.14, so two rectangles that overlap by even 5 mm lay two coplanar top faces 5 mm apart in
 * depth, and those fight for every pixel that falls on them. The four pieces round the water therefore meet
 * on the same four numbers (`poolShell`), and the grass is laid 15 cm inside them by src/world.js.
 */
export const pavedGround = [
	{ name: "deckWest", x0: -courtEdge, x1: -poolShell.x, z0: -2.2, z1: 15.8 },
	{ name: "deckEast", x0: poolShell.x, x1: courtEdge, z0: -2.2, z1: 15.8 },
	{ name: "deckWalk", x0: -poolShell.x, x1: poolShell.x, z0: -1.0, z1: poolShell.z0 }, // between the terrace and the water
	{ name: "deckFar", x0: -poolShell.x, x1: poolShell.x, z0: poolShell.z1, z1: 16.2 }, // and beyond the far end of the pool
	{ name: "path", x0: -1.7, x1: 1.7, z0: 15.5, z1: 21.5, y: 0.12 }, // the way out through the south
];

/**
 * The planting beds cut out of the court's stone, one along each long side of the water, the east
 * one split so a person comes down off the sala's steps onto stone.
 *
 * A metre of stone is left between the coping and the dirt, so the pool's whole perimeter stays
 * walkable, and both borders stop at the terrace's face, which is where the court's stone ends.
 */
export const courtBeds = [
	{ name: "bedWest", x0: -7.75, x1: -6.05, z0: 0.7, z1: 9.0 },
	{ name: "bedEastNorth", x0: 6.05, x1: 7.75, z0: 0.7, z1: 4.4 },
	{ name: "bedEastSouth", x0: 6.05, x1: 7.75, z0: 6.4, z1: 9.0 },
];

/** How high the dirt in those beds stands: below the paving's 0.14, above the lawn's nought. */
export const bedTop = 0.045;

/**
 * How the dirt in a bed differs from dirt: a little darker where it is damp and shaded under the
 * planting, a little drier and paler where the sun gets at it. The field averages to one, so this
 * moves the garden's own dirt about inside a bed instead of repainting it — the same argument the
 * lawn's patches and the deck's dust make, at a tenth of their span.
 *
 * Outside the beds it answers one, and that matters: the same `mats.earth` paves the beds at the foot
 * of the house, which wear no tone at all, and `tools/draw.js` shades by material and would otherwise
 * paint this weathering on laterite that has none.
 */
export function bedTone(x, z) {
	const inBed = courtBeds.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);
	if (!inBed) return [1, 1, 1];
	const p = groundPatch(x, z, { broad: 3.4, fine: 1.1, seed: 4407 }) - 0.5;
	return [1 + p * 0.2, 1 + p * 0.15, 1 + p * 0.08];
}
