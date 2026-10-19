// pitch — how big one repeat of a painted pattern is, in metres of the surface it lies on.
//
// Why this exists. A pattern is painted on a square canvas and knows nothing about the thing it is
// laid on, and a box's face runs its texture coordinates from edge to edge: laid that way, the same
// plaster canvas is one repeat on a 0.7 m post and one repeat on a 14.7 m wall, and on the wall it
// is fifty times too big to see. That is how the Villa was built for a long time — the drawing in
// `tools/draw.js` happily painted the stretched pattern and everybody called it texture. The answer
// is to measure a pattern in metres of surface (see `patternMetres` in src/mesh.js), and this tool is
// how you check that every surface actually got it: it asks the running Villa, mesh by mesh, how far
// apart one repeat of its pattern lands, and prints the worst first.
//
// A pattern that is too big is invisible: a wall reads as one flat colour with a gradient on it. A
// pattern that is too small is worse than that, because minification averages it back to one flat
// colour and adds sparkle while it does. Both are in this table, and neither shows in a picture as
// anything but a dead surface.
//
//   node tools/pitch.js                       -> the worst 25 surfaces, then a per-material summary
//   node tools/pitch.js --worst 60            -> more of them
//   node tools/pitch.js --mesh copingSouth    -> one mesh, face by face
//   node tools/pitch.js --material hedge      -> every mesh wearing one material
//   node tools/pitch.js --url <link>          -> a released copy instead of the working tree
//
// Only a mesh whose faces are four corners each — a box, a flat sheet — is measured exactly. A sphere
// or a merged belt of jungle crowns is wrapped the library's own way and is listed at the bottom as
// not measured, so nobody reads a number there that the tool cannot stand behind.
//
// One caution when reading it: a repeat is one canvas, not one board, tile or leaf. To get the size of
// one feature, divide by how many the canvas holds — the `grid` of each surface in
// `src/surface-colours.js` says, and `src/textures.js` paints them.
//
// Needs a browser: it reads the materials the page really built. `node tools/headroom.js` says
// whether this sandbox has room for one.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
	"--hide-scrollbars",
];

const argv = process.argv.slice(2);
const readFlag = (name, fallback) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const url = readFlag("url", "http://localhost:8090/villa/index.html");
const worst = Number(readFlag("worst", 25));
const wantMesh = readFlag("mesh", null);
const wantMaterial = readFlag("material", null);

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, "--window-size=800,600"] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: 800, height: 600 });
const problems = [];
page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 5000));

const report = await page.evaluate(
	([meshWant, matWant]) => {
		const { scene } = window.__villa;
		const VB = BABYLON.VertexBuffer;
		const rows = [];
		const unmeasured = [];
		for (const mesh of scene.meshes) {
			if (!mesh.isEnabled() || mesh.isVisible === false || !mesh.material) continue;
			const mat = mesh.material;
			const tex = mat.albedoTexture || mat.emissiveTexture;
			if (!tex) continue;
			if (meshWant && mesh.name !== meshWant) continue;
			if (matWant && mat.name !== matWant) continue;
			const pos = mesh.getVerticesData(VB.PositionKind);
			const uv = mesh.getVerticesData(VB.UVKind);
			const idx = mesh.getIndices();
			if (!pos || !uv) continue;
			const world = mesh.computeWorldMatrix(true);
			const us = tex.uScale || 1;
			const vs = tex.vScale || 1;
			// Walk the mesh triangle by triangle and keep each face it is allowed to have: four corners
			// standing square in the mesh's own coordinates. Anything else — a sphere, a hip roof, a
			// merged belt of crowns — is listed and left alone.
			const faces = [];
			// Two triangles to a face, wound (a, b, c, a, c, d) by the library, so the face's four corners
			// are the first, second, third and sixth indices of the six.
			const quads = idx && idx.length ? Math.floor(idx.length / 6) : Math.floor(pos.length / 12);
			for (let q = 0; q < quads; q++) {
				const quad = idx && idx.length ? [idx[q * 6], idx[q * 6 + 1], idx[q * 6 + 2], idx[q * 6 + 5]] : [q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 3];
				if (new Set(quad).size !== 4) continue;
				const local = quad.map((k) => new BABYLON.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]));
				let looking = -1;
				for (let a = 0; a < 3; a++) {
					const key = local[0].asArray()[a];
					if (local.every((p) => Math.abs(p.asArray()[a] - key) < 1e-6)) {
						looking = a;
						break;
					}
				}
				if (looking < 0) continue;
				const along = [0, 1, 2]
					.filter((a) => a !== looking)
					.map((a) => BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0), world));
				const at = quad.map((k, i) => ({ p: BABYLON.Vector3.TransformCoordinates(local[i], world), u: uv[k * 2] * us, v: uv[k * 2 + 1] * vs }));
				const span = (list, pick) => Math.max(...list.map(pick)) - Math.min(...list.map(pick));
				const metres = [span(at, (o) => o.p.dot(along[0])), span(at, (o) => o.p.dot(along[1]))];
				const repeats = [span(at, (o) => o.u), span(at, (o) => o.v)];
				// A face narrower than a hand cannot carry a pattern and tells you nothing about one: the
				// fans of a cylinder's cap and the strips of a barrel are wound so that one of these two
				// spans is a hair, and a number read off a hair is a number made up.
				if (metres[0] < 0.05 || metres[1] < 0.05) continue;
				faces.push({
					dims: metres.map((m) => +m.toFixed(2)),
					repeats: repeats.map((r) => +r.toFixed(2)),
					pitch: metres.map((m, i) => (repeats[i] > 1e-6 ? +(m / repeats[i]).toFixed(3) : 0)),
				});
			}
			if (!faces.length) {
				unmeasured.push(`${mesh.name}/${mat.name}`);
				continue;
			}
			// The worst face on the mesh: the one where its pattern is furthest from its own size.
			let bad = faces[0];
			for (const f of faces) if (Math.max(...f.pitch) > Math.max(...bad.pitch)) bad = f;
			rows.push({
				mesh: mesh.name,
				material: mat.name,
				pattern: tex.name,
				scale: [+us.toFixed(2), +vs.toFixed(2)],
				faces: faces.length,
				worstPitch: bad.pitch,
				worstDims: bad.dims,
				worstRepeats: bad.repeats,
			});
		}
		return { rows, unmeasured, lights: scene.lights.length };
	},
	[wantMesh, wantMaterial],
);

const scored = report.rows.map((r) => ({ ...r, bad: Math.max(...r.worstPitch) }));
scored.sort((a, b) => b.bad - a.bad);

console.log(`${report.rows.length} patterned surfaces read from ${url}`);
if (report.unmeasured.length) {
	const kinds = new Map();
	for (const name of report.unmeasured) kinds.set(name.split("/")[1], (kinds.get(name.split("/")[1]) || 0) + 1);
	console.log(`\nnot measured, for they have no four-cornered face to measure (${report.unmeasured.length} meshes): ${[...kinds.entries()].map(([m, n]) => `${m} x${n}`).join(", ")}`);
	console.log("  named: " + report.unmeasured.slice(0, 12).join(", ") + (report.unmeasured.length > 12 ? ", ..." : ""));
}
console.log(`\nthe ${Math.min(worst, scored.length)} surfaces whose pattern is furthest out of size, worst first`);
console.log(`${"mesh".padEnd(20)} ${"material".padEnd(16)} ${"face m x m".padEnd(14)} ${"repeats".padEnd(12)} one repeat every`);
for (const r of scored.slice(0, worst)) {
	console.log(
		`${r.mesh.padEnd(20)} ${r.material.padEnd(16)} ${r.worstDims.join(" x ").padEnd(14)} ${r.worstRepeats.join(" x ").padEnd(12)} ${r.worstPitch.map((p) => `${p} m`).join(", ")}`,
	);
}

const byMat = new Map();
for (const r of report.rows) {
	const list = byMat.get(r.material) || [];
	list.push(r);
	byMat.set(r.material, list);
}
console.log("\nper material: the size of one repeat across every surface wearing it (metres)");
for (const [name, list] of [...byMat.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
	const all = list.flatMap((r) => r.worstPitch).filter((p) => p > 0);
	const smallest = Math.min(...all);
	const biggest = Math.max(...all);
	console.log(`  ${name.padEnd(16)} ${String(list.length).padStart(3)} surfaces  ${smallest.toFixed(2)} .. ${biggest.toFixed(2)} m`);
}

if (problems.length) console.log("\n" + problems.join("\n"));
await browser.close();
