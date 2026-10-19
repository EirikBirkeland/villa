// ask — one question to the Villa standing in a browser, answered as text.
//
//   node tools/ask.js "return scene.meshes.length"
//   node tools/ask.js "return mats.jungle.albedoTexture ? mats.jungle.albedoTexture.name : 'no pattern'"
//   node tools/ask.js --url "index.html?tonemap=lin" "return scene.getMeshByName('lawn1').material.name"
//
// The source is the body of a function that runs in the page, so `scene`, `camera`, `mats`, `sun`,
// `pipeline`, `ground`, `walk` and the three lamps (`light`, `hemi`, `bounce`) are already in scope,
// and BABYLON is the page's own. Whatever the function returns is printed as JSON, so return plain
// values, arrays or small objects — not meshes.
//
// This is how a claim about the Villa gets checked where it is actually true: the drawing and
// feet.js both stand in for parts of the browser, and a material that only exists after the browser
// has compiled its shader is only ever measured here.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"];
const argv = process.argv.slice(2);
const readFlag = (name) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : null;
};
const source = argv[argv.length - 1];
const url = readFlag("url") || "http://localhost:8090/villa/index.html";
const wait = Number(readFlag("wait") || 6000);

if (!source || source.startsWith("--")) {
	console.log('usage: node tools/ask.js "<javascript, with a return>" [--url url] [--wait ms]');
	process.exit(1);
}

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await page.setViewportSize({ width: 640, height: 360 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, wait));

const answer = await page.evaluate(
	(body) => {
		try {
			const { scene, camera, mats, sun, pipeline, ground, walk } = window.__villa;
			const light = scene.getLightByName("sun");
			const hemi = scene.getLightByName("sky-fill");
			const bounce = scene.getLightByName("bounce");
			void camera;
			void sun;
			void pipeline;
			void ground;
			void walk;
			void hemi;
			void bounce;
			// eslint-disable-next-line no-new-func
			const fn = new Function("scene", "mats", "light", "bounce", "BABYLON", body);
			return { ok: JSON.stringify(fn(scene, mats, light, bounce, window.BABYLON) ?? null) };
		} catch (error) {
			return { failed: String(error.message || error) };
		}
	},
	source,
);

console.log(`ask — ${url}`);
if (answer.failed) console.log(`  the question failed: ${answer.failed}`);
else console.log(`  ${answer.ok}`);
if (errors.length) console.log(`  the page said: ${errors.slice(0, 4).join(" | ")}`);
await browser.close();
