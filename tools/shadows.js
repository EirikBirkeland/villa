// Checks what the Villa asks the shadow lamp to cast, without a browser.
//
// The browser died in this sandbox, and `tools/feet.js` and `tools/draw.js` both stub the shadow
// generator out (`addShadowCaster() {}`), so nothing in here ever looked at what gets handed to it.
// Babylon's own `addShadowCaster` runs `for (const child of mesh.getChildMeshes())`, so a plain
// object, a light, or an array handed over by mistake throws "…getChildMeshes is not a function or
// its return value is not iterable" and the Villa never stands up. This tool builds the whole world
// under NullEngine and complains about every argument that is not a mesh, with the line that gave it.
//
//   node tools/shadows.js            -> a list of bad arguments, and a count of what was cast
//   node tools/shadows.js --quiet    -> only the bad arguments

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
global.BABYLON = BABYLON;

const quiet = process.argv.includes("--quiet");

const { buildGround, buildBoundary, buildDistance } = await import("../src/world.js");
const { buildVilla } = await import("../src/villa.js");
const { buildPool } = await import("../src/pool.js");
const { buildGarden } = await import("../src/garden.js");
const { buildProps } = await import("../src/props.js");

const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);

const mats = new Proxy(
	{},
	{
		get: (cache, key) => (cache[key] = cache[key] || new BABYLON.PBRMaterial(String(key), scene)),
		set: (cache, key, value) => (cache[key] = value),
	}
);

const cast = [];
const bad = [];

/**
 * Does what Babylon's ShadowGenerator.addShadowCaster does with its argument, and no more:
 * it walks `mesh.getChildMeshes()`. Whatever is not a mesh throws there in the browser, so
 * it is named here instead, with the caller's line.
 */
const shadows = {
	addShadowCaster(mesh, includeChildren = true) {
		cast.push(mesh);
		if (!(mesh instanceof BABYLON.Mesh)) {
			bad.push({ what: describe(mesh), where: caller() });
			return; // do not throw: name every bad argument, not just the first
		}
		if (includeChildren) {
			for (const child of mesh.getChildMeshes()) void child; // the very loop that threw
		}
	},
};

function describe(value) {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (Array.isArray(value)) return `an array of ${value.length}`;
	if (value instanceof BABYLON.Light) return `the light "${value.name}"`;
	if (value instanceof BABYLON.TransformNode) return `the bare node "${value.name}" (no vertices)`;
	if (value instanceof BABYLON.Node) return `the node "${value.name}" (${value.getClassName()})`;
	return typeof value === "object" ? "a plain object" : `the ${typeof value} ${JSON.stringify(value)}`;
}

/** The line in src/ that called addShadowCaster, skipping this file. */
function caller() {
	const line = (new Error().stack || "").split("\n").find((l) => /src[\\/]/.test(l));
	return line ? line.trim().replace(/^at\s+/, "") : "somewhere in src/";
}

buildGround(scene, mats);
buildBoundary(scene, mats);
buildDistance(scene, mats);
buildVilla(scene, mats, shadows);
buildPool(scene, mats, shadows);
buildGarden(scene, mats, shadows);
buildProps(scene, mats, shadows);

const names = new Map();
for (const mesh of cast) names.set(describe(mesh), (names.get(describe(mesh)) || 0) + 1);

if (!quiet) {
	console.log(`shadow casters: ${cast.length} asked for, ${names.size} distinct kinds`);
	const meshCount = cast.filter((m) => m instanceof BABYLON.Mesh).length;
	console.log(`  meshes: ${meshCount}, not meshes: ${cast.length - meshCount}`);
	console.log(`  meshes in the scene: ${scene.meshes.length}`);
}

if (bad.length) {
	console.log(`\nBAD: ${bad.length} shadow caster arguments are not meshes — the browser throws on the first of them:`);
	for (const b of bad) console.log(`  ${b.what}  <- ${b.where}`);
} else if (!quiet) {
	console.log("every shadow caster argument is a mesh: nothing here would throw.");
}
process.exit(bad.length ? 1 : 0);
