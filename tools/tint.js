// tint — what a knob is worth, measured in a browser, before it is written into the Villa.
//
// `tools/cover.js` measures one camera as built. This measures the same camera several times over,
// each time with one line of JavaScript put on the running page, and prints what each of named
// materials came out as. It exists so a colour can be weighed before it is painted into a canvas:
// the Villa's surfaces are lit, tone-mapped and sRGB-encoded on the way to the screen, so a number
// written in `src/textures.js` cannot be reasoned about from the desk — only measured.
//
// The usual knob is a material's own colour multiplied down, which is what a darker canvas does to
// the light the engine sees: `mats.lawn.albedoColor = mats.lawn.albedoColor.scale(0.7)`.
//
//   node tools/tint.js --view "6,1.6,13,0.27,0" --ladder "as built" \
//       "mats.lawn.albedoColor.scaleToRef(0.8,mats.lawn.albedoColor)" \
//       "mats.lawn.albedoColor.scaleToRef(0.6,mats.lawn.albedoColor);mats.tuft.albedoColor.scaleToRef(0.7,mats.tuft.albedoColor)"
//
// Each line is run in order on the same page, so a ladder accumulates: write each line as the extra
// step on top of the one before it, or reset what you change. `--fresh` reloads the page between
// steps instead, so every line starts from the Villa as built.
//
//   --view x,y,z,yaw,pitch   where to stand (default: where a visitor arrives)
//   --url url                which Villa to measure: a released copy, say, to weigh a change against
//                            what is published (default: this folder's own index.html)
//   --step N                 grid spacing in pixels (default 32)
//   --size 1280x720          the picture
//   --out PREFIX             writes PREFIX-01.png, -02.png ... one per step
//   --show lawn,tuft         which materials to print (default: everything over 1% of the frame)

import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "node:fs";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
];

function readFlag(name) {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : null;
}

// The ladder is every argument that is not a switch and not the value of one.
const FLAG_ARGS = new Set(["view", "size", "step", "out", "show", "url"]);
const args = [];
for (let i = 2; i < process.argv.length; i++) {
	const a = process.argv[i];
	if (a.startsWith("--")) {
		if (FLAG_ARGS.has(a.slice(2))) i++;
		continue;
	}
	args.push(a);
}

const size = (readFlag("size") || "1280x720").split("x").map(Number);
const width = size[0];
const height = size[1];
const view = readFlag("view");
// Which Villa to stand in. The same ladder run against `releases/v<something>/index.html` and against
// the working tree is how a change is measured against the version that is actually published, instead
// of against what the desk believes it was.
const villaUrl = readFlag("url") || "http://localhost:8090/villa/index.html";
const step = Number(readFlag("step") || 32);
const out = readFlag("out");
const show = (readFlag("show") || "").split(",").filter(Boolean);
const fresh = process.argv.includes("--fresh");
const ladder = args;
if (!ladder.length) ladder.push("");

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${height}`] });

async function openPage() {
	const page = await browser.newPage();
	await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
	await page.setViewportSize({ width, height });
	page.on("pageerror", () => {});
	await page.goto(villaUrl, { waitUntil: "load", timeout: 120000 });
	await new Promise((resolve) => setTimeout(resolve, 5000));
	if (view) {
		const [x, y, z, yaw, pitch] = view.split(",").map(Number);
		await page.evaluate(([x, y, z, yaw, pitch]) => {
			const { camera, walk } = window.__villa;
			camera.position.set(x, y, z);
			camera.rotation.set(pitch || 0, yaw || 0, 0);
			walk.settle();
		}, [x, y, z, yaw, pitch]);
		await new Promise((resolve) => setTimeout(resolve, 1500));
	}
	return page;
}

let page = await openPage();
const rows = [];

for (let i = 0; i < ladder.length; i++) {
	const source = ladder[i];
	if (source) {
		const failed = await page.evaluate(([src, n]) => {
			try {
				const { scene, camera, mats, sun, pipeline, ground, walk } = window.__villa;
				void scene; void camera; void sun; void pipeline; void ground; void walk;
				eval(src);
				return "";
			} catch (error) {
				return `step ${n} failed: ${error.message}`;
			}
		}, [source, i + 1]);
		// A step that throws must not be printed as if it were a knob that did nothing. It used to print its
		// error and then measure the Villa anyway, which gave the same numbers as the step before it — and one
		// wrong blame for the sky fill's blue came within one table of being written down twice because of it.
		if (failed) {
			console.log(`step ${i + 1} FAILED — this step was not measured (a later step still runs on top of what did run): ${failed}`);
			continue;
		}
		await new Promise((resolve) => setTimeout(resolve, 1400));
	}

	const sweep = await page.evaluate(([stepArg]) => {
		const { scene, engine } = window.__villa;
		const w = engine.getRenderWidth();
		const h = engine.getRenderHeight();
		const sx = w / window.innerWidth;
		const sy = h / window.innerHeight;
		const count = new Map();
		const sample = new Map();
		for (let y = stepArg / 2; y < window.innerHeight; y += stepArg) {
			for (let x = stepArg / 2; x < window.innerWidth; x += stepArg) {
				const hit = scene.pick(x * sx, y * sy, (mesh) => mesh.isEnabled() && mesh.isVisible);
				if (!hit || !hit.hit || !hit.pickedMesh) continue;
				const mesh = hit.pickedMesh;
				const mat = mesh.material ? mesh.material.name : "no material";
				count.set(mat, (count.get(mat) || 0) + 1);
				if (!sample.has(mat)) sample.set(mat, []);
				sample.get(mat).push([Math.round(x * sx), Math.round(y * sy)]);
			}
		}
		return {
			render: [w, h],
			share: [...count.entries()]
				.map(([name, n]) => ({ name, samples: sample.get(name) }))
				.sort((a, b) => b.samples.length - a.samples.length),
			total: Math.ceil(window.innerWidth / stepArg) * Math.ceil(window.innerHeight / stepArg),
		};
	}, [step]);

	const shot = out ? `${out}-${String(i + 1).padStart(2, "0")}.png` : "pictures/tmp-tint.png";
	await page.screenshot({ path: shot });
	const png = PNG.sync.read(fs.readFileSync(shot));
	// Grid points were taken in the page's own pixels and in the engine's render pixels; the picture
	// is the page's size, so scale the render-space point back.
	const at = ([x, y]) => {
		const px = Math.min(png.width - 1, Math.round((x * png.width) / sweep.render[0]));
		const py = Math.min(png.height - 1, Math.round((y * png.height) / sweep.render[1]));
		return (png.width * py + px) << 2;
	};

	const list = show.length ? sweep.share.filter((s) => show.includes(s.name)) : sweep.share.filter((s) => s.samples.length / sweep.total > 0.01);
	const cells = [];
	for (const s of list) {
		let r = 0, g = 0, b = 0, n = 0, hi = 0, hiRGB = null;
		for (const p of s.samples) {
			const o = at(p);
			r += png.data[o];
			g += png.data[o + 1];
			b += png.data[o + 2];
			const l = 0.2126 * png.data[o] + 0.7152 * png.data[o + 1] + 0.0722 * png.data[o + 2];
			if (l > hi) {
				hi = l;
				hiRGB = [png.data[o], png.data[o + 1], png.data[o + 2]];
			}
			n++;
		}
		if (!n) continue;
		const mean = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
		cells.push({
			name: s.name,
			share: Math.round(((s.samples.length / sweep.total) * 1000) / 10),
			mean,
			l: Math.round(0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]),
			max: hiRGB,
		});
	}
	rows.push({ step: i + 1, source: source || "as built", cells });
	if (fresh) {
		await page.close();
		page = await openPage();
	}
}

await browser.close();

for (const row of rows) {
	console.log(`\nstep ${row.step}: ${row.source || "(as built)"}`);
	for (const c of row.cells) {
		console.log(
			`  ${c.name.padEnd(12)} ${String(c.share).padStart(5)}%  mean ${String(c.mean[0]).padStart(3)},${String(c.mean[1]).padStart(3)},${String(c.mean[2]).padStart(3)}  L${String(c.l).padStart(3)}  brightest ${c.max.join(",")}`
		);
	}
}
