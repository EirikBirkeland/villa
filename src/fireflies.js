// Two fireflies, and they are abroad at night only.
//
// Why two: the master asked for two, and two is right. One is a curiosity and a dozen is an effect; two is
// a pair of insects, and a visitor who finds one will look for the other and find that one too.
//
// THE RULE THIS FILE LIVES BY is the creatures' rule (`src/creatures.js`): a small animal has to be FOUND.
// A firefly is a dark insect carrying a small light, so at night it is the easiest small animal in this
// garden to find and the hardest to place in a daylight picture — which is the whole argument for the day
// cycle. Both of them are put where a visitor stands and looks, and where there is something dark behind
// them:
//
//   ONE   over the west walk at (-8.4, 6.9), on the line of sight from the `west` camera two and a half
//         metres away and at a person's chest height: dark hedge and dark water behind it. Measured with
//         `tools/fffoot.js`: 280 yellow-green pixels of a 1280 by 720 frame, core at L239.
//   TWO   over the sedges at the pond's near corner at (-18.2, 16.2), three metres from the `pondbank`
//         camera where the koi are found: dark water and dark stems behind it, and a person crouched there
//         is in the right place to see both. Measured: 168 px, core at L235.
//
// The height is worth a word, because it was got wrong first. A firefly does keep low over the grass, but a
// picture is taken from a standing eye at 1.62 m and a creature at 45 cm is in the bottom corner of the
// frame behind a banana. The west one cruises at chest height — which fireflies do over an open lawn, rising
// when they cross a gap — and the pond one keeps low, where the camera that finds it is looking down anyway.
//
// WHAT A FIREFLY ACTUALLY DOES, and where this copies it. The lantern is a light organ at the last end of
// the abdomen, and it is flashed, not lit: a pulse of a third of a second out of a period of about two,
// with the whole insect banking as it goes up and over. They drift — a firefly's flight is slow and looped,
// two or three times slower than a big moth — and they rest: several seconds sitting in a grass tuft with
// the wings folded and the lantern down to an ember, then up again. The one liberty taken is the size. A
// big tropical firefly is two and a half centimetres nose to tail-tip and this one is that, but the lantern
// is six millimetres across where the real organ is nearer three, because the light has to survive being
// seen from three metres off and the bloom in `src/main.js` is doing what the moisture in a real night air
// does — spreading a point into a small ball.
//
// NO LAMP IS ATTACHED to either of them. The shaders in this Villa hold six light sources and drop a
// seventh without a word (see `src/main.js`), and the house's own lamps are already in that count; the glow
// is emissive paint and the bloom, and it lights nothing. A firefly has never lit a garden in its life: it
// lit a mate, two metres off, and that is all it ever claimed.

import { sphere, plane } from "./mesh.js";

const { TransformNode } = BABYLON;

// Where they live: see the head of this file. `at` is the middle of the patch, `roam` how far from it, and
// `hover` how high above whatever is under them they cruise — over mown grass a firefly goes about at
// roughly a person's chest, and over the sedges at a pond's edge it keeps low.
const FLASHES = [
	{ x: -8.4, z: 6.9, roam: 0.7, hover: 1.2, seed: 5, bold: 1.0, period: 1.9 },
	{ x: -18.2, z: 16.2, roam: 1.0, hover: 0.45, seed: 17, bold: 0.8, period: 2.4 },
];

const BODY_CM = 2.5; // nose to tail-tip: a big tropical firefly, and the truth about its size

function rng(seed) {
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
 * The two fireflies. `ground` is the visitor's own ground, so a firefly rests on the grass it is over and
 * not through it.
 */
export function buildFireflies(scene, mats, ground) {
	// Each firefly gets its own copy of the lantern material, because each flashes at its own moment and a
	// shared material would have them in lockstep — which is a real thing fireflies do, and precisely what
	// two fireflies two fields apart must not pretend to be.
	const flies = FLASHES.map((spot) => {
		const rand = rng(spot.seed);
		const long = BODY_CM / 100;
		const lanternMat = mats.fireflyLantern.clone(`lantern${spot.seed}`);
		lanternMat.needAlphaBlendingForMesh = () => false;
		// The halo's material is cloned too, and for the same reason: the flash is per insect.
		const haloMat = mats.fireflyHalo.clone(`halo${spot.seed}`);
		haloMat.needAlphaBlendingForMesh = () => true;

		const root = new TransformNode(`firefly${spot.seed}`, scene);
		// The head and the thorax: a bead and a slightly larger one behind it, with the pronotum — the
		// shield a firefly carries over its head like a collar — as a flattened bead over the top.
		sphere(scene, "ffHead", {
			diameterX: long * 0.26, diameterY: long * 0.24, diameterZ: long * 0.22, segments: 6,
			pz: long * 0.4, mat: mats.fireflyBody, parent: root,
		});
		sphere(scene, "ffThorax", {
			diameterX: long * 0.4, diameterY: long * 0.3, diameterZ: long * 0.34, segments: 6,
			pz: long * 0.12, mat: mats.fireflyBody, parent: root,
		});
		sphere(scene, "ffShield", {
			diameterX: long * 0.44, diameterY: long * 0.16, diameterZ: long * 0.3, segments: 6,
			pz: long * 0.18, py: long * 0.1, mat: mats.fireflyCase, parent: root,
		});
		// The abdomen, hanging a little below the wings, and the lantern on its last segment.
		const abdomen = sphere(scene, "ffAbdomen", {
			diameterX: long * 0.34, diameterY: long * 0.3, diameterZ: long * 0.6, segments: 7,
			pz: -long * 0.3, py: -long * 0.05, mat: mats.fireflyCase, parent: root,
		});
		abdomen.rotation.x = -0.16;
		sphere(scene, "ffLantern", {
			diameter: long * 0.24, segments: 7,
			pz: -long * 0.58, py: -long * 0.08, mat: lanternMat, parent: root,
		});
		// The glow round the lantern: two shells of lit glass laid over it, twenty-two and forty-five
		// millimetres across against a six-millimetre organ. A firefly's light scatters in the dew and in the
		// eye and comes back as a soft ball a finger's width across, and the bloom in `src/main.js` is a tight
		// one on purpose (a wide kernel fogs a whole night), so the scatter is painted here. Shells rather
		// than a billboard: they cost nothing, they need no new trick with alpha textures, and a glow has no
		// far side, which is what a billboard would have to pretend to.
		for (const [name, dm, dim] of [["ffHalo1", long * 0.85, 1], ["ffHalo2", long * 1.8, 0.55]]) {
			const shell = sphere(scene, name, {
				diameter: dm, segments: 6,
				pz: -long * 0.58, py: -long * 0.08, mat: haloMat, parent: root,
			});
			shell.isPickable = false;
			shell.visibility = dim;
		}
		// The wings: two cards, held out and working. A firefly's hindwings are the fan and the wing cases
		// ride above them; at this size one card each side carries the whole idea, and a fast flap is a
		// smear in any picture anyone takes.
		const wings = [];
		for (const side of [1, -1]) {
			const w = plane(scene, `ffWing${side}`, {
				width: long * 0.34, height: long * 0.86,
				px: side * long * 0.2, py: long * 0.07, pz: -long * 0.14,
				rx: -Math.PI / 2, ry: side * 0.28, mat: mats.fireflyWing, parent: root,
			});
			wings.push({ mesh: w, side });
		}

		// The drift: four slow sines that share no period, so the loop wanders instead of pacing. The rates
		// are all under a quarter of a cycle a second, which keeps it a drift and not a moth's flight.
		const rate = (i) => 0.07 + rand() * 0.12;
		const ph = () => rand() * 6.283;
		return {
			root,
			lanternMat,
			haloMat,
			wings,
			at: { x: spot.x, z: spot.z },
			roam: spot.roam,
			bold: spot.bold,
			period: spot.period * (0.85 + rand() * 0.3),
			skew: (rand() - 0.5) * 0.12,
			a: [rate(1), rate(2), rate(3), rate(4)],
			p: [ph(), ph(), ph(), ph()],
			lift: (spot.hover === undefined ? 0.4 : spot.hover) + rand() * 0.25,
			// where it is, and where it was a moment ago, so the heading comes out of the path and not out
			// of a guess
			x: spot.x, z: spot.z, y: 0,
			px: spot.x, pz: spot.z,
			state: "fly",
			left: 6 + rand() * 8,
			rest: null,
			seed: spot.seed,
			rand,
		};
	});

	// A point on the drift at a given moment. Pulled out so the heading can be read off the path itself by
	// asking for the point a moment later, which is the only way to make an animal look round a corner
	// instead of sliding sideways along it.
	function where(f, t) {
		if (f.state === "rest" && f.rest) {
			const r = f.rest;
			const k = Math.min(1, r.settle);
			return {
				x: r.x + (f.x - r.x) * 0, // the rest point is fixed: it landed and it stayed
				y: r.y + Math.sin(t * 1.7 + f.seed) * 0.004,
				z: r.z,
				k,
			};
		}
		const x = f.at.x + Math.sin(t * f.a[0] + f.p[0]) * f.roam + Math.sin(t * f.a[1] + f.p[1]) * f.roam * 0.5;
		const z = f.at.z + Math.cos(t * f.a[2] + f.p[2]) * f.roam * 0.9 + Math.sin(t * f.a[3] + f.p[3]) * f.roam * 0.45;
		const grass = ground ? ground.heightAt(x, z) : 0;
		const y = grass + f.lift + Math.sin(t * 0.61 + f.p[0]) * 0.24 + Math.sin(t * 0.24 + f.p[2]) * 0.15;
		return { x, y, z, k: 0 };
	}

	let on = false;

	return {
		fireflies: flies,
		/** Night, or day. By day they are not abroad at all — see `src/daylight.js`. */
		night(isNight) {
			on = !!isNight;
			for (const f of flies) f.root.setEnabled(on);
		},
		animate(time, delta) {
			if (!on) return;
			const t = time;
			for (const f of flies) {
				f.left -= delta;
				if (f.state === "fly" && f.left <= 0) {
					// Down into the grass. Anywhere in the patch will do for a landing: what matters is that
					// it goes dark while it is there, because the dark is what makes the next flash worth
					// waiting for.
					f.state = "rest";
					const ang = f.rand() * 6.283;
					const near = 0.3 + f.rand() * 0.5;
					const rx = f.x + Math.sin(ang) * near;
					const rz = f.z + Math.cos(ang) * near;
					f.rest = { x: rx, z: rz, y: (ground ? ground.heightAt(rx, rz) : 0) + 0.09, settle: 0 };
					f.left = 2.5 + f.rand() * 4;
				} else if (f.state === "rest" && f.left <= 0) {
					f.state = "fly";
					f.rest = null;
					f.left = 7 + f.rand() * 9;
				}

				const now = where(f, t);
				const next = where(f, t + 0.12);
				f.px = f.x; f.pz = f.z;
				f.x = now.x; f.y = now.y; f.z = now.z;
				f.root.position.set(f.x, f.y, f.z);

				if (f.state === "rest") {
					f.rest.settle = Math.min(1, f.rest.settle + delta * 2.5);
				}
				// Turn: along the path when flying, and a slow head-to-head swing when sitting.
				if (f.state === "rest") {
					f.root.rotation.y += delta * 0.3;
					f.root.rotation.x = 0.1;
					f.root.rotation.z = 0;
				} else {
					const dx = next.x - now.x;
					const dz = next.z - now.z;
					if (Math.abs(dx) + Math.abs(dz) > 1e-5) {
						const want = Math.atan2(dx, dz);
						let d = want - f.root.rotation.y;
						while (d > Math.PI) d -= Math.PI * 2;
						while (d < -Math.PI) d += Math.PI * 2;
						f.root.rotation.y += d * Math.min(1, delta * 3.4);
					}
					// Banking: a firefly rolls into its turn the way anything that weighs nothing does.
					let d2 = -Math.atan2(dx, Math.max(0.05, Math.hypot(dx, dz))) * 0.6;
					f.root.rotation.z += (d2 - f.root.rotation.z) * Math.min(1, delta * 2);
					f.root.rotation.x = -0.06 + Math.sin(t * 1.3 + f.seed) * 0.07;
				}

				// The flash: a raised sine, so there is a fast rise, a short hold and a dark gap long
				// enough for the eye to want the next one. At rest it is an ember and nothing more. The
				// quarter-cycle start is so that the first frame of the Villa catches both of them lit —
				// otherwise a still picture of the night shows two dark specks and a fool with a camera.
				const cyc = (0.25 + t / f.period + f.skew) % 1;
				const pulse = Math.pow(Math.max(0, Math.sin(cyc * Math.PI * 2)), 7);
				const lit = f.state === "rest" ? 0.05 : (0.05 + pulse * 0.95) * f.bold;
				const g = 7 * lit;
				f.lanternMat.emissiveColor.set(g, g * 0.94, g * 0.32);
				// The halo goes down with the flash in both its emissive and its alpha: a shell that stays
				// half-opaque while its core is dark is a grey bead, and a firefly between flashes is nothing
				// at all on the night air.
				f.haloMat.emissiveColor.set(g * 0.62, g * 0.58, g * 0.2);
				f.haloMat.alpha = 0.5 * lit;

				// Wings: folded flat along the back at rest, a blur in the air.
				for (const w of f.wings) {
					const flap = f.state === "rest" ? 0 : Math.sin(t * 41 + f.seed + w.side) * 0.55;
					w.mesh.rotation.y = w.side * (0.28 + flap * 0.35);
					w.mesh.visibility = f.state === "rest" ? 0.18 : 0.42;
				}
			}
		},
	};
}
