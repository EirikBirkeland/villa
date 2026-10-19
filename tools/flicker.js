// Where does this view flicker?
//
//   node tools/flicker.js "<x,y,z,yaw,pitch>" [hour] [frames]
//
// WHY THIS EXISTS. The master's word was that a panel on the side of the house "flickers", and a still picture
// cannot answer that: two surfaces at the same depth look perfectly calm in one frame and quarrel in the next.
// So the same view is photographed several times without moving, and the pixels that will not settle are counted.
// A pixel that changes because the leaves are breathing is one thing; a pixel that is dark in one frame and light
// in the next, back and forth, is a quarrel over depth, and that is what a flicker is.
//
// Everything that moves of its own accord is stopped with `?still=1`, which stops the day too: an advancing sun
// changes every pixel and would be read as a flicker. Until session eighty-four this line was a lie about the
// water: `pool`, `pond` and `stream` were handed the live clock whatever the switch said, so a view over the pond
// moved 29.59% of its pixels between two frames of a "still" scene and every number this tool printed over water
// was noise. They now take `still ? 0 : time`, and with the switch on, four stands — front and pool, rear at dusk,
// by the pond, inside at night — all read nothing moved at all. So if this tool finds a pixel that will not settle
// with `?still=1`, it is a real fault in the scene and not the water being water.
//
// The answer is given as places, not numbers alone: the picture is divided into cells, the cells that will not
// settle are listed with the mesh that is nearest to the camera there, so a fault can be walked to.
import fs from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright-core";

const VIEW = process.argv[2] || "-13.5,1.6,-2.0,1.5708,-0.05";
const HOUR = process.argv[3] || "17.5";
const FRAMES = Number(process.argv[4] || 6);
const W = 640;
const H = 360;
const CELL = 40;

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage({ viewport: { width: W, height: H } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await p.goto(`http://localhost:8090/villa/index.html?still=1&hour=${HOUR}&view=${VIEW}`, { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(14000);

const shots = [];
for (let i = 0; i < FRAMES; i++) {
	const file = `/tmp/flick-${i}.png`;
	await p.screenshot({ path: file });
	shots.push(PNG.sync.read(fs.readFileSync(file)));
	await p.waitForTimeout(160);
}
const first = shots[0];
const cells = new Map();
for (let y = 0; y < first.height; y++) {
	for (let x = 0; x < first.width; x++) {
		const i = (y * first.width + x) * 4;
		let low = 999;
		let high = -1;
		for (const png of shots) {
			const j = (y * png.width + x) * 4;
			const luma = (png.data[j] + png.data[j + 1] + png.data[j + 2]) / 3;
			if (luma < low) low = luma;
			if (luma > high) high = luma;
		}
		if (high - low < 18) continue;
		const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
		const c = cells.get(key) || { n: 0, x: 0, y: 0, worst: 0, r: 0, g: 0, b: 0 };
		c.n++;
		c.x += x;
		c.y += y;
		c.worst = Math.max(c.worst, high - low);
		c.r += first.data[i];
		c.g += first.data[i + 1];
		c.b += first.data[i + 2];
		cells.set(key, c);
	}
}
const total = first.width * first.height;
const all = [...cells.values()].reduce((s, c) => s + c.n, 0);
console.log(`${FRAMES} frames of ${VIEW} at hour ${HOUR}: ${all} pixels of ${total} (${((100 * all) / total).toFixed(2)}%) changed by more than 18 of 255 between frames`);
const ranked = [...cells.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
for (const [key, c] of ranked) {
	const cx = Math.round(c.x / c.n);
	const cy = Math.round(c.y / c.n);
	const at = await p.evaluate(
		([x, y]) => {
			const hit = window.__villa.scene.pick(x, y, (m) => m.isEnabled() && m.isVisible);
			if (!hit || !hit.hit) return "nothing";
			const h2 = window.__villa.scene.multiPick(x, y, (m) => m.isEnabled() && m.isVisible) || [];
			return h2.length > 1
				? h2.map((k) => `${k.hit ? k.pickedMesh.name : "?"}@${k.distance.toFixed(2)}`).join(" + ")
				: `${hit.pickedMesh.name}@${hit.distance.toFixed(2)} (${hit.pickedMesh.material ? hit.pickedMesh.material.name : "-"})`;
		},
		[cx, cy],
	);
	const box = (() => {
		const [gx, gy] = key.split(",").map(Number);
		return `x ${gx * CELL}..${gx * CELL + CELL}, y ${gy * CELL}..${gy * CELL + CELL}`;
	})();
	console.log(
		`  ${String(c.n).padStart(4)} px, worst swing ${Math.round(c.worst)}, mean colour (${Math.round(c.r / c.n)},${Math.round(c.g / c.n)},${Math.round(c.b / c.n)}) at ${box}\n        what is there: ${at}`,
	);
}
await b.close();
