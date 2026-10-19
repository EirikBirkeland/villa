// Does a surface keep its colour while the visitor walks? That is the question a still camera cannot ask.
//
// The first version of this tool compared one pixel with the pixel under it at the next stand, and reported
// half the frame swinging — which is nonsense: move sideways half a metre and everything you are looking at
// slides across the picture, so of course the pixel changed. What matters is not the pixel, it is the
// THING. So this follows named surfaces in the world: it projects the same world point in every stand, reads
// the colour it was drawn with, and reports the swing on that surface. Parallax cancels out, and what is
// left is shading that will not hold still — the shadow map crawling over a wall, a mirror catching a
// different half of the sky, a material whose own light budget changes as you cross the room.
//
//   node tools/shadowcrawl.js "<x,y,z,yaw,pitch>" [hour] [step] [probe list]
// Probe lists are named in PROBES below; "room" are the surfaces of the main room's back wall.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";

const VIEW = process.argv[2] || "-2.5,2.3,-8.0,3.1416,0.05";
const HOUR = process.argv[3] || "17.5";
const STEP = Number(process.argv[4] || 0.35);
const WHICH = process.argv[5] || "room";
const W = 640, H = 360;

// World points, and what ought to be there. Plaster is the flat test: a painted wall under a fixed sun has
// one colour, and if it does not, the drawing is lying.
const PROBES = {
	room: [
		{ name: "back plaster west", at: [-5.2, 1.5, -11.6] },
		{ name: "back plaster east", at: [-0.6, 1.5, -11.6] },
		{ name: "back plaster high", at: [-5.2, 3.2, -11.6] },
		{ name: "leaf of the back door", at: [-2.5, 1.5, -11.59] },
		{ name: "door's shadow gap", at: [-3.06, 1.5, -11.61] },
		{ name: "west plaster", at: [-6.5, 1.5, -8.0] },
		{ name: "floor", at: [-2.5, 0.62, -8.0] },
	],
	garden: [
		{ name: "lawn", at: [-6, 0.06, 4] },
		{ name: "pool coping", at: [0, 0.52, 3.2] },
		{ name: "pool water", at: [0, 0.34, 1.0] },
		{ name: "terrace", at: [3, 0.52, 6] },
	],
};

const [x0, y0, z0, yaw, pitch] = VIEW.split(",").map(Number);
const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
const stands = [-1, -0.5, 0, 0.5, 1].map((k) => `${(x0 + right[0] * STEP * k).toFixed(3)},${y0},${(z0 + right[2] * STEP * k).toFixed(3)},${yaw},${pitch}`);

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const rows = PROBES[WHICH].map((p) => ({ ...p, seen: [], colours: [] }));
const luma = (c) => Math.round((c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000);
for (const stand of stands) {
	const page = await browser.newPage({ viewport: { width: W, height: H } });
	await page.goto(`http://localhost:8090/villa/index.html?view=${stand}&hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(16000);
	const where = await page.evaluate((pts) => {
		const V = window.__villa;
		return pts.map(([x, y, z]) => {
			const q = BABYLON.Vector3.Project(
				new BABYLON.Vector3(x, y, z),
				BABYLON.Matrix.Identity(),
				V.scene.getTransformMatrix(),
				V.camera.viewport.toGlobal(V.engine.getRenderWidth(), V.engine.getRenderHeight())
			);
			const cv = V.engine.getRenderingCanvas();
			const px = Math.round((q.x / V.engine.getRenderWidth()) * cv.width);
			const py = Math.round((q.y / V.engine.getRenderHeight()) * cv.height);
			const hit = V.scene.pick(q.x, q.y);
			return { px, py, mesh: hit?.pickedMesh?.name || "nothing" };
		});
	}, PROBES[WHICH].map((p) => p.at));
	const file = `/tmp/crawl-${stands.indexOf(stand)}.png`;
	await page.screenshot({ path: file });
	const img = PNG.sync.read(fs.readFileSync(file));
	rows.forEach((r, i) => {
		const w = where[i];
		if (w.px < 0 || w.py < 0 || w.px >= img.width || w.py >= img.height) return;
		const o = (w.py * img.width + w.px) * 4;
		r.colours.push([img.data[o], img.data[o + 1], img.data[o + 2]]);
		r.seen.push(w.mesh);
	});
	await page.close();
}
await browser.close();

console.log(`five stands, ${STEP} m apart, looking at ${VIEW}, hour ${HOUR}`);
for (const r of rows) {
	if (r.colours.length < 2) {
		console.log(`   ${r.name.padEnd(22)} out of frame`);
		continue;
	}
	const L = r.colours.map(luma);
	const swing = Math.max(...L) - Math.min(...L);
	const flag = swing > 14 ? "  <-- will not hold still" : "";
	console.log(
		`   ${r.name.padEnd(22)} L${L.join(" L")}  swing ${swing}${flag}   [${r.seen[0]}]`
	);
}
