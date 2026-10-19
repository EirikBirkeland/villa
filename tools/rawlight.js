// rawlight — what light is actually falling on the tone curve, read off a real browser.
//
// The tone curve is the last thing between the Villa's light and the picture, so every complaint
// about a surface being chalk or soot is a complaint about where that surface sits on the curve. This
// says where it sits in the units the curve works in: it loads the Villa with no curve at all
// (`?tonemap=lin`), no contrast, no vignette and no bloom spill, and with the exposure turned down, so
// the byte the browser paints is the light divided by a known number and put through sRGB. Turn that
// back round and you have the raw light.
//
// Then it prints, for each place asked, what the library's curve and the Villa's own curve would each
// make of that light — which is how a curve is chosen against surfaces that exist rather than against
// a drawing of a curve.
//
//   node tools/rawlight.js                                   -> the start view, the Villa's own picks
//   node tools/rawlight.js --view "0,2.1,-1.5,0,0.1"          -> another place to stand
//   node tools/rawlight.js --pick "the coping:0.55,0.6"       -> add a place of your own
//   node tools/rawlight.js --exposure 0.1                     -> for very bright things (see below)
//
// A pick is a fraction of the picture, like tools/lights.js takes them.
//
// What it prints is the light and the curves alone: no bloom, no vignette and no film grain, so the
// two "makes" columns will not match a real picture of the Villa byte for byte — they say what the
// curve does to that light, which is the thing being asked. tools/lights.js with tools/toneprobe.json
// is the tool that measures the whole picture.
//
// One exposure cannot read the whole Villa: at 0.25 a surface of raw light 4 is already at the top of
// the picture. Ask for a lower exposure and the dim places go noisy but the bright ones come back
// under the ceiling, where they can be read. The tool says which picks are at the ceiling and should be
// read again lower down.

import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "node:fs";
import { requireHeadroom } from "./headroom.js";
import { KHRONOS_TONE, VILLA_TONE, applyTone } from "../src/tone.js";

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
const size = readFlag("size", "1280x720").split("x").map(Number);
const url0 = argv[0] && !argv[0].startsWith("--") ? argv[0] : "http://localhost:8090/villa/index.html";
const exposure = Number(readFlag("exposure", 0.25));
// The exposure the Villa ships, which is what the curve actually works on: the tool reads the light
// with the exposure turned down so the bright places stay under the ceiling, then asks the curves what
// they make of that light at the exposure the Villa really runs.
const shipped = Number(readFlag("ship", 0.76));
const out = readFlag("out", "pictures/tmp-rawlight.png");
const wait = Number(readFlag("wait", 9000));

// The Villa's own places: everything the standing list says is pressed against the ceiling, plus a
// few that are comfortably in the middle and should stay there.
const PICKS = [
	["lit plaster", 0.266, 0.306],
	["lit fascia", 0.33, 0.24],
	["cement under deck", 0.484, 0.583],
	["sunlit pot", 0.109, 0.583],
	["teak post", 0.36, 0.53],
	["sunlit deck", 0.62, 0.62],
	["pool coping", 0.55, 0.6],
	["lit paving", 0.2, 0.64],
	["roof tile", 0.2, 0.19],
	["lit stone", 0.484, 0.528],
	["hedge in sun", 0.2, 0.47],
	["lawn in sun", 0.05, 0.53],
	["water", 0.5, 0.75],
	["sky high", 0.5, 0.06],
	["sky near sun", 0.8, 0.3],
];
for (const entry of (readFlag("pick", "") || "").split(";").filter(Boolean)) {
	const at = entry.indexOf(":");
	if (at < 0) continue;
	const [x, y] = entry.slice(at + 1).split(",").map(Number);
	PICKS.push([entry.slice(0, at), x, y]);
}

const view = readFlag("view", null);
const fov = readFlag("fov", null);
const query = new URLSearchParams({ tonemap: "lin", contrast: "1", vignette: "0", bloomThreshold: "99", exposure: String(exposure) });
if (view) query.set("view", view);
if (fov) query.set("fov", fov);
const url = `${url0}${url0.includes("?") ? "&" : "?"}${query}`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${size[0]},${size[1]}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: size[0], height: size[1] });
const logs = [];
page.on("pageerror", (error) => logs.push(`page error: ${error.message}`));
page.on("console", (message) => {
	if (message.type() === "error") logs.push(`console error: ${message.text()}`);
});

await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, wait));

const tone = await page.evaluate(() => (window.__villa && window.__villa.tone) || null);
const names = await page.evaluate(
	([picks]) => {
		const { scene, engine } = window.__villa;
		const sx = engine.getRenderWidth() / window.innerWidth;
		const sy = engine.getRenderHeight() / window.innerHeight;
		return picks.map(([name, fx, fy]) => {
			const hit = scene.pick(fx * window.innerWidth * sx, fy * window.innerHeight * sy, (mesh) => mesh.isEnabled() && mesh.isVisible);
			if (!hit || !hit.hit || !hit.pickedMesh) return { name, mesh: "open sky", material: "-", distance: null };
			return {
				name,
				mesh: hit.pickedMesh.name,
				material: hit.pickedMesh.material ? hit.pickedMesh.material.name : "none",
				distance: Number(hit.distance.toFixed(1)),
			};
		});
	},
	[PICKS],
);

await page.screenshot({ path: out });
const png = PNG.sync.read(fs.readFileSync(out));
const byteAt = (fx, fy) => {
	const px = Math.min(png.width - 1, Math.round(fx * (png.width - 1)));
	const py = Math.min(png.height - 1, Math.round(fy * (png.height - 1)));
	const o = (png.width * py + px) << 2;
	return [png.data[o], png.data[o + 1], png.data[o + 2]];
};
// Averaged over a small box: the film grain moves every pixel by a byte or so, frame to frame.
const bytesAround = (fx, fy) => {
	const w = 6;
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;
	for (let dy = -w; dy <= w; dy += 2) {
		for (let dx = -w; dx <= w; dx += 2) {
			const px = Math.min(png.width - 1, Math.max(0, Math.round(fx * (png.width - 1)) + dx));
			const py = Math.min(png.height - 1, Math.max(0, Math.round(fy * (png.height - 1)) + dy));
			const o = (png.width * py + px) << 2;
			r += png.data[o];
			g += png.data[o + 1];
			b += png.data[o + 2];
			n++;
		}
	}
	return [r / n, g / n, b / n];
};

const toLinear = (byte) => {
	const s = byte / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const encode = (x) => {
	const v = Math.max(0, Math.min(1, x));
	return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
};
const shown = (linearColour) => linearColour.map(encode).join(",");
const peak = (c) => Math.max(c[0], Math.max(c[1], c[2]));

if (!tone || !tone.ok) console.log(`NOTE: the page did not report a patched curve (${tone ? tone.why || tone.curve : "no __villa.tone"}) — these readings are of whatever curve is really in the shader.`);
console.log(`raw light at ${size[0]}x${size[1]}, exposure ${exposure}, no curve, no contrast, no vignette, no spill; the curves are then asked what they make of that light at the Villa's own exposure ${shipped}`);
console.log(`the Villa's curve: ${JSON.stringify(VILLA_TONE)}   the library's: ${JSON.stringify(KHRONOS_TONE)}\n`);
console.log("place               mesh                    material      shown          light   library makes    Villa makes");
let blown = 0;
PICKS.forEach(([name], i) => {
	const bytes = bytesAround(PICKS[i][1], PICKS[i][2]);
	const at = names[i];
	const raw = [toLinear(bytes[0]), toLinear(bytes[1]), toLinear(bytes[2])].map((v) => v / exposure);
	const atCurve = raw.map((v) => v * shipped);
	const r = peak(raw);
	const ceiling = Math.max(...bytes) >= 253.5;
	if (ceiling) blown++;
	const lib = shown(applyTone(atCurve, KHRONOS_TONE));
	const villa = shown(applyTone(atCurve, VILLA_TONE));
	const row = [
		name.padEnd(19),
		String(at.mesh).slice(0, 22).padEnd(23),
		String(at.material).slice(0, 12).padEnd(13),
		`(${bytes.map((b) => b.toFixed(0)).join(",")})`.padEnd(15),
		`${r.toFixed(2)}${ceiling ? "^" : " "}`.padEnd(7),
		`(${lib})`.padEnd(17),
		`(${villa})`.padEnd(17),
		at.distance !== null ? `${at.distance} m` : "",
	];
	console.log(row.join(" "));
});
if (blown) console.log(`\n${blown} of them are at the ceiling even at this exposure: read them again with --exposure ${exposure / 4} .`);
console.log(`\npicture: ${out}`);
if (logs.length) console.log(logs.join("\n"));
await browser.close();
