# Jargon

Every invented term used anywhere in this folder is listed here. A term that is not listed may not be used.

One entry per term:

- **term**: what it means in plain words. Where it is used.

No invented terms are used. A few words are not everyday English, or are used here in a specific
sense, so they are set down here:

- **sala**: an open-sided Thai pavilion with a roof, used for sitting in out of the sun. Used in
  `src/villa.js` (the open pavilion at the east end of the pool) and in the notes.
- **coping**: the row of stone or tile that caps the edge of a pool, all the way round. Used in
  `src/pool.js` (`copingNorth`, `copingSouth`, and so on) and in the notes.
- **blocker**: an invisible box whose only job is to stop a walk — nothing to see, something to bump
  into. Made by `blocker()` in `src/mesh.js`, used for furniture, pots, lamps, boulders and palm
  feet, and named in the list `tools/feet.js` prints as `(invisible)`.
- **plinth**: the raised solid base a building stands on. Here it is the terrace: the terrace slab in
  `src/villa.js`, whose long faces are sealed so the deck can only be climbed by its front steps.
- **the court**: the paved ground the pool sits in — the two side decks, the walkway between the terrace
  and the water, and the paving beyond the pool's far end. Laid from the plan in `src/court.js`
  (`pavedGround`, `courtBeds`), built in `src/world.js`, and averaged over by `src/paving.js`.
- **the apron**: the free stone of a deck, outside its planting border and inside the grass — the ground
  a sunbed stands on and a person walks behind it. 4.15 m wide on each side of this pool since the
  court's outer edges came in to x = ±11.9 (`courtEdge` in `src/court.js`).
- **border** (of a garden): a strip of planted ground, narrow and long, cut into or laid against the
  paving. Here the two strips of dirt and shrubs along the pool's long sides: `courtBeds` in
  `src/court.js`, planted in `src/garden.js`.
- **the board, and to shear** (a shrub): the height the shears go across a clipped shrub, and cutting it
  down to that height. `shearTop` in `src/mesh.js` lays the board on one lump of leaf; `SHRUB_CLIP` and the
  `clip` argument in `src/garden.js` say where the board lies for each plant, and `?clip=` in the address
  bar moves it or lays the shears out altogether (`?clip=1` puts every crown back to an uncut dome).
- **plateau** (of a shrub): the flat face left on top where the board lay, as against the dome of a shrub
  that was never cut. `tools/crown.js` follows the top edge of a plant across a picture and prints three
  numbers for it: `drops` and `wanders` in pixels, and `plateau` — the share of columns that sit within
  three pixels of the crown's own middle height.
- **base course**: the lowest plain band of a wall, built or rendered differently from the wall above it
  so the building looks like it has weight at its feet. Ordinary building English. Here it is what
  `mats.plasterDark` is for: the cement on the plinth's faces and on the service block at the back, a grey
  cement under the lime plaster of the walls.
- **stumble**: a place where the free ground next to you is more than 0.42 m higher or lower, so one
  stride would be a jump rather than a step. What the third report of `tools/feet.js` lists.
- **drawn picture / drawn view**: a picture of the Villa made on the CPU by `tools/draw.js`, with no
  browser and no graphics card. Named `pictures/drawn-<view>.png`, and called a *drawing* in the
  notes wherever it matters that no browser saw it.
- **sheet**: a flat piece of geometry with no thickness, drawn on both faces and lit from the face it is
  seen from — a palm frond, a banana leaf, a clump's blade. `sheet()` in `src/materials.js` sets the two
  switches that do it and says why the third, `doubleSided`, does nothing; `tools/sheets.js` reads the
  switches back off a live page.
- **card**: one sheet carrying one copy of a pattern — a leaf cut out of a leaf canvas, a blade, a pane.
  The word is used for the single flat quads that a banana leaf (`src/garden.js`, four hinged cards to a
  leaf) and a clump of standing grass are built from, and for any lone flat quad, so that "leaf" can mean
  the thing and "card" the piece of geometry it is made from.
- **pseudostem**: what looks like the trunk of a banana plant and is not a trunk at all — the rolled
  sheaths of the leaf bases, stacked one inside the next. `bananaStem` in `src/garden.js`, wearing
  `mats.stalk`.
- **the rib, the blade, and a stretch (of a banana leaf)**: a banana leaf built by `bananaCrown` in
  `src/garden.js` has a **rib** — the pale midrib the leaf is hung on, marched along an arc — and a
  **blade**, the green part laid out level across it in five **bands** from the rib out to each margin. A
  **stretch** is the piece of leaf between two of the stations the rib is marched through: it is the
  smallest piece that can be torn, so a slit the wind made is one stretch with its blade missing and the
  rib left. Ordinary words, used in their ordinary senses; written down because the code names them
  (`rows`, `bands`, `cuts`) and a reader would otherwise guess at them.
- **sheaf, and the lip and the seam (of a pseudostem)**: a pseudostem is built of **sheafs** — the rolled
  leaf bases, one beside the next round the stem. `stalkCanvas` in `src/textures.js` paints one sheaf as
  one band of canvas and puts two marks at its edge: the **lip**, the pale waxy edge where it laps under
  the next sheaf, and the **seam**, the dark line where it laps over the one before. The **leaf-scars** are
  the ridges, one every twelve or fifteen centimetres, where an old sheaf ended; they are the only marks on
  a pseudostem that run across the sheafs instead of along them.
- **the rachis, the bud, and a course**: a banana's flower hangs from the crown on a stalk called the
  **rachis**, which comes out leaning over and then gives and hangs down; the flower itself is the **bud**,
  a fist of overlapping scales called bracts. `bananaBud` in `src/garden.js` lays the bud in five
  **courses** — rings laid one over the next, each a little wider than the one below it ends, so the
  silhouette is stepped and shingled like the scales themselves. Botanical words for the parts; `course`
  and `shingle` are ordinary English for rows of work laid over one another, as in a stone wall.
- **tone mapping / tone curve**: the last step before a picture is shown, which squeezes the wide
  range of light the scene holds into the small range a screen can show, so that bright stone fades
  into white instead of clipping to it. The Villa runs its own curve, written in `src/tone.js` and put
  into the library's shader from there; `tools/draw.js` runs the same curve from the same file so the
  two agree. The library's own curve is kept under `?tonemap=khronos` to weigh any change against.
- **knee** (of a tone curve): how bright a light has to be before the curve starts bending it over
  towards white. Below the knee the curve is a straight line and a surface keeps its light; above it,
  the more light there is the less each extra unit is worth on the screen. `knee` in `src/tone.js`.
- **white point** (of a tone curve): what the very brightest light in the world is worth on the screen
  — where the bend runs out. At the library's 1.0 the top of the picture is the ceiling itself, so a
  sun glint and a blown surface are the same byte; lower it and nothing can reach white at all.
  `white` in `src/tone.js`.
- **highlight desaturation**: the white that a tone curve mixes into a colour it had to fold a long
  way, so that a very bright thing goes towards white instead of towards a saturated orange that no
  bright thing ever looks like. `desat` in `src/tone.js`; it is worth measuring, because a curve that
  folds a lot at the library's rate buries the colour the fold was asked for.
- **raw light**: what a surface is worth in the scene before exposure and the tone curve have had a
  say — the number the curve works on. Read off a picture with `tools/rawlight.js`, which loads the
  Villa with no curve at all and turns the bytes back into it.
- **bloom**: the soft spill of light a bright thing throws into what is around it - lamp glass onto
  the dark behind it, sunlit stone onto the roof below it. `bloomWeight` and `bloomThreshold` in
  `src/lighting.js` for the Villa, `--bloom` and `--bloomThreshold` in `tools/draw.js` for the
  drawing.
- **bright pass**: the first step of bloom - a small copy of the picture that keeps only what is
  brighter than the threshold, which is then blurred and added back. Only in `tools/draw.js`.
- **dome floor**: the least light the drawing's sky model gives any upward-facing surface, so that
  nothing open to the sky goes flat black. Only in `tools/draw.js`.
- **backlight** (verb): to work backwards from a colour a browser picture showed to the light that
  must have made it, so a measured pixel can set a number instead of a guess setting it.
  `tools/backlight.js` does it; the calibration in `src/surface-colours.js` came from it.
- **jungle belt**: the ring of trees just outside the boundary hedge, so the garden does not end at a
  hedge top. Built by `buildDistance` in `src/world.js` as the merged meshes `jungleBelt` (the near
  rank, with the `jungle` material) and `jungleHighBelt` (the far rank, with `jungleFar`).
- **rank** (of trees): a line of trees standing side by side, all roughly one kind and one height.
  The jungle belt is two ranks: a near one 4-13 m beyond the hedge and a taller one 26-52 m beyond
  it. Used in `src/world.js` and in the notes.
- **crown**: the head of a tree — the leafy part, not the trunk; and the top of a shrub, the part that sees
  the sky. The near rank of the belt builds each crown
  out of leaf cards (`cardRank` in `src/world.js`); the far rank has no crowns of its own at all — it is one
  curtain, and its pattern carries crowns at six to twelve metres. Crown width is the measure of how big a
  tree looks from the garden: 4.5-8 m in the near rank, 6-11 m in the far one, 9-17 m on the far tree line.
- **cluster and tips** (of the far canopy): the two smallest of the four scales painted into
  `farCanopyCanvas` in `src/textures.js`, the pattern the far rank of the belt wears. A **cluster** is three
  to seven leaf ellipses drawn at once, a fifth of a metre to two-thirds across, and it is drawn and not
  noised because grain has to be drawn for the screen to keep it; **tips** are single specks, two to six to
  a metre, that are nothing at eighty metres and the difference between leaf and paint at twenty-six. Used
  in `src/textures.js`, `src/materials.js` and `src/surface-colours.js`.
- **clump** (of trees): one tree's head and the two to four lesser heads crowded against it, which is how
  the belt is built — a ring point is a clump and not a tree, so the skyline steps about instead of
  drawing one long arc (`clump()` in `src/world.js`). Also the way a wood grows in height: a patch of
  trees of one height, then a gap, then a taller patch, which is what `lump()` wanders along the ring to
  do.
- **haze ladder**: the four steps of green between the garden and the sky — hedge, near rank, far rank,
  far tree line — each one lighter, bluer and flatter in itself than the step in front of it, because that
  is what haze does to a thing: it lifts its darks towards the sky and it takes the blue in. The numbers
  are measured with `tools/cover.js` on one camera and written down in the notes; the materials are
  `hedge`, `jungle`, `jungleFar` and `farTree` in `src/materials.js`.
- **far tree line**: the band of dark treetops on the horizon, 100-150 m out and further at the
  corners, whose colour the haze has already half taken away. The merged mesh `farBelt` in
  `src/world.js`, with the `farTree` material.
- **eave / eaves**: the low edge of a roof, where it hangs out past the wall. `eave` is the height of
  that edge in `src/villa.js`; the roof's south eave stands at z = -2.2, 4.2 m up.
- **fascia**: the plain board nailed along the outer edge of a roof, facing out. `fasciaSouth` and
  its three sisters in `src/villa.js`.
- **soffit**: the underside of whatever sticks out — here the underside of the roof overhang, the
  plane under the eaves in `src/villa.js`.
- **sward**: the grass of a lawn thought of as a surface — how thick it is and how much light it
  carries, as against what colour it is. `sward()` in `src/lawn.js` is the light and dark of it: where
  the grass is thick and where it has been walked thin. `swardGrain` in `src/textures.js` is the same
  mass looked at close: the tips of the blades, half catching the sun and half not. `swardCrowd`, next
  to it in the same file, is the sward as a crowd of separate blades, each one drawn.
- **the mower's stripes**: the bands of light and dark a mower leaves behind it, laid eight metres
  apart across the garden by `mowStripes` in `src/lawn.js`. They are in the ground and not in the
  grass tile on purpose: a stripe narrower than the tile is averaged away by the engine and is no
  stripe at all from fifteen metres off.
- **the mirror** (of the lawn): the share of a sunlit lawn's light that is the sky reflected off the
  grass and not the grass itself — `specularIntensity`, which the files here call `sheen`. Measured on
  the south border camera it is a third of what a visitor is shown, and it is paler and bluer than any
  leaf, which is where the mint comes from.
- **mint** (of a lawn): a lawn painted so light and so green that it looks glazed, the colour of
  toothpaste rather than grass. It is a fault this folder has chased four times: the tell is a green
  sixty or more points above its own red on a sunlit sward ten metres off.
- **tussock**: one little hill of grass — the crown a handful of blades grow out of, ten to twenty
  centimetres across. Used for the tone field that gathers the painted blades into crowds in
  `grassCanvas` (`src/textures.js`), and for the clumps `tuftCanvas` cuts.
- **salt** (thrown): what painters and potters call a scatter of small specks over a surface — the
  grains of salt in glaze, the flecks in granite. In `swardGrain` it is the one random number per texel
  that the blade streaks are averaged out of, and the word is used for it in that sense.
- **laterite**: the red-brown earth that tropical ground is dug out of, baked hard on top by sun and
  rain. The word is ordinary English for that soil; here it is what the beds at the foot of the plinth
  are made of — `mats.earth` in `src/materials.js`, laid by `makeEarthBed()` in `src/garden.js`.
- **lush and parched**: the two ends the lawn's colour is stretched between — deep cool green where the
  water reaches, straw-pale and warm where it does not. Named `lush` and `parched` in `src/lawn.js`,
  which holds their three multipliers and says why the green channel is left nearly alone between them.
- **broad patch**: a patch of colour in the garden bigger than the pattern it sits on: the lawn's lush
  and dry shapes are twenty metres across and its grass tile is six, and the paving's dust drifts are ten
  metres across against a slab pattern of three and a tenth. `src/lawn.js` and `src/paving.js` make them,
  asked in metres of ground; `broad` in `src/surface-colours.js` tells `tools/draw.js` to multiply them in
  too.
- **bend** (of a pattern): nudging a tiled pattern off its grid so it stops landing in the same place
  once a repeat. The third argument of `groundUVs` in `src/mesh.js`, in metres of ground; `lawnBend` in
  `src/lawn.js` says how much, which is what makes the mown bands wander instead of running true for
  sixty metres.
- **vertex colour**: a colour written at every corner of a mesh instead of painted into its pattern,
  which the engine multiplies into whatever pattern that mesh wears. The lawn's broad patches are
  written this way, by `tintFromGround` in `src/mesh.js`.
- **hip roof**: a roof that slopes up on all four sides to a short ridge, instead of on two sides to
  a ridge that runs the whole length. `hipRoof()` in `src/mesh.js`.
- **crest** (of a roof): the low roll of tiles that caps the ridge where two roof slopes meet, standing a
  hand's width proud of the roof. Here it is `ridgeCap` on the house and `salaRidge` on the sala,
  both built by `hipRoof()` in `src/mesh.js` at a steep pitch. Not a new word: the Oxford sense of the
  top line of a roof. It is set down here because the other **crest** in this folder, the hedge's, is a
  different thing entirely — see below.
- **band window**: a window much wider than it is tall, set high in a wall. Here it is the 2.0 x 0.38 m
  hole `storeWindow` in the store room's north wall (`src/villa.js`), cut by `zWallWithOpenings()` in
  `src/mesh.js` and filled with `storeWinSill`, `storeWinHead`, `storeWinJambWest`, `storeWinJambEast`,
  `storeWinMullion` and two panes `storeGlassWest` / `storeGlassEast`.
- **jamb**: either upright side of a window or door opening — the post the leaf or the sash shuts
  against. `storeWinJambWest` / `storeWinJambEast` and `doorJambWest` / `doorJambEast` in `src/villa.js`.
- **head**: this folder's name for the piece over the top of a window opening, which is the same thing as
  a **header** below; both words are in the mesh names (`storeWinHead`, `doorHead`, `frontHead`).
- **shelf lamp**: a lamp that stands on a shelf instead of on a table or a ceiling. `storeShelfLamp` in
  `src/interior.js` is a timber box on the store room's shelf with a lit plate and a point light behind
  the east pane of the band window, so the band reads as a lit room from the lawn behind the house.
- **mullion**: an upright bar between one pane of glass and the next. `mullion0..3` in
  `src/villa.js`, on the front glass, and `storeWinMullion` in the store room's band window.
- **pier** (of a wall): a length of wall between two window openings, or at the end of a wall, full
  height. Used for the pieces `wallWithOpenings` leaves between the holes, and for the teak upright
  (`frontPier`) that fills the gap between the glass front and the east wall.
- **sill / header**: the bottom piece under a window opening and the top piece over it. Built for
  each opening by `wallWithOpenings` in `src/villa.js`.
- **lintel**: the piece laid over the head of an opening to carry the wall above it. Ordinary building
  English; here it is the piece `zWallWithOpenings()` in `src/mesh.js` leaves over the store room's doorway
  (`storeDoor`, head at 2.85 m) in `src/villa.js`.
- **lantern**: a lamp whose light comes out of a small boxed case rather than a shade on a table or a
  bowl on a post — hung from the ceiling on a rod (`storeLamp` and `storeLampRod` in `src/interior.js`, in
  the middle of the store room, so everything in a room 2.5 x 1.7 m stands within arm's reach of it) or
  fixed to a wall beside a door (`backLantern0` and `backLantern1` in `src/villa.js`).
- **reveal** (of a window): the inside surfaces of the hole the window sits in — the four faces you
  see when the glass stands deep in the wall instead of flat on it. Used in the notes and in
  `src/villa.js`.
- **colonnade**: a row of posts standing in a line. The four posts under the front eave in
  `src/villa.js`, and `pictures/drawn-colonnade.png`.
- **staggered** (windows): set so that the openings on one wall do not stand level with the openings
  on the wall behind them, and no sight line runs straight through the house.
- **aerial perspective**: the way distance shows as colour and not only size: far things come out
  paler, bluer and flatter than near ones. Used in the notes; in the Villa it comes from the fog in
  `src/world.js` over the `jungle` and `farTree` materials, each of which is cooler than the layer
  in front of it.
- **shadow lamp**: the sun's shadow generator — Babylon's `ShadowGenerator`, which draws a map of
  everything standing in the sun's way and so decides where a place is in shade. Used in the notes and
  in the tools' stand-ins (`shadows` out of `buildLights` in `src/world.js`, `noShadows` in
  `tools/feet.js`, `tools/draw.js` and `tools/shadows.js`).
- **cast list / casting mesh**: the meshes the shadow lamp is told to draw — the ones that throw a
  shadow. Made by `cast()` in `src/villa.js` and by the `add` helpers in `src/garden.js` and
  `src/props.js`; listed by `tools/shadows.js`, and used by the shadow map in `tools/draw.js` so the
  drawing shades exactly what the Villa shades.
- **standing camera**: one of the fourteen places a picture of the Villa is always taken from, so that
  one session's picture can be set against the next one's. Listed in `tools/cameras.txt`; taken by
  `tools/photos.sh` (a real browser) and drawn by `tools/views.sh` (the CPU drawing).
- **cover** (of a picture): which materials the browser used up painting the frame, and what colour each
  of them came out. `tools/cover.js` reports it, one grid point at a time.
- **mown bands**: the paler and darker stripes a mower leaves, running across the lawn in one direction.
  Painted by `mownBands` in `src/textures.js`, matched in the drawing by `lawn.mow` in
  `src/surface-colours.js`, and laid from where the lawn actually lies by `groundUVs` in `src/mesh.js` so
  the bands do not start again at the join between lawn strips.
- **ground bounce**: light that has already hit the ground and come back up, which is what lights a
  surface standing in the sun's shade but near sunlit paving. The Villa's renderer has it (as the sky's
  own reflection and the hemisphere light's ground colour); `tools/draw.js` has none of it, which is why
  the drawing runs dark on sunlit ground.
- **ridge cap**: the run that caps the top of a roof where two slopes meet — on a Thai hip roof, a line
  of half tiles. `ridgeCap` and `salaRidge` in `src/villa.js`, wearing `mats.roof` with their UVs scaled
  to the slope's own tile pitch.
- **reflection cube** (also the **sky cube**): the six-sided picture of the sky that every shiny surface
  in the scene reflects, made once at the start by `envCube` in `src/main.js`. It is what makes a wet
  pool and a limestone wall read as standing out of doors.
- **sky camera**: the camera that exists only to photograph the sky into the reflection cube, parked at
  the start place and facing straight ahead, so the cube is the same whichever way the visitor happens to
  be looking when the Villa starts. `skyCamera` in `src/main.js`.
- **vignette**: the drawing's darkening towards the edges of the frame, which holds the eye in the middle
  of the picture. `vignetteWeight`, `vignetteStretch` and `vignetteColor` in `src/main.js`, copied in
  `tools/draw.js`.
- **pick** (of a point in the frame): asking the page what is behind one pixel — which mesh and material,
  how far, what colour it came out, and the normal of the face there. `--pick` in `tools/draw.js`,
  `tools/lights.js` and `tools/look.js`, and `picks` in a lighting plan's views.
- **plan** and **case** (of a lighting test): a plan is the JSON file that lists the views to look at and
  the settings to try; a case is one set of those settings. `tools/lights.js --plan <file>`, where each
  case is a url `query` and a `js` line run against the running Villa.
- **tone curve**: the last sum done on each pixel before it is shown, which squeezes the wide range of
  light the scene holds into what a screen can show. The Villa runs on **Khronos PBR Neutral**, the
  library's own curve, which leaves dim light alone and bends only the top over, working on the whole
  colour at once; ACES, which it replaced, fits each channel apart and so washed bright colours pale.
  `toneMappingType` in `src/main.js`, `neutral()` and `aces()` in `tools/draw.js`, `?tonemap=` on the url.
- **shoulder** (of a tone curve): the bend at the top where light stops coming out brighter, and has to
  press harder to get any further. `?shoulder=` in `src/main.js` is a switch that tries to add one by
  pulling the bright end down on its own; it is measured and refused — see the sixteenth session.
- **ceiling** (of a picture): the brightness past which a renderer stops telling one surface from the
  next: L248 and above in this folder's counting. `ceiling` in `tools/stats.js` and `tools/scan_old_new.js`
  says how much of a frame is up there.
- **lit band**: the part of a picture that is at L200 and above — sunlit ground, sunlit wall, lit cloth —
  weighed on its own, because that is where a sunlit Villa either keeps its colour or loses it. Printed as
  `lit <colour> s<spread>` by `tools/stats.js`, and as the last column of `tools/scan_old_new.js`.
- **paving tone**: how the stone of the pool deck lies in a place — how dusty, how damp, how walked — as
  three multipliers of light that average to one across the paved ground, so the patches cannot repaint
  the deck. `paverTone` in `src/paving.js`, carried into the browser at the deck's corners by
  `tintFromGround` in `src/mesh.js` and multiplied in again by `tools/draw.js` through `broad` in
  `src/surface-colours.js`.
- **dusty and damp** (the two ends of the paving tone): dry stone under a film of garden dust, pale and
  warm with the blue taken out, against the same stone wet, darker and cooler and a shade bluer. Wet
  stone really is darker — that is why it is the end things go to where water is tracked.
- **damp band**: the ring of darker stone that hugs the pool coping, where every swimmer carries water
  out. `wetness()` in `src/paving.js`; it fades out over about two metres and does not reach past the
  width of the deck beside the water.
- **the waterline** (the wet band on the pool): the strip of tile the water actually stands against, and
  the strip of capstone it is splashed on — darker and cooler than the same stone dry, so the pool has an
  edge. `mats.poolWet` and `mats.copingWet` in `src/materials.js`, laid as `wetNorth` … and `splashNorth` …
  in `src/pool.js`, and dialled from the address bar with `?wet=`. Not the damp band above, which is the
  paving outside the pool and is a tone in the deck's corners, not a mesh.
- **the damp foot** (of the coping): the inner 13 cm of the pool's capstone, the part a swimmer climbing out
  leaves wet. `splashWest`, `splashEast`, `splashNorth`, `splashSouth` in `src/pool.js` — the inner band of
  the coping on each side, wearing `mats.copingWet`, at the same height as the dry stone beside it and butting
  against it. So called because it is where the water foots the stone, and nothing to do with a footpath.
- **drift and crust** (of the dust): the two sizes the dust is allowed to lie at — a drift of ten metres,
  which is a deck, and a crust a couple of metres across, which is what a person walking actually sees
  under their feet. `dustWidth` and `crustWidth` in `src/paving.js`, added together in `dustField()`.
- **wear** (of the paving): the little light and dark for where the stone has been walked and washed,
  on the scale of a room; the only part of the paving tone that moves the deck's light, as against its
  colour. `wear()` in `src/paving.js`.
- **slab** (the mesh builder): a flat piece of ground with thickness — a top cornered up into squares so
  it can carry a tone at its corners, and four sides wound to face out. `slab()` in `src/mesh.js`, used
  for the paving strips and the path. Not the same as a paving slab, which is the stone the pattern
  draws.
- **warmth** (of a block of a picture): its mean red minus its mean blue, one number, printed by
  `--patch` in `tools/pixels.js`. Light and colour are two different faults and a plain channel spread
  tells them apart badly; warmth moves a point or two between sun and shade and by ten between dust and
  damp.
- **silvered** (of outdoor timber): weathered to a pale grey, because sun and rain take the oil out of
  the faces the weather reaches, while the faces it does not reach keep their oil and stay dark and
  warm. `timberCanvas` in `src/textures.js` paints both ends, and `src/teak.js` uses the same two words
  for the same two ends on the two teak floors.
- **wheel rings**: the shallow bands a pot's maker leaves on the clay as it turns on the wheel. Painted
  by `terracottaCanvas` in `src/textures.js`, and stood in for in the drawing by `grid` with `v: 16`.
- **crust and damp** (of a pot's weathering): the two ends of weathering a terracotta pot left out of
  doors always comes to — a pale mineral crust high up, where water wicks out and dries, and a dark damp
  at the foot, which never dries off. Both painted by `terracottaCanvas`; `mow: { bands: 1 }` in
  `src/surface-colours.js` is the drawing's stand-in for them.
- **salt and pepper** (of granite): the way a granite boulder reads close to — a grey ground flecked
  with pale quartz and pink feldspar and dark mica. `rockCanvas` in `src/textures.js` paints the flecks
  with `specks`; `cells: 64` in the `stone` entry of `src/surface-colours.js` is the drawing's stand-in.
- **perlite**: the pale gritty bits in a bag of potting mix. One of the two kinds of fleck in
  `soilCanvas` in `src/textures.js`, which is the soil painted in the mouth of a pot.
- **lining** (of a wall): a thin piece of the room's own plaster fixed to the inside face of a wall, so
  a room is finished on its own side while the outside of the wall keeps its outdoor weather.
  `liningBack`, `liningWest` and `liningEast` in `src/villa.js`, 5 cm thick; the side ones are built by
  the same `wallWithOpenings` as the walls themselves, with `blockers: false` so they add no invisible
  walls of their own inside a room nobody may enter.
- **at a graze**: with the eye nearly level with a surface rather than above it. Water at a graze mirrors
  instead of showing through, which is the whole reason `villaMirror` exists in `src/water.js`. The angle the
  library measures it by is `dot(Normal, View)`, called `villaNdotV` there: 1.0 straight down, 0 dead level.
- **the chop** (on the water): the small tilted facets the bump gives the surface — the ripple field in
  `waterBumpCanvas` in `src/textures.js`. The word is ordinary English for a winded sea and is used here
  because the facets are what make water shimmer: each one edges the eye at a different moment, so the
  mirror and the film come and go across the sheet. In a still picture the chop is what stops one flat sheet
  of water from reading as one flat colour, and where it is thickest the water is darkest, because a facet
  turned away from the sky mirrors the near coping instead.
- **band** (of a picture): a rectangle named in pixels so a colour there can be quoted as one number and
  compared between two pictures. `tools/bands.js` prints the mean colour, the mean luminance (written `L127`
  for a mean of 127 out of 255), how warm or cool it runs, and the brightest and darkest pixels inside it —
  the darkest mattering as much as the mean, because a sheet of water whose average is reasonable can still
  be full of black facets. The standing bands over the pool from the start camera are the **foot** (the water
  nearest the visitor), the **middle** and the **far water**; `tools/pitfill.json` and `tools/watersky.json`
  quote them.
- **film** (of the water's colour): the cyan the pool wears over whatever lies under it — the light that has
  come back up through a metre and a half of water, painted as an emissive colour on the water's own material
  (`mats.water.emissiveColor` and its texture in `src/materials.js`) because this renderer gives a walled pit
  no bounced light of its own. It is a cheat and it is named as one; since v0.67.0 it is scaled down where the
  surface mirrors, in `src/water.js`, because cyan that came back out of the water cannot appear where almost
  nothing went in.
- **shut out** (of a fill lamp): to keep a lamp off a mesh by naming that mesh in the lamp's
  `excludedMeshes`. Needed because the sky's fill and the ground bounce are lamps without shadows — they
  light every face turned at them, roof or no roof — and a room under a roof must not be handed the whole
  sky through its ceiling. `shutOutSkyFill` in `src/world.js`, called from the room in `src/villa.js`.
- **sheet** (of leaf, bark or grass): a mesh that is a thin surface rather than a solid — a palm frond, a
  banana leaf, one flat blade of a grass clump — painted with its own pattern cut out by `alphaCutOff`, and
  seen from both sides because it has no thickness to hide one. Two material switches decide what a sheet
  does: `backFaceCulling` and `twoSidedLighting`, and `sheet()` in `src/materials.js` sets both. The list of
  them is kept in `src/surface-colours.js` as the entries with `cut` or `double`, and `tools/sheets.js`
  checks every one.
- **clump** (of grass): a handful of standing blades cut on three crossed sheets, so the patch of grass
  reads as a clump from any side instead of vanishing edge-on. Made by `makeTufts` in `src/garden.js` in one
  merged mesh, `grassTufts`, and rooted check by `tools/tuftfoot.js`. One clump is inked with one cell of
  the clump skin (`tuftAtlas`), so a garden of them is four ages of plant and not one plant copied.
  Not to be confused with the tree sense above.
- **verge**: the band of longer grass where the lawn meets something built — the cut stone of the pool
  court, a wall's foot, a path — and which the mower misses. Laid by `fringe` in `makeTuftPlan`.
- **drift** (of grass): a bunch of clumps crowded together along a verge, with bare lawn between one
  drift and the next. The word is already used for dust (see *drift and crust*); this is the same shape
  in a different place, and one clump every half metre along a line is a row and not a drift.
- **leaf-light**: the little light a leaf gives out of itself when the sun is behind it, which is what keeps
  a back-lit crown from going black. Written as `emissiveColor` beside an emissive pattern in
  `src/materials.js`, and as a flat `glow` for the same surface in `src/surface-colours.js`.
- **added light**: what a leaf-light is actually worth on the picture, which is the material's
  `emissiveColor` multiplied by the light its own emissive pattern carries over the part of itself that is
  leaf and not gap. Always smaller than the emissive colour, and the number the CPU drawing has to write
  down. Measured live by `tools/sheets.js`.
- **crumple** (of a lump): to push a sphere's skin in and out along each vertex's own radius, and recompute
  the normals, so the lump carries no single smooth gradient from its lit crown to its dark foot and stops
  reading as a ball. `crumple()` in `src/mesh.js`, used on every lump of a shrub and of a potted plant and
  on every crown of the jungle belt. (It lived in `src/garden.js` until the belt needed the same trick.)
- **ground line** (of a painted sheet): the row of the painted square that is meant to be the ground — for
  the standing grass, the canvas's own bottom edge, where the leaves come out of the crown. `makeTufts` in
  `src/garden.js` lays its UVs from it and `isWhole` in `tools/draw.js` rises its stand-in blades from it;
  put it at the top of the sheet and every clump hangs upside down.
- **band** (the far tree line): a curtain of flat quads laid along the far ring, from under the ground up to
  a ragged top, standing for a wood on a ridge — one mass with an edge, instead of a row of crowns. Built by
  `skylineBand()` in `src/world.js`, merged as the mesh `farBelt`, worn by the `farTree` material.
- **stand** (of trees): a stretch of the far band of one height, the size a wood grows in — forty metres in
  the band's long wander, thirteen in its middle one, four and a half for a single head. Used in
  `src/world.js` and in the notes; the same word a forester uses.
- **tone** (of one crown or one stretch of the band): how light or dark that one tree, or that one patch of
  the far ridge, is against its neighbours — written at the corners of the mesh and multiplied into its
  pattern by the engine, the same way the lawn's broad patches are (`tintFromGround` in `src/mesh.js`).
  Used in `src/world.js` and in the notes; it is what stops a crowd of crowns being one balloon.
- **the pool's wall shell**: the solid concrete round the pit — the four walls `src/pool.js` builds 30 cm
  outside the water's edge, so the water stands at x = ±5 and the shell's outer faces stand at x = ±5.3,
  z = 1.8 and 7.4. Named `poolShell` in `src/court.js`, which lays the court's stone against it: the stone
  comes to the shell and not to the water, which is what keeps grass out of the pool's edge.
- **tread and riser**: the two pieces every flight of steps is made of — the tread you put your foot on and
  the riser that stands up between one tread and the next. Used here for any place a horizontal surface meets
  a vertical one at a right angle; a plane of grass ending in the same plane as a pool wall is a tread meeting
  a riser, and at a grazing eye the two are almost exactly as far away, which is how the grass came to be
  drawing a pixel of itself over the tile.
- **curtain**: the wall of flat quads a band is made of — one quad every `step` metres of its ring, from
  under the ground up to the edge. The far tree line has always been one, and the far rank of the jungle
  belt is one now too (`skylineBand` in `src/world.js`, meshes `farBelt` and `jungleHighBelt`). Called a
  curtain because it has no thickness, no inside, and only the garden side is ever seen.
- **waves** (of a band's edge): the recipe that decides how the top edge of a curtain wanders — a list of
  [wavelength in metres, weight, seed offset] added together between `low` and `high`. A band's edge needs
  more than one wave or it is a smooth hill: the far line uses three (46, 13 and 4.5 m: a stand of trees, a
  clump, one head) and the near curtain three shorter ones (30, 10, 4 m). No wave may come near the step the
  ring is walked at — three samples of a wave is the least that reads as a wave, and finer comes out a saw.
- **squeeze and lean** (of a curtain's pattern): the two ways a curtain's leaf pattern is pulled off its own
  grid, so a repeat does not land every forty pixels of the frame and read as wallpaper. `squeeze` wanders
  the spacing along the ring between 0.4 and 1.6 of a tile; `lean` slides the whole pattern sideways as it
  goes up, by 0.12 of a tile per tile of height, so the sprays stop standing in columns. Both are in
  `skylineBand` in `src/world.js`, both are switched by its `warp` argument, and both are smooth, so there is
  no seam anywhere: a phase that jumps from quad to quad is a comb, not a warp.
- **atlas** (of a leaf pattern): one canvas painted as a grid of separate pictures instead of one pattern
  that joins edge to edge, so a piece of geometry can be inked with one cell of it and nothing of its
  neighbour comes with it. The belt's near rank wears one: `canopyClusterCanvas` in `src/textures.js` paints
  4 × 4 clusters and `cardRank` in `src/world.js` gives every card exactly one cell, which is what lets a
  card's own border fall in air — the layout is `canopyAtlas`, read by both, so the painter and the cutter
  cannot disagree about it. Two more skins are laid the same way: the shrub's leaf cards (`bushAtlas`) and
  the clumps of standing grass (`tuftAtlas`).
- **cluster** (of leaf): a head of leaf about two metres across — a hundred leaves thrown out from one
  middle, with air all round it — and one cell of the belt's atlas. One card of the near rank wears one
  cluster, so a cluster is what the outline of a crown is cut at. Used in `canopyClusterCanvas` and
  `cardRank`, and called a cluster in the notes.
- **spray** (of leaf): the same idea at a shrub's size — nine to eleven buds of three to five leaves each,
  the leaves 1.5 to 2.8 cm, the whole spray about seventeen centimetres across, with air all round them,
  and one cell of the shrub's atlas (`bushClusterCanvas` in `src/textures.js`; `bushAtlas` lays 6 × 6 of
  them on a 768 canvas). One leaf card of a bush wears one spray, so a spray is what the outline of a
  clipped shrub is cut at. Two words for two sizes on purpose: a cluster is two metres across and a spray
  is seventeen centimetres, and the numbers that make each one read are not the numbers that make the
  other one read. It used to be one ring of thirty leaves laid at even angles about the middle of the cell,
  which is not a spray of leaf but a star: see the note over the painter.
- **bud**: one growing point of a spray — a short stem with three to five leaves on it, all leaning the
  bud's own way, and the bud's own shade of leaf. Thrown anywhere in the spray and pointed any way, because
  a leaf that points away from the middle of its own card is a compass rose and not a leaf. Used to be two
  or three mossy strokes at the middle of the cell, which drew a four-armed star on every sixth card and
  came out of `bushClusterCanvas` the day the bush was measured.
- **pad** (an atlas): to fill every transparent pixel of an atlas with the colour of the opaque pixel
  nearest it, and leave it out of the picture. A mip level is a block average, and if the air is black then
  an unpadded atlas makes a card darker the farther off it stands — and at four metres that is the whole
  bush. `padAtlas` in `src/textures.js` does it in one sweep along each row and one down each column, and
  then gives every air pixel a quarter of a leaf's alpha, because a canvas keeps no colour at all in a pixel
  whose alpha is nought: padding the colour alone was done for six sessions and did nothing, and
  `tools/atlasair.js` is the probe that says so.
- **air** (of a cut-out skin): the part of a cut-out pattern that is thrown away by the alpha — the gap
  between the leaves. Used everywhere a pattern is cut rather than laid: the shrub's shell and cards, the
  hedge's crest, the two ranks of jungle, the clumps of grass. Air wants the colour of the leaf beside it
  and none of its alpha, which is what **pad** is for.
- **anchor** (on a skin): a place on a crumpled mesh's own skin to stand a leaf on — the middle of one of
  its triangles, with the way that triangle faces, both read in the world. `skinAnchors` in `src/mesh.js`
  draws them out of a mesh's triangle list, and `bushLeafage` in `src/garden.js` plants a leaf card on
  every one, which is how a card gets where the skin actually is instead of where the ball it was cut from
  was.
- **crest** (of the hedge): the top line of the boundary hedge, and the fringe of leaf cards stood along it
  so the line the hedge makes against the sky is leaf tips and not a ruler. `buildBoundary` in `src/world.js`
  lays the crest line itself (`crestAt`: the height wanders along the run) and `hedgeCrest` in the same file
  builds the fringe as one merged mesh, `hedgeCrest`.
- **frond** (of a palm): a palm's whole leaf — the arching stalk and all the blades standing off it. Built by
  `palmCrown` in `src/garden.js`, one mesh a palm (`palmLeaves`) and one for all eight palms on the horizon
  (`farPalmFronds` in `src/world.js`).
- **leaflet**: one of the hundred-odd narrow blades that stand off a frond's stalk. It is the smallest leaf
  this Villa builds and it is one card of mesh each, folded into a shallow V along its own rib —
  `palmCrown` in `src/garden.js`, painted by `palmBladeCanvas` in `src/textures.js`.
- **stalk** (of a frond): the rib all a frond's leaflets stand on, called the stalk here and inked from the
  rib band of the leaflets' own canvas. It is NOT `mats.stalk`, which is a banana's pseudostem.
- **spine** (of a leaf): the centre line of a single leaf, from where it comes out of the crown to its
  point. A blade of grass is drawn by walking a spine and laying ink a shrinking width either side of
  it, which is how a leaf gets a point and a bend at the same time — `tuftCanvas` in `src/textures.js`.
  It is not a rib: a rib is the raised middle of a frond's leaflet or a banana's blade, and is built in
  mesh, whereas a spine is only the line a painted leaf is walked along.
- **wash** (on a surface): a layer of translucent colour laid over a pattern that is already there, so
  what is under it still shows through. Painted in `src/textures.js` (a gradient wash for a clump's
  shaded foot and its lit tips, a noise wash for the weather on plaster, paving and teak), and copied
  at the same scale by `wash` entries in `src/surface-colours.js` so the CPU drawing wears the same
  layers the browser is shown.
- **hinge** (of a butterfly's wing): the edge the wing turns on, which runs along the body. The wing's
  canvas is painted with that edge on its left (`butterflyWing.root` in `src/textures.js`) so the
  texture coordinates of the sheet in `src/creatures.js` can be laid on it and the flap can be a turn
  about the body's own axis.
- **the shield** (of a cockroach): the flat plate that covers the head, narrower and flatter than the
  belly behind it. Built as `cockroachShield` in `src/creatures.js`; called a shield rather than a
  pronotum because the second word is not English and the first is what it does.
- **loft** (of a swimming animal): to build a body as a tube of rings — a ring of points at each station
  along the length, the ring's width and height read off three tables, and a skin of quads laid between the
  rings. `loft()` in `src/loft.js`, used by the koi (`src/koi.js`) and the shark (`src/shark.js`). A shipwright's
  word for exactly this, and set down here because the three tables and the word `station` belong to it.
  A loft is one mesh between two stations, so a bent animal is several lofts on a chain of nodes.
- **the three girth tables** (`flank`, `dorsal`, `belly`): the lists of [station, fraction] that say how fat a
  swimming animal is along its length — how far each side comes out, how far the back stands above the axis
  and how far the belly hangs below it. Read by `along()` in `src/loft.js`. `t = 0` is the tail tip and `t = 1`
  the snout, in every table, on every animal here.
- **window** (cut in a loft): a hole left in a loft's skin by leaving some of its ring stations out, so the
  opening is bounded by ring lines. `cut` in `src/loft.js`; the shark's mouth is one, spanning three stations
  of fifteen about the belly (`MOUTH_FROM`, `MOUTH_TO` in `src/shark.js`). So called because what is on the
  other side of it is inside the animal, and the point of the hole is that you can look in.
- **coil, lunge, snap, sulk**: the shark's four doings, and the three beats of a threat — it notices and drops
  deep (coil), throws itself at the edge (lunge), shuts its mouth (snap), and slinks off (sulk). Named in
  `SPEC` and switched in `prowl()` in `src/shark.js`; the state is printed by `tools/bite.js`, which stands
  at the water's edge and waits for one.
- **plume and slick** (of a spill of blood): the two shapes a bite's blood is made of under water — `plumes`,
  camera-facing cards that come out of the wound and sink and spread, and `slicks`, flat cards that ride up
  under the surface and are the part of the stain legible from the far side of the pool. `PLUMES` and
  `SLICKS` in `src/blood.js`, which says why a spill is a cloud of lumps and not one expanding disc.
- **the ear**: the Villa's one sound rig, `buildSound()` in `src/sound.js`. Called the ear and not the audio
  system because there is exactly one of it, it is the visitor's ear and not a mixer, and every noise in the
  garden is placed in it at the place that made it. Asked for by `window.__villa.sound`.
- **arm** (the ear): wake the sound up. A browser will not let a page make a noise until a person has touched
  it, so nothing is heard until a click or a key, and `arm()` is what that first touch calls. `armedBy` says
  which of the two it was. `M` mutes and unmutes; that is the only key any of this costs.
- **voice**: one animal's noise, made out of oscillators at the moment it is asked for — `frog`, `gecko`,
  `raven`, `coin` in the table `VOICES` in `src/sound.js`. The Villa keeps count of how many are sounding
  (`MAX_VOICES`, fourteen) and refuses the fifteenth, because a pond that all starts croaking in one frame is
  a wall of buzz and not a pond.
- **scuttle**: how a gecko moves on a wall — a sit, then three or four quick moves with a stutter between,
  then nothing for a long while. The state is `scuttle` in `src/gecko.js`, against `sit`. Not a walk, and the
  difference is the whole of the animal.
- **abroad** (of a night animal): out and about. A gecko, a firefly or a cockroach is `abroad` after dark and
  put away by daylight; `tools/ears.js` prints `abroad: true` to say the night ones are actually awake, since
  a sound nobody can hear can also be a sound nobody switched on.
- **round**: one charge of a gun — what is thrown when the trigger is pulled. Ordinary gun English, written
  here because "bullet" would be wrong: what travels is the whole charge, and what the Villa draws is where
  it lands. Used in `src/weapon.js` (`fire()` throws one round) and in the notes.
- **spurt**: the mark left in the air where a round landed — a puff of water off the pool, of dust off stone
  or soil, of blood off the shark. Made by `spurt()` in `src/weapon.js` out of six reused cards, painted by
  `puffCanvas` in `src/textures.js`. Not a splash (which is the ring on the water, `splash` in `src/pool.js`)
  and not a puff (which is the blood's cloud under the surface, `src/blood.js`).
- **the word**: the three letters `g`, `u`, `n` typed one after another, which arm the gun and put it away
  again. `WORD` in `src/weapon.js`. It is a typed word and not a key because every single key on this page is
  already spent, and a word cannot be struck by accident by anybody whose hands are where they belong.
- **shove**: the momentum a round drives through the shark's body, which is not the animal's own swimming and
  is applied to its position separately from its steering. `shoveX`/`shoveZ` and `SPEC.shove` in
  `src/shark.js`.
- **dread**: the seconds during which a shark that has been hit keeps clear of the visitor's boots — the
  number that stops a shot animal coming back for more at once. `dread` and `SPEC.patience` in `src/shark.js`.
- **the watercourse, the channel, the banks and the mouth**: the stream that comes in at the back hedge and
  ends in the pond (`src/stream.js`). The **channel** is the trough the water runs in — earth walls and an earth
  bed, about 1.6 m of water, its width breathing between 1.2 and 2.1 m along the course; the **banks** are the
  earth slopes either side of it; the **mouth** is where the water leaves the channel and falls into the pond,
  and the **head** is where it comes in at the hedge. `course` is the centre line, `stations()` lays it out at
  about 0.9 m to a station, `streamReach` is how far the works spread from the line (where the grass apron ends)
  and `streamKeepOff` is how far the walk is kept from it — the water and a hand's width of bank, which is how
  a visitor may stand on the bank and still not wade. Ordinary watercourse English, written down because the
  mesh names (`streamWallSouth`, `streamBankNorth`, `streamBed`) and the exports (`streamMouth`, `mouthGap`)
  depend on which side of the water is meant: `south` and `north` here are the two sides of the channel, named
  for the way the water runs, and the south wall is the one on the left hand going downstream.
- **the bare band, the grass apron and the lip** (of the watercourse): the three parts of a dirt bank, from the
  water outward (`src/stream.js`). The **lip** is the bank's inner edge, standing 12 to 23 centimetres over the
  water and uneven along the course on purpose; the **bare band** is the damp soil between the lip and the
  grass, 25 to 65 centimetres wide, which is the same trick the pond's `MARGIN` plays — the cut edge of a lawn
  must never meet the water; the **grass apron** is the short slope from the bare band down to the level lawn,
  and its foot is tucked 6 centimetres under the lawn plane so the joint cannot show sky. `berm` is the word
  used in the code for the bare band's width, and it is not used in prose here because this folder already uses
  **apron** for the free stone round the pool deck — the grass apron is always named in full.
- **settle** (a stone): to sink a worked stone into the ground it stands on until its crown is the height asked
  for (`settle` in `src/stream.js`). It has to happen after the stone is tilted and crumpled, because both move
  the crown: setting the middle first left eight of thirty-one edging stones under their own bank.
- **borrowed daylight**: a material's `emissiveColor` standing in for light coming back off the lawn and the
  sky — grass and earth are not lamps, but a garden lit only by one lamp and a hemi light reads flat, so a great
  many materials here are given a little light of their own (`src/materials.js`). The phrase is used wherever the
  night has to take it back again: `rig.sunGlow` in `src/main.js` is the list of materials whose glow is borrowed
  in that sense and has no lamp behind it, and the day cycle dims them in `src/daylight.js`. The pool's water is
  not borrowed daylight and is not in the list: it has two real fittings in its far wall.
- **the veil** (of the fall): the sheet of water going over the lip into the pond — `streamFall`, wearing
  `mats.streamFall`, whose pattern `animate` slides downwards. Called a veil and not a sheet because it is
  water you can see through in one place and not in another, which is what `streakCanvas` in `src/textures.js`
  paints; `sheet` in this folder already means a flat piece of geometry with no thickness and no face of its
  own, and the fall is not that — it has a front, and the pond's splash rings go out from where its foot lands.
- **the column, the stem and the cap** (of a blast): what one rocket leaves in the sky (`src/rocket.js`). The
  **column** is the whole of it — a pool of billboard cards, each rising and dragged down as it goes. The
  **stem** is its lower part, where the cards are still going up and are warm and dark; the **cap** is where the
  lift has run out and the cards can only go sideways, which is the whole of how a mushroom is made, and is why
  a card turns from `mats.smoke` to `mats.smokeCap` as it passes thirteen metres. Nothing is simulated: the
  shape comes out of three numbers per card — lift, drag, and outward drift.
- **pieces** (of a house): what a blast leaves on the ground. Each piece is one instance of one of three boxes
  (plaster, roof, timber), cut out of the bounding box of the wall or roof it came from, and each carries a
  velocity that gravity and the lawn bring to an end. Not "debris", which is a mass noun: `chunks.length` counts
  things, not a substance.
- **a held sound**: a noise in `src/sound.js` that is going all the time rather than one that is called,
  played and thrown away. `startMurmur` hangs one on the mixer and the ear rides its gain inside `listen()`,
  which already runs every frame: `near` answers metres from the listener to the thing making the sound, and the
  gain is full within `bank` metres and gone at `bank + span`; `scale` is asked every frame for a further
  multiplier, which is how the cricket bed is held back in daylight. A held sound is a RECORDING, looped by
  `loopVoice` — there is no synthesised bed in this Villa, and the one that was (a band-passed noise written for
  the watercourse) was thrown out after the master heard it and called it what it is: a hiss. The two held
  sounds are the channel's **trickle** and the night's **cricket bed**; every animal is a voice, which is a
  different thing and is counted against `MAX_VOICES`. A **seam** is where a short loop is cut, and `loopVoice`
  cuts at the quietest samples of the first and last thirds of its file, so the join lands where almost nothing
  is being said.
- **the shade** (of a blast's cloud): how much daylight the smoke column is holding off the garden, from nought
  to one — `launcher.shade` in `src/rocket.js`, computed each frame from how far the smoke cards have grown.
  `src/main.js` multiplies it into the day's three lamps, and it multiplies `day.state.lamps` (the numbers the
  day last wrote) rather than the lamps' live values: multiplying a live value every frame compounds, and a
  cloud that hangs for a minute then takes the sun to nothing at all.
