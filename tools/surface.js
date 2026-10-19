// Measure one named surface, and nothing else, for stripes and for movement while the visitor steps aside.
//
// Every hunt for the store's flickering panel has been spoiled by the patch: a fraction of the frame picks up
// the roof, the transom, the frame and the plants beside it, and their edges swamp the surface being asked
// about. This ties the patch to the mesh instead: the picture is probed on a grid, every point the picker
// answers with the named mesh is kept, and the rectangle well inside those points is what gets measured — row
// means, hard steps, distinct shades — and cut out to `/tmp/surface-<mesh>.png` so the eyes can judge the same
// thing the numbers do. Nothing is projected by hand: the picker decides what is that face, which is what it is
// there to do.
//
//   node tools/surface.js ["x,y,z,yaw,pitch"] [hour] [mesh name]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "5.6,1.6,-19,0,-0.14";
const HOUR = process.argv[3] || "10";
const MESH = process.argv[4] || "storeWallNorthPart1";

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await b.newPage({ viewport: { width: 1280, height: 960 } });
await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1${process.env.EXTRA || ""}`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 180000 });
await page.waitForTimeout(10000);
// `PRE` runs in the page before anything is measured, so a material property can be tried without touching
// the source: PRE='window.__villa.mats.plasterDark.reflectionIntensity = 0' node tools/surface.js ...
if (process.env.PRE) await page.evaluate(process.env.PRE);

const rect = await page.evaluate(([name, tag]) => {
	const V = window.__villa, S = V.scene;
	const W = V.engine.getRenderWidth(), H = V.engine.getRenderHeight();
	let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, seen = 0;
	const step = 16;
	for (let y = 0; y < H; y += step) {
		for (let x = 0; x < W; x += step) {
			// `tag` picks the same browser-level picking the visitor's clicks get.
			const hit = S.pick(x, y);
			if (hit && hit.pickedMesh && hit.pickedMesh.name === name) {
				seen++;
				if (x < x0) x0 = x; if (x > x1) x1 = x;
				if (y < y0) y0 = y; if (y > y1) y1 = y;
			}
		}
	}
	if (!seen) return null;
	const inx = Math.round((x1 - x0) * 0.2), iny = Math.round((y1 - y0) * 0.2);
	return { x: x0 + inx, y: y0 + iny, w: Math.max(8, x1 - x0 - 2 * inx), h: Math.max(8, y1 - y0 - 2 * iny), seen, box: { x0, x1, y0, y1 }, screen: { W, H } };
}, [MESH, "probe"]);

if (!rect) { console.log(`nothing named ${MESH} is in this picture from ${VIEW}`); process.exit(1); }
console.log(`${MESH} answers ${rect.seen} of the probed points, spanning x ${rect.box.x0}..${rect.box.x1}, rows ${rect.box.y0}..${rect.box.y1} of ${rect.screen.W}x${rect.screen.H}`);
console.log(`patch taken inside it, a fifth off every edge: ${rect.w}x${rect.h} at ${rect.x},${rect.y}`);

await page.waitForTimeout(3000);
const f = "/tmp/surface-shot.png";
await page.screenshot({ path: f });
const img = PNG.sync.read(fs.readFileSync(f));
const { x: x0, y: y0, w, h } = rect;
const L = (x, y) => { const i = ((y0 + y) * img.width + (x0 + x)) * 4; return (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3; };
const shades = new Set(); const rows = []; let steps = 0, sum = 0;
for (let y = 0; y < h; y++) {
	let r = 0;
	for (let x = 0; x < w; x++) {
		const v = L(x, y); shades.add(Math.round(v)); sum += v; r += v;
		if (x > 0 && Math.abs(v - L(x - 1, y)) > 6) steps++;
	}
	rows.push(r / w);
}
let bigRow = 0;
for (let y = 1; y < rows.length; y++) bigRow = Math.max(bigRow, Math.abs(rows[y] - rows[y - 1]));
const out = new PNG({ width: w, height: h });
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
	const s = ((y0 + y) * img.width + (x0 + x)) * 4, d = (y * w + x) * 4;
	for (let k = 0; k < 4; k++) out.data[d + k] = img.data[s + k];
}
fs.writeFileSync(`/tmp/surface-${MESH}.png`, PNG.sync.write(out));
console.log(`mean ${(sum / (w * h)).toFixed(1)}  shades ${shades.size}  row swing ${(Math.max(...rows) - Math.min(...rows)).toFixed(1)}  biggest row step ${bigRow.toFixed(1)}  hard steps ${((100 * steps) / (w * h)).toFixed(2)}%`);
await b.close();
