// sheets — are the Villa's sheets drawn on both sides, lit on the side you see, and does each one's own
// light cost the same in the browser as it does in the CPU drawing?
//
// A leaf, a palm frond and a clump of standing grass are sheets: thin surfaces with their pattern cut out
// of them, seen from both sides. Two switches on their material decide what happens, and getting either
// wrong is silent:
//
//   backFaceCulling  false  — the far side of the sheet is drawn. It matters for a sheet whose mesh has
//                             one winding, like the grass clumps, built by hand four vertices at a time:
//                             with culling on, half of every clump is not drawn — measured on `grassTufts`,
//                             5892 vertices and every one of its normals pointing up. The palm fronds and
//                             the banana leaves are library planes built `Mesh.DOUBLESIDE`, which carries
//                             its own reversed triangles and flipped normals, so on those this switch
//                             changes nothing and the far side was always drawn.
//   twoSidedLighting true   — a face is lit by the normal of the side it is seen from. With it off, how a
//                             back-lit sheet reads depends on which way its triangles were wound, and the
//                             Villa's fronds read chalk: on the south-border view, looking into the low
//                             sun, they measured (132,141,99) against the lawn beside them at (158,181,59)
//                             — a grey-green veil. With it on they measure (42,103,35) and their own colour
//                             back. That switch moved a whole frame full of leaves by 10.1 of a channel.
//
// The line that looked like the fix in the twenty-eighth session — `mats.tuft.doubleSided = true` — does
// nothing at all on this library's PBR material: its setter never reaches `_twoSidedLighting`. Set it in a
// live page and the picture is byte for byte the same, while a poke at the real switch straight afterwards
// is worth 15 points of green. So this tool fails if any source file assigns that name: a knob that reads
// back what you wrote and changes no pixel is the most expensive kind, because it is believed.
//
// Which materials are sheets is read from `src/surface-colours.js`, where a sheet is the entry carrying a
// `cut` or a `double`, so the CPU drawing and the browser cannot disagree about the list. The two switches
// are read from the Villa as it stands in a browser, because that is where they act.
//
// The tool then works out what a sheet's own light is worth, in both places it is written down. The engine
// multiplies a material's `emissiveColor` by its painted emissive pattern, and that pattern is dark — over
// the leaf part of its own 256² canvas a frond carries 0.06 of red, 0.20 of green and 0.03 of blue,
// because most of a leaf is not a vein — so (0.3, 0.55, 0.2) of emissive adds about (0.016, 0.108, 0.006)
// of light where a leaf is and nothing in the gaps. The CPU drawing has no pattern to multiply by: it
// paints a flat tint and adds a flat `glow`. So the drawing's `glow` is meant to be that added light, and
// the numbers now in `src/surface-colours.js` were measured off the live page and written down. This tool
// measures them again and fails if the two have drifted more than about 1.5 times apart — which is what
// ended the guesswork there: writing the material's own emissive into the drawing painted these fronds at
// (169,225,138) where the browser paints them at (42,103,35).
//
//   node tools/sheets.js          -> the table, and a complaint if a sheet is one-sided or the two lights
//                                    have drifted apart
//   node tools/sheets.js --all    -> print the solid materials too

import { chromium } from "playwright-core";
import fs from "node:fs";
import { SURFACES } from "../src/surface-colours.js";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=vulkan", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--hide-scrollbars"];
const wantAll = process.argv.includes("--all");

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
const failed = [];
page.on("pageerror", (error) => failed.push(error.message));
await page.goto("http://localhost:8090/villa/index.html", { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 4000));

const read = await page.evaluate((names) => {
	const { scene, mats } = window.__villa;
	// How much light an emissive pattern carries over the part of itself that is leaf and not gap. The
	// engine multiplies the material's emissiveColor by this, so this is what a sheet's own light is worth.
	const patternLight = (mat) => {
		const tex = mat.emissiveTexture;
		if (!tex || !tex.getContext) return null;
		let px;
		try {
			const size = tex.getSize();
			px = tex.getContext().getImageData(0, 0, size.width, size.height).data;
		} catch {
			return null; // lit by a canvas the page cannot read back: the light map, say
		}
		const toLight = (byte) => (byte <= 10.3 ? byte / 3294.6 : Math.pow((byte + 14.02) / 269.02, 2.4));
		const sum = [0, 0, 0];
		let kept = 0;
		for (let i = 0; i < px.length; i += 4) {
			if (px[i + 3] < 128) continue; // the gap between the leaves: nothing is drawn there
			kept++;
			sum[0] += toLight(px[i]);
			sum[1] += toLight(px[i + 1]);
			sum[2] += toLight(px[i + 2]);
		}
		return kept ? sum.map((v) => v / kept) : null;
	};
	const out = {};
	for (const name of names) {
		const mat = mats[name];
		if (!mat) continue;
		const emissive = [mat.emissiveColor.r, mat.emissiveColor.g, mat.emissiveColor.b];
		const pattern = patternLight(mat);
		out[name] = {
			cull: mat.backFaceCulling,
			two: mat.twoSidedLighting,
			emissive,
			// what the emissive adds where the sheet is leaf: what the drawing's flat glow has to match
			adds: pattern ? emissive.map((v, i) => v * pattern[i]) : null,
			cutOut: mat.alphaCutOff > 0 && mat.alphaCutOff < 1,
			meshes: scene.meshes.filter((m) => m.material === mat && m.isVisible).length,
		};
	}
	return out;
}, Object.keys(SURFACES));

await page.close();
await browser.close();

const sheetKeys = Object.keys(SURFACES).filter((key) => SURFACES[key].cut || SURFACES[key].double);
const problems = [...failed.map((m) => `the page said: ${m}`)];
const rows = [];
const dim = [];
const fmt = (list) => (list ? list.map((v) => v.toFixed(3)).join(",") : "none");

for (const name of Object.keys(SURFACES)) {
	const live = read[name];
	if (!live) continue;
	const isSheet = sheetKeys.includes(name);
	// Leafy surfaces that are not sheets — the hedge, the jungle — are still read, so their dim light can be
	// named below; only the sheet faults are limited to the sheets.
	const glow = SURFACES[name].glow || null;
	const adds = live.adds;
	// What a surface's drawing glow ought to be, if its engine light is multiplied by a pattern: the same
	// arithmetic the sheets use. Printed as a reminder under the table for the surfaces that are not sheets,
	// because those are big in the standing views and want weighing there and not from a script. Fault 23.
	const ought = adds;
	rows.push({ name, ...live, glow, ought, isSheet });
	if (!isSheet && !wantAll) continue;

	if (isSheet && adds && adds[1] > 0 && (!glow || glow[1] === 0)) problems.push(`${name}: the material lights itself (${fmt(adds)} of light added where it is leaf) but the CPU drawing has no glow to match it`);
	if (isSheet && glow && (!adds || adds[1] === 0)) problems.push(`${name}: the CPU drawing adds glow ${fmt(glow)} but the material's emissive adds nothing (${fmt(adds)}) — the drawing is inventing light`);
	if (isSheet && glow && adds) {
		for (let i = 0; i < 3; i++) {
			// A channel worth less than one part in a thousand at either end is under a byte once the
			// exposure and the tone curve have had it, and there is nothing to compare: a leaf's own light
			// carries almost no blue, and demanding that a drawing match a number too small to see only
			// teaches it to write silly digits.
			if (glow[i] < 0.001 && adds[i] < 0.001) continue;
			const ratio = glow[i] / adds[i];
			if (ratio > 1.5 || ratio < 0.6) {
				problems.push(`${name}: the drawing's glow (${fmt(glow)}) is ${ratio.toFixed(2)} times the light the material actually adds (${fmt(adds)}) in channel ${"rgb"[i]} — one of the two has drifted`);
				break;
			}
		}
	}
	// A sheet's own light is meant to be seen. If it is worth less than this, say so in the source or
	// make it bigger; do not leave a knob in that changes nothing.
	if (adds && adds[1] > 0 && adds[1] < 0.02) dim.push(`${name} adds ${fmt(adds)}`);

	if (isSheet && live.cull) problems.push(`${name}: a sheet with backFaceCulling on — its far side is not drawn (${live.meshes} meshes)`);
	if (isSheet && !live.two) problems.push(`${name}: a sheet with twoSidedLighting off — a face is lit by the normal of the side it is not seen from (${live.meshes} meshes)`);
	if (isSheet && !live.cutOut) problems.push(`${name}: marked as cut out in src/surface-colours.js but the material tests no alpha`);
}

// The inert alias, looked for in the source rather than at runtime: it is a name that cannot be caught at
// runtime, because reading it back returns what you wrote.
const alias = [];
for (const dir of ["../src", "."]) {
	for (const file of fs.readdirSync(new URL(dir, import.meta.url))) {
		if (!file.endsWith(".js")) continue;
		const source = fs.readFileSync(new URL(`${dir}/${file}`, import.meta.url), "utf8");
		source
			.split("\n")
			.map((line, i) => [i + 1, line])
			.filter(([, line]) => /\.doubleSided\s*=/
				.test(line) && !/^\s*(\/\/|\*)/.test(line))
			.forEach(([n, line]) => alias.push(`${file}:${n}: ${line.trim()}`));
	}
}
if (alias.length) problems.push(`the inert alias \`doubleSided\` is assigned in:\n    ${alias.join("\n    ")}`);

console.log(`sheets — ${sheetKeys.length} surfaces in src/surface-colours.js are cut out or double: ${sheetKeys.join(", ")}`);
console.log("the switches are read off the Villa standing in Chromium, and so is what each sheet's own light is worth.\n");
console.log("material        meshes  far side   lit from      emissiveColor  x pattern  = added light   the drawing's glow");
for (const r of rows) {
	if (!r.isSheet && !wantAll) continue;
	console.log(
		`${r.name.padEnd(13)} ${r.isSheet ? String(r.meshes).padStart(6) : "      -"}   ${r.isSheet ? (r.cull ? "absent" : "drawn ") : "   -  "}  ${r.isSheet ? (r.two ? "the eye  " : "wrong    ") : "    -    "}  ${fmt(r.emissive).padEnd(14)}              ${fmt(r.adds).padEnd(15)}  ${fmt(r.glow)}`,
	);
}
if (!wantAll) console.log(`\n(${Object.keys(SURFACES).length - rows.filter((r) => r.isSheet).length} surfaces left out of the table that are not sheets; --all prints them with their switches)`);
if (dim.length) console.log(`\nadding so little light that it will hardly be seen (${dim[0].split(" adds ")[1]} of green is where it stops being worth a knob): ${dim.map((d) => d.split(" adds ")[0]).join(", ")}`);
const wide = rows.filter((r) => !r.isSheet && r.ought && r.glow && r.emissive[1] > 0 && r.emissive[1] < 0.2 && r.glow[1] > r.ought[1] * 1.5);
if (wide.length) console.log(`\nnot sheets, so not complained about, but the drawing puts a glow beside them bigger than their emissive can pay for: ${wide.map((r) => `${r.name} draws ${fmt(r.glow)} against ${fmt(r.ought)} added`).join("; ")}`);

console.log("");
if (problems.length) {
	console.log(`${problems.length} fault(s):`);
	for (const p of problems) console.log(`  ${p}`);
} else {
	console.log("every sheet is drawn on both sides and lit from the side it is seen from, each one's light costs the same in the drawing as in the browser, and nobody is using the inert alias");
}
process.exit(problems.length ? 1 : 0);
