// One full day, hour by hour, from one stand: where does the Villa go wrong on the way round?
//
// A single hour tells you what that hour looks like; it cannot tell you that 05:40 is broken while 05:20 and
// 06:00 are fine. The day cycle interpolates between keys, so a bad key or a stale sky cube shows up as a step
// between one hour and the next rather than as a bad-looking picture. This walks the clock and reports, for
// each hour, what the browser painted: the mean of the whole frame, how much of it is pure black or pure
// white, what colour the strip along the top of the frame is and what is actually out there, how far the
// colour balance leans warm or cool, and what the day's own numbers were, so a jump in the picture can be
// blamed on the line that caused it.
//
// It flags, rather than judges: a frame that goes black, a sky that flips hue or whites out, and any hour
// whose mean moves more than nine units from the hour before it.
//
//   node tools/hoursweep.js ["x,y,z,yaw,pitch"] [first hour] [last hour] [step]
//
// Three traps this tool has already fallen into once, written down so they stay fallen.
//
// First, the `view` switch's pitch is the other way about from intuition: a POSITIVE pitch looks DOWN and a
// negative one looks up, which is how a "tilt at the sky" stand of +0.45 turned out to be aimed at the palm
// fronds and reported a green sky for an hour. Look up with a minus sign.
//
// Second, a ray aimed at the sky dome always hits it — the dome is a shell turned inside out around the whole
// garden — so a sky predicate answers "sky" from every direction with palms and walls in the way. Occlusion
// only comes from the ordinary pick, and the dome is not pickable, so the honest reading of "that is sky" is
// that the ordinary pick finds nothing at all.
//
// Third, no pixel coordinates are carried between the page and the picture: the engine renders at its own
// resolution and a screenshot comes back at the viewport's, and scaling one by the other and wrapping past the
// row is how a lawn once got reported as a green sky a second time.
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "fs";

const VIEW = process.argv[2] || "0,1.6,14,0,-0.03";
const FROM = process.argv[3] !== undefined ? Number(process.argv[3]) : 0;
const TO = process.argv[4] !== undefined ? Number(process.argv[4]) : 23;
const STEP = process.argv[5] ? Number(process.argv[5]) : 1;
const W = 480, H = 270;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});

const rows = [];
for (let hour = FROM; hour <= TO; hour += STEP) {
	const page = await browser.newPage({ viewport: { width: W, height: H } });
	await page.goto(`http://localhost:8090/villa/index.html?view=${VIEW}&hour=${hour}&still=1`, { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => window.__villa && window.__villa.scene.isReady(), null, { timeout: 120000 });
	await page.waitForTimeout(7000);
	const file = `/tmp/sweep-${String(hour).replace(".", "_")}.png`;
	await page.screenshot({ path: file });

		// What is along the top of the frame? The ordinary pick, and nothing else: it names the leaves and the
	// roof when they are there, and it finds nothing where the sky is, because the sky dome is not pickable.
	const ask = await page.evaluate(() => {
		const V = window.__villa;
		const d = V.day.state, l = d.lamps || { sun: 0, hemi: 0, bounce: 0 };
		const tally = {};
		for (const y of [6, 18, 34]) {
			for (const x of [40, 160, 240, 320, 440]) {
				const name = V.scene.pick(x, y)?.pickedMesh?.name || "open";
				tally[name] = (tally[name] || 0) + 1;
			}
		}
		return {
			tally,
			sun: +l.sun.toFixed(2), hemi: +l.hemi.toFixed(2), bounce: +l.bounce.toFixed(2),
			night: +(d.night || 0).toFixed(2), env: +(V.scene.environmentIntensity || 0).toFixed(3),
		};
	});
	await page.close();

	const img = PNG.sync.read(fs.readFileSync(file));
	const skyIsUp = (ask.tally.open || 0) >= 10;
	const topRows = Math.max(2, Math.round(img.height * 0.13));
	let sum = 0, black = 0, white = 0, warm = 0, cool = 0, skyR = 0, skyG = 0, skyB = 0, skyN = 0, skyL = 0, grL = 0, grN = 0;
	const groundRows = Math.round(img.height * 0.66);
	for (let r = 0; r < img.height; r++) {
		for (let c = 0; c < img.width; c++) {
			const i = (r * img.width + c) * 4;
			const R = img.data[i], G = img.data[i + 1], B = img.data[i + 2];
			const L = (R + G + B) / 3;
			sum += L;
			if (L < 5) black++;
			if (R > 250 && G > 250 && B > 250) white++;
			if (R > B + 12) warm++;
			else if (B > R + 12) cool++;
			if (skyIsUp && r < topRows) { skyR += R; skyG += G; skyB += B; skyN++; skyL += L; }
			if (r >= groundRows) { grL += L; grN++; }
		}
	}
	const n = img.width * img.height;
	const sky = skyN ? [Math.round(skyR / skyN), Math.round(skyG / skyN), Math.round(skyB / skyN)] : null;
	rows.push({
		hour, mean: +(sum / n).toFixed(1),
		black: +((100 * black) / n).toFixed(2),
		white: +((100 * white) / n).toFixed(2),
		sky, lean: +((100 * (warm - cool)) / n).toFixed(0),
		over: skyN && grN ? +((skyL / skyN) / (grL / grN)).toFixed(2) : null,
	});
	const what = sky ? `rgb(${sky.join(",")})` : "n/a";
	const named = skyIsUp ? "sky" : Object.keys(ask.tally).sort((a, b) => ask.tally[b] - ask.tally[a])[0];
	console.log(`hour ${String(hour).padEnd(5)} mean ${String(rows.at(-1).mean).padEnd(5)} black ${String(rows.at(-1).black).padEnd(5)}% white ${String(rows.at(-1).white).padEnd(5)}% top ${what.padEnd(14)} (${named}) lean ${String(rows.at(-1).lean).padEnd(4)} sky/ground ${String(rows.at(-1).over).padEnd(5)} | sun ${ask.sun} hemi ${ask.hemi} night ${ask.night} env ${ask.env}`);
}
await browser.close();

console.log("\nflags:");
const flags = [];
for (let i = 0; i < rows.length; i++) {
	const r = rows[i], prev = rows[i - 1];
	if (r.black > 6) flags.push(`hour ${r.hour}: ${r.black}% of the frame is pure black`);
	if (r.white > 0.5) flags.push(`hour ${r.hour}: ${r.white}% of the frame is blown white`);
	if (prev && Math.abs(r.mean - prev.mean) > 9) flags.push(`hour ${r.hour}: mean jumps ${prev.mean} to ${r.mean} from the hour before`);
	if (r.sky) {
		const [sr, sg, sb] = r.sky;
		if (sr > 200 && sg > 200 && sb > 200) flags.push(`hour ${r.hour}: the sky is white rgb(${r.sky.join(",")})`);
		if (sg > sb + 25) flags.push(`hour ${r.hour}: the sky is green, not blue — rgb(${r.sky.join(",")})`);
		if (sb < 30 && r.hour > 7 && r.hour < 18) flags.push(`hour ${r.hour}: the midday sky carries no blue at all — rgb(${r.sky.join(",")})`);
	}
	// The whole sky over the whole ground, in daylight hours. A garden lit by a low sun can make a wall brighter
	// than the patch of sky beside it, and that is fine; it is not fine when the ground beats the ENTIRE sky, and
	// that is what a dusk looks wrong for: the sun has crossed a long path of air and is still flooding the terrace
	// as though it were noon. Measured at 18:12 as 0.49 before the near-horizon keys were cut.
	if (r.over !== null && r.hour > 6 && r.hour < 19 && r.over < 0.6) {
		flags.push(`hour ${r.hour}: the ground is brighter than the whole sky over it (${r.over})`);
	}
}
console.log(flags.length ? flags.map((f) => `  ${f}`).join("\n") : "  none: every hour is a picture and not a fault");
