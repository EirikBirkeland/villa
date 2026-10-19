// The roof bird, and the coin it drops.
//
// A raven sits on the villa's ridge. Not always — it comes for a while and it goes, and while it is there it
// calls out from up there now and then, and you hear it before you find it, which is most of the pleasure of a
// raven. Look up and it is a black shape against the sky with a head that turns; that is all it has to be, and
// it is a great deal more than a garden needs.
//
// Every few days it drops a gold coin into the yard, and the coin is still lying there the next time you come
// back. Two things follow from that sentence and the module is built around them: "days" has to be a number the
// Villa keeps count of and not a feeling, and "still lying there" has to outlast the page, so the day count and
// where each coin fell are written into `localStorage` under one key. A raven that empties its purse on every
// reload is a machine and not a bird.
//
// The coin is stamped with a royal emblem and not with the face of the living king: `royalCoinCanvas` in
// `src/textures.js` says why, and what is on it instead — a crown, a chakra wheel, two talk-backs and a ring of
// beads.
//
// `?raven=0` sends the bird away for a quiet visit.

import { sphere, cylinder, box } from "./mesh.js";
import { randomGenerator } from "./noise.js";

const { TransformNode } = BABYLON;

// Where the bird can sit. Every one of these is on a ridge or a roof top, out of any hand, and stands out
// against the sky when a person looks up from the lawn or the paving. [x, y, z] with y the top of the roof at
// that point; the main ridge of this villa runs from x -3.5 to 3.5 at z -7.8 and stands at 6.75 m.
const PERCHES = [
	[-2.2, 6.82, -7.8],
	[0.4, 6.82, -7.8],
	[2.9, 6.82, -7.8],
	[-6.4, 5.05, -4.4], // the low roof over the front, nearer a person standing on the paving
	[5.9, 5.05, -11.2],
];

// Where a coin may fall: paving and lawn in front of the house and along the pool side, all of it ground a
// person walks, none of it water and none of it under a lounger. [x, z]
const DROPS = [
	[-3.4, -0.6], [2.8, -1.4], [0.2, 1.1], [-6.2, 1.4], [5.4, -0.2],
	[-1.2, 1.7], [6.6, -4.6], [-7.8, -2.2], [3.6, 4.8], [-3.0, 6.4],
];

const KEY = "villa.raven";
const DAYS_BETWEEN = 3; // a coin every three days of the Villa's own day, and no more
const KEEP = 9; // the yard keeps this many coins; when the tenth falls the oldest is swept up
const LONG = 0.52; // a carrion crow is about half a metre, and this is not a bigger bird than that

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * The bird: soot black with a heavy bill, standing on two legs and folding two wings against its flanks.
 *
 * Four nodes and no more — body, head, tail and the root — because everything a perched raven does is done with
 * a head (it turns, it lifts when it calls) and a tail (it cocks). The wings are folded plates swept back, and
 * the one paler thing on the bird is the shoulder flash, which is where a raven's feathers go blue-black in the
 * light and the only place it will ever look anything but flat black.
 */
function buildBird(scene, mats) {
	const root = new TransformNode("raven", scene);

	const body = new TransformNode("ravenBody", scene);
	body.parent = root;
	body.position.y = LONG * 0.3;

	sphere(scene, "ravenBodyLump", {
		diameterX: LONG * 0.4, diameterY: LONG * 0.36, diameterZ: LONG, segments: 10,
		mat: mats.ravenFeather, parent: body, tile: 0.14,
	});
	// The shoulders: two lumps where the wings fold in, in the sheen material, so the bird has one part that
	// is not matte and the eye can find the shape of it in a flat light. The wings themselves are folded plates
	// laid along the flanks, and they are kept to be flown: on the way to a perch and on the way off it they are
	// what the eye follows.
	const wings = [];
	for (const side of [1, -1]) {
		sphere(scene, `ravenShoulder${side}`, {
			diameterX: LONG * 0.13, diameterY: LONG * 0.22, diameterZ: LONG * 0.4, segments: 6,
			px: side * LONG * 0.19, py: LONG * 0.04, pz: LONG * 0.1,
			mat: mats.ravenSheen, parent: body, tile: 0.1,
		});
		const wing = new TransformNode(`ravenWing${side}`, scene);
		wing.parent = body;
		wing.position.set(side * LONG * 0.21, -LONG * 0.01, -LONG * 0.02);
		wing.rotation.set(0, 0, side * 0.16);
		wings.push({ node: wing, side });
		box(scene, `ravenWing${side}Covert`, {
			x: LONG * 0.055, y: LONG * 0.2, z: LONG * 0.62,
			pz: -LONG * 0.06, ry: side * 0.1, mat: mats.ravenFeather, parent: wing, tile: 0.12,
		});
		box(scene, `ravenWing${side}Hand`, {
			x: LONG * 0.045, y: LONG * 0.15, z: LONG * 0.34,
			pz: -LONG * 0.44, ry: side * 0.22, mat: mats.ravenFeather, parent: wing, tile: 0.12,
		});
	}

	const head = new TransformNode("ravenHead", scene);
	head.parent = body;
	head.position.set(0, LONG * 0.22, LONG * 0.44);
	sphere(scene, "ravenHeadBall", { diameter: LONG * 0.3, segments: 9, mat: mats.ravenFeather, parent: head, tile: 0.09 });
	// A raven's crown is flat and its forehead runs into the bill, so a second lump behind the ball keeps the
	// head from reading as a bead on a string.
	sphere(scene, "ravenNape", {
		diameterX: LONG * 0.26, diameterY: LONG * 0.22, diameterZ: LONG * 0.22, segments: 6,
		pz: -LONG * 0.11, py: -LONG * 0.01, mat: mats.ravenFeather, parent: head, tile: 0.09,
	});
	// The bill is heavy and the top of it is nearly straight, which is what separates a crow's head from a
	// songbird's. Two tapered lengths, the lower one shorter, and a nostril bead where the two meet.
	const bill = new TransformNode("ravenBill", scene);
	bill.parent = head;
	bill.position.set(0, LONG * 0.01, LONG * 0.14);
	bill.rotation.x = 0.14;
	cylinder(scene, "ravenBillUpper", {
		diameter: LONG * 0.13, diameterTop: LONG * 0.035, height: LONG * 0.28, tessellation: 4,
		rx: Math.PI / 2, pz: LONG * 0.14, mat: mats.ravenBill, parent: bill,
	});
	cylinder(scene, "ravenBillLower", {
		diameter: LONG * 0.1, diameterTop: 0.004, height: LONG * 0.18, tessellation: 4,
		rx: Math.PI / 2, py: -LONG * 0.05, pz: LONG * 0.09, mat: mats.ravenBill, parent: bill,
	});
	for (const side of [1, -1]) {
		sphere(scene, `ravenEye${side}`, {
			diameter: LONG * 0.06, segments: 6, px: side * LONG * 0.115, py: LONG * 0.045, pz: LONG * 0.105,
			mat: mats.ravenEye, parent: head,
		});
	}

	const tail = new TransformNode("ravenTail", scene);
	tail.parent = body;
	tail.position.set(0, LONG * 0.02, -LONG * 0.52);
	box(scene, "ravenTailFan", {
		x: LONG * 0.26, y: LONG * 0.035, z: LONG * 0.42, pz: -LONG * 0.2,
		mat: mats.ravenFeather, parent: tail, tile: 0.12,
	});

	// Feet: two shanks and three forward toes each, the claws the only light thing on the bird. A raven
	// gripping a ridge tile has visible feet, and a bird with no feet is a floating lump.
	for (const side of [1, -1]) {
		cylinder(scene, `ravenShank${side}`, {
			diameter: LONG * 0.055, height: LONG * 0.3, tessellation: 5,
			px: side * LONG * 0.09, py: -LONG * 0.15, pz: LONG * 0.02,
			mat: mats.ravenBill, parent: body,
		});
		for (let i = 0; i < 3; i++) {
			cylinder(scene, `ravenToe${side}${i}`, {
				diameter: LONG * 0.03, height: LONG * 0.13, tessellation: 4,
				px: side * LONG * 0.09, py: -LONG * 0.3, pz: LONG * 0.08 - i * LONG * 0.04,
				rx: Math.PI / 2 - 0.25, ry: (i - 1) * 0.55,
				mat: mats.ravenBill, parent: body,
			});
		}
	}

	root.setEnabled(false);
	return { root, body, head, tail, wings };
}

/**
 * The stored note: which day the bird last paid out, and where the coins it paid before are lying.
 *
 * Read once at build and written after every change. A note that cannot be read — private browsing, a full
 * quota, a line mangled by an earlier version — is treated as no note, and the bird starts as if it had never
 * been here. It is a raven, not a bank.
 */
function readNote(store) {
	const blank = { day: 0, lastDrop: -DAYS_BETWEEN, coins: [] };
	try {
		const raw = store ? store.getItem(KEY) : null;
		if (!raw) return blank;
		const got = JSON.parse(raw);
		return {
			day: Number(got.day) || 0,
			lastDrop: Number(got.lastDrop) === undefined ? -DAYS_BETWEEN : Number(got.lastDrop),
			coins: Array.isArray(got.coins) ? got.coins.slice(0, KEEP) : [],
		};
	} catch (err) {
		return blank;
	}
}

/**
 * The raven and its purse. `mats` gives it feathers and gold, `ground` tells it where the yard actually is, and
 * `sound` is `src/sound.js` — the caw and the tink are already written, and this is the thing that says them.
 */
export function buildRaven(scene, mats, { ground = null, sound = null, store = null } = {}) {
	const bird = buildBird(scene, mats);
	const keeper = store !== null ? store : typeof localStorage !== "undefined" ? localStorage : null;
	const note = readNote(keeper);
	const rand = randomGenerator(0x7a4e1);

	const save = () => {
		try {
			if (keeper) keeper.setItem(KEY, JSON.stringify(note));
		} catch (err) {
			// Nothing a bird can do about a locked note.
		}
	};

	/** A coin lying where it fell. The ones from earlier visits are put back before the visitor wakes up. */
	const coins = [];
	const lay = (x, z, y, spin) => {
		const coin = cylinder(scene, "royalCoin", {
			diameter: 0.026, height: 0.0022, tessellation: 30,
			mat: mats.royalGold,
		});
		// A coin does not lie face up on rough paving; it lies on its edge or half over. Lying it flat on the
		// ground's own height, with a tilt, is what makes it a thing that fell and not a thing placed.
		coin.rotation.x = Math.PI / 2 + (spin - 0.5) * 0.25;
		coin.rotation.y = spin * 6.28;
		coin.position.set(x, y, z);
		coins.push({ mesh: coin, x, z, spin, falling: false, y });
		return coin;
	};
	for (const left of note.coins) {
		const y = ground ? ground.heightAt(left.x, left.z) + 0.004 : 0.3;
		lay(left.x, left.z, y, left.spin);
	}

	let perch = null; // the perch this visit, or null while the bird is away
	let onFor = 0; // seconds this perch will last
	let offFor = 5 + rand() * 10; // seconds until the next arrival
	let callIn = 4 + rand() * 8;
	let headTo = 0;
	let headAt = 0;
	let lift = 0; // how far the head is up, which is a call happening
	let flight = null; // a three second glide, in or out, while it is not null
	let days = note.day;
	let dropped = 0;
	let lastCallAt = -99;

	const perchOn = (spot) => {
		perch = spot;
		onFor = 70 + rand() * 190;
		callIn = 3 + rand() * 12;
		flight = { from: [spot[0] + 9, spot[1] + 3.4, spot[2] + 9], to: spot, t: 0, in: true };
		bird.root.setEnabled(true);
	};

	const perchOff = () => {
		if (!perch) return;
		const away = [perch[0] - 11, perch[1] + 2.6, perch[2] - 11];
		flight = { from: [perch[0], perch[1], perch[2]], to: away, t: 0, in: false };
		perch = null;
		offFor = 30 + rand() * 130;
	};

	return {
		get abroad() { return !!perch || !!flight; },
		get perched() { return !!perch; },
		get days() { return Math.floor(days); },
		get coins() { return coins.length; },
		notes: note,
		// Two doors for the tools, on the model of the shark's: a bird that arrives when it feels like it is a
		// bird, and a bird that cannot be put where a picture needs it is a bird nobody can look at.
		arrive(at = 0) { perchOn(PERCHES[clamp(at, 0, PERCHES.length - 1)]); return perch; },
		go() { perchOff(); return false; },
		/** Where the bird is, in world metres, for a tool that wants to point a camera at it. */
		where() {
			if (!bird.root.isEnabled()) return null;
			const p = bird.root.getAbsolutePosition();
			return { x: p.x, y: p.y, z: p.z };
		},

		/**
		 * One frame of the bird. `hour` and `night` come from the day clock, `elapsed` is the Villa's own seconds
		 * since the page opened — the only clock here that does not skip when the tab is left in a corner, which
		 * is why the bird's comings and goings are counted off it — and `wrapped` says the hour has just gone
		 * past midnight, which is the only thing that makes a day.
		 */
		animate({ delta, night, wrapped, elapsed }) {
			// The day, and the purse that opens with it.
			if (wrapped) {
				days += 1;
				note.day = days;
				if (days - note.lastDrop >= DAYS_BETWEEN && perch) {
					note.lastDrop = days;
					dropped += 1;
					const at = DROPS[Math.floor(rand() * DROPS.length)];
					const y = ground ? ground.heightAt(at[0], at[1]) + 0.004 : 0.3;
					const coin = lay(at[0], at[1], y, rand());
					coin.position.y = perch[1] - 0.4;
					coins[coins.length - 1].y = perch[1] - 0.4;
					coins[coins.length - 1].falling = true;
					coins[coins.length - 1].rest = y;
					save();
				}
				save();
			}

			// Arrivals and departures only in the daylight: a raven goes to roost, and a caw at three in the
			// morning over a frog chorus is not a garden, it is a bad film.
			if (!perch && !flight) {
				offFor -= delta;
				if (offFor <= 0 && !night) perchOn(PERCHES[Math.floor(rand() * PERCHES.length)]);
			} else if (perch && !flight) {
				onFor -= delta;
				if (onFor <= 0 || night) perchOff();
			}

			// The glide. Three seconds of a straight line with a dip in the middle, which is what a bird looks
			// like from a long way off, and the bird's own attitude is a nose down on the way out.
			if (flight) {
				flight.t = Math.min(1, flight.t + delta / 3);
				const t = flight.t;
				const mix = (a, b) => a + (b - a) * t;
				const dip = Math.sin(t * Math.PI) * (flight.in ? -0.9 : 1.4);
				bird.root.position.set(
					mix(flight.from[0], flight.to[0]),
					mix(flight.from[1], flight.to[1]) + dip,
					mix(flight.from[2], flight.to[2])
				);
				bird.root.rotation.y = Math.atan2(flight.from[0] - flight.to[0], flight.from[2] - flight.to[2]);
				bird.root.rotation.x = flight.in ? 0.12 : -0.2;
				// Four beats a second, hinged at the shoulder so the wings rise off the body and not out of their
				// own middle. A gliding shape is a shape moving; a flapping one is a bird.
				const beat = Math.sin(elapsed * 25) * 0.85;
				for (const w of bird.wings) w.node.rotation.z = w.side * (0.16 + beat);
				if (t >= 1) {
					bird.root.rotation.x = 0;
					for (const w of bird.wings) w.node.rotation.z = w.side * 0.16;
					if (flight.in && perch) {
						bird.root.position.set(perch[0], perch[1], perch[2]);
						// Face roughly out over the yard, so the bird is looking at the visitor's half of the garden.
						bird.root.rotation.y = Math.atan2(-perch[0], 8 - perch[2]) + (rand() - 0.5) * 0.9;
					}
					if (!flight.in) bird.root.setEnabled(false);
					flight = null;
				}
			}

			// The head: turned over now and then, and thrown up when the call goes out.
			if (Math.abs(headAt - headTo) < 0.03) headTo = (rand() - 0.5) * 1.7;
			headAt += (headTo - headAt) * Math.min(1, delta * 2.4);
			bird.head.rotation.y = headAt;
			bird.head.rotation.x = -lift * 0.55;
			bird.tail.rotation.x = -0.06 + Math.sin(elapsed * 0.7) * 0.05;

			if (perch && !flight) {
				callIn -= delta;
				if (callIn <= 0) {
					callIn = 8 + rand() * 30;
					lift = 1;
					headTo = (rand() - 0.5) * 0.5;
					lastCallAt = elapsed;
					if (sound) sound.play("raven", bird.root.position, 0.8 + rand() * 0.35);
				}
				lift = Math.max(0, lift - delta * 1.5);
			}

			// The fall of a coin, and then it is a stone in the garden and waits to be found.
			for (const c of coins) {
				if (!c.falling) continue;
				c.y -= delta * 5.4;
				c.spin += delta * 7;
				c.mesh.rotation.x = Math.PI / 2 + Math.sin(c.spin) * 0.5;
				if (c.y <= c.rest) {
					c.y = c.rest;
					c.falling = false;
					if (sound) sound.play("coin", c.mesh.position, 0.9);
				}
				c.mesh.position.y = c.y;
			}

			// The yard holds what it holds, and no more.
			while (coins.length > KEEP) {
				const gone = coins.shift();
				gone.mesh.dispose();
			}
			note.coins = coins.map((c) => ({ x: Number(c.x.toFixed(3)), z: Number(c.z.toFixed(3)), spin: Number(c.spin.toFixed(3)) }));
			void lastCallAt;
		},
	};
}
