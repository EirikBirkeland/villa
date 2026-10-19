// The room behind the front of glass: what a visitor looks AT from the terrace.
//
// The front is 10.8 m of glass and it fills a tenth of the view from where a visitor starts, so
// whatever stands in this room is seen more than anything else on the house. Until now the room held
// a floor, a ceiling and two boxes: one called a sofa and one called a table. Measured through the
// glass in Chromium the whole room came out between (115,86,61) and (60,60,51) — a warm-dark board
// with no shape in it, and the two ends of it the deadest, coolest patches left anywhere on the Villa.
//
// Three things were wrong, and only one of them was furniture:
//
//   1. One lamp for a 13 x 7.6 m room. It stood over the middle of the room, so the middle was lit and
//      the ends were not: the back wall read (103,91,71) at the centre and (74,72,61) at the east end.
//      There are four lamps now: one over each half of the room, a small one in a floor lamp in the west
//      corner, which is where the deadest patch of glass looked, and one shut up inside the alcove on the
//      back wall.
//   2. Nothing on the floor. The room's floor is the brightest thing behind the glass — a browser
//      paints it (153,99,61) where the back wall gets (103,91,71) — and it was bare teak from wall to
//      wall. A rug five metres across is the biggest single shape this room can be given.
//   3. Nothing with a shape in it. A box is a plinth, not a seat: a sofa needs a back and arms against
//      the light behind it to read as anything at fourteen metres. So: a sofa with a back and arms and
//      cushions, two chairs, a table with a bowl and a tray on it, a plant in a pot in the east corner,
//      two framed panels on the back wall, a lit alcove standing open between them, and four beams across
//      the ceiling, lit from below by the lamps that stand between them.
//
// Everything here is built out of `box`, `cylinder` and `sphere` and wears a material the Villa
// already has, except the rug. None of it is a shadow-caster — the room is lit by its own lamps and by
// no sun the roof lets through — and none of it is a blocker: a visitor cannot get into this room (the
// glass, the piers and the walls are walked against) and nothing here may hand `ground.js` a ledge to
// stand on inside it.
//
// What is deliberately NOT here: a way in. The room has a doorway now — see `fitStoreRoom` below, in
// the wall behind this one — but it is a room looked at and not walked into, and nothing here may hand
// `ground.js` a ledge to stand on inside it.

import { box, cylinder, sphere, zWallWithOpenings } from "./mesh.js";
import { makePottedPlant } from "./garden.js";


/**
 * Furnish the room. `room` is the inside of the house in metres: the floor's top, the inner faces of
 * the three solid walls and the glass, and the height the ceiling lamps hang at.
 *
 * Returns { meshes, lamps }: every mesh the room's lamps have to light (see `includedOnlyMeshes` in
 * villa.js, and `shutOutSkyFill`, which must be handed the same list), and where the lamps hang.
 */
export function fitRoom(scene, mats, room) {
	const F = room.floor;
	const built = [];
	const add = (...meshes) => {
		built.push(...meshes);
		return meshes;
	};

	// ---- the rug ----------------------------------------------------------
	// 5.2 x 3.8 m of rust silk in the middle of the floor, laid where the seating group stands so the
	// four pieces of furniture read as one group and not as things dumped in a hall. It is 2 cm thick
	// and sits on the floor rather than being a plane 1 cm above it: a box has faces that face the right
	// ways, and a plane wound the wrong way is simply not drawn.
	const rugX = -1.4;
	add(box(scene, "rug", { x: 5.2, y: 0.02, z: 3.8, px: rugX, py: F + 0.01, pz: -6.9, mat: mats.rug }));
	built[0].receiveShadows = true;

	// ---- the seating group ------------------------------------------------
	// Facing the glass, and so facing the pool: the room looks out over the water, which is the whole
	// reason a pool villa has a room at all.
	const cx = rugX;
	const cz = -7.9;
	add(
		box(scene, "sofaFrame", { x: 3.0, y: 0.34, z: 1.15, px: cx, py: F + 0.17, pz: cz, mat: mats.wood }),
		box(scene, "sofaBack", { x: 3.0, y: 0.62, z: 0.22, px: cx, py: F + 0.65, pz: cz - 0.465, mat: mats.wood }),
		box(scene, "sofaArmWest", { x: 0.2, y: 0.5, z: 1.15, px: cx - 1.4, py: F + 0.59, pz: cz, mat: mats.wood }),
		box(scene, "sofaArmEast", { x: 0.2, y: 0.5, z: 1.15, px: cx + 1.4, py: F + 0.59, pz: cz, mat: mats.wood }),
		box(scene, "sofaCushionWest", { x: 1.34, y: 0.16, z: 0.92, px: cx - 0.72, py: F + 0.42, pz: cz + 0.06, mat: mats.clothStripe }),
		box(scene, "sofaCushionEast", { x: 1.34, y: 0.16, z: 0.92, px: cx + 0.72, py: F + 0.42, pz: cz + 0.06, mat: mats.clothStripe }),
	);

	// Two chairs, one at each end of the rug, turned to face across it.
	for (const [name, px, backAt] of [["chairWest", cx - 2.15, -1], ["chairEast", cx + 2.15, 1]]) {
		add(
			box(scene, `${name}Frame`, { x: 0.62, y: 0.34, z: 0.62, px, py: F + 0.17, pz: -6.5, mat: mats.wood }),
			box(scene, `${name}Back`, { x: 0.14, y: 0.6, z: 0.62, px: px + backAt * 0.25, py: F + 0.64, pz: -6.5, mat: mats.wood }),
			box(scene, `${name}Cushion`, { x: 0.56, y: 0.14, z: 0.56, px, py: F + 0.41, pz: -6.5, mat: mats.clothStripe }),
		);
	}

	// The table, and two things on it. A low table is a plinth and a slab; a bowl and a tray are the
	// only things in the room small enough to be missed and too big to leave out.
	const tz = -6.1;
	add(
		box(scene, "tableBase", { x: 1.5, y: 0.34, z: 0.8, px: cx, py: F + 0.17, pz: tz, mat: mats.wood }),
		box(scene, "tableTop", { x: 1.8, y: 0.06, z: 1.0, px: cx, py: F + 0.37, pz: tz, mat: mats.wood }),
		sphere(scene, "tableBowl", { diameter: 0.36, diameterY: 0.18, segments: 10, px: cx - 0.45, py: F + 0.49, pz: tz, mat: mats.pot }),
		box(scene, "tableTray", { x: 0.5, y: 0.05, z: 0.34, px: cx + 0.55, py: F + 0.425, pz: tz + 0.1, mat: mats.wood }),
	);

	// ---- the west corner, which was the deadest thing in the front --------
	// A floor lamp: a foot, a post, and a shade that gives its own light. The light that stands in it
	// is what takes the west end of the glass up from (60,60,51) — a grey-green nothing.
	const lampX = -5.4;
	const lampZ = -5.4;
	add(
		cylinder(scene, "floorLampFoot", { diameter: 0.34, height: 0.04, tessellation: 12, px: lampX, py: F + 0.02, pz: lampZ, mat: mats.wood }),
		cylinder(scene, "floorLampPost", { diameter: 0.09, height: 0.78, tessellation: 8, px: lampX, py: F + 0.43, pz: lampZ, mat: mats.wood }),
		cylinder(scene, "floorLampShade", { diameter: 0.46, diameterTop: 0.3, height: 0.34, tessellation: 14, px: lampX, py: F + 0.99, pz: lampZ, mat: mats.interiorGlow }),
	);

	// ---- the back wall and the ceiling ------------------------------------
	// Two framed panels. They did not read: the panel was the room's own pale plaster on a wall of the
	// same pale plaster, and measured from inside the two came out (101,85,58) and (95,82,57) — three
	// luminance points apart, which at fourteen metres is nothing at all. So they are turned round: a dark
	// teak square in a lighter timber frame, which is one dark rectangle on a pale wall from far off and
	// two things from near. A lacquered panel is what a Thai house hangs here anyway.
	for (const name of ["West", "East"]) {
		const px = name === "West" ? -3.2 : 3.2;
		add(
			box(scene, `panelFrame${name}`, { x: 1.7, y: 1.15, z: 0.05, px, py: F + 1.95, pz: room.back + 0.025, mat: mats.wood }),
			box(scene, `panel${name}`, { x: 1.46, y: 0.94, z: 0.02, px, py: F + 1.95, pz: room.back + 0.055, mat: mats.teakWall }),
		);
	}

	// Four beams across the ceiling, 1.9 m apart. The ceiling is above the lamps, so it has never once
	// been lit by them; the undersides of these beams face straight down at the lamps, so the dark of
	// the ceiling gets four warm lines in it and the room gets a span you can measure with your eye.
	// They wear `mats.beam` and not the wall's wood: see that material in `src/materials.js` for the
	// shingles the uprights' grain made of a beam lying down.
	for (let i = 0; i < 4; i++) {
		add(box(scene, `ceilingBeam${i}`, { x: 13.0, y: 0.22, z: 0.2, px: 0, py: room.ceiling - 0.11 - 0.02, pz: -5.0 - i * 1.9, mat: mats.beam }));
	}

	// ---- the lit alcove between the panels ---------------------------------
	// A teak case 1.8 m wide and 2 m high standing against the back wall with its front left out, a shelf
	// across the middle, and a lamp of its own shut up inside it. This is the one thing in the room you look
	// *into* rather than at: the room's own lamps light the wall, but this gives back a square of light with
	// a lip, a shelf and two objects standing in it, and a lit recess reads as depth at fourteen metres when
	// nothing else in a room that has no internal windows can. It stands between the two panels, which is the
	// one span of the back wall that had nothing on it, and it is tall enough to clear the line the sill cuts
	// across the room from the start view (a ray over the sill reaches the floor only 3 m inside the glass).
	const ax = 0;
	const az = room.back + 0.335; // the case is 0.55 m deep, off the plaster
	add(
		box(scene, "alcoveSideWest", { x: 0.08, y: 1.86, z: 0.55, px: ax - 0.86, py: F + 1.0, pz: az, mat: mats.teakWall }),
		box(scene, "alcoveSideEast", { x: 0.08, y: 1.86, z: 0.55, px: ax + 0.86, py: F + 1.0, pz: az, mat: mats.teakWall }),
		box(scene, "alcoveBottom", { x: 1.8, y: 0.1, z: 0.55, px: ax, py: F + 0.1, pz: az, mat: mats.teakWall }),
		box(scene, "alcoveTop", { x: 1.96, y: 0.09, z: 0.55, px: ax, py: F + 1.95, pz: az, mat: mats.teakWall }),
		// The inside of the back is the room's own pale plaster and not teak: it is the face the lamp falls
		// on, and a dark one would swallow the only light in there.
		box(scene, "alcoveBack", { x: 1.72, y: 1.8, z: 0.04, px: ax, py: F + 1.0, pz: room.back + 0.02, mat: mats.interiorPlaster }),
		box(scene, "alcoveShelf", { x: 1.72, y: 0.05, z: 0.5, px: ax, py: F + 0.98, pz: az + 0.02, mat: mats.teakWall }),
		box(scene, "alcoveLamp", { x: 0.6, y: 0.05, z: 0.3, px: ax, py: F + 1.78, pz: az, mat: mats.interiorGlow }),
		// Two things standing in it. A bowl on the shelf and a tall jar on the floor of the case: brass for
		// the one, because it is the only metal in the room and it takes the lamp high, terracotta for the
		// other, because it is the same clay as the pots outside.
		sphere(scene, "alcoveBowl", { diameter: 0.32, diameterY: 0.16, segments: 10, px: ax - 0.42, py: F + 1.08, pz: az + 0.02, mat: mats.brass }),
		cylinder(scene, "alcoveJar", { diameter: 0.26, diameterTop: 0.16, height: 0.44, tessellation: 12, px: ax + 0.44, py: F + 0.37, pz: az + 0.04, mat: mats.pot }),
	);

	// The east corner used to hold a big potted plant, and it was the last dead corner of the glass. It
	// moves to the west end now because the east end has something better in it: the doorway through the
	// back wall (`fitStoreRoom`), which is a hole with a light at the back of it and reads better than a
	// plant at any distance. Here it stands in the corner under the west wall's second window, which is
	// the one place in the room a plant is wanted and not in the way of anything.
	add(...makePottedPlant(scene, mats, { x: -5.4, z: -10.4, size: 1.5, seed: 23, y: F }));

	// Everything in here must receive the shadow the roof throws. A mesh that does not receive shadows is
	// drawn in the open sun wherever it stands, and the sun at 24° comes over the terrace and down through
	// the glass — so before this was put right the room's new furniture was lit straight through the roof
	// and through the glass at once: the rug came out of Chromium at (245,151,84) and the two wall panels
	// at (254,228,178), blown white, while the plaster behind them, which does receive the shadow, stood
	// at (100,86,60). The lamps inside the room throw no shadows (no shadow generator is set on them), so
	// nothing here needs to cast.
	for (const mesh of built) mesh.receiveShadows = true;

	// Four lamps: one over each half of the room, one in the floor lamp and one shut up in the alcove. They
	// are placed here and built in villa.js, next to the wall they hang under, where the ceiling height is
	// known. The strengths are here too, because they are ratios of one another and belong in one place: a
	// ceiling lamp floods the room, a floor lamp lights a corner of it (a third: what the browser left the
	// west pane at and no more), and the alcove lamp is a candle beside them — enough to make its square of
	// the wall read as lit from inside, and not enough to light the room, which is what would give the whole
	// front away. Measured at fourteen metres: at 3.2 the plaster right under the lamp came out
	// (234,185,133) and the top of the case (208,154,107), which is a lamp showing its own filament; at 2.4
	// those fall to (225,176,125) and (203,149,103) while the lit square still stands thirteen points over
	// the wall beside it; at 1.8 it starts going grey. `?room=` in the url scales them all by the first of
	// these.
	//
	// The pair over the room stood at 20 and has been raised to 30. The ladder was weighed while the plaster
	// was still the grey paint it used to be: at 20, 26, 32 and 40 the wall under the lamp measured L98, L108,
	// L116 and L125 and the front, seen through the glass at fourteen metres, gave L96, L102, L108 and L114 —
	// so these two lamps move the room about one point of luminance for every two of intensity, and the glass
	// keeps about four points of the difference back. With the lime wash now on the walls the pair at 30 puts
	// that wall at (147,104,52) and the front at (131,98,60) L102 against the sunlit teak mullion's L139:
	// about three quarters of the timber that frames the glass, which is what a room with its lamps on at half
	// past five looks like from a bright terrace. Forty made the back wall as bright as the fascia boards and
	// the front started reading as a shop window, and at 26 the ends of the room still went grey. The alcove
	// lamp and the floor lamp keep their numbers: the alcove back stands at L181 already, near enough blown,
	// and a brighter one would put the room's one square of light out of the picture altogether.
	const lamps = [
		{ name: "roomLampWest", x: -3.3, y: room.lampY, z: -7.85, intensity: 30 },
		{ name: "roomLampEast", x: 3.3, y: room.lampY, z: -7.85, intensity: 30 },
		{ name: "floorLampLight", x: lampX, y: F + 0.95, z: lampZ, intensity: 6.5 },
		{ name: "alcoveLamp", x: ax, y: F + 1.66, z: az + 0.06, intensity: 2.4, range: 3.0 },
	];

	return { meshes: built, lamps };
}

/**
 * The store room behind the back wall: its plaster skin, its floor, what stands in it, and its lamp.
 *
 * `inside` is the hollow the shell leaves, in metres (see `storeIn` in `villa.js`); the hole the
 * doorway is made through that wall is `storeDoor`, there. Returns `{ meshes, lamps }` the way
 * `fitRoom` does, for the same reason: the meshes are what the lamp is allowed to light and what the
 * sky is not.
 *
 * Why anything stands in here at all: a doorway with nothing behind it is a black rectangle, and a
 * black rectangle at the end of a lit front reads as a hole punched in the house — which is the fault
 * the two side windows had when they were stood in a line and made "a bright hole where the room
 * should be". What makes an opening read as a SPACE is a floor you can see, a wall the light falls
 * on, and something with a shape standing in front of both.
 *
 * What the start view actually gets, through 1.4 m of doorway from fourteen metres out, measured
 * against the doorway's own edges: a wedge of the lit back wall from the floor (0.6) up to 2.93, a
 * strip of the floor, and nothing of the ceiling — the eye at 1.74 is under the lintel, so everything
 * above the line the lintel cuts is wall. Every surface that matters here is therefore a VERTICAL
 * face: a board laid across at shoulder height is seen so near edge-on that it is a line, and the
 * things on it would float. So the big pot stands on the floor and the shelf is low and behind them.
 */
export function fitStoreRoom(scene, mats, { inside, window: win }) {
	const built = [];
	const add = (...meshes) => {
		built.push(...meshes);
		return meshes;
	};

	const skin = 0.05; // the same plaster skin the room's walls wear
	const F = inside.y0; // the floor's top, level with the room's
	const cx = (inside.x0 + inside.x1) / 2;
	const z0 = inside.z0 + skin; // the face of the plaster a visitor looks at
	const fz1 = -11.8; // where the room's own teak floor begins: the two meet under the doorway

	// The floor runs north under the doorway and up to the plaster, so the two floors read as one
	// floor with a wall going through it, which is what they are.
	const floor = box(scene, "storeFloor", {
		x: inside.x1 - inside.x0,
		y: 0.1,
		z: fz1 - inside.z0,
		px: cx,
		py: F - 0.05,
		pz: (inside.z0 + fz1) / 2,
		mat: mats.teakWall,
	});
	floor.checkCollisions = true;
	add(floor);

	// Three walls of plaster, a ceiling, and a hole in the back wall for the window the villa.js cuts.
	// The ceiling is new: the eye that looks through the doorway never gets high enough to see over the
	// lintel, so for as long as the room was only looked at from inside the house a skin over the cement
	// roof was a mesh for nobody. Now the room has a band of glass high in its back wall, and a visitor
	// on the lawn behind the house looks UP through it: every ray that passes that band is rising, and
	// the first thing it meets is the underside of the roof — bare cement, lit by no lamp in this file,
	// and drawn black. Lined and lit, that same band of glass shows the lit ceiling of a room.
	//
	// The lining's hole is the window's own, and not a hair smaller: two holes 5 cm apart on one sight
	// line is a step in the reveal, and a step that catches the light at one edge and not the other.
	const northLining = win
		? zWallWithOpenings(scene, "storeLining", {
			z: inside.z0 + skin / 2,
			thickness: skin,
			x0: inside.x0,
			x1: inside.x1,
			y0: F,
			y1: inside.y1,
			openings: [win],
			mat: mats.interiorPlaster,
			collide: false,
		})
		: [box(scene, "storeLiningNorth", { x: inside.x1 - inside.x0, y: inside.y1 - F, z: skin, px: (inside.x0 + inside.x1) / 2, py: (F + inside.y1) / 2, pz: inside.z0 + skin / 2, mat: mats.interiorPlaster })];
	add(
		...northLining,
		box(scene, "storeLiningCeiling", { x: inside.x1 - inside.x0, y: skin, z: inside.z1 - inside.z0, px: cx, py: inside.y1 - skin / 2, pz: (inside.z0 + inside.z1) / 2, mat: mats.interiorPlaster }),
		box(scene, "storeLiningWest", { x: skin, y: inside.y1 - F, z: inside.z1 - z0, px: inside.x0 + skin / 2, py: (F + inside.y1) / 2, pz: (z0 + inside.z1) / 2, mat: mats.interiorPlaster }),
		box(scene, "storeLiningEast", { x: skin, y: inside.y1 - F, z: inside.z1 - z0, px: inside.x1 - skin / 2, py: (F + inside.y1) / 2, pz: (z0 + inside.z1) / 2, mat: mats.interiorPlaster }),
	);

	// A pot on the floor, left of the middle, and a crate on it to the right: two vertical faces, one
	// warm clay and one timber, either side of the lamp's cone. The jar is the taller of the two
	// because the doorway is a tall narrow slot and a tall thing in it is read as a thing.
	add(
		cylinder(scene, "storeJar", { diameter: 0.46, diameterTop: 0.24, height: 0.72, tessellation: 12, px: cx - 0.62, py: F + 0.36, pz: z0 + 0.45, mat: mats.pot }),
		box(scene, "storeCrate", { x: 0.62, y: 0.44, z: 0.5, px: cx + 0.66, py: F + 0.22, pz: z0 + 0.4, mat: mats.wood }),
	);

	// The shelf, low and behind them against the wall, carrying two small things: the shelf itself is
	// near edge-on from where a visitor stands and reads as a line, which is all a shelf edge can do at
	// fourteen metres, but it puts a join across a big plain stretch of lit plaster and it gives the
	// bowl and the small jar a place to be.
	const shelfY = F + 0.92;
	add(
		box(scene, "storeShelf", { x: 1.9, y: 0.06, z: 0.42, px: cx, py: shelfY, pz: z0 + 0.24, mat: mats.wood }),
		sphere(scene, "storeBowl", { diameter: 0.34, diameterY: 0.17, segments: 10, px: cx - 0.5, py: shelfY + 0.115, pz: z0 + 0.24, mat: mats.brass }),
		cylinder(scene, "storePot", { diameter: 0.22, diameterTop: 0.13, height: 0.34, tessellation: 10, px: cx + 0.48, py: shelfY + 0.2, pz: z0 + 0.26, mat: mats.pot }),
	);

	// The lamp: a lantern hanging in the middle of the room, not a case against the wall. That is
	// where a light in a room this small goes, and it matters for what a visitor sees through the
	// doorway: hung in the middle, every surface in here is between 0.4 m and 2.2 m from it, and the
	// floor and the two pots come out lit as well as the wall. Against the wall it lit a patch of
	// plaster and left the bottom of the doorway black, which is a lamp you look AT and not a room.
	// The lantern itself is the brightest thing in the opening, and that is where the eye should go.
	const lampZ = z0 + 0.78;
	const lampY = F + 1.45;
	add(
		cylinder(scene, "storeLampRod", { diameter: 0.04, height: inside.y1 - lampY - 0.17, tessellation: 6, px: cx, py: (lampY + 0.17 + inside.y1) / 2, pz: lampZ, mat: mats.darkMetal }),
		box(scene, "storeLamp", { x: 0.3, y: 0.34, z: 0.3, px: cx, py: lampY, pz: lampZ, mat: mats.interiorGlow }),
	);

	for (const mesh of built) mesh.receiveShadows = true;

	// The strength is written as a ratio of the room's own lamps, which are 20: a hanging lamp in a
	// room 2.4 x 1.7 m stands a great deal closer to everything in it than the pair over the hall, so
	// it needs a fifth of them to fill it. Measured from where a visitor starts, with the glass in the
	// way, this leaves the lit plaster at L146 to L157 and the lantern itself at L188, against the
	// room's dark back plaster at L82 and the alcove's lit back at L112 — the brightest thing behind
	// the glass, which is the point — and still under the sunlit coping at L211, so the front does not
	// read as a shop window with the ceiling lights on. The jar and the crate come out at L73, dark
	// against the lit wall, which is how a room with things in it looks.
	const lamps = [{ name: "storeLampLight", x: cx, y: lampY - 0.08, z: lampZ, intensity: 4.2, range: 6 }];
	// A second lamp, high against the back wall, and only there because of the window band.
	//
	// Why it is wanted: the room's face on the lawn behind the house is 3.2 x 3.4 m of plain cement, and
	// when the band of glass was first cut it read for nothing — at 5.9 m the pane came out of Chromium at
	// L95 and the cement beside it at L93. What shows through that glass is the room's ceiling, and the
	// lantern 1.34 m below it gives a ceiling only L93, which is the same light the wall outside is
	// already standing in. A window with nothing brighter behind it than the wall around it is a hole, not
	// a light.
	//
	// Why it is a lamp and not a cool wash standing in for the sky: a cool wash was tried, and at the
	// strength that showed through the glass it painted the pane (147,142,131) — a flat grey in a Villa
	// whose whole argument is that a picture is not supposed to be grey. A lamp gives the pane L150 at
	// about (163,140,104), which is a lit room, and you can see the thing itself through the glass: a
	// shelf lamp fixed high under the ceiling, the way a store room's light is fixed where the goods
	// can see it.
	if (win) {
		// Over the shelf's east end, and not over its middle: the mullion stands in the middle of the
		// window band, and a lamp hung behind a mullion is a lamp nobody sees.
		const wlampX = win.x1 - 0.3;
		const wlampZ = inside.z0 + 0.4;
		add(
			box(scene, "storeShelfLampPlate", { x: 0.34, y: 0.04, z: 0.3, px: wlampX, py: inside.y1 - 0.17, pz: wlampZ, mat: mats.darkMetal }),
			box(scene, "storeShelfLamp", { x: 0.3, y: 0.14, z: 0.26, px: wlampX, py: inside.y1 - 0.26, pz: wlampZ, mat: mats.interiorGlow }),
		);
		lamps.push({
			name: "storeShelfLampLight",
			x: wlampX,
			y: inside.y1 - 0.34,
			z: wlampZ,
			intensity: 5.5,
			range: 3.5,
		});
	}

	return { meshes: built, lamps };
}
