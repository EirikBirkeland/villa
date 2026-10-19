// One yellow toy duck, floating in the pool.
//
// Why it is here: the master asked for it, and it is a better addition than it sounds. The pool has
// mosaic, water, caustics, a wet strip at the coping and a lamp in the wall, and every one of those is
// architecture — nothing in the water belonged to anybody. A rubber duck is the one object that says a
// person has been here this morning and left in a hurry: it is a child's thing, it is the loudest colour
// a toy man makes, and against cyan tile and cyan water it needs no help at all to be seen.
//
// ONE duck, not three. A pair would be a matching set from a shop and three would be a decoration; one is
// a thing somebody owns.
//
// HOW IT FLOATS. A toy duck is a hollow moulding about a hand long, and it sits high: a body of that shape
// with air in it rides with something under half its height under the waterline, so the body's own middle
// is a little ABOVE the surface and not at it. It bobs with what passes over the water, it rolls a degree
// or two as it bobs, and it turns slowly and drifts within a metre of where it was left, because a breeze
// moves it and nothing else does. The drift is two slow sines of different periods rather than a walk, so
// it never makes a lap of the pool like a clock hand and never reaches the coping to rub its cheek on the
// tile.
//
// The water's own surface here is a shader (a moving bump and a mirror, `src/water.js`) and not a sheet
// that goes up and down, so there is nothing for the duck to sit ON; the bob is its own small sine, of the
// same order as the chop the bump paints.

import { sphere, cylinder } from "./mesh.js";

const { TransformNode } = BABYLON;

/**
 * The duck. `pool` is the pool's own plan — where the water lies and how far the walls are — so the duck
 * can be set down on the surface and kept inside the walls.
 */
export function buildDuck(scene, mats, pool, { x = -1.9, z = 4.6, seed = 7, shadows = null } = {}) {
	const root = new TransformNode("duck", scene);
	const waterY = pool.waterY;

	// The body rides with its middle above the waterline: the toy is a hollow shell and it floats high.
	// `py` is measured from the water's surface, which is what the root sits on, so the whole animal can be
	// bobbed by moving the root and nothing inside it has to know.
	sphere(scene, "duckBody", {
		diameterX: 0.115, diameterY: 0.1, diameterZ: 0.19, segments: 10,
		py: 0.012, mat: mats.duck, parent: root,
	});
	// The chest: fuller than the tail, and set forward, so the silhouette off the water is a duck and not
	// a potato. Two overlapping ellipses is the cheapest way to get a shape that tapers.
	sphere(scene, "duckChest", {
		diameterX: 0.108, diameterY: 0.096, diameterZ: 0.116, segments: 10,
		pz: 0.038, py: 0.014, mat: mats.duck, parent: root,
	});
	// The tail: a stub lifted at the back. A moulded duck's tail is a point, and a point is what makes the
	// silhouette read from behind — but it must be a POINT and not a second head, which is what the first
	// one was in the picture: too fat and too high, so from the far coping the duck had two bumps on it.
	const tail = sphere(scene, "duckTail", {
		diameterX: 0.05, diameterY: 0.05, diameterZ: 0.075, segments: 8,
		pz: -0.078, py: 0.03, mat: mats.duck, parent: root,
	});
	tail.rotation.x = 0.38;
	// The head, and the beak: a toy duck's head is a ball on the neck's place and its beak a short cone.
	// Both are big for the body because a toy is drawn, not modelled, and a drawn duck has a big head.
	// The head is lifted clear of the back so there is a neck between them: sunk into the shoulder it read
	// as one continuous loaf from the start camera.
	sphere(scene, "duckHead", {
		diameter: 0.082, segments: 10,
		pz: 0.066, py: 0.09, mat: mats.duck, parent: root,
	});
	const beak = cylinder(scene, "duckBeak", {
		diameter: 0.042, diameterTop: 0.008, height: 0.05, tessellation: 8,
		pz: 0.115, py: 0.086, rx: Math.PI / 2, mat: mats.duckBeak, parent: root,
	});
	beak.receiveShadows = false;
	// The eyes: two beads. At the distance the pool is looked at from these are a fraction of a pixel, and
	// they stay because a duck with no eyes is a chess piece the moment anybody walks up to the coping.
	for (const side of [1, -1]) {
		sphere(scene, `duckEye${side}`, {
			diameter: 0.014, segments: 6,
			px: side * 0.033, py: 0.104, pz: 0.09, mat: mats.koiEye, parent: root,
		});
	}

	const rand = (n) => {
		let a = (seed * 7919 + n) >>> 0;
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	// How far the duck is from the walls, so a big pool cannot be crossed by a three-cm toy in one gust,
	// and so it cannot be blown into a corner.
	const room = Math.min(0.7, (pool.x1 - pool.x0) * 0.12);
	const home = { x, z };
	const phase = rand(1) * 6.2;
	const turn = 0.06 + rand(2) * 0.05;

	if (shadows) for (const m of root.getChildMeshes()) shadows.addShadowCaster(m);
	root.position.set(home.x, waterY, home.z);

	return {
		root,
		/**
		 * Bob, roll, turn and drift. `time` is the Villa's own clock in seconds.
		 */
		animate(time) {
			const t = time + phase;
			// Two sines that share no period, so the drift never repeats within a visitor's look: a gust
			// holds, then lets go, then holds somewhere else.
			root.position.x = home.x + Math.sin(t * 0.13) * room + Math.sin(t * 0.041 + 1.7) * room * 0.5;
			root.position.z = home.z + Math.sin(t * 0.097 + 0.8) * room * 0.9 + Math.sin(t * 0.033) * room * 0.4;
			// Held inside the pool, whatever the wind wanted.
			root.position.x = Math.min(pool.x1 - 0.25, Math.max(pool.x0 + 0.25, root.position.x));
			root.position.z = Math.min(pool.z1 - 0.25, Math.max(pool.z0 + 0.25, root.position.z));
			// The bob is small — the chop this water paints is centimetres — and the roll follows it a
			// beat late, which is what a light thing on water does.
			root.position.y = waterY + Math.sin(t * 1.25) * 0.009 + Math.sin(t * 0.7 + 2.1) * 0.005;
			root.rotation.z = Math.sin(t * 1.25 + 0.7) * 0.07;
			root.rotation.x = Math.sin(t * 0.9 + 1.2) * 0.045;
			root.rotation.y = Math.sin(t * turn * 6.283) * 0.7 + Math.sin(t * 0.021) * 0.5;
		},
	};
}
