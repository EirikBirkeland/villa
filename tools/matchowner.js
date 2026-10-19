// Which view is this picture? A way to answer that without eyes.
//
// The owner sends a photograph of a fault and no camera. Matching it by guessing at stands wastes an
// afternoon, so this measures the picture instead: it squeezes the owner's picture down to a coarse grid of
// average colours — twelve across, eight down, which is about how much a view is *made of* — and does the
// same to a picture of the Villa from each candidate stand, at several hours of day. Then it scores each
// candidate by how far its grid sits from the owner's, cell by cell, and prints the closest stands with the
// cells that disagree.
//
// The grid is deliberately coarse. A photograph and this Villa will never agree at a pixel: the drawing is
// softer, the exposure is different, and the visitor's head is in a different place. What does agree, and
// strongly, is which colours are where — sky above, lawn below, a dark panel in the middle of a pale wall.
//
//   node tools/matchowner.js <picture.png> [candidates|all] [hours]
import fs from "node:fs";
import { PNG } from "pngjs";
import { chromium } from "playwright-core";

const PICTURE = process.argv[2] || "owner-flickering-wall.png";
const WHICH = process.argv[3] || "owners";
const HOURS = (process.argv[4] || "10,13,16,18").split(",").map(Number);
const W = 620, H = 470; // the owner's picture is 2283x1729, a little taller in proportion than ours
const COLS = 12, ROWS = 8;

// The standing cameras, plus the places a fault like "a panel on the side of the house" would be seen from,
// and the inside of the house in case the panel is indoors. Named in tools/cameras.txt where they are permanent.
const STANDING = fs
	.readFileSync("tools/cameras.txt", "utf8")
	.split("\n")
	.filter((l) => l.trim() && !l.startsWith("#"))
	.map((l) => l.trim().split(/\s+/))
	.map(([name, view]) => ({ name, view }));
const EXTRA = [
	{ name: "room back door", view: "-2.5,2.3,-8,3.1416,0.05" },
	{ name: "room west", view: "-6,2.3,-7,1.57,0" },
	{ name: "room east", view: "6,2.3,-7,-1.57,0" },
	{ name: "rear left", view: "-8,1.6,-18,0.5,0.06" },
	{ name: "rear right", view: "9,1.6,-18,-0.4,0.06" },
	{ name: "east side", view: "12,1.6,-8,-1.57,0" },
	{ name: "west side", view: "-13,1.6,-6,1.57,0" },
	{ name: "pool looking back", view: "0,1.4,2,3.1416,0.06" },
	{ name: "near back door", view: "-2.5,1.6,-15,0,0.06" },
];
const OWNERS = [
	{ name: "rear", view: "0,1.6,-19,0,0.06" },
	{ name: "rearup", view: "0,1.6,-21,0,-0.35" },
	{ name: "rearcorner", view: "-15,1.6,-20,0.66,0.05" },
	{ name: "backstore", view: "5.6,1.6,-19,0,-0.14" },
	{ name: "east side", view: "12,1.6,-8,-1.57,0" },
	{ name: "west side", view: "-13,1.6,-6,1.57,0" },
	{ name: "near back door", view: "-2.5,1.6,-15,0,0.06" },
	{ name: "rear left", view: "-8,1.6,-18,0.5,0.06" },
	{ name: "rear right", view: "9,1.6,-18,-0.4,0.06" },
	{ name: "room back door", view: "-2.5,2.3,-8,3.1416,0.05" },
];
const VIEWS = WHICH.endsWith(".txt")
	// A file of candidates to close in on one part of the picture: the name and the stand, tab or space.
	? fs
			.readFileSync(WHICH, "utf8")
			.split("\n")
			.filter((l) => l.trim() && !l.startsWith("#"))
			.map((l) => { const [name, view] = l.trim().split(/\s+/); return { name, view }; })
	: WHICH === "all" ? [...STANDING, ...EXTRA]
	: WHICH === "owners" ? OWNERS
	: OWNERS.slice(0, Number(WHICH));

// Squeeze a picture to ROWS x COLS average colours.
function grid(img) {
	const out = [];
	for (let r = 0; r < ROWS; r++) {
		const row = [];
		for (let c = 0; c < COLS; c++) {
			const x0 = Math.floor((c * img.width) / COLS), x1 = Math.max(x0 + 1, Math.floor(((c + 1) * img.width) / COLS));
			const y0 = Math.floor((r * img.height) / ROWS), y1 = Math.max(y0 + 1, Math.floor(((r + 1) * img.height) / ROWS));
			let n = 0, sr = 0, sg = 0, sb = 0;
			for (let y = y0; y < y1; y += 4) {
				for (let x = x0; x < x1; x += 4) {
					const o = (y * img.width + x) * 4;
					sr += img.data[o]; sg += img.data[o + 1]; sb += img.data[o + 2]; n++;
				}
			}
			row.push([sr / n, sg / n, sb / n]);
		}
		out.push(row);
	}
	return out;
}
const score = (a, b) => {
	let s = 0, n = 0;
	for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
		for (let k = 0; k < 3; k++) s += Math.abs(a[r][c][k] - b[r][c][k]), n++;
	}
	return s / n;
};

const owner = grid(PNG.sync.read(fs.readFileSync(PICTURE)));
console.log(`${PICTURE} squeezed to ${COLS}x${ROWS}; middle cells:`);
for (const [r, label] of [[3, "row 4"], [4, "row 5"]]) {
	console.log("   " + label + ": " + owner[r].map((c) => `(${c.map(Math.round).join(",")})`).join(" "));
}

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
const results = [];
for (const v of VIEWS) {
	for (const hour of HOURS) {
		const page = await browser.newPage({ viewport: { width: W, height: H } });
		await page.goto(`http://localhost:8090/villa/index.html?view=${v.view}&hour=${hour}`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(15000);
		const file = `/tmp/match-${v.name.replace(/\W+/g, "")}-${hour}.png`;
		await page.screenshot({ path: file });
		const g = grid(PNG.sync.read(fs.readFileSync(file)));
		results.push({ name: v.name, view: v.view, hour, score: score(owner, g), grid: g });
		await page.close();
	}
}
await browser.close();
results.sort((a, b) => a.score - b.score);
console.log(`\n${results.length} candidate views scored, closest first (lower is nearer):`);
for (const r of results.slice(0, 8)) {
	console.log(`   ${r.score.toFixed(1).padStart(5)}  ${r.name.padEnd(18)} hour ${String(r.hour).padEnd(5)} ${r.view}`);
}
const best = results[0];
console.log(`\nclosest is ${best.name} at hour ${best.hour}; where it disagrees most:`);
const cells = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
	let d = 0;
	for (let k = 0; k < 3; k++) d += Math.abs(owner[r][c][k] - best.grid[r][c][k]);
	cells.push({ r, c, d: d / 3, owner: owner[r][c].map(Math.round), villa: best.grid[r][c].map(Math.round) });
}
for (const c of cells.sort((a, b) => b.d - a.d).slice(0, 6)) {
	console.log(`   row ${c.r + 1} col ${c.c + 1}: owner (${c.owner.join(",")}) against villa (${c.villa.join(",")})`);
}
