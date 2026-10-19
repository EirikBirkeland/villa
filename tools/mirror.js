// tools/mirror.js — is the sky in the water the sky overhead, or the sky the mirror was baked under?
//
// Both cubemaps — the sky every glossy surface reads, and the pool's own mirror of the garden — are drawn
// ONCE, while the sun still stands where `src/world.js` put it: the calibrated half past five. The day cycle
// redraws them at certain hours, but at a start hour that is not half past five there is a case where it
// declines to, because it takes the boot bake and the start hour to be the same moment. This tool asks the
// question directly: photograph the Villa standing at one hour, then force the mirrors to be redrawn at that
// same hour from inside the page, photograph again, and print what the water's mirror half did.
//
//   node tools/mirror.js                     -> the standing start at half past six
//   node tools/mirror.js --hour 13.5 --view "..."
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i < 0 ? d : argv[i + 1]; };
const hour = opt("hour", "6.4");
const view = opt("view", "2.4,1.74,10.5,3.2,0.06");
const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"];

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto(`http://localhost:8090/villa/?hour=${hour}&daylen=0`, { waitUntil: "load", timeout: 120000 });
await new Promise((r) => setTimeout(r, 9000));
const [x, y, z, yaw, pitch] = view.split(",").map(Number);
await page.evaluate(([x, y, z, yaw, pitch]) => {
	const { camera } = window.__villa;
	camera.position.set(x, y, z);
	camera.rotation.set(pitch || 0, yaw || 0, 0);
}, [x, y, z, yaw, pitch]);
await new Promise((r) => setTimeout(r, 2500));

const shotA = PNG.sync.read(await page.screenshot());
// Force the mirrors to be redrawn at the hour the Villa is standing in: any hour but the one they were
// baked under makes the cycle do the refresh it was skipping.
const after = await page.evaluate((h) => {
	const day = window.__villa.day;
	day.set(h + 1e-4);
	return { hour: day.hour };
}, Number(hour));
await new Promise((r) => setTimeout(r, 3500));
const shotB = PNG.sync.read(await page.screenshot());
await browser.close();

const region = opt("region", "360,470,560,120").split(",").map(Number);
const [rx, ry, rw, rh] = region;
function mean(png) {
	let r = 0, g = 0, b = 0, n = 0;
	for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
		const i = (png.width * y + x) << 2;
		r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
	}
	return [r / n, g / n, b / n];
}
const a = mean(shotA);
const b = mean(shotB);
const L = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const p = (c) => c.map((v) => v.toFixed(1)).join(",");
// And the whole frame, because a mirror is only part of a picture: if the sky in the cube were wrong for the
// hour, the glossy things would say so too — the glass, the brass of the bollard, the water's sheen.
function frameMean(png) {
	let r = 0, g = 0, b = 0;
	for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
		const i = (png.width * y + x) << 2;
		r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2];
	}
	const n = png.width * png.height;
	return [r / n, g / n, b / n];
}
const fa = frameMean(shotA);
const fb = frameMean(shotB);
console.log(`hour ${hour}: mirror region ${rx},${ry} ${rw}x${rh}`);
console.log(`  as it starts   ${p(a)}  L${L(a).toFixed(1)}`);
console.log(`  redrawn at the same hour   ${p(b)}  L${L(b).toFixed(1)}`);
console.log(`  the water moved ${(L(b) - L(a) >= 0 ? "+" : "") + (L(b) - L(a)).toFixed(1)} of luminance` +
	(Math.abs(L(b) - L(a)) < 1.5 ? " — nothing: the mirror already matched the hour" : ""));
console.log(`  the whole frame ${p(fa)} L${L(fa).toFixed(1)} against ${p(fb)} L${L(fb).toFixed(1)} after,`
	+ ` a move of ${(L(fb) - L(fa) >= 0 ? "+" : "") + (L(fb) - L(fa)).toFixed(1)}
`);
