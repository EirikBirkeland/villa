// What stands in the way of a proposed watercourse?
//
//	node tools/streamroute.js "-20.3,12.9 -21.4,1.5 -19.3,-21.4" [clearance metres]
//
// The course is a list of x,z pairs. The tool boots the Villa with the stream itself switched off, walks the
// proposed centre line at 20 centimetres, and answers three things the garden cares about: which meshes stand
// inside the clearance (so a palm, a lamp or a wall is about to be standing in the water), whether the walk
// the visitor takes would be blocked along the bank, and whether the line stays inside the boundary hedge.
import { chromium } from "playwright-core";

const arg = process.argv[2] || "-20.3,12.9 -21.4,1.5 -19.3,-21.4";
const clearance = Number(process.argv[3] || 2.4);
const course = arg.trim().split(/\s+/).map((p) => {
	const [x, z] = p.split(",").map(Number);
	return { x, z };
});

const browser = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:8090/villa/index.html?stream=0", { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(12000);

const out = await page.evaluate(
	async ({ course, clearance }) => {
		const v = window.__villa;
		// Resample the centre line at 20 cm, and keep the running distance: that is what "how far along the
		// stream" means when a mesh is reported.
		const pts = [];
		let total = 0;
		for (let i = 1; i < course.length; i++) {
			const a = course[i - 1];
			const b = course[i];
			const d = Math.hypot(b.x - a.x, b.z - a.z);
			const n = Math.max(1, Math.round(d / 0.2));
			for (let k = 0; k < n; k++) {
				const t = k / n;
				pts.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, at: total + d * t });
			}
			total += d;
		}
		pts.push({ ...course[course.length - 1], at: total });
		const near = (x, z) => {
			let best = Infinity;
			let at = 0;
			for (const p of pts) {
				const d = Math.hypot(p.x - x, p.z - z);
				if (d < best) {
					best = d;
					at = p.at;
				}
			}
			return { d: best, at };
		};
		// Every mesh the garden built, at its own place, with how far it reaches. A palm's centre is its trunk;
		// a wall's centre is its centre, so the bounding box radius is what decides whether it leans into the
		// channel.
		const hits = [];
		for (const m of v.scene.meshes) {
			if (!m.isEnabled() || m.name.startsWith("stream")) continue;
			const p = m.getAbsolutePosition();
			const n = near(p.x, p.z);
			const ext = m.getBoundingInfo().boundingBox.extendSize;
			const reach = Math.hypot(ext.x, ext.z);
			if (n.d - reach > clearance) continue;
			hits.push({
				name: m.name,
				mat: m.material?.name?.replace(/\d+$/, "") || "?",
				at: Math.round(n.at * 10) / 10,
				off: Math.round((n.d - reach) * 100) / 100,
				x: Math.round(p.x * 100) / 100,
				y: Math.round(p.y * 100) / 100,
				z: Math.round(p.z * 100) / 100,
			});
		}
		hits.sort((a, b) => a.at - b.at);
		// Can the visitor walk the bank? The ground knows what is free; the stream's own blockers are off here,
		// so this answers "what ELSE is in the way", which is what a route has to dodge.
		const walks = [];
		for (const side of [-1, 1]) {
			let blocked = null;
			for (const p of pts) {
				// A point a metre and a half to one side of the water, which is where a person walks.
				const i = pts.indexOf(p);
				const q = pts[Math.min(pts.length - 1, i + 5)];
				const dx = q.x - p.x;
				const dz = q.z - p.z;
				const len = Math.hypot(dx, dz) || 1;
				const wx = p.x + (-dz / len) * side * 1.6;
				const wz = p.z + (dx / len) * side * 1.6;
				if (!v.ground.free(wx, wz)) {
					blocked = { at: Math.round(p.at * 10) / 10, x: Math.round(wx * 10) / 10, z: Math.round(wz * 10) / 10 };
					break;
				}
			}
			walks.push({ side, blocked });
		}
		const xs = pts.map((p) => p.x);
		const zs = pts.map((p) => p.z);
		return {
			length: Math.round(total * 10) / 10,
			xRange: [Math.round(Math.min(...xs) * 100) / 100, Math.round(Math.max(...xs) * 100) / 100],
			zRange: [Math.round(Math.min(...zs) * 100) / 100, Math.round(Math.max(...zs) * 100) / 100],
			insideHedge: Math.min(...xs) > -33 && Math.max(...xs) < 33 && Math.min(...zs) > -28 && Math.max(...zs) < 26,
			hits,
			walks,
		};
	},
	{ course, clearance },
);

console.log(`course ${out.length} m, x ${out.xRange.join("..")}, z ${out.zRange.join("..")}, inside the hedge: ${out.insideHedge}`);
console.log(`meshes within ${clearance} m of the centre line: ${out.hits.length}`);
for (const h of out.hits) console.log(`  at ${String(h.at).padStart(5)} m, ${String(h.off).padStart(6)} m clear  ${h.name} [${h.mat}] at ${h.x},${h.y},${h.z}`);
for (const w of out.walks) console.log(`bank side ${w.side}: ${w.blocked ? `blocked at ${w.blocked.at} m (${w.blocked.x},${w.blocked.z})` : "walkable end to end"}`);
await browser.close();
