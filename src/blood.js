// Blood in the pool: what the shark's bite leaves in the water, and how it goes away.
//
// WHY THIS IS A THING AT ALL. The master asked for a small shark that bites when you come too close, and a
// bite that leaves nothing is a pantomime: the jaw closes, nothing happens, and the animal was never real.
// What blood does in still water is the whole theatre — it comes out in LUMPS, hangs, spreads, and thins
// until the pool is the colour of weak tea and then is gone. So the visitor who is bitten gets a red cloud
// rolling out under the surface from where they were standing, and it takes half a minute to clear.
//
// HOW IT IS MADE. Not a splat and not one expanding disc: a cloud of soft billboards and a raft of flat
// cards just under the surface, all wearing `mats.blood` / `mats.bloodB`, whose pattern (`bloodCanvas` in
// `src/textures.js`) is already a lump of dye with ragged edges. One lump per mesh, each on its own clock:
//
//   the PLUME   camera-facing cards that come out of the wound at a third of their final size, drift down
//               and out, and grow as they thin. Camera-facing because a cloud has no flat side of its own:
//               whatever way you look at it, the billow is what you see.
//   the SLICK   flat cards laid just under the surface, which is where a buoyant spill actually goes and
//               the only part of it legible from ten metres off. These grow wide and flat, and they are what
//               makes the stain read as being IN the pool and not painted on top of it.
//
// Both are spent from a fixed pool of meshes — nothing is built at the moment of the bite, because a bite
// lands in a frame that is already busy — and each one carries its own `visibility`, not the material's.
// One material's alpha shared by twenty-six meshes is one number written twenty-six times: the pool's own
// caustics learned that the hard way (`src/pool.js`).
//
// THE ORDERING, which is the one thing here that cannot be seen from the code: the blood is UNDER the
// water's film, so it must be DRAWN before it or it will sit on top of the surface like a sticker. The
// distance sort does that on its own once the film does not write depth, which is said where the film is
// made (src/pool.js). This used to be forced with render groups, and that was wrong: a later group is drawn
// over an earlier one whatever is in the way, and the villa is mostly glass, so the pool was being painted
// across the house, dry deck and all.

const { Mesh, VertexData } = BABYLON;

/** How many lumps are in the pool, and how many flat cards. */
const PLUMES = 18;
const SLICKS = 8;

/** A unit quad: two triangles, a metre across, its middle at the origin. */
function quad(scene, name, { flat }) {
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();
	// A billboard is spun to face the eye about its own +z, so a card that is to face the camera must lie in
	// the XY plane; a card that is to lie flat on the water is built in XZ instead, which needs no rotation
	// and no billboard.
	if (flat) {
		vertexData.positions = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5];
		vertexData.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
	} else {
		vertexData.positions = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0];
		vertexData.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
	}
	vertexData.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
	vertexData.indices = [0, 1, 2, 0, 2, 3];
	vertexData.applyToMesh(mesh, true);
	return mesh;
}

/** A small repeatable random, the same one the koi and the shark use. */
function randomAt(seed) {
	let a = seed >>> 0;
	a = (a + 0x6d2b79f5) >>> 0;
	let t = a;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * A spill of blood that knows how to grow old.
 *
 * `pool` is the basin's own rectangle and surface height, so a spill can be held inside the walls instead
 * of staining the coping.
 */
export function buildBlood(scene, mats, pool) {
	const puffs = [];
	for (let i = 0; i < PLUMES + SLICKS; i++) {
		const slick = i >= PLUMES;
		const mesh = quad(scene, `blood${slick ? "Slick" : "Puff"}${i}`, { flat: slick });
		// Two canvases and two materials, so no two neighbouring lumps are the same shape.
		mesh.material = mats[slick ? "bloodB" : "blood"];
		mesh.isVisible = false;
		mesh.isPickable = false;
		if (!slick) mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
		puffs.push({
			mesh,
			slick,
			left: 0,
			life: 1,
			from: 0.2,
			to: 1,
			show: 0.6,
			x: 0,
			y: 0,
			z: 0,
			vx: 0,
			vy: 0,
			vz: 0,
			wob: 0,
		});
	}
	let thrown = 0;

	/** The next lump to spend: a free one if there is one, else the one nearest the end of its life. */
	function take(slick) {
		const ofKind = puffs.filter((p) => p.slick === slick);
		return ofKind.find((p) => p.left <= 0) || ofKind.reduce((a, b) => (a.left < b.left ? a : b));
	}

	/**
	 * Let a wound bleed.
	 *
	 * `(x, y, z)` is where the blood starts, in metres of the garden — for a bite that is the shark's own
	 * snout tip, a hand under the surface. `power` (0.4 to 1) is how hard the bite was: it buys lumps and
	 * size, and it is what lets a glancing snap be a pink wisp while a good bite turns the water over.
	 */
	function bleed(x, y, z, power = 1) {
		const p = pool;
		const bx = Math.min(p.x1 - 0.1, Math.max(p.x0 + 0.1, x));
		const bz = Math.min(p.z1 - 0.1, Math.max(p.z0 + 0.1, z));
		const by = Math.min(p.waterY - 0.02, Math.max(p.floorY + 0.06, y));
		const lumps = Math.max(3, Math.round(4 + power * 7));
		for (let i = 0; i < lumps; i++) {
			thrown += 1;
			const r = randomAt(thrown);
			const r2 = randomAt(thrown + 977);
			const r3 = randomAt(thrown + 6271);
			const puff = take(false);
			const th = r * Math.PI * 2;
			puff.x = bx + Math.cos(th) * 0.05 * r2;
			puff.y = by + (r2 - 0.5) * 0.06;
			puff.z = bz + Math.sin(th) * 0.05 * r3;
			// Out from the wound and down: blood is heavier than the water it is in, and the spreading is
			// slow enough that it is the sinking you notice first.
			const speed = 0.06 + power * 0.1;
			puff.vx = Math.cos(th) * speed * (0.4 + r2);
			puff.vz = Math.sin(th) * speed * (0.4 + r3);
			puff.vy = -0.014 - 0.02 * r;
			puff.from = 0.1 + 0.12 * r2;
			puff.to = 0.7 + power * 1.1 + r3;
			puff.life = 5 + power * 9 + r * 5;
			puff.show = 0.42 + power * 0.36;
			puff.left = puff.life;
			puff.wob = r * 6.283;
			puff.mesh.isVisible = true;
			puff.mesh.position.set(puff.x, puff.y, puff.z);
			puff.mesh.scaling.setAll(puff.from);
			puff.mesh.visibility = puff.show;
		}
		// And the raft that rides up to the surface: fewer cards, bigger, slower, and the only part of the
		// stain a visitor across the pool can see.
		const sheets = Math.max(1, Math.round(power * 3));
		for (let i = 0; i < sheets; i++) {
			thrown += 31;
			const r = randomAt(thrown + 4111);
			const r2 = randomAt(thrown + 8011);
			const puff = take(true);
			const th = r * Math.PI * 2;
			puff.x = bx + Math.cos(th) * 0.08;
			puff.y = p.waterY - 0.035;
			puff.z = bz + Math.sin(th) * 0.08;
			puff.vx = Math.cos(th) * 0.035;
			puff.vz = Math.sin(th) * 0.035;
			puff.vy = 0;
			puff.from = 0.2 + 0.2 * r2;
			puff.to = 1.6 + power * 2.4;
			puff.life = 8 + power * 12;
			puff.show = 0.3 + power * 0.28;
			puff.left = puff.life;
			puff.wob = r2 * 6.283;
			puff.mesh.isVisible = true;
			puff.mesh.position.set(puff.x, puff.y, puff.z);
			puff.mesh.scaling.set(puff.from, 1, puff.from);
			puff.mesh.visibility = puff.show;
		}
	}

	return {
		bleed,
		/** How many lumps are out there at the moment: `tools/where.js` and a good look both want this. */
		get spills() {
			return puffs.filter((p) => p.left > 0).length;
		},
		clear() {
			for (const p of puffs) {
				p.left = 0;
				p.mesh.isVisible = false;
			}
		},
		animate(time, delta) {
			for (const p of puffs) {
				if (p.left <= 0) continue;
				p.left -= delta;
				if (p.left <= 0) {
					p.mesh.isVisible = false;
					continue;
				}
				const u = 1 - p.left / p.life;
				// The spread is fast at first and then crawls: that is diffusion in still water, and an
				// even crawl all the way looks like a balloon being inflated.
				const grow = Math.sqrt(u);
				const size = p.from + (p.to - p.from) * grow;
				// A slow wander sideways, so no two lumps take the same road down, and no spill ever makes a
				// straight line to the floor.
				const drift = Math.sin(time * 0.35 + p.wob) * 0.012;
				p.x += (p.vx * (1 - grow * 0.7) + drift) * delta;
				p.z += (p.vz * (1 - grow * 0.7) - drift) * delta;
				p.y += p.vy * (1 - grow) * delta;
				// Held inside the walls: a spill that stains the coping is a spill that left the pool.
				p.x = Math.min(pool.x1 - 0.12, Math.max(pool.x0 + 0.12, p.x));
				p.z = Math.min(pool.z1 - 0.12, Math.max(pool.z0 + 0.12, p.z));
				// Never through the floor, and never through the surface.
				p.y = Math.min(pool.waterY - 0.03, Math.max(pool.floorY + 0.04, p.y));
				p.mesh.position.set(p.x, p.y, p.z);
				if (p.slick) p.mesh.scaling.set(size, 1, size);
				else p.mesh.scaling.setAll(size);
				// Thinning: the same dye in a bigger cloud, so the fade and the growth are one event and not
				// two. The tail is long — the last tenth of a spill hangs about for seconds, which is the
				// part that makes a pool look stained rather than painted.
				p.mesh.visibility = p.show * Math.pow(1 - u, 1.35);
			}
		},
	};
}
