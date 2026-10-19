// The shark: a small, very bad-tempered shark that lives in the swimming pool.
//
// WHY IT IS HERE. The pool has had water, tile, light and a toy duck in it, and every one of those is
// architecture or furniture: nothing in the basin ever objected to being looked at. The master asked for a
// small shark that bites when you come too close, and it is a better addition than it sounds — a shark is
// the one animal that turns a pool from a surface into a place with a resident in it, and the fear it works
// on is the ordinary one: you are standing at the edge with your toes over the water and something under
// the water has noticed.
//
// ONE, and SMALL. A metre, give or take a hand. Anything longer is a whale in a ten-metre pool and anything
// shorter is a fish you have to be told about. It is the size of a bull shark with a year behind it: fat
// head, blunt nose, a dorsal like a knife, and a mouth that is far too big for its face, which is what
// "small but very scary" actually looks like.
//
// THE SAME RULE THE OTHER LIVING THINGS LIVE BY: it has to be FOUND (`src/koi.js` puts the argument at
// length). For a shark that is easy in one way and hard in the rest:
//
//   THE FIN    it cruises with its dorsal cutting the surface about half the time, which is the shape of a
//              shark in any picture ever taken at a poolside, and the only under-water signal that reads
//              from the far side of the garden. The fin's height above the back is measured so that it shows
//              when the animal is shallower than 14 cm and vanishes when it goes deeper: the fin going DOWN
//              is the tell that something is coming, and a shark that stays visible has nothing to say.
//   IT COMES   not at you — it is not a dog — but to the edge you are standing at, and it decides about it:
//              it notices within four metres, drops deep and turns to face you, holds a moment, and then
//              throws itself at the water's edge where your boots are. Three beats — seen, gone, bitten —
//              and the gone is the part that does the work.
//   IT LEAVES A MARK a bite throws rings out from the edge, and blood (`src/blood.js`) rolls out under the
//              surface from where your feet were. The visitor cannot be hurt: there is no health in this
//              Villa and no intention of any. What a bite costs is a knock, a red ring at the edges of the
//              sight, and a pool that takes half a minute to clear.
//
// HOW THE BODY IS BUILT. The same loft as the koi (`src/loft.js`): rings of stations down the length with
// the girth read off three tables, cut into four meshes on a chain of nodes so a bend can travel backwards
// down the animal. On top of that, what a fish does not need: a head on a hinge of its own, a lower jaw on a
// hinge of its own, a dozen teeth, and a dark gullet behind them so that an open mouth is a hole in the
// animal and not a hole in the drawing.
//
// The head and jaw both throw when the animal bites: a shark does not just open its mouth, it lifts its
// snout and brings the whole front of itself up and over, which is why the head node is turned as well as the
// jaw node. The teeth are cones, three a side in each jaw, alternating long and longer, tilted back into the
// throat because teeth that point forwards are for pushing food out.

import { sphere, cylinder, poly } from "./mesh.js";
import { along, loft, fin } from "./loft.js";
import { randomGenerator } from "./noise.js";
import { buildBlood } from "./blood.js";

const { TransformNode } = BABYLON;

/**
 * The animal: how long, how thick, and how it behaves.
 *
 * `long` is from snout tip to the root of the tail; the tail itself adds another fifth. Everything else is
 * a fraction of it, so the whole shark can be re-scaled in one place, and every distance below that is
 * written in metres was worked out from THIS length — change it and the bite reach has to be looked at again.
 */
const SPEC = {
	long: 1.02,
	// Measured off the animal's own bounding box in the running Villa, and not off a picture: through the middle
	// it is about 0.26 m broad against 0.19 m from back to belly, which is the bull shark's own three to four.
	// The first guess here was 0.24 and a note called the animal thin, which sent me up to 0.30 — one and six
	// to one, a barrel. The measure, not the eye, is what caught it.
	wide: 0.26,
	deep: 0.19,
	speed: 0.55,
	// How far from your boots the snout has to be for the bite to land on you rather than short of you.
	reach: 0.85,
	// How close you have to be before it starts coming at all.
	close: 1.6,
	near: 4.2,
};

// The girth tables, read at `t`: 0 is the tail tip and 1 is the snout. `flank` is a fraction of the full
// WIDTH and the other two fractions of the full DEPTH, so a ring is half(flank*wide) out each side, up by
// dorsal*deep and down by belly*deep from the animal's own axis.
//
// A shark is widest over the pectorals (t about 0.66), and the head is a wedge laid on top of that: broad
// at the cheeks and coming down to a blunt nose. The tail's stalk is narrow on purpose — a big tail on a
// thick stalk is a bar of soap, and the thin part is what whips.
const FLANK = [
	[0, 0.05], [0.1, 0.1], [0.24, 0.2], [0.4, 0.38], [0.54, 0.47], [0.66, 0.5],
	[0.76, 0.46], [0.84, 0.4], [0.9, 0.33], [0.95, 0.22], [1, 0.06],
];
const DORSAL = [
	[0, 0.1], [0.14, 0.26], [0.3, 0.4], [0.46, 0.48], [0.6, 0.48], [0.72, 0.46],
	[0.8, 0.44], [0.86, 0.4], [0.92, 0.3], [0.97, 0.18], [1, 0.05],
];
const BELLY = [
	[0, 0.1], [0.14, 0.28], [0.3, 0.42], [0.46, 0.5], [0.6, 0.5], [0.72, 0.46],
	[0.8, 0.42], [0.86, 0.36], [0.92, 0.24], [0.97, 0.13], [1, 0.05],
];

// The gullet: what the mouth window looks in on. A tube inside the head, dark as the inside of a mouth is
// dark, and big enough that no gap between the two jaws can be looked through to the other side. Its own
// tables are only a soft version of the head's: it is the head minus a skin's thickness, and it does not need
// to be exact because you never see more than a handful of centimetres of it at a time.
//
// SOFTER THAN THE HEAD ON PURPOSE, and by more than looks comfortable. A tube the size of the head fills its
// own window, and a sight looking down the window — which is exactly what a visitor at the coping does while
// the animal is nose-up — sees the tube's face straight on, lit, and round: a red ball where a throat should
// be. The first numbers here were 0.46 and 0.42 and that is what they made. Kept a hand narrower than the
// skin so the opening has a lip all round it and the dark sits BEHIND the face instead of on top of it.
const GULLET_FLANK = [
	[0, 0.36], [0.5, 0.32], [1, 0.11],
];
const GULLET_DORSAL = [
	[0, 0.42], [0.5, 0.38], [1, 0.2],
];
const GULLET_BELLY = [
	[0, 0.42], [0.5, 0.36], [1, 0.16],
];

/** Where the back is, at station `t`, measured up from the animal's own axis. */
function backAt(t, deep) {
	return along(DORSAL, t) * deep;
}

/** Where the belly is, at station `t`, measured down from the animal's own axis. */
function bellyAt(t, deep) {
	return along(BELLY, t) * deep;
}

/** A fin worn at a node whose origin is at station `at`: turn a station into a local z. */
function zz(t, at, long) {
	return (t - at) * long;
}

/**
 * The shark.
 *
 * `pool` is the basin's plan and its manners: its rectangle, the height of its surface and its floor, how
 * to mark a disturbance on the water, and where the visitor is standing (`visitor()` hands back the
 * camera). `onBite` is called when the jaws close on the visitor, and `main.js` decides what that is worth
 * in the way of a knock and a red ring, because the shark has no business touching the camera itself.
 */
export function buildShark(scene, mats, pool, { onBite = null, seed = 19 } = {}) {
	const long = SPEC.long;
	const wide = SPEC.wide;
	const deep = SPEC.deep;
	const rand = randomGenerator(seed);

	const root = new TransformNode("shark", scene);
	// The frame: four nodes down the animal, each hung off the one in front, so the bend a shark swims with
	// runs backwards down its own body instead of being dragged along behind a point.
	const fore = new TransformNode("sharkFore", scene);
	fore.parent = root;
	const mid = new TransformNode("sharkMid", scene);
	mid.parent = fore;
	mid.position.z = (0.3 - 0.6) * long;
	const rear = new TransformNode("sharkRear", scene);
	rear.parent = mid;
	rear.position.z = (0.06 - 0.3) * long;
	const tailNode = new TransformNode("sharkTail", scene);
	tailNode.parent = rear;
	tailNode.position.z = (0 - 0.06) * long;
	// The head is on a node of its own, behind the mouth: when the animal bites it lifts its whole front end,
	// and a snout that stays level while the jaw drops is a fish yawning.
	const head = new TransformNode("sharkHead", scene);
	head.parent = fore;
	head.position.z = (0.86 - 0.6) * long;
	// The jaw hinge: at the head's own origin, which is at the back of the mouth where a jaw's hinge actually
	// is. Everything below is written in the head's metres and turns about this point.
	const jaw = new TransformNode("sharkJaw", scene);
	jaw.parent = head;

	// The four lengths of body. Each one starts at its own node's station and hangs forwards from there, and
	// each overlaps the one in front: two tubes meeting at a bend leave a notch, and the notch is where the
	// animal bends hardest.
	const sections = [
		loft(scene, "sharkFore", mats.sharkSkin, { long, wide, deep, from: 0.6, to: 0.87, flank: FLANK, dorsal: DORSAL, belly: BELLY, rings: 30, girth: 13 }),
		loft(scene, "sharkMid", mats.sharkSkin, { long, wide, deep, from: 0.3, to: 0.62, flank: FLANK, dorsal: DORSAL, belly: BELLY, rings: 30, girth: 13 }),
		loft(scene, "sharkRear", mats.sharkSkin, { long, wide, deep, from: 0.04, to: 0.32, flank: FLANK, dorsal: DORSAL, belly: BELLY, rings: 30, girth: 13 }),
	];
	sections[0].parent = fore;
	sections[1].parent = mid;
	sections[2].parent = rear;

	// ---- the mouth ---------------------------------------------------------------
	//
	// A mouth is a HOLE in an animal, so the head is built with one: `loft`'s `cut` takes a window of ring
	// stations out of the underside of the snout and the skin simply is not there. What the window reveals is
	// the gullet (a dark tube inside the head) and the top of the jaw, and when the jaw drops the window
	// widens and the animal is suddenly all teeth and throat. Anything less than this is a mouth painted on a
	// closed animal, and the first attempt here was exactly that: it read as a shark with a line drawn on it,
	// and the moment it opened up there was nothing behind the line.
	//
	// The window is three of fifteen stations wide about the belly — about 6 cm of a 24 cm head — and five of
	// the sixty rings long, and it does not reach the snout's tip: a mouth that runs off the end of the nose
	// is a split snout, and the last four centimetres of snout is what makes the front of the head read as a
	// nose at all.
	const MOUTH_FROM = 0.885;
	const MOUTH_TO = 0.952;
	const HEAD_GIRTH = 15;
	const headLoft = { long, wide, deep, from: 0.86, to: 1, flank: FLANK, dorsal: DORSAL, belly: BELLY, rings: 60, girth: HEAD_GIRTH };
	const skull = loft(scene, "sharkSkull", mats.sharkSkin, {
		...headLoft,
		cut: (t, j) => t > MOUTH_FROM && t < MOUTH_TO && (j <= 1 || j >= HEAD_GIRTH - 1),
	});
	skull.parent = head;
	// What the hole shows: a throat. Smaller than the head and set a little high in it, so its own upper wall
	// is what looks back at you out of the mouth, and dark enough that the eye reads depth and not a hole.
	const gullet = loft(scene, "sharkGullet", mats.sharkMouth, {
		long, wide: wide * 0.7, deep: deep * 0.66, from: 0.85, to: 0.995,
		flank: GULLET_FLANK, dorsal: GULLET_DORSAL, belly: GULLET_BELLY, rings: 22, girth: 11,
	});
	gullet.parent = head;
	gullet.position.y = -deep * 0.12;

	/**
	 * The jaw: a tapered bar of flesh, hung under the head.
	 *
	 * Its own little loft, and not the body's, because `loft` scales a section by a sine — right for a body,
	 * which is a tube, and wrong for a jaw, which is a U of bone with a flat top and a rounded chin. So each
	 * station here says its own three numbers: how wide, how high its top is, and how low its chin hangs, all
	 * read off the head's own underside so the two match the length of the mouth.
	 *
	 * Closed, the jaw's top lies THREE millimetres under the head's underside and its edges are inside the
	 * mouth window, so what a visitor sees is a dark seam — a shut mouth — and nothing else. Open, the front
	 * of it drops seven centimetres and the seam becomes a gape.
	 */
	const jawTop = (t) => -bellyAt(t, deep) - 0.003;
	const jawChin = (t) => -bellyAt(t, deep) - 0.029;
	const jawHalf = (t) => along(FLANK, t) * wide * 0.55;
	const jawLoft = (() => {
		const stations = [];
		for (let i = 0; i <= 12; i++) {
			const t = 0.855 + (i / 12) * (0.99 - 0.855);
			const half = jawHalf(t);
			const top = jawTop(t);
			const chin = jawChin(t);
			const mid = (top + chin) / 2;
			// Six points round: left flank, left shoulder, crown, right shoulder, right flank, chin. The crown
			// stands 5 mm above the top line so the jaw buries itself in the head and cannot open a seam.
			stations.push([
				[-half, mid], [-half * 0.82, top], [0, top + 0.005], [half * 0.82, top], [half, mid], [0, chin],
			]);
		}
		const positions = [];
		const uvs = [];
		const indices = [];
		const sides = 6;
		stations.forEach((ring, i) => {
			const t = 0.855 + (i / 12) * (0.99 - 0.855);
			ring.forEach(([x, y], j) => {
				positions.push(x, y, (t - 0.86) * long);
				uvs.push(t, j / sides);
			});
		});
		for (let i = 0; i < stations.length - 1; i++) {
			for (let j = 0; j < sides; j++) {
				const a = i * sides + j;
				const b = i * sides + ((j + 1) % sides);
				const c = (i + 1) * sides + j;
				const d = (i + 1) * sides + ((j + 1) % sides);
				indices.push(a, b, c, b, d, c);
			}
		}
		// Both ends capped with a fan to a point on the axis: the back end seals the throat and the front is
		// the jaw's tip, which has to be solid or it is a hollow beak.
		for (const end of ["start", "end"]) {
			const base = end === "start" ? 0 : (stations.length - 1) * sides;
			const t = end === "start" ? 0.855 : 0.99;
			const centre = positions.length / 3;
			positions.push(0, (jawTop(t) + jawChin(t)) / 2, (t - 0.86) * long);
			uvs.push(t, 0.5);
			for (let j = 0; j < sides; j++) {
				const a = base + j;
				const b = base + ((j + 1) % sides);
				if (end === "end") indices.push(a, b, centre);
				else indices.push(a, centre, b);
			}
		}
		const mesh = poly(scene, "sharkJawBody", { positions, indices, uvs, mat: mats.sharkSkin });
		mesh.parent = jaw;
		return mesh;
	})();

	// The dorsal: a knife-blade standing over the pectorals, its leading edge swept back and its tip behind
	// the middle. The base edge is sunk two centimetres into the back so it cannot open a seam along itself
	// when the animal bends.
	fin(scene, "sharkDorsal", mats.sharkFin, [
		{ a: [zz(0.78, 0.6, long), backAt(0.78, deep) - 0.004], b: [zz(0.78, 0.6, long), backAt(0.78, deep) - 0.022] },
		{ a: [zz(0.73, 0.6, long), backAt(0.73, deep) + 0.1], b: [zz(0.73, 0.6, long), backAt(0.73, deep) - 0.022] },
		{ a: [zz(0.66, 0.6, long), backAt(0.66, deep) + 0.145], b: [zz(0.66, 0.6, long), backAt(0.66, deep) - 0.022] },
		{ a: [zz(0.58, 0.6, long), backAt(0.58, deep) + 0.112], b: [zz(0.58, 0.6, long), backAt(0.58, deep) - 0.022] },
		{ a: [zz(0.5, 0.6, long), backAt(0.5, deep) + 0.018], b: [zz(0.5, 0.6, long), backAt(0.5, deep) - 0.022] },
	]).parent = fore;

	// The tail: two lobes on a stalk, the upper one the longer, which is what a shark's tail is and what
	// makes the wake behind it read as a shark's and not a dolphin's.
	fin(scene, "sharkCaudal", mats.sharkFin, [
		{ a: [zz(0.04, 0, long), 0.018], b: [zz(0.04, 0, long), -0.018] },
		{ a: [zz(-0.04, 0, long), 0.128], b: [zz(-0.04, 0, long), -0.082] },
		{ a: [zz(-0.12, 0, long), 0.182], b: [zz(-0.12, 0, long), -0.112] },
		{ a: [zz(-0.15, 0, long), 0.146], b: [zz(-0.15, 0, long), -0.086] },
	]).parent = tailNode;

	// The pectorals: a wing each side, set low and behind the head, swept back so they read as fins and not
	// as arms. A shark holds them out and still, using them the way an aeroplane uses ailerons; they do not
	// row, and the koi's paddling is not copied here.
	for (const side of [1, -1]) {
		const reach = 0.155;
		const node = new TransformNode(`sharkPec${side}`, scene);
		node.parent = fore;
		node.position.set(side * along(FLANK, 0.72) * wide, -deep * 0.26, zz(0.74, 0.6, long));
		node.rotation.y = side * 0.2;
		fin(scene, `sharkPecFin${side}`, mats.sharkFin, [
			{ a: [0.03 * long, 0], b: [-0.01 * long, 0] },
			{ a: [0.01 * long, side * reach * 0.45], b: [-0.05 * long, side * reach * 0.45] },
			{ a: [-0.03 * long, side * reach * 0.85], b: [-0.09 * long, side * reach * 0.85] },
			{ a: [-0.07 * long, side * reach], b: [-0.12 * long, side * reach] },
		], "x").parent = node;
	}
	// The pelvics and the anal: small, and there for the silhouette. A shark seen from below is a cross of
	// four fins and a tail, and leave three of them out and it is a torpedo.
	for (const side of [1, -1]) {
		const node = new TransformNode(`sharkPelvic${side}`, scene);
		node.parent = mid;
		node.position.set(side * along(FLANK, 0.42) * wide * 0.7, -bellyAt(0.42, deep) + 0.006, zz(0.42, 0.3, long));
		fin(scene, `sharkPelvicFin${side}`, mats.sharkFin, [
			{ a: [0.02 * long, 0], b: [0, 0] },
			{ a: [0, side * 0.055 * long], b: [-0.05 * long, side * 0.055 * long] },
			{ a: [-0.03 * long, side * 0.075 * long], b: [-0.075 * long, side * 0.075 * long] },
		], "x").parent = node;
	}
	fin(scene, "sharkAnal", mats.sharkFin, [
		{ a: [zz(0.24, 0.3, long), -bellyAt(0.24, deep) + 0.004], b: [zz(0.24, 0.3, long), -bellyAt(0.24, deep) - 0.004] },
		{ a: [zz(0.18, 0.3, long), -bellyAt(0.18, deep) - 0.038], b: [zz(0.19, 0.3, long), -bellyAt(0.19, deep) - 0.004] },
		{ a: [zz(0.13, 0.3, long), -bellyAt(0.13, deep) - 0.008], b: [zz(0.14, 0.3, long), -bellyAt(0.14, deep) - 0.004] },
	]).parent = mid;

	// The teeth: three a side in each jaw, alternating long and longer, tilted back into the throat. They are
	// cones on stems and nothing cleverer, because at this size a tooth is two or three pixels and the only
	// job it has is to be white where the mouth is dark.
	//
	// They are placed INSIDE the mouth window and leaned along the jaw rather than stood out of it, which is
	// the whole trick of them: shut, every one of them is buried in flesh and the mouth is a dark seam; open,
	// the jaw has dropped seven centimetres and they are out and white against the throat. The first version
	// stood them on the belly's surface and a browser showed sixteen white flecks on the outside of a closed
	// shark, which is not an animal.
	const teeth = [];
	/**
	 * One row of teeth down a jaw.
	 *
	 * `place(t)` says where the tooth's own middle goes for a station along the jaw, in the jaw's local
	 * metres, and `lean` is its rotation about x: a cone stands along +y, so `Math.PI + 1.1` hangs it point
	 * down and tipped back into the throat, and `-0.6` stands it up and tipped back.
	 */
	function row({ name, parent, place, lean, first, step, count, base }) {
		for (let side = 1; side >= -1; side -= 2) {
			for (let i = 0; i < count; i++) {
				const t = first + i * step;
				const height = base * (i % 2 === 0 ? 1 : 0.7);
				const at = place(t);
				teeth.push(
					cylinder(scene, `${name}${side}${i}`, {
						diameter: height * 0.46,
						diameterTop: height * 0.03,
						height,
						tessellation: 5,
						px: side * at.x,
						py: at.y,
						pz: at.z,
						rx: lean,
						mat: mats.sharkTooth,
						parent,
					}),
				);
			}
		}
	}
	// Upper row: hung from the underside of the skull inside the window, about two thirds of the way out to
	// its edge, so they stand in the gap and not in the flesh of the cheek.
	row({
		name: "sharkToothUp",
		parent: head,
		lean: Math.PI + 0.9,
		first: MOUTH_FROM + 0.008,
		step: 0.021,
		count: 3,
		base: 0.021,
		place: (t) => ({
			x: along(FLANK, t) * wide * 0.3,
			y: -bellyAt(t, deep) - 0.001,
			z: (t - 0.86) * long,
		}),
	});
	// Lower row: out of the jaw's top surface, and these are the ones that show first when it starts to open.
	row({
		name: "sharkToothLo",
		parent: jaw,
		lean: -0.6,
		first: MOUTH_FROM + 0.006,
		step: 0.021,
		count: 3,
		base: 0.015,
		place: (t) => ({
			x: jawHalf(t) * 0.6,
			y: jawTop(t) + 0.002,
			z: (t - 0.86) * long,
		}),
	});

	// The eyes: two black beads, low and wide behind the snout. High on the crown they catch the sky and
	// come back as two bright coins, and a shark with two bright coins for eyes is a cartoon.
	for (const side of [1, -1]) {
		sphere(scene, `sharkEye${side}`, {
			diameter: 0.026, segments: 8,
			px: side * along(FLANK, 0.9) * wide * 0.98,
			py: -deep * 0.02,
			pz: (0.9 - 0.86) * long,
			mat: mats.sharkEye,
			parent: head,
		});
	}

	// Where the snout's tip is, so a bite can be aimed and painted from the same place.
	const snout = new TransformNode("sharkSnout", scene);
	snout.parent = head;
	snout.position.set(0, -bellyAt(1, deep) * 0.5, (1 - 0.86) * long);

	const blood = buildBlood(scene, mats, pool);

	const s = {
		root,
		fore,
		mid,
		rear,
		tailNode,
		head,
		jaw,
		jawMesh: jawLoft,
		snout,
		blood,
		long,
		rand,
		pool,
		onBite,
		// Where it is and where it means to get to, in metres of the pool.
		x: (pool.x0 + pool.x1) / 2,
		z: (pool.z0 + pool.z1) / 2,
		yaw: rand() * Math.PI * 2,
		target: { x: (pool.x0 + pool.x1) / 2, z: (pool.z0 + pool.z1) / 2 },
		// How far under the surface its BACK lies. `depth` under 0.145 is where the dorsal shows above the
		// water, and that number is the fin's own height and not a knob: see the dorsal's stations above.
		depth: 0.2,
		wantDepth: 0.2,
		speed: SPEC.speed,
		going: SPEC.speed,
		state: "cruise",
		left: 1 + rand() * 2,
		phase: rand() * 6,
		turn: 0,
		open: 0,
		wantOpen: 0,
		cooldown: 2 + rand() * 3,
		wakeLeft: rand(),
		bites: 0,
		knocks: 0,
	};

	return {
		shark: s,
		blood,
		get state() {
			return s.state;
		},
		animate(time, delta) {
			prowl(s, time, delta);
			// The blood belongs to the animal that spills it, so it is wound here: a spill that is never given a
			// delta is a lump of dye that hangs in the pool for the rest of the day at the size it had when it
			// left the wound.
			blood.animate(time, delta);
		},
	};

	/** Everything the animal does with the water and the visitor, in one place. */
	function prowl(s, time, delta) {
		const p = pool;
		const cam = p.visitor ? p.visitor() : null;
		// The boots, not the eyes: a person leaning over the water is closer with their feet than with their
		// head, and it is the feet that get bitten.
		const feet = cam ? { x: cam.x, y: cam.y - 1.6, z: cam.z } : null;
		const near = feet ? Math.hypot(feet.x - s.x, feet.z - s.z) : Infinity;

		s.cooldown -= delta;
		s.left -= delta;

		if (s.state === "cruise") {
			if (near < SPEC.near && s.cooldown <= 0) {
				// It has noticed you. The first thing it does is go DOWN and turn to face you, which is the
				// middle beat of the three: the fin that was cutting the surface is not there any more, and
				// that is when a person at the edge looks harder.
				s.state = "coil";
				s.left = 0.8 + s.rand() * 0.7;
				s.wantDepth = 0.3 + s.rand() * 0.16;
				s.going = SPEC.speed * 0.5;
				s.target = edge(p, feet.x, feet.z, 0.9);
			} else if (s.left <= 0) {
				s.target = inside(p, p.cx + (s.rand() - 0.5) * (p.x1 - p.x0 - 1.2), p.cz + (s.rand() - 0.5) * (p.z1 - p.z0 - 1.2));
				// Half the time shallow enough to show a fin, the rest down where the light is thinner. The
				// fin is the whole of the warning, so it is spent about half the time and not always.
				s.wantDepth = s.rand() < 0.5 ? 0.05 + s.rand() * 0.09 : 0.34 + s.rand() * 0.6;
				s.going = SPEC.speed * (0.6 + s.rand() * 0.8);
				s.left = 2.4 + s.rand() * 4;
			}
		} else if (s.state === "coil") {
			if (feet) s.target = edge(p, feet.x, feet.z, 0.85);
			s.wantOpen = 0.1;
			if (s.left <= 0) {
				if (near < SPEC.close) {
					s.state = "lunge";
					s.left = 1.1;
					s.going = 2.3;
					s.wantDepth = -0.06;
				} else {
					// It came, you were not close enough, and it has lost interest. This is the whole of the
					// difference between a monster and an animal: the strike is a decision and not a routine.
					s.state = "cruise";
					s.left = 1.6 + s.rand() * 2;
					s.wantOpen = 0;
					s.cooldown = 1.6 + s.rand() * 2.4;
					s.wantDepth = 0.24 + s.rand() * 0.3;
				}
			}
		} else if (s.state === "lunge") {
			s.wantOpen = 0.85;
			// Come up as it comes in: the snout has to clear the surface, and an animal that stays level while
			// its mouth is open is a fish yawning underwater.
			s.wantDepth = -0.11;
			if (!feet) {
				s.state = "cruise";
				s.left = 1;
				s.wantOpen = 0;
			} else {
				s.target = edge(p, feet.x, feet.z, 0.3);
				// Aim with the snout and not the middle of the body: the animal is a metre long and it is the
				// snout that arrives. The wall is three tens of a metre inside the pool's edge and the snout
				// hangs about as far forward again, so a visitor standing at the coping is within reach and a
				// visitor standing back is not — which is the difference the bite is meant to make.
				const tip = snoutWorld();
				const gap = Math.hypot(tip.x - feet.x, tip.z - feet.z);
				if (gap < SPEC.reach * 0.8 || s.left <= 0) {
					s.state = "snap";
					s.left = 0.16;
					s.wantOpen = 0;
				}
			}
			if (near > SPEC.near) {
				s.state = "cruise";
				s.left = 1.2;
				s.wantOpen = 0;
			}
		} else if (s.state === "snap") {
			// The jaws are closing; the bite is fired once, when they are nearly shut.
			if (s.left <= 0) {
				const tip = snoutWorld();
				const contact = feet ? Math.hypot(tip.x - feet.x, tip.y - feet.y, tip.z - feet.z) < SPEC.reach : false;
				strike(tip, contact ? 1 : 0.45);
				s.bites += 1;
				s.state = "sulk";
				s.left = 2.6 + s.rand() * 1.6;
				s.going = 1.1;
				s.wantDepth = 0.7 + s.rand() * 0.35;
				s.wantOpen = 0;
				s.cooldown = 8 + s.rand() * 7;
				s.target = inside(p, p.cx + (s.rand() - 0.5) * 2, p.cz + (s.rand() - 0.5) * 1.4);
			}
		} else if (s.state === "sulk") {
			s.wantOpen = 0;
			if (s.left <= 0) {
				s.state = "cruise";
				s.left = 2 + s.rand() * 3;
				s.going = SPEC.speed * (0.5 + s.rand() * 0.6);
			}
		}

		// Steer: turn towards wherever it means to get to, at a rate, and then go. A shark that changes its
		// mind in one frame is a sprite; one that leans into a turn is an animal.
		const dx = s.target.x - s.x;
		const dz = s.target.z - s.z;
		const gap = Math.hypot(dx, dz);
		let turn = 0;
		if (gap > 0.04) {
			const want = Math.atan2(dx, dz);
			let diff = want - s.yaw;
			while (diff > Math.PI) diff -= Math.PI * 2;
			while (diff < -Math.PI) diff += Math.PI * 2;
			const rate = s.state === "lunge" ? 3.4 : s.state === "coil" ? 1.6 : 1;
			turn = Math.max(-rate * delta, Math.min(rate * delta, diff));
			s.yaw += turn;
		}
		s.speed += (s.going - s.speed) * Math.min(1, delta * (s.state === "lunge" ? 7 : 2.2));
		s.x += Math.sin(s.yaw) * s.speed * delta;
		s.z += Math.cos(s.yaw) * s.speed * delta;
		// And the wall, whatever the steering wanted. Held a hand inside, because a shark with its snout in
		// the tile is a shark stuck in the tile.
		const wanted = inside(p, s.x, s.z, 0.3);
		if (wanted.x !== s.x || wanted.z !== s.z) {
			s.x = wanted.x;
			s.z = wanted.z;
			if (s.state === "lunge" || s.state === "snap") {
				// It has arrived at the wall and can go no further. Kill the drive rather than let it grind
				// along the tile, and leave its head pointing where it was aimed: an animal that reaches the
				// edge and then swings round to face the middle of the pool before it shuts its mouth is an
				// animal that does not bite, which is what the first version of this did.
				s.going = 0;
				s.target.x = s.x;
				s.target.z = s.z;
			} else {
				s.yaw = Math.atan2(p.cx - s.x, p.cz - s.z);
				s.target = inside(p, p.cx + (s.rand() - 0.5) * 2, p.cz + (s.rand() - 0.5) * 1.4);
			}
		}

		// Depth, eased: an animal has to be persuaded down and persuaded up, and one that changes depth in a
		// frame is a lift and not a fish. The lunge is the one exception and it is allowed to be quick.
		s.depth += (s.wantDepth - s.depth) * Math.min(1, delta * (s.state === "lunge" ? 6 : 1.6));
		// Never off the surface and never along the floor: the pool is a metre and a half of water and the
		// animal is twenty centimetres of animal, so there is room to keep off both.
		s.depth = Math.min(p.waterY - p.floorY - 0.3, Math.max(-0.14, s.depth));

		// The frame: the axis stands `depth` under the surface less what the back stands above it, so that
		// `depth` means the same thing however the animal is bent — and it means "how far the back is down",
		// which is the one depth that decides whether the fin shows.
		const y = p.waterY - s.depth - backAt(0.66, deep);
		root.position.set(s.x, y, s.z);
		root.rotation.y = s.yaw;
		// It banks into a turn the way a fish does, and its nose comes down or up with where it means to go.
		root.rotation.z = Math.max(-0.4, Math.min(0.4, -turn * 22));
		const pitchWant =
			s.state === "lunge" ? -0.42 : s.state === "snap" ? -0.5 : Math.max(-0.2, Math.min(0.2, (s.wantDepth - s.depth) * 0.5));
		root.rotation.x += (pitchWant - root.rotation.x) * Math.min(1, delta * (s.state === "lunge" ? 9 : 2.5));

		// The head and the jaw. The head lifts on its own during a strike (the snout goes up and over) and the
		// jaw is opened as it comes and snapped shut on the way past.
		const headWant = s.state === "lunge" || s.state === "snap" ? -0.3 : 0.02;
		head.rotation.x += (headWant - head.rotation.x) * Math.min(1, delta * 8);
		s.open += (s.wantOpen - s.open) * Math.min(1, delta * (s.wantOpen > s.open ? 9 : 26));
		jaw.rotation.x = s.open * 0.62;

		// The bend that runs backwards down the body, driven by a phase that follows the speed and not the
		// clock, so a shark going quickly beats its tail quickly and one that is resting barely moves.
		s.phase += delta * (0.9 + s.speed * 3.4) * Math.PI * 2;
		const amp = 0.5 + Math.min(1, s.speed * 1.6) * 0.7;
		fore.rotation.y = 0.035 * amp * Math.sin(s.phase);
		mid.rotation.y = 0.085 * amp * Math.sin(s.phase - 0.9);
		rear.rotation.y = 0.15 * amp * Math.sin(s.phase - 1.9);
		tailNode.rotation.y = 0.26 * amp * Math.sin(s.phase - 2.8);

		// The wake. A swell whenever the fin is really through the surface film and the animal is really
		// moving — the one thing that tells a visitor across the garden where to look — and no more than
		// about twice a second, because the basin has a handful of rings in it to spend.
		s.wakeLeft -= delta;
		if (s.depth < 0.1 && s.speed > 0.25 && s.wakeLeft <= 0 && p.splash) {
			s.wakeLeft = 0.5 + s.rand() * 0.5;
			p.splash(s.x + Math.sin(s.yaw) * long * 0.5, s.z + Math.cos(s.yaw) * long * 0.5, {
				across: 0.26, span: 1.5, show: 0.4, life: 2.6,
			});
		}
	}

	/**
	 * Where the snout's tip actually is, in metres of the garden.
	 *
	 * Asked of the world matrix and not worked out from the animal's own numbers, because by the time a bite
	 * lands the head has pitched, the jaw has dropped and the body has bent: the only honest answer is the one
	 * the renderer is about to use.
	 */
	function snoutWorld() {
		snout.computeWorldMatrix(true);
		const at = snout.getAbsolutePosition();
		return { x: at.x, y: at.y, z: at.z };
	}

	/**
	 * The bite: blood from the snout's own place, rings off the surface, and a message to whoever is
	 * watching the camera that something has just happened to them.
	 */
	function strike(at, power) {
		blood.bleed(at.x, at.y - 0.02, at.z, power);
		if (pool.splash) {
			pool.splash(at.x, at.z, { across: 0.4, span: 2.4, show: 0.75, life: 2.2 });
			pool.splash(at.x, at.z, { across: 0.14, span: 1.1, show: 0.55, life: 1.5 });
		}
		if (onBite) onBite({ power, at: { x: at.x, y: at.y, z: at.z } });
	}
}

/** How far inside the basin a shark may go: the coping overhangs a little and a nose in the tile is ugly. */
const MARGIN = 0.34;

/** A place inside the basin, `at` metres away from its walls. */
function inside(p, x, z, at = MARGIN) {
	return {
		x: Math.min(p.x1 - at, Math.max(p.x0 + at, x)),
		z: Math.min(p.z1 - at, Math.max(p.z0 + at, z)),
	};
}

/**
 * The place on the water nearest a person, `at` metres off the wall they are standing at.
 *
 * A visitor outside the pool's rectangle is clamped onto its edge, which is exactly the question being
 * asked: not "where are they" but "where is the water under them".
 */
function edge(p, x, z, at = MARGIN) {
	return inside(p, x, z, at);
}
