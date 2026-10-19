// How many triangles the Villa asks the browser to draw, and which of its parts they belong to.
//
// Everything in this garden is built out of mesh now — a palm is a stalk with leaflets standing off it,
// a shrub is a shell of leaf cards, a banana is a rib with a torn blade — and every one of those cards
// is triangles that a software renderer has to put on the screen a couple of times a second. A change
// that doubles a plant's detail is worth making and worth paying for; one that doubles it by accident is
// not, and nothing on the page says which is which.
//
// This counts, on the Null engine, without a browser: what the whole Villa is made of, and what each of
// its biggest leafy parts is made of, so a session that changes one plant can say what it cost. Read the
// triangle columns with `tools/fps.js` beside it: this is the bill and that is what the frame pays.
//
//   node tools/tris.js            -> the whole Villa, then the biggest single meshes
//   node tools/tris.js banana     -> only meshes whose name contains "banana", and their total

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
global.BABYLON = BABYLON;

const filter = process.argv[2] || null;

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
buildGarden(scene, mats, noShadows);
buildProps(scene, mats, noShadows);

// The same family of meshes, by the name its builder gives it: every mesh whose name starts with these
// words is counted as one plant part.
const FAMILIES = ["bananaLeaves", "bananaStems", "bananaBud", "palmLeaves", "palmTrunk", "shrub", "hedgeCrest", "hedge", "jungleBelt", "jungleHighBelt", "farPalmFronds", "farBelt", "grassTufts", "bush", "tuft", "canopy"];

const tris = (mesh) => {
	const idx = mesh.getTotalIndices();
	return idx ? idx / 3 : 0;
};

const byFamily = new Map();
let all = 0;
let meshes = 0;
for (const mesh of scene.meshes) {
	const n = tris(mesh);
	if (!n) continue;
	all += n;
	meshes++;
	const family = FAMILIES.find((name) => mesh.name.startsWith(name));
	if (family) {
		const row = byFamily.get(family) || { n: 0, parts: 0 };
		row.n += n;
		row.parts++;
		byFamily.set(family, row);
	}
}

const fmt = (n) => n.toLocaleString("en-GB");
console.log(`the Villa: ${fmt(all)} triangles across ${fmt(meshes)} meshes`);
if (filter) {
	const hits = scene.meshes.filter((m) => m.name.includes(filter) && tris(m) > 0);
	const sum = hits.reduce((a, m) => a + tris(m), 0);
	console.log(`\n"${filter}": ${fmt(sum)} triangles across ${hits.length} meshes`);
	for (const m of hits.sort((a, b) => tris(b) - tris(a)).slice(0, 12)) {
		console.log(`  ${m.name.padEnd(26)} ${fmt(tris(m)).padStart(9)}`);
	}
	console.log(`  ${fmt(sum)} of ${fmt(all)} = ${(100 * sum / all).toFixed(1)}% of the Villa`);
} else {
	console.log("\nby plant part, biggest first");
	for (const [name, row] of [...byFamily].sort((a, b) => b[1].n - a[1].n)) {
		console.log(`  ${name.padEnd(16)} ${fmt(row.n).padStart(9)} in ${String(row.parts).padStart(3)} meshes (${(100 * row.n / all).toFixed(1)}% of the Villa)`);
	}
	console.log("\nthe twelve biggest meshes");
	for (const m of scene.meshes.filter((m) => tris(m) > 0).sort((a, b) => tris(b) - tris(a)).slice(0, 12)) {
		console.log(`  ${m.name.padEnd(26)} ${fmt(tris(m)).padStart(9)}`);
	}
}
engine.dispose();
