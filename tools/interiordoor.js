// Is the back door a door on the side the room looks at?
//
// A picture is not enough for this: the room is dim and a screenshot cannot tell a boarded door from a
// cupboard. So this puts the visitor in the room, asks the scene what is under the middle of the door and
// under the ring either side of it, and reads back what the picture actually painted there — the leaf
// should be warm timber, the ring either side of it should be near black, and the plaster beside that
// should be the palest thing in the frame.
//
//   node tools/interiordoor.js [outfile]
import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";

const OUT = process.argv[2] || "pictures/s112-back-door-from-inside.png";
const W = 900, H = 560;
const VIEWS = [
	{ name: "at the door", view: "-2.5,2.3,-9.0,3.1416,0.02" },
	{ name: "from the middle of the room", view: "-1.2,2.3,-6.0,3.1416,0.04" },
];
const eye = (v) => v.split(",").map(Number);

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});
fs.mkdirSync(OUT.replace(/\/[^/]*$/, ""), { recursive: true });

for (const { name, view } of VIEWS) {
	const page = await browser.newPage({ viewport: { width: W, height: H } });
	const errs = [];
	page.on("pageerror", (e) => errs.push(e.message));
	await page.goto(`http://localhost:8090/villa/index.html?view=${view}&hour=17.5`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(20000);
	// Where the leaf, the ring and the plaster land on the screen, found by projecting the world points
	// rather than guessing at pixels: the leaf's face, 5 cm inside each jamb, and the plaster a metre out.
	const probe = await page.evaluate(() => {
		const V = window.__villa;
		const at = (x, y, z) => {
			const p = BABYLON.Vector3.Project(
				new BABYLON.Vector3(x, y, z),
				BABYLON.Matrix.Identity(),
				V.scene.getTransformMatrix(),
				V.camera.viewport.toGlobal(V.engine.getRenderWidth(), V.engine.getRenderHeight())
			);
			const r = V.scene.pick(p.x, p.y, (m) => m.isPickable !== false);
			const s = V.engine.getRenderingCanvas();
			const px = Math.round((p.x / V.engine.getRenderWidth()) * s.width);
			const py = Math.round((p.y / V.engine.getRenderHeight()) * s.height);
			return { x: px, y: py, mesh: r?.pickedMesh?.name || "nothing" };
		};
		return {
			leaf: at(-2.5, 1.5, -11.585),
			ringWest: at(-3.065, 1.5, -11.585),
			ringEast: at(-1.935, 1.5, -11.585),
			belowHead: at(-2.5, 2.775, -11.585),
			plaster: at(-4.0, 1.5, -11.585),
			fps: Math.round(V.engine.getFps()),
		};
	});
	const file = `/tmp/door-${name.replace(/[^a-z]+/g, "")}.png`;
	await page.screenshot({ path: file });
	const img = PNG.sync.read(fs.readFileSync(file));
	const rgb = (p) => {
		const o = (Math.round(p.y) * img.width + Math.round(p.x)) * 4;
		return [img.data[o], img.data[o + 1], img.data[o + 2]];
	};
	const luma = (c) => Math.round((c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000);
	console.log(`--- ${name}`);
	for (const k of ["leaf", "ringWest", "ringEast", "belowHead", "plaster"]) {
		const p = probe[k];
		const c = rgb(p);
		console.log(`   ${k.padEnd(10)} ${p.mesh.padEnd(22)} rgb (${c.join(",")})  L${luma(c)}`);
	}
	if (name === "at the door") {
		fs.copyFileSync(file, OUT);
		console.log(`   picture: ${OUT}  fps ${probe.fps}  page errors: ${errs.length ? errs.join("; ") : "none"}`);
	} else {
		console.log(`   fps ${probe.fps}  page errors: ${errs.length ? errs.join("; ") : "none"}`);
	}
	await page.close();
}
await browser.close();
