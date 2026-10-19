// The house: a low pavilion of pale plaster and teak behind the pool, with a big tiled roof
// that hangs out over the terrace, and a front of glass.

import { grimFeet, box, cylinder, hipRoof, plane, poly, blocker, slab, groundUVs, tintFromGround, zWallWithOpenings } from "./mesh.js";
import { shutOutSkyFill } from "./world.js";
import { fitRoom, fitStoreRoom } from "./interior.js";
import { teakTone, teakVertexSpacing } from "./teak.js";

const { Color3 } = BABYLON;

/**
 * A side wall with real holes in it, running north-south at a fixed x.
 *
 * A wall built as one box and given a pane of glass glued to its face makes a window that is not a
 * window: you look through the pane and see the wall behind it, so the glass reads as a pale patch
 * of plaster. So the wall is built in pieces around each opening — a pier of wall between them, a
 * sill under them, a header over them — and the glass stands inside the hole, which gives the pane
 * a reveal deep enough for the eye to read as a window.
 *
 * `openings` are [{ z0, z1, y0, y1 }] with z0 < z1, in the wall's own metres.
 */
function wallWithOpenings(scene, name, { x, thickness, z0, z1, y0 = 0.5, y1 = 4.25, openings, mat, blockers = true }) {
	const parts = [];
	const sorted = [...openings].sort((a, b) => a.z0 - b.z0);
	let n = 0;
	let edge = z0;
	const piece = (py, pz, sy, sz) =>
		parts.push(box(scene, `${name}Part${n++}`, { x: thickness, y: sy, z: sz, px: x, py, pz, mat }));
	for (const o of sorted) {
		if (o.z0 > edge) piece((y0 + y1) / 2, (edge + o.z0) / 2, y1 - y0, o.z0 - edge);
		if (o.y0 > y0) piece((y0 + o.y0) / 2, (o.z0 + o.z1) / 2, o.y0 - y0, o.z1 - o.z0);
		if (o.y1 < y1) piece((o.y1 + y1) / 2, (o.z0 + o.z1) / 2, y1 - o.y1, o.z1 - o.z0);
		// A sill is half a metre thick, which is something the visitor's feet would climb rather than
		// walk into, so the hole is shut below its sill line. Without this a person walks through the
		// glass and stands in the room with their feet on a metre-high ledge. A lining inside the wall
		// needs no second one of these: the wall it lines already has its own.
		if (blockers) blocker(scene, `${name}SillBlock${n}`, { x: thickness + 0.1, y: 1, z: o.z1 - o.z0, px: x, pz: (o.z0 + o.z1) / 2 });
		edge = o.z1;
	}
	if (edge < z1) piece((y0 + y1) / 2, (edge + z1) / 2, y1 - y0, z1 - edge);
	for (const mesh of parts) {
		mesh.checkCollisions = blockers;
		mesh.receiveShadows = true;
	}
	return parts;
}

/**
 * Everything that should throw a shadow.
 *
 * The list is flattened all the way down, and not just one level, because a wall built in pieces
 * hands over an array of its own: hand Babylon's addShadowCaster an array and it runs
 * `for (const child of mesh.getChildMeshes())` on it and throws "…getChildMeshes is not a function
 * or its return value is not iterable", which stops the Villa standing up altogether. That is
 * exactly what the two side walls did in a real browser, and nothing in this folder could see it,
 * because the Node tools stand the shadow lamp out. `tools/shadows.js` now checks it.
 */
function cast(shadows, meshes) {
	for (const mesh of flatten(meshes)) shadows.addShadowCaster(mesh);
	return meshes;
}

/**
 * A teak floor: a slab cornered every metre, its boards laid from the ground it lies on.
 *
 * Two things a box cannot do, for the same reason the pool paving had to be rebuilt (see `slab` in
 * mesh.js). A box has four corners to a face, so the weather — silvered out in the sun, still oiled
 * under the roof, dark where the roof lets go of its rain — could only change at the four ends of a
 * seventy-square-metre deck. And a box's face runs its pattern from one edge to the other, so the
 * boards restarted at every face; measured from the floor they are laid on, the boards now run the
 * terrace's whole length.
 */
function teakFloor(scene, name, { x, z, px, pz, py, y = 0.08, mats }) {
	const mesh = slab(scene, name, { x, y, z, px, py, pz, mat: mats.teakFloor, spacing: teakVertexSpacing });
	// Metres, not repeats: one repeat of the grain every 5.4 m along the boards, a band of six boards
	// every 1.8 m across them, so a board is 30 cm wide and none of it restarts at a corner.
	groundUVs(mesh, [5.4, 1.8]);
	tintFromGround(mesh, teakTone);
	mesh.receiveShadows = true;
	mesh.checkCollisions = true;
	return mesh;
}

function flatten(list, out = []) {
	for (const item of [].concat(list)) {
		if (Array.isArray(item)) flatten(item, out);
		else out.push(item);
	}
	return out;
}

export function buildVilla(scene, mats, shadows) {
	const built = [];
	const add = (...meshes) => {
		built.push(...meshes);
		return meshes;
	};

	// ---- the raised terrace the house stands on ----------------------------
	const terraceSlab = box(scene, "terrace", { x: 16.6, y: 0.5, z: 4.8, px: 0, py: 0.25, pz: -1.7, mat: mats.plasterDark });
	const terraceFloor = teakFloor(scene, "terraceFloor", { x: 16.2, z: 4.4, px: 0, pz: -1.7, py: 0.5, mats });
	// The terrace is solid ground to walk on or bump into, not a painting of one.
	terraceSlab.checkCollisions = true;
	add(terraceSlab, terraceFloor);

	// The same plinth runs on behind the glass, so the house stands on something and the plaster
	// meets the lawn on a dark band instead of floating half a metre above the grass.
	const backPlinth = box(scene, "backPlinth", { x: 16.6, y: 0.5, z: 8, px: 0, py: 0.25, pz: -8.1, mat: mats.plasterDark });
	backPlinth.checkCollisions = true;
	backPlinth.receiveShadows = true;
	add(backPlinth);

	// Steps down to the paving in front. Three equal rises — terrace to tread, tread to tread,
	// tread to paving — all of them inside the gap between the terrace face and the pool's north
	// coping, so nothing of the stair hangs over the water.
	const steps = [
		box(scene, "step1", { x: 4, y: 0.42, z: 0.32, px: 0, py: 0.196, pz: 0.86, mat: mats.coping }),
		box(scene, "step2", { x: 4, y: 0.32, z: 0.32, px: 0, py: 0.114, pz: 1.18, mat: mats.coping }),
	];
	steps.forEach((s) => {
		s.receiveShadows = true;
		s.checkCollisions = true;
	});
	add(...steps);
	// The deck has one way up: those steps. Without these the sides of the plinth are walked up from
	// the lawn, half a metre in one stride, from anywhere along the long faces — and now along the
	// back of the house too, since the plinth runs on behind it.
	blocker(scene, "terraceEndWest", { x: 0.4, y: 1, z: 12.8, px: -8.1, pz: -5.5 });
	blocker(scene, "terraceEndEast", { x: 0.4, y: 1, z: 12.8, px: 8.1, pz: -5.5 });
	blocker(scene, "terraceBack", { x: 16.6, y: 1, z: 0.4, px: 0, pz: -12.3 });

	// ---- the walls --------------------------------------------------------
	const wallBase = 0.5;
	const wallTop = 4.25;
	const wallHeight = wallTop - wallBase;
	const wallY = (wallTop + wallBase) / 2;

	// The store room behind the living hall, and the doorway through the back wall into it.
	//
	// Why: the front is 10.8 m of glass and the room behind it is the biggest thing between a visitor
	// and the house, and every session since the twenty-second has written that the room is a room you
	// look AT and not one you look into. A lit doorway in the far wall is the one thing that turns that
	// round — an opening you look through, with a light at the back of it and a floor you can see.
	//
	// It goes at the east end because that is where the service block already stands: a mass 3.2 m wide
	// hanging off the back wall that was a solid box with nothing in it, and which is now that room.
	// Its outside is the same box, to the centimetre, so the back of the house is the building it always
	// was — see `storeShell` below, and the plinth under it.
	const store = { x0: 4.0, x1: 7.2, z0: -13.85, z1: -11.9, y0: 0.5, y1: 3.9 };
	// Inside: 35 cm of wall on the flanks (the house's own thickness), 15 cm at the back, and 5 cm of
	// plaster skin over all of it, which leaves a room 2.4 m wide, 1.68 m deep and 2.85 m high.
	const storeIn = { x0: 4.35, x1: 6.85, z0: -13.7, z1: -11.975, y0: 0.6, y1: 3.44 };
	// The doorway: 1.4 m wide, 2.35 m high, and down to the floor — the wall's own base, because the
	// two teak floors meet under it and a threshold piece would lie a second skin of floor on top of
	// the ones that are already there and flicker against them.
	const storeDoor = { x0: 4.9, x1: 6.3, y0: wallBase, y1: 2.85 };
	// A band of glass high in the back wall of the store. Why: the one face of this room that shows on
	// the rear elevation is 3.2 x 3.4 m of plain cement, and a browser painted it (56,61,53) — the
	// darkest big thing behind the house, flat to 6 of 255 across it (`tools/cover.js` on the `rear`
	// view). Nothing else was going to break that stretch: the sun stands in the south all afternoon,
	// so no ray of it reaches a north face, and the two lanterns beside the back door are at x = -2.5,
	// a whole house-width away.
	//
	// It is a band and not a square, and that is the joinery talking and not fashion. The doorway in the
	// wall 1.95 m south of this one is 1.4 m wide and 2.35 m high, and a window that stands level with
	// it makes a tunnel: a man on the lawn behind the house looks through the glass, through the store,
	// through the doorway and out of the front of the house. Put the band's sill 7 cm over the head of
	// the doorway and every ray that passes the band is already rising too steeply to come back down
	// through that door — which is also why what shows through the glass is the room's ceiling, and why
	// `fitStoreRoom` now lines it.
	const storeWindow = { x0: 4.6, x1: 6.6, y0: 2.92, y1: 3.3 };

	const back = zWallWithOpenings(scene, "wallBack", {
		z: -11.8,
		thickness: 0.35,
		x0: -7.35,
		x1: 7.35,
		y0: wallBase,
		y1: wallTop,
		openings: [storeDoor],
		mat: mats.plaster,
	});
	add(...back);

	// The two side walls, with their windows cut in. The openings are the ones the panes fill below.
	const westWindow = [
		{ z0: -7.15, z1: -5.25, y0: 1.0, y1: 3.4 },
		{ z0: -10.35, z1: -8.45, y0: 1.0, y1: 3.4 },
	];
	// The east window is staggered against the two west ones, into the pier of wall between them. Set
	// it level with either and the two holes line up into a tunnel: you look into a window and see the
	// garden out of the other one, which is a bright hole where the room should be.
	const eastWindow = [{ z0: -8.3, z1: -7.3, y0: 1.0, y1: 3.4 }];
	const west = wallWithOpenings(scene, "wallWest", { x: -6.85, thickness: 0.35, z0: -11.85, z1: -4.15, y0: wallBase, y1: wallTop, openings: westWindow, mat: mats.plaster });
	const east = wallWithOpenings(scene, "wallEast", { x: 6.85, thickness: 0.35, z0: -11.85, z1: -4.15, y0: wallBase, y1: wallTop, openings: eastWindow, mat: mats.plaster });
	add(...west, ...east);

	// The plastered walls go dirty at the foot. Every wall of this house stood level and evenly bright
	// from its plinth to its eaves, which is how a wall looks the day it is finished and never again: see
	// `grimFeet` in src/mesh.js. Done after the walls are built so that the back, the sides and the
	// service block's own walls all take the same wash, whatever pieces they were cut into.
	for (const mesh of built) {
		if (mesh.material === mats.plaster || mesh.material === mats.plasterDark) {
			grimFeet(mesh, { floor: wallBase, rise: 1.3, shade: 0.62, lean: 0.38 });
		}
	}

	// A dark teak panel beside the front door, so the front is not all one pale plane.
	// It is also the only thing closing the front between the west wall and the glass, so it is
	// solid: without collisions here a visitor walked through the teak and into the living room.
	const panel = box(scene, "frontPanel", { x: 2.6, y: wallHeight, z: 0.2, px: -5.4, py: wallY, pz: -3.9, mat: mats.teakWall });
	panel.checkCollisions = true;
	add(panel);
	// The glass stops 0.68 m short of the east wall. That gap used to be shut by an invisible blocker
	// only, so the front had a slot you could look straight through into the room and out again. It is a
	// teak pier now, built with the glass below: a gap in a front wants filling, not hiding.

	// The service block on the north-east corner, to break the box up. It used to be one solid box;
	// it is a room now (see `store` above), but its OUTSIDE is the box it always was, to the centimetre:
	// x = 4.0 to 7.2, z = -13.85 to -11.9, y = 0.5 to 3.9. Its south edge is driven 5 cm into the back
	// wall, as it always was, so there is no joint left to see between the two.
	//
	// It used to stand 0.3 m further south, which put a slab of it inside the room, where the sky fill
	// lit it as though it were out of doors: through the east end of the front glass that face read
	// (239,174,114), brighter than sunlit teak outside at (188,125,86), and the room looked like a shop
	// window with a lamp in it. That fault is why the shell is four pieces and not one box now: the
	// inside has to be hollow, and the four pieces are the walls of that hollow.
	const storeShell = [
		...zWallWithOpenings(scene, "storeWallNorth", {
			z: (store.z0 + storeIn.z0) / 2,
			thickness: store.z0 - storeIn.z0,
			x0: storeIn.x0,
			x1: storeIn.x1,
			y0: store.y0,
			y1: storeIn.y1,
			openings: [storeWindow],
			mat: mats.plasterDark,
		}),
		box(scene, "storeWallWest", { x: storeIn.x0 - store.x0, y: storeIn.y1 - store.y0, z: store.z1 - store.z0, px: (store.x0 + storeIn.x0) / 2, py: (store.y0 + storeIn.y1) / 2, pz: (store.z0 + store.z1) / 2, mat: mats.plasterDark }),
		box(scene, "storeWallEast", { x: store.x1 - storeIn.x1, y: storeIn.y1 - store.y0, z: store.z1 - store.z0, px: (storeIn.x1 + store.x1) / 2, py: (store.y0 + storeIn.y1) / 2, pz: (store.z0 + store.z1) / 2, mat: mats.plasterDark }),
		box(scene, "storeRoof", { x: store.x1 - store.x0, y: store.y1 - storeIn.y1, z: store.z1 - store.z0, px: (store.x0 + store.x1) / 2, py: (storeIn.y1 + store.y1) / 2, pz: (store.z0 + store.z1) / 2, mat: mats.plasterDark }),
	];
	// And it stands on the plinth now. It did not: the plinth stops at z = -12.1 and the block ran to
	// -13.85, so 1.75 m of it hung in the air half a metre above the lawn, which is a box glued to a
	// wall and not a room. This is the same cement and the same height as the plinth it joins.
	const storePlinth = box(scene, "storePlinth", {
		x: store.x1 - store.x0,
		y: 0.5,
		z: -12.1 - store.z0,
		px: (store.x0 + store.x1) / 2,
		py: 0.25,
		pz: (store.z0 + -12.1) / 2,
		mat: mats.plasterDark,
	});
	storePlinth.checkCollisions = true;
	storePlinth.receiveShadows = true;
	storeShell.forEach((m) => {
		m.checkCollisions = true;
		m.receiveShadows = true;
	});
	add(storePlinth, ...storeShell);

	// The joinery in that band of wall: a sill that stands out from the face of the wall with a drip
	// under it, a head, two jambs, one mullion, and two panes set in the reveal. Teak, like every other
	// window in the house, and left out of the room's lamp list on purpose — see the note by `storeLamps`.
	// A timber reveal lit from inside would shine through 15 cm of cement as easily as it lights the
	// room, and the outside of a wall is not what a lamp inside it is for.
	const winCx = (storeWindow.x0 + storeWindow.x1) / 2;
	const winCy = (storeWindow.y0 + storeWindow.y1) / 2;
	const winZ = (store.z0 + storeIn.z0) / 2;
	const storeJoinery = [
		box(scene, "storeWinSill", { x: storeWindow.x1 - storeWindow.x0 + 0.16, y: 0.06, z: 0.22, px: winCx, py: storeWindow.y0 - 0.03, pz: winZ - 0.025, mat: mats.teakWall }),
		box(scene, "storeWinHead", { x: storeWindow.x1 - storeWindow.x0 + 0.08, y: 0.07, z: 0.17, px: winCx, py: storeWindow.y1, pz: winZ - 0.005, mat: mats.teakWall }),
		box(scene, "storeWinJambWest", { x: 0.07, y: 0.44, z: 0.17, px: storeWindow.x0 + 0.035, py: winCy, pz: winZ - 0.005, mat: mats.teakWall }),
		box(scene, "storeWinJambEast", { x: 0.07, y: 0.44, z: 0.17, px: storeWindow.x1 - 0.035, py: winCy, pz: winZ - 0.005, mat: mats.teakWall }),
		box(scene, "storeWinMullion", { x: 0.06, y: 0.36, z: 0.15, px: winCx, py: winCy, pz: winZ - 0.005, mat: mats.teakWall }),
	];
	const storeGlass = [
		box(scene, "storeGlassWest", { x: 0.9, y: 0.32, z: 0.06, px: winCx - 0.5, py: winCy, pz: winZ, mat: mats.glass }),
		box(scene, "storeGlassEast", { x: 0.9, y: 0.32, z: 0.06, px: winCx + 0.5, py: winCy, pz: winZ, mat: mats.glass }),
	];
	for (const mesh of storeJoinery) mesh.receiveShadows = true;
	add(...storeJoinery, ...storeGlass);

	// ---- the back of the house, which has to be worth looking at too ---------------------
	// The garden runs behind the villa, and a visitor stands on the lawn there, so the north face
	// gets the same care as the front: a band of dark boards under the eaves, a boarded door, and
	// two lanterns beside it. Left as plain plaster it came back of one grey colour from edge to
	// edge, because a wall in shade has nothing but the sky to light it.
	const backFace = -11.99;
	const boardBand = box(scene, "backBand", { x: 14.7, y: 0.95, z: 0.06, px: 0, py: 3.75, pz: backFace, mat: mats.teakWall });
	// The frame, the reveal, and the leaf set BACK off the face. This door used to be a plank panel laid
	// flat against a solid wall — the same teak, the same plane, no depth anywhere — and it read as a door
	// painted on (pictures/2844-rear.png). A door is read from its reveal: the leaf sits nine centimetres
	// inside the wall's face, the opening is lined on three sides, and the shadow the recess throws does
	// the rest. Nothing here is a hole: the wall behind is solid plaster, and a lined recess in front of it
	// is what a barred-up back door looks like, which is what this is.
	// And a shadow gap: the leaf is smaller than its frame by four centimetres, stands three inside the
	// wall's face, and behind it is a board of the dark stuff, a little bigger than the leaf. So the four
	// centimetres between leaf and frame are not plaster and not teak but near-black, which is what a
	// doorway is when you look at it from the garden — a door is read from that line of shadow and not
	// from its joinery. Recessing the leaf alone, with the same teak and no gap, simply moved a pale panel
	// nine centimetres and the whole thing went on reading as a picture of a door.
	const doorFrame = [
		box(scene, "doorJambWest", { x: 0.16, y: 2.5, z: 0.08, px: -3.15, py: 1.7, pz: backFace, mat: mats.teakWall }),
		box(scene, "doorJambEast", { x: 0.16, y: 2.5, z: 0.08, px: -1.85, py: 1.7, pz: backFace, mat: mats.teakWall }),
		box(scene, "doorHead", { x: 1.46, y: 0.18, z: 0.08, px: -2.5, py: 2.86, pz: backFace, mat: mats.teakWall }),
	];
	const doorBack = box(scene, "backDoorBack", { x: 1.24, y: 2.36, z: 0.02, px: -2.5, py: 1.63, pz: backFace + 0.07, mat: mats.darkMetal });
	const door = box(scene, "backDoor", { x: 1.06, y: 2.24, z: 0.05, px: -2.5, py: 1.62, pz: backFace + 0.03, mat: mats.teak });
	// A threshold, and not a way in. The floor of this house is half a metre over the lawn — the plinth says
	// so — and the back door used to end in mid-air at the top of it, with the wall meeting the grass in one
	// flat drop. So there is a stone under the door, laid at the plinth's own top, and it stops there: the
	// terrace behind is blocked to walkers (see `terraceBack` above) because climbing it would put a visitor
	// inside the wall, which means this landing is what a boarded-up back door has, namely a step to nowhere.
	// Cut coping stone and not the garden's rock: the rock's pattern is a metre of pitted granite, and at
	// half a metre across that came out as a block of pumice with holes in it the size of your thumb.
	const backStep = box(scene, "backStep", { x: 1.86, y: 0.5, z: 0.6, px: -2.5, py: 0.25, pz: backFace - 0.3, mat: mats.coping });
	backStep.checkCollisions = true;
	backStep.receiveShadows = true;
	const lanterns = [];
	for (const px of [-4.1, -0.9]) {
		// A case of dark metal with a lens set into it, and not a pale box with a lid on: in daylight the
		// pale box read as a paper cup pinned to the wall, which is what a lantern is not.
		lanterns.push(box(scene, `backLanternCase${px}`, { x: 0.26, y: 0.42, z: 0.14, px, py: 2.55, pz: backFace - 0.05, mat: mats.darkMetal }));
		lanterns.push(box(scene, `backLantern${px}`, { x: 0.15, y: 0.28, z: 0.04, px, py: 2.55, pz: backFace - 0.11, mat: mats.lampGlow }));
		lanterns.push(box(scene, `backLanternTop${px}`, { x: 0.3, y: 0.07, z: 0.24, px, py: 2.76, pz: backFace - 0.04, mat: mats.darkMetal }));
	}
	add(boardBand, door, doorBack, backStep, ...doorFrame, ...lanterns);
	boardBand.receiveShadows = true;
	for (const mesh of [boardBand, door, doorBack, ...doorFrame]) mesh.checkCollisions = false;

	// ---- the front: glass between teak uprights ---------------------------
	const glassTop = wallTop - 0.25;
	const glassBottom = wallBase + 0.3;
	const glassHeight = glassTop - glassBottom;
	const frontZ = -3.95;
	const glass = box(scene, "frontGlass", { x: 10.8, y: glassHeight, z: 0.06, px: 0.6, py: (glassTop + glassBottom) / 2, pz: frontZ, mat: mats.glass });
	glass.receiveShadows = false;
	// You may not walk through a window.
	glass.checkCollisions = true;
	add(glass);
	// sill and head beam, and the pier that fills the gap between the glass's east edge and the wall
	const frontPier = box(scene, "frontPier", { x: 0.72, y: wallHeight, z: 0.26, px: 6.34, py: wallY, pz: frontZ, mat: mats.teakWall });
	frontPier.checkCollisions = true;
	frontPier.receiveShadows = true;
	add(
		frontPier,
		box(scene, "frontSill", { x: 11.4, y: 0.3, z: 0.4, px: 0.6, py: wallBase + 0.15, pz: frontZ, mat: mats.teakWall }),
		box(scene, "frontHead", { x: 11.4, y: 0.26, z: 0.4, px: 0.6, py: glassTop + 0.13, pz: frontZ, mat: mats.teakWall }),
	);
	// uprights — four of them, because the pier at the east end does the work of the fifth
	const mullions = [];
	for (let i = 0; i < 4; i++) {
		mullions.push(box(scene, `mullion${i}`, { x: 0.17, y: glassHeight, z: 0.3, px: -4.8 + i * 2.7, py: (glassTop + glassBottom) / 2, pz: frontZ, mat: mats.teakWall }));
	}
	add(...mullions);

	// Side windows: two tall panes on the west wall, one on the east — each one standing in the middle
	// of the wall's thickness, inside the hole the wall was built around, so there is a room behind it.
	const sideGlass = [
		box(scene, "westGlassA", { x: 0.06, y: 2.4, z: 1.9, px: -6.85, py: 2.2, pz: -6.2, mat: mats.glass }),
		box(scene, "westGlassB", { x: 0.06, y: 2.4, z: 1.9, px: -6.85, py: 2.2, pz: -9.4, mat: mats.glass }),
		box(scene, "eastGlassA", { x: 0.06, y: 2.4, z: 1.0, px: 6.85, py: 2.2, pz: -7.8, mat: mats.glass }),
	];
	sideGlass.forEach((m) => (m.checkCollisions = true));
	add(...sideGlass);

	// ---- what you can see through the glass -------------------------------
	//
	// The room. It has to be worth looking at, because the front of glass is the biggest thing between
	// a visitor and the house: in the start view it fills a tenth of the frame.
	//
	// The room's own lining. The walls above are plaster on both faces, and the outside face is lit by
	// the whole sky; a room under a roof is not, so the inside of the three solid walls and the ceiling
	// are lined with `interiorPlaster` and handed to `shutOutSkyFill` below. The lining is 5 cm thick
	// and stands on the room side of each wall, which takes 5 cm off the room's span and gives the
	// windows a deeper reveal — see `jargon.md` for lining.
	const skin = 0.05;
	// The lining goes round the doorway as well as over the wall, so the opening has a reveal: the
	// plaster of the room turns the corner of the hole and the doorway reads as being IN a wall instead
	// of being a rectangle pasted on one.
	const backLining = zWallWithOpenings(scene, "liningBack", {
		z: -11.625 + skin / 2,
		thickness: skin,
		x0: -7.35,
		x1: 7.35,
		y0: wallBase,
		y1: wallTop,
		openings: [storeDoor],
		mat: mats.interiorPlaster,
		collide: false,
	});
	// The side linings are the same walls with the same holes, moved in to the room face of the wall.
	// `blockers: false`, because the sill blockers belong to the wall: a second set would stand in the
	// room, and `ground.js` would hand a visitor a ledge to stand on inside a room they cannot enter.
	const westLining = wallWithOpenings(scene, "liningWest", { x: -6.675 + skin / 2, thickness: skin, z0: -11.85, z1: -4.15, y0: wallBase, y1: wallTop, openings: westWindow, mat: mats.interiorPlaster, blockers: false });
	const eastLining = wallWithOpenings(scene, "liningEast", { x: 6.675 - skin / 2, thickness: skin, z0: -11.85, z1: -4.15, y0: wallBase, y1: wallTop, openings: eastWindow, mat: mats.interiorPlaster, blockers: false });

	const interiorFloor = box(scene, "interiorFloor", { x: 14, y: 0.1, z: 7.6, px: 0, py: wallBase + 0.05, pz: -8, mat: mats.teakWall });
	interiorFloor.receiveShadows = true;
	// The ceiling has to be BELOW the roof's soffit, which hangs at 4.06. It stood at 4.2 — above the
	// soffit, so from the room the first ceiling the eye met was the soffit: a teak ceiling lit by a sky
	// fill it never sees, and a plaster plane that nothing could ever be drawn from. It now sits at 4.02,
	// in the 6 cm between the soffit and the top of the glass, and the room has a ceiling of its own.
	const interiorCeiling = plane(scene, "interiorCeiling", { width: 14, height: 7.6, px: 0, py: 4.02, pz: -8, mat: mats.interiorPlaster, rx: -Math.PI / 2 });
	interiorCeiling.receiveShadows = true;
	const glowStrip = box(scene, "interiorGlow", { x: 9, y: 0.12, z: 0.5, px: 0.4, py: wallTop - 0.3, pz: -7.4, mat: mats.interiorGlow });

	// The room's furniture, its rug and where its lamps hang. `src/interior.js` says why every piece
	// stands where it does; the room's inside in metres is handed over here because that is where the
	// floor's height and the ceiling's are known.
	const room = fitRoom(scene, mats, {
		floor: wallBase + 0.1,
		back: -11.575,
		ceiling: 4.02,
		lampY: wallTop - 0.6,
	});
	// And the store room behind the doorway: its plaster skin, its floor, and the three things
	// standing in it. `src/interior.js` says why each one is where it is.
	const storeFit = fitStoreRoom(scene, mats, { inside: storeIn, window: storeWindow });
	const roomMeshes = [...backLining, ...westLining, ...eastLining, interiorFloor, interiorCeiling, glowStrip, ...room.meshes];
	add(...roomMeshes);

	// Nothing in this room may be lit by a sky it cannot see. See `shutOutSkyFill` in world.js.
	shutOutSkyFill(scene, roomMeshes);
	// The store room is under the same roof, so it is shut out in the same way — and it is added to
	// `scene.roomMeshes` below, which is what keeps the pool's two lamps out of it as well.
	const storeMeshes = storeFit.meshes;
	add(...storeMeshes);
	shutOutSkyFill(scene, storeMeshes);

	// The room's own lamps, and they have to be real ones. The roof and the soffit, and the sky fill shut
	// out above, leave the room lit by nothing at all, and a front of glass over a black box reads as a
	// black board — which is what it did. This lamp was first written behind a guard,
	// `BABYLON.PointLight.CreateFromDiffuseAndSpecular ? new … : null`, and that static is not in the
	// vendored Babylon 9.30 at all (`grep -c CreateFromDiffuseAndSpecular vendor/babylon/babylon.js` is
	// nought), so the guard was always false: the room has never had a lamp while this note said it had
	// one at 26. Measured with the light absent, every pane of the front came out of Chromium at
	// (43,55,50) — a dark green sheet with nothing behind it.
	//
	// There used to be one lamp over the middle of the room, and one lamp is not enough for a room
	// 13 m across: the back wall came out (103,91,71) under the lamp and (74,72,61) at the east end and
	// (60,60,51) through the west end of the glass. So: two over the room's two halves, one in the floor
	// lamp in the west corner, and one shut up in the alcove on the back wall — the room is now looked into
	// as well as at. All four are kept off everything but the room by `includedOnlyMeshes`, so they cannot
	// warm a single board of the terrace or the face of the glass. Their strengths and their reach come from
	// `src/interior.js`, where they are written as ratios of one another; the pair over the room is what the
	// browser says leaves a dim warm room behind the glass and not a shop window.
	const roomLamps = room.lamps.map((spot) => {
		const lamp = new BABYLON.PointLight(spot.name, new BABYLON.Vector3(spot.x, spot.y, spot.z), scene);
		lamp.diffuse = new Color3(1, 0.72, 0.42);
		lamp.specular = new Color3(0.2, 0.14, 0.08);
		lamp.range = spot.range || 15;
		lamp.includedOnlyMeshes = roomMeshes;
		lamp.intensity = spot.intensity;
		// Kept so `?room=` can scale the four together without being told their ratios again.
		lamp.baseIntensity = spot.intensity;
		return lamp;
	});
	// The store's one lamp: a wall lamp over the shelf, on the plaster the doorway looks at. It is kept
	// to the store's own meshes for the same reason the room's four are kept to the room's — a lamp that
	// throws through a wall warms the outside as well, and the outside is sunlit.
	const storeLamps = storeFit.lamps.map((spot) => {
		const lamp = new BABYLON.PointLight(spot.name, new BABYLON.Vector3(spot.x, spot.y, spot.z), scene);
		// Every lamp in this room is a flame: warm, and the same warm in both of them.
		lamp.diffuse = new Color3(1, 0.7, 0.4);
		lamp.specular = new Color3(0.15, 0.1, 0.06);
		lamp.range = spot.range || 6;
		lamp.includedOnlyMeshes = storeMeshes;
		lamp.intensity = spot.intensity;
		lamp.baseIntensity = spot.intensity;
		return lamp;
	});
	// So a probe can turn the house's lamps down or off together: see tools/roomprobe.json.
	scene.roomLamps = [...roomLamps, ...storeLamps];
	// And so the pool's two lamps can be kept out of both rooms when they are built, a door later than
	// this one: the shaders carry six lights and the room already wears the sun and its own four.
	scene.roomMeshes = [...roomMeshes, ...storeMeshes];

	// ---- the roof ---------------------------------------------------------
	const eave = 4.2;
	const ridge = 6.75;
	const roof = hipRoof(scene, "roof", { x0: -8.8, x1: 8.8, z0: -13.4, z1: -2.2, yBase: eave, yTop: ridge, ridgeHalf: 3.5, mat: mats.roof });
	roof.receiveShadows = true;
	add(roof);

	// The boards along the eaves and along the ridge. The ridge wears the roof's own tiles, not the
	// dark plaster it used to wear: a hip roof's ridge is a run of half tiles, and the plaster read
	// (180,138,93) in the sun — pale sand laid along the top of orange tiles.
	//
	// It used to be a box 7.5 m long, 0.42 deep and 0.22 tall, and a box is a plank: measured at 14 m
	// off (`pictures/s59-ridge-before.png`) it came out (247,115,85) L141 while the tiles at its foot
	// were (85,35,16) L44, so the brightest thing on the roof was a salmon board with a black line
	// under it where it shadowed the slope, and it hung 0.25 m past the end of the ridge at both ends.
	// A box's faces also carry the pattern wrong: 11.2 m of the tile canvas smeared across 0.42 m of
	// box is no pattern at all, only the canvas's average colour, which is why it blew out.
	//
	// So it is a low crest now, built by the same `hipRoof` as the roof it caps: four shallow faces at
	// about 46 degrees and a ridge of its own, 0.72 m across and standing 0.12 m proud of the roof —
	// the shape a row of curved pan tiles makes. Its ends are hips that land on the roof's own hips,
	// so nothing hangs in the air, and its own light and shade are the roof's: one face catches the
	// south sun, the other falls away dark, and there is no flat top drinking the whole sky.
	//
	// The tiles are sized from the ground up, not from the mesh: the roof maps 17.6 m onto one repeat
	// of the pattern in x and 11.2 m in z (times the material's own 5), and `groundUVs` lays the crest
	// on that same world grid, so a tile is 0.28 m across on the crest as it is on the slope.
	const ridgeCap = hipRoof(scene, "ridgeCap", {
		x0: -3.5, x1: 3.5, z0: -8.16, z1: -7.44, yBase: ridge - 0.25, yTop: ridge + 0.12, ridgeHalf: 3.14, mat: mats.roof,
	});
	groundUVs(ridgeCap, [17.6, 11.2]);
	ridgeCap.receiveShadows = true;
	const fascia = [
		box(scene, "fasciaSouth", { x: 17.9, y: 0.3, z: 0.18, px: 0, py: eave - 0.1, pz: -2.24, mat: mats.plaster }),
		box(scene, "fasciaNorth", { x: 17.9, y: 0.3, z: 0.18, px: 0, py: eave - 0.1, pz: -13.36, mat: mats.plaster }),
		box(scene, "fasciaWest", { x: 0.18, y: 0.3, z: 11.1, px: -8.76, py: eave - 0.1, pz: -7.8, mat: mats.plaster }),
		box(scene, "fasciaEast", { x: 0.18, y: 0.3, z: 11.1, px: 8.76, py: eave - 0.1, pz: -7.8, mat: mats.plaster }),
		ridgeCap,
	];
	add(...fascia);

	// Under the eaves the underside reads dark: a ceiling plane over the terrace, and over the whole
	// roof footprint — the roof surface is one skin, so anywhere the soffit stops short of the eave you
	// can look straight up through the roof into the room. The fascia boards close the 14 cm left over
	// between this plane and the roof edge.
	// between this plane and the roof edge. It faces DOWN, at the garden under it: face it up and a
	// browser draws no underside at all, and the roof is a shell you can see straight through.
	const soffit = plane(scene, "soffit", { width: 17.6, height: 11.2, px: 0, py: eave - 0.14, pz: -7.8, mat: mats.soffit, rx: -Math.PI / 2 });
	soffit.applyFog = true;
	add(soffit);

	// Posts holding up the roof over the terrace. They stand under the eave, in the line of the side
	// walls: four posts out at the front edge of the deck held up nothing at all, since the roof ends
	// 2.65 m behind them, and a row of posts carrying the sky reads as broken geometry from the side.
	// The tops reach 4.3 so they meet the slope of the roof and not the air under it.
	const posts = [];
	for (const px of [-6.85, -2.2, 2.2, 6.85]) {
		posts.push(box(scene, `post${px}`, { x: 0.3, y: eave - 0.4, z: 0.3, px, py: 0.5 + (eave - 0.4) / 2, pz: -2.05, mat: mats.teakWall }));
		posts.push(box(scene, `postFoot${px}`, { x: 0.46, y: 0.16, z: 0.46, px, py: 0.58, pz: -2.05, mat: mats.stone }));
	}
	posts.forEach((p) => (p.checkCollisions = true));
	add(...posts);

	// ---- the sala: an open pavilion by the east end of the pool -----------
	const salaX = 10.6;
	const salaZ = 5.4;
	const salaBase = box(scene, "salaBase", { x: 4.4, y: 0.62, z: 4.4, px: salaX, py: 0.31, pz: salaZ, mat: mats.plaster });
	const salaFloor = teakFloor(scene, "salaFloor", { x: 4, z: 4, px: salaX, pz: salaZ, py: 0.62, mats });
	salaBase.checkCollisions = true;
	const salaPosts = [];
	for (const dx of [-1.8, 1.8]) {
		for (const dz of [-1.8, 1.8]) {
			const post = box(scene, `salaPost${dx}${dz}`, { x: 0.26, y: 2.5, z: 0.26, px: salaX + dx, py: 0.66 + 1.25, pz: salaZ + dz, mat: mats.teakWall });
			post.checkCollisions = true;
			salaPosts.push(post);
		}
	}
	const salaRoof = hipRoof(scene, "salaRoof", { x0: salaX - 3, x1: salaX + 3, z0: salaZ - 3, z1: salaZ + 3, yBase: 3.16, yTop: 4.5, ridgeHalf: 0.9, mat: mats.roof, uvScale: 1.6 });
	const salaSoffit = plane(scene, "salaSoffit", { width: 6, height: 6, px: salaX, py: 3.1, pz: salaZ, mat: mats.teakWall, rx: -Math.PI / 2 });
	// The sala's ridge, the same crest on a smaller roof: 0.6 m across, 0.1 m proud, its hips landing
	// on the sala roof's own hips. Its slope maps 6 m onto 1.6 repeats of the same pattern (times the
	// material's 5), which is a tile of 0.75 m, so `groundUVs` is told 3.75 m to the repeat here.
	const salaRidge = hipRoof(scene, "salaRidge", {
		x0: salaX - 0.9, x1: salaX + 0.9, z0: salaZ - 0.3, z1: salaZ + 0.3, yBase: 4.2, yTop: 4.6, ridgeHalf: 0.6, mat: mats.roof,
	});
	groundUVs(salaRidge, [3.75, 3.75]);
	salaRidge.receiveShadows = true;
	add(salaBase, salaFloor, ...salaPosts, salaRoof, salaSoffit, salaRidge);

	// A short flight of steps up to the sala, set in the middle of its west face, and the one way up:
	// three rises of 17 cm each, with the base sealed on every other face — and on the west face
	// above and below the steps — so the sala is climbed at the steps and nowhere else.
	const salaSteps = [
		box(scene, "salaStep1", { x: 0.45, y: 0.4, z: 2, px: salaX - 2.175, py: 0.28, pz: salaZ, mat: mats.coping }),
		box(scene, "salaStep2", { x: 0.45, y: 0.4, z: 2, px: salaX - 2.625, py: 0.11, pz: salaZ, mat: mats.coping }),
	];
	salaSteps.forEach((s) => (s.checkCollisions = true));
	add(...salaSteps);
	blocker(scene, "salaFaceNorth", { x: 4.4, y: 1, z: 0.4, px: salaX, pz: salaZ - 2.4 });
	blocker(scene, "salaFaceEast", { x: 0.4, y: 1, z: 4.4, px: salaX + 2.4, pz: salaZ });
	blocker(scene, "salaFaceSouth", { x: 4.4, y: 1, z: 0.4, px: salaX, pz: salaZ + 2.4 });
	blocker(scene, "salaFaceWestNorth", { x: 0.4, y: 1, z: 1, px: salaX - 2.4, pz: salaZ - 1.5 });
	blocker(scene, "salaFaceWestSouth", { x: 0.4, y: 1, z: 1, px: salaX - 2.4, pz: salaZ + 1.5 });
	// The interior floor, so a visitor who looks through the glass sees a floor that holds.
	interiorFloor.checkCollisions = true;

	cast(shadows, [
		terraceSlab,
		backPlinth,
		terraceFloor,
		...back,
		...west,
		...east,
		panel,
		storePlinth,
		...storeShell,
		roof,
		...fascia,
		...posts,
		salaBase,
		salaFloor,
		...salaPosts,
		salaRoof,
		soffit,
	]);
	cast(shadows, [
		boardBand,
		door,
		...doorFrame,
	]);
	// The front's uprights throw a shadow, and it is not a small thing: the late sun comes over the eave
	// and through the glass and lies on the room's floor, so these four teak posts and the pier at the
	// east end lay a lattice of stripes across that floor and across the rug. A sun patch with nothing
	// crossed over it reads as a hole; with the uprights' shadows in it it reads as a room with a window.
	cast(shadows, [...mullions, frontPier]);

	built.forEach((m) => {
		if (!m.checkCollisions) m.checkCollisions = false;
	});
	return built;
}
