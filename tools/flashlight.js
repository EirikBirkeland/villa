// Turn the flashlight on and off and say what it did to the picture.
//
//   node tools/flashlight.js
//
// A light added to a scene is not proven by the light's own numbers: `light.intensity` will read 2.4 whether or
// not a single surface is wearing it. Babylon keeps six lights per material (`maxSimultaneousLights` in
// `src/materials.js`) and there are a dozen lights in this garden, so a thirteenth can be quietly left out of the
// shader and a torch that is on is a torch that shows nothing. The only honest test is a picture taken with it
// off and the same picture taken with it on, and the pixels in between.
//
// The beam is two things and they are measured apart: the LAMP, which is the spotlight that lights the ground,
// and the CONE, the pale solid that makes the beam visible from the side. Either can be worth nothing on its own
// — a lamp that no material is wearing, or a cone that is a wedge of glass — so each is hidden while the other is
// read.
//
// The key is pressed for real — `F` through the browser, not a call to the module — because the listener that
// makes it one tap per press is the part that goes wrong.
import fs from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright-core";

const W = 960;
const H = 540;
const NIGHT = "hour=23.4";
const VIEWS = {
	// The pond's bank, looking south across the lawn: what a visitor sees while standing at the water.
	across: "-20.3,1.6,9.8,3.1416,-0.12",
	// The same spot with the sight on the ground two metres ahead, which is where a torch is pointed when it is
	// being used for something.
	down: "-20.3,1.6,9.8,3.1416,0.55",
};

const stats = (file) => {
	const png = PNG.sync.read(fs.readFileSync(file));
	let sum = 0;
	let white = 0;
	let black = 0;
	let n = 0;
	const box = [];
	const top = [];
	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			const i = (y * png.width + x) * 4;
			const luma = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
			sum += luma;
			n++;
			if (luma > 248) white++;
			if (luma < 8) black++;
			if (x > png.width * 0.35 && x < png.width * 0.65 && y > png.height * 0.4 && y < png.height * 0.75) box.push(luma);
			// The top of the frame is sky and far hedge: the beam must not reach it, and if the cone of dust in
			// the air is too strong it paints a pale wedge up there and the whole night looks milky.
			if (y < png.height * 0.18) top.push(luma);
		}
	}
	const mid = box.sort((a, b) => a - b);
	const crest = top.sort((a, b) => a - b);
	return {
		mean: +(sum / n).toFixed(1),
		white: +((white * 100) / n).toFixed(2),
		black: +((black * 100) / n).toFixed(2),
		centre: Math.round(mid[Math.floor(mid.length / 2)]),
		sky: Math.round(crest[Math.floor(crest.length / 2)]),
	};
};

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage({ viewport: { width: W, height: H } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));

const fps = () => p.evaluate(() => Number(window.__villa.engine.getFps().toFixed(0)));
const light = () =>
	p.evaluate(() => {
		const l = window.__villa.scene.getLightByName("flashlight");
		return l ? { intensity: +l.intensity.toFixed(2), range: l.range, angle: +l.angle.toFixed(2) } : null;
	});
// The cone of dust hidden and shown. Hidden by making the mesh invisible and not by disabling the lamp's
// transform: the beam's parent is switched off when the torch is off, and a mesh left invisible would stay
// invisible next time the torch was lit.
const hideCone = (yes) =>
	p.evaluate(
		(yes) => {
			for (const m of window.__villa.scene.meshes) if (m.name === "flashlightCone") m.isVisible = !yes;
		},
		yes,
	);
const shoot = async (label, file) => {
	await p.waitForTimeout(1300);
	await p.screenshot({ path: file });
	console.log(label.padEnd(26), JSON.stringify(stats(file)));
};

for (const [name, view] of Object.entries(VIEWS)) {
	await p.goto(`http://localhost:8090/villa/index.html?${NIGHT}&view=${view}`, { waitUntil: "load", timeout: 120000 });
	await p.waitForTimeout(13000);
	console.log(`--- ${name} ---`);
	await shoot("dark", `pictures/s112-torch-${name}.png`);
	await p.keyboard.press("KeyF");
	await shoot("lamp and cone", `pictures/s112-torch-${name}-on.png`);
	console.log("   the lamp:", JSON.stringify(await light()));
	await hideCone(true);
	await shoot("   the lamp alone", `/tmp/s112-${name}-lamp.png`);
	await p.evaluate(() => window.__villa.scene.getLightByName("flashlight").setEnabled(false));
	await hideCone(false);
	await shoot("   the cone alone", `/tmp/s112-${name}-cone.png`);
	await p.evaluate(() => window.__villa.scene.getLightByName("flashlight").setEnabled(true));
	await hideCone(true);
	await p.evaluate(() => {
		const f = window.__villa.flashlight;
		f.lamp = 8;
		f.dust = 0.08;
	});
	await shoot("   driven hard (8, 0.08)", `/tmp/s112-${name}-hard.png`);
	await p.evaluate(() => {
		const f = window.__villa.flashlight;
		f.lamp = 4;
		f.dust = 0.03;
	});
	// Off with the same key, and once more, to show it is a switch and not a one-way.
	await p.keyboard.press("KeyF");
	await p.waitForTimeout(1200);
	console.log("   after the second F:", JSON.stringify(await light()));
	await p.keyboard.press("KeyF");
	await p.waitForTimeout(1200);
	console.log("   after the third F:", JSON.stringify(await light()), " fps with the beam on:", await fps());
}

// By day it must be there and do almost nothing, which is what a torch in sunlight does.
await p.goto(`http://localhost:8090/villa/index.html?hour=12&view=${VIEWS.across}`, { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(12000);
await shoot("noon, torch off", "/tmp/s112-noon-off.png");
await p.keyboard.press("KeyF");
await shoot("noon, beam on", "pictures/s112-torch-noon.png");
console.log("fps at noon with the beam on:", await fps());
console.log("page errors:", errors.length ? errors.join(" | ") : "none");
await b.close();
