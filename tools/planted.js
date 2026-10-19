// Which plants are rooted in stone instead of soil.
//
// Why this exists. A browser pick said a shrub was standing at y = 0.6 in the middle of the teak
// terrace, and more looking about found the same thing on the pool deck: palms, shrubs and banana
// plants whose feet are on the paving rather than in the garden. A green lump sitting on cut stone
// reads as a mistake from any distance, and it is a mistake: nothing can grow there.
//
// The Villa's own ground answers the question, so this cannot disagree with the geometry. `feet.js`
// reads the built meshes and says how high the ground is anywhere; lawn gives nought, the pool deck
// 0.14, the terrace 0.54, the sala floor 0.66. So a plant whose foot finds more than a finger's
// height of ground under it is standing on built stone, and is named here.
//
//   node tools/planted.js            -> every plant whose foot is not on soil, and where it stands
//   node tools/planted.js --all      -> every plant, whether it is right or not

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
global.BABYLON = BABYLON;

const wantAll = process.argv.includes("--all");

const { makeGround } = await import("../src/ground.js");
const { buildGround, buildBoundary, buildDistance } = await import("../src/world.js");
const { buildVilla } = await import("../src/villa.js");
const { buildPool } = await import("../src/pool.js");
const { buildGarden } = await import("../src/garden.js");
const { buildProps } = await import("../src/props.js");

const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);
const mats = new Proxy({}, { get: (c, k) => (c[k] = c[k] || new BABYLON.PBRMaterial(String(k), scene)) });
const noShadows = { addShadowCaster() {} };

buildGround(scene, mats);
buildBoundary(scene, mats);
buildDistance(scene, mats);
buildVilla(scene, mats, noShadows);
buildPool(scene, mats, noShadows);
const built = [...buildGarden(scene, mats, noShadows), ...buildProps(scene, mats, noShadows)];
const ground = makeGround(scene, [[-5, 5, 2.1, 7.1]]);

// What counts as a plant, by the name its builder gives it. Potted things are left out: a pot is a
// plant's soil, and the props file puts those on the paving on purpose.
const PLANTS = [
	["palmTrunk", "palm"],
	["palmLeaves", "palm crown"],
	["shrub", "shrub"],
	["banana", "banana"],
	["rock", "boulder"],
];

const seen = new Map();
for (const mesh of built) {
	const named = PLANTS.find((entry) => mesh.name.startsWith(entry[0]));
	if (!named) continue;
	const what = named[1];
	mesh.computeWorldMatrix(true);
	// Where the plant stands, read off its own world box and not off `mesh.position`. A plant folded
	// into one mesh — a shrub of nine lumps, a banana crown of forty cards — carries its place in its
	// geometry and leaves `position` at the origin, so the position would report every one of them at
	// x=0, z=0, which is the middle of the terrace, and the tool would cry wolf.
	const p = mesh.getBoundingInfo().boundingBox.centerWorld;
	const on = ground.heightAt(p.x, p.z);
	const key = `${what}@${p.x.toFixed(1)},${p.z.toFixed(1)}`;
	if (seen.has(key)) continue;
	seen.set(key, { what, x: p.x, z: p.z, on });
}

const worst = [...seen.values()].filter((p) => p.on > 0.05);
const fine = [...seen.values()].filter((p) => p.on <= 0.05);

// A shrub is twelve lumps folded into one mesh and a palm crown sits over the foot its trunk stands on:
// one line per clump, not per mesh.
const clumps = [];
for (const p of worst) {
	const near = clumps.find((c) => Math.abs(c.x - p.x) < 1.2 && Math.abs(c.z - p.z) < 1.2);
	if (near) {
		near.n++;
		if (!near.what.includes(p.what)) near.what += ` + ${p.what}`;
	} else clumps.push({ ...p, n: 1 });
}

const named = { "0.00": "lawn", "0.14": "pool paving", "0.54": "teak terrace", "0.66": "sala floor" };
console.log(`${seen.size} plant parts looked at, ${clumps.length} clumps of them rooted in built stone and not in soil`);
for (const p of clumps.sort((a, b) => b.on - a.on || a.x - b.x)) {
	const what = named[p.on.toFixed(2)] || `something ${p.on.toFixed(2)} m high`;
	console.log(`  ${p.what.padEnd(22)} at x=${p.x.toFixed(1).padStart(6)} z=${p.z.toFixed(1).padStart(6)}  stands on the ${what} (${p.n} parts)`);
}
if (wantAll) {
	console.log(`\nand the ${fine.length} that are in the garden as they should be`);
	for (const p of fine.sort((a, b) => a.what.localeCompare(b.what))) {
		console.log(`  ${p.what.padEnd(11)} at x=${p.x.toFixed(1).padStart(6)} z=${p.z.toFixed(1).padStart(6)}`);
	}
}
engine.dispose();
