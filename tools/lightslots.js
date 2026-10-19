// Do the garden's lamps come alive when the materials are given more light slots? Six, and thirteen.
//
// Every material in the Villa is capped at six simultaneous lights (`src/materials.js`), and the terrace and
// the lawn are offered eleven or thirteen by the time the pool fittings and the two back-door lanterns are
// counted. Nothing added after that contest has ever shown: the festoon lamps and the eight bollard lamps read
// as a null change at 9 units, at 45, at 115 and at 4000 — while the two lanterns, which were in the scene
// before the first frame was drawn, are worth fifteen points of mean on the rear wall at midnight. That
// pattern points at the budget and not at the strength, and this measures it: one stand, one lamp set, the
// whole-frame mean before and after the materials are raised from six slots to thirteen.
//
//   node tools/lightslots.js ["x,y,z,yaw,pitch"] [hour] [part of a lamp name] [strength to test]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "-4.6,1.85,2.6,-1.95,0.25";
const HOUR = process.argv[3] || "22";
const MATCH = process.argv[4] || "lampPostLight";
const FLAME = process.argv[5] ? Number(process.argv[5]) : 115;

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await b.newPage({ viewport: { width: 480, height: 270 } });
await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
await page.waitForTimeout(9000);

const names = await page.evaluate((m) => window.__villa.scene.lights.filter((l) => l.name.includes(m)).map((l) => l.name), MATCH);
if (!names.length) { console.log(`no lamp whose name holds "${MATCH}"`); process.exit(1); }
console.log(`lamps ${names.length} × ${MATCH} at ${FLAME}, from ${VIEW}`);
console.log(`the sight falls on: ${await page.evaluate(() => { const V = window.__villa, cv = V.engine.getRenderingCanvas(); const at = (x, y) => V.scene.pick(x, y)?.pickedMesh?.name || "open sky"; return `centre ${at(cv.width / 2, cv.height / 2)}, low ${at(cv.width / 2, cv.height * 0.85)}`; })}\n`);

const set = (on) => page.evaluate(([names, flame, on]) => {
	for (const l of window.__villa.scene.lights) if (names.includes(l.name)) l.intensity = on ? flame : 0;
}, [names, FLAME, Boolean(on)]);

const raise = (n) => page.evaluate((n) => {
	const seen = new Set(); let k = 0;
	for (const m of window.__villa.scene.meshes) {
		const mat = m.material;
		if (!mat || seen.has(mat.name) || !("maxSimultaneousLights" in mat)) continue;
		seen.add(mat.name);
		if (mat.maxSimultaneousLights !== n) { mat.maxSimultaneousLights = n; mat.markAllAsDirty?.(); mat.markDirty?.(); k++; }
	}
	return `${k} materials moved to ${n} slots`;
}, n);

const mean = async (tag) => {
	await page.waitForTimeout(4000);
	const f = `/tmp/slots-${tag}.png`;
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

for (const budget of [6, 13]) {
	console.log(`${await raise(budget)}`);
	await page.waitForTimeout(6000);
	await set(false); console.log(`   lamps out   ${await mean("out")}`);
	await set(true); console.log(`   lamps lit   ${await mean("lit")}`);
}
await b.close();
