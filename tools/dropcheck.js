// Where does a raven's coin actually land? Reads the ten places in `DROPS` (`src/raven.js`) off the built scene:
// what mesh and material is under the spot, what the walking ground says about it, and what a ray let fall from
// a metre above finds first. Run: node tools/dropcheck.js
import { chromium } from "playwright-core";
const b = await chromium.launch({
	executablePath: "/usr/bin/chromium",
	args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist"],
});
const p = await b.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await p.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(11000);
const rows = await p.evaluate(async () => {
	// `DROPS` is not exported, so it is read back out of the source the same way the browser does it.
	const src = await (await fetch("./src/raven.js")).text();
	const block = src.split("const DROPS = [")[1].split("];")[0];
	const drops = [...block.matchAll(/-?\d+\.?\d*,\s*-?\d+\.?\d*/g)].map((m) => m[0].split(",").map(Number));
	const v = window.__villa;
	return drops.map(([x, z]) => {
		const y = v.ground.heightAt(x, z);
		const ray = new BABYLON.Ray(new BABYLON.Vector3(x, y + 1.2, z), new BABYLON.Vector3(0, -1, 0), 2.4);
		const pick = v.scene.pickWithRay(ray, (m) => m.isEnabled() && m.isVisible && m.name !== "skyDome");
		// What a person standing over it would see looking straight down, and what is a half-metre away.
		const near = [];
		for (const [ox, oz] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) {
			const r2 = new BABYLON.Ray(new BABYLON.Vector3(x + ox, y + 0.9, z + oz), new BABYLON.Vector3(0, -1, 0), 2);
			const q = v.scene.pickWithRay(r2, (m) => m.isEnabled() && m.isVisible && m.name !== "skyDome");
			near.push(q && q.hit ? q.pickedMesh.material.name : "-");
		}
		return {
			x,
			z,
			walk: Math.round(y * 100) / 100,
			free: v.ground.free(x, z),
			under: pick && pick.hit ? `${pick.pickedMesh.name} [${pick.pickedMesh.material.name}] at ${Math.round(pick.distance * 100) / 100} m` : "nothing",
			near: near.join("/"),
		};
	});
});
for (const r of rows) {
	console.log(
		`(${String(r.x).padStart(5)},${String(r.z).padStart(5)})  walk ${String(r.walk).padStart(5)}  ${r.free ? "walkable" : "BLOCKED  "}  under: ${r.under.padEnd(42)}  about: ${r.near}`,
	);
}
await b.close();
