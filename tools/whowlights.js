// Which lights is a surface actually wearing? Babylon picks them for you, and its pick is a contest.
//
// Every material is handed a fixed number of lights out of all the lights in the scene, and which ones it
// gets depends on where the visitor stands. When a wall goes flat and black while a lamp is burning right
// beside it, nine times out of ten the wall is not wearing that lamp: the shader is full with six other
// lights that are further away. This asks the mesh what it is wearing, and prints every lamp with its
// strength and reach, so a black wall can be blamed on something with a name.
//
//   node tools/whowlights.js "<x,y,z,yaw,pitch>" [hours, comma separated]
import { chromium } from "playwright-core";

const VIEW = process.argv[2] || "0,1.6,-19,0,0.06";
const HOURS = (process.argv[3] || "10,17.5,22").split(",");
const NAMED = process.argv[4] || "wallBackPart0,storeWallNorthPart1,backBand";

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
for (const hour of HOURS) {
	const page = await browser.newPage({ viewport: { width: 400, height: 240 } });
	await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${hour}&still=1`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(15000);
	const r = await page.evaluate((names) => {
		const V = window.__villa;
		const worn = (n) => {
			const m = V.scene.getMeshByName(n);
			if (!m) return "no such mesh";
			const list = (m.lightSources || []).map((l) => `${l.name}@${l.intensity.toFixed(1)}`);
			return `${list.join(", ") || "NOTHING"}  (budget ${m.material?.maxSimultaneousLights})`;
		};
		return {
			worn: names.map((n) => [n, worn(n)]),
			lights: V.scene.lights
				.map((l) => `${l.name} i${l.intensity.toFixed(2)} r${(l.range ?? 0).toFixed(1)} ${l.isEnabled() ? "on" : "OFF"}`)
				.join("; "),
		};
	}, NAMED.split(","));
	console.log(`--- hour ${hour}, standing at ${VIEW}`);
	for (const [n, w] of r.worn) console.log(`   ${n.padEnd(22)} wears ${w}`);
	console.log(`   the scene's lamps: ${r.lights}`);
	await page.close();
}
await browser.close();
