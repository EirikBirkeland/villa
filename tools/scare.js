// Points the shark at the camera and holds it there, so its head can be looked at.
//
// The animal is quick and the browser here is slow — a snap lasts a sixth of a second of imagined time and
// the picture takes longer than that to take — so a scary thing cannot be judged by waiting for it to
// happen. This tool puts the Villa on a given view, forces the shark into a given pose every hundredth of a
// second so its own behaviour cannot undo it, and photographs the result.
//
//   node tools/scare.js pictures/gape.png                                   the mouth wide, from the poolside
//   node tools/scare.js pictures/shut.png --pose shut
//   node tools/scare.js pictures/under.png --view 0,1.4,3.4,-1.05,0.6
//   node tools/scare.js pictures/blood.png --bleed                           and a bite's worth of blood
//   node tools/scare.js pictures/lunge.png --pose lunge --across              the whole animal coming up
//
// Poses: `gape` (jaw dropped, snout lifted, coming at you), `shut` (the same place, mouth closed), `lunge`
// (the animal's own throwing-itself-at-the-edge attitude, nose up and back through the surface, held),
// `cruise` (nothing forced: whatever it happens to be doing).

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
const out = argv.find((a) => !a.startsWith("--") && !/:\/\//.test(a)) || "pictures/scare.png";
const pose = readFlag("pose", argv) || "gape";
const wait = Number(readFlag("wait", argv) || 6000);
const size = readFlag("size", argv) || "900x600";
const view = readFlag("view", argv) || "0,1.9,0.1,-1.05,0.16";
// Where to stand the animal, in the pool's plan, and how deep its back lies. Left alone it is put at the
// water's edge under the sight with its back 2 cm out of the water, which is the bite; `--at 0,4.6 --depth
// 0.06` is instead the fin cutting the surface in the middle of the pool, which is the cruise.
const at = readFlag("at", argv);
const depth = readFlag("depth", argv) === null ? null : Number(readFlag("depth", argv));
// Face the sight (the bite) or go across it (the fin cutting the surface, seen from the side). Given, this
// stands the animal broadside to the camera instead of nose-on.
const across = readFlag("across", argv) !== null;
// Fire a bite at the camera and photograph what it does to the sight: the roll and the red at the edges.
// Given as a number, which is how hard — 1 is a bite that landed on the leg, 0.45 is one that came up short.
const flinch = readFlag("flinch", argv) === null ? null : Number(readFlag("flinch", argv));
// Pixels to ask about after the pose is held, as `x,y` pairs split by a semicolon.
const pick = readFlag("pick", argv);
const width = Number(size.split("x")[0]);
const height = Number(size.split("x")[1]);
// `float` pins the camera where the address bar put it, which is the whole point here: nothing may move the
// sight while the pose is being held.
const url = `http://localhost:8090/villa/index.html?float=1&view=${view}`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${width},${height}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width, height });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));

await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, Math.min(wait, 5000)));

const hold = await page.evaluate(
	([want, bleed, placed, held, broadside, hurt]) => {
		const holder = window.__villa.shark;
		if (!holder) return { error: "no shark — is this Villa built with one?" };
		const s = holder.shark;
		const force = () => {
			const cruise = want === -1;
			const lunging = want === 2;
			if (cruise && placed === null && held === null) return;
			// A snap whose timer never runs out: the animal holds its pose instead of biting and swimming off.
			if (!cruise) {
				s.state = lunging ? "lunge" : "snap";
				s.left = 9e5;
				s.cooldown = 9e5;
				s.wantOpen = lunging ? 0.85 : want;
				s.open = s.wantOpen;
			}
			// A held lunge keeps its own depth: the whole point of the pose is the animal coming UP, and a tool
			// that pins it down again photographs the thing it was sent to look at never happening.
			if (!lunging) {
				s.depth = held === null ? -0.02 : held;
				s.wantDepth = s.depth;
			} else if (held !== null) {
				s.wantDepth = held;
			}
			// And stand it where it is to be seen, facing the sight, and not swimming: the pose is the thing
			// being looked at, and an animal that drifts off to the far corner while holding a face is a
			// photograph of an empty pool.
			const cam = window.__villa.camera.position;
			const b = window.__villa.pool.bounds;
			const here = placed || [cam.x, cam.z];
			s.x = Math.max(b.x0 + 0.4, Math.min(b.x1 - 0.4, here[0]));
			s.z = Math.max(b.z0 + 0.4, Math.min(b.z1 - 0.4, here[1]));
			s.yaw = Math.atan2(cam.x - s.x, cam.z - s.z) + (broadside ? Math.PI / 2 : 0);
			s.going = 0;
			s.speed = 0;
			s.target.x = s.x;
			s.target.z = s.z;
			if (hurt !== null) {
				// The bite's message, sent the same way the animal sends it: `onBite` is the one hole from the
				// shark into main.js, and whatever the sight does after this is what a visitor is shown. Sent
				// again with every hold, because a bite's red drains in a second and a slow browser needs
				// longer than that to take a picture of it.
				const tip = s.snout.getAbsolutePosition();
				s.onBite({ power: hurt, at: { x: tip.x, y: tip.y, z: tip.z } });
			}
		};
		window.__villa.__pose = want;
		force();
		window.__villa.__hold = setInterval(force, 60);
		if (bleed) {
			const tip = s.snout.getAbsolutePosition();
			holder.blood.bleed(tip.x, -0.3, tip.z, 1);
		}
		return { pose: want, bites: s.bites };
	},
	[
		pose === "gape" ? 1 : pose === "shut" ? 0 : pose === "lunge" ? 2 : -1,
		readFlag("bleed", argv) !== null,
		at ? at.split(",").map(Number) : null,
		depth,
		across,
		flinch,
	],
);

await new Promise((resolve) => setTimeout(resolve, Math.max(800, wait - 5000)));

const after = await page.evaluate(() => {
	const holder = window.__villa.shark;
	const s = holder.shark;
	const tip = s.snout.getAbsolutePosition();
	return {
		state: s.state,
		open: Number(s.open.toFixed(2)),
		jaw: Number(s.jaw.rotation.x.toFixed(2)),
		depth: Number(s.depth.toFixed(2)),
		at: [s.x, s.depth, s.z].map((v) => Number(v.toFixed(2))),
		snout: [tip.x, tip.y, tip.z].map((v) => Number(v.toFixed(2))),
		bleeds: holder.blood.spills.length,
	};
});
console.log(JSON.stringify({ hold, after }, null, 1));

if (pick) {
	const { PNG } = await import("pngjs");
	const sizeNow = await page.evaluate(() => {
		const c = document.querySelector("canvas");
		return [c.clientWidth, c.clientHeight];
	});
	const found = [];
	for (const pair of pick.split(";")) {
		const [x, y] = pair.split(",").map(Number);
		const hit = await page.evaluate(
			([x, y]) => {
				const { scene, camera } = window.__villa;
				const engine = scene.getEngine();
				const w = engine.getRenderWidth();
				const h = engine.getRenderHeight();
				const r = scene.pick((x / 900) * w, (y / 600) * h, (m) => m.isEnabled() && m.isVisible);
				if (!r || !r.hit || !r.pickedMesh) return { x, y, hit: "nothing" };
				const p = r.pickedPoint.asArray().map((v) => Number(v.toFixed(3)));
				return { x, y, hit: r.pickedMesh.name, material: r.pickedMesh.material?.name, distance: Number(r.distance.toFixed(2)), point: p };
			},
			[x, y],
		);
		const one = await page.screenshot({ clip: { x: Math.round((x / 900) * sizeNow[0]), y: Math.round((y / 600) * sizeNow[1]), width: 1, height: 1 } });
		const image = PNG.sync.read(one);
		hit.pixel = [image.data[0], image.data[1], image.data[2]];
		found.push(hit);
	}
	console.log(JSON.stringify(found));
}

await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}`);
