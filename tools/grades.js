// Count the flat steps in a smooth dark surface — banding, made into a number.
//
// Tone mapping plus a contrast multiplier turn a slow gradient on a big dim wall into a few flat plateaus with
// crisp edges, and the eye reads that as dirt. `tools/grades.js` photographs a stand twice — once with the
// image pipeline's dither off and once with it on — and reports what the patch is made of: how many distinct
// shades it holds, how far the row means wander, and how many pixels step more than 6 points from their left
// neighbour. A banded patch has few shades and hard steps; a dithered one has many shades and only soft ones.
//
//   node tools/grades.js ["x,y,z,yaw,pitch"] [hour] [fraction of width for the patch]
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "5.6,1.6,-19,0,-0.14";
const HOUR = process.argv[3] || "10";
const SPAN = process.argv[4] ? Number(process.argv[4]) : 0.12;

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const page = await b.newPage({ viewport: { width: 1280, height: 960 } });

const read = async (dial, tag) => {
	await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${HOUR}&still=1&dither=${dial}${process.env.EXTRA || ""}`, { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 180000 });
	await page.waitForTimeout(11000);
	const f = `/tmp/grades-${tag}.png`;
	await page.screenshot({ path: f });
	const img = PNG.sync.read(fs.readFileSync(f));
	const x0 = Math.round(img.width * 0.36), y0 = Math.round(img.height * 0.56);
	const w = Math.round(img.width * SPAN), h = Math.round(img.height * 0.1);
	const L = (x, y) => { const i = ((y0 + y) * img.width + (x0 + x)) * 4; return (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3; };
	const shades = new Set();
	const rows = [];
	let steps = 0, sum = 0;
	for (let y = 0; y < h; y++) {
		let r = 0;
		for (let x = 0; x < w; x++) {
			const v = L(x, y);
			shades.add(Math.round(v));
			sum += v; r += v;
			if (x > 0 && Math.abs(v - L(x - 1, y)) > 6) steps++;
		}
		rows.push(r / w);
	}
	const rowSwing = Math.max(...rows) - Math.min(...rows);
	console.log(`dither ${dial}: mean ${(sum / (w * h)).toFixed(1)}  shades ${String(shades.size).padStart(3)}  row swing ${rowSwing.toFixed(1)}  hard steps ${((100 * steps) / (w * h)).toFixed(2)}%  (${w}x${h} patch)`);
	return f;
};

await read(0, "off");
await read(1, "on");
await b.close();
