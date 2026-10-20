// The materials of the Villa: what every surface is made of.
// Each one is a physically based material built from a painted canvas pattern, so no surface
// in the Villa is a single flat colour.

import { texture, grassCanvas, paverCanvas, poolTileCanvas, plasterCanvas, teakCanvas, roofTileCanvas, palmBarkCanvas, palmBladeCanvas, bananaBladeCanvas, stalkCanvas, bushCanvas, bushEdgeCanvas, bushClusterCanvas, tuftAtlasCanvas, clothCanvas, cushionCanvas, copingCanvas, poolWaterCanvas, causticsCanvas, rippleCanvas, hedgeCanvas, canopyClusterCanvas, canopyAtlas, farCanopyCanvas, distanceCanvas, greyNoiseCanvas, bumpFromCanvas, timberCanvas, terracottaCanvas, rockCanvas, soilCanvas, rugCanvas, butterflyWingCanvas, cockroachCanvas, frogSkinCanvas, lilyPadCanvas, rippleRingCanvas, koiCanvas, sharkSkinCanvas, bloodCanvas, geckoSkinCanvas, royalCoinCanvas, puffCanvas, flashCanvas, smokeCanvas, ringCanvas, streakCanvas } from "./textures.js";

const { PBRMaterial, StandardMaterial, Color3, Color4, Constants, Texture, ImageProcessingConfiguration } = BABYLON;

function pbr(scene, name, { color = [255, 255, 255], roughness = 0.8, metalness = 0, alpha = 1, environmentalIntensity = 1, pattern = 0 } = {}) {
	const mat = new PBRMaterial(name, scene);
	// How big one repeat of this material's pattern is, in metres of the surface it lies on. See
	// `patternMetres` in mesh.js: a mesh built wearing a material that knows its own size is given
	// texture coordinates measured in metres, and the pattern's own scale stays at 1.
	if (pattern) mat.patternMetres = pattern;
	mat.albedoColor = new Color3(color[0] / 255, color[1] / 255, color[2] / 255);
	mat.roughness = roughness;
	// The library's own name for this is `metallic`; `metalness` is the plain word used at every call site, and
	// writing only that sets a property nothing reads — so six materials that asked to be metal (the gold, the
	// brass, the steel, the dark iron, and the raven's feather and sheen) have been rendering as painted plaster.
	//
	// It is written ONLY where metal is asked for, and that is not laziness. `metallic` ships as null on a new PBR
	// material and null is not the same as zero: setting 0 on the grass, the plaster and the rest lifted the whole
	// start view's mean from 130.1 to 188.7 and turned the lawn from (62,105,79) to (132,219,73), measured across
	// three identical runs each. Every colour in this Villa has been matched to photographs under the shading it
	// has always had, so re-shading all of it is a change for the master's eye and not something to slip in
	// beside a coin. The metals are fixed here; the finding about the rest is written in NOTES.md.
	if (metalness) mat.metallic = metalness;
	mat.metalness = metalness;
	mat.alpha = alpha;
	mat.environmentIntensity = environmentalIntensity;
	mat.maxSimultaneousLights = 6;
	return mat;
}

/**
 * A rough, dry surface's share of its own glassiness, with the brightness paid back as colour.
 *
 * `specularIntensity` ships at 1 on every material in this library, which is the shine of a mirror and
 * not of grass. Cutting it takes the glare off; lifting `albedoColor` gives back what the glare was
 * carrying, as the surface's own colour instead of as the sun's white. Both numbers were measured in a
 * browser with `tools/tint.js` on the south border view, where the lawn, the hedge and the jungle belt
 * together fill half the frame (pictures/431-spec-01..05.png, pictures/432-mode-01..05.png):
 *
 *   as it was     lawn (195,217,127) L206   tuft (133,153, 66)   hedge (29, 64, 12)   earth (231,175,129)
 *   sheen 0.25    lawn (114,133, 64) L124   tuft ( 75, 99, 27)   hedge (24, 50,  8)   earth (167,119, 77)
 *   + lift 1.8    lawn (137,172, 80) L158   tuft ( 87,117, 33)
 *   + lift 1.3    hedge (27, 57,  9) L47    jungle (33, 60, 19)  bush  (28, 50, 13)
 *   bush paid up  bush  (34, 63, 15) L53 — the shrubs came off the varnish as soot, so they are paid back
 *                 a little more than the rest: a shaded bush at L43 under a hedge at L47 is a hole in the
 *                 picture, and a bush whose leaves shade one another still has leaves on it (item 30).
 *                 That single-number payment has since been replaced by three numbers, one per channel,
 *                 and the leaf itself was rebuilt: see the bush lines in the second table below.
 *
 * The thing to read out of that is the green. As it stood the lawn's red channel was within 22 of its
 * blue and its green: mint cream, a sheet of shallow water over sand, which is what the master called
 * "no texture, and fully translucent". It was not translucent — it was a white glare lying on top of a
 * green pattern, and the glare is what the eye reads first, so the mown bands and the two swards under
 * it never got to be seen. At sheen 0.25 the green stands 57 above the red and the pattern shows.
 *
 * There is no older, simpler shading to fall back on: `usePhysicalLightingMode` is still a property in
 * Babylon 9.30, and switching it off on all fifteen of these surfaces moved no pixel whatever across
 * an 880-point grid, which is why that line is gone from `pbr` and this is here instead.
 *
 * **The floor of the garden needs that cut taken a great deal further.** A lawn is a flat
 * sheet of the same colour turned square at the sky, seen most of the time at a grazing angle, which is
 * the worst case there is for a mirror: at sheen 0.25 the sunlit sward on the south border view was
 * still (142,183,87) L167 with its brightest pixel (189,223,127) — mint cream, fault 29, and still mint.
 * Measured there with `tools/tint.js --fresh` (the seven pictures of that ladder, `pictures/tmp-mint-01`
 * to `-07`, were pruned later; the numbers stand here in full):
 *
 *   sheen 0.25, lift 1.8 (as it was)  lawn (142,183,87) L167   brightest 189,223,127
 *   sheen 0.08, lift 1.8              lawn ( 82,119,45) L106   — sixty-one points of the frame's green
 *                                      was still the sky, not the grass
 *   sheen 0.00, lift 1.8              lawn ( 30, 70,18) L 58   brightest 43,90,32 — a lawn with no sky in it
 *   sheen 0.08, lift 3.6              lawn (114,175,70) L154   brightest 154,214, 98 — grass again
 *   sheen 0.08, lift 4.2/3.6/2.4      lawn (124,175,54) L155   brightest 164,214, 89 — and warm
 *
 * The last line is the one written: the same light, spent on red instead of on blue. With the glare gone
 * what is left is a green standing 61 above its red with 70 of blue in it, which is printer's green and
 * not a lawn in evening sun; a sward lit by a 24° sun and a pale sky sits nearer (124,175,54), the red
 * and the blue sixty points apart. The lift is therefore three numbers and not one: 4.2 red, 3.6 green,
 * 2.4 blue, written in light and not in bytes.
 *
 * and the two levers fault 29 named, weighed on the same camera: taking a fifth of the canvas's light
 * out moved the lawn's mean five points (135,171,82), and the sky fill's blue moved it none at all —
 * `hemi.diffuse.b` at 0.7 and at 0.6 both leave the sward at (142,183,85). The glare was never the
 * hemisphere's diffuse; it is the specular lobe, which at grazing angles is the sky cube reflected.
 * So the payment back is big (3.6, written in `albedoColor` and not in the canvas, because the same
 * canvas is the lawn's bump and brightening it would move the relief too), and it is checked at three
 * angles at once in `tools/lawnmint.json`: raking, raked from the west, and straight down from 20 m,
 * where a lift paid for a glare that is not there from above would over-brighten. It does not: the same
 * lawn under the camera goes (72,110,20) L96 → (73,122,21) L104, eight points and twenty-one of green
 * added. At nought sheen the same place falls to (43,84,13) L70, which is why 0.08 is 0.08 and not 0.
 */
function matte(mats, name, { sheen = 0.25, lift = 1 } = {}) {
	const mat = mats[name];
	if (!mat) throw new Error(`no material named "${name}" to matte`);
	mat.specularIntensity = sheen;
	// `lift` is one number, or three: red, green and blue separately, for a surface that has to pay its
	// glare back in a particular colour and not in grey (see below, under the lawn).
	if (Array.isArray(lift)) {
		mat.albedoColor.r *= lift[0];
		mat.albedoColor.g *= lift[1];
		mat.albedoColor.b *= lift[2];
	} else if (lift !== 1) {
		mat.albedoColor.scaleToRef(lift, mat.albedoColor);
	}
	return mat;
}

/**
 * A colour written as bytes on a screen, turned into the light the engine works in.
 *
 * `albedoColor` is read as raw light. A pattern is decoded out of sRGB into light by the engine, but a
 * colour set straight on the material is taken as it stands, so the bytes a picture measured are not
 * the numbers to write: [150,104,62] as a colour is near twice the light those same bytes make inside
 * a pattern. Measured in Chromium on the start view before this was put right: the terracotta pot by
 * the steps, whose colour is [176,118,78], painted (253,246,235) — white, no clay in it at all — and
 * the deck chairs, [150,104,62], painted (235,214,185). Through `paint` the pot reads (254,228,184)
 * and a chair (217,151,89): still bright, because a face turned square at the sun is bright, but their
 * own colour on them.
 *
 * Only things with no pattern on them are painted this way. One kind of colour is left as bytes: the
 * ones that multiply a pattern (the paving, the coping, the two ranks of jungle). A multiplier is
 * already only a fraction of what the pattern is, and those three were fitted to browser pictures
 * with the multipliers standing where they are, so moving both at once would tell us nothing about
 * either. The two flat greens out at the edge of the garden — the tree line and the hills — were left
 * as bytes too, and that is what made the far tree line a white board: they are painted honestly now,
 * and they have a pattern of their own to keep them from being one flat tone.
 */
function paint(color) {
	const toLight = (byte) => {
		const c = byte / 255;
		return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	};
	return new Color3(toLight(color[0]), toLight(color[1]), toLight(color[2]));
}

/**
 * Both faces of a cut-out sheet, drawn and lit from the side they are seen from.
 *
 * A leaf, a frond and a grass clump are sheets: thin, seen through, and seen from both sides. Two
 * switches are needed for that and they do different things, and getting one of them wrong is silent.
 *
 *   backFaceCulling = false   — draw the far side of a sheet at all. This is load-bearing on a sheet whose
 *                                mesh has ONE winding, and the grass clumps are that kind: built by hand
 *                                four vertices at a time, measured at 1473 sheets and 5892 vertices with
 *                                every normal pointing up. With culling on, about half of every clump was
 *                                not drawn at all. On the other kind of sheet — a library plane built
 *                                `Mesh.DOUBLESIDE`, which is what the fronds and the banana leaves are —
 *                                the mesh already carries reversed triangles with flipped normals of
 *                                their own, and this switch changes no pixel whatever.
 *   twoSidedLighting = true   — light a face by the normal of the side it is seen from. This is the switch
 *                                that moves the leaves, and it moves all of them: with it off, fronds
 *                                back-lit on the south-border view measured (132,141,99), a grey-green
 *                                veil, against the lawn beside them at (158,181,59); with it on they
 *                                measure (42,103,35) and have their colour.
 *
 * So the two kinds of sheet each needed a different one of these, and that is how the fault survived being
 * looked at: whichever switch you checked, half the Villa looked fixed. Both are read off a live page and
 * checked by `tools/sheets.js`, which prints what each one is doing on every sheet in the Villa.
 *
 * `doubleSided` is NOT this. On this library's PBR material that name is an old alias whose setter
 * never reaches `_twoSidedLighting`: setting it and reading it back in a live page returns the value
 * you wrote, and changes nothing about the picture — the same five bytes of a frame before it and after
 * it. Two files used to believe it; `tools/sheets.js` now fails if the name comes back.
 */
function sheet(mat) {
	mat.backFaceCulling = false;
	mat.twoSidedLighting = true;
	return mat;
}

/** Adds a roughness map so big smooth surfaces catch the light unevenly. */
function roughTexture(scene, { cells = 24, seed = 301, low = 0.6, high = 1 } = {}) {
	const tex = texture(scene, greyNoiseCanvas(256, cells, seed, low, high), { name: `rough${seed}`, scale: 1, gamma: false });
	return tex;
}

export function createMaterials(scene) {
	const mats = {};

	// ---- ground and paving -------------------------------------------------
	mats.lawn = pbr(scene, "lawn", { roughness: 0.95 });
	// The lawn's texture coordinates are baked in metres, so these materials tile once.
	//
	// One canvas, at 1024, for the colour, and drawn down to 512 for the relief: one tile is six metres
	// of ground, so a texel here is six millimetres and a blade of grass is a texel or three across,
	// which is as fine as a pattern can be painted. It used to be two canvases — 512 for the colour, 256
	// for the bump — and at those sizes the blade a person sees from a metre or two off was in neither of
	// them. The bump is drawn down rather than painted again, because a blade's relief does not need a
	// million pixels and the boot of the Villa is paid for every one of them.
	const lawnTile = grassCanvas(1024);
	mats.lawn.albedoTexture = texture(scene, lawnTile, { name: "grass", scale: 1 });
	mats.lawn.roughnessTexture = roughTexture(scene, { cells: 20, seed: 311, low: 0.62, high: 1 });
	mats.lawn.bumpTexture = texture(scene, bumpFromCanvas(lawnTile, 60, 512), { name: "lawnBump", scale: 1, gamma: false });
	// A tenth and a half, and not the quarter it was. The bump is a field of random tilts over a sheet of
	// ground that is otherwise flat: close to, that is grass, and at twenty metres it is a glittering
	// sheet with no colour of its own in it. Measured on the sward 7.6 m off (`tools/lawnbump.json`):
	// at 0.35 it stands at L151, at 0.25 at L155, at 0.15 at L160 and with the bump switched clean off
	// L161 — so the last tenth and a half costs one point of light and keeps all of the relief, which is
	// the trade the earlier sessions made on the old coarse bump (0.5 → 0.25, then L141 → L153) and is
	// made again here because the bump is a different map now: fine blades, drawn down from the colour
	// canvas, and a blurred bump eats a great deal more light than a crisp one. The same fault was found
	// on the teak floor (NOTES, fault 4) and the same knob fixed it there: 0.3.
	mats.lawn.bumpTexture.level = 0.15;

	mats.paver = pbr(scene, "paver", { color: [140, 134, 124], roughness: 0.72 });
	// As with the lawn: the paving's texture coordinates are in metres.
	mats.paver.albedoTexture = texture(scene, paverCanvas(1024), { name: "paver", scale: 1 });
	mats.paver.roughnessTexture = roughTexture(scene, { cells: 26, seed: 313, low: 0.6, high: 1 });
	mats.paver.bumpTexture = texture(scene, bumpFromCanvas(paverCanvas(512, { relief: true, joint: "#6e6450" }), 22), { name: "paverBump", scale: 1, gamma: false });
	// The relief is painted separately from the colour and with a dark joint on purpose, and it is worth
	// two lines: `bumpFromCanvas` reads height off the pattern's own luminance, so lightening the joint in
	// the colour canvas would have silently lifted every slab out of its bed. The colour end is dust; this
	// end is the centimetre the slab is sunken, and it stays dark so the near paving keeps its relief.
	//
	// It used to be `34` on the slope and `0.6` on the level, and a browser said what a ten-millimetre joint
	// at that steepness looked like in the late sun: every slab outlined in a black rule, the court read as
	// a waffle of dark lines rather than as pale stone with sand in its joints. Shallower now, and the joint
	// is a degree lighter at this end too, because a joint a pixel and a half wide has no middle left in it
	// once the slope is drawn — it is all edge.
	mats.paver.bumpTexture.level = 0.45;

	// One repeat of the stone every half metre of stone, so the grain and the flecks are the size they
	// are on a slab. It used to be laid four times across whatever face a coping piece presented, which
	// on the 10 m south coping meant a repeat 2.5 m long: the coping — the nearest ground in the start
	// view — came out of Chromium at (204,183,153) with 2.7 of light's spread between 8 x 8 pixel blocks
	// of it, a pale flat sheet with no stone in it at all.
	mats.coping = pbr(scene, "coping", { color: [206, 198, 182], roughness: 0.55, pattern: 0.5 });
	mats.coping.albedoTexture = texture(scene, copingCanvas(256), { name: "coping", scale: 1 });
	mats.coping.bumpTexture = texture(scene, bumpFromCanvas(copingCanvas(128), 16), { name: "copingBump", scale: 1, gamma: false });
	mats.coping.bumpTexture.level = 0.35;

	// ---- the pool inside ---------------------------------------------------
	// Twelve mosaic tiles to a repeat, so at 80 cm a repeat the tiles are 6-7 cm square: pool glass is
	// small, and the pit's walls used to wear theirs at eleven centimetres and the floor at two dozen.
	mats.poolTile = pbr(scene, "poolTile", { roughness: 0.32, environmentalIntensity: 1.2, pattern: 0.8 });
	mats.poolTile.albedoTexture = texture(scene, poolTileCanvas(512), { name: "poolTile", scale: 1 });
	mats.poolTile.bumpTexture = texture(scene, bumpFromCanvas(poolTileCanvas(256), 26), { name: "poolTileBump", scale: 1, gamma: false });
	mats.poolTile.bumpTexture.level = 0.5;
	// A tile that glows a little: a cheat for the light a pit has nowhere to get it from.
	//
	// The basin is walled in on four sides and this renderer has no bounced light, so a sunlit afternoon
	// leaves the tiles under the water at L129 while the coping standing free in the same sun reads L195 —
	// two thirds of the stone beside it, which is a coal scuttle and not a swimming pool. Measured on the
	// over-pool view: no emissive L129, at (0.06,0.12,0.13) L147, at (0.1,0.19,0.21) L156, and the middle
	// of those is what stands here (about three quarters of the coping). The water over it goes L126 -> L132.
	//
	// Two things that are NOT the cause of the pit's shade, measured so the next session does not chase them:
	// the shadow map (turn the sun's shadows off and the pit moves from L126 to L126 — nothing above the
	// pool casts into it), and a glossy tile (at roughness 0.12 the pit goes DOWN to L87, because a smooth
	// surface in this library returns the sky mirror only where the mirror line runs, and the floor of a
	// pit has none; 0.32 is what keeps the sky's flat light on it).
	mats.poolTile.emissiveColor = new Color3(0.06, 0.12, 0.16);

	// The tile the water touches, and the strip of coping it is splashed on.
	//
	// A pool with no line at its edge is a hole in the ground with a blue film in it: nothing says where the
	// water stops and the wall begins. `pictures/1341-pool.png` is the browser's own picture of that — tile
	// meeting coping in one hard bright line, with no waterline anywhere — and `pictures/1401-pool.png` is
	// the same camera with these two materials on. Wet stone is darker than the same stone a hand's width
	// above it, and cooler: a wet tile loses its red first, which is why the line reads as teal and not as a
	// grey smudge.
	//
	// Both are MULTIPLIERS on the very same pattern as their dry twin, and `pattern` is that twin's own
	// number, so the mosaic and the joint lines cannot shift out of true where the band meets the wall.
	//
	// The first try at these bytes left the band the tile's own colour times (0.62,0.70,0.72) and the pool's
	// emissive cheat unmoved: the browser put the band at L177 against the dry tile's L207 — fifteen points
	// of what fifteen points of albedo was owed, which is no line at all. The emissive is ADDED, not
	// multiplied, so it paid back at the band exactly what the albedo had taken off; it comes down with the
	// colour now.
	//
	// The bytes were then set by ladder from the only camera that can see the band at all — down at the
	// water, 10 cm above the film, 2.2 m from the north wall, where a 14 cm band is fifty pixels and not two
	// (`tools/wetladder.json`, and `?wet=` dials the pair from the address bar). Reading the band three
	// centimetres below its top against the dry tile six centimetres above it: the tile holds (124,160,158)
	// L152 at every setting, and the band came to L129 as first built (0.85 — still a shrug), L108 at six
	// tenths, L94 at four, L80 at a quarter. Six tenths is what stands: the band reads (80,115,118) L108,
	// five sevenths of the dry tile over it, its red nine points down on its green where the dry tile's is
	// two — darker and cooler, which is wet, and not the black gutter four tenths gave, which read as a
	// painted stripe.
	mats.poolWet = pbr(scene, "poolWet", { color: [67, 78, 81], roughness: 0.26, environmentalIntensity: 1.2, pattern: 0.8 });
	mats.poolWet.albedoTexture = mats.poolTile.albedoTexture;
	mats.poolWet.bumpTexture = mats.poolTile.bumpTexture;
	mats.poolWet.emissiveColor = new Color3(0.03, 0.062, 0.07);

	// Damp, not soaked: 0.71 of the coping's own bytes, a shade cooler, and it takes the coping's own
	// glare-treatment below (`1.8` lift, sheen `0.14`) so the two of them always move together.
	//
	// Measured straight down on the north coping, where the damp foot is thirty pixels wide and not three
	// (`tools/capprobe.json`, which is the only way of asking it: at eye height the strip is two pixels and
	// every box average paints it back to the dry stone). At roughness 0.4 and a full sky mirror it read
	// (147,136,125) L138 against the dry capstone's (213,186,150) L189 — four fifths of the stone, in a
	// hard band, which is a stripe of paint and not an edge. Backed off to the dry stone's own roughness
	// with the dome's mirror at 0.7 it reads (177,155,134) L158 — 0.84 of it, and cooler by twenty in red
	// against blue, which is what damp limestone looks like next to dry.
	mats.copingWet = pbr(scene, "copingWet", { color: [146, 145, 150], roughness: 0.55, environmentalIntensity: 0.7, pattern: 0.5 });
	mats.copingWet.albedoTexture = mats.coping.albedoTexture;
	mats.copingWet.bumpTexture = mats.coping.bumpTexture;

	mats.caustics = pbr(scene, "caustics", { roughness: 1, alpha: 1, pattern: 1.25 });
	mats.caustics.disableLighting = true;
	mats.caustics.emissiveTexture = texture(scene, causticsCanvas(256), { name: "caustics", scale: 1 });
	mats.caustics.opacityTexture = mats.caustics.emissiveTexture;
	mats.caustics.transparencyMode = 2;

	// The same net of light on the four WALLS of the pit, and a second canvas so it never matches the
	// floor's.
	//
	// The floor has worn caustics for a long while and the walls have had nothing at all, which a picture
	// of the start view says plainly: the far two thirds of the pool are the far WALL seen through the film
	// — the eye is 1.94 m up and the basin five metres across — and the only pattern on that wall was the
	// joint grid, so the joint grid was what the pool was made of. In a real pool the wall just under the
	// surface is the loudest thing in it: the surface focuses the sun into a net that crawls up and down
	// the tile within arm's length of the waterline, and below that arm's length the wall goes quiet. So
	// the net is laid on the four inside faces for the top 80 cm under the surface and nowhere lower, at
	// its own pitch (1.25 m to a repeat, seeds nowhere near the floor's) and its own speed, so floor and
	// wall never lock into one pattern.
	//
	// Emissive, like the floor's: a pool wall glows from the water's own focusing and no lamp in the sky
	// is asked to do it. It is a modulation and not a coat of paint — the mesh `visibility` in `src/pool.js`
	// holds it under half, because a net at full strength is a wire cage drawn over the tile.
	mats.causticsWall = pbr(scene, "causticsWall", { roughness: 1, alpha: 1, pattern: 1.25 });
	mats.causticsWall.disableLighting = true;
	mats.causticsWall.emissiveTexture = texture(scene, causticsCanvas(256, { seed: 407 }), { name: "causticsWall", scale: 1 });
	mats.causticsWall.opacityTexture = mats.causticsWall.emissiveTexture;
	mats.causticsWall.transparencyMode = 2;

	// ---- water -------------------------------------------------------------
	// The water is a sheet you can see THROUGH, and not a painted lid.
	//
	// It was a painted lid for twenty-one sessions, and a browser finally called it: a third of the start
	// view at (128,164,163) L156, flat as a printed sheet, with two emissive planes lying ON TOP of it as
	// the caustics, so the one thing that should have said "water" said "crumpled foil" (`pictures
	// /tmp-wc-01.png`: pale blots the size of a dinner plate and no bottom anywhere). The pool is the subject
	// of the first picture a visitor is shown, and it had no depth in it at all.
	//
	// So: alpha down to where a person can see the mosaic and the steps under the surface; the emissive
	// kept, but as the water's own colour — the light that comes back up through a metre and a half of
	// water has had its red eaten, and that is what the film paints — and not as the whole of the pool's
	// light; a bump of ripples of its own (`rippleCanvas`), so the mirror is never flat; and the caustics
	// moved down to the floor where they belong, made of thin lines instead of blots.
	//
	// The twenty-first session refused this road on real numbers, and those numbers still stand — read
	// them here before trying to make the pool brighter by making it shinier:
	//
	//   painted, as it stood       mean L156   26.8% over L180   6.8% over L220
	//   lit, flat, no waves        mean L159   27.5% over L180  16.5% over L220 — a bucket of milk
	//   lit, with the waves        mean L146   15.8% over L180   6.7% over L220
	//
	// What they meant, and what this session found on the other side of them: a lit water sheet mirrors
	// TWO per cent of the sky straight down and so cannot be lit up that way — but the milk was never the
	// waves' fault, it was `roughness`. The sky cube blurred over a surface at roughness 0.2 bathes the
	// whole basin in sky (measured: the same sheet reads L92 at roughness 0.06 and L149 at 0.2). Keep the
	// surface smooth and the reflection stays where a reflection belongs — a bright band at the far edge,
	// where the eye's mirror line runs into the sky and the house — and the near half stays water you can
	// see the bottom of.
	mats.water = pbr(scene, "water", { roughness: 0.06, alpha: 0.48, environmentalIntensity: 0.5, pattern: 1.7 });
	// Two dials on this sheet were ladderred in the seventieth session and both refused, and they are written
	// here so nobody spends a session on them. `roughness` 0.06 → 0.10 → 0.16 moved the water's mean by a
	// point and did nothing whatever to the hard-edged pale slab in the start view; the ripple's
	// `bumpTexture.level` (`?wrib=`) 0.7 → 1.2 lit the middle of the basin by a dozen points and left that
	// slab's edge as straight as it was. Both were asked in the hope the slab was a mirror — the sky's or the
	// house's — that a softer mirror would smudge. It is no mirror: `tools/pickat.js` puts the slab's near
	// edge at world z = 2.4 and its dark neighbour at z = 5.2, which is where the sun's own shadow line
	// across the pit falls. The pool's south wall stands 1.76 m over the floor and the sun stands at 24
	// degrees, so it lays a shadow 3.95 m up the floor: `?noshadow=1` lifts the dark half from L85 to L148
	// and leaves the slab where it was, at L168. The slab is the SUNLIT FAR WALL seen through the film and
	// the dark half is the shade of the near wall — both right, and both immovable from this sheet, because
	// this renderer bends no light on its way into the water and so cannot wobble a shadow line. What the
	// pit wanted was pattern under the surface, not a blurred surface: see `causticsWall` above and
	// `poolTileCanvas` in `src/textures.js`.
	//
	// THE SEVENTY-SECOND SESSION RE-MEASURED THAT LAST CLAIM AND IT DID NOT STAND, so it is corrected here
	// rather than left to be chased again. On the start camera the three bands of water — the foot nearest
	// the visitor, the middle, the water under the far coping — read L127, L146, L147 with the shadow map on
	// and L127, L145, L173 with it off (`tools/pitfill.json`, `tools/pitfloor.json`): the shadow map is worth
	// one point in the foot and the middle. Take the water sheet out altogether and the same three places
	// read L174, L203, L182 — the floor of the pit is SUNLIT all the way to the near wall, in shade or out of
	// it. So the dark foot was never the near wall's shade. It is the film: where the eye grazes, the alpha
	// goes up, the emissive cyan goes down, and a dielectric's mirror is paid next to nothing in this
	// renderer, so the surface was left with an albedo of nearly black to show. The whole of it is in
	// `src/water.js`, and the sky the mirror sees is the line below this one.
	mats.water.transparencyMode = 2;
	// Water has no diffuse of its own to speak of: what reaches the eye out of a pool is the bottom, plus
	// the sky's mirror, plus the colour of the water itself. A pale albedo is therefore the milk again —
	// measured at albedo (0.62,0.86,0.8) the sheet came out (120,157,150) L149 against (65,100,99) L92
	// with a near-black one, the same sheet in the same sun.
	mats.water.albedoColor = new Color3(0.02, 0.045, 0.045);
	mats.water.albedoTexture = texture(scene, poolWaterCanvas(512), { name: "water skin", scale: 1 });
	mats.water.emissiveTexture = mats.water.albedoTexture;
	// The absorption film: about half of what the painted lid used to carry (0.5,1.38,1.21), because it is
	// no longer the whole of the pool's light — the sunlit floor is most of it — only the colour the water
	// puts over whatever it lies over. Measured on the start view: at ×1 it left the water (62,120,125)
	// L108, at ×1.6 (61,129,135) L115 against the coping's L140, and ×1.6 is what stands here.
	mats.water.emissiveColor = new Color3(0.25, 0.66, 0.62);
	// And what the surface sees where it mirrors, for `src/water.js`. The same painter's cheat as the pit's
	// tiles: this renderer pays a dielectric's mirror next to nothing — `mats.water.environmentIntensity`
	// was ladderred from 0.5 to 2.4 on the start view and moved the water's bands by one point — so the sky
	// over the pool is handed to the surface by hand, scaled by the same Fresnel factor that takes the cyan
	// away. It is the pale blue of the dome at half past five, a little warmer than the dome itself because
	// the front of the house lies in it: [150,182,188] against the sky the same camera reads at (99,101,78).
	// `?wsky=` dials it; `?wsky=0` is how it was weighed.
	mats.water.mirrorColor = paint([150, 182, 188]);
	mats.water.bumpTexture = texture(scene, rippleCanvas(256), { name: "waterRipple", scale: 1, gamma: false });
	// This one carries its mip chain for tidiness and not for a gain: measured on the start view and on
	// the pool view, chain on and chain off differ by under a tenth of a point of frame variation and not
	// at all in light — the water's own pattern is laid at 1.7 m to a repeat and never lands in the five-
	// fold minification a tile joint does. The other sixteen bumps are mipmapped because they do.
	// 0.7 and not 0.35: at 0.35 the sun comes back off the surface as one white coin (the brightest pixel
	// of the start view's water was (186,226,204) in a hard disk) and at 0.7 it comes back as a field of
	// sparkle and its brightest is (143,232,232) — bluer, wider, and not a coin.
	mats.water.bumpTexture.level = 0.7;
	// Two things this material cannot do on its own, and where they come from instead:
	//   · the alpha following the angle you look at it from — `src/water.js`, and `?nofresnel=1` takes it
	//     out to weigh it;
	//   · a mirror with something in it — `main.js` fills a second cube from the pool's own surface, of the
	//     house, the palms and the hedge, and hands it to the water alone. It is DARKER than the sky cube
	//     it replaces (the start view's water: L110 with the pool cube against L118 with the sky cube),
	//     which is what a mirror of a shaded house and a lawn is, and it is kept for that reason and not
	//     in spite of it.

	// ---- walls, wood, roof -------------------------------------------------
	// Lime render, one trowel's sweep to a metre and a bit: the grain in the canvas is a sand grain of a
	// couple of centimetres at this size. It used to be laid 2.4 times across each wall face, which on
	// the 14.7 m back wall is a repeat 6 m long — and a wall in its own shade that big and that smooth
	// came out of Chromium flat: 5 of light's spread across 8 x 8 pixel blocks of it.
	mats.plaster = pbr(scene, "plaster", { roughness: 0.82, pattern: 1.2 });
	mats.plaster.albedoTexture = texture(scene, plasterCanvas(512), { name: "plaster", scale: 1 });
	mats.plaster.roughnessTexture = roughTexture(scene, { cells: 30, seed: 317, low: 0.72, high: 1 });
	mats.plaster.bumpTexture = texture(scene, bumpFromCanvas(plasterCanvas(256), 22), { name: "plasterBump", scale: 1, gamma: false });
	mats.plaster.bumpTexture.level = 0.45;

	// The base course: the cement the plinth the house stands on and the service block at the back are
	// rendered in. It used to be bytes [86,74,62], which was meant to read "a darker band under a pale
	// wall" and read soot instead: 3.6 m off, square on the north face of the service block, Chromium
	// painted (31,24,14) where the lime wall two metres to its left painted (111,102,84) — a ratio of
	// 0.23, though the bytes only asked for 0.42, because the bottom of the tone curve is near straight
	// through and every point taken off a dark albedo is a point taken off the picture. That black plate
	// was 10.2% of the rear view and flat to within 3 of 255, the deadest thing in the Villa.
	//
	// It is a grey cement now, cooler than the lime above it, and about two thirds the light of the wall
	// beside it rather than a quarter: see the numbers in NOTES.md for this session. The spread is
	// stronger than the wall's because a base course is what the rain comes down onto and what the
	// sprinkler throws at, so it weathers unevenly and should look it.
	mats.plasterDark = pbr(scene, "plasterDark", { roughness: 0.78, pattern: 1.2 });
	mats.plasterDark.albedoTexture = texture(scene, plasterCanvas(512, [150, 144, 126], 1.35), { name: "plasterDark", scale: 1 });

	// The plaster inside the house is not the plaster outside. Outside is lime weathered by sun and
	// monsoon and lit by the whole sky; inside is smooth, limewashed, and lit only by what comes through the
	// openings, so it is given its own pattern, a matte hand, and hardly any sky mirrored back — the
	// room has no sky to mirror. See `shutOutSkyFill` in world.js for why the fill lamps are kept off it.
	//
	// It used to be [206,200,188]: three numbers within sixteen of one another, which is not a paint but a
	// bare board. The whole front of the house paid for it. Measured through the glass from the start view
	// the middle of the frontage came out (111,94,69) L96 while the teak mullion two hand-widths away in the
	// same picture stood at L137 — and a surface with forty-two points of red over its blue reads as shuttering
	// concrete, not as a room anyone lives in, next to a terrace of warm teak and a garden of green. The
	// bytes are a lime wash with earth in it now: warmer than the outside plaster's [204,182,152] and
	// paler, which is what lime left under a roof looks like. The room's own lamps went up with it
	// (`src/interior.js`, which has that ladder). Measured on the same places after both changes: the front
	// reads (131,98,60) L102 against the mullion's L139, and the wall under the lamp inside reads
	// (147,104,52) against (117,96,65) — a lit room behind glass, still short of the sunlit timber that
	// frames it, with seventy-one points of red over its blue where it had forty-two.
	mats.interiorPlaster = pbr(scene, "interiorPlaster", { roughness: 0.92, environmentalIntensity: 0.3, pattern: 1.2 });
	mats.interiorPlaster.albedoTexture = texture(scene, plasterCanvas(512, [216, 194, 164]), { name: "interiorPlaster", scale: 1 });

	// Teak outdoors is weathered, not varnished. At 0.42 and 0.5 a board turned square to the sun was
	// throwing the sun straight back at the eye: measured in Chromium the front post read (254,228,174)
	// and the pier (255,242,215) — pale sand, the colour of the deck behind it washed out. At 0.75 the
	// same post reads (247,195,117) and the deck (211,157,97), which is teak; the shaded side of the
	// timber moved two points (the back door 52,30,16 -> 49,29,16), so nothing in the shade went dark.
	// The back door is the one mesh wearing this material: the house's own timber, and it stands upright,
	// so it wears the structure wood and the upright grain. Their reason for existing is in `teakWoods`
	// in src/textures.js and at `mats.teakWall` below.
	mats.teak = pbr(scene, "teak", { roughness: 0.75, pattern: 1.8 });
	mats.teak.patternUp = true;
	mats.teak.albedoTexture = texture(scene, teakCanvas(512, 6, { wood: "structure", grain: "up" }), { name: "teak", scale: 1 });
	mats.teak.roughnessTexture = roughTexture(scene, { cells: 24, seed: 331, low: 0.68, high: 1 });
	mats.teak.bumpTexture = texture(scene, bumpFromCanvas(teakCanvas(256, 6, { wood: "structure", grain: "up" }), 30), { name: "teakBump", scale: 1, gamma: false });
	mats.teak.bumpTexture.level = 0.55;

	// The two teak floors a visitor stands on: the terrace deck and the floor of the sala. Same boards,
	// but these are laid from the ground they lie on instead of across the face of a box, so the pattern
	// tiles once and the numbers here are metres — one repeat of the grain every 5.4 m along the boards,
	// a band of six boards every 1.8 m across them, so a board is 30 cm wide. The weather the floors get
	// (silvered out in the sun, oiled under a roof) is not in this pattern at all: it comes in at the
	// floor's own corners, and src/teak.js is the reason.
	mats.teakFloor = pbr(scene, "teakFloor", { roughness: 0.75 });
	mats.teakFloor.albedoTexture = texture(scene, teakCanvas(512, 6, { wood: "deck" }), { name: "teakFloor", scale: 1 });
	mats.teakFloor.roughnessTexture = roughTexture(scene, { cells: 24, seed: 331, low: 0.68, high: 1 });
	// A gentler bump than the timber uprights wear, and that is measured, not taste. The board grooves in
	// this pattern are 30 cm apart and the relief map is steep: with the 0.55 the uprights use, two places
	// 2 m apart on the sunlit deck read (219,144,93) and (107,64,21) when seen from 7 m up, because whole
	// stretches of boards tilt away from a 24-degree sun. Straight down over the deck the mean ran
	// L117 at 0.55, L123 at 0.3, L127 at 0.15 and L130 with no bump at all; 2 m in front of a man on the
	// deck the same knob ran 180, 167, 158 and 150 — so the bump is earning its keep close to, and not
	// beyond. 0.3 keeps most of that near relief and gives back half of what the far deck was losing.
	mats.teakFloor.bumpTexture = texture(scene, bumpFromCanvas(teakCanvas(256, 6, { wood: "deck" }), 30), { name: "teakFloorBump", scale: 1, gamma: false });
	mats.teakFloor.bumpTexture.level = 0.3;

	// Nine boards to a repeat, so at 1.8 m a repeat they are 20 cm boards — the width of a teak plank,
	// which is what the boards under the eaves, the soffit over the terrace and the front's mullions
	// wanted. Laid by the face they were on, the back wall's band of boards was nine boards across
	// 14.7 m, which is to say boards of a metre and a half, and the 17.6 m soffit had boards of 2 m.
	//
	// These boards stand UP, and that is a second fix in the same place. They are laid vertically on the
	// canvas (`grain: "up"`) and the material says `patternUp`, which is what tells `metricUVs` to put the
	// height on the pattern's other axis on an east or a west face. Without the two of them one pattern
	// lay horizontally across the front of the house, vertically up its return, and ringed every square
	// post like a stack of plates (`pictures/tmp-post.png`). And this wood is the darker, greyer of the
	// two teaks, so that a post reads against its own floor instead of matching it: the numbers, and the
	// ladder they came from, are in `teakWoods` in src/textures.js.
	mats.teakWall = pbr(scene, "teakWall", { roughness: 0.75, pattern: 1.8 });
	mats.teakWall.patternUp = true;
	mats.teakWall.albedoTexture = texture(scene, teakCanvas(512, 9, { wood: "structure", grain: "up" }), { name: "teakWall", scale: 1 });

	// The ceiling beams: one long timber across the room, and it has to read as ONE timber.
	//
	// The four beams across the room's ceiling wore `mats.teakWall` — nine boards to a 1.8 m repeat, stood
	// up — which on a post is right and on a 13 m beam lying down is a row of little blocks. Each plank end
	// landed as a butt joint every 20 cm along a beam 0.22 m deep, and from the pool, through the glass, at a
	// graze, a 13 m band of 20 cm blocks is shingles: `880-colonnade` shows the top of the room as four dark
	// courses of stepped shingles, and the sixty-ninth session's item 3 is that band. A beam is hewn from one
	// tree and its grain runs its whole length, so this wood has two boards to a 3.2 m repeat: the beam's own
	// face is narrower than one board, so it wears one face of one plank with its grain along it and no cross
	// joint anywhere on it. The bump is the floor's gentle one and not the uprights' steep one, because the
	// only light these faces ever get comes from below.
	mats.beam = pbr(scene, "beam", { roughness: 0.78, pattern: 3.2 });
	mats.beam.albedoTexture = texture(scene, teakCanvas(512, 2, { wood: "structure" }), { name: "beam", scale: 1 });
	mats.beam.bumpTexture = texture(scene, bumpFromCanvas(teakCanvas(256, 2, { wood: "structure" }), 22), { name: "beamBump", scale: 1, gamma: false });
	mats.beam.bumpTexture.level = 0.3;

	// The terrace soffit is a ceiling, and a ceiling is boarded along the house and not across it.
	//
	// It wore `mats.teakWall` — the same nine boards to a 1.8 m repeat, stood up — which is the wood for a
	// post and a wall, and a soffit lies flat: seen from the deck the boards ran away from the eye toward
	// the wall, with a joint line crossing them, which is a comb and not a ceiling. `grain: "cross"` lays
	// the boards the other way in the repeat, so on a plane that looks at the ground they lie along the
	// eave: nine boards to 1.8 m of soffit depth, every one of them running the whole 17.6 m of the house.
	// No bump on it, as on the wall teak: this face is lit only by the ground and the sky at a graze, and
	// relief buys nothing there that the picture can see.
	mats.soffit = pbr(scene, "soffit", { roughness: 0.76, pattern: 1.8 });
	mats.soffit.albedoTexture = texture(scene, teakCanvas(512, 9, { wood: "structure", grain: "cross" }), { name: "soffit", scale: 1 });

	mats.roof = pbr(scene, "roof", { roughness: 0.62 });
	mats.roof.albedoTexture = texture(scene, roofTileCanvas(512), { name: "roof", scale: 5 });
	mats.roof.bumpTexture = texture(scene, bumpFromCanvas(roofTileCanvas(256), 40), { name: "roofBump", scale: 5, gamma: false });
	mats.roof.bumpTexture.level = 0.8;

	// The ring a palm trunk leaves as it grows, every few centimetres: at one repeat to a trunk the
	// rings were a metre and a half apart on a 13 m coconut palm.
	//
	// The relief is kept gentle on purpose. Measured on a trunk three metres and a half off, on the
	// close palm camera (`tools/tint.js --view "-14,1.6,9.6,-1.57,0" --show palmBark --fresh`): at the
	// 0.8 it was built with the bark read (123,104,67) L105, at 0.45 (129,108,70) L110 and with the bump
	// off altogether (131,109,70) L111 — so the relief was costing half a dozen points of light to buy a
	// reptile-skin glitter over the whole trunk, the same bargain the hedge refused (`hedge` below).
	// Half of it stays: the scars are still ridges where a hand would feel them, and the trunk is not a
	// painted pole.
	mats.palmBark = pbr(scene, "palmBark", { roughness: 0.8, pattern: 0.45 });
	mats.palmBark.albedoTexture = texture(scene, palmBarkCanvas(256), { name: "bark", scale: 1 });
	mats.palmBark.bumpTexture = texture(scene, bumpFromCanvas(palmBarkCanvas(128), 40), { name: "barkBump", scale: 1, gamma: false });
	mats.palmBark.bumpTexture.level = 0.45;

	// ---- leaves: painted with a transparent background, then alpha tested --
	// A banana's pseudostem: a green sheaf, not bark. The garden's banana clumps used to wear the palm's
	// rings, which turned every one of them into three palm saplings with a fan on top.
	mats.stalk = pbr(scene, "stalk", { roughness: 0.72, pattern: 0.5, color: [206, 216, 194] });
	mats.stalk.albedoTexture = texture(scene, stalkCanvas(256), { name: "stalk", scale: 1 });
	// A soft relief and not a hard one: the sheaf seams are 2 cm wide, and a strong bump on a stem 20 cm
	// across four metres off is a second pattern laid over the first, which is half of how the old stalk
	// came by its bark look. See `stalkCanvas`.
	mats.stalk.bumpTexture = texture(scene, bumpFromCanvas(stalkCanvas(128), 16), { name: "stalkBump", scale: 1, gamma: false });
	mats.stalk.bumpTexture.level = 0.32;

	// The skin of a shrub: a mass of small leaves, four and a half decimetres of bush to a repeat, with
	// the same canvas sent back as relief so each leaf throws its own little shade. The bushes used to
	// wear the boundary hedge's pattern, which is a metre and a tenth to a repeat: on a bush a metre
	// across that is one clump and a half, and the whole bush came out striped like a watermelon.
	mats.bush = pbr(scene, "bush", { roughness: 0.86, pattern: 0.44 });
	mats.bush.albedoTexture = texture(scene, bushCanvas(256), { name: "bush", scale: 1 });
	mats.bush.bumpTexture = texture(scene, bumpFromCanvas(bushCanvas(256), 80), { name: "bushBump", scale: 1, gamma: false });
	mats.bush.bumpTexture.level = 0.7;
	// A bush is a foot of leaves deep and the sky's light does not get into it, so it keeps a little of
	// its own: less than the hedge's, because a bush is smaller and stands in the open. The green is the
	// channel that pays for it and not the red: a shrub's shaded faces are lit by the ground's bounce,
	// which is terracotta and teak, and a bush paid evenly comes out olive instead of green (see the
	// three-number lift on these three materials below).
	mats.bush.emissiveTexture = mats.bush.albedoTexture;
	mats.bush.emissiveColor = new Color3(0.03, 0.085, 0.022);

	// The shell of leaves dressed over that heart: the same leaf at the same size, with the gaps between
	// the leaves cut clean out, so the bush has a ragged edge against the sky and a dark behind the
	// leaves where a bush really has one. Both faces are drawn, because half of a shell's leaves are
	// turned inwards, and a leaf turned inwards is still a leaf and not a hole.
	mats.bushEdge = pbr(scene, "bushEdge", { roughness: 0.88, pattern: 0.44 });
	// Smaller and darker leaf than the hedge's crest wears — but THICK on the tile. The bush's own shell used
	// to be dressed with leaves of 4.5% of the tile and 380 sprigs, which is three square centimetres of leaf
	// for every ten of tile: two thirds of the shell was cut away by the alpha, and a visitor looked through
	// the holes at the dark heart and called the bush bald and sooty (`pictures/s63-grass.png`). The crest's
	// defaults cover 96% of their tile and read as a hedge; these now cover about nine parts in ten.
	// Darker again the day it was measured: with the shell switched off a bush's whole frame came UP by four
	// points of light, and the shell alone was painting (73,135,18) against the boundary hedge's (60,95,14) —
	// the dark inside of a bush was the brightest thing on it. The `base` is redder and less green than the
	// crest's own [56,80,36], because a privet leaf is an olive green and this was lime.
	const bushEdgePattern = texture(scene, bushEdgeCanvas(256, { leafFrom: 0.058, leafMore: 0.042, sprigs: 430, shade: 0.78, rib: 26, base: [62, 78, 42] }), { name: "bushEdge", scale: 1 });
	bushEdgePattern.hasAlpha = true;
	mats.bushEdge.albedoTexture = bushEdgePattern;
	mats.bushEdge.emissiveTexture = bushEdgePattern;
	// A leaf lets the sun through: the same leaf-light the heart carries, so a bush against the sun is a
	// dark green bush and not a cut-out.
	mats.bushEdge.emissiveColor = new Color3(0.03, 0.085, 0.022);
	mats.bushEdge.alphaCutOff = 0.5;
	mats.bushEdge.transparencyMode = 1;
	sheet(mats.bushEdge);

	// The leaf that stands OUT of a bush, on cards: one spray of an atlas to a card, planted on the skin
	// by `bushLeafage` in `src/garden.js`. The shell above is the dark between the leaves and the bush's
	// edge; this is the leaf you can see the shape of. Clamped and not wrapped, because the canvas is an
	// atlas of separate sprays and a wrapped cell would drag next door's leaf into this one's air.
	mats.bushLeaf = pbr(scene, "bushLeaf", { roughness: 0.86 });
	const bushLeafPattern = texture(scene, bushClusterCanvas(), { name: "bushLeaf", scale: 1, clamp: true });
	bushLeafPattern.hasAlpha = true;
	mats.bushLeaf.albedoTexture = bushLeafPattern;
	// A leaf lets some sun through, and a card has no inside to catch it: this is the crest's lesson at the
	// size of a shrub. Without it the cards turned away from the low sun kept only the warm bounce light and
	// came out maroon in the middle of a green bush (`pictures/s51-mid3-crop.png`); with it a shaded leaf is
	// a dark green leaf. Measured on the live page: (0.05,0.09,0.025) took the cards' mean from (49,51,13)
	// to (53,67,13) on the camera 3.8 m off the big pot, and the green is the channel that moved.
	// And moved again the day the shrub was rebuilt: with the small spray the same camera put the pot's bush
	// at (63,74,13) L67 — green standing eleven over its own red, which is olive, not a leaf — and (0.09,
	// 0.16,0.04) → (0.09,0.27,0.048) took it to (69,100,15) L87 with the green twenty-nine over the red,
	// which is a shrub. Only the green went up; the red stayed where the bounce put it.
	mats.bushLeaf.emissiveTexture = bushLeafPattern;
	// Paid down from (0.09,0.27,0.048) and paid BACK in blue. That much green light out of a leaf is why a
	// shrub two metres off was the loudest thing in its corner of the lawn; the green at 0.20 stops the glow
	// and keeps the cards' green well over their red, so no maroon, which is what the note above is about.
	// The blue went up because a shaded card was coming out (18,30,1): a bush's own dark side had no blue in
	// it at all, and a green with no blue is soot and not leaf. The boundary hedge in its own shade keeps
	// (35,65,10); these now keep about that.
	mats.bushLeaf.emissiveColor = new Color3(0.1, 0.2, 0.075);
	mats.bushLeaf.alphaCutOff = 0.5;
	mats.bushLeaf.transparencyMode = 1;
	sheet(mats.bushLeaf);

	// The hedge's crest wears the bushes' leaf too, but it needs what the belt's cards needed and for the
	// same reason: a crest card has no inside, and half of them are turned away from the sun with the
	// hedge's own body behind them. Without light through the leaf the top of a sunlit hedge came out a
	// scorched band of black leaves (`pictures/s50-crest-crop.png`) — the hedge's own face stood at L80
	// and its crest at L45, and a crest is the part of a hedge that both the sun and the whole sky reach.
	// These bytes sit between the bush's (0.03,0.05,0.018) and the belt's (0.13,0.26,0.12), because the
	// crest has the belt behind it and the belt stands out in the open.
	mats.hedgeCrest = pbr(scene, "hedgeCrest", { roughness: 0.88, pattern: 0.44 });
	const crestLeaf = texture(scene, bushEdgeCanvas(256), { name: "hedgeCrestLeaf", scale: 1 });
	crestLeaf.hasAlpha = true;
	mats.hedgeCrest.albedoTexture = crestLeaf;
	mats.hedgeCrest.emissiveTexture = crestLeaf;
	mats.hedgeCrest.emissiveColor = new Color3(0.07, 0.13, 0.04);
	mats.hedgeCrest.alphaCutOff = 0.5;
	mats.hedgeCrest.transparencyMode = 1;
	sheet(mats.hedgeCrest);

	// A palm's LEAF is the whole arching thing and a leaflet is one of the hundred-odd cards standing off it
	// — see `palmCrown` in `src/garden.js`, which builds them as geometry now. So this pattern carries no air
	// and the material has no cut: `palmBladeCanvas` is leaf from edge to edge, and the ragged outline a crown
	// shows against the sky is the outline of the leaflets themselves and not a bitten edge. It is still a
	// sheet: one card has one winding and both faces of it must be drawn and lit.
	const bladeTexture = texture(scene, palmBladeCanvas(256), { name: "palmLeaf" });
	mats.palmLeaf = pbr(scene, "palmLeaf", { roughness: 0.55 });
	mats.palmLeaf.albedoTexture = bladeTexture;
	// A leaf is not a board: the sun comes through it. A little of its own pattern, sent back out as
	// light, is what keeps back-lit leaves from going black. It follows the pattern, so the leaves stay
	// leaves and do not turn into flat green sails.
	//
	// The scale is measured, twice over. First, this scene's sun arrives at the tone curve at 1.6 to 2.8 of
	// raw light, so a tidy little emissive is worth two bytes out of 255 and says nothing: under a coconut
	// crown shot from under it (4.8 m off, leaves 26.6% of that frame) the crown read (52,87,69) as it
	// stood and (42,101,62) here, with its darkest leaf in that frame coming up from (13,33,5) to (23,61,6).
	// More than this reads as a glowing sail: at (0.7,1.3,0.45) the crown reached (49,121,65) and the spread
	// across its own leaves began to flatten out.
	//
	// Second, and nobody had thought of this: the engine multiplies this colour by the emissive pattern, and
	// the pattern is dark — a leaf canvas carries about (0.055,0.196,0.030) of light over the leaf, because
	// most of a leaf is not a vein. So what lands on the picture is (0.016,0.108,0.006), and THAT is the
	// number `src/surface-colours.js` writes into the CPU drawing, which has no pattern to multiply by.
	// `tools/sheets.js` reads the canvases back off a live page and fails if the two drift apart, and prints
	// what every leafy surface in the Villa really adds.
	mats.palmLeaf.emissiveTexture = bladeTexture;
	mats.palmLeaf.emissiveColor = new Color3(0.3, 0.55, 0.2);
	sheet(mats.palmLeaf);

	// A banana's blade. Like the palm's, there is nothing left to cut: `bananaCrown` in `src/garden.js`
	// builds the leaf out of mesh — a rib that arcs, and a blade in bands out from it with the tears cut
	// out of the geometry — so the ragged edge against the sky is the leaf's own outline and not a hole
	// punched in a card. No alpha, no cut-off, both faces drawn and lit.
	const bananaTexture = texture(scene, bananaBladeCanvas(256), { name: "bananaLeaf" });
	mats.bananaLeaf = pbr(scene, "bananaLeaf", { roughness: 0.5 });
	mats.bananaLeaf.albedoTexture = bananaTexture;
	mats.bananaLeaf.emissiveTexture = bananaTexture;
	mats.bananaLeaf.emissiveColor = new Color3(0.3, 0.55, 0.2);
	sheet(mats.bananaLeaf);

	// The banana's flower: a maroon bract hanging under the crown, and the one thing that says banana
	// and not palm from twenty metres off. It wore the flower-pots' clay and came out as a tan egg
	// (`pictures/s53-banana-before.png`); a bud is the colour of a dried chilli.
	// The banana's flower. Read as raw light and not as bytes, which is how it came to be a pink party hat:
	// [78,32,32] through `pbr` is (0.31,0.13,0.13) of red light, near four times what the same bytes make
	// inside a pattern, and the sun on top of that is salmon (`pictures/s64-bud-before.png`). Through
	// `paint` the same bytes are a maroon bract, which is what a banana bud is.
	mats.bud = pbr(scene, "bud", { roughness: 0.7, environmentalIntensity: 0.55 });
	mats.bud.albedoColor = paint([86, 34, 46]);
	// A bract is waxy, but it is a fist of them at a hundred angles, and the mean of that is a soft purple
	// and not a varnish: the sheen the old bud wore is what blew its lit side to (200,120,110).
	mats.bud.specularIntensity = 0.14;
	// And a bud in the shade of its own crown is a dark purple and not a hole: a little of its own kept.
	mats.bud.emissiveColor = new Color3(0.01, 0.003, 0.006);

	// The grass that stands up out of the ground, as opposed to the grass painted flat on it. Cut on
	// three crossed sheets per clump, so it is a clump from any side and not a card that vanishes
	// edge-on. The skin is an atlas of four separate clumps and one sheet wears exactly one of them
	// (`tuftAtlasCanvas`), so the clamps and not the wraps are wanted here, and a clump six metres off
	// is one of four plants and not the same plant nine hundred times.
	const tuftTexture = texture(scene, tuftAtlasCanvas(), { name: "tuft", clamp: true });
	tuftTexture.hasAlpha = true;
	mats.tuft = pbr(scene, "tuft", { roughness: 0.78 });
	mats.tuft.albedoTexture = tuftTexture;
	mats.tuft.emissiveTexture = tuftTexture;
	// Light through the leaf, and light held inside the clump. Two things have always been wrong with a
	// big emissive here: the engine multiplies this colour by the emissive PATTERN, so a clump's lamp is
	// paid at the rate the tile's own leaves carry — and a lamp inside a plant is a lamp that cannot be
	// in shade, which is why a clump under the terrace used to be as bright as one in the sun. What it is
	// worth now is measured, not copied out of this file: on the clumps of the `grass` camera, 2.4% of
	// that frame, switching the emissive clean out through `tools/cover.js --js` takes the browser from
	// 89,119,26 to 85,106,25 over a lawn that does not move at 102,129,38 — so the lamp is worth (4,13,1)
	// and the tile's own ramp is worth the other two thirds of the clump's light. That split is the
	// point: paint the ramp and the whole clump answers, in shade and in sun alike; paint the lamp and
	// only the sunlit half of the garden does. `tools/sheets.js` measures what the lamp costs in the CPU
	// drawing as well and fails if the two part company.
	mats.tuft.emissiveColor = new Color3(0.21, 0.36, 0.13);
	mats.tuft.alphaCutOff = 0.42;
	mats.tuft.transparencyMode = 1;
	// Both faces of every sheet drawn, and lit from the side they are seen from. Before this the far
	// side of every sheet was culled outright, so about half of every clump was missing, and what was
	// drawn was lit by whichever way its triangles happened to be wound.
	sheet(mats.tuft);

	// Leaf and clump at the size a clipped hedge has them: a metre and four tenths of hedge to a repeat,
	// which is eleven hundred leaves of four to seven centimetres. See `hedgeCanvas` for why the two noise
	// washes this used to wear came out as a knitted stocking and not a hedge.
	mats.hedge = pbr(scene, "hedge", { roughness: 0.9, pattern: 1.4 });
	const hedgePattern = texture(scene, hedgeCanvas(512), { name: "hedge", scale: 1 });
	mats.hedge.albedoTexture = hedgePattern;
	// Same trick as the fronds: light through the leaf, following the leaf pattern.
	mats.hedge.emissiveTexture = hedgePattern;
	mats.hedge.emissiveColor = new Color3(0.05, 0.075, 0.03);
	mats.hedge.bumpTexture = texture(scene, bumpFromCanvas(hedgeCanvas(256), 55), { name: "hedgeBump", scale: 1, gamma: false });
	// Was 1, the highest in the Villa, on the strongest bump after the lawn's — and the hedge is the
	// garden's biggest green mass, mostly seen from far off. Measured on the west lawn with
	// tools/hedgebump.json: at 1 the frame stood at L133, at 0.3 at L136 and with the bump off at L137,
	// so the leaf relief was costing the hedge four points of light to buy a glitter nobody at forty
	// metres can see. Same finding as the lawn's bump and the teak floor's before it.

	// ---- the world outside the garden wall ---------------------------------
	// Three greens beyond the hedge, each paler and bluer than the last. Distance is made of these:
	// while the far trees were the hedge's own green the whole horizon collapsed into one band.
	//
	// Both ranks used to be domes wearing `canopyCanvas` — three scales of grey mass and no leaf shape in
	// it — and a browser turned the whole belt into a field of mossy boulders: a smooth lit flank, a dark
	// foot, a pale cream cap where the low sun grazed the top, and a rounded outline with nothing broken
	// about it (`pictures/tmp-melon-before.png`, the near rank at nineteen metres). Three sessions of
	// crumple, of per-crown tone and of bigger pattern ranges did not move it, because the fault was the
	// shape and the shading and not the paint: a dome is one smooth surface with one gradient on it, and
	// at twenty metres a picture reads that as stone however green it is painted.
	//
	// So the crowns are cards now (`cardRank` in `src/world.js`), cut on `canopyClusterCanvas`: leaf
	// and air. That changes what this material has to be. It needs a leaf at the size a leaf is — two
	// metres of crown to a cluster, which is a head of ninety leaves of twenty to thirty-five
	// centimetres, and twenty-five to fifty pixels of the screen at the near rank — and it needs the
	// cut, because ragged edges are what a skyline has and a dome never will. It needs to be lit on both
	// faces, or half of every card is black. And it no longer needs a big pattern range to fake mass,
	// since the cards throw a hundred small terminators at the sun between them: the lit leaf in the
	// canvas runs to (150,240,86) and its dark to (12,22,10).
	//
	// The atlas is CLAMPED and not wrapped, because a card is inked with one whole cell of it and a
	// wrapped cell would drag the cluster across the belt into its own border. That is also why this
	// material carries no `patternMetres` any more: `cardRank` writes its own texture coordinates, in
	// cells, and nothing else in the Villa wears this material.
	//
	// See `canopyClusterCanvas` for why the canvas stopped being one seamless tile and became a grid of
	// clusters. In short: the straight edge a visitor was looking at belonged to the CARD and not to
	// the painting, and a card whose border falls in air has no border to show.
	//
	// The colours are written through `paint`, which means they are bytes and not multipliers, and they
	// are set so the product of colour and pattern lands where the browser was measured: the near rank at
	// (62,93,47) over 98 points on the west view. The bytes went up from [90,128,62] when the cards came
	// in, because a card sees far less light than a dome did — half of them are turned away from the sun
	// and the ones that are not are tilted off it — and the mean had to stay where it was measured.
	mats.jungle = pbr(scene, "jungle", { roughness: 0.92 });
	const jungleLeaf = texture(scene, canopyClusterCanvas(), { name: "jungleLeaf", scale: 1, clamp: true });
	jungleLeaf.hasAlpha = true;
	mats.jungle.albedoColor = paint([200, 222, 150]);
	mats.jungle.albedoTexture = jungleLeaf;
	mats.jungle.emissiveTexture = jungleLeaf;
	// Light through the leaf. A card has no inside, so what stands between a card and the sun is the leaf
	// itself, and a leaf lets some of it through: without this the shaded half of every crown goes to soot
	// and the belt reads as a black cut-out against the sky. This lands as the pattern's own bytes times
	// these, and `tools/sheets.js` measures the pair together.
	mats.jungle.emissiveColor = new Color3(0.13, 0.26, 0.12);
	mats.jungle.alphaCutOff = 0.42;
	mats.jungle.transparencyMode = 1;
	// Both faces of every card drawn, and lit from the side they are seen from: the same rule the grass
	// clumps and the fronds go by, and for the same reason — half the cards in a crown face away.
	sheet(mats.jungle);
	// The far rank of the belt, twenty-six to fifty-two metres out: a curtain of crown and clump, and not a
	// crowd of cards and not a leaf pattern — see `beltHigh` in src/world.js and `farCanopyCanvas` in
	// src/textures.js for why both of those came out.
	//
	// Paler and bluer than the near rank and flatter in itself, because distance in a picture is made of
	// these steps — near hedge (97,125,82), near rank (89,111,85), this one, and the far tree line on the
	// sky (113,119,128) — and because haze does two things at once: it lifts the darks towards the sky AND
	// it takes the blue in.
	//
	// The standing lesson from when this rank was a canopy pattern, and it holds now the pattern has changed
	// again: haze lifts the floor of a range, it does not wipe the range out. When this rank spent half the
	// near rank's pattern range to look hazed, the browser made it (67,85,57) with 11 points of spread over
	// 55 points of the frame — a smooth green hillside and not a wood (`pictures/tmp-far-east.png`). So the
	// canvas keeps a floor lifted above the near rank's and a range of its own, and it is worn twelve metres
	// to a repeat because out there the thing that has size is the CROWN: six to twelve metres of it, which
	// is a fifth of the frame at eighty metres. The leaf canvas worn at two metres did not say that; it said
	// sixty identical sprays across one crown, and the eye found the lattice at once.
	//
	// There is no `cut` here and no `alphaCutOff`, which is what the cards had. A curtain does not need one:
	// its edge is ragged at the leaf-cluster scale in the geometry, and what the old cut was doing out there
	// was punching holes big enough to see the sky through, which is the fault that closed.
	//
	// The bytes are the cards' own, times 1.15, and they are not moved by this change. The cards came down
	// as (34,65,24) over the far rank on the `grass` view (`tools/cover.js`); the curtain has stood at
	// (30,60,20) there since it went in. It reads (25,54,13) now, which is six points of green short, and
	// that is paid for: what used to be there was the sky showing through a cut and a haze wash laid over
	// every leaf in the tile, and both are gone. Where the rank is seen from far enough off that the clusters
	// average out there is nothing to see — the same camera at eighty-seven metres still paints (42,69,34)
	// against the (42,71,35) it painted before. Read as light and colour, the four steps on that camera now
	// run hedge (61,95,15), near rank (22,57,7), this (25,54,13), far line (68,93,61): the blue still climbs
	// the whole way out, and the green of this rank sits above the near rank's and below the hedge's, which
	// is where a wood between two others belongs.
	mats.jungleFar = pbr(scene, "jungleFar", { roughness: 0.94 });
	const jungleFarLeaf = texture(scene, farCanopyCanvas(384, { seed: 947 }), { name: "jungleFarLeaf", scale: 1 });
	mats.jungleFar.albedoColor = paint([193, 230, 175]);
	mats.jungleFar.albedoTexture = jungleFarLeaf;
	mats.jungleFar.emissiveTexture = jungleFarLeaf;
	mats.jungleFar.emissiveColor = new Color3(0.11, 0.21, 0.12);
	// The curtain is wound to look at the garden, which is the only side a visitor is ever on, but it is
	// not culled: three of the tools stand a camera outside the ring, and a hole in the horizon where a
	// wood stands would be photographed instead of the wood.
	mats.jungleFar.backFaceCulling = false;

	// The tree line on the sky is too far off to have leaves: it has no leaf shape in it, and the haze
	// does most of its painting. It does have a light and a dark side to it, which is what this
	// pattern is for. Measured before the pattern went on and before `paint` was used here: the band
	// read (203,207,195) at 117 m while the sky an arm's-width above it read (104,143,155) — a white
	// board laid along the horizon, twice as bright as the sky it was supposed to recede into. Two
	// faults were in that: the bytes were being read as raw light (see `paint` above), and one flat
	// colour cannot be a wood. The bytes are 66,88,84 and not 58,78,74 because the pattern spends only
	// 0.71 of the light it is given — its own mean is 217,220,222 in bytes, which is 0.71 in light — so
	// the bytes are raised by the reciprocal and the product lands back on the measured green, to within
	// a byte or two of it.
	//
	// Those bytes came down to the browser as (104,114,117) at 184 m, and the last of those three numbers
	// is the fault: blue over green is the colour of a stone, and the line was read as a ridge of boulders
	// however it was shaped. The haze is what turns it — the fog colour is bluer than any leaf and a third
	// of the pixel out there is fog — so the leaf bytes have to start with green the better of blue by a
	// good deal to come out a head and a half ahead. They went from [80,110,84] to [74,114,72] when the
	// cards went in, because the near rank stopped being a grey-green wall of domes and the band is now
	// seen through gaps in leaf instead of over the top of them: out of (83,93,93) at 110 m the blue and
	// the green are level, which is slate, and the ridge has to come out with green the better of blue.
	//
	// And the pattern behind them was too plain to be a wood. `distanceCanvas` is laid ONCE over a crown
	// of twenty-six to forty-two metres, so its seven masses are five-metre blotches and its forty-four
	// speckles are eighty-centimetre ones: at a hundred metres neither is worth a pixel, and the mass came
	// out flat (11 points of spread across 77 points of the frame, `tools/cover.js` on the east lawn) — a
	// boulder again, in a different colour. Nine masses and twenty-six speckles, with the range opened
	// from 105 bytes to 132: three-metre clumps of trees and a metre-and-a-half of leaf glitter, which are
	// the two sizes that still reach the screen out there. The bytes go up with the darker canvas the same
	// way the far rank's did, so the mean light does not move.
	mats.farTree = pbr(scene, "farTree", { roughness: 1 });
	mats.farTree.albedoColor = paint([74, 114, 72]);
	mats.farTree.albedoTexture = texture(scene, distanceCanvas(256, { masses: 9, speckle: 26, low: 118, high: 250 }), { name: "farCanopy", scale: 1 });
	mats.farTree.emissiveColor = new Color3(0.02, 0.034, 0.02);
	// The band is wound to face the garden, which is the only side a visitor is ever on, but it is not
	// culled: a tool camera stood outside the ring — and there are three of them in `tools/` — would
	// otherwise see a hole in the horizon and photograph the sky where a wood stands.
	mats.farTree.backFaceCulling = false;

	// ---- glass, metal, cloth, odds and ends --------------------------------
	// Glass that is a mirror is a bad picture: at roughness 0.03 and full reflection the whole wall
	// came back blown white and the room behind it disappeared. A little rougher, and half the sky's
	// reflection: you get a sheen and can still see the room through it.
	//
	// The sheet itself was then far too heavy. At alpha 0.36 the pane was a third the glass's own
	// green and only two thirds what was behind it, so the room was dimmed by more than a third and
	// painted green into the bargain: measured through the front in the start view the panes came out
	// (108,83,60) low, (84,80,65) at eye height and (50,56,48) at the west end — a grey-green board
	// that the room's lamp could not get a picture out of. Glass of this thickness really does mirror
	// only on the order of a sixth of what stands in front of it and lets the rest through, so that is
	// what it is now: 0.16 of a near-white sheet. The same three places come out (121,90,63),
	// (96,87,70) and (59,59,51), and the start view keeps a point MORE of its colour overall, not less.
	mats.glass = pbr(scene, "glass", { color: [204, 219, 214], roughness: 0.07, alpha: 0.16, environmentalIntensity: 0.45 });
	mats.glass.transparencyMode = 2;
	// The library's default glare is off this pane, and it is off for a fault and not for a shade.
	//
	// With `specularIntensity` left at the library's 1, two hard balls of light sat on the front glass:
	// about twenty-six pixels across, blown to (213,250,254) L242, and — because they sat over the sofa —
	// read as two cyan lamps standing in the middle of the living room (`pictures/s69-glass-balls.png`,
	// from the tool camera at `0,2.1,-0.3,3.1416,-0.02`, and `pictures/s69-glass-clean.png` is the same
	// camera with this line in). Nothing about the light explains them: turning the sun's specular to
	// black on every lamp in the Villa, taking the glass out of the sun's own account, setting the
	// material's `environmentIntensity` to 0, 0.08 and 0.2, setting `scene.environmentIntensity` to 0 and
	// hiding the water each left both balls at L237-L242. This line moves them to (65,53,41) and
	// (145,94,59): the sofa and the table, which is what stands there.
	//
	// And the glare was the only mirror the pane had, which is the part worth knowing. Smoothing it out was
	// tried first and refused: at `roughness` 0.3 the pane frosts over into a cream board and the room is
	// all but gone, and at 0.55 it is a wall (`pictures/s69-glass-rough.png`, four panes side by side). So
	// the pane now has no mirror in it at all — the alpha veil of the note above is its whole sheen — and
	// that is a smaller lie than two lamps that are not there. Whoever wants a real reflection in this
	// glass has to give it a mirror of its own the way `src/main.js` gives the water one, and not turn
	// this number back up.
	mats.glass.specularIntensity = 0;
	mats.glass.specularColor = new Color3(0.26, 0.29, 0.29);

	mats.darkMetal = pbr(scene, "darkMetal", { roughness: 0.42, metalness: 0.75 });
	mats.darkMetal.albedoColor = paint([46, 44, 42]);
	// The inside of a shadow gap — the four centimetres between a door's leaf and its frame, where the
	// light never reaches. This is not a stuff a builder would sell: it is the absence of light, so it is
	// painted near-black and with no sheen whatever. `darkMetal` was tried here first and, being metal, it
	// caught every lamp in the room and came back at L74 to L142 — a panel, and not a shadow.
	mats.recessShadow = pbr(scene, "recessShadow", { roughness: 1, metalness: 0 });
	mats.recessShadow.albedoColor = paint([18, 16, 15]);
	mats.brass = pbr(scene, "brass", { roughness: 0.3, metalness: 0.9 });
	mats.brass.albedoColor = paint([186, 146, 76]);

	mats.cloth = pbr(scene, "cloth", { roughness: 0.85, pattern: 0.5 });
	mats.cloth.albedoTexture = texture(scene, clothCanvas(256), { name: "cloth", scale: 1 });
	mats.clothStripe = pbr(scene, "clothStripe", { roughness: 0.85, pattern: 0.5 });
	mats.clothStripe.albedoTexture = texture(scene, clothCanvas(256, [120, 96, 70]), { name: "clothStripe", scale: 1 });
	// The towel folded across the foot of a sunbed. It used to wear `clothStripe`, which is a mid-brown
	// awning cloth, and to be laid half sunk into the pad — so at four metres it read as a terracotta tile
	// inlaid in the mattress (pictures/tmp-l5.png). Pale cotton with two bands at each end, and its own
	// pattern scale: at half a metre to a repeat a towel forty centimetres long shows no band at all.
	mats.towel = pbr(scene, "towel", { roughness: 0.9, pattern: 0.26 });
	mats.towel.albedoTexture = texture(scene, clothCanvas(256, [214, 205, 186], { stripe: [172, 78, 42], band: 0.09 }), { name: "towel", scale: 1 });
	mats.towel.specularIntensity = 0.2;
	// A sunbed's pad: canvas quilted into panels 62 cm wide — see `cushionCanvas`. The cloth's own grain
	// is eight centimetres to a shade and is nothing at the ten metres a lounger is looked at from, so the
	// pad wears a pattern at the size of its own panels: puffed in the middle, stitched at the joins, and
	// drifting softly over the whole of it, so a sunlit cushion is not the flattest white thing in view.
	mats.cushion = pbr(scene, "cushion", { roughness: 0.88, pattern: 0.62 });
	// A cloth is not a mirror. `specularIntensity` ships at 1, which is the shine of polished steel, and on a
	// rough canvas pad at roughness 0.88 it is a broad white glare from the sun and nothing else: it was what
	// drove the sunlit side's red channel to 250 and it gave the shaded side nothing at all. Cut to a cloth's
	// own share, and the pad's colour is allowed to be the pale canvas it is painted as.
	mats.cushion.specularIntensity = 0.3;
	mats.cushion.albedoTexture = texture(scene, cushionCanvas(256), { name: "cushion", scale: 1 });
	mats.cushion.bumpTexture = texture(scene, bumpFromCanvas(cushionCanvas(256), 70), { name: "cushionBump", scale: 1, gamma: false });
	mats.cushion.bumpTexture.level = 0.55;

	// The rug on the room's floor: a rust silk, woven, and laid one repeat to 1.2 m of rug so the
	// weave is knot-sized and the drifts of the pile are metre-and-a-half sized. The room's floor is
	// the brightest thing behind the glass — a browser paints it (153,99,61) where the back wall gets
	// (103,91,71) — so the one big flat warm shape on it is the biggest thing this room can be given.
	mats.rug = pbr(scene, "rug", { roughness: 0.9, pattern: 1.2 });
	mats.rug.albedoTexture = texture(scene, rugCanvas(256), { name: "rug", scale: 1 });

	// The furniture, the pots, the boulders and the soil in the pots used to be one flat colour each,
	// which is the cheapest thing a surface can look: a lounger leg came out of a browser picture at
	// one number, (97,80,42), from end to end. Each of the four now wears a painted pattern of its own
	// and keeps the brightness it had — the bytes that used to be painted flat are the middle of each
	// pattern and not a corner of it, so this is a redistribution of the same colour and not a repaint.
	// The same four patterns are described again in `surface-colours.js`, so a drawn picture cannot
	// come out flatter than the Villa it is drawing.
	mats.soil = pbr(scene, "soil", { roughness: 0.95, pattern: 0.6 });
	// A pot of soil is 0.6 m across, so one tile of crumb is about 20 cm: bigger than that and the
	// crumbs are the size of a hand, smaller and the whole thing averages back to one flat brown.
	mats.soil.albedoTexture = texture(scene, soilCanvas(256), { name: "soil", scale: 1 });
	mats.soil.bumpTexture = texture(scene, bumpFromCanvas(soilCanvas(128), 30), { name: "soilBump", scale: 1, gamma: false });
	mats.soil.bumpTexture.level = 0.3;

	// The ground under the planting: bare laterite, the red-brown earth a Thai garden is dug in. This
	// is not potting mix — it is outside, baked and dusty on top, so it is a shade paler and redder than
	// the soil in a pot and its pattern is laid a little wider. Its job is the foot of a wall: where
	// the plaster met the grass straight there was one line and nothing growing at it, and a building
	// that sits on grass like a cake on a plate reads as a model and not as a place.
	mats.earth = pbr(scene, "earth", { roughness: 0.96, pattern: 0.7 });
	mats.earth.albedoTexture = texture(scene, soilCanvas(256, [112, 82, 56]), { name: "earth", scale: 1 });
	mats.earth.bumpTexture = texture(scene, bumpFromCanvas(soilCanvas(128, [112, 82, 56]), 26), { name: "earthBump", scale: 1, gamma: false });
	mats.earth.bumpTexture.level = 0.35;

	mats.pot = pbr(scene, "pot", { roughness: 0.6, pattern: 0.8 });
	// The pattern is laid once round a pot 0.8 m about, so the wheel rings are a few centimetres apart.
	mats.pot.albedoTexture = texture(scene, terracottaCanvas(256), { name: "pot", scale: 1 });
	mats.pot.bumpTexture = texture(scene, bumpFromCanvas(terracottaCanvas(128), 18), { name: "potBump", scale: 1, gamma: false });
	mats.pot.bumpTexture.level = 0.25;
	// What is planted in the pots. Three plain colours, and they are flat because a marigold head is four
	// centimetres across and a chilli is one: at that size a pattern is noise and the shape and the colour
	// are the whole of the message. Kept short of the tone curve's ceiling so a flower in the late sun is a
	// flower and not a hole in the picture.
	mats.marigold = pbr(scene, "marigold", { roughness: 0.62, environmentalIntensity: 0.7 });
	mats.marigold.albedoColor = paint([224, 126, 18]);
	mats.marigold.emissiveColor = new Color3(0.072, 0.04, 0.006);
	mats.marigoldDeep = pbr(scene, "marigoldDeep", { roughness: 0.62, environmentalIntensity: 0.7 });
	mats.marigoldDeep.albedoColor = paint([184, 70, 16]);
	mats.marigoldDeep.emissiveColor = new Color3(0.05, 0.019, 0.004);
	mats.chilli = pbr(scene, "chilli", { roughness: 0.42, environmentalIntensity: 0.8 });
	mats.chilli.albedoColor = paint([158, 26, 24]);
	mats.chilli.emissiveColor = new Color3(0.026, 0.005, 0.004);
	mats.citrus = pbr(scene, "citrus", { roughness: 0.38, environmentalIntensity: 0.8 });
	mats.citrus.albedoColor = paint([224, 122, 22]);
	mats.citrus.emissiveColor = new Color3(0.045, 0.024, 0.004);
	// The toy duck in the pool. A bath toy is injection-moulded polythene: glossier than a leaf, flatter
	// in colour, and its yellow is the loudest yellow the toy man has. Kept a shade under pure yellow
	// because this Villa's tone curve has clipped a hot warm surface before (`cushionCanvas`), and a duck
	// whose back is one white blob is a potato.
	mats.duck = pbr(scene, "duck", { roughness: 0.55, environmentalIntensity: 0.5 });
	mats.duck.albedoColor = paint([240, 196, 44]);
	mats.duck.specularIntensity = 0.32;
	mats.duck.emissiveColor = new Color3(0.03, 0.024, 0.004);
	mats.duckBeak = pbr(scene, "duckBeak", { roughness: 0.55, environmentalIntensity: 0.55 });
	mats.duckBeak.albedoColor = paint([226, 118, 24]);
	mats.duckBeak.emissiveColor = new Color3(0.02, 0.01, 0.002);

	mats.wood = pbr(scene, "wood", { roughness: 0.72, pattern: 0.9 });
	// Four repeats across whatever face a piece presents: on the long rail that is grain every metre
	// and a half, on a chair leg it is grain across the width of a hand.
	mats.wood.albedoTexture = texture(scene, timberCanvas(256), { name: "timber", scale: 1 });
	mats.wood.bumpTexture = texture(scene, bumpFromCanvas(timberCanvas(128), 14), { name: "timberBump", scale: 1, gamma: false });
	mats.wood.bumpTexture.level = 0.22;
	mats.cheeseGold = pbr(scene, "cheeseGold", { roughness: 0.42 });
	mats.cheeseGold.albedoColor = paint([226, 178, 84]);
	mats.cheesePale = pbr(scene, "cheesePale", { roughness: 0.5 });
	mats.cheesePale.albedoColor = paint([240, 226, 186]);
	mats.cheeseBlue = pbr(scene, "cheeseBlue", { roughness: 0.6 });
	mats.cheeseBlue.albedoColor = paint([176, 190, 184]);
	mats.fruit = pbr(scene, "fruit", { roughness: 0.35 });
	mats.fruit.albedoColor = paint([196, 66, 44]);
	mats.grape = pbr(scene, "grape", { roughness: 0.32 });
	mats.grape.albedoColor = paint([96, 62, 108]);

	// The fittings the Villa lights itself with, and the sun they stand in.
	//
	// Every one of these used to be a little sun of its own, burning at full strength under a sky with a
	// 24-degree sun in it: the garden bulbs at (1.9,1.25,0.6), the pool's two lenses at (0.5,1.5,1.8),
	// the room's shades and cove strip at (1.15,0.72,0.36), each with `disableLighting` on so nothing
	// could argue with them. What that bought, in the pictures this folder keeps: two cyan coins lying
	// in the pool at the far end of the `pool` and `path` views, and — because the front glass mirrors a
	// sixth of what stands in front of it — the same two coins floating upside down in the middle of the
	// living room, in front of the sofa, in the `colonnade` view (`pictures/tmp-s69-glass-s.png`). A
	// lamp that is off must look off, and at half past five every one of these is off.
	//
	// OFF is not black either. A glass globe outdoors in the afternoon is the palest thing on the terrace:
	// it is lit from every side by the sky, and it is glass, so it keeps a highlight. So these three are
	// ordinary lit surfaces now — sun, sky fill and the sky cube — with a small emissive left on each so
	// that a fitting in its own shade (and the pool's pair are both a metre under the water in a walled
	// pit) does not go to nothing.
	// Glass, and not paper. These lamps are lit at half past five in a garden the sun is still on, and a
	// bulb beside the sun is not the brighter of the two: a real outdoor bulb in daylight is a smoky glass
	// bead with one bright highlight on it and a body only a little lighter than what it hangs against.
	// At (236, 230, 214) every bulb in the garden came out as a white paper cup — the wall lanterns, the
	// string lights and the bollard heads all of them reading as cotton-wool balls.
	mats.lampGlow = pbr(scene, "lampGlow", { roughness: 0.16, environmentalIntensity: 1.1 });
	mats.lampGlow.albedoColor = paint([186, 184, 174]);
	mats.lampGlow.emissiveColor = new Color3(0.055, 0.048, 0.034);
	mats.lampGlow.specularIntensity = 1.6;

	// The pool's lens: cool, a little green, and about the light of the tile it is set in, because a
	// switched-off pool light is a glass disc in a steel ring and not a lamp. Its roughness is low for
	// the same reason the water's is: a smooth surface only takes the sky mirror where the mirror line
	// runs, and this one is under a metre of water and in a pit.
	mats.poolLamp = pbr(scene, "poolLamp", { roughness: 0.24, environmentalIntensity: 0.8 });
	mats.poolLamp.albedoColor = paint([176, 206, 212]);
	mats.poolLamp.emissiveColor = new Color3(0.05, 0.1, 0.11);

	// The room behind the glass is the one place a lamp is still burning at half past five: a room under
	// a roof and behind a roof soffit is dim while the garden is bright, and a lamp left on there is what
	// makes the room a room and not a black board (see `src/interior.js`, which says the same about the
	// four point lights). It is a lampshade and not a searchlight now, though: at (1.15,0.72,0.36) the
	// cove strip and the floor lamp came through the glass blown to one colour, brighter than the sunlit
	// fascia above it, and the bloom spread the floor lamp over half the ceiling.
	mats.interiorGlow = pbr(scene, "interiorGlow", { color: [255, 190, 130], roughness: 1 });
	mats.interiorGlow.disableLighting = true;
	mats.interiorGlow.emissiveColor = new Color3(0.62, 0.39, 0.2);

	// The hills wear the same distance pattern at a coarser scale, and the same honest bytes: 84,100,84
	// through `paint`, times a pattern whose own mean light is 0.79, which is the measured hill green of
	// 74,88,72 again — and that is also what `tools/draw.js` has always drawn for them.
	mats.hill = pbr(scene, "hill", { roughness: 1 });
	mats.hill.albedoColor = paint([84, 100, 84]);
	mats.hill.albedoTexture = texture(scene, distanceCanvas(256, { masses: 4, speckle: 18, seed: 613, low: 176 }), { name: "hillMottle", scale: 1 });
	mats.stone = pbr(scene, "stone", { roughness: 0.78, pattern: 0.9 });
	mats.stone.albedoTexture = texture(scene, rockCanvas(256), { name: "rock", scale: 1 });
	mats.stone.bumpTexture = texture(scene, bumpFromCanvas(rockCanvas(128), 24), { name: "rockBump", scale: 1, gamma: false });
	mats.stone.bumpTexture.level = 0.4;

	// The six lumps in the west lawn. They wore `mats.stone`, which is granite in ninety-centimetre
	// blocks: at the size of these (up to a metre and a half) the pattern was so fine that the whole lump
	// came out the colour of a bread crust, stippled and smooth as an egg (pictures/
	// s81-lawnrocks-before-c.png). A coarser repeat of the same rock, and grey weathered granite rather
	// than biscuit: shade in a Thai afternoon does the warming, the material need not try it.
	mats.lawnStone = pbr(scene, "lawnStone", { roughness: 0.88, environmentalIntensity: 0.5, pattern: 0.55 });
	mats.lawnStone.albedoTexture = texture(scene, rockCanvas(256), { name: "lawnStone skin", scale: 1 });
	// Measured: at (0.46, 0.44, 0.4) the struck faces came out at L51..88 on grass sitting at L110..141,
	// which is a heap of wet coal. Sunlit granite is LIGHTER than the grass around it, not darker.
	mats.lawnStone.albedoColor = new Color3(0.63, 0.61, 0.56);
	mats.lawnStone.bumpTexture = mats.stone.bumpTexture; // one texture, two materials
	mats.lawnStone.emissiveColor = new Color3(0.022, 0.021, 0.018);
	mats.lawnStone.specularIntensity = 0.1;

	// The stones the pond is rimmed with. The garden's boulders wear `mats.stone`, which is granite laid
	// in ninety-centimetre blocks and is right for a lump a man could sit on; a pond's edging stones are
	// thirty centimetres across, and the same pattern at that size came out (155,155,156) in the shade —
	// the brightest thing in its corner of the picture, and the colour of a concrete kerb. So: the same
	// rock laid four times finer, taken down two fifths, and given back a little of the warmth the damp
	// takes out. The bump is the boulders' own, shared and not repainted.
	mats.pondStone = pbr(scene, "pondStone", { roughness: 0.86, environmentalIntensity: 0.45, pattern: 0.34 });
	mats.pondStone.albedoTexture = texture(scene, rockCanvas(256), { name: "pondStone skin", scale: 1 });
	// Grey and not biscuit. The first rim came out the colour of a baked crust against the green
	// (pictures/s80-pond-gutter-c.png); these are wet stones out of a bank, and shade does the warming.
	mats.pondStone.albedoColor = new Color3(0.44, 0.44, 0.43);
	mats.pondStone.bumpTexture = mats.stone.bumpTexture; // the same bump, level and all: two materials, one texture
	mats.pondStone.emissiveColor = new Color3(0.02, 0.02, 0.017);
	mats.pondStone.specularIntensity = 0.12;

	// ---- the garden's greenwork, taken off its own glare --------------------
	// Fifteen surfaces, every one of them rough, dry and green, earthen or unglazed clay: none of them is
	// varnished, wet or metallic, and none of them should throw the sun back as white light. See `matte`
	// above for the ladder and what each number bought.
	//
	// The two swards take the big lift because they are the sunlit floor of every garden picture and
	// they have to stay the brightest green in the frame; the leafy masses take a smaller one, since
	// their job is to be darker than the lawn and they only needed lifting off the black.
	//
	// Left alone then, and taken off in the session after: the paving, the plaster, the teak, the coping
	// and the roof. They were left only because a hundred measured tints were fitted to the browser with
	// that glare in them, and moving the house and the garden in one session would have told us nothing
	// about which of the two moved what. See the house block below.
	for (const [name, lift, sheen] of [
		// The two swards: see `matte` for the ladder. A sheet of grass turned square at the sky and raked
		// by the eye is the worst mirror in the Villa, so the shine comes off nearly clean and almost all
		// of what it carried is paid back as the grass's own colour.
		//
		// The three numbers came down from [4.2, 3.6, 2.4], which spent the glare on red and took it out of
		// blue, and a browser said the garden was the colour of pond scum: on the `grass` camera the lawn
		// painted (121,155,31) and on the sunlit `westlawn` (123,161,34) — a green whose blue is a
		// twenty-second of its green, which is not evening warmth but acid. Measured with `tools/tint.js
		// --fresh` on those two cameras, the ladder was:
		//
		//   [4.2, 3.6, 2.4] (as it was)   grass (121,155,31) L139   westlawn (123,161,34) L144
		//   [3.78, 3.6, 2.88]             grass (112,154,36) L137   westlawn (115,160,40) L142
		//   [3.44, 3.6, 3.36]  <- written  grass (105,153,42) L135   westlawn (108,160,47) L141
		//
		// The last line is the one kept, and the middle one was looked at as well and was still yellow: the
		// third is the first that reads as a lawn and not as a stain. It is NOT back to a flat lift — the
		// fortieth session went off to printer's green at (114,175,70), a blue two fifths of its green, and
		// this is still under a third of it, with the sun's own (1,0.71,0.46) eating part of that again. The
		// brightest sunlit blade on the west lawn went (156,197,35) -> (136,199,53): warm, and grass.
		//
		// And it was still mint a long way off, which is what this session chased. Read ten metres out on the
		// south border camera the sward painted (117,194,79): its green stood seventy-seven points over its
		// red, where a lawn that far off in a photograph is nearer forty. Most of that gap is the grass's own
		// bytes and not the sky's mirror — the mirror was measured by switching `sheen` off clean and watching
		// the same place fall to (44,119,38), where the green stands SEVENTY-FIVE over the red. The mirror is
		// what whitens the lawn; the acid is the grass itself, and taking the mirror away costs ten times the
		// light it saves in colour (`tools/lawnmint2.json` and `lawnmint3.json` are those two ladders, and
		// both were refused). So the grass's own bytes moved instead: red up a quarter, green down an
		// eighth, and the whole of it taken down eighteen points of light, because a lawn that is the
		// brightest thing in the frame under the sky reads as neon however warm its hue is
		// (`tools/lawnlight.json`: nine tenths, eight two, seven five — the second was kept). That place is
		// now (119,160,70) L145 — a sward, with the mirror still in it, twenty-four points of green lighter
		// than it was and twenty-four of light poorer, which is the trade a mown lawn actually asks for.
		["lawn", [3.7, 2.51, 2.79], 0.08],
		// The clumps stand at every angle, so far less of their light is the sky: measured on its own at
		// sheen 0.08 a clump fell (106,143,49) L128 → (94,131,43) L117, and it is paid back only so far as
		// to stay under the sward it stands in. The same shift as the sward's, so a clump cannot read as a
		// cooler and greener plant than the grass it grows out of; the clump keeps nine parts in ten of what
		// the sward gave up, because these tufts stand up into the sun and were never the flat mirror.
		//
		// Measured again the day the clumps were rebuilt, and it holds: on the `grass` camera the clumps sit
		// at 87,118,28 (L105) against the lawn they stand in at 102,130,38 (L112). Twelve points of light
		// under, and the green standing thirty-one over its own red against the sward's twenty-eight. That
		// is what it cost to stop them being maize: see `tuftCanvas` in src/textures.js.
		["tuft", [2.96, 1.92, 2.29], 0.08],
		["hedge", 1.3],
		// The bush's lift is three numbers and not one, and the extra is all in the green. Measured on a
		// shrub two metres off, on a lawn at L111 with the hedge behind it at L111: a bush paid the same
		// 1.7 in every channel came out (63,74,13) — its green eleven points over its own red, which is the
		// colour of dried moss, and the room's terracotta and teak bouncing warm light into every face the
		// sun does not reach. Paying the green twice and a half and the red a little over a third landed the
		// same bush at (69,100,15) L87 with the green twenty-nine over the red: still twenty-four points of
		// light under the lawn it stands in, which is what a shrub that shades itself owes, and green while
		// it is. The three materials move together, or a bush would wear three greens at once.
		// The three greens of a shrub are now paid the same way, and it took a measurement to see why they
		// were not. The cards — the leaf that stands OUT of the bush — were painting (47,83,13) while the
		// shell BEHIND them, which is meant to be the dark between the leaves, painted (70,114,20): the
		// sunward layer was the darker of the two, and five sessions of fiddling with the two materials'
		// pigments had never touched it. It was never the pigment and never the light either: forcing every
		// card's normal to point square at the sun bought six points of light, and turning the scene's shadows
		// off bought none. It is the SKY'S MIRROR. `specularIntensity` 0.25 on a smooth sphere is a broad
		// sun-glint spread over the whole camera-facing side of the lump, and switching it to 0.02 on those
		// two materials took the shell from L98 to L59 and left the cards where they were (`tools/bushface.json`
		// is that ladder). A real bush is a thousand waxy leaves at a thousand angles and the mean of that is
		// a soft green, which is the argument the cards already had; it was always as true of the shell, which
		// is the same leaf dressed over the same lump — and every session since complained about the bush
		// being "the loudest green in its corner" had been paying the mirror down out of the leaf's own bytes
		// instead of switching the mirror off.
		//
		// What the mirror was carrying is then paid back as colour, and not all of it: the heart keeps none,
		// because the heart IS the shade inside a bush and it wants to be the darkest thing on the plant.
		["bush", [2.38, 3.32, 2.3], 0.02],
		// The shell, paid back two thirds of what the mirror used to add: measured at 2.6 m it sits at
		// (52,100,16) L84 against the cards' L84 at the same run, which is level, and level is not what a
		// bush is — hence the cards' bigger number below.
		["bushEdge", [3.9, 5.45, 3.76], 0.02],
		// The cards get the least shine of the three greens: a card held at the low sun with the 0.25 sheen
		// the other greens keep blew out to (246,99,99) — a pink flower in a green bush
		// (`pictures/s51-crown-crop.png`). A leaf is a waxy thing, but at half a metre it is a THOUSAND
		// waxy things at a thousand angles, and the mean of that is a soft green and not a mirror.
		//
		// And they are paid back MORE than the shell, because they are the layer the sun actually reaches.
		// Measured at 2.6 m: at the old lift a card painted L59 with the mirror off and needed x2.5 to reach
		// L84, since the tone curve gives back very little at the bottom of its range. That makes the sunward
		// leaf the brightest thing on the plant, which is the whole point of the exercise.
		["bushLeaf", [5.24, 7.3, 5.06], 0.02],
		// The belt's cards take no shine at all. A card that turns its face square at the sky is a mirror
		// aimed at the brightest thing in the picture, and a browser painted the worst of them (142,157,87)
		// — no leaf in it — while the mass around it sat at (23,56,12). With `specularIntensity` at nought
		// that same card comes out (34,68,12) and nothing else in the frame moves more than four points
		// (`tools/beltlight.json`). What the shine was carrying is paid back in the two materials' own bytes
		// instead, so `lift` is nought here: see `mats.jungle`, where the whole number is written.
		["jungle", 1, 0],
		["jungleFar", 1, 0],
		["bananaLeaf", 1.3],
		["palmLeaf", 1.3],
		["stalk", 1.3],
		["palmBark", 1],
		["earth", 1],
		["soil", 1],
		["farTree", 1],
		// The boulders and the terracotta. Boulders by the west lawn were the worst of the whole lot:
		// (198,175,136) in the sun, four cream eggs laid on the grass, and (136,120, 90) once the varnish
		// came off — too dark for a stone with the sun on it, so a quarter of the brightness went back.
		// The pots go with them for the same reason: unglazed clay is a dry matte thing.
		["stone", 1.25],
		["pot", 1.25],
	]) {
		matte(mats, name, { lift, sheen });
	}

	// ---- the house and its stone, off the same glare -------------------------
	//
	// The same white wash lay on every hard surface: the lime walls, the cement base course, the teak,
	// the clay roof, the pool paving and its coping. Same lever, same payment back, and the same measure
	// — `tools/tint.js --fresh` against a live browser, three views of it, because a sunlit face and a
	// shaded one do not pay the same price for the same glare (pictures/502-home-01..05.png,
	// 503-west-01..05.png, 507-rear-01..05.png):
	//
	//   sunlit (start view)   as built      sheen 0.25    + lift      shaded (rear view)  as  sheen  +lift
	//   coping   (199,179,146) L181   (136,127,102) L127   L159 @1.65   coping   — not seen —
	//   teakWall (216, 125, 64) L140   (152, 81, 24) L 92   L118 @1.65   teakWall (55,34,10) L37  L33  L41 @1.5
	//   roof     (189,  87, 52) L106   (117, 48, 26) L 61   L 88 @1.65   plaster  (122,113,94) L114 L89 L124 @1.5
	//   teakFloor(220, 132, 67) L145   (137, 79, 34) L 88   L114 @1.65   plasterD  (57, 62, 53) L60  L47  L67 @1.5
	//   plaster  (210, 169, 127) L175  (167,133, 94) L137   L172 @1.65   teak      (73, 45,13) L49  L41  L52 @1.5
	//   plasterD (242, 204,153) L208   (190,157,109) L161   L191 @1.65
	//   paver (sunlit, west view) (213,177,135) L182   L111   L133 @1.5  L145 @1.85  L156 @2.2
	//
	// So one number per surface has to serve both halves of the picture, and the compromise lands the
	// sunlit face a little under what it was and the shaded face a little over: which is the way round the
	// fault list has been asking for since item 3 — the shaded sides of this house have been too dark for
	// six sessions, and the sunlit ones too white.
	//
	//   plaster, plasterDark, teak, teakWall, teakFloor, wood   1.5
	//   cloth   1.35  (the sunbed cushions were already at the ceiling, red 250, and needed no paying for)
	//   coping  1.8, paver 2.05  (the two big sunlit stones: the paving is 6% of the west view at L182 and
	//           a lift of 1.5 left it at L133, a sandy stone gone muddy; 2.05 lands it L154 with the slab
	//           joints, the dust drifts and the damp band all readable. The paving takes the most of the
	//           two because it is raked by the eye in `path` and `west` — 33% of the `path` frame — and a
	//           horizontal slab seen low is exactly the case where the sky's reflection was doing some
	//           honest work, so it is paid back harder than the coping. Read with the paragraph below this
	//           one, that number was doing the work of a paler stone the pattern was not; the stone is pale
	//           now and the shine is smaller)
	//   roof    2.1  (clay under a low sun is the reddest thing in the frame and the most-seen surface of
	//           the house; at 1.65 it came out L88 and read as dried mud, so it is paid back the most)
	//
	// What each one came out as after all of it, measured on the start view with `tools/cover.js` (and
	// what it was before, in brackets): coping (178,165,135) L166 [was (199,179,146) L181], teakWall
	// (185,100,35) L113 [(216,125, 64) L140], roof (164, 70,38) L88 [(189, 87, 52) L106], teakFloor
	// (168, 97, 43) L108 [(220,132, 67) L145], plaster (201,161,117) L166 [(210,169,127) L175], plasterDark
	// (219,183,130) L187 [(242,204,153) L208], paver (124,104,81) L107 [(157,130,101) L134], wood
	// (224,143, 75) L155 [(243,165,106) L177]. Every one of them carries its own colour where the sun's
	// white used to be, none of them is at the ceiling, and each keeps its own variation: the coping runs
	// over 112 points of channel spread, the teak walls 77, the roof 48 — a varnish flattens a surface by
	// pinning its bright end, and that is exactly what went away.
	// **And the deck's sheen stops at 0.18, which is not what the last session expected**. It wrote that the
	// paving was "the same fault one surface later" and that the lift should come down as the sheen does.
	// Weighed on the `path` camera, where the deck is a third of the frame (`tools/tint.js --fresh`; the four
	// pictures of that ladder are pruned, so its numbers stand here in full), the glare on stone is not the
	// glare on grass: taking the sheen from
	// 0.25 to 0.08 cost the deck thirty-eight points of light and *seventeen of warmth* — (133,113,87)
	// L115 down to (87,76,58) L77, red minus blue 46 down to 29 — because what the sun's own glint was
	// carrying on a dry slab was warm, and the lawn's was sky-blue. The deck did not need its glare paid
	// back in colour; it needed its stone painted pale in the first place (see `paverCanvas` in
	// src/textures.js), and a pale sawn limestone then bears a much lower sheen without going grey. With
	// the new pattern the same ladder reads: sheen 0.25 (174,144,105) L148 with its brightest block at
	// L165 and the sunlit slab on the `west` view at L176, brightest pixel 244 — too near the ceiling;
	// sheen 0.18 L163 there, L133 here, warmth 57, and the block-to-block spread the biggest of any of
	// them (std 7.4 against the old pattern's 6.7); sheen 0.12 (135,114,82) L117 and back to grey. So the
	// paving keeps a little shine and the coping, which is a freshly-cut arris and not a worn slab, keeps
	// less: 0.14, which takes its brightest pixel on the same view from (252,217,178) to (249,210,164)
	// and leaves the deck's own brightest at (231,186,132) — no stone in the frame is at the ceiling.
	for (const [name, lift, sheen = 0.25] of [
		["plaster", 1.5],
		["plasterDark", 1.5],
		["teak", 1.5],
		["teakWall", 1.5],
		["teakFloor", 1.5],
		["wood", 1.5],
		["cloth", 1.35],
		["coping", 1.8, 0.14],
		["copingWet", 1.8, 0.14],
		["paver", 2.05, 0.18],
		["roof", 2.1],
	]) {
		matte(mats, name, { lift, sheen });
	}

	// ---- the small living things ---------------------------------------------
	// Three butterflies and one cockroach (see src/creatures.js). Two rules, both about being seen:
	// a creature a few centimetres across is a handful of pixels, so it wants a hard edge and a colour
	// the garden has not got; and it is moving, which is what the eye is built to catch first.
	//
	// One wing canvas, painted pale, and three materials that colour it — so the three butterflies are
	// three colours and not three patterns. The `albedoColor` here multiplies the pattern, so it is
	// allowed above 1: the canvas is pale and the colour has to survive the multiplication.
	const wingSkin = texture(scene, butterflyWingCanvas(256), { name: "butterflyWing", scale: 1, clamp: true });
	const wingOf = (name, colour, glow) => {
		const mat = pbr(scene, name, { roughness: 0.55, environmentalIntensity: 0.5 });
		mat.albedoTexture = wingSkin;
		// Light THROUGH the wing: a real butterfly's wing is half window, and a windowless one reads as
		// a dead moth stuck to the air. This glow is not decoration: a wing this size is lit by the sky it
		// hangs in, and sky alone turned it into a dark smudge. See the measured numbers on the three calls
		// that follow.
		mat.emissiveTexture = wingSkin;
		mat.albedoColor = new Color3(colour[0], colour[1], colour[2]);
		mat.emissiveColor = new Color3(glow[0], glow[1], glow[2]);
		mat.alphaCutOff = 0.42;
		mat.transparencyMode = 1;
		// A new material ships with a mirror's `specularIntensity`, and a wing wearing a mirror is a sheet
		// of sky: at half a metre the wings came back (230,200,170) with a pale blue rim, cream instead of
		// the orange they are painted. Same fault the shrubs had and the cockroach had; see `matte` above.
		mat.specularIntensity = 0.15;
		sheet(mat);
		return mat;
	};
	// paper white, morpho blue, and a tiger's orange
	//
	// The three glows were measured and not guessed. At the standing start the nearest butterfly fills
	// about fifty pixels of a 1280x720 frame (`tools/where.js`), and with the glow v0.74.0 shipped with it
	// drew (123,82,44) over a sunlit paving of (184,147,80): a butterfly painted as its own shadow, which
	// is why nobody found it. A wing that size is lit by the sky it hangs in and by the light coming out of
	// its far side, so each glow is now about twice what it was and the albedo colours stay where they
	// were — the colour is carried by the window, not by paint on top of it.
	mats.butterflyWing = wingOf("butterflyWing", [1.8, 1.76, 1.6], [0.62, 0.6, 0.5]);
	mats.butterflyWingBlue = wingOf("butterflyWingBlue", [0.4, 0.85, 2.4], [0.16, 0.5, 1.15]);
	mats.butterflyWingOrange = wingOf("butterflyWingOrange", [2.6, 0.8, 0.18], [0.98, 0.3, 0.06]);
	mats.butterflyBody = pbr(scene, "butterflyBody", { roughness: 0.72, environmentalIntensity: 0.3 });
	mats.butterflyBody.albedoColor = new Color3(0.05, 0.045, 0.035);
	mats.butterflyBody.emissiveColor = new Color3(0.02, 0.018, 0.014);
	// The same varnish the garden's leaves had: a fresh material ships with a mirror's shine, and a
	// matte black insect with specularIntensity 1 is a bead of grey tin. See `matte` above.
	mats.butterflyBody.specularIntensity = 0.25;

	// The cockroach: chitin is the one insect surface with a shine on it, but a varnish is what flattened
	// every leaf in this garden and it does the same to a small animal — it turned it into a copper coin.
	// So it keeps an eighth of the mirror and no more: at arm's length a third of a mirror came back with
	// a pale blue streak along the top of the shell, which is sky and not insect.
	mats.cockroachShell = pbr(scene, "cockroachShell", { roughness: 0.5, environmentalIntensity: 0.5 });
	mats.cockroachShell.albedoTexture = texture(scene, cockroachCanvas(128, { base: [66, 38, 20] }), { name: "cockroachShell", scale: 1 });
	mats.cockroachShell.specularIntensity = 0.12;
	mats.cockroachShell.roughness = 0.55;
	mats.cockroachShell.emissiveColor = new Color3(0.016, 0.009, 0.004);
	// The shield is a flat plate and wants no pattern of its own at this size: one colour, a shade
	// lighter than the belly, which is what a roach's pronotum is.
	mats.cockroachShield = pbr(scene, "cockroachShield", { roughness: 0.7, environmentalIntensity: 0.4 });
	mats.cockroachShield.albedoColor = paint([80, 50, 24]);
	mats.cockroachShield.specularIntensity = 0.12;
	mats.cockroachShield.emissiveColor = new Color3(0.022, 0.013, 0.006);
	mats.cockroachLeg = pbr(scene, "cockroachLeg", { roughness: 0.55, environmentalIntensity: 0.6 });
	mats.cockroachLeg.albedoColor = new Color3(0.055, 0.032, 0.016);
	// The legs and antennae are a third of a millimetre across and one of them caught the sun full on and
	// came back a white streak — a needle of light sticking out of the animal. Barely a mirror now.
	mats.cockroachLeg.specularIntensity = 0.18;

	// ---- the pond and its frogs ---------------------------------------------
	//
	// The pond is a sheet of still water in the middle of a lawn, and everything the pool had to be
	// dragged towards to look like water applies here with more force: a pond is dark because it is
	// shallow over dark silt and because the things standing over it — palms, hedge, the villa's wall —
	// are the only things it has to mirror. So the surface keeps the same law as the pool (bright where it
	// grazes, see-through where it looks down, see src/water.js) but the colour it mirrors is leaf shade
	// and not sky, and the light coming up through it is the dark of a mud bottom and not the white of a
	// tiled pit.
	mats.pondWater = pbr(scene, "pondWater", { roughness: 0.05, alpha: 0.5, environmentalIntensity: 0.85, pattern: 2.4 });
	mats.pondWater.transparencyMode = 2;
	mats.pondWater.albedoColor = new Color3(0.014, 0.028, 0.02);
	// The tannin: the colour the water puts over whatever lies under it. Tea, but dark tea in the shade —
	// a bright green film over a black bottom is pondweed on a fountain, not a pond in a lawn.
	mats.pondWater.emissiveColor = new Color3(0.02, 0.045, 0.026);
	// What the surface sees where it mirrors: the green-grey of the planting that leans over it, against
	// which the sky it also takes reads bright. Compare the pool's [150,182,188] under mats.water: this is
	// a third of the light, because a pond in the palm shade has a third of the sky over it.
	mats.pondWater.mirrorColor = paint([98, 122, 100]);
	mats.pondWater.bumpTexture = texture(scene, rippleCanvas(256), { name: "pondRipple", scale: 1, gamma: false });
	// Gentler chop than the pool's: the same 0.7 of bump the pool carries turned the pond's whole surface
	// to flecks of white in a picture taken from above (pictures/s80-pond-beads.png), because the sheet is a
	// fifth the size and the pattern is stretched to the mesh and not laid on the ground. Glitter is a
	// fountain's water; a pond in a lawn sits dark and nearly still.
	mats.pondWater.bumpTexture.level = 0.2;
	// Left as glass-smooth, and deliberately: a roughness of 0.12 was tried to calm the flecks and it did
	// worse than anything — it smeared the sun's one highlight over the whole sheet, so from a first-floor
	// window the pond came back as a plate of pale foil (pictures/s80-pond-foil.png). A tight glint on a
	// dark sheet is the truth; a broad one is a sheet of milk.
	mats.pondWater.roughness = 0.05;

	// The stream (`src/stream.js`): the same law as the pond's surface — see-through looking down, a mirror at
	// a graze (`src/water.js`) — in a shallower and livelier key. It used to be BLUE, and the blue was honest for
	// what the channel then was: twenty centimetres of clean water over a pale stone bed, which is a blue-green
	// and nothing else. The channel is dirt now — earth banks, an earth bed, stones at the edge — and water over
	// mud is not blue. It is the pond's tannin, lighter, because there is a tenth as much of it and it is being
	// dragged along its bed: a shallow run of muddy water, the colour of what lies under it.
	mats.streamWater = pbr(scene, "streamWater", { roughness: 0.08, alpha: 0.5, environmentalIntensity: 0.85, pattern: 2.0 });
	mats.streamWater.transparencyMode = 2;
	mats.streamWater.albedoColor = new Color3(0.014, 0.026, 0.018);
	// The colour of fifteen centimetres of moving water over damp silt: a green with a breath of brown in it,
	// and stronger than the pond's (0.02,0.045,0.026) because a shallow sheet lets more of the bottom through
	// and the bottom here is soil at its lightest, not a metre of dark water over a basin.
	mats.streamWater.emissiveColor = new Color3(0.055, 0.075, 0.045);
	// What it mirrors: the hedge behind, the palms leaning over from the east, and open lawn. It used to be
	// (112,130,106), and the pictures say what that bought: seen along its length the whole thirty-four metres of
	// the channel came out (73,87,60) — a band of pale foil lying on the lawn, which is the same fault the pond
	// had and under the same law (`mats.pondWater` above): a bright mirror spread over a shallow sheet is a sheet
	// of milk. A hand darker than the pond's own (98,122,100), because the watercourse is a tenth as deep and
	// half of what is seen of it is the bed through the film.
	mats.streamWater.mirrorColor = paint([46, 58, 42]);
	// Its OWN ripple pattern, and it has to be its own: `animate` slides this texture's offsets downstream at
	// eight centimetres a second, and sharing it with the pond would set the pond's surface running too.
	//
	// THE RIBS, AND WHERE THEY CAME FROM. The channel's UVs are metres — `u` across the water, `v` the running
	// distance down the course — and this texture was laid at one repeat to the metre, which is a grid: a ripple
	// every metre all the way down thirty-four metres of stream, lined up from bank to bank. Photographed from
	// the lawn (`pictures/s85-lawnfar.png`) the surface came out (73,87,60) and ribbed like a tarpaulin, and the
	// ribs were this line. So the pattern is stretched a long way with the flow and kept short across it — a
	// current is long and thin, not a chessboard — and `src/stream.js` bends the tiles off their lines the same
	// way the banks' soil is bent, so there is no grid left to see.
	mats.streamWater.bumpTexture = texture(scene, rippleCanvas(256, { strength: 11, seed: 671 }), {
		name: "streamRipple",
		scale: 1,
		gamma: false,
	});
	mats.streamWater.bumpTexture.uScale = 1 / 0.55;
	mats.streamWater.bumpTexture.vScale = 1 / 2.3;
	// More chop than the pond's 0.2 and less than the pool's 0.7: a shallow channel is rougher than a still
	// basin, and a stream this narrow never gets the long swell a wide pool does.
	mats.streamWater.bumpTexture.level = 0.16;
	// The veil at the mouth: the sheet of water going over the lip into the pond.
	//
	// IT IS WATER AND NOT A GLOW. The first version was an additive white sheet, self-lit, with the light straight
	// through it — and a browser at the mouth showed what that is: a glowing plastic curtain standing in front of
	// the rock, brighter than anything in the garden and with hard cut ends at the top (`pictures/s85-mouth6.png`).
	// So the veil is now a translucent PBR sheet: the rock shows wherever the water is thin, the sky is caught in
	// it where the sheet runs thick and glassy, and it is no brighter than the water it came from. Its pattern
	// runs: `animate` slides the streaks down, which is the one thing that makes a still quad read as falling.
	mats.streamFall = pbr(scene, "streamFall", { roughness: 0.12, environmentalIntensity: 1.2 });
	mats.streamFall.albedoColor = paint([226, 236, 236]);
	// The alpha of the water AND its foam, out of one picture: thick in the threads, nearly nothing between
	// them, and washed a little across all of it. The same canvas lights the sheet and thins it, which is the
	// truth of it — where there is no water there is neither opacity nor sparkle. Seventy threads, running whole
	// from lip to plunge, blurred so they are rivulets and not a comb of hard white slats, which is what the
	// first narrow unblurred version minified into when it was seen from the far bank.
	const fallSkin = texture(scene, streakCanvas(256, { threads: 70, seed: 611, breaks: 0, haze: 0.5, thin: 1.4, soft: 3 }), {
		name: "stream fall",
		scale: 1,
	});
	mats.streamFall.opacityTexture = fallSkin;
	// And the foam: a falling sheet is bright because a hundred little surfaces scatter the sky sideways, and
	// shade alone in a dusk garden leaves it the colour of slate (`pictures/s85-mouth7.png`). Kept well under
	// what an additive sheet used to throw — the water is the brightest thing at the mouth, not the brightest
	// thing in the garden.
	mats.streamFall.emissiveTexture = fallSkin;
	mats.streamFall.emissiveColor = new Color3(0.26, 0.3, 0.33);
	mats.streamFall.transparencyMode = 2; // blend
	mats.streamFall.backFaceCulling = false;
	mats.streamFall.specularIntensity = 0.7;
	// A bump of its own, drawn out along the fall: water going over a lip is ribbed lengthways, and a flat sheet
	// of it is a board.
	mats.streamFall.bumpTexture = texture(scene, rippleCanvas(256, { strength: 9, seed: 617 }), {
		name: "streamFallRipple",
		scale: 1,
		gamma: false,
	});
	mats.streamFall.bumpTexture.level = 0.35;

	// The basin: a liner of damp silt and stone, dark, and it wants nothing of the sky's mirror.
	mats.pondSilt = pbr(scene, "pondSilt", { roughness: 0.92, environmentalIntensity: 0.55, pattern: 0.55 });
	// Damp gravel, and not a void. The first band was fitted at paint([46,44,34]) on the reasoning that a
	// pond's lining is shade itself, and what a browser showed was a black gutter all round the water: the
	// bare strip between the stones and the grass came back (20,18,7) — L15, where the grass beside it is
	// L100 and wet rock under the same sky is L45. The pick at such a pixel says `pondSilt`, so it was never
	// a hole in the world, only a colour too dark to believe; the black band of that first rim is
	// pictures/s80-pond-gutter-c.png. Damp silt in shade is a dark brown, and it is allowed to be seen:
	// these numbers took the same strip to L33.
	mats.pondSilt.albedoColor = paint([138, 124, 92]);
	mats.pondSilt.albedoTexture = texture(scene, soilCanvas(256), { name: "pondSilt skin", scale: 1 });
	mats.pondSilt.emissiveColor = new Color3(0.052, 0.047, 0.034);
	// Sun reaches the bottom of a shallow basin the same way a directional light reaches anywhere — it has
	// no idea the rim is in the way — so the floor would come back as a tray of lit soil. The rim stones are
	// far too small to throw a shadow at this shadow map's size, so the shade is paid for in the albedo and
	// the emissive above, which is the same lie the pool's tiles tell in the opposite direction.
	mats.pondSilt.specularIntensity = 0.04;
	mats.pondSilt.roughness = 1;

	// The earth the watercourse is cut in (`src/stream.js`). It began by wearing the pond's silt, which is
	// honest — both are damp soil — and came out of a browser the same olive as the grass it sits in: the bank
	// measured (43,50,15) against the lawn's (62,84,19), so it had the right difference in brightness and none
	// in colour, and a bank that is the colour of its grass is a bald patch and not a bank of earth. A stream's
	// bank is dug, wet, clayey ground: warmer than the lawn, and a little browner than the pond's gravel.
	mats.streamEarth = pbr(scene, "streamEarth", { roughness: 1, environmentalIntensity: 0.5, pattern: 0.55 });
	mats.streamEarth.albedoColor = paint([158, 130, 94]);
	mats.streamEarth.albedoTexture = texture(scene, soilCanvas(256, [88, 62, 40]), { name: "streamEarth skin", scale: 1 });
	// A breath of its own light, warm: the banks stand in their own shade and in the grass's, and without this
	// the soil goes the grey-green of a wet pavement.
	mats.streamEarth.emissiveColor = new Color3(0.062, 0.046, 0.028);
	// Damp clay, not dry dust: almost no specular, and what there is comes from the water film on it.
	mats.streamEarth.specularIntensity = 0.05;

	// A lily pad: a waxy disc lying on the water. It keeps a little of the water's own glass — a bead of
	// rain sits on a pad for a whole morning — but not much, and none of it in the middle of the pad.
	mats.lilyPad = pbr(scene, "lilyPad", { roughness: 0.52, environmentalIntensity: 0.7, pattern: 0.38 });
	mats.lilyPad.albedoTexture = texture(scene, lilyPadCanvas(128), { name: "lilyPad skin", scale: 1 });
	mats.lilyPad.emissiveTexture = mats.lilyPad.albedoTexture;
	mats.lilyPad.emissiveColor = new Color3(0.022, 0.05, 0.02);
	mats.lilyPad.specularIntensity = 0.4;
	mats.lilyPad.roughness = 0.44;
	// A water lily's flower: white with a pink back, and a breath of its own light so it does not go black
	// when the pad it stands on is in the shade of a palm. It is the smallest bright thing in the garden and
	// the only white one, which is the whole reason to have it.
	mats.lilyFlower = pbr(scene, "lilyFlower", { roughness: 0.42, environmentalIntensity: 0.9 });
	mats.lilyFlower.albedoColor = paint([246, 232, 232]);
	mats.lilyFlower.emissiveColor = new Color3(0.1, 0.085, 0.082);
	// The stamen: the ball of yellow in the middle of the flower, and the warmest thing on the water.
	mats.lilyHeart = pbr(scene, "lilyHeart", { roughness: 0.6, environmentalIntensity: 0.6 });
	mats.lilyHeart.albedoColor = paint([236, 196, 84]);
	mats.lilyHeart.emissiveColor = new Color3(0.16, 0.12, 0.03);

	// A ring of disturbance on the pond, drawn where a frog goes in. It lights itself and takes no
	// part in the scene\u2019s lighting: the water under it is the darkest thing in the garden, and a ring
	// lit by that light would be invisible exactly where it is wanted.
	mats.ripple = pbr(scene, "ripple", { color: [214, 232, 210], roughness: 1, environmentalIntensity: 0 });
	mats.ripple.disableLighting = true;
	mats.ripple.emissiveColor = new Color3(0.1, 0.125, 0.1);
	// Measured, not judged: at 0.3 the ring came out near L190 on water that sits at L55, and a ring that
	// bright is a painted target on the surface. A real ripple is a few points of light and no more.
	mats.ripple.opacityTexture = texture(scene, rippleRingCanvas(128), { name: "ripple ring", scale: 1 });
	mats.ripple.transparencyMode = 2; // blend
	mats.ripple.backFaceCulling = false;
	mats.ripple.disableDepthWrite = true;

	// The frog: eight centimetres of real animal shown at thirteen, the same honesty as the cockroach
	// (see src/creatures.js): at arm's length a thirteen-centimetre frog is a handful of pixels, and a
	// visitor is meant to be able to see one across the lawn.
	mats.frogSkin = pbr(scene, "frogSkin", { roughness: 0.42, environmentalIntensity: 0.7, pattern: 0.055 });
	mats.frogSkin.albedoTexture = texture(scene, frogSkinCanvas(128), { name: "frogSkin", scale: 1 });
	mats.frogSkin.emissiveTexture = mats.frogSkin.albedoTexture;
	mats.frogSkin.emissiveColor = new Color3(0.026, 0.036, 0.016);
	// Wet, not varnished: a frog's skin is the one animal surface in this garden meant to be damp, but a
	// full mirror turns it into a glazed sweet — the same lesson the leaves had, ten times over.
	mats.frogSkin.specularIntensity = 0.45;
	mats.frogSkin.roughness = 0.36;
	// The belly and the throat: pale, faintly mottled, and the throat is the part that inflates.
	mats.frogBelly = pbr(scene, "frogBelly", { roughness: 0.55, environmentalIntensity: 0.5, pattern: 0.05 });
	mats.frogBelly.albedoColor = paint([196, 190, 152]);
	mats.frogBelly.albedoTexture = texture(scene, greyNoiseCanvas(128, 3, 41), { name: "frogBelly skin", scale: 1 });
	mats.frogBelly.emissiveColor = new Color3(0.05, 0.049, 0.038);
	mats.frogBelly.specularIntensity = 0.3;
	// The eye is a gold bead with a black bar across it. At this size the bar is the whole difference
	// between an eye and a yellow dot, so the pupil is modelled as a second, smaller shell rather than
	// painted: the canvas would have to be a hundred pixels to the frog to carry a bar.
	mats.frogEye = pbr(scene, "frogEye", { roughness: 0.22, environmentalIntensity: 1.1 });
	mats.frogEye.albedoColor = paint([188, 132, 36]);
	mats.frogEye.emissiveColor = new Color3(0.09, 0.06, 0.014);
	mats.frogEye.specularIntensity = 0.6;
	mats.frogPupil = pbr(scene, "frogPupil", { roughness: 0.4, environmentalIntensity: 0.3 });
	mats.frogPupil.albedoColor = paint([14, 12, 10]);
	mats.frogPupil.emissiveColor = new Color3(0.006, 0.005, 0.004);

	// The koi. One skin to a fish, and four fish, because two fish wearing one canvas are twins and a pond
	// with twins in it looks stocked from a bucket (`koiCanvas` in src/textures.js has the account of how a
	// skin is painted, and src/koi.js of who wears which).
	//
	// The small emissive on each is not a glow: it is the water's bill paid in advance. A koi is seen
	// THROUGH `mats.pondWater`, which lies over it at half its own alpha with a dark tannin in it, so
	// everything under the surface arrives at the eye at about half of what it would in air — and a fish
	// that arrives at half light is a brown smudge, which is what the first of them measured as. This pays
	// back about a fifth of what the sheet takes, and no more: a koi wearing its whole colour under water
	// would be a sticker on the surface.
	for (const [name, style, seed] of [
		["koiKohaku", "kohaku", 61],
		["koiGold", "gold", 88],
		["koiPearl", "kohaku", 977],
		["koiLacery", "lacery", 413],
	]) {
		// No `pattern`: this skin's texture coordinates are the fish itself — nought at the tail and one at
		// the snout — and not a pattern laid in metres of surface (`koiCanvas` is painted that way on purpose).
		const mat = pbr(scene, name, { roughness: 0.34, environmentalIntensity: 0.3 });
		mat.albedoTexture = texture(scene, koiCanvas(256, { style, seed }), { name: `${name} skin`, scale: 1 });
		// Wet scales: a carp is varnished in slime and does catch the sky, but it is under 4 cm of water and
		// a tannin film while it does it. Measured from the bank at a distance of four metres: at 0.6 of sky
		// the fish came back the colour of the water round it — a chalky grey slab, a weed bag and not a
		// carp — so the sheen is kept low and wide and the pattern is left to do the talking.
		mat.specularIntensity = 0.2;
		mat.emissiveTexture = mat.albedoTexture;
		mat.emissiveColor = new Color3(0.14, 0.132, 0.114);
		// The body is lofted by hand (see src/koi.js) and a hand-built tube can be wound either way round;
		// a fish that vanishes when it turns its far side is the worst thing a loft can do, so both sides are
		// drawn and the library is asked to point its normals at the eye.
		mat.backFaceCulling = false;
		mat.twoSidedLighting = true;
		mats[name] = mat;
	}
	// The fins: a carp's fins are thin membrane over a few rays, and you can see the light through them.
	// Half the skin's own colour, drawn from both sides because a fin turns edge-on to the eye a hundred
	// times a minute as the fish swims, and a culled fin is a fish with half its tail missing.
	//
	// It used to be drawn at four tenths alpha, which at three metres is not a translucent fin but no fin at
	// all: the water takes the rest and the fish swims about with nothing on it (`pictures/koi-before-top.png`).
	// Half membrane and half veil: a fin has to be SEEN before it can be transparent.
	//
	// And no more of the sky than the body is allowed. The first of them wore half the vault and came back
	// paler than the fish it was attached to, so the fins take a little of the sky now and the pattern does
	// the rest. They are still the brightest thing on the animal, which is right: a carp's fins are pale
	// membrane and a koi at the surface shows them before it shows anything else.
	mats.koiFin = pbr(scene, "koiFin", { color: [206, 178, 140], roughness: 0.6, alpha: 0.62, environmentalIntensity: 0.28 });
	mats.koiFin.albedoColor = paint([206, 178, 140]);
	mats.koiFin.transparencyMode = 2; // blend
	mats.koiFin.backFaceCulling = false;
	mats.koiFin.twoSidedLighting = true;
	mats.koiFin.emissiveColor = new Color3(0.05, 0.042, 0.03);
	// The eye: a black bead in a pale ring. A fish's eye is on the side of its head and mostly hidden at
	// this size, but where it shows it is the one mark that says the front end is a head.
	//
	// No sheen worth speaking of. A wet bead of that size catches the sky and comes back as a bright coin
	// stuck on the fish's face (`pictures/koi-face.png`), and two bright coins on a head are goggles, not
	// eyes. A koi's eye is a matte bead in a socket.
	//
	// The duck's eyes are made of this too (`src/duck.js`), which is right: a rubber duck's eyes are printed
	// flat on the plastic and shine only as much as the whole bird does.
	mats.koiEye = pbr(scene, "koiEye", { roughness: 0.55, environmentalIntensity: 0.12 });
	mats.koiEye.albedoColor = paint([26, 24, 22]);
	mats.koiEye.specularIntensity = 0.12;
	mats.koiEye.emissiveColor = new Color3(0.02, 0.019, 0.017);

	// The shark that lives in the pool (`src/shark.js`). Five surfaces: the countershaded skin, the fins,
	// the dark inside of the mouth, the teeth and the eyes — and two more for the blood it leaves.
	//
	// The skin carries its own picture the way the koi's does: the loft in `src/loft.js` maps u along the
	// animal and v round it, so the canvas IS the shark and no `pattern` is asked for. The countershading —
	// dark above, white below, and the break between them a line and not a gradient — is painted into it,
	// along with the five gill slits and the lateral line, because those are the marks that say SHARK at two
	// metres and a plain grey tube does not.
	mats.sharkSkin = pbr(scene, "sharkSkin", { roughness: 0.44, environmentalIntensity: 0.55 });
	mats.sharkSkin.albedoTexture = texture(scene, sharkSkinCanvas(256, { seed: 91 }), { name: "shark skin", scale: 1 });
	// The same small emissive the koi wear, and for the same reason: the animal is seen THROUGH the pool's
	// film, which takes about half of what it is shown. Nothing paid back is a brown smudge; the whole thing
	// paid back is a sticker. This is about a fifth.
	mats.sharkSkin.emissiveTexture = mats.sharkSkin.albedoTexture;
	mats.sharkSkin.emissiveColor = new Color3(0.13, 0.135, 0.13);
	// Wet skin, not oiled: a shark is slick but it is not varnished, and at a full sheen the back came back
	// the colour of the water out of the sky cube.
	mats.sharkSkin.specularIntensity = 0.32;
	// The loft is built by hand and a hand-built tube can be wound either way round, so both faces are drawn
	// and the library is asked to light whichever one is showing.
	mats.sharkSkin.backFaceCulling = false;
	mats.sharkSkin.twoSidedLighting = true;
	// A faint dermal relief off the same canvas: shark skin is sandpaper, and the grain is what stops the
	// back being one flat tone of light when it is a dark shape under a bright surface.
	mats.sharkSkin.bumpTexture = texture(scene, bumpFromCanvas(sharkSkinCanvas(128, { seed: 91 }), 8), { name: "shark skin bump", scale: 1, gamma: false });
	mats.sharkSkin.bumpTexture.level = 0.22;
	// The fins: a shade darker than the back, and thinner-looking, so a dorsal cutting the surface reads as
	// a blade and not as a second body. Drawn from both sides because a fin turns edge-on a hundred times a
	// minute and a culled fin is a shark with half its tail missing.
	mats.sharkFin = pbr(scene, "sharkFin", { roughness: 0.4, environmentalIntensity: 0.5 });
	mats.sharkFin.albedoColor = paint([48, 62, 70]);
	mats.sharkFin.emissiveColor = new Color3(0.028, 0.034, 0.038);
	mats.sharkFin.backFaceCulling = false;
	mats.sharkFin.twoSidedLighting = true;
	mats.sharkFin.specularIntensity = 0.26;
	// The inside of the mouth: as near black as anything in this Villa, with a red in it so that an open
	// mouth at arm's length is a wound and not a hole punched in the drawing. Both faces, because the gullet
	// is a tube inside a tube and which of its walls is showing depends on how far the jaw has dropped.
	mats.sharkMouth = pbr(scene, "sharkMouth", { roughness: 0.85, environmentalIntensity: 0.12 });
	// And no specular at all, which is the part that mattered. A wet palate does shine, but a cone of light on
	// a surface this small, seen from a visitor's height, is a white coin in the middle of a dark mouth and it
	// is the only thing anybody sees — the first pictures of an open mouth were a red ball with a rivet in it.
	// Flesh inside an animal is matte beside skin.
	mats.sharkMouth.specularIntensity = 0;
	// Lit a shade more than the first cut: the throat is what an open mouth is looked AT, and a throat that is
	// pure black reads as a hole punched in the drawing rather than as the inside of an animal. Still the
	// darkest thing in the Villa, but with red in it now that survives the pool's film.
	mats.sharkMouth.albedoColor = paint([64, 17, 21]);
	mats.sharkMouth.emissiveColor = new Color3(0.055, 0.013, 0.016);
	mats.sharkMouth.backFaceCulling = false;
	mats.sharkMouth.twoSidedLighting = true;
	// The teeth: bone, not porcelain. Enamel is warm, it is not white-white, and it takes a soft sheen; a
	// mirror on a cone the size of a grain of rice is a spark in the middle of a dark mouth and it is all
	// anybody sees.
	mats.sharkTooth = pbr(scene, "sharkTooth", { roughness: 0.34, environmentalIntensity: 0.4 });
	mats.sharkTooth.albedoColor = paint([226, 219, 198]);
	mats.sharkTooth.emissiveColor = new Color3(0.05, 0.048, 0.041);
	mats.sharkTooth.specularIntensity = 0.4;
	// The eyes: black, and low and wide on the head. A shark's eye has no white in it and no lid; the only
	// thing it has that a bead has not is that it is not quite a sphere.
	mats.sharkEye = pbr(scene, "sharkEye", { roughness: 0.18, environmentalIntensity: 0.8 });
	mats.sharkEye.albedoColor = paint([16, 15, 16]);
	mats.sharkEye.emissiveColor = new Color3(0.012, 0.012, 0.013);
	mats.sharkEye.specularIntensity = 0.7;
	// The gecko (`src/gecko.js`): a palm of lizard on the villa wall at night. The skin is the animal's own
	// protection — the colour of old plaster with rust on it — and the wall it lives on is old plaster, so the
	// skin is held a shade darker and warmer than the plaster and the EYES are what gets found. A gecko in this
	// country is found by torchlight on two beads and nothing else.
	mats.geckoSkin = pbr(scene, "geckoSkin", { roughness: 0.86, environmentalIntensity: 0.4 });
	mats.geckoSkin.albedoTexture = texture(scene, geckoSkinCanvas(128, { seed: 512 }), { name: "gecko skin", scale: 1 });
	mats.geckoSkin.bumpTexture = texture(scene, bumpFromCanvas(geckoSkinCanvas(96, { seed: 512 }), 3), { name: "gecko skin bump", scale: 1, gamma: false });
	// Barely there: it is after dark that these are looked at, and a matte animal in a lamp's spill still has
	// to be a little bit seen.
	mats.geckoSkin.emissiveColor = new Color3(0.014, 0.013, 0.012);
	mats.geckoSkin.specularIntensity = 0.1;
	// The eyes: amber, big for the head, and the only part of the animal with a wet shine on it. The emissive
	// is small — a bead's worth, not a lamp's — but it is the difference between a wall with a mark on it and a
	// wall with somebody home.
	mats.geckoEye = pbr(scene, "geckoEye", { roughness: 0.2, environmentalIntensity: 1.1 });
	mats.geckoEye.albedoColor = paint([206, 152, 58]);
	mats.geckoEye.emissiveColor = new Color3(0.075, 0.05, 0.014);
	mats.geckoEye.specularIntensity = 0.75;
	// The pupil: a vertical slit, which is the mark that says NOCTURNAL before anything else does.
	mats.geckoPupil = pbr(scene, "geckoPupil", { roughness: 0.35, environmentalIntensity: 0.3 });
	mats.geckoPupil.albedoColor = paint([12, 11, 10]);
	mats.geckoPupil.emissiveColor = new Color3(0.004, 0.004, 0.003);
	// The raven (`src/raven.js`), on the ridge. Soot is not black: a crow's plumage is a very dark blue-grey that
	// takes the sky along the shoulders, and a flat black albedo on a bird sixty metres away is a hole cut in the
	// sky — the first cut of this came out as a silhouette with no part of it separable from any other. So the
	// body is dark blue-grey and matte, and the shoulders are a separate, glossier, bluer thing, which is the one
	// place the bird is allowed to flash.
	mats.ravenFeather = pbr(scene, "ravenFeather", { roughness: 0.5, metalness: 0.14, environmentalIntensity: 0.75 });
	mats.ravenFeather.albedoColor = paint([19, 21, 28]);
	mats.ravenFeather.emissiveColor = new Color3(0.007, 0.008, 0.012);
	mats.ravenFeather.specularIntensity = 0.5;
	mats.ravenSheen = pbr(scene, "ravenSheen", { roughness: 0.24, metalness: 0.42, environmentalIntensity: 1.3 });
	mats.ravenSheen.albedoColor = paint([30, 40, 66]);
	mats.ravenSheen.emissiveColor = new Color3(0.01, 0.014, 0.026);
	// The blue-green oil of a raven's wing, if this build of Babylon will take it. It is not needed — the gloss
	// and the blue albedo do most of the work on their own — so it is tried and not relied on.
	mats.ravenSheen.iridescence = 0.55;
	mats.ravenSheen.iridescenceIntensity = 0.6;
	// The bill, the shanks and the toes: horn, which is darker than the feather and a little waxy.
	mats.ravenBill = pbr(scene, "ravenBill", { roughness: 0.42, environmentalIntensity: 0.7 });
	mats.ravenBill.albedoColor = paint([26, 24, 23]);
	mats.ravenBill.specularIntensity = 0.55;
	// The eye: a black bead, and the only part of the bird with a hard highlight on it, which is what makes it
	// look wet and therefore alive at thirty paces.
	mats.ravenEye = pbr(scene, "ravenEye", { roughness: 0.12, environmentalIntensity: 1 });
	mats.ravenEye.albedoColor = paint([13, 13, 14]);
	mats.ravenEye.emissiveColor = new Color3(0.014, 0.014, 0.016);
	mats.ravenEye.specularIntensity = 1.1;
	// The coin (`src/raven.js`). Real gold, which means metal: it has no colour of its own to scatter, it takes
	// the colour of whatever it is reflecting, and a yellow plastic with a painted shine on it is the one way to
	// make a gold coin look worthless. The stamp does the rest — the same canvas is laid down as a bump so the
	// crown, the wheel and the beads are struck and not printed.
	mats.royalGold = pbr(scene, "royalGold", { color: [255, 198, 96], roughness: 0.28, metalness: 1, environmentalIntensity: 1.5 });
	mats.royalGold.albedoTexture = texture(scene, royalCoinCanvas(320), { name: "royal coin", scale: 1 });
	mats.royalGold.bumpTexture = texture(scene, bumpFromCanvas(royalCoinCanvas(256), 1.6), { name: "royal coin strike", scale: 1, gamma: false });
	mats.royalGold.emissiveColor = new Color3(0.028, 0.02, 0.004);
	mats.royalGold.specularIntensity = 1.1;
	// The blood (`src/blood.js`). Unlit on purpose, like the pond's ripple rings: the cloud lies under a
	// sheet of water that is already painting everything under it half-cyan, and a lambert surface down there
	// is a surface that has been asked to be a shape when all it is asked to be is a stain. Two materials so
	// that no two neighbouring lumps are the same blob.
	for (const [name, seed, glow] of [["blood", 7, 0.42], ["bloodB", 23, 0.34]]) {
		const mat = pbr(scene, name, { roughness: 1, environmentalIntensity: 0, alpha: 1 });
		mat.disableLighting = true;
		// Dark red, and dark: blood in a swimming pool is not a red flag, it is a rust-coloured cloud that
		// thins. Bright red under cyan water came out the colour of tomato soup and looked poured from a tin.
		mat.emissiveColor = new Color3(glow, glow * 0.07, glow * 0.09);
		mat.opacityTexture = texture(scene, bloodCanvas(128, { seed }), { name: `${name} cloud`, scale: 1 });
		mat.transparencyMode = 2; // blend
		mat.backFaceCulling = false;
		mat.disableDepthWrite = true;
		mats[name] = mat;
	}
	// The two fireflies (`src/fireflies.js`). By day they are switched off — `night()` in that file — so
	// these numbers only ever matter in the dark. The body is as near black as anything in this folder: a
	// firefly at rest in a grass tuft is a speck with a bead of light on it, and a body with any grey in it
	// reads as a scrap of paper stuck to the lawn.
	mats.fireflyBody = pbr(scene, "fireflyBody", { roughness: 0.6, environmentalIntensity: 0.35 });
	mats.fireflyBody.albedoColor = paint([38, 31, 25]);
	mats.fireflyBody.specularIntensity = 0.3;
	// The wing cases: a shade browner and glossier than the head, because they are varnished and the head
	// is not.
	mats.fireflyCase = pbr(scene, "fireflyCase", { roughness: 0.42, environmentalIntensity: 0.4 });
	mats.fireflyCase.albedoColor = paint([54, 42, 30]);
	mats.fireflyCase.specularIntensity = 0.5;
	// The hindwings: thin cuticle, seen mostly edge-on, always moving.
	mats.fireflyWing = pbr(scene, "fireflyWing", { color: [198, 202, 210], roughness: 0.34, alpha: 0.42, environmentalIntensity: 0.5 });
	mats.fireflyWing.transparencyMode = 2; // blend
	mats.fireflyWing.backFaceCulling = false;
	mats.fireflyWing.twoSidedLighting = true;
	// The lantern: the light organ at the tail's last end. What is written here is the OFF state, and
	// `src/fireflies.js` clones this once per insect and writes the flash over it every frame. An emissive
	// left in the material would have them burning at noon, and a firefly is not a paper lantern.
	mats.fireflyLantern = pbr(scene, "fireflyLantern", { roughness: 0.3, environmentalIntensity: 0.2 });
	mats.fireflyLantern.albedoColor = paint([150, 156, 96]);
	mats.fireflyLantern.emissiveColor = new Color3(0, 0, 0);
	// The glow round the lantern: shells of lit glass, unlit by anything else, whose alpha `src/fireflies.js`
	// drives with the flash. Painted here rather than left to the bloom, because this Villa's bloom is a
	// tight one (a wide kernel fogs the whole night) and a firefly's scatter is a finger's width across.
	mats.fireflyHalo = pbr(scene, "fireflyHalo", { roughness: 1, alpha: 0.34, environmentalIntensity: 0 });
	mats.fireflyHalo.disableLighting = true;
	mats.fireflyHalo.transparencyMode = 2; // blend
	mats.fireflyHalo.backFaceCulling = false;
	mats.fireflyHalo.specularIntensity = 0;
	mats.fireflyHalo.emissiveColor = new Color3(0, 0, 0);

	// The gun the visitor may ask for (`src/weapon.js`). Blued steel and black polymer, and nothing painted on
	// either: at forty centimetres from the eye a gun is a silhouette with a few hard highlights on it, and the
	// only thing that makes those highlights read as metal is a low roughness and a high metalness — a grey
	// plastic gun with a painted stripe on it is a toy, and a toy in a garden full of animals is a sticker.
	mats.weaponSteel = pbr(scene, "weaponSteel", { roughness: 0.36, metalness: 0.85, environmentalIntensity: 1.2 });
	mats.weaponSteel.albedoColor = paint([58, 60, 66]);
	mats.weaponSteel.specularIntensity = 1;
	// The grip, the stock and the forend: black polymer, which takes almost no shine and has a little of its
	// own warmth in it. Pure black here would be a hole in the picture, so it is soot with brown in it.
	mats.weaponGrip = pbr(scene, "weaponGrip", { roughness: 0.62, environmentalIntensity: 0.5 });
	mats.weaponGrip.albedoColor = paint([66, 57, 48]);
	mats.weaponGrip.specularIntensity = 0.45;
	// The muzzle flash: a self-lit star at the end of the barrel, ADDED to what is behind it rather than
	// blended over it, because a flash is light and not paint. Its emissive sits above the bloom's threshold
	// (1.6 — see src/main.js) on purpose, so the one bright thing the visitor makes in this garden glows the
	// way the night lamps do.
	mats.muzzleFlash = pbr(scene, "muzzleFlash", { roughness: 1, environmentalIntensity: 0 });
	mats.muzzleFlash.disableLighting = true;
	mats.muzzleFlash.emissiveColor = new Color3(2.3, 1.25, 0.4);
	mats.muzzleFlash.opacityTexture = texture(scene, flashCanvas(128), { name: "muzzle flash", scale: 1 });
	mats.muzzleFlash.transparencyMode = 3; // add
	mats.muzzleFlash.backFaceCulling = false;
	mats.muzzleFlash.disableDepthWrite = true;
	// The cone of the flashlight's beam. Not a surface and not lit: it is what the light in the air looks like
	// from the side, so it ADDS a little warmth to everything behind it and writes no depth, which is why it can
	// stand in front of the whole Villa without hiding any of it. Note that this is a plain material, not a PBR
	// one: `transparencyMode` on a PBR material means something else entirely (3 there is a decal, and a decal of
	// a black cone is a black cone), and what a beam needs is an ordinary additive blend. The brightness is the
	// alpha, and `src/flashlight.js` writes it every frame; it starts dark.
	mats.flashlightBeam = new StandardMaterial("flashlightBeamMat", scene);
	mats.flashlightBeam.disableLighting = true;
	mats.flashlightBeam.diffuseColor = new Color3(0, 0, 0);
	mats.flashlightBeam.specularColor = new Color3(0, 0, 0);
	mats.flashlightBeam.emissiveColor = new Color3(1, 0.93, 0.79);
	mats.flashlightBeam.alpha = 0;
	mats.flashlightBeam.alphaMode = Constants.ALPHA_ADD;
	mats.flashlightBeam.backFaceCulling = false;
	mats.flashlightBeam.disableDepthWrite = true;
	// Where a round lands: three puffs out of one painted cloud, differing only in their colour, because a
	// spurt the wrong colour is the fastest way to make a hit look pasted onto the picture. All three are
	// self-lit and added or blended the same way the pond's ripples are: the mark has to be visible against a
	// sunlit deck and against dark water at the same hour.
	for (const [name, glow, mode] of [
		["spurtWater", [1.15, 1.3, 1.35], 3],
		["spurtDust", [0.62, 0.5, 0.36], 2],
		["spurtBlood", [0.5, 0.07, 0.08], 2],
	]) {
		const mat = pbr(scene, name, { roughness: 1, environmentalIntensity: 0 });
		mat.disableLighting = true;
		mat.emissiveColor = new Color3(glow[0], glow[1], glow[2]);
		mat.opacityTexture = texture(scene, puffCanvas(128, { seed: name.length * 7 + 3 }), { name: `${name} puff`, scale: 1 });
		mat.transparencyMode = mode; // 3 adds light, 2 blends over
		mat.backFaceCulling = false;
		mat.disableDepthWrite = true;
		mats[name] = mat;
	}
	// The rocket and what it leaves behind (`src/rocket.js`).
	//
	// Smoke is painted, not simulated: a column of a few dozen billboards, each one a lumpy puff on a card that
	// turns to face the sight. It is self-lit because a cloud of hot dust a second after a blast is still glowing
	// on the inside, and it is blended rather than added because smoke hides things — an added cloud in front of
	// a house is a ghost, and a blended one is a wall.
	mats.smoke = pbr(scene, "smoke", { roughness: 1, environmentalIntensity: 0 });
	mats.smoke.disableLighting = true;
	mats.smoke.emissiveColor = new Color3(0.34, 0.3, 0.26);
	mats.smoke.opacityTexture = texture(scene, smokeCanvas(256, { seed: 77 }), { name: "smoke puff", scale: 1 });
	mats.smoke.transparencyMode = 2; // blend
	mats.smoke.backFaceCulling = false;
	mats.smoke.disableDepthWrite = true;
	// The same puff, in the colour it has at the top of the column. A cloud of hot dust is warm and dark at its
	// root and pale and cool where it has thinned out and can see the sky again — and since every card in the
	// column wears one of these two, and the card changes from one to the other as it passes thirteen metres,
	// the head of a mushroom comes out paler than its stem without a single card being moved twice.
	mats.smokeCap = pbr(scene, "smokeCap", { roughness: 1, environmentalIntensity: 0 });
	mats.smokeCap.disableLighting = true;
	mats.smokeCap.emissiveColor = new Color3(0.62, 0.63, 0.66);
	mats.smokeCap.opacityTexture = texture(scene, smokeCanvas(256, { seed: 903, lobes: 21 }), { name: "smoke head", scale: 1 });
	mats.smokeCap.transparencyMode = 2; // blend
	mats.smokeCap.backFaceCulling = false;
	mats.smokeCap.disableDepthWrite = true;
	// The heart of the blast, which is added rather than blended because it is fire and not dust, and whose
	// emissive sits above the bloom's threshold so the one explosion in this garden glows like the lamps do.
	mats.blastFire = pbr(scene, "blastFire", { roughness: 1, environmentalIntensity: 0 });
	mats.blastFire.disableLighting = true;
	mats.blastFire.emissiveColor = new Color3(2.6, 1.35, 0.42);
	mats.blastFire.opacityTexture = texture(scene, smokeCanvas(256, { seed: 191, lobes: 13, rings: 2 }), { name: "blast fire", scale: 1 });
	mats.blastFire.transparencyMode = 3; // add
	mats.blastFire.backFaceCulling = false;
	mats.blastFire.disableDepthWrite = true;
	// The ring that runs out along the ground. Additive, because it is dust catching the light from the fire
	// rather than a thing in itself, and it must be able to pass over a wall without leaving a mark on it.
	mats.shockRing = pbr(scene, "shockRing", { roughness: 1, environmentalIntensity: 0 });
	mats.shockRing.disableLighting = true;
	mats.shockRing.emissiveColor = new Color3(1.15, 1.0, 0.78);
	mats.shockRing.opacityTexture = texture(scene, ringCanvas(256, { thickness: 0.2, softness: 0.7 }), { name: "shock ring", scale: 1 });
	mats.shockRing.transparencyMode = 3; // add
	mats.shockRing.backFaceCulling = false;
	mats.shockRing.disableDepthWrite = true;
	// The scar left on the lawn. This one IS lit, because a scorch is the absence of light rather than a
	// presence: it has to go dark at night along with everything else around it, or the garden has a black
	// sticker on it until the visitor presses R.
	mats.scorch = pbr(scene, "scorch", { roughness: 1, environmentalIntensity: 0.2 });
	mats.scorch.albedoColor = paint([34, 26, 20]);
	mats.scorch.opacityTexture = texture(scene, smokeCanvas(256, { seed: 313, lobes: 12, rings: 2 }), { name: "scorch", scale: 1 });
	mats.scorch.transparencyMode = 2; // blend
	mats.scorch.backFaceCulling = false;
	mats.scorch.disableDepthWrite = true;
	mats.scorch.specularIntensity = 0.1;
	return mats;
}

export { PBRMaterial, Color3, Color4, ImageProcessingConfiguration, Texture };
