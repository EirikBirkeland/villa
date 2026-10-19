// Weigh the held sounds: what each bed is doing at a given place and hour, and whether `M` really takes them away.
//
//   node tools/held.js
//
// The beds are local and gated, which is two ways for a bed to be wrong without any number in the code looking
// wrong: a trickle that is full level from the hedge is a wash, and a frog chorus that runs at noon is a frog in
// the wrong place. So this asks for the level at four places, by day and by night, and then mutes.
import { chromium } from "playwright-core";

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

const probe = async (hour) => {
	await p.goto(`http://localhost:8090/villa/index.html?hour=${hour}`, { waitUntil: "load", timeout: 120000 });
	await p.waitForTimeout(10000);
	await p.mouse.click(320, 180); // wake the ear
	await p.waitForTimeout(4000);
	const places = [
		["in the water", "-20.3,0.2,14.6"],
		["pond bank", "-20.3,1.6,9.6"],
		["lawn middle", "-8,1.6,2"],
		["by the house", "0,1.6,-4"],
		["stream bank", "-19.5,1.6,-8"],
	];
	const out = [];
	for (const [name, view] of places) {
		await p.goto(`http://localhost:8090/villa/index.html?hour=${hour}&view=${view},0,0`, { waitUntil: "load", timeout: 120000 });
		await p.waitForTimeout(9000);
		await p.mouse.click(320, 180);
		await p.waitForTimeout(3500);
		out.push({
			where: name,
			murmurs: await p.evaluate(() => window.__villa.sound.murmurs),
		});
	}
	// And the mute, at the pond's edge at night, where everything is going at once.
	await p.goto(`http://localhost:8090/villa/index.html?hour=${hour}&view=-20.3,1.6,9.6,0,0`, { waitUntil: "load", timeout: 120000 });
	await p.waitForTimeout(9000);
	await p.mouse.click(320, 180);
	await p.waitForTimeout(3000);
	const before = await p.evaluate(() => window.__villa.sound.murmurs);
	await p.keyboard.press("KeyM");
	await p.waitForTimeout(1500);
	const after = await p.evaluate(() => ({ muted: window.__villa.sound.muted, murmurs: window.__villa.sound.murmurs, gain: null }));
	console.log(`hour ${hour}:`);
	for (const o of out) console.log(`  ${o.where.padEnd(12)} ${JSON.stringify(o.murmurs)}`);
	console.log(`  mute at the bank: before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
};

await probe(22);
await probe(12);
await b.close();
