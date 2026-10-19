// canvasstats — the numbers behind one painted canvas, measured in the browser that paints it.
//
// Every surface in this Villa gets its pattern from a canvas painted in `src/textures.js`, and the usual
// question about one is not "is it painted" but "how much of what it carries reaches the screen". A canvas
// of wildly different bytes that a mipmap averages back to one tone is a flat surface wearing a costume —
// which is exactly how the far rank of the belt came to be a smooth green blur (`pictures/47-crop-hill-tile12.png`).
// This paints a canvas and prints, besides its mean colour, how far its bytes run and how much of that
// spread survives block-averaging by 8, 16 and 32 pixels, which is what a minifying mipmap does on the way
// to the screen. Read the block columns: a spread that is there in `std` and gone by `block16` is a pattern
// at the wrong size, not a pattern.
//
//   node tools/canvasstats.js                       -> every canvas this Villa paints, at its own size
//   node tools/canvasstats.js farCanopyCanvas       -> that one, with its own arguments
//   node tools/canvasstats.js farCanopyCanvas 384 clusters=900 spread=0.05
//
// One browser run paints the whole list, so a ladder of arguments is one wait and not ten. The names are the
// exports of `src/textures.js`; a size of 0 leaves the function's own default alone.
//
// It needs a browser: `node tools/headroom.js` says whether this sandbox has room for one.

import { chromium } from "playwright-core";
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
const asks = [];
if (argv.length === 0) {
	asks.push({});
} else {
	const name = argv[0];
	const size = argv[1] && /^\d+$/.test(argv[1]) ? Number(argv[1]) : 0;
	const args = {};
	for (const a of argv.slice(size ? 2 : 1)) {
		const [key, value] = a.split("=");
		args[key] = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value;
	}
	asks.push({ name, size, args });
}

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 4000));

const answer = await page.evaluate(
	async (wanted) => {
		const t = await import("/villa/src/textures.js");
		const names = wanted[0].name ? [wanted[0].name] : Object.keys(t).filter((k) => k.endsWith("Canvas"));
		const stats = (canvas) => {
			const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
			const n = canvas.width;
			const mean = [0, 0, 0];
			const sq = [0, 0, 0];
			for (let i = 0; i < d.length; i += 4)
				for (let k = 0; k < 3; k++) {
					mean[k] += d[i + k];
					sq[k] += d[i + k] * d[i + k];
				}
			const px = d.length / 4;
			const m = mean.map((v) => v / px);
			const block = (b) => {
				const one = [0, 0, 0];
				const two = [0, 0, 0];
				let count = 0;
				for (let by = 0; by < n; by += b)
					for (let bx = 0; bx < n; bx += b) {
						const s = [0, 0, 0];
						for (let y = by; y < by + b; y++)
							for (let x = bx; x < bx + b; x++) {
								const i = (y * n + x) * 4;
								for (let k = 0; k < 3; k++) s[k] += d[i + k];
							}
						for (let k = 0; k < 3; k++) {
							one[k] += s[k] / (b * b);
							two[k] += (s[k] / (b * b)) ** 2;
						}
						count++;
					}
				return one.map((v, k) => Math.round(Math.sqrt(two[k] / count - (v / count) ** 2)));
			};
			return {
				size: canvas.width,
				mean: m.map((v) => Math.round(v)),
				std: m.map((v, k) => Math.round(Math.sqrt(sq[k] / px - v * v))),
				b8: block(8),
				b16: block(16),
				b32: block(32),
			};
		};
		const out = [];
		for (const ask of wanted) {
			for (const name of names) {
				try {
					const args = ask.args || {};
					const canvas = ask.size ? t[name](ask.size, args) : t[name](undefined, args);
					out.push({ name, args: ask.args || {}, ...stats(canvas) });
				} catch (error) {
					out.push({ name, error: error.message });
				}
			}
		}
		return out;
	},
	asks
);

for (const row of answer) {
	if (row.error) {
		console.log(`${row.name}: ${row.error}`);
		continue;
	}
	const extra = Object.keys(row.args).length ? " " + JSON.stringify(row.args) : "";
	console.log(
		`${row.name} @${row.size}${extra}  mean ${row.mean.join(",")}  std ${row.std.join(",")}  b8 ${row.b8.join(",")}  b16 ${row.b16.join(",")}  b32 ${row.b32.join(",")}`
	);
}

await browser.close();
