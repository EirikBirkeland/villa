// Photograph the raven's coin where it lies, and the bird over the place it fell.
//
// The Villa pays a coin out only when its own day wraps and three days have gone by, so this tool turns the day
// over until the purse opens, notes where a coin came to rest, and then photographs it.
//
// HOW THE PICTURE IS AIMED, and why.
//
// Writing to `camera.position` and `camera.rotation` does nothing worth mentioning: the walking controller owns
// those numbers and rewrites them every frame from the visitor's own state. The door a tool may use is the
// `view=x,y,z,yaw,pitch` switch on the address, which places the VISITOR — verified: asked for 5.97,1.83,2.97
// the camera stands at 5.97,1.74,2.97, the ground's own height plus the eye, exactly as asked.
//
// The purse survives a fresh load — that is the whole design of `src/raven.js`, a coin dropped yesterday lying
// in the same place today, kept under `villa.raven` in `localStorage` — so the tool may reload as often as it
// likes and re-aim as often as it likes. It does need the same browser context: a throwaway profile starts with
// an empty purse and no amount of turning the day will show a coin that was never dropped in this one.
//
// A coin is 26 mm across, so a picture of one is a picture of a glint: at a metre it is nine pixels wide. The
// distance is therefore stepped in until the scene itself agrees that the middle of the frame is the coin — the
// tool picks its own pixel and asks what mesh stands there, and does not believe its own screenshot.
//
// Also learned the hard way: a coin falls at 5.4 metres a second of the VILLA's time and this sandbox draws a few
// frames a second with the frame gap clamped, so three metres of air is many seconds of the wall clock. Wait for
// the piece's height to stop changing. And a coin lying on its edge must be lifted by its own radius, which
// `src/raven.js` now does: it used to be laid with its centre four millimetres over the paving, and nine
// millimetres of it was under the ground.
//
//   node tools/ravencoin.js [pictures/s111-raven]
import fs from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright-core";

const base = process.argv[2] || "pictures/s111-raven";
const W = 1280;
const H = 720;

// What the drawn file actually paints at a point: the average of a nine-by-nine patch. This is the honest end of
// a search for a small object — the scene can say a coin stands at a pixel, and only the drawn file can say what
// colour it came out. An earlier count of "gold pixels anywhere" was worthless: sunlit paving passed the test and
// a fifth of the frame went on the side of the coin.
const colourAt = (file, cx, cy) => {
	const png = PNG.sync.read(fs.readFileSync(file));
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;
	for (let y = cy - 4; y <= cy + 4; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
			const i = (y * png.width + x) * 4;
			r += png.data[i];
			g += png.data[i + 1];
			b += png.data[i + 2];
			n++;
		}
	}
	if (!n) return null;
	return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
};

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const ctx = await b.newContext({ viewport: { width: W, height: H } });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
const open = async (query) => {
	await p.goto(`http://localhost:8090/villa/index.html?${query}`, { waitUntil: "load", timeout: 120000 });
	await p.waitForTimeout(11000);
};

await open("hour=10");
// Open the purse. The bird must be on the ridge when the day turns, and the turn must be spread over two frames
// because `src/main.js` decides the day wrapped by comparing this frame's hour with the last frame's.
await p.evaluate(() => window.__villa.raven.arrive(0));
let coin = null;
for (let i = 0; i < 40 && !coin; i++) {
	await p.evaluate(() => window.__villa.raven.arrive(0));
	await p.waitForTimeout(150);
	await p.evaluate(() => window.__villa.day.set(23.9));
	await p.waitForTimeout(150);
	await p.evaluate(() => window.__villa.day.set(0.05));
	await p.waitForTimeout(400);
	coin = await p.evaluate(() => {
		const v = window.__villa;
		for (const m of v.scene.meshes) {
			if (m.name !== "royalCoin") continue;
			const q = m.getAbsolutePosition();
			if (q.y > 0.6) continue; // still on its way down
			const g = v.ground.heightAt(q.x, q.z);
			if (g < 0) continue;
			return { x: +q.x.toFixed(2), y: +q.y.toFixed(2), z: +q.z.toFixed(2), g: +g.toFixed(2) };
		}
		return null;
	});
}
if (!coin) {
	console.log("no coin came down where this tool could see it");
	await b.close();
	process.exit(0);
}
let was = 99;
for (let i = 0; i < 40; i++) {
	await p.waitForTimeout(600);
	const now = await p.evaluate(() => {
		const q = window.__villa.scene.meshes.filter((m) => m.name === "royalCoin")[0].getAbsolutePosition();
		return +q.y.toFixed(3);
	});
	if (Math.abs(now - was) < 0.003) break;
	was = now;
}
console.log(`the coin lies at ${coin.x},${coin.z}, ${coin.y} over the floor of the world, ${((coin.y - coin.g) * 1000).toFixed(0)} mm over the ground it came to rest on`);

// Stand off it and tip the sight down, stepping closer until the scene says the middle of the frame is the coin.
let shot = null;
for (const dist of [0.8, 0.55, 0.4, 1.15]) {
	const view = await p.evaluate(
		({ c, dist }) => {
			const sx = c.x + dist * 0.707;
			const sz = c.z + dist * 0.707;
			const ey = c.g + 1.6;
			return [sx.toFixed(2), ey.toFixed(2), sz.toFixed(2), Math.atan2(c.x - sx, c.z - sz).toFixed(2), (-Math.atan2(c.y - ey, dist)).toFixed(2)].join(",");
		},
		{ c: coin, dist },
	);
	await open(`hour=10&view=${view}`);
	const m = await p.evaluate(
		({ W, H }) => {
			const v = window.__villa;
			const list = v.scene.meshes.filter((m2) => m2.name === "royalCoin");
			if (!list.length) return { err: "the purse did not come back with the page" };
			const q = list[0].getAbsolutePosition();
			const at = (pos) => BABYLON.Vector3.Project(pos, BABYLON.Matrix.Identity(), v.scene.getTransformMatrix(), v.camera.viewport.toGlobal(W, H));
			const here = at(q);
			const edge = at(q.add(new BABYLON.Vector3(0.026, 0, 0)));
			const pick = v.scene.pick(Math.round(here.x), Math.round(here.y), (m2) => m2.isEnabled() && m2.isVisible);
			return {
				px: Math.round(Math.abs(edge.x - here.x)),
				at: [Math.round(here.x), Math.round(here.y)],
				off: Math.round(Math.hypot(here.x - W / 2, here.y - H / 2)),
				pick: pick && pick.hit ? pick.pickedMesh.name : "nothing",
			};
		},
		{ W, H },
	);
	console.log(`stood ${dist} m off it: ${JSON.stringify(m)}`);
	if (m.pick === "royalCoin") {
		await p.screenshot({ path: `${base}-coin.png` });
		const c = colourAt(`${base}-coin.png`, m.at[0], m.at[1]);
		console.log(`${base}-coin.png: the coin is ${m.px} px across at ${m.at.join(",")}, and the drawn file paints that place (${c.r},${c.g},${c.b})`);
		shot = view;
		break;
	}
}
if (!shot) console.log("never got the coin under the middle of the frame");

// And the bird over the place it fell. Daylight, because a raven asked to perch in the dark is told to go again
// on the next frame (`if (onFor <= 0 || night) perchOff()` in `src/raven.js`).
await open("hour=10&view=4.5,1.6,12.5,-2.9,0");
await p.evaluate(() => window.__villa.raven.arrive(0));
await p.waitForTimeout(4200); // its glide in takes three seconds
const bird = await p.evaluate(() => window.__villa.raven.where());
if (!bird) {
	console.log("the bird would not come to the ridge for the wide picture");
	await b.close();
	process.exit(0);
}
// Stand where both are in sight. The bird sits on the ridge about five metres over the ground and the coin lies on
// the ground ten metres away from under it, so the two together span more than the sight's vertical angle from
// anywhere near: measured, a stand six metres off the coin put the bird 32 degrees above the middle and the coin
// 28 below, against about 28 degrees of vertical sight. So the tool stands a long way back, on the far side of
// the coin from the bird, and splits the pitch between the two.
const back = await p.evaluate(
	({ c, bird }) => {
		const away = { x: c.x - bird.x, z: c.z - bird.z };
		const len = Math.hypot(away.x, away.z) || 1;
		const sx = c.x + (away.x / len) * 15;
		const sz = c.z + (away.z / len) * 15;
		const v = window.__villa;
		const ey = v.ground.heightAt(sx, sz) + 1.6;
		const yaw = Math.atan2(c.x - sx, c.z - sz);
		const toCoin = -Math.atan2(c.y - ey, Math.hypot(c.x - sx, c.z - sz));
		const toBird = -Math.atan2(bird.y - ey, Math.hypot(bird.x - sx, bird.z - sz));
		return [sx.toFixed(2), ey.toFixed(2), sz.toFixed(2), yaw.toFixed(2), ((toCoin + toBird) / 2).toFixed(2)].join(",");
	},
	{ c: coin, bird },
);
await open(`hour=10&view=${back}`);
const both = await p.evaluate(
	({ W, H }) => {
		const v = window.__villa;
		const list = v.scene.meshes.filter((m2) => m2.name === "royalCoin");
		if (!list.length) return { err: "no coin" };
		const q = list[0].getAbsolutePosition();
		const at = (pos) => BABYLON.Vector3.Project(pos, BABYLON.Matrix.Identity(), v.scene.getTransformMatrix(), v.camera.viewport.toGlobal(W, H));
		const s = at(q);
		const inFrame = (p2) => p2.x > 0 && p2.x < W && p2.y > 0 && p2.y < H;
		// The bird is a group of meshes under one root; its head is a good enough stand-in for the whole of it.
		const head = v.scene.meshes.filter((m2) => m2.name.indexOf("ravenHead") === 0);
		return {
			coinIn: inFrame(s),
			coinAt: [Math.round(s.x), Math.round(s.y)],
			birdIn: head.length ? inFrame(at(head[0].getAbsolutePosition())) : false,
			birdAt: head.length ? (() => { const h = at(head[0].getAbsolutePosition()); return [Math.round(h.x), Math.round(h.y)]; })() : null,
		};
	},
	{ W, H },
);
await p.screenshot({ path: `${base}-both.png` });
console.log(
	`${base}-both.png: the bird ${both.birdIn ? `in frame at ${both.birdAt.join(",")}` : "out of frame"}; the coin ${both.coinIn ? `in frame at ${both.coinAt.join(",")}` : "out of frame"}${both.coinIn ? `, painted (${Object.values(colourAt(`${base}-both.png`, both.coinAt[0], both.coinAt[1])).join(",")})` : ""}`,
);
await b.close();
