// The pond in the west lawn: a shallow basin of still water, stone at its edge, and the frogs' home.
//
// The EDICT asked for a pond in an empty part of the yard. This is that part: the lawn between the
// banana clump and the west hedge, six paces west of the paving's far corner, which was the one stretch
// of grass in the whole garden with nothing on it at all but mown lawn.
//
// Why it is sunk, and why it is square.
//
// A pond you can believe has to hold water BELOW the ground you walk on, which means the lawn has to
// have a hole in it, and the ground here is laid in flat rectangles (`buildGround` in src/world.js). A
// round hole in a rectangle of lawn is four pieces of lawn and a curve, and the curve is where the
// trouble is: at the pool the cut edge of the grass meeting a wall in one vertical plane threw a
// one-pixel green hairline across the water for a whole session (the note above `buildGround`), and the
// lesson taken there was to stop the grass meeting the water at all. So the hole is a rectangle, the
// basin is a rectangle, and the grass's cut edge is buried — not laid beside — under a stone rim and a
// band of damp gravel. Every straight line of this thing is hidden by something laid over it, and what
// is left to see is water, stone, and the weeds floating on it.
//
// The straightness itself goes the same way the court's paving goes: with stones. The rim is thirty
// separate lumps of rock laid round the edge, each one turned and sunk a little differently, and at the
// corners four bigger boulders. A pond rimmed with rocks is never a rectangle in anybody's memory.
//
// Sizes: 5.4 m by 3.6 m of water, which is a pond and not a puddle — a swimming-length for a dog, a
// width a heron could stand in the middle of. Half a metre deep, because a pond that deep holds water in
// a Thai March and one half as deep does not.

import { box, blocker, cylinder, facet, fracture, plane, poly, slab, sphere, crumple, skinTint, groundUVs } from "./mesh.js";
import { randomGenerator } from "./noise.js";
import { streamMouth, mouthGap } from "./stream.js";

/** Where the pond is, and how big. Everything else in this file is built off these numbers. */
const CX = -20.3; // east-west: as far west of the court as the palm is north of the bananas
const CZ = 14.6; // north-south: south of the lawn's palm, clear of the banana clump
const HALF_X = 2.7;
const HALF_Z = 1.8;
const WATER_Y = -0.035; // the surface, 3.5 cm under the lawn: deep enough to see the bottom, shallow
	// enough that the water comes up near the rim. Six centimetres of dry lining between the two made a black
	// gutter all round the edge, which is the ugliest line in a pond (pictures/s80-pond-gutter-c.png).
const FLOOR_Y = -0.5; // the bottom: half a metre of water, which is what survives the dry season
const MARGIN = 0.15; // the band of damp gravel between the water's edge and the lawn's cut edge
const LINER = 0.11; // how thick the basin's wall is

const WATER = { x0: CX - HALF_X, x1: CX + HALF_X, z0: CZ - HALF_Z, z1: CZ + HALF_Z };

/**
 * The hole the lawn has to be cut round. Exported because `buildGround` in src/world.js cuts it and
 * nothing else may know it: if the two disagree the grass either floats over the water or leaves a gap
 * at the edge of the world.
 */
export const pondHole = { x0: WATER.x0 - MARGIN, x1: WATER.x1 + MARGIN, z0: WATER.z0 - MARGIN, z1: WATER.z1 + MARGIN };

/**
 * Whether a foot of ground stands in the pond. The garden scatters grass clumps about the lawn by the
 * hundred and asks only whether the ground under a foot is built stone; over this rectangle the ground is
 * not stone, it is water, and a clump planted here grows out of a pond.
 *
 * It used to throw 40 cm of margin in, on the reasoning that a clump at the very edge leans over the
 * water. What that bought in a browser was a pond with a clean bald ring round it and green grass starting
 * half a metre out, which is a swimming pool, not a pond: the sedges at a real edge grow UP TO the water
 * and a little into it. The margin is 6 cm now — the water's own lip — and the stones are kept off by
 * `inPondStone` below, so grass comes in where there is soil and stops where there is rock.
 */
export const pondRect = WATER;

export function inPond(x, z) {
	return x > WATER.x0 - 0.06 && x < WATER.x1 + 0.06 && z > WATER.z0 - 0.06 && z < WATER.z1 + 0.06;
}

/**
 * Whether a foot of ground stands on one of the pond's stones. `buildPond` fills this as it lays them,
 * one entry per stone, at the stone's widest half-span so a little is over-read: the stones are turned a
 * little and an ellipse is not a box, and it is better to lose a clump of grass than to grow one out of a
 * boulder. The garden asks this before it lays a clump, and `tools/tuftfoot.js` asks the same question
 * afterwards.
 */
let stoneFeet = [];
export function inPondStone(x, z) {
	for (const r of stoneFeet) if (Math.hypot(x - r.x, z - r.z) < r.r) return true;
	return false;
}

/**
 * Builds the pond. Answers { meshes, walkBlocks, perches, water, animate }.
 *
 * `walkBlocks` is the water's own rectangle: a person is stopped with their feet at the edge of the
 * water and nowhere further out, because the rim stones are laid over that line and standing on one is
 * what a pond rim is for. `perches` is where a frog may sit — the top of a rim stone, with the way the
 * stone is turned — so the frogs can be put on real stone at their own scale without ever being told
 * where the pond is.
 */
/**
 * One lily pad: a disc with a slit cut from its rim to its middle, which is what a water lily's leaf is.
 *
 * The first version was a squashed cylinder — a coin laid flat on the water — and a browser at two metres
 * told me what was wrong with it: ten perfect circles, level as billiard balls, wearing the same painted
 * veins at the same angle (pictures/s80-pond-standing-c.png). A real pad is a circle with a wedge out of
 * it, its rim dips and swells a little all the way round, and it rides the water tilted and not level.
 *
 * Built about its own middle, so the mesh's own position and rotation are the pad's place on the pond and
 * its tilt on the water. There is no underside: a pad is a millimetre of leaf, and a pad seen through a
 * sheet of water from underneath is better left undrawn than drawn as a dark plate.
 *
 * The winding is the one thing about a hand-cut disc that cannot be eyeballed. Wound the other way the
 * engine computes a normal pointing at the bottom of the basin, the face is culled from above, and every
 * pad in the pond vanishes without a word — no error, no dark patch, nothing in any picture at all, while
 * a projection of their own positions went on naming their pixels cheerfully. The fan therefore runs
 * centre, rim at step i, rim at step i+1, and the pads are seen.
 */
function makePad(scene, mats, { x, z, across, y, seed, name = "pondLily" }) {
	const rand = randomGenerator(seed);
	const notch = 0.3 + rand() * 0.3; // the slit, in radians
	const start = rand() * Math.PI * 2; // where the slit points: the plant this pad grew from
	const steps = 26;
	const r = across / 2;
	// Two slow wobbles round the rim, so it is a scalloped circle and not a polygon.
	const w1 = rand() * Math.PI * 2;
	const w2 = rand() * Math.PI * 2;
	const cut = Math.max(2, Math.round((notch / (Math.PI * 2)) * steps));
	const last = steps - cut;
	const positions = [0, 0, 0];
	const uvs = [0.5, 0.5];
	const indices = [];
	for (let i = 0; i <= last; i++) {
		const a = start + (i / last) * (Math.PI * 2 - notch);
		const rr = r * (1 + 0.06 * Math.sin(a * 3 + w1) + 0.04 * Math.sin(a * 5 + w2));
		positions.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
		uvs.push(0.5 + (Math.cos(a) * rr) / across, 0.5 + (Math.sin(a) * rr) / across);
	}
	for (let i = 0; i < last; i++) indices.push(0, i + 1, i + 2);
	const pad = poly(scene, name, { positions, indices, uvs, mat: mats.lilyPad });
	pad.position.set(x, y, z);
	// One edge in the water and the far one dry: a pad floats with its crown where the stalk holds it up.
	pad.rotation.x = (rand() - 0.5) * 0.16;
	pad.rotation.z = (rand() - 0.5) * 0.16;
	return pad;
}

/** Whether a point on the pond's edge lies where the stream's mouth comes in, and so wears no stone. */
function inStreamMouth(p) {
	return Math.abs(p.x - streamMouth.x) < mouthGap / 2 + 0.35 && Math.abs(p.z - streamMouth.z) < 1.5;
}

export function buildPond(scene, mats, shadows) {
	const built = [];
	const add = (mesh) => {
		if (shadows) shadows.addShadowCaster(mesh);
		built.push(mesh);
		return mesh;
	};
	const rand = randomGenerator(7902);

	// ---- the basin, and the band of gravel where the lawn stops -----------------
	//
	// One ring of four slabs and a floor under it. Their tops are the damp gravel between the grass and
	// the water; their inner faces are the pond's lining down to the bottom; and they are what a person
	// looking along the edge of the water sees instead of a hole in the world. They throw no shadow and
	// carry no collision: the walk is kept off the water by `walkBlocks` below, and a collision box round
	// a basin wall would fence off a ring of lawn a metre wider than the pond.
	//
	// The band stands ONE CENTIMETRE under the grass and is tucked forty-five centimetres under it at the
	// outside. Both numbers are the lesson of the first version, which was sunk five centimetres and
	// tucked under by three: a browser showed a pale grey line all round the pond, and a ray fired at the
	// pixel of that line answered `none` — the eye was looking at the sky behind the garden through a slot
	// between the lawn's cut edge and a band too narrow to close it (pictures/s80-pond-edgefault-c.png; the tool is
	// `scene.pick` at the pixel). The shallower the eye, the longer a sight can travel under the turf and
	// over a narrow band before it is stopped, so the answer is not a shade of colour at all: it is a band
	// wide enough under the grass that no ray can get through the joint, and a step small enough that any
	// ray which does try is stopped inside the first centimetre of it.
	const SHORE_TOP = -0.02;
	const SHORE_DEEP = 0.51;
	const OUT = { x0: pondHole.x0 - 0.45, x1: pondHole.x1 + 0.45, z0: pondHole.z0 - 0.45, z1: pondHole.z1 + 0.45 };
	const INN = { x0: WATER.x0 + 0.02, x1: WATER.x1 - 0.02, z0: WATER.z0 + 0.02, z1: WATER.z1 - 0.02 };
	const ring = [
		// North and south run the whole width; east and west fit between them, so the four never overlap.
		["north", OUT.x0, OUT.x1, OUT.z0, INN.z0],
		["south", OUT.x0, OUT.x1, INN.z1, OUT.z1],
		["west", OUT.x0, INN.x0, INN.z0, INN.z1],
		["east", INN.x1, OUT.x1, INN.z0, INN.z1],
	];
	for (const [side, x0, x1, z0, z1] of ring) {
		const wall = slab(scene, `pondShore_${side}`, {
			x: x1 - x0,
			y: SHORE_DEEP,
			z: z1 - z0,
			px: (x0 + x1) / 2,
			py: SHORE_TOP - SHORE_DEEP / 2,
			pz: (z0 + z1) / 2,
			mat: mats.pondSilt,
			spacing: 0.6,
		});
		groundUVs(wall, 0.3);
		wall.receiveShadows = true;
		built.push(wall);
	}
	// The bottom: one slab under the whole basin, its top laid two centimetres above the ring's foot so
	// the two overlap and there is no line for a ray to get out through.
	built.push(
		slab(scene, "pondBasin_floor", {
			x: OUT.x1 - OUT.x0,
			y: 0.12,
			z: OUT.z1 - OUT.z0,
			px: CX,
			py: FLOOR_Y - 0.06,
			pz: CZ,
			mat: mats.pondSilt,
			spacing: 1,
		}),
	);
	built[built.length - 1].receiveShadows = true;
	// ---- the water ---------------------------------------------------------
	//
	// The same law as the pool's surface, in a darker key: see-through looking down, a mirror at a graze
	// (`src/water.js`). It is given its own patched shader and not the pool's, because the numbers are
	// baked into the shader text and the pond mirrors palms and hedge and not the front of the house.
	const sheet = plane(scene, "pondWater", {
		width: WATER.x1 - WATER.x0,
		height: WATER.z1 - WATER.z0,
		px: CX,
		py: WATER_Y,
		pz: CZ,
		rx: Math.PI / 2, // a floor: the face points at the sky
		mat: mats.pondWater,
	});
	built.push(sheet);

	// ---- the rim: thirty stones, four boulders ------------------------------
	//
	// Laid along the water's edge, straddling it, each one sunk a little deeper or shallower than its
	// neighbour and turned off the line: the rim of a pond that has been raked once and left alone. Each
	// is a floor for the walk — a person stands on one the way they stand on the pool's coping — and each
	// is offered to the frogs as a perch.
	// Which way a stone faces its visitor: outwards, towards the bank it was laid on. A frog turned this way
	// shows a visitor coming off the paving its eyes and its pale throat instead of the wet grey back of its
	// head, and a frog watches whatever it is watching, which is very often the person watching it.
	const outwardOf = (x, z) => Math.atan2(x - CX, z - CZ);
	// The crown of a stone as it was actually built, after it was crumpled and tilted: the nominal height
	// is where the lump was aimed, and the crumple leaves it a couple of centimetres either side of that.
	// A frog set on the nominal height is a frog ankle-deep in rock or floating over it.
	const crownOf = (mesh) => mesh.getBoundingInfo().boundingBox.maximumWorld.y;
	const perches = [];
	const stones = [];
	const every = 0.62; // one stone to every two feet of edge
	const runs = [
		// [from, to] along each of the four edges, clockwise from the north-west corner
		[{ x: WATER.x0, z: WATER.z0 }, { x: WATER.x1, z: WATER.z0 }],
		[{ x: WATER.x1, z: WATER.z0 }, { x: WATER.x1, z: WATER.z1 }],
		[{ x: WATER.x1, z: WATER.z1 }, { x: WATER.x0, z: WATER.z1 }],
		[{ x: WATER.x0, z: WATER.z1 }, { x: WATER.x0, z: WATER.z0 }],
	];
	let n = 0;
	stoneFeet = []; // filled as the stones below are laid, for `inPondStone` above
	for (const [from, to] of runs) {
		const length = Math.hypot(to.x - from.x, to.z - from.z);
		const count = Math.max(2, Math.round(length / every));
		const laid = []; // where this edge's stones actually came to rest, so its gaps can be chinked below
		for (let i = 0; i < count; i++) {
			// Not dead-centre in its gap: a jitter of half a stone either way, so the rim gathers here and
			// thins there the way a barrow of rock gets raked along an edge. Set out at equal spacing the rim
			// reads as a row of beads — plainest in a picture taken straight overhead, where nothing that
			// hides the rule is in the way (pictures/s80-pond-beads.png).
			// Where a stone was not fetched. Two or three to an edge: the chinking below fills the hole with
			// small rock and a little of the bank shows through, and a rim that stops and starts is a wallered edge,
			// while a rim that runs unbroken is a kerb. Never at a corner, where the edge has to be covered.
			if (i > 0 && i < count - 1 && rand() < 0.1) continue;
			const t = (i + 0.2 + rand() * 0.6) / count;
			const along = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t };
			// And no stone where the stream's mouth comes in (`src/stream.js`): the veil of water going over the
			// lip has to pass through this band, and a rim stone standing in it is water falling on a rock, and a
			// rim that stops halfway round for no reason a visitor can see.
			if (inStreamMouth(along)) continue;
			// Outward normal of this edge, so the stone sits half on the bank and half over the water.
			const out = { x: along.x === WATER.x0 ? -1 : along.x === WATER.x1 ? 1 : 0, z: along.z === WATER.z0 ? -1 : along.z === WATER.z1 ? 1 : 0 };
			// Three levers, all wider than they look, because the eye averages a row: what it judges is whether
			// the NEXT stone is the same as this one, and at six of them to an edge two out of three were.
			// `across` and `long` give a stone that is a slab and one that is a lump; `tone` (see `skinTint`) makes
			// some of them grey and some of them the brown of laterite, so the rim is a barrow of mixed rock and not
			// a chain of identical buns — which is what the bank view still came out as (pictures/s86-pond-rim-c.png).
			const across = 0.32 + rand() * 0.34; // how far out of the water it reaches, across the edge
			const long = (length / count) * (0.55 + rand() * 1.0); // and how far along it
			// Thick in proportion to itself, and not a fixed few centimetres. A rim stone drawn twelve to
			// thirty-three millimetres thick against a half-metre length is a pancake, and the crown of a pancake
			// is the whole pole of the sphere it was made from: a smooth radial fan, so the edge of the pond
			// tess from a hundred little paper parasols (pictures/s87-frog-c.png). A quarter to a half again as
			// thick as it is wide, and the pole shrinks to one bump among the others.
			const tall = Math.min(0.44, Math.max(across, long) * (0.34 + rand() * 0.3));
			const tone = 0.62 + rand() * 0.7;
			// Two rocks in one rim. A waller carts what the barrow had: the Villa has two stone materials, the
			// pond's own grey and the lawn's coarser one, and a fifth of the rim wears the other. That puts a
			// second colour in the line, which no amount of lightening or darkening one material can do.
			const rock = rand() < 0.3 ? mats.lawnStone : mats.pondStone;
			// How proud of the grass it stands — and over a range four times what it was. The eye reads a row by
			// its silhouette before it reads anything else, and every stone in this rim used to stand between one
			// and twelve centimetres up: a kerb. Some are buried to their shoulders now and some stand a hand
			// high, which is what a barrow tipped out along an edge actually leaves.
			const crown = -0.02 + rand() * 0.26;
			// A fifth of the rim is slabs and not buns: flat stone laid over the edge, which is how a waller
			// copes a pond when he has any. The same struck face, seven centimetres thick instead of sixteen.
			const slab = rand() < 0.22;
			const stone = sphere(scene, `pondRim${n}`, {
				diameterX: out.x ? (slab ? across * 1.3 : across) : long,
				diameterY: slab ? 0.12 : tall,
				diameterZ: out.z ? (slab ? across * 1.3 : across) : long,
				segments: 8, // the pole of a sphere is where a crumpled stone keeps its fan: at five and six
			// cuts the cap is a handful of big flat leaves and the rim stone reads as a paper parasol
			// (pictures/s87-frog-c.png). Eight makes the cap small enough to be one more bump on the lump. // five let the sphere's pole out as a five-leaf fan once the stone was made
			// longer: an umbrella of stone, plainest on the near edge (pictures/s86-pond-rim-c.png).
			// Six spreads the same fan and the struck face reads flat again.
				px: along.x + out.x * (across * 0.06),
				// No stone may ride higher than four fifths of its own thickness. The crown and the thickness were
				// drawn independently, so a seven-centimetre slab could be told to stand twenty-four up and did: a
				// flat stone on a stalk of air, a mushroom ring round the whole pond (pictures/s87-frog-c.png).
				// What is left of the crown is a stone sunk deeper or shallower, which is the whole point.
				py: Math.min(crown, (slab ? 0.1 : tall) * 0.8) - (slab ? 0.05 : tall / 2),
				pz: along.z + out.z * (across * 0.06),
				mat: rock,
			});
			// Turned a little, but not much: these are long stones laid end to end along one line, and a stone
			// turned a third of a right angle points its length across the bank and uncovers the edge it was
			// laid to cover. The tilt carries the hand-laid look; the yaw carries the line.
			stone.rotation.y = (rand() - 0.5) * 0.5;
			// Tilted on two axes: a stone lying flat as a pancake is a paving slab, and a paving slab with a
			// flat top all down a line is what the first rim of this pond came out as (pictures/
			// s80-pond-pancake-c.png). Rock that was dug out of a bank arrives on its side and stays there.
			stone.rotation.x = (rand() - 0.5) * 0.62;
			stone.rotation.z = (rand() - 0.5) * 0.62;
			const worked = crumple(stone, { at: 0.3, seed: 7900 + n * 13, lobes: 4 });
			// The flat slabs wear the pond’s own rock and not the pool’s pale coping, after all. The SHAPE is the
			// thing I wanted — flat struck stone laid over the edge, against the buns — and cut stone gave me that
			// along with a pale cream face in full sun that measured L129 against L67..77 for its neighbours: a line
			// of paper plates. Vertex tone took the edge off it and did not hide it, so the material went back and the
			// shape stayed.
			skinTint(stone, worked, { at: 0.3, low: 0.55, tone });
			facet(stone); // the same broken faces as the corner boulders: a rim of rolled pebbles is a path, a rim of broken stone is an edge
			stone.refreshBoundingInfo();
			stone.receiveShadows = true;
			stone.checkCollisions = true; // something to stand on, at the height its crown is at
			built.push(stone);
			stones.push(stone);
			laid.push(along);
			perches.push({ x: stone.position.x, z: stone.position.z, top: crownOf(stone), yaw: stone.rotation.y, across, out: outwardOf(stone.position.x, stone.position.z), mesh: stone });
			stoneFeet.push({ x: stone.position.x, z: stone.position.z, r: Math.max(out.x ? across : long, out.z ? across : long) / 2 });
			n++;
		}
		// Chinking. A dry-stone edge is not built from big stones only: the gaps between them are wedged
		// shut with handfuls of small rock, and that is what a waller does with the stones too small to be a
		// coping. Here they do a second piece of work — they bury the lawn's cut edge, which is the one line
		// that gives the pond away as a rectangle from across the grass, and which no rim stone is set to
		// cover. They are laid low, mostly flush with the gravel, and pushed a little outboard for the same
		// reason.
		for (let i = 0; i + 1 < laid.length; i++) {
			const a = laid[i];
			const b = laid[i + 1];
			const gap = Math.hypot(b.x - a.x, b.z - a.z);
			if (gap < 0.3) continue; // the big stones already touch: nothing to chink
			const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
			if (inStreamMouth(mid)) continue; // and no chink wedging shut the gap the water comes through
			const out = { x: mid.x === WATER.x0 ? -1 : mid.x === WATER.x1 ? 1 : 0, z: mid.z === WATER.z0 ? -1 : mid.z === WATER.z1 ? 1 : 0 };
			const long = Math.min(gap * 0.85, 0.42);
			const across = 0.26 + rand() * 0.24;
			const tall = 0.07 + rand() * 0.09;
			const chink = sphere(scene, `pondChink${n}`, {
				diameterX: out.x ? across : long,
				diameterY: tall,
				diameterZ: out.z ? across : long,
				segments: 4,
				px: mid.x + out.x * (0.05 + rand() * 0.05),
				py: rand() * 0.04 - tall / 2,
				pz: mid.z + out.z * (0.05 + rand() * 0.05),
				mat: mats.pondStone,
			});
			chink.rotation.y = (rand() - 0.5) * 0.8;
			chink.rotation.x = (rand() - 0.5) * 0.2;
			chink.rotation.z = (rand() - 0.5) * 0.2;
			const workedSmall = crumple(chink, { at: 0.34, seed: 6300 + n * 7, lobes: 4 });
			skinTint(chink, workedSmall, { at: 0.3, low: 0.55 });
			chink.refreshBoundingInfo();
			chink.receiveShadows = true;
			built.push(chink);
			stones.push(chink);
			perches.push({ x: chink.position.x, z: chink.position.z, top: crownOf(chink), yaw: chink.rotation.y, across, out: outwardOf(chink.position.x, chink.position.z), mesh: chink });
			stoneFeet.push({ x: chink.position.x, z: chink.position.z, r: Math.max(out.x ? across : long, out.z ? across : long) / 2 });
			n++;
		}
	}

	// Four boulders at the corners, outside the rim: they are the reason the rectangle does not read as
	// one, and the two on the near side are the biggest frogs' seats.
	for (let i = 0; i < 4; i++) {
		const corner = [
			// Set ON the corner and not clear of it: each one leans on the two rim stones beside it, so the
			// four ends of the pond are knots in the line and not four boulders parked near it.
			{ x: WATER.x0 - 0.18, z: WATER.z0 - 0.16 },
			{ x: WATER.x1 + 0.22, z: WATER.z0 - 0.2 },
			{ x: WATER.x1 + 0.18, z: WATER.z1 + 0.2 },
			{ x: WATER.x0 - 0.22, z: WATER.z1 + 0.16 },
		][i];
		// Squatter than the rim stones and harder crumpled: at a distance a smooth sphere of stone reads as
		// a coconut set down on the grass (pictures/s80-pond-west.png), and a coconut is not a boulder.
		const across = 0.66 + rand() * 0.55;
		const tall = 0.26 + rand() * 0.26;
		const boulder = sphere(scene, `pondBoulder${i}`, {
			diameterX: across,
			diameterY: tall,
			diameterZ: across * (0.8 + rand() * 0.3),
			// Six cuts each way, and no more: at five the facets are so few that the boulder reads as a
			// folded napkin, and at eight they are so many that the flat shading disappears into a gradient
			// again. Eight was tried on the strength of the cart-wheel look below and was worse: the extra
			// cuts, with a rough fold, gouged the struck face into a pumice of black wedges.
			segments: 6,
			px: corner.x,
			py: tall * 0.34,
			pz: corner.z,
			mat: mats.pondStone,
		});
		boulder.rotation.y = rand() * 3;
		const workedBig = crumple(boulder, { at: 0.34, seed: 4100 + i * 17, lobes: 5 });
		skinTint(boulder, workedBig, { at: 0.3, low: 0.55 });
		// One struck face, and flat faces generally: see `fracture` and `facet` in src/mesh.js. A crumpled
		// ball is a dome however hard it is worked, and a dome is a rolled river stone; these were quarried.
		fracture(boulder, { at: tall * (0.05 + rand() * 0.2), lean: 0.34 + rand() * 0.3, seed: 6100 + i });
		// Broken, not rolled: see `facet` in src/mesh.js. Without it these four came out as loaves of bread
		// — bulged, and shaded as smoothly as a ball, which is the half of a coconut that was left over
		// after the size was fixed (pictures/s81-boulder-before-c.png).
		facet(boulder);
		boulder.refreshBoundingInfo();
		boulder.receiveShadows = true;
		add(boulder);
		blocker(scene, `pondBoulderBlock${i}`, { x: across, y: 0.9, z: across, px: corner.x, pz: corner.z });
		perches.push({ x: corner.x, z: corner.z, top: crownOf(boulder) - 0.02, yaw: boulder.rotation.y, across, out: outwardOf(corner.x, corner.z), mesh: boulder });
		stoneFeet.push({ x: corner.x, z: corner.z, r: across / 2 });
	}

	// ---- what floats on it ---------------------------------------------------
	//
	// Lilies, laid where a pad of them would settle: towards the far side and the shade, and none near
	// the near edge, because that is where a person stands and where the frogs sit, and a pad under a
	// frog is a frog in the water.
	const pads = [];
	const lilySpots = [
		// Lilies do not fall evenly. They start from a bud in one corner and thicken out from there, so
		// they are laid as three knots of different size — a big one in the far corner, a middling one
		// against the near-side rim, a little one off the west — with stragglers between. And the pads are
		// not all one age: a pad that has been there three growing seasons is four times the one that came
		// up last rainy season.
		{ x: CX - 1.75, z: CZ - 0.95, across: 0.56 },
		{ x: CX - 1.1, z: CZ - 1.28, across: 0.4 },
		{ x: CX - 2.05, z: CZ - 0.28, across: 0.34 },
		{ x: CX - 1.28, z: CZ - 0.42, across: 0.22 },
		{ x: CX + 1.35, z: CZ - 0.55, across: 0.46 },
		{ x: CX + 1.92, z: CZ + 0.15, across: 0.33 },
		{ x: CX + 0.95, z: CZ + 0.18, across: 0.2 },
		{ x: CX - 0.32, z: CZ - 1.18, across: 0.3 },
		{ x: CX - 1.5, z: CZ + 1.0, across: 0.38 },
		{ x: CX - 0.88, z: CZ + 1.24, across: 0.25 },
	];
/**
 * One water lily in flower: a star of petals and a ball of yellow in the middle of them, standing
 * above a pad. The garden has no other white thing in it, and at six metres a pond with a flower on it
 * is a garden pond while a pond of pads alone is a puddle with leaves in it. `open` is how far the
 * petals are fanned: 1 for the full flower, 0.15 for a bud that has not gone out yet.
 */
function makeFlower(scene, mats, { x, z, y, seed, open = 1, name = "pondLilyFlower" }) {
	const root = new BABYLON.TransformNode(name, scene);
	root.position.set(x, y, z);
	const rand = randomGenerator(seed);
	const parts = [];
	// Two rings of petals and not one: a water lily's outer petals are splayed nearly flat on the water
	// and the inner ones come up over the middle. One ring at one angle came out as a white tulip standing
	// in a saucer (pictures/s88-pond-c.png), which is a cut flower in a vase and not a lily on a pond.
	const rings = [
		{ count: 7 + Math.floor(rand() * 2), len: 0.085 + rand() * 0.02, tilt: 0.3 + open * 0.2 },
		{ count: 5 + Math.floor(rand() * 2), len: 0.055 + rand() * 0.015, tilt: 0.75 + open * 0.3 },
	];
	for (const ring of rings) {
	const petals = ring.count;
	const len = ring.len;
	for (let i = 0; i < petals; i++) {
		const tilt = ring.tilt + rand() * 0.12;
		// One arm out of the middle, turned round the clock, and a petal laid along it and tipped up.
		// The arms do the turning so the petals only have to lie flat and be lifted: two angles that each
		// mean one thing, instead of one rotation that has to mean three.
		const arm = new BABYLON.TransformNode(`${name}Arm${i}`, scene);
		arm.parent = root;
		arm.rotation.y = (i / petals) * Math.PI * 2 + rand() * 0.3;
		const petal = plane(scene, `${name}Petal${i}`, {
			width: 0.028 + len * 0.34,
			height: len,
			mat: mats.lilyFlower,
			bothSides: true,
			parent: arm,
		});
		// A plane lies in its own X Y face, so a quarter turn about x lays it down; take a little of that
		// turn back and the petal rides up over its neighbours instead of lying flat on the pad.
		petal.rotation.x = Math.PI / 2 - tilt;
		petal.position.set(0, len * 0.42 * Math.sin(tilt) + 0.006, len * 0.42 * Math.cos(tilt));
		parts.push(petal);
	}
	}
	// The stamen. Small, and the warmest colour on the water.
	const heart = sphere(scene, `${name}Heart`, {
		diameter: 0.034,
		diameterY: 0.02,
		segments: 8,
		py: 0.014,
		mat: mats.lilyHeart,
		parent: root,
	});
	parts.push(heart);
	return { root, parts };
}

	for (let i = 0; i < lilySpots.length; i++) {
		const s = lilySpots[i];
		// A pad floats a centimetre or two proud of the surface it lies on, and each on its own beat
		// afterwards, in `animate` below.
		const pad = makePad(scene, mats, {
			x: s.x,
			z: s.z,
			across: s.across,
			y: WATER_Y + 0.012,
			seed: 907 + i * 31,
			name: `pondLily${i}`,
		});
		pads.push(pad);
		built.push(pad);
	}

	// Flowers on the biggest pads, and a bud on a little one a hand away: a lily does not spend every
	// pad it has, and one bud among two flowers is what a clump that is really growing looks like. They
	// are parented to their pad, so they bob with it and no separate clock is needed.
	const blooming = [
		{ pad: 0, open: 1, seed: 41 },
		{ pad: 4, open: 0.85, seed: 42 },
		{ pad: 8, open: 1, seed: 43 },
		{ pad: 6, open: 0.12, seed: 44 },
	];
	for (const b of blooming) {
		const pad = pads[b.pad];
		if (!pad) continue;
		const flower = makeFlower(scene, mats, {
			x: 0,
			z: 0,
			// A water lily lies ON the water, its petals all but touching it: three centimetres of air
			// under the star and the flower looked pinned to a stick above the pad.
			y: 0.012,
			seed: b.seed,
			open: b.open,
			name: `pondLilyFlower${b.pad}`,
		});
		flower.root.parent = pad;
		// A pad is built about its own middle, so the flower rides where the pad is built to ride; and the
		// pad is tilted a little to one side, so the flower leans with it. Undo the tilt about the flower's
		// own root or the whole star lies down along the dip.
		flower.root.rotation.x = -pad.rotation.x;
		flower.root.rotation.z = -pad.rotation.z;
		for (const mesh of flower.parts) built.push(mesh);
	}

	// Ripples: five flat rings lying on the water, waiting to be spent by a frog going in. They are made
	// here and hidden, not made at the moment of the plunge, because a mesh built in the middle of an
	// animation is a hitch in the frame; and five is more than this pond's frogs can spend at once.
	//
	// They are left in the ordinary draw order on purpose. A ring raised into a later group would paint
	// itself over a stone that stands between the ring and the eye; left where they fall, the stones have
	// already written their depth and the ring behind one of them is refused, which is what water does.
	const RIPPLE_LIFE = 1.6; // seconds from the plunge to a flat surface again
	const ripples = [];
	for (let n = 0; n < 6; n++) {
		const ring = plane(scene, `pondRipple${n}`, {
			width: 1, height: 1, px: CX, py: WATER_Y - 0.4, pz: CZ, rx: Math.PI / 2,
			mat: mats.ripple, bothSides: true,
		});
		ring.isVisible = false;
		ring.isPickable = false;
		// `from` and `span` are the ring's own starting width and how much wider it gets, `show` the most it
		// is ever seen, and `life` how long it takes to fade: a frog's plunge and a koi's roll are not the
		// same disturbance on the same sheet and should not wear the same ring.
		ripples.push({ mesh: ring, left: 0, from: 0.3, span: 1.05, show: 0.6, life: RIPPLE_LIFE });
	}

	/**
	 * Something broke the surface here: lay a ring down and let `animate` carry it out.
	 *
	 * `shape` says how big a disturbance it was — `{ across, span, show, life }`, all in the units the ring
	 * is drawn in. A frog going in head first wants the defaults: a small, bright, short-lived ring. A koi
	 * rolling at the surface wants the opposite (`src/koi.js`): wide, faint and slow, because what a fish
	 * pushing its back through the surface film leaves is not a splash but a swell, and the whole reason
	 * to pay for one is that a visitor can see the wake before they see the fish and knows to look.
	 */
	function splash(x, z, shape = {}) {
		// Kept inside the water, so a frog that goes in against the rim does not splash the gravel.
		const sx = Math.min(WATER.x1 - 0.08, Math.max(WATER.x0 + 0.08, x));
		const sz = Math.min(WATER.z1 - 0.08, Math.max(WATER.z0 + 0.08, z));
		// A free ring if there is one; otherwise the one nearest its end, since the newest plunge is the
		// one that was just seen.
		const slot = ripples.find((r) => r.left <= 0) || ripples.reduce((a, b) => (a.left < b.left ? a : b));
		const across = shape.across === undefined ? 0.3 : shape.across;
		slot.from = across;
		slot.span = shape.span === undefined ? 1.05 : shape.span;
		slot.show = shape.show === undefined ? 0.6 : shape.show;
		slot.life = shape.life === undefined ? RIPPLE_LIFE : shape.life;
		slot.mesh.position.set(sx, WATER_Y + 0.006, sz);
		slot.mesh.visibility = slot.show;
		slot.mesh.scaling.setAll(across);
		slot.mesh.isVisible = true;
		slot.left = slot.life;
	}

	return {
		meshes: built,
		// The water's own rectangle, and nothing beyond it: the rim stones lie over this line, so a
		// visitor is stopped at the edge of the water and not at a wall of thin air half a metre out.
		walkBlocks: [[WATER.x0, WATER.x1, WATER.z0, WATER.z1]],
		plan: { ...WATER, cx: CX, cz: CZ, waterY: WATER_Y, floorY: FLOOR_Y },
		perches,
		/**
		 * Say which of the perches a visitor standing on the bank can actually SEE, and stamp it on the
		 * perch. This has to be asked after the whole garden is built, because what hides a frog is not the
		 * pond: it is the boulder beyond the stone, the cut-stone lip, the sedge at the margin. Measured,
		 * not guessed: `tools/where.js` found three of the five frogs lying in the shade of a big stone with
		 * their whole frame empty from the bank, which is a frog that does not exist.
		 *
		 * One ray per perch, from a visitor's eye where the bank path meets the water, to the crown the frog
		 * would sit on. If the first thing the ray meets is that perch's own stone, nothing is between them.
		 * The water, the pads and the rings are transparent to the question: a sheet of water does not hide
		 * a frog, it is what the frog is sitting over.
		 */
		markPerches(scene, at = { x: -15.6, y: 1.62, z: 17.4 }) {
			let seenCount = 0;
			for (const perch of perches) {
				const from = new BABYLON.Vector3(at.x, at.y, at.z);
				// Two centimetres over the crown, which is a frog flank and not its eye: aim where the
				// animal IS and the sedge at the water edge counts against it, which is what the measure was for.
				const to = new BABYLON.Vector3(perch.x, perch.top + 0.06, perch.z); // where a frog's eye sits
				const dir = to.subtract(from);
				const reach = dir.length();
				const ray = new BABYLON.Ray(from, dir.normalize(), reach * 1.02);
				const hit = scene.pickWithRay(ray, (m) => {
					if (!m.isEnabled() || m.visibility === 0) return false;
					return !/^(pondWater|pondRipple|lily|pad)/.test(m.name);
				});
				perch.seen = !!(hit && hit.hit && hit.pickedMesh === perch.mesh);
				if (perch.seen) seenCount++;
			}
			return seenCount;
		},
		water: sheet,
		splash,
		animate(time, delta = 0) {
			// Rings that are out travel outwards and lose their height as their circle grows, which is
			// what a ripple does and is here expressed as a square on the remaining time. Each ring carries
			// its own size and life: see `splash`.
			for (const r of ripples) {
				if (r.left <= 0) continue;
				r.left -= delta;
				const u = 1 - Math.max(0, r.left) / r.life;
				const across = r.from + u * r.span;
				r.mesh.scaling.set(across, across, across);
				r.mesh.visibility = (1 - u) * (1 - u) * r.show;
				if (r.left <= 0) r.mesh.isVisible = false;
			}
			// The surface drifts, the same slow way the pool's does; a pond's wind is a third of the
			// pool's, since the palms break it before it gets here.
			if (mats.pondWater.bumpTexture) {
				mats.pondWater.bumpTexture.uOffset = time * 0.005;
				mats.pondWater.bumpTexture.vOffset = -time * 0.0035;
			}
			// The pads ride the same water: a millimetre up and down, each on its own beat.
			for (let i = 0; i < pads.length; i++) {
				pads[i].position.y = WATER_Y + 0.012 + Math.sin(time * 0.7 + i * 1.9) * 0.0016;
			}
		},
	};
}
