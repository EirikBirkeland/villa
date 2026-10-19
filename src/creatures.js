// The Villa's small living things: three butterflies over the garden, three cockroaches on the stone,
// and four frogs on the stones at the pond.
//
// Why they are here at all: a garden that never moves is a photograph of a garden. Everything else in
// this folder is built once and stands still — the water moves and the lamps shine, but nothing in the
// Villa is ALIVE — and the eye is built to notice a small thing that moves before it notices anything
// else. Two kinds of creature were asked for, both small enough that nobody can count their legs, so
// both are built out of as much as shows at the distance they are seen from and no more.
//
// THE RULE THIS FILE LIVES BY: a creature has to be FOUND. Not exist in the scene — be found. v0.74.0
// shipped butterflies that were 6.8 cm across, two metres off the ground, in corners nobody stands,
// flying straight at the visitor so that all they showed was the edge of a wing; `tools/where.js`
// counted the pixels they actually painted in the first picture and the answer was five. Five pixels
// of a 1280 by 720 frame is not a butterfly, it is dust on the lens. So:
//
//   SIZE     eleven centimetres tip to tip (a Thai birdwing, which is what a butterfly out here is) and
//            fourteen for the roach, which is a monster: the animal is four and a half and the reason it
//            is shown three times over is two releases of the master being unable to find one. See
//            ROACH_REAL_CM and ROACH_SHOWN_CM below, and `?roach=` in the address.
//   PLACES   where a visitor stands and looks: over the pool's near end at arm's length, over the far
//            coping, and on the paving at the visitor's own feet. The third butterfly is out of the
//            first picture on purpose, on the west bed, for whoever walks round the water.
//   AGAINST  a colour the background has not got: the orange birdwing against the sunlit stone at the
//            pool's near coping, paper white with a black border against the dark planting behind it,
//            and the morpho's blue over the west bed's green for whoever walks round the water.
//   ACROSS   the view, not at it. The wing hinge runs along the creature's own back, so a butterfly
//            coming straight at you shows the EDGE of its wings and nothing else; the same creature
//            crossing your view shows the whole face of them. This is why every patch below is wide
//            east-west and shallow north-south.
//
// Measured now at the standing start, in pixels of a 1280 by 720 picture, over four moments of each
// loop: the orange butterfly four and a half metres off paints 64..82 px and stands 50-60 parts in 255
// away from the stone behind it; the white one three and a third off paints 58..117 px against a gap of
// 60-70; the morpho is out of that frame altogether at nine and a half metres, which is the point of
// putting it there. The three roaches are on the paving at the visitor's own feet, on the west walk and
// on the east deck; the one underfoot paints about 260 px when you look straight down at it from a
// standing start, and about 30 from a metre and a half off, against a colour gap of eighty or so. Both
// numbers are at the debug size: at four and a half centimetres the same creature is nineteen pixels.
// Re-measure with `node tools/where.js`, which also says which of them are behind you — worth knowing,
// because most of them are, most of the time.
//
// Everything here is built once at boot and moved every frame by `animate(time, delta)`. Nothing is
// a shadow caster (a two-centimetre shadow is a smudge), nothing is solid, and nothing is in the pool's
// mirror.

import { sphere, cylinder } from "./mesh.js";

const { TransformNode } = BABYLON;

// Where the three butterflies live, what they are coloured like, and how far they swing east-west and
// north-south (`eastWest` and `northSouth`, in metres, either side of their own patch).
//
// Two of the three are placed so that they are IN THE FIRST PICTURE, because a feature nobody finds is
// not a feature. The standing start is at (2.4, 1.74, 10.5) looking north, and from there everything
// nearer than five metres is water: the frame's bottom edge is the pool's near coping, three metres
// off, and the paving a visitor is standing on is below the picture altogether. So the findable
// butterflies hang over the water at chest and eye height, which is also where a visitor's eye already
// is, and the paving is left to the cockroach.
//
// The swing is deliberately WIDE and SHALLOW: a butterfly travels mostly across the visitor's view and
// barely towards them. That is not a mannerism. The wing hinge runs along the creature's own back, so a
// butterfly coming straight at you shows the EDGE of its wings — about ten pixels of pink sliver, which
// is exactly what v0.74.0 measured at — while the same creature crossing your view shows the whole face
// of them. Crossing is what a butterfly is worth.
//
// Each is also put where its own colour has something behind it: orange and paper white against the
// pool's cyan, and the blue morpho over the dark planting on the west bed, where a person who walks
// round the water will find it.
const BUTTERFLIES = [
	// Over the coping at the pool's near end, four metres in front of where a visitor arrives and a head
	// and a half below their eye: the one met first, and the biggest. Low on purpose — at that distance a
	// butterfly at chest height is seen against the terrace wall, which is the same warm stone it is
	// painted like, and it went flat; down here it stands off the sunlit coping by fifty or sixty parts
	// in 255 and the eye picks it out of the picture at once.
	{ x: 2.2, y: 0.95, z: 6.2, eastWest: 0.8, northSouth: 0.35, colour: "butterflyWingOrange", flap: 3.7, size: 1.06, yaw: 1.9 },
	// The other side of the first picture, to the right: the white one, at about the height a person
	// looks, with the pale coping and the steps behind it and a dark border to be seen by. Its swing is
	// the narrowest of the three on purpose — this near the eye, a wide swing walks it out of the frame.
	{ x: 3.4, y: 1.55, z: 7.2, eastWest: 0.4, northSouth: 0.3, colour: "butterflyWing", flap: 4.4, size: 1.0, yaw: 1.9 },
	// Out of the start view, over the laterite bed and its planting by the terrace steps: for a person
	// who walks west along the water. The morpho is blue on dark green, and it runs north-south because
	// the person who finds it is walking and looking west.
	{ x: -6.4, y: 1.05, z: 8.4, eastWest: 0.5, northSouth: 1.5, colour: "butterflyWingBlue", flap: 4.6, size: 1.0, yaw: 4.4 },
];

// Where the cockroaches are allowed to go: three patches of paving, each one somewhere a visitor
// actually stands and looks down. The pool deck runs from the water's edge at z 7.6 out past where you
// arrive at z 10.5, and it is stone at y 0.14 the whole way, so there is plenty of it; what there is not
// is any reason for a roach to be three metres off in a corner, which is where the first one was put and
// where nobody ever found it. The middle patch is the paving under the visitor's own feet — the ground a
// person sees when they drop their eyes from the house — and the third keeps off the cheese: the platter
// table stands at (6.8, 9.2) and its patch stops short of it at x 6.5, because the cheese in this Villa
// is insect-free and stays so. Each roach is turned back at the edges of its own patch and at the water,
// which `ground.free` says is not to be walked on.
const ROACH_PATCHES = [
	// Under the visitor's own feet at the standing start, and pulled in against the pool's coping since the
	// Villa acquired a night: after nine o'clock a brown roach on unlit brown stone is not a creature anybody
	// finds, and this is the one patch that is in the first picture. The stone at the water's edge is the
	// brightest ground in the garden after dark — the pool lights it from below — and it is still under a
	// person's own boots when they drop their eyes from the house at (2.4, 1.74, 10.5).
	{ x: 2.6, z: 8.4, seed: 41, region: { x0: 1.6, x1: 3.4, z0: 7.9, z1: 9.1 } },
	// The west walk, between the laterite bed and the water — the ground anybody who goes round the pool
	// to look at the sunset passes over. Measured paving (`deckFar`) the whole width of it.
	{ x: -4.6, z: 9.2, seed: 53, region: { x0: -5.6, x1: -3.4, z0: 8.2, z1: 10.2 } },
	// The east deck by the loungers, and stopping short of the platter: the cheese table stands at
	// (6.8, 9.2) and this patch stops at x 6.4, because the cheese in this Villa is insect-free.
	{ x: 5.9, z: 9.6, seed: 67, region: { x0: 5.4, x1: 6.4, z0: 8.6, z1: 10.6 } },
];

// Two sizes, both honest about what they are. `ROACH_REAL_CM` is the animal — the big house cockroach of
// this climate, 4.5 cm nose to tail-tip, and about the smallest thing worth six legs. `ROACH_SHOWN_CM` is
// what the Villa is showing at the moment: the master walked two releases and never saw one, and at four
// and a half centimetres the creature on the paving three metres off is nineteen pixels of a 1280-wide
// picture, which is a flake of dirt until it moves. So it is shown fourteen centimetres across — a
// monster, an inland water monitor of a roach, and impossible to walk past — until he says the word and
// the default below goes back to the real one. `?roach=` in the address sets it in centimetres either way:
// `?roach=4.5` for the animal, `?roach=25` to put one on the table.
const ROACH_REAL_CM = 4.5;
const ROACH_SHOWN_CM = 14;

/**
 * Builds every creature and hands back the one thing `main.js` needs: `animate`.
 * `ground` is the visitor's own ground, so a cockroach walks on the paving it is on and not through it.
 */
export function buildCreatures(scene, mats, ground, { roachCm = ROACH_SHOWN_CM, frogCm = FROG_SHOWN_CM, perches = [], pond = null, sound = null, isNight = () => false } = {}) {
	const beasts = [];
	let seed = 7;
	for (const b of BUTTERFLIES) beasts.push(makeButterfly(scene, mats, { ...b, seed: seed++ }));
	const roaches = ROACH_PATCHES.map((patch, i) =>
		makeCockroach(scene, mats, { ...patch, tag: i + 1, ground, long: roachCm / 100 }),
	);
	// The frogs sit on the stones at the pond's rim, which `src/pond.js` hands over. No pond, no frogs:
	// they live on those stones and nowhere else in this garden, and a frog laid down by numbers on
	// open grass is a frog nobody finds.
	const frogs = [];
	// A frog's home is the stone nearest the place it was planted at — but among the stones a visitor
	// standing on the bank can see, if any of them are near. `pond.markPerches` measured that with one ray
	// per stone after the garden was built, and `tools/where.js` says what it bought: three of the five
	// frogs used to sit behind a boulder or in the sedges from the one place anyone stands to look at the
	// pond, moving no pixel at all, which is a frog that does not exist.
	const showable = perches.filter((p) => p.seen);
	const homes = showable.length ? showable : perches;
	for (let i = 0; i < FROG_SPOTS.length; i++) {
		const spot = FROG_SPOTS[i];
		const perch = nearestOf(homes, spot.near) || nearestOf(perches, spot.near);
		if (perch) frogs.push(makeFrog(scene, mats, { tag: i + 1, perch, perches, long: frogCm / 100, seed: spot.seed, pond, bold: spot.bold, sound, isNight, croakAt: spot.croak }));
	}
	return {
		butterflies: beasts,
		cockroaches: roaches,
		frogs,
		/**
		 * Day and night, and who is awake for which.
		 *
		 * The cockroaches are the night's: the master asked for it and it is the one thing about them nobody
		 * can argue with. Out of the day they are, into the cracks of the paving they go, and the garden is
		 * left to the butterflies and the frogs. At night it is the other way about — the butterflies are
		 * shut up somewhere with their wings folded over their backs and are not to be seen, and what is
		 * abroad is the roaches and the two fireflies (`src/fireflies.js`).
		 *
		 * Switched off and not merely hidden behind something: `setEnabled(false)` takes a mesh out of the
		 * draw list, which is the difference between an animal asleep and an animal costing the frame.
		 */
		night(on) {
			for (const b of beasts) b.root.setEnabled(!on);
			for (const r of roaches) r.root.setEnabled(!!on);
		},
		animate(time, delta) {
			for (const b of beasts) beat(b, time, delta);
			for (const r of roaches) scurry(r, time, delta);
			for (const f of frogs) croak(f, time, delta);
		},
	};
}

/** The perch nearest a point, and nothing at all if there are no perches to choose from. */
function nearestOf(perches, at) {
	let best = null;
	let gap = Infinity;
	for (const p of perches) {
		const d = Math.hypot(p.x - at.x, p.z - at.z);
		if (d < gap) {
			gap = d;
			best = p;
		}
	}
	return best;
}

/**
 * One butterfly: a bead of a body and two wings hinged along it.
 *
 * The wings are built by hand rather than by `plane()` because their texture coordinates are the wing's
 * own — the hinge on one edge, the tip on the other — and not a pattern measured in metres of ground.
 * The wing's canvas is painted pale and the material carries the colour, so three butterflies of three
 * colours is one canvas (`butterflyWingCanvas` in src/textures.js).
 */
function makeButterfly(scene, mats, { x, z, y, eastWest, northSouth, colour, flap, size, seed, yaw }) {
	const span = 0.115 * size; // tip to tip, both wings: a birdwing, not a small brown thing
	const long = 0.045 * size; // front to back
	const root = new TransformNode(`butterfly${seed}`, scene);
	root.position.set(x, y, z);

	// The body: a bead, a smaller bead for the head in front of it, and two beads of eyes.
	sphere(scene, "butterflyBody", {
		diameterX: 0.013 * size, diameterY: 0.013 * size, diameterZ: long * 0.78, segments: 6,
		mat: mats.butterflyBody, parent: root, tile: 0.03,
	});
	sphere(scene, "butterflyHead", {
		diameterX: 0.0095 * size, diameterY: 0.009 * size, diameterZ: 0.01 * size, segments: 6,
		px: 0, py: 0.0005, pz: long * 0.42, mat: mats.butterflyBody, parent: root, tile: 0.03,
	});

	const half = span / 2;
	const wings = [];
	for (const side of [1, -1]) {
		// Four corners: two on the hinge along the body and two out at the tip. The face points up for
		// the right wing and down for the left, which is why each gets its own winding; the material is
		// drawn and lit from both sides whatever way round that comes out.
		const positions = [
			0, 0, long / 2, // hinge, front
			0, 0, -long / 2, // hinge, back
			side * half, 0, -long / 2,
			side * half, 0, long / 2,
		];
		const uvs = [0, 1, 0, 0, 1, 0, 1, 1];
		const indices = side > 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
		const wing = polyQuad(scene, `butterflyWing${side > 0 ? "right" : "left"}`, positions, uvs, indices, mats[colour], root);
		wings.push({ mesh: wing, side });
	}

	return {
		kind: "butterfly",
		root,
		wings,
		home: { x, y, z },
		eastWest,
		northSouth,
		flap,
		phase: seed * 1.7,
		yaw: yaw || 0,
		last: { x, z },
		turn: 0,
	};
}

/** A four-corner mesh with the texture coordinates the caller chose. */
function polyQuad(scene, name, positions, uvs, indices, mat, parent) {
	const mesh = new BABYLON.Mesh(name, scene);
	const data = new BABYLON.VertexData();
	data.positions = positions;
	data.uvs = uvs;
	data.indices = indices;
	const normals = new Array(positions.length).fill(0);
	BABYLON.VertexData.ComputeNormals(positions, indices, normals);
	data.normals = normals;
	data.applyToMesh(mesh, true);
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	return mesh;
}

/**
 * The wingbeat, and the flight.
 *
 * A butterfly does not fly in a line: it loops and drifts and drops, so its place is the sum of two slow
 * turns at different rates, on each axis, plus a fast bobbing in time with the wings. It never repeats
 * the same way twice inside a walk. It faces where it is going, and it leans over into the turn the way
 * a cyclist does, which is the thing that says *this turned because it chose to*.
 *
 * The two axes are not given the same reach: see the table at the top of this file for why the long way
 * is the way it crosses a visitor's view, and the short way the depth it barely budges in.
 */
function beat(b, time, delta) {
	const t = time + b.phase;
	const x = b.home.x + Math.sin(t * 0.63) * b.eastWest + Math.sin(t * 1.51 + 1.1) * b.eastWest * 0.35;
	const z = b.home.z + Math.cos(t * 0.48 + 0.6) * b.northSouth + Math.sin(t * 1.32 + 2.4) * b.northSouth * 0.3;
	const y = b.home.y + Math.sin(t * 2.2) * 0.09 + Math.sin(t * 9.4) * 0.02;

	const dx = x - b.last.x;
	const dz = z - b.last.z;
	const go = Math.hypot(dx, dz);
	if (go > 1e-6) {
		const want = Math.atan2(dx, dz);
		let gap = want - b.yaw;
		while (gap > Math.PI) gap -= Math.PI * 2;
		while (gap < -Math.PI) gap += Math.PI * 2;
		// Turned at a fixed rate rather than snapped to: a creature that changes its mind instantly is a
		// sprite, and one that leans into a turn is an animal.
		const step = (1 - Math.exp(-5 * delta)) * gap;
		b.yaw += step;
		b.turn = step / Math.max(delta, 1e-4);
	}
	b.last.x = x;
	b.last.z = z;

	b.root.position.set(x, y, z);
	b.root.rotation.y = b.yaw;
	b.root.rotation.z = Math.max(-0.6, Math.min(0.6, -b.turn * 0.09));
	b.root.rotation.x = 0.12 + Math.sin(t * 9.4) * 0.06;

	const beat = Math.sin(time * Math.PI * 2 * b.flap + b.phase);
	// The fold, from twenty degrees above the body to sixty. Never much below, because a wing that beats
	// under the body is beating against its own legs, and never much above, because a wing folded upright
	// is seen edge-on by a visitor standing up and is then two pixels thick. This sweep is the widest
	// middle the hinge allows; the flight path in `beat` does the rest of the work.
	const lift = 0.35 + 0.7 * (0.5 + 0.5 * beat);
	for (const w2 of b.wings) w2.mesh.rotation.z = w2.side * lift;
}

/**
 * One cockroach: a flattened brown oval, the shield behind its head, two antennae and six legs.
 *
 * It goes the way cockroaches go — a dash, a dead stop with the antennae going, another dash in a
 * different direction — because a cockroach that glides at a steady pace is a beetle. It stays inside
 * its own patch of paving and turns back at the edges, and it stands on the ground the visitor's own
 * ground function is asked about, so it walks over the paving's lip and the lawn edge and not through
 * either.
 */
function makeCockroach(scene, mats, { x, z, seed, region, ground, long, tag = 1 }) {
	// The one size, and everything else a fraction of it — legs, antennae, the stand it keeps above the
	// stone — so a change of size changes the whole animal and not just its shell.
	const wide = long * 0.44;
	// Every part carries its own roach's number in its name, so three animals do not walk about with three
	// meshes all called `cockroachShell`, and so a probe can tell which of the three it is looking at.
	const n = (what) => `cockroach${tag}${what}`;
	const root = new TransformNode(n(""), scene);
	const rand = mulberry(seed);

	// The body, laid along z with its head towards +z, and flatter than its width. It stands up off the
	// paving on its legs, the way a roach does, rather than lying flat on it.
	sphere(scene, n("Shell"), {
		diameterX: wide, diameterY: wide * 0.4, diameterZ: long, segments: 8,
		mat: mats.cockroachShell, parent: root, tile: 0.02,
	});
	// The shield over the head: a plate, narrower and flatter than the belly, sitting forward on it. Flat
	// is the point — a dome of it is a second body growing out of the first.
	sphere(scene, n("Shield"), {
		diameterX: wide * 0.76, diameterY: wide * 0.16, diameterZ: long * 0.3,
		px: 0, py: long * 0.055, pz: long * 0.36, mat: mats.cockroachShield, parent: root, tile: 0.02,
	});
	// The head itself, tucked under the shield's front lip, and two dark eyes on it.
	sphere(scene, n("Head"), {
		diameterX: wide * 0.44, diameterY: wide * 0.34, diameterZ: long * 0.15,
		px: 0, py: -long * 0.015, pz: long * 0.48, mat: mats.cockroachLeg, parent: root, tile: 0.02,
	});

	// Two antennae: a thigh out in front and a whip beyond it, each turned a little further than the
	// last, so the pair sweeps forward and out the way a roach's do. They are longer than the body,
	// which is the first thing about a big cockroach and the one shape nobody mistakes for anything else.
	const antennae = [];
	for (const side of [1, -1]) {
		const shoulder = new TransformNode(n(`Antenna${side}`), scene);
		shoulder.parent = root;
		shoulder.position.set(side * wide * 0.2, long * 0.13, long * 0.5);
		const thigh = cylinder(scene, n(`AntennaThigh${side}`), {
			diameter: long * 0.034, height: long * 0.45, tessellation: 4, mat: mats.cockroachLeg, parent: shoulder,
			rx: Math.PI / 2 - 0.18, pz: long * 0.22, py: long * 0.03, tile: 0.01,
		});
		const whip = cylinder(scene, n(`AntennaWhip${side}`), {
			diameter: long * 0.024, height: long * 0.6, tessellation: 4, mat: mats.cockroachLeg, parent: thigh,
			rx: Math.PI / 2 - 0.4, pz: long * 0.47, py: long * 0.04, tile: 0.01,
		});
		antennae.push({ side, shoulder, thigh, whip });
	}

	// Six legs, three a side, each in two pieces so it can lift and put down. They are as thick as a
	// sewing needle and are only ever seen from half a metre, but a leg that moves is the difference
	// between a brown oval and an insect.
	const legs = [];
	for (const side of [1, -1]) {
		for (let i = 0; i < 3; i++) {
			const hip = new TransformNode(n(`Hip${side}${i}`), scene);
			hip.parent = root;
			hip.position.set(side * wide * 0.4, -wide * 0.18, long * (0.26 - i * 0.26));
			// The thigh hangs from its hip rather than being centred on it, so turning the hip swings the
			// foot, which is what a leg does. Short: a roach's legs are not longer than its body is wide,
			// and a needle of one reads as a scratch on the picture.
			const thigh = cylinder(scene, n(`Leg${side}${i}`), {
				diameter: long * 0.03, height: long * 0.3, tessellation: 4, mat: mats.cockroachLeg, parent: hip,
				py: -long * 0.15, tile: 0.01,
			});
			thigh.rotation.z = side * 0.62;
			legs.push({ hip, thigh, side, phase: i * 2.1 + (side > 0 ? 0 : 3.1) });
		}
	}

	return {
		kind: "cockroach",
		long,
		root,
		legs,
		antennae,
		ground,
		region,
		x,
		z,
		// On its feet, not on its belly: the hips sit under the body and the thighs hang from them at
		// their own sprawl, so the foot comes to rest a little under a third of the body length below the
		// middle, and that is how high the middle has to be.
		y: ground.heightAt(x, z) + long * 0.32,
		heading: rand() * Math.PI * 2,
		speed: 0,
		left: 0,
		phase: seed * 0.31,
		rand,
		step: 0,
	};
}

/** A plain little random number source, so one creature's plan does not disturb another's. */
function mulberry(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * The cockroach's plan: a dash, a stop, a change of mind.
 *
 * Three states and no more — `walk`, `stop`, `dash` — picked out of the creature's own random source
 * each time the last one runs out. The legs are driven off the same clock as the speed, so a stop is a
 * stop and not a run in place.
 */
function scurry(r, time, delta) {
	const WALK = 0.14; // metres a second, which is slow for a roach and fast for a picture
	const DASH = 0.55;

	r.left -= delta;
	if (r.left <= 0) {
		const throw_ = r.rand();
		if (throw_ < 0.24) {
			r.state = "stop";
			r.left = 0.4 + r.rand() * 1.1;
			r.speed = 0;
		} else if (throw_ < 0.4) {
			r.state = "dash";
			r.left = 0.25 + r.rand() * 0.6;
			r.speed = DASH * (0.7 + r.rand() * 0.5);
			r.heading += (r.rand() - 0.5) * 2.4;
		} else {
			r.state = "walk";
			r.left = 0.9 + r.rand() * 2.2;
			r.speed = WALK * (0.6 + r.rand() * 0.9);
			r.heading += (r.rand() - 0.5) * 1.2;
		}
	}

	// The edges of its patch: turned back by the heading, the way an insect runs back from a wall.
	const ahead = {
		x: r.x + Math.sin(r.heading) * r.speed * delta,
		z: r.z + Math.cos(r.heading) * r.speed * delta,
	};
	if (
		ahead.x < r.region.x0 || ahead.x > r.region.x1 ||
		ahead.z < r.region.z0 || ahead.z > r.region.z1 ||
		!r.ground.free(ahead.x, ahead.z)
	) {
		r.heading += Math.PI * (0.5 + r.rand() * 0.6);
	} else {
		r.x = ahead.x;
		r.z = ahead.z;
	}

	// A wobble on the way along: no insect keeps a straight line for a whole second.
	const wobble = Math.sin(time * 7.3 + r.phase) * (r.state === "walk" ? 0.16 : 0.05);
	r.root.position.set(r.x, r.y + Math.abs(Math.sin(time * 9 + r.phase)) * 0.0006, r.z);
	r.root.rotation.y = r.heading + wobble;
	r.root.rotation.x = Math.sin(time * 9 + r.phase) * 0.04;

	// The legs: a three-beat walk, a pair of legs on each side lifted in turn while the body moves over
	// them. Driven off how far it has actually gone, so it never runs on the spot, and divided by the
	// body's length: a big animal takes long strides and beats slower, which is what a water monitor of a
	// cockroach does and what stops the debug size's legs blurring. Calibrated on the real 4.5 cm animal.
	r.step += r.speed * delta * 55 * (ROACH_REAL_CM / (r.long * 100));
	for (const leg of r.legs) {
		const swing = Math.sin(r.step + leg.phase) * (r.speed > 0 ? 0.45 : 0);
		leg.hip.rotation.y = swing;
		leg.hip.rotation.z = leg.side * (0.62 + Math.cos(r.step + leg.phase) * (r.speed > 0 ? 0.14 : 0));
		leg.thigh.rotation.y = 0;
	}

	// The antennae: swept about hardest when the animal has stopped to listen.
	const twitch = r.state === "stop" ? 0.55 : 0.22;
	for (const a of r.antennae) {
		const s = Math.sin(time * (r.state === "stop" ? 9.5 : 5.5) + a.side * 1.9 + r.phase);
		a.shoulder.rotation.y = a.side * (0.5 + s * twitch);
		a.shoulder.rotation.x = s * twitch * 0.6;
	}
}

// The frogs: four of them, on the stones at the pond's edge.
//
// A frog is the easiest animal in the world to draw badly and the hardest to put where a person will
// find one, because it spends its whole life sitting still on a wet stone exactly the colour of a wet
// stone. So the two things that matter here are where they sit and how they move, and not how many
// toes they have: a frog that hops from one stone to another across a pool is unmistakable from twenty
// paces, and a frog that sits still is a lump of moss until it breathes.
//
// They sit on the pond's rim stones — real stone at the animal's own scale, laid by `src/pond.js` and
// handed over as `perches` — and not on the grass beside it, because a frog on close grass is a frog
// nobody sees, and because the stones are damp and warm and that is where the ones out here sit.
//
// FROG_REAL_CM is the animal: the big pond frog of this climate, eight centimetres nose to vent, of
// which a heron approves. FROG_SHOWN_CM is what the Villa shows, and for the same reason the cockroach
// is shown three times over: at eight centimetres a frog on a stone five metres off is a fleck, and the
// master has been told about the Villa's small living things twice now and found none of them. At
// thirteen centimetres it is a bullfrog the size of a mango, which is a stretch, and `?frog=` in the
// address will put it back to the animal the moment he asks for it.
const FROG_REAL_CM = 8;
const FROG_SHOWN_CM = 13;

// Where each one sits, as the stone nearest to a point — not a perch number, so moving a rim stone in
// `src/pond.js` moves the frog with it and not onto the grass. Four of the five are on the corners and the
// sides a visitor meets — the north-east corner first, because that is the corner a walker coming from the
// paving rounds, and the south pair because that is where a person stands when they stop at the bank — and
// the fifth is round the far side, for whoever walks the pond. A feature nobody finds is not a feature,
// which is the rule this whole file lives by.
// Two of them are bold, and `bold` here means what it means in a real pond: the ones that have
// been looked at most have got used to it and sit where they sit. It is also what keeps the pond stocked
// for the eye — the three that shy are the three at the near bank, so when somebody stands there the near
// stones empty, the water rings, and the far side of the pond goes on being looked at by two frogs who
// have decided that people are weather.
const FROG_SPOTS = [
	// Not on the boulder under the visitor’s feet after all: a frog at 2.4 m projects below the frame of a
	// person standing at the bank and looking across the water, so it might as well have been in the drainage
	// ditch. One stone further west, where the eye is actually pointed.
	{ near: { x: -18.6, z: 16.6 }, seed: 12, croak: 3.4 }, // the south rim, a step west of the bank
	{ near: { x: -17.4, z: 14.2 }, seed: 25, croak: 7.9 }, // mid-way down the east rim
	{ near: { x: -20.9, z: 16.8 }, seed: 38, croak: 11.6 }, // the south rim, facing the visitor's approach
	{ near: { x: -23.7, z: 12.2 }, seed: 51, croak: 5.2, bold: true }, // the far north-west boulder, for the walker
	{ near: { x: -16.7, z: 13.9 }, seed: 64, croak: 9.1, bold: true }, // the east rim: the first stones a walker rounds, and clear of the big boulder that used to stand between this frog and the bank
];

/**
 * One frog: a loaf of a body with its eyes on top of it, two front legs, and the folded pair behind
 * that is the whole of its silhouette.
 *
 * Everything is a fraction of `long`, the nose-to-vent length, so `?frog=` changes the whole animal and
 * not just its back. A frog is wider than it is tall, and the eyes are the highest thing on it: a frog
 * can lie with everything else under water and still breathe and see, and that is the shape people
 * recognise, so the eyes go up on stalks of their own and the mouth line is left to the body's front end.
 */
function makeFrog(scene, mats, { tag, perch, perches, long, seed, pond = null, bold = false, sound = null, isNight = null, croakAt = 9 }) {
	const n = (what) => `frog${tag}${what}`;
	const root = new TransformNode(`frog${tag}`, scene);
	const rand = mulberry(seed);
	const wide = long * 0.78;
	const tall = long * 0.55;

	// The loaf: nose to vent `long`, across the shoulders `wide`, and half as tall again as it is wide —
	// which is a frog sitting up. Set on its perch so the belly is squashed onto the stone's own crown.
	const body = sphere(scene, n("Body"), {
		diameterX: wide, diameterY: tall, diameterZ: long, segments: 8,
		py: tall * 0.48, mat: mats.frogSkin, parent: root, tile: 0.03,
	});
	// The pale front: the throat and the belly, showing under the loaf's front end. This is the part that
	// inflates when the animal croaks, so it is kept as its own thing and not painted on the back.
	const throat = sphere(scene, n("Throat"), {
		diameterX: wide * 0.58, diameterY: tall * 0.3, diameterZ: long * 0.34, segments: 6,
		py: tall * 0.14, pz: long * 0.26, mat: mats.frogBelly, parent: root, tile: 0.03,
	});
	// The eyes: the highest thing on the animal, on two short stalks, turned a little out so the pair
	// covers the whole horizon behind it. Each is a gold bead with a dark bar laid across it for the
	// pupil, which is the one mark that says eye and not bead.
	const eyes = [];
	for (const side of [1, -1]) {
		const socket = new TransformNode(n(`Eye${side}`), scene);
		socket.parent = root;
		socket.position.set(side * wide * 0.3, tall * 0.86, long * 0.2);
		sphere(scene, n(`EyeBall${side}`), {
			diameter: long * 0.24, segments: 6, mat: mats.frogEye, parent: socket, tile: 0.01,
		});
		sphere(scene, n(`EyeBar${side}`), {
			diameterX: long * 0.245, diameterY: long * 0.08, diameterZ: long * 0.13, segments: 4,
			py: long * 0.045, mat: mats.frogPupil, parent: socket, tile: 0.01,
		});
		eyes.push(socket);
		// remembered so `croak` can sink them without knowing the animal's size
	}
	// The front legs: two short props under the shoulders, taken from the shoulder to the foot in one
	// straight lean, because at this size a bent front leg is a scratch on the picture.
	const fronts = [];
	for (const side of [1, -1]) {
		const shoulder = new TransformNode(n(`Front${side}`), scene);
		shoulder.parent = root;
		shoulder.position.set(side * wide * 0.26, tall * 0.34, long * 0.2);
		cylinder(scene, n(`FrontLeg${side}`), {
			diameter: long * 0.11, height: long * 0.3, tessellation: 5, mat: mats.frogSkin, parent: shoulder,
			py: -long * 0.14, tile: 0.01,
		});
		sphere(scene, n(`FrontFoot${side}`), {
			diameterX: long * 0.16, diameterY: long * 0.05, diameterZ: long * 0.22, segments: 4,
			py: -long * 0.29, pz: long * 0.03, mat: mats.frogSkin, parent: shoulder, tile: 0.01,
		});
		fronts.push(shoulder);
	}
	// The back legs, folded: a thigh laid along the flank and pointing forward, and a shin hanging back
	// from its far end with a broad foot at the end of that. This is the shape of a frog at rest — the
	// whole of it, in fact, and the reason a folded frog reads as a frog from the back across a garden.
	const backs = [];
	for (const side of [1, -1]) {
		const hip = new TransformNode(n(`Hip${side}`), scene);
		hip.parent = root;
		hip.position.set(side * wide * 0.4, tall * 0.36, -long * 0.26);
		sphere(scene, n(`Thigh${side}`), {
			diameterX: long * 0.19, diameterY: long * 0.2, diameterZ: long * 0.5, segments: 6,
			pz: long * 0.16, mat: mats.frogSkin, parent: hip, tile: 0.03,
		});
		const knee = new TransformNode(n(`Knee${side}`), scene);
		knee.parent = hip;
		knee.position.set(0, 0, long * 0.36);
		cylinder(scene, n(`Shin${side}`), {
			diameter: long * 0.1, height: long * 0.34, tessellation: 5, mat: mats.frogSkin, parent: knee,
			py: -long * 0.16, tile: 0.01,
		});
		sphere(scene, n(`Foot${side}`), {
			diameterX: long * 0.15, diameterY: long * 0.05, diameterZ: long * 0.26, segments: 4,
			py: -long * 0.32, pz: long * 0.06, mat: mats.frogSkin, parent: knee, tile: 0.01,
		});
		backs.push({ hip, knee });
	}

	// Set on the perch: on the crown of its own stone, turned to face the bank and whoever is standing on
	// it. A frog watches whatever it is watching, and the thing a visitor most often is is an audience.
	const facing = perch.out + (rand() - 0.5) * 0.7;
	root.position.set(perch.x, perch.top, perch.z);
	root.rotation.y = facing;

	return {
		kind: "frog",
		// where the eyes sit, so `croak` can sink them without being told the animal size again
		eyeY: tall * 0.86,
		root,
		body,
		throat,
		eyes,
		fronts,
		backs,
		long,
		rand,
		perch,
		x: perch.x,
		z: perch.z,
		y: perch.top,
		from: perch,
		to: perch,
		// The stones within one hop of this one. The pond hands over its whole rim; a frog hops
		// to its neighbours and not across the garden, so the list is cut by distance here.
		neighbours: perches.filter((p) => Math.hypot(p.x - perch.x, p.z - perch.z) < 1.35),
		// Where the middle of the water is, how high the surface lies, and how to mark a plunge: the pond
		// hands these over. A frog with no pond cannot dive, and is left to sit and croak like a toy.
		pond,
		bold, // whether a person at the bank is worth a plunge (see `FROG_SPOTS`)
		sound, // the Villa's ear, or nothing at all if the ear is switched off
		isNight, // a frog is not asked to croak at noon
		home: perch, // the stone it came from, and the one it climbs back onto
		hides: 0, // how many times it has refused to come up while somebody stands at the bank
		state: "sit",
		left: 0.6 + rand() * 2.4,
		hop: 0,
		dive: 0,
		croak: 0,
		facing,
		phase: seed * 0.37,
	};
}

/**
 * What a frog does: sit, breathe, croak, hop, sit again.
 *
 * The breathing is the important part, because it is what the animal does ninety per cent of the time:
 * the whole body swells and settles on the breath, and the throat more than the rest. The croak is a
 * throat gone twice its size, the head thrown back with it, which is what a frog at the edge of a pond
 * does and the one movement a visitor hears before they see anything. The hop is a flat parabola from
 * one stone to the next, legs tucked at the top of it and thrown out on the landing.
 */
function croak(f, time, delta) {
	const HOP = 0.42; // seconds off its feet: a short, flat hop from stone to stone
	const DIVE = 0.38; // seconds from the push-off to the breaking of the water
	const UNDER = 6; // the shortest while a frog stays out of sight under the surface

	// Under the water there is nothing to animate but the waiting, and nothing here to draw: the animal was
	// switched off at the splash and will climb back onto its own stone when its nerve comes back.
	if (f.state === "under") {
		f.left -= delta;
		if (f.left <= 0) {
			// Whether it comes back out depends on whether the boot is still at the edge. A frog that
			// surfaces the moment it goes under is a cork and not an animal: it stays down while the
			// thing that frightened it is still there, and comes back when it is gone. Three refusals is
			// the most any of them is allowed, so nobody can empty the pond by standing in it.
			const near = f.pond && f.pond.visitor ? f.pond.visitor() : null;
			const still = near && f.pond.middle && Math.hypot(near.x - f.x, near.z - f.z) < 2.4;
			if (still && f.hides < 3) {
				f.hides++;
				f.left = 5 + f.rand() * 8;
				return;
			}
			f.hides = 0;
			f.root.setEnabled(true);
			f.to = f.home;
			f.perch = f.home;
			f.state = "sit";
			f.left = 1.4 + f.rand() * 3.4;
			f.turnTo = (f.rand() - 0.5) * 0.9;
		}
		return;
	}

	// The plunge, driven ahead of the state chooser for the same reason the wait under the water is: a
	// frame is a quarter of this leap, and the chooser must not be handed the animal while it is still in
	// the air. A flat, head-first leap off the stone, lower than a hop, because a frog going for the water
	// skims it rather than sailing over it.
	if (f.state === "dive") {
		f.dive = Math.min(1, f.dive + delta / DIVE);
		const u = f.dive;
		f.x = f.from.x + (f.to.x - f.from.x) * u;
		f.z = f.from.z + (f.to.z - f.from.z) * u;
		f.y = f.from.top + (f.to.top - f.from.top) * u + Math.sin(u * Math.PI) * f.long * 0.3;
		// The nose comes down over the leap and is level again at the moment it goes in, so the animal
		// reappears on its stone afterwards sitting straight.
		f.root.rotation.x = 0.55 * Math.sin(u * Math.PI);
		if (u >= 1) {
			if (f.pond.splash) f.pond.splash(f.x, f.z);
			f.root.setEnabled(false);
			f.state = "under";
			f.left = UNDER + f.rand() * 6;
		}
		return;
	}

	f.left -= delta;
	if (f.left <= 0) {
		// First of all: is there somebody at the bank? A frog that lets a hand reach it is a garden
		// ornament. The nearer they stand the surer the plunge, and beyond a couple of paces a frog will
		// sit and be looked at.
		const near = f.pond && f.pond.visitor ? f.pond.visitor() : null;
		if (near && f.pond.middle) {
			const reach = Math.hypot(near.x - f.x, near.z - f.z);
			if (!f.bold && reach < 3.2 && f.rand() < (reach < 1.5 ? 0.85 : 0.45)) {
				// Straight for the middle of the water — the same line it sits looking away from, and the
				// snout is turned to it at once, since a frog that turns its head while diving is a frog
				// that has changed its mind in the air.
				const yaw = Math.atan2(f.pond.middle.x - f.x, f.pond.middle.z - f.z);
				const go = 0.4 + f.rand() * 0.4;
				f.facing = yaw;
				f.turnTo = 0;
				f.root.rotation.y = yaw;
				f.from = { x: f.x, z: f.z, top: f.y };
				f.to = { x: f.x + Math.sin(yaw) * go, z: f.z + Math.cos(yaw) * go, top: f.pond.waterY - 0.03 };
				f.state = "dive";
				f.dive = 0;
				return;
			}
		}
		const throw_ = f.rand();
		if (throw_ < 0.3 && f.neighbours.length > 1) {
			// One of the stones within a hop of this one — see `neighbours` where the animal is built:
			// a frog that hops from one side of the pond to the other is a frog thrown by a child.
			let pick = f.perch;
			for (let tries = 0; tries < 6 && pick === f.perch; tries++) {
				pick = f.neighbours[Math.floor(f.rand() * f.neighbours.length)];
			}
			if (pick !== f.perch) {
				f.from = { x: f.x, z: f.z, top: f.y };
				f.to = pick;
				f.state = "hop";
				f.hop = 0;
				f.left = HOP;
				return;
			}
		}
		if (throw_ < 0.62) {
			f.state = "croak";
			f.croak = 0;
			f.left = 0.45 + f.rand() * 0.5;
			// And the sound of it, once per croak and not on every frame. Only after dark: the master asked
			// for a night that can be heard, and a frog bellowing at noon over a garden full of butterflies is a
			// different garden from this one. The pitch of it is chosen by the animal's own size inside
			// `src/sound.js`, so a big frog on a near stone is a deep one and the small one across the water is
			// a squeak, which is the whole of what makes a chorus instead of a machine.
			if (f.sound && f.isNight && f.isNight()) {
				f.sound.play("frog", { x: f.x, y: f.y + f.long * 0.3, z: f.z }, f.bold ? 1 : 0.7);
			}
		} else {
			f.state = "sit";
			f.left = 1.2 + f.rand() * 4.2;
			// A frog turns its head to look at whatever it heard, and then forgets about it.
			f.turnTo = (f.rand() - 0.5) * 0.9;
		}
	}

	if (f.state === "hop") {
		// A flat arc from the crown of one stone to the crown of the next, with the legs thrown out at
		// the top of it. The clock is the creature's own, and the hop ends exactly where it started to
		// land, so a stopped clock leaves the frog on a stone and not in the air.
		f.hop = Math.min(1, f.hop + delta / HOP);
		const u = f.hop;
		f.x = f.from.x + (f.to.x - f.from.x) * u;
		f.z = f.from.z + (f.to.z - f.from.z) * u;
		f.y = f.from.top + (f.to.top - f.from.top) * u + Math.sin(u * Math.PI) * f.long * 0.75;
		if (u >= 1) {
			f.state = "sit";
			f.perch = f.to;
			f.left = 1.4 + f.rand() * 3.6;
		}
	} else {
		f.x = f.to.x;
		f.z = f.to.z;
		f.y = f.to.top;
	}

	const breath = Math.sin(time * 2.1 + f.phase);
	const swell = f.state === "croak" ? Math.min(1, f.croak * 5) * (0.6 + 0.4 * Math.sin(time * 34)) : 0;
	if (f.state === "croak") f.croak += delta;
	f.root.position.set(f.x, f.y + (f.state === "hop" ? 0 : breath * 0.0008), f.z);
	// The body: a little taller on the breath, and thrown back at the throat when it croaks.
	f.body.scaling.y = 1 + breath * 0.02 + swell * 0.05;
	f.body.scaling.x = 1 - breath * 0.012;
	f.throat.scaling.set(1 + swell * 0.85 + breath * 0.04, 1 + swell * 1.5 + breath * 0.05, 1 + swell * 0.6);
	const lean = f.state === "croak" ? -0.16 * Math.min(1, f.croak * 4) : 0;
	f.root.rotation.x = lean + (f.state === "hop" ? Math.sin(f.hop * Math.PI) * 0.18 : 0);
	if (f.turnTo !== undefined) {
		// The head turn is the body's, since a frog has no neck: it rotates the whole animal about a
		// quarter of a radian and leaves it there.
		const want = f.facing + f.turnTo;
		f.root.rotation.y += (want - f.root.rotation.y) * Math.min(1, delta * 2.2);
	}
	// The legs. On the ground they are folded and still; in the air they stay folded and only
	// straighten towards the landing, because a frog seen at the top of a hop with its legs thrown
	// out is a green sprout and not an animal — which is exactly what the first version of this
	// came out as in pictures/s80-frog-first-c.png.
	const landing = f.state === "hop" ? Math.max(0, f.hop - 0.6) / 0.4 : 0;
	for (let i = 0; i < f.fronts.length; i++) {
		f.fronts[i].rotation.z = (i === 0 ? 1 : -1) * (0.06 + landing * 0.3);
	}
	for (const b of f.backs) {
		b.hip.rotation.x = -landing * 0.34;
		b.knee.rotation.x = landing * 0.5;
	}
	// The eyes sink when a frog swallows, and it swallows when it croaks: the one animal habit that costs
	// nothing and says the thing is alive.
	for (const eye of f.eyes) eye.position.y = f.eyeY * (f.state === "croak" ? 0.86 : 1);
}
