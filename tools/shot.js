// tools/shot.js — take a picture of the Villa from a place you choose.
//
//   node tools/shot.js <out.png> [url] [view=x,y,z,yaw,pitch] [width] [height] [wait-ms]
//
// `screenshot` is the tool for a straight look at the front door. This one is for looking from a point
// the visitor can stand at, or for a view with switches on the address, or for a picture of a copy of
// the Villa (a release) rather than the working one.

import { chromium } from "playwright-core";

const out = process.argv[2];
const base = process.argv[3] || "http://localhost:8090/villa/index.html";
const view = process.argv[4] || "";
const width = Number(process.argv[5] || 1280);
const height = Number(process.argv[6] || 720);
const wait = Number(process.argv[7] || 14000);

const url = view ? `${base}${base.includes("?") ? "&" : "?"}view=${view}` : base;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).split("\n")[0]));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(wait);
await page.screenshot({ path: out });
const state = await page.evaluate(() => (window.__villa ? `${window.__villa.scene.meshes.length} meshes` : "NO SCENE"));
console.log(`${out} <- ${url} [${state}]`);
await browser.close();
