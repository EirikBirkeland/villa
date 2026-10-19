// dump — ask the running Villa a question and print the answer.
//
// The Villa is built in a browser; `tools/lights.js` can change a setting and photograph the result,
// but sometimes you just want to know what the scene says. This loads the page, waits for the Villa to
// stand up, runs one expression against `window.__villa` (plus `scene`, `camera`, `mats`, `sun`,
// `ground`, `walk`, `pipeline`, and every light by name as `light`, `hemi`, `bounce`), and prints what
// comes back, as JSON.
//
//   node tools/dump.js 'JSON.stringify(scene.meshes.length)'
//   node tools/dump.js 'JSON.stringify(scene.getLightByName("sky-fill").excludedMeshes.map(m => m.name))'
//   node tools/dump.js --file tools/asks.txt        # one question per line, printed in order
//
// Keep the answer small: it is a string, and a huge one is just noise.

import { chromium } from "playwright-core";
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
const fileIndex = argv.indexOf("--file");
// Which Villa to ask. The default is the Villa at half past five, which is not much use for a question about
// the middle of the night, so the whole address can be given: `--url "...?hour=21.5"`.
const urlIndex = argv.indexOf("--url");
const asked = urlIndex >= 0 ? argv[urlIndex + 1] : "http://localhost:8090/villa/index.html";
const skip = urlIndex >= 0 ? new Set([urlIndex, urlIndex + 1]) : new Set();
const questions =
	fileIndex >= 0
		? fs
				.readFileSync(argv[fileIndex + 1], "utf8")
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line && !line.startsWith("//"))
		: argv.filter((a, i) => !a.startsWith("--") && !skip.has(i));

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto(asked, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 4000));

for (const question of questions) {
	const answer = await page.evaluate((source) => {
		try {
			const { scene, camera, mats, sun, pipeline, ground, walk } = window.__villa;
			const light = scene.getLightByName("sun");
			const hemi = scene.getLightByName("sky-fill");
			const bounce = scene.getLightByName("bounce");
			void scene;
			void camera;
			void mats;
			void sun;
			void pipeline;
			void ground;
			void walk;
			void light;
			void hemi;
			void bounce;
			const out = eval(source);
			return typeof out === "string" ? out : JSON.stringify(out);
		} catch (error) {
			return `failed: ${error.message}`;
		}
	}, question);
	console.log(`${question}\n  -> ${answer}\n`);
}

await browser.close();
