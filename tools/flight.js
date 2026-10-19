// flight — does the space bar work, and does the ground still work afterwards?
//
// The Villa lets a visitor tap space to leave the ground and tap it again to fall back. That is a
// claim about movement, and movement is only proved by moving. This loads the page in a real
// browser, presses the key, holds a direction, and reads where the camera actually got to.
//
//   node tools/flight.js            -> the whole set of questions
//   node tools/flight.js --slow     -> longer key holds, for a machine drawing at 3 fps
//
// Each check prints PASS or FAIL and the numbers it decided on. Nothing here is a picture: for
// what the Villa looks like from the air, photograph it (tools/cameras.txt).

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

const slow = process.argv.includes("--slow");
const HOLD = slow ? 4000 : 2000;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await page.waitForFunction("window.__villa && window.__villa.walk", null, { timeout: 120000 });

/** Where the camera is, whether it is off the ground, and how high the ground under it is. */
const here = () =>
	page.evaluate(() => {
		const { camera, walk, ground } = window.__villa;
		return {
			x: +camera.position.x.toFixed(2),
			y: +camera.position.y.toFixed(2),
			z: +camera.position.z.toFixed(2),
			floor: +ground.heightAt(camera.position.x, camera.position.z).toFixed(2),
			flying: walk.flying(),
			note: document.querySelector("#plate .note").textContent,
		};
	});

const stand = (x, y, z, yaw = 0, pitch = 0) =>
	page.evaluate(
		(a) => {
			const { camera } = window.__villa;
			camera.position.set(a[0], a[1], a[2]);
			camera.rotation.set(a[4], a[3], 0);
		},
		[x, y, z, yaw, pitch]
	);

const point = (pitch) => page.evaluate((p) => void (window.__villa.camera.rotation.x = p), pitch);

const tapSpace = async () => {
	await page.keyboard.press("Space");
	await new Promise((resolve) => setTimeout(resolve, 300));
};

const hold = async (key, ms) => {
	await page.keyboard.down(key);
	await new Promise((resolve) => setTimeout(resolve, ms));
	await page.keyboard.up(key);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;
let total = 0;
const check = (name, ok, detail) => {
	total++;
	if (!ok) failures++;
	console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
};

const start = await here();
check("arrives standing on something", !start.flying && Math.abs(start.y - (start.floor + 1.6)) < 0.1, `y ${start.y}, floor ${start.floor} + 1.6`);

// 1. One tap lifts you and does nothing else.
await tapSpace();
const lifted = await here();
check("space means off the ground", lifted.flying && Math.abs(lifted.y - start.y) < 0.2, `y ${lifted.y} after the tap (was ${start.y})`);
check("the plate answers the tap", lifted.note !== start.note, `"${start.note}" -> "${lifted.note}"`);

// 2. Look up, press forward, and you climb.
await point(-0.7);
await hold("KeyW", HOLD);
const climbed = await here();
check("looking up and forward climbs", climbed.y > lifted.y + 1, `y ${lifted.y} -> ${climbed.y}`);
check("and stays under the sky", climbed.y < 220, `y ${climbed.y}`);

// 3. Over the water: the same head-start walking, and flying, going north from the paving.
//    The walk's keep-off rectangles stop a walker at the pool's edge; a flyer is let through.
await point(0);
await page.evaluate(() => window.__villa.walk.fly(false));
await stand(0, 1.7, 7, Math.PI);
await hold("KeyW", HOLD);
const walked = await here();
await stand(0, 1.7, 7, Math.PI);
await page.evaluate(() => window.__villa.walk.fly(true));
const flyStart = await here();
await hold("KeyW", HOLD);
const flew = await here();
check("a flyer goes where a walker is stopped", flew.z < walked.z - 1, `walker stopped at z ${walked.z}, flyer reached z ${flew.z} from z ${flyStart.z}`);
check("a flyer hangs where told", Math.abs(flew.y - flyStart.y) < 0.6, `y ${flyStart.y} -> ${flew.y} with a level eye`);

// 4. Nose down and hold forward: the grass stops a dive, it does not swallow it.
await stand(0, 14, 16, 0, 1.0);
await hold("KeyW", HOLD * 2);
const dived = await here();
check("the ground stops a dive", dived.y >= dived.floor + 0.25 && dived.y < dived.floor + 1, `y ${dived.y}, ground ${dived.floor}`);

// 5. A second tap gives gravity back and the floor catches you.
await stand(0, 26, 16, 0, 0);
await tapSpace();
const offGround = await here();
check("a second tap is the ground's again", !offGround.flying, `flying ${offGround.flying}`);
await wait(4500);
const landed = await here();
check("and you come down onto it", Math.abs(landed.y - (landed.floor + 1.6)) < 0.15, `y ${offGround.y} -> ${landed.y}, floor ${landed.floor}`);
check("and the plate says so", landed.note === start.note, `"${landed.note}"`);

// 6. R lands you wherever you were.
await tapSpace();
await page.evaluate(() => void (window.__villa.camera.position.y = 20));
await page.keyboard.press("KeyR");
await wait(1500);
const reset = await here();
check("R puts you back on your feet", !reset.flying && reset.z > 9 && Math.abs(reset.y - (reset.floor + 1.6)) < 0.15, `y ${reset.y}, z ${reset.z}`);

console.log(failures ? `${failures} of ${total} did not pass` : `all ${total} passed`);
await browser.close();
process.exit(failures ? 1 : 0);
