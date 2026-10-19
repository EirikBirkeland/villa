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
//
// THE BILL. It used to be a cone, which is the shape of a party hat and not of a duck's mouth: a cone is
// round in section, it is widest where it joins the face, and it dies in a point. Every bath toy knows
// better than that — a moulded bill is broad, flat, and the same girth nearly all the way along, with a
// moulded mouth line on each cheek and a rounded end. So the bill is drawn station by station rather than
// extruded: see `BILL` and `billPiece` at the foot of this file.
//
// Two faults were found by looking and are now written into the numbers, so nobody has to find them twice.
// A deep mouth line does not read as a mouth line: cut at 1.4 mm it goes dark and wide and the duck has a
// gap instead of a bill. And a bill tilted down over much shows the visitor its underside from the coping,
// which is the same gap in another form.

import { sphere, poly } from "./mesh.js";
import { along } from "./loft.js";

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
	// The head: a ball at the neck's place, with the bill drawn out of its front below. Both are big for the
	// body because a toy is drawn, not modelled, and a drawn duck has a big head. The head is lifted clear of
	// the back so there is a neck between them: sunk into the shoulder it read as one continuous loaf from
	// the start camera.
	sphere(scene, "duckHead", {
		diameter: 0.082, segments: 10,
		pz: 0.066, py: 0.09, mat: mats.duck, parent: root,
	});
	// The bill: one moulded piece, no separate parts. Where it comes out of the face: level with the eyes,
	// and sunk into the head by a centimetre so there is no seam when a visitor leans over the coping.
	const bill = billPiece(scene, "duckBeak", mats.duckBeak, {
		...BILL, stations: 20, girth: 32,
		// The moulding line along the top: a toy's bill is not a dome, it is flatter than that, and the flat
		// comes from the two halves of the mould meeting along the middle.
		ridge: [[0, 0.0012], [0.3, 0.0016], [0.7, 0.0011], [1, 0.0003]],
		// The mouth: a shallow line drawn in on each cheek, because the moulding has one and a toy bill
		// without it is a traffic cone. Shallow is the whole lesson here: cut at 1.4 mm the line went dark and
		// wide, and from the front the duck had a gap mouth with a pink tongue in it, which is a worse thing
		// than the cone (`pictures/duck-bill-gap-mouth.png`).
		furrow: [[0, 0.0002], [0.45, 0.00035], [0.8, 0.0002], [1, 0]],
		py: 0.089, pz: 0.086, parent: root,
	});
	bill.receiveShadows = false;
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

// How the bill is drawn, in metres and measured from its own middle line where it leaves the face.
//
// `t` runs its length: 0 at the face, 1 at the tip. Each of `wide`, `high`, `low` and `at` is a table of
// [t, metres] pairs read with `along` (`src/loft.js`), so the whole shape is a set of measurements and not
// a formula: `wide` how far each cheek stands out, `high` how far the top rises over the middle line,
// `low` how far the underside hangs below it, and `at` where that middle line itself goes.
//
// The numbers are those of a bath toy and not of a mallard. A moulded bill is broad — near as wide as the
// face it comes out of — thin end to end, and much the same girth nearly all the way along, so it reads as
// one flat cheerful blade to a rounded end: 45 mm across and 15 mm thick, 68 mm of it drawn of which some
// 50 mm shows clear of the face. A cone is the opposite of that in every one of those, and a cone is what
// used to be there.
const BILL = {
	length: 0.068,
	// Broad at the front and narrow where it joins the face: the widest thing about a toy's bill is in front
	// of the cheek it grows out of, not behind it, which is the number that separates a bill from a funnel.
	wide: [[0, 0.0105], [0.2, 0.0205], [0.5, 0.023], [0.72, 0.0228], [0.88, 0.019], [1, 0.0092]],
	high: [[0, 0.0058], [0.3, 0.0066], [0.66, 0.0058], [0.9, 0.004], [1, 0.0022]],
	low: [[0, 0.006], [0.34, 0.007], [0.66, 0.0058], [0.9, 0.0038], [1, 0.002]],
	// Level. A toy's bill points where the face points and does not sag: a drooping bill is a sick duck, and
	// a sagging underside is what shows a visitor the underside of it from the coping.
	at: [[0, 0.0005], [0.6, 0.0002], [1, 0.0002]],
};

/**
 * The bill, lofted: a section drawn at each station along the length, and the skin stretched between the
 * neighbouring sections. This is how the koi and the shark are made (`src/loft.js`), and for the same
 * reason — only a drawing that changes station by station makes a shape that is flat one way, rounded the
 * other and rounded off at the end, which is what a moulded bill is.
 *
 * The section is a squashed oval — `wide` across, `high` above the middle line and `low` below it — and
 * `square` says how squared off it is: 2 is a plain ellipse, and a toy's bill wants about 3, because a
 * moulded bill has flat sides and a flattish top with a firm rounded corner where the two meet, and an
 * ellipse has none of those. `girth` is the points in each section and must divide by four, so one point
 * falls at the top, one at the bottom and one on each cheek: the cheek points are where the mouth line is
 * cut.
 *
 * Two things are then carved out of the section as it is drawn: `ridge` lifts the middle of the top, which
 * is where the two halves of the mould meet; and `furrow` nicks each cheek in along a soft line, which is
 * the mouth. The furrow is a GROOVE and not a notch — a nick that reaches only the one point of the section
 * cuts a V, and a V at each cheek reads from the front as a pair of hooks.
 *
 * Both ends are closed with a fan; the front one is drawn out past the last section and down by `hook`, so
 * the end of the bill is a moulded round end and not a cut tube.
 */
function billPiece(scene, name, mat, {
	length, stations = 18, girth = 24, square = 3.1,
	wide, high, low, at, ridge = 0, furrow = 0, hook = 0.0002,
	px = 0, py = 0, pz = 0, parent = null,
}) {
	const read = (v, t) => (typeof v === "number" ? v : along(v, t));
	const e = 2 / square;
	const rows = Math.max(2, Math.round(stations));
	const positions = [];
	const uvs = [];
	const indices = [];
	const ring = (t) => {
		const w = read(wide, t);
		const up = read(high, t);
		const dn = read(low, t);
		const y0 = read(at, t);
		const out = [];
		for (let j = 0; j < girth; j++) {
			// Under the bill first, then round: belly, right cheek, top, left cheek.
			const th = (j / girth) * Math.PI * 2 - Math.PI / 2;
			const cx = Math.cos(th);
			const sy = Math.sin(th);
			let x = Math.sign(cx) * Math.pow(Math.abs(cx), e) * w;
			let y = Math.sign(sy) * Math.pow(Math.abs(sy), e) * (sy > 0 ? up : dn);
			// The moulding line along the top, and nowhere else.
			if (sy > 0) y += read(ridge, t) * Math.pow(Math.max(0, 1 - (x / w) * (x / w)), 1.6);
			out.push([x, y0 + y]);
		}
		// The mouth line, taken off each cheek and faded out along the cheek either side of it, so it is a
		// groove and not a notch: a nick that reaches only the one point of the section cuts a V, and a V at
		// each cheek reads from the front of the duck as a pair of hooks.
		const nick = read(furrow, t);
		if (nick) {
			for (const cheek of [girth / 4, girth * 0.75]) {
				for (let d = -3; d <= 3; d++) {
					const p = out[(cheek + d + girth) % girth];
					const bell = 0.5 * (1 + Math.cos((d / 3.5) * Math.PI));
					p[0] -= Math.sign(p[0]) * nick * bell;
				}
			}
		}
		return out;
	};
	for (let i = 0; i <= rows; i++) {
		const t = i / rows;
		const r = ring(t);
		const z = t * length;
		for (let j = 0; j < girth; j++) {
			positions.push(r[j][0], r[j][1], z);
			uvs.push(t, j / girth);
		}
	}
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < girth; j++) {
			const a = i * girth + j;
			const b = i * girth + ((j + 1) % girth);
			const c = (i + 1) * girth + j;
			const d = (i + 1) * girth + ((j + 1) % girth);
			indices.push(a, b, c, b, d, c);
		}
	}
	// The back end is inside the head and is closed anyway; the front one is drawn out past the last
	// section, and a little below it, so the end of the bill is a moulded round end and not a cut tube.
	for (const forward of [false, true]) {
		const i = forward ? rows : 0;
		const t = i / rows;
		const centre = positions.length / 3;
		positions.push(0, read(at, t) - (forward ? hook : 0), t * length + (forward ? read(wide, t) * 0.55 : 0));
		uvs.push(t, 0.5);
		for (let j = 0; j < girth; j++) {
			const a = i * girth + j;
			const b = i * girth + ((j + 1) % girth);
			if (forward) indices.push(a, b, centre);
			else indices.push(a, centre, b);
		}
	}
	const mesh = poly(scene, name, { positions, indices, uvs, mat, parent });
	mesh.position.set(px, py, pz);
	return mesh;
}
