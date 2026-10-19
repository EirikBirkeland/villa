// Does every glowing thing actually light anything?
//
// The back-door lanterns were the fault that made this tool: two boxes painted with `lampGlow`, burning
// merrily at midnight and throwing not one ray on the wall behind them, so the whole north face of the
// house came out of the picture black with two bright dots on it. Any fixture that glows and casts nothing
// is the same fault waiting for a camera, so this walks every mesh wearing a glow material and asks how far
// the nearest real light is from it. A glow with no light within a metre or so is a painted bulb.
//
//   node tools/lamplight.js [hour]
import { chromium } from "playwright-core";

const HOUR = process.argv[2] || "22";
const GLOW = ["lampGlow", "poolLamp", "lanternGlass"];

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
await page.goto(`http://localhost:8090/villa/index.html?hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
await page.waitForTimeout(6000);

const report = await page.evaluate((names) => {
	const V = window.__villa;
	const S = V.scene;
	// Where every real light stands, with whether it is actually burning at this hour.
	const lights = S.lights.map((l) => ({ name: l.name, p: l.getAbsolutePosition(), on: l.isEnabled(), i: l.intensity }));
	const rows = [];
	for (const m of S.meshes) {
		const mat = m.material;
		if (!mat || !names.includes(mat.name)) continue;
		const p = m.getAbsolutePosition();
		let best = null;
		for (const l of lights) {
			if (l.name === "flashlight") continue;
			const d = Math.hypot(p.x - l.p.x, p.y - l.p.y, p.z - l.p.z);
			if (!best || d < best.d) best = { d, name: l.name, on: l.on, i: l.i };
		}
		rows.push({ mesh: m.name, mat: mat.name, at: `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`,
			near: best ? `${best.name} ${best.d.toFixed(1)} m ${best.on ? "on" : "OFF"} i${best.i.toFixed(1)}` : "nothing" });
	}
	return rows;
}, GLOW);

console.log(`hour ${HOUR}: ${report.length} glowing meshes\n`);
// The test is distance and nothing else, at three metres. A bulb whose nearest burning lamp is further than
// that is a bulb that was painted, however many lights the scene contains — and three metres and not one,
// because a string of festoon bulbs is served by one lamp per span (see `makeStringLights` in
// `src/garden.js`): twenty bulbs along nine metres are one glow to a visitor, so every bulb within a span of
// its lamp counts as lit, exactly as it looks.
const rows = report.map((r) => ({ ...r, d: Number((r.near.match(/([\d.]+) m/) || [0, 999])[1]) }));
const alone = rows.filter((r) => r.d > 3);
for (const r of rows) {
	console.log(`${r.d > 3 ? "PAINTED " : "lit     "} ${r.mesh.padEnd(26)} ${r.mat.padEnd(9)} ${r.at.padEnd(18)} nearest ${r.near}`);
}
console.log(`\nbulbs that glow with no lamp behind them: ${alone.length}`);
for (const r of alone) console.log(`   ${r.mesh} at ${r.at} — ${r.near}`);
await browser.close();
