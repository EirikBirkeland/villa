// Runs a line of JavaScript against the running Villa and takes a picture afterwards.
// For looking at what a change would do before deciding on it.
//
//   node tools/tweak.js "http://localhost:8090/villa/" pictures/tweak.png "window.__villa.mats.water.albedoColor = new Color3(1,0,0)"
//   node tools/tweak.js "http://localhost:8090/villa/" pictures/tweak.png "window.__villa.scene.shadowsEnabled = false"

import { chromium } from "playwright-core";
import fs from "node:fs";
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

const url = process.argv[2] || "http://localhost:8090/villa/";
const out = process.argv[3] || "pictures/tweak.png";
const code = process.argv[4] || "";
const size = (process.argv[5] || "1280x720").split("x").map(Number);
const wait = Number(process.argv[6] || 9000);

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${size[0]},${size[1]}`] });
const page = await browser.newPage();
// No cache: an old build of the Villa in the cache would be measured instead of this one.
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: size[0], height: size[1] });
const logs = [];
page.on("pageerror", (error) => logs.push(`page error: ${error.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, Math.min(wait, 4000)));

if (code) {
	const result = await page.evaluate(async (source) => {
		try {
			const value = await eval(source);
			if (typeof value === "string" && value.startsWith("data:image/png;base64,")) {
				// a painted canvas handed back as a picture, so it can be looked at on its own
				return { __png: value.split(",")[1] };
			}
			if (value && value.asArray) return value.asArray();
			if (value && typeof value === "object") return Object.keys(value).slice(0, 20);
			return value;
		} catch (error) {
			return `error: ${error.message}`;
		}
	}, code);
	if (result && result.__png) {
		fs.mkdirSync(out.replace(/[^/]*$/, ""), { recursive: true });
		fs.writeFileSync(out, Buffer.from(result.__png, "base64"));
		console.log(`wrote the painted canvas to ${out}`);
		await browser.close();
	} else {
		console.log(`expression gave: ${JSON.stringify(result)}`);
	}
}

await new Promise((resolve) => setTimeout(resolve, Math.max(600, wait - 4000)));
if (logs.length) console.log(logs.join("\n"));
await page.screenshot({ path: out });
console.log(`wrote ${out}`);
await browser.close();
