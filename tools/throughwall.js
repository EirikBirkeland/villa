// Does an outside lamp shine through the wall it is bolted to?
//
// Lights in this library do not know about walls: a point light on the outside of the back wall will light
// the plaster on the inside of it just as happily, because nothing is occluded until shadows are cast, and a
// point light's shadow map is not on for these small lamps. The two lanterns at the back door were added at
// v0.99.2 with a 5 m reach, and the room's own lining on that wall is 0.35 m the other side of the plaster —
// well inside reach. This stands in the room at night and puts the lanterns out and back again, and says what
// they are worth on the inside face: the mean of the whole frame, and the colour of a named patch of the wall
// they stand beside. A couple of units is nothing; a room that visibly warms from a wall it is looking at is a
// lamp that has to be kept outside, and `excludeMeshes` is how.
//
//   node tools/throughwall.js ["x,y,z,yaw,pitch"] [hour] [world point on the wall]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "-2.5,2.3,-8,3.1416,0.02";
const HOUR = process.argv[3] || "22";
const POINT = (process.argv[4] || "-2.5,1.8,-12.0").split(",").map(Number);
const MATCH = "backLanternLight";

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
// The patch to read, found the honest way: the ordinary pick says what is drawn at that point, so a wall that
// is not where the tool thinks it is says so instead of quietly returning the ceiling.
const spot = await page.evaluate((p) => {
	const V = window.__villa;
	const q = BABYLON.Vector3.Project(new BABYLON.Vector3(p[0], p[1], p[2]), BABYLON.Matrix.Identity(),
		V.scene.getTransformMatrix(), V.camera.viewport.toGlobal(V.engine.getRenderWidth(), V.engine.getRenderHeight()));
	const cv = V.engine.getRenderingCanvas();
	const hit = V.scene.pick(q.x, q.y);
	return { x: Math.round((q.x / V.engine.getRenderWidth()) * cv.width), y: Math.round((q.y / V.engine.getRenderHeight()) * cv.height), mesh: hit?.pickedMesh?.name || "nothing" };
}, POINT);
console.log(`hour ${HOUR} from ${VIEW}; reading ${POINT.join(",")} at ${spot.x},${spot.y} — that pixel is ${spot.mesh}\n`);

const set = (on) => page.evaluate(([names, on]) => {
	for (const l of window.__villa.scene.lights) if (names.includes(l.name)) l.intensity = on ? l.baseIntensity || l.intensity : 0;
}, [names, Boolean(on)]);

const shoot = async (tag) => {
	await page.waitForTimeout(4000);
	const f = `/tmp/wall-${tag}.png`;
	await page.screenshot({ path: f });
	const img = PNG.sync.read(fs.readFileSync(f));
	let sum = 0, black = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		const L = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
		sum += L;
		if (L < 5) black++;
	}
	const n = img.data.length / 4;
	const i = (spot.y * img.width + spot.x) * 4;
	return {
		mean: +(sum / n).toFixed(1), black: +((100 * black) / n).toFixed(2),
		patch: [img.data[i], img.data[i + 1], img.data[i + 2]],
	};
};

const flame = await page.evaluate((names) => window.__villa.scene.lights.filter((l) => names.includes(l.name))[0].intensity, names);
await set(false); const off = await shoot("off");
await set(true); const on = await shoot("on");
console.log(`lanterns out   mean ${off.mean}  black ${off.black}%  the patch rgb(${off.patch.join(",")})`);
console.log(`lanterns lit   mean ${on.mean}  black ${on.black}%  the patch rgb(${on.patch.join(",")})`);
const d = +(on.mean - off.mean).toFixed(1);
console.log(`\nthose lamps are worth ${d} units of mean inside the room (each at ${flame.toFixed(0)}).`);
console.log(Math.abs(d) < 2 ? "Nothing worth keeping: the wall keeps them out." : "They shine through the wall — keep them to the outside with excludeMeshes.");
await b.close();
