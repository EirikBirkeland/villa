// The stream: water that comes in at the north-east hedge and runs the length of the garden to the pond.
//
// WHAT IT IS. A shallow stone-lined channel, one metre and three quarters of water between coping stones,
// grass banks falling away from the coping to the lawn, a plank bridge where the garden path crosses it, and
// a lip at the end where the water falls a hand's height into the pond. It is 62 metres from head to mouth.
// It begins at the north-east hedge, which is the far corner of the property from the pond, and it ends at
// the pond's south edge, which is what the master asked for: the water comes from the other end of the
// garden and the pond is where it stops.
//
// WHY IT IS BUILT UP AND NOT DUG IN. The lawn of this Villa is a plane at y = 0 with a hole cut round the
// pond (`pondHole` in src/pond.js, cut by `buildGround` in src/world.js). There is no terrain to dig: a
// channel sunk below nought would be a trench whose floor is the sky, because the lawn plane carries on
// over the top of it. Cutting a snaking hole in the lawn is not on the cards either — `stoneLeft` cuts
// rectangles, and a curve is not a rectangle. So the watercourse is built the way a hundred Thai gardens
// build theirs: a lined channel standing a little above the grass, with a stone lip you can put a boot on
// and grass banks that run down and disappear under the lawn. The banks' feet are laid SIX CENTIMETRES
// UNDER the lawn plane, which is what makes the seam where grass meets bank a line of grass rather than a
// hairline of sky: the slope keeps going below the turf, so any ray that tries to slip through the joint is
// stopped inside the first centimetre of it. That is the same lesson the pond's shore learned at a
// centimetre and a half (`src/pond.js`), and it is written here because it is the one number in this file
// that cannot be changed without a browser complaining.
//
// WHY IT IS ONE MESH AND NOT SIXTY. The channel, the bed, the banks and the water are each a single strip
// built along the course with `poly` (src/mesh.js), resampled at 1.4 metres to a station. Sixty metres of
// channel is therefore four meshes and about a thousand vertices, and not sixty boxes: the walk in
// `src/ground.js` reads walls off the bounding boxes of meshes that say they collide, and sixty boxes along
// a snake would be sixty walls to test on every step of every frame. Keeping the water off the visitor is
// done instead by `blockers` below — one axis-aligned rectangle to each stretch of the course, handed to
// `makeGround` beside the pool's and the pond's own blocks, which is the mechanism that already works.
//
// THE WATER MOVES. The water strip's texture coordinates are laid in metres of ground along the course, so
// `vOffset` slides the pattern downstream at a stated speed in metres per second — the same trick the pond
// plays with its ripples (`pond.animate`), at eight times the speed, because a pond stills and a stream
// runs. Where it meets the pond it falls over a lip, and the fall is a second strip wearing the same
// flowing pattern turned the other way; the pond is handed the splash, so rings go out from the mouth every
// couple of seconds and the garden can see its own water arriving.

import { box, poly, groundUVs } from "./mesh.js";
import { randomGenerator } from "./noise.js";

/**
 * The centre line, in metres, from the head at the north-east hedge to the mouth at the pond's south edge.
 *
 * It is a snake and not a straight line for the same reason the hedge's crest is: a straight watercourse is
 * a drain, and this is a garden. The bends are wide — three or four metres of offset over twenty — because
 * a channel this narrow turned tighter than that reads as a kink in a hose. The course was laid to miss what
 * was already planted: the sala at x 8..13, the court's east deck to x 11.9, the palms, and the pond's two
 * south corner boulders, which the mouth passes between.
 */
export const course = [
	{ x: 22.6, z: -21.6 }, // at the north-east hedge, where the water comes in from outside the garden
	{ x: 21.8, z: -16.4 },
	{ x: 20.8, z: -10.6 },
	{ x: 20.4, z: -4.6 }, // east of the house, and the closest it comes: eight metres from the plaster
	{ x: 20.8, z: 1.4 },
	{ x: 21.4, z: 6.6 }, // east of the sala and of the court's east deck
	{ x: 21.0, z: 11.4 },
	{ x: 19.4, z: 15.4 }, // the corner: the garden turns west here
	{ x: 16.2, z: 18.0 },
	{ x: 11.0, z: 18.8 },
	{ x: 5.6, z: 18.8 },
	{ x: 0.6, z: 18.8 }, // the path out through the south gate crosses here, and the bridge is here
	{ x: -4.4, z: 18.8 },
	{ x: -9.2, z: 18.6 },
	{ x: -13.4, z: 18.4 },
	{ x: -16.6, z: 18.2 },
	{ x: -19.0, z: 17.9 },
	{ x: -20.3, z: 17.45 }, // the mouth: the pond's south edge, between its two corner boulders
];

/** Half the width of the water, metres. */
const HALF = 0.88;
/** How wide the coping stone is, laid flat on top of the channel's walls. */
const LIP = 0.16;
/** How high the coping stands above the lawn. A boot fits on it; a visitor steps over it without climbing. */
const DECK = 0.2;
/** How high the bed stands above the lawn. Two centimetres: the channel is lined, not sunk. */
const BED = 0.02;
/** How far the grass bank runs out from under the coping before it is level with the lawn again. */
const SLOPE = 0.62;
/** How far the bank's foot is buried under the lawn plane. See the head of this file: this is the seam. */
const TUCK = 0.06;
/** The water's surface: five centimetres under the coping, so the lip reads as a lip and the water sits in. */
const WATER_Y = DECK - 0.05;
/** How far the works reach from the centre line: what the walk must keep off, and what may not be planted. */
export const streamReach = HALF + SLOPE + 0.2;
/** The mouth, where the water leaves the channel and falls into the pond. `src/pond.js` clears its stones here. */
export const streamMouth = course[course.length - 1];
/** How wide the gap in the pond's rim stones is: the channel's width, plus the coping on each side. */
export const mouthGap = 2 * (HALF + LIP) + 0.2;
/** How the course is resampled: metres between stations of the strip. */
const STATION = 1.4;
/** Where the garden path crosses, and how wide the bridge's opening is along the course. */
const bridgeAt = { x: 0.6, z: 18.8, half: 1.15 };

/**
 * The course, resampled at an even spacing, with a unit normal at every station.
 *
 * The normal at a station is the mean of the two segments that meet there, which is what keeps the channel
 * the same width through a bend instead of opening a wedge on the outside of it.
 */
export function stations(step = STATION) {
	const out = [];
	// First: the running length of each original leg, so the resampling is even along the whole course.
	const legs = [];
	let total = 0;
	for (let i = 0; i < course.length - 1; i++) {
	 const a = course[i];
		const b = course[i + 1];
		const len = Math.hypot(b.x - a.x, b.z - a.z);
		legs.push(len);
		total += len;
	}
	const count = Math.max(8, Math.round(total / step));
	for (let k = 0; k <= count; k++) {
		let want = (k / count) * total;
		let i = 0;
		while (i < legs.length - 1 && want > legs[i]) {
			want -= legs[i];
			i++;
		}
		const a = course[i];
		const b = course[i + 1];
		const t = Math.max(0, Math.min(1, want / legs[i]));
		const x = a.x + (b.x - a.x) * t;
		const z = a.z + (b.z - a.z) * t;
		out.push({ x, z, run: (k / count) * total, i });
	}
	// Normals, from the mean direction of the two legs that meet at each station.
	for (let k = 0; k < out.length; k++) {
		const before = out[Math.max(0, k - 1)];
		const after = out[Math.min(out.length - 1, k + 1)];
		const dx = after.x - before.x;
		const dz = after.z - before.z;
		const len = Math.hypot(dx, dz) || 1;
		out[k].nx = -dz / len; // the normal points to the left of the way the water runs
		out[k].nz = dx / len;
	}
	return out;
}

/** The distance from a point to the centre line, in metres. */
export function distanceToStream(x, z) {
	let best = Infinity;
	for (let i = 0; i < course.length - 1; i++) {
		const a = course[i];
		const b = course[i + 1];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const sq = dx * dx + dz * dz;
		const t = sq ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / sq)) : 0;
		const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
		if (d < best) best = d;
	}
	return best;
}

/**
 * Whether a foot of ground stands in the stream and its banks.
 *
 * The garden asks this before it plants anything, the same way it asks `inPond`: a clump of sedge planted
 * inside a channel is grass growing out of water, and `tools/tuftfoot.js` would spend the next session
 * finding it.
 */
export function inStream(x, z, margin = 0) {
	return distanceToStream(x, z) < streamReach + margin;
}

/**
 * Build it. Returns the meshes, the blockers for `makeGround`, and `animate`.
 */
export function buildStream(scene, mats, shadows, { pond = null } = {}) {
	const rand = randomGenerator(4419);
	const built = [];
	const line = stations();

	// A box that spans the channel has its long axis along the section normal, and `ry` turns a box's local +z to
	// (sin ry, cos ry): the normal's x first, then its z. Turned the other way the plank lies along the water and
	// the coping stones stand end-on in the grass.
	const normalYaw = (s) => Math.atan2(s.nx, s.nz);

	/** One strip of the channel: a cross-section of [offset, height] pairs laid along the course. */
	function strip(name, section, mat, { uvAlong = false } = {}) {
		const positions = [];
		const uvs = [];
		const indices = [];
		for (let k = 0; k < line.length; k++) {
			const s = line[k];
			for (const [off, y] of section) {
				positions.push(s.x + s.nx * off, y, s.z + s.nz * off);
				// `u` is metres across the section and `v` metres along the course, so a pattern laid on
				// this strip is measured in ground and not in fractions of a shape.
				uvs.push(off, uvAlong ? s.run : y + off);
			}
		}
		const across = section.length;
		for (let k = 0; k < line.length - 1; k++) {
			for (let j = 0; j < across - 1; j++) {
				const a = k * across + j;
				const b = a + 1;
				const c = a + across;
				const d = c + 1;
				indices.push(a, c, b, b, c, d);
			}
		}
		const mesh = poly(scene, name, { positions, indices, uvs, mat });
		mesh.receiveShadows = true;
		built.push(mesh);
		return mesh;
	}

	// ---- the channel, the bed and the banks -------------------------------------
	//
	// The section, from the left bank's foot to the right one's. The coping is a flat band 16 cm wide on
	// top of the walls, which is what makes the whole thing read as built rather than as a wet dip in the
	// grass: a flat top edge catches the light along 62 metres of it, and nothing else in the garden does
	// that.
	//
	// FIVE STRIPS, NOT ONE. The first drawing of this laid the whole section — bank, coping, wall, bed, wall,
	// coping, bank — as a single strip, and the browser showed a grass band where the watercourse was and no
	// water at all: a strip joins its section points in order, so the one strip carried a lid of grass across
	// the top of the channel at coping height (`tools/pickat.js` answered `streamBanks` at every pixel that
	// should have been water). Each of the five pieces below therefore stops where the next begins: they meet
	// at an edge and never lie on one another, which is also why there is no flicker in the joint.
	const foot = HALF + SLOPE + TUCK * (SLOPE / DECK);
	const wallSouth = strip("streamWallSouth", [[-(HALF + LIP), DECK], [-HALF, DECK], [-(HALF - 0.14), BED]], mats.coping);
	const wallNorth = strip("streamWallNorth", [[HALF - 0.14, BED], [HALF, DECK], [HALF + LIP, DECK]], mats.coping);
	// The bed, in the same pale stone as the coping and the walls: a lined channel, and one material from wall
	// to wall means no line where the two meet. It is pale on purpose. The first bed wore the pond's silt, which
	// is nearly black, and twenty centimetres of water over a black floor paints as a wet gutter whatever is
	// done to the surface — the same lesson the pool's colour cost (v0.94.1: the pool's blue lives in the tile
	// under the film and not in the film).
	const bed = strip("streamBed", [[-(HALF - 0.14), BED], [HALF - 0.14, BED]], mats.coping);
	// The grass banks: the two outer legs, in lawn, laid with the lawn's own pattern measured from the ground
	// so a bank and the turf it rises out of are the same grass at the same scale.
	const bankSouth = strip("streamBankSouth", [[-foot, -TUCK], [-(HALF + LIP), DECK]], mats.lawn);
	const bankNorth = strip("streamBankNorth", [[HALF + LIP, DECK], [foot, -TUCK]], mats.lawn);
	for (const m of [wallSouth, wallNorth]) groundUVs(m, 1.1);
	groundUVs(bed, 0.7);
	for (const m of [bankSouth, bankNorth]) groundUVs(m, 6);

	// ---- the water -------------------------------------------------------------
	//
	// Laid 2 cm inside the coping's inner edge, so the water's edge is under the stone's overhang and not
	// beside it: from a visitor's eye on the bank, the water tucks under the lip the way it does in a real
	// channel, and there is no line of bed between the two.
	const water = strip(
		"streamWater",
		[
			[-(HALF - 0.02), WATER_Y],
			[HALF - 0.02, WATER_Y],
		],
		mats.streamWater,
		{ uvAlong: true }
	);
	water.isPickable = true;

	// ---- the head: where the water comes in over the hedge ----------------------
	const head = line[0];
	const headWall = box(scene, "streamHeadStone", {
		x: 0.5,
		y: DECK + 0.1,
		z: 2 * (HALF + LIP) + 0.3,
		px: head.x - head.nx * 0.0,
		py: (DECK + 0.1) / 2 - 0.04,
		pz: head.z,
		mat: mats.stone,
		ry: normalYaw(head),
	});
	headWall.receiveShadows = true;
	built.push(headWall);

	// ---- the mouth: a lip, a fall, and the pond taking the water -----------------
	const mouth = line[line.length - 1];
	const before = line[line.length - 2];
	const runX = mouth.x - before.x;
	const runZ = mouth.z - before.z;
	const runLen = Math.hypot(runX, runZ) || 1;
	const fallTo = -0.035; // the pond's own surface, `WATER_Y` in src/pond.js
	// How far the veil travels before it reaches the water. The pond's gravel band is a metre wide between
	// the lawn's cut edge and the water's edge, and the mouth stands at the outer edge of it: shorter than this and
	// the water goes down onto the gravel and stops, which is a stream that has run out of garden rather than
	// into a pond. The rim stones are cleared here (`inStreamMouth` in src/pond.js) so the sheet has a gap to
	// pass through.
	const fallRun = 1.35;
	const fall = poly(scene, "streamFall", {
		positions: [
			mouth.x + mouth.nx * -(HALF - 0.06), WATER_Y, mouth.z + mouth.nz * -(HALF - 0.06),
			mouth.x + mouth.nx * (HALF - 0.06), WATER_Y, mouth.z + mouth.nz * (HALF - 0.06),
			mouth.x + mouth.nx * -(HALF - 0.06) + (runX / runLen) * fallRun, fallTo,
			mouth.z + mouth.nz * -(HALF - 0.06) + (runZ / runLen) * fallRun,
			mouth.x + mouth.nx * (HALF - 0.06) + (runX / runLen) * fallRun, fallTo,
			mouth.z + mouth.nz * (HALF - 0.06) + (runZ / runLen) * fallRun,
		],
		uvs: [0, 0, 1, 0, 0, -1.6, 1, -1.6],
		// Two triangles for the veil. The winding does not matter here: the material is self-lit and painted
		// from both sides, so there is no normal for a face to be wrong about.
		indices: [0, 1, 2, 1, 3, 2],
		mat: mats.streamFall,
	});
	fall.isPickable = false;
	built.push(fall);
	// The lip stone the water goes over, and the stone it lands on. Both are stone the colour of the
	// coping, and both are low enough that the pond's own rim stones still read as the pond's edge.
	const lipStone = box(scene, "streamLipStone", {
		// `ry` turns the box's local z across the channel and its local x along the water's way, so the stone that
		// lies across the water is the long one in z.
		x: 0.42,
		y: 0.1,
		z: 2 * HALF + 2 * LIP + 0.2,
		px: mouth.x,
		py: DECK - 0.06,
		pz: mouth.z,
		mat: mats.coping,
		ry: normalYaw(mouth),
	});
	lipStone.receiveShadows = true;
	built.push(lipStone);
	// The landing stone the water falls on, in the pond, a hand under the veil: without it the veil ends in
	// mid-air over the water and the eye reads a picture of water rather than water arriving. It is not
	// called an apron here: this folder already uses that word for the free stone round the pool deck.
	const landing = box(scene, "streamLandingStone", {
		x: 0.7,
		y: 0.08,
		z: 2 * HALF,
		px: mouth.x + (runX / runLen) * (fallRun * 0.72),
		py: 0.02,
		pz: mouth.z + (runZ / runLen) * (fallRun * 0.72),
		mat: mats.coping,
		ry: normalYaw(mouth),
	});
	landing.receiveShadows = true;
	built.push(landing);

	// ---- the bridge over the garden path ----------------------------------------
	//
	// Six planks across, two stringers under them, and the deck standing eight centimetres proud of the
	// coping so a person coming along the path steps up onto it rather than down into the channel. The
	// planks say they collide, which is how the walk finds them: `src/ground.js` takes anything flat and
	// level with the ground as a floor, and a bridge is that.
	//
	// The bridge's own station, and not the mouth's: the course turns between the two, and a plank laid on the
	// mouth's bearing across the channel at the path would lie askew in the water.
	const atBridge = line.reduce((best, s) =>
		Math.hypot(s.x - bridgeAt.x, s.z - bridgeAt.z) < Math.hypot(best.x - bridgeAt.x, best.z - bridgeAt.z) ? s : best
	);
	const plankYaw = normalYaw(atBridge);
	const flowX = -atBridge.nz;
	const flowZ = atBridge.nx;
	const bridge = [];
	const deckY = DECK + 0.08;
	const plankLen = 2 * (HALF + SLOPE);
	for (let i = 0; i < 6; i++) {
		const along = (i - 2.5) * 0.3;
		const px = bridgeAt.x + flowX * along;
		const pz = bridgeAt.z + flowZ * along;
		const plank = box(scene, `bridgePlank${i}`, {
			x: 0.26,
			y: 0.06,
			z: plankLen,
			px,
			py: deckY,
			pz,
			mat: mats.wood,
			ry: plankYaw,
		});
		plank.receiveShadows = true;
		plank.checkCollisions = true;
		bridge.push(plank);
		built.push(plank);
	}
	for (const side of [-1, 1]) {
		const stringer = box(scene, `bridgeStringer${side > 0 ? "North" : "South"}`, {
			x: 2.2,
			y: 0.12,
			z: 0.12,
			px: bridgeAt.x,
			py: deckY - 0.09,
			pz: bridgeAt.z + side * (plankLen / 2 - 0.16),
			mat: mats.wood,
			ry: plankYaw,
		});
		stringer.receiveShadows = true;
		bridge.push(stringer);
		built.push(stringer);
	}
	if (shadows) for (const m of bridge) shadows.addShadowCaster(m);

	// ---- keeping the walk out of the water --------------------------------------
	//
	// One rectangle to each stretch of the course, and the stretch the bridge stands on is cut in two so
	// the path stays a path. These go to `makeGround` beside the pool's and the pond's own blocks; the
	// meshes above say nothing about collisions on purpose, because a bounding box round 62 metres of
	// snake is a wall across the whole garden.
	const blockers = [];
	const reach = streamReach + 0.12;
	/**
	 * One block for a stretch of the watercourse: the stretch's own length, widened by `reach` on each side of
	 * the water, and run past its ends by `reach` only where the end joins the next stretch. `padP`/`padQ` are
	 * switched off at a cut where the bridge's opening sits — padded there, the block closes the path again and
	 * a visitor coming out of the gate walks into thin air.
	 */
	const pieceSeg = (p, q, padP = true, padQ = true) => {
		const dx = q.x - p.x;
		const dz = q.z - p.z;
		const len = Math.hypot(dx, dz) || 1;
		const ux2 = dx / len;
		const uz2 = dz / len;
		const nx2 = -uz2;
		const nz2 = ux2;
		const s0 = -(padP ? reach : 0);
		const s1 = len + (padQ ? reach : 0);
		let x0 = Infinity;
		let x1 = -Infinity;
		let z0 = Infinity;
		let z1 = -Infinity;
		for (const s of [s0, s1]) {
			for (const c of [-reach, reach]) {
				const x = p.x + ux2 * s + nx2 * c;
				const z = p.z + uz2 * s + nz2 * c;
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (z < z0) z0 = z;
				if (z > z1) z1 = z;
			}
		}
		blockers.push([x0, x1, z0, z1]);
	};
	for (let i = 0; i < course.length - 1; i++) {
		const a = course[i];
		const b = course[i + 1];
		// The bridge's opening: split this leg if it runs under the bridge.
		const nearBridge =
			Math.min(a.x, b.x) - reach < bridgeAt.x + bridgeAt.half &&
			Math.max(a.x, b.x) + reach > bridgeAt.x - bridgeAt.half &&
			Math.min(a.z, b.z) - reach < bridgeAt.z + bridgeAt.half &&
			Math.max(a.z, b.z) + reach > bridgeAt.z - bridgeAt.half;
		if (!nearBridge) {
			pieceSeg(a, b);
			continue;
		}
		// Where the deck's opening falls along this leg, in whichever order the leg runs: the water is kept out
		// up to the near edge of the deck and from its far edge on, and the opening itself is left open.
		const legLen = Math.hypot(b.x - a.x, b.z - a.z) || 1;
		const ux = (b.x - a.x) / legLen;
		const uz = (b.z - a.z) / legLen;
		// Where the deck's opening falls along this leg. The leg the bridge stands on runs east and west, so the
		// deck's two edges are found by their x, and the order the leg runs in is sorted out afterwards.
		const tEdge = (ex) => (ex - a.x) * ux + (bridgeAt.z - a.z) * uz;
		const tLo = Math.max(0, Math.min(tEdge(bridgeAt.x - bridgeAt.half), tEdge(bridgeAt.x + bridgeAt.half)));
		const tHi = Math.min(legLen, Math.max(tEdge(bridgeAt.x - bridgeAt.half), tEdge(bridgeAt.x + bridgeAt.half)));
		const at = (t) => ({ x: a.x + ux * t, z: a.z + uz * t });
		if (tLo > 0.2) pieceSeg(a, at(tLo), true, false);
		if (legLen - tHi > 0.2) pieceSeg(at(tHi), b, false, true);
	}

	// ---- the flow ---------------------------------------------------------------
	//
	// Eight centimetres a second along the course, which is a slow stream and the right speed for a channel
	// this wide: faster and the pattern smears at the frame rates this Villa is drawn at, slower and it
	// reads as a pond that has been told to move. The bed does NOT move — the bottom of a stream
	// stays where it is — and the banks do not either.
	const FLOW = 0.085;
	let splashIn = 0.8;
	return {
		meshes: built,
		blockers,
		get length() {
			return line[line.length - 1].run;
		},
		get waterY() {
			return WATER_Y;
		},
		get reach() {
			return streamReach;
		},
		mouth: { x: mouth.x, z: mouth.z },
		/** How far a foot of ground stands from the water's centre line — for a tool asking what is in the way. */
		distanceTo: (x, z) => distanceToStream(x, z),
		animate(time, delta) {
			const flow = mats.streamWater && mats.streamWater.bumpTexture;
			if (flow) {
				// `v` runs along the course in metres, so a slide of the pattern by one metre of `v` is the
				// water moving one metre downstream.
				flow.vOffset = -time * FLOW;
				flow.uOffset = 0.004 * Math.sin(time * 0.7);
			}
			const fallSkin = mats.streamFall && mats.streamFall.opacityTexture;
			if (fallSkin) fallSkin.vOffset = -time * 0.9;
			// And the pond takes the water with a ring, every couple of seconds, at the place it lands.
			if (pond && pond.splash) {
				splashIn -= delta;
				if (splashIn <= 0) {
					splashIn = 1.9 + rand() * 1.1;
					pond.splash(mouth.x + (runX / runLen) * 1.2, mouth.z + (runZ / runLen) * 1.2, {
						across: 0.2,
						span: 1.5,
						show: 0.5,
						life: 2.2,
					});
				}
			}
		},
	};
}
