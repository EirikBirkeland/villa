// canvassave — one painted canvas, as a picture, on the ground it will be seen against.
//
// `tools/canvasstats.js` prints the numbers behind a canvas. This one shows it: the canvas is painted in
// the same browser the Villa paints it in, then laid on a dark ground the way an alpha-tested sheet is
// cut — every pixel under the cut-off thrown away, so what is air on the card is air in the picture — and
// tiled, so that a repeat the eye can catch stands out at once. A tile that looks honest once and
// grid-like three times over is a lattice, and this is the fastest way in the folder to find that out
// before a whole Villa is built and photographed.
//
//   node tools/canvassave.js canopyClusterCanvas pictures/clusters.png
//   node tools/canvassave.js canopyClusterCanvas pictures/clusters.png 1024 leaves=120 --tile 1
//   node tools/canvassave.js farCanopyCanvas pictures/far.png --over 60 --cut 0 --tile 2
//
// The names are the exports of `src/textures.js`; the words after the size are arguments passed to the
// function. Air is whatever falls under `--cut` (default 0.42, the cut-off the belt's cards are cut at).
//
// It needs a browser: `node tools/headroom.js` says whether this sandbox has room for one.

import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import { writeFileSync } from "node:fs";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
];

const argv = process.argv.slice(2);
// Read the command line once, keeping every `--flag value` pair together so a flag's value is never
// mistaken for a position.
const switches = {};
const bare = [];
for (let i = 0; i < argv.length; i++) {
	if (argv[i].startsWith("--")) {
		switches[argv[i].slice(2)] = argv[i + 1];
		i++;
		continue;
	}
	if (/^[a-zA-Z]+=[^=]+$/.test(argv[i])) continue;
	bare.push(argv[i]);
}
const name = bare[0];
const out = bare.find((a) => a.endsWith(".png")) || `pictures/tile-${name}.png`;
// The size is whichever of the plain arguments is a number — the out file is one of them too, and
// reading bare[1] for the size found the .png and quietly fell back to the canvas's own default.
const size = Number(bare.slice(1).find((a) => /^\d+$/.test(a)) || 0);
const args = {};
for (const a of argv) {
	const given = /^([a-zA-Z]+)=(.+)$/.exec(a);
	if (given) args[given[1]] = /^\d+(\.\d+)?$/.test(given[2]) ? Number(given[2]) : given[2];
}
const tile = Number(switches.tile || 2);
const over = Number(switches.over || 34).toString(16).padStart(2, "0");
const cutFlag = switches.cut === undefined ? null : switches.cut;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 4000));

const answer = await page.evaluate(
	async ({ name, size, args, tile, over, cutFlag }) => {
		const t = await import("/villa/src/textures.js");
		if (!t[name]) return { error: `src/textures.js has no ${name}` };
		const canvas = size ? t[name](size, args) : t[name](undefined, args);
		const n = canvas.width;
		// The cut-off, if the tool was not told otherwise: the belt's cards are cut at 0.42.
		const cut = cutFlag === null ? 0.42 : Number(cutFlag);
		const src = canvas.getContext("2d").getImageData(0, 0, n, n).data;
		const wide = n * tile;
		const back = document.createElement("canvas");
		back.width = back.height = wide;
		const ctx = back.getContext("2d");
		ctx.fillStyle = `#${over}${over}${over}`;
		ctx.fillRect(0, 0, wide, wide);
		const laid = ctx.getImageData(0, 0, wide, wide);
		const d = laid.data;
		let air = 0;
		for (let y = 0; y < wide; y++) {
			for (let x = 0; x < wide; x++) {
				const s = ((y % n) * n + (x % n)) * 4;
				const a = src[s + 3] / 255;
				if (a < cut) {
					air++;
					continue;
				}
				const o = (y * wide + x) * 4;
				for (let k = 0; k < 3; k++) d[o + k] = src[s + k];
			}
		}
		ctx.putImageData(laid, 0, 0);
		return { n, cut, air: (100 * air) / (wide * wide), wide, data: Array.from(ctx.getImageData(0, 0, wide, wide).data) };
	},
	{ name, size, args, tile, over, cutFlag }
);

await browser.close();

if (answer.error) {
	console.log(answer.error);
	process.exit(1);
}

const png = new PNG({ width: answer.wide, height: answer.wide });
png.data = Buffer.from(answer.data);
writeFileSync(out, PNG.sync.write(png));
console.log(
	`wrote ${out} (${answer.wide}x${answer.wide}: ${name} at ${answer.n}, ${tile}x${tile} tiles, cut ${answer.cut}, ` +
		`${answer.air.toFixed(1)}% of the tile is air over a ground of #${over}${over}${over})`
);
