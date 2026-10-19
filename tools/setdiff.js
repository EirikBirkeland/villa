// tools/setdiff.js — compare two photographed sets of the seventeen standing views, view by view.
//
//   node tools/setdiff.js 1034 1055
//
// Prints, for each view: the mean colour and luminance of the old picture, the same for the new one, and
// how much of each is over L200 or under L30. A view whose luminance moved by more than one point is
// marked, so a change that was meant for the pool can be seen not to have strayed into the garden.
// This reads pictures only; it starts no browser. `tools/photos.sh` takes the sets, `tools/bands.js`
// measures rectangles inside one picture. The two sets are counted from the same `tools/cameras.txt`,
// first camera to the given number, and the list must not have changed between them.

import fs from "node:fs";
import { PNG } from "pngjs";

const [fromOld, fromNew] = process.argv.slice(2);
if (!fromOld || !fromNew) {
	console.log("usage: node tools/setdiff.js <old set number> <new set number>");
	process.exit(0);
}

const names = fs
	.readFileSync("tools/cameras.txt", "utf8")
	.split("\n")
	.filter((line) => line.trim() && !line.trim().startsWith("#"))
	.map((line) => line.trim().split(/\s+/)[0]);

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function read(path) {
	const png = PNG.sync.read(fs.readFileSync(path));
	let r = 0;
	let g = 0;
	let b = 0;
	let over = 0;
	let under = 0;
	for (let i = 0; i < png.data.length; i += 4) {
		r += png.data[i];
		g += png.data[i + 1];
		b += png.data[i + 2];
		const l = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
		if (l > 200) over++;
		if (l < 30) under++;
	}
	const n = png.data.length / 4;
	return {
		r: Math.round(r / n),
		g: Math.round(g / n),
		b: Math.round(b / n),
		l: Math.round(lum(r / n, g / n, b / n)),
		over: ((over / n) * 100).toFixed(1),
		under: ((under / n) * 100).toFixed(1),
	};
}

names.forEach((name, i) => {
	const oldFile = `pictures/${+fromOld + i}-${name}.png`;
	const newFile = `pictures/${+fromNew + i}-${name}.png`;
	if (!fs.existsSync(oldFile) || !fs.existsSync(newFile)) {
		console.log(`${name.padEnd(12)} missing: ${fs.existsSync(oldFile) ? "" : oldFile} ${fs.existsSync(newFile) ? "" : newFile}`);
		return;
	}
	const a = read(oldFile);
	const b = read(newFile);
	const moved = Math.abs(a.l - b.l) > 1 ? "  <-- moved" : "";
	console.log(
		`${name.padEnd(12)} was (${a.r},${a.g},${a.b}) L${a.l} over200 ${a.over}% under30 ${a.under}%` +
			`   now (${b.r},${b.g},${b.b}) L${b.l} over200 ${b.over}% under30 ${b.under}%${moved}`
	);
});
