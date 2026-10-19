// Puts two pictures side by side as one picture, so a before and an after can be judged together
// instead of by flipping between two files. The Villa's own before-and-after: the same camera, twice.
//
//   node tools/pair.js pictures/2539-grass.png pictures/2602-grass.png pictures/s64-grass-pair.png
//
// The two pictures are scaled to the height of the shorter one, so a 1280x720 and a 640x360 of the
// same view still line up. A pale rule divides them. Nothing here measures anything: compare.js does
// that in numbers. This is only for the eye.

import fs from "fs";
import { PNG } from "pngjs";

const [leftFile, rightFile, out, gapArg] = process.argv.slice(2);
if (!leftFile || !rightFile || !out) {
	console.log("usage: node tools/pair.js <left.png> <right.png> <out.png> [rule width]");
	process.exit(1);
}
const gap = Number(gapArg) || 6;
const a = PNG.sync.read(fs.readFileSync(leftFile));
const b = PNG.sync.read(fs.readFileSync(rightFile));
const h = Math.min(a.height, b.height);
const w = (img) => Math.max(1, Math.round((img.width * h) / img.height));
const aw = w(a);
const bw = w(b);
const dst = new PNG({ width: aw + gap + bw, height: h });

const blit = (img, dw, ox) => {
	const sy = Math.round((img.height / h) * 1024);
	const sx = Math.round((img.width / dw) * 1024);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < dw; x++) {
			const s = ((y * sy) >> 10) * img.width + ((x * sx) >> 10);
			const d = (y * dst.width + ox + x) << 2;
			dst.data[d] = img.data[s << 2];
			dst.data[d + 1] = img.data[(s << 2) + 1];
			dst.data[d + 2] = img.data[(s << 2) + 2];
			dst.data[d + 3] = 255;
		}
	}
};
blit(a, aw, 0);
blit(b, bw, aw + gap);
for (let y = 0; y < h; y++) {
	for (let x = aw; x < aw + gap; x++) {
		const d = (y * dst.width + x) << 2;
		dst.data[d] = dst.data[d + 1] = dst.data[d + 2] = 226;
		dst.data[d + 3] = 255;
	}
}
fs.writeFileSync(out, PNG.sync.write(dst));
console.log(`${leftFile} | ${rightFile} -> ${out}  (${dst.width}x${dst.height})`);
