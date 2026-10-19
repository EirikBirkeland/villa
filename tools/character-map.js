// Print a picture as a grid of characters, so a fault can be found in a picture by a reader who cannot be shown
// the picture. Each cell is the mean colour of a block, and the character is how bright it is: space is dark,
// `@` is bright. Colour goes with it where a cell is strongly one colour — `R` for red-ish, `G` for green-ish,
// `B` for blue-ish, `W` where it is pale — so a grey frame and a dark panel in it can be told apart at a glance.
import fs from "node:fs";
import { PNG } from "pngjs";

const file = process.argv[2];
const COLS = Number(process.argv[3] || 76);
const png = PNG.sync.read(fs.readFileSync(file));
const rows = Math.max(1, Math.round((COLS * png.height) / png.width / 2));
const cw = png.width / COLS;
const ch = png.height / rows;
const ramp = " .:-=+*#%@";
const out = [];
for (let ry = 0; ry < rows; ry++) {
	let line = "";
	for (let rx = 0; rx < COLS; rx++) {
		let r = 0;
		let g = 0;
		let b = 0;
		let n = 0;
		for (let y = Math.floor(ry * ch); y < Math.floor((ry + 1) * ch); y++) {
			for (let x = Math.floor(rx * cw); x < Math.floor((rx + 1) * cw); x++) {
				const i = (y * png.width + x) * 4;
				r += png.data[i];
				g += png.data[i + 1];
				b += png.data[i + 2];
				n++;
			}
		}
		r /= n;
		g /= n;
		b /= n;
		const luma = (r + g + b) / 3;
		const mx = Math.max(r, g, b);
		const mn = Math.min(r, g, b);
		let mark = ramp[Math.min(9, Math.floor((luma / 255) * 9.99))];
		// Colour letters are useful until the whole picture is one colour — the inside of this house at half past
		// five is warm from wall to wall and every cell comes out `R`, which says nothing. `PLAIN=1` keeps only
		// the brightness, which is what you want when you are looking for the shape of a panel or an opening.
		if (!process.env.PLAIN) {
			if (mx - mn > 34) {
				if (r >= g && r >= b) mark = r - mn > 60 ? "R" : mark;
				else if (g >= r && g >= b) mark = g - mn > 60 ? "G" : mark;
				else mark = b - mn > 60 ? "B" : mark;
			} else if (mx > 205 && mn > 170) mark = "W";
		}
		line += mark;
	}
	out.push(line);
}
console.log(out.join("\n"));
