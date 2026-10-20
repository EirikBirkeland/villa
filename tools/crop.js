// Cut a rectangle out of a picture and blow it up, so a shadow edge or a seam can be looked at.
//
//   node tools/crop.js in.png out.png x y w h [scale]
import fs from "node:fs";
import { PNG } from "pngjs";

const [inFile, outFile, x, y, w, h, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg || 2);
const src = PNG.sync.read(fs.readFileSync(inFile));
const out = new PNG({ width: w * scale, height: h * scale });
for (let oy = 0; oy < out.height; oy++) {
	for (let ox = 0; ox < out.width; ox++) {
		const sx = Math.min(src.width - 1, Number(x) + Math.floor(ox / scale));
		const sy = Math.min(src.height - 1, Number(y) + Math.floor(oy / scale));
		const si = (src.width * sy + sx) << 2;
		const di = (out.width * oy + ox) << 2;
		out.data[di] = src.data[si];
		out.data[di + 1] = src.data[si + 1];
		out.data[di + 2] = src.data[si + 2];
		out.data[di + 3] = 255;
	}
}
fs.writeFileSync(outFile, PNG.sync.write(out));
console.log(`${outFile} <- ${inFile} at ${x},${y} ${w}x${h} at ${scale}x`);
