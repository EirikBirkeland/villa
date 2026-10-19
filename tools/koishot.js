// tools/koishot.js — a picture of one of the pond koi, from wherever it happens to be lying.
//
// The fish wander the basin of their own accord, so a standing camera catches one by luck and catches the
// bank more often than the fish. This one asks the running scene where a chosen fish is and which way it
// points, stands off it at a stated distance and round one side, and draws. It prints the fish's own
// measurements and how much of the frame it fills, because "plausible at three metres" is a claim about
// pixel size as much as about shape, and a fish that paints forty pixels cannot be judged at all.
//
//   node tools/koishot.js pictures/koi-3m.png                          -> fish 1, three metres, from the bank side
//   node tools/koishot.js pictures/koi-side.png --fish 2 --off 1.2 --round 1.5 --up 0.25
//   node tools/koishot.js pictures/koi-bank.png --bank                 -> the standing bank view, fish where they are
//
// `--off` is the distance in metres, `--round` the bearing off the fish's own line in radians (0 straight
// down its nose, 1.5 off the flank, 3.14 from behind) and `--up` how far above it the eye stands, so a low
// eye is a child at the rim and a high one is a visitor of six foot. `--fish` counts from 1.

import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";

const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf("--" + n); return i < 0 ? d : a[i + 1]; };
const out = a[0] && !a[0].startsWith("--") ? a[0] : "pictures/tmp-koi.png";
const which = Number(opt("fish", 1));
const off = Number(opt("off", 3));
const round = Number(opt("round", 1.35));
const up = Number(opt("up", 0.9));
const width = Number(opt("width", 1280));
const height = Number(opt("height", 720));
const wait = Number(opt("wait", 16000));
const fov = opt("fov", "0.85");
// The fish is frozen where it starts (`still=1`), which is no good for judging a fin that only shows when it
// is swung over. `--phase` is the animal's own swim angle in radians, set after the build and applied with a
// zero-length step: the tail goes wherever that phase puts it and stays there to be photographed.
const phase = opt("phase", "");
// `--live` lets the fish swim. `still=1` freezes every creature in the garden, which is the right thing for a
// picture of a SHAPE and the wrong thing for a picture of a SWIM: a tail fin that only shows when it is
// swung over, a body that bends from end to end and fins that row are not fairly judged standing still. In
// live mode the animal is left running and the eye is re-aimed at it every frame, so it holds its place in
// the frame while it goes about its business. `--shots N` then takes N frames about a third of a second
// apart, which at the pace software WebGL manages is roughly one beat of the tail.
const live = a.includes("--live");
const shots = Number(opt("shots", live ? 6 : 1));
const more = opt("more", "");
const bank = a.includes("--bank");
const base = opt("url", "http://localhost:8090/villa/index.html");

const url = `${base}${base.includes("?") ? "&" : "?"}${live ? "" : "still=1&"}float=1${bank ? "&view=-14.4,1.62,20.9,-2.11,0.02" : ""}&fov=${fov}${more ? "&" + more : ""}`;

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).split("\n")[0]));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(wait);

const report = await page.evaluate(({ which, off, round, up, bank, phase, live }) => {
	const v = window.__villa;
	if (!v || !v.koi) return { error: "no koi in the scene (is the pond built?)" };
	const list = v.koi.koi;
	const k = list[Math.min(list.length, Math.max(1, which)) - 1];
	if (!k) return { error: `the basin has ${list.length} fish in it, not ${which}` };
	k.root.computeWorldMatrix(true);
	if (phase !== "") {
		k.phase = Number(phase);
		v.koi.animate(0, 0);
	}
	k.root.computeWorldMatrix(true);
	const V3 = BABYLON.Vector3;
	// The fish's own ruler, for the table below: a unit vector along its back and the tail tip it is measured
	// from, both in the world.
	const fwdU = V3.Normalize(V3.TransformNormal(new V3(0, 0, 1), k.root.getWorldMatrix()));
	const tail = k.rear ? k.rear.getAbsolutePosition() : k.root.getAbsolutePosition();
	// Stand off the fish at the asked distance and bearing. Done as a function because in live mode it has to
	// be done again every frame: the animal swims, turns and rolls, and an eye pinned in one place loses it
	// inside a second.
	const place = () => {
		k.root.computeWorldMatrix(true);
		const mid = k.root.getAbsolutePosition();
		const fwd = V3.TransformNormal(new V3(0, 0, 1), k.root.getWorldMatrix());
		const mark = mid.add(new V3(0, k.deep * 0.25, 0));
		const yaw = Math.atan2(fwd.x, fwd.z) + round;
		const eye = mark.subtract(new V3(Math.sin(yaw) * off, 0, Math.cos(yaw) * off)).add(new V3(0, up, 0));
		// Never below the surface: an eye under water is a drowned photographer.
		eye.y = Math.max(eye.y, v.pond.plan.waterY + 0.05);
		v.camera.position.copyFrom(eye);
		const dir = mark.subtract(eye);
		v.camera.rotation.set(Math.atan2(-dir.y, Math.hypot(dir.x, dir.z)), Math.atan2(dir.x, dir.z), 0);
		// The projection below needs a camera whose matrices are up to date, and the render loop has not run
		// since the eye was moved. Without this the marks land off the picture and mean nothing.
		v.camera.update();
	};
	if (!bank) place();
	if (live && !bank) {
		const aim = () => {
			place();
			window.__koiFollow = requestAnimationFrame(aim);
		};
		window.__koiFollow = requestAnimationFrame(aim);
	}
	// What the fish is, and what each of its pieces is made of.
	const meshes = k.root.getChildMeshes();
	let tris = 0;
	const parts = [];
	for (const m of meshes) {
		tris += (m.getIndices() ? m.getIndices().length : 0) / 3;
		const box = m.getBoundingInfo().boundingBox;
		// The world middle of the piece, NOT its origin: a fin built by `fin` sits at the origin of the node it
		// hangs from and carries its shape in its own vertices, so the origin prints as the node and tells you
		// nothing — which is exactly how a fin thirty centimetres behind the tail looked like a fin on it.
		// `where` is the box middle and `at` is where it falls along the fish: 0 at the tail tip, 1 at the snout,
		// and anything outside 0..1.3 is a piece floating in the water.
		const c = V3.TransformCoordinates(box.center, m.getWorldMatrix());
		const size = box.extendSize;
		const at = V3.Dot(c.subtract(tail), fwdU) / k.long;
		parts.push({
			name: m.name.replace(`koi${which}`, ""),
			mat: m.material ? m.material.name : "-",
			where: [c.x, c.y, c.z].map((n) => n.toFixed(2)),
			at: at.toFixed(2),
			house: [size.x, size.y, size.z].map((n) => n.toFixed(3)),
		});
	}
	// Where the three body lofts lie in the world, so a fin that has wandered off the animal can be caught.
	let lo = null;
	let hi = null;
	for (const m of meshes.filter((m) => /Fore|Mid|Rear/.test(m.name))) {
		const b = m.getBoundingInfo().boundingBox;
		for (const c of [b.minimum, b.maximum]) {
			const w = V3.TransformCoordinates(c, m.getWorldMatrix());
			if (!lo) lo = w.clone();
			if (!hi) hi = w.clone();
			lo = V3.Minimize(lo, w);
			hi = V3.Maximize(hi, w);
		}
	}
	// Where the marked pieces land on the picture, so a critic can go and read the actual pixels of an eye
	// instead of guessing which bright blob is which.
	const marks = [];
	for (const m of meshes.filter((m) => /Eye|Mouth|Pec|Dorsal|Tail/.test(m.name))) {
		const p = V3.Project(m.getAbsolutePosition(), BABYLON.Matrix.Identity(),
			v.camera.getViewMatrix().multiply(v.camera.getProjectionMatrix()),
			v.camera.viewport.toGlobal(v.engine.getRenderWidth(), v.engine.getRenderHeight()));
		marks.push({ name: m.name.replace(`koi${which}`, ""), x: Math.round(p.x), y: Math.round(p.y) });
	}
	return {
		long: k.long, wide: k.wide, deep: k.deep, parts, tris, marks,
		bodyLo: [lo.x, lo.y, lo.z].map((n) => n.toFixed(2)),
		bodyHi: [hi.x, hi.y, hi.z].map((n) => n.toFixed(2)),
		where: k.root.getAbsolutePosition().asArray().map((n) => n.toFixed(2)),
		yaw: k.yaw, depth: k.depth, state: k.state,
	};
}, { which, off, round, up, bank, phase, live });

await page.waitForTimeout(1500);
const frame = (i) => (i === 0 ? out : out.replace(/\.png$/, `-f${i + 1}.png`));
for (let i = 0; i < shots; i++) {
	if (i) await page.waitForTimeout(340);
	await page.screenshot({ path: frame(i) });
}
if (shots > 1) console.log(`  ${shots} frames of the swim: ${out}, then ${[...Array(shots - 1).keys()].map((i) => frame(i + 1).split("/").pop()).join(", ")}`);
await browser.close();
if (!fs.existsSync(out)) {
	console.log(`${out} was not written`);
	process.exit(1);
}
// How much of the frame the fish actually paints: every pixel that is not the colour of water, stones or
// grass within a box round where the fish was put. A rough count, and meant as an order of size only.
const png = PNG.sync.read(fs.readFileSync(out));
const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
let warm = 0;
for (let y = 0; y < png.height; y++) {
	for (let x = 0; x < png.width; x++) {
		const [r, g, b] = at(x, y);
		if (r > g + 18 && g >= b - 10 && r > 90) warm++;
	}
}
console.log(`${out} <- ${url} [fish ${which}, ${bank ? "the standing bank view" : `${off} m off, ${round} rad round, ${up} m above`}]`);
if (report.error) { console.log("  " + report.error); process.exit(0); }
console.log(`  ${report.long} m long, ${Math.round(report.tris)} triangles, body from ${report.bodyLo.join(",")} to ${report.bodyHi.join(",")}`);
for (const p of report.parts || []) {
	console.log(`  ${p.name.padEnd(11)} ${p.mat.padEnd(9)} t=${String(p.at).padEnd(5)} at ${p.where.join(",")} half ${p.house.join(",")}`);
}
for (const m of report.marks || []) {
	console.log(`  ${m.name} on the picture at ${m.x},${m.y}`);
}
// The pixels at each mark, because a bright dot on a head may be an eye or may be the sky.
if (report.marks && report.marks.length) {
	const png = PNG.sync.read(fs.readFileSync(out));
	for (const m of report.marks) {
		const rows = [];
		for (let dy = -6; dy <= 6; dy += 4) {
			const row = [];
			for (let dx = -6; dx <= 6; dx += 4) {
				const i = (png.width * (m.y + dy) + (m.x + dx)) << 2;
				row.push(`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`);
			}
			rows.push(row.join(" | "));
		}
		console.log(`  ${m.name} pixels:\n    ${rows.join("\n    ")}`);
	}
}
console.log(`  ${warm} warm pixels in the frame (${(100 * warm / (png.width * png.height)).toFixed(2)}% of it)`);
