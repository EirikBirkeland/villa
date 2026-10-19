// tools/shoot.js — pull the trigger and read what came back, without a hand on the mouse.
//
//   node tools/shoot.js [out.png] [--view x,y,z,yaw,pitch] [--burst N] [--keys] [--shark]
//
// What it weighs, in order:
//
//   the word       it types `g u n` at the page the way a visitor types it, and asks whether the gun came
//                  out. `--keys` is the only honest way to test a typed control: calling `arm(true)` from
//                  the page tests the wiring and not the keypresses.
//   what a round finds   it aims the sight at the water and fires, then says which mesh the line stopped on
//                  and where. A round that hits the visitor's own boot, or nothing at all, is a fault.
//   what the mark is     how many spurts are out, and how long they live.
//   the animal       with `--shark` it fires at the shark itself and reports its state, its hit count and
//                  how much blood is in the pool before and after.
//   the cost         frames a second and the mesh count, before and after a burst, because thirty rounds a
//                  second that each build a mesh is how a garden stops being walkable.
//
// It writes a picture with the marks still in the air, so the thing can be looked at and not merely counted.

import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const out = (args[0] && !args[0].startsWith("--")) ? args[0] : "pictures/tmp-gun-shot.png";
const readFlag = (name, dflt) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : dflt;
};
const VIEW = readFlag("--view", "2.4,1.74,9.0,3.14,0.12");
const BURST = Number(readFlag("--burst", "6"));
const KEYS = args.includes("--keys");
const AT_SHARK = args.includes("--shark");

const url = `http://localhost:8090/villa/index.html?view=${VIEW}&still=1`;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).split("\n")[0]));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__villa && window.__villa.gun, null, { timeout: 60000 });

const state = () => page.evaluate(() => {
	const v = window.__villa;
	const shark = v.shark;
	return {
		armed: v.gun.armed,
		spurts: v.gun.spurtsOut,
		sharkState: shark ? shark.state : "none",
		sharkHits: shark ? shark.hits : 0,
		sharkDepth: shark ? Number(shark.shark.depth.toFixed(2)) : null,
		sharkAt: shark ? `${shark.shark.x.toFixed(1)},${shark.shark.z.toFixed(1)}` : null,
		blood: v.scene.meshes.filter((m) => /^blood/i.test(m.name) && m.isVisible).length,
		meshes: v.scene.meshes.length,
		fps: Math.round(v.engine.getFps()),
	};
});

console.log("before:", JSON.stringify(await state()));

if (KEYS) {
	for (const key of ["g", "u", "n"]) await page.keyboard.press(key);
} else {
	await page.evaluate(() => window.__villa.gun.arm(true));
}
console.log("armed:", JSON.stringify(await state()));

// Where the round went. The sight is aimed at the water on purpose: the pool is the one target in this
// garden that is certain to be there, and the answer a round gets out of water is the one that has to work.
const aim = await page.evaluate(({ atShark }) => {
	const v = window.__villa;
	let target = null;
	if (atShark && v.shark) {
		target = v.shark.shark;
		// Bring the animal up under the surface and hold it where the sight can be pointed at it. This is not
		// cheating the hit: `hitIfNear` refuses a round fired at an animal a metre down, and a tool that had to
		// wait for the creature to surface on its own would be a tool that photographs luck.
		target.depth = target.wantDepth = 0.08;
	}
	const at = target
		? { x: target.x, y: v.pool.bounds.waterY, z: target.z }
		: { x: v.pool.bounds.cx, y: v.pool.bounds.waterY, z: v.pool.bounds.cz };
	const dx = at.x - v.camera.position.x;
	const dz = at.z - v.camera.position.z;
	const dy = at.y - v.camera.position.y;
	v.camera.rotation.y = Math.atan2(dx, dz);
	v.camera.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz));
	return target
		? { at, depth: Number(target.depth.toFixed(2)), yaw: Number(target.yaw.toFixed(2)) }
		: { at };
}, { atShark: AT_SHARK });
console.log("aim:", JSON.stringify(aim));

// One round, reported from the inside: what the line stopped on, and how far.
const first = await page.evaluate(() => {
	const v = window.__villa;
	const { Ray, Vector3 } = BABYLON;
	const forward = new Vector3(0, 0, 0);
	v.camera.getDirectionToRef(Vector3.Forward(), forward);
	const hit = v.scene.pickWithRay(new Ray(v.camera.position.clone(), forward, 90), (m) => m.isPickable && m.isVisible);
	return hit && hit.hit
		? { mesh: hit.pickedMesh.name, at: `${hit.pickedPoint.x.toFixed(2)},${hit.pickedPoint.y.toFixed(2)},${hit.pickedPoint.z.toFixed(2)}`, dist: Number(hit.distance.toFixed(2)) }
		: { mesh: "NOTHING" };
});
console.log("the line stops on:", JSON.stringify(first));

await page.evaluate(({ burst }) => {
	const v = window.__villa;
	for (let i = 0; i < burst; i++) v.gun.shoot();
}, { burst: BURST });
const after = await state();
console.log("after burst:", JSON.stringify(after));

// The marks live for a third of a second, so the picture is taken immediately and the clock is then left
// to run out to prove they go away by themselves.
await page.screenshot({ path: out });
await page.waitForTimeout(1200);
console.log("a second later:", JSON.stringify(await state()));

// And the word again puts the gun away.
if (KEYS) {
	for (const key of ["g", "u", "n"]) await page.keyboard.press(key);
	console.log("typed again:", JSON.stringify(await state()));
}

await browser.close();
console.log(`${out} <- ${url}`);
