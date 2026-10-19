// Checks the Villa's walking without a browser: it builds the whole world in Node with Babylon's
// NullEngine (no drawing, so no pictures), reads where the feet go, and answers the questions a
// walk can be wrong about — does the ground hold me, can I get there from the start, is there a
// step I would stumble on.
//
//   node tools/feet.js              -> the places, the reachability, the stumbles, the blockers
//   node tools/feet.js --grid       -> a map of the garden, one character per half metre
//
// This is a numbers-only tool. It says nothing about how the Villa looks: for that, take a picture
// with tools/look.js, as the notes explain.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BABYLON = require("babylonjs");
// The Villa's own modules read the library off a global, the way a browser page does.
global.BABYLON = BABYLON;

const wantGrid = process.argv.includes("--grid");

const { makeGround } = await import("../src/ground.js");
const { buildGround, buildBoundary, buildDistance } = await import("../src/world.js");
const { buildVilla } = await import("../src/villa.js");
const { buildPool } = await import("../src/pool.js");
const { buildPond } = await import("../src/pond.js");
const { buildGarden } = await import("../src/garden.js");
const { buildProps } = await import("../src/props.js");

const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);

// Materials without any painted canvas: this tool only cares about where things are.
const mats = new Proxy(
	{},
	{
		get: (cache, key) => (cache[key] = cache[key] || new BABYLON.PBRMaterial(String(key), scene)),
		set: (cache, key, value) => (cache[key] = value),
	}
);

// A stand-in for the sun's shadow lamp. It does not shade anything, but it does check what it is
// handed: Babylon's real addShadowCaster runs `for (const child of mesh.getChildMeshes())`, so an
// array or a light given by mistake throws there and the Villa never stands up in a browser. See
// tools/shadows.js, which was written after exactly that happened.
const casters = [];
const noShadows = {
	addShadowCaster(mesh) {
		if (!(mesh instanceof BABYLON.Mesh)) throw new Error(`a shadow caster must be a mesh, and this is ${mesh}`);
		casters.push(mesh);
	},
};

buildGround(scene, mats);
buildBoundary(scene, mats);
buildDistance(scene, mats);
buildVilla(scene, mats, noShadows);
const pool = buildPool(scene, mats, noShadows);
const pond = buildPond(scene, mats, noShadows);
buildGarden(scene, mats, noShadows);
buildProps(scene, mats, noShadows);

// The same thing main.js hands to the walk.
const ground = makeGround(scene, pool.walkBlocks.concat(pond.walkBlocks));

const START = { x: 2.4, z: 10.5 };

/**
 * Every named place, and what a visitor should find there.
 * stand: the height their feet should come to, or "any" for any ground at all.
 */
const places = [
	["start on the south paving", START.x, START.z, 0.14],
	["paving by the pool edge", 0, 7.9, 0.14],
	["walkway between terrace and pool", 0, 1.5, 0.14],
	["pool coping, south", 0, 7.3, 0.23],
	["pool coping, west", -5.2, 3.7, 0.23],
	["in the water", 0, 3.7, "off limits"],
	["front steps, lower", 0, 1.18, 0.27],
	["front steps, upper", 0, 0.86, 0.41],
	["terrace floor", 0, -1.7, 0.54],
	["in front of the glass", 0.6, -3.2, 0.54],
	["the teak panel beside the glass", -5.4, -4, "off limits"],
	["where the glass meets the east wall", 6.35, -3.95, "off limits"],
	["sala floor", 10.6, 4.0, 0.66],
	["sala steps", 8, 5.4, "any"],
	["west paving", -11, 6.8, 0.14],
	["east paving, south of the sala", 11, 12, 0.14],
	["lawn between the pool and the pond", -17, 11.2, 0],
	["the pond's west bank", -23.7, 14.6, 0],
	["the pond's south bank", -20.3, 17.1, 0],
	["a stone at the pond's edge", -20.3, 16.4, "any"],
	["south path", 0, 18.5, 0.12],
	["lawn behind the villa", 0, -17, 0],
	["north-west corner of the garden", -25, -18, 0],
];

/** Places a visitor must never be able to reach: water, and inside rooms with no door. */
const offLimits = [
	["the water", 0, 4.6],
	["the pond", -20.3, 14.6],
	["open water off the pond's north bank", -20.3, 13.5],
	["the room behind the glass", 0, -6],
	["the pool steps under the water", -3.2, 6.3],
];

// ---- where a visitor stands ----------------------------------------------------------------
console.log(`the Villa has ${scene.meshes.length} meshes; the ground answers for ${ground.floors} floors and ${ground.walls} blockers\n`);

console.log("where a visitor stands");
for (const [name, x, z, want] of places) {
	const free = ground.free(x, z);
	const top = ground.heightAt(x, z);
	const got = free ? top.toFixed(2) : "stopped";
	const wanted = want === "off limits" ? "off limits" : want === "any" ? "any ground" : `${want.toFixed(2)}`;
	const right = want === "off limits" ? !free : want === "any" ? free : free && Math.abs(top - want) < 0.02;
	console.log(`  ${right ? "ok  " : "WRONG"} ${name.padEnd(32)} x=${String(x).padStart(5)} z=${String(z).padStart(5)}  feet at ${got}, wanted ${wanted}`);
}

// ---- can it be got to from the start --------------------------------------------------------
// A flood over the ground at 0.25 m, so "can I get there" is answered by walking, not by hoping.
const STEP = 0.25;
const X0 = -30;
const X1 = 30;
const Z0 = -24;
const Z1 = 26;
const cols = Math.round((X1 - X0) / STEP) + 1;
const rows = Math.round((Z1 - Z0) / STEP) + 1;
const reachable = new Uint8Array(cols * rows);
const freeCell = (cx, cz) => ground.free(X0 + cx * STEP, Z0 + cz * STEP);

const startCx = Math.round((START.x - X0) / STEP);
const startCz = Math.round((START.z - Z0) / STEP);
const queue = [[startCx, startCz]];
reachable[startCz * cols + startCx] = 1;
let visited = 0;
while (queue.length) {
	const [cx, cz] = queue.pop();
	visited++;
	for (const [dx, dz] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		const nx = cx + dx;
		const nz = cz + dz;
		if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
		const key = nz * cols + nx;
		if (reachable[key] || !freeCell(nx, nz)) continue;
		reachable[key] = 1;
		queue.push([nx, nz]);
	}
}

const canReach = (x, z) => {
	const cx = Math.round((x - X0) / STEP);
	const cz = Math.round((z - Z0) / STEP);
	// a place may be a hand's width inside a wall; look about it for a cell that is free
	for (let dz = -2; dz <= 2; dz++) {
		for (let dx = -2; dx <= 2; dx++) {
			const nx = cx + dx;
			const nz = cz + dz;
			if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
			if (reachable[nz * cols + nx]) return true;
		}
	}
	return false;
};

console.log(`\nreachable ground from the start: ${((visited / (cols * rows)) * 100).toFixed(1)}% of the garden (${visited} cells of ${cols * rows})`);
console.log("\ncan a visitor get there from the start");
for (const [name, x, z, want] of places) {
	if (want === "off limits") continue; // already checked: you may not stand there at all
	const near = canReach(x, z);
	console.log(`  ${near ? "ok  " : "WRONG"} ${name.padEnd(32)} ${near ? "yes" : "NO — the way is blocked"}`);
}
for (const [name, x, z] of offLimits) {
	const near = canReach(x, z);
	console.log(`  ${!near ? "ok  " : "WRONG"} ${name.padEnd(32)} ${near ? "REACHABLE — it should not be" : "kept off"}`);
}

// ---- steps a person would stumble on ---------------------------------------------------------
// The walk eases the camera onto the floor under it, so a one-stride change of height taller than a
// long step reads as a jump or a wall. Look for neighbours a foot apart in height.
const CLIMB = 0.42;
const stumbles = [];
for (let cz = 0; cz < rows; cz++) {
	for (let cx = 0; cx < cols; cx++) {
		if (!freeCell(cx, cz)) continue;
		const here = ground.heightAt(X0 + cx * STEP, Z0 + cz * STEP);
		for (const [dx, dz] of [
			[2, 0],
			[0, 2],
		]) {
			const nx = cx + dx;
			const nz = cz + dz;
			if (nx < 0 || nz < 0 || nx >= cols || nz >= rows || !freeCell(nx, nz)) continue;
			const there = ground.heightAt(X0 + nx * STEP, Z0 + nz * STEP);
			const gap = Math.abs(there - here);
			if (gap > CLIMB) stumbles.push({ x: X0 + cx * STEP, z: Z0 + cz * STEP, from: here, to: there, gap });
		}
	}
}
stumbles.sort((a, b) => b.gap - a.gap);
const worstPlaces = [];
for (const s of stumbles) {
	const key = `${Math.round(s.x)},${Math.round(s.z)}`;
	if (!worstPlaces.some((w) => w.key === key)) worstPlaces.push({ key, ...s });
}
console.log(`\nheights that change by more than ${CLIMB} m between two free cells a half metre apart`);
if (!worstPlaces.length) console.log("  none: the ground runs smooth");
for (const s of worstPlaces.slice(0, 14)) {
	console.log(`  at x=${s.x.toFixed(1)} z=${s.z.toFixed(1)}: ${s.from.toFixed(2)} steps to ${s.to.toFixed(2)} (${s.gap.toFixed(2)} m)`);
}
if (worstPlaces.length > 14) console.log(`  … and ${worstPlaces.length - 14} more`);

// ---- what stops a person ---------------------------------------------------------------------
console.log("\nwhat stops a person (widest first)");
const stops = [];
for (const mesh of scene.meshes) {
	if (!mesh.checkCollisions || !mesh.isEnabled()) continue;
	mesh.computeWorldMatrix(true);
	const box = mesh.getBoundingInfo().boundingBox;
	const min = box.minimumWorld;
	const max = box.maximumWorld;
	const height = max.y - min.y;
	const across = Math.max(max.x - min.x, max.z - min.z);
	if (height <= 0.75 && max.y <= -0.01) continue; // below the ground: nothing walks on it or into it
	if (height <= 0.75 && across > 3) continue; // a floor to stand on, not a thing to list here
	stops.push({
		name: mesh.name,
		w: max.x - min.x,
		d: max.z - min.z,
		height,
		kind: height > 0.75 ? "wall" : "step",
		x: (min.x + max.x) / 2,
		z: (min.z + max.z) / 2,
		hidden: !mesh.isVisible,
	});
}
stops.sort((a, b) => b.w * b.d - a.w * a.d);
for (const s of stops.slice(0, 24)) {
	console.log(
		`  ${s.name.padEnd(18)} ${s.kind}${s.hidden ? " (invisible)" : ""}  ${s.w.toFixed(2)} x ${s.d.toFixed(2)} m, ${s.height.toFixed(2)} tall, at x=${s.x.toFixed(1)} z=${s.z.toFixed(1)}`,
	);
}
const fat = stops.filter((s) => s.kind === "wall" && Math.min(s.w, s.d) > 2.6);
if (fat.length) {
	console.log("\nthin things that block too much ground (a wall more than 2.6 m through)");
	for (const s of fat) console.log(`  ${s.name}  ${s.w.toFixed(2)} x ${s.d.toFixed(2)} at x=${s.x.toFixed(1)} z=${s.z.toFixed(1)}`);
}

if (wantGrid) {
	// A map: one character per half metre. `#` a wall, `-` ground you are stood on, `~` water,
	// `.` lawn, `?` free ground that cannot be got to from the start. West is left, north is up.
	const step = 0.5;
	console.log(`\nmap, ${step} m per square: # a wall that stops you, ~ off limits (the water, and the hedges), - raised ground you are stood on, . lawn, ? ground you cannot get to`);
	for (let z = Z1 - 2; z >= Z0 + 2; z -= step) {
		let line = "";
		for (let x = X0 + 2; x <= X1 - 2; x += step) {
			const cx = Math.round((x - X0) / STEP);
			const cz = Math.round((z - Z0) / STEP);
			if (!ground.free(x, z)) {
				line += ground.heightAt(x, z) > 0.9 ? "#" : "~";
				continue;
			}
			if (x > pool.bounds.x0 && x < pool.bounds.x1 && z > pool.bounds.z0 && z < pool.bounds.z1) {
				line += "~";
				continue;
			}
			const top = ground.heightAt(x, z);
			if (!reachable[cz * cols + cx]) line += "?";
			else if (top > 0.05) line += "-";
			else line += ".";
		}
		console.log(line);
	}
}
