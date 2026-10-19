// Find honest drop places for the raven's coin: ground a person walks, out of doors, not under the roof, not
// under a lounger, and not water. Reads the built scene and prints candidates, best first.
//
//   node tools/dropfind.js
import { chromium } from "playwright-core";
const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await p.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(11000);
const rows = await p.evaluate(() => {
	const v = window.__villa;
	const out = [];
	// The front of the house and the paving in front of it: the yard a visitor walks between the steps and the
	// pool, and the lawn either side of it.
	for (let x = -12; x <= 12; x += 0.6) {
		for (let z = 2.4; z <= 12; z += 0.6) {
			if (!v.ground.free(x, z)) continue;
			const y = v.ground.heightAt(x, z);
			const ray = new BABYLON.Ray(new BABYLON.Vector3(x, y + 1.2, z), new BABYLON.Vector3(0, -1, 0), 2.4);
			const pick = v.scene.pickWithRay(ray, (m) => m.isEnabled() && m.isVisible && m.name !== "skyDome");
			if (!pick || !pick.hit) continue;
			const mat = pick.pickedMesh.material.name;
			if (/water|glass|pond/.test(mat)) continue;
			// Nothing hanging over it: a coin under a lounger or a roof edge is a coin nobody finds.
			const over = v.scene.pickWithRay(new BABYLON.Ray(new BABYLON.Vector3(x, y + 2.4, z), new BABYLON.Vector3(0, -1, 0), 2.2), (m) => m.isEnabled() && m.isVisible);
			const clear = !over || !over.hit || over.pickedMesh.material.name === mat;
			// And it has to be seen from the ridge the bird sits on: the main ridge runs x -3.5..3.5 at z -7.8,
			// about 6.8 m up. A coin behind a wall is a coin the bird would not choose to drop there.
			out.push({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, walk: Math.round(y * 100) / 100, mat, clear });
		}
	}
	return out;
});
const good = rows.filter((r) => r.clear);
console.log(`${rows.length} walkable spots in front of the house, ${good.length} with nothing over them.`);
// Spread them: take the best of each hand-sized area so the list is ten places and not ten near a corner.
const picked = [];
for (const r of good) {
	if (picked.some((q) => Math.hypot(q.x - r.x, q.z - r.z) < 1.9)) continue;
	picked.push(r);
}
for (const r of picked) console.log(`  (${r.x}, ${r.z})  walk ${r.walk}  on ${r.mat}`);
console.log(`\n${picked.length} places a coin can lie and be found.`);
await b.close();
