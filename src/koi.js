// The Villa's koi: four of them in the pond, under the surface, where a visitor on the bank can see them.
//
// Why they are here: the pond had water, stones, lilies and frogs, and a visitor who walked to the bank
// found a picture of a pond rather than a pond in it. The frogs sit and croak and dive when you frighten
// them, which is a frog's whole part; nothing in the water moved of its own accord. A koi is the one
// creature that makes a garden's water belong to somebody: it is the animal that swims up to the boot.
//
// THE SAME RULE THE OTHER LIVING THINGS LIVE BY: a creature has to be FOUND (`src/creatures.js` puts it at
// length). For a fish that is harder than it sounds, because a koi under a sheet of water is hidden by the
// very thing it swims in: `src/water.js` lets the eye through the surface where it looks down and mirrors
// the sky where it grazes, so the far half of any basin is a mirror and the fish in it are not. Three
// things follow, and they are the whole design below:
//
//   SHALLOW    they cruise with their backs 2-10 cm under the surface, which is the depth a koi actually
//              keeps in a basin this shallow (half a metre of water, `FLOOR_Y` in src/pond.js, and a
//              winter's shade under that) and the depth the near half of the pond is transparent at. And
//              about one spell in four they come with the back ABOVE the surface line, which is the whole
//              of the difference between a fish seen and a fish believed in: `tools/where.js` counts 2-6
//              pixels for a back 3 mm under the mirror and 170-330 for one 1 cm above it.
//   COME TO YOU   they steer for wherever the visitor is standing — not at them, but under the bank beside
//              them, which is where a pond fish goes when it has learned what a person is for. Three of the
//              four are bold about it; the fourth is timid and drops deep instead, so the basin has a shy
//              one in it and a visitor who frightens one fish will still see the other three.
//   LEAVE A MARK a koi rolling at the surface pushes a swell out from its back, and the swell is seen
//              before the fish is: it is the thing that turns a visitor's head round to the right bit of
//              water. That is `pond.splash` with a wide, faint, slow shape — see src/pond.js.
//
// HOW THE BODY IS BUILT. A loft: rings of eleven stations round the fish, twenty-one rings along it, with
// the girth read off three tables (flank, back, belly) at each place along the length. It is split into
// three meshes — shoulders, midsection, tailstock — each parented to the one in front of it and each given
// its own share of one travelling sideways wave, because a fish swims by passing a bend backwards down its
// own body and a single rigid mesh can only ever be dragged along like a stick. The wave's amplitude grows
// backwards and its phase is late behind, which is what makes the bend travel. Then a caudal fin on a hinge
// of its own at the end, a small dorsal sail, two pectoral paddles that row, and two beads for eyes.
//
// All of it is small in the frame on purpose: a fish of half a metre five metres off, under water, is a
// bright bolt with a fan on the end, and the moving is what sells it. `node tools/where.js --view -15.6,1.62,17.4,-2.11,0.14`
// counts the pixels each one actually paints from the bank, and names the moments it is edge-on.

import { sphere } from "./mesh.js";
import { along, loft, fin } from "./loft.js";
import { randomGenerator } from "./noise.js";

const { TransformNode } = BABYLON;

/**
 * Who is in the basin: how long nose to tail-tip, which skin it wears, how fast it likes to go, and how
 * little it minds a person at the edge (`bold`: 1 is a fish that swims the bank for crumbs, 0 is one that
 * sees your boot and goes down in the mud). Half a metre down from the biggest to 34 cm from the smallest:
 * a good koi is measured by the span of a person's arm, and a basin this size should not be stocking
 * goldfish. They were 26-40 cm at first, and a browser showed what that means at the bank — too small to
 * read as a fish at all.
 */
const KOI = [
	{ long: 0.52, mat: "koiKohaku", speed: 0.13, bold: 1.0, seed: 11 },
	{ long: 0.46, mat: "koiLacery", speed: 0.15, bold: 0.8, seed: 23 },
	{ long: 0.42, mat: "koiGold", speed: 0.17, bold: 0.7, seed: 37 },
	// The small one and the shy one: it spends most of its time under the far rim, and it is the fish that
	// makes a visitor wait and watch rather than look and be done.
	{ long: 0.34, mat: "koiPearl", speed: 0.2, bold: 0.2, seed: 51 },
];

// The loft: how many rings along the fish and how many stations round it. Twenty-one rings is one every
// 2 cm of a 40 cm fish — enough that a bent fish is not a bent hexagon — and eleven round is enough for an
// oval with no flat in it while staying cheap enough for four fish.
const RINGS = 20;
const GIRTH = 11;

// The girth tables. `t` runs from the tail tip (0) to the snout (1). FLANK is how far the side stands out
// as a fraction of the fish's full width — so half of it is half the fish across — and DORSAL and BELLY
// are how far the back rises and the belly hangs, as fractions of the full depth. A carp is deepest about
// where the dorsal begins and comes to a stalk behind that: the tail is a paddle on a handle, not a
// continuation of the loaf, and the handle is what the tail beats.
const FLANK = [
	[0, 0.05], [0.1, 0.13], [0.24, 0.32], [0.4, 0.47], [0.56, 0.5], [0.7, 0.44], [0.82, 0.34], [0.92, 0.17], [1, 0.04],
];
const DORSAL = [
	[0, 0.05], [0.12, 0.24], [0.3, 0.42], [0.46, 0.5], [0.62, 0.47], [0.76, 0.38], [0.88, 0.22], [1, 0.05],
];
const BELLY = [
	[0, 0.05], [0.12, 0.28], [0.3, 0.45], [0.46, 0.5], [0.62, 0.46], [0.76, 0.36], [0.88, 0.2], [1, 0.04],
];


/**
 * One koi.
 *
 * The frame is a chain of four nodes — shoulders, midsection, tailstock, caudal fin — each a child of the
 * one ahead of it, so a small turn of each adds up along the body into a bend that runs backwards. That is
 * a fish swimming; a node dragged along a curve is a fish being towed.
 */
function makeKoi(scene, mats, { tag, spec, pond }) {
	const long = spec.long;
	// A carp's proportions, all of them off the one measure: about a quarter of its length across the flanks
	// and just under a third deep. The first pass had 0.30 and 0.34 and a browser said what that was — a fat
	// grub with a sail on the end, and no head to speak of (`pictures/tmp-koi-big.png`). What a koi seen
	// from above actually is: a long bolt that swells behind the pectorals and comes to a stalk behind.
	const wide = long * 0.24;
	const deep = long * 0.3;
	const n = (what) => `koi${tag}${what}`;
	const mat = mats[spec.mat];

	const root = new TransformNode(`koi${tag}`, scene);
	// The body is cut at 60% and 30% of its own length from the tail: the fore part is head and shoulders
	// and barely bends, the midsection does the work, the tailstock is a whip.
	const fore = new TransformNode(n("Fore"), scene);
	fore.parent = root;
	const mid = new TransformNode(n("Mid"), scene);
	mid.parent = fore;
	mid.position.z = (0.3 - 0.6) * long;
	const rear = new TransformNode(n("Rear"), scene);
	rear.parent = mid;
	rear.position.z = (0 - 0.3) * long;

	// The three lofts run a little past the bend each one is hung from, so they overlap: two tubes meeting
	// at an angle leave a notch in each other, and the notch is right where the fish bends most. Overlapping
	// costs a few triangles and hides the join however the segments are turned.
	loft(scene, n("Fore"), mat, { long, wide, deep, from: 0.56, to: 1, rings: RINGS, girth: GIRTH, flank: FLANK, dorsal: DORSAL, belly: BELLY }).parent = fore;
	loft(scene, n("Mid"), mat, { long, wide, deep, from: 0.28, to: 0.64, rings: RINGS, girth: GIRTH, flank: FLANK, dorsal: DORSAL, belly: BELLY }).parent = mid;
	loft(scene, n("Rear"), mat, { long, wide, deep, from: 0, to: 0.34, rings: RINGS, girth: GIRTH, flank: FLANK, dorsal: DORSAL, belly: BELLY }).parent = rear;

	// The caudal fin: a forked fan on the stalk, its two lobes swept back. It is set on a node of its own
	// at the tail tip so `swim` can swing it further than the body can go without tearing the loft.
	const tailNode = new TransformNode(n("Tail"), scene);
	tailNode.parent = rear;
	fin(scene, n("TailFin"), mats.koiFin, [
		{ a: [0, deep * 0.05], b: [0, -deep * 0.05] },
		{ a: [-long * 0.08, deep * 0.13], b: [-long * 0.08, -deep * 0.13] },
		{ a: [-long * 0.17, deep * 0.26], b: [-long * 0.17, -deep * 0.26] },
		{ a: [-long * 0.24, deep * 0.32], b: [-long * 0.24, -deep * 0.32] },
	]);

	// The dorsal: a small sail set well back — a carp's dorsal is short and stands over the midsection, and
	// a long one along the back is a different fish entirely. Its bottom edge is sunk a little into the back
	// so no gap shows where the two meet, whichever way the fish bends.
	const z = (t) => (t - 0.6) * long;
	fin(scene, n("Dorsal"), mats.koiFin, [
		{ a: [z(0.62), deep * 0.01], b: [z(0.62), -deep * 0.08] },
		{ a: [z(0.69), deep * 0.07], b: [z(0.69), -deep * 0.08] },
		{ a: [z(0.77), deep * 0.075], b: [z(0.77), -deep * 0.08] },
		{ a: [z(0.84), deep * 0.04], b: [z(0.84), -deep * 0.08] },
	]).parent = fore;

	// The pectorals: a paddle behind each gill, laid back against the flank rather than stuck out: a koi
	// cruising holds them close and only spreads them to steer and to hold a place. Stuck out at half a
	// right angle they read as arms, which is the last thing a fish wants.
	const pects = [];
	for (const side of [1, -1]) {
		const node = new TransformNode(n(`Pec${side}`), scene);
		node.parent = fore;
		node.position.set(side * along(FLANK, 0.72) * wide * 0.8, -deep * 0.14, z(0.72));
		node.rotation.z = side * 1.15;
		node.rotation.y = side * 0.5;
		fin(scene, n(`PecFin${side}`), mats.koiFin, [
			{ a: [long * 0.04, 0], b: [-long * 0.02, 0] },
			{ a: [0.0, wide * 0.11], b: [-long * 0.05, wide * 0.1] },
			{ a: [-long * 0.03, wide * 0.15], b: [-long * 0.07, wide * 0.11], },
		], "x").parent = node;
		pects.push({ node, side });
	}

	// The eyes: two beads low and wide on the head, just proud of the flank so a fish coming at you has two
	// dark marks and not none. Low and wide matters: set high on the crown they catch the sky and come back
	// as two bright coins, and a browser showed what that reads as — a mask with holes in it, not a fish
	// (`pictures/tmp-wedge.png`). A carp's eye sits low, behind the gill and about level with the corner of
	// its mouth, and at this size it is a bead whatever way it is made, so it is modelled rather than painted.
	for (const side of [1, -1]) {
		sphere(scene, n(`Eye${side}`), {
			diameter: long * 0.04, segments: 6,
			px: side * along(FLANK, 0.84) * wide * 0.95, py: -deep * 0.06, pz: z(0.84),
			mat: mats.koiEye, parent: fore, tile: 0.01,
		});
	}

	const rand = randomGenerator(spec.seed);
	return {
		root,
		fore,
		mid,
		rear,
		tailNode,
		pects,
		long,
		wide,
		deep,
		rand,
		pond,
		spec,
		// Where it is and where it means to get to, in metres of the basin; `depth` is how far its BACK
		// sits under the surface, which is the only depth that matters to anything looking in from above.
		x: pond.plan.cx + (rand() - 0.5) * 2,
		z: pond.plan.cz + (rand() - 0.5) * 1.4,
		yaw: rand() * Math.PI * 2,
		target: { x: pond.plan.cx, z: pond.plan.cz },
		depth: 0.06 + rand() * 0.06,
		wantDepth: 0.08,
		speed: spec.speed,
		going: spec.speed,
		state: "cruise",
		left: rand() * 3,
		phase: rand() * 6,
		turn: 0,
		wakeLeft: rand(),
	};
}

/**
 * Builds the four of them and hands back `animate`, in the shape `main.js` uses for everything alive.
 *
 * `pond` is the pond's own plan (its rectangle, the surface height, the floor), where its middle is, how
 * to mark a swell on the surface, and where the visitor stands — the same four things the frogs are given
 * in src/creatures.js, and for the same reason: a fish that does not know where the water is will swim out
 * into the lawn.
 */
export function buildKoi(scene, mats, pond) {
	const fish = KOI.map((spec, i) => makeKoi(scene, mats, { tag: i + 1, spec, pond }));
	return {
		koi: fish,
		animate(time, delta) {
			for (const k of fish) swim(k, time, delta);
		},
	};
}

/** How far inside the basin a fish may go: the rim stones lean over the water and a fish nosing one of
 * them looks stuck rather than curious. */
const MARGIN = 0.42;

/** A place inside the basin, and `at` metres away from its walls. */
function inside(pond, x, z, at = MARGIN) {
	const p = pond.plan;
	return {
		x: Math.min(p.x1 - at, Math.max(p.x0 + at, x)),
		z: Math.min(p.z1 - at, Math.max(p.z0 + at, z)),
	};
}

/**
 * What a koi does: choose somewhere, steer there, bend as it goes, and leave a swell where it rolls.
 *
 * The choosing is what makes it a koi and not a clock hand along an ellipse. It goes where the visitor is
 * standing — that is the whole joke of a pond fish, and it is also how the animal gets in front of a
 * camera — it rests in the middle of the water with its tail going slowly, and the shy one drops for the far
 * rim when a person comes close. The steering is rate-limited, so a fish that changes its mind turns in an
 * arc, leans into it, and takes a second about it.
 */
function swim(k, time, delta) {
	const p = k.pond.plan;
	const visitor = k.pond.visitor ? k.pond.visitor() : null;
	const near = visitor ? Math.hypot(visitor.x - k.x, visitor.z - k.z) : Infinity;

	k.left -= delta;
	if (k.left <= 0) {
		const throw_ = k.rand();
		if (near < 1.4 && k.spec.bold < 0.5 && throw_ < 0.6) {
			// Frightened: away from the boot, and down into the dark under the far rim, where a fish goes
			// when it has decided. It comes back out on its own; a pond you can empty by walking near it is
			// a pond with nothing in it.
			const away = Math.atan2(k.x - visitor.x, k.z - visitor.z);
			k.target = inside(k.pond, k.x + Math.sin(away) * 1.6, k.z + Math.cos(away) * 1.6);
			k.wantDepth = 0.2 + k.rand() * 0.07;
			k.going = k.spec.speed * 2.6;
			k.state = "bolt";
			k.left = 1.1 + k.rand() * 1.4;
		} else if (near < 7 && throw_ < 0.4 + k.spec.bold * 0.45) {
			// Crumbs. It goes and sits under the bank beside the person and pushes its back up through the
			// surface film, which is what a pond fish does when it has learned what a person is for — and it
			// is also the one thing that makes it SEEABLE from a bank: `src/water.js` gives the sheet back to
			// the sky wherever the eye grazes it, so a fish an inch under a mirror is a fish nobody sees, and
			// a fish with a bright hump of back above the water is seen from the far side of the garden.
			// Seven metres, because the standing place on the south bank is five from the middle of this basin
			// and a koi does not need to be able to read a tape measure to come and see who is there.
			k.target = inside(k.pond, visitor.x + (k.rand() - 0.5) * 0.9, visitor.z + (k.rand() - 0.5) * 0.9, 1);
			// Mostly with the back clean OUT of the water — a centimetre of bright carp above the surface line.
			// Measured at the standing place on the bank with `tools/where.js`, and the measure is steep: a back
			// 3 mm above the line paints 2-6 pixels of a 1280 by 720 frame and might as well not exist, and one
			// 10 mm above paints 170-330, which is a fish somebody points at. Everywhere the eye grazes a sheet
			// of water it is a mirror (`src/water.js`), so under the mirror is where a koi goes to be not seen,
			// and above it is where a koi is worth having.
			k.wantDepth = -0.011 + k.rand() * 0.009;
			k.going = k.spec.speed * 0.6;
			k.state = "forage";
			k.left = 2.6 + k.rand() * 4;
		} else if (throw_ < 0.78) {
			k.target = inside(k.pond, p.cx + (k.rand() - 0.5) * (p.x1 - p.x0 - 1), p.cz + (k.rand() - 0.5) * (p.z1 - p.z0 - 1));
			// Half a metre of water, and a basin shaded by palms: a koi in this is mostly up near the top
			// where the light and the warmth are, and down only when it has been frightened. And one crossing
			// in six rolls at the surface on the way, because that is what fish do and because it is the one
			// sign in the middle of the water that something is alive in it.
			k.wantDepth = k.rand() < 0.25 ? -0.009 : 0.02 + k.rand() * 0.08;
			k.going = k.spec.speed * (0.7 + k.rand() * 0.6);
			k.state = "cruise";
			k.left = 2.5 + k.rand() * 4.5;
		} else {
			// Resting: not stopped — a fish with its tail still is a fish on its side — but holding a place
			// in the middle with small moves and a slow beat.
			k.target = inside(k.pond, k.x + (k.rand() - 0.5) * 0.5, k.z + (k.rand() - 0.5) * 0.5);
			k.wantDepth = k.rand() < 0.2 ? -0.009 : 0.06 + k.rand() * 0.1;
			k.going = k.spec.speed * 0.3;
			k.state = "rest";
			k.left = 1.8 + k.rand() * 3.5;
		}
	}

	// Steer: turn towards the place it means to reach, at a rate, and then go. The limit is the whole
	// difference between an animal with intentions and a sprite following a path.
	const dx = k.target.x - k.x;
	const dz = k.target.z - k.z;
	const gap = Math.hypot(dx, dz);
	let turn = 0;
	if (gap > 0.03) {
		let want = Math.atan2(dx, dz);
		let diff = want - k.yaw;
		while (diff > Math.PI) diff -= Math.PI * 2;
		while (diff < -Math.PI) diff += Math.PI * 2;
		const rate = k.state === "bolt" ? 2.6 : 1.1;
		turn = Math.max(-rate * delta, Math.min(rate * delta, diff));
		k.yaw += turn;
	}
	// Ease the speed too: a fish does not leave a stop at full pace, and the beat rate follows the speed.
	k.speed += (k.going - k.speed) * Math.min(1, delta * 1.8);
	k.x += Math.sin(k.yaw) * k.speed * delta;
	k.z += Math.cos(k.yaw) * k.speed * delta;
	// And the wall, whatever the steering wanted: held inside, and pointed back at the middle so it does not
	// grind along the stones.
	const wasInside = k.x > p.x0 + MARGIN && k.x < p.x1 - MARGIN && k.z > p.z0 + MARGIN && k.z < p.z1 - MARGIN;
	const held = inside(k.pond, k.x, k.z);
	if (!wasInside) {
		k.x = held.x;
		k.z = held.z;
		k.yaw = Math.atan2(p.cx - k.x, p.cz - k.z);
		k.target = inside(k.pond, p.cx + (k.rand() - 0.5) * 1.2, p.cz + (k.rand() - 0.5) * 0.8);
	}
	if (k.state === "bolt" && k.left <= 0) k.state = "cruise";

	// Depth, eased: the animal has to be persuaded down and it has to be persuaded up, and a fish that
	// changes depth in one frame is a lift.
	k.depth += (k.wantDepth - k.depth) * Math.min(1, delta * 1.4);
	// Between a back a centimetre and a half above the surface and a fish three tenths down near the floor.
	// The first is a koi rolling at a feeding place and the second is one that has decided it does not like
	// the look of you; in between is everything a koi normally does.
	k.depth = Math.min(0.3, Math.max(-0.02, k.depth));
	// The frame sits where the back is `depth` under the surface, so what a person looking in sees is a fish
	// of the right size at the right depth and not one hanging from the surface by its dorsal fin.
	const y = p.waterY - k.depth - k.deep * 0.5;

	k.root.position.set(k.x, y, k.z);
	k.root.rotation.y = k.yaw;
	// It rolls over into a turn the way a cyclist does, and its nose comes down to go down. Both small: a
	// fish that rolls a third of a turn is a fish that is dying.
	k.root.rotation.z = Math.max(-0.3, Math.min(0.3, -turn * 26));
	k.root.rotation.x = Math.max(-0.22, Math.min(0.22, (k.wantDepth - k.depth) * 0.4 + (k.speed - k.spec.speed) * 0.05));

	// The bend that runs backwards down the body. Four nodes, the wave late behind and bigger behind, and
	// the whole thing driven by a phase that advances with the speed rather than with the clock — so a fish
	// going quickly beats its tail quickly and a resting one is barely moving, without a single number
	// being switched anywhere.
	k.phase += delta * (1.1 + k.speed * 5.5) * Math.PI * 2;
	const amp = 0.55 + Math.min(1, k.speed * 4) * 0.5;
	k.fore.rotation.y = 0.045 * amp * Math.sin(k.phase);
	k.mid.rotation.y = 0.11 * amp * Math.sin(k.phase - 0.9);
	k.rear.rotation.y = 0.2 * amp * Math.sin(k.phase - 1.9);
	k.tailNode.rotation.y = 0.34 * amp * Math.sin(k.phase - 2.8);
	for (const { node, side } of k.pects) {
		// The pectorals row: not in time with the tail, at about a third of its rate, because they are for
		// going slow and for holding a place rather than for going anywhere. They stay near the flank.
		node.rotation.z = side * (1.15 + 0.14 * Math.sin(k.phase * 0.34 + side));
	}

	// The swell. Only when the back is really near the surface and the animal is really moving, and no more
	// than about twice a second, because the basin has six rings in it to spend and a fish that stamps a
	// ring every frame is a fountain.
	// The swell. Only when the back is really through the surface film and the animal is really moving, and
	// no more than about once a second: the basin has six rings in it to spend, and a fish that stamps a ring
	// every frame is a fountain. Kept BIG and faint on purpose — the frog's ring is a bright hoop two spans
	// across, and hooped repeatedly that is what a pond looks like it has been seeded with grubs.
	k.wakeLeft -= delta;
	if (k.depth < 0.004 && k.speed > 0.04 && k.wakeLeft <= 0) {
		k.wakeLeft = 0.9 + k.rand() * 0.8;
		if (k.pond.splash) {
			// Wide, faint and slow: a swell, not a splash. See `splash` in src/pond.js.
			k.pond.splash(k.x, k.z, { across: 0.3, span: 0.9, show: 0.09, life: 2.4 });
		}
	}
}
