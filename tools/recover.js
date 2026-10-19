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
//   node tools/recover.js --mouse               weigh the mouse as well: the lock by default, a loose mouse
//                                             turning the sight, a stale move thrown away, a drag still
//                                             working after the lock goes back, and ?lock=0 doing the opposite
//
// What it prints is the answer to one question: does a second of holding `W` take the visitor as far, in the
// same direction, at the same height, as it did before? Plus what the camera and the vignette were left holding
// when all of it was over, which ought to be nothing at all.

import { chromium } from "playwright-core";

/** Radians to degrees, applied in ONE place: twice applied is how a 20.85 degree turn got printed as 1194.9. */
const deg = (r) => Number(r.toFixed(2));
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

/**
 * Look round the way a person does, and say whether the mouse is obeyed when it should be and ignored when it
 * should not be. This Villa is a first-person one by default: the first click takes a pointer lock and the
 * sight then follows the hand with no button held. Four things are weighed, none of them about the shark:
 *
 * 1. A click takes the lock — that is the default the master asked for, and it has to be measured and not hoped.
 * 2. With the button UP the sight turns, and by about the amount the hand moved: 140 pixels at the Villa's own
 *    0.0026 radians to the pixel is 20.9 degrees.
 * 3. A movement that arrives after a long gap — an alt-tab, a stall, a lock taken back — is thrown away.
 * 4. When the browser takes the lock back, the sight stops following the loose mouse at once, and a drag with
 *    the button down still turns it. A lost lock may cost the habit, not the Villa.
 *
 * A caution for whoever reads the numbers next: an early version of this printed 1194.9 degrees for a 140 pixel
 * sweep and I took it for the browser handing out nonsense deltas under a lock. It was my own arithmetic — the
 * turn was already in degrees and was converted a second time on the way to the screen. The real answer was
 * 20.85 degrees, which is the correct one. So every number below is converted exactly once, by `deg`.
 */
const TURN = 0.0026; // radians to the pixel, as written in src/main.js

async function lookTest(label) {
	const read = () => page.evaluate(() => {
		const c = window.__villa.camera.rotation;
		return { yaw: c.y, pitch: c.x, roll: c.z, locked: document.pointerLockElement !== null };
	});
	const settle = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
	// Leave the sight as it was found: the walking is measured along the heading the sight points at, and a
	// mouse test that spins the world round measures a walk in the wrong direction and calls it a fault.
	const start = await read();
	// 1. One click, and the browser's mouse belongs to the Villa.
	await page.mouse.move(640, 360);
	await page.mouse.down();
	await page.mouse.up();
	await settle(200);
	const clicked = await read();
	// 2. The hand moves and nothing is held down.
	await page.mouse.move(640, 360);
	await page.mouse.move(780, 430, { steps: 6 });
	await settle();
	const loose = await read();
	// 3. The mouse is left alone long enough to be a stranger, then jumps across the picture.
	await settle(460);
	await page.mouse.move(300, 190, { steps: 1 });
	await settle();
	const stale = await read();
	// 4. The lock goes back to the browser, however it was taken; then a drag, button down.
	await page.evaluate(() => document.exitPointerLock && document.exitPointerLock());
	await settle(320);
	const released = await read();
	await page.mouse.move(500, 300);
	await page.mouse.down();
	await page.mouse.move(640, 370, { steps: 6 });
	await settle();
	const dragged = await read();
	await page.mouse.up();
	// And a loose mouse with nothing held must turn nothing — but only once the lock is back with the browser,
	// because the drag's own click took it again (that is what a click does here), and under a lock a loose mouse
	// OUGHT to turn the sight. Asking the question with the lock still held measures the wrong thing.
	await page.evaluate(() => document.exitPointerLock && document.exitPointerLock());
	await settle(320);
	const letGo = await read();
	await page.mouse.move(300, 200, { steps: 4 });
	await settle();
	const afterUp = await read();
	// Put the sight back for the walking that follows.
	await page.evaluate((r) => {
		window.__villa.camera.rotation.x = r.pitch;
		window.__villa.camera.rotation.y = r.yaw;
	}, { yaw: start.yaw, pitch: start.pitch });
	const want = 140 * TURN * 57.2958;
	const looseTurn = deg((loose.yaw - clicked.yaw) * 57.2958);
	const staleTurn = deg((stale.yaw - loose.yaw) * 57.2958);
	const staleDip = deg((stale.pitch - loose.pitch) * 57.2958);
	const dragTurn = deg((dragged.yaw - released.yaw) * 57.2958);
	const looseAfterUp = deg((afterUp.yaw - letGo.yaw) * 57.2958);
	console.log(
		`${label}: click ${clicked.locked ? "TOOK the lock" : "left the mouse free"}; a loose mouse turned ` +
		`${looseTurn}° against the ${want.toFixed(2)}° the hand moved; a stale move turned ${staleTurn}° and dipped ` +
		`${staleDip}°; once the lock went back a drag turned ${dragTurn}°; with the lock given back and nothing held a loose mouse turned ` +
		`${looseAfterUp}°; roll ${stale.roll}`
	);
	return {
		lockByDefault: clicked.locked,
		looseMouseTurns: Math.abs(looseTurn - want) < want * 0.35,
		staleIgnored: Math.abs(staleTurn) < 0.4 && Math.abs(staleDip) < 0.4,
		dragWorks: Math.abs(dragTurn - want) < want * 0.35,
		looseAfterUpIgnored: Math.abs(looseAfterUp) < 0.4,
		roll: stale.roll,
	};
}

/**
 * The other control, on a page that asks for it: `?lock=0` leaves the browser's mouse alone, so the sight only
 * turns while a button is held, and a sweep with nothing held must turn it nothing at all.
 */
async function dragTest() {
	const other = await browser.newPage();
	await other.goto(`http://localhost:8090/villa/?lock=0&view=${view}`, { waitUntil: "load", timeout: 120000 });
	await new Promise((resolve) => setTimeout(resolve, 6000));
	const read = () => other.evaluate(() => {
		const c = window.__villa.camera.rotation;
		return { yaw: c.y, pitch: c.x, locked: document.pointerLockElement !== null };
	});
	const settle = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
	const start = await read();
	await other.mouse.move(500, 300);
	await other.mouse.down();
	await other.mouse.move(640, 370, { steps: 6 });
	await settle();
	const dragged = await read();
	await other.mouse.up();
	await other.mouse.move(500, 300, { steps: 2 });
	await other.mouse.move(300, 180, { steps: 10 });
	await settle();
	const loose = await read();
	await other.close();
	const want = 140 * TURN * 57.2958;
	const dragTurn = deg((dragged.yaw - start.yaw) * 57.2958);
	const looseTurn = deg((loose.yaw - dragged.yaw) * 57.2958);
	console.log(
		`?lock=0: ${loose.locked ? "the click TOOK the lock, which is wrong" : "the mouse stayed free"}; a drag turned ` +
		`${dragTurn}° against the ${want.toFixed(2)}° the hand moved; a loose mouse turned ${looseTurn}°`
	);
	return {
		noLock: !loose.locked,
		dragWorks: Math.abs(dragTurn - want) < want * 0.35,
		looseIgnored: Math.abs(looseTurn) < 0.4,
	};
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

// The mouse, weighed before the animal is even involved: what the lock is worth by default, what a loose mouse
// is worth, and what a stale movement must NOT be able to do. This runs before the `--nowalk` exit so that a
// run which is not interested in the shark can still be asked whether the sight obeys the hand.
const lookFirst = argv.includes("--mouse") ? await lookTest("before   ") : null;
const dragOnly = argv.includes("--mouse") ? await dragTest() : null;

if (noWalk) {
	const sightClean = (!lookFirst || (lookFirst.lockByDefault && lookFirst.looseMouseTurns && lookFirst.staleIgnored && lookFirst.dragWorks && lookFirst.looseAfterUpIgnored))
		&& (!dragOnly || (dragOnly.noLock && dragOnly.dragWorks && dragOnly.looseIgnored));
	console.log(`verdict: ${sightClean ? "the sight is the mouse's servant, locked by default and draggable on request" : "THE SIGHT IS NOT THE MOUSE'S SERVANT"}`);
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
const lookAfter = argv.includes("--mouse") ? await lookTest("after bite") : null;
const after = await walk("after    ");

const back = after.gone >= first.gone * 0.85;
const sightClean = (!lookFirst || !lookAfter || (lookAfter.lockByDefault && lookAfter.looseMouseTurns && lookAfter.staleIgnored && lookAfter.dragWorks))
	&& (!dragOnly || (dragOnly.noLock && dragOnly.dragWorks && dragOnly.looseIgnored));
console.log(
	`verdict: ${after.state.rollExactlyZero ? "camera straight again" : "CAMERA LEFT TILLED"}; ` +
	`${Math.abs(after.state.footing) < 0.02 ? "standing on the ground like before" : "NOT ON THE GROUND"}; ` +
	`${back ? "walks as far as before" : `WALKS SHORT — ${after.gone.toFixed(2)} m against ${first.gone.toFixed(2)} m`}; ` +
	`${argv.includes("--mouse") ? (sightClean ? "and the sight is the mouse's servant, locked by default and draggable on request" : "AND THE SIGHT IS NOT THE MOUSE'S SERVANT") : ""}`
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
