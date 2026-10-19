// tools/sheet.js — put several pictures into ONE picture, so a whole set of views can be looked at
// in a single read instead of seventeen.
//
//   node tools/sheet.js pictures/sheet.png pictures/2170-home.png pictures/2177-pool.png ...
//   node tools/sheet.js pictures/sheet.png --set 2170 --cols 4 --width 320
//
// --set <number> takes the seventeen standing views (tools/cameras.txt) photographed at that number,
// in the order they are listed there. --cols is how many across (default 4), --width the width in
// pixels of each cell (default 320). Each cell is labelled with the name of the view along its bottom
// edge. Nothing is corrected or shaded: it only resamples and pastes.

import fs from "node:fs";
import { PNG } from "pngjs";

const args = process.argv.slice(2);
function flag(name, dflt) {
	const i = args.indexOf(name);
	return i < 0 ? dflt : args.splice(i, 2)[1];
}
const outPath = args.shift();
if (!outPath) {
	console.log("usage: node tools/sheet.js <out.png> <in.png ...> [--set <number>] [--cols n] [--width w]");
	process.exit(0);
}
const setNumberText = flag("--set", "");
const setNumber = setNumberText === "" ? null : parseInt(setNumberText, 10);
const cols = Math.max(1, parseInt(flag("--cols", "4"), 10));
const cellWidth = Math.max(64, parseInt(flag("--width", "320"), 10));

const inputs = args.slice();
if (setNumber !== null) {
	const names = fs
		.readFileSync(new URL("cameras.txt", import.meta.url), "utf8")
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.map((line) => line.split(/\s+/)[0]);
	// tools/photos.sh photographs the set in order and puts the running picture number on each file,
	// so the first name in cameras.txt carries --set's number and every name after it is one higher.
	const found = inputs.slice();
	inputs.length = 0;
	names.forEach((name, i) => {
		const path = `pictures/${setNumber + i}-${name}.png`;
		if (fs.existsSync(path)) inputs.push(path);
		else console.log(`sheet: no ${path}`);
	});
	inputs.push(...found);
}
if (!inputs.length) {
	console.log("sheet: nothing to put in the sheet");
	process.exit(1);
}

function resample(png, w) {
	const h = Math.max(1, Math.round((w / png.width) * png.height));
	const out = new PNG({ width: w, height: h });
	const sx = png.width / w, sy = png.height / h;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
			const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
			let r = 0, g = 0, b = 0, n = 0;
			for (let yy = y0; yy < y1; yy++) {
				for (let xx = x0; xx < x1; xx++) {
					const i = (png.width * yy + xx) << 2;
					r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
				}
			}
			const o = (w * y + x) << 2;
			out.data[o] = Math.round(r / n);
			out.data[o + 1] = Math.round(g / n);
			out.data[o + 2] = Math.round(b / n);
			out.data[o + 3] = 255;
		}
	}
	return out;
}

const cells = inputs.map((path) => {
	const png = resample(PNG.sync.read(fs.readFileSync(path)), cellWidth);
	return { name: (path.match(/([^/]+)\.png$/) || [, "?"])[1].replace(/\.png$/, ""), png };
});

const label = 16; // the strip along the bottom of each cell that carries the name
const pad = 4;
const rows = Math.ceil(cells.length / cols);
const tallest = Math.max(...cells.map((cell) => cell.png.height));
const sheet = new PNG({
	width: cols * (cellWidth + pad) + pad,
	height: rows * (tallest + label + pad) + pad,
});
sheet.data.fill(255);

function paste(png, left, top) {
	for (let y = 0; y < png.height; y++) {
		if (top + y >= sheet.height) break;
		for (let x = 0; x < png.width; x++) {
			if (left + x >= sheet.width) break;
			const i = (png.width * y + x) << 2;
			const o = (sheet.width * (top + y) + left + x) << 2;
			sheet.data[o] = png.data[i];
			sheet.data[o + 1] = png.data[i + 1];
			sheet.data[o + 2] = png.data[i + 2];
			sheet.data[o + 3] = 255;
		}
	}
}

// The names are written as blocks: a 5x7 grid of dots per letter, so the sheet needs no font.
const LETTERS = {
	a: "01110,10001,10001,11111,10001,10001,10001", b: "11110,10001,10001,11110,10001,10001,11110",
	c: "01110,10001,10000,10000,10000,10001,01110", d: "11110,10001,10001,10001,10001,10001,11110",
	e: "11111,10000,10000,11110,10000,10000,11111", f: "11111,10000,10000,11110,10000,10000,10000",
	g: "01110,10001,10000,10111,10001,10001,01110", h: "10001,10001,10001,11111,10001,10001,10001",
	i: "11111,00100,00100,00100,00100,00100,11111", j: "00111,00010,00010,00010,00010,10010,01100",
	k: "10001,10010,10100,11000,10100,10010,10001", l: "10000,10000,10000,10000,10000,10000,11111",
	m: "10001,11011,10101,10101,10001,10001,10001", n: "10001,11001,11001,10101,10011,10011,10001",
	o: "01110,10001,10001,10001,10001,10001,01110", p: "11110,10001,10001,11110,10000,10000,10000",
	q: "01110,10001,10001,10001,10101,10010,01101", r: "11110,10001,10001,11110,10100,10010,10001",
	s: "01111,10000,10000,01110,00001,00001,11110", t: "11111,00100,00100,00100,00100,00100,00100",
	u: "10001,10001,10001,10001,10001,10001,01110", v: "10001,10001,10001,10001,10001,01010,00100",
	w: "10001,10001,10001,10101,10101,11011,10001", x: "10001,10001,01010,00100,01010,10001,10001",
	y: "10001,10001,01010,00100,00100,00100,00100", z: "11111,00001,00010,00100,01000,10000,11111",
	"0": "01110,10001,10011,10101,11001,10001,01110", "1": "00100,01100,00100,00100,00100,00100,01110",
	"2": "01110,10001,00001,00010,00100,01000,11111", "3": "11110,00001,00001,00110,00001,00001,11110",
	"4": "00010,00110,01010,10010,11111,00010,00010", "5": "11111,10000,11110,00001,00001,10001,01110",
	"6": "00110,01000,10000,11110,10001,10001,01110", "7": "11111,00001,00010,00100,01000,01000,01000",
	"8": "01110,10001,10001,01110,10001,10001,01110", "9": "01110,10001,10001,01111,00001,00010,01100",
	"-": "00000,00000,00000,11111,00000,00000,00000", _: "00000,00000,00000,00000,00000,00000,11111",
	" ": "00000,00000,00000,00000,00000,00000,00000",
};

function writeText(text, left, top) {
	let x = left;
	for (const ch of text.toLowerCase()) {
		const rowsText = LETTERS[ch] || LETTERS[" "];
		const lines = rowsText.split(",");
		for (let r = 0; r < 7; r++) {
			for (let c = 0; c < 5; c++) {
				if (lines[r][c] !== "1") continue;
				const o = (sheet.width * (top + r) + x + c) << 2;
				sheet.data[o] = sheet.data[o + 1] = sheet.data[o + 2] = 0;
			}
		}
		x += 6;
	}
}

cells.forEach((cell, i) => {
	const col = i % cols, row = Math.floor(i / cols);
	const left = pad + col * (cellWidth + pad);
	const top = pad + row * (tallest + label + pad);
	paste(cell.png, left, top);
	writeText(cell.name, left + 2, top + tallest + 4);
});

fs.writeFileSync(outPath, PNG.sync.write(sheet));
console.log(
	`sheet: ${cells.length} pictures into ${sheet.width}x${sheet.height} at ${cellWidth} px across each (${cols} x ${rows}) -> ${outPath}`
);
