// Which grass clumps are standing on built stone instead of on ground, and which are in the pool.
//
// The clumps are laid from a plan in `makeTuftPlan`, and the plan is numbers on a page: nothing in the
// Villa checks that a clump's foot lands where there is soil. A clump whose foot is on the pool paving is
// grass growing out of cut stone, and one whose foot is in the basin is grass in the water. This asks the
// Villa's own ground, the same way `planted.js` does, for the foot of every sheet in `grassTufts`.
//
//   node tools/tuftfoot.js            -> what is wrong, and where
//   node tools/tuftfoot.js --all      -> the tally as well

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
global.BABYLON = BABYLON;

const wantAll = process.argv.includes("--all");

const { makeGround } = await import("../src/ground.js");
const { buildGround, buildBoundary, buildDistance } = await import("../src/world.js");
const { buildVilla } = await import("../src/villa.js");
const { buildPool } = await import("../src/pool.js");
const { buildPond } = await import("../src/pond.js");
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
const pool = buildPool(scene, mats, noShadows);
const pond = buildPond(scene, mats, noShadows);
buildGarden(scene, mats, noShadows);
buildProps(scene, mats, noShadows);
const POOL = [-5, 5, 2.1, 7.1];
const ground = makeGround(scene, [POOL].concat(pond.walkBlocks));

const tufts = scene.getMeshByName("grassTufts");
const pos = tufts.getVerticesData(BABYLON.VertexBuffer.PositionKind);
const inPool = new Map();
const onStone = new Map();
let sheets = 0;
for (let i = 0; i < pos.length; i += 12) {
	// The four corners of one sheet, taken at its foot: a sheet is built base, base, tip, tip.
	const x = (pos[i] + pos[i + 3]) / 2;
	const z = (pos[i + 2] + pos[i + 5]) / 2;
	sheets++;
	const key = `${Math.round(x * 4) / 4},${Math.round(z * 4) / 4}`;
	if (x > POOL[0] && x < POOL[1] && z > POOL[2] && z < POOL[3]) inPool.set(key, (inPool.get(key) || 0) + 1);
	const on = ground.heightAt(x, z);
	if (on > 0.05) onStone.set(key, { on, n: (onStone.get(key) || 0) + 1 });
}
console.log(`${sheets} sheets looked at; ${onStone.size} places on built stone, ${inPool.size} in the pool`);
for (const [where, v] of [...onStone].sort((a, b) => b[1].on - a[1].on).slice(0, 12)) {
	console.log(`  on stone at ${where}  ground ${typeof v === "object" ? v.on.toFixed(2) : v}`);
}
for (const where of [...inPool].slice(0, 12)) console.log(`  in the pool at ${where[0]}`);
if (wantAll) console.log(`(every sheet counted, whether it is right or not: ${sheets})`);
engine.dispose();
