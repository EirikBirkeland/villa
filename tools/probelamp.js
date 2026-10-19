// A lamp made in front of you, at a place you can see: does it light anything?
//
// Eight garden lamp posts and twenty-nine festoon bulbs were given real lights and not one of them changed a
// single pixel — not at 9 units, not at 115, not at 4000, and not when the materials were given thirteen light
// slots instead of six. Meanwhile the two lanterns built in `src/villa.js` are worth fifteen points of mean on
// the rear wall. The only way left to find out whether the fault is in the lamps or in what they fall on is to
// build a lamp here and now, at the place the sight is pointed, and ask the picture.
//
//   node tools/probelamp.js ["x,y,z,yaw,pitch"] [hour] ["x,y,z" to put the lamp] [strength]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "-4,1.85,2,-1.95,0.2";
const HOUR = process.argv[3] || "22";
const AT = (process.argv[4] || "-6.9,1.2,1.6").split(",").map(Number);
const FLAME = process.argv[5] ? Number(process.argv[5]) : 115;

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await b.newPage({ viewport: { width: 480, height: 270 } });
await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
await page.waitForTimeout(9000);

const where = await page.evaluate((p) => {
	const V = window.__villa;
	// A light made here, now, with nothing else going on.
	const L = new BABYLON.PointLight("probeLamp", new BABYLON.Vector3(p[0], p[1], p[2]), V.scene);
	L.diffuse = new BABYLON.Color3(1, 0.7, 0.42);
	L.specular = new BABYLON.Color3(0.1, 0.08, 0.04);
	L.range = 8;
	L.intensity = 0;
	const cv = V.engine.getRenderingCanvas();
	const names = [];
	for (const [x, y] of [[cv.width / 2, cv.height / 2], [cv.width / 2, cv.height * 0.8], [cv.width * 0.25, cv.height * 0.65]]) {
		const hit = V.scene.pick(x, y);
		const m = hit?.pickedMesh;
		names.push(`${m ? m.name : "open"}/${m?.material?.name || "-"}${m?.material?.disableLighting ? " UNLIT" : ""}@${hit?.distance?.toFixed ? hit.distance.toFixed(1) : "?"}m`);
	}
	return { names, lights: V.scene.lights.length };
}, AT);
console.log(`probe lamp at ${AT.join(",")}; scene now holds ${where.lights} lights`);
console.log(`the sight falls on: ${where.names.join(", ")}\n`);

const mean = async (tag) => {
	await page.waitForTimeout(4000);
	const f = `/tmp/probe-${tag}.png`;
	await page.screenshot({ path: f });
	const img = PNG.sync.read(fs.readFileSync(f));
	let s = 0, big = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		const L = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
		s += L;
		if (L > 60) big++;
	}
	const n = img.data.length / 4;
	return `mean ${(s / n).toFixed(2)}  pixels over L60 ${((100 * big) / n).toFixed(1)}%`;
};

for (const flame of [0, FLAME, FLAME * 10]) {
	await page.evaluate((f) => { window.__villa.scene.getLightByName("probeLamp").intensity = f; }, flame);
	console.log(`probe at ${String(flame).padEnd(5)} ${await mean("p" + flame)}`);
}
await b.close();
