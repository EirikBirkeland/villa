// perch — put the raven where a picture can see it, and make it pay out a coin.
//
// The bird arrives when it feels like it, sits for a few minutes of the Villa's day, and opens its purse on a day
// boundary that comes every three of them. That is the animal, and it is useless for looking at: a picture taken
// at random is a picture of an empty roof, and a coin that falls once every eighteen minutes of walking is a coin
// nobody ever sees fall. So this sends the bird to a perch, tells it that the hour has just gone past midnight
// and that it is owed, and photographs what happens — the bird on the ridge against the sky, or a gold coin lying
// on the paving at the size it is actually found at.
//
//   node tools/perch.js pictures/raven.png --view "0,1.6,6,0,0.42"            the bird on the ridge
//   node tools/perch.js pictures/coin.png --view "-3.4,0.9,-0.6,0.9,1.2" --drop   a coin, dropped and landed
//   node tools/perch.js p.png --perch 3 --sit                                  sit still, no forced purse
//
// `--perch n` picks which of the roof spots, `--sit` leaves the purse alone, `--land` waits for the coin to stop
// falling before the picture, and `--settle ms` is how long to wait after everything is arranged.
//
// It says what the bird and the purse were asked to be and what they came out as, so a picture that shows nothing
// can be told apart from a picture of a bird that was never there.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
];

const argv = process.argv.slice(2);
const flag = (name, at) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] ?? at : null);
const has = (name) => argv.includes(name);

const out = argv.find((a) => !a.startsWith("--") && !/^\d[\d.]*$/.test(a)) || "pictures/perch.png";
const view = flag("--view", "0,1.6,7,0,0.4");
const perch = Number(flag("--perch", "1"));
const settle = Number(flag("--settle", "2500"));
const url = `http://localhost:8090/villa/?float=1&view=${view}`;

const size = (flag("--size", "1280x720") || "1280x720").split("x").map(Number);

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, `--window-size=${size[0]},${size[1]}`] });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
await page.setViewportSize({ width: size[0], height: size[1] });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 6000));

const told = await page.evaluate(
	([spot, force, land]) => {
		const v = window.__villa;
		if (!v.raven) return { error: "no raven — is the Villa built with one?" };
		v.raven.arrive(spot);
		if (force) {
			// The purse is opened the way the day opens it: by telling the bird a day has gone past and letting
			// its own reckoning decide. Writing the coin in here would be photographing the tool, not the bird.
			v.raven.notes.lastDrop = -99;
			v.raven.animate({ delta: 0.016, night: false, wrapped: true, elapsed: 0 });
		}
		return {
			perched: v.raven.perched,
			days: v.raven.days,
			coins: v.raven.coins,
			at: (() => {
				const p = v.raven.notes.coins;
				return p.length ? p[p.length - 1] : null;
			})(),
			land,
		};
	},
	[perch, !has("--sit"), has("--land")]
);
console.log("asked:", JSON.stringify(told));

// `--aim` turns the sight on the bird once it has landed on the roof, which saves guessing at a yaw and a pitch
// and getting the sign of one of them wrong, as happened here first. The convention is read off the Villa: a
// positive pitch looks DOWN at the paving, so a bird above the sight wants a negative one.
if (has("--aim")) {
	const aim = await page.evaluate(() => {
		const v = window.__villa;
		const p = v.raven.where();
		if (!p) return null;
		const c = v.camera.position;
		const dx = p.x - c.x;
		const dy = p.y - c.y;
		const dz = p.z - c.z;
		v.camera.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0);
		return { yaw: +v.camera.rotation.y.toFixed(3), pitch: +v.camera.rotation.x.toFixed(3), range: +Math.hypot(dx, dy, dz).toFixed(2) };
	});
	console.log("aimed:", JSON.stringify(aim));
}

if (has("--land")) {
	// The coin falls from the roof in the Villa's own frame loop, which in a software browser is a few frames a
	// second, so the wait is long and the picture says what it found rather than what it hoped for.
	const t0 = Date.now();
	await new Promise((resolve) => setTimeout(resolve, 7000));
	console.log(`waited ${((Date.now() - t0) / 1000).toFixed(0)}s for the coin to stop`);
} else {
	await new Promise((resolve) => setTimeout(resolve, settle));
}

// `--stoop` stands where a person stoops to pick a coin off the paving: half a metre to one side of it, a hand's length
// above the ground, and the sight laid down at the point on the ground where it fell. Only meaningful with --drop.
if (has("--stoop")) {
	const aimed = await page.evaluate(() => {
		const v = window.__villa;
		const coins = v.scene.meshes.filter((m) => m.name.startsWith("royalCoin"));
		const coin = coins[coins.length - 1];
		if (!coin) return null;
		const floor = v.ground.heightAt(coin.position.x, coin.position.z);
		const x = coin.position.x - 0.42;
		const z = coin.position.z - 0.42;
		const y = floor + 0.42;
		v.camera.position.set(x, y, z);
		const run = Math.hypot(coin.position.x - x, coin.position.z - z);
		v.camera.rotation.set(-Math.atan2(y - floor - 0.02, run), Math.atan2(coin.position.x - x, coin.position.z - z), 0);
		return { at: [coin.position.x, coin.position.y, coin.position.z], floor };
	});
	console.log("aimed:", JSON.stringify(aimed));
}

const after = await page.evaluate(() => {
	const v = window.__villa;
	const coins = v.scene.meshes.filter((m) => m.name.startsWith("royalCoin"));
	return {
		perched: v.raven.perched,
		abroad: v.raven.abroad,
		coinMeshes: coins.length,
		coinHeights: coins.map((m) => +m.position.y.toFixed(3)),
	};
});
console.log("found:", JSON.stringify(after));

await page.screenshot({ path: out });
console.log(`wrote ${out}`);
await browser.close();
