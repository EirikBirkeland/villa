// How grainy are the shadows? A number for the crawl of a shadow map.
//
// A shadow map is a grid, and every surface in shade is drawn from that grid. When the grid is coarse
// compared with the distance — 2048 texels stretched over the whole property is a few centimetres to a
// texel — the edge of a shadow is not a line but a scatter, and a wall in its own shade picks up a fine
// salt of bright and dark specks. A still picture shows this as dirt, and a moving one shows it as
// flicker. Either way the measure is the same: in the parts of the picture that are IN shade, how much
// does a pixel differ from the average of its neighbours? A clean shadow answers "hardly at all", and a
// crawling one answers a lot.
//
//   node tools/shadowgrain.js [hours]
import fs from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright-core";

const HOURS = (process.argv[2] || "8,10,17").split(",").map(Number);
const W = 640, H = 360;
const VIEWS = [
	{ name: "front", view: "0,1.6,14,-0.0,-0.03" },
	{ name: "rear", view: "0,1.6,-19,0,0.06" },
	{ name: "westwall", view: "-13,1.6,-8,1.57,0" },
	{ name: "grass", view: "-13.5,1.5,8,-1.57,0.18" },
	{ name: "room", view: "-1.2,2.3,-6,3.1416,0.04" },
];

// Mean absolute difference between a pixel and the mean of the 5x5 block around it: the fine stuff,
// reported whole-frame and again for the shaded part only.
function grain(img) {
	const W2 = img.width, H2 = img.height;
	const L = new Float32Array(W2 * H2);
	for (let i = 0, p = 0; i < L.length; i++, p += 4) {
		L[i] = (img.data[p] * 299 + img.data[p + 1] * 587 + img.data[p + 2] * 114) / 1000;
	}
	let all = 0, n = 0, shade = 0, ns = 0, dark = 0, white = 0;
	for (let y = 2; y < H2 - 2; y++) {
		for (let x = 2; x < W2 - 2; x++) {
			let s = 0;
			for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += L[(y + dy) * W2 + x + dx];
			const here = L[y * W2 + x];
			const d = Math.abs(here - s / 25);
			all += d; n++;
			if (here < 60) { shade += d; ns++; }
			if (here <= 5) dark++;
			if (here >= 250) white++;
		}
	}
	return {
		grain: +(all / n).toFixed(2),
		shadeGrain: ns ? +(shade / ns).toFixed(2) : 0,
		mean: Math.round(L.reduce((a, b) => a + b, 0) / L.length),
		black: +((dark / n) * 100).toFixed(2),
		white: +((white / n) * 100).toFixed(2),
	};
}

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const rows = [];
for (const v of VIEWS) {
	for (const hour of HOURS) {
		const page = await browser.newPage({ viewport: { width: W, height: H } });
		await page.goto(`http://localhost:8090/villa/index.html?view=${v.view}&hour=${hour}&still=1`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(15000);
		const file = `/tmp/grain-${v.name}-${hour}.png`;
		await page.screenshot({ path: file });
		rows.push({ ...v, hour, ...grain(PNG.sync.read(fs.readFileSync(file))) });
		await page.close();
	}
}
await browser.close();
console.log("view       hour   grain  shade-grain   mean  black%  white%");
for (const r of rows) {
	console.log(`   ${r.name.padEnd(10)} ${String(r.hour).padEnd(5)} ${String(r.grain).padStart(6)} ${String(r.shadeGrain).padStart(11)} ${String(r.mean).padStart(6)} ${String(r.black).padStart(6)} ${String(r.white).padStart(6)}`);
}
const g = rows.reduce((a, r) => a + r.grain, 0) / rows.length;
const sg = rows.reduce((a, r) => a + r.shadeGrain, 0) / rows.length;
console.log(`   all views: grain ${g.toFixed(2)}, shade-grain ${sg.toFixed(2)}`);
