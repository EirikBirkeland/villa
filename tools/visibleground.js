// visibleground — what a view can see of the ground, in metres of ground.
//
// A picture says what is on screen; this says WHERE on the ground that is. It picks a grid of pixels in
// a real browser and prints a letter map (one letter per cell, keyed to the mesh's material) and, for
// each material, the world rectangle it covers and how far off it is. That is how a plan for planting,
// paving or a prop is checked against a view before anything is built: "will grass show from where a
// visitor starts" is a question about metres and angles, and this answers it.
//
//   node tools/visibleground.js                                -> the view a visitor arrives at
//   node tools/visibleground.js --view "-11,1.7,6.8,1.57,-0.02"
//   node tools/visibleground.js --grid 40x22 --only lawn,tuft,paver,coping
//
// Cut-out sheets (the standing grass) pick where the paint is cut away, so a cell named `tuft` may show
// the stone behind it in the picture: the map says what is nearest along that ray, not what is painted.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"];

function readFlag(name, argv, dflt) {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : dflt;
}

const argv = process.argv.slice(2);
const view = readFlag("view", argv, "2.4,1.74,10.5,3.2,0.06");
const [gw, gh] = (readFlag("grid", argv, "32x18") || "").split("x").map(Number);
const only = (readFlag("only", argv, "") || "").split(",").filter(Boolean);
const [x, y, z, yaw, pitch] = view.split(",").map(Number);

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: 1280, height: 720 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 5000));
await page.evaluate(([x, y, z, yaw, pitch]) => {
	const { camera } = window.__villa;
	camera.position.set(x, y, z);
	camera.rotation.set(pitch || 0, yaw || 0, 0);
}, [x, y, z, yaw, pitch]);
await new Promise((resolve) => setTimeout(resolve, 1500));

const cells = await page.evaluate(
	([gw, gh]) => {
		const { scene } = window.__villa;
		const out = [];
		for (let r = 0; r < gh; r++) {
			for (let c = 0; c < gw; c++) {
				const px = ((c + 0.5) / gw) * 1280;
				const py = ((r + 0.5) / gh) * 720;
				const hit = scene.pick(px, py, (m) => m.isEnabled() && m.isVisible && m.material);
				if (!hit || !hit.hit || !hit.pickedMesh) {
					out.push(null);
					continue;
				}
				const p = hit.pickedPoint;
				out.push({
					mesh: hit.pickedMesh.name,
					mat: hit.pickedMesh.material.name,
					d: Number(hit.distance.toFixed(1)),
					x: Number(p.x.toFixed(1)),
					y: Number(p.y.toFixed(2)),
					z: Number(p.z.toFixed(1)),
				});
			}
		}
		return out;
	},
	[gw, gh],
);

const keys = [];
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const letter = (mat) => {
	if (!mat) return ".";
	if (only.length && !only.includes(mat)) return " ";
	if (!keys.includes(mat)) keys.push(mat);
	const taken = keys.indexOf(mat);
	return taken < alphabet.length ? alphabet[taken] : "?";
};

const rows = [];
for (let r = 0; r < gh; r++) {
	let line = "";
	for (let c = 0; c < gw; c++) {
		const cell = cells[r * gw + c];
		line += cell ? letter(cell.mat) : " ";
	}
	rows.push(line);
}
console.log(`visibleground — the camera a visitor ${view === "2.4,1.74,10.5,3.2,0.06" ? "arrives at" : "is put at"}: ${view}`);
console.log(`grid ${gw} x ${gh}, each cell ${(1280 / gw) | 0} x ${(720 / gh) | 0} pixels of a 1280x720 frame\n`);
rows.forEach((line, i) => console.log(`${String(i).padStart(2)} ${line}`));
console.log("");

const stats = new Map();
cells.forEach((cell) => {
	if (!cell) return;
	const s = stats.get(cell.mat) || { mat: cell.mat, n: 0, x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9, d0: 1e9, d1: -1e9, meshes: new Set() };
	s.n++;
	s.x0 = Math.min(s.x0, cell.x);
	s.x1 = Math.max(s.x1, cell.x);
	s.z0 = Math.min(s.z0, cell.z);
	s.z1 = Math.max(s.z1, cell.z);
	s.d0 = Math.min(s.d0, cell.d);
	s.d1 = Math.max(s.d1, cell.d);
	s.meshes.add(cell.mesh);
	stats.set(cell.mat, s);
});

const total = cells.filter(Boolean).length || 1;
console.log("material        cells  share   the ground it covers (metres)      how far off it is");
for (const [mat, s] of [...stats.entries()].sort((a, b) => b[1].n - a[1].n)) {
	console.log(
		`${mat.padEnd(15)} ${String(s.n).padStart(4)}  ${((100 * s.n) / total).toFixed(1).padStart(5)}%  x ${s.x0.toFixed(1)}…${s.x1.toFixed(1)}  z ${s.z0.toFixed(1)}…${s.z1.toFixed(1)}   ${s.d0.toFixed(1)}…${s.d1.toFixed(1)} m` +
			(keys.includes(mat) ? `   [${alphabet[keys.indexOf(mat)]}]` : ""),
	);
}
console.log("\nkey: " + keys.map((k, i) => `"0123456789abcdefghijklmnopqrstuvwxyz"[${i}]=${k}`).join("  "));
if (errors.length) console.log("\npage errors:\n" + errors.join("\n"));

await browser.close();
