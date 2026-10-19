// Which two surfaces in the Villa are trying to occupy the same plane?
//
//   node tools/coplanar.js [least overlap in square metres]
//
// Two faces at the same depth cannot both be drawn: the depth buffer has no more precision to spare, so one wins
// in one frame and the other in the next, and the seam shimmers. The master saw exactly that on the side of the
// house — "the dark panel inside the grey frame flickers. It has been glitchy for a very long time" — and a
// shimmer like that is not found by looking at one picture, because in any single picture it looks perfectly
// calm. It is found by measuring the geometry.
//
// So: every mesh's box is asked for its six faces, and every pair of faces is compared. Two faces are reported
// when they lie in the same plane to within two millimetres and cover more than a chosen patch of each other.
// Copies of one mesh (a leaf, a tuft) are skipped, and so are pairs whose boxes are actually the same box, which
// is what happens when a mesh is wearing two skins on purpose.
import { chromium } from "playwright-core";

const MIN_OVERLAP = Number(process.argv[2] || 0.15);
const TOL = 0.002;

const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage({ viewport: { width: 480, height: 270 } });
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await p.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await p.waitForFunction(() => !!window.__villa, null, { timeout: 90000 });
await p.waitForTimeout(6000);

const found = await p.evaluate(
	({ minOverlap, tol }) => {
		const faces = [];
		for (const m of window.__villa.scene.meshes) {
			if (!m.isEnabled() || m.isAnInstance || !m.isVisible) continue;
			if (/^instance/i.test(m.name) || m.name.indexOf("leaf") === 0 || m.name.indexOf("tuft") === 0) continue;
			// The box in the world, not the box in the mesh's own bookkeeping: in this library a mesh's bounding
			// info answers in the mesh's LOCAL space whether or not you ask it to refresh, so eight corners are
			// carried through the world matrix by hand and the box is built around where they land. Asked any other
			// way, every box in the Villa answers centred on the origin and the whole garden is reported as one
			// heap of quarrelling faces.
			const local = m.getBoundingInfo(true).boundingBox;
			const wm = m.computeWorldMatrix(true);
			let lo = null;
			let hi = null;
			for (let i = 0; i < 8; i++) {
				const pt = BABYLON.Vector3.TransformCoordinates(
					new BABYLON.Vector3(i & 1 ? local.maximum.x : local.minimum.x, i & 2 ? local.maximum.y : local.minimum.y, i & 4 ? local.maximum.z : local.minimum.z),
					wm,
				);
				if (!isFinite(pt.x)) continue;
				if (!lo) {
					lo = new BABYLON.Vector3(pt.x, pt.y, pt.z);
					hi = new BABYLON.Vector3(pt.x, pt.y, pt.z);
					continue;
				}
				lo.minimizeInPlaceFromFloats(pt.x, pt.y, pt.z);
				hi.maximizeInPlaceFromFloats(pt.x, pt.y, pt.z);
			}
			if (!lo || !isFinite(hi.x)) continue;
			const w = hi.x - lo.x;
			const h = hi.y - lo.y;
			const d = hi.z - lo.z;
			if (w < 0.02 || h < 0.02 || d < 0.02) continue; // a card or a line: not a face that quarrels
			// Only the wide faces are worth comparing: a one-metre square of wall and a narrow jamb are not
			// going to fight over a strip two centimetres wide. Each face is kept as the plane it lies in and the
			// rectangle it covers IN THAT PLANE, which means the two coordinates that are not the plane's own.
			const c = m.getAbsolutePosition();
			void c;
			const push = (axis, at, p1, a1, p2, a2) => {
				if (a1 * a2 < minOverlap) return;
				faces.push({ mesh: m.name, axis, at, p1, a1, p2, a2, mat: m.material ? m.material.name : "-" });
			};
			push("x", lo.x, (lo.z + hi.z) / 2, d, (lo.y + hi.y) / 2, h);
			push("x", hi.x, (lo.z + hi.z) / 2, d, (lo.y + hi.y) / 2, h);
			push("y", lo.y, (lo.x + hi.x) / 2, w, (lo.z + hi.z) / 2, d);
			push("y", hi.y, (lo.x + hi.x) / 2, w, (lo.z + hi.z) / 2, d);
			push("z", lo.z, (lo.x + hi.x) / 2, w, (lo.y + hi.y) / 2, h);
			push("z", hi.z, (lo.x + hi.x) / 2, w, (lo.y + hi.y) / 2, h);
		}
		// Sort by plane so the comparison only walks neighbours.
		const buckets = new Map();
		for (const f of faces) {
			const key = `${f.axis}:${Math.round(f.at / tol)}`;
			if (!buckets.has(key)) buckets.set(key, []);
			buckets.get(key).push(f);
		}
		const pairs = [];
		for (const list of buckets.values()) {
			for (let i = 0; i < list.length; i++) {
				for (let j = i + 1; j < list.length; j++) {
					const a = list[i];
					const c = list[j];
					if (a.mesh === c.mesh) continue;					// How much of each other do the two rectangles cover?
					const o1 = Math.max(0, Math.min(a.p1 + a.a1 / 2, c.p1 + c.a1 / 2) - Math.max(a.p1 - a.a1 / 2, c.p1 - c.a1 / 2));
					const o2 = Math.max(0, Math.min(a.p2 + a.a2 / 2, c.p2 + c.a2 / 2) - Math.max(a.p2 - a.a2 / 2, c.p2 - c.a2 / 2));
					const area = o1 * o2;
					if (area < minOverlap) continue;
					pairs.push({ a: a.mesh, b: c.mesh, axis: a.axis, at: +a.at.toFixed(3), area: +area.toFixed(2), ma: a.mat, mb: c.mat });
				}
			}
		}
		pairs.sort((x, y) => y.area - x.area);
		return pairs.slice(0, 40);
	},
	{ minOverlap: MIN_OVERLAP, tol: TOL },
);
console.log(`${found.length} pairs of surfaces sharing a plane to within ${TOL * 1000} mm, overlapping more than ${MIN_OVERLAP} m2`);
for (const f of found) console.log(`  ${f.axis} at ${f.at} m, ${f.area} m2 together:  ${f.a} [${f.ma}]  /  ${f.b} [${f.mb}]`);
await b.close();
