// Compares light settings against each other, in one browser, and prints the numbers.
//
//   node tools/lights.js --plan tools/lighting.json
//   node tools/lights.js --plan tools/lighting.json --save pictures/tmp/lights --size 960x540
//
// The plan is a json file:
//   {
//     "url":   "http://localhost:8090/villa/index.html",
//     "views": [ { "name": "front", "view": "x,y,z,yaw,pitch" } ],
//     "cases": [ { "name": "as it is", "query": "hemi=7", "js": "mats.hedge.emissiveColor = ..." } ]
//   }
// Each case is loaded fresh, so one case cannot leak into the next. "query" goes on the address
// bar (the Villa's own debug switches: sun, hemi, env, sky, sunElevation, exposure ...), "js"
// runs against window.__villa afterwards.
//
// A view may carry "picks": [{ "name": "back wall", "x": 0.5, "y": 0.4 }] — a fraction of the
// picture, reported for every case, so one surface can be followed across them. The tool prints
// which mesh is there and the colour the browser painted it, averaged over a small box because
// the film grain moves every frame. `--pick "name:fx,fy;fx,fy"` adds picks without editing a plan.
// A pick that lands outside the picture says OUT OF FRAME rather than printing nothing at all.
//
// A close-up camera aimed below eye height needs `float=1` in the case's query: the walking code
// runs every frame and eases the visitor onto the ground under them, so a camera put at y 1.05 over
// a terrace whose floor is 0.54 high is lifted to 2.14 within a frame and the thing it was aimed at
// leaves the bottom of the picture.
//
// A pick may instead be given in metres of ground: { "name": "the deck", "place": [x, y, z] }. The
// tool works out which pixel that is with the camera the view just set, so the probe says "the board
// three metres west of the steps" instead of "the pixel at 0.41,0.62", and it still names the same
// board when the camera moves.

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { pictureStats, regionStats, describe } from "./stats.js";
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
const readFlag = (name, fallback) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const planFile = readFlag("plan", "tools/lighting.json");
const size = readFlag("size", "640x360").split("x").map(Number);
// --pick "name:fx,fy;name:fx,fy" — the same picks for every view, for a quick look at one surface.
const cliPicks = (readFlag("pick", "") || "")
	.split(";")
	.filter(Boolean)
	.map((entry) => {
		const at = entry.indexOf(":");
		const name = at >= 0 ? entry.slice(0, at) : "pick";
		const place = at >= 0 ? entry.slice(at + 1) : entry;
		const [x, y] = place.split(",").map(Number);
		return { name, x, y };
	});
const saveTo = readFlag("save", null);
const wait = Number(readFlag("wait", 3500));

const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const url = readFlag("url", null) || plan.url || "http://localhost:8090/villa/index.html";
if (saveTo) fs.mkdirSync(saveTo, { recursive: true });

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${size[0]}x${size[1]}`] });
const page = await browser.newPage();
// No cache: an old build of the Villa in the cache would be measured instead of this one.
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: size[0], height: size[1] });
const problems = [];
page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));

for (const testCase of plan.cases) {
	const link = url + (testCase.query ? `?${testCase.query}` : "");
	await page.goto(link, { waitUntil: "load", timeout: 120000 });
	await new Promise((resolve) => setTimeout(resolve, 3000));
	if (testCase.js) {
		const outcome = await page.evaluate((source) => {
			try {
				const { scene, camera, mats, sun, pipeline, ground, walk } = window.__villa;
				void scene;
				void camera;
				void mats;
				void sun;
				void pipeline;
				void ground;
				void walk;
				// The three lamps, by name, so a case can turn one of them.
				const light = scene.getLightByName("sun");
				const hemi = scene.getLightByName("sky-fill");
				const bounce = scene.getLightByName("bounce");
				void light;
				void hemi;
				void bounce;
				eval(source);
				return "";
			} catch (error) {
				return `case "${source}" failed: ${error.message}`;
			}
		}, testCase.js);
		if (outcome) problems.push(outcome);
	}

	for (const view of plan.views) {
		const [x, y, z, yaw, pitch] = view.view.split(",").map(Number);
		await page.evaluate(([x, y, z, yaw, pitch, fov]) => {
			const { camera } = window.__villa;
			camera.fov = fov && Number(fov) > 0 ? Number(fov) : 0.85;
			camera.position.set(x, y, z);
			camera.rotation.set(pitch || 0, yaw || 0, 0);
		}, [x, y, z, yaw, pitch, view.fov]);
		await new Promise((resolve) => setTimeout(resolve, wait));

		const buffer = await page.screenshot();
		const png = PNG.sync.read(buffer);
		const stats = pictureStats(png.data, png.width, png.height);
		if (saveTo) fs.writeFileSync(path.join(saveTo, `${testCase.name.replace(/\W+/g, "-")}-${view.name}.png`), buffer);
		console.log(`${testCase.name.padEnd(18)} ${view.name.padEnd(7)} ${describe(stats)}`);

		const picks = [...(view.picks || []), ...cliPicks];
		if (picks.length) {
			// A pick given in metres of ground is turned into a pixel here, with the camera this view
			// just set, so a plan can name a place instead of guessing where it lands in the frame.
			const placed = await page.evaluate((list) => {
				const { scene, camera, engine } = window.__villa;
				return list.map((p) => {
					if (!p.place) return p;
					const screen = BABYLON.Vector3.Project(
						new BABYLON.Vector3(p.place[0], p.place[1], p.place[2]),
						BABYLON.Matrix.Identity(),
						scene.getTransformMatrix(),
						camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
					);
					return { ...p, x: screen.x / engine.getRenderWidth(), y: screen.y / engine.getRenderHeight(), px: Math.round(screen.x), py: Math.round(screen.y) };
				});
			}, picks);
			const meshes = await page.evaluate((list) => {
				const { scene, camera, engine } = window.__villa;
				const scale = engine.getHardwareScalingLevel();
				return list.map((p) => {
					const hit = scene.pick(p.x * engine.getRenderWidth() * scale, p.y * engine.getRenderHeight() * scale, (m) => m.isEnabled() && m.isVisible !== false, false, camera);
					if (!hit || !hit.hit || !hit.pickedMesh) return "nothing";
					const where = hit.pickedPoint ? ` @ ${hit.pickedPoint.asArray().map((v) => v.toFixed(1)).join(",")}` : "";
					const face = hit.getNormal ? hit.getNormal(true) : null;
					const normal = face ? ` n ${face.asArray().map((v) => v.toFixed(2)).join(",")}` : "";
					return `${hit.pickedMesh.name}/${hit.pickedMesh.material ? hit.pickedMesh.material.name : "?"} ${hit.distance.toFixed(1)}m${where}${normal}`;
				});
			}, placed);
			placed.forEach((p, i) => {
				const px = Math.round(p.x * png.width);
				const py = Math.round(p.y * png.height);
				if (!(px >= 0 && py >= 0 && px < png.width && py < png.height)) {
					// Reading outside the picture would print NaN and be believed. Say where it went.
					console.log(`${"".padEnd(27)}${i + 1}. ${p.name} OUT OF FRAME at pixel ${px},${py} — ${meshes[i]}`);
					return;
				}
				// The mean of a 9x9 box: the picture has animated film grain in it.
				const box = regionStats(png.data, png.width, px - 4, px + 5, py - 4, py + 5);
				const where = p.place ? `  pixel ${p.px},${p.py}` : "";
				console.log(`${"".padEnd(27)}${i + 1}. ${p.name} ${Math.round(box.r)},${Math.round(box.g)},${Math.round(box.b)} L${Math.round(box.l)}  ${meshes[i]}${where}`);
			});
		}
	}
}

await browser.close();
if (problems.length) console.log("\n" + problems.join("\n"));
