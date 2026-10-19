// Things people use: loungers by the water, a low table in the sala, and the platter
// that goes with it. Nothing in the pool, mind you — the platter stays poolside.

import { box, cylinder, sphere, plane, blocker } from "./mesh.js";
import { makePottedPlant, SHRUB_CLIP } from "./garden.js";

const { Vector3, Color3 } = BABYLON;

/** A sunbed: teak frame, a thick pale cushion, tilted at the back. `y` is the ground it stands on. */
function makeLounger(scene, mats, { x, z, ry = 0, y = 0 }) {
	const root = new BABYLON.TransformNode("lounger", scene);
	root.position.set(x, y, z);
	root.rotation.y = ry;
	const parts = [];
	// The frame in rails and legs, and not a plank on three boards. What the browser showed before was a
	// teak plinth: the deck was one slab 0.8 m across, and the legs were boards 0.74 m wide standing at
	// either end, so from the foot of the bed the near board filled the whole width and there was no
	// daylight anywhere under a sunbed — which is the one thing a sunbed is. Two rails the pad lies
	// across, three slats under it, and four square legs at the corners, so you can see the paving
	// between the legs, and a shadow falls under the bed where the bed is not.
	for (const px of [-0.33, 0.33]) {
		const rail = box(scene, `loungerRail${px}`, { x: 0.09, y: 0.08, z: 2, px, py: 0.35, mat: mats.wood, parent: root });
		rail.receiveShadows = true;
		parts.push(rail);
	}
	for (const pz of [-0.7, 0, 0.7]) {
		parts.push(box(scene, `loungerSlat${pz}`, { x: 0.72, y: 0.05, z: 0.09, py: 0.31, pz, mat: mats.wood, parent: root }));
	}
	for (const px of [-0.33, 0.33]) {
		for (const pz of [-0.86, 0.86]) {
			parts.push(box(scene, `loungerLeg${px}_${pz}`, { x: 0.07, y: 0.3, z: 0.07, px, py: 0.15, pz, mat: mats.wood, parent: root }));
		}
	}
	// The pad is 20 cm narrower than the frame it lies on. It used to be 6 cm narrower, and a browser
	// showed what that leaves: a slab of canvas with no teak either side of it and the same hard edge top
	// and bottom — a concrete block with legs. Give the frame a band of its own and the pad reads as a pad
	// laid ON a bed.
	// ONE pad, sixteen centimetres thick, and no second leaf on top of it. The two-leaf idea looked clever
	// from the foot of the bed — a piped edge, a hint of softness — and from the side, which is where a
	// person actually sees a sunbed, it came out as a mattress stacked on a mattress: two boards of canvas
	// and a shelf between them (pictures/s83-sunbed-c.png). Thickness on its own, with the quilted channels
	// on it, is what says padded.
	parts.push(box(scene, "loungerCushion", { x: 0.6, y: 0.16, z: 1.86, py: 0.47, pz: -0.04, mat: mats.cushion, parent: root }));
	// The back rest: the head end of the pad, propped. Two failures, both from pictures. First it stood
	// nearly as long as the bed and steeper than a ladder, hung out past the deck with nothing under it, and
	// read as a diving board (pictures/s83-sunbed-c.png). Then it was shortened to what a person actually
	// leans against — and at four metres it read as a SECOND PIECE OF FURNITURE: a grey slab sitting beyond
	// a pale one, because the only thing joining it to the bed was the pad it lay against, and the face of it
	// is in shade while the top of the pad is in sun (pictures/tmp-l5.png). So the back is now built the way
	// a sunbed's back is built: two teak stiles carried up from the side rails, a teak slat across them, and
	// a THIN cushion laid on that — thinner than the seat pad on purpose, so the eye gets a hierarchy (thick
	// mattress, thin cushion) instead of two slabs of the same canvas. The teak is what does the joining: it
	// is the same warm wood as the frame, it shows four centimetres outside the cushion on either side, and
	// it makes the rake read as a thing leaning instead of a thing parked.
	const rake = 0.58; // radians off horizontal: about the angle a person sits up at
	const hingeY = 0.53; // where the back meets the pad, and
	const hingeZ = -0.86; // the head end of the pad
	const cos_ = Math.cos(rake);
	const sin_ = Math.sin(rake);
	for (const px of [-0.34, 0.34]) {
		// From the rail's top to flush with the back's top edge, and no further. At 0.78 long and centred
		// where it was first put, both ends of the stile came through — one under the bed, one past the
		// cushion's top corner — and the back read as a box skewered on two crossed sticks.
		const stile = box(scene, `loungerStile${px}`, {
			x: 0.07, y: 0.06, z: 0.7, px, py: hingeY + cos_ * 0.13, pz: hingeZ - sin_ * 0.13 - 0.06,
			mat: mats.wood, parent: root,
		});
		stile.rotation.x = -rake;
		parts.push(stile);
	}
	// The slat the cushion lies on, wider than the cushion so a band of wood frames it on both faces.
	const slat = box(scene, "loungerBackSlat", {
		x: 0.68, y: 0.05, z: 0.58,
		px: 0, py: hingeY + cos_ * 0.24 - 0.05, pz: hingeZ - sin_ * 0.24 + 0.03,
		mat: mats.wood, parent: root,
	});
	slat.rotation.x = -rake;
	parts.push(slat);
	const back = box(scene, "loungerBack", {
		x: 0.6, y: 0.09, z: 0.56,
		px: 0, py: hingeY + cos_ * 0.27, pz: hingeZ - sin_ * 0.27,
		mat: mats.cushion, parent: root,
	});
	back.rotation.x = -rake;
	parts.push(back);

	// A folded towel across the foot of the bed — two folds, the upper one shorter, so it has a step and a
	// shadow under it. One slab of cloth laid half into the pad is a tile let into a mattress.
	parts.push(box(scene, "towel", { x: 0.46, y: 0.045, z: 0.44, py: 0.575, pz: 0.58, mat: mats.towel, parent: root }));
	parts.push(box(scene, "towelFold", { x: 0.4, y: 0.04, z: 0.3, py: 0.615, pz: 0.5, mat: mats.towel, parent: root }));
	// You walk around a sunbed, not through it.
	blocker(scene, "loungerBlock", { x: 0.8, y: 0.95, z: 2.3, pz: -0.1, parent: root });
	return parts;
}

/** A garden bench: teak slats on iron ends, set in the lawn where the path passes. */
function makeBench(scene, mats, { x, z, ry = 0 }) {
	const root = new BABYLON.TransformNode("bench", scene);
	root.position.set(x, 0, z);
	root.rotation.y = ry;
	const parts = [];
	// the seat, in three slats
	for (const pz of [-0.14, 0, 0.14]) {
		parts.push(box(scene, "benchSeat", { x: 1.7, y: 0.05, z: 0.12, py: 0.44, pz, mat: mats.wood, parent: root }));
	}
	// the back, two slats leaned back: whoever sits here is looking at the pool, not the hedge
	for (const py of [0.62, 0.84]) {
		parts.push(box(scene, "benchBack", { x: 1.6, y: 0.1, z: 0.05, py, pz: 0.26, rx: 0.2, mat: mats.wood, parent: root }));
	}
		for (const px of [-0.74, 0.74]) {
		parts.push(box(scene, "benchLegFront", { x: 0.08, y: 0.44, z: 0.08, px, py: 0.22, pz: -0.16, mat: mats.darkMetal, parent: root }));
		parts.push(box(scene, "benchLegBack", { x: 0.08, y: 0.92, z: 0.08, px, py: 0.46, pz: 0.24, rx: 0.2, mat: mats.darkMetal, parent: root }));
		parts.push(box(scene, "benchArm", { x: 0.09, y: 0.06, z: 0.52, px, py: 0.66, pz: 0.04, mat: mats.wood, parent: root }));
	}
	blocker(scene, "benchBlock", { x: 1.8, y: 0.95, z: 0.8, pz: 0.02, parent: root });
	return parts;
}

/** A small round side table. */
function makeSideTable(scene, mats, { x, z, y = 0 }) {
	blocker(scene, "sideTableBlock", { x: 0.62, y: 0.9, z: 0.62, px: x, pz: z, py: y });
	return [
		cylinder(scene, "tableTop", { diameter: 0.56, height: 0.07, tessellation: 16, px: x, py: y + 0.5, pz: z, mat: mats.wood }),
		cylinder(scene, "tableStem", { diameter: 0.1, height: 0.46, tessellation: 8, px: x, py: y + 0.25, pz: z, mat: mats.darkMetal }),
		cylinder(scene, "tableFoot", { diameter: 0.36, height: 0.04, tessellation: 12, px: x, py: y + 0.05, pz: z, mat: mats.darkMetal }),
	];
}

/**
 * The platter: a board of cheeses with a couple of grapes and a knife, set out
 * poolside where the wind can get at it.
 */
function makePlatter(scene, mats, { x, y, z }) {
	const parts = [];
	parts.push(box(scene, "board", { x: 0.62, y: 0.04, z: 0.4, px: x, py: y, pz: z, mat: mats.wood }));
	// three cheeses: a wedge, a wheel, and a soft round
	const wedge = cylinder(scene, "cheeseWedge", {
		diameter: 0.26,
		height: 0.11,
		tessellation: 3,
		px: x - 0.16,
		py: y + 0.08,
		pz: z - 0.04,
		mat: mats.cheeseGold,
	});
	wedge.rotation.y = 0.7;
	parts.push(wedge);
	parts.push(cylinder(scene, "cheeseWheel", { diameter: 0.2, height: 0.09, tessellation: 16, px: x + 0.13, py: y + 0.07, pz: z - 0.06, mat: mats.cheesePale }));
	parts.push(cylinder(scene, "cheeseRound", { diameter: 0.16, height: 0.06, tessellation: 14, px: x + 0.1, py: y + 0.06, pz: z + 0.11, mat: mats.cheeseBlue }));
	for (let i = 0; i < 5; i++) {
		parts.push(
			sphere(scene, "grape", {
				diameter: 0.05,
				segments: 5,
				px: x + 0.02 + (i % 3) * 0.05 - 0.03,
				py: y + 0.05,
				pz: z - 0.14 + Math.floor(i / 3) * 0.05,
				mat: mats.grape,
			}),
		);
	}
	return parts;
}

/** A low teak armchair for the deck under the eaves. It faces -z: the pool is that way. */
function makeDeckChair(scene, mats, { x, z, y = 0, ry = 0 }) {
	const root = new BABYLON.TransformNode("deckChair", scene);
	root.position.set(x, y, z);
	root.rotation.y = ry;
	const parts = [];
	parts.push(box(scene, "chairSeat", { x: 0.58, y: 0.06, z: 0.55, py: 0.4, mat: mats.wood, parent: root }));
	for (const px of [-0.24, 0.24]) {
		for (const pz of [-0.22, 0.22]) {
			parts.push(box(scene, "chairLeg", { x: 0.07, y: 0.4, z: 0.07, px, py: 0.2, pz, mat: mats.wood, parent: root }));
		}
	}
	// the back, two slats leaned back against the spine of the chair
	for (const py of [0.62, 0.8]) {
		parts.push(box(scene, "chairBack", { x: 0.56, y: 0.1, z: 0.05, py, pz: 0.26, rx: 0.16, mat: mats.wood, parent: root }));
	}
	for (const px of [-0.29, 0.29]) {
		parts.push(box(scene, "chairArm", { x: 0.07, y: 0.05, z: 0.5, px, py: 0.6, pz: 0.05, mat: mats.wood, parent: root }));
		parts.push(box(scene, "chairArmFront", { x: 0.06, y: 0.2, z: 0.06, px, py: 0.5, pz: -0.18, mat: mats.wood, parent: root }));
	}
	parts.push(box(scene, "chairCushion", { x: 0.52, y: 0.09, z: 0.5, py: 0.475, mat: mats.cloth, parent: root }));
	parts.push(box(scene, "chairBackCushion", { x: 0.5, y: 0.34, z: 0.08, py: 0.66, pz: 0.21, rx: 0.16, mat: mats.clothStripe, parent: root }));
	blocker(scene, "deckChairBlock", { x: 0.74, y: 0.95, z: 0.76, pz: 0.02, py: y, parent: root });
	return parts;
}

/** Cushions and a low table inside the sala, laid on the teak floor. */
function makeSalaFurniture(scene, mats, { x, z, floorY }) {
	const parts = [];
	// The table is furniture, not carpentry: it wears the oiled furniture wood and not the wood of the
	// posts and boards it stands on (see `timberCanvas` in src/textures.js for the three woods).
	parts.push(box(scene, "salaTable", { x: 1.5, y: 0.1, z: 0.9, px: x, py: floorY + 0.32, pz: z, mat: mats.wood }));
	for (const dx of [-0.6, 0.6]) {
		for (const dz of [-0.32, 0.32]) {
			parts.push(box(scene, "salaTableLeg", { x: 0.09, y: 0.28, z: 0.09, px: x + dx, py: floorY + 0.14, pz: z + dz, mat: mats.wood }));
		}
	}
	// cushions at either end
	for (const dz of [-0.85, 0.85]) {
		parts.push(box(scene, "salaCushion", { x: 1.1, y: 0.16, z: 0.6, px: x, py: floorY + 0.08, pz: z + dz, mat: mats.cloth }));
		parts.push(box(scene, "salaCushionBack", { x: 1.1, y: 0.14, z: 0.34, px: x, py: floorY + 0.3, pz: z + dz + (dz > 0 ? 0.22 : -0.22), mat: mats.clothStripe }));
	}
	// the platter, on the table, out of the water where it belongs
	parts.push(...makePlatter(scene, mats, { x: x + 0.2, y: floorY + 0.42, z: z - 0.1 }));
	// a coconut with a straw, because it is hot
	parts.push(sphere(scene, "coconut", { diameter: 0.14, segments: 8, px: x - 0.4, py: floorY + 0.44, pz: z + 0.12, mat: mats.pot }));
	parts.push(cylinder(scene, "straw", { diameter: 0.014, height: 0.22, tessellation: 5, px: x - 0.4, py: floorY + 0.56, pz: z + 0.12, rz: 0.25, mat: mats.cloth }));
	// the low table is solid; the cushions beside it are meant to be climbed on
	blocker(scene, "salaTableBlock", { x: 1.62, y: 0.95, z: 1.02, px: x, pz: z, py: floorY });
	return parts;
}

export function buildProps(scene, mats, shadows, { clip = SHRUB_CLIP } = {}) {
	const built = [];
	const add = (...meshes) => {
		for (const mesh of meshes) {
			if (!mesh) continue;
			mesh.receiveShadows = true;
			built.push(mesh);
			shadows.addShadowCaster(mesh);
		}
	};

	// Three loungers on the south side of the pool, facing the water.
	//
	// The row has moved, for three true reasons. It was buried: a sunbed is built to stand at y 0 and the
	// paving it stands on is 0.14 up, so every one of them was sunk to the knee until they were given a `y`.
	// It was crowded: at x -3.4 and -1.4, 2 m apart, with a side table between the lounger at 2.6 and the
	// one at 4.6, the blockers left 1.29 m gaps to thread a person through the middle of the pool's south
	// edge; there are now 1.79 m between the west pair and 1.6 m east of the last sunbed, and 0.63 m of
	// stone between the coping and a sunbed, which is where you would leave one. And they were all bunched
	// in the middle of the paving, under the main sight line from the steps, where a pair out on the free
	// stone at x -11 and -6 has more room and more sun.
	//
	// One lesson, learned the hard way from `tools/feet.js`: the first attempt left a sunbed blocker 5 cm
	// from the place a visitor starts at (2.4, 10.5), and the walk reported 0.0% of the garden reachable,
	// because the visitor started wedged behind a sunbed. The nearest one is 1.6 m off the start now.
	//
	// The west sunbed came in from x = -11.3 when the court's outer edge came in to x = -11.9 (see
	// src/court.js): a sunbed with 0.7 m of stone behind it and grass beyond is a sunbed you cannot walk
	// behind, and it had a kerb at its back.
	add(...makeLounger(scene, mats, { x: -10.9, z: 9.2, y: 0.14, ry: Math.PI }));
	add(...makeLounger(scene, mats, { x: -6.3, z: 9.2, y: 0.14, ry: Math.PI }));
	add(...makeLounger(scene, mats, { x: 4.4, z: 9.2, y: 0.14, ry: Math.PI }));
	add(...makeSideTable(scene, mats, { x: -8.8, z: 9.2, y: 0.14 }));
	add(...makeSideTable(scene, mats, { x: 6.8, z: 9.2, y: 0.14 }));

	// The platter, on the side table between the loungers — out of the water where it belongs, as it
	// always was; it and its table simply moved together, and both went down 14 cm less into the stone.
	add(...makePlatter(scene, mats, { x: 6.8, y: 0.7, z: 9.2 }));
	add(...makeSalaFurniture(scene, mats, { x: 10.6, z: 5.4, floorY: 0.66 }));

	// A bench in the lawn where the path runs out, turned back to face the water.
	add(...makeBench(scene, mats, { x: -4.6, z: 16.6, ry: 0.42 }));

	// Two chairs and a table on the terrace, under the eaves and east of the steps. The deck was
	// sixteen metres of bare teak with four posts on it while the sala had a table and cushions and the
	// pool had three sunbeds: a front that nobody could sit down in. They face the water.
	//
	// They sit in full sun, which took some working out and is worth writing down: at this hour the sun
	// is only 24° up, and a roof edge 4.2 m high throws its shadow 8 m north, past the back of the
	// house — so nothing under the eaves is shaded by the roof at floor level, and the drawing puts the
	// sunlit chair seat at (227,163,105) against the glass behind it at (129,130,123). A chair in the
	// shade of this roof would have to be against the wall behind.
	add(...makeDeckChair(scene, mats, { x: 4.35, z: -2.85, y: 0.54 }));
	add(...makeDeckChair(scene, mats, { x: 6.15, z: -2.85, y: 0.54 }));
	add(...makeSideTable(scene, mats, { x: 5.25, z: -2.85, y: 0.54 }));

	// Two great pots flanking the terrace steps.
	// They are planted now. They stood empty for the whole of the Villa's life while the potted plants a
	// metre either side of them carried clipped shrubs, and an empty pot at a front door reads as a plan
	// nobody finished. They are thrown pots now — foot, belly, neck, rim — and they are not twins: one urn
	// and one ginger jar, a chilli plant in the one and a kumquat in the other, bought when the plant man
	// came round and not in a matched pair from a catalogue.
	[
		{ px: -3.1, seed: 91, shape: "urn", kind: "chilli", size: 1.3 },
		{ px: 3.1, seed: 92, shape: "jar", kind: "kumquat", size: 1.32 },
	].forEach((p) => {
		// On the court's paving at 0.14, not on the terrace: the old pots stood with their bases there and
		// their mouths at 0.94, and a pot that floats four decimetres above the stone is a balloon.
		add(...makePottedPlant(scene, mats, { x: p.px, z: 1.0, y: 0.14, size: p.size, seed: p.seed, shape: p.shape, kind: p.kind, clip }));
		blocker(scene, "bigPotBlock", { x: 0.95, y: 0.95, z: 0.95, px: p.px, pz: 1.0 });
	});

	// A wooden railing where the west paving ends and the lawn begins. It runs the whole of that edge:
	// the paving spans x -11.9 to -5.30 (see src/court.js), so the rail goes from -11.5 to -5.8 and its
	// top board ends over the outer posts. It used to span -15.6 to -7.2, which hung 0.6 m over the grass
	// at one end and stopped 1.75 m short of the paving's corner at the other: a rail that ends in the
	// middle of nothing is a broken fence. When the court's outer edge came in, the rail came in with it,
	// because a rail standing out in the grass three metres from the stone it was built to edge is a
	// fence around nothing.
	//
	// It stands at z = 15.7, on the stone and not off it. The old 15.9 was 0.1 m beyond the paving, whose
	// edge is at 15.8, so every post stood with its foot a full 14 cm above the grass — a fence on
	// stilts. One blocker for the whole railing: the posts are 1.14 m apart, and six small walls would
	// leave five gaps a visitor could walk through between them.
	for (let i = 0; i < 6; i++) {
		add(box(scene, `railPost${i}`, { x: 0.09, y: 0.9, z: 0.09, px: -11.5 + i * 1.14, py: 0.59, pz: 15.7, mat: mats.wood }));
	}
	add(box(scene, "railTop", { x: 5.7, y: 0.08, z: 0.14, px: -8.65, py: 1.02, pz: 15.7, mat: mats.wood }));
	blocker(scene, "railBlock", { x: 5.7, y: 1.15, z: 0.42, px: -8.65, pz: 15.7 });

	return built;
}
