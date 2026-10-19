// where — where the small living things actually land in a picture, and whether they survive being drawn.
//
// A butterfly in the code is not a butterfly on the screen. This stands a camera where a visitor would
// stand, finds every creature in the scene, and answers five plain questions about each one:
//
//   WHERE     the pixel it projects to, how far off it is, and whether it is behind you at all
//   HOW BIG   how many pixels of the picture it really covers, at four moments spread over its own
//             loop. Counted honestly: the same moment is drawn twice, once as built and once with the
//             creature's meshes taken out, and every pixel that moved IS the animal. Nothing can fake that
//             number — a creature that is culled, or wound the wrong way, or behind a pot, moves no pixel
//             and is reported as zero, which is the whole reason this tool exists. It is also painted a
//             flat emissive magenta and counted that way as a second opinion and to find it in the frame.
//             The smallest of the four moments is the number that matters: that is the moment the
//             butterfly is crossing edge-on, and it is the one a visitor is entitled to complain about.
//   IN FRONT  whether a pick at its own pixel names the creature or names something in front of it
//   AGAINST WHAT the colour the creature is drawn, against the colour of the very same pixels with the
//             creature taken out. A creature the colour of its own background is not a creature.
//   WHERE IT LIVES the world place it was standing at its best moment, which is where a camera has to
//             go to photograph it.
//
// Frogs are included with the butterflies and the cockroaches: a frog on a stone is a small thing in the
// same way a butterfly is, and the frog's stone is where a visitor standing at the bank is looking. So are
// the koi (src/koi.js), which is the harder question of the two: a fish is seen THROUGH a sheet of water
// that mirrors the sky where it grazes, and a fish the surface is hiding moves no pixel either.
//
//   node tools/where.js                                   -> the standing start view
//   node tools/where.js --view 2.4,1.74,10.5,3.2,0.06     -> any camera, same five answers
//   node tools/where.js --url http://localhost:8090/villa/releases/v0.74.0/index.html
//   node tools/where.js --times 2.5,7,13 --out pictures/s79-home.png --box pictures/s79 --scale 8
//
// The Villa's own clock is stopped as soon as the page has drawn, and this tool then turns the
// creatures' clock itself, one sixtieth of a second at a time, so the four moments are the same four
// every run. The water and the leaves stay frozen where they were: a whole-frame difference between two
// hand-turned frames is the garden, not the insect.

import { chromium } from "playwright-core";
import fs from "fs";
import { PNG } from "pngjs";
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

const argv = process.argv.slice(2);
const readFlag = (name, fallback) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : fallback;
};

const pageUrl = readFlag("url", "http://localhost:8090/villa/index.html");
const view = readFlag("view", "2.4,1.74,10.5,3.2,0.06"); // `home`: where a visitor arrives
const size = readFlag("size", "1280x720");
const width = Number(size.split("x")[0]);
const height = Number(size.split("x")[1]);
const out = readFlag("out", "pictures/where.png");
const boxBase = readFlag("box", null);
const scale = Math.max(1, Number(readFlag("scale", 8)));
const runFor = Number(readFlag("wait", 12000));
const times = (readFlag("times", "1.6,5.2,9.4,14.8") || "")
	.split(",")
	.map(Number)
	.filter((n) => isFinite(n));

const join = pageUrl.includes("?") ? "&" : "?";
const url = `${pageUrl}${join}view=${view}&still=1&float=1`;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: [...flags, `--window-size=${width},${height}`],
});
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));

/** Mean colour of a list of pixel indices out of one picture. */
function mean(png, pixels) {
	if (!pixels.length) return [0, 0, 0];
	let r = 0;
	let g = 0;
	let b = 0;
	for (const i of pixels) {
		r += png.data[i * 4];
		g += png.data[i * 4 + 1];
		b += png.data[i * 4 + 2];
	}
	return [r, g, b].map((v) => Math.round(v / pixels.length));
}

/** Paste a rectangle of `png` into a new picture `s` times bigger than life. */
function enlarge(png, x, y, w, h, s) {
	const dst = new PNG({ width: w * s, height: h * s });
	for (let row = 0; row < h * s; row++) {
		for (let col = 0; col < w * s; col++) {
			const from = ((y + Math.floor(row / s)) * png.width + (x + Math.floor(col / s))) * 4;
			const to = (row * w * s + col) * 4;
			for (let k = 0; k < 3; k++) dst.data[to + k] = png.data[from + k];
			dst.data[to + 3] = 255;
		}
	}
	return dst;
}

/**
 * Which pixels one picture owes to the creature and which it would have had without it: the two were
 * drawn at the same moment with the garden frozen, so wherever they differ, that is the animal. Only
 * the window named is looked at, because this renderer dithers a little everywhere between one frame
 * and the next — about one pixel in a hundred over a whole picture, which is noise, and inside a
 * sixty-pixel window it is nothing.
 */
// A measuring window round a creature that no magenta was found in: a square, a ninth of the frame
// across, centred on the pixel the creature was projected to. A koi painted flat magenta and seen under
// half a sheet of tea-coloured water comes up a muddy brown, fails the magenta colour test, and is still
// plainly not the water round it — so the honest count (this frame against the same frame with the animal
// taken out) needs somewhere to look, and this is where.
const windowRound = (c, png) => { const span = Math.round(Math.max(png.width, png.height) * 0.09); return { x: Math.max(0, Math.min(png.width - span, c.x - span / 2)), y: Math.max(0, Math.min(png.height - span, c.y - span / 2)), w: span, h: span }; };

function differing(a, b, window) {
	const found = [];
	const pad = 8;
	const x0 = Math.max(0, window.x - pad);
	const y0 = Math.max(0, window.y - pad);
	const x1 = Math.min(a.width, window.x + window.w + pad);
	const y1 = Math.min(a.height, window.y + window.h + pad);
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const i = y * a.width + x;
			const p = i * 4;
			const d =
				Math.abs(a.data[p] - b.data[p]) +
				Math.abs(a.data[p + 1] - b.data[p + 1]) +
				Math.abs(a.data[p + 2] - b.data[p + 2]);
			if (d > 24) found.push(i);
		}
	}
	return found;
}

/** Which pixels of a marked picture are the magenta it was painted with. */
function magentaOf(png) {
	const found = [];
	for (let i = 0, p = 0; p < png.data.length; p += 4, i++) {
		if (png.data[p] > 150 && png.data[p + 1] < 130 && png.data[p + 2] > 150) found.push(i);
	}
	return found;
}

try {
	await page.goto(url, { waitUntil: "load", timeout: 120000 });
	await page.waitForFunction("window.__villa && window.__villa.scene", null, { timeout: 120000 });
	await new Promise((resolve) => setTimeout(resolve, runFor));

	// Hand-turned frames from here on: one `render()` per picture, so nothing drifts between them.
	await page.evaluate(() => {
		window.__villa.engine.stopRenderLoop();
		window.__mark = { saved: new Map(), clones: new Map() };
		window.__villa.scene.render();
	});

	const shot = async () => PNG.sync.read(await page.screenshot());

	/** Turn the creatures' own clock to a moment, in sixtieths of a second, and draw it. */
	let clock = 0;
	const stepTo = async (t) => {
		await page.evaluate(
			([from, to]) => {
				const { scene, creatures, koi } = window.__villa;
				if (!creatures) return;
				const dt = 1 / 60;
				// Backwards is not a thing: the wingbeat and the cockroach's plans are wound forward from
				// zero, so a rewind runs the loop again. It costs milliseconds and always lands the same
				// creature in the same place, which is what a measurement needs.
				const start = to < from ? 0 : from;
				for (let s = start; s < to; s += dt) {
					creatures.animate(s, dt);
					// The koi are built separately (they need the pond's plan) but they keep the same clock, so
					// this tool has to turn them too — and they are the creatures that most need it, since a
					// fish that never gets to choose a place only ever sits in the middle of a mirror.
					if (koi) koi.animate(s, dt);
				}
				scene.render();
			},
			[clock, t],
		);
		clock = t;
	};

	/** Give the listed meshes a flat magenta clone of their own skin, or put the real one back. */
	const paint = (ids, loud) =>
		page.evaluate(
			([list, on]) => {
				const { scene } = window.__villa;
				for (const id of list) {
					const mesh = scene.getMeshByUniqueId(id);
					if (!mesh) continue;
					if (on) {
						if (!window.__mark.clones.has(id)) {
							const mark = mesh.material.clone(`mark:${mesh.name}`);
							if (mark.albedoColor) mark.albedoColor = new BABYLON.Color3(0, 0, 0);
							if (mark.emissiveTexture) mark.emissiveTexture = null;
							if (mark.bumpTexture) mark.bumpTexture = null;
							mark.emissiveColor = new BABYLON.Color3(0.95, 0, 0.95);
							mark.disableLighting = true;
								mark.alpha = 1;
								mark.transparencyMode = 0;
								mark.alphaCutOff = 0;
							if (mark.specularIntensity !== undefined) mark.specularIntensity = 0;
							if (mark.environmentIntensity !== undefined) mark.environmentIntensity = 0;
							window.__mark.clones.set(id, mark);
						}
						if (!window.__mark.saved.has(id)) window.__mark.saved.set(id, mesh.material);
						mesh.material = window.__mark.clones.get(id);
					} else if (window.__mark.saved.has(id)) {
						mesh.material = window.__mark.saved.get(id);
					}
				}
				scene.render();
			},
			[ids, loud],
		);

	/** Take the listed meshes out of the picture, or put them back. */
	const hide = (ids, gone) =>
		page.evaluate(
			([list, off]) => {
				const { scene } = window.__villa;
				for (const id of list) {
					const mesh = scene.getMeshByUniqueId(id);
					if (mesh) mesh.setEnabled(!off);
				}
				scene.render();
			},
			[ids, gone],
		);

	const survey = () =>
		page.evaluate(() => {
			const { scene, camera } = window.__villa;
			const engine = scene.getEngine();
			const vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
			const vpMatrix = camera.getViewMatrix().multiply(camera.getProjectionMatrix());
			const forward = camera.getForwardRay().direction;
			const isPart = (mesh, root) => {
				for (let p = mesh.parent; p; p = p.parent) if (p === root) return true;
				return false;
			};
			const livesHere = (node) => /^butterfly[0-9]+$|^cockroach[0-9]+$|^frog[0-9]+$|^koi[0-9]+$/.test(node.name);
			const rows = [];
			for (const node of scene.transformNodes) {
				if (!livesHere(node)) continue;
				const here = node.absolutePosition;
				const centre = BABYLON.Vector3.Project(here, BABYLON.Matrix.Identity(), vpMatrix, vp);
				const ahead = here.subtract(camera.position).dot(forward);
				rows.push({
					name: node.name,
					world: here.asArray().map((v) => Number(v.toFixed(3))),
					metres: Number(camera.position.subtract(here).length().toFixed(2)),
					x: Math.round(centre.x),
					y: Math.round(centre.y),
					inFront: ahead > 0,
					inFrame:
						ahead > 0 &&
						centre.x >= 0 &&
						centre.y >= 0 &&
						centre.x < engine.getRenderWidth() &&
						centre.y < engine.getRenderHeight(),
					meshes: scene.meshes.filter((m) => isPart(m, node)).map((m) => m.uniqueId),
				});
			}
			return rows;
		});

	const creatures = await survey();

	console.log(`camera ${view} at ${width}x${height}, ${times.join("/")} seconds of each loop`);
	console.log(
		`${creatures.length} creature(s), ${creatures.reduce((t, c) => t + c.meshes.length, 0)} meshes between them\n`,
	);

	const stats = [];
	for (const c of creatures) {
		const samples = [];
		for (const t of times) {
			await stepTo(t);
			await paint(c.meshes, true);
			const marked = await shot();
			await paint(c.meshes, false);
			await hide(c.meshes, true);
			const clear = await shot();
			await hide(c.meshes, false);
			const dressed = await shot(); // the same moment, dressed as the Villa dresses it

			// Where the creature was painted at all, counted two ways: the magenta it was shown for the
			// measuring, and - the honest one - every pixel this frame owes to it, against the very same
			// frame with it taken out. The garden is frozen, so that second count cannot be fooled by a
			// leaf that moved, and a creature that is culled or wound the wrong way moves no pixel at all.
			const magenta = magentaOf(marked);
			const mx = magenta.map((i) => i % marked.width);
			const my = magenta.map((i) => Math.floor(i / marked.width));
			let box = magenta.length
				? {
						x: Math.min(...mx),
						y: Math.min(...my),
						w: Math.max(...mx) - Math.min(...mx) + 1,
						h: Math.max(...my) - Math.min(...my) + 1,
					}
				: null;
			// The animal itself, counted off the frame it was taken out of, inside the window the magenta
			// found. More pixels than the magenta, because it counts every soft edge the wing has.
			const own = differing(dressed, clear, box || windowRound(c, marked));
			samples.push({ t, pixels: own.length, marked: magenta.length, box, dressed, own });
		}
		const best = samples.reduce((a, b) => (b.pixels > a.pixels ? b : a));
		// The same moment, with a pick down the creature's own pixel: does it name the creature, or does
		// something in front of it get there first? Asked BEFORE the creature is taken out, or the answer
		// is simply whatever was behind it and the question is wasted.
		await stepTo(best.t);
		const here = await survey();
		const now = here.find((r) => r.name === c.name) || c;
		// A pick straight down the pixel the creature is standing at, asked while it is still in the
		// picture: does it name the animal, or did something in front of it get there first?
		const pick = await page.evaluate(
			([x, y]) => {
				const { scene } = window.__villa;
				const hit = scene.pick(x, y, (mesh) => mesh.isEnabled() && mesh.isVisible);
				return hit && hit.hit && hit.pickedMesh ? hit.pickedMesh.name : "nothing";
			},
			[now.x, now.y],
		);
		await hide(c.meshes, true);
		const clear = await shot();
		await hide(c.meshes, false);
		const drawn = mean(best.dressed, best.own);
		const against = mean(clear, best.own);
		stats.push({
			...c,
			...now,
			samples: samples.map((s) => ({ t: s.t, pixels: s.pixels })),
			pixels: best.pixels,
			worst: Math.min(...samples.map((s) => s.pixels)),
			box: best.box,
			dressed: best.dressed,
			drawn,
			against,
			gap: drawn.map((v, i) => Math.abs(v - against[i])),
			pick,
		});
	}

	for (const s of stats) {
		const seen = s.samples.map((x) => `${x.pixels}@${x.t}s`).join(" ");
		console.log(
			`${s.name.padEnd(11)} ${String(s.metres).padStart(5)} m` +
				(s.inFront ? "" : " BEHIND YOU") +
				(s.inFrame ? "" : " OUT OF FRAME") +
				`  pixel ${s.x},${s.y}  covers ${s.worst}..${s.pixels} px (${seen})` +
				`  drawn ${s.drawn} on ${s.against}, gap ${s.gap}` +
				`  picks ${s.pick}  at ${s.world}`,
		);
	}
	const seen = stats.filter((s) => s.pixels > 0);
	console.log(
		`\nseen from here: ${seen.length} of ${stats.length}` +
			(seen.length ? ` — ${seen.map((s) => `${s.name} ${s.worst}..${s.pixels}px`).join(", ")}` : "") +
			`.`,
	);

	// A blown-up crop of each creature at the moment it fills the most pixels: the only way to look at a
	// twenty-pixel insect.
	if (boxBase) {
		for (const s of stats) {
			if (!s.box) continue;
			const pad = 20;
			const x = Math.max(0, s.box.x - pad);
			const y = Math.max(0, s.box.y - pad);
			const w = Math.min(s.dressed.width - x, s.box.w + pad * 2);
			const h = Math.min(s.dressed.height - y, s.box.h + pad * 2);
			const file = `${boxBase}-${s.name}.png`;
			fs.writeFileSync(file, PNG.sync.write(enlarge(s.dressed, x, y, w, h, scale)));
			console.log(`wrote ${file} (${scale}x of ${w}x${h} at ${x},${y}, best ${s.pixels} px of the frame)`);
		}
	}
	// One last whole frame with everything as it is, for the record.
	await stepTo(times[times.length - 1] + 0.001);
	fs.writeFileSync(out, PNG.sync.write(await shot()));
	console.log(`wrote ${out}`);
} finally {
	await browser.close();
}
