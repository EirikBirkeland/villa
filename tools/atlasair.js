// atlasair — what an atlas paints when a mip level averages it, and what its air is filled with.
//
// A card cut out of an atlas is drawn from a mip chain, and one mip level is a block average of the
// level above. The leaf is averaged with the air round it; if the air is the black a canvas comes out
// of a 2d context with, then the farther off the card stands the darker its leaf goes, and the alpha
// falls with it until the cut-out throws the whole texel away. `padAtlas` in `src/textures.js` exists
// to stop that by painting the leaf's colour into the air, and this is the probe that checks whether
// it did: it prints the mean colour of the leaf pixels, the mean colour of the AIR pixels (which is
// the colour a shrink will pull into the leaf), and what a block average leaves standing once the
// alpha is under the cut-off.
//
//   node tools/atlasair.js bushClusterCanvas
//   node tools/atlasair.js bushEdgeCanvas 256 leafFrom=0.058,sprigs=430
//
// Read the last line: if the block mean is far under the leaf mean, the atlas is being eaten by its own
// air on the way to the screen, and no material knob will buy the colour back.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"];

const argv = process.argv.slice(2);
const rowArg = argv.includes("--row") ? Number(argv[argv.indexOf("--row") + 1]) : -1;
while (argv.includes("--row")) argv.splice(argv.indexOf("--row"), 2);
const name = argv[0];
const size = argv[1] && /^\d+$/.test(argv[1]) ? Number(argv[1]) : 0;
const args = {};
for (const a of argv.slice(name && size ? 2 : name ? 1 : 0)) {
	const [key, value] = a.split("=");
	args[key] = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value;
}
if (!name) {
	console.log("usage: node tools/atlasair.js <canvasName> [size] [key=value ...] [--row N]");
	process.exit(1);
}

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 4000));

const answer = await page.evaluate(
	async ({ name, size, args, row }) => {
		const t = await import("/villa/src/textures.js");
		const fn = t[name];
		if (!fn) return { error: `no ${name} in src/textures.js` };
		const canvas = size ? fn(size, args) : Object.keys(args).length ? fn(undefined, args) : fn();
		const w = canvas.width;
		const h = canvas.height;
		const d = canvas.getContext("2d").getImageData(0, 0, w, h).data;
		const leaf = [0, 0, 0];
		let leafN = 0;
		const air = [0, 0, 0];
		let airN = 0;
		for (let i = 0; i < d.length; i += 4) {
			if (d[i + 3] >= 128) {
				for (let k = 0; k < 3; k++) leaf[k] += d[i + k];
				leafN++;
			} else {
				for (let k = 0; k < 3; k++) air[k] += d[i + k];
				airN++;
			}
		}
		// What a mip level leaves: block-average the colour and the alpha, keep the blocks whose averaged
		// alpha is over the material's cut-off, and average those blocks.
		const mip = (b) => {
			const sum = [0, 0, 0];
			let kept = 0;
			let lost = 0;
			for (let by = 0; by + b <= h; by += b)
				for (let bx = 0; bx + b <= w; bx += b) {
					const s = [0, 0, 0];
					let a = 0;
					for (let y = by; y < by + b; y++)
						for (let x = bx; x < bx + b; x++) {
							const i = (y * w + x) * 4;
							for (let k = 0; k < 3; k++) s[k] += d[i + k];
							a += d[i + 3];
						}
					if (a / (b * b) < 128) {
						lost++;
						continue;
					}
					for (let k = 0; k < 3; k++) sum[k] += s[k] / (b * b);
					kept++;
				}
			return { kept, lost, mean: sum.map((v) => Math.round(v / Math.max(1, kept))) };
		};
		const scan = [];
		if (row >= 0) for (let x = 0; x < w; x += Math.max(1, Math.round(w / 48))) {
			const i = (row * w + x) * 4;
			scan.push(`${x}:${d[i]},${d[i + 1]},${d[i + 2]}/${d[i + 3]}`);
		}
		return {
			scan,
			w,
			h,
			airShare: (100 * airN) / (leafN + airN),
			leaf: leaf.map((v) => Math.round(v / Math.max(1, leafN))),
			air: air.map((v) => Math.round(v / Math.max(1, airN))),
			mip2: mip(2),
			mip4: mip(4),
			mip8: mip(8),
		};
	},
	{ name, size, args, row: rowArg },
);

await browser.close();
if (answer.error) {
	console.log(answer.error);
	process.exit(1);
}
const l = (n, c) => `${n} ${c[0]},${c[1]},${c[2]}`;
const lum = (c) => Math.round(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]);
console.log(`${name} @${answer.w}x${answer.h}  air ${answer.airShare.toFixed(1)}% of the pixels`);
if (answer.scan && answer.scan.length) console.log(`  row ${rowArg}: ${answer.scan.join(" ")}`);
console.log(`  ${l("the leaf pixels average", answer.leaf)}  L${lum(answer.leaf)}`);
console.log(`  ${l("the air pixels average ", answer.air)}  L${lum(answer.air)}  <- a shrink pulls this into the leaf`);
for (const key of ["mip2", "mip4", "mip8"]) {
	const m = answer[key];
	console.log(
		`  ${key}: ${l("blocks still standing", m.mean)} L${lum(m.mean)}  (${m.kept} of ${m.kept + m.lost} blocks; ` +
			`${m.mean[0] <= answer.leaf[0] ? "short of the leaf by " + (answer.leaf[0] - m.mean[0]) + " red" : "over the leaf"})`,
	);
}
