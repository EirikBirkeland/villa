// The sky, the sun, the ground and the far horizon.

import { box, sphere, cylinder, plane, poly, groundPlane, slab, groundUVs, tintFromGround, patternMetres } from "./mesh.js";
import { groundNoise, randomGenerator } from "./noise.js";
import { lawnTone, lawnBend, lawnVertexSpacing } from "./lawn.js";
import { paverTone, pavingBend, pavingVertexSpacing } from "./paving.js";
import { pavedGround, courtBeds, bedTop, bedTone } from "./court.js";
import { pondHole } from "./pond.js";
import { makePalm } from "./garden.js";
import { canopyAtlas } from "./textures.js";

const { Vector3, Color3, Color4, Scene, Mesh, MeshBuilder, VertexBuffer, HemisphericLight, DirectionalLight, ShadowGenerator, SkyMaterial } = BABYLON;

/** Where the sun is, as a unit vector. az is degrees clockwise from north, el degrees above the horizon. */
export function sunDirection(az, el) {
	const a = (az * Math.PI) / 180;
	const e = (el * Math.PI) / 180;
	return new Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

/** The visible sky: a big inside-out box painted with the atmosphere shader. */
export function buildSky(scene, sun) {
	const sky = new SkyMaterial("sky", scene);
	// Thin, dry air: a deep blue dome with a pale band at the horizon, not a milky white bowl.
	sky.turbidity = 2;
	sky.rayleigh = 4;
	sky.mieCoefficient = 0.002;
	sky.mieDirectionalG = 0.8;
	sky.luminance = 0.22; // the sky writes real light values; the tone mapping happens once, later
	// 0.22 and no more: past that the sky turns from blue to milk, and the tone mapping takes the
	// blue out of it first.
	sky.rawHdrOutput = true;
	// The sun goes in the sky through sunPosition + useSunPosition. There is no sunDirection on this
	// material: setting one looked harmless and left the sky's sun floating at the zenith, so the
	// whole dome was a symmetric glow with no sunset in it and no relation to the shadows.
	sky.useSunPosition = true;
	sky.sunPosition = sun.scale(sky.distance); // only the direction is read, plus how far below the horizon
	sky.backFaceCulling = false;
	sky.disableLighting = true;

	const dome = MeshBuilder.CreateBox("skyDome", { size: 900, sideOrientation: Mesh.BACKSIDE }, scene);
	dome.material = sky;
	dome.applyFog = false;
	dome.infiniteDistance = true;
	dome.isPickable = false;
	return { sky, dome };
}

/**
 * Keep the two fill lamps off a set of meshes, and hand the list back.
 *
 * The sky's fill and the bounce off the ground are lamps without shadows: they light every face
 * turned towards them, whether anything is in the way or not. Out of doors that is the bargain being
 * struck — a wall in the house's own shade still sees the sky — but a room under a roof is handed the
 * whole sky through the ceiling. Measured in Chromium inside the house with the sun switched clean off,
 * the plaster of the north wall read (180,155,119), as bright as a sunlit wall out of doors, and the
 * floor under the ceiling read (110,71,34): so the front of glass showed a room as brightly lit as the
 * garden, and the biggest thing between a visitor and the house came out the colour of weak tea.
 *
 * The sun is not in this list, and rightly: a sunbeam through ten metres of glass onto a floor is a
 * real thing, and the shadow lamp already stops the sky's own sun where the roof is.
 */
export function shutOutSkyFill(scene, meshes) {
	const room = [].concat(meshes);
	for (const name of ["sky-fill", "bounce"]) {
		const lamp = scene.getLightByName(name);
		if (!lamp) continue;
		lamp.excludedMeshes = [...(lamp.excludedMeshes || []), ...room];
	}
	return room;
}

/** The sun, the sky's fill light, and the shadow caster for the whole scene. */
export function buildLights(scene, sun) {
	const light = new DirectionalLight("sun", sun.scale(-1), scene);
	light.intensity = 60;
	light.diffuse = new Color3(1, 0.71, 0.46);
	light.specular = new Color3(1, 0.88, 0.7);
	// Babylon fits the shadow map to whatever casts shadows, so the map is left to look after itself.

	// The rest of the sky, coming down: cool from above, warm off the ground.
	// Every face that turns away from the sun is lit by this light and by the sky cube, and by
	// nothing else, so between the two of them they carry the whole back half of the picture.
	//
	// This used to stand at 4, and the back of the house paid for it: measured in Chromium the shaded
	// plaster there read (104,94,77) and the whole north view stood at L51, against L132 for the
	// front. A sky at 4 against a sun at 60 is a ratio of 15:1, which is light off a black sky with a
	// searchlight on the side: a hazy tropical sky fills a lot more than that.
	//
	// It stood at 6.5 until the bloom was tightened (see `main.js`): the shaded side of the house had been
	// being handed a spill it did not earn, and when that came off its darkest band grew again — 22.5% of
	// the north view below L31, and 15.1% of the west wall. At 6.8, with the bounce below at 6, the north
	// view is back to L68 from 65 and the west wall to L87, and both keep their colour (61% and 41% of
	// the frame in colour, against 62% and 42% before any of this). Lifting the sky fill alone, rather
	// than the bounce with it, comes out greyer: hemi 7.2 with the bounce left at 4 measured 60% and 40%
	// on the same two views.
	const hemi = new HemisphericLight("sky-fill", new Vector3(0, 1, 0), scene);
	hemi.intensity = 6.8;
	// The sky coming down is blue, not beige. Every material in the Villa is at the mercy of
	// this one colour: while it was pale the whole picture went the colour of weak tea.
	hemi.diffuse = new Color3(0.4, 0.58, 0.88);
	// GroundColor is the light coming up off the paving. Note what was found when this was measured:
	// on a vertical wall it does almost nothing — setting it to more than double left the shaded wall
	// within a point of what it was — so it is the diffuse half, and the bounce light below, that
	// carry the sides of things. It is kept warm because it is the only term that lights the tops of
	// things from below.
	hemi.groundColor = new Color3(0.42, 0.34, 0.24);
	hemi.specular = new Color3(0.22, 0.21, 0.2);

	// A second, dimmer fill from the sun side, standing for the light thrown back off the sunlit
	// paving and lawn. It was cool blue and nearly nothing (1.6); a bounce off sunlit stone and grass
	// is warm, and it is the only thing in the Villa that lights a face turned away from both the sun
	// and the sky. Warm since it went up from 1.6 to 4 and took the north view of
	// the house from L44 to L61 without moving the sunlit step coping at all; 6 now, for the reason given
	// on the sky fill above.
	const bounce = new DirectionalLight("bounce", new Vector3(-sun.x * 0.7 - 0.3, -0.4, -sun.z * 0.7), scene);
	bounce.intensity = 6;
	bounce.diffuse = new Color3(0.62, 0.5, 0.36);
	bounce.specular = new Color3(0, 0, 0);

	const shadows = new ShadowGenerator(2048, light);
	shadows.usePercentageCloserFiltering = true;
	shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
	shadows.bias = 0.0009;
	shadows.normalBias = 0.02;
	return { light, hemi, bounce, shadows };
}

export function buildFog(scene) {
	scene.fogMode = Scene.FOGMODE_EXP2;
	// Haze with GREEN in it, and the whole of the argument for these bytes is a subtraction.
	//
	// At 140 m the far ridge came out of the browser at (89,99,100) — slate — and with the fog switched off
	// the very same pixel came out (13,42,18): so three parts in four of everything out there is fog, and
	// the fog's own colour, solved out of those two numbers, was (191,189,207). A pale lavender board,
	// brighter than the sky at the horizon (150,204,224) in its own blue and with no green in it whatever.
	// No shape can survive being seen through that, which is why four sessions of reshaping the ridge —
	// domes, then a band of quads, then crowns, then cards — kept being told it looked like rock.
	//
	// What haze has to be is the sky at the horizon, a little dimmed, and the horizon sky here is a blue
	// with green in it; these bytes put the ridge at (68,91,63) at 140 m and the hills at (114,136,103) at
	// 240 m, which is the ladder the notes have always asked for: each step paler and bluer than the last,
	// each one under the sky, none of them blue OVER green. (`tools/bandtest.json`, and it prints the sky
	// beside them so the two can be compared without believing this comment.)
	scene.fogColor = new Color3(0.52, 0.62, 0.5);
	scene.fogDensity = 0.005;
	scene.clearColor = new Color4(0.55, 0.6, 0.62, 1);
}

/** The lawn and the poolside paving. The lawn is laid in four strips, leaving a hole where the pool is. */
export function buildGround(scene, mats) {
	const grassTileMetres = 6;
	// The lawn is laid in four strips that stop UNDER the court's stone, 15 cm inside it on every side of
	// the water.
	//
	// They used to stop at the pool's own inner face — x = ±5, z = 2.1 and 7.1 — and a browser showed what
	// that costs: a one-pixel grass-green hairline all down the east edge of the water, `(97,162,25)` where
	// the tiles should be (`tools/edgehunt.json`, and `--find` in `tools/pixels.js` to count it). A plane of
	// grass whose cut edge is in the same vertical plane as the pool's wall, 20 cm above the water, is a
	// tread meeting a riser at a grazing eye: the two are a hair's breadth apart in depth along the whole
	// line, so the rasteriser gave the pixel to the grass on the east side of the water and to the wall on
	// the west, in one and the same picture. Nothing on the wall or the water can be tuned away, because the wall
	// is not at fault — switching the lawn out switched the line out, and widening the wall did not touch it.
	//
	// So the grass is not allowed to meet the pool at all. It stops under the paving, which is a solid slab
	// from y = 0 up to 0.14, and the stone of the court has been brought in to the pool's wall shell to
	// cover it (see `pavedGround` in src/court.js). A cut edge of grass under 15 cm of stone cannot be seen
	// from any angle a visitor has, and there is no longer a line for two surfaces to quarrel over.
	const lawnStrips = [
		[-130, 130, -130, 1.65], // everything north of the court's stone
		[-130, 130, 7.55, 130], // and south of it
		[-130, -5.45, 1.65, 7.55], // beside the water, west: under the deck, which runs in to ±5.30
		[5.45, 130, 1.65, 7.55], // and east
	];
	const lawn = [];
	for (let i = 0; i < lawnStrips.length; i++) {
		const [x0, x1, z0, z1] = lawnStrips[i];
		// The pond is a hole in the lawn and not a picture of water laid on top of it, so the strip that
		// holds it is cut round it — the same four-piece subtraction the court's beds are cut with. One
		// strip only, because the pond stands well inside the lawn south of the court; the guard is there so
		// that if the pond ever moves across a join, the cut is still made and not quietly missed.
		const holes = pondHole.x0 > x0 && pondHole.x1 < x1 && pondHole.z0 > z0 && pondHole.z1 < z1 ? [pondHole] : [];
		for (const piece of stoneLeft(x0, x1, z0, z1, holes).map((p, k) => ({ ...p, name: k ? `lawn${i}${String.fromCharCode(97 + k)}` : `lawn${i}` }))) {
			const strip = groundPlane(scene, piece.name, { width: piece.x, height: piece.z, px: piece.px, py: 0, pz: piece.pz, mat: mats.lawn, spacing: lawnVertexSpacing });
			// Measured from the ground, not from the strip's own corner, so the mown bands run straight
			// across all four strips instead of starting again at every join — and then bent a little, so
			// they wander the way a mown strip really does instead of running true for sixty metres.
			groundUVs(strip, grassTileMetres, lawnBend);
			// The lawn's broad patches of lush and dry grass, carried at its corners: see src/lawn.js.
			tintFromGround(strip, lawnTone);
			strip.receiveShadows = true;
			strip.checkCollisions = true;
			lawn.push(strip);
		}
	}

	// Poolside paving. Each side of the court is built as the pieces that are LEFT after its beds are
	// cut out — see `courtBeds` — so a bed is a hole in the stone with a cut edge to it, and not a
	// picture of dirt laid on top of the paving.
	//
	// The two outer edges used to stand at x = ±15, which made the court a 30 m apron of cut stone round
	// a 10 x 5 m pool: photographed straight down, the stone was 38% of the frame and the grass 24%, and
	// nothing about the place said garden. They stand at x = ±11.9 now, 108 m2 of it given back to the
	// lawn, and there is still 4.15 m of stone outside each border to lay a sunbed on and walk behind it.
	// What had to move with the edge is listed where it stands: the railing, the two outer lamps, the west
	// sunbed, and every grass fringe that was laid along the old line (`makeTuftPlan` in src/garden.js).
	const pavingTileMetres = 3.1;
	const deck = [];
	for (const side of pavedGround.filter((g) => g.name === "deckWest" || g.name === "deckEast")) {
		const holes = courtBeds
			.filter((b) => b.x0 >= side.x0 && b.x1 <= side.x1)
			.sort((a, b) => a.z0 - b.z0);
		stoneLeft(side.x0, side.x1, side.z0, side.z1, holes).forEach((s, i) => {
			deck.push(pavingSlab(scene, `${side.name}${i}`, s, pavingTileMetres, mats));
		});
	}
	let path = null;
	for (const g of pavedGround.filter((p) => p.name !== "deckWest" && p.name !== "deckEast")) {
		const slabMesh = pavingSlab(scene, g.name, rect(g), pavingTileMetres, mats);
		deck.push(slabMesh);
		if (g.name === "path") path = slabMesh;
	}

	// The dirt in those beds, sunk just under the top of the stone so the paving's cut edge stands
	// proud of it as a curb, and low enough (see `bedTop`) for a shrub's foot to count as garden.
	const beds = courtBeds.map((b) => {
		const mesh = slab(scene, b.name, {
			x: b.x1 - b.x0,
			y: 0.06,
			z: b.z1 - b.z0,
			px: (b.x0 + b.x1) / 2,
			py: bedTop - 0.03,
			pz: (b.z0 + b.z1) / 2,
			mat: mats.earth,
			spacing: 0.5,
		});
		groundUVs(mesh, patternMetres(mats.earth) || 0.7);
		tintFromGround(mesh, bedTone);
		mesh.receiveShadows = true;
		mesh.checkCollisions = true;
		return mesh;
	});

	// The path out through the south is laid by the loop above, out of the same plan: it used to be laid a
	// second time here, and the Villa drew one slab of boards twice in the same place — two identical,
	// coplanar faces for the depth test to choose between, and a second draw call to pay for. `rect` already
	// carries the path's own height (0.12 against the deck's 0.14), so the loop gets it right on its own.

	return { lawn, deck, beds, path };
}

/** A rectangle of `pavedGround`, as `pavingSlab` wants it: size and centre in metres of ground. */
function rect(g) {
	return { x: g.x1 - g.x0, z: g.z1 - g.z0, px: (g.x0 + g.x1) / 2, pz: (g.z0 + g.z1) / 2, y: g.y };
}

/**
 * The stone left on one side of the court once its beds are cut out: a band north of all of them,
 * a band south, a strip down each side of them, and one band in every gap between two of them.
 * All the beds on a side stand between the same two edges, which is what keeps this four pieces and
 * not a puzzle; `holes` must be in order of `z0`.
 */
function stoneLeft(x0, x1, z0, z1, holes) {
	const rect = (a0, a1, b0, b1) => ({ x: a1 - a0, z: b1 - b0, px: (a0 + a1) / 2, pz: (b0 + b1) / 2 });
	if (!holes.length) return [rect(x0, x1, z0, z1)];
	const hx0 = Math.min(...holes.map((h) => h.x0));
	const hx1 = Math.max(...holes.map((h) => h.x1));
	const za = holes[0].z0;
	const zb = holes[holes.length - 1].z1;
	const out = [rect(x0, x1, z0, za), rect(x0, x1, zb, z1), rect(x0, hx0, za, zb), rect(hx1, x1, za, zb)];
	for (let i = 1; i < holes.length; i++) out.push(rect(hx0, hx1, holes[i - 1].z1, holes[i].z0));
	return out;
}

/**
 * One piece of the paved deck: a slab thick enough to show an edge at its sides, its pattern laid from
 * the ground it lies on (and bent off its grid, so the courses do not line up with the next strip's),
 * its broad tones carried at its corners — the same two things the lawn gets, for the same reason (see
 * src/paving.js).
 */
function pavingSlab(scene, name, s, tileMetres, mats) {
	const mesh = slab(scene, name, {
		x: s.x,
		y: s.y || 0.14,
		z: s.z,
		px: s.px,
		py: (s.y || 0.14) / 2,
		pz: s.pz,
		mat: mats.paver,
		spacing: pavingVertexSpacing,
	});
	groundUVs(mesh, tileMetres, pavingBend);
	tintFromGround(mesh, paverTone);
	mesh.receiveShadows = true;
	mesh.checkCollisions = true;
	return mesh;
}

/**
 * The boundary hedge, so the garden has an edge.
 *
 * It used to be four boxes, two metres and a tenth high, and a browser said so: a machine-cut green wall
 * with one straight line along the top of the whole sixty-odd metres of it and a flat knit for a face
 * (`pictures/1914-southborder.png`, `pictures/1912-eastlawn.png`). No hedge was ever cut that straight,
 * because no hand holds a line straight for sixty metres; and no hedge's face is one flat colour, because
 * a face is ten thousand leaves each throwing its own little shade.
 *
 * So it is built in segments now, five and a half metres of hedge to a segment, and three things are true
 * of the line it makes:
 *
 *   - its crest wanders — a tree's worth of height and a branch's worth, about the same standard height —
 *     which is the shape a pair of shears leaves behind;
 *   - its face wears a tone written at the corners of every segment, wandering along the run and darker
 *     towards the foot, which is the same pay the belt's crowns get (`cardRank`'s vertex tone) laid along
 *     a line instead of scattered over a shell;
 *   - its top carries a fringe of leaf cards (`hedgeCrest` below), so where the hedge cuts the sky the
 *     line is leaf tips and not a ruler.
 *
 * Every segment is still a box and still says it collides, for the reason written at the head of
 * `src/ground.js`: the walk reads walls off the bounding boxes of the meshes that say so, and a person
 * must not be able to step out of the garden over the hedge.
 */
export function buildBoundary(scene, mats) {
	const rand = randomGenerator(1907);
	const depth = 0.7;
	// One side of the garden's edge: which way the run goes, where it stands, how far it reaches, and
	// which way is out of the garden.
	const sides = [
		{ along: "x", at: -22, from: -34, to: 34, out: [0, 0, -1] },
		{ along: "x", at: 26, from: -34, to: 34, out: [0, 0, 1] }, // pushed back: at 20 it stood 9 m off
		{ along: "z", at: -33, from: -28, to: 26, out: [-1, 0, 0] }, // the paving and filled the whole
		{ along: "z", at: 33, from: -28, to: 26, out: [1, 0, 0] }, // middle of the view when you turn round
	];
	// The crest line, against metres of run. Two wavelengths, a tree's and a branch's, and no finer: a
	// hedge's top is out of true at the size of a sweep of the shears and at the size of the shrub it
	// grew from, not at the size of a leaf — the leaf tips are the crest cards' work.
	const wave = [rand() * 6.283, rand() * 6.283];
	const crestAt = (run) => 2.06 + 0.1 * Math.sin(run * 0.21 + wave[0]) + 0.055 * Math.sin(run * 0.86 + wave[1]);

	const parts = [];
	const runs = [];
	let n = 0;
	for (const s of sides) {
		const count = Math.max(4, Math.round((s.to - s.from) / 5.5));
		const step = (s.to - s.from) / count;
		for (let i = 0; i < count; i++) {
			const a0 = s.from + i * step;
			const mid = a0 + step / 2;
			const top = crestAt(mid) + (rand() - 0.5) * 0.05;
			const seg = box(scene, `hedge${n++}`, {
				// A finger's overlap at each join, so two segments meeting do not leave a hairline seam
				// of sky between them where the eye would find it.
				x: s.along === "x" ? step + 0.03 : depth,
				y: top,
				z: s.along === "z" ? step + 0.03 : depth,
				px: s.along === "x" ? mid : s.at,
				py: top / 2,
				pz: s.along === "x" ? s.at : mid,
				mat: mats.hedge,
			});
			seg.checkCollisions = true;
			seg.receiveShadows = true;
			hedgeSkin(seg, wave);
			parts.push(seg);
			runs.push({ side: s, a0, a1: a0 + step });
		}
	}
	parts.push(hedgeCrest(scene, mats, runs, crestAt, rand));
	return parts;
}

/**
 * A tone at every corner of one hedge segment: lighter and darker along the run at the scale of a branch
 * and of a tree, and darker towards the foot where the hedge is in its own shade. The mean over a
 * segment is one, so this moves the hedge's shape and not its light — which is the standing rule for
 * anything done to the biggest green mass in half the standing views.
 */
function hedgeSkin(mesh, wave) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	if (!positions) return mesh;
	const world = mesh.computeWorldMatrix(true);
	const colours = new Float32Array((positions.length / 3) * 4);
	for (let v = 0, i = 0, o = 0; v < positions.length / 3; v++, i += 3, o += 4) {
		const at = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), world);
		// Both coordinates go into the wander, because a garden turns: the east and west runs have to
		// wander too, and at a different pace or the two of them look like one printed strip.
		const run = at.x + at.z;
		const wander = 1 + 0.09 * Math.sin(run * 0.33 + wave[0]) + 0.06 * Math.sin(run * 0.11 + wave[1]);
		// 0.84 at the ground and 1.16 at the crest: the mean over a segment is one again, so the darker
		// foot is bought out of the lighter top and not out of the frame's light.
		const rise = Math.max(0, Math.min(1, at.y / 2.2));
		const foot = 0.84 + 0.32 * rise;
		const tone = wander * foot;
		colours[o] = tone;
		colours[o + 1] = tone * (1 + 0.03 * rise);
		colours[o + 2] = tone * 0.97;
		colours[o + 3] = 1;
	}
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/**
 * The fringe of leaf cards along the hedge's crest, so the line where the hedge meets the sky is a
 * tangle of leaf tips and not a ruler's edge.
 *
 * Two cards to every thirty centimetres of run, stood on the crest line: each one leans a little out of
 * the plane of the face and sits a little in or out of the hedge, so the crest has a depth of half a metre
 * and not one flat sheet of leaf across the top. The leaves are the shrubs' own (`mats.bushEdge`, cut at
 * the same cut-off the bushes are cut at), because a clipped hedge's leaf is a bush's leaf and not the
 * big leaf the belt wears twenty metres behind it.
 *
 * The cards wear the belt's lesson about winding and about a tone to themselves: both faces are drawn and
 * lit from the side they are seen from, and every card takes its own tone, so a hundred and sixty metres
 * of crest is not one green band with a serrated edge.
 */
function hedgeCrest(scene, mats, runs, crestAt, rand) {
	const positions = [];
	const uvs = [];
	const normals = [];
	const colours = [];
	const indices = [];
	for (const r of runs) {
		const s = r.side;
		const tx = s.along === "x" ? 1 : 0;
		const tz = s.along === "x" ? 0 : 1;
		for (let a = r.a0; a < r.a1; a += 0.26) {
			const crest = crestAt(a);
			for (let k = 0; k < 3; k++) {
				// How far the card leans out of the plane of the face. A crest whose every card stands plumb
				// is a saw blade, and a saw blade is one line with teeth on it; leaned, the same cards make a
				// tangle with light in it and shade behind it, and the top line wanders with them.
				const lean = (rand() - 0.5) * 1.6;
				const cl = Math.cos(lean);
				const sl = Math.sin(lean);
				// The way a card here is LIT is not the way it is cut. It stands for a cluster of leaf on the
				// top of a hedge, and a cluster's leaves point at the sky with a tilt out over the face — so the
				// normal goes up first and out second. Written along the card's own face instead, the crest
				// stood at (31,63,10) against a face at (73,111,19), because a card lying along the line of the
				// hedge sees the hedge and not the sun; written up, the same cards in the same places read
				// (129,170,54). Both numbers come off the live page, from `tools/cover.js --js` on the camera
				// `20,1.6,-14,-1.57,0`, with only the normal buffer rewritten between the two runs.
				const share = 0.3 + rand() * 0.45;
				const nx = s.out[0] * share;
				const ny = 1;
				const nz = s.out[2] * share;
				const nl = Math.hypot(nx, ny, nz) || 1;
				// The card's own up: the sky, tipped over by the lean.
				const ux = -s.out[0] * sl;
				const uy = cl;
				const uz = -s.out[2] * sl;
				const ul = Math.hypot(ux, uy, uz) || 1;
				const wide = 0.4 + rand() * 0.3;
				const tall = 0.42 + rand() * 0.36;
				// Where it stands: along the run, and across the hedge from a hand inside it to a hand
				// and a half outside, so the crest is a hedge and not a picture of one.
				const place = (rand() - 0.35) * 0.62;
				const cx = (s.along === "x" ? a : s.at) - s.out[0] * place;
				const cz = (s.along === "x" ? s.at : a) - s.out[2] * place;
				// Where the card hangs from the crest. Every card here had its top edge at the same hand
				// above the crest line and the crest came out as straight as the box it was standing on, which
				// was the whole fault; now the top wanders two hands down to one hand up.
				const cy = crest - tall * 0.5 + (rand() * 0.3 - 0.16);
				// Brighter than the face by a quarter: the crest is the part of a hedge the sun and the sky
				// both reach, and a card turned away from the sun still has the whole sky over it, which the
				// hemi alone will not pay for at this frame rate. Without this the crest came out a scorched
				// band along the top of a sunlit hedge (`pictures/1920-eastlawn.png`).
				// A little over one, and no more: the light on a crest now comes from the sky and the sun like
				// every other lit leaf in the Villa, so the tone only has to keep the tips a shade above the
				// face under them and not make up for a face turned the wrong way.
				const tone = 1.0 + rand() * 0.28;
				const at = positions.length / 3;
				// One whole tile of leaf to a card, hung at one of four ways, and at a size of its own.
				const u0 = rand() * 4;
				const v0 = rand() * 4;
				const flip = rand() < 0.5 ? 1 : 0;
				for (const [su, sv, du, dv] of [
					[0, 0, -1, -1],
					[1, 0, 1, -1],
					[0, 1, -1, 1],
					[1, 1, 1, 1],
				]) {
					const cu = (su - 0.5) * wide;
					const cv = (sv - 0.5) * tall;
					positions.push(
						cx + tx * cu + (ux / ul) * cv,
						cy + (uy / ul) * cv,
						cz + tz * cu + (uz / ul) * cv
					);
					normals.push(nx / nl, ny / nl, nz / nl);
					colours.push(tone, tone, tone, 1);
					uvs.push(u0 + (flip ? 1 - su : su) + du * 0.02, v0 + sv + dv * 0.02);
				}
				indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
			}
		}
	}
	const mesh = poly(scene, "hedgeCrest", { positions, indices, uvs, mat: mats.hedgeCrest });
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/**
 * The world beyond the garden: hills, a belt of jungle behind the hedge in two ranks, and a tree
 * line along the sky. Four depths, each paler and bluer than the one in front of it, so turning
 * round gives you somewhere to look instead of a hedge and a wall of empty sky.
 *
 * Nothing here is solid, and nothing casts a shadow: it is scenery, a hundred-odd metres out.
 * Each layer is merged into one mesh, so the whole distance costs the browser five draws.
 */
export function buildDistance(scene, mats) {
	const rand = seededRandom(4242);
	const meshes = [];

	// NOTE for the next session, from the fortieth-second: **these six spheres are not in the picture.**
	// They were painted red in a live page and asked what the browser used to paint the frame
	// (`tools/cover.js`, 880 grid points, `--view "-11,1.7,6.8,1.57,-0.02"`): the answer was 0.1% of the
	// frame, one grid point, and with the far band switched off (`farBelt.isVisible = false`) the whole of
	// them was still behind it. The smooth green "hills" that fill the top of every standing view are
	// `farBelt` — the far tree line — which reads (77,101,72) at 160 m and is the last green step the eye
	// actually gets. Pushing these back to 300-380 m and raising their tops to 70-110 m so they cleared the
	// band was tried and weighed: they came out (100,125,93), which is a hazy pale green and exactly the
	// step the ladder wants, but they covered 0.4% of the frame, because six smooth domes peeking through a
	// ragged band is not a ridge. Either build the ridge the way `skylineBand()` builds the tree line — one
	// long mass with a ragged top, its own pale bytes, 300 m out — or delete these and stop saying the Villa
	// has hills.

	for (let i = 0; i < 6; i++) {
		const angle = (i / 6) * Math.PI * 2 + 0.6;
		const dist = 170 + rand() * 70;
		meshes.push(
			sphere(scene, `hill${i}`, {
				diameterX: 200 + rand() * 130,
				diameterY: 48 + rand() * 34,
				diameterZ: 160 + rand() * 100,
				segments: 10,
				px: Math.sin(angle) * dist,
				py: -16 - rand() * 8,
				pz: Math.cos(angle) * dist,
				mat: mats.hill,
			}),
		);
	}

	// ---- the jungle behind the hedge: a canopy, so nothing ends at a hedge top
	//
	// The hedge is a rectangle about 66 by 48 m, so the belt is laid round that same rectangle and
	// pushed out from it. A circle here would leave the trees 30 m away on the diagonals and 4 m away
	// on the sides, and the near side would read as a row of bushes in a field.
	//
	// It is two ranks deep, and that was learned from a picture. One rank was tried first and it drew
	// 5% of the west view against 29% of sky: a tree 6 m tall standing 50 m off covers seven degrees
	// of sky and no more, so the sky got down between the crowns all the way to the hedge.
	//
	// What matters is how tall a tree looks from where a person stands, and the nearest trees are the
	// ones that decide that: a 20 m tree seventy metres off hides behind an 8 m tree twenty-five metres
	// off. So the near rank, which stands four to thirteen metres beyond the hedge and hides its trunks
	// behind it, is the one that has to be tall, and the rank behind it fills the gaps the near one
	// leaves and gives the distance a third step of green. The heights wander in clumps — a low patch
	// here, a high patch there — because a wood grows in groups of one size and a fence does not, and
	// because the sky has to get down into the skyline somewhere.
	//
	// It is built in clumps of crowns and not one crown to a ring point, and that too came from a
	// picture. One ball to a point made a row of smooth green eggs with the sun lying along them: no
	// wood has ever been that. So each ring point is a clump — a big crown and three to five lesser ones
	// leaning against it — which does three things at once: the top edge steps about from crown to
	// crown instead of drawing one long arc, the sun has a dozen small terminators to lose itself in
	// instead of one big one, and the crowns overlap their neighbours so the mass is continuous.
	//
	// The crowns are small on purpose, and that is the other way round a first attempt went. A crown is
	// a tree's head: four and a half to eight metres across in the near rank, six to eleven in the far
	// one. A first try put them at five to eleven and nine to twenty metres across, and at those sizes one
	// crown covers a fifth of the frame, so the far rank stopped being a wood and came out as a range of
	// green hills. Crowns of these sizes put seven or eight of them across the frame wherever a person
	// stands, which is what a wood edge looks like.
	//
	// Every crown is a shell of leaf cards, wider than it is tall, and no longer a dome: a dome is one
	// smooth surface with one light gradient on it, and the belt spent three sessions wearing that gradient
	// as a field of boulders. `cardRank` below has the whole of that story and the picture that proved it.
	const hedgeCentre = [0, 2];
	const hedgeHalf = [33, 24];
	// Heights come in clumps. This wanders between about 0.3 and 1.7 along a ring. The step is in
	// ring points, so it is set against how many each rank has: the near rank has forty to a ring of
	// five hundred metres and the far one forty-six, and the wavelengths below put a height patch
	// every fifty-odd metres in both.
	const lump = (i, every, shift) =>
		Math.max(0.3, 1 + 0.55 * Math.sin(i * every + shift) + 0.3 * Math.sin(i * every * 0.41 + shift * 1.7 + 2.1));

	/**
	 * A clump of crowns: the big one, and three to five lesser ones crowded against it, so the skyline has
	 * a shape in it rather than a height. Each crown becomes a card shell (`cardRank` below) at its own
	 * height, and the lesser ones are what stop one ring point reading as one tree.
	 */
	function crownSpots(spots, s, height, width) {
		spots.push({ x: s.x, z: s.z, width, height: height * (0.55 + rand() * 0.2) });
		const lesser = 3 + Math.floor(rand() * 3);
		for (let k = 0; k < lesser; k++) {
			const bearing = rand() * Math.PI * 2;
			const lean = width * (0.3 + rand() * 0.55);
			spots.push({
				x: s.x + Math.sin(bearing) * lean,
				z: s.z + Math.cos(bearing) * lean,
				width: width * (0.4 + rand() * 0.4),
				height: height * (0.25 + rand() * 0.35),
			});
		}
	}

	/**
	 * One rank of the belt: a crowd of leaf cards, and not a crowd of domes.
	 *
	 * This is the fourth attack on one fault and the first that changed the SHAPE and not the paint. The
	 * belt has been a row of smooth green eggs, then crumpled green eggs, then crumpled green eggs wearing
	 * a bigger pattern, and a browser called it a field of mossy boulders every single time
	 * (`pictures/tmp-melon-before.png`, the near rank at nineteen metres). A dome is ONE surface with ONE
	 * gradient on it — a lit flank, a dark foot, a pale cap where the low sun grazes the top, and a round
	 * outline with nothing broken about it — and that is what a stone is, in any green you paint it.
	 *
	 * A shell of cards answers the three things the picture was reading:
	 *
	 *   - the outline is cut to rags at the size of a leaf cluster, because every card is cut on an alpha
	 *     canvas of leaves and shingles past its neighbours by a third of a metre;
	 *   - there is no one gradient any more: a hundred small faces turn a hundred ways to the sun, so the
	 *     light and dark over a crown is a speckle and not a wash;
	 *   - the inside of a crown is dark, which is what a canopy does with a metre of leaf between it and
	 *     the sky — and a dome can only ever be brightest at its top, which is the cap on a rock.
	 *
	 * The cards are sat on the skin of an ellipsoid, one ellipsoid to a crown, with a jitter in size, place,
	 * roll and lean. Each face looks out along its own radius and is tilted up: the sun stands twenty-four
	 * degrees up here, so a shell tilted flat would light its equator and go dark above it, and a wood seen
	 * from the garden is lit over the whole of its head.
	 *
	 * `cluster` is how wide one cluster of the atlas is, in metres of crown. It is asked here and not
	 * taken from the material because one rank is twenty metres off and the other fifty-five, and the leaf
	 * has to reach the screen at both. Every card is inked with ONE cluster of `canopyClusterCanvas` — the
	 * whole cell, at one of eight orientations, at a size of its own — so the card's own border falls in the
	 * air that lies around the cluster and there is nothing there for the border to cut straight.
	 */
	function cardRank(name, spots, mat, { cluster = canopyAtlas.cluster, cols = canopyAtlas.cols, size = canopyAtlas.size, seed = 901, cover = 1.5 }) {
		const rand = randomGenerator(seed);
		// One cell of the atlas, and the half-texel the corners are pulled in by so no cluster next door can
		// be dragged into this one by the filter.
		const cell = 1 / cols;
		const inset = 0.5 / size;
		const positions = [];
		const uvs = [];
		const normals = [];
		const indices = [];
		const colours = [];
		for (const s of spots) {
			const rx = s.width / 2;
			const ry = s.height / 2;
			const rz = rx * (0.76 + rand() * 0.42);
			const cy = s.height * 0.5;
			// One tree to a crown, and not one tree cloned four hundred times: this one pale and
			// sun-yellow, that one a shade darker and cooler. A crowd of crowns all of one tone is one
			// balloon with bumps on it. The tone is written at every corner of every card of the crown, so
			// the tone changes where one crown ends and the next begins.
			const pale = rand() * 2 - 1;
			const tone = 1 + pale * 0.22;
			const tint = [tone * (1 + pale * 0.1), tone, tone * (1 - pale * 0.12)];
			// Cards about a third of the crown across, and enough of them to lay about the crown's own skin
			// in leaf. Fewer and the sky comes through the middle of a crown; more closes the mass up and
			// throws away the ragged edge that is the whole point.
			const side = cluster * (0.95 + rand() * 0.5);
			const skin = 4 * Math.PI * ((rx * ry + ry * rz + rz * rx) / 3);
			const count = Math.max(10, Math.min(90, Math.round((skin * cover) / (side * side))));
			for (let k = 0; k < count; k++) {
				// A direction on the sphere — even in height, which is what a ball of leaf is — and a card
				// sat on the ellipsoid along it, a little past the skin so the outline shingles.
				const azimuth = rand() * Math.PI * 2;
				const height = 1 - 2 * rand();
				const ring = Math.sqrt(Math.max(0, 1 - height * height));
				const dx = Math.cos(azimuth) * ring;
				const dy = height;
				const dz = Math.sin(azimuth) * ring;
				const reach = 0.82 + rand() * 0.3 + 0.3 * Math.max(0, dy);
				const px = s.x + dx * rx * reach;
				const py = cy + dy * ry * reach;
				const pz = s.z + dz * rz * reach;
				// The way the card looks: out along its own radius, tilted up off it — but not near the crest.
				// A card laid flat on top of a crown makes a table of green shingle, and a row of tables read
				// as one turf roof across the belt (`pictures/tmp-cards4-south.png`); up there the cards are
				// pushed further out and turned more upright, so the crest is a bush and not a surface.
				const crest = Math.max(0, dy);
				let nx = dx;
				let ny = dy * 0.6 + 0.4 * (1 - 0.75 * crest);
				let nz = dz;
				const nl = Math.hypot(nx, ny, nz) || 1;
				nx /= nl;
				ny /= nl;
				nz /= nl;
				// Its own right is horizontal and across the face; its own up is what is left of the sky
				// once the face has taken its share. Both are then rolled about the face, so no two cards
				// in the belt are hung alike.
				let ux = -dz;
				let uz = dx;
				const ul = Math.hypot(ux, uz) || 1;
				ux /= ul;
				uz /= ul;
				const vx = ny * uz;
				const vy = nz * ux - nx * uz;
				const vz = -ny * ux;
				const vl = Math.hypot(vx, vy, vz) || 1;
				const roll = rand() * Math.PI;
				const cos = Math.cos(roll);
				const sin = Math.sin(roll);
				const rightX = ux * cos + (vx / vl) * sin;
				const rightY = (vy / vl) * sin;
				const rightZ = uz * cos + (vz / vl) * sin;
				const upX = (vx / vl) * cos - ux * sin;
				const upY = (vy / vl) * cos;
				const upZ = (vz / vl) * cos - uz * sin;
				const half = side * (0.45 + rand() * 0.3) * (1 - 0.15 * crest);
				const tall = half * (0.8 + rand() * 0.5);
				// Which cluster this card wears, and which of the eight ways of hanging it: a cluster that is
				// only ever seen upright and right-way-up is a stamp, and a stamp is the one thing a wood never
				// is. Sixteen clusters times eight orientations, before the card's own size, roll and tilt.
				const u0 = Math.floor(rand() * cols) * cell;
				const v0 = Math.floor(rand() * cols) * cell;
				const flipU = rand() < 0.5;
				const flipV = rand() < 0.5;
				const cross = rand() < 0.5;
				const at = positions.length / 3;
				for (const [cu, cv, su, sv] of [[-half, -tall, 0, 0], [half, -tall, 1, 0], [-half, tall, 0, 1], [half, tall, 1, 1]]) {
					positions.push(px + rightX * cu + upX * cv, py + rightY * cu + upY * cv, pz + rightZ * cu + upZ * cv);
					normals.push(nx, ny, nz);
					colours.push(tint[0], tint[1], tint[2], 1);
					const fu = (flipU ? 1 - su : su) * (cell - 2 * inset) + inset;
					const fv = (flipV ? 1 - sv : sv) * (cell - 2 * inset) + inset;
					uvs.push(u0 + (cross ? fv : fu), v0 + (cross ? fu : fv));
				}
				// Wound so the plain cross product points BACK along the face — that is what looking along
				// the normal means in this library, and `skylineBand` below has the same lesson written out.
				indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
			}
		}
		const mesh = poly(scene, name, { positions, indices, uvs, mat });
		// `poly` works its normals out of the triangles. For a loose card that is the same way the face
		// already looked, minus the tilt up, and the tilt is the whole of the light on a crown: these are
		// the directions the cards were hung to look along, and the sun and the sky are read against them.
		mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
		mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
		return mesh;
	}

	const nearSpots = [];
	for (const [i, s] of ringRound(rand, 64, hedgeCentre, [hedgeHalf[0] + 4, hedgeHalf[1] + 4], 9).entries()) {
		if (rand() < 0.08) continue; // an opening now and then, so the belt is a wood and not a fence
		const height = 4 + rand() * 1.2 + lump(i, 0.9, 0.7) * (2.2 + rand() * 1.8);
		crownSpots(nearSpots, s, height, 4.5 + rand() * 3.5);
	}
	// The cluster size and the atlas layout come from `canopyAtlas`, which is also what `canopyClusterCanvas`
	// was painted to, so the cutter and the painter cannot drift apart. `cover` is higher than it was: a
	// cluster is leaf and air, and the air is what makes its edge ragged, so more clusters are needed to
	// keep a crown from being see-through.
	const belt = cardRank("jungleBelt", nearSpots, mats.jungle, { seed: 907, cover: 1.85 });

	// The far rank: a wood on a rise, and NOT a second row of crowns.
	//
	// It used to be exactly that — the same card crowns at two metres and a half to a repeat, standing
	// twenty-six to fifty-two metres beyond the hedge — and a browser photographed it as torn paper
	// (`pictures/s46-farrank.png`, the west lawn at fov 0.4: a spire of green shards where the tallest
	// crown was, and ragged sails either side of the sala). The reason is arithmetic. A crown there is six
	// to eleven metres across, and a card is a third of that, so the outline steps about in pieces two to
	// four metres across; forty metres off, one of those steps is fifty pixels of straight edge with a
	// hole behind it. Near in, at nine to twenty metres, the same card is a leaf cluster and reads as
	// leaf; out there it reads as geometry. Nothing about the paint could pay for that, and no amount of
	// `cover` will, because the holes are the silhouette and not the inside.
	//
	// So the far rank is built the way the far tree line is built — one mass with an edge (`skylineBand`
	// below) — at three times the nearness, which sets every number on it: the edge steps at the size of a
	// stand, a clump and one crown (three wavelengths, and no finer, because a wave shorter than three
	// samples of the step comes out a saw and not a crest), the mass stands 13-27 m up so its head shows
	// over the near rank and under the far line, and it wears `farCanopyCanvas` at twelve metres to a
	// repeat — crowns six to twelve metres across, which is the size a head of a far tree actually IS at
	// that distance, and the thing the leaf canvas could not say. This also takes twenty-nine thousand
	// alpha-tested triangles out of every frame and puts two thousand back in, which at the frame rate this
	// sandbox has is worth having in its own right.
	const beltHigh = skylineBand(scene, mats.jungleFar, "jungleHighBelt", {
		centre: hedgeCentre,
		half: [hedgeHalf[0] + 26, hedgeHalf[1] + 26],
		step: 1,
		spread: 11,
		low: 13,
		high: 27,
		tile: 12,
		base: -2,
		seed: 1103,
		waves: [
			// Four wavelengths, and the longest one is no longer the boss of the edge.
			//
			// It used to be three: 30 m of stand, 10 m of clump, 4 m of crown, weighted 0.4 / 0.32 / 0.28 — and
			// the ring stands about fifty metres from the middle of the garden, where thirty metres of anything
			// is thirty-three degrees of sky. A browser photographed the result as a range of green mountains
			// (`pictures/s68-horizon.png`, the north view): broad humps, one every third of the frame, with a
			// smooth flank and no head in them. Nothing fifty metres off is that wide; a crown eight metres
			// across is nine degrees of view there, and that is the size the edge has to wiggle at.
			//
			// So the stand came down to fifteen metres and the crown kept four, and the longest wave of all —
			// forty metres, a wood and not a stand — is left in at a sixth, which is what keeps a low stretch
			// of the ring low and a tall stretch tall without drawing a hill. Nothing here is finer than four
			// metres, because the ring is walked at one: three samples of a wave is the most that is ever safe.
			[40, 0.12, 5], // a whole wood: the slow rise and fall of it
			[15, 0.22, 0], // a stand of trees, fifteen metres of it
			[8, 0.38, 11], // a clump of crowns, which is where the edge has to do most of its work
			[4, 0.28, 23], // one crown, which at fifty metres is the finest thing a picture can read
		],
		// A quarter of a tile of wander over sixteen metres, and the seven-degree lean the rank has always
		// had. Over a twelve-metre tile the old wander — 0.4 to 1.6 of a tile, every six metres — drags the
		// crowns five metres sideways in half a crown's width, and a browser showed them smeared; the lean is
		// an angle and not a distance, so it is the same seven degrees at any tile and it still slides the
		// crown pattern most of a crown sideways over the curtain's own height.
		warp: { at: 0.45, wave: 16, lean: 0.12 },
	});

	// Eight coconut palms standing over the belt, so the skyline has something thin in it. These are the
	// garden's own palm builder at 1.5 scale, with a third of the leaflets: seventy metres out, a leaflet is
	// two pixels wide and the crown is read as a shape and a ragged edge and nothing else. The version before
	// this one was a bare pole with a green plate nailed on the top: seven cards hung tangentially make a
	// pancake and not a crown, and a pancake on a 0.5 m trunk eighty metres out reads as a telegraph pole
	// (`pictures/tmp-air-south.png`). The garden's fronds hang radially and droop, which gives the head
	// some bulk, and the lean the builder already has gives the trunk some.
	const trunks = [];
	const fronds = [];
	for (const [i, s] of ringRound(rand, 8, hedgeCentre, [hedgeHalf[0] + 14, hedgeHalf[1] + 14], 20).entries()) {
		const [crown, trunk] = makePalm(scene, mats, {
			x: s.x,
			z: s.z,
			height: 13 + rand() * 6,
			lean: 0.3 + rand() * 0.45,
			twist: rand() * Math.PI * 2,
			seed: 601 + i * 7,
			scale: 1.5,
			nuts: 0,
			foot: false,
			frondsNear: 9,
			stationsNear: 8,
			segmentsNear: 1,
		});
		if (trunk) trunks.push(trunk);
		if (crown) fronds.push(crown);
	}

	// ---- the far tree line: the wood on the far ridge
	//
	// Every version of this line has been a row of domes, and every version has been read as rock: first
	// grey fingers sixty-five metres up, then a field of pale domes, then — crowns widened into a shelf —
	// huge green boulders with dark gaps down between them (`pictures/619-grass.png`, the east lawn, the
	// whole upper third). A dome is a tree's head, and a head is not what a wood shows from a hundred and
	// thirty metres away. What it shows is a MASS with an EDGE: one flat tone, and a top that steps about
	// at the size of a tree and no bigger. Domes of one size cannot do either, however many you lay: each
	// one shades as one clean ball and leaves sky in the gaps.
	//
	// So this is a curtain of stone-cold quads laid along the ring — see `skylineBand` below — and the
	// hills behind it are the same trick at a bigger scale. It has to stand 24-44 m up to show its head
	// over the belt in front of it, which is what a ridge of jungle does and what a tree line 110 m out
	// never managed to look like while it was made of trees.
	const far = skylineBand(scene, mats.farTree, "farBelt", {
		centre: hedgeCentre,
		half: [116, 106],
		step: 3,
		spread: 16,
		low: 24,
		high: 44,
		tile: 30,
		seed: 61,
	});
	meshes.push(far);

	// Fold the palms into two meshes. The browser draws a handful of things out there instead of a
	// hundred and thirty, and the drawing tool reads them just as easily. The two ranks of the belt are
	// already one mesh each, because `cardRank` lays every card of a rank into one buffer.
	meshes.push(belt, beltHigh);
	for (const [parts, mat, name, keepColours] of [
		[trunks, mats.palmBark, "farPalmTrunks", false],
		[fronds, mats.palmLeaf, "farPalmFronds", true],
	]) {
		const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, keepColours);
		if (merged) {
			merged.material = mat;
			merged.name = name;
			meshes.push(merged);
		}
	}
	return meshes;
}

/**
 * A wood on a far ridge: a band of jungle, and not a row of trees.
 *
 * It is a curtain of flat quads, one to every `step` metres of the ring, standing from `base` (under the
 * ground, so nothing floats) up to a top edge that wanders at three scales: a stand of trees forty metres
 * across, a clump of thirteen, and the single head of four and a half. That last one is the whole point.
 * Seen from a hundred and thirty metres, four metres of crown is forty-odd pixels: big enough to see as a
 * step in the skyline and small enough never to read as a shape. A row of domes can only ever give the
 * first of the three, and a picture has called that a field of boulders three times now.
 *
 * Each point is also pushed in and out along the ring's own normal — `spread` metres for the long wave of
 * the ridge coming nearer and further, and two and a half at nineteen, which tilts the faces so the sun has
 * something to vary across instead of laying one flat wash down a whole side of the ring. Both those
 * wavelengths are long on purpose: tilting the faces at the size of a step or two instead — six metres, the
 * first try — gives every other quad its own light and dark, and the north-west of the ring came out of the
 * browser striped like a blind (`pictures/632-rearcorner.png`). The same lesson in the same mesh: the light
 * and dark of the mass started at thirty-four, eleven and four metres and the four-metre one went first, and
 * for the same reason.
 *
 * The faces are wound to look INWARD, at the garden, and their normals follow that winding — which in this
 * library means each of the pair comes out reversed from the plain cross product, because the library is
 * left-handed. Getting this wrong is quiet, and half wrong looks nearly right: with one of the two triangles
 * of every quad left the other way round the band still shows, because half of each quad faces in, and the
 * mean normal of the mesh over all its vertices is then 0.03 — neither in nor out, and invisible unless you
 * ask. The check is that mean, read off the live page with `tools/dump.js`, and it is 0.88 with 99% of the
 * vertices turned at the middle of the garden. The material is not culled at all, so nothing can vanish
 * when a tool camera stands outside the ring.
 *
 * The pattern goes on at `tile` metres to a repeat, the way the lawn and the deck do, and not once over
 * each crown the way a tree's head would take it: out here the pattern is not leaf, it is which part of
 * the ridge is in shade.
 */
function skylineBand(scene, mat, name, { centre, half, step = 3, spread = 16, low = 24, high = 44, tile = 30, base = -4, seed = 61, waves = [[46, 0.55, 0], [13, 0.28, 11], [4.5, 0.17, 23]], warp = 0 }) {
	const [cx, cz] = centre;
	const [hx, hz] = half;
	// `warp` is either nothing (the far tree line, whose pattern is thirty metres to a repeat and needs no
	// pulling) or a small object: `at` how far the spacing along the ring wanders, `wave` how far it walks
	// before it wanders the other way, and `lean` how far the pattern slides sideways for every repeat of
	// height it climbs. A plain `1` keeps the old numbers — a wander of 0.4 to 1.6 of a tile over six metres
	// and a lean of 0.12 — which were fitted to a two-metre tile.

	// The four sides of the boundary, walked in order and joined up at the corners.
	const walk = [];
	for (let x = -hx; x < hx; x += step) walk.push({ x: cx + x, z: cz + hz, nx: 0, nz: 1 });
	for (let z = hz; z > -hz; z -= step) walk.push({ x: cx + hx, z: cz + z, nx: 1, nz: 0 });
	for (let x = hx; x > -hx; x -= step) walk.push({ x: cx + x, z: cz - hz, nx: 0, nz: -1 });
	for (let z = -hz; z < hz; z += step) walk.push({ x: cx - hx, z: cz + z, nx: -1, nz: 0 });

	const edge = walk.map((p) => {
		const push = (groundNoise(p.x, p.z, 70, seed + 3) - 0.5) * 2 * spread + (groundNoise(p.x, p.z, 19, seed + 41) - 0.5) * 5;
		const x = p.x + p.nx * push;
		const z = p.z + p.nz * push;
		// The height of the edge, as a weighted walk over the ring at three or four wavelengths. `waves`
		// is [wavelength in metres, weight, seed offset] and its weights sum to about one, so `low` and
		// `high` are metres and not fractions of a guess.
		//
		// No wavelength here may come near the step the ring is walked at, and the near band learned why:
		// at a 1.8 m wave sampled every metre the crest came out a saw, tooth after tooth, all of them
		// alike. Three samples of a wave is the least that reads as a wave; anything finer is an alias, and
		// an alias is regular by construction.
		let top = low;
		for (const [wave, weight, seedAt] of waves) top += (high - low) * weight * groundNoise(x, z, wave, seed + seedAt);
		return { x, z, top };
	});

	const positions = [];
	const uvs = [];
	const indices = [];
	const w =
		warp && typeof warp === "object"
			? { at: warp.at || 0, wave: warp.wave || 6, lean: warp.lean || 0 }
			: { at: warp ? 1.2 : 0, wave: 6, lean: warp ? 0.12 : 0 };
	let u = 0;
	for (let i = 0; i < edge.length; i++) {
		const a = edge[i];
		const b = edge[(i + 1) % edge.length];
		const across = Math.hypot(b.x - a.x, b.z - a.z);
		const n = positions.length / 3;
		// The pattern is pulled off its own grid, and it exists because a curtain, unlike a crowd of cards,
		// lays its pattern on one clean strip: left alone it repeats at a fixed distance the whole way round
		// and the eye, which is built for exactly this, finds the grid at once and calls the wood wallpaper.
		// Two warps, both smooth, both without a seam anywhere:
		//
		//   `squeeze` — the spacing along the ring wanders by `at` of a tile over a wavelength of `wave`
		//     metres, so the repeats stop landing in a line;
		//   `lean` — the whole pattern leans over as it goes up, by `lean` of a repeat for every repeat of
		//     height: without it the pattern stands in columns, one above the other the whole way up, and
		//     columns are what the eye counts next after a grid.
		//
		// Both have to be small compared with the tile they are warping, and both were measured back down from
		// too big. A lean of 0.45 — twenty-four degrees — broke the columns and put a rain-stripe in their
		// place, because a shear that strong turns every leaf into a streak (`pictures/tmp/s46-lean.png`). And
		// a phase that slid up and down with the ring position instead of leaning steadily (a `shear`, at half
		// a tile over eleven metres) stepped the pattern by a fifth of a tile every step, which is a comb: the
		// sprays came out combed vertically along every quad (`pictures/tmp/s46-1715-top.png`). A lean the
		// whole ring shares cannot step, and a lean of seven degrees cannot comb. The `squeeze` learns the
		// same lesson from the other side: it stretches the pattern it wanders, so on a twelve-metre tile an
		// `at` of 1.2 — which is nothing at two metres — drags the crowns sideways by six metres and smears
		// them.
		const squeeze = 1 + w.at * (groundNoise(a.x, a.z, w.wave, seed + 61) - 0.5);
		const lean = w.lean;
		const ua = u / tile;
		const ub = (u + across * squeeze) / tile;
		const ha = (a.top - base) / tile;
		const hb = (b.top - base) / tile;
		positions.push(a.x, base, a.z, a.x, a.top, a.z, b.x, base, b.z, b.x, b.top, b.z);
		uvs.push(ua, 0, ua + lean * ha, ha, ub, 0, ub + lean * hb, hb);
		indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
		u += across * squeeze;
	}
	const mesh = poly(scene, name, { positions, indices, uvs, mat });
	// Which part of the ridge is stands of one kind of tree and which another: light and dark patches of
	// thirty metres, eleven and four, multiplied in at the corners. A hundred metres out this is most of
	// what a wood is — the picture has three times called a one-tone ridge a rock — and it is the same
	// lever the lawn and the deck use for their broad patches (`tintFromGround`), asked here in metres of
	// ridge instead of metres of garden.
	tintFromGround(mesh, (x, z) => {
		// 0.62 to 1.34 of light, and not the 0.76 to 1.28 this stood at: a browser kept the ridge flat to
		// 7-9 points of spread across 60 points of the frame (`tools/ridge.json`, `tools/cover.js` on the
		// band), which is the same complaint the belt had and the only lever on a curtain of flat quads that
		// demonstrably reaches the screen — the canvas's own masses are three metres across and at a
		// hundred and ten metres those are forty pixels of nothing, because the engine has already averaged
		// them to their own mean.
		const t = 0.62 + 0.72 * (0.65 * groundNoise(x, z, 48, seed + 5) + 0.35 * groundNoise(x, z, 15, seed + 17));
		return [t, t, t];
	});
	return mesh;
}

/**
 * Points evenly around a rectangle: `count` of them, each pushed out from the edge by up to
 * `spread` metres along the outward normal. `centre` and `half` are the rectangle, in metres.
 */
function ringRound(rand, count, centre, half, spread) {
	const [cx, cz] = centre;
	const [hx, hz] = half;
	const perimeter = 4 * (hx + hz);
	const out = [];
	for (let i = 0; i < count; i++) {
		let d = ((i + rand()) / count) * perimeter;
		let x = 0;
		let z = 0;
		let nx = 0;
		let nz = 0;
		if (d < 2 * hx) {
			x = cx - hx + d;
			z = cz + hz;
			nz = 1;
		} else if ((d -= 2 * hx) < 2 * hz) {
			x = cx + hx;
			z = cz + hz - d;
			nx = 1;
		} else if ((d -= 2 * hz) < 2 * hx) {
			x = cx + hx - d;
			z = cz - hz;
			nz = -1;
		} else {
			d -= 2 * hx;
			x = cx - hx;
			z = cz - hz + d;
			nx = -1;
		}
		const push = rand() * spread;
		out.push({ x: x + nx * push, z: z + nz * push });
	}
	return out;
}

function seededRandom(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}
