// The stream: water that comes in at the back hedge and runs straight down the garden to the pond.
//
// WHAT IT IS. A shallow stone-lined channel, one metre and three quarters of water between coping stones,
// grass banks falling away from the coping to the lawn, and a lip at the end where the water falls a hand's
// height into the pond. It is 34 metres from head to mouth. It begins at the north hedge — the back of the
// property, the side away from the gate — and it ends at the pond's north edge, and it goes there in nearly a
// straight line. That is the master's ordering, and it is worth keeping in its own words, because the first
// version of this went the other way about: it started at the north-east corner, ran the length of the east
// side, turned the corner and followed the whole south boundary west to the pond — 62 metres of snake that
// went round the entire yard. The master's word for that was that it ran in the opposite direction to the one
// he intended, and he asked for a stream that goes straight towards the back of the property.
//
// WHY IT IS STRAIGHT AND NOT BENT, AND BENT AND NOT STRAIGHT. A watercourse laid with a ruler is a drain and
// the garden will say so. A watercourse that wanders is the 62-metre mistake over again. So the centre line
// here holds one bearing and sways across it: two metres of sideways drift over thirty-four of ground, one
// long swing and a shorter one against it, with no turn sharper than a couple of degrees to a station. That
// is how a stream in flat ground behaves — it goes where it was going and changes its mind by inches. The
// numbers are written out in `course` below rather than generated, so the next session can see the sway and
// argue with it.
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
// built along the course with `poly` (src/mesh.js), resampled at 1.4 metres to a station. Thirty-four metres
// of channel is therefore four meshes and about a thousand vertices, and not thirty-four boxes: the walk in
// `src/ground.js` reads walls off the bounding boxes of meshes that say they collide, and thirty-four boxes
// along a line would be thirty-four walls to test on every step of every frame. Keeping the water off the
// visitor is done instead by `blockers` below — one axis-aligned rectangle to each stretch of the course,
// handed to `makeGround` beside the pool's and the pond's own blocks, which is the mechanism that already
// works.
//
// THE WATER MOVES. The water strip's texture coordinates are laid in metres of ground along the course, so
// `vOffset` slides the pattern downstream at a stated speed in metres per second — the same trick the pond
// plays with its ripples (`pond.animate`), at eight times the speed, because a pond stills and a stream
// runs. Where it meets the pond it falls over a lip, and the fall is a second strip wearing the same
// flowing pattern turned the other way; the pond is handed the splash, so rings go out from the mouth every
// couple of seconds and the garden can see its own water arriving.

import { box, crumple, groundUVs, poly, skinTint, sphere } from "./mesh.js";
import { randomGenerator } from "./noise.js";

/**
 * The centre line, in metres, from the head at the back (north) hedge to the mouth at the pond's north edge.
 *
 * One bearing, with a sway across it: the line never strays more than a metre either side of x = -20.4 over
 * thirty-four metres of ground. The sway is two waves laid one on top of the other — a long one and a shorter
 * one against it — because a single wave reads as a drawn arc and two of unequal length read as water that
 * went on its way. Nothing here turns more than a couple of degrees: the master asked for no major bends, and
 * a channel this narrow shows a bend at once.
 *
 * The line was laid where the garden would let it. `tools/streamroute.js` walks a proposed course and names
 * everything standing in it: the six lawn boulders that were sown at x -19 to -22.5 have been moved west of
 * the water for that reason, and the palms at x -17 stand far enough off that their fronds shade the channel
 * without a trunk in the water. The head stops a metre and a half short of the hedge, because the hedge's own
 * box is seventy centimetres thick and the coping would otherwise be buried in it.
 */
export const course = [
	{ x: -19.5, z: -20.4 }, // the head: the water comes in at the back hedge, a metre and a half short of it
	{ x: -19.62, z: -17.2 },
	{ x: -20.28, z: -13.78 },
	{ x: -21.06, z: -9.97 },
	{ x: -21.06, z: -6.16 },
	{ x: -21.07, z: -2.34 },
	{ x: -21.44, z: 1.47 }, // the furthest the water swings west
	{ x: -21.22, z: 5.28 },
	{ x: -20.19, z: 9.09 },
	{ x: -19.5, z: 12.9 }, // the mouth: the pond's north edge, between its two corner boulders
];

/** The widest the water gets, metres: the mean half-width with both of its waves at their top. */
const HW_MAX = 1.07;
/** The widest the bare damp band outside the water gets. */
const BERM_MAX = 0.64;
/** How far the grass apron runs out beyond the bare band before it is level with the lawn again. */
const APRON = 0.62;
/** How far the apron's foot is buried under the lawn plane. See the head of this file: this is the seam. */
const TUCK = 0.06;
/** How far the works reach from the centre line: where the grass apron ends and the lawn begins again. */
export const streamReach = HW_MAX + BERM_MAX + APRON;
/**
 * How far the walk must be kept from the centre line: the water at its widest and a hand's width of bank to
 * stand on. This is deliberately much tighter than `streamReach`. The pond stops a visitor at the water and
 * lets them stand on the rim — "standing on one is what a pond rim is for" — and a stream's dirt bank is the
 * same gift: you may walk the bank of this watercourse and crouch at its edge, which the old dressed channel,
 * blocked a metre and eight tenths out, would not let you do.
 */
export const streamKeepOff = HW_MAX + 0.2;
/** The mouth, where the water leaves the channel and falls into the pond. `src/pond.js` clears its stones here. */
export const streamMouth = course[course.length - 1];
/** How wide the gap in the pond's rim stones is: the water at the mouth, plus a boulder on each side. */
export const mouthGap = 2 * HW_MAX + 0.5;
/** How the course is resampled: metres between stations of the strip. */
const STATION = 0.9;

/**
 * The four phases of the sway. FIXED, and not drawn with the random generator, and this is the one number in
 * this file that is a rule and not a taste: the shape of the water's edge has to be answerable by the garden
 * before the garden is built, because `inStream` asks how wide the water is at a given place in order to let
 * grass grow up to it and not in it. A phase drawn inside `buildStream` would be invisible to that question,
 * and the answer would be a guess.
 */
const SWAY = [0.7, 2.4, 1.1, 4.2];
/** Half the width of the water at a running distance along the course. */
export function halfAtRun(run) {
	return 0.8 + 0.17 * Math.sin(run * 0.29 + SWAY[0]) + 0.1 * Math.sin(run * 0.71 + SWAY[1]);
}
/** How wide the bare damp band is at a running distance. */
export function bermAtRun(run) {
	return 0.44 + 0.2 * Math.sin(run * 0.23 + SWAY[2]);
}
/** How high the bank's inner lip stands at a running distance. */
export function deckAtRun(run) {
	return 0.17 + 0.055 * Math.sin(run * 0.41 + SWAY[3]);
}

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

/** The distance from a point to the centre line, and how far along the course the nearest point lies. */
export function streamAt(x, z) {
	let best = Infinity;
	let run = 0;
	let walked = 0;
	for (let i = 0; i < course.length - 1; i++) {
		const a = course[i];
		const b = course[i + 1];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const len = Math.hypot(dx, dz);
		const sq = len * len;
		const t = sq ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / sq)) : 0;
		const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
		if (d < best) {
			best = d;
			run = walked + len * t;
		}
		walked += len;
	}
	return { d: best, run };
}

/** The distance from a point to the centre line, in metres. */
export function distanceToStream(x, z) {
	return streamAt(x, z).d;
}

/**
 * Whether a foot of ground stands IN THE WATER.
 *
 * This used to mean "anywhere near the watercourse", out to `streamReach` of 1.7 metres, and the garden obeyed:
 * no clump of sedge within a metre and three quarters of the channel, which bought a bald ring down both banks
 * and a stream that had been swept clean. The pond was asked the same question and answered it the other way —
 * a 6 cm margin, because "the sedges at a real edge grow UP TO the water and a little into it" — and the
 * watercourse now takes the same answer: the margin is measured from the water's own edge at that place along
 * the course, which is why `halfAtRun` is fixed and exported rather than drawn at build time. Stones are kept
 * off by `inStreamStone` below, so grass comes where there is soil and stops where there is rock.
 */
export function inStream(x, z, margin = 0) {
	const at = streamAt(x, z);
	return at.d < halfAtRun(at.run) + margin;
}

let stoneFeet = [];
/**
 * Whether a foot of ground stands on one of the watercourse's stones. `buildStream` fills this as it lays them,
 * at each stone's widest half-span, and the garden asks it before it plants a clump — the same bargain the
 * pond keeps with `inPondStone`. It is better to lose a tuft of sedge than to grow one out of a boulder.
 */
export function inStreamStone(x, z) {
	for (const r of stoneFeet) if (Math.hypot(x - r.x, z - r.z) < r.r) return true;
	return false;
}

/**
 * Build it. Returns the meshes, the blockers for `makeGround`, and `animate`.
 */
export function buildStream(scene, mats, shadows, { pond = null } = {}) {
	const rand = randomGenerator(4419);
	const built = [];
	const line = stations();

	// How the channel is shaped at each station. Three numbers, each with its own wave, and a little jitter on
	// top of the waves:
	//
	//   hw    half the width of the water. It breathes between about 0.55 and 1.05 metres. A watercourse of one
	//         width throughout is a gutter: real ones are pinched where a stone sits and wider where the water
	//         has been allowed to spread, and the eye reads the variation as water having been there.
	//   berm  the bare, damp band between the water's edge and the grass. This is the dirt the master asked
	//         for, and it is the pond's own trick: the pond has `MARGIN`, a band of wet gravel between the
         //         water and the cut edge of the lawn, and the grass never meets the water directly.
	//   deck  how high the bank's inner lip stands. Uneven, because a level top edge along thirty-four metres
	//         is precisely the dressed look that made the first version a canal.
	//
	// The waves are of deliberately unequal length (0.29, 0.71, 0.23 and 0.41 radians to the metre) so nothing
	// along the course repeats at a pitch the eye can catch.
	const sway = SWAY;
	for (const s of line) {
		s.hw = halfAtRun(s.run) + (rand() - 0.5) * 0.07;
		s.berm = bermAtRun(s.run) + (rand() - 0.5) * 0.08;
		s.deck = deckAtRun(s.run);
		s.bedY = s.deck - 0.2;
		// The water's surface: five and a half centimetres under the lip. Deep enough that the bank's face shows
		// above the water as a band of damp earth; shallow enough that the bed is plainly there under it.
		s.waterY = s.bedY + 0.145;
		// How far the grass apron reaches.
		s.outer = s.hw + s.berm + APRON;
	}

	// A box that spans the channel has its long axis along the section normal, and `ry` turns a box's local +z to
	// (sin ry, cos ry): the normal's x first, then its z. Turned the other way the plank lies along the water and
	// the coping stones stand end-on in the grass.
	const normalYaw = (s) => Math.atan2(s.nx, s.nz);

	/**
	 * One strip of the watercourse: a cross-section laid along the course. `sectionAt(station)` answers the
	 * [offset, height] pairs at that station, because an organic edge is not the same width all the way down —
	 * a section fixed once is a trench with a snake drawn on it. Every station must answer the SAME NUMBER of
	 * points, or the strip's triangles join the wrong vertices and the bank turns inside out.
	 */
	function strip(name, sectionAt, mat, { uvAlong = false } = {}) {
		const positions = [];
		const uvs = [];
		const indices = [];
		for (let k = 0; k < line.length; k++) {
			const s = line[k];
			for (const [off, y] of sectionAt(s)) {
				positions.push(s.x + s.nx * off, y, s.z + s.nz * off);
				// `u` is metres across the section and `v` metres along the course, so a pattern laid on
				// this strip is measured in ground and not in fractions of a shape.
				uvs.push(off, uvAlong ? s.run : y + off);
			}
		}
		const across = sectionAt(line[0]).length;
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
	// DIRT, AND NOT DRESSED STONE. The first version was lined: a stone wall each side, a pale stone bed, and
	// a flat coping band sixteen centimetres wide running the whole thirty-four metres. It was well built and
	// it was a canal. The master's word for what he wanted was "organic, and dirt-based", and he named the
	// pond as the model — so the lining is gone. The section, from the water outward, is now the bank's face
	// (earth), a bare damp band of earth (the `berm`), and the grass apron beyond; and one material, the
	// pond's own silt, runs from the bed up over the lip and out to the grass, so there is no line where one
	// built thing stops and another begins. That is how the pond hides its straight edges too: damp gravel,
	// sunk stones, and grass grown up to the water (`src/pond.js`).
	//
	// SEVEN STRIPS, NOT ONE. The lesson that cost a session stands: a strip joins its section points in order,
	// so one strip carrying the whole section lays a lid of grass across the water — `tools/pickat.js` answered
	// `streamBanks` at every pixel that should have been water. Each strip below stops where the next begins:
	// they meet at an edge and never lie on one another, which is also why there is no flicker in the joint.
	//
	// THE BED IS EARTH AND THE WATER IS TUNED FOR IT. The old bed was pale coping because the pond's silt AT
	// ITS FIRST COLOUR was nearly black, and twenty centimetres of water over a black floor paints as a wet
	// gutter whatever the surface is doing. `mats.pondSilt` has been lightened since, to a damp brown that is
	// allowed to be seen, and the stream's film has been taken off blue and put back to the pond's tannin: a
	// shallow run of muddy water over a mud bottom, which is what a lowland stream actually is.
	// The earth the channel is cut in. The fallback is for a checkout where `src/materials.js` has not yet been
	// committed with `streamEarth` in it (it carries another hand's staged work): the pond's silt is the same
	// dirt a shade greener, and better than a strip with no material at all.
	const earth = mats.streamEarth || mats.pondSilt;
	const faceSouth = (s) => [[-s.hw, s.deck], [-(s.hw - 0.1), s.bedY]];
	const faceNorth = (s) => [[s.hw - 0.1, s.bedY], [s.hw, s.deck]];
	const wallSouth = strip("streamWallSouth", faceSouth, earth);
	const wallNorth = strip("streamWallNorth", faceNorth, earth);
	const bed = strip("streamBed", (s) => [[-(s.hw - 0.1), s.bedY], [s.hw - 0.1, s.bedY]], earth);
	// The bare bands either side of the water: the dirt, and the pond's `MARGIN` over again. Grass is not
	// allowed to reach the water anywhere in this garden, and this is why — the cut edge of a lawn meeting
	// water is a black hairline and a green fringe at the same time.
	//
	// EVERY SECTION RUNS FROM THE NEGATIVE OFFSET TO THE POSITIVE ONE, and this is not a style. Wound the other
	// way, `poly` computes a normal pointing DOWN into the bank, and the surface is then lit by the ground's own
	// light instead of by the sky: the south bank came out (47,51,14) — more green than red, the colour of the
	// lawn's bounce seen from inside the earth — while the north bank, wound rightly, was brown. A reversed
	// section is invisible in the geometry and plain as day in the picture.
	const bankSouth = strip("streamBermSouth", (s) => [[-(s.hw + s.berm), 0.015], [-s.hw, s.deck]], earth);
	const bankNorth = strip("streamBermNorth", (s) => [[s.hw, s.deck], [s.hw + s.berm, 0.015]], earth);
	// The grass aprons, in the lawn's own material with its pattern measured from the ground, so a bank and the
	// turf it rises out of are one sward. Their feet are laid TUCK under the lawn plane: the seam where grass
	// meets bare earth keeps going below the turf, so no ray can slip through the joint and find sky.
	const apronSouth = strip("streamBankSouth", (s) => [[-s.outer, -TUCK], [-(s.hw + s.berm), 0.015]], mats.lawn);
	const apronNorth = strip("streamBankNorth", (s) => [[s.hw + s.berm, 0.015], [s.outer, -TUCK]], mats.lawn);
	// A bend in the pattern's grid: soil laid on a grid is a floor. Two sines of unequal length push the tiles
	// off their lines by a decimetre, which is enough that the eye cannot find the repeat.
	const soilBend = (x, z) => [0.13 * Math.sin(z * 0.71), 0.13 * Math.sin(x * 0.63)];
	for (const m of [wallSouth, wallNorth, bankSouth, bankNorth]) groundUVs(m, 0.8, soilBend);
	groundUVs(bed, 0.55, soilBend);
	for (const m of [apronSouth, apronNorth]) groundUVs(m, 6);

	// ---- the water -------------------------------------------------------------
	//
	// Laid 3 cm inside the bank's face, so the water's edge is tucked under the lip rather than drawn beside it:
	// from a visitor's eye on the bank the water disappears under the earth the way it does where a stream has
	// been eating its own bank for years.
	const water = strip(
		"streamWater",
		(s) => [[-(s.hw - 0.03), s.waterY], [s.hw - 0.03, s.waterY]],
		mats.streamWater,
		{ uvAlong: true }
	);
	water.isPickable = true;

	// ---- stones laid along the edge, the pond's way ------------------------------
	//
	// The pond is rimmed with thirty separate lumps, each turned and sunk a little differently, and that is the
	// reason a rectangular hole does not read as one (`src/pond.js`). The watercourse gets the same treatment
	// for the same reason: an earth bank with nothing on it is a gutter cut in a lawn, and an earth bank with
	// stones half-buried along its edge is a bank that was pushed out by hand and then left alone.
	//
	// They sit AT the water's edge and not back on the grass, because that is where stones collect in a stream —
	// where the water has sorted them. Each is sunk to its own depth: some buried to the shoulder, some standing
	// a hand high, which is what a barrow tipped out along an edge actually leaves. They are laid at no fixed
	// spacing either; a barrow load is not laid at intervals.
	const stones = [];
	/**
	 * Where each stone stands, at its widest half-span. The garden asks `inStreamStone` before it plants a
	 * clump, so no tuft grows out of a boulder — the same bargain the pond keeps with `inPondStone`.
	 */
	const feet = [];
	/**
	 * The station nearest a running distance along the course. This searches the stations by their own `run`
	 * rather than dividing by `STATION`: the resampling rounds the station COUNT, so the true spacing is the
	 * length divided by that count and not `STATION` itself, and dividing drifts by a whole station over
	 * thirty-four metres. It did drift, and a station out is a decimetre out on the water's width, which is
	 * how the first stones came to be sunk at the wrong height.
	 */
	const atRun = (r) => {
		let best = line[0];
		let gap = Infinity;
		for (const s of line) {
			const d = Math.abs(s.run - r);
			if (d < gap) {
				gap = d;
				best = s;
			}
		}
		return best;
	};
	/** A box or a stone's yaw that lays its local +z ALONG the water's way (the normal's, turned a quarter turn). */
	const tangentYaw = (s) => Math.atan2(-s.nz, s.nx);
	const totalRun = line[line.length - 1].run;
	/**
	 * How high the bank's surface stands at a given offset from the centre line. The bare band runs from the
	 * lip (height `deck`, at the water's edge) down to the lawn (0.015, at `hw + berm`), and a stone laid on
	 * that band must be sunk into THAT surface. The first attempt put them at the water's edge at a height of
	 * its own, and the bank swallowed every one: a view down the channel measured 0.1% stone, and `pickat`
	 * answered the pond's boulders rather than a single `streamStone`.
	 */
	const bankAt = (s, off) => s.deck - (Math.max(0, off - s.hw) / s.berm) * (s.deck - 0.015);
	/**
	 * Sink a worked stone into a surface until it shows the height asked for, in metres.
	 *
	 * This has to happen AFTER the stone is tilted and crumpled, because both of those move its crown: a stone
	 * half a metre long tipped fourteen degrees drops four centimetres, and a crumple taken off at thirty per
	 * cent drops three more. Telling the stone where its middle belongs BEFORE that happens — which is what the
	 * first attempt did — left eight of the thirty-one edging stones under the bank they were laid on, and the
	 * whole stone edge measured 0.1% of a picture.
	 */
	const settle = (mesh, surfaceY, show) => {
		mesh.refreshBoundingInfo();
		// The LOCAL top: the mesh's own middle is its origin, so this is the crown's height above the middle the
		// position will be set to.
		const top = mesh.getBoundingInfo().boundingBox.maximum.y;
		mesh.position.y = surfaceY + show - top;
		mesh.refreshBoundingInfo();
	};
	let stoneRun = 0.5 + rand() * 0.7;
	while (stoneRun < totalRun - 0.5) {
		const s = atRun(stoneRun);
		const side = rand() < 0.5 ? -1 : 1;
		const across = 0.26 + rand() * 0.34; // its width across the bank
		const long = across * (1.1 + rand() * 0.7); // and its length along the course: these lie end to end
		const tall = 0.14 + rand() * 0.2;
		// Where it sits across the bank: mostly on the bare band, a few out at the grass and a few right at the
		// water, because that is how a bank of stone sorted by water looks — thickest at the edge, straggling out.
		const off = s.hw + rand() * s.berm * 0.9;
		const px = s.x + s.nx * side * off;
		const pz = s.z + s.nz * side * off;
		const stone = sphere(scene, `streamStone${stones.length}`, {
			diameterX: across,
			diameterY: tall,
			diameterZ: long,
			// Seven cuts: at five the sphere's pole opens as a handful of big flat leaves and the stone turns
			// into a paper parasol, which is the lesson the pond's rim learned at eight (`src/pond.js`).
			segments: 7,
			px,
			// Sunk INTO the bank, and no more: the crown is set to stand three to fifteen centimetres over the
			// earth it sits in, which is a stone the water has partly buried and not a boulder parked on a lawn.
			py: bankAt(s, off),
			pz,
			mat: mats.pondStone,
		});
		stone.rotation.y = tangentYaw(s) + (rand() - 0.5) * 0.7;
		stone.rotation.x = (rand() - 0.5) * 0.5;
		stone.rotation.z = (rand() - 0.5) * 0.5;
		const worked = crumple(stone, { at: 0.3, seed: 2200 + stones.length * 11, lobes: 4 });
		skinTint(stone, worked, { at: 0.3, low: 0.55 });
		settle(stone, bankAt(s, off), 0.03 + rand() * 0.12);
		stone.refreshBoundingInfo();
		stone.receiveShadows = true;
		if (shadows) shadows.addShadowCaster(stone);
		built.push(stone);
		stones.push(stone);
		feet.push({ x: px, z: pz, r: Math.max(across, long) / 2 });
		stoneRun += 0.55 + rand() * 1.15;
	}
	// The garden is built after the watercourse, and it asks where the stones are before it sows a single tuft.
	stoneFeet = feet;

	// ---- the head: where the water comes in --------------------------------------
	//
	// The first version put a dressed slab across the channel there, which is a sluice. Water in a garden comes
	// in under a hedge, out of a lump of gravel, between two stones. So: a hummock of the same damp earth the
	// banks are made of, laid across the channel's start, and three stones about the opening.
	//
	// The first hummock was a pancake: 0.4 m of sphere sunk 0.14, so its crown stood twelve centimetres over the
	// lawn while the water's surface stood at fifteen — a flat dirt disc lying BEHIND the end of the channel,
	// which is a lid on a table and not a spring. A hummock has to be taller than the water it gives birth to,
	// and its foot has to run into the channel, so that the water is buried for its first three quarters of a
	// metre and comes out at the place where the mound's surface meets the water's. That is what a spring looks
	// like: not an edge, a coming-out.
	const head = line[0];
	const headNext = line[1];
	const inX = (headNext.x - head.x) / Math.hypot(headNext.x - head.x, headNext.z - head.z);
	const inZ = (headNext.z - head.z) / Math.hypot(headNext.x - head.x, headNext.z - head.z);
	const moundRX = 1.7;
	const moundRY = 0.56;
	const moundRZ = 1.1;
	const moundX = head.x - inX * 0.35;
	const moundZ = head.z - inZ * 0.35;
	const moundY = -0.06;
	/**
	 * The hummock's own surface height at a place, from the ellipsoid it is. The stones that sit on it have to be
	 * settled on THIS and not on the lawn: a stone settled to 0.02 on a mound standing half a metre over the
	 * lawn is a stone buried in a hill.
	 */
	const moundAt = (x, z) => {
		const ux = (x - moundX) / moundRX;
		const uz = (z - moundZ) / moundRZ;
		const inside = 1 - ux * ux - uz * uz;
		return inside <= 0 ? 0 : moundY + moundRY * Math.sqrt(inside);
	};
	const mound = sphere(scene, "streamHeadMound", {
		diameterX: moundRX * 2,
		diameterY: moundRY * 2,
		diameterZ: moundRZ * 2,
		segments: 9,
		// Across the channel's start and a little under the lawn, so the channel looks cut INTO the mound rather
		// than a strip of earth laid up against a dome.
		px: moundX,
		py: moundY,
		pz: moundZ,
		mat: earth,
	});
	const moundWorked = crumple(mound, { at: 0.16, seed: 5111, lobes: 5 });
	skinTint(mound, moundWorked, { at: 0.24, low: 0.6 });
	mound.refreshBoundingInfo();
	mound.receiveShadows = true;
	if (shadows) shadows.addShadowCaster(mound);
	built.push(mound);
	// No sedge on the hummock: it is bare, damp, newly-washed ground, and the garden is told so through the
	// same list it reads for the stones.
	feet.push({ x: moundX, z: moundZ, r: moundRX * 0.8 });
	for (let i = 0; i < 3; i++) {
		// Two on the banks where the water comes through, and one on the hummock behind: three stones at an
		// opening are the smallest number that reads as a place rather than an accident. The pair stand a little
		// downstream of the channel's start, because that is where the water reappears from under the mound —
		// put them at the start itself and they stand inside the hill.
		const where =
			i === 2
				? { x: head.x - inX * 0.55 + head.nx * 0.75, z: head.z - inZ * 0.55 + head.nz * 0.75, off: null }
				: {
						x: head.x + head.nx * (i === 0 ? 1 : -1) * (head.hw + 0.3) + inX * 0.7,
						z: head.z + head.nz * (i === 0 ? 1 : -1) * (head.hw + 0.3) + inZ * 0.7,
						off: head.hw + 0.3,
					};
		const onTop = where.off === null;
		const ground = onTop ? moundAt(where.x, where.z) : bankAt(head, where.off);
		const across = 0.5 + rand() * 0.4;
		const tall = 0.24 + rand() * 0.22;
		const boulder = sphere(scene, `streamHeadBoulder${i}`, {
			diameterX: across,
			diameterY: tall,
			diameterZ: across * (0.8 + rand() * 0.3),
			segments: 6,
			px: where.x,
			py: ground - tall * (0.05 + rand() * 0.2),
			pz: where.z,
			mat: mats.pondStone,
		});
		boulder.rotation.y = rand() * 3;
		boulder.rotation.x = (rand() - 0.5) * 0.5;
		boulder.rotation.z = (rand() - 0.5) * 0.5;
		const workedBig = crumple(boulder, { at: 0.34, seed: 6100 + i * 17, lobes: 5 });
		skinTint(boulder, workedBig, { at: 0.3, low: 0.55 });
		settle(boulder, ground, 0.1 + rand() * 0.14);
		boulder.refreshBoundingInfo();
		boulder.receiveShadows = true;
		if (shadows) shadows.addShadowCaster(boulder);
		built.push(boulder);
		feet.push({ x: where.x, z: where.z, r: across / 2 });
	}

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
	// The veil is narrower than the channel — eight tenths of the water's own width at the mouth — because a
	// fall across the whole of a bank-to-bank sheet is a weir. Water goes over an earth step at the place where
	// it has cut through, and the banks stand either side of it dry.
	const veilHalf = mouth.hw * 0.8;
	const fall = poly(scene, "streamFall", {
		positions: [
			mouth.x + mouth.nx * -veilHalf, mouth.waterY, mouth.z + mouth.nz * -veilHalf,
			mouth.x + mouth.nx * veilHalf, mouth.waterY, mouth.z + mouth.nz * veilHalf,
			mouth.x + mouth.nx * -veilHalf + (runX / runLen) * fallRun, fallTo,
			mouth.z + mouth.nz * -veilHalf + (runZ / runLen) * fallRun,
			mouth.x + mouth.nx * veilHalf + (runX / runLen) * fallRun, fallTo,
			mouth.z + mouth.nz * veilHalf + (runZ / runLen) * fallRun,
		],
		uvs: [0, 0, 1, 0, 0, -1.6, 1, -1.6],
		// Two triangles for the veil. The winding does not matter here: the material is self-lit and painted
		// from both sides, so there is no normal for a face to be wrong about.
		indices: [0, 1, 2, 1, 3, 2],
		mat: mats.streamFall,
	});
	fall.isPickable = false;
	built.push(fall);
	// The stones the water goes over, one on each bank, and the stone it lands on. All three are boulders out
	// of the same barrow as the edging stones, not cut stone: an earth step with a stone at each shoulder is
	// how a garden's stream arrives at a pond, and a dressed lintel across the channel is how a mill does it.
	for (let i = 0; i < 2; i++) {
		const side = i === 0 ? -1 : 1;
		const across = 0.42 + rand() * 0.3;
		const tall = 0.22 + rand() * 0.2;
		const off = mouth.hw + 0.22 + rand() * 0.2;
		const px = mouth.x + mouth.nx * side * off;
		const pz = mouth.z + mouth.nz * side * off;
		const pinch = sphere(scene, `streamMouthBoulder${i}`, {
			diameterX: across,
			diameterY: tall,
			diameterZ: across * (1.1 + rand() * 0.5),
			segments: 7,
			px,
			py: bankAt(mouth, off) - tall * (0.05 + rand() * 0.2),
			pz,
			mat: mats.pondStone,
		});
		pinch.rotation.y = tangentYaw(mouth) + (rand() - 0.5) * 0.5;
		pinch.rotation.x = (rand() - 0.5) * 0.4;
		pinch.rotation.z = (rand() - 0.5) * 0.4;
		const workedMouth = crumple(pinch, { at: 0.32, seed: 7300 + i * 13, lobes: 5 });
		skinTint(pinch, workedMouth, { at: 0.3, low: 0.55 });
		settle(pinch, bankAt(mouth, off), 0.1 + rand() * 0.12);
		pinch.refreshBoundingInfo();
		pinch.receiveShadows = true;
		if (shadows) shadows.addShadowCaster(pinch);
		built.push(pinch);
		feet.push({ x: px, z: pz, r: across / 2 });
	}
	// The landing stone the water falls on, in the pond, a hand under the veil: without it the veil ends in
	// mid-air over the water and the eye reads a picture of water rather than water arriving. It is not
	// called an apron here: this folder already uses that word for the free stone round the pool deck.
	// The stone the water falls on, in the pond, a hand under the veil: without it the veil ends in mid-air over
	// the water and the eye reads a picture of water rather than water arriving. It is a boulder out of the same
	// barrow as the edging stones, not a slab, and it is not called an apron here: this folder already uses that
	// word for the free stone round the pool deck.
	const landing = sphere(scene, "streamLandingStone", {
		diameterX: 0.9,
		diameterY: 0.26,
		diameterZ: 2 * mouth.hw * 0.8,
		segments: 7,
		px: mouth.x + (runX / runLen) * (fallRun * 0.72),
		py: -0.06,
		pz: mouth.z + (runZ / runLen) * (fallRun * 0.72),
		mat: mats.pondStone,
		ry: tangentYaw(mouth),
	});
	const workedLanding = crumple(landing, { at: 0.3, seed: 8100, lobes: 5 });
	skinTint(landing, workedLanding, { at: 0.28, low: 0.55 });
	landing.refreshBoundingInfo();
	landing.receiveShadows = true;
	built.push(landing);

	// ---- keeping the walk out of the water --------------------------------------
	//
	// One rectangle to each stretch of the course. These go to `makeGround` beside the pool's and the pond's
	// own blocks; the meshes above say nothing about collisions on purpose, because a bounding box round
	// thirty-four metres of channel is a wall across the whole garden.
	//
	// There used to be a plank bridge here, and the reason it is gone is the reason the stream is shorter:
	// the bridge stood where the garden path crosses, at x 0.6 z 18.8, and the path only crosses the water if
	// the water goes round the south of the yard. Straight to the back, the channel never meets the path, so
	// the bridge would be six planks over dry grass. If the water is ever laid so that it crosses a way again,
	// the bridge is in the git history at v0.95.0 and v0.96.0, planks and stringers and all.
	const blockers = [];
	const reach = streamKeepOff;
	/**
	 * One block for a stretch of the watercourse: the stretch's own length, widened by `reach` on each side of
	 * the water, and run past its ends by `reach` as well. The ends overlap on purpose: two rectangles that
	 * meet at a station leave no slot for a foot to slip through, and the ground's test is "inside any block",
	 * so an overlap costs nothing.
	 */
	const pieceSeg = (p, q) => {
		const dx = q.x - p.x;
		const dz = q.z - p.z;
		const len = Math.hypot(dx, dz) || 1;
		const ux2 = dx / len;
		const uz2 = dz / len;
		const nx2 = -uz2;
		const nz2 = ux2;
		const s0 = -reach;
		const s1 = len + reach;
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
	for (let i = 0; i < course.length - 1; i++) pieceSeg(course[i], course[i + 1]);
	// The hummock the water comes out of is half a metre of earth that `makeGround` knows nothing about, and a
	// visitor walking into it at lawn height would walk through a hill. The channel's own blocks stop short of
	// it — they run to `streamKeepOff` either side of the water, and the hummock is wider than that.
	blockers.push([moundX - moundRX, moundX + moundRX, moundZ - moundRZ, moundZ + moundRZ * 0.75]);

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
