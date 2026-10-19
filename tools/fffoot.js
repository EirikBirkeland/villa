// tools/fffoot.js — where the fireflies are on the screen, and how many pixels their glow paints.
//
// `tools/where.js` marks creatures magenta and counts the difference a creature makes to a frame; a
// firefly's whole being is an emissive that changes every frame, and it is switched off by day, so it is
// asked a different question here: project each one with the Villa's own camera and count the yellow-green
// pixels in a window round it. Yellow-green is a colour nothing else in this garden wears at night.
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i < 0 ? d : argv[i + 1]; };
const view = opt("view", "-11,1.7,6.8,1.57,-0.02");
const hour = opt("hour", "21.5");
const out = argv.find((a) => !a.startsWith("--") && !/^[0-9.,-]+$/.test(a)) || "pictures/tmp-fffoot.png";
const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
const url = `http://localhost:8090/villa/?still=1&hour=${hour}`;
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((r) => setTimeout(r, 8000));
if (view) {
	const [x, y, z, yaw, pitch] = view.split(",").map(Number);
	await page.evaluate(([x, y, z, yaw, pitch]) => {
		const { camera } = window.__villa;
		camera.position.set(x, y, z);
		camera.rotation.set(pitch || 0, yaw || 0, 0);
	}, [x, y, z, yaw, pitch]);
	await new Promise((r) => setTimeout(r, 2500));
}
const at = await page.evaluate(() => {
	const { scene, camera } = window.__villa;
	const engine = scene.getEngine();
	return window.__villa.fireflies.fireflies.map((f) => {
		const p = BABYLON.Vector3.Project(
			f.root.position,
			BABYLON.Matrix.Identity(),
			scene.getTransformMatrix(),
			camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
		);
		return { state: f.state, x: f.x, y: f.y, z: f.z, sx: Math.round(p.x), sy: Math.round(p.y), lit: f.lanternMat.emissiveColor.r > 1 };
	});
});
const png = PNG.sync.read(await page.screenshot().then((b) => b));
await browser.close();
for (const f of at) {
	const R = 26;
	let n = 0, best = 0, bx = 0, by = 0;
	for (let y = Math.max(0, f.sy - R); y < Math.min(720, f.sy + R); y++) {
		for (let x = Math.max(0, f.sx - R); x < Math.min(1280, f.sx + R); x++) {
			const i = (1280 * y + x) << 2;
			const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
			if (g > 120 && g >= r - 10 && b < g - 45) n++;
			const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			if (L > best) { best = L; bx = x; by = y; }
		}
	}
	console.log(`firefly at ${f.x.toFixed(2)},${f.y.toFixed(2)},${f.z.toFixed(2)} (${f.state}) → ${f.sx},${f.sy} ` +
		`${f.lit ? "flashing" : "dark"}: ${n} yellow-green px in a ${R * 2} window, brightest L${best.toFixed(0)} at ${bx},${by}`);
}
