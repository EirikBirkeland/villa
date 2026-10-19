// Stands at the water's edge and waits to be bitten, saying what the animal is doing as it does it.
//
// The shark's whole point is a sequence of about three seconds that a picture cannot be aimed at: it
// notices you, it goes down out of sight, it comes. So this tool puts the sight where a person stands with
// their toes over the water, then watches the state machine until the jaws shut — printing each change of
// state as it happens, and taking the picture on the frame the bite lands.
//
//   node tools/bite.js pictures/bite.png
//   node tools/bite.js pictures/bite.png --at -3,2.4 --for 60
//   node tools/bite.js pictures/bite.png --pitch 0.6
//
// `--at x,z` is where the sight stands, in metres of the garden (the pool runs x -5..5, z 2.1..7.1). `--for`
// is how many seconds to stand there before giving up.

import { chromium } from "playwright-core";
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
const out = argv.find((a) => !a.startsWith("--")) || "pictures/bite.png";
const at = (readFlag("at", argv) || "0,1.5").split(",").map(Number);
const forSeconds = Number(readFlag("for", argv) || 45);
const height = Number(readFlag("eye", argv) || 1.6);
const pitch = Number(readFlag("pitch", argv) || 0.5);
const size = readFlag("size", argv) || "900x600";
const width = Number(size.split("x")[0]);
const tall = Number(size.split("x")[1]);
// Looking at the water at its feet: the animal comes to the edge where the boots are, so this is where the
// bite has to happen and where the picture has to be taken from.
const view = `${at[0]},${height},${at[1]},0,${pitch}`;
const url = `http://localhost:8090/villa/index.html?float=1&view=${view}`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${tall}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height: tall });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));

await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 5000));

const started = await page.evaluate(() => ({
	bites: window.__villa.shark.shark.bites,
	state: window.__villa.shark.shark.state,
}));
console.log(`standing at ${at.join(",")}; the animal is ${started.state}`);

let last = started.state;
let bitten = started.bites;
let caught = false;
const deadline = Date.now() + forSeconds * 1000;
while (Date.now() < deadline && !caught) {
	await new Promise((resolve) => setTimeout(resolve, 90));
	const now = await page.evaluate(() => {
		const holder = window.__villa.shark;
		const s = holder.shark;
		const cam = window.__villa.camera.position;
		const tip = s.snout.getAbsolutePosition();
		return {
			state: s.state,
			bites: s.bites,
			open: Number(s.open.toFixed(2)),
			gap: Number(Math.hypot(s.x - cam.x, s.z - cam.z).toFixed(2)),
			depth: Number(s.depth.toFixed(2)),
			spills: holder.blood.spills,
			snout: [tip.x, tip.y, tip.z].map((v) => Number(v.toFixed(2))),
		};
	});
	if (now.state !== last) {
		console.log(`${now.state} at ${now.gap} m, mouth ${now.open}, back ${now.depth} m down`);
		last = now.state;
	}
	if (now.bites > bitten) {
		bitten = now.bites;
		caught = true;
		console.log(`BITTEN — the ${bitten}${ordinal(bitten)} bite: mouth ${now.open}, snout at ${now.snout.join(", ")}, ${now.spills} lumps of blood out`);
	}
}

await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}${caught ? "" : " (no bite in the time — the animal did not come)"}`);

function ordinal(n) {
	return n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
}
