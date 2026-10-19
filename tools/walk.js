// Puts the Villa to the walking test: stands the visitor somewhere, holds a key, and reports
// where they ended up. The ground either holds a person or it does not, and this is how to tell.
//
//   node tools/walk.js                       -> the built-in set of places to try
//   node tools/walk.js "name:x,y,z,yaw,pitch;name:..."
//
// Each place walks north (W) for two seconds. A visitor who ends up below their own eye height,
// or below the floor they were aiming for, has fallen through the world.

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

const places = process.argv[2]
	? process.argv[2].split(";").map((part) => {
			const [name, view] = part.split(":");
			return { name, view };
		})
	: [
			{ name: "start on the paving", view: "2.4,1.74,10.5,3.2,0" },
			{ name: "lawn up to the paving", view: "0,1.74,17.5,3.14,0" },
			{ name: "paving up to the pool", view: "0,1.74,10,3.14,0" },
			{ name: "west paving onto terrace", view: "-11,1.74,3.7,1.57,0" },
			// The sala stands at 10.6, 5.4 with its steps on the west at x 7.98, so the walk has to start in
			// front of the steps and face them. The old start, 6.5, 9, was a lawn square an arm's width inside
			// the sala's side table, and the test reported 0.0 m walked, which was a story about the test and
			// not about the Villa.
			{ name: "onto the sala", view: "7,1.74,5.4,1.57,0" },
			{ name: "through the string lights", view: "-4,1.74,11,3.14,0" },
			{ name: "into the south hedge", view: "0,1.74,16,0.4,0" },
			// The west strip is the watercourse now, and a visitor is not allowed in the stream, so the walk
			// goes along the lawn east of it instead: same test of a long north-south walk, on the side a
			// visitor actually has.
			{ name: "west lawn toward the pool", view: "-15,1.74,10,1.57,0" },
		];

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, "--window-size=640x360"] });
const page = await browser.newPage();
// No cache: an old build of the Villa in the cache would be measured instead of this one.
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: 640, height: 360 });
const problems = [];
page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));

for (const place of places) {
	await page.goto(`http://localhost:8090/villa/index.html?view=${place.view}`, { waitUntil: "load", timeout: 120000 });
	await new Promise((resolve) => setTimeout(resolve, 2500));
	const before = await page.evaluate(() => window.__villa.camera.position.asArray().map((v) => Number(v.toFixed(2))));
	await page.keyboard.down("KeyW");
	await new Promise((resolve) => setTimeout(resolve, 2000));
	await page.keyboard.up("KeyW");
	const after = await page.evaluate(() => window.__villa.camera.position.asArray().map((v) => Number(v.toFixed(2))));
	const travelled = Math.hypot(after[0] - before[0], after[2] - before[2]);
	console.log(
		`${place.name.padEnd(24)} from ${JSON.stringify(before)} -> ${JSON.stringify(after)}  walked ${travelled.toFixed(1)} m`,
	);
}

await browser.close();
if (problems.length) console.log("\n" + problems.join("\n"));
