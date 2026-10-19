// Small geckos on the villa walls, out after dark.
//
// WHY THEY ARE HERE. The master asked for geckos on the walls — small ones, cute, sitting there and walking
// about, and making the sound they make — and asked that they be discoverable rather than obvious, which is
// exactly the right instruction and exactly the hard part. A tokay's call is the sound of every Thai house at
// ten at night; a villa that is dark and silent is a rendering, and a villa with something piping on the wall
// over there is a house somebody lives in.
//
// THE RULE THE OTHER SMALL ANIMALS LIVE BY (`src/creatures.js`): a creature has to be FOUND. For a gecko
// that is a different problem from a butterfly's, because a gecko's own camouflage is the problem — the
// animal is the colour of the wall it sits on. So:
//
//   SIZE     fifteen centimetres nose to tail-tip, which is a real house gecko and about the size of the
//            cockroach the master also asked for. Not three times over like the roach: at night there is a lamp
//            and a dark wall and the eyes do the finding.
//   LIGHT    two amber beads with a vertical slit in them and a little shine, brighter than anything else on
//            the wall. That is how a gecko is actually found at night: you do not see the animal, you see two
//            beads in the dark and then you know where the animal is. `mats.geckoEye` carries the whole of
//            this and `NOTES.md` should be believed about it until a night picture says otherwise.
//   PLACES   where a lamp reaches and where a person stands: the front of the house over the terrace, the pier
//            of wall at the end of the front glass, a side wall over a walk. Not high up under the eaves,
//            because a gecko two centimetres under the roof is a gecko in the top line of a picture and no
//            picture is looked at there.
//   AGAINST  a face the lamp is actually lighting. A gecko on a shadowed wall is a shapeless dark and the
//            eyes are the only thing that survives, which is the difference between discoverable and invisible.
//
// WHAT THEY DO. A gecko on a wall does not walk, it waits and then scuttles: three or four quick moves with a
// pause between, and then nothing for a long while. So each of these sits for a couple of seconds to as much as
// eight, then runs a short way in the wall's own plane — up, along, sideways — with a stutter in the middle of
// the run, and sits again. When a boot comes within a metre it makes for the highest place it can reach, which
// is what they do in real life and which is also the polite thing for a visitor to see: an animal that runs AWAY
// is an animal that was really there.
//
// THE SOUND is in `src/sound.js` and not here: this file only says "I am a gecko, here is where I am", at
// intervals of eight to twenty-six seconds of night, and lifts its head while the noise lasts. No sound comes
// out of a browser until the visitor has touched the page, so on a first visit they may see the beads before
// they hear anything.

import { sphere, cylinder } from "./mesh.js";
import { randomGenerator } from "./noise.js";

const { TransformNode, Vector3 } = BABYLON;

/**
 * How big, in metres nose to tail-tip. A house gecko of this climate is 12 to 16 cm; fifteen is the middle of
 * that, and it is shown as it is — no exaggeration, because the eyes and the call do the work at this size.
 */
const GECKO_CM = 15;

/** How near a boot has to be before the animal decides the wall is no longer safe. */
const SHY_M = 1.25;

/**
 * One gecko on one wall.
 *
 * `spot` is `{ x, y, z, face, seed }`: a place on the wall's face, and `face` the wall's own outward normal.
 * The animal is built lying flat in its own box — belly on its own y = 0, head toward its own +z — and the
 * mount turns that box so that its back stands out from the wall and its head points up the wall. Nothing
 * below has to know which way the wall is.
 */
function makeGecko(scene, mats, spot, tag) {
	const long = (spot.cm || GECKO_CM) / 100;
	const rand = randomGenerator((spot.seed || 7) * 31 + tag);
	const face = new Vector3(spot.face[0], spot.face[1], spot.face[2]);
	const up = new Vector3(0, 1, 0);
	// A right-handed set: with these three as the local axes, the animal's back stands off the wall and its
	// head runs up it. Worked out once here and never looked at again.
	const right = Vector3.Cross(face, up);

	const mount = new TransformNode(`gecko${tag}`, scene);
	mount.position.set(spot.x, spot.y, spot.z);
	mount.rotation = Vector3.RotationFromAxis(right, face, up);

	const body = new TransformNode(`gecko${tag}Body`, scene);
	body.parent = mount;

	const wide = long * 0.38;
	const thick = long * 0.16;

	// The loaf: flat, because the animal is pressed along the wall, and widest at the shoulders.
	sphere(scene, `gecko${tag}Trunk`, {
		diameterX: wide, diameterY: thick, diameterZ: long * 0.62, segments: 8,
		py: thick * 0.45, mat: mats.geckoSkin, parent: body, tile: 0.02,
	});

	// The head: a blunt wedge with the eyes on the front corners of it. Its own node, so the animal can lift
	// its head to call and nod it, which is half of what makes the thing cute.
	const head = new TransformNode(`gecko${tag}Head`, scene);
	head.parent = body;
	head.position.set(0, thick * 0.34, long * 0.36);
	sphere(scene, `gecko${tag}Skull`, {
		diameterX: wide * 0.95, diameterY: thick * 0.8, diameterZ: long * 0.3, segments: 7,
		pz: long * 0.1, mat: mats.geckoSkin, parent: head, tile: 0.02,
	});

	// The eyes: the two beads the animal is found by. Big for the head, set on the sides and turned out, each
	// with a dark slit standing upright in it — upright meaning along the head's own up, which is the wall's
	// up, and which is the mark of a night animal.
	for (const side of [1, -1]) {
		const socket = new TransformNode(`gecko${tag}Eye${side}`, scene);
		socket.parent = head;
		socket.position.set(side * wide * 0.36, thick * 0.16, long * 0.15);
		sphere(scene, `gecko${tag}EyeBall${side}`, {
			diameter: long * 0.115, segments: 6, mat: mats.geckoEye, parent: socket, tile: 0.008,
		});
		sphere(scene, `gecko${tag}EyeSlit${side}`, {
			diameterX: long * 0.03, diameterY: long * 0.12, diameterZ: long * 0.12, segments: 4,
			px: side * long * 0.046, mat: mats.geckoPupil, parent: socket, tile: 0.008,
		});
	}

	// The tail: tapered, and longer than the body is, which is what a gecko's tail is and what it is remembered
	// by. One lean, not a chain: at this size a curved tail is a straight one with an angle on it. The cone is
	// built along its own y and then turned over, so the tip runs back down the wall.
	const tailNode = new TransformNode(`gecko${tag}Tail`, scene);
	tailNode.parent = body;
	tailNode.position.set(0, thick * 0.3, -long * 0.26);
	tailNode.rotation.x = 0.1;
	cylinder(scene, `gecko${tag}TailCone`, {
		diameter: long * 0.13, diameterTop: long * 0.015, height: long * 0.56, tessellation: 6,
		rx: -Math.PI / 2, pz: -long * 0.26, mat: mats.geckoSkin, parent: tailNode, tile: 0.02,
	});

	// The legs: four, splayed out sideways the way a lizard holds itself flat, each one a short lean from the
	// flank to a pad. This is the whole of the animal's shape from the front — a gecko pressed on a window IS
	// four splayed spoons and a tail, and the first cut had them tucked in at 0.95 radians and 0.19 of the body
	// long, which photographed as a hanging sausage with two eyes on it. Out to nearly a right angle, and long
	// enough that the pads stand clear of the flank in the silhouette.
	for (const [name, at, out, back] of [["Fore", 0.26, 1, 0.5], ["Hind", -0.12, 1, -0.55]]) {
		for (const side of [1, -1]) {
			const hip = new TransformNode(`gecko${tag}${name}${side}`, scene);
			hip.parent = body;
			hip.position.set(side * wide * 0.34, thick * 0.25, long * at);
			hip.rotation.z = -side * 1.32;
			hip.rotation.y = side * back;
			cylinder(scene, `gecko${tag}${name}Leg${side}`, {
				diameter: long * 0.065, height: long * 0.26, tessellation: 5,
				py: -long * 0.13, mat: mats.geckoSkin, parent: hip, tile: 0.01,
			});
			sphere(scene, `gecko${tag}${name}Pad${side}`, {
				diameterX: long * 0.13, diameterY: long * 0.045, diameterZ: long * 0.17, segments: 4,
				py: -long * 0.27, mat: mats.geckoSkin, parent: hip, tile: 0.01,
			});
		}
	}

	const g = {
		tag,
		root: mount,
		body,
		head,
		tailNode,
		rand,
		face,
		right,
		up,
		base: { x: spot.x, y: spot.y, z: spot.z },
		// Where it has got to along the wall, in metres: `u` along the wall and `v` up it.
		u: 0,
		v: 0,
		heading: rand() * Math.PI * 2,
		state: "sit",
		left: 0.4 + rand() * 2,
		going: 0,
		called: 0,
		nod: 0,
		hides: 0,
		long,
		// The head's resting height, remembered so the nod below has something to come back to.
		headRest: thick * 0.34,
		soundAt: { x: spot.x, y: spot.y, z: spot.z },
	};
	mount.setEnabled(false);
	return g;
}

/** One animal's next few seconds: sit, scuttle a short way, sit. */
function creep(g, time, delta, night, visitor) {
	const near = visitor ? Math.hypot(visitor.x - g.soundAt.x, visitor.y - g.soundAt.y, visitor.z - g.soundAt.z) : Infinity;
	g.left -= delta;
	g.nod = Math.max(0, g.nod - delta * 2.2);

	if (g.state === "sit") {
		if (g.left <= 0) {
			if (near < SHY_M && g.hides < 2) {
				// A boot close under the wall: make for high ground. Two attempts only, so a person standing
				// under a gecko cannot drive it off the wall and out of the scene for the evening.
				g.hides++;
				g.heading = Math.PI * 0.5 + (g.rand() - 0.5) * 0.8; // up the wall
				g.going = 0.34;
			} else if (g.rand() < 0.34) {
				g.heading += (g.rand() - 0.5) * 2.4;
				g.going = 0.13 + g.rand() * 0.1;
			} else {
				g.left = 0.8 + g.rand() * 6;
				return;
			}
			g.state = "scuttle";
			g.left = 0.3 + g.rand() * 0.5;
		}
		// The call. Only at night — a gecko that pipes in the daylight is a clock that has not been wound — and
		// never two at once from the same animal.
		if (night && g.called <= 0 && g.nod <= 0) {
			g.called = 8 + g.rand() * 18;
			if (g.soundPlay) g.soundPlay(g);
			g.nod = 0.4;
		}
	} else {
		// The scuttle: quick, and with a stutter in the middle, because lizards do not glide, they go.
		const step = g.going * delta;
		g.u += Math.cos(g.heading) * step;
		g.v += Math.sin(g.heading) * step;
		// The wall has a limit, and so does the lamp's reach: kept inside a hand's width of where it was put.
		const lim = g.long * 2.4;
		if (Math.abs(g.u) > lim || g.v > lim || g.v < -lim) {
			g.heading += Math.PI;
			g.u = Math.max(-lim, Math.min(lim, g.u));
			g.v = Math.max(-lim, Math.min(lim, g.v));
		}
		g.body.position.z = g.u;
		g.body.position.y = g.v;
		// The head leads, and the tail is late by one move, which is the whole of what a crawling animal is.
		g.body.rotation.y = Math.sin(g.heading) * 0.5;
		g.tailNode.rotation.y = -Math.sin(g.heading) * 0.5 + Math.sin(time * 3.1 + g.tag) * 0.06;
		if (g.left <= 0) {
			g.state = "sit";
			g.left = 0.5 + g.rand() * 4;
			if (g.rand() < 0.3) g.left += 2 + g.rand() * 4;
		}
	}
	// The nod that goes with the call: the head comes up and a little forward, and comes back down.
	g.head.rotation.x = -g.nod * 0.55;
	g.head.position.y = g.headRest + g.nod * g.long * 0.02;
	g.called = Math.max(0, g.called - delta);
	// The sound's place follows the animal, not the spot it started from.
	g.soundAt.x = g.base.x + g.right.x * g.u + g.up.x * g.v;
	g.soundAt.y = g.base.y + g.right.y * g.u + g.up.y * g.v + g.long * 0.2;
	g.soundAt.z = g.base.z + g.right.z * g.u + g.up.z * g.v;
}

export function buildGeckos(scene, mats, { spots = [], sound = null } = {}) {
	const geckos = spots.map((spot, i) => {
		const g = makeGecko(scene, mats, spot, i + 1);
		g.soundPlay = sound ? (who) => sound.play("gecko", who.soundAt, 1) : null;
		return g;
	});
	let night = false;
	let visitor = null;

	return {
		geckos,
		get count() {
			return geckos.length;
		},
		get abroad() {
			return night;
		},
		night(isNight2) {
			night = isNight2;
			for (const g of geckos) {
				g.root.setEnabled(night);
				// Out of hiding when the light goes: they come back to the same patch of wall they were on.
				if (!night) g.hides = 0;
			}
		},
		/** The visitor's place, so the animals can be shy about it. */
		visit(at) {
			visitor = at;
		},
		animate(time, delta) {
			if (!night) return;
			for (const g of geckos) creep(g, time, delta, night, visitor);
		},
	};
}
