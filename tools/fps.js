// How many frames a second the Villa is drawn at, in this browser, right now.
//
// The notes quote a frame rate after most changes, because everything here is drawn in software and a
// change that costs a hundred draws a frame is worth knowing about. Nothing else in this folder measured
// it: the number was taken by eye off a browser window, which is how "the same five frames a second" got
// repeated across releases without anyone re-counting it.
//
//   node tools/fps.js                      -> the Villa as it stands in this folder
//   node tools/fps.js <url> <url> ...      -> two or more, so a release can be weighed against the work
//
// Each url is opened at 1280 x 720, left to draw for nine seconds, and read once. Software WebGL is not
// a steady machine: take the number as a band, not a promise.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"];
const urls = process.argv.slice(2);
if (!urls.length) urls.push("http://localhost:8090/villa/index.html");

for (const url of urls) {
	const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
	const page = await browser.newPage();
	await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
	await page.setViewportSize({ width: 1280, height: 720 });
	const failed = [];
	page.on("pageerror", (e) => failed.push(e.message));
	await page.goto(url, { waitUntil: "load", timeout: 120000 });
	await new Promise((r) => setTimeout(r, 9000));
	const read = await page.evaluate(() => {
		const v = window.__villa;
		if (!v) return null;
		return `${(Math.round(v.engine.getFps() * 10) / 10).toFixed(1)} fps, ${v.scene.meshes.length} meshes, ${v.scene.lights.length} lights, ${v.scene.textures.length} textures`;
	});
	console.log(`${url}\n  ${read || `no Villa standing up here${failed.length ? `: ${failed[0]}` : ""}`}`);
	await browser.close();
}
