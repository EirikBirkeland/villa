// tools/duckbill.js — a close picture of the toy duck's head, and a measure of its bill.
//
// The duck turns and drifts, so a fixed camera either misses it or photographs its tail. This one asks
// the running scene which way the bill is pointing, stands off it and round one cheek, and draws. It also
// prints the bill's own measurements out of the mesh, because "it looks like a duck" and "the widest point
// is two thirds along" are the same claim made two ways, and a shape that has drifted back to a cone can
// be caught by either.
//
//   node tools/duckbill.js pictures/duckbill.png                    -> a front three-quarter look
//   node tools/duckbill.js pictures/duckside.png --round 1.5 --off 0.3
//   node tools/duckbill.js pictures/ducktop.png --round 0.5 --off 0.45 --up 0.4
//   node tools/duckbill.js pictures/duckold.png --url http://localhost:8090/villa/releases/v0.96.0/index.html
//
// `--off` is how far back the eye stands in metres, `--round` how far round the duck's own line it goes in
// radians — 0 is straight down the bill, 1.5 is off the cheek — and `--up` how far above it, so a top look
// finds the keel along the top of the bill.

import { chromium } from "playwright-core";
import fs from "node:fs";

const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf("--" + n); return i < 0 ? d : a[i + 1]; };
const out = a[0] && !a[0].startsWith("--") ? a[0] : "pictures/tmp-duckbill.png";
const off = Number(opt("off", 0.34));
const round = Number(opt("round", 0.62));
const up = Number(opt("up", 0.075));
const width = Number(opt("width", 900));
const height = Number(opt("height", 640));
const wait = Number(opt("wait", 14000));
const fov = opt("fov", "0.4");
const base = opt("url", "http://localhost:8090/villa/index.html");
// Anything else for the address bar: `--more "noshadow=1&hour=12"`.
const more = opt("more", "");
// Take parts of the duck out of the picture to see one of them on its own:
// `--hide head,body,eye` leaves the bill and nothing else.
const hide = opt("hide", "");

const url = `${base}${base.includes("?") ? "&" : "?"}still=1&float=1&duckx=-1.9&duckz=4.6&fov=${fov}${more ? "&" + more : ""}`;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).split("\n")[0]));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(wait);

const report = await page.evaluate(({ off, round, up, hide }) => {
	const v = window.__villa;
	if (!v || !v.duck) return { error: "no duck in the scene (is ?duck=0 on the address?)" };
	const root = v.duck.root;
	root.computeWorldMatrix(true);
	const bill = root.getChildMeshes().find((m) => m.name === "duckBeak");
	const nail = root.getChildMeshes().find((m) => m.name === "duckBeakNail");
	if (!bill) return { error: "the duck has no bill" };
	if (hide) {
		const gone = hide.split(",").map((s) => s.toLowerCase());
		for (const m of root.getChildMeshes()) {
			if (gone.some((g) => m.name.toLowerCase().includes(g))) m.setEnabled(false);
		}
	}
	const V3 = BABYLON.Vector3;
	const at = bill.getAbsolutePosition();
	const fwd = V3.TransformNormal(new V3(0, 0, 1), root.getWorldMatrix());
	// Aim at the middle of the bill, so the head it grows out of stays in the picture too.
	const mark = at.add(fwd.scale(0.03));
	const yaw = Math.atan2(fwd.x, fwd.z) + round;
	const eye = mark.subtract(new V3(Math.sin(yaw) * off, 0, Math.cos(yaw) * off)).add(new V3(0, up, 0));
	v.camera.position.copyFrom(eye);
	const dir = mark.subtract(eye);
	v.camera.rotation.set(Math.atan2(-dir.y, Math.hypot(dir.x, dir.z)), Math.atan2(dir.x, dir.z), 0);
	// Now the measurements, out of the mesh's own vertices.
	const size = bill.getBoundingInfo().boundingBox.extendSize.scale(2);
	// The widest section along the length, which is the number that tells a bill from a cone.
	const pos = bill.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	let best = 0, bestT = 0, top = -9, bottom = 9;
	for (let i = 0; i < pos.length; i += 3) {
		const t = pos[i + 2] / size.z;
		if (Math.abs(pos[i]) > best) { best = Math.abs(pos[i]); bestT = t; }
		top = Math.max(top, pos[i + 1]);
		bottom = Math.min(bottom, pos[i + 1]);
	}
	return {
		long: size.z * 1000, wide: size.x * 1000, tall: (top - bottom) * 1000,
		widestAt: bestT,
		tris: (bill.getIndices().length + (nail ? nail.getIndices().length : 0)) / 3,
		nail: !!nail,
	};
}, { off, round, up, hide });

await page.waitForTimeout(1500);
await page.screenshot({ path: out });
await browser.close();
if (!fs.existsSync(out)) {
	console.log(`${out} was not written`);
	process.exit(1);
}
console.log(`${out} <- ${url} [${off} m off, ${round} rad round, ${up} m above]`);
if (report.error) console.log("  " + report.error);
else console.log(`  bill ${report.long.toFixed(1)} x ${report.wide.toFixed(1)} x ${report.tall.toFixed(1)} mm, widest ${report.widestAt.toFixed(2)} of the way along, ${Math.round(report.tris)} triangles${report.nail ? " plus its nail" : ""}`);
