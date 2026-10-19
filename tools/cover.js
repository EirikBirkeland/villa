// cover — what the browser actually paints the frame out of.
//
// `tools/draw.js` says what the CPU drawing fills the frame with; this says what a real browser does,
// which is the only answer that counts. It stands the camera somewhere, then asks the page, pixel by
// pixel on a grid, which mesh and material is behind each one, and adds up the share of the frame.
// For each material it also reads back the colour the browser actually painted there, so a surface can
// be checked against `src/surface-colours.js` and against the CPU drawing without squinting at a
// whole frame at once.
//
// It lists every material that is see-through, and every visible mesh with no colour map on it, which
// is how you find a surface drawn like glass where there should have been grass.
//
//   node tools/cover.js                                   -> the start view, 40 px grid
//   node tools/cover.js --view "2.4,1.74,10.5,3.2,0.06" --step 32 --out pictures/br-home.png
//   node tools/cover.js --alpha                       -> only the report on see-through materials
//   node tools/cover.js --untexed                     -> every visible mesh with no colour map
//   node tools/cover.js --js "mats.palmLeaf.doubleSided = true" --label "leaves both sides"
//
// --view x,y,z,yaw,pitch   where to stand (default: where a visitor arrives, unmoved)
// --step N                 grid spacing in pixels (default 40)
// --size 1280x720          the picture
// --out file.png           the picture to write
// --alpha                  report only the materials that blend
// --untexed                report only the meshes that have no colour map
// --js "source"            run this against the Villa first (mats, sun, pipeline, the three lamps by
//                          name), so one surface can be measured as built and as changed
// --label text             a word for the header, to tell two runs apart

import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "node:fs";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
	"--hide-scrollbars",
];

const argv = process.argv.slice(2);
const readFlag = (name) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : null;
};
const hasFlag = (name) => argv.includes(`--${name}`);

const url = argv[0] && !argv[0].startsWith("--") ? argv[0] : "http://localhost:8090/villa/index.html";
const view = readFlag("view");
const step = Number(readFlag("step") || 40);
const width = Number((readFlag("size") || "1280x720").split("x")[0]);
const height = Number((readFlag("size") || "1280x720").split("x")[1]);
const out = readFlag("out");
const runFor = Number(readFlag("wait") || 9000);
const poke = readFlag("js");
const label = readFlag("label") || "as it is";

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${height}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height });
const logs = [];
page.on("pageerror", (error) => logs.push(`page error: ${error.message}`));
page.on("console", (message) => {
	if (message.type() === "error" || message.type() === "warning") logs.push(`${message.type()}: ${message.text()}`);
});

await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, Math.min(runFor, 5000)));

if (view) {
	const [x, y, z, yaw, pitch] = view.split(",").map(Number);
	await page.evaluate(([x, y, z, yaw, pitch]) => {
		const { camera, walk } = window.__villa;
		camera.position.set(x, y, z);
		camera.rotation.set(pitch || 0, yaw || 0, 0);
		walk.settle();
	}, [x, y, z, yaw, pitch]);
	await new Promise((resolve) => setTimeout(resolve, 1500));
}

// One change, put on the running Villa, so the same camera can be measured with it and without it.
if (poke) {
	const failed = await page.evaluate((source) => {
		try {
			const { scene, camera, mats, sun, pipeline, ground, walk } = window.__villa;
			const light = scene.getLightByName("sun");
			const hemi = scene.getLightByName("sky-fill");
			const bounce = scene.getLightByName("bounce");
			void camera; void mats; void sun; void pipeline; void ground; void walk; void light; void hemi; void bounce;
			eval(source);
			return "";
		} catch (error) {
			return `--js "${source}" failed: ${error.message}`;
		}
	}, poke);
	if (failed) console.log(failed);
	await new Promise((resolve) => setTimeout(resolve, 1200));
}

const shot = out || "pictures/tmp-cover.png";

const sweep = hasFlag("alpha") || hasFlag("untexed") ? null : await page.evaluate(([step]) => {
	const { scene, engine } = window.__villa;
	const w = engine.getRenderWidth();
	const h = engine.getRenderHeight();
	const sx = w / window.innerWidth;
	const sy = h / window.innerHeight;
	const count = new Map();
	const sample = new Map();
	let nothing = 0;
	let total = 0;
	for (let y = step / 2; y < window.innerHeight; y += step) {
		for (let x = step / 2; x < window.innerWidth; x += step) {
			total++;
			const hit = scene.pick(x * sx, y * sy, (mesh) => mesh.isEnabled() && mesh.isVisible);
			if (!hit || !hit.hit || !hit.pickedMesh) {
				nothing++;
				if (!sample.has("open sky")) sample.set("open sky", { mesh: "skyDome", distance: 560, point: [0, 0, 0], alpha: 1, hasColourMap: false, pixels: [] });
				sample.get("open sky").pixels.push([Math.round(x), Math.round(y)]);
				count.set("open sky", (count.get("open sky") || 0) + 1);
				continue;
			}
			const mesh = hit.pickedMesh;
			const mat = mesh.material ? mesh.material.name : "no material";
			count.set(mat, (count.get(mat) || 0) + 1);
			if (!sample.has(mat)) {
				sample.set(mat, {
					mesh: mesh.name,
					distance: Number(hit.distance.toFixed(1)),
					point: hit.pickedPoint.asArray().map((v) => Number(v.toFixed(2))),
					alpha: mesh.material && mesh.material.alpha !== undefined ? Number(mesh.material.alpha.toFixed(2)) : null,
					hasColourMap: !!(mesh.material && (mesh.material.albedoTexture || mesh.material.emissiveTexture)),
					pixels: [],
				});
			}
			sample.get(mat).pixels.push([Math.round(x), Math.round(y)]);
		}
	}
	return {
		grid: `${Math.ceil(window.innerWidth / step)}x${Math.ceil(window.innerHeight / step)} of ${total} points`,
		share: [...count.entries()]
			.map(([name, n]) => ({ name, percent: Math.round((n / total) * 1000) / 10, ...sample.get(name) }))
			.sort((a, b) => b.percent - a.percent),
	};
}, [step]);

await page.screenshot({ path: shot });

// The colour the browser painted, per material, read back out of the picture it just wrote.
const png = PNG.sync.read(fs.readFileSync(shot));
// Where a grid point fell in the picture that was just written.
const at = ([x, y]) => {
	const px = Math.min(png.width - 1, Math.round((x * png.width) / width));
	const py = Math.min(png.height - 1, Math.round((y * png.height) / height));
	return (png.width * py + px) << 2;
};
const colourAt = (o) => [png.data[o], png.data[o + 1], png.data[o + 2]];
const lightOf = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

const meanColour = (pixels) => {
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;
	for (const [x, y] of pixels) {
		const o = at([x, y]);
		r += png.data[o];
		g += png.data[o + 1];
		b += png.data[o + 2];
		n++;
	}
	return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : null;
};

// The brightest and the darkest of a material's own pixels, and where they sit: a surface that is
// partly blown and partly shaded cannot be told from a flat one by its mean alone. The `runs` figure
// alongside them is how much a material's own colour varies across the frame — the flatness of a lawn
// or the liveliness of water, in one number.
const spreadOf = (pixels) => {
	let low = null;
	let high = null;
	let n = 0;
	const sum = [0, 0, 0];
	const square = [0, 0, 0];
	for (const [x, y] of pixels) {
		const o = at([x, y]);
		const rgb = colourAt(o);
		const l = lightOf(rgb);
		if (!low || l < low.l) low = { l, rgb, x: Math.round(x), y: Math.round(y) };
		if (!high || l > high.l) high = { l, rgb, x: Math.round(x), y: Math.round(y) };
		for (let c = 0; c < 3; c++) {
			sum[c] += rgb[c];
			square[c] += rgb[c] * rgb[c];
		}
		n++;
	}
	// The ordinary spread of the material's own painted colour, in each channel.
	const deviation = n
		? sum.map((s, c) => Math.round(Math.sqrt(Math.max(0, square[c] / n - (s / n) * (s / n)))))
		: null;
	return { low, high, deviation, samples: n };
};

if (sweep) {
	console.log(`cover — ${url}   case: ${label}`);
	console.log(`camera ${view || "where a visitor arrives"}   grid ${sweep.grid}`);
	console.log(`picture ${shot} ${png.width}x${png.height}\n`);
	console.log("material            share   colour painted    one sample behind it");
	for (const row of sweep.share) {
		const rgb = meanColour(row.pixels);
		console.log(
			`${row.name.padEnd(18)} ${String(row.percent).padStart(5)}%  ${String(rgb).padEnd(14)}  ${row.mesh} at ${row.distance} m  alpha ${row.alpha}  ${row.hasColourMap ? "colour map" : "NO COLOUR MAP"}`,
		);
	}
	console.log("\nhow far each material's own colour runs: its brightest and darkest pixel in the frame, and how much its pixels differ from one another");
	for (const row of sweep.share) {
		if (row.name === "open sky") continue;
		const { low, high, deviation } = spreadOf(row.pixels);
		if (!low) continue;
		console.log(
			`${row.name.padEnd(18)} darkest ${String(low.rgb).padEnd(14)} at ${low.x},${low.y}   brightest ${String(high.rgb).padEnd(14)} at ${high.x},${high.y}   runs ${String(deviation).padEnd(14)} across ${row.pixels.length} points`,
		);
	}
}

const seeThrough = await page.evaluate(() => {
	const { scene } = window.__villa;
	return scene.materials
		.filter((m) => {
			const texAlpha = !!(m.opacityTexture || (m.albedoTexture && m.albedoTexture.hasAlpha));
			return m.alpha < 1 || (m.transparencyMode !== null && m.transparencyMode !== undefined && m.transparencyMode !== 0) || texAlpha;
		})
		.map((m) => ({
			name: m.name,
			alpha: Number(m.alpha.toFixed(2)),
			transparencyMode: m.transparencyMode,
			disableLighting: !!m.disableLighting,
			colourMap: m.albedoTexture ? `${m.albedoTexture.name} hasAlpha ${!!m.albedoTexture.hasAlpha}` : "none",
			opacityMap: m.opacityTexture ? m.opacityTexture.name : "none",
			meshes: scene.meshes.filter((mesh) => mesh.material === m && mesh.isVisible).length,
		}))
		.sort((a, b) => a.alpha - b.alpha);
});
console.log("\nsee-through materials in the scene (alpha below 1, a blend mode, or a texture with holes in it)");
for (const m of seeThrough) {
	console.log(
		`  ${m.name.padEnd(16)} alpha ${String(m.alpha).padEnd(5)} mode ${String(m.transparencyMode).padEnd(5)} ${m.meshes} mesh(es)  colour: ${m.colourMap}${m.opacityMap === "none" ? "" : `  opacity: ${m.opacityMap}`}`,
	);
}

if (hasFlag("alpha")) {
	if (logs.length) console.log(logs.join("\n"));
	await browser.close();
	process.exit(0);
}

const untexed = await page.evaluate(() => {
	const { scene } = window.__villa;
	const bare = new Map();
	for (const mesh of scene.meshes) {
		if (!mesh.isVisible || !mesh.isEnabled() || !mesh.material) continue;
		const m = mesh.material;
		if (m.albedoTexture || m.emissiveTexture || m.opacityTexture) continue;
		const key = m.name;
		if (!bare.has(key)) bare.set(key, { material: m.name, colour: m.albedoColor ? m.albedoColor.asArray().map((v) => Math.round(v * 255)) : null, meshes: [] });
		bare.get(key).meshes.push(mesh.name);
	}
	return [...bare.values()].map((row) => ({ ...row, count: row.meshes.length, meshes: row.meshes.slice(0, 6) }));
});
console.log("\nvisible meshes with no colour texture at all — flat colour only");
for (const row of untexed) {
	console.log(`  ${row.material.padEnd(16)} rgb ${String(row.colour)}  ${row.count} mesh(es): ${row.meshes.join(", ")}${row.count > row.meshes.length ? ", ..." : ""}`);
}

if (logs.length) console.log(`\n--- what the page said ---\n${logs.slice(0, 20).join("\n")}`);

if (out) console.log(`\nwrote ${out}`);
await browser.close();
