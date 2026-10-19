// recover — does the visitor get their feet back after the shark bites?
//
// A bite is allowed to do two things and nothing else: knock the camera, and put red at the edges of the sight.
// It is not allowed to cost the visitor their walking, and there is no way to find that out by reading the code —
// the numbers all look clean. So this measures the walking itself, twice: once before any bite, and once after
// the animal has actually bitten and the whole of the aftereffect has drained away.
//
//   node tools/recover.js                       stand at the coping and wait to be bitten
//   node tools/recover.js --for 120             how long to wait for the bite
//   node tools/recover.js --nowalk              measure the walking but do not wait for a bite (the control)
//
// What it prints is the answer to one question: does a second of holding `W` take the visitor as far, in the
// same direction, at the same height, as it did before? Plus what the camera and the vignette were left holding
// when all of it was over, which ought to be nothing at all.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
	"--autoplay-policy=no-user-gesture-required",
];

const argv = process.argv.slice(2);
const flag = (name, at) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] ?? at : at);
const waitFor = Number(flag("--for", "100"));
const noWalk = argv.includes("--nowalk");

// On the coping, back to the water, facing the open paving: close enough that the animal reaches the boot
// on its first lunge, and with a clear run straight ahead for the walking to be measured along.
// coping half a metre behind the visitor, and there is a clear run straight ahead for the walking to be measured
// along. Facing north would have the visitor walking into the pool, which measures nothing.
const view = flag("--view", "0,1.83,1.95,3.1416,-0.05");
const url = `http://localhost:8090/villa/?view=${view}`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 6000));

/** Hold `W` for two thirds of a second and report where the visitor got to. */
async function walk(label) {
	// Babylon keeps a Vector3's x, y and z behind accessors, so spreading a position yields nothing at all and
	// every number below has to be asked for by name.
	const where = () => page.evaluate(() => {
		const p = window.__villa.camera.position;
		return { x: p.x, y: p.y, z: p.z };
	});
	const before = await where();
	await page.keyboard.down("w");
	await new Promise((resolve) => setTimeout(resolve, 700));
	await page.keyboard.up("w");
	await new Promise((resolve) => setTimeout(resolve, 700));
	const after = await where();
	const state = await page.evaluate(() => {
		const v = window.__villa;
		const ip = v.pipeline.imageProcessing;
		return {
			rotation: [+v.camera.rotation.x.toFixed(4), +v.camera.rotation.y.toFixed(4), +v.camera.rotation.z.toFixed(6)],
			rollExactlyZero: v.camera.rotation.z === 0,
			footing: +(v.camera.position.y - v.ground.heightAt(v.camera.position.x, v.camera.position.z) - 1.6).toFixed(4),
			flying: v.walk.flying(),
			vignette: [+ip.vignetteColor.r.toFixed(3), +ip.vignetteColor.g.toFixed(3), +ip.vignetteColor.b.toFixed(3)],
			vignetteWeight: +ip.vignetteWeight.toFixed(3),
			bites: v.shark && v.shark.shark ? v.shark.shark.bites : null,
			// A bite is allowed to leave nothing behind. These three are the way to find out whether it does: a
			// spill of blood or a ring on the water that makes a new mesh every time it happens would slow the
			// Villa down for good, and a visitor would feel that as the walk going heavy and would call it exactly
			// what they called it — movement getting difficult.
			fps: Math.round(v.engine.getFps()),
			meshes: v.scene.meshes.length,
			materials: v.scene.materials.length,
		};
	});
	const gone = Math.hypot(after.x - before.x, after.z - before.z);
	console.log(
		`${label}: W held two thirds of a second — ${(gone * 100).toFixed(0)} cm gone, ` +
		`heading ${(Math.atan2(after.x - before.x, after.z - before.z) * 57.3).toFixed(1)}°, ` +
		`height ${after.y.toFixed(3)} (off its footing by ${state.footing}), roll ${state.rotation[2]}, ` +
		`flying ${state.flying}, vignette ${JSON.stringify(state.vignette)} w${state.vignetteWeight}, bites ${state.bites}, ` +
		`${state.fps} fps, ${state.meshes} meshes, ${state.materials} materials`
	);
	return { gone, state };
}

/** Hold a key, then let the visitor settle. Used to walk out to measure and walk back again. */
async function hold(key, ms) {
	await page.keyboard.down(key);
	await new Promise((resolve) => setTimeout(resolve, ms));
	await page.keyboard.up(key);
	await new Promise((resolve) => setTimeout(resolve, 500));
}

/** Back to the coping, where the animal can reach the boot. */
async function backToTheEdge() {
	await hold("s", 700);
}

/**
 * How far one step takes the visitor when they are looking at their own feet — which is where a person looking
 * at a shark, or at what a shark left on the water, is looking. The heading used to be read off the sight and
 * then have its height rubbed off, which left a short vector and a short stride, and nothing about a bite is
 * more likely to make a visitor point the sight at the ground. Reported as centimetres, level against steep.
 */
async function steepStep(label) {
	// Short steps, and one back for every step forward: south of the pool there are four metres of paving before
	// the villa's deck begins, and a measurement that walks the visitor into a wall measures a wall.
	const HOLD = 400;
	const step = async (pitch) => {
		await hold("s", HOLD);
		await page.evaluate((value) => { window.__villa.camera.rotation.x = value; }, pitch);
		const gone = await measure("w", HOLD);
		return gone;
	};
	const level = await step(-0.05);
	const steep = await step(-1.1);
	await page.evaluate(() => { window.__villa.camera.rotation.x = -0.05; });
	console.log(
		`${label}: one step looking level ${(level * 100).toFixed(0)} cm, the same step looking down at the water ` +
		`(${(steep * 100).toFixed(0)} cm, ${(level > 0 ? (steep / level * 100).toFixed(0) : "?")}% of it)`
	);
	return { level, steep };
}

/** Hold one key for a while and report how far the visitor travelled. */
async function measure(key, ms) {
	const read = () => page.evaluate(() => {
		const p = window.__villa.camera.position;
		return { x: p.x, z: p.z };
	});
	const before = await read();
	await page.keyboard.down(key);
	await new Promise((resolve) => setTimeout(resolve, ms));
	await page.keyboard.up(key);
	await new Promise((resolve) => setTimeout(resolve, 600));
	const after = await read();
	return Math.hypot(after.x - before.x, after.z - before.z);
}

const first = await walk("before   ");
if (first.gone < 1) console.log("NOTE: the first walk is short — the visitor is against something, so this run measures nothing. Move --view.");
// The jolt, caught in the act. A shake at forty-four radians a second is too quick for a picture to be evidence
// about, and `camera.rotation.z` read from a tool between frames now says zero whatever is happening — which is
// the guarantee, and also why a screenshot can prove nothing either way. So this puts a hook INSIDE the render,
// where the drawn frame actually lives, and reports the wildest roll any one frame was drawn with next to the
// roll the camera is holding between frames. With a flinch held the first ought to be about a degree and a half;
// the second must be exactly nothing, always, or the animal owns the sight.
if (argv.includes("--jolt")) {
	await page.evaluate(() => {
		const v = window.__villa;
		window.__inside = { worst: 0, frames: 0 };
		v.scene.onAfterRenderObservable.add(() => {
			const roll = Math.abs(v.camera.rotation.z);
			if (roll > window.__inside.worst) window.__inside.worst = roll;
			window.__inside.frames++;
		});
		window.__flinch = setInterval(() => { v.bite.knock = 1; }, 50);
	});
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const jolted = await page.evaluate(() => {
		clearInterval(window.__flinch);
		window.__villa.bite.knock = 0;
		return {
			worstFrame: +window.__inside.worst.toFixed(4),
			worstDegrees: +(window.__inside.worst * 57.2958).toFixed(2),
			frames: window.__inside.frames,
			betweenFrames: window.__villa.camera.rotation.z,
			clean: window.__inside.worst > 0.005 && window.__villa.camera.rotation.z === 0,
		};
	});
	console.log(
		`jolt   : with a flinch held, the wildest frame was drawn rolled ${jolted.worstFrame} rad (${jolted.worstDegrees}°) ` +
		`over ${jolted.frames} frames, and between frames the camera held ${jolted.betweenFrames} — ` +
		`${jolted.clean ? "the bite is drawn and the camera is left alone" : "WRONG"}`
	);
	await browser.close();
	process.exit(0);
}

const steepBefore = argv.includes("--steep") ? await steepStep("before   ") : null;
if (argv.includes("--steep")) {
	const again = await steepStep("after    ");
	console.log(`verdict: ${again.steep >= again.level * 0.85 ? "a step is a step, whatever the sight is looking at" : `LOOKING DOWN SHORTENS THE STEP — ${(again.steep * 100).toFixed(0)} cm against ${(again.level * 100).toFixed(0)} cm`}`);
	await browser.close();
	process.exit(0);
}

if (noWalk) {
	await browser.close();
	process.exit(0);
}

await backToTheEdge();

// Now wait for the animal to bite of its own accord, watching its own state so the wait can be reported.
const bitten = await page.evaluate(async (seconds) => {
	const s = window.__villa.shark.shark;
	if (!s) return { bit: false, why: "no shark" };
	const start = s.bites;
	const seen = [];
	let last = s.state;
	return await new Promise((resolve) => {
		const tick = () => {
			if (s.state !== last) {
				seen.push(s.state);
				last = s.state;
			}
			if (s.bites > start) {
				clearInterval(tick);
				resolve({ bit: true, states: seen.join(" → "), at: (() => { const p = s.snout.absolutePosition; return { x: p.x, y: p.y, z: p.z }; })() });
			}
		};
		const timer = setInterval(tick, 80);
		setTimeout(() => {
			clearInterval(timer);
			resolve({ bit: false, states: seen.join(" → ") });
		}, seconds * 1000);
	});
}, waitFor);

if (!bitten.bit) {
	console.log(`never bitten in ${waitFor}s — states seen: ${bitten.states}`);
	await browser.close();
	process.exit(0);
}
console.log(`BITTEN — ${bitten.states}; snout at ${bitten.at.x.toFixed(2)}, ${bitten.at.y.toFixed(2)}, ${bitten.at.z.toFixed(2)}`);

// The jolt itself, caught while it is still on. Since the roll is written onto the frame and wiped off in the
// same frame, the camera reads straight here even at the height of a bite — which is the point, and what
// `--jolt` proves from inside the render.
const mid = await page.evaluate(() => +window.__villa.camera.rotation.z.toFixed(4));
console.log(`during    : camera roll ${mid} between frames while the bite was still knocking — the jolt lives inside the drawn frame, and the --jolt run is what weighs it`);

await new Promise((resolve) => setTimeout(resolve, 6000));
const after = await walk("after    ");

const back = after.gone >= first.gone * 0.85;
console.log(
	`verdict: ${after.state.rollExactlyZero ? "camera straight again" : "CAMERA LEFT TILLED"}; ` +
	`${Math.abs(after.state.footing) < 0.02 ? "standing on the ground like before" : "NOT ON THE GROUND"}; ` +
	`${back ? "walks as far as before" : `WALKS SHORT — ${after.gone.toFixed(2)} m against ${first.gone.toFixed(2)} m`}`
);

// The harsher case, and the one a visitor actually lives: standing at the coping, pressing against the wall of
// the pool, and being bitten again every few seconds. One bite is one thing; a knock that is re-struck before
// the last one has finished is a camera that never stops moving, and "the camera got permanently messed up" is
// far more likely to mean that than a bite that never ended. So: press into the edge for a minute, sampling the
// roll ten times a second, and say how much of that minute the horizon was moving.
if (argv.includes("--harsh")) {
	console.log("harsh  : standing on the coping and letting it bite as often as it likes for 70 s");
	const bitesBefore = await page.evaluate(() => window.__villa.shark.shark.bites);
	const sample = await page.evaluate(async (seconds) => {
		const v = window.__villa;
		const bites0 = v.shark.shark.bites;
		let n = 0;
		let tilted = 0;
		let worst = 0;
		return await new Promise((resolve) => {
			const tick = setInterval(() => {
				const roll = Math.abs(v.camera.rotation.z);
				n++;
				if (roll > 0.004) tilted++;
				if (roll > worst) worst = roll;
			}, 100);
			setTimeout(() => {
				clearInterval(tick);
				resolve({
					bites: v.shark.shark.bites - bites0,
					tiltedSamples: tilted,
					samples: n,
					worstRoll: +worst.toFixed(4),
					degrees: +((worst * 57.3).toFixed(2)),
				});
			}, seconds * 1000);
		});
	}, 70);
	const rest = await page.evaluate(() => {
		const v = window.__villa;
		const ip = v.pipeline.imageProcessing;
		return {
			roll: v.camera.rotation.z,
			footing: +(v.camera.position.y - v.ground.heightAt(v.camera.position.x, v.camera.position.z) - 1.6).toFixed(4),
			vignetteWeight: +ip.vignetteWeight.toFixed(3),
			fps: Math.round(v.engine.getFps()),
			meshes: v.scene.meshes.length,
			materials: v.scene.materials.length,
			spills: Array.isArray(v.shark.blood.spills) ? v.shark.blood.spills.length : v.shark.blood.spills,
		};
	});
	console.log(
		`harsh  : ${sample.bites} more bites in 70 s (${bitesBefore} before), horizon moving on ${sample.tiltedSamples} of ${sample.samples} samples, ` +
		`worst roll ${sample.worstRoll} rad (${sample.degrees}°)\n         after: roll ${rest.roll}, footing off by ${rest.footing}, ` +
		`vignette weight ${rest.vignetteWeight}, ${rest.fps} fps, ${rest.meshes} meshes, ${rest.materials} materials, ${rest.spills} spills alive`
	);
}

await browser.close();
