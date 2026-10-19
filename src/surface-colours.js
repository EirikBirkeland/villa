// What every surface looks like from a few metres off: the colour its painted pattern reads as,
// and how that pattern is laid out.
//
// The Villa itself paints its patterns on canvases in `textures.js`. This file is what those canvases
// *come out as on screen*, which is close to them but not the same: the material's own colour, its
// roughness, its share of the sky's reflection and the light all sit between the canvas and the
// pixel. Every tint here was read off a browser picture of the Villa - pictures/019-home.png,
// pictures/023-west.png and the rest - with tools/pixels.js, then turned back into light with
// tools/backlight.js. Where a browser picture and this file disagree, this file is wrong.
//
// One exception, and it is marked where it stands: `water`. That tint was set from what a sunlit pool
// should read as, not from a picture, because the browser has been dead in this sandbox for six
// sessions and the old pictures showed a pool that was too dark to keep. Until a picture is taken
// again, treat the pool in a drawn view as a claim and not as evidence.
//
// `tools/draw.js`, which shades a picture of the Villa on the CPU when no browser is about, is the
// only reader of this file. If a pattern is repainted in `textures.js`, change it here too, or the
// drawn picture will quietly disagree with the Villa.
//
// Fields used by the drawing tool:
//   tint   the colour the surface reads as, 0..255, the same way a colour is written on a canvas.
//   scale  how many times the pattern repeats across one face's texture coordinates. Matches the
//          `scale` given to that pattern in materials.js, which is 1 wherever the material knows its
//          own size in metres (`patternMetres`) — there the repeats are already in the mesh's own
//          texture coordinates, which the drawing reads, and multiplying them in twice would lay the
//          pattern out twenty times too small.
//   grid   the pattern's blocks: u and v count across one repeat, with the colour of the gap
//          between them and a tone range for each block. Tiles, planks, roof tiles, bark rings.
//   wash   clouds of colour laid over the tint: `cells` blobs per repeat, `low` to `high` colour,
//          mixed in at `at`. This is the same wash that textures.js paints, in numbers.
//   glow   the light a thing gives out by itself (linear, can be above 1). This is the material's
//          `emissiveColor` in materials.js: the engine adds it to whatever the sun and sky do, so a
//          leaf in shade is still a green leaf. Glow on the water and the lamp glass is used their
//          own way, under `unlit`.
//   alpha  how see-through it is.
//   cut    the pattern has holes cut in it: "frond" or "leaf" shape, so a leaf plane is leaves.
//   double both faces of the plane are the same surface, so light reaches whichever you look at.
//   mow    bands across the pattern, `bands` of them across one repeat, each `at` darker on one
//          side: the lines a mower leaves. Must match `mownBands` in textures.js.
//   bare   soil showing through where a field of `cells` blobs is high, from `from` to `to`, at
//          `at`. Must match `barePatch` in textures.js.
//   broad  the surface carries colour that is not in its pattern at all but in the ground it lies on:
//          for the lawn, the big patches of lush and dry grass in src/lawn.js; for the paving, the dust
//          and the band of damp along the coping in src/paving.js. Both are asked in metres of ground
//          and named here. Anything reading this file must multiply it in or the garden and the deck
//          come out flatter than the Villa's is.
//   vertex the colour that is not in the pattern is written at the corners of the mesh itself, and the
//          drawing reads it off the mesh (`skinTint` and `tintFromGround` in src/mesh.js) instead of
//          re-asking a field. Read one mesh a surface at a time: a surface with BOTH `broad` and
//          `vertex` would have its tone multiplied in twice, once from the field and once from the mesh.

export const SURFACES = {
	// ---- ground and paving -------------------------------------------------
	lawn: {
		// Followed the material down in red and up in blue when the sward's lift came off the acid
		// (`matte` in src/materials.js has the ladder): the browser's lawn on this camera went (121,155,31)
		// to (105,153,42) and the drawing, left alone, stayed at (68,108,43) — a yellower green than the
		// garden it is supposed to stand for. The drawing runs 30-40 points dark on sunlit ground whatever
		// it is given (fault 4), so what was matched here is the HUE and not the lightness.
		tint: [104, 98, 54],
		scale: 1,
		// Not a pattern: the garden's own broad patches, asked in metres of ground in src/lawn.js and
		// carried into the browser at the lawn's corners. Read here so the drawing cannot flatten them.
		broad: "lawn",
		mow: { bands: 6, at: 0.16 },
		// Two kinds of sward side by side at half a metre, not a gradient between them: the same
		// clumps src/textures.js paints with `mixByField`.
		mix: { cells: 9, seed: 97, low: [46, 88, 54], high: [150, 158, 88], at: 0.34 },
		wash: [
			{ cells: 4, seed: 11, low: [44, 86, 46], high: [102, 154, 80], at: 0.55 },
			{ cells: 26, seed: 23, low: [56, 94, 46], high: [136, 160, 78], at: 0.24 },
		],
		bare: { cells: 5, seed: 71, from: 0.6, to: 0.8, colour: [122, 90, 60], at: 0.86 },
		// The sward's own streaks, laid last over all of it. The browser paints two things here: `swardCrowd`,
		// a hundred and seventy thousand walked blades, and `swardGrain`, the flock of tips between them.
		// The drawing has no way to walk a blade, so it pays for the SPREAD the two of them leave — measured
		// against `tools/canvasstats.js grassCanvas 1024`, which says the tile runs to (14,16,8) of spread
		// and keeps (8,9,4) of it across an eight-texel block. `cells` is one texel of the painted tile — the
		// tile is 1024 across and one tile is six metres of ground.
		grain: [
			{ cells: 1024, length: 4, shear: 1.2, second: 2, at: 0.5 },
			{ cells: 1024, length: 9, shear: 0.55, second: 3, at: 0.26 },
		],
	},
	paver: {
		tint: [176, 161, 134],
		scale: 1,
		// Not a pattern either: the deck's own broad patches of dust and damp, asked in metres of ground
		// in src/paving.js and carried into the browser at the deck's corners. Read here so the drawing
		// cannot flatten the paving the way it used to.
		broad: "paver",
		// The browser paints courses of unequal slabs with staggered joints (see `paverCanvas`); this has one
		// grid to draw and it is a square one. What it does keep is the MODULE — eight to the repeat, so a
		// slab is 39 cm of ground — the 10 mm joint, and the spread between the palest and darkest stone,
		// which is what the deck reads as from ten metres off. Read the drawn deck as tidier than the
		// browser's is, and never let it settle a question about the coursing.
		grid: { u: 8, v: 8, gap: 0.026, grout: [140, 128, 105], low: [145, 131, 107], high: [206, 188, 156], seed: 17 },
		wash: [
			{ cells: 8, seed: 71, low: [152, 140, 118], high: [192, 175, 146], at: 0.3 },
			{ cells: 120, seed: 97, low: [150, 138, 116], high: [196, 179, 150], at: 0.3 },
		],
	},
	coping: {
		tint: [202, 191, 171],
		scale: 1,
		// One stone to a repeat with its joint, then the weather, then the sand grain: must match
		// `copingCanvas` in textures.js, which is painted at half a metre of stone to a repeat.
		grid: { u: 1, v: 1, gap: 0.022, grout: [125, 116, 102], low: [182, 172, 152], high: [222, 212, 190], seed: 217 },
		wash: [
			{ cells: 5, seed: 223, low: [158, 148, 130], high: [234, 226, 208], at: 0.26 },
			{ cells: 72, seed: 211, low: [166, 154, 134], high: [228, 220, 202], at: 0.42 },
		],
	},

	// The damp foot of the same capstone: `mats.copingWet` is the coping's own bytes times (0.66,0.68,0.78),
	// so every colour below is the coping's above multiplied through by that. Painted dry here, the drawing
	// would show a bright ring round the pool where the browser shows a damp one.
	copingWet: {
		tint: [133, 130, 133],
		scale: 1,
		grid: { u: 1, v: 1, gap: 0.022, grout: [82, 79, 80], low: [120, 117, 119], high: [147, 144, 148], seed: 217 },
		wash: [
			{ cells: 5, seed: 223, low: [104, 101, 102], high: [154, 154, 162], at: 0.26 },
			{ cells: 72, seed: 211, low: [110, 105, 105], high: [150, 150, 158], at: 0.42 },
		],
	},

	// ---- the pool inside ---------------------------------------------------
	// Mirrored byte for byte off `poolTileCanvas` in `src/textures.js`: pale glass mosaic, not the dark
	// teal it used to be. The pit is seen THROUGH the water now, so this is the pool's body colour.
	//
	// The joint is a dull grey-green and not the near-white it used to be, and in the browser every course
	// also has a width of its own and rides a slow light-and-shade field; this stand-in keeps one joint of
	// one width and one tone, because `tools/draw.js` has no patch field to lay on a grid. Read the drawn
	// pool as a touch more even than the browser's is.
	poolTile: {
		tint: [98, 173, 187],
		scale: 1,
		grid: { u: 12, v: 12, gap: 0.05, grout: [172, 190, 186], low: [76, 150, 168], high: [120, 196, 206], seed: 29 },
	},
	// The strip of tile the water stands against: `mats.poolWet` is the same mosaic times
	// (0.62,0.70,0.72), and these bytes are that product, so the band is darker here than the wall behind it
	// and no more striped.
	poolWet: {
		tint: [61, 121, 135],
		scale: 1,
		grid: { u: 12, v: 12, gap: 0.05, grout: [107, 133, 134], low: [47, 105, 121], high: [74, 137, 148], seed: 29 },
	},
	// The net now lies on the pool FLOOR, one metre and a half under the surface, at a metre and a quarter
	// to a repeat, and each sheet's strength is the mesh's own visibility (0.55 and 0.3) and not the
	// material's alpha. The net itself is a honeycomb of scattered points (`cellNetField` in
	// `src/textures.js`) at seven and eleven cells to that repeat — eighteen cm and eleven cm cells — and
	// the glow here is the mean of what the browser paints on the floor through the water.
	caustics: { pattern: "caustics", scale: 1, alpha: 0.55, glow: [0.68, 0.96, 1], blend: "over" },
	// The same net on the four WALLS of the pit, for the first 80 cm under the surface, on its own seed and
	// at its own pace (see `src/materials.js`, `causticsWall`). The stand-in is the same net at the walls'
	// own strength, 0.45; the browser's net is drawn from a different canvas, so the two never rhyme.
	causticsWall: { pattern: "caustics", scale: 1, alpha: 0.45, glow: [0.68, 0.96, 1], blend: "over" },

	// ---- water -------------------------------------------------------------
	water: {
		// This stand-in is a flat sheet and it knows it: the CPU drawing has no refraction, no reflection
		// cube and no angle in its alpha, so it cannot do what the browser now does — see through the
		// surface straight down and mirror the house across it at a graze (src/water.js).
		//
		// So this is the mean of what a browser paints, and nothing more. Measured on the seventy-second
		// session over the rectangle 200,470 to 1180,650 of the start view — the whole pool and a little of
		// its coping — the browser paints (104,152,154) L142, and these bytes of this drawing, blended at
		// their own `alpha` over the bright pit floor this drawing paints under the sheet, put the same
		// rectangle at (127,186,176) L173. Read it for where the pool is and how big, never for its colour,
		// which is now the least of the three things the browser is doing there.
		//
		// The bytes were NOT moved when the water's mirror was paid by hand, and that is the thing worth
		// knowing here. The browser's water came up sixteen points in that rectangle — L126 to L142 — so this
		// stand-in, which had been forty-seven points over the browser there, is thirty-one over: the browser
		// came up towards the drawing by itself, and moving these bytes would have widened a gap instead of
		// shutting it. The rest of the gap is the pit floor this drawing paints under a half-transparent
		// sheet, which is its own story and not this one.
		tint: [62, 122, 128],
		pattern: "water",
		scale: 3,
		alpha: 0.48,
		glow: [0.5, 0.6, 0.5],
		blend: "water",
		unlit: true,
	},

	// ---- walls, wood, roof -------------------------------------------------
	plaster: {
		tint: [204, 182, 152],
		scale: 1,
		wash: [
			{ cells: 6, seed: 41, low: [170, 148, 122], high: [226, 204, 174], at: 0.5 },
			{ cells: 96, seed: 43, low: [178, 156, 126], high: [220, 198, 168], at: 0.3 },
		],
	},
	// The cement of the base course — the plinth the house stands on and the service block at the back.
	// Kept byte for byte with `plasterCanvas(512, [150,144,126], 1.35)` in `materials.js`, which is a grey
	// cement, cooler than the lime wall above it. It used to be [86,74,62] and came out of Chromium
	// 3 times darker than the wall next to it, which is written up in `materials.js` and in NOTES.md.
	plasterDark: {
		tint: [150, 144, 126],
		scale: 1,
		wash: [
			{ cells: 6, seed: 41, low: [104, 98, 86], high: [180, 171, 145], at: 0.5 },
			{ cells: 96, seed: 43, low: [115, 109, 91], high: [172, 166, 148], at: 0.3 },
		],
	},
	// The plaster inside the house. The material in `materials.js` is a warm lime wash, [216,194,164], and
	// the room it papers is lit by four lamps and by no sky at all — see `shutOutSkyFill` in `world.js`,
	// which the drawing has no answer for: it would light this plaster with the whole sky through the
	// roof. So the bytes here carry the plaster AND the room's lamps together, and they are set by
	// measurement and not by taste: with the eye put inside the room ("--view 0,1.6,-4.6,3.1416,0.05") a
	// browser puts the whole frame at (119,80,39) — the wall under the lamp (147,104,52), the low wall
	// (123,87,41), the ceiling (88,64,33) — and this prints its plaster at (125,89,45). Both were moved
	// together when the room went from a grey board to a lime wash: the browser's wall under the lamp went
	// (117,96,65) -> (147,104,52) and these bytes went with it, red up a little, blue down by a fifth.
	interiorPlaster: {
		tint: [195, 151, 87],
		scale: 1,
		wash: [
			{ cells: 6, seed: 61, low: [164, 126, 72], high: [229, 178, 103], at: 0.5 },
			{ cells: 96, seed: 63, low: [171, 132, 76], high: [221, 170, 99], at: 0.3 },
		],
	},
	teak: {
		// The back door, and the wood of every upright in the house: `teakWoods.structure` in
		// src/textures.js, byte for byte. The plank tone there is the base times 0.86 to 1.16, so `low` and
		// `high` are that band and `grout` is its seam. `u: 6, v: 1` and not the other way round because
		// those boards stand up — the browser paints the pattern turned a quarter of a way round and
		// `patternUp` puts the height on the pattern's other axis, so the joints run up the face and the
		// tone changes from one board to the next along `u`.
		//
		// An older note here said the sunlit terrace floor reads (158,106,69) and that this line gave
		// (53,37,38) until the gap was cut and the green and blue raised eighteen and thirteen per cent.
		// That read stands under `teakFloor`, which is the floor it was taken from; it does not hold for
		// this wood, and these bytes are now copied out of the canvas and not fitted to a picture.
		tint: [118, 92, 72],
		scale: 1,
		grid: { u: 6, v: 1, gap: 0.012, grout: [29, 23, 21], low: [102, 79, 62], high: [137, 107, 84], seed: 67 },
		wash: [{ cells: 64, seed: 71, low: [52, 40, 31], high: [156, 136, 114], at: 0.2 }],
	},
	teakFloor: {
		// The deck wood: `teakWoods.deck` in src/textures.js, byte for byte, with src/teak.js multiplying
		// the weather and each floor's own colour over it (`broad` below).
		tint: [150, 128, 76],
		// These boards are laid in metres and not across the face of a box, so the pattern tiles once:
		// grain every 5.4 m, a band of six boards every 1.8 m (see mats.teakFloor in materials.js).
		scale: 1,
		grid: { u: 1, v: 6, gap: 0.012, grout: [42, 32, 22], low: [129, 110, 65], high: [174, 148, 88], seed: 67 },
		wash: [{ cells: 64, seed: 71, low: [62, 52, 36], high: [198, 172, 112], at: 0.2 }],
		// What the weather does to the two floors this pattern is laid on: src/teak.js. A surface that
		// carries it must have it multiplied in, or the drawn floor is flatter than the Villa's.
		broad: "teak",
	},
	teakWall: {
		tint: [118, 92, 72],
		scale: 1,
		// Nine boards to a repeat, and standing up: see `teak` above and `mats.teakWall` in materials.js.
		grid: { u: 9, v: 1, gap: 0.012, grout: [29, 23, 21], low: [102, 79, 62], high: [137, 107, 84], seed: 67 },
		wash: [{ cells: 64, seed: 71, low: [52, 40, 31], high: [156, 136, 114], at: 0.2 }],
	},
	// The ceiling beams: one long timber across the room, two boards to a 3.2 m repeat and their grain
	// running along the beam — see `mats.beam` in `src/materials.js`, and the sixty-ninth session's item 3
	// for the shingles this took off the front of the house. The bands lie along the beam here, which is the
	// only thing the stand-in can be told; the browser paints the grain and the drawing lays a wash.
	beam: {
		tint: [118, 92, 72],
		scale: 1,
		grid: { u: 1, v: 2, gap: 0.012, grout: [29, 23, 21], low: [102, 79, 62], high: [137, 107, 84], seed: 67 },
		wash: [{ cells: 64, seed: 71, low: [52, 40, 31], high: [156, 136, 114], at: 0.2 }],
	},
	// The terrace soffit: the same structure teak, but boarded ALONG the house — nine boards to a 1.8 m
	// repeat lying across the soffit's depth, each running the whole width of the house. See `mats.soffit`
	// in `src/materials.js`. `v: 9` is what turns the boards the right way round against `teakWall` above.
	soffit: {
		tint: [118, 92, 72],
		scale: 1,
		grid: { u: 1, v: 9, gap: 0.012, grout: [29, 23, 21], low: [102, 79, 62], high: [137, 107, 84], seed: 67 },
		wash: [{ cells: 64, seed: 71, low: [52, 40, 31], high: [156, 136, 114], at: 0.2 }],
	},
	roof: {
		tint: [150, 74, 48],
		scale: 5,
		grid: {
			u: 12,
			v: 8,
			gap: 0.03,
			grout: [107, 42, 28],
			low: [123, 61, 41],
			high: [181, 90, 59],
			seed: 97,
			round: true,
			rowShade: 0.36,
		},
		wash: [{ cells: 10, seed: 103, low: [92, 42, 30], high: [172, 108, 74], at: 0.18 }],
	},
	palmBark: {
		// Mirrors the repainted bark: a grey-tan trunk, thin bowed scars 4.5-14 cm apart, broad weather
		// and a moss crust (`palmBarkCanvas` in src/textures.js has the reason). `tint` is the new canvas's
		// own mean out of `tools/canvasstats.js` — 145,135,112. On the screen, measured over the bark that
		// covers the `westlawn` camera with `tools/tint.js --show palmBark`, the browser paints it
		// (94,83,55) L83 and the CPU drawing of the very same camera gives it (115,95,67) L92: nine points
		// LIGHT, which is the drawing's known way with a shaded face (fault 4 in NOTES.md) and not a wrong
		// tint here.
		tint: [145, 135, 112],
		scale: 1,
		grid: { u: 1, v: 5, gap: 0.05, grout: [74, 66, 54], low: [108, 98, 81], high: [168, 155, 130], seed: 111 },
		wash: [
			{ cells: 3, seed: 113, low: [92, 78, 60], high: [196, 182, 156], at: 0.6 },
			{ cells: 6, seed: 121, low: [96, 108, 78], high: [196, 196, 168], at: 0.16 },
		],
	},

	// A banana's pseudostem (`stalkCanvas` in textures.js): sheafs laid one beside the next up the stem,
	// so the grid runs the other way round to the palm's — fourteen columns to a repeat and no rows.
	stalk: {
		// A banana's pseudostem, repainted in the sixty-fourth session. The canvas's own mean, lifted a
		// third: the browser puts a sunlit stem a metre off at (111,155,59) and the drawing, at the
		// canvas's own bytes, gave (48,71,47) on the same camera — a gap wider than the drawing's usual
		// shortfall, because a stem is a thin round thing and `shade()` lights it flatter than a cylinder
		// with a sunward face is lit. These numbers land the drawing at (69,101,65): still short of the
		// browser by the drawing's standing bias on a lit face, and read as such.
		tint: [98, 144, 92],
		scale: 1,
		grid: { u: 11, v: 1, gap: 0.05, grout: [46, 44, 32], low: [108, 162, 104], high: [156, 232, 148], seed: 211 },
		wash: [{ cells: 7, seed: 217, low: [84, 128, 88], high: [172, 216, 144], at: 0.2 }],
	},

	// The skin of a shrub (`bushCanvas` in textures.js): small leaves laid over one another, 44 cm of
	// bush to a repeat. No grid — the leaves are scattered, not laid in rows.
	//
	// Two numbers, both measured. The browser paints a sunlit bush at (86,117,25) on the start view, and
	// the hedge beside it at (134,182,51) — a bush is a darker green than a hedge, because a hedge shows
	// its young outer leaf to the sky and a bush shows its shaded interior between the leaves. The tint is
	// the fourth part of the sunlit byte, which is the ratio the hedge's line keeps. The glow is what the
	// material's emissive adds once its own pattern is multiplied in, measured by `tools/sheets.js`: the
	// colour is (0.02,0.035,0.012) and the leaf pattern carries about a seventh of light.
	//
	// **And all three bush lines went up when the shrub was rebuilt**, but by less than the material did and
	// nearly all in the green. The browser's lift was red 1.4, green 1.95, blue 1.35 (`bush` in
	// src/materials.js has the measure) and the drawing took red 1.05, green 1.46, blue 1.0: the hue was
	// followed and the lightness was not, because `shade()` has no self-shadowing to work out that a bush is
	// a foot of leaves deep — weighed on the same shrub two metres off, the browser puts it six points of
	// light UNDER the lawn it stands on and a drawing given the material's whole lift put it forty-eight
	// ABOVE its own lawn.
	//
	// And all three moved again the day the shell's mirror was switched off, by the same fractions the
	// browser moved: the shell fell (70,114,20) to (42,84,11) — three quarters of its light, which is what
	// `specularIntensity` 0.25 was worth on a smooth lump — and the cards went the other way, (47,82,13) to
	// (51,95,15), because they were paid back for losing a mirror they never had. The heart, paid back at
	// nothing, is now worth three fifths of what it was. See `bush` in src/materials.js for the whole
	// argument, and `tools/bushface.json` for the ladder that measured it.
	bush: {
		tint: [26, 50, 12],
		scale: 1,
		vertex: true,
		glow: [0.001, 0.005, 0.0],
		wash: [{ cells: 5, seed: 323, low: [20, 41, 12], high: [49, 92, 28], at: 0.34 }],
	},

	// The shell of leaves over that heart (`bushEdgeCanvas` in textures.js, `makeLeafyMass` in
	// garden.js): the same leaf at the same four and a half decimetres, with the air between the leaves
	// cut clean out, so a bush has a ragged edge instead of the outline of a ball. A shade brighter than
	// the heart it dresses, because the outside leaf is the one that sees the sky and the heart is the
	// dark behind the gaps.
	bushEdge: {
		tint: [41, 72, 19],
		scale: 1,
		vertex: true,
		cut: "scatter",
		double: true,
		glow: [0.001, 0.005, 0.0],
		wash: [{ cells: 5, seed: 455, low: [28, 54, 18], high: [67, 111, 40], at: 0.34 }],
	},

	// The leaf cards standing out of that shell (`bushClusterCanvas` in textures.js, `bushLeafage` in
	// garden.js). One spray of 1.5 to 2.8 cm leaf to a card, cut out of an atlas of thirty-six, so this is
	// a sheet like the hedge's crest and is read the same way: both faces, lit from the side it is seen
	// from, and a `glow` that is what the material's emissive is worth over its own leaf and not the
	// emissive itself — measured at (0.006,0.024,0.001) by `tools/sheets.js`, and moved with the emissive
	// the day the leaf was trimmed and its blue paid back: the material's emissive is
	// (0.1,0.2,0.075) now and not (0.09,0.27,0.048). A card has no inside, so this is the biggest of the
	// Villa's sheet-lights after the fronds: without it the cards turned away from the low sun kept only
	// the warm bounce and came out maroon. Measured again after the crowns were sheared: the live page adds
	// (0.011,0.040,0.003), which is two thirds more green than the number this file carried, because the
	// sheared plant's leaf cards carry less of their own colour at the mean than the buns they replaced.
	//
	// Trimmed with the atlas, and by the same fraction: the browser put this material's mean on the west
	// lawn view at (50,96,11) on the old atlas and (38,70,8) on the new one, and this drawing sat at
	// (78,150,31) over the first — it is a sheet, and a sheet is lit from the side it is seen from, so it
	// runs over the browser by design (see the note above the leaves below). The green is down 17% and the
	// red 15% here, which is what keeps the same gap over the new browser picture.
	bushLeaf: {
		tint: [46, 83, 26],
		scale: 1,
		vertex: true,
		cut: "scatter",
		double: true,
		glow: [0.011, 0.04, 0.003],
		wash: [{ cells: 5, seed: 517, low: [43, 82, 28], high: [117, 213, 72], at: 0.34 }],
	},

	// ---- leaves: planes with the pattern cut out ---------------------------
	//
	// All three of these are sheets: both faces drawn, and a face lit from the side it is seen from, which
	// is what `sheet()` in `materials.js` does and `tools/sheets.js` checks. Read a drawn crown as brighter
	// than a photographed one: on the south-border view, looking into the sun, Chromium puts the palm
	// crown at (42,103,35) and this drawing puts it at (79,119,58). A crown is dark in a real picture
	// because its own leaves shade one another and hide the sky, and `shade()` has no self-shadowing to
	// work that out with — the same shortfall the tuft tint below folds in by hand.
	//
	// The `glow` on a sheet is NOT the material's `emissiveColor`, which is what it used to be. The engine
	// multiplies that colour by the emissive pattern, and the pattern is dark over the part of itself that
	// is leaf — a frond's own canvas carries 0.06 of red, 0.20 of green and 0.03 of blue there, because
	// most of a leaf is not a vein — so the emissive adds less than the colour says. The drawing has no
	// pattern to multiply by and adds a flat number where the leaf is, so the number here is that added
	// light, measured off the live page. `tools/sheets.js` measures it again and fails if the two drift
	// more than about 1.5 times apart. Copying the material's (0.3,0.55,0.2) in here was tried first and
	// painted these fronds at (169,225,138) where Chromium paints them at (42,103,35).
	palmLeaf: {
		// A coconut palm's leaf: `palmBladeCanvas` for the pattern and `palmCrown` in `src/garden.js` for
		// the shape — which is the point of this entry. There is nothing left to cut: a crown is no longer a
		// flat card with a feather painted on it but a hundred-odd cards of mesh standing off a stalk in a
		// V, so the ragged edge it shows against the sky is the outline of the leaflets themselves.
		tint: [72, 122, 54],
		scale: 1,
		double: true,
		glow: [0.020, 0.105, 0.005],
		wash: [{ cells: 44, seed: 157, low: [32, 62, 24], high: [116, 174, 76], at: 0.26 }],
	},
	bananaLeaf: {
		// A banana's blade: `bananaBladeCanvas` for the pattern and `bananaCrown` in `src/garden.js` for
		// the shape — a rib that arcs, and a blade in three bands out from it, with the wind's tears cut out
		// of the geometry and not out of the paint. Nothing to cut here, for the same reason the palm's leaf
		// has none: what a visitor sees against the sky is the outline of the leaf itself.
		// Not what a leaf looks like, and that is deliberate — `tuft` below does the same thing for the same
		// reason, and `palmLeaf` above is a worse case of it. A browser two metres off puts these blades at
		// (52,108,26): dark green, the ribs the lightest thing on them. The drawing has no self-shadowing,
		// so a face turned at the sky gets the whole sun and a leaf mass is painted too bright: off a tint
		// of (52,108,26) it came out at (69,144,33) on that camera. This tint, read off the same pair, brings
		// the drawn frame to (57,122,31) — still five points of red and fourteen of green over, and what is
		// left of that is the shading a leaf throws on the leaf behind it, which `shade()` cannot work out.
		tint: [30, 60, 16],
		scale: 1,
		double: true,
		// What the material's emissive is worth over its own leaf — (0.019,0.092,0.005), read off a live
		// page by `tools/sheets.js` and not copied from `materials.js`: the engine multiplies the emissive
		// by the pattern, and this pattern is a dark green blade and not white.
		glow: [0.019, 0.092, 0.005],
		wash: [{ cells: 40, seed: 167, low: [30, 62, 24], high: [116, 172, 72], at: 0.28 }],
	},
	bud: {
		// The banana's flower, hanging under the crown. Flat colour, no pattern: a maroon bract, and the
		// bytes are the material's own now that they are read through `paint` and not as raw light.
		tint: [86, 34, 46],
		scale: 1,
	},
	tuft: {
		// The grass that stands up out of the lawn, cut on four crossed sheets per clump (five on an old
		// wide one): see `tuftAtlasCanvas` in textures.js and `makeTufts` in garden.js.
		//
		// The tint here is NOT the canvas's own bytes, and it is not meant to be read as them. The tile's
		// leaves run from (50,106,36) at their foot to (104,182,62) at their tips; these numbers were
		// fitted until the drawing painted a clump the colour Chromium does, because a clump has no
		// self-shadowing in `shade()` — every one of its thousand leaves is lit as though it stood
		// alone, and the flat `glow` below carries what the leaves would have taken off one another. On
		// the `grass` camera at five metres, where the browser paints the clumps (1.7% of the frame) at
		// 80,112,22 over a lawn at 103,130,38, the drawing gives 82,123,30: two points of red out, eleven
		// of green and eight of blue, all of which is the flat light a card gets in `shade()` and none of
		// it in the tint. The same camera under `tools/draw.js` is the way to check it; it prints both
		// means. The blue of the tint is nearly gone and much of the green is too, which is
		// the honest shape of a fit like this: the drawing's own light is too flat to be taken out of the
		// pattern, so the pattern has to be made to carry less.
		tint: [73, 45, 8],
		scale: 1,
		cut: "tuft",
		double: true,
		// measured added light, like the three above: the material's (0.21,0.36,0.13) over a pattern whose
		// leaves carry (0.090,0.300,0.031) of their own — a clump's blades are bare and pale, so they carry
		// more of it than a veined frond does. Measured again after the clump was repainted with fewer,
		// fatter, bending leaves: the deeper green of the new tile leaves less for the emissive to multiply,
		// so what the material adds came down to (0.019,0.108,0.004). `tools/sheets.js` measures this and
		// fails if the two drift.
		glow: [0.019, 0.108, 0.004],
		wash: [{ cells: 26, seed: 331, low: [66, 56, 42], high: [130, 104, 72], at: 0.45 }],
	},
	hedge: {
		tint: [69, 106, 46],
		scale: 1,
		// Written at the corners of every segment now: a tone that wanders along the run and darkens
		// towards the foot (`hedgeSkin` in src/world.js). Without this line the drawing throws the
		// corners away and paints the hedge in one tone again.
		vertex: true,
		// Not the material's `emissiveColor` (0.05,0.075,0.03) but what that colour leaves once the leaf
		// canvas has taken its share out of it — which is what `tools/sheets.js` measures and complains
		// about for seven sessions. Written here now, so the drawing and the material agree.
		glow: [0.004, 0.012, 0.001],
		// The washes copy `hedgeCanvas` scale for scale now: four clumps to a repeat, then the leaf, and
		// the weather a metre and a half across. The sixty-four-cell speckle that used to be here is gone,
		// because the canvas it was copied from is gone — see `hedgeCanvas` for why a knit is not a hedge.
		wash: [
			{ cells: 4, seed: 251, low: [34, 66, 28], high: [116, 152, 66], at: 0.55 },
			{ cells: 22, seed: 259, low: [36, 58, 24], high: [104, 142, 56], at: 0.4 },
			{ cells: 2, seed: 268, low: [36, 56, 25], high: [98, 130, 60], at: 0.2 },
		],
	},
	// The fringe of leaf cards along the hedge's crest: the bushes' own leaf, cut to rags and stood on
	// the top line so the hedge does not end against the sky with a ruler edge. Lit from the sky and not
	// from the face — `hedgeCrest` in src/world.js has the two numbers that proved it — so it is a shade
	// the brightest green on the hedge.
	hedgeCrest: {
		tint: [56, 82, 28],
		scale: 1,
		vertex: true,
		cut: "scatter",
		double: true,
		glow: [0.004, 0.015, 0.001],
		wash: [{ cells: 5, seed: 455, low: [34, 52, 22], high: [84, 112, 50], at: 0.34 }],
	},

	// ---- glass, metal, cloth, odds and ends --------------------------------
	// Window glass. The drawing has no transmission: what it paints behind the pane is the room, and
	// the room is there honestly now (`interiorPlaster`, above), so this entry is only the glass itself.
	// `alpha` here is how much of the pane is the glass's own paint, and it is NOT the material's 0.36:
	// the browser's pane is a mix of the room and its own reflection taken at an angle, and a flat CPU
	// drawing that showed 64% of its own room would come out too bright, because its room is the lit
	// middle of the room while the pane mostly shows its dark corners. Both numbers below are set by
	// weighing the drawn pane against the browser's on the same camera (`tools/cover.js` with
	// "?fov=0.45" on the colonnade camera): the browser paints the glass at (85,81,66) over 205 points
	// and the drawing now paints it at (99,95,74), where it used to paint a cool grey sheet
	// (115,117,103) when the pane was being lit like a pale matte wall. On the start view the browser
	// says (101,91,73) and the drawing says (102,99,78).
	glass: { tint: [104, 146, 143], alpha: 0.66, blend: "glass", glossy: 0.07, glow: [0.012, 0.009, 0.005] },
	darkMetal: { tint: [46, 44, 42], glossy: 0.42, metal: true },
	brass: { tint: [186, 146, 76], glossy: 0.3, metal: true },
	cloth: {
		tint: [226, 216, 196],
		scale: 1,
		wash: [{ cells: 64, seed: 191, low: [186, 176, 152], high: [246, 236, 214], at: 0.3 }],
	},
	clothStripe: {
		tint: [120, 96, 70],
		scale: 1,
		wash: [{ cells: 64, seed: 191, low: [80, 62, 44], high: [160, 130, 96], at: 0.3 }],
	},
	// The towel folded on a sunbed: pale cotton with two terracotta bands at each end (`clothCanvas` with a
	// `stripe`). This drawing paints no bands — a stripe forty centimetres along a towel is not a thing a
	// standing view resolves anyway — so the tint is the mixed average of cotton and band, and the drift is
	// the weave.
	towel: {
		tint: [204, 184, 162],
		scale: 1,
		wash: [{ cells: 48, seed: 191, low: [172, 156, 138], high: [232, 222, 202], at: 0.3 }],
	},
	// A sunbed's pad: canvas quilted into panels of 62 cm (`cushionCanvas` in textures.js). The drawing
	// paints no stitch — it has no seam to catch the light and a painted hairline would not survive being
	// sampled at a distance — but it must paint the drifts, or a cushion is a flat white slab there too.
	cushion: {
		tint: [196, 183, 158],
		scale: 1,
		wash: [
			{ cells: 4, seed: 401, low: [170, 161, 142], high: [220, 203, 172], at: 0.5 },
			{ cells: 22, seed: 407, low: [182, 171, 148], high: [210, 195, 168], at: 0.28 },
		],
	},
	// The rug on the room's floor: a rust silk with a pale gold weft, one repeat to 1.2 m of rug
	// (`rugCanvas` in textures.js). Like `interiorPlaster` above, the bytes here have to carry the
	// room's lamps as well as the weave, because this drawing has no lamp indoors and would otherwise
	// light the rug with the whole sky it cannot see. Set by putting the eye inside the room
	// (`--view 0,2.2,-6.2,3.1416,0`) and matching what Chromium paints there.
	rug: {
		tint: [104, 52, 34],
		scale: 1,
		wash: [
			{ cells: 4, seed: 307, low: [70, 31, 17], high: [138, 73, 51], at: 0.45 },
			{ cells: 26, seed: 311, low: [87, 41, 25], high: [121, 63, 43], at: 0.25 },
		],
	},
	soil: {
		tint: [72, 54, 38],
		scale: 1,
		wash: [
			{ cells: 4, seed: 511, low: [38, 27, 18], high: [124, 98, 72], at: 0.65 },
			{ cells: 32, seed: 521, low: [40, 28, 20], high: [132, 112, 88], at: 0.4 },
		],
	},
	// The bare earth under the planting — the same paint as the soil in a pot, a shade redder and
	// laid 0.7 m to a repeat. See `mats.earth` in materials.js. The borders cut out of the court's stone
	// carry a broad tone of their own (damp under the planting, pale where the sun gets at them), which
	// `bedTone` in src/court.js gives to the dirt and to nothing else — so the laterite at the foot of the
	// house, which wears this same paint and no tone, is left alone.
	earth: {
		tint: [112, 82, 56],
		scale: 1,
		broad: "bed",
		wash: [
			{ cells: 4, seed: 511, low: [78, 55, 36], high: [164, 126, 90], at: 0.65 },
			{ cells: 32, seed: 521, low: [52, 36, 25], high: [150, 126, 98], at: 0.4 },
		],
	},
	pot: {
		tint: [176, 118, 78],
		scale: 1,
		// The rings the wheel left, as bands across the pattern; see `terracottaCanvas` in textures.js.
		grid: { u: 1, v: 16, gap: 0.03, grout: [102, 52, 30], low: [146, 94, 58], high: [202, 146, 102], seed: 451 },
		// The mineral crust at the rim and the damp at the foot are one lean wave across the pot's
		// height, which is as near as the drawing gets to the two bands the browser paints.
		mow: { bands: 1, at: 0.4 },
		wash: [
			{ cells: 3, seed: 441, low: [118, 72, 44], high: [218, 164, 118], at: 0.55 },
			{ cells: 48, seed: 471, low: [158, 103, 66], high: [192, 132, 88], at: 0.2 },
		],
	},
	// Garden furniture timber: weathered grey on the exposed faces, dark and oily where the weather
	// does not reach, and a fine grain over both for when you stand over it. See `timberCanvas` — the
	// middle of it moved from [150,104,62] to [135,94,65] when the Villa's woods were split apart, and
	// these three washes are that base with what the canvas adds to it, and takes out of it.
	wood: {
		tint: [135, 94, 65],
		scale: 1,
		wash: [
			{ cells: 3, seed: 401, low: [73, 44, 27], high: [169, 142, 119], at: 0.55 },
			{ cells: 8, seed: 411, low: [105, 72, 51], high: [161, 138, 121], at: 0.4 },
			{ cells: 40, seed: 431, low: [115, 79, 55], high: [153, 108, 73], at: 0.22 },
		],
	},
	cheeseGold: { tint: [226, 178, 84] },
	cheesePale: { tint: [240, 226, 186] },
	cheeseBlue: { tint: [176, 190, 184] },
	fruit: { tint: [196, 66, 44] },
	grape: { tint: [96, 62, 108] },
	hill: { tint: [74, 88, 72], wash: [{ cells: 8, seed: 33, low: [58, 72, 56], high: [96, 108, 90], at: 0.5 }] },
	// The jungle behind the hedge: two ranks of leaf cards, and the notes on each are beside it below.
	// The belt's near rank: leaf cards cut on `canopyClusterCanvas` in textures.js, two metres of crown
	// to a cluster and one cluster to a card, laid on a shell round each crown by `cardRank` in src/world.js.
	//
	// This tint is NOT the material's bytes and not the browser's mean either: it is fitted so the DRAWN
	// mean lands as near the browser's as this drawing can get it — the browser paints the rank at
	// (27,68,7) on the `southborder` camera and the drawing now draws (40,93,30). The gap between these
	// bytes and the material's own is the shade a card throws on the card behind it: a canopy is dark
	// because a metre of leaf is between its outside and its inside, and the drawing has no ambient
	// occlusion and no way to compute that, so the shade is folded in here and nowhere else. It is still
	// twenty-five points of green too light, and that is the drawing's shaded-face bias (fault 4), not
	// these bytes: cutting these bytes by half moved the drawn green by two points, because on this surface
	// the drawing's own sky fill is what sets the brightness. Read it as a calibration of the drawing, not
	// as a colour.
	jungle: {
		tint: [14, 26, 11],
		scale: 1,
		vertex: true,
		cut: "crown",
		double: true,
		// `emissiveColor` times what the leaf canvas carries of its own light, measured off the live page
		// by `tools/sheets.js`: (0.13,0.26,0.12) of emissive, and the leaf carries about a quarter of it.
		glow: [0.013, 0.069, 0.005],
		wash: [
			// The three scales the canvas is painted at, in repeats of it: a branch (0.9 m), a hand (0.3 m),
			// and the leaf itself.
			{ cells: 3, seed: 731, low: [6, 12, 6], high: [40, 58, 28], at: 0.7 },
			{ cells: 7, seed: 742, low: [10, 20, 9], high: [52, 86, 32], at: 0.5 },
			{ cells: 14, seed: 751, low: [16, 30, 11], high: [70, 116, 40], at: 0.35 },
		],
	},
	// The far rank of the belt, 26-52 m out: a curtain of crown and clump on a ring, twelve metres to a
	// repeat, and no cut in it at all since the rank stopped being cards.
	//
	// Re-fitted when the curtain went in, against what the browser paints on the `grass` camera: the curtain
	// reads (30,60,20) over 184 grid points there, and runs 30,27,29 across itself. The old fit — [52,66,52]
	// with a blue-grey wash, made when the rank was cards and half of every pixel was sky showing through a
	// cut — drew (63,93,49) with 7,7,5 of spread: a pale flat wall where the browser shows a dark leafy one,
	// and the blue was fifteen points too high, because haze over a CUT leaf is not haze over a solid one.
	//
	// The washes now copy `farCanopyCanvas` scale for scale. That canvas is laid in metres of wood and this
	// drawing lays its washes in UV repeats, and for a curtain whose UV is twelve metres to a repeat the two
	// come out the same thing: 2 cells is a six-metre crown, 5 a two-and-a-half-metre branch, 14 the leaf
	// clusters and 26 the tips. Fault 44 — the drawing could not show a pattern laid in metres — only closes
	// for this one surface, and only because its UV happens to be measured that way.
	jungleFar: {
		tint: [30, 50, 24],
		scale: 1,
		vertex: true,
		glow: [0.008, 0.037, 0.005],
		wash: [
			{ cells: 2, seed: 947, low: [22, 36, 14], high: [96, 130, 61], at: 0.75 },
			{ cells: 5, seed: 958, low: [19, 30, 11], high: [106, 144, 67], at: 0.4 },
			{ cells: 14, seed: 966, low: [17, 32, 11], high: [96, 152, 56], at: 0.5 },
			{ cells: 26, seed: 971, low: [22, 44, 15], high: [110, 174, 64], at: 0.3 },
		],
	},
	// The tree line on the sky: no leaves at that distance, only a dark blue-green with a soft mottle.
	farTree: {
		tint: [48, 66, 48],
		vertex: true,
		glow: [0.02, 0.032, 0.02],
		wash: [{ cells: 10, seed: 41, low: [40, 56, 42], high: [64, 82, 62], at: 0.5 }],
	},
	stone: {
		tint: [146, 138, 126],
		scale: 1,
		// Granite: fist-sized weathered masses, a grey-green lichen crust over one side of them, and
		// the salt and pepper of quartz and mica. See `rockCanvas` in textures.js.
		wash: [
			{ cells: 3, seed: 481, low: [76, 68, 60], high: [200, 188, 168], at: 0.75 },
			{ cells: 5, seed: 501, low: [82, 84, 66], high: [184, 184, 152], at: 0.42 },
			{ cells: 64, seed: 491, low: [86, 82, 76], high: [200, 196, 186], at: 0.4 },
		],
	},

	// ---- the fittings the Villa lights itself with -------------------------
	// Off, in daylight: ordinary lit surfaces with a small self-glow left in them. See the three
	// materials in `src/materials.js`, which say why.
	lampGlow: { tint: [236, 230, 214], glow: [0.1, 0.08, 0.055] },
	poolLamp: { tint: [176, 206, 212], glow: [0.05, 0.1, 0.11] },
	interiorGlow: { glow: [0.62, 0.39, 0.2], unlit: true },

	// The wires of the string lights have no material of their own in the scene.
	// ---- the small living things -------------------------------------------
	// The wings are painted pale in their canvas and coloured by the material, so the tint here IS the
	// material's colour as a browser shows it. The veins and the dark margin are in the pattern, and the
	// CPU drawing has no shape to cut a wing out with, so in a drawn view a butterfly is a flat quad of
	// this colour and a cockroach is a brown bead: read them as position and not as detail.
	butterflyWing: { tint: [222, 218, 200], glow: [0.3, 0.3, 0.26], double: true },
	butterflyWingBlue: { tint: [70, 150, 235], glow: [0.09, 0.3, 0.6], double: true },
	butterflyWingOrange: { tint: [228, 104, 36], glow: [0.45, 0.16, 0.04], double: true },
	butterflyBody: { tint: [26, 22, 16], glow: [0.02, 0.018, 0.014] },
	cockroachShell: { tint: [66, 40, 22], glow: [0.016, 0.009, 0.004] },
	cockroachShield: { tint: [80, 50, 24], glow: [0.022, 0.013, 0.006] },
	cockroachLeg: { tint: [30, 17, 9] },
	fallback: { tint: [58, 56, 52] },
};

/** The light that the sun and the sky carry, in the same numbers buildLights uses. */
export const SKY_LIGHT = {
	sunAzimuth: 160,
	sunElevation: 24,
	sunDiffuse: [1, 0.71, 0.46],
	skyDiffuse: [0.4, 0.58, 0.88],
	groundDiffuse: [0.42, 0.34, 0.24],
	fog: [0.62, 0.66, 0.68],
	fogDensity: 0.005,
};
