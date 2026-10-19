// The rocket launcher: number `5` while the gun is in your hands, and one rocket puts a mushroom cloud over
// the garden and takes the house apart.
//
// WHAT IT IS. The gun is armed by typing `g u n` (`src/weapon.js`). While it is armed, `5` swaps the gun for a
// launcher — a tube across the sight — and the left button throws one rocket per press rather than spraying.
// The rocket flies down the sight at thirty metres a second, leaves a line of smoke behind it, and goes off
// when it strikes anything or after three and a half seconds. The blast is a ball of fire, a shock ring going
// out along the ground, a scorch left on the lawn, and a column of smoke that rises, slows, and spreads at the
// top into a mushroom twenty metres across. Anything of the house standing within twenty-six metres of the
// blast is broken into pieces and thrown.
//
// WHY IT IS NOT A PHYSICS ENGINE. This Villa has no physics library and its walking is its own (`src/ground.js`
// reads floors and walls out of bounding boxes). A debris field of four hundred boxes does not need one: each
// piece carries a velocity, gravity takes it, the ground is `ground.heightAt`, and a piece that has bounced
// twice and slowed down lies where it landed for ever. That is every law a thrown brick obeys, and it costs a
// multiply per piece per frame instead of a solver.
//
// WHY THE DEBRIS IS INSTANCES. Four hundred separate boxes is four hundred meshes for the engine to sort, and
// this Villa has measured its frame budget at sixty frames a second with thirteen hundred meshes in it. One
// master box per material and four hundred `createInstance` calls is the same picture for a fraction of the
// cost: an instance carries its own position, turn and size and shares everything else. The masters are hidden
// (`isVisible = false`) and their instances are not: disabling the master with `setEnabled` would put every
// piece away with it, which is the trap here.
//
// WHY NOTHING DIES HERE EITHER. The garden's rule is that nothing dies (`src/weapon.js`); a shark that has
// been shot goes to the dark end of the pool to think about it. A house is not a living thing, and the master
// asked for it to come apart. But it is put back: `R`, which already returns the visitor to where they started,
// also rebuilds what was blown up, because the Villa is the work and a visitor who cannot put the house back
// has lost the thing they came to walk in.

const { Vector3, Ray, TransformNode, Mesh } = BABYLON;

import { box, cylinder, plane } from "./mesh.js";
import { randomGenerator } from "./noise.js";

/** How fast a rocket leaves the tube, metres a second. */
const SPEED = 30;
/** A rocket that strikes nothing goes off after this many seconds. */
const FUSE = 3.5;
/** How far the sight may throw one. Past this the garden is too small to be worth aiming at. */
const RANGE = 220;
/** How far from the blast a piece of the house is taken by it, metres. */
const SMASH = 26;
/** The most pieces one blast may make, whatever the house is made of. */
const MAX_CHUNKS = 420;
/** How high the column of smoke rises before it begins to spread, metres above the blast. */
const CAP_AT = 13;

export function buildRocket(scene, mats, { camera, sound = null, ground = null, villa = [] } = {}) {
	const rand = randomGenerator(9021);
	let mode = "gun";
	let blown = 0;

	// ---- the tube across the sight ------------------------------------------------
	const tube = new TransformNode("launcher", scene);
	tube.parent = camera;
	tube.position.set(0.14, -0.17, 0.36);
	tube.rotation.set(0.03, -0.05, 0.04);
	tube.setEnabled(false);
	for (const mesh of [
		cylinder(scene, "launcherTube", {
			diameter: 0.075, diameterTop: 0.085, height: 0.62, tessellation: 10, rx: Math.PI / 2, pz: 0.1,
			mat: mats.weaponSteel, parent: tube,
		}),
		cylinder(scene, "launcherMuzzle", {
			diameter: 0.11, height: 0.1, tessellation: 10, rx: Math.PI / 2, pz: 0.44, mat: mats.weaponSteel, parent: tube,
		}),
		box(scene, "launcherGrip", { x: 0.035, y: 0.11, z: 0.05, py: -0.085, pz: -0.02, rx: -0.2, mat: mats.weaponGrip, parent: tube }),
		box(scene, "launcherSight", { x: 0.014, y: 0.035, z: 0.05, py: 0.055, pz: 0.2, mat: mats.weaponSteel, parent: tube }),
		box(scene, "launcherRocket", { x: 0.07, y: 0.07, z: 0.2, py: 0.01, pz: 0.5, mat: mats.weaponGrip, parent: tube }),
	]) {
		mesh.isPickable = false;
		mesh.receiveShadows = false;
	}

	// ---- the cards: fire, smoke, trail -------------------------------------------
	//
	// One pool of billboards, each carrying its own material, size and visibility. They are pooled and not
	// made on the day because a blast that builds forty meshes in one frame spends the frame on geometry, and
	// because `src/blood.js` and the gun's spurts already learned that a reused card is a free card.
	const CARDS = 92;
	const cards = [];
	for (let i = 0; i < CARDS; i++) {
		const mesh = plane(scene, `blastCard${i}`, { width: 1, height: 1, bothSides: true, mat: mats.smoke });
		mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
		mesh.isVisible = false;
		mesh.isPickable = false;
		mesh.receiveShadows = false;
		cards.push({ mesh, left: 0, life: 1, grow: 0, from: 1, to: 4, rise: 0, out: 0, spin: 0, cap: false });
	}
	let nextCard = 0;
	function card() {
		const c = cards[nextCard];
		nextCard = (nextCard + 1) % cards.length;
		c.mesh.isVisible = true;
		c.left = c.life;
		return c;
	}

	/** A card that lives for `life` seconds, growing from `from` to `to` metres across. */
	function puff(at, mat, { life, from, to, rise = 0, out = 0, cap = false, spin = 0 }) {
		const c = card();
		c.mesh.material = mat;
		c.mesh.position.set(at.x, at.y, at.z);
		c.life = c.left = life;
		c.from = from;
		c.to = to;
		c.rise = rise;
		c.out = out;
		c.cap = cap;
		c.spin = spin;
		c.baseY = at.y;
		c.mesh.visibility = 1;
		return c;
	}

	// ---- the ground cards: a scorch, and a ring going out -------------------------
	const scorch = plane(scene, "blastScorch", {
		width: 1, height: 1, px: 0, py: 0.012, pz: 0, rx: Math.PI / 2, bothSides: true, mat: mats.scorch,
	});
	scorch.isVisible = false;
	scorch.isPickable = false;
	const ring = plane(scene, "blastRing", {
		width: 1, height: 1, px: 0, py: 0.03, pz: 0, rx: Math.PI / 2, bothSides: true, mat: mats.shockRing,
	});
	ring.isVisible = false;
	ring.isPickable = false;
	let scorchLeft = 0;
	let ringLeft = 0;
	let ringSize = 0;
	// How much daylight the cloud is holding off, recomputed every frame from the cards that are out.
	let shade = 0;

	// ---- the rockets -------------------------------------------------------------
	const rockets = [];
	for (let i = 0; i < 4; i++) {
		const node = new TransformNode(`rocket${i}`, scene);
		const parts = [
			cylinder(scene, `rocketBody${i}`, {
				diameter: 0.1, height: 0.34, tessellation: 8, rx: Math.PI / 2, mat: mats.weaponGrip, parent: node,
			}),
			cylinder(scene, `rocketNose${i}`, {
				diameter: 0.1, diameterTop: 0.005, height: 0.14, tessellation: 8, rx: Math.PI / 2, pz: 0.24,
				mat: mats.weaponSteel, parent: node,
			}),
			box(scene, `rocketFin${i}A`, { x: 0.2, y: 0.012, z: 0.1, pz: -0.14, mat: mats.weaponSteel, parent: node }),
			box(scene, `rocketFin${i}B`, { x: 0.012, y: 0.2, z: 0.1, pz: -0.14, mat: mats.weaponSteel, parent: node }),
		];
		for (const mesh of parts) {
			mesh.isPickable = false;
			mesh.receiveShadows = false;
		}
		node.setEnabled(false);
		rockets.push({ node, at: new Vector3(), on: false, left: 0, trail: 0 });
	}

	// ---- the pieces of the house --------------------------------------------------
	//
	// Three masters, because the house is three materials to the eye: plaster, roof tile, and the timber of
	// the sala and the floors. A piece torn out of a wall is the colour of that wall, and a debris field of one
	// grey is a gravel heap.
	const masters = [
		{ mat: mats.plaster, mesh: box(scene, "chunkPlaster", { x: 1, y: 1, z: 1, mat: mats.plaster }) },
		{ mat: mats.roof, mesh: box(scene, "chunkRoof", { x: 1, y: 1, z: 1, mat: mats.roof }) },
		{ mat: mats.teak, mesh: "teak" in mats ? box(scene, "chunkTeak", { x: 1, y: 1, z: 1, mat: mats.teak }) : null },
	];
	for (const m of masters) {
		if (!m.mesh) continue;
		m.mesh.isVisible = false; // hidden, and NOT disabled: an instance of a disabled master is hidden too
		m.mesh.isPickable = false;
	}
	const chunks = [];

	/** Which master a piece of the house should wear. */
	function masterFor(name) {
		if (/roof|ridge|tile|eave|fascia|soffit/i.test(name)) return masters[1].mesh;
		if (/teak|floor|door|post|pier|column|sala|colon|shutter|framing|stud/i.test(name) && masters[2].mesh) {
			return masters[2].mesh;
		}
		return masters[0].mesh;
	}

	/**
	 * Break one mesh of the house into pieces and throw them.
	 *
	 * The pieces are cut out of the mesh's own bounding box on a grid whose spacing is chosen so no piece is
	 * smaller than a house brick or bigger than a metre: a wall broken into four is a wall broken into four,
	 * and a wall broken into forty is dust, which is not what a blast leaves.
	 */
	function smash(mesh, blastAt, budget) {
		mesh.computeWorldMatrix(true);
		const boxInfo = mesh.getBoundingInfo().boundingBox;
		const min = boxInfo.minimumWorld;
		const max = boxInfo.maximumWorld;
		const size = max.subtract(min);
		const middle = min.add(max).scale(0.5);
		const far = Math.hypot(middle.x - blastAt.x, middle.y - blastAt.y, middle.z - blastAt.z);
		// How many pieces, and no more than six to a side: a piece of wall a metre across is the largest thing
		// the eye reads as one piece, and a piece smaller than a brick is not a piece at all.
		let along = Math.max(1, Math.min(6, Math.round(size.z / 0.9)));
		let across = Math.max(1, Math.min(6, Math.round(size.x / 0.9)));
		let up = Math.max(1, Math.min(4, Math.round(size.y / 0.9)));
		let count = along * across * up;
		// A thin strip — a fascia, a rafter, a door — is cut along its length only, or it comes out as a pile of
		// cubes and the shape of the thing is lost.
		if (count > 1) {
			const thin = [size.x, size.y, size.z].indexOf(Math.min(size.x, size.y, size.z));
			if (thin === 0) across = 1;
			if (thin === 1) up = 1;
			if (thin === 2) along = 1;
			count = along * across * up;
		}
		if (count > budget) return 0;
		const master = masterFor(mesh.name);
		const dx = size.x / across;
		const dy = size.y / up;
		const dz = size.z / along;
		let made = 0;
		for (let i = 0; i < across; i++) {
			for (let j = 0; j < up; j++) {
				for (let k = 0; k < along; k++) {
					const at = new Vector3(min.x + dx * (i + 0.5), min.y + dy * (j + 0.5), min.z + dz * (k + 0.5));
					const inst = master.createInstance(`debris${chunks.length}`);
					inst.position.copyFrom(at);
					inst.scaling.set(
						Math.max(0.06, dx * (0.7 + rand() * 0.35)),
						Math.max(0.06, dy * (0.7 + rand() * 0.35)),
						Math.max(0.06, dz * (0.7 + rand() * 0.35))
					);
					inst.rotation.set(rand() * 3, rand() * 3, rand() * 3);
					inst.isPickable = false;
					inst.receiveShadows = false;
					// Away from the blast, and lifted. The lift is what makes it a blast and not a collapse: a
					// wall that only falls sideways is a wall that fell, and a wall thrown four metres into the
					// air comes down in pieces.
					const push = at.subtract(blastAt);
					const len = push.length() || 1;
					const strength = 17 / (1 + far / 9);
					const piece = {
						mesh: inst,
						at,
						vel: push.scale(strength / len).add(new Vector3((rand() - 0.5) * 5, 5 + rand() * 7 + strength * 0.25, (rand() - 0.5) * 5)),
						spin: new Vector3((rand() - 0.5) * 7, (rand() - 0.5) * 7, (rand() - 0.5) * 7),
						half: Math.max(dx, dy, dz) * 0.35,
						bounces: 0,
						settled: false,
					};
					chunks.push(piece);
					made++;
				}
			}
		}
		mesh.setEnabled(false);
		blown++;
		return made;
	}

	/** Put every piece away and bring the house back. */
	function restore() {
		for (const c of chunks) c.mesh.dispose();
		chunks.length = 0;
		for (const mesh of villa) mesh.setEnabled(true);
		for (const r of rockets) {
			r.on = false;
			r.node.setEnabled(false);
		}
		for (const c of cards) {
			c.left = 0;
			c.mesh.isVisible = false;
		}
		scorchLeft = 0;
		ringLeft = 0;
		shade = 0;
		scorch.isVisible = false;
		ring.isVisible = false;
		blown = 0;
	}

	// ---- the blast ---------------------------------------------------------------
	function blast(at) {
		if (sound) sound.play("boom", at, 1);
		// The fire: a handful of cards, big and brief. Fire is not smoke that has not started yet — it lives a
		// quarter of a second, it is at the blast and not above it, and it is the only thing in this file that
		// is brighter than the sun's own glare on water.
		for (let i = 0; i < 9; i++) {
			puff(
				at.add(new Vector3((rand() - 0.5) * 2.4, (rand() - 0.5) * 2.0, (rand() - 0.5) * 2.4)),
				mats.blastFire,
				{ life: 0.34 + rand() * 0.4, from: 1.2 + rand() * 2, to: 7 + rand() * 6, rise: 1.5 + rand() * 2 }
			);
		}
		// The column. Each card rises fast out of the fire and is dragged down as it goes; above CAP_AT metres
		// it stops rising and goes outward instead, which is the whole of how a mushroom is made — a stem that
		// cannot go on and a head that has to go sideways.
		for (let i = 0; i < 40; i++) {
			const away = rand();
			puff(
				at.add(new Vector3((rand() - 0.5) * 3.2, rand() * 2.2, (rand() - 0.5) * 3.2)),
				mats.smoke,
				{
					// Eight to sixteen seconds of smoke. A cloud that is gone in five is a firework and not a
					// mushroom: what makes the shape legible is that the head is still there, hanging, twenty
					// seconds after the fire went out.
					life: 8 + rand() * 8,
					from: 1.6 + rand() * 2.4,
					to: 8 + rand() * 11,
					rise: 4.5 + rand() * 3.5 - away * 1.2,
					out: 1.6 + rand() * 2.6,
					cap: true,
					spin: (rand() - 0.5) * 0.6,
				}
			);
		}
		// The ring along the ground, and the scorch under the blast.
		ring.position.set(at.x, 0.03, at.z);
		ring.isVisible = true;
		ringLeft = ringSize = 0;
		scorch.position.set(at.x, 0.012, at.z);
		scorch.scaling.setAll(9 + rand() * 4);
		scorch.rotation.y = rand() * 3;
		scorch.isVisible = true;
		scorchLeft = 1;
		// And the house, if the house is near.
		let budget = MAX_CHUNKS;
		for (const mesh of villa) {
			if (!mesh.isEnabled() || budget <= 0) continue;
			// A blast takes the walls and the roof and leaves the floors a person walks on. Two reasons and both
			// are load-bearing: the walk and the debris read floors out of a list made once when the Villa started
			// (`makeGround` in `src/ground.js`), so a smashed slab would leave the pieces of the house resting on a
			// floor that is no longer there; and a visitor who has blown the house up should still be able to walk
			// through where it stood.
			if (mesh.checkCollisions) continue;
			const made = smash(mesh, at, budget);
			budget -= made;
		}
	}

	/** One rocket off the tube. Public through `fire()` so a tool can pull the trigger without a hand on it. */
	function fire() {
		if (mode !== "rocket") return false;
		const rocket = rockets.find((r) => !r.on);
		if (!rocket) return false;
		const forward = new Vector3(0, 0, 0);
		camera.getDirectionToRef(Vector3.Forward(), forward);
		rocket.at.copyFrom(camera.position).add(forward.scale(0.9));
		rocket.node.position.copyFrom(rocket.at);
		rocket.node.lookAt(rocket.at.add(forward));
		rocket.node.setEnabled(true);
		rocket.on = true;
		rocket.left = FUSE;
		rocket.trail = 0;
		rocket.dir = forward.clone();
		if (sound) sound.play("launch", camera.position, 1);
		return true;
	}

	function setMode(on) {
		const want = on ? "rocket" : "gun";
		if (mode === want) return;
		mode = want;
		tube.setEnabled(on);
		if (on && sound) sound.play("coin", camera.position, 0.7);
	}

	// ---- every frame -------------------------------------------------------------
	function animate(time, delta) {
		let spread = 0;
		// The rockets: a straight line, and a ray along it to ask whether anything is in the way. Straight is
		// right here: at thirty metres a second and three and a half seconds of fuse, gravity takes a rocket
		// eleven metres down over the whole garden, which is a droop a visitor would call a fault.
		for (const r of rockets) {
			if (!r.on) continue;
			r.left -= delta;
			const step = SPEED * delta;
			const ray = new Ray(r.at, r.dir, step);
			const hit = scene.pickWithRay(ray, (m) => m.isPickable && m.isVisible);
			const next = r.at.add(r.dir.scale(step));
			r.trail -= delta;
			if (r.trail <= 0) {
				r.trail = 0.05;
				puff(r.at.clone(), mats.smoke, { life: 1.1 + rand() * 0.7, from: 0.35, to: 2.6 + rand() * 1.4, rise: 0.6, out: 0.3 });
			}
			if ((hit && hit.hit && hit.pickedPoint) || r.left <= 0) {
				const at = hit && hit.hit && hit.pickedPoint ? hit.pickedPoint : next;
				r.on = false;
				r.node.setEnabled(false);
				blast(at);
				continue;
			}
			r.at.copyFrom(next);
			r.node.position.copyFrom(next);
			if (r.at.lengthSquared() > RANGE * RANGE || r.at.y < -4) {
				r.on = false;
				r.node.setEnabled(false);
			}
		}

		// The cards.
		for (const c of cards) {
			if (c.left <= 0) continue;
			c.left -= delta;
			const left = Math.max(0, c.left / c.life);
			const grown = c.from + (c.to - c.from) * (1 - left);
			c.mesh.scaling.setAll(grown);
			if (c.rise) {
				// Drag: the column loses its lift as it goes, which is what makes the top of a mushroom slow
				// and the bottom of one fast.
				c.rise *= 1 - Math.min(0.9, 0.34 * delta);
				c.mesh.position.y += c.rise * delta;
			}
			if (c.cap && c.mesh.position.y > 0 && c.rise < 2.4) {
				// Above the height the lift runs out at, the smoke has nowhere to go but out.
				const dx = c.mesh.position.x;
				const dz = c.mesh.position.z;
				const len = Math.hypot(dx, dz) || 1;
				c.mesh.position.x += (dx / len) * c.out * delta;
				c.mesh.position.z += (dz / len) * c.out * delta;
			}
			// And the head of the cloud goes pale as it rises, because soot at thirty metres is a cloud and soot
			// at three metres is a chimney.
			if (c.cap && c.mesh.position.y > c.baseY + CAP_AT && c.mesh.material !== mats.smokeCap) {
				c.mesh.material = mats.smokeCap;
			}
			// Smoke fades in its last half-life; fire goes out at once, because fire does not linger. The test is
			// `cap` and not the material, because a smoke card changes material halfway up the column and would
			// otherwise start going out like a flame the moment it turned pale.
			c.mesh.visibility = c.cap ? Math.min(1, left * 1.9) : left * left;
			if (c.left <= 0) c.mesh.isVisible = false;
			if (c.cap) spread += Math.min(1, (1 - left) * 2);
		}

		// How much of the sky the cloud is covering, which the day knows nothing about. A card counts towards it
		// by how far it has grown, and two dozen full cards is the whole of the shade — which is about what forty
		// cards come to once half of them are thinning out. The number rises as the cloud spreads and falls as it
		// thins, and `main.js` multiplies the sun and the sky's fill by it, so the garden goes dim under a cloud
		// and comes back a minute later without anything having to be remembered.
		shade = Math.min(1, spread / 24);

		// The ring goes out along the ground in three quarters of a second, and the scorch stays.
		if (ringLeft < 1 && ring.isVisible) {
			ringLeft = Math.min(1, ringLeft + delta / 0.75);
			ringSize = 1 + ringLeft * 26;
			ring.scaling.setAll(ringSize);
			ring.visibility = (1 - ringLeft) * 0.9;
			if (ringLeft >= 1) {
				ring.isVisible = false;
				ring.visibility = 1;
			}
		}
		if (scorchLeft > 0) {
			scorchLeft -= delta / 26; // the mark fades over half a minute, and then the lawn is the lawn again
			scorch.visibility = Math.max(0, scorchLeft);
			if (scorchLeft <= 0) scorch.isVisible = false;
		}

		// The pieces of the house: gravity, the ground, and then nothing.
		for (const p of chunks) {
			if (p.settled) continue;
			p.vel.y -= 9.81 * delta;
			p.at.addInPlace(p.vel.scale(delta));
			p.mesh.position.copyFrom(p.at);
			p.mesh.rotation.x += p.spin.x * delta;
			p.mesh.rotation.y += p.spin.y * delta;
			p.mesh.rotation.z += p.spin.z * delta;
			const floor = (ground ? ground.heightAt(p.at.x, p.at.z) : 0) + p.half;
			if (p.at.y <= floor) {
				p.at.y = floor;
				p.bounces++;
				p.vel.y = -p.vel.y * 0.32;
				p.vel.x *= 0.62;
				p.vel.z *= 0.62;
				p.spin.scaleInPlace(0.4);
				// Two bounces and a slow piece is a piece at rest. A brick that goes on twitching is the surest
				// tell there is no physics in the world at all.
				if (p.bounces >= 2 || p.vel.lengthSquared() < 0.7) {
					p.settled = true;
					p.mesh.rotation.y = Math.round(p.mesh.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
					p.mesh.rotation.x = 0;
					p.mesh.rotation.z = 0;
					p.mesh.position.y = floor;
				}
			}
		}
	}

	return {
		get mode() {
			return mode;
		},
		get rocketOut() {
			return mode === "rocket";
		},
		get blown() {
			return blown;
		},
		get chunksOut() {
			return chunks.length;
		},
		get rocketsOut() {
			return rockets.filter((r) => r.on).length;
		},
		get cardsOut() {
			return cards.filter((c) => c.left > 0).length;
		},
		/** How much of the daylight the cloud is holding off, from nought to one. For the lights in `main.js`. */
		get shade() {
			return shade;
		},
		setMode,
		fire,
		blast,
		restore,
		animate,
	};
}
