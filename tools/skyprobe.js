// What colour is the sky, at three tilts of the sight?
//
// Written while chasing whether the Villa's midday sky is blue. It is not: straight up at noon the top of the
// frame is rgb(221,196,154), a warm cream haze, which is what a tropical noon through a tone curve looks like
// and is daylight the master calibrated — so it is reported and not touched.
//
// The lesson in here is the expensive one: a ray aimed at the sky dome ALWAYS hits it. The dome is a shell
// turned inside out around the whole garden, so `pickWithRay` with a sky predicate answers "sky" from every
// direction, palm trees and walls in the way and all — sixteen out of sixteen, from every tilt, including the
// one whose top rows are plainly leaves. Occlusion only comes from the ordinary pick, and the sky dome is not
// pickable, so what this tool reports is: the colour along the top of the picture, plus what the ordinary pick
// finds there (which is the honest test for "is that the sky or is that a palm").
//
//   node tools/skyprobe.js [hour] [pitch, comma separated]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const HOUR = process.argv[2] || "12";
const PITCHES = (process.argv[3] || "1.2,0.7,0.3,0,-0.4").split(",").map(Number);
const STAND = "-4,1.6,10";

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
for (const pitch of PITCHES) {
	const view = `${STAND},0,${pitch}`;
	const ctx = await b.newContext({ viewport: { width: 480, height: 270 } });
	const p = await ctx.newPage();
	await p.goto(`http://localhost:8090/villa/index.html?view=${view}&hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
	await p.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
	await p.waitForTimeout(8000);
	const t = await p.evaluate(() => {
		const V = window.__villa, tally = {};
		for (const y of [6, 20, 40, 60]) {
			for (const x of [60, 160, 320, 420]) {
				const hit = V.scene.pick(x, y);
				const name = hit?.pickedMesh?.name || "nothing pickable there";
				tally[name] = (tally[name] || 0) + 1;
			}
		}
		return { tally, pitch: +V.camera.rotation.x.toFixed(2), cam: `${V.camera.position.y.toFixed(2)}` };
	});
	await p.screenshot({ path: "/tmp/sky.png" });
	const img = PNG.sync.read(fs.readFileSync("/tmp/sky.png"));
	let R = 0, G = 0, B = 0, n = 0;
	for (let r = 0; r < 6; r++) {
		for (let c = 0; c < img.width; c++) {
			const i = (r * img.width + c) * 4;
			R += img.data[i]; G += img.data[i + 1]; B += img.data[i + 2]; n++;
		}
	}
	const top = Object.keys(t.tally).sort((a, b2) => t.tally[b2] - t.tally[a])[0];
	console.log(`pitch ${String(pitch).padEnd(5)} (camera ${t.pitch}) top rows rgb(${Math.round(R / n)},${Math.round(G / n)},${Math.round(B / n)}) — the pick there says ${top} ${JSON.stringify(t.tally)}`);
	await p.close();
}
await b.close();
