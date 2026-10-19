// Photograph the pool at a few urls and print what the water patch of the frame came out as.
// Session tool, not part of the Villa.
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import fs from "node:fs";
import { requireHeadroom } from "./headroom.js";
requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan"];
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: [...flags, "--window-size=1280,720"] });

function measure(file, box) {
	const png = PNG.sync.read(fs.readFileSync(file));
	let r = 0,
		g = 0,
		b = 0,
		n = 0,
		hi = 0,
		hiRGB = null,
		blown = 0;
	for (let y = box[1]; y < box[3]; y += 2) {
		for (let x = box[0]; x < box[2]; x += 2) {
			const o = (png.width * y + x) << 2;
			r += png.data[o];
			g += png.data[o + 1];
			b += png.data[o + 2];
			const l = 0.2126 * png.data[o] + 0.7152 * png.data[o + 1] + 0.0722 * png.data[o + 2];
			if (l > hi) {
				hi = l;
				hiRGB = [png.data[o], png.data[o + 1], png.data[o + 2]];
			}
			if (l > 240) blown++;
			n++;
		}
	}
	return `rgb ${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)} L${Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) / n)} brightest ${hiRGB.join(",")} over240 ${((blown / n) * 100).toFixed(1)}%`;
}

const VIEWS = [
	["home", "2.4,1.74,10.5,3.2,0.06", [40, 470, 1240, 700]],
	["pool", "0,2.1,-1.5,0,0.1", [200, 500, 1100, 690]],
];

const cases = process.argv.slice(2);
if (!cases.length) cases.push("");

let i = 0;
for (const extra of cases) {
	for (const [viewName, view, box] of VIEWS) {
		const page = await browser.newPage();
		await page.setViewportSize({ width: 1280, height: 720 });
		const errs = [];
		page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));
		page.on("console", (m) => {
			if (/error|compile|unable|fail|shader/i.test(m.text())) errs.push(`CONSOLE ${m.text().slice(0, 200)}`);
		});
		const url = `http://localhost:8090/villa/index.html?view=${view}&float=1&${extra.replace(/^\?/, "")}`;
		await page.goto(url, { waitUntil: "load", timeout: 120000 });
		await new Promise((r) => setTimeout(r, 5500));
		const out = `pictures/tmp-wv-${i}.png`;
		await page.screenshot({ path: out });
		console.log(`${(extra || "as built").padEnd(22)} ${viewName.padEnd(5)} ${measure(out, box)}${errs.length ? "  " + errs.join(" | ") : ""}`);
		await page.close();
		i++;
	}
}
await browser.close();
