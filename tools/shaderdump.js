// Dump the library's pbr pixel shader to a file so its own words can be read. Session tool.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { requireHeadroom } from "./headroom.js";
requireHeadroom();
const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan"];
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, "--window-size=800,600"] });
const page = await browser.newPage();
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((r) => setTimeout(r, 4000));
const out = await page.evaluate(() => ({
	pixel: BABYLON.Effect.ShadersStore["pbrPixelShader"],
	vertex: BABYLON.Effect.ShadersStore["pbrVertexShader"],
	includes: BABYLON.Effect.IncludesShadersStore,
}));
const split = (text) => text.replace(/(#include|vec3 |float |uniform |varying |#define)/g, "\n$1");
fs.writeFileSync(
	"/tmp/pbrIncludes.txt",
	Object.entries(out.includes)
		.map(([k, v]) => `\n=== ${k} ===\n` + split(v))
		.join("\n"),
);
fs.writeFileSync("/tmp/pbrPixel.txt", out.pixel.replace(/(#include|vec3 |float |uniform |varying |#define)/g, "\n$1"));
fs.writeFileSync("/tmp/pbrVertex.txt", out.vertex.replace(/(#include|vec3 |float |uniform |varying |#define)/g, "\n$1"));
console.log("wrote /tmp/pbrPixel.txt", out.pixel.length, "and /tmp/pbrVertex.txt", out.vertex.length);
await browser.close();
