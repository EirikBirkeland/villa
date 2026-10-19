// diffgrid — where two pictures of one view differ, in a coarse grid.
//
// `tools/compare.js` says how far apart two pictures are overall and `tools/diffbbox.js` names the
// single biggest change; neither says WHERE the change sits when the whole frame jitters a little
// (the film grain moves every pixel by a point or two between loads). This counts, for each cell of a
// grid, how many pixels changed by more than a threshold, so the answer to "where does that doorway
// actually land in the frame?" is a shape and not a shrug.
//
//   node tools/diffgrid.js pictures/a.png pictures/b.png [--over 40] [--grid 40x22]
import { PNG } from "pngjs";
import fs from "node:fs";

const argv = process.argv.slice(2);
const reads = [];
for (let i = 0; i < argv.length; i++) {
	if (argv[i].startsWith("--")) { i++; continue; } // the switch's own value
	reads.push(argv[i]);
}
const [fa, fb] = reads;
const flag = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const over = Number(flag("over", 40));
const [gx, gy] = flag("grid", "40x22").split("x").map(Number);

const A = PNG.sync.read(fs.readFileSync(fa));
const B = PNG.sync.read(fs.readFileSync(fb));
const cw = A.width / gx;
const ch = A.height / gy;
const cells = new Array(gx * gy).fill(0);
const sum = new Array(gx * gy).fill(0);
let total = 0;
for (let y = 0; y < A.height; y++) {
	for (let x = 0; x < A.width; x++) {
		const i = (A.width * y + x) << 2;
		const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
		if (d <= over) continue;
		const c = Math.min(gx - 1, Math.floor(x / cw)) + Math.min(gy - 1, Math.floor(y / ch)) * gx;
		cells[c]++;
		sum[c] += d;
		total++;
	}
}
console.log(`${fa} against ${fb}: ${total} pixels changed by more than ${over} summed channels`);
const glyph = (n) => (n === 0 ? "." : n < 4 ? ":" : n < 12 ? "-" : n < 30 ? "+" : n < 60 ? "*" : "#");
for (let r = 0; r < gy; r++) {
	const row = [];
	for (let c = 0; c < gx; c++) row.push(glyph(cells[r * gx + c]));
	console.log(`  ${String(Math.round(r * ch)).padStart(4)} ${row.join("")} ${String(Math.round((r + 1) * ch)).padStart(4)}`);
}
let best = 0;
for (let i = 0; i < cells.length; i++) if (cells[i] > cells[best]) best = i;
const bx = best % gx;
const by = Math.floor(best / gx);
console.log(
	`  busiest cell: x ${Math.round(bx * cw)}..${Math.round((bx + 1) * cw)} y ${Math.round(by * ch)}..${Math.round((by + 1) * ch)} — ${cells[best]} pixels, mean change ${(sum[best] / cells[best]).toFixed(1)}`,
);
