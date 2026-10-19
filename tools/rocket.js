// tools/rocket.js — throw one rocket at the house and read what came back, without a hand on the mouse.
//
//   node tools/rocket.js [out.png] [--view x,y,z,yaw,pitch] [--at x,y,z] [--wait seconds] [--twice]
//
// What it weighs, in order:
//
//   the control      it types `g u n` and then `5` at the page the way a visitor types them, and asks which
//                    weapon is out. A launcher that answers `arm()` from the page has proved its wiring and
//                    not its key.
//   the flight       one rocket, and where the line stopped: the mesh, the place, and how long it was in the
//                    air. A rocket that flies past the house and lands in the hedge is aimed wrong; one that
//                    stops on the launcher is worse.
//   the blast        how many cards are out, how high the column got, and whether the ring and the scorch
//                    were drawn.
//   the house        how many pieces of it are in the air, how many meshes were taken out of the picture, and
//                    where the pieces came to rest — which is the part that catches a physics fault: a piece
//                    that has fallen through the lawn, or that is still twitching, or that never moved.
//   the cost         frames a second and the mesh count before, during and after, because four hundred boxes
//                    is how a garden stops being walkable.
//   putting it back  `R`, and whether the house is standing again.
//
// It writes pictures at three moments — the fireball, the column, and the pieces on the ground — so the thing
// can be looked at and not merely counted.

import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const out = args[0] && !args[0].startsWith("--") ? args[0] : "pictures/tmp-rocket.png";
const readFlag = (name, dflt) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : dflt;
};
const VIEW = readFlag("--view", "2.4,1.74,9.0,3.14,0.06");
const AT = readFlag("--at", "");
const WAIT = Number(readFlag("--wait", "9"));
const TWICE = args.includes("--twice");

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
	"--hide-scrollbars",
];

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
const url = `http://localhost:8090/villa/index.html?view=${VIEW}`;
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(9000);

const ask = (source) => page.evaluate(source);

const before = await ask(`(() => {
	const v = window.__villa;
	return { meshes: v.scene.meshes.length, fps: v.engine.getFps(), launcher: !!v.launcher, gun: !!v.gun };
})()`);
console.log(`before: ${before.meshes} meshes, ${Math.round(before.fps)} fps, launcher ${before.launcher ? "built" : "absent"}`);

// The typed control: the word, then the number.
await page.keyboard.press("g");
await page.keyboard.press("u");
await page.keyboard.press("n");
await page.waitForTimeout(200);
const armed = await ask("window.__villa.gun.armed");
await page.keyboard.press("5");
await page.waitForTimeout(200);
const mode = await ask("window.__villa.launcher.mode");
console.log(`armed: ${armed}, after 5 the weapon out is: ${mode}`);

// Where the rocket is going. Either a place named on the command line, or the middle of the house.
const target = AT ? AT.split(",").map(Number) : await ask(`(() => {
	const v = window.__villa;
	const m = v.scene.getMeshByName('plasterFront') || v.scene.getMeshByName('fasciaSouth') || v.scene.getMeshByName('roof');
	const p = m.getAbsolutePosition();
	return [p.x, p.y, p.z];
})()`);
console.log(`target: ${target.map((n) => Math.round(n * 10) / 10).join(", ")}`);

// Aim the sight at it and press the button, so the shot goes through the pointer handler and not past it.
await page.evaluate(
	`(() => {
		const v = window.__villa;
		const from = v.camera.position;
		const dx = ${target[0]} - from.x, dy = ${target[1]} - from.y, dz = ${target[2]} - from.z;
		v.camera.rotation.set(Math.atan2(-dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0);
	})()`
);
const t0 = Date.now();
await page.mouse.down();
await page.waitForTimeout(60);
await page.mouse.up();
if (TWICE) {
	await page.waitForTimeout(700);
	await page.mouse.down();
	await page.waitForTimeout(60);
	await page.mouse.up();
}

const shot = await ask(`(() => {
	const v = window.__villa;
	return { rocketsOut: v.launcher.rocketsOut, cardsOut: v.launcher.cardsOut };
})()`);
console.log(`just after the press: ${shot.rocketsOut} rocket(s) in the air, ${shot.cardsOut} cards out`);

const columnNow = () =>
	ask(`(() => {
		const v = window.__villa;
		let top = 0;
		let out = 0;
		for (const m of v.scene.meshes) {
			if (!/^blastCard/.test(m.name) || !m.isVisible) continue;
			out++;
			top = Math.max(top, m.position.y + m.scaling.y * 0.5);
		}
		return { top: Math.round(top * 10) / 10, out };
	})()`);

// Three pictures: the fireball, the column, and what came down.
const shot1 = out.replace(/\.png$/, "-1-fireball.png");
const shot2 = out.replace(/\.png$/, "-2-column.png");
await page.screenshot({ path: shot1 });
console.log(`at once: the column reaches ${(await columnNow()).top} m, ${(await columnNow()).out} cards out`);
await page.waitForTimeout(1500);
await page.screenshot({ path: shot2 });
console.log(`at 1.5 s: the column reaches ${(await columnNow()).top} m`);
await page.waitForTimeout(Math.max(0, WAIT * 1000 - 1500));

const blast = await ask(`(() => {
	const v = window.__villa;
	const chunks = v.scene.meshes.filter((m) => /^debris/.test(m.name));
	const rest = chunks.filter((m) => m.isEnabled());
	let under = 0;
	let high = 0;
	let spread = 0;
	for (const m of rest) {
		const p = m.getAbsolutePosition();
		if (p.y < v.ground.heightAt(p.x, p.z) - 0.25) under++;
		if (p.y > 1.2) high++;
		spread = Math.max(spread, Math.hypot(p.x - v.camera.position.x, p.z - v.camera.position.z));
	}
	const gone = v.scene.meshes.filter((m) => /^(plaster|roof|fascia|teak|terrace|sala|front|store|door|window|glass|column|colon|pier|step|deck)/.test(m.name) && !m.isEnabled()).length;
	return {
		chunks: chunks.length,
		under,
		high,
		spread: Math.round(spread * 10) / 10,
		gone,
		blown: v.launcher.blown,
		cardsOut: v.launcher.cardsOut,
		meshes: v.scene.meshes.length,
		fps: Math.round(v.engine.getFps()),
		scorch: v.scene.getMeshByName('blastScorch').isVisible,
	};
})()`);
console.log(
	`after ${WAIT}s: ${blast.chunks} pieces thrown, ${blast.gone} meshes out of the picture, ` +
		`${blast.under} under the ground, ${blast.high} still above a metre, furthest ${blast.spread} m off`
);
console.log(`blast: ${blast.blown} meshes smashed, ${blast.cardsOut} cards still out, scorch ${blast.scorch ? "laid" : "gone"}`);
console.log(`cost: ${blast.meshes} meshes, ${blast.fps} fps (was ${before.meshes}, ${Math.round(before.fps)})`);

await page.screenshot({ path: out });

// The column's height, from the cards that are still out.
const column = await columnNow();
console.log(`at ${WAIT} s: the column reaches ${column.top} m with ${column.out} cards still out`);

// Put it back.
await page.keyboard.press("r");
await page.waitForTimeout(600);
const back = await ask(`(() => {
	const v = window.__villa;
	const gone = v.scene.meshes.filter((m) => /^(plaster|roof|fascia|teak|terrace)/.test(m.name) && !m.isEnabled()).length;
	return { gone, debris: v.scene.meshes.filter((m) => /^debris/.test(m.name)).length, blown: v.launcher.blown };
})()`);
console.log(`after R: ${back.gone} meshes still missing, ${back.debris} pieces left in the garden, blown counter ${back.blown}`);

console.log(`pictures: ${shot1}, ${shot2}, ${out}`);
await browser.close();
