// Is the picture sharper, or only more expensive? Staircases and grain, one stand, several settings.
//
// Two settings the master asked for — 4x multisampling and anisotropic filtering at 16 — are supposed to buy
// sharpness, and neither shows up in a frame mean or a black percentage: they move edges and grazing texture,
// which is exactly what a whole-frame average washes out. So this reads those two things directly.
//
//   STAIRCASES. A diagonal edge drawn without multisampling is a staircase: one-pixel steps, and a step shows
//     up as a pixel that disagrees sharply with BOTH the pixel to its left and the pixel above it. Counting
//     those corners counts jaggies, and a real multisample should take the count down.
//
//   GRAIN OF THE GROUND. Anisotropic filtering is about what the ground looks like when it runs away from the
//     eye, so the tool measures the fine structure in the bottom band of the picture — the mean absolute
//     difference between each pixel and the middle of its 5x5 neighbourhood, which is high when the texture
//     still shows its own brushwork and low when it has been averaged to mush.
//
//   node tools/sharpness.js ["x,y,z,yaw,pitch"] [hour] ["query, query, ..."]
// e.g. node tools/sharpness.js "0,1.6,14,0,-0.03" 10 "msaa=1,msaa=4,msaa=8"
//      node tools/sharpness.js "0,0.9,6.5,0,-0.16" 10 "aniso=1,aniso=4,aniso=8,aniso=16"
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "0,1.6,14,0,-0.03";
const HOUR = process.argv[3] || "10";
const CASES = (process.argv[4] || "msaa=1,msaa=4,msaa=8").split(",").map((s) => s.trim());
const W = 640, H = 360;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});

function measure(img) {
	const { width: w, height: h, data } = img;
	const L = (x, y) => {
		const i = (y * w + x) * 4;
		return (data[i] + data[i + 1] + data[i + 2]) / 3;
	};
	let sum = 0, corners = 0, grainSum = 0, grainN = 0, total = 0;
	const from = Math.floor(h * 0.75);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const l = L(x, y);
			sum += l;
			total++;
			if (x > 0 && y > 0 && Math.abs(l - L(x - 1, y)) > 40 && Math.abs(l - L(x, y - 1)) > 40) corners++;
			if (y >= from && y < h - 2 && x >= 2 && x < w - 2) {
				let m = 0;
				for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m += L(x + dx, y + dy);
				grainSum += Math.abs(l - m / 25);
				grainN++;
			}
		}
	}
	return { mean: +(sum / total).toFixed(1), corners, grain: +(grainSum / Math.max(1, grainN)).toFixed(2) };
}

for (const q of CASES) {
	const page = await browser.newPage({ viewport: { width: W, height: H } });
	await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1&${q}`, { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
	await page.waitForTimeout(11000);
	const file = `/tmp/sharp-${q.replace(/[^a-z0-9]/gi, "")}.png`;
	await page.screenshot({ path: file });
	const state = await page.evaluate(() => ({
		samples: window.__villa.pipeline?.samples,
		// How many textures are being filtered at each level, rather than the first one that answers: a
		// handful of the Villa's maps are built outside `texture()` and keep the library's default of 1.
		aniso: (function () { const at = {}; for (const t of window.__villa.scene.textures) { const k = t.anisotropicFilteringLevel; at[k] = (at[k] || 0) + 1; } return JSON.stringify(at); })(),
	}));
	const m = measure(PNG.sync.read(fs.readFileSync(file)));
	console.log(`${q.padEnd(10)} samples ${String(state.samples).padEnd(3)} textures at aniso levels ${state.aniso} | staircases ${String(m.corners).padEnd(6)} ground grain ${String(m.grain).padEnd(5)} mean ${m.mean}`);
	await page.close();
}
await browser.close();
