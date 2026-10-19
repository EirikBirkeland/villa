// bootcost — how long the visitor waits before the Villa is drawn, in a real browser.
//
// The Villa has to be there the moment the page opens: no entry card, no click first (AGENTS.md). Most
// of what happens before the first frame is painting canvases in `src/textures.js`, so a canvas that
// grows — the lawn going from 512 to 1024, say — is paid for at every visit and nothing else in this
// folder counts it. `tools/fps.js` measures the frames after that; this measures the wait before them.
//
//   node tools/bootcost.js                                        -> the Villa in this folder
//   node tools/bootcost.js <url> <url> ...                        -> two or more, so a release can be
//                                                                   weighed against the work
//
// Three numbers per address: `scripts` is when the page's own module ran, `standing` is when the Villa
// answers on `window.__villa` — scene built, materials painted, camera set down — and `first frame` is
// when it has actually drawn one. All three are milliseconds from the navigation starting.
//
// Needs a browser: `node tools/headroom.js` says whether this sandbox has room for one.

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

const urls = process.argv.length > 2 ? process.argv.slice(2) : ["http://localhost:8090/villa/index.html"];

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });

for (const url of urls) {
	const page = await browser.newPage();
	await page.setViewportSize({ width: 1280, height: 720 });
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	const started = Date.now();
	await page.goto(url, { waitUntil: "load", timeout: 120000 });
	const loaded = Date.now() - started;
	// Watch for the Villa answering, one tenth of a second at a time, so the wait is measured and not
	// guessed at from a fixed sleep.
	let standing = null;
	let framed = null;
	while (Date.now() - started < 120000) {
		const state = await page.evaluate(() => {
			const v = window.__villa;
			if (!v) return { standing: false, framed: false };
			// `frameId` counts the draws the engine has finished, so three of them means the Villa has
			// really put pixels on the screen and not merely built itself.
			return { standing: true, framed: (v.engine.frameId || 0) >= 3 };
		});
		if (state.standing && standing === null) standing = Date.now() - started;
		if (state.framed && framed === null) framed = Date.now() - started;
		if (framed !== null) break;
		await new Promise((r) => setTimeout(r, 100));
	}
	await page.close();
	console.log(
		`${url}\n  page loaded ${loaded} ms · villa standing ${standing ?? "never"} ms · first frame drawn ${framed ?? "never"} ms` +
			(errors.length ? `\n  page errors: ${errors.join("; ")}` : "")
	);
}

await browser.close();
