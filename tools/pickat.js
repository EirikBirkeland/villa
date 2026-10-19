// pickat — ask a live browser what is behind named pixels of a standing view.
//
//   node tools/pickat.js home 1050,460;1100,460
//   node tools/pickat.js pool 640,300 --out pictures/pick-pool.png
//
// `tools/cover.js` reads the whole frame on a grid and `tools/draw.js --pick` does it in the CPU
// drawing; this answers the one question left over: what is at THIS pixel in the picture I am
// looking at. It prints, for each point, the mesh and material the browser picked, how far it is,
// where in the world that is, the face normal there, and the colour the picture has at that pixel
// when --out is given (the picture is taken first, so the two agree).
//
// The camera is one of the standing views in tools/cameras.txt by name, or a raw x,y,z,yaw,pitch.

import fs from "node:fs";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
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
const readFlag = (name, dflt) => {
	const i = argv.indexOf(`--${name}`);
	return i < 0 ? dflt : argv.splice(i, 2)[1];
};
const viewArg = argv[0];
const pointsArg = argv[1];
const out = readFlag("out", "");
const width = Number(readFlag("width", "1280"));
const height = Number(readFlag("height", "720"));
const wait = Number(readFlag("wait", "14000"));

if (!viewArg || !pointsArg) {
	console.log("usage: node tools/pickat.js <view name or x,y,z,yaw,pitch> <x,y;x,y> [--out file.png] [--width w] [--height h]");
	process.exit(1);
}

const cameras = fs
	.readFileSync(new URL("cameras.txt", import.meta.url), "utf8")
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("#"))
	.map((line) => line.split(/\s+/));
const found = cameras.find((parts) => parts[0] === viewArg);
// The url wants the numbers, not the name: `?view=` in `src/main.js` takes x,y,z,yaw,pitch.
const spec = found ? found[1] : viewArg;
if (!found && spec.split(",").length !== 5) {
	console.log(`pickat: "${viewArg}" is not a name in tools/cameras.txt and not x,y,z,yaw,pitch`);
	process.exit(1);
}
const url = `http://localhost:8090/villa/index.html?view=${spec}${found && found[2] !== "-" ? `&fov=${found[2]}` : ""}`;

const points = pointsArg
	.split(";")
	.map((text) => text.split(",").map(Number))
	.filter((pair) => pair.length === 2 && pair.every(Number.isFinite));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${height}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, wait));

let buffer = null;
if (out) {
	buffer = await page.screenshot();
	fs.writeFileSync(out, buffer);
}

const report = await page.evaluate((pts) => {
	const { scene, engine } = window.__villa;
	// The pick wants device pixels; the picture is measured in the same ones, but the render target
	// and the window are only the same size by luck, so scale like tools/cover.js does.
	const sx = engine.getRenderWidth() / window.innerWidth;
	const sy = engine.getRenderHeight() / window.innerHeight;
	const info = {
		render: [engine.getRenderWidth(), engine.getRenderHeight()],
		window: [window.innerWidth, window.innerHeight],
		camera: scene.activeCamera ? scene.activeCamera.name : "none",
		position: scene.activeCamera ? scene.activeCamera.position.asArray().map((v) => Math.round(v * 100) / 100) : null,
	};
	const picks = pts.map(([x, y]) => {
		const hit = scene.pick(x * sx, y * sy, (mesh) => mesh.isEnabled() && mesh.isVisible);
		if (!hit || !hit.hit || !hit.pickedMesh) return { x, y, nothing: true };
		const mesh = hit.pickedMesh;
		const normals = mesh.getVerticesData("normal");
		const at = hit.faceIndex === null || hit.faceIndex === undefined ? null : hit.faceIndex * 3;
		return {
			x,
			y,
			mesh: mesh.name,
			material: mesh.material ? mesh.material.name : "?",
			distance: Math.round(hit.distance * 100) / 100,
			point: hit.pickedPoint.asArray().map((v) => Math.round(v * 100) / 100),
			normal: normals && at !== null && normals.length > at + 2 ? [normals[at], normals[at + 1], normals[at + 2]].map((v) => Math.round(v * 100) / 100) : null,
		};
	});
	return { info, picks };
}, points);

let png = null;
if (buffer) png = PNG.sync.read(buffer);

console.log(`pickat — ${url}`);
console.log(
	`  camera ${report.info.camera} at (${report.info.position}), render ${report.info.render.join("x")}, window ${report.info.window.join("x")}`,
);
for (const p of report.picks) {
	if (p.nothing) {
		console.log(`  ${p.x},${p.y} — nothing hit`);
		continue;
	}
	let colour = "";
	if (png) {
		const o = (png.width * p.y + p.x) * 4;
		colour = ` rgb(${png.data[o]},${png.data[o + 1]},${png.data[o + 2]})`;
	}
	console.log(
		`  ${p.x},${p.y} — ${p.mesh} [${p.material}] at ${p.distance} m, world (${p.point}), normal ${p.normal ? `(${p.normal})` : "?"}${colour}`,
	);
}
if (errors.length) console.log(`  the page said: ${errors.slice(0, 4).join(" | ")}`);
if (out) console.log(`  picture: ${out}`);
await browser.close();
