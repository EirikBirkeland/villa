// Does a lamp light anything? Measured against its own noise.
//
// A mean over the whole frame is a bad instrument for one lamp: the sky and the lawn swamp it, and the pond
// shimmers, the pool ripples and the fireflies drift, so two pictures taken four seconds apart differ in
// forty thousand pixels even when nothing was changed at all. So this takes three pictures from one stand in
// one page: the named lamps off, the same lamps on, and then the lamps on AGAIN. The gap between the last two
// is what moving water and drifting insects are worth on their own — the noise floor — and the gain from a lamp
// has to clear it to be a lamp at all. Then it reports every pixel that gained more than the noise, and where
// on the screen they are, so a light that works can be pointed at something.
//
//   node tools/lampgain.js ["x,y,z,yaw,pitch"] [hour] [part of a lamp name] [intensity, default as built]
//
// ALWAYS PASS `still=1` IN THE URL BY HAND (it is in this tool already). Without it the day cycle writes every
// lamp's intensity from the hour on every frame, so anything this tool writes to a light is overwritten before
// the next picture is drawn and the whole measurement reads as nothing. That trap cost an hour: the same test
// without the switch reported that the back-door lanterns lit nothing, and with it the rear view goes 22.9 to
// 7.9 the moment they are put out.
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "0,2.1,2,0,-0.3";
const HOUR = process.argv[3] || "22";
const MATCH = process.argv[4] || "stringLight";
const INTENSITY = process.argv[5] ? Number(process.argv[5]) : null;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
await page.waitForTimeout(9000);

const built = await page.evaluate((m) => {
	const found = window.__villa.scene.lights.filter((l) => l.name.includes(m));
	return { names: found.map((l) => l.name), intensity: found.map((l) => l.intensity) };
}, MATCH);
if (!built.names.length) { console.log(`no lamp whose name holds "${MATCH}"`); process.exit(1); }
const flame = INTENSITY ?? Math.max(...built.intensity);
console.log(`hour ${HOUR} at ${VIEW}`);
console.log(`lamps ${built.names.join(", ")} — built strength ${Math.max(...built.intensity)}, testing ${flame}\n`);

// Only the strength is touched, never `setEnabled`: measured in this Babylon (9.30, vendored), switching a
// light off with `setEnabled(false)` leaves it illuminating the picture exactly as before, while writing zero
// to its intensity takes it out at once — the rear wall at midnight goes from mean 22.9 to 7.9 on the strength
// change alone and does not move a pixel on the disabled one. So the switch here is intensity, and that also
// matches what the day cycle does for a reason (see `src/daylight.js`).
const set = (on) => page.evaluate(([names, flame, on]) => {
	for (const l of window.__villa.scene.lights) {
		if (!names.includes(l.name)) continue;
		l.intensity = on ? flame : 0;
	}
}, [built.names, flame, on]);

const shot = async (tag) => {
	await page.waitForTimeout(4000);
	const f = `/tmp/gain-${tag}.png`;
	await page.screenshot({ path: f });
	return PNG.sync.read(fs.readFileSync(f));
};

await set(false);
const off = await shot("a-off");
await set(true);
const on = await shot("b-on");
const again = await shot("c-again");

const L = (img, i) => (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
// What the same state costs: the second and third pictures both have the lamps burning, and only the
// garden's own moving parts differ.
let noise = 0, noiseMax = 0;
for (let i = 0; i < on.data.length; i += 4) {
	const d = Math.abs(L(on, i) - L(again, i));
	if (d > 0.5) noise++;
	noiseMax = Math.max(noiseMax, d);
}
// And what the lamp is worth, measured pixel by pixel against the same state.
let gain = 0, best = 0, box = null, sum = 0;
for (let r = 0; r < on.height; r++) {
	for (let c = 0; c < on.width; c++) {
		const i = (r * on.width + c) * 4;
		const d = L(on, i) - L(off, i);
		sum += d;
		if (d > Math.max(4, noiseMax)) {
			gain++;
			if (d > best) best = d;
			if (!box) box = { x0: c, x1: c, y0: r, y1: r };
			box.x0 = Math.min(box.x0, c); box.x1 = Math.max(box.x1, c);
			box.y0 = Math.min(box.y0, r); box.y1 = Math.max(box.y1, r);
		}
	}
}
const n = on.width * on.height;
console.log(`noise floor: ${noise} pixels move on their own (${((100 * noise) / n).toFixed(1)}% of the frame), worst single pixel ${noiseMax.toFixed(0)}`);
console.log(`the lamp: ${(100 * gain / n).toFixed(2)}% of the frame brighter than that, brightest gain ${best.toFixed(0)}`);
console.log(`mean shift over the whole frame ${((sum / n)).toFixed(2)}`);
console.log(box ? `the lit patch runs x ${box.x0}..${box.x1}, y ${box.y0}..${box.y1} of ${on.width}x${on.height}` : "nothing in this frame is lit by it");
await browser.close();
