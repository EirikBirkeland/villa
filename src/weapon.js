// The gun. Because a man being circled by a shark should not have to stand there and take it.
//
// WHAT IT IS. The visitor is unarmed when they arrive, walks about, and may ask to be armed by typing
// `G U N` — three letters in a row, and the same three letters again put the gun away. Once armed there is a
// gun across the bottom right of the sight and the left mouse button sprays. That is the whole of the
// control: no ammo, no reload, no modes, nothing to look up. The Villa is a garden and this is a garden gun;
// it does not run out, because running out would be the only interesting thing about it and the shark is the
// interesting thing.
//
// WHY THREE LETTERS AND NOT ONE KEY. Every key on this page is already spent: W A S D and the arrows walk,
// shift runs, space leaves the ground, R returns, M is the ear. A fourth single key would be a fifth thing to
// read on the plate for a thing a visitor is unlikely to want. A typed word costs no key at all, cannot be
// struck by accident by anybody whose hands are where they belong, and is said once in the changelog rather
// than shouted from the plate.
//
// WHAT A ROUND DOES. A line is thrown from the sight into the garden and whatever it lands on answers. Water
// answers with a ring and a crown (`src/pool.js`). Ground, plaster and pots answer with a spurt of dust. The
// shark answers by being hit: it is thrown, it bleeds into the pool, and after three good hits it has had
// enough of the visitor and goes down to the dark end of the pool to think about the matter (`src/shark.js`).
// Nothing dies. That was decided and not stumbled into: this is a villa with a duck, some koi and a shark
// with a grievance, and a dead animal under a sunlounger is not a garden, it is a photograph somebody regrets.
//
// HOW IT IS MADE. The gun is a handful of boxes and cylinders worn by the camera, so it turns with the head
// the way a gun does. It is deliberately NOT in a render group of its own: it hangs forty centimetres in
// front of the eye, nearer than anything else out there by a wide margin, so the ordinary distance sort draws
// it in front without being told — and render groups have already cost this Villa a pool painted across a
// house (`src/pool.js`), so they are not handed out here either. It is also not a shadow caster: nothing
// registers it with the shadow lamp, and a gun that throws a shadow across the lawn would be the single most
// ridiculous thing in the picture.

const { Vector3, Ray, TransformNode, Mesh } = BABYLON;

import { box, cylinder, plane } from "./mesh.js";

/** How far the sight can throw a hit. Past this a round is noise and nothing else. */
const RANGE = 90;
/** Rounds in a second while the button is held. */
const PER_SECOND = 8.5;
/** How far back the gun is driven by a shot, in metres, and how fast the spring lets it back. */
const KICK = 0.055;
const RECOVER = 7;
/** How long a spurt hangs in the air, in seconds. */
const SPURT = 0.34;
/** The word that arms the gun, and puts it away again. */
const WORD = ["g", "u", "n"];

export function buildWeapon(scene, mats, { camera, pool, shark, sound } = {}) {
	let armed = false;
	let firing = false;
	let since = 0;
	let kick = 0;
	let flash = 0;
	let step = 0;

	// The gun, laid across the bottom right of the sight the way a weapon is carried when a man is not
	// pointing it at anything in particular. At forty centimetres from the eye a gun is silhouette and not
	// detail: what makes it a machine gun and not a brick is the barrel out in front, the magazine hanging
	// below it, and the fact that the whole thing is aimed off to the right of where you are looking.
	const gun = new TransformNode("gun", scene);
	gun.parent = camera;
	gun.position.set(0.16, -0.15, 0.4);
	gun.rotation.set(0.02, -0.07, 0.03);
	gun.setEnabled(false);

	const parts = [
		box(scene, "gunBody", { x: 0.055, y: 0.075, z: 0.3, pz: 0.02, mat: mats.weaponSteel, parent: gun }),
		box(scene, "gunReceiver", { x: 0.05, y: 0.05, z: 0.16, py: 0.055, pz: -0.02, mat: mats.weaponSteel, parent: gun }),
		box(scene, "gunStock", { x: 0.045, y: 0.065, z: 0.17, py: 0.0, pz: -0.21, rx: -0.06, mat: mats.weaponGrip, parent: gun }),
		box(scene, "gunGrip", { x: 0.04, y: 0.11, z: 0.05, py: -0.075, pz: -0.05, rx: -0.22, mat: mats.weaponGrip, parent: gun }),
		box(scene, "gunMagazine", { x: 0.038, y: 0.15, z: 0.06, py: -0.095, pz: 0.06, rx: 0.3, mat: mats.weaponSteel, parent: gun }),
		box(scene, "gunForegrip", { x: 0.036, y: 0.085, z: 0.05, py: -0.05, pz: 0.17, rx: -0.15, mat: mats.weaponGrip, parent: gun }),
		box(scene, "gunSight", { x: 0.012, y: 0.03, z: 0.02, py: 0.086, pz: 0.12, mat: mats.weaponSteel, parent: gun }),
		cylinder(scene, "gunBarrel", {
			diameter: 0.026, height: 0.26, tessellation: 10, rx: Math.PI / 2, py: 0.026, pz: 0.27,
			mat: mats.weaponSteel, parent: gun,
		}),
		cylinder(scene, "gunJacket", {
			diameter: 0.042, diameterTop: 0.036, height: 0.16, tessellation: 8, rx: Math.PI / 2, py: 0.026, pz: 0.16,
			mat: mats.weaponSteel, parent: gun,
		}),
	];
	// The sight's own bead is the only part of this that is looked AT rather than past, so it is the one piece
	// given a hard shine; and none of it is pickable, because a ray fired from the eye must not stop on the
	// barrel it was fired through.
	for (const mesh of parts) {
		mesh.isPickable = false;
		mesh.receiveShadows = false;
	}

	// The muzzle flash: a cross of two thin sheets and a ball, self-lit and orange, alive for two frames. It
	// is not a lamp. A real flash would be a light switching on and off eight times a second, and this renderer
	// would spend the whole frame budget on shadow maps for the pleasure of one orange flicker. A bright quad
	// at the muzzle, over the bloom's threshold, is what the eye is actually looking for.
	const flashNode = new TransformNode("gunFlash", scene);
	flashNode.parent = gun;
	flashNode.position.set(0, 0.026, 0.42);
	flashNode.setEnabled(false);
	for (const [name, opts] of [
		["gunFlash0", { width: 0.18, height: 0.05, rz: 0.4 }],
		["gunFlash1", { width: 0.18, height: 0.05, rz: -0.4 }],
		["gunFlashBall", { width: 0.07, height: 0.07 }],
	]) {
		const mesh = plane(scene, name, { ...opts, bothSides: true, mat: mats.muzzleFlash, parent: flashNode });
		mesh.isPickable = false;
	}

	// Where rounds land. Six marks, reused, so a burst of thirty throws six spurts instead of building thirty
	// meshes in a frame that is already busy. Each carries its own visibility, because one material's alpha is
	// one number written sixty times and this Villa has already learned that lesson once (`src/blood.js`).
	const spurts = [];
	for (let i = 0; i < 6; i++) {
		const mesh = plane(scene, `spurt${i}`, { width: 1, height: 1, bothSides: true, mat: mats.spurtDust });
		mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
		mesh.isVisible = false;
		mesh.isPickable = false;
		spurts.push({ mesh, left: 0, life: SPURT, size: 0.24 });
	}
	let nextSpurt = 0;

	/**
	 * A mark where a round arrived. The material is what says what was struck — water throws pale and bright,
	 * plaster and soil throw dust, a shark throws red — because a spurt the wrong colour is a sticker.
	 */
	function spurt(at, size, which) {
		const s = spurts[nextSpurt];
		nextSpurt = (nextSpurt + 1) % spurts.length;
		s.mesh.position.set(at.x, at.y, at.z);
		s.mesh.material = which;
		s.mesh.isVisible = true;
		s.life = s.left = SPURT * (0.8 + Math.random() * 0.4);
		s.size = size;
		s.mesh.visibility = 1;
	}

	/**
	 * One round: throw the line, ask what it hit, answer, and make the noise. Public through `shoot()` so a
	 * tool can pull the trigger without a hand on it (`tools/shoot.js`).
	 */
	function fire() {
		kick = 1;
		flash = 1;
		flashNode.setEnabled(true);
		if (sound) sound.play("shot", camera.position, 1);
		const forward = new Vector3(0, 0, 0);
		// `getDirectionToRef` WRITES INTO the vector you hand it and hands back nothing — measured in this build,
		// where `const f = camera.getDirectionToRef(Vector3.Forward(), new Vector3())` is a `f` of `undefined` and
		// a ray built on it is a ray with no direction at all. One vector per round, reused, and read by name.
		camera.getDirectionToRef(Vector3.Forward(), forward);
		const ray = new Ray(camera.position.clone(), forward, RANGE);
		const hit = scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh.isVisible);
		if (!hit || !hit.hit || !hit.pickedPoint) return;
		const p = hit.pickedPoint;
		const name = (hit.pickedMesh && hit.pickedMesh.name) || "";
		if (/^shark/i.test(name) && shark && shark.takeHit) {
			shark.takeHit(1, p);
			spurt(p, 0.3, mats.spurtBlood);
			return;
		}
		if (/^(water|pool|splash)/i.test(name) && pool && pool.splash) {
			// A round into the water throws a ring and a crown — and if the animal's back is near the surface
			// under that mark, it throws the animal too (`src/shark.js` says why only a shallow shark can be
			// struck from the bank). The creature under there hears the report whether the line found it or not,
			// and being shot at from a dry deck is its problem to solve.
			if (shark && shark.hitIfNear && shark.hitIfNear(p)) {
				spurt(p, 0.3, mats.spurtBlood);
				return;
			}
			pool.splash(p.x, p.z, { across: 0.26, span: 1.7, show: 0.55, life: 1.7 });
			spurt(p, 0.32, mats.spurtWater);
			return;
		}
		spurt(p, 0.19, mats.spurtDust);
	}

	function setArmed(on) {
		if (armed === on) return;
		armed = on;
		gun.setEnabled(on);
		if (!on) firing = false;
		// The bolt. There is no such sound in the garden, and the coin is the one voice in the ear that is
		// metal — short and dry enough to pass for a bolt going home at a metre's distance.
		if (on && sound) sound.play("coin", camera.position, 0.6);
	}

	window.addEventListener("keydown", (event) => {
		const key = (event.key || "").toLowerCase();
		if (key === WORD[step]) {
			step++;
			if (step === WORD.length) {
				step = 0;
				setArmed(!armed);
			}
			return;
		}
		// Wrong letter, start again: the word is a word and not a bag of letters. A typed word that also
		// counts a letter from the middle of itself ("GUGUN" arming a gun) is a word that arms itself by
		// accident on the way to somewhere else.
		step = key === WORD[0] ? 1 : 0;
	});

	const canvas = scene.getEngine().getRenderingCanvas();
	if (canvas) {
		canvas.addEventListener("pointerdown", (event) => {
			if (armed && event.button === 0) firing = true;
		});
	}
	// Let go is listened for on the window and not the canvas, for the same reason the drag is: a person who
	// releases the button past the edge of the picture tells the window and not the canvas, and a gun that
	// keeps spraying after that is a gun fired by a bug.
	window.addEventListener("pointerup", (event) => {
		if (event.button === 0) firing = false;
	});
	window.addEventListener("blur", () => { firing = false; });

	return {
		get armed() { return armed; },
		get firing() { return firing; },
		arm: setArmed,
		shoot: fire,
		get spurtsOut() { return spurts.filter((s) => s.left > 0).length; },
		animate(delta) {
			// The marks are wound whether the gun is out or not: a spurt put away mid-air would be a puff
			// frozen on the lawn until the visitor felt like shooting again.
			for (const s of spurts) {
				if (s.left <= 0) continue;
				s.left -= delta;
				const left = Math.max(0, s.left / s.life);
				s.mesh.scaling.setAll(s.size * (1.6 - left * 0.7));
				s.mesh.visibility = left * 0.9;
				if (s.left <= 0) s.mesh.isVisible = false;
			}
			if (!armed) return;
			since += delta;
			const every = 1 / PER_SECOND;
			while (firing && since >= every) {
				since -= every;
				fire();
			}
			if (!firing) since = 0;
			// The kick is a spring: driven back to full in one frame and spent over three, with the gun
			// climbing up the sight as it goes because that is what a gun does in a shoulder.
			kick = Math.max(0, kick - delta * RECOVER);
			flash = Math.max(0, flash - delta * 22);
			if (flash <= 0) flashNode.setEnabled(false);
			gun.position.z = 0.4 - KICK * kick;
			gun.rotation.x = 0.02 + 0.17 * kick;
			flashNode.rotation.z += delta * 26;
			flashNode.scaling.setAll(0.7 + kick * 0.55);
		},
	};
}
