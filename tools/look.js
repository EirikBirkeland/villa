// Looks at the Villa in the same browser the screenshot tool uses, and reports what it finds:
// console errors, what the scene is made of, where the visitor is standing, and a picture.
//
//   node tools/look.js                                  -> the Villa as a visitor first sees it
//   node tools/look.js pictures/walk.png 6000 --keys KeyW:2500,ShiftLeft:2500
//   node tools/look.js pictures/near.png 5000 --move -6,0,10 --look 0,-0.1
//   node tools/look.js pictures/one.png 6000 --view 8,1.7,14,-2.4,0.05
//
// --keys presses and holds the listed keys for the listed milliseconds.
// --move shifts the visitor by x,y,z metres. --look sets yaw,pitch radians.
// --view puts the visitor at x,y,z looking at yaw,pitch before anything else.

import { chromium } from "playwright-core";
import { PNG } from "pngjs";
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

function readFlag(name, argv) {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : null;
}

const argv = process.argv.slice(2);
// The first thing that is not a switch is the address if it looks like one, and the picture otherwise,
// so both `look.js out.png 6000` and `look.js http://host/villa/ out.png 6000` mean what they say.
const first = argv.find((a) => !a.startsWith("--")) || "";
const looksLikeAddress = /:\/\//.test(first);
const url = looksLikeAddress ? first : "http://localhost:8090/villa/";
const out = (looksLikeAddress ? argv.find((a, i) => i > argv.indexOf(first) && !a.startsWith("--")) : first) || "pictures/look.png";
const runFor = Number(argv.find((a) => /^\d+$/.test(a)) || 6000);
const width = Number(readFlag("size", argv)?.split("x")[0] || 1280);
const height = Number(readFlag("size", argv)?.split("x")[1] || 720);
const keys = readFlag("keys", argv);
const move = readFlag("move", argv);
const look = readFlag("look", argv);
const view = readFlag("view", argv);
const pick = readFlag("pick", argv);

const materialName = readFlag("material", argv);

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${height}`] });
const page = await browser.newPage();
// No cache: an old build of the Villa in the cache would be measured instead of this one.
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height });

const logs = [];
page.on("console", (message) => logs.push(`${message.type()}: ${message.text()}`));
page.on("pageerror", (error) => logs.push(`page error: ${error.message}`));
page.on("requestfailed", (request) => logs.push(`failed request: ${request.url()}`));

await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, Math.min(runFor, 4000)));

if (view) {
	const [x, y, z, yaw, pitch] = view.split(",").map(Number);
	await page.evaluate(([x, y, z, yaw, pitch]) => {
		const { camera } = window.__villa;
		camera.position.set(x, y, z);
		camera.rotation.set(pitch || 0, yaw || 0, 0);
	}, [x, y, z, yaw, pitch]);
}
if (move) {
	const [dx, dy, dz] = move.split(",").map(Number);
	await page.evaluate(([dx, dy, dz]) => {
		const { camera } = window.__villa;
		camera.position.addInPlace(new BABYLON.Vector3(dx, dy, dz));
	}, [dx, dy, dz]);
}
if (look) {
	const [yaw, pitch] = look.split(",").map(Number);
	await page.evaluate(([yaw, pitch]) => {
		const { camera } = window.__villa;
		camera.rotation.set(pitch || 0, yaw || 0, 0);
	}, [yaw, pitch]);
}

if (keys) {
	for (const part of keys.split(",")) {
		const [key, ms] = part.split(":");
		const hold = Number(ms || 1000);
		await page.keyboard.down(key);
		await new Promise((resolve) => setTimeout(resolve, hold));
		await page.keyboard.up(key);
	}
}

await new Promise((resolve) => setTimeout(resolve, Math.max(500, runFor - 4000)));

const report = await page.evaluate(() => {
	if (!window.__villa) return { error: "the Villa never started" };
	const { scene, engine, camera } = window.__villa;
	const withMaterial = scene.meshes.filter((mesh) => mesh.material);
	const lights = scene.lights.map((light) => `${light.getClassName()}:${light.name}=${light.intensity.toFixed(2)}`);
	return {
		meshes: scene.meshes.length,
		meshesWithMaterial: withMaterial.length,
		vertices: withMaterial.reduce((total, mesh) => total + (mesh.getTotalVertices?.() || 0), 0),
		materials: scene.materials.length,
		textures: scene.textures.length,
		lights,
		fps: Math.round(engine.getFps()),
		renderSize: `${engine.getRenderWidth()}x${engine.getRenderHeight()}`,
		hardwareScaling: engine.getHardwareScalingLevel(),
		camera: camera.position.asArray().map((v) => Number(v.toFixed(2))),
		looking: camera.rotation.asArray().map((v) => Number(v.toFixed(2))),
		waterInScene: scene.meshes.some((mesh) => mesh.name === "water"),
		environment: scene.environmentTexture ? scene.environmentTexture.getClassName() : "none",
	};
});

console.log(JSON.stringify(report, null, 2));
const relevant = logs.filter((line) => !/Download the React|Failed to load resource: the server responded a status of 404/.test(line));
if (relevant.length) {
	console.log("\n--- what the page said ---");
	for (const line of relevant.slice(0, 40)) console.log(line);
}

if (pick) {
	const picks = [];
	for (const pair of pick.split(";")) {
		const [xf, yf] = pair.split(",").map(Number);
		// A number under one is a fraction of the frame, because that is how every other tool here names a
		// pixel and because a fraction written as a pixel is the top-left corner of the picture, which will
		// happily answer with the sky and never tell you it is lying.
		const hit = await page.evaluate(
			([xf, yf]) => {
				const { scene, camera } = window.__villa;
				const engine = scene.getEngine();
				const w = engine.getRenderWidth();
				const h = engine.getRenderHeight();
				const x = xf <= 1 ? xf * w : xf;
				const y = yf <= 1 ? yf * h : yf;
				const result = scene.pick(x, y, (mesh) => mesh.isEnabled() && mesh.isVisible);
				if (!result || !result.hit || !result.pickedMesh) return { x: xf, y: yf, hit: "nothing" };
				return {
					x: xf,
					y: yf,
					hit: result.pickedMesh.name,
					material: result.pickedMesh.material ? result.pickedMesh.material.name : "none",
					distance: Number(result.distance.toFixed(2)),
					point: result.pickedPoint.asArray().map((v) => Number(v.toFixed(2))),
				};
			},
			[xf, yf],
		);
		picks.push(hit);
		const size = await page.evaluate(() => {
			const c = document.querySelector("canvas");
			return [c.clientWidth, c.clientHeight];
		});
		const px = xf <= 1 ? xf * size[0] : xf;
		const py = yf <= 1 ? yf * size[1] : yf;
		const one = await page.screenshot({ clip: { x: Math.round(px), y: Math.round(py), width: 1, height: 1 } });
		const image = PNG.sync.read(one);
		picks[picks.length - 1].pixel = [image.data[0], image.data[1], image.data[2]];
	}
	console.log("\n--- what is under those pixels ---");
	console.log(JSON.stringify(picks));
}

if (materialName) {
	const details = await page.evaluate((name) => {
		const mats = window.__villa.mats;
		const mat = mats[name];
		if (!mat) return { error: `no material called ${name}`, known: Object.keys(mats) };
		const grab = (key) => {
			const value = mat[key];
			if (value && value.asArray) return value.asArray().map((v) => Number(v.toFixed(3)));
			if (value && value.getClassName) return value.getClassName() + (value.uScale ? ` uScale ${value.uScale}` : "");
			return value;
		};
		return {
			name: mat.name,
			class: mat.getClassName(),
			alpha: grab("alpha"),
			transparencyMode: grab("transparencyMode"),
			alphaCutOff: grab("alphaCutOff"),
			disableLighting: grab("disableLighting"),
			albedoColor: grab("albedoColor"),
			emissiveColor: grab("emissiveColor"),
			environmentIntensity: grab("environmentIntensity"),
			skyReflection: grab("reflectivityTexture"),
			roughness: grab("roughness"),
			metalness: grab("metalness"),
			albedoTexture: grab("albedoTexture"),
			bumpTexture: grab("bumpTexture"),
			opacityTexture: grab("opacityTexture"),
			sideOrientation: grab("sideOrientation"),
		};
	}, materialName);
	console.log("\n--- the material ---");
	console.log(JSON.stringify(details, null, 1));
}

await page.screenshot({ path: out });
await browser.close();
console.log(`\nwrote ${out}`);
