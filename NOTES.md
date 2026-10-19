# Notes

Memory for the next session. The villa is in this folder; `EDICT.md` outranks everything here.

## Walking in

Serve is `http://localhost:8090/` (this folder is `/villa/`). Open `index.html` and you are standing
on the paving south of the pool, the villa's front in front of you, `W A S D` to walk (Shift to run),
drag or pointer-lock to look, `space` to leave the ground and `space` again to come down, `R` back to
the start. Everything the browser loads is in this folder
(`vendor/babylon`, `vendor/materials` — Babylon 9.30, no network).

The walk is not a physics engine. `src/ground.js` reads the built meshes once and answers two
questions — how high the ground is here, and may a person stand here — and the camera is set down on
that each frame. Babylon's own camera collisions were tried and thrown out: its collision steps are
per frame, so at the 4-13 fps of software WebGL a person walked through the paving and fell out of
the world (measured: the start view ended at y = -45 m). Do not put it back.

## How to look at it

- **This model can now SEE the pictures. Use it.** `read pictures/x.png` opens the file as an image, and
  the 55th session (2026-10-17) worked that way all session: a 1280x720 browser picture is worth one read,
  and it shows at once what no grid of numbers showed — that a lawn was mint paint, that a tuft is a maize
  plant, that a shrub is a mossy urchin, that a palm trunk is a stack of maroon donuts. A whole frame is
  usually too big to judge small things, so the habit that worked was: `node tools/shrink.js <in> <out>
  480` for the whole view and its light, `node tools/crop.js <in> <out> x y w h [--scale 2]` for one part
  of it at full size, then `read` the result. Keep the scratch crops under a `tmp-` name and delete them at
  the end of the session. Everything else in this section still stands and still settles arguments the eye
  cannot settle (a shade of a colour, whether a hairline seam is gone, who owns a pixel) — but read the
  picture FIRST and measure what you then need to prove.
- **A browser is a gift that may not be there next session: use it while it is in the room.** Every
  session from the fourth to the eleventh (all on 2026-10-14) could not take a single picture: the sandbox
  capped tasks at
  `/sys/fs/cgroup/pids.max` = 2048, ~1960 of them are unreapable corpses of old Chromium runs
  (`ps -eo stat | grep -c Z`), and Chromium wants ~100. It dies with `pthread_create: Resource
  temporarily unavailable`. `tools/headroom.js` now says so up front and exits, so do not waste an
  hour on it. The proof that nothing in here can clear them is at the top of the sixth session below.
  While the room is this small, **run one node tool at a time**: node wants five threads, and two at
  once have died with `uv_thread_create: Resource temporarily unavailable`. Nothing in here can clear the corpses (their parent is the sandbox's init). Work on
  the walk and the geometry with `tools/feet.js`, and if `node tools/look.js` prints its warning,
  say so in these notes and do work that needs no eyes.
  The twelfth session found **2009 of 2048 slots free** and took fourteen browser pictures, so a fresh
  sandbox does get a browser back: run `node tools/headroom.js` before assuming anything either way.
  The fifteenth session found **2010 free and no zombies at all left behind after twenty browser
  runs** (`ps -eo stat | grep -c Z` → 0), so the unreapable corpses are a sick sandbox and not a
  law: this one runs a browser happily, took all fourteen standing pictures and lost nothing. Ask
  `headroom.js`, believe it, and use the eyes while they are here.
- **`node tools/sheet.js <out.png> --set <picture-number> [--cols n] [--width w]` — seventeen views in
  ONE picture.** The standing set photographed at that number, pasted into a grid with each view's name
  lettered under it (a 5×7 dot alphabet, no font), which is one read of a picture instead of seventeen
  and is how a whole-set fault — every clump of grass the same plant, or one view gone grey — shows up at
  a glance. Give it a list of files instead of `--set` for a before-and-after pair. Shrink the sheet with
  `tools/shrink.js` before reading it if it comes out over a megabyte.
- **`node tools/pickat.js <view name or x,y,z,yaw,pitch> <x,y;x,y> [--out file.png]` — what is behind
  THESE pixels in a live browser.** `cover.js` sweeps the frame on a grid and `draw.js --pick` does it in
  the CPU drawing; this answers the question that is left when a picture shows a fault too small for a
  grid: it names the mesh and material at each pixel, how far, where in the world, and paints the colour
  the picture has there. Two traps it walked into so the next reader does not: the url's `?view=` wants
  the *numbers* from `tools/cameras.txt` and not the name (a name gives `Number("home")` = NaN, a camera
  at NaN, and a pick that hits nothing anywhere), and a puppeteer page launched without
  `--disable-features=Vulkan` and `--window-size` — the flags `cover.js` uses — answers with a grey
  gradient instead of the Villa. Use it for anything coplanar: two faces in one plane show up as one
  surface named at one pixel and a different one at the pixel beside it.
- `screenshot <url> <out.png> [w] [h] [ms]` — a real browser picture (software WebGL, a few fps).
  **It returns 0 and writes a black picture when the page threw.** That happened here: one stray line in
  `src/materials.js`, seventeen standing views all black, every exit code clean. Run `node
  tools/standup.js` (a second, and it names the file and the line) before believing any dark picture, and
  check a pixel or two with `tools/pixels.js --at` before believing a whole set.
- **`node tools/draw.js --out pictures/drawn-home.png [--view "x,y,z,yaw,pitch"] [--pick "x,y;.."]
  [--debug] [--help]` — a picture of the Villa with no browser at all.** It builds the same world
  `feet.js` builds, then draws every triangle on the CPU: sun, a shadow map built here too (Babylon's
  own cannot be read back on the Null engine), sky, haze, water, lamps, bloom, and then Babylon's own
  tone chain — exposure, the Khronos PBR Neutral curve the Villa runs on (or ACES, with `--tonemap aces`),
  sRGB, the contrast nudge — read out of the library so the drawing and the browser agree on them. It prints what fills the frame, how much
  came out black and which surfaces made the black, how much blew out to white, and with `--pick` the
  colour, mesh, material, world place and face normal behind named pixels. 1280x720 takes about a
  second and a half. It has **no bump maps, no scene reflections, no film grain, no bounced light
  beyond a flat sky fill**, and its patterns come from `src/surface-colours.js`, so read it for shape,
  placement, coverage and dead areas — never for the last shade of a colour, and never to clear a
  release. Its one measured bias: it is short of range — 4 to 29 luminance points under the browser in a
  sunlit view and 15 to 24 points over it in a shaded one (the fourth fault above has the views one by
  one, and what is missing from `shade()`). Read a
  drawn sunlit face as too dark and a drawn shaded face as too light, and never call a dark corner of a
  drawing black on the drawing's own say-so.
- **`node tools/compare.js <browser.png> <drawn.png> [--grid 10x6] [--cells]` — how far apart two
  pictures of one view are.** Whole-picture colour and luminance, the mean gap per channel, the cells
  that disagree on warm or cool, and with `--cells` the ten cells furthest apart. This is how the
  drawing is calibrated against a browser picture, and how a change is checked against the last one.
- **`node tools/diffgrid.js <a.png> <b.png> [--over 40] [--grid 32x18]` — WHERE two pictures of one view
  differ.** `compare.js` calls a change of 0.1% of the frame "nothing", and the film grain moves every
  pixel a point or two between loads, so a bounding box is useless. This counts, per cell, the pixels that
  moved by more than a threshold and draws them as a shape: the way to find a 25 x 40 px lit doorway in a
  1280 x 720 picture. Pair it with a plan whose cases switch the thing in and out, like
  `tools/doorwhere.json`.
- **`node tools/backlight.js "180,160,133" "63,106,129"` — a colour a browser showed, turned back
  into the light that made it.** It runs exposure, ACES, sRGB and contrast backwards, so a measured
  pixel can set a number in `src/surface-colours.js` or the drawn sky instead of a guess.
- `node tools/pixels.js pictures/x.png [--grid 10x6] [--thumb 20x11] [--shade 90x50] [--relief] [--hist]
  [--at "x,y;x,y"] [--patch "x0,y0,x1,y1" [--block 48]] [--repeat "x0,y0,x1,y1"]`
  — the numbers behind a picture. `--thumb` prints a colour thumbnail one can almost read as a
  picture; **`--shade 90x50` prints the whole frame twice as one character per cell — brightness first,
  then what each cell is made of (warm timber or roof, green leaf, blue sky, teal water, pale stone,
  dark), capitals for the lit parts — which is what the thirty-third session read the Villa through, and
  where it found that a big dark mass in the middle of a frame was the store room and its lit band was six
  cells wide**; `--at` prints the exact colour of named pixels; **`--hist` prints how the picture's light
  is spread over the bands of brightness and where its darkest and brightest parts sit in the frame**
  — so far the only way found to compare a drawn view's dark end against a browser picture's. This
  model cannot see images, so these numbers, the shade maps and the picks are the eyes.
- **`--patch` and `--repeat` in `tools/pixels.js` — the two ways to tell a flat surface from a living
  one.** `--patch "x0,y0,x1,y1" [--block 48]` takes the average colour of every block of a stretch of
  ground or water and reports how much those block *means* differ from one another: a lawn that is one
  colour however busy the blades in it are has a small number there. `--repeat "x0,y0,x1,y1"` slides the
  brightness of the same rectangle along a copy of itself and prints where it lines up again, so a
  pattern laid on a six-metre grid answers with a peak at six metres. At the overhead camera below,
  `41px` is one metre and `239px` is the tile. Both want a rectangle that is all one thing, and the
  cleanest one in this Villa is the lawn seen straight down from twenty metres:
  `?float=1&view=-16,20,8,3.1416,1.5708`, which is 39.8 pixels to the metre in a 1280 x 720 picture. The
  deck's own clean rectangle is the west paving from the same height —
  `?float=1&view=-10.2,10,6.8,3.1416,1.5708`, 79.6 px to the metre, and pixels 280,40 to 1000,680 is all
  stone (`pictures/deckover-before.png` and `deckover-after.png` are that camera, before and after the
  paving tone). `--patch` also prints each block's **warmth** (mean red minus mean blue), which is the
  column that tells a change of colour from a change of light: sun against shade moves it by a point or
  two over a lawn, dust against damp moved it by ten over the deck.
- **`node tools/scanline.js <picture.png> --row N|--col N --from A --to B [--step n] [--run n]` — the colour of
  every pixel along one row or column, in order.** A two-pixel stripe between a capstone and a paving slab is
  invisible to every grid average in this folder; it is found by reading a line of pixels straight across it.
  `warm` (red − blue) is on every line, because a green hairline and a dark shadow both read as "less light".
  `--run 4` collapses a band of one colour into one line with its width in pixels. Its companion is
  **`--find "g-b>50 && g-r>25" [--where x0,y0,x1,y1]` in `tools/pixels.js`**, which counts the pixels answering
  a rule written in the channels and prints where in the frame they lie: "is the hairline gone?" as one number.
  Both belong to an eye: a pixel rectangle means nothing across a different `fov`.
- **`node tools/canvasstats.js [canvasName] [size] [key=value…]` — the numbers behind one painted canvas, in
  the browser that paints it.** It calls an exported canvas from `src/textures.js` and prints its mean bytes,
  how far its bytes run (`std`), and how much of that spread survives a block average of 8, 16 and 32 pixels —
  which is what a minifying mipmap does on the way to the screen. The question it answers is "is this pattern
  even going to be visible out there": a tile whose `std` is 9 bytes is a wash whatever it looks like on the
  monitor, and one whose spread is gone by `b16` is a pattern at the wrong size. With no arguments it runs
  over every canvas in the Villa. This is how the far rank's leaf clusters were sized.
- **`node tools/lights.js --plan tools/roomprobe.json` — is there a room behind the front glass?**
  The same places asked twice: as built, and with each fault that used to be in the room put back one at
  a time (the ceiling hoisted up over the roof's soffit, the service block let into the room again, the
  lamp switched off), plus a clearer glass and a brighter lamp to choose against. A place in a room has
  to be *found* by reading what the pick names, the same as a place on the paving: three of the first
  picks from the old probe projected clean out of the frame and printed NaN. `tools/roomlamp.json` is
  the lamp ladder on its own, with the eye put inside the room (`?view=0,2.2,-6.2,3.1416,0`), which is
  also the camera to calibrate `interiorPlaster` in `src/surface-colours.js` against.
- **`node tools/dump.js '<expression>'` — ask the running Villa a question and print the answer.** New
  this session. It loads the page, waits, and runs one expression with `scene`, `camera`, `mats`, `sun`,
  `ground`, `walk`, `pipeline` and the three lamps (`light`, `hemi`, `bounce`) in scope, printing the
  result as JSON; `--file` takes one question per line. This is how a suspected exclusion or a wrong
  material is *settled* instead of argued: `hemi.excludedMeshes.map(m => m.name)` said in one line that
  nothing outside the room is shut out of the sky's fill, which killed a wrong theory about the base
  course in one go.
- **`node tools/lights.js --plan tools/plinth.json` — what the base course of the house is made of, and
  what it used to be.** Four cameras and the faces on them, asked twice: as built, and with the old soot
  bytes put back with `mats.plasterDark.albedoColor`. Its `blockface` camera (`5.6,1.8,-17.2,0,0`) and a
  low one at the plinth are now also in `tools/propcams.txt` as `block` and `plinth`, because no standing
  view shows either face big enough to measure.
- **A pick names the mesh behind whatever is in front of it, and paints the thing in front.** `tools/cover.js`
  and the `place` picks of `tools/lights.js` cast a ray and report the nearest *pickable* mesh with the
  colour at that pixel; foliage that is `isPickable = false` does not answer the ray, so a pick aimed at a
  plinth behind a shrub names the plinth and paints a leaf, and the twenty-fourth session's "(34,26,14) at
  the foot of the wall" was that trap — right number, wrong surface, and the surface it really belonged to
  was ten times bigger. When a pick matters, get the camera within two metres of the face (`tools/propcams.txt`)
  or check the share against `tools/cover.js`, which prints where each material's darkest and brightest
  pixel sit in the frame.
- **Two ways to put a narrow eye on a browser picture**: `?fov=0.45` on the url works for every tool
  that takes a url — `tools/cover.js` has no `--fov` of its own, so give it
  `"http://localhost:8090/villa/index.html?fov=0.45"` as its first argument. `tools/lights.js` takes
  `fov` per view in the plan. A drawing takes `--fov`. Without this, a cover of the `colonnade` camera
  and a drawing of it are two different pictures and their shares of each material do not line up at all
  (the glass is 10.8% of one and 35.6% of the other).
- **A browser picture and the CPU drawing can now be read surface against surface.** `tools/draw.js`
  prints, under *what each kind was painted as*, each surface kind's own share, mean colour, `runs`,
  darkest and brightest — the same numbers and the same words `tools/cover.js` prints from the browser
  — so a lie about one material is found in the line for that material and not guessed at from a whole
  frame. This is how the drawing's glass was caught being a cool grey sheet over a warm room.
- **`node tools/lights.js --plan tools/lawnprobe.json` — does the lawn's tone actually reach the
  screen?** The same twenty-four places over the west lawn, once as the Villa builds itself and once with
  every lawn vertex colour forced back to one by hand. The twelve places that are grass must differ
  between the two cases, by up to a fifteenth of a channel; the twelve that are paving and water must not
  differ at all, which is the control. If the two cases agree, the engine has stopped carrying the lawn's
  vertex colours and the garden is flat again.
- **`node tools/lights.js --plan tools/lawnbump.json` (also `hedgebump.json`, `lawnshine.json`) — which
  knob on the garden's green actually moves a pixel.** Each case is a line run against the live scene, so a
  bump can be set to 0.25, a roughness map pulled out, a lamp's specular blacked, and the same view
  measured again in one browser: `--save pictures/tmp/x` writes a picture per case, and
  `node tools/pixels.js <picture> --patch "x0,y0,x1,y1" --block 2` measures the sparkle in it (the std of
  two-pixel block means over a rectangle that is all one surface: grass glitter is a big number there,
  and a lawn that has been walked flat on the bump is a small one). This is how the lawn's bump was caught
  taking sixteen points of light off the garden, and how `sun.specular` and the lawn's roughness map were
  found to change nothing at all with `usePhysicalLightingMode` on.
- **`node tools/lights.js --plan tools/paverprobe.json` — the same trick for the pool deck.** Thirteen
  paving places in two views (one standing on the west deck looking north along it, one the `west`
  camera), asked as built and again with every `deck*`/`path` vertex colour forced back to one. The paving
  places must move — they do, by up to (+20, +10, −6) where the stone is dusty and (−8, −5, 0) where the
  damp band reaches — and the hedge, sky, water, teak and coping places must not, which is the control.
  Note that a paving place has to be *found* by reading what the pick names: three of the first dozen
  turned out to be coping, water or a shrub.
- **`tools/cover.js` takes a url as its first argument**, before the flags, so a released copy can be
  measured against the working tree: `node tools/cover.js
  "http://localhost:8090/villa/releases/v0.12.0/index.html" --view "…"` prints the same table for the
  older Villa. This is how a `runs` number before a change is had after it was made.
- `node tools/look.js <url> <out.png> <ms> [--size WxH] [--view x,y,z,yaw,pitch] [--pick "x,y;.."]
  [--keys KeyW:2500] [--material water]` — scene stats, page errors, camera, and for each picked
  pixel: which mesh and material is there, how far, and what colour it came out as. A `--pick` number
  under one is a fraction of the frame, x from the left and y from the top, which is how every other tool
  here names a place; numbers over one are still raw pixels. It was not so before the twenty-third session,
  and every fraction handed to it then was silently read as the top-left corner of the picture and answered
  with whatever hangs there. Name the surface a measure is taken on before the measure is believed.
- **`node tools/feet.js [--grid]` — the walking, checked without a browser.** It builds the whole
  world under Babylon's NullEngine in Node and prints: the foot height at named places (with what
  is wanted), what a visitor can reach from the start by a flood fill of the ground, every place
  where the free ground jumps more than 0.42 m between neighbours a half metre apart (a stumble),
  every blocker's size and position, and a `--grid` map of the garden (`#` wall, `~` off limits,
  `-` raised ground, `.` lawn, `?` ground you cannot get to). Numbers only, and no pixels: it says
  nothing about how the Villa looks.
- `node tools/walk.js` — the same walk test in the browser, eight places, W held two seconds.
- **`node tools/standup.js [--frames 30] [--key KeyW] [--url "?view=..."]` — does the Villa stand up?
  The only tool that walks the browser's own path without a browser.** It loads `src/main.js` itself, the
  file the page loads, with a small DOM, a blank canvas 2d context and Babylon's NullEngine in place of
  the real engine, and drives the render loop. Anything that throws in a browser while the Villa is being
  built — a bad shadow caster, a missing material class, a mesh builder given the wrong thing — throws
  here with a real stack. It also runs `walk.step` and `pool.animate` for the frames it is given. It says
  nothing about how the Villa looks: the patterns are blank and NullEngine draws nothing.
- **`node tools/shadows.js` — who is asked to throw a shadow.** Builds the world and complains about any
  shadow-caster argument that is not a mesh, with the line in `src/` that handed it over. Babylon's real
  `addShadowCaster` runs `for (const child of mesh.getChildMeshes())`, so an array or a light in that
  list stops the Villa standing up — which is what the two side walls did in a real browser.
- **`./tools/views.sh [name ...]` — redraws the fourteen standing views** into `pictures/`, with the
  cameras in one place in the script. These are the cameras browser pictures should be taken on.
- `node tools/lights.js --plan tools/lighting.json [--save dir] [--pick "name:fx,fy;..."]` — light/camera
  settings measured against each other, in one browser. A plan is a list of `views` (each with a standing
  `view`, an optional narrow `fov`, and optional `picks`) and a list of `cases` (each a `query` put on the
  url and a `js` line run against the live scene, which can name `scene`, `camera`, `mats`, `sun`,
  `pipeline`, `ground`, `walk` and — through `light`, `hemi` and `bounce` — the three lights the Villa
  calls `sun`, `sky-fill` and `bounce`). `--pick` reports, per named pixel: mean colour of a 9x9
  box, mesh, material, distance, world place and normal — so one surface can be followed through every
  case. `tools/stats.js` holds the shared measuring code, and every line it prints now carries the lit
  band on its own: how much of the frame is at L200 and above, how much of that is past L230, how much is
  at the ceiling, and what colour and channel spread the lit band holds.
- **`node tools/horizon.json` — a `tools/lights.js` plan for the far distance.** It floats the eye
  90 m over the middle of the garden (`float=1`: without it the walk sets the camera back down on the
  ground) and looks out over the tree line, because the hills are invisible from the ground — their
  tops are lower than the tree line's tops, so they only show where the tree line has a gap. Its
  picks name the mesh, so it is how you find what to measure out there.
- **`tools/distance.json` and `tools/shoulder.json` — two more `lights.js` plans.** The first sets the far
  ladder (hills, far tree line, the two jungle ranks) against the released picture, and is how you check
  that a lighting change has not put the haze back to front. The second sets the tone curves against each
  other on five views — ACES as it was, Khronos PBR Neutral at four exposures, and the refused pull on the
  bright end — with picks on the sunlit surfaces that fault 1 lives on.
- **`node tools/scan_old_new.js 025 042` — two sets of standing pictures weighed against each other.** It
  reads `tools/cameras.txt` for the names, so `025-home.png` is set against `042-home.png`, and prints
  luminance and how much of each frame is white, black, in colour, at the bright end and at the dark end,
  and what the sunlit band (L200 and above) came out as and how much channel spread is left in it.
  This is how a lighting change is proved or refused across all fourteen views at once.
- **`node tools/pitch.js [--url <address>] [--list a,b] [--worst n]` — how big one repeat of a pattern is**
  in metres of the surface it lies on, answered for every face in the standing scene out of the mesh's own
  texture coordinates and its own size. It is how a pattern that is painted honestly but laid on at the
  wrong scale gets caught: the twenty-third session's whole fault was here (plaster six metres to a repeat,
  a hedge one repeat across forty-five metres, a palm's rings seventy centimetres deep). `--worst 26` prints
  the twenty-six faces furthest from their material's `pattern:` size; faces under 15 cm across are left out,
  because one narrow strip says nothing either way. It says what is PAINTED, not what is SEEN: a picture of
  the pixels is still the witness.
- **`./tools/photos.sh [name ...]` — photographs the standing cameras in a real browser** into
  `pictures/0xx-<name>.png`; `--from 042` starts the numbering there. Needs a browser; it says so and
  stops if the sandbox has no room for one.
- **`node tools/cover.js [--view "..."] [--step 40] [--out file.png]` — what the browser paints the frame
  out of.** It asks the page, on a grid, which mesh and material is behind each point and then reads back
  the colour the browser actually painted there, so a surface can be checked against
  `src/surface-colours.js` without squinting at a whole frame. It prints, for each material, its share of
  the frame, its mean colour, and its darkest and brightest pixel with the place where they sit — which is
  how a surface that is half blown and half shaded is told from a flat one, and the fourteenth session's
  bloom and teak faults were found that way. Against each material it also prints `runs`: how much that
  material's own pixels differ from one another, which is the flatness of a lawn or the life of water in
  one number. It also lists every see-through material
  and every visible mesh with no colour map. This is what pinned the grey lawn.
  `--alpha` and `--untexed` print only those two reports.
- The standing cameras now live in **`tools/cameras.txt`**, read by both `tools/views.sh` (the CPU
  drawing) and `tools/photos.sh` (the browser), so the two are always looking at the same place and
  `tools/compare.js` can weigh them against each other. There are **seventeen** of them now: the fifteenth
  is `grass` (added by the twenty-fourth session), the sixteenth `southborder` (the twenty-seventh, aimed
  at the planted edge along the south hedge, which nothing else showed) and the seventeenth `backstore`
  (the thirty-third, the store room's own face at the east end of the back wall, which fell off the right
  edge of every view before it). **The newest browser set by time — not by number, the numbering has
  wandered — is `2440-home` … `2456-backstore`**, what v0.59.0 is released on; the set before it is
  `2400-home` … `2416-backstore` (v0.58.1), then `2380-home` … (v0.58.0) and `2320-home` … `2336-backstore`
  (v0.56.0/v0.57.0). `tools/scan_old_new.js` pairs two sets by *counting* from the two numbers
  it is given, so a new camera added at the end of `cameras.txt` simply prints a missing-file line against
  an old set; `tools/scan_old_new.js 2400 2440` is the pair to beat from now on. The drawn set is
  `pictures/drawn-<name>.png`, redrawn with `./tools/views.sh`.
- **`node tools/rawlight.js [--view "..."] [--pick "name:fx,fy;..."] [--exposure 0.25] [--ship 0.76]`
  — what light is actually falling on the tone curve.** It loads the Villa with no curve, no contrast,
  no vignette and no bloom spill and the exposure turned down, turns the byte back into light, and then
  prints what the library's curve and the Villa's own would each make of that light — which is how a
  curve is chosen against surfaces that exist instead of against a drawing of a curve. One exposure
  cannot read the whole Villa: at 0.25 a surface of raw light 4 is at the ceiling already, and the tool
  says which picks need `--exposure 0.0625`. Its `--round`-less columns leave bloom and vignette out, so
  they are the curve's doing and not the picture's; `tools/lights.js` with a plan is the whole picture.
- **The tone curve's own ladders** are `tools/toneprobe.json` (six curves against each other, with picks
  that follow one surface through all of them), `tools/tonefine.json` (the second rung: desaturation and
  the exposure payback) and `tools/tonefinal.json` (the white point, and the exposure). All three are
  `lights.js` plans, so `node tools/lights.js --plan tools/toneprobe.json --size 1280x720` is the whole
  command. Read `>230`, `ceiling` and `lit ... sNN` in what it prints; a repeat of one case moves the
  whole-frame luminance by two or three points on its own, because the water and the grain are both
  animated, so nothing smaller than that is a difference here.
- **A pick is blind to a cut-out.** Any material that is alpha-tested — the fronds, the banana leaves, the
  grass tufts, and the shrub's leaf cards — is still *pickable* where its paint has been cut away, so a ray
  pick can name the leaf and print the colour of whatever shows through the hole. One pick named
  `grassTufts` at 2.2 m and printed (203,171,136), which was the paving behind it. Inside a cut-out, measure
  with `--patch` over a rectangle that is all of that one surface, or with several `--at` pixels, and read
  what the `--pick` *names* only where the surface is solid. **And the same trap swallows a whole material
  row in `tools/cover.js`:** the fifty-ninth session spent an hour believing a shrub measured (40,65,10)
  L56 and was therefore fifty points too dark, when sixty per cent of the pixels attributed to `bushLeaf`
  were the holes between its cards, showing the bush's own interior. `--patch` over the shrub's own disc put
  it at L78 that same minute. A cut-out material's mean in `cover.js` is a mean of the plant, not of its
  leaves. `tools/tuftprobe.json` is the pattern for such a measure: run it
  with `--save pictures/tmp/tuft`, which writes one picture per case, and weigh the cases against each
  other with `tools/pixels.js --patch`.
- **`node tools/tuftfoot.js` — is any of the standing grass standing on stone, or in the water?** It asks
  the Villa's own ground (the same `makeGround` the walk uses) about the foot of every sheet in
  `grassTufts`, and prints how many land on built floor and how many fall in the pool basin. It found 82
  clumps growing out of the far paving in the first plan. `makeTuftPlan` now filters those out itself, so a
  clean answer here means both the filter and the tool agree; if they ever disagree, the ground is right and
  one of them is wrong.
- Debug switches in the url: `?float=1` (the ground stops holding the visitor), `?view=x,y,z,yaw,
  pitch`, `?fov=0.45` (a narrower eye, to match a drawing), `?nofog=1`, `?noshadow=1`, `?sky=`, `?turb=`,
  `?rayl=`, `?sun=`, `?hemi=`, `?env=`, `?exposure=`, `?bloomWeight=`, `?bloomThreshold=`,
  `?sunAzimuth=`, `?sunElevation=`, `?contrast=` and `?vignette=` (the last two nudges, which are in the
  way when a light is being read off the screen), `?tonemap=villa|khronos|aces|standard|lin` with
  `?knee=`, `?white=` and `?desat=` (the Villa's curve, the library's own, and no curve at all: see
  `src/tone.js`), `?shoulder=-40` (a pull on the bright end only, refused: see the sixteenth session),
  `?room=26` (the lamp inside the house, which is what the front of glass is a window onto).
- **Pitch sign**: in Babylon `rotation.x` positive looks *down*. `--view ...,3.14,0.35` looks north
  and down at the pool. A negative pitch looks up.
- Every tool runs `page.setCacheEnabled(false)`, so an old `src/*.js` is never measured by mistake.
- **`node tools/sheets.js` — are the cut-out sheets drawn on both sides, lit on the side you see, and
  does each one's own light cost the same in the CPU drawing as in the browser?** It reads the Villa
  standing in Chromium and fails if a sheet has `backFaceCulling` on (its far side is not drawn at all) or
  `twoSidedLighting` off (a face is lit by the normal of the side it is not seen from), if a surface marked
  `cut` tests no alpha, if the CPU drawing's `glow` has drifted more than about 1.5 times from the light
  the material's `emissiveColor` actually adds once its own emissive pattern is multiplied in — which the
  tool measures by reading the painted canvases back off the live page — or if anything assigns
  `doubleSided`, a name whose setter never reaches `_twoSidedLighting` on this library's PBR material, so
  it changes no pixel and is believed anyway. Under the table it names the leafy surfaces that are not
  sheets whose drawing glow is bigger than their emissive can pay for (fault 23).
- **`node tools/visibleground.js --view "x,y,z,yaw,pitch"` — which ground a view can see, in metres of
  ground.** It picks a grid of pixels in a browser and prints a letter map of what is behind each one,
  plus, per material, the world rectangle it covers and how far off it is. That is how a plan for
  planting, paving or a prop is checked against a view before anything is built — "will grass show from
  where a visitor starts" is a question about metres and angles, and this answers it. **The trap: a pick
  culls back faces whatever the material says**, so a pick map cannot show the far side of a sheet; the
  grass clumps measured 7.2% of a frame with half of them culled and 7.2% with them drawn. Measure a
  sheet with a picture (`tools/compare.js` on two `tools/cover.js` PNGs), never with picks.
- **`tools/cover.js --js "…" --label "…"` measures one camera twice**, once as built and once with a
  change put on the running Villa, and prints each material's own share, colour, spread and extremes for
  both. That is how a change worth two points on a whole frame is seen at all: ask the material, not the
  frame. The change has to be a property the engine reads — see `tools/sheets.js` for the one that is not.
- `tools/foliage.json` and `tools/fringeclose.json` are the leaf and grass-clump probes: a camera under a
  coconut crown (fronds 26.6% of that frame), one at a banana clump, one crouched in the fringe, and the
  standing views as controls, weighed against each other with the far side culled, with the leaf-light
  off, and with the clumps switched off.
- **`node tools/fps.js [url …]` — how many frames a second the Villa is drawn at**, at 1280 x 720 in this
  browser after nine seconds of drawing. New in the thirtieth session, because the notes have quoted a frame
  rate since the twelfth without anything in this folder being able to measure one. Give it a release's url
  as well and it weighs the two: `http://localhost:8090/villa/releases/v0.26.0/index.html` against
  `http://localhost:8090/villa/index.html`. Software WebGL is not a steady machine: read the number as a
  band, and read it as mesh count too (`tools/stats.js` has the mesh tally).
- **`node tools/treeline.js <picture.png> [--col 8] [--print]` — the skyline.** How high up the frame the
  trees come, how many times their top edge steps, and where the sky gets down between the crowns: a wood
  and a fence differ here and nothing else in this folder could say so. Found in the thirty-fourth session.
- **`node tools/crop.js <in.png> <out.png> <x> <y> <w> <h> [--scale N]`** — a part of a picture on its
  own, optionally blown up, for looking at one crown's edge instead of a whole frame shrunk down.
- **`node tools/tint.js --view "x,y,z,yaw,pitch" --show lawn,tuft --out p "js" "js" …`** — a ladder of
  JavaScript run against the Villa in a browser, one picture and one material table per step, so a knob can
  be weighed in a browser before it is written into `src/`. `--fresh` reloads between steps; without it the
  steps accumulate, which is both a feature and (learned the hard way) a way to invent a result.
  **Only `scene`, `camera`, `mats`, `sun`, `pipeline`, `ground` and `walk` are in scope there.** A step that
  says `hemi.diffuse.b *= 0.7` fails — the tool prints `step N failed: hemi is not defined` and then
  measures the built Villa again, which looks exactly like a knob that does nothing. The hemisphere is
  `scene.getLightByName("sky-fill")`.
- **`node tools/ask.js "<javascript with a return>"`** — one question to the Villa standing in a browser,
  answered as text: `scene`, `mats`, the lamps and `BABYLON` are in scope and whatever the code returns is
  printed as JSON. This is the only place a claim about a compiled material can be checked, and the
  thirty-fourth session's "is that pattern even live?" was settled with it.

- **`node tools/bootcost.js [url ...]` — how long the visitor waits before the Villa is drawn.** Page load,
  the moment the Villa answers on `window.__villa`, and the moment its third frame is up, in milliseconds
  from the navigation. The Villa must be there the moment the page opens, and nearly all of the wait is
  `src/textures.js` painting canvases, so a bigger canvas is paid for at every visit: this is the only tool
  that counts it. The sandbox is a slow and unsteady machine — the same build has read 5.0 s and 7.0 s — so
  read these as bands, and always weigh a second address (a release) beside the working tree. Found while
  the lawn went from 512 to 1024.
- **`node tools/canvassave.js <canvasName> out.png [size] key=value… [--tile N] [--over L] [--cut A]`** —
  one painted canvas, tiled `N` times over a dark ground and cut at the material's own alpha, so a lattice
  shows before a Villa is built on top of it. Its size argument was broken until the forty-ninth session
  (it read the output file's name as the size and quietly painted the default), so any tile picture made
  with it before that is the canvas's own default size and not the one asked for.
- **`node tools/lights.js --plan tools/bananaprobe.json`** — the banana's two hard parts, asked at once: the bud
  hanging under a crown and the pseudostem, each with a case per colour tried. Its first case hides
  `bananaLeaf` (`js` on the live scene, the same trick as `tools/bushlayers.json`), which is the ONLY way to
  see a bud or a stem at all — a bud hangs in the crown and every camera a visitor can stand at has a leaf
  in front of it. Same for the stem's colour: a pick aimed at the plant from four metres answers with a
  leaf. `tools/propcams.txt` now carries `banana`, `bud` and `stem` for the same reason.
- **`node tools/pair.js left.png right.png out.png [rule]`** — two pictures of one camera as one picture,
  which is the only way to judge a before against an after. Made the sixty-fourth session, because the notes
  of an earlier session kept promising a "pair" that no tool had ever written.
- **Two tool traps this session walked into, both cheap to avoid.** `node tools/canvasstats.js NAME` and
  `tools/canvassave.js NAME out.png` print `mean 0,0,0` and write a BLACK picture for every opaque canvas,
  `clothCanvas` included — they key everything off the alpha channel and an opaque canvas has nothing to
  show them. A black dump is not a fault in the Villa: check the material on the live page with
  `node tools/dump.js 'scene.meshes.filter(m=>… ).map(m=>[m.name, m.material ? m.material.name : "NONE"])'`
  and read the painted bytes off a browser picture instead. And `tools/pixels.js`, `compare.js` and
  `diffgrid.js` take ONE file each: a shell glob that expands to two (`pictures/10*-pool.png` matches both
  the 1007 and the 1041 set) makes `compare.js` print a luminance gap of exactly 0 against itself. Name
  the file.



### Struck faces: the stones are broken now and not rolled

The pond's corner boulders and rim were bulged spheres — crumpled, but still shaded the way a ball is — and
at arm's length they came out as loaves of bread (`pictures/s81-boulder-before-c.png`). Two geometry tools in
`src/mesh.js` put that right, and both are the kind of thing that only shows up once you name it:

- **`facet(mesh)`** hands every corner of every triangle that triangle's own normal, so a face is one flat
  tone of light. Triangles have to be pulled into independent faces first: a sphere shares its corners between
  neighbours, and a shared corner cannot belong to two faces at once — the last writer wins and half the
  facets leak back into the gradient. Outward is *asked* (does the face normal lean away from the mesh's own
  middle?) rather than taken from the winding, so it comes out right whatever built the mesh.
- **`fracture(mesh, ...)`** folds a lump's crown onto a leaning plane. `crumple` can only push a ball outwards,
  which leaves a dome, and a dome is a rolled river stone; a quarried boulder keeps a where-it-broke face and
  that plane is what catches the light. Folded, not sliced: a sliced sphere leaves a hole, and a hole in a
  stone is a cave you can see the sky through.

The boulders went to six cuts and the rim's fifty-odd stones got faces too. The rim reads as dry-stone edging
now instead of a path of pebbles, and the frogs got better seats: a struck boulder is lower and flatter, and
one of them is now a pedestal a frog sits on in silhouette against the water
(`pictures/s81-frog-on-faceted-stone-c.png`, four metres off).

One measurement lesson worth keeping. `tools/where.js` reported `frog2` at `0..0 px` after the change and I
started hunting a missing frog; a direct projection of the frog's own root from the same camera put it at
(241,533) inside the frame, and a crop of that pixel shows the animal plainly, throat swollen mid-croak. The
tool measures over four moments of the creature clock, and the frog had *hopped* behind a boulder by then —
which is the honest behaviour of an animal that hops between stones a metre apart, not a rendering fault. When
`where.js` says a creature is nowhere, project the creature yourself before you go looking for a hole in the
world.

Released as **v0.81.0**. `feet.js`: nothing WRONG, 81.0% on foot. Browser 60.0 fps, 938 meshes, 1848 of 2048
shader slots. Perch crowns came down with the struck boulders and all still stand above the surface
(0.02..0.38 m over water at -0.035 m).


### The lawn's boulders were six loaves of bread, and are struck stone now

`src/garden.js` laid six plain ellipsoids wearing `mats.stone` in the west lawn. Nothing was done to them: no
working, no tilt, no break. At arm's length they came out as six smooth biscuit-coloured loaves
(`pictures/s81-lawnrocks-before-c.png`), and depending on the light as eggs or turtle shells. They now go
through the same shop as the pond's rim — `crumple`, `skinTint`, `fracture`, `facet` — and they have a grey
granite of their own, `mats.lawnStone`.

Four things this cost, all of them measured off a picture and none of them guessable from the code:

1. **Colour.** The first grey read **L51..88** against grass at **L110..141**: a heap of wet coal. Sunlit
   granite is *lighter* than the lawn it sits in, so `albedoColor` went to (0.63, 0.61, 0.56) and the hollow
   tint from `low: 0.5` to `0.68`.
2. **Proportion.** Width was drawn up to 1.6 m against a height of 0.4: a four-to-one flat, and a four-to-one
   flat is a mound whatever you do to it. They are about two-thirds as tall as they are wide now, and sunk to
   the girth, because the belly of a stone showing above the grass is the giveaway of a stone *laid* there
   rather than set into it.
3. **The pole of a sphere is a fan.** Long thin triangles meet at the pole, and flat-shaded every wedge takes
   its own tone of light: sawn-log rings, on the un-struck lumps too. Seven cuts instead of five and the
   wedges are narrow enough to stop reading as a pattern.
4. **`fracture` was folding only most of the way.** Leaving a tenth of the crown above the plane leaves a
   shallow cone where the face should be, and the pole's fan fans out across *that*: a wood cookie in the
   grass in every picture, at four metres. Folded flat, the triangles are coplanar, and flat-shaded they are
   one face. The face also takes 3% unevenness now, because a perfectly flat break is a machined break.

`pictures/s81-lawnrocks-after-c.png` is the heap at four metres and `pictures/s82-rocklawn.png` is it in
context. The pond's stones wear the same struck-flat rule and were re-photographed after the change to be
sure nothing moved (`pictures/s82-pond-standing-c.png`).

Released as **v0.82.0**. `feet.js`: nothing WRONG, **81.1%** of the garden on foot — a little more than the
81.0% before, because the smaller lumps block less ground. Browser 60.0 fps at 938 meshes, 78 textures.

For the next watch: three of the six still read as low mounds from fifteen metres off, where their struck
faces turn away from the eye — turning one of them over, or moving the far pair nearer the path, is the next
nudge. And `mats.stone` is now worn by nothing in the lawn; it is still the paving and the wall coping's
material and that is right, but the next hand should not reach for it for a rock.


### Weather on the walls: `grimFeet`

The standing set was photographed again (the 2843 sheet) and the worst thing in it was the rear of the house:
a broad plaster plane, evenly bright from its plinth to its eaves — **L121..132** measured up the wall, which
is a flat plane wearing a stipple. That is how a wall looks the day it is pointed and never again.

`grimFeet` in `src/mesh.js` now darkens every plastered wall towards its foot over a metre or so, warms the
dirt (the red keeps its value and the blue is what is lost — dirt is not grey), and waves the dirt line a pace
either way so it does not read as a painted skirting. It is written as a **vertex colour** rather than a
texture on purpose: `mats.plaster` carries a pattern tuned across a dozen sessions and is worn by fascias and
copings as well, and a box face takes one even gradient between its corners, which is exactly what a broad wash
of dirt is. The ramp is keyed to each vertex's height in the world, so the back wall — cut into pieces around
the store door — reads as one dirty wall. Applied in `src/villa.js` after the walls are built, over everything
wearing `mats.plaster` or `mats.plasterDark`.

Measured after: **L91 at the foot rising to L116** at the shoulder, and the geometry was read back out of the
browser rather than trusted — `wallBackPart0` carries `c=0.62..0.71` at `y=0.5` and `c=1.00` at `y=4.25`. That
reading caught a bug worth remembering: the first version leaned the dirt line by `base.x + x + base.z + z`,
which is a *position*, not a wave — a wall standing at z = -11.8 got its grime a metre deeper than one at the
origin. Bounded (`lean * Math.sin(along * 0.8)`) and every wall is dirtied the same three-pace way wherever it
stands. `pictures/s82-rear-c.png` is the view that asked for it.

Released as **v0.83.0**. Nothing WRONG, 81.1% of the garden on foot, 60.0 fps at 938 meshes, 2007 of 2048
shader slots free.

For the next watch: the rear wall still has no reveal around its door — the door is flush with the wall face,
so it reads painted on, and a frame and a step at the threshold would fix it; the two wall lamps are plain
cups; and the rear bed's two shrubs are identical cauliflower balls a metre apart.


### The back door, which was painted on

The rear elevation's door was a plank panel laid flat against a solid wall: same teak, same plane, no depth
anywhere, and a plank border of the same colour. It measured the same brightness as the wall around it and read
as a door painted on. Three things and it is in the wall:

- The leaf is four centimetres narrower than its casing and stands three inside the wall's face.
- Behind it is a board of `mats.darkMetal` a little bigger than the leaf, so the gap between leaf and casing
  is near-black. **That line of shadow is what a door is**, out here at seven metres: the first attempt only
  recessed the leaf, same teak and no gap, and it went on reading as a picture of a door with nine centimetres
  of nothing behind it.
- A threshold stone under the door at the plinth's own top, because the door used to end in mid-air half a
  metre above the grass. Cut coping, not the garden's rock — see below.

Two measured lessons for the ledger. **The rock material is a metre of pitted granite** (`pattern: 0.9`): laid
on a lump two metres across it is stone, laid on a tread half a metre across it is a block of pumice with
holes the size of your thumb, which is what the first threshold came out as — the pattern's scale belongs to
the size of the thing wearing it, and `mats.coping` (0.5) is the cut-stone one. And the door now reads
**L38..52 against the wall at L94..98**, where before it was a panel of the wall's own brightness.

Honest note, because it is the kind someone will otherwise "fix": the threshold is a threshold and not a way
in. `terraceBack` blocks the back of the plinth to walkers, because a visitor who climbed it would be standing
inside the wall. The door is boarded up and the step goes nowhere, which is what it looks like.

Released as **v0.83.1**. Nothing WRONG in `feet.js`, 81.1% on foot, 60.0 fps at 940 meshes, 2007 of 2048
shader slots free. Pictures: `pictures/s83-rear.png`, `pictures/s83-door-close-c.png`.

Still standing from last time's list: the two rear lanterns are plain white cups with a dark lid, and the rear
bed's two big shrubs are identical cauliflower balls about three metres apart.



### The sunbed: a plinth became a bed, and a stacked mattress went back to one

I fixed the lounger three times before it was right, which is the honest record of this entry.

- **Legs.** The frame was one slab `0.8 × 0.1 × 2` on three boards `0.74 × 0.3 × 0.09`. From the foot of the bed
  the near board filled the whole width: no daylight under the bed anywhere, so it squatted like a teak plinth.
  Now two rails at `px ±0.33`, three slats under the pad, and four square legs at the corners. The paving shows
  between the legs and the shadow under the bed is the shape of the bed.
- **The pad went back to one leaf.** I had put a second leaf on top, inset four centimetres, for a piped edge.
  From the *foot* it looked soft. From the *side*, which is where anyone actually sees a sunbed, it came out as a
  mattress stacked on a mattress with a shelf between them (`pictures/s83-sunbed-c.png` caught it). One box,
  sixteen centimetres thick, with the quilted channels on it, says padded on its own. I should have looked from
  two sides before shipping the idea, not one.
- **The back rest.** It stood nearly as long as the bed at `-0.62` rad, hung out past the end of the deck and had
  nothing under it: a diving board. Now `0.52` long at `-0.5`, its lower edge on the pad, with a teak prop from
  the rail to its underside. The prop at the first numbers came through the top of the cushion and stood on the
  back like a splinter in a mattress — 19 cm high at `py 0.43` is what stays out of sight.

Released as **v0.83.3**. Nothing WRONG, 81.1% on foot, 60.0 fps at 960 meshes, 2006 of 2048 shader slots free.
Next: the two shrubs in the rear bed, three metres apart, identical cauliflower balls — no gardener planted
that, and `pictures/s83-rear.png` shows them plainly.

### Lamps and pads: two things that were bright and said nothing

The rear lanterns were pale boxes with a lid, the string lights and bollards were pale spheres, and a sunbed's
pad was a slab of near-white. All three were the same fault: a surface pushed to the top of the tonal range,
where nothing can be seen on it.

- **`mats.lampGlow` is smoked glass now** — (186,184,174), roughness 0.16, `specularIntensity` 1.6. A bulb
  beside the sun is not the brighter of the two: outdoors in daylight a bulb is a smoky bead with one
  highlight and a body barely lighter than what it hangs against. The back-wall lanterns became a dark metal
  case with a lens inset (`backLanternCase` behind `backLantern`).
- **The cushion's cloth came down from (198,180,152) to (112,108,96)** and the pad from **L202..214 with red at
  247..250** (clipped — I darkened the canvas 13% and the pixels moved five points, which is what clipping
  looks like from outside; it took the full step down to make any difference at all) to **L182..200 with
  nothing clipped**. The quilted seam in the canvas went from 2% of the repeat to 5.5% — 1.1 cm on the pad is
  under a pixel at three metres, and a channel's shadow is nearer four.
- **Each pad is two leaves now**, the top one four centimetres short of the lower all round, and the back rest
  has its own top leaf. A single box of canvas is a plank whatever is painted on it; what reads as SOFT at
  three metres is the piped step where the upper leaf stops short.

Tried and dropped along the way: I first judged the pad from a crop taken at the wrong place and thought it was
a white board lying on the paving; the measure at the pad's own pixel said otherwise. `pictures/s83-lounger-c.png`
at five metres is what actually had to be fixed. The back rest still reads as part of the seat at that distance
and the lounger's legs are hidden behind its apron, so the bed sits like a plinth; that is the next thing on
this prop.

Released as **v0.83.2**. Nothing WRONG, 81.1% on foot, 60.0 fps at 948 meshes, 2006 of 2048 shader slots free.

## 86th session — a shark in the pool, and what it leaves behind 🦈🩸

The master asked for a small, very scary shark in the swimming pool that bites a visitor who comes too close,
and for blood that disperses in the water when it does. Both are in, both have been looked at, and neither was
easy in the way I expected.

**A shared loft first.** The koi already bent a tube of rings along three girth tables, and a shark is the same
trick with more of it, so the geometry came out of `src/koi.js` into `src/loft.js` (`along`, `loft`, `fin`) and
both animals now use it. The koi were re-photographed afterwards (`pictures/s93-koi.png`) and are the fish they
were. `loft` grew one new switch, `cut(t, j)`, which leaves ring stations out of the skin and so opens a WINDOW
in the tube: a mouth is a hole in an animal, and the first attempt here was a mouth PAINTED on a closed one,
which collapsed the moment the jaw opened and showed nothing behind the line.

**The animal** (`src/shark.js`) is a metre long — small, as asked — with a fat head, a blunt nose, a knife
dorsal and a mouth far too big for its face. It cruises with its dorsal cutting the surface about half the
time, and when a visitor comes within about four metres of the water it goes through four doings: it drops
deep and turns (coil), throws itself at the edge where the boots are (lunge), shuts its mouth (snap), and
slinks to the floor (sulk). `tools/bite.js` stands the sight at the coping and reads the states as they
happen; a full run is `cruise → coil → lunge → snap → sulk` and the bite lands.

**Three faults the browser caught, and no code could have told me.** (1) The teeth stood on the belly's
surface and their tips came out through it: a browser showed sixteen white flecks on the outside of a shut
shark. They are now hung inside the mouth window and leaned along the jaw, so shut they are buried and open
they are out. (2) The countershading break lay two thirds of the way up the flank, which left nearly the whole
animal white and it came out of the water the colour and shape of a rubber toy; the break is at the lateral
line now, and the dark is the part you see in a pool. (3) `blood.animate` was never called by anything — a
spill sat at the size it had when it left the wound and hung in the pool for the rest of the day. The shark
winds it now.

**The blood** (`src/blood.js`) is a cloud of lumps and not a splat: nine to eleven camera-facing plumes that
come out of the wound, sink and spread while they thin, and three flat slicks that ride up under the surface,
all spent from a fixed pool of meshes and each carrying its own `visibility`. Ordering is the part that could
not be reasoned out from the code: the blood is UNDER the water's film, so it is drawn in `renderingGroupId` 1
and the water's sheet in 2, or a puff near the visitor is nearer than the sheet's centre, is drawn after it,
and fails the water's depth test and vanishes. The pool took six reusable ripple rings for the same reason
(`renderingGroupId` 3) and a bite marks the surface through `pool.splash`.

**A bite's mark on the visitor**: a roll of the camera (`rotation.z`, the one angle the walk never writes to)
gone in half a second, and a red vignette that drains out of the picture's edges over a second and a half.
There is no health in this Villa and none was added.

**Look at**: `pictures/s93-gape.png` (the mouth, held open by `tools/scare.js`, which poses the animal and
holds it against its own behaviour — a snap is a sixth of a second and cannot be photographed by waiting for
it), `s93-side2.png` (broadside at the surface), `s93-blood3.png` (a spill four seconds old), `s93-bite3.png`
(a bite landed from a visitor's own height), `s93-flinch3.png` (what a bite does to the edges of the sight),
`s94-gape2.png` and `s94-shut.png` (the mouth as it stands now, open and shut, half a metre away), `s95-lunge3.png` (the held lunge from a visitor's height) and
`s95-shark-and-duck.png` (the whole pool: a duck, and the shark coming up the middle of it, which is the Villa's
whole story in one frame).

**Two more things the browser settled after the first release.** The bite's red at the edges of the sight was
made by putting red INTO the vignette colour — but that colour is a MULTIPLIER, so painting red in it took the
red away along with everything else and the corner came out brown and five points down (measured, corner against
corner, `tools/scare.js --flinch`). A red flush is made by leaving the red channel alone and taking the other
two with it. And the throat of the mouth was too black to be an animal's: an open mouth that is pure black
reads as a hole in the drawing, so the gullet carries a dark red of its own now and the upper teeth were
lengthened and stood more upright. Released as **v0.92.1** and **v0.92.2**.


**One claim in this note that was wrong, and how it was caught.** An earlier line said the body "reads a little
thin through the middle and wants thickening". Taken at its word I fattened `SPEC.wide` from 0.24 to 0.30 and
the picture looked nothing different, so instead of squinting harder I asked the engine: the bounding box of
`sharkMid` in the running Villa came back **0.296 m broad against 0.184 m tall** — and at the old width the body
was already one and a quarter to one, which is a shark. What was wrong was not the girth tables but the WIDTH,
and my arithmetic had read `flank` as a fraction of the whole width when it is a fraction of the half. The
honest value is 0.26 — fourteen to ten, a bull shark — and that is what is in now (**v0.92.3**). The lesson is
written where I shall read it: a pixel count over a pool of shining water measures the water, a crop measures
what was cropped, and only the renderer's own numbers measure the animal.

**The lunge, held.** `tools/scare.js` takes a third pose, `--pose lunge`, which keeps the animal in its
throwing-itself-at-the-edge state — nose up, back coming through the surface film, mouth wide — and photographs
it. `pictures/s95-lunge3.png` is the first time that attitude has ever stood still long enough to be looked at:
the animal is clearly above the water rather than in it, and the red of the throat is the first thing the sight
meets. Nothing about the behaviour needed changing to get there; only the tool did.


**A red ball where a throat should be (v0.92.4).** Holding the lunge long enough to photograph it from above
showed a red bauble with a white rivet in the middle of the face. The gullet had been built as fat as the head,
so it filled its own window and showed the sight its FACE instead of sitting behind the opening; and the
palate was taking a specular highlight, which three centimetres from a sight is a coin and nothing else. The
gullet is now a hand narrower than the skin (`GULLET_*` down from 0.46 to 0.36 at the widest) and
`mats.sharkMouth` carries `specularIntensity = 0` — the inside of an animal is matte beside its own skin.
`pictures/s95-gape-nocoin.png` is the cure; `s95-gape-top.png`, taken straight down at last, shows the animal
reads as a shark from overhead as well as from the side: broad shoulders, dorsal, both pectorals, tail.

**Still to do.** The dorsal could be swept back more. The eyes are black beads and
never catch the light from a normal sight — held to be right, since a shark's eye is a bead, but untried.
`tools/where.js` does not know sharks exist yet.

## 85th session — the sunbed's back rest learns to lean, and the towel stops being a tile 🛏️🧺

The master went away again and bade me carry on, so I took the fault at the top of the last list rather than
anything new: **the lounger whose back rest read as part of its seat.** It was worse than that, and the
picture said so the moment I stood four metres off at (7.2, 1.62, 6.2): the back was a **second piece of
furniture**, a grey slab parked beyond a pale one. The reason is a plain one — the only thing joining the
back to the bed was the pad it lay against, and the face of it is in shade while the top of the pad is in
sun, so the two never read as one object at any distance.

So the back is built the way a sunbed's back is actually built: **two teak stiles carried up from the side
rails, a teak slat across them, and a thinner cushion laid on the top** — 9 cm against the seat's 16, so the
distance between thick mattress and thin cushion is a hierarchy and not two slabs of the same canvas. The
teak is what does the joining: same warm wood as the frame, showing four centimetres outside the cushion on
either side, making the rake read as a thing leaning instead of a thing parked. Two corrections after the
first build, both from the browser and one of them only from the numbers: stiles 0.78 m long came through at
**both** ends and skewered the cushion like crossed sticks, and it took the world bounding boxes of
`loungerBack` and `loungerStile-0.34` — asked through `tools/ask.js`, 0.12 m of overshoot in z — to see by
how much to shorten them; at 0.70 they end 3 cm proud of the cushion's edge, which is flush to the eye.

**The towel, which the same picture indicted**: it wore `clothStripe`, a mid-brown awning cloth, and lay
half sunk in the pad, so it read as a terracotta tile let into a mattress. It has cloth of its own now —
`clothCanvas` takes a `stripe` and paints the two bands near each end that a real towel wears — at its own
pattern scale, because at half a metre to a repeat a forty-centimetre towel shows no band at all, and it is
folded in two thicknesses so it has a step and a shadow line under it.

**Pictures.** `pictures/tmp-lside4.png` and its crop are the close judgement of the head end; the standing
set after is `pictures/3130-home.png`, `3131-sala.png`, `3132-west.png`, all pinned at half past five
(`tools/photos.sh` pins the hour now, so the standing set stays comparable after the day cycle arrived).
`tools/feet.js`: nothing WRONG, 81.0% of the garden on foot. Released as **v0.91.1**.

One thing I said to myself and then checked rather than believed: I thought I had caught a cockroach on the
paving in `3132-west.png`, which would have meant the night gate leaking at half past five. The pixel
estimate was out of the picture altogether — I had read a coordinate off a scaled image. The gate was sound
(`0/3` roaches abroad at 17.5, asked directly). Note to the next one: a shape is not a creature until the
numbers or a proper crop say it is.

**Noon, while I was in the day table.** The roughest hour in it, and the browser was right about it: sun 70
with a nearly white diffuse and the fill at 7.6 gave a frame that was bright and flat at once — middle band
L136 against L108 at half past five, and the front glass a sheet of cream with no room behind it. A third off
the sun (61), a shade of warmth back into it, a little out of the fill and the mirrors: middle to L125, mean
146 → 136, and the chairs behind the glass are furniture again. **What still blows there is not a fault**, and
I nearly spent an hour chasing it: the middle of the glass sits at (242,201,155) and does not move a single
point with the sun's lamp switched clean off — because the dome keeps its sun, and the glass is mirroring the
sun out of the sky cube. The proof went the other way: at half past five with the room's own lamps off
(`?room=0`) the same pixel falls to (58,53,39), which is what the room actually is. A glazed south front at
noon in this climate is a mirror and a glare; it is left alone, and the whole argument is in the table so
nobody buys the chase twice.

**And the dials had gone quietly dead, which is the more serious of the two.** `?sun=0`, `?hemi=`, `?sky=`,
`?env=`, `?turb=`, `?rayl=` are how half the numbers in this file were got — switch a light clean off and
measure what moved — and the day cycle was writing those same numbers every boot, so every one of them was
being overwritten. My first noon was measured with `?sun=0` reported as doing nothing at all: a lie about the
sun, not about the glass. Each dial named in the address now `locks` its own number out of the day's hands
(`locks` in `src/main.js`, honoured in `src/daylight.js`), and it was checked: `?sun=0&hemi=0` answers
`sun=0 sky-fill=0`. The half-past-five row was re-measured after all of it — mean 115 against the old 114,
ground L135 against L134, in colour 92.6% both times.

**Dawn and sunrise, which nobody had looked at.** I walked the hours I had never photographed — 05:12, 06:24,
08:30, 15:12 — and the numbers told me where the table was thin: quarter past five at mean **L43 with 6.0% of
the frame pure black**, half past six at **L60** with no rake worth the name (the columns threw nothing on the
terrace wall), and the anti-solar half of the dome at dawn the colour of a wet slate roof. The mud is the
SkyMaterial's turbidity: haze with the sun low and behind you is exactly the case where it goes opaque and
grey, and all a north-facing standing view ever sees is that half. Turbidity down (2.6 → 2.1, and 2.3 → 2.0 at
sunrise), the dome up (0.05 → 0.075 at dawn, 0.12 → 0.17 at sunrise), and the sunrise's own sun from 28 to 40
with its fill and mirrors after it — a low sun is weak, but 28 was weak the way an overcast morning is weak,
not the way a sunrise is. After: dawn **L44, black down to 4.0%**, sunrise **L65, in colour 77%**, warm paving
and long shadows on the terrace at half past six, and the deep night's dome lifted 0.014 → 0.019 so the small
hours are a dark blue and not a black ceiling. Mid-morning (L118) and mid-afternoon (L135) needed nothing:
the rows were already right and it felt good to leave two alone. The hour frames are kept as
`pictures/3150-dawn.png`, `3151-sunrise.png`, `3152-morning.png`.

**Next.** The two cubemaps go stale between their refresh hours, which shows at dawn as a pool mirroring a
sky brighter than the one over it. The pad's shaded side reads much darker than its top (honest light, but it
is why the bed still wants to look like a slab). And `tools/draw.js` still paints one fixed half past five and
knows nothing about any of this.

## 84th session — the Villa keeps a day, two fireflies go out with it, and somebody left a duck in the pool 🌗🦆✨

The master's edict came in three parts, and the last two only make sense together: **two fireflies**, **a
day-night cycle with the cockroaches kept to the night**, and **a single yellow toy duck in the pool**. A
firefly needs a night, and a night needs lamps, and the Villa had neither.

**The duck first, because it is the smallest thing and the quickest delight.** `src/duck.js`: nineteen
centimetres of moulded plastic — body, fuller chest, lifted tail stub, head, cone of a beak, two beads for
eyes — floating at the pool's own water height, bobbing, rolling a beat behind the bob, and drifting within a
metre of where it was left on two sines that share no period, so it never rows a lap like a clock hand and
never rubs its cheek on the coping. At the standing start it paints a **17×19 px patch at mean 215,164,34**,
and it is the only saturated colour for fifty pixels in every direction, which is what a bath toy is for.
The browser corrected it twice: the first one was **brass**, not plastic (`roughness 0.4`, sheen 0.5 — a
mirror on a moulding), and its tail was a second head, too fat and too high, so from the far coping the duck
had two bumps on it.

**The day is one table.** `src/daylight.js` holds eleven hours written out in full — sun azimuth, elevation,
intensity and colour, sky fill, ground bounce, the dome's three numbers, the haze's colour and density, the
environment's strength, and a `night` number from 0 to 1 — and mixes between them with a soft step. No
formulas. A sun path solved from latitude and declination was tried first and thrown out: this Villa's half
past five stands at azimuth 160, a low southern sun, and an ephemeris would have put it in the west and
lit the front of the house from the wrong side of the argument. **The row at 17.5 is sacred** — it carries
the old bytes exactly (sun 60 at 1,.71,.46, sky fill 6.8, bounce 6, haze .52,.62,.5 at .005, environment
0.4), because every picture in this folder was measured against them, and after the whole thing was wired up
the start view came back at mean 115 against the old 114 and in colour 92.6% both times, which is the
nearest to "nothing changed" that a re-wiring ever gets.

The lamps ride the same `night` number, so dusk cannot leave one bulb half-lit while its neighbour is already
burning: the garden bulbs go from an off grey to an amber loud enough to trip the bloom, the room's lamps
come up half again, the pool's two fittings turn back into the lamps they are shaped like, and the water's own
cyan — which is the sun that came through it and bounced off white tiles, and so has no business at midnight —
drops by half. `?hour=21` starts the day anywhere, `?daylen=0` pins the sun, `?still=1` pins it too, and
`tools/photos.sh` now pins it by default (the hour it photographs the garden at is in the picture's meaning),
with `HOUR=21.5 tools/photos.sh night` for the dark. The line of type under the villa's name says the hour in
words, on the quarter hour: "half past five", "quarter to six".

**Two fireflies, and the night is theirs.** `src/fireflies.js`: two and a half centimetres, a six-millimetre
light organ flashed for a third of a second out of a period of two, banking into every turn because the
heading is read off the path a twelfth of a second ahead, and a long rest dark in a grass tuft. By day they
are switched off, and so — on the master's word — are the cockroaches; the butterflies are shut up at night
with their wings folded, which is the one honest thing in the whole arrangement. Measured with
`tools/fffoot.js` from the standing cameras that see them: **280 px of glow at the `west` camera and 168 at
the `pondbank`**, cores at L239 and L235. Three corrections, all from pictures: the first ones were **dots**
(a light organ is a point; the finger's-width scatter round it is what the eye is actually given, and this
Villa's bloom is tight on purpose, so the scatter is painted as two shells of lit glass); the west one
floated at 45 cm, which put it in the bottom corner of the frame behind a banana, and it cruises at chest
height now; and `wasNight` in the day cycle began `false` instead of `null`, so on a morning start nothing
ever crossed the half and the cockroaches were found walking about at noon with the fireflies awake beside
them.

**And the duck swims at night too**, which nobody asked for and everybody notices.

**Pictures taken.** Day, pinned at half past five: `pictures/3100-home.png`, `3101-west.png`. Night at half
past nine: `pictures/3120-home.png`, `3121-west.png`, `3122-pondbank.png`. Hours as studies:
`tmp-noon`, `tmp-dusk`, `tmp-afterglow`, `tmp-night-home` (cleaned after). Checked again after every one: the
afterglow sky was a **black board** until the sun was left a degree above the line and the dome lifted to
0.075; the night pool was a shampoo bottle until its emissive came down; and setting the hour at boot
re-prefiltered the sky cube a second time and took **four points of light** out of the whole frame — 110
against 114 — which is the sort of loss that only a measurement catches, and is now written down in the file
so nobody re-buys it. `tools/feet.js`: nothing WRONG, 81.0% of the garden on foot, 80 floors, 136 blockers.
The browser runs the whole night at 60 fps with the two cubemaps redrawn at eight and four points of the day.

**Next.** The noon sun is the roughest hour in the table: the front plaster goes pale and flat under it because
a near-overhead sun rakes a vertical wall worse than a low one, and the row should be lifted at the top and
taken out of the fill. The mirrors are stale between their refresh hours, which shows on the pool at dawn as a
mirror slightly brighter than the sky above it. The lounger's back rest still reads as part of its seat at
five metres. And the CPU drawing (`tools/draw.js`) knows nothing about any of this: it still draws one fixed
half-past-five, and `tools/sheet.js` will go on agreeing with itself while the browser says something else.

## 83rd session — the pots are thrown and planted, and the lounger's pad is canvas again 🏺🌿🛏️

The master went AFK and bade me carry on, so I took the list at the foot of the last entry in its order.

**The lounger's cushion (first on the list) was not a cushion.** `cushionCanvas` was painting its base
[112,108,96] — a wet greige — and a browser at the west deck had the pad's shaded side at **57,56,48, L56**
while its sunlit top sat at 212,183,146: a sunbed wearing a strip of bitumen, and it was the one dark mark
on a bright deck so the eye went straight to it. The base is [196,183,158] now — a pale warm canvas — and
the shade came up to **93,88,70, L88** while the sunlit face came *down* to 210,177,135 (red 210, so the
quilting has headroom above it again). The thing that actually owed the money was the sheen: a cloth at
roughness 0.88 with `specularIntensity` 1 (the library's default, which is the shine of polished steel)
does not merely glint, it clips, and it was that white glare that had put the pad's red at 250 in an earlier
session and set off the darkening in the first place. Sheen 0.3. `src/surface-colours.js` had been painting
the pad pale all along, which is how I know the drawing was honest and the browser was the liar.

**The pots were paper cups and now they are pots.** Five of them, each a `cylinder` — one straight taper,
no foot, no belly, no lip — with a clipped green ball on the mouth. `revolve` is new in `src/mesh.js`: a
profile of `[radius, height]` pairs spun once about the vertical axis, run up the outside, over the rim and
back down the bore so wall, lip and hollow are one mesh. Three shapes (`urn`, `basin`, `jar`), each with a
slight egg, a turn and a little more or less height per pot. Six plantings in them — lemongrass (the lawn's
own old splayed clump: lemongrass is a grass), chilli with its pods hanging at the skirt, kumquat with
fruit, marigolds with their heads on top of the cushion of leaf, basil low and wide, and the plain mass for
the room behind the glass. Three browser corrections on the way: chilli pods standing upright (chopsticks),
crowns sitting on the mouth like a lid laid on a jar, and the great pots floating four decimetres above the
paving because the old cylinder's `py` was its middle and the new revolve's `py` is its foot.

Pots, too, are not clipped with hedge shears: a pot plant is pinched out by hand, so `clip: 1` for the pot
crowns. Sheared, a herb in a jar reads as a green coin in a pot (`pictures/tmp-pot-court.png`).

Standing set: `pictures/2940-home.png`, `2941-sala.png`, `2942-path.png`, `2943-west.png`,
`2944-colonnade.png`, `2945-frontcorner.png`, and `pictures/tmp-sheet.png` was the contact sheet that found
the next fault (since pruned). Released as **v0.90.0**. Nothing WRONG in `tools/feet.js`, 81.0% of the
garden on foot, 58 fps at 1111 meshes.

**Then three faults the pictures turned up on the same pots, and `v0.90.1` for them.** (1) A grass clump's
`tint` is a MULTIPLIER read as bytes from 0 to 1, and I handed it one in 0-255: the lemongrass came out at
(254,253,190), 218 blown pixels in `pictures/2940-home.png`, and the release preview showed a yellow-white
starburst sitting on the terrace that looked for all the world like a lamp. It takes its tone off `lawnTone`
at its own place now, a little paler and yellower than the sward. Blown pixels there: 0. (2) `revolve` laid
the clay pattern with its own top at the pot's foot, so the lime crust sat on the belly and the damp band of
a foot that never dries sat on the shoulder — `flipV` puts each where it belongs. (3) The court pair and the
great pair stood at the same distance from the water, and from the start place a small jar sat dead behind a
big one: not two pots but one pot wearing a bucket. The court pair is a metre nearer the pool now.
`pictures/2950-home.png`, `2951-path.png`, `2952-west.png`, `2953-frontcorner.png` is the set after; 60 fps
at 1111 meshes, 81.0% on foot, nothing WRONG.

**And the pots were inside out, which took three pictures and two probes to believe.** `revolve` was wound by
the right-hand rule — profile up, angle counterclockwise, cross product outward — but **Babylon counts a face
front when its vertices go CLOCKWISE**, the other way round from the rule. So every thrown pot showed its far
wall through its own near one, and the flat pale patch of the terrace wall that appeared on the belly read as
a chip in the clay; the wheel rings and the crust had gone out of the surface with the true near wall. I asked
it twice before I believed it: a ray fired at the pot from the west and from the south hit it at every height
from 0.16 to 0.96 (a pick does not care which way a face is wound, so that test could not find the fault),
and it was switching `backFaceCulling` off on the clay — the pot going flat black, which is what an inverted
shell does — that named it. Winding reversed in `revolve`, and the clay came back with its rings, its grit and
its crust (`pictures/tmp-pot-fixed-c.png` was the picture that settled it). The marigolds went from buried in
their own leaves to floating over the crown like bubbles, and now sit in the top of the cushion with a deeper
gold; a lemongrass clump's `tint` was already fixed above. Set after: `pictures/2970-home.png`, `2971-sala.png`,
`2972-path.png`, `2973-west.png`, `2974-frontcorner.png`. Released as **v0.90.2**: nothing WRONG, 81.0% on
foot, 57-60 fps at 1111 meshes.

**Next, and what the measure said about it.** The list I wrote at the end of the last session said the garden
lamps were blown white discs. They are not: `pictures/2974-frontcorner.png` has 94 pixels over L248 out of
921,600 and `pictures/2970-home.png` has 26, and every one of them is sky or the sparkle on the water — the
bollard's brass shade reads gold and the string bulbs read pale and small. What had looked like blown lamps
was the lemongrass starburst and the two pots lining up, both fixed above, and the lamp item is closed until
someone puts the Villa at dusk (the lamps do not switch on: the Villa is permanently at half past five, and
`mats.lampGlow` is a fixed emissive). What is genuinely left, in the order I would do it: the lounger's back
rest still reads as part of its seat at five metres and its legs hide behind its apron, so the bed sits like
a plinth; the koi's far half of the basin is still a mirror, so a fish that loiters there is a fish nobody
sees — either keep the bold ones to the near half or give that half of the water a little more of its bottom
back; and the CPU drawing still lights its greens without a ground-bounce term (item 4 of the fault list).

## 82nd session — four koi in the pond, and what a sheet of water will not give back 🐟🪷

(The 81st session's successor was a paving session and is not written up separately: it relaid the court in
courses of sawn stone and was released as **v0.88.0**. Its numbers are at the head of `CHANGELOG.md` and the
before/after pictures are `pictures/s88-paver-before.png` and `pictures/s88-paver-after.png`.)

The master asked for koi in the pond, and it is the best addition this garden has been given: the pond had
water, stones, lilies and frogs and every one of them sits still. Four of them are in now — `src/koi.js`, a
hand-lofted body in three parented segments so a bend runs backwards down it, a caudal fin on a hinge of its
own, a dorsal sail, two pectoral paddles that row, two beads for eyes — with three skins painted in
`koiCanvas` (`kohaku`, `gold`, `lacery`) and materials in `src/materials.js`. They cruise, they rest, they
come to the bank beside whoever is standing there, and the shy one drops for the far rim when a boot comes
near. A back near the surface pushes a wide faint swell out from it, which is `pond.splash` with a new shape
(`across`, `span`, `show`, `life`) — see `src/pond.js`.

**What the browser made me fix, in the order it made me fix it.** Every one of these was a picture and not a
number: (1) 0.30 and 0.34 of its length across and deep was a fat grub with a sail on it — 0.24 and 0.30, and
the tail is a paddle on a stalk, not a continuation of the loaf; (2) a `environmentalIntensity` of 0.6 and
specular 0.35 turned a fish under the surface into a chalky grey slab the colour of the water round it, so
the sheen is 0.3 and 0.2 now and the pattern does the talking; (3) the saddles went over the crown and the
eyes sat high on the head, and end-on that is a red mask with two black holes in it — a ghost, not a carp
(`pictures/tmp-wedge.png`, since deleted, but the finding is the point): a show kohaku has a clean head, so
the pattern now stops at u = 0.8 and the eyes are small, low and wide and no longer mirrors; (4) saddles
tall enough to reach down the flanks came out as a tomato, and the ratio that reads is 1.15-1.5 of the
saddle's own width; (5) 26-40 cm fish at five metres are not readable as fish at all, so they are 34-52 cm,
which is what a pond this size should be stocked with anyway.

**The one thing to remember about a fish under water.** Where the eye grazes a sheet of water it is a mirror
(`src/water.js`), so the far half of the basin gives its fish back to the sky and only the near half is
transparent. Measured from the standing place on the bank with `tools/where.js`, and the measure is steep:
**a back 1 cm above the surface line paints 170-330 pixels of a 1280x720 frame; the same back 3 mm under it
paints 2-8**, and a fish that is crossing end-on paints about the same however shallow it is. Frogs for
comparison are 150-520 px. So the four of them are written to break the surface about one spell in four and
to come to the near bank when a person is there, which is what a pond fish does anyway and is also the only
way it is ever seen.

**`tools/where.js` was lying, and now it is not.** It counted the animal's pixels only inside the box its
own magenta paint-marking had found, and a koi painted flat magenta and seen through half a sheet of
tea-coloured water comes up a muddy brown, fails the magenta colour test and reports `covers 0 px` while
plainly filling the frame. `windowRound` now gives the honest count somewhere to look when the magenta is
not found (a square a ninth of the frame across, centred on the creature's own pixel). Every creature in the
garden is now found from the bank: `seen from here: 15 of 15`.

Standing set for the pond: `pictures/2930-home.png`, `pictures/2931-pondbank.png`, `pictures/2932-pondlawn.png`.
Released as **v0.89.0**. Nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 1087
meshes with the four of them swimming.

**Still to do, and I would do them in this order.** The lounger's cushions read near-black at five metres
(`pictures/2916-west.png`); the pots are onions and moss balls and want to be pots with rims and six
 different plantings in them (`pictures/2910-home.png`); the garden lamps are blown white discs instead of
 warm half-past-five glows (`pictures/2914-sala.png`, `pictures/2922-colonnade.png`); and the koi's far half
 of the basin is still a mirror — a fish that loiters there is a fish nobody sees, so either the bold ones
 should be kept to the near half or that half of the water should be given a little more of its bottom back.

## 81st session — the frogs go in, and the pond rings

The standing set was photographed in one contact sheet (`tools/sheet.js --set 2824`, 19 views at once, which
is how to look at the whole garden in two reads instead of nineteen) and measured where it might be lying:
the pond's water along its own centre line from the lawn camera reads **L38..59** against grass at
**L81..154**, which is a shaded pond and not a black slab — the thumbnail had frightened me for nothing, and
the rule that a measurement outranks an impression held again. The lawn at the east view varies **L93..167**,
so it is not a flat carpet either. Nothing WRONG was found in the set, so the session went to the one thing
the frogs could not do.

**They now dive.** Each of the three at the near bank weighs where the visitor is standing — `visitor()` is
handed over from `src/main.js` as the camera's own position — and within about two paces it turns its snout
at the middle of the water and goes over the stone's edge: a flat leap of half a metre, nose pitched down,
`long * 0.3` of arc at the top of it. Then it is under: `root.setEnabled(false)`, and it comes back onto the
stone it came from (`f.home`) when its nerve comes back. It will not come back while the boot is still there:
`f.hides` carries up to three refusals, so a visitor at the bank gets one show and then the pond is quiet,
instead of a frog surfacing the instant it sinks like a cork. Two of the five are `bold` (the far north-west
boulder, the north-east corner) and sit out the whole business, which is what habituated frogs do at a real
pond and is also what keeps two of them on screen for whoever is looking.

**A ring goes out where the frog entered** — five flat rings lying on the pond, spent one at a time by
`splash(x, z)`, born at 0.3 m, out to about 1.35 m, `visibility` on a square of the time left. Three things
learned and written into the code: the ring's texture carries its strength in the colour *and* the alpha of
every pixel, because a material may read its opacity from either and the two must not disagree; `disableLighting`
is on, since the water it sits on is the darkest thing in the garden and a ring lit by that light is
invisible exactly where it is wanted; and they stay in the ordinary draw order, because a ring raised into a
later draw group paints itself over a stone that stands between it and the eye. The first setting came out at
**L190 on water at L55** — a painted target — so the emissive is a third of that and the ring is a few points
of light. Measured over its life: `d 0.42 v 0.47 → 0.72 v 0.22 → 1.0 v 0.07`.

Two bugs, neither of which said anything when it happened. The dive's arc was driven *after* the state
chooser, and on the frame the leap ended the chooser had already picked the next state and returned, so the
frog never reached the water and never splashed: no error, just a frog that sat down again mid-air (the tally
showed `dive` and no `under`, which is how it was caught). And `pond.animate(time)` was never handed a delta,
so every ring was laid down and then sat on the water for the rest of the day — `d 0.3 v 0.85` in 14
consecutive samples. Both are commented where they were.

How the leap was photographed at all, since it is 0.38 s of a 13 cm animal: `engine.stopRenderLoop()`, then
`creatures.animate(0, 0)` to apply the pose the frame was caught at, then one `scene.render()`. Nothing was
laid out by hand; the clock was stopped and the frame drawn once. `pictures/s81-frog-dive-c.png`. Note for
the next hand: at arm's length the leap itself is about two centimetres of screen — what a visitor sees is a
stone that was holding a frog, and a ring going out from it, which is exactly what there is to see at a real
pond.

Released as **v0.80.0**. `tools/feet.js`: nothing WRONG, 81.0% of the garden on foot. Browser: **60.0 fps,
938 meshes, 11 lights, 77 textures**. `tools/where.js` from the south bank with the clock stopped: all five
frogs there and findable, frog1 covering 629 pixels at 2.39 m. Headroom 1849 of 2048 slots.

For the next watch: the near boulders at the south-east corner are smooth brown loaves next to the chinked
rim, and could take a chiselled edge; the rim's row-ness returns when the pond is seen from above, though at
a visitor's 1.62 m it does not; and `tools/where.js` still picks `pondBoulder2` at frog1's own pixel at some
clock moments, which is a stone in front of a frog and not a missing frog.

## What was done this session (80th, 2026-10-18) — a pond in the west lawn, and four frogs on its rim 🐸💧🪷

The master's list had three things left on it: a cockroach (done), three butterflies (done), and a pond with
a few frogs in it. This session built the pond, put four frogs on its rim, and spent most of its time on one
line of grey.

### What stands now

`src/pond.js` is new: a sunk rectangular basin at x −23.0..−17.6, z 12.8..16.4 — an empty corner of the west
lawn, out of sight of the pool and of the sala — with

- a **ring of four slabs** for the sides and a floor under it, all wearing `mats.pondSilt`: the tops of the
  ring are the band of damp gravel between the grass and the water, the inner faces are the lining, and the
  outer faces are what closes the joint with the lawn;
- a **sheet of water** on the pond's own patched shader (`villaPondWater` in `src/water.js`, which now takes
  a `name`, because the numbers are baked into the shader text and the pond must not repaint the pool);
- **thirty-one rim stones and four corner boulders** in `mats.pondStone`, straddling the edge, each one a
  different length, height and tilt, and each one a perch offered to a frog;
- **ten lily pads** in three knots of different age, none of them at the near edge, where a person stands;
- `walkBlocks` so the walk refuses the water, `inPond()` so the garden grows no grass in the basin, and
  `pondHole` so `src/world.js` cuts the lawn into pieces round the water instead of floating a plane over it.

`src/creatures.js` grew `makeFrog` and `croak`: four beasts at `FROG_SHOWN_CM` 13 against `FROG_REAL_CM` 8
— the same licence the cockroach was given, and for the same reason, that a small thing nobody can find is
not a feature — sitting on a stone's actual crown, breathing, croaking with the throat and the eyes sinking,
and hopping a short way to a neighbouring stone. `?frog=` dials the size live.

### The grey line, which was not a colour

The first pond had a pale grey line all round it, and every colour I changed left it there. A ray fired at
the pixel answered `none` — the eye was looking at the sky *behind* the garden through a slot between the
lawn's cut edge and a gravel band that only slipped 3 cm under the turf (`pictures/s80-pond-edgefault-c.png`,
and `scene.pick` at the pixel to prove it). A sunken flat band has no thickness to close such a slot at any
width: the shallower the eye, the further a sight travels under the grass before it is stopped. The ring is
therefore 45 cm wide under the lawn and stands only 2 cm under the grass, and the water was brought up to
3.5 cm so the step at the water's own edge went from 6 cm of black lining to 1.5 cm (`pictures/s80-pond-gutter-c.png`
was the black gutter before it).

Two faults the pictures caught that no amount of reading the code would have:

- at equal spacing the rim read as a **row of beads** and the pads as polka dots (`pictures/s80-pond-beads.png`);
  the spacing, the lengths and the sizes are jittered now and the pads are laid in knots;
- to calm the sparkle I put the water's roughness up to 0.12, and it smeared the sun's one highlight over the
  whole sheet: from a first-floor window the pond was a plate of pale foil (`pictures/s80-pond-foil.png`).
  It is glass-smooth again at 0.05 with a gentler chop than the pool's, and it reads dark.

### What the pictures say, and what is left

`pictures/s80-pond-standing.png` and its crop `s80-pond-standing-c.png` are the view from the south bank at
eye height: dark green water with a fine chop, pads at three sizes, a broken rim of flat stones, and two of
the four frogs plainly visible without hunting. `pictures/s80-pond-overhead.png` is the whole basin from
16 m up, which is the honest test of the rectangle: it still reads as a rectangle, and the four boulders and
the irregular rim are what keep that from being ugly.

Released as **v0.77.0**, and then **v0.77.1** for one thing the last picture of the session showed: the four
corner boulders read as coconuts from the west lawn, so they are squatter and harder crumpled now. The
pond as it stands is `pictures/s80-pond-standing.png` and its crop, and `pictures/s80-pond-west.png` is
the approach from the west, which is the view that decided the boulders.

`tools/feet.js` now builds the pond too, and was told about it: the water, and open water off the north bank,
are kept off; both banks and a rim stone are walkable and reachable; 80.9% of the garden is still reachable
on foot (it was 81.8% before the water was dug). 60 fps at 892 meshes.

Next, in the order I would do it:

1. The stones are still a little **biscuit-coloured** and their tops are all fairly flat: a greyer skin and a
   broken edge or two would suit them. `mats.pondStone` is where to start.
2. **One frog should be put where the visitor will find it without looking** — the cockroach taught that
   lesson twice. The south-west boulder is good; a frog sitting there at the start of the clock would be
   found at once. `FROG_SPOTS` in `src/creatures.js`.
3. The lawn's cut edge round the pond is a **straight line** at the two far corners, where no stone happens
   to lie. One more stone at each corner would bury it.
4. Frogs are silent here. If sound ever comes to the Villa, the croak has a trigger already (`croak` in
   `src/creatures.js`).


### The same evening, on the master's leave: the rim was closed and the fifth frog was posted

Three things from the list above, done while he was out of the room.

- **The band between the grass and the stones was a black gutter, not damp gravel.** Measured on the bare
  strip: (20,18,7), L15, where the grass beside it is L100 and a wet stone under the same sky is L45. A pick
  at the pixel said `pondSilt`, so it was a colour and not a hole this time. `mats.pondSilt` went from
  `paint([46,44,34])` to `paint([138,124,92])`, its emissive up with it, and its share of the sky's mirror
  from 0.3 to 0.55: the same strip now reads L33 and looks like soil that has been raked wet. The water took
  about ten points of it, since the bottom shows through, and stayed dark.
- **Chinking.** A dry-stone edge is big stones with handfuls of small rock wedged between them, and the gaps
  in the rim were where the lawn's straight cut edge showed through — the one line that gave the pond away as
  a rectangle from across the grass. `pondChink0..24` now fill any gap over 30 cm, laid low and pushed a
  little outboard for that reason, and the rim reads as one continuous edge from twenty metres off
  (`pictures/s80-pond-west.png`). They are perches too, and floors for the walk.
- **A fifth frog on the north-east corner**, which is the corner a walker coming from the paving rounds
  first: four of the five sat on the south and east, which is where the camera was kept, and that was the
  error and not the pond. `pictures/s80-pond-northeast.png` is the open lawn looking back at him.

`tools/where.js` counts frogs now, alongside the butterflies and the cockroaches, and the answer from the
south bank is `seen from here: 5 of 11` with the frogs painting 81, 120, 178, 377 and 647..700 pixels and a
pick down each one's own pixel naming its own body (`pictures/s80-where-frogs.png`). From the lawn the two
nearest are partly behind a shrub at four moments of their loop, which is written down rather than hidden:
the fix if it matters is to move that shrub, not the frog.

`tools/feet.js`: 81.0% of the garden still reachable on foot, the chinking stones read as floors (81 of
them), the water still kept off. 60 fps at 933 meshes. Released as **v0.78.0**.


### And then the pond got its marginal grass, and two cameras of its own

The bald ring gave it away: `makeTuftPlan`'s filter threw out every clump within 40 cm of the water
(`inPond` had that margin baked in), so the gravel went bare from the stones outwards and the lawn started
half a metre from the edge — a swimming pool, not a pond. `inPond` is 6 cm now, a new `inPondStone` keeps a
clump out of the fifty-odd rim stones (`buildPond` fills `stoneFeet` as it lays them), and four `fringe`
calls lay sedges round the rim in drifts — young upright shapes, `ageFrom: 0.1`, because the old splayed
shape at that size reads as a small palm at arm's length. The south fringe is the sparse one on purpose:
three of the five frogs sit there and grass in front of the feature is grass in the way of the feature.

`tools/tuftfoot.js` builds the pond now (it did not, so its answer about the pond was vacuous) and says
`3847 sheets looked at; 0 places on built stone, 0 in the pool`. `tools/cameras.txt` gained `pondbank` and
`pondlawn`, photographed as `pictures/2819-pondbank.png` and `pictures/2820-pondlawn.png`, so the pond has a
fixed picture each session from here in. Released as **v0.79.0**.


### One experiment built, measured, and taken out again: a mirror for the pond

The pool mirrors the villa because `main.js` fills a cube from the pool's own surface. I gave the pond the
same treatment — a second `RenderTargetTexture`, a camera at the water's height, the pond's own parts left
out, filled once after the first frame — and measured it with the water's baked sky turned off on both sides:
at the south-bank camera the water read **L26..32 with the cube against L36..42 without it**. That was all it
bought: ten points of darkening and nothing to see in it, because a basin this shallow has no far bank for
the sky to lean on and its lower hemisphere is empty air under a floor that was deliberately left out of the
cube. It is out again, and the numbers and the reason are left in `src/main.js` where the code was, so nobody
builds it twice. A pond five metres across is seen *through*: silt beneath, chop on top, and the sky only
where the eye grazes it — which `src/water.js` already pays for.

No picture changed, and nothing about the walk changed. Released as **v0.79.1**, which is that comment and
nothing else.


### The pads were coins, and are leaves now

Every pad was a squashed cylinder: a perfect circle, level as a billiard ball, ten of them wearing the same
painted veins at the same angle. A water lily's leaf is a **circle with a wedge cut from the rim to the
middle**, and `makePad` in `src/pond.js` cuts that fan now — a different slit and a different direction on
every pad, two slow wobbles on the rim so it is scalloped and not a polygon, and a tilt on each so one edge
is in the water and the far one is dry. It is built about its own middle, so its place and its tilt are the
mesh's own `position` and `rotation`, and `animate` still bobs it.

The lesson for the next hand that writes a hand-cut disc: **wound the wrong way it is simply not there.** The
first version culled from above and the pond lost every pad in it — no error, no dark patch, nothing in any
picture, while a projection of their own positions went on cheerfully naming their pixels at (469,579) and
so on. The winding that works, and the reason, are in the function's own comment. `pictures/s80-lily-close-c.png`
is three pads at four metres and the notch of the big one is plain.

Released as **v0.79.2**. `tools/feet.js` is unchanged: 81.0% of the garden on foot, nothing WRONG.

## What was done this session (78th, 2026-10-18) — the creatures were FOUND at last, and there is a tool that counts them 🔍🦋🪳

The master walked v0.74.0 and reported, plainly, that there were no butterflies and no cockroach. He was
right: they were in the scene and nowhere on the screen. So this session did not add anything. It made
what is already there be seen, and it left behind a tool that can tell whether a small thing was ever
drawn at all.

### The fault, measured

`tools/where.js` (new — see its own header) stands a camera where a visitor stands, stops the Villa's
clock, then turns the creatures' clock by hand and draws the same moment twice: once as built, once with
that creature's meshes taken out. Every pixel that moved IS the animal; the magenta it is painted for the
measuring is kept as a second opinion and to find it in the frame. Asked of the standing start against
`releases/v0.74.0`, it answered:

```
butterfly7   6.92 m  covers 5 px   drawn (123,82,44) on (184,147,80)   picks butterflyBody
butterfly8  13.05 m  OUT OF FRAME  0 px
butterfly9   6.92 m  OUT OF FRAME  0 px
cockroach    6.11 m  BEHIND YOU    0 px
```

Five pixels of a 1280 by 720 frame. That is not a butterfly; it is a speck of dust on the lens, and a
person will not stop for it. Four separate faults were underneath it, and only the first was a size:

- **SIZE.** 6.8 cm butterflies are small garden butterflies; out here a butterfly is a birdwing at eleven
  centimetres, and the house cockroach is four and a half centimetres, not three. Both are real animals
  now. Every cockroach part is a fraction of `long` (nose to tail-tip), so changing the animal changes its
  legs and its antennae with it, and it stands on its feet at `long * 0.32` instead of lying on its belly.
- **PLACES.** They lived in corners nobody stands: the west verge at ten metres, the far paving behind the
  visitor. The frame is the constraint and it was never written down: from the standing start the picture
  covers about 0.9 metres either side for every metre of distance, and everything nearer than five metres
  is *water*, because the visitor's own paving is below the bottom edge. Two butterflies now hang over the
  coping at the pool's near end — four metres off, at chest height and at eye height — the cockroach's
  patch is the paving a visitor stands on and looks down at, and the third butterfly keeps the west bed for
  whoever walks round the water.
- **THEY FLEW AT YOU.** The wing hinge runs along the creature's own back, so a butterfly coming straight
  at you shows the edge of its wings: about ten pixels of pink sliver, however big the beast is. Crossing
  your view shows the whole face of them. So each patch is now `eastWest` and `northSouth` instead of one
  `range`, wide across the visitor's line and shallow along it — the swing is a mannerism *and* the fix.
- **THE WINGS WORE A MIRROR.** The Villa's oldest fault, ninth time round: a new PBR material ships with a
  mirror's `specularIntensity`, and a wing wearing a mirror is a sheet of sky — at half a metre the orange
  one came back (230,200,170) with a pale blue rim, cream instead of orange (`pictures/s79-near12.png`).
  They keep 0.15 of the mirror now. The three glows were doubled at the same time, because a wing that size
  is lit by the sky it hangs in and the sky alone had it drawing (123,82,44): a butterfly painted as its own
  shadow. A wing is half window; now it is lit like one.

### What the same question asks now

```
butterfly7   4.73 m  covers 64..82 px    drawn (182,127,80) on (202,177,139)
butterfly8   3.33 m  covers 58..117 px   drawn (148,136,102) on (78,84,42)
butterfly9   9.74 m  OUT OF FRAME  (on the west bed, for the visitor who walks)
cockroach    1.22 m  covers 263 px       drawn (84,56,23) on (169,143,100), gap 85,87,77
            + at 2.9 m from the paving: 18..22 px, same gap
```

Look at `pictures/s79-final-butterfly7.png` and `-butterfly8.png` (six times life): they read as a
butterfly, wings and body and all, over the pool's cyan and the dark planting. Compare
`pictures/s78-work2-butterfly7.png`, which is what v0.74.0 offered at the same place. The roach at arm's
length (`pictures/s79-roach2-cockroach.png`) is a brown oval with a paler shield and antennae longer than
its body; from a metre and a half it is a dark insect on sandstone, which is what it is.

### Two lessons worth carrying

- **A difference between two hand-turned frames is NOT free.** The obvious measure — draw it, hide it,
  count the pixels that moved over the whole frame — came out at 7800 pixels for every creature, including
  the ones behind the camera: this renderer dithers about one pixel in a hundred between one `scene.render()`
  and the next, and stopping the render loop does not stop that. Count inside the creature's own window and
  the noise is nothing. `scene.stopAnimation` on every texture changes it not at all, so it is not the water.
- **A creature must be measured as a count of pixels, not as a size in metres.** "Eleven centimetres" sounds
  generous and drew five pixels. `tools/where.js --out x.png --box y` is now the only honest way to tell
  whether anything small in this Villa was ever drawn, and it also answers the question that bit this work
  twice: `picks` names what a pick down the creature's own pixel finds, which is how it came out that the
  roach was three metres out of anybody's way and that a butterfly could be behind a pot with the code
  insisting otherwise.

### For the next hand, in the order the pictures put it

1. **The pond and the frogs from `EDICT.md` are still not made.** The empty ground is the lawn west of the
   paving and the corner beyond the laterite bed; the frogs want stone at their own scale to sit on, and
   `tools/where.js` will say in one run whether they are ever seen from anywhere a visitor stands. Make the
   frogs big enough — a real frog at 6 cm at 3 m is a pebble; the lesson above is exactly this one.
2. **Only two of the three butterflies are in the first picture**, and that is a choice: the morpho is at
   nine and a half metres on the west bed so that somebody has to go and find something. If the master wants
   all three in the first frame, put the morpho at four metres on the terrace side and accept that it
   competes with the white one for the same dark background.
3. **The roach's legs are still near the edge of one pixel.** Honest at four and a half centimetres, and they
   read in motion. If they are ever thickened further, do it in the same `long *` fractions, not in metres.
4. Standing views: **2777-home … 2793-backstore** is this session's set
   (`pictures/s79-set-0750.png`), against 2740–2756 as v0.74.0 left them
   (`pictures/s79-set.png` is the same seventeen taken before the creatures changed). Nothing in the
   Villa moved except the creatures: the butterflies and the roach are the only pixels that differ.

**`tools/where.js` costs about four minutes a camera** (seventeen hand-turned frames at 1280x720 in a
software renderer). `--times` takes fewer moments and it gets quicker; `--size 640x360` again so.

### Then the master asked for three roaches instead of one (v0.76.0) 🪳🪳🪳

One animal in a corner is not a feature, and he had already told me twice he could not find it. So
`ROACH_REGION` became `ROACH_PATCHES`: three patches of paving with a roach apiece — the stone under the
visitor's own feet at the standing start, the west walk between the laterite bed and the water, and the east
deck by the loungers, which stops at x 6.4 because the cheese platter stands at (6.8, 9.2) and the cheese
in this Villa is insect-free. Each roach now builds its meshes under its own number (`cockroach1Shell`,
`cockroach2Leg10`): three beasts had been walking about with three meshes all called `cockroachShell`, which
is the sort of thing a probe finds out and a person does not.

The debug size he asked for is fourteen centimetres, and it is in the file as two named constants —
`ROACH_REAL_CM` 4.5 and `ROACH_SHOWN_CM` 14 — with `?roach=` in the address to set it live, so shrinking it
later is one number and not a session. It matters which is which: measured looking down at the standing
start, the fourteen-centimetre animal paints **1824..2359 px** and the honest one at the same distance
**219..250 px**, both against a colour gap of 85 to 120. Which is to say the honest animal was always
findable when a person looks at their own feet; the fault was ever having put it three metres off in a
corner nobody stands in. Two small things came with the size: the leg beat is divided by the body's length,
so a big roach takes long strides instead of blurring, and the chitin's mirror came down from a third to an
eighth — at arm's length a third of a mirror drew a white streak along the top of the shell and a needle of
daylight down one antenna (`pictures/s79-feet2-cockroach1.png`). Legs and antennae went a quarter thicker in
the same body fractions, so the pair in front reads as rods and not as a row of dashes.

**One trap for whoever comes after:** in `?view=x,y,z,yaw,pitch` the pitch is DOWNWARD-positive — `1.05` is
looking at your own shoes and `-1.05` is looking at the sky, which is how one whole measuring run came out
as a frame of flat blue.

## What was done this session (77th, 2026-10-18) — the grass clump was published at last, and the garden got something alive in it 🌾📒🦋🪳

Two things went out, and the first was not new work at all.

### The clump that was already fixed, and nobody had published it (v0.73.0)

`diff -r releases/v0.72.0/src src` was not empty when this session started: the two sessions before had
rebuilt `clumpCanvas` and had stopped after the code, with no changelog and no release, so the owner was
still walking in the old clumps. That is the rule at the bottom of these notes biting for the sixth time.
What that work was, measured again here before it was shipped:

- Leaves that **walk** out of the crown and bend over under their own weight, 116 of them and not 430, and
  a dim back layer so the middle of a clump is shade and not air. `pictures/s77-clump-atlas.png` is the
  skin of four ages laid on its ground: at last it reads as grass at arm's length.
- Each cell's alpha eased off over its outer two per cent, which is what was leaving a flat green bar
  along every border — a square inked to its own edge, minified, is a bar with a ruled top.
- A clump's four sheets no longer share one height, so the union is a mound and not an eight-pointed star.
- **All seventeen standing views, twice, in one session**: the working tree at 2700-home … 2716-backstore
  and v0.72.0 photographed again at 2720 … 2736 (`pictures/s77-set.png`, `pictures/s76-v0720-set.png`).
  Every view within a point of luminance, nothing blown, nothing blackened. The change lives at a clump's
  own scale; a whole-frame average cannot see it, and saying so is the honest thing.

### Three butterflies and a cockroach (v0.74.0) 🦋🪳

What the master asked for out of `EDICT.md` and the Villa had not got. New file `src/creatures.js`, with
`butterflyWingCanvas` and `cockroachCanvas` in `src/textures.js`, six materials in `src/materials.js`, and
their mirror in `src/surface-colours.js` so the CPU drawing is not told a lie about them.

- **Three butterflies**, each over its own place — the laterite bed by the terrace steps, the west verge of
  long grass, the pots at the far paving — in paper white, morpho blue and a tiger's orange, from ONE
  wing canvas painted pale and coloured by the material. Each beats at its own rate and loops about its
  own patch on three slow turns at different rates, faces where it is going and leans into the turn.
- **One cockroach** on the east deck: a mottled brown oval, a flat shield over the head, two antennae and
  six legs, going the way roaches go — a dash, a dead stop with the antennae going, another dash somewhere
  else. It stands on the same ground the visitor's feet are asked about, and turns back at the edges of its
  patch and at anything the walk is stopped by.
- **Two switches, for the tools only**: `?bugs=0` takes them out, and `?still=1` stops their clock — which
  is not a luxury. A thing that moves cannot be aimed at: the first three attempts to photograph the
  cockroach missed it entirely, because `screenshot` lets the page run twelve seconds and a roach that has
  been running for twelve seconds is a metre from where it started.
- **Both first attempts were refused, and for the same old reason.** The butterfly's wings came out as one
  pale fan with a chrome bead for a head (`pictures/s77-butterfly-first.png`): the wing was three ellipses
  unioned, which is a fan and not a wing, and its border was a shrunk copy of the outline, which is thick
  where the wing is wide and gone where it is narrow. Now the outline is one closed path with a notch
  between the two wings and the border is STROKED, so it is one width all the way round
  (`pictures/s77-wing.png`, `pictures/s77-butterfly.png`). The cockroach came out as a copper coin with
  knitting needles stuck in it (`pictures/s77-cockroach-first.png`). Its chitin had `specularIntensity` 1
  — the Villa's oldest fault, a new material shipping with a mirror's shine, the third time this session
  it has had to be cut by hand. From far off, at a person's own height, it is a dark speck on the stone
  (`pictures/s77-roach-far.png`), which is the truth of a three-centimetre insect and enough.
- **What they cost**: 720 meshes became 745, and `tools/fps.js` says 1.4 fps with them and 1.2 fps without
  in the same run, which is no cost at all — and the seventeen standing views are the same at 2740 as they
  were at 2700, view for view, to a tenth of a point. They are not for a picture of the whole garden. They
  are for the corner of the eye, and for when a person stops and looks down.

### What is still wrong, in the order the pictures put it now

1. **The `EDICT.md` list is not finished: there is no pond and no frogs.** The empty ground is at the south-west
   and south-east corners of the lawn (the two strips scattered at `name: 193` and `197` in
   `makeTuftPlan` are about as empty as it gets). `src/water.js` already knows how to make a surface that
   mirrors the scene, and `ground.js` reads floors off meshes, so a shallow dish of stone with water 3 cm
   below its rim is walkable by accident unless a `blocker` rings it. Frogs can borrow the cockroach's
   parts: a squat ellipsoid, a paler belly, two eyes on top, and a hop on a timer instead of a dash.
2. **A clump scattered in the mown lawn still reads, at one to two metres, as a small broadleaf rosette and
   not as grass** (`pictures/s77-border-pair.png`, right half). The skin is right now — see
   `pictures/s77-clump-atlas.png` — so what is left is in the world and not the paint: the widest leaves of
   the older ages are too wide for a mown sward, and the tints from `lawnTone` put a clump about twenty
   points of green ABOVE the sward it stands in at that camera (measured with `tools/cover.js` on the
   south-border view: tuft (93,129,36) against lawn (111,149,60) — the clump is darker, but with far less
   blue in it, and it is the blue that makes grass read as grass at that angle). Seven sessions have been
   spent on this tile. Before an eighth, ask what a scattered clump is FOR: it may be that the lawn wants
   fewer of them and more mower, and the fringe keeps them.
3. **The paving's bump, at twenty centimetres, is a mud splash.** `pictures/tmp` scratch of this session
   (deleted) showed the deck's relief as dark blobs the size of a hand when the camera is near the stone.
   At a person's height it is invisible, so this is a note and not a fault — unless someone ever lets the
   camera near a wall or a floor.
4. **`rear` is the flattest view in the Villa** (L83, 1.8% under L30): a long shaded plaster wall, a strip of
   laterite and a rank of clipped shrubs, with nothing lit in it at all. The back of a house wants one lit
   thing — a lamp, a window, the sun's edge on the store's face.
5. From earlier sessions and still true: **the sky's fill is green** (fault 48), so no floor can be a cool
   grey in its shade and a warm tan in its sun; the terracotta roof, the pots and the platter are all one
   clay family; the far palm trunks are pale, smooth and too straight; and the lawn's mower stripes still
   only show from straight above.

### Tools and switches this session left behind

- `?bugs=0` and `?still=1` in `src/main.js` (out, and hold still). Documented where the other switches are.
- Nothing new under `tools/`, so `walkable_items` in `release.sh` needed no change — the creatures are in
  `src/`, which is already copied.
- `pictures/` is up to about 2,500 files and 3.4 GB. Deleted this session: the scratch of the two unpublished sessions
  (`tmp-s75-*`, `tmp-s76-*`, which no note named — the notes had never been written for them) and this
  session's own `tmp-*`. The nine kept and cited are `s77-set.png`, `s76-v0720-set.png`,
  `s77-clump-atlas.png`, `s77-clump-close-pair.png`, `s77-border-pair.png`, `s77-wing.png`,
  `s77-butterfly.png`, `s77-butterfly-first.png`, `s77-cockroach.png`, `s77-cockroach-first.png` and
  `s77-roach-far.png`. Standing sets for the next session to compare against: **2700-home … 2716-backstore**
  (v0.73.0) and **2740-home … 2756-backstore** (v0.74.0); 2720 … 2736 is v0.72.0, photographed again in
  this session so before and after are the same question.
- One trap met again and one avoided: the two unpublished sessions' comment in `src/garden.js` cited
  `pictures/tmp-s75-clump35.png`, which pruning had already deleted — a comment that points at a deleted
  picture is a comment that cannot be checked, which is what v0.52.1, v0.54.1, v0.55.1 and v0.59.1 were all
  made for. It now says plainly that the picture is gone and points at `s77-clump-close-pair.png` instead.

## What was done this session (73rd, 2026-10-18) — the pool's dark foot was the water's own film, and the shrubs got the shears 💧🪞🌿➡️✂️

The browser was in the room all session (**2009 of 2048 slots free**). Two releases came out of it. Standing
sets: **1089-home … 1105-backstore** was the Villa as the last session left it, **1203-home … 1219-backstore**
is it now (`pictures/s74-set.png`). Take the next set from **1220**. Session numbering: the work sitting in
the tree when this session opened — the water's mirror — calls itself the seventy-second in `src/water.js`
and had been measured and photographed (`pictures/s73-*`) but never written up or released; it is 0.71.0 and
it is written up under its own number in `CHANGELOG.md`.

1. **The water's mirror was checked before it was believed, and it stands.** The claim was that the dark foot
   of the start view was the angle film and not a shadow. Re-measured here from the address bar, not from the
   note: `?wsky=0` on the start camera reads L127 / L146 / L147 in the foot, middle and far water with the
   darkest facets down at L30; as built the same three places are L142 / L163 / L166 with nothing in the foot
   under L96 — the dry coping beside it is L143, so the water's foot now comes level with the stone a swimmer
   steps on. The CPU drawing was weighed the same way over the whole pool rectangle: browser (104,152,154)
   L142 against the drawing's (127,186,176) L173, which is the gap the note in `src/surface-colours.js` now
   states instead of hiding. Released as **0.71.0**. `pictures/tmp-poolpair`-style before-and-after is
   `pictures/s73-pool-pair.png`; the dark troughs of the chop are gone and the basin reads as water and not
   as a tank.
2. **The shrubs are clipped.** Carried at the top of the last three sessions' lists and now done: every shrub
   and potted bush was a dome, because `crumple` leaves a lump's outline one arc, and a bun of leaf is what a
   privet that was never cut grows into. `shearTop` in `src/mesh.js` lays a **board** at a height and pulls
   every corner of a lump above it down onto it — the board wanders on a slow world field (a hedger lays it by
   eye and it sags), the normals are recomputed so the cut face is lit as a flat face, and the corners that
   came down are handed to `skinTint` as tips. The board lies at `SHRUB_CLIP` = 0.46 of the plant's own width,
   and `?clip=1` lays the shears out, which is the control and how every number below was weighed.
   Two things were needed with it. The leaf cards on a cut face are **stood up** — the skin there looks at the
   sky, and a card laid in a face that looks at the sky is a plate — and then **slid down** so nothing of them
   comes more than 2 cm over the board, because a shoot that grew through the board was cut with it. Without
   the cap the uprights stand proud of the board — seen at `?clip=0.58` before the cap went in, cards and tips
   standing over a crown that should have been flat — and a crown of them is a comb and not a cut face.
   A ladder of one shipped-height shrub at one camera is in `pictures/s74-clip-uncut.png`, `-046.png`, `-036.png`.
3. **A new eye: `node tools/crown.js <picture> <x0,y0,x1,y1> [--step n] [--band 0.6]`** follows the top edge of
   a plant down each column of a rectangle and prints how much that edge wanders, how far it drops, what share
   of its columns are on the plateau, and a sparkline of the edge itself. On the big border shrub in the `rear`
   view, uncut it drops 32 px and 14% of columns are on the plateau; as shipped it drops 22 px, wanders 5.6 px,
   and 47% are on the plateau, with the crown 19 px (some 8 cm) lower. The ladder at one camera is in
   `pictures/s74-clip-uncut.png`, `-046.png`, `-036.png`; 0.58 leaves a bun with a flat patch, 0.36 takes the
   shoulders off and leaves a mat. Cameras worth keeping: `-1.4,1.15,-18.0,0,0.10` at `&fov=0.5` is the big
   border shrub at 3.6 m, `-1.4,2.3,-16.6,0,0.42` at `&fov=0.5` looks down on the plateau (`pictures/s74-plateau.png`),
   and `2.6,1.5,7.2,3.14,0.0` at `&fov=0.6` is the two great pots (`pictures/s74-pot-pair.png`).
4. **What the pictures said after.** All seventeen re-photographed at 1203–1219: luminance within a point
   everywhere (`rear` L84 → L83, `sala` L99 → L100, `west` L110 → L111), nothing blown, nothing blackened, no
   view gone grey. `tools/cover.js` on the `rear` view: leaf cards 5.4% of the frame → 4.3%, shell 2.5% → 1.8%
   (the plants are shorter), their green (41,85,11) → (38,79,11) — the cut face is in its own shade, which is
   what a low sun does to a horizontal surface. The pots at six metres are the best of it: buns of green in
   terracotta became clipped bay in a pot. The drawing wears the same geometry, so it draws the same flat
   crowns; `rear` draws 12 L over the browser, which is the drawing's known bias and not a new fault.
   `tools/feet.js` (719 meshes, 48 floors, 129 blockers), `tools/shadows.js` and `tools/standup.js` all clean.

### What is still wrong, in the order the pictures put it now

1. **A grass tuft six metres off is a flat green slug.** Seen in the start view along the court's borders and
   in the `rear` view along the back bed: clumps that read as solid green dumplings lying on the soil with a
   straight edge to them, and bright — `mats.tuft` wears its own pattern as an emissive too, so distance cost
   them nothing. The reason was found with a scratch probe and is worth keeping: `tuftAtlasCanvas`'s cells are
   dense — `node tools/atlasair.js tuftAtlasCanvas 512` says 65.9% of the atlas is air, but at mip8 **36% of
   the blocks still stand** over `alphaCutOff` 0.42, and the blades' feet are painted below the cell's bottom
   edge (`y0 = size * 1.04` in `clumpCanvas`) so that bottom band is solid ink across the whole width. A
   foreshortened card is then a straight-topped bar on the dirt, which is exactly what is seen. The fix is in
   the painting, not the material: feather the cell's alpha at its borders so no mip has a straight edge, and
   thin the foot band. (`tools/atlasair.js` is the probe; the scratch tools that found this are gone.)
2. **The lounger seen from the foot is still a pale wedge** (needs a sag in the pad's geometry, not paint), the
   **store room's grey portal** is one flat grey frame round a dark door with a bracketless balloon of a lamp,
   and the **roof, the pots and the platter's ware are all one terracotta**. All three carried over untouched.
3. The clipped crowns read a shade dark on the plateau at a low sun. If that is ever chased, the honest way is
   a tone written on the cut corners in `shearTop`'s return, not a brighter `mats.bush`.

### Tools and switches this session left behind

- `node tools/crown.js <picture> <x0,y0,x1,y1> [--step n] [--band 0.6]` — the crown's flatness, in pixels.
- `?clip=` in the address bar: the height of the board as a fraction of each plant's width; shipped 0.46,
  `?clip=1` leaves every crown uncut. Threaded as a `clip` argument through `buildGarden`, `buildProps`,
  `makeShrub`, `makePottedPlant` and `makeLeafyMass`, all defaulting to `SHRUB_CLIP`, so the CPU drawing and
  every tool get the shipped height without being told.
- `shearTop(mesh, { at, ragged, span, seed })` in `src/mesh.js` — the board, and which corners it brought down.
- Housekeeping: two stray 65-byte black PNGs named `0` and `340` in the folder root (the leavings of a
  mis-quoted `screenshot` call) are gone, and so are this session's scratch probes.

## What was done this session (71st, 2026-10-17) — the shrubs stopped being clones, the sunbeds got canvas, and the soffit was boarded the right way round 🌿🛏️🪵

The browser was in the room all session (**2009 of 2048 slots free**) and the eye was used first: the standing
set at 887–903 read whole (`pictures/tmp-set` of the last session, since deleted), then one potted bush at
six metres, then one sunbed at three. The standing set after this session is **1034-home … 1050-backstore**;
this session's own pictures carry `s72-`. Three things changed, and each is carried in the CPU drawing too:
`massTint` and the two card dials work on the meshes themselves, and `cushion` and `soffit` entries were
added to `src/surface-colours.js`. Note on the numbering: `./tools/photos.sh --from 910` landed on top of
numbers the fifteenth session had already used, so 910–926 now holds THIS set while `920-home.png` and its
friends are Oct 15 in the same range under other names. Take sets from 1051 upwards.

1. **A shrub is a plant and not a stamping.** This was item 2 of the last two sessions and it was true
   still: the four bushes at the terrace steps were four buns of one green. The reason was in the code and
   not in the paint — `skinTint` and `bushLeafage` both normalise their tone to a mean of one, deliberately,
   so that shading shapes a plant without repainting the garden. Which also means no plant can ever differ
   from its neighbour by a byte, and no plant has a lit shoulder and a shady flank at the scale a stranger
   sees it at. `massTint` in `src/mesh.js` writes once over the merged parts, after the merge and on top of
   `skinTint`: `own` gives every plant its own brightness (±15%) and its own lean of hue (a young leaf is
   redder, an old one bluer, and one shrub has more of one than the other), and `lobes` lays a slow world
   field — two or three soft lobes across the plant, its span going with the plant's own size — so one side
   is a shade of itself from the other. The field is averaged back to one over the mesh; only `own` moves a
   plant's mean, and it is small on purpose. With it, a sixth of the leaf cards are grown to a lobe
   (1.3–1.8 of a spray, where every card was 0.7–1.1) and the card's crown-to-skirt ramp came up from 0.16
   to 0.30. Measured on the `grass` camera with `tools/cover.js`: the outside leaf's darkest-to-brightest
   run went 10 → 39 points of green and the shell's 3 → 12, and the `home` view's bushes came up from
   (42,90,11) to (48,104,15) — six points, bought by the big cards catching the sun and paid for by the
   lobes, and it holds the whole frame at L113. `pictures/s72-bush-pair.png` is one potted bush at six
   metres at twice its own size: before is a fuzzy dome, after is a plant with leaves in it. **The first
   cut of the lobe card was 1.55–2.4 of a spray and it was too big** — the bush grew a third and went
   spiky (`pictures/s65`-scale spikes, seen at `tmp` and thrown away); 1.3–1.8 is the honest lobe.
2. **A sunbed's pad is canvas over foam.** The pad was a box in `mats.cloth`, whose grain is a shade every
   eight centimetres: at the ten metres a lounger is actually looked at from that is nothing, so the top was
   one flat pale sheet with a hard edge and the whole sunbed read as a concrete block on legs
   (`pictures/s72-lounger-pair.png`, left half). The lesson is the one every other surface in this Villa
   learnt: **a pattern has to be laid at the size of the thing it is on**. `mats.cushion` is a new material
   whose repeat IS one panel — `pattern: 0.62`, the width of a sunbed's pad — and `cushionCanvas` paints
   that panel: a sine puff across `v`, a fifth brighter in its own middle and down at the joins where two
   neighbours took the thread, a stitched seam and its piping on the repeat's own edge (half at the top,
   half at the bottom, so the halves meet at the join and one line is painted, not two), the cloth's own
   weave on top, and two drifts — 4 cells to a repeat and 22 — so a sunlit cushion is not the flattest
   thing in view. `v` is the long way of the pad and of its side faces, so a seam runs across a lounger and
   pipes along its side at the same height; `u` cannot carry piping, because `metricUVs` anchors the pattern
   to the world and not to the box, so a `u`-seam would land anywhere across the width depending on where
   the sunbed stands. The base went from the cloth's [226,216,196] to [198,180,152]: **the first cut at
   [212,196,170] still read white** because the tone map was eating the difference; measured on the `pool`
   camera the pad is (172,169,136) L167 where it was (183,180,156) L179, and the shaded back L159 → L127.
   The frame came out to 0.80 m against the pad's 0.60 — it was 0.72 against 0.66, which left no teak of
   the bed's own either side of the cushion. `mats.cloth` stays for the chair and sala pads, which are thin
   pads and not quilted ones.
3. **The terrace soffit is boarded along the house and not across it.** Item 3 of the last session, and the
   last board in the house wearing an upright's wood: `mats.teakWall` is nine boards to 1.8 m `grain:
   "up"` and `patternUp`, which is right on a post and, over a ceiling 17.6 m wide, laid the boards running
   away from the eye with a joint line across them — a comb. `mats.soffit` is the same structure teak at
   the same 1.8 m with **`grain: "cross"`**: on a plane that looks at the ground `metricUVs` puts world `x`
   on `u` and world `z` on `v`, the canvas's boards are bands of constant canvas-`y`, so the boards lie
   under the eave and each one runs the whole width of the house (`pictures/s72-soffit-up.png`, an eye
   standing on the teak deck looking up). No bump: the only light that face gets comes from the ground.
   The CPU drawing is told the same way round with `grid: { u: 1, v: 9 }` against `teakWall`'s `{ u: 9,
   v: 1 }` — `tools/draw.js`'s `albedoAt` bands on both axes, and the `u: 1` edge reads as a butt joint
   every 1.8 m, which a board's end is.
4. **What the pictures said after.** All seventeen re-photographed at 910–926 (after the shrubs) and again
   at 1034–1050 (after the pad and the soffit); `pictures/s72-set.png` is the last set. Whole-frame
   luminance moved by a point at most — `rear` L84 → L83, every other view where it was — because a shrub
   and a sunbed are small in a frame and nothing here is brighter on purpose. Nothing blew to white and
   nothing came out black; `home` L113, in colour 92%. The drawing tracks the browser inside its known
   bias: `home` +16 L, `westwall` +12, `pool` +5, and `drawn-*.png` was redrawn whole.

### What is still wrong, in the order the pictures put it now

1. **The near third of the pool is a dark tank** — carried over untouched. It is the shadow of the pool's own
   south wall and it is physically there, but L85 against the far wall's L168 is a big jump for a basin of
   clear water, and what is missing is the light that bounces back up out of the pit. A second cheat on the
   *floor in shade*, the way `poolTile.emissiveColor` is one for the pit as a whole, is the next thing to
   try; `?noshadow=1` is the ladder that says what it is worth. The `pool` camera's water is the place to
   read it, and the crop of it now reads better than the notes of the seventieth session said it did — the
   wall nets it got that session bought a lot.
2. **A shrub at six metres is still a bushy bun, not a clipped one.** The lobes and the big cards moved it
   a long way and it is no longer broccoli, but a clipped privet has a *flat* crown and this garden's masses
   are all domes: `crumple`'s `at` lobes push the top up and down and nothing says "cut with a board".
3. **The lounger seen from the foot is a pale wedge.** From straight off the foot end the pad foreshortens
   into one bright trapezoid and the quilt is edge-on: `?view=4.4,1.6,6.4,0,0.5` is that camera. A sag
   between the frame's slats — the box's top face dished at its middle — is the fix, and it needs geometry,
   not paint.
4. **The store room's grey portal** (`1050-backstore`) is one flat grey frame round a dark door, and its
   lamp is a pale balloon in the sky with no bracket to be seen.
5. Still true: the roof, the pots and the platter's ware are all one terracotta.

### Tools and switches this session left behind

- No new url switch. The dials are in the code: `massTint(parts, { own, lobes, span })` in `src/mesh.js`,
  called from `makeLeafyMass` with `own: 0.15, lobes: 0.26, span: size * 0.8`; the lobe card at
  `rand() < 0.15` and `1.3 + rand() * 0.5` in `bushLeafage`; `cushionCanvas(size, base)`;
  `mats.cushion`'s `pattern: 0.62`.
- Cameras worth keeping: `2.6,1.5,7.2,3.14,0.0` with `&fov=0.6` is both great pots at the terrace steps at
  six metres; `4.4,1.6,6.4,0,0.5` at `&fov=0.4` is a sunbed's pad from the foot; `0,1.6,-1.0,3.14,-0.6` is
  the soffit from the teak deck. Pitch is signed the other way from what a stranger expects: **negative
  looks UP**, so `?view=…,3.14,-0.75` is at the sky and not at the eave.

## What was done this session (70th, 2026-10-17) — the pool stopped being graph paper, and the room's beams stopped being shingles 📐🔲➡️🏊🪵

The browser was in the room all session (**2010 of 2048 slots free**) and the eye was used first: the standing
set at `850`–`866` read whole (`pictures/s70-set.png`), then the start view, then a crop of the water at two
and one-tenth diameters. The standing set after this session is **887-home … 903-backstore**; `870`–`886` is
the same set with the pool done and the beams not, which is how the two halves of the session were told
apart. This session's own pictures carry `s71-`. The CPU drawing was told about all three changes: the
`poolTile` and `poolWet` grout bytes, a `causticsWall` entry for the wall nets and a `beam` entry, all in
`src/surface-colours.js`.

1. **The joint of the mosaic is a dull grey-green now, and no two courses of it are alike.**
   `poolTileCanvas` in `src/textures.js` laid its tiles on `#e4f0ec` — (228,240,236) — over glass that runs
   from (76,150,168) to (120,196,206): a net of near-white standing about a hundred points of light above
   the only thing it touches, and the sharpest pattern in the pit. At the start camera the eye is 1.94 m
   above the film and the basin spans five metres, so the far two thirds are seen at a graze and every
   course is squeezed to two or three pixels, where mipmaps and anisotropic 8 do their honest work and
   average each course to one even straight line. Even, straight and bright over half a frame is a
   *diagram* of a pool. The joint is `[172,190,186]` now; every course gets a width of its own (1.2–2.3 px
   of 42, where it was a sawn 1.6); and the whole of a patch — joint and glass together — rides a slow
   `noiseField(size, 2, 2, 61)` at ±16%, so the net fades up and down over three or four courses instead of
   lying dead even. Measured on the start view's water (`--patch 100,470,1200,640 --block 48`): block-to-block
   spread 28 → 30 of channel and L std 27.8 → 30.1, whole frame unchanged at L113 — the change is in the
   small evenness and not in the light. `pictures/s71-grout-pair.png` is the same 360 x 120 crop of the far
   wall before and after at two diameters, and it is the one picture of this session worth a minute.
2. **The four walls of the pit wear a moving net of light for the first 80 cm under the surface.** They had
   nothing at all: the floor has worn two caustics sheets for many sessions and the walls, which at a graze
   are most of what is actually seen through the film, had only the joint grid. `mats.causticsWall` in
   `src/materials.js` is a second caustics canvas (seed 407, so it never rhymes with the floor's) at the
   same 1.25 m repeat, emissive and `disableLighting` like the floor's, laid on four `box` skins 2 cm proud
   of the inside faces in `src/pool.js` (`netWest`, `netEast`, `netNorth`, `netSouth`), each at `visibility`
   0.45, running at its own pace in `animate()`. Its top starts 2 cm *under* the film so it never shares a
   pixel with `wetTile`, which stands from the waterline up. `?net=0` takes it off and `?net=0.85` is a wire
   cage; between them `tools/diffgrid.js` counts 65,981 pixels moved past 24 summed channels at 0.45, all
   of them in the water. `pictures/s71-net-pair.png` is the near-west corner with and without: the west wall
   comes up lit and the surface stops being one flat colour.
3. **Two dials on the water itself were ladderred and refused, and a theory died with them.** Everyone has
   been chasing the hard-edged pale slab in the middle of the start view as a mirror that wants smudging.
   `mats.water.roughness` 0.06 → 0.10 → 0.16 moved the water's mean by a point and the slab's edge not at
   all (`?wrough=`, added for the ladder and taken straight out again); the ripple bump level
   (`?wrib=`, kept) 0.7 → 1.2 → 1.8 lit the middle of the basin by twelve points and left the edge as
   straight as it was. It is no mirror. `tools/pickat.js` puts the slab at world z = 2.4 — the far wall, seen
   through 1.9 m of water and film — and its dark neighbour at z = 5.2, which is the floor; and the pool's
   south wall stands 1.76 m over that floor under a sun at 24 degrees, so it lays a shadow 3.95 m up the
   pit. `?noshadow=1` lifts the dark half from L85 to L148 and leaves the slab where it was at L168. **The
   slab is the sunlit far wall and the dark half is the near wall's shade: both are right**, and the line
   between them is straight because this renderer bends no light going into the water, so no dial on the
   sheet will ever wobble it. Written up where the next hand will look for it, in the water block of
   `src/materials.js`.
4. **The four beams across the room's ceiling are timbers now, and the front of the house lost its
   shingles.** They wore `mats.teakWall` — nine boards to a 1.8 m repeat, stood up — which on a post is
   right and on a 13 m beam lying down is a row of little blocks: a butt joint every 20 cm along a beam
   0.22 m deep, and seen from the pool through the glass at a graze that is a course of shingles. Standing
   on the terrace and looking up (`pictures/s71-ceiling-pair.png`) it was four dark courses with a stepped
   hem; that was the sixty-ninth session's item 3, and it was never the soffit at all. `mats.beam` in
   `src/materials.js` is the same structure wood at two boards to a 3.2 m repeat with the grain lying along
   the piece, so the beam's own face is narrower than one board and wears no cross joint, and its bump is
   the floor's gentle 0.3 because the only light these faces ever get comes from below. From the front
   (`pictures/s71-beam-pair.png`, the same band of the `colonnade` view before and after) the top of the
   room is a ceiling with four timbers across it and the stepped hem is gone; from inside, one long board
   with its grain running its twelve metres. Whole frames moved a point and no more: `home` L113 → L112,
   `colonnade` L99 → L98, `frontcorner` L98 where it was, and the fourteen views that cannot see into the
   room are unchanged to a tenth of a point.
5. **What the pictures said after.** All seventeen re-photographed twice, at 870–886 and again at 887–903
   (`pictures/s71-set.png` is the first set). After the pool: sixteen views stood where v0.67.0 left them
   and `pool` came down one point (L104 → L103), the dull joint paying for its own loss of glare. After the
   beams: three views moved, by a point at most. Nothing blew to white, nothing is pure black, `home` is
   L112, in colour 92.7%. Five meshes came in — the four wall nets and nothing else — and no light.

### What is still wrong, in the order the pictures put it now

1. **The near third of the pool is a dark tank.** It is the shadow of the pool's own south wall and it is
   physically there, but L85 against the far wall's L168 is a big jump for a basin of clear water in an
   afternoon, and what is missing is not shade but the light that bounces back up out of the pit — which
   this renderer has none of, and which the two `poolFill` point lights and the tile's own emissive are
   already faking. A second cheat on the *floor in shade* (the way `poolTile.emissiveColor` is one for the
   pit as a whole) is the next thing to try, and `?noshadow=1` is the ladder that says what it is worth.
2. **A potted bush at six metres is broccoli** — carried over from the sixty-ninth session, and still true.
   Measured again here: the four bushes in the start view read (50,111,13) L91, (36,87,5) L70, (47,79,9) L67
   and (42,94,6) L77 against a boundary hedge at (28,56,12) L47, so they are not too bright — the fault is
   that they are four nearly identical buns of one tone with a fuzzy edge and no leaf bigger than the next.
3. **The terrace soffit is the last board in the house wearing an upright's pattern.** `soffit` in
   `src/villa.js` wears `mats.teakWall` (nine boards to 1.8 m, stood up), and from the deck under it the
   underside reads as boards running away from the eye with a joint in them every 20 cm — which is not
   loud at all next to what the beams were, but it is the same mistake and `mats.beam` now exists to copy.
4. The lounger cushions are one flat white slab each in `893-west` and `894-pool`.
5. Still true: the roof, the pots and the platter's ware are all one terracotta.

### Tools and switches this session left behind

- `?net=0.45` — how loud the net on the pool's four walls is; `?net=0` is the control case.
- `?wrib=1.1` — the water's ripple bump level. 0.7 stands; above 1.2 the mirror lifts and nothing else does.
- `node tools/pickat.js "2.4,1.74,10.5,3.2,0.06" "640,500;640,600"` — the two probes that killed the mirror
  theory: world `z` on each side of the slab's edge, and then `?noshadow=1` against them.

## What was done this session (69th, 2026-10-17) — the room behind the glass was a concrete board; it is lime-washed now ⬜➡️🟧

The browser was in the room all session (**2008 of 2048 slots free**) and the eye was used first: the standing
set at `830`–`846` read whole (`pictures/s69-set.png`), then the start view, then a crop of the room itself.
The standing set after this session is **850-home … 866-backstore**; this session's own pictures carry `s70-`.

1. **The room's plaster was a grey board and is a lime wash now.** `mats.interiorPlaster` was painted
   `[206,200,188]` — three numbers within sixteen of one another, which is not a paint but a bare board — and
   the front of the house paid for it: the middle of the frontage measured (111,94,69) L96 while the teak
   mullion two hand-widths away in the same picture stood at L137. It is `[216,194,164]` now: warmer than the
   outside plaster's `[204,182,152]` and paler, which is what lime left under a roof looks like. The two lamps
   over the room came up from 20 to 30 with it (`src/interior.js` has the ladder: 20, 26, 32, 40 → the wall
   under the lamp L98, L108, L116, L125 and the front through the glass L96, L102, L108, L114; 30 is what
   stands, 40 made the back wall as bright as the fascia and started reading as a shop window). After both:
   the front (131,98,60) L102 against a mullion at L139, the wall inside (147,104,52) against (117,96,65).
   `pictures/s70-room-pair.png` is that band before and after; `pictures/s70-room-full-pair.png` the whole
   start view; `pictures/s70-home-v0660.png` / `s70-home.png` and `s70-colonnade-v0660.png` /
   `s70-colonnade.png` are the two builds whole; `pictures/s70-room-inside.png` is the room from inside it,
   which is where the ochre looks bolder than it does from the pool. The CPU drawing was told: the
   `interiorPlaster` bytes in `src/surface-colours.js` print (125,89,45) at the room camera against the
   browser's (119,80,39) for the same frame.
2. **Two theories about that grey, killed with the probe rather than argued.** `tools/roomwarm.json` switches
   one light at a time on the room's own camera: the sky cube is not in that room — `interiorPlaster`
   `environmentIntensity` 0.3 → 0 moved the back wall by one point of 255 (the room's meshes are already shut
   out of both fill lamps, so its four lamps are the only lever there) — and the pane is not veiling the room
   either: switch every `*Glass` mesh off and the same place goes *down*, (64,51,36) → (63,46,20). So the grey
   was the wall, not the light in front of it. A pick is no use for the second question on its own: a ray that
   meets a pane names `frontGlass` and paints the composite, so the mesh it names says nothing about what is
   behind — the control case that disables the panes is the only honest answer.
3. **The water's colour now comes off where the surface mirrors.** `src/water.js` patches the water's alpha
   with a Fresnel term; the same term now scales `finalEmissive`, because the cyan film that paints the pool's
   depth is light that went *in* and at a grazing angle almost nothing goes in. Small, and written down as
   small: the water a metre off the far coping (91,181,192) L163 → (90,176,185) L158, the whole pool view
   L106 → L104. What it buys is that the far half is no longer one flat plate that no ripple can move.
   `?nofilmangle=1` puts the lid back, `?wem=` dials its strength (`tools/waterfilm.json` ladders both).
4. **What the pictures said after.** All seventeen re-photographed at 850–866 (`pictures/s70-set.png`): twelve
   stand where v0.66.0 left them to a tenth of a point, five moved by design — home L114 → L113, colonnade
   L97 → L99, frontcorner L97 → L98, backstore L99 → L100, pool L106 → L104. Nothing blew to white, nothing is
   pure black, the walk is 716 meshes and 11 lights as it was.

### What is still wrong, in the order the pictures put it now

1. **The pool at a grazing angle is still graph paper.** `pictures/s70-pool-grid-before.png` is the crop that
   says so: the joint grid of the basin lies crisp, pale and unbent across the far two thirds, with a hard-edged
   pale rectangle of mirrored house sitting in it. And before anyone tries another view-angle dial, here is
   why they all fail: at the start camera the eye is 1.94 m above the film and the water spans z 2.1..7.1, so
   NdotV runs only 0.255 at the far coping to 0.42 at the near one. Every Fresnel, alpha or film dial is being
   handed that narrow a range — which is why the last session's `?wfp=` ladder moved three points and this
   session's film moved five. **The fix is on the transmitted surfaces, not the sheet.** The pit's floor has
   two caustics sheets lying on it and its four walls have nothing at all, and at a grazing angle the walls are
   most of what is visible: give them the same net of moving light (a skin on the inside faces, the way
   `wetTile` and `splash*` stand 2 cm proud) and the joint grid stops being the only pattern there.
2. **A potted bush at six metres is broccoli** — a rounded bun of one green, leafless at that distance, and the
   same bun in all four pots (`850-home`, `853-rearcorner`). The shrub work in v0.59.0 was measured at two metres.
3. **Over the room, the roof's inner face reads as dark shingles** with a stepped edge where the ceiling ends:
   `860-colonnade`, the band under the fascia. It is the soffit pattern seen past the ceiling's edge and it
   wants either a ceiling that reaches the soffit or a soffit pattern that reads as boards from under.
4. The lounger cushions are one flat white slab each in `856-west` and `857-pool`.
5. Still true from the last session's list: the near rank of the belt wears an unpadded atlas (measured and
   refused, `tools/atlasair.js`), and the roof, the pots and the platter's ware are all one terracotta.

### Tools and switches this session left behind

- `node tools/lights.js --plan tools/roomlit.json` — the room's lamp ladder and a warm-plaster probe, asked on
   three cameras at once (front, inside, the west windows), with the sunlit mullion and coping as controls.
- `node tools/lights.js --plan tools/roomwarm.json` — who actually lights the room: env, sun, and the four
   lamps switched one at a time. Read the two control cases first; they are the point of the plan.
- `node tools/lights.js --plan tools/waterfilm.json` — the water's film against the angle, and `?wem=` /
   `?nofilmangle=1` (`src/main.js`) to dial it from the address bar.

## What was done this session (68th, 2026-10-17) — the waterline had teeth, the court's joints were cut in soot, and the jungle behind the hedge was a mountain range 🦷🧱⛰️➡️🏊

The browser was in the room all session (**2009 of 2048 slots free**) and the eye was used first, as the
notes now tell it to: the standing set at 700-716 was read whole, then cropped, and three faults came out
of looking. The pictures of this session carry `s68-`, and the standing set after it is **800-home …
816-backstore**.

1. **The far waterline was a comb, and two faces shared a plane.** From the start view the pool's far edge
   wore a row of turquoise teeth, one every five pixels, standing up into the damp stone of the coping — and
   they were a pixel or two tall, which is why six sessions of looking at the pool never caught them: every
   grid in this folder is coarser than that (`pictures/s68-edge-before.png`, five times).
   `tools/pickat.js` — new, see *How to look at it* — named both of them in the same column: `splashNorth`
   at world y 0.21 and `poolNorth` at y 0.12, **both at z = 2.1**. The coping's damp foot is a box whose
   pool-facing face stands in the pool wall's own inner face, and where the wall's top (0.14) overlaps the
   foot's face (0.07 up to 0.23) the depth test had to choose on nothing, and chose by column. The foot now
   stands `skin` = 2 cm into the pit, which is what the waterline bands beside it already did for their own
   reason: `pictures/s68-waterline-pair.png`, before left and after right. Nothing else moved — the coping
   still walks level with the paving, `feet.js` is unchanged, and the 2 cm throws no line the picture can
   see.
2. **The court's joints were cut in soot.** From the south path the paving is half the frame, and it was a
   grid of black lines: the joint came out of Chromium at (45,46,33) L46 against the slab face beside it at
   (170,144,106) L147 — **0.31 of its own stone**, twelve pixels wide in the near foreground. Sand in a
   joint is not black and never was; the canvas simply asked for it (`#7b705c` under everything else).
   `paverCanvas` now takes a `joint` of its own, and it is a separate argument on purpose, because
   `bumpFromCanvas` reads height off the pattern's *luminance*: lightening the joint in one canvas would
   have silently lifted every slab out of its bed and taken the relief out of the near paving. So
   `mats.paver` paints its colour with a dusty joint (152,140,120) and its bump with the old dark one, and
   `tools/draw.js` follows through the `grout` of the `paver` entry in `src/surface-colours.js`. What it
   bought, measured on `pictures/s68-paving-pair.png` (before left): the body of the joint came up from
   (86,75,53) to (99,87,65) and the deck's mean in that view rose **+1.7** of luminance; the *darkest*
   pixels of the joint did not move at all, and that is the honest part — a third of what looked like black
   was the bump's shadow flank of a sunken slab, and that shade is right and stays.
3. **The jungle behind the hedge was a mountain range.** From the south path the far rank of the belt made
   broad humps, one every third of the frame, with a smooth flank and no head in them
   (`pictures/s68-horizon.png`): the ring stands fifty-odd metres off and its longest edge wave was thirty
   metres, which out there is thirty-three degrees of sky. A crown eight metres across is nine degrees at
   that distance, so the edge's recipe went from `[30 .40, 10 .32, 4 .28]` to `[40 .12, 15 .22, 8 .38, 4
   .28]` — a wood, a stand, a clump of crowns, one crown, nothing finer than four metres because the ring
   is walked at one. The top edge of the mass, read column by column, came down from a mean of y91 to y100
   and its from-column-to-column jitter went 27.1 → 30.2 px, and the pale far tree line shows over it now,
   which is a depth the frame did not have (`pictures/s68-horizon-pair.png`). **Said plainly: this is the
   weakest of the three.** The edge still reads ridge-like in places, because a smooth sum of value noise
   has no cusps; what a real tree line has that a band cannot fake is one head ending and the next beginning.

**Measured and refused, so nobody spends a session on it.** The last session left a note that the near rank
of the belt (`canopyClusterCanvas`) has no padding and that the mip chain made it a live question. It has no
padding, and 63.2% of its pixels are air, and the air is black (1,2,1) — and `tools/atlasair.js` says the
damage is small: the blocks that survive the cut-off come out 1, 2 and 3 of red under the leaf at mip 2, 4
and 8. A cluster is a dense mass, so a block average rarely mixes leaf with air; the shrub needed `padAtlas`
because its sprigs are 17 cm of leaf in a cell of air and a bush is 4 m off. **The belt's atlas is left
unpadded, and the reason is in this note.**

What the pictures say: **every one of the seventeen standing views moved by 0 to +1.9 of luminance**
(home +0.8, path +1.7, colonnade +1.9, rear 0.0), nothing blew to white, nothing is pure black, colour is
where it was (worst case home 93% → 92%). `tools/feet.js` is untouched at 715 meshes, 48 floors, 129
blockers and 81.8% of the garden reachable; `tools/standup.js` is clean; `tools/fps.js` reads 1.6 where the
last session read 1.8, and nothing was built that was not there before, so that is the sandbox breathing
and not a cost.

**For the next session, in the order the pictures put it.** (1) The room behind the front glass: read at
arm's length (`pictures/s68-room.png`) the ceiling is a near-black waffle of roof tiles and the back wall
is a flat mid-grey, and that room is what a visitor is shown through six metres of glass in the first
picture. (2) The rear face is a big plane at L103 with almost nothing in it but a door and two lanterns
(`801-rear`); it is not wrong, it is inert — the eave throws no shade onto it and its corners keep no
weather. (3) The paving's joint now reads; what it does not do is wander: every joint is dead straight and
square for 30 m, which is how a machine-cut floor looks and not a laid one. (4) Still unspent from earlier
lists: the pale smooth palm trunks, the mower stripes that only show from overhead, the green sky fill, and
the terracottas all one family. (5) New: the far rank's edge wants heads in it, not a smoother wave — see
item 3 above, and note that `cardRank` already exists for exactly that job at the near rank.

The browser was in the room all session (**2000 of 2048 slots free**). The eye handed over one job: *the
pool's two grids sit on each other*. It was a real fault and the diagnosis was wrong, and the wrong
diagnosis is the part worth writing down.

1. **The grid was not the caustics at all: it was a bump map minified without a mip chain.** The first
   thing done was the honest one — repaint the caustic net — and the standing view came back
   **byte-for-byte as gridded as it was**: `tools/pair.js` showed the wire frame still sitting on the far
   wall. So the layers were switched off one at a time at the start camera: caustics off, the grid stayed;
   the tile bump's `level = 0`, the grid **vanished** and the pool read as water for the first time
   (L76.7 → L81.8, and the frame's block-to-block spread 13.6 → 9.2). The reason is arithmetic: the tile
   bump is a 256 canvas over a 0.8 m repeat — twenty-one texels to a mosaic tile — and at six metres a
   tile is four pixels, so the GPU was reading one texel in five with nothing averaged over it. Every
   tile's arris came back as a beat, and the beat was a square lattice in register with the mosaic, which
   is what looked like two grids laid on each other. `mipmaps: false` sat on **fifteen of the Villa's
   seventeen** bump maps (`grep` finds none now but the water's), including the paving, the plaster, both
   teaks, the roof, the bark, the stalk, the bush, the soil, the pots, the timber and the stone.
   Giving them their chain: pool tiles **L76 → L84** and block spread **13.6 → 10.4**; paving grain
   8.45 → 8.18; plaster 3.53 → 3.12; terrace floor 8.24 → 7.86; and every one of the seventeen standing
   views moved by 0 or +1 of luminance, so the fix is local to where the minification was, as it should
   be. The one measured exception: **the water's ripple does not care** (under 0.1 of a point of frame
   variation either way, no light at all), because a 1.7 m repeat never lands in a five-fold
   minification; it is mipmapped for tidiness and says so in `src/materials.js`, so that no future
   surface inherits the habit.
2. **The caustic net was a lattice too, and value noise was the reason.** Two *ridged* value fields at
   nine and sixteen cells to a 1.25 m repeat: ridging and sharpening a value field does not remove the
   square lattice it was grown on, it just draws it thinner, and at sixteen cells the lines stood 7.8 cm
   apart against a 6.7 cm mosaic tile. The net is now built from scattered points — `cellNetField`, which
   asks for the two nearest points to every pixel and paints the line where they are equally near. Cells
   of uneven size at eighteen and eleven cm, bent by a seamless field so no run lies straight, lit by a
   slow field so the brightness of the net wanders over four or five cells. `pictures
   /s67-caustics-old.png` against `pictures/s67-caustics-net.png` is the canvas twice tiled, and the
   tiling is the seam test: no line shows. A metre over the water the floor reads L139 where the released
   net gave L134, with more variation in the frame and less of it flat — the new net is *brighter*, which
   was not assumed: `tools/causladder.json` was run against `releases/v0.63.0` for exactly that question,
   because a net with thinner lines is a net that covers less floor and could have quietly dimmed the pool.
3. **The CPU drawing was told** (`tools/draw.js`'s caustics stand-in: the same two pitches, cut harder so
   only the crests survive, ridden by the same slow brightness), and `src/surface-colours.js` says what
   the net's two pitches are.

**Two lessons, both about believing a measurement.** (a) **A texture swapped into a live page is a
stand-in, and it lied twice.** To tell bump from no-bump I rebuilt the tile bump on the page with
`new BABYLON.DynamicTexture(...)` and measured: the first attempt painted the pool black (a fresh
DynamicTexture holds nothing until `update()` is called), and the corrected one reported the no-mip
build at *less* frame grain than the source's own no-mip build — a plausible number for a build that
was not the one in `src`. The same question answered by editing the one word in `src/materials.js` and
re-photographing reproduced the wire frame exactly. Same rule as `tools/feet.js`'s stand-in shadow lamp:
**if a probe cannot reproduce the released build's fault, it cannot clear the working tree's either.**
(b) **Reproduce before you conclude**: the whole session turned on taking the old source back out of
`/tmp` and confirming that `mipmaps: false` gives L76.7 / 14.70 grain and the chain gives L84.3 / 12.65.

What the pictures say now: `pictures/s67-home-pair.png` (the start view, before and after) and
`pictures/s67-grid-pair.png` (forty pixels of the far wall at three times — the wire frame against the
tiles it used to be). The standing set is **`700-home` … `716-backstore`**, against `650`–`666` as v0.63.0
left them. `tools/standup.js` is clean, `tools/feet.js` unchanged (715 meshes, 48 floors, 129 blockers,
81.8% reachable) and `tools/fps.js` still 1.8 fps, so a mip chain cost no frames.

**A housekeeping sin, confessed where it can be read.** `tools/photos.sh` numbers from 025 unless told
otherwise, and this session ran it without `--from`: **`pictures/025-home` … `038-westwall`, the
sixth-session set that the notes name as a range, are overwritten** with v0.64.0's pictures under the old
names. Nothing named by a *whole* file name was lost. Before running `photos.sh`, look for the newest
number in `pictures/` (`ls pictures | cut -d- -f1 | sort -n | tail -1`) and pass a `--from` clear of it;
this session's set was moved to 700–716 and 700 is a clear number.

**For the next session, in the order the pictures put it.** (1) The belt's near rank
(`canopyClusterCanvas`) still has no padding and stands 27-53 m off — and now that the mip chain is the
live question, note that an unpadded atlas averaged down a chain is exactly the fault `tools/atlasair.js`
was written for. (2) The shrub's silhouette still wants leafy clumps on its rim and not only on its face.
(3) The privet leaf in the atlas is still holly: pointed, one bright rib. (4) From the old list, still
unspent and untouched by this session: the pale smooth palm trunks, the mower stripes that show only from
overhead, the green sky fill, and the terracottas all one family. (5) New, because the mip chain made it
visible: the paving and the roof at 10-20 m are now smooth enough that their *colour* has to carry them,
and both are flatter than the pool deck was — worth a look with `tools/pixels.js --patch` before another
knob is turned.

## What was done this session (65th, 2026-10-17) — the bush had its mirror on; and its air was black 🪞➡️🌿

The browser was in the room all session (**2009 of 2048 slots free**) and the first thing read was the
west shrub at 2.6 m (`pictures/s65-bush-before.png`): a clipped green dome wearing flat paddles, dark in
the middle and blinding round its equator. Two faults were in it, and the first one took eleven browser
runs to find because it was not where anybody had been looking.

1. **The shell was brighter than the leaf in front of it, and it was the sky's mirror.** The cards — the
   leaf that stands OUT of the bush, and the layer the sun reaches — painted **(47,82,13)**; the shell of
   cut-out leaf behind them, which is the shade between the leaves, painted **(70,114,20)**. The 64th
   session had measured this and handed it on, and had killed the pigments and the lift; this session killed
   the rest. Forcing every card's normal to point square at the sun: **+6**. Straight up: **+9**. The
   scene's shadows off: **+0**. The two materials' albedo already equal. Then the ladder that settled it:
   `mats.bushEdge.specularIntensity = 0.02`, and the shell fell **L98 → L59** while the cards did not move
   at all. That is `specularIntensity` 0.25 standing on a smooth sphere — a broad sun-glint spread over the
   whole camera-facing side of the lump, worth thirty points of light and a washed-out pale green, on the
   one layer that is supposed to be the dark. A real bush is a thousand waxy leaves at a thousand angles and
   the mean of that is a soft green: that was already the written argument for the cards' own sheen of 0.02,
   and it was always as true of the shell, which is the same leaf over the same lump. Every session since
   the 61st that complained of the bush being "the loudest green in its corner" had been paying the mirror
   down out of the leaf's own bytes instead of switching the mirror off. So: all three of the shrub's greens
   now sit at sheen 0.02, and what the mirror was carrying is paid back as colour — the shell two thirds of
   it (`[3.9,5.45,3.76]`), the cards more than the shell (`[5.24,7.3,5.06]`, because the tone curve gives
   back almost nothing at the bottom of its range: it took ×2.5 to move a card 25 points), and the heart
   nothing, because the heart IS the shade inside. In a browser now the cards are **(51,95,15)** and the
   shell **(42,84,11)**: the sunward leaf is the brightest thing on the plant, which is the whole point, and
   the whole bush sits between the hedge (L81) and the lawn (L112) where a self-shading shrub belongs.
2. **The atlas's air was black, and the padding that was written to fix it had never once worked.** A mip
   level is a block average, so a leaf is averaged with the air round it; `padAtlas` in `src/textures.js`
   has been painting the leaf's colour into that air for six sessions, and the canvas threw every drop of it
   away, because a 2d canvas stores its pixels multiplied by their alpha and keeps no colour in a pixel
   whose alpha is nought. The new **`tools/atlasair.js`** says it flatly: after padding, the shrub's atlas
   had leaf pixels at (91,121,59) and air at **(4,5,2)**, and `--row 8` prints the row still black where the
   sweeps had painted. Air now carries a quarter of a leaf's alpha — still under the material's cut-off of a
   half, so a card at full size is exactly as cut out as it was — and the colour reaches the mip chain.
   Measured on the same camera against `releases/v0.62.1`: the clumps of standing grass come back
   **(100,129,31)** against (97,126,31), which is all they had left to gain; the shrub's cards were the
   victim at 53% air. The belt's near rank is NOT padded at all and is next for that treatment.
3. **A shrub was a mushroom.** One lump two thirds as high as it is wide with three lesser ones standing on
   the lawn around its foot: `pictures/s65-bush-before.png` is one clean arc with three small arcs beside
   it. The middle lump stands up (0.66-0.88 of its width and not 0.56-0.76), there are four lumps always,
   and the three lesser ones are gathered on one side (`leanTo`) and ridden a hand up its flank (`ride`,
   0-0.11 of the plant's size) instead of standing beside it. Two refusals are photographed, because both
   were tried and each taught something: `pictures/s65-bush-shape.png` is the mass stood straight up — a
   green egg taller than the hedge behind it — and `pictures/s65-bush-shape2.png` is the shape kept with the
   cards still told to stand straight at the sky, where every card at the crown is laid flat on it and a flat
   sheet a hand across is a PLATE. The cards' sky weight came down from 1.0-1.6 to 0.9-1.5 and each is
   kicked a quarter-turn off vertical in the horizontal; the middle was kept, because at the other extreme —
   `pictures/s65-bush-cards.png` — the skin leads and the shell shows through as bare hollows. The skirt of
   leaf stops 0.07 of the plant's size above the ground now, not 0.02, because a card planted at the foot
   lies out over the lawn and the grass tufts were already standing there.
4. **The CPU drawing and the Villa's own notes were told.** `src/surface-colours.js` carries the three bush
   lines re-fitted to the browser's new numbers (shell three quarters down, cards a little up, heart down by
   half), and `jargon.md`'s **pad** entry now says what padding costs, with **air** written down beside it.

What the seventeen standing pictures said after it (`node tools/scan_old_new.js 2576 650`): **every view
moved by 0 or +1 of luminance**, nothing blew to white, nothing is pure black — which is the honest size of
a change to a plant that fills a corner of six of those frames. The change itself is
`pictures/s65-bush-before.png` against `pictures/s65-bush-final.png`, and the whole set as one picture is
`pictures/s65-set.png`. `tools/standup.js`, `tools/feet.js` (715 meshes, 48 floors, 129 blockers, 81.8% of
the garden reachable) are clean, the atlas is the same size and the meshes are the same meshes, so nothing
was added to the walk. New eyes: `tools/atlasair.js`, and `tools/bushface.json` rewritten as the mirror
ladder with the shadows switched off as a control.

**For the next session, in the order the pictures put it.** (1) The belt's near rank (`canopyClusterCanvas`)
is not padded and stands 27-53 m off, where a mip level does the most damage: give it `padAtlas` and measure
it at the south border. (2) The shrub is a rounded bun with a lopsided top now, not a dome, but at 2 m a
spray card is still big enough to read as a spray: the outline wants the crumple to reach the very edge of
the silhouette, which means leafy clumps on the rim and not only on the face. (3) The leaf cards' own atlas
still reads as holly at arm's length — pointed leaf, one bright rib — where a privet leaf is rounder and
duller. (4) The housekeeping list from the 62nd session is still unspent: the pool's two grids sitting on
each other, the pale smooth palm trunks, the mower stripes that show only from overhead, the green sky fill,
and the terracottas all one family.

## What was done this session (64th, 2026-10-17) — the bananas were palms with pink flowers; they are bananas now 🌴🌸➡️🍌

The browser was in the room all session (**2009 to 2011 of 2048 slots free**) and the eyes were used
first: one close crop of the west clump (`pictures/s64-banana-before.png`) said the banana plant was the
worst thing in the garden, and it turned out to be four faults and not one.

1. **The pseudostem wore bark.** Photographed on the stem, it came out a net of little chevrons in olive
   gold, measured at **(93,105,19)** — a green twelve points over its own red, which is dry grass. Two
   causes, both in `stalkCanvas`: the two noise washes it laid over its sheaf bands (cells of 16 and of 44
   texels, so blobs of 3 cm and of 1 cm on a 20 cm stem) aliased at four metres into that weave, and the
   olive base colour meant the tone curve crushed the blue before the green was up. So the canvas is painted
   with **every mark running the length of the stem** — sheaf bands of 3-6 cm, each with its own weathering
   in tall narrow patches, a pale waxy lip and a dark seam at the lap, seven fibre lines a sheaf, and ONE
   slow mottle whose cells are a hand across. Nothing squarer than that is on it, because a field of cells
   is a weave and a weave is bark at four metres. The base went cool: `#46684a`, bands at (78,116,68)×tone.
   Then the **leaf-scars**: one ridge every twelve or fifteen centimetres, sloping a little because the
   sheafs spiral, which is the only mark that crosses them and the one that breaks the barber's pole. The
   bump came down from 26 to 16 and its level from 0.5 to 0.32 for the same reason. A browser now puts the
   lit stem at **(110,154,58)**, against the palm bark's (138,109,67) and the lawn's (99,121,39) in the same
   frame: green, and of the garden.
2. **The flower was a pink party hat.** A plain truncated cone on a short pin, and `pbr` reads a `color:` as
   RAW LIGHT, so [78,32,32] was (0.31,0.13,0.13) of red — near four times what those bytes make inside a
   pattern — under a sun and a `specularIntensity` of 1. It came out salmon, (80,35,34) with a (200,120,110)
   highlight, at exactly the height where the crown's leaves cross. Now: the colour goes through `paint`
   (**[86,34,46]**), roughness 0.7, `environmentIntensity` 0.55, sheen 0.14, plus a hair of its own emissive
   so a bud in the shade of its crown is a dark purple and not a hole. It is a hand long and two spans
   across, laid in **five courses** along a girth that swells at the shoulder and draws to a point, every
   course but the top a tenth fatter than the one above ends — that step is the shingle of the bracts, and
   it is the only thing at that size that says BRACT and not CONE. (Two earlier tries are on disk: one cone
   = a party hat, `pictures/s64-bud-before.png`; three rings over a straight barrel = a red fire
   extinguisher; and thin courses = a chilli pepper.) The rachis was then given a longer first leg, forty-eight
   degrees off straight down and a hand and a half long before it gives at all, because a bud that hangs down
   the axis of the stem hangs behind its own leaves: the west clump's first plant now carries its centre at
   (-19.14, 1.86, 7.02), a hand beyond the stem, and **two maroon flecks of it show in the standing `grass`
   frame** (`pictures/s64-grass-budcrop.png`) where before there was none. Measured on the bud itself at 1.4 m:
   **(52,16,21)** to (77,10,23) — a maroon bract with a little purple in it. `pictures/s64-bud-hanging.png`
   is it with the leaves switched off, which is the only way to see one whole: `js` in
   `tools/bananaprobe.json` hides `bananaLeaf` for exactly that.
3. **The blades were straps and the crown was a palm.** `half` was 0.30-0.39 m on a 1.55-2.0 m leaf, and
   the wind was let through a third of an old leaf's stretches, so the crown was ten ribbons. A banana's
   blade is a **paddle**: `half` is 0.40-0.52 now, the blade is laid in **five bands** instead of four (four
   shelves across a blade that broad is a crease you can lay a ruler on), and the tear is always a tear — in
   from the margin along the veins, stopping short of the rib, one stretch in nine of an old leaf. The cut
   that went clean through to the rib is gone: a hole that wide between stations 15 cm apart is a hole, and
   the leaf came out punched. `pictures/s64-banana-before.png` is the before and `pictures/s64-clump-4m.png`
   the after, which is also `pictures/s64-grass-budcrop.png` read at two times.
4. **The CPU drawing followed.** `surface-colours.js` `stalk` is the new canvas's mean lifted a third (the
   browser's lit stem and the drawing's differ by more than the drawing's standing shortfall otherwise) and
   `bud` is the material's bytes now that they are read through `paint`.

What the standing pictures said after it: the banana clump fills a corner of ONE of the seventeen frames, so
`node tools/compare.js pictures/2539-grass.png pictures/2602-grass.png` is the honest measure — a mean gap of
**0.9 of 255 per channel** over the whole view, with the six cells that moved most moving 2-3 points and each
of them a cell the clump stands in; `westlawn` and `eastlawn`, which do not see a banana, came back **0.0**,
which is the proof that nothing else moved. No frame blew to white, none is pure black. The change itself is
`pictures/s64-grass-pair.png`, the same camera before and after.
`tools/standup.js`, `tools/feet.js` (715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable) and
`tools/shadows.js` are clean, and nothing was added to the walk. The drawing without a browser runs 20 points
of light dark of the browser on this view (L71 against L91), which is its standing shortfall and no more; the
new `stalk` tint in `surface-colours.js` narrowed it rather than widened it. New eyes:
**`tools/bananaprobe.json`** (the bud and the stem, with a case per colour tried and the leaves switched off),
**`tools/bushface.json`** (the shell against the cards, one pixel at a time, layers switched off),
**`tools/pair.js`** (before and after as one picture), and three close cameras added to `tools/propcams.txt`
— `banana`, `bud`, `stem`.

**Releases: v0.62.0 and v0.62.1.** Only `grass`, `westlawn` and `eastlawn` were re-photographed into
`pictures/` at new numbers (2600-2602): the banana clump stands in one of those frames and in no other, and
the two that cannot see it came back identical, so the other fourteen standing pictures of the set at 2576
are still the current truth for their views and were not shot again for the sake of a timestamp.

**The one thing for the next session** is the shrub's layers, measured above: make the sunward cards brighter
than the shell behind them — by the atlas's own leaf tones, or by paying the shell down to what a shaded
interior owes, since the albedo of `bushLeaf` is proved not to be a lever — and then look at `grass` and at
`pictures/s64-banana-before.png`, where a bush's crown is dark and its skirt is lit.

**Still open, and now measured, for the next session.** The bush's layer order is still upside down, and
`tools/bushface.json` is the probe that says so: at one pixel on the skirt of the west shrub the cards paint
**(56,81,29) L72**, and with the cards switched off so the shell shows in their place, that same pixel is
**(76,108,35) L96** — the shell, which the cards stand OUTSIDE, is 24 points of light brighter than the
sunward layer. Three things the probe killed, so the next session does not chase them: the two materials have
the SAME albedo lift (both (2.38,3.32,2.3)), so it is not a lift; `mats.bushLeaf.albedoColor.scaleToRef(1.25)`
made the card *darker* (L85 → L81), so the albedo of that material is not a lever at all — it is above one
already; and lifting the cards' emissive to (0.16,0.3,0.11) moved the same pixel four points, which is not
where the 24 is. What is left is the **light on the two layers**: a card is told to stand "out of the skin
and up at the sky" (`ny = 1.0 + rand()*0.6` in `bushLeafage`), so it is lit by the sky's fill, while the
shell's leaf lies wherever the ball's skin lies and — on the camera side — faces the sun. Either the cards
lean more with the skin and less at the sky, or the shell is paid down to what a shaded interior owes.
Second: a clipped shrub is still a **sphere** — the crumple gives it shoulders but the outline is a ball.
Third, new this session: a bud hangs in the crown and still shows only as a fleck or two from a stride away
(`pictures/s64-grass-budcrop.png`, and `pictures/s64-bud-in-place.png` at three metres); the longer rachis
helped, and the rest of the fault is that the crown's leaf roots sit above it — lifting the crown, or shortening
the youngest three leaves of every plant, is what would free the bud outright.

## What was done this session (63rd, 2026-10-17) — a bush was a crowd of green compasses; it is leaf now 🧭🌿➡️🌿

The browser was in the room all session (**2009 of 2048 slots free**). `pictures/s63-set.png` — the whole
standing set in one sheet — said the Villa's carpentry is settled and its **shrubs are not**. Then one
close crop of the west shrub at 2.5 m (`pictures/s63-urchin.png`) said it plainly: a bright lime ball
bristling with flat green paddles, punched with near-black holes, and covered — actually **covered** — with
small five-pointed stars. Four separate faults were in one plant, and every one of them was in the code as
a tidy, reasonable-looking loop:

1. **Every spray was a star.** `bushClusterCanvas` laid its thirty leaves at `i/count` of a full turn about
   the middle of the cell, each pointing out from that middle: an asterisk. Then it drew "twigs" — four
   dark strokes from the cell's centre to its rim — which is a four-armed star on top of it. And
   `bushLeafage` turned each card one of **eight** ways, so the same star came back again and again in a
   rank across the front of the bush. `pictures/s63-atlas-stars.png` is that atlas: it is a sheet of
   holly, not of leaf. The ring is gone; the leaf is grouped into **buds** (three to five on a short stem)
   and the buds are thrown anywhere, each leaning any way, with no link left between where a leaf sits and
   which way it looks beyond a third-of-a-turn bias. The twigs are out, replaced by three short strokes
   laid anywhere at any angle. The atlas went 4×4 on 512 to **6×6 on 768** (`bushAtlas`), which keeps the
   same 853 texels to the metre and gives a bush thirty-six sprays to choose from; and the card's turn is
   now a continuous roll of its own frame about its normal, not one of eight UV edits.
2. **The bush was bald, and the holes were black.** Measured off the painters: the card's atlas was **59.7%
   air** and the shell's tile — 380 sprigs of 4.5%-of-tile leaf cut out by the alpha — was only about a
   third leaf. So a card was mostly hole, the shell behind it was mostly hole, and behind both is a heart
   painted `#28491f`: three darks in a row, and what a browser wrote was (18,30,1) — not shade, soot. Now
   the atlas's mass is 0.33-0.38 of the cell instead of 0.28-0.33 (air **53%**), the card's own mass wears
   `mid` and not the darkest green in the atlas, and the shell's leaf is 5.8-10% of the tile at 430 sprigs,
   which is nine parts leaf in ten. The dark between the leaves is still there; it is a line now and not a
   puddle.
3. **The bush was the loudest green in its corner.** `tools/cover.js` on the west-lawn camera: its lit leaf
   tops ran to **(128,215,40)**, against the boundary hedge's (88,137,22) and the lawn it stands on at
   (164,192,54) — a green floodlight on the lawn. Two knobs were cranked: the cards' emissive was
   (0.09,**0.27**,0.048), a green searchlight with no blue in it, and the atlas's `lit` ran to [140,194,82].
   The emissive is **(0.1,0.2,0.075)** — the green down, the blue up, because a green with no blue in its
   shade is soot and the boundary hedge keeps (35,65,10) in the shade — and the leaf tones are a tenth
   lower and redder. The lit tops now come to **(111,175,45)**: still the brightest leaf in the frame, which
   is right for a leaf with the sun on it, and 40 points of green short of what it was. The card tone spread
   came in too, `(0.94+0.3·crown)(0.92+0.24·rand)` → `(0.96+0.16·crown)(0.95+0.14·rand)`: a bush is one mass
   with a few lit tips and not a harlequin.
4. **It was lime and the garden is olive.** Painted red-over-green on the shell was 0.54 against the lawn's
   0.79. `bushEdgeCanvas` takes a `base` now — the crest keeps its own [56,80,36], the bush's shell wears
   **[62,78,42]** at `shade` 0.78 — and the atlas's three tones all moved red up and green down. Ratios are
   about 0.76 at the source now, which is what a privet leaf is.

All of it was measured, not felt: `node tools/canvassave.js bushClusterCanvas pictures/x.png 768 --tile 2`
showed the stars and prints the share of air (the number that found fault 2); `node tools/cover.js` on
`?float=1&view=-13.5,1.5,8,-1.57,0.18` printed the material table quoted above; and
`tools/bushlayers.json` is a new probe that hides one layer of the bush at a time (`scene` is on
`window.__villa`, so `js` can set `isVisible`) — that is how the shell was found to be **brighter** than
the cards standing on it. `tools/bushlift.json` is a ladder for lifting the cards by their `albedoColor`.

`src/surface-colours.js` followed the atlas down by the same fraction (bushLeaf tint [55,108,24] →
[47,90,26], wash high [128,240,70] → [108,196,66], glow read off the new emissive), so that the CPU drawing
keeps the gap it has always kept against the browser on this view: it drew bushLeaf at (78,150,31) over the
old atlas and the browser at (50,96,11); it draws (69,123,33) over the new one and the browser at
(38,70,8). The same over-range by design, which is the only honesty a sheet-lit drawing can offer.

What the seventeen standing pictures said after it (`node tools/scan_old_new.js 2508 2525`): **every view
moved by 0 or −1 of luminance**, nothing blew to white, nothing is pure black, "in colour" moved by a tenth
of a point anywhere. The bushes are small in those frames; the change is in `grass`, in the two great pots
of `home` and in the shrub at the foot of `westlawn`, and those were read as pictures and not as numbers.
`tools/standup.js`, `tools/feet.js` (715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable)
and `tools/shadows.js` are clean, and nothing was added to the walk: the atlas is bigger and the meshes are
the same ones.

**Left open, and measured, for the next session.** The layer order is still upside down: the shell paints
(79,129,23) in the browser and the leaf cards that stand OUTSIDE it paint (38,70,8). The cards are the
sunward layer and they are the darker of the two, which is part of why a bush reads patchy at arm's length.
`tools/bushlift.json` is the ladder for it and `tools/bushlayers.json` is the control. Second: the shrub is
still a **sphere** — the crumple gives it shoulders but the outline is a ball, and a clipped shrub that is a
perfect ball on flat lawn reads as a garden ornament at one remove. Third: the same close-up shows banana
stalks wearing what is unmistakably palm bark with a herringbone in it (`mats.stalk` reads as bark at 6 m),
which nobody has looked at yet.

## What was done this session (61st, 2026-10-17) — every wood was one marmalade; the Villa has three woods now 🟧➡️🟫


The browser was in the room all session (**2009 of 2048 slots free**) and the eyes were used first, as the
last session learned to: `pictures/s61-set-2440.png`, the whole standing set in one sheet, then crops. What
it showed was not a light fault but a carpentry fault. **The terrace deck, the posts, the wall boards, the
sala's table and the chairs by the pool all came back the same saturated orange** — a Villa of one pressed
board — and worse, the teak pattern was laid across the box it was painted on, so on a square post the boards
ran *horizontally*: every post in the colonnade wore a stack of rings instead of standing boards.

Three woods were cut out of one, and they are three in the browser and not three in the code only
(`tools/woodprobe.json` measures the same named places in both builds; `--url` at a release folder is how the
before column was got):

| place | v0.59.1 | now |
| --- | --- | --- |
| terrace deck, open sun | 180,100,36 L112 | **202,153,73** L158 |
| terrace deck, west end | 181,103,42 | **204,157,79** |
| front post | 219,116,44 L133 | **180,116,64** L126 |
| front corner pier | 216,115,45 | **186,120,66** |
| terrace chair arm | 220,137,70 L150 | **209,131,77** L143 |
| sala floor, in shade | 117,119,42 | **135,131,48** |
| sala floor, in sun | 185,101,41 | **221,127,54** |
| sala table | 175,106,46 (wall boards) | **174,115,69** (furniture) |
| control: pool water | 73,154,160 | 75,155,161 |
| control: shaded plaster | 147,130,99 | 146,130,99 |

So: the **deck** is now the palest wood in the Villa and a shade greenest (a weathered tan), the **structure**
— posts, wall boards, soffit, beams, door — is a dark brown, and the **furniture** is a golden middle. The two
controls did not move, which is what says the woods moved and not the light.

- **`src/textures.js`**: `teakCanvas` takes `wood: "deck" | "structure"` and paints from `teakWoods`, two
  palettes written down in full (base, dark, light, seam, two wash tones each). `quarterTurn()` turns a painted
  square a quarter of a way round, which is how an upright timber pattern gets its boards lying up.
- **`src/mesh.js`**: `patternUp(mat)`, and `metricUVs()` will put the vertical metre-count on the pattern's `v`
  axis for the woods that stand up. **`src/materials.js`** marks `mats.teak` and `mats.teakWall` as upright.
  The post in the colonnade now reads boards from its foot to its capital.
- **`src/teak.js`**: the weather was retuned and **each floor keeps a base colour of its own** — the open terrace
  deck `[1.0, 1.0, 0.98]`, the sala's oiled floor `[1.35, 0.8, 0.62]`. This is the second use of that
  multiplier (the first was the tone average); the sala used to be the same colour as the terrace because the
  two floors shared every byte.
- **`src/props.js`**: the sala's table and its legs left `mats.teakWall` for `mats.wood`. It is a table.
- **`src/surface-colours.js`**: the CPU drawing followed byte for byte, including the grid turned upright on
  the boards that stand.

Two false leads, both measured, both worth keeping so nobody walks back into them:

1. **Grey was not the way to stop the marmalade.** The first deck palette put its blue nearly level with its
   green — base `[150, 92, 86]` — and the sunlit deck came back **(200,104,94)**: not weathered silver, but a
   *salmon floor*, a deck the colour of a flamingo's breakfast. Under a sun of `(1, 0.71, 0.46)` a wood whose
   blue is as high as its green reads pink, because the sun barely lights the blue channel at all and what
   blue there is comes off the albedo and not off the sky.
2. **The other floor said no to the same idea from the other side.** The sky's fill is `(0.4, 0.58, 0.88)`:
   green over red. A board painted neutral goes **olive** in the shade — the sala floor read (117,119,42), and
   pushing the pattern's green up to fix the sunlit deck pushed the shaded sala floor further into olive. So
   one albedo cannot be a cool grey under a green shade and a warm tan under a warm sun. The pattern keeps red
   over green over blue, and the *floors* do the leaning: the open deck keeps its green and weathers to a grey
   tan, the sala's roofed, oiled floor trades green for red. That is why the sala is the warmest floor in the
   Villa and the terrace the palest, which is also what an oiled floor and a weathered one do in real life.

What the standing pictures said after it (`tools/scan_old_new.js 2440 2491`, all seventeen views): mean
luminance moved by 2 or less everywhere, nothing blew to white, nothing is pure black, and the deep-shade share
(L≤31) crept a hair on the shaded views only — `rear` 0.5→1.6%, `rearup` 2.3→2.7%, `westwall` 0.9→1.2% —
because a dark brown structure holds less light in a shaded corner than the old orange did. **"In colour"
fell 0.1 to 4.4 points on the timber-heavy views** (`colonnade` 97.5→93.3%, `frontcorner` 98.0→93.6%), and
that is paid on purpose: the frame counts how far apart a single pixel's own channels are, and a wood that is
not a saturated orange has less spread inside one pixel while the *gap between* the woods grew, which is the
thing the eye was complaining about. `tools/draw.js` still reports nothing blown and nothing black, and
`tools/feet.js` says every door is still reachable.

## What was done this session (60th, 2026-10-17) — the standing grass was a row of green crowns; it is grass now 🌾➡️🌿

The browser was in the room all session (**2009 of 2048 slots free**) and so were the eyes, and the session
went into one plant: the clumps of grass that *stand* up out of the mown sward — along the pool paving, in
the beds at the foot of the house, and scattered over the lawn where the mower went past. The whole frame
was read first (`pictures/2320-home.png` and its sixteen siblings, as a sheet) and the fault was obvious
in the crops, which is where it was worked: `pictures/s60-verge-pair.png` is the same verge four metres
off, v0.57.0 on the left and this on the right.

### Fault 47: a clump was a spiky rosette standing on a lawn

- **From four metres it was a row of little green crowns** with a saw-tooth top, each one separate from
  the sward it grows out of; from the west lawn camera the scattered ones were arrowheads and asterisks
  strewn over the lawn, not texture in it (`pictures/s60-westlawn-pair.png`, before on the left).
- **And it was twenty-four points of light darker than the grass it stands in.** On the `grass` camera,
  where the clumps are 1.7% of the frame, Chromium painted them at **mean (77,107,21) L94** over a lawn
  at (103,130,38) L118. A clump is a self-shaded mass and may fairly be a little darker; a plant in a pot
  is 24.

### What a clump is now

Three faults in the shape, one in the paint, and one in the plan:

- **Four crossed sheets and not three, five on an old wide crown and not four.** Three cards star-crossed
  are six arms of a star, and that is exactly what a raised eye saw: the atlas's own silhouette is a fine
  spray of tips (`pictures/s60-clump-painted.png` against `s60-clump-painted-before.png`), but the card
  edges splayed out wider than the spray and made the asterisk. `grassTufts` is 3,829 sheets where it was
  3,038, and 7,658 triangles — **1.1% of the Villa's 679,640** — with the frame rate unchanged at 1.8 fps
  in software WebGL and the boot cost inside its own noise (measured both ways round, because the first
  page a browser loads is 1.5 s quicker whatever it is: 5.4 s against 6.9 s for v0.57.0 and this, and the
  same 1.5 s gap when the order is flipped).
- **Narrow blades, less splay, smaller clumps.** A blade is 0.9–2.8 px of the 256 px square where it was
  1.5–4.2 (2–6 mm of a clump, which is what grass is), 430 of them and not 300, and the outer leaves are
  thrown out at 0.27 instead of 0.36. A clump's own sheet is now 0.72 + age·0.2 of its spot across and
  0.56 tall, where it was 0.78 and 0.62: at the big end it was nearly a metre wide, which is a shrub and
  not a tuft.
- **The paint stopped shading itself into a hole.** The foot wash came from 0.45 to 0.30 — it was laid in
  the lawn's own darkest green "and no darker", and that is what it was doing — and each clump's tint
  against the tone of its ground went from 0.86–1.16 to **0.95–1.21**, because a clump under 0.95 is a
  dark plant in a light lawn. Same camera after: **mean (80,112,22) L99**, still nineteen under the sward
  and now reading as a crowded mass and not as a plant.
- **The verge is patchier.** The bare place between one drift and the next went from one position in seven
  to one in five. A ruled row of clumps every 0.7 m along the stone is a planted hedge; the mower misses a
  kerb in patches.

### The drawing was told

`src/surface-colours.js` carries the clump's tint as a fit and not as the canvas's bytes, and the fit went
out with the canvas: **[68,40,7]** where it was [106,56,12], which puts the drawn clump at (82,123,30)
against Chromium's (80,112,22) on that camera — two of red out, eleven of green and eight of blue, all of
it the flat light a card gets in `shade()` and none of it in the tint. `tools/sheets.js` says the clump's
own light still costs the same in both renderers (0.027,0.128 measured, 0.027,0.127 in the drawing), and
`tools/draw.js` cuts its fake blades at sixteen columns and not twelve, because the real ones are finer.

### And then the strays in the mown lawn came down too — v0.58.1

The same fault, one notch further. The clumps `scatter` lays over the sward were `size: 0.26-0.28`, which
at the big end stands 0.25 m over a lawn cut to six centimetres: a specimen plant, and a field of them read
as a field of little green arrowheads from the south border (`pictures/s60-strays-pair.png`, before on the
left). They are `size: 0.2` now, and the "young" age in `tuftShapes` holds its blades tighter and more
upright — spread 0.28 and splay 0.5 against 0.34 and 0.7 — because a crown that has not split yet is a spike
and not a fan. The long grass along the stone is an older age of plant and is untouched. On the `grass`
camera the clumps come out (84,117,24) L103, fifteen points under the sward; `tools/draw.js` puts them at
(82,125,31) on the same camera, which is the same flat-light overshoot as before and needs no second fit.

### What the pictures said

Standing set photographed as **`2360-home` … `2376-backstore`** against `2320`–`2336` as v0.57.0 left it, and
again as **`2400-home` … `2416-backstore`** after the strays came down: all seventeen came out within one
point of luminance, none pure black, none blown, colour within a tenth of a point — which is the shape this
change has: it moves one part in sixty of a frame and it moves it properly. `tools/feet.js` still walks the whole garden (715 meshes, 48 floors, 129 blockers, 81.8%
reachable from the start, no stumbles), `tools/tuftfoot.js` looked at all 3,829 sheets and found none
standing on built stone and none in the pool, and `tools/planted.js`, `tools/standup.js` and
`tools/shadows.js` are clean. Working pictures kept: `s60-verge-pair.png` and `s60-westlawn-pair.png` (the
before-and-after at 4 m and at 20 m), `s60-tuft-close-pair.png` (the same verge crouched at, arm's length),
`s60-clump-painted.png` against `s60-clump-painted-before.png` (the painted clump itself, cut on its
ground), `s60-strays-pair.png` and `s60-southborder-pair.png` (one whole standing view before and after, so
that a change of one part in sixty of a frame can be looked at and not merely measured), and the four full
frames they were cropped from.

### What the grass still is not

Written up as fault 47 below: a clump is still flat cards with a painted spray on them, so at arm's length
(`pictures/s60-tuft-close-pair.png`) you can still see that the blades are drawn and not standing — the
near ones and the far ones share one plane, and there is no blade that leans *toward* you.

## What was done this session (58th, 2026-10-17) — the palm trunks were dark chocolate stovepipes; they are bark now 🌴🟤➡️🩶

The browser was in the room all session (**2009 of 2048 slots free**) and so were the eyes, and the session
went into one cylinder. `pictures/s58-trunk-pair.png` is the session in one picture: the same trunk, the
released Villa on the left and this one on the right.

### Fault 58: every palm in the Villa was a stack of brown coins

It showed worst in `westlawn`, where a trunk fills the middle of the frame two metres off, but it was in
every view with a palm in it. Two faults, and the second hid the first:

- **The bark was so dark that a trunk read as a hole.** Measured on the published copy at a camera 3.5 m
  off a trunk (`tools/tint.js --url …/releases/v0.55.1/index.html --view "-14,1.6,9.6,-1.57,0" --show palmBark`):
  the bark the browser painted came out **mean (80,58,22) L60, brightest (168,116,55)**. A face of the
  trunk turned away from the sun sat at **L31** — the lightness of the shaded hedge behind it, so the tree
  disappeared into the background and left a dark pole in front of it.
- **The rings were a centimetre and a half apart.** `palmBarkCanvas` laid a band every 6-11 px of a 256 px
  square that covers 45 cm of trunk: 15 mm, where a coconut palm's leaf bases are 5-10 cm apart. At that
  spacing nothing reaches the screen — `tools/canvasstats.js` gives the old square **mean 102,86,62, std
  10, with only 5 of that spread left after a 16-pixel block average** (4 after 32) — and what does reach
  it is a fine aliasing noise: a corrugated pipe, and a reptile-skin one once the bump map was thrown on.

### What the bark is now

Repainted in `src/textures.js`, and one line changed in `src/materials.js`:

- **Grey, not chocolate.** Base (150,136,114) with a broad weather running sixty points either side of it.
  The square measures **145,135,112, std 9, with 7 of the spread surviving a 16-pixel block and 6 a 32** —
  the pattern that reaches the screen is bigger than the one it replaced even though the raw spread is
  smaller. On the screen the same camera now says **mean (129,107,71) L109, brightest (232,187,127)**:
  forty-nine points of light back, and the brightest bark still short of blown.
- **Scars, not bands.** 4.5-14 cm apart, each a thin bowed ridge with a pale lip above it and a soft shade
  under it, drawn as a stroked path so it curves across the trunk; between them the bark is SMOOTH, which
  is what a coconut trunk is mostly made of and what the old square never had. Plus a moss crust, three
  faint vertical weathering streaks and a scatter of fibre dashes.
- **The relief was costing six points of light**, measured the same way: 0.8 as built L105, 0.45 L110, bump
  off L111. Level came down to **0.45** — the scars are still ridges where a hand would feel them, without
  the glitter. Same bargain the hedge refused.
- **Nine trunk segments and not six.** Nothing to do with colour: six lean steps left a knuckle in
  the silhouette at every joint, which a dark banded trunk hid and a pale smooth one shows at once. The top
  of the trunk is the same thickness as it was (the taper step went from 0.03 to 0.02 m per segment),
  `palmTrunk` went from ~3,100 triangles to 4,680 — 0.7% of the Villa — and the frame rate is where it
  always is in software WebGL: 2.0 fps this run against the 1.8 the fifty-third session measured, which is
  the machine breathing and not a gain. `tools/feet.js` still walks the whole garden: 715 meshes, 81.8% of
  it reachable from the start.

`src/surface-colours.js` got the same change as a mirror for the CPU drawing, and the drawing of `westlawn`
puts the bark at (115,95,67) L92 against the browser's (94,83,55) L83 on that camera — nine points LIGHT,
which is what fault 4 says a drawing does on a shaded face, so the two renderers agree.

### A tool, because the argument needed it

`tools/tint.js` now takes **`--url`**, so one ladder can be run against a released copy and against the
working tree at the same camera. That is the only way I know to answer "what did this change actually buy
on screen" against the version the owner can walk in, rather than against what the desk believed. The
numbers above came that way.

### The picture said

Standing set photographed as **`2300-home` … `2316-backstore`**, against `2187`–`2203` as the 57th session
left it. Nothing but the palms moved: the start view changed only where the trunk at the right edge of the
frame stands, and it now reads as a tree in front of the hedge instead of a dark bar in front of it.
Working pictures kept: `s58-trunk-pair.png` (the before-and-after of one trunk), `s58-palm-close-old.png`
/ `s58-palm-close.png` (the whole frames, 3.5 m), `s58-bark-old.png` / `s58-bark-new.png` (the two squares
as painted), `s58-crown.png` and `s58-nuts.png` (a crown and its three coconuts, which wear the bark too
and are the better for it), `s58-westlawn.png`, `s58-drawn-westlawn.png`.

### What the palm still is not

Written up as fault 45 below: a trunk is still a fairly straight cone, its nuts are a lump of bark,
and the knuckle where the fronds rise out of the trunk is bare.

## What was done this session (57th, 2026-10-17) — a clump was a maize plant and a cabbage; it is grass now 🌽🥬➡️🌿

The browser was in the room all session (**2009 of 2048 slots free**) and so were eyes, and the session
was spent on one square of paint and where it is put. `pictures/s57-clump-maize.png` against
`pictures/s57-clump-grass.png` is the session in two pictures — the same camera, three metres off a
clump — and `pictures/s57-verge-maize.png` against `pictures/s57-verge-grass.png` is the same fault
across a whole lawn.

### Fault 57: a dozen strap leaves in a vase, in every clump in the garden

The fifty-sixth session's tile was three hundred filled leaves gathered on one crown, and it was honest
paint, but photographed at three metres it was still **maize**: strap leaves standing straight up out of
one point, each a quarter of the clump across, each with a pale stripe down its own middle, the paving
visible straight through between them. Six sessions of these notes had the phrase "a little maize
plant" and the browser picture said why: a clump is not a sprinkling of leaves, it is a MASS with a
SHAPE, and the second tile had the mass and not the shape.

It is painted again, and four things are different:

- **Eight hundred blades, and narrow.** A hundredth of the tile across, which is 4 mm at a 40 cm clump,
  where the maize tile's were a thirtieth. The square is **56.5% air** (`tools/canvassave.js`) against
  72.4%, so what shows through the gaps is the shade inside the clump and not the scene behind it.
- **A DOME and not a fan.** A leaf's height is asked for `edge` — how far its own foot stands off the
  crown's middle — so the leaves at the edge are short and thrown out and the leaves in the middle are
  tall and nearly up. That single dependency is the whole difference between a fountain and a sheaf of
  cut corn, and it is why the last tile's leaves all stood up at the eye however hard its painter tried.
- **No pale midrib.** Every leaf is one colour with its TOP third a step lighter, because that is where
  the sun gets it. A pale stripe down the whole leaf is a maize leaf; a lit tip is a clump.
- **Feet over a patch and not a point**, and about one leaf in sixteen dead and straw — and a straw blade
  is now made smaller and duller as well, because a broad tan blade among green ones is a dead maize leaf.

### The first fix was a cabbage, and that is worth writing down

Dense and dome-shaped and no maize, the new tile read at six metres as **nine hundred little
brussels-sprout plants** (`pictures/s57-verge-cabbage.png`): a smooth dark dome, evenly lit, one for
every half metre of garden. Two faults, both fixed in the paint:

- **An outline that wanders.** A clump's silhouette used to be a smooth arc because hundreds of leaves
  average out. Two waves across each crown at random phase and random size put a plume where a shoulder
  of leaves all grew tall and a hollow where they did not, and one leaf in nine is a **stray** that
  stands a hand over its neighbours.
- **The light was flat.** A whisper on the tips and nothing else is a dark shape with a fuzzy top. The
  top light went from 0.09 to 0.17 and up over the top half of the square: the top of a clump is now the
  brightest part of it, as it is in a photograph. Kept under 0.2, because at that it bleaches the crown
  to the mint the mown sward is.

### One skin of four clumps, and a clump wears one

Every clump in the Villa was inked with the same square: the same silhouette, the same raggedness in the
same place, nine hundred times. The skin is now **four separate clumps of four ages** — `tuftShapes`:
young and tight, middle, old and low, straggly and gone to straw — painted at four seeds into
`tuftAtlasCanvas` (512 px, 2 × 2, a 256 px clump to a cell), and `makeTufts` gives each clump the cell
that matches its own age, with a jitter and a two-texel inset so a far clump never picks up its
neighbour's leaves. `pictures/s57-atlas-four.png` is the skin. Same trick as `canopyAtlas` in the belt
and `bushAtlas` in the shrub, and the same warning applies: **one mesh one material**, so the atlas is
one texture and one draw, and the clamp addresses are wanted and not the wraps.

Padding the skin with `padAtlas` is worth almost nothing here and is written up as such in
`src/textures.js`: far clumps moved from 93,110,42 to 94,110,42. It is done because an atlas with black
air in it is a trap for whatever is cut out of it next, not because a picture asked for it.

### The verge comes in drifts, and the lawn's strays are small

`fringe` used to set a clump down every 0.55 m with a 14% skip: a row with gaps in it. It now walks the
edge and, where a drift starts, sets down a crown and two, three, four more crowded in beside it, then
leaves the next place bare — 2 metres of long grass, 2 metres of close-cropped edge, the way a mower
misses a kerb. Court edges went to `every: 0.7`. The clumps scattered through the mown sward went **down**
to `size: 0.26-0.28` on purpose: a clump the size of a cabbage head in the middle of a mown lawn is a
planted specimen, and there were ninety of them in `westlawn`. `tools/tuftfoot.js`: **3,038 sheets, 0 on
built stone, 0 in the pool**; `tools/tris.js`: `grassTufts` is 6,076 triangles, 0.9% of the Villa
(it was 3,758).

### The clump's light is its own again, and not its lamp's

`mats.tuft.emissiveColor` was (0.26,0.44,0.16). Measured with the lamp switched clean out through
`tools/cover.js --js`: **89,119,26 with it, 85,106,25 without**, over a lawn that does not move at
102,129,38 — so (4,13,1) of the browser's green was coming out of a lamp inside the plant, and a lamp
inside a plant cannot be in shade. The lamp came down to **(0.21,0.36,0.13)** and the tile's ramp was
lifted to pay for it, so two thirds of a clump's light is now paint, which answers in the terrace's
shade and in the sun alike. A clump sits **ten points of light under the sward it grows out of**
(89,119,26 against 102,129,38 on the `grass` camera, 2.4% of that frame), which is a self-shaded mass
and not a hole in the picture.

A hypothesis tested and killed cheaply, in one browser run: that the alpha cut-off (0.42) was eating the
thin blades at a distance, leaving the maize look. Lowering it to 0.15 changed the clumps' share of the
frame by **nothing at all** (3.6% both ways), so the cut is not the fault and the tile was.

### What the pictures say, and what did not move

All seventeen standing views re-photographed (**2187-2203** against **2170-2186**): no frame moved more
than **0.5 of a point** of mean luminance, colour held to 0.2 of a point, nothing black anywhere, nothing
blown anywhere. That is the shape of change this folder wants — the fault moved and the picture did not.

The CPU drawing follows. `SURFACES.tuft` was refitted: `glow` at the measured (0.026,0.122,0.006) — which
`tools/sheets.js` now agrees with to the last digit — and `tint` at [106,56,12], which is a fit and not a
colour: on the `grass` camera the drawing paints a clump at 92,123,30 against Chromium's 89,119,26
(within four of a channel), against 36 points of green adrift before the tile was touched. The tint's
blue is nearly gone because `shade()` has no self-shadowing to spend and a flat added light has to be
paid for out of the pattern.

**The clock, checked and not assumed**: 5.27 s to the Villa standing, 5.50 s to the first frame
(`tools/bootcost.js`) against v0.53.0's 5.5 and 5.8 — four clumps painted instead of one and the boot got
*quicker*. **2.0 fps** (`tools/fps.js`), against 1.8-1.9. The walk is the same walk: 715 meshes, 48
floors, 129 blockers, 81.8% of the garden reachable from the start. `tools/standup.js`,
`tools/shadows.js`, `tools/sheets.js`, `tools/planted.js`, `tools/tuftfoot.js` all clean, and
`tools/views.sh` came back with nothing black in any of the seventeen CPU views.

### A new way to look: one picture of seventeen views

`tools/sheet.js <out.png> --set <number> [--cols n] [--width w]`, or with a list of pictures instead of
`--set`, pastes a whole set into one PNG with each view's name lettered under it (a 5×7 dot alphabet, so
no font is needed). Seventeen standing views at 420 px across is one read instead of seventeen, and it is
how the cabbage and the maize were found in the first place. It sits under `tools/`, which `release.sh`
does not copy.

### What is still wrong

1. **A clump seen from directly above is still a star of sheets.** The four sheets are sheets: from the
   air, and at a shallow angle straight along a sheet, you can read the card. Nothing in the standing set
   looks down from the air any more (`rearup` is the closest), so this is a fault for a camera that has
   not been aimed yet. It costs geometry, not paint.
2. **The lawn ten to fifteen metres off is paler than the clumps standing in it.** Now that the clumps are
   honest, the other half of the old comparison shows: in `westlawn` the sward reads 99,131,42 with
   sunlit mint patches well above that, and the clumps at 94,110,42 are ten points under a lawn that is
   itself too pale. `pictures/s57-verge-grass.png` is the frame to judge it on. Fault 36 in the list below
   is the same argument at two metres instead of ten.
3. **The fringe does not yet lean on what it grows against.** The drifts wander along the line but no
   clump is any closer to the stone because it is a big one, and a big clump at 0.5 m off a kerb leaves a
   lane of bare lawn between its own foot and the stone. Bigger clumps should grow nearer the edge and
   small ones further out.
4. Still open from before and untouched here: a banana blade is four flat bands and not a curving sheet;
   the palm crown's bare knuckle; a shrub's cards thatch at arm's length; the palm trunks are maroon and
   ringed like a stack of donuts; the court's paving is a big plain grid; the hedge's foot is still a
   ruled line where it meets the lawn; the rear and side windows read as black holes from the garden.

### How to measure a clump again, in five commands

There is no probe file for this one, because what it needs is each material's own mean over a frame, and
that is what `tools/cover.js` prints. On the `grass` camera, which has clumps in it at five metres and a
lawn under them:

```
node tools/cover.js --view "-13.5,1.5,8,-1.57,0.18" --step 8 | grep -E "^(lawn|tuft) "
node tools/draw.js  --view "-13.5,1.5,8,-1.57,0.18" --out pictures/x.png   # prints the drawing's own mean
node tools/canvassave.js tuftCanvas 256 pictures/tile.png --tile 1          # one clump, cut at its own alpha
node tools/sheets.js                                                # the material's lamp vs the drawing's
node tools/tuftfoot.js                                              # is any clump standing on cut stone
```

`--js "mats.tuft.emissiveColor = new BABYLON.Color3(0,0,0)"` on `cover.js` says how much of a clump's
colour is its own lamp, and that is a number no picture will give you. `--set` on `tools/sheet.js` is how
to look at the whole standing set at once.

### Pictures

New: `s57-clump-maize.png` and `s57-clump-grass.png` (one clump, same camera, before and after),
`s57-tile-maize.png` and `s57-tile-grass.png` (the squares, cut at their own alpha),
`s57-atlas-four.png` (the skin of four clumps), `s57-verge-maize.png` / `s57-verge-cabbage.png` /
`s57-verge-grass.png` (the west fringe at six metres, three stages of the fault),
`s57-drawn-grass.png` (the CPU drawing of the `grass` camera) and the standing set **2187-2203**. The
scratch crops this session worked in are deleted.

## What was done this session (56th, 2026-10-17) — a tuft was a little maize plant, and it is grass now 🌽➡️🌿

The browser was in the room all session (**2009-2010 of 2048 slots free**) and so were eyes, and the whole
session was spent looking at clumps of grass: `pictures/s56-fringe-before.png` against
`pictures/s56-fringe-after.png` is the session in two pictures, and
`pictures/s56-maize-row-before.png` / `pictures/s56-tile-before.png` / `pictures/s56-tile-after.png` are
the same fault at the tile's own size.

### Fault 52: thirty-four bright spikes on a black foot, in every clump in the garden

`tuftCanvas` was thirty-four canvas strokes spread evenly along the bottom edge of the square, each a
lit spike with a near-black collar stroke under it, and `makeTufts` stood three of its sheets up at the
same height and width in every clump. Photographed at two metres a clump was a handful of sweetcorn
seedlings you could see straight through, the leaves went straight up at the eye, the feet were a soot
stain on the lawn, and the whole clump painted **78,107,22 against the 101,129,38 of the sward it stood
in** (`tools/cover.js` on the `grass` camera): twenty-four points of light poorer with no more green in
it. Six sessions of these notes had the same phrase for it — "a tuft is a little maize plant".

It is painted again, and the difference is that a clump is now a **mass**:

- **Three hundred leaves, filled and not stroked.** Each is a walked spine with a half-width that tapers
  to a point, drawn as one polygon, so it has edges and is a blade and not a rounded line of ink.
- **They come out of a crown.** The feet are gathered within a quarter of the square's middle and the
  tips are thrown wide of them: that is what makes a clump round instead of a row of six. The tile is
  72.4% air — a clump you can see the ground through, and not a green board.
- **The light is spent the way it spends itself on a clump**: dark low down where the leaves shut one
  another out of the sun and brighter up the leaf, with a narrow lit band on each blade (a folded leaf).
  The old tile did the opposite — a bright spike on a black foot, which is a soot stain with a plant on
  top of it. The foot is now a `source-atop` wash of the lawn's darkest green over the bottom fifth.
- **The long leaves arc over**, tips coming back down under their own weight. Leaves that only go up are
  a sheaf.
- **The ramp is the lawn's, moved.** `grassCanvas` lays `[44+v*58, 86+v*68, 46+v*34]`; the clump is
  `[40+v*54, 100+v*80, 40+v*30]` — twenty-one points more green and eight less blue at the middle of the
  ramp. Not a whim: a clump is vertical, so it sees less sky fill and none of the ground bounce and the
  sun rakes its sides, and the browser returns the same bytes about twenty points poorer in green on a
  clump than on the flat sward. **The clumps are now 87,118,28 against the lawn's 102,130,38** on the same
  camera: twelve points of light poorer, which is right, a clump self-shades, and their green standing
  thirty-one over their own red against the sward's twenty-eight — no longer a cooler, greyer plant.
- **A clump wears the ground it stands on.** `makeTuftPlan` now tints every clump with `lawnTone(x, z)`,
  the same field the lawn's own corners carry, over a small spread of its own: a dry place of the garden
  grows dry grass. One clump in nine has gone straw outright.
- **Every clump has an age.** 0 is a young crown — narrow, upright, three sheets; 1 is an old one — low,
  wide, splayed and four sheets. The fringe along the stone is laid at ages 0.3-1.0 and the grass scattered
  through the mown lawn, which the mower went over, at 0-0.6, so the verge is longer than the lawn and not
  the same plant sixty times over. One leaf in fifteen within a clump has died and is straw.

### A black picture is a broken file, not a dark Villa — the sandbox does not say so

One edit left a stray `for (` in `src/materials.js`, the page threw on load, and **every one of seventeen
`screenshot` runs came out black and returned 0**, exactly as a picture of a villa at midnight would.
`node tools/standup.js` named the file and the line in one second. Run it after editing a source file and
before believing a dark picture: `screenshot` cannot tell a black Villa from a Villa that never stood up.

### The lamp inside the clump was half of its green, and is halved

`mats.tuft.emissiveColor` was (0.5, 0.85, 0.3). Measured on the same clumps with the emissive switched
out through `tools/cover.js --js`: **89,124,29 as it stood, 87,118,28 at half, 85,109,28 with none**,
against a lawn that does not move at 102,129,38 — so a fifteenth of a clump's green, and fifteen points
of it, was coming out of a lamp inside it. That is why every attempt to colour a clump by painting its
tile got overruled, and why a clump in the shade of the terrace was as bright as one in the sun. It
stands at **(0.26, 0.44, 0.16)**: leaves still have light between them, and the CPU drawing follows the
material through `tools/sheets.js`, which now measures both at (0.021,0.126,0.007) and fails if they
part company.

### What the pictures say, and what did not move

All seventeen standing views re-photographed (**2170-2186** against **2114-2130**): nothing moved more
than **three points of luminance** (`southborder` and `salaroof` +3, `westlawn` +2 — the ones with the
most clumps in them), nothing blew out anywhere, nothing blackened anywhere, and colour held to within
0.6 of a point on every frame. That is the shape of change this folder wants: the fault moved and the
picture did not. At a visitor's feet a clump reads as a crowd of leaves
(`pictures/s56-clump-4x.png`), across the garden the clumps are clumps and not seedlings.

The CPU drawing follows. `SURFACES.tuft`'s tint and wash were refitted so a drawn clump arrives at the
browser's colour — drawn 90,129,39 against the browser's 87,118,28 on the `grass` camera, where it ran
36 points of green too green before the tile was rebuilt. The tint there is a fit, not the tile's bytes,
and says so: a clump has no self-shadowing in `shade()`.

**The clock, checked and not assumed**: 5.3 s to the Villa standing and 5.6 s to the first frame
(`tools/bootcost.js`) against v0.53.0's 5.5 and 5.8; **1.8, 1.8, 1.4 fps** (`tools/fps.js`, three runs,
software WebGL) against the last release's 1.8-1.9; `grassTufts` is 3,758 triangles, 0.6% of the Villa.
The walk is the same walk, measured again rather than repeated from these notes: **715 meshes, 48 floors,
129 blockers, 81.8% of the garden reachable from the start**, and the same reported step where the terrace
meets the paving at z = 0.3 as before — a clump of grass is neither a floor nor a blocker, so it cannot
move any of that. `tools/tuftfoot.js` says 1,879 sheets looked at, none standing on built stone and none
in the pool. `tools/standup.js`, `tools/shadows.js`, `tools/sheets.js` and `tools/planted.js` all clean.
`tools/views.sh` redrew the seventeen CPU views: nothing came out black in any of them, and
the one thing it still blows is its own roof in `rearup` (0.9% of that frame against the browser's 0.1%),
which is the drawing's old shortfall and not new here.

### What is still wrong

1. **A clump seen from directly above is a star.** The four sheets are still sheets: from the air, and at
   a shallow angle straight along a sheet, you can read the card. From a person's height it does not
   show. Putting this right costs geometry, not paint.
2. **The clumps along the stone are still evenly planted.** `every: 0.55` with a `skip` of 14% is a row
   with gaps in it, not a colony; they should come in drifts and bare places.
3. Still open from before and untouched here: the sward ten to fifteen metres off is paler than the sward
   at two metres (the sky's mirror owns a third of it); a banana blade is four flat bands and not a
   curving sheet; the palm crown's bare knuckle; a shrub's cards thatch at arm's length (the shrub in
   the `grass` camera is a mossy urchin); the palm trunks are maroon and ringed like a stack of donuts;
   the court's paving is a big plain grid; the hedge's foot is still a ruled line where it meets the lawn.

### How to measure a clump again, in five commands

There is no probe file for this one, because what it needs is each material's own mean over a frame, and
that is what `tools/cover.js` prints. On the `grass` camera, which has clumps in it at five metres and a
lawn under them:

```
node tools/cover.js --view "-13.5,1.5,8,-1.57,0.18" --step 8 | grep -E "^(lawn|tuft) "
node tools/draw.js  --view "-13.5,1.5,8,-1.57,0.18" --out pictures/x.png   # prints the drawing's own mean
node tools/canvassave.js tuftCanvas 256 pictures/tile.png --tile 1          # the tile, cut at its own alpha
node tools/sheets.js                                                       # the material's lamp vs the drawing's
node tools/tuftfoot.js                                                     # is any clump standing on cut stone
```

`--js "mats.tuft.emissiveColor = new BABYLON.Color3(0,0,0)"` on `cover.js` says how much of a clump's
colour is its own lamp, and that is a number no picture will give you.

### Pictures

New: `s56-fringe-before.png` and `s56-fringe-after.png` (the same crouch at the west fringe, 1.62 radians,
before the rebuild and after), `s56-maize-row-before.png` (the fault named), `s56-tile-before.png` and
`s56-tile-after.png` (the canvas itself, cut at its own alpha over a dark ground, `tools/canvassave.js`),
`s56-clump-4x.png` (one clump at four times), `s56-release-fringe.png` and
`s56-release-southborder.png` (the released copy of v0.54.0, so the copy and not only the working tree
was looked at), and the standing set **2170-2186**. The scratch crops this session worked in are deleted.


### One tidy after the release, and the proof that it changed no pixel

After v0.54.0 was published the tangent inside `leaf()` was rewritten out of one long line into four
readable ones, and a comment that said "one leaf in thirteen" was corrected to fifteen. No leaf moved:
`node tools/canvassave.js tuftCanvas 256 x.png --tile 1` paints a tile whose md5 is
`32de3b19c628141d655e96ad37483f86` before the tidy and the same bytes after it. Published as **0.54.1**
so that `diff -r releases/v0.54.0/src src` names only a comment that was not true and a line that was
too long, and nothing else.


## What was done this session (55th, 2026-10-17) — the lawn became a sward: a crowd, a mower, and no more mint 🌿➡️🟩

The browser was in the room all session (**2009 of 2048 slots free**), and so — for the first time in this
folder — **were eyes**: `read` on a picture opens it and this model can see it. Everything below was
judged on the picture itself and the numbers only corroborated it. See the top of *How to look at it* for
the workflow; it is a gift that may not be there next session.

What came in from the session before this one was a lawn tile painted with a crowd of separate blades,
undocumented and unreleased. It was looked at, it was kept, and it is written up in the entry below this
one. This session put the mower's stripes under it, took the mint off the whole garden, and released the
three of them together as **v0.53.0**.

### Fault 50, the loudest thing in every garden view: the lawn was mint-coloured paint

Stand at the south border and the sward ten metres off painted **(117,194,79)**: its green seventy-seven
points above its own red, the brightest thing in the frame under the sky, and the far half of the lawn a
flat pale sheet. Read in the picture `pictures/2112-southborder.png`; the same fault in the `sala` and
`west` views is what made the garden read as a table.

The obvious cure was measured before it was tried, and it was refused. A lawn seen low is a shallow mirror
of the sky, so take the mirror away: `mats.lawn.specularIntensity` (`sheen`) from 0.08 to 0.04, the light
paid back out of the grass's own bytes. Chromium, same place, whole-lawn rectangle (`tools/lawnmint3.json`):

    as built                      lawn (113,150,61) L121
    sheen .04, paid back          lawn (90,119,41)  L107
    sheen .02, paid back more     lawn (84,111,35)  L100

— nine points of green separation bought with twenty of light, and the lawn goes grey. And the mirror is
not where the acid lives: switch `sheen` off CLEAN and the same place falls to **(44,119,38)**, where the
green stands SEVENTY-FIVE over the red (`tools/lawnmint2.json`). The mirror whitens the lawn; the acid is
the grass itself. So the grass moved, in `matte`'s table in `src/materials.js`:

    [3.44, 3.6, 3.36]  as it was      ->  [3.7, 2.51, 2.79]  now

red up a quarter, green down an eighth, and the whole of it eighteen points of light poorer — that last
part weighed on its own ladder, `tools/lawnlight.json` (nine tenths, eight two, seven five: the second was
kept, and looked at as well as measured, because a bright pale green is neon whatever its hue is). The
clumps took the same shift at nine parts in ten, so a tuft cannot out-green the lawn it grows out of.

**That place is now (119,160,70) L145.** In the `sala` view the lawn's brightest block went (103,166,59)
-> (105,137,51): twenty-nine points of green off the garden for two of red on. The whole standing set was
re-photographed (2114-2130 against 2097-2113): the lawn-heavy views came down 4-9 points of luminance
(`grass` L95->L86, `eastlawn` and `rearcorner` -8, `southborder` -5, `westlawn` -4, `rear` -4) and nothing
else in the Villa moved more than two points; nothing blew out anywhere; the only cells in the whole set
that now disagree on warm or cool are lawn. That is the shape of change this folder wants: the fault moved
and the rest of the picture did not.

### Fault 51: the mower's stripes were inside the tile, where a tile cannot have a stripe

The tile has had mown bands since the eighteenth session — six of them across six metres. But every tile
carries exactly as much lit stripe as shaded stripe, so at fifteen metres the engine averages one tile to
one texel and the stripes are simply gone: the same fault the garden's broad patches had, in the other
direction, and the reason the far lawn was one flat colour however well the tile itself was painted.

`mowStripes` in `src/lawn.js` lays them in the ground instead: eight metres apart measured east, so the
bands themselves run north and south; pulled sideways by a slow field so they curve; +-13% of light, paid
two thirds in light and the rest as warmth, because a lit band is a warm band and a shaded band a cool
one, and paying the whole change in green only makes a shadow. Eight metres is the width the two-metre
corner grid can carry — a little over two corners to a half-band, and a sine is flattest where its corners
are furthest apart. Measured straight down from twenty metres (`pictures/s55-lawnover-deep.png`, 39.8 px
to the metre): `tools/pixels.js --repeat` answers **r = -0.40 at a 168 px shift**, which is half of
336 px, which is eight metres — the sward is measurably inverted half a period away — and a scanline
across clean lawn runs L77 to L120 from one band to the next. It is not much in a standing view and it is
enough: the garden no longer flattens to one green beyond six metres.

### One lie the CPU drawing still tells, written down rather than hidden

`lawn` and `tuft` in `src/surface-colours.js` were re-hued after the browser (tint [84,148,74] ->
[104,98,54], [58,76,34] -> [74,68,26]) and the drawn sward **still runs a fifth greener than the
browser's**: the browser's lawn on the south border camera is (113,150,61), a green 1.33 times its red,
and the drawing paints (40,62,31), 1.55 times — because the drawing's lawn colour is carried by its
`mix` and `wash` layers, which mirror the tile's bytes, and the tile did not move this session.

### What is still wrong

1. **The drawn lawn's hue**, above: `mix`, `wash` and `grain` in `SURFACES.lawn` are the tile's numbers,
   and the tile ramp in `grassCanvas` has not been re-hued along with the material.
2. **A tuft is a little maize plant.** At five metres a clump of `tuftCanvas` reads as six broad leaves
   arcing out of one point — maize, and darker and cooler than the sward it stands in
   (`pictures/2129-southborder.png`, the whole field of them). They are also all one size and one age.
   This is the next session's first job.
3. **The sward ten to fifteen metres off is still paler than the sward at two metres.** Better by a good
   deal, not right: the mirror owns a third of it and nothing here takes that back without going grey.
4. Still open from before and untouched here: a banana blade is four flat bands and not a curving sheet;
   the palm crown's bare knuckle; a shrub's cards thatch at arm's length (the shrub in the `grass` camera
   is a mossy urchin); the palm trunks are maroon and ringed like a stack of donuts; the court's paving is
   a big plain grid; the hedge's foot is still a ruled line where it meets the lawn.

### The clock, which was checked and not assumed

The crowd is a hundred and seventy thousand lines of JavaScript painting a million texels, and the stripes
are a sine asked at every corner of the lawn: **5.5 s to the Villa standing and 5.8 s to the first frame**
(`tools/bootcost.js`), the same as v0.52.0, and **1.9 fps, 1.9, 1.6** against the last release's 1.8
(`tools/fps.js`, three runs in a row, software WebGL). Nothing was bought with the frame rate.

### Tools

Four plans for `tools/lights.js`, all of them this session's ladders and all re-runnable: `lawnwarm.json`
(the hue at three distances at once), `lawnmint2.json` (what the mirror owns, and what colour it is),
`lawnmint3.json` (trading the mirror for grass at matched brightness), `lawnlight.json` (the lawn's own
light, four steps). `--save` writes one picture per case and `--patch`/`--at` in `tools/pixels.js` read
them; note that a case picture is 640x360, so a rectangle read off a 1280x720 frame has to be halved
before it is used on one. Note too that `tools/look.js --pick` takes plain fractions and does NOT know the
`name:` prefix `tools/lights.js` plans use: a name handed to it is read as NaN and the tool dies in
Chrome rather than saying so.

### Pictures

New: `s55-lawnover-before.png` and `s55-lawnover-deep.png` (straight down over the west lawn, before the
stripes and after), `s55-grass-after.png` and `s55-*-warm*`/`s55-*-deep` (the lawn at three distances
through the tune), `s55-drawn-*` (the CPU drawing of the same cameras), `s55-mint*/`, `s55-warm*/` and
`s55-light*/` (the ladders, one picture per case), `s55-release-southborder.png` (the released copy of
v0.53.0 photographed at the south border, so the copy and not only the working tree was looked at), and
the standing set **2114-2130**. Superseded and deleted: the scratch `tmp-*` crops of this session and of
the last one.


## What was done in the 54th session (2026-10-17) — the lawn learned to have separate blades 🌱➡️🌿

This session ended with the work in the working tree and nothing written up; the 55th found it, looked at
it in a browser, kept it and released it in v0.53.0. What it was, in short:

`swardCrowd` in `src/textures.js` paints about a hundred and seventy thousand separate blades into the
grass tile, one pixel of ink at a time (the same crowd drawn with canvas strokes took the boot past a
second), in **crowns** of a dozen out of one root, each with its own shadow a hair right and below itself
— which is the depth, and the height `bumpFromCanvas` reads. Every blade's light is read back out of the
pixels already under it (`vAt`), so a blade is the colour of the ground it stands on: that is the whole
reason the two attempts before it failed, and they are photographed as proof. The crowd's own average is
measured back to the byte the wash left the tile at with `lift`, so it is a shape change and not a colour
one: `grassCanvas @1024` still averages 79,124,65 with a 14,16,8 spread and keeps 8,9,4 of it across an
eight-texel block.

The failures: `pictures/s54-tile-grass.png` (strokes — a smooth field sprinkled with dark V's) and
`pictures/s54-tile-crowd.png` (sixty thousand blades of their own tone — a sheet of green scribbles).
The kept tile is `pictures/s54-tile-crowd3.png`, and `pictures/s54-lawn-near2.png` and
`pictures/2128-grass.png` are what it looks like at a visitor's feet, two sessions on.


## What was done this session (53rd, 2026-10-17) — a banana was a handful of flat green plates, and it is a plant now 🍌➡️🌿

The browser was in the room (**2009 of 2048 slots free**) and every picture and number below came out of it.
`node --check` passes on every file touched; `tools/standup.js` walks the Villa clean (**716 meshes**, 11
lights, four clean frames); `tools/feet.js` still reaches **81.8%** of the garden from the start and still
blocks the whole boundary; `tools/shadows.js` is clean (**472 casters**, every one a mesh); `tools/planted.js`
roots all **112** plant parts in soil; `tools/sheets.js` is clean and re-measured the new sheet's own light;
`tools/draw.js` draws the whole Villa and knows both new surfaces; `tools/bootcost.js` **page loaded 4.7 s,
villa standing 5.6 s, first frame drawn 5.8 s** (unchanged). One tool came in with it (`tools/tris.js`, new)
and one was re-aimed (`tools/foliage.json`, whose leaf probes named the old material); nothing new sits at
the top level, so `walkable_items` in `release.sh` needed no change.

### Fault 44, the one at the top of the list: a banana was four flat paddles per leaf

`pictures/s53-banana-before.png` is the indictment and it was in the start view, the pool view and the
east lawn: each leaf was four hinged cards, every card one flat plane wearing a *picture* of a leaf —
oval, midrib and all — and the torn edge that is a banana leaf's whole silhouette belonged to the paint.
The same lesson a fifth time, and one size bigger than the palm: **the edge a visitor sees has to be
mesh**.

- **`bananaCrown` in `src/garden.js`** builds a leaf the way `palmCrown` builds a frond: march a **rib**
  station by station along an arc — `rise` above the horizontal at the crown, bending down to `fall` below
  it at the tip, and `age` (0 at the heart, 1 at the skirt) sets its length, its width, its colour and all
  its angles in one go — then lay the **blade** out at each station. Three things in that sentence are the
  whole change:
  - **the blade is laid LEVEL across the rib.** A banana's blade lies flat in the air whatever its rib is
    doing; a hinged card can only ever be in the rib's own plane, and that is what made the old leaves read
    as green table-tops. The across direction is `cross(T, up)`, which gives the leaf its twist for free.
  - **the blade sags, and a young one curls up instead.** One number, `sag`, and its sign does it: +0.32 for
    an old leaf, −0.5 for the spear in the middle of the clump, which is a rolled tube and not a board.
    Four bands out from the rib and not three: three turned the blade down in three flat shelves and the
    creases between them ran straight across the leaf at arm's length.
  - **the tears are missing geometry.** Each stretch between two stations keeps a share of its own width —
    1.05 whole, 0.36-0.66 a bite off the margin, 0.06-0.16 a slit the whole way in to the rib where the two
    outer bands on both sides simply are not there. Cut per *stretch* and not per station on purpose: a
    real tear is long way out along the veins and narrow way along the leaf, and a station-wide cut opens a
    hole twice as wide as it is deep, which reads as a bite out of a biscuit. Older leaves are cut oftener
    than young ones. On top of that every station's margin wanders ±15%, so nothing about a leaf is a ruled
    line.
  - The rib is built as a band of its own, standing proud of the blade, and inked from the pale middle of
    the very same canvas — one pattern dresses both, exactly as the palm's stalk and leaflets do.
  - **23,208 triangles where the cards were about a thousand** (3.4% of the Villa), and the card's normal
    rule from `hedgeCrest` goes with them: each card's own face turned up towards the sky, or a leaf that
    edges off the sun goes black.
- **`bananaBladeCanvas`** takes over the place and the seed of `leafCanvas`, which is gone. It paints a
  whole blade with no air in it: a pale rib at the middle, **a hundred and fifty veins** running out to the
  two margins and leaning to the tip, dark at both margins, dry along the tip, maroon where a margin is
  aging, and twenty-odd blotches. `mats.bananaLeaf` replaces `mats.leaf` and has **no alpha and no cut**,
  because there is nothing left to cut; `src/surface-colours.js` carries it with `double: true` and its
  `glow` measured by `tools/sheets.js` at **(0.019,0.092,0.005)** added where a leaf is.

### Two lies that this found, and one colour

- **A banana's flower was the colour of its own stalk.** It was given `mats.pot`, then pushed into the
  stems' group in `mergeParts`, and `mergeParts` gives one mesh the material of its FIRST part: the bud's
  own material was silently thrown away and every bud in the garden wore bark (`pictures/s53-banana-before.png`
  — three tan pods, one per clump). The rule is now written over `mergeParts`: a part with its own material
  goes in its own group. It has one (`mats.bud`, a dried-chilli maroon at sheen 0.25) and it hangs below the
  crown on a stalk of its own instead of inside it.
- **An unused shape test is a trap.** `tools/draw.js` cut a `leaf` card with an ellipse test that only the
  banana ever used; with the banana gone it was dead code that would have quietly drawn a board for any new
  cut name. It throws instead now.
- **The pseudostem was the colour of a dry wheat field**: (65,71,13) mean in a browser, (152,152,38) in the
  sun, which is why every clump read as three palm saplings. `stalkCanvas` is sage green with a maroon flush
  where a sheaf is fresh and a pale bloom where the sun has dried it; the stem now reads (78,91,17) two
  metres off.

### What it reads as now

Two metres off the west clump: **bananaLeaf 46.5% of the frame at (52,108,26)**, darkest (16,36,7),
brightest (94,198,55) — a deep green mass, the ribs the lightest thing on it, and a ragged edge against the
hedge, and the bud reading (79,42,43): a maroon and not a tan pod (`pictures/s53-banana-close.png`, its bud
in `pictures/s53-bud-crop.png`). At 3 m
(`pictures/s53-banana-far.png`) and in the standing views — the east lawn's centre, the pool's two corners
— a clump reads as a banana plant and not as a green star. The whole standing set (`2080-home.png` …
`2096-backstore.png`, against `2050`–`2066`) moved **within three points of luminance in all seventeen
views**, nothing blown anywhere, colour share the same or a tenth up. `tools/fps.js` says **1.8 fps against
the released v0.51.0's 1.8** in one run beside the other (an earlier pair said 1.5 and 0.4 in the other
order: the tool is sensitive to which page is opened first — read it as ±0.4 and always run both).

The CPU drawing needed its own tuning and says why in the file: it has no self-shadowing, so off a tint of
(52,108,26) it painted those leaves at (69,144,33) where the browser paints (52,108,26). The tint is
(30,60,16) now, which brings the drawn frame to (57,122,31) — still fourteen points of green over, and what
is left of that is the shade a leaf throws on the leaf behind it. `stalk`'s entry was re-made to match the
repainted canvas.

### One tool, and what it says about where the weight really is

`tools/tris.js` counts the Villa's triangles on the Null engine, plant part by plant part, because every
leafy thing in here is geometry now and nothing in the folder had ever counted what that costs. It answers:
**672,991 triangles all told** — shrubs and their leaf cards **393,600 (58.5%)**, palm crowns 45,968 (6.8%),
bush cards 37,472 (5.6%), banana leaves 23,208 (3.4%), the belt's near rank 10,554, the lawn 33,020. The
shrubs are the whole bill by a wide margin, and the frame rate has not noticed any of it; if a session ever
needs triangles back, that is where they are, and not in a banana.

### What is still wrong

1. **A blade is four flat bands.** At arm's length a leaf is a shallow folded sign rather than a curving
   sheet: `bands` has four steps and the sag is linear between them. The palm's leaflets have the same
   complaint one size smaller (fault 43.3 in the fifty-second session's list).
2. Still open from before and untouched here: the palm crown's bare knuckle (43.2); a shrub's cards thatch
   at arm's length and their dark is a shade too dark (42); `canopyClusterCanvas` is unpadded; the court's
   paving is a big plain grid; the hedge's foot is still a ruled line where it meets the lawn.

### Pictures

New: the banana before (`s53-banana-before.png`), the first mesh build (`s53-banana-mesh.png`, three bands
and the jigsaw notches), `s53-banana-02/03/04.png` (the tune: four bands, the petiole, the bud), the kept
close and mid views (`s53-banana-close.png`, `s53-banana-far.png`), the bud crop
(`s53-bud-crop.png`), three CPU drawings of the same camera (`s53-drawn-banana*.png`), and the standing set
**2080–2096**. Superseded and deleted: none.


## What was done this session (52nd, 2026-10-17) — the palms were flat fans, and they are trees now 🌴🃏➡️🌿

The browser was in the room (**2009 of 2048 slots free**) and every picture and number below came out of it.
`node --check` passes on every file touched; `tools/standup.js` walks the Villa clean (692 meshes, 11 lights,
four clean frames); `tools/feet.js` still reaches **81.8%** of the garden from the start and still blocks the
whole boundary; `tools/shadows.js` is clean (448 casters, every one a mesh); `tools/planted.js` roots all 90
plant parts in soil; `tools/sheets.js` is clean and re-measured the new sheet's own light; `tools/draw.js`
draws the whole Villa and knows the new surface; `tools/bootcost.js` **5.8 s to the first frame** (the band
is 5.0–7.0). One tool was re-aimed (`tools/foliage.json`, whose three leaf probes named the old material) and
`tools/cover.js`'s help line with it; nothing new sits at the top level.

### Fault 43, the one at the top of the list: a palm was eleven green table-tops

`pictures/s52-palm-before2.png` is the whole indictment, and it was there in the start view, in the pool view
and over the sala: eleven flat cards stuck into one point like a pinwheel, each card one plane, each one
wearing a *picture* of a feather — no droop, no twist, no separate leaflet, and a crown that took all its
bulk from the fifteen centimetres the cards were shoved apart by.

**So a palm's leaf is geometry now**, the same lesson the belt's near rank, the hedge's crest and the shrub's
outside leaf already learnt, one size smaller:

- **`palmBladeCanvas`** in `src/textures.js` (it takes over the place and the seed of `frondCanvas`, which is
  gone): one **leaflet**, painted from edge to edge — no air, no cut, nothing bitten out — with the rib down
  the middle, veins leaning towards the tip, dark at the two thin edges, old where it came out of the bud and
  dry along the tip. `x` runs along the leaflet and `y` across it, the rib at the middle: **the rib band is
  also the stalk of the whole frond**, inked from the same canvas, so one pattern paints both things.
- **`palmCrown`** in `src/garden.js`: thirteen fronds laid round the bud at the golden angle, and one number
  — `age`, 0 at the heart and 1 at the skirt — sets all of a frond's own angles: a young leaf is short, pale
  and stands nearly up; an old one is three and a half metres long, darker, and hangs below the horizontal.
  Each frond is marched station by station along an arc, `rise` above the horizontal at the bud bending down
  to `fall` below it at the tip, with a roll about its own length so no two fronds lie in one plane. Two
  leaflets stand at every station, one either side, swept forward off the stalk, lifted out of the frond's
  own face into the **V a leaflet is folded in** (each half its own normal, so the two catch different
  light), and drooping as they go. **13 near palms: 51,152 triangles where the printed cards had 924**; the
  eight on the horizon take a third of it (`frondsNear`, `stationsNear`, `segmentsNear`), because seventy
  metres out a leaflet is two pixels wide.
- **`mats.palmLeaf`** replaces `mats.frond` — one material in, one out, and the browser's own material list
  is the same length as v0.50.0's. It is a sheet (`sheet()`: both faces drawn, lit from the side you see) and
  it has **no alpha at all**, because there is nothing left to cut; `src/surface-colours.js` carries it with
  `double: true` and no `cut`, and the `cut: "frond"` shape test is out of `tools/draw.js`. Its own light was
  re-measured by `tools/sheets.js` at **(0.020,0.105,0.005)** added where a leaf is, and the drawing's `glow`
  now says the same.
- Two things that came along for the ride: the three coconuts wear **the trunk's bark and not the flower-pots'
  clay** (three terracotta balls in the middle of a green crown came out as three pink lumps,
  `pictures/s52-palm-02.png`) and stand on a small ring so they read as three and not as one lump; and the far
  palms' merged crown now keeps its **vertex colours** (`MergeMeshes` was called with `keepColours` false, so
  every tone written at a leaflet's corners was thrown away on the way to `farPalmFronds`).

### What it reads as now

At the crown of the palm by the terrace steps, 3.9 m from the trunk: `palmLeaf` **15.3%** of the frame at
**(64,122,41)**, darkest (19,60,7), brightest (171,236,192) — a green mass with lit leaf tips and a ragged
edge, `pictures/s52-crown-close.png`. At the big palm on the west lawn, 7 m off: 12% at (50,106,26) with its
own darkest (20,67,17) and brightest (147,230,64), `pictures/s52-palm-02.png`. The whole standing set moved
as much as a change this local can: **every one of the seventeen views within two points of luminance**
(`tools/scan_old_new.js 2010 2050`, the newest set `2050-home.png` … `2066-backstore.png`), nothing blown to
white anywhere, the colour share the same or a tenth up — and no measurable cost: `tools/fps.js` says **1.9 fps
against the released v0.50.0's 1.5** in the same sandbox, one run against another (an earlier pair of runs said
1.7 for the released Villa and 1.6 for this one; read the number as ±0.4, as the last session wrote).

### One refusal, and it was looked at and not guessed

Fifteen fronds and eighteen stations instead of thirteen and sixteen: the crown came out bushier, but the young
fronds' leaflets merged into one flat bright sheet when a visitor stood under them, and the run cost 0.2 fps on
a frame that is already counting triangles by the hundred thousand. **Kept: 13 / 16 / 2**
(`pictures/s52-palm-02.png` against the refused `pictures/s52-palm-03.png`).

### What is still wrong

1. **A banana is still a handful of flat paddles**, and since the palms went geometric it is the worst thing in
   the mid distance: `pictures/2059-eastlawn.png`, centre, and the left edge of the start view. The leaves are
   folded from four hinged cards each and the cards are flat, so they read as green plates. The same lesson
   again: a banana leaf is a sheet that tears between its veins, and the tears are the silhouette.
2. **The heart of a crown is bare.** The young fronds rise out of one point and their leaflets start 5% out
   along the stalk, so there is a small bald knuckle at the top of the trunk. A real crown has a green bud
   there. Three small cards, or the first two stations of every frond given leaflets, would close it.
3. **A leaflet is two straight segments.** At arm's length it is a shallow V with a kink in it, not a blade
   that curves; `segmentsNear` is 2 and the droop per step (0.9 of a unit of down per step) is one number.
4. Still open from before and untouched here: at arm's length a shrub's cards thatch; `canopyClusterCanvas` is
   unpadded; the court's paving is a big plain grid; the hedge's foot is still a ruled line where it meets the
   lawn.

### Pictures

New: the palm before (`s52-palm-before2.png`, `s52-crown-01.png` — the pinwheel, from `tools/foliage.json`'s own
crown camera), the crown close and its cover (`s52-crown-close.png`, `s52-crown-cover.png`), the kept palm and
the refused denser one (`s52-palm-02.png`, `s52-palm-03.png`), a CPU drawing of the crown
(`s52-drawn-home.png`, drawn on the same camera the browser was asked for), and the standing set `2050`–`2066`.
Superseded and deleted: three views shot before the leaflet droop and the coconuts were settled.


## What was done this session (51st, 2026-10-17) — the clipped bushes were broccoli, and they are leaf now 🥦➡️🌿

The browser was in the room (**2009 of 2048 slots free**) and every picture and number below came out of
it. `node --check` passes on every file touched; `tools/standup.js` walks the Villa clean (**692 meshes**,
11 lights, 53 materials, four clean frames); `tools/feet.js` still blocks the whole boundary and still
reaches **81.8%** of the ground from the start; `tools/shadows.js` is clean (448 casters, all meshes);
`tools/sheets.js` is clean; `tools/draw.js` draws the Villa whole again (it was crashing — fault 48 below);
`tools/fps.js` says **1.9 fps, and the released v0.49.1 in the same sandbox says 1.9** (one run said 1.5
for each of them, so read that number as ±0.4); `tools/bootcost.js` **5.7 s to the third frame** (the
notes' band is 5.0–7.0). Two tools came and went as scratch (`tools/tmp-probe.js`, `tmp-probe2.js`, both
deleted); one plan stays: **`tools/bushred.json`**, the four-pick ladder on the big pot's bush that is how
every knob below was weighed.

### Fault 46, the one the last session put at the top: the clipped bushes were broccoli

Four pots on the deck edge, two great ones at the terrace steps, and twelve shrubs in the garden, and every
one of them was a crumpled ball wearing a *picture* of leaf. At arm's length a browser said the truth
(`pictures/s51-pot.png`): a dome of flat green paddles, every leaf lying as flat as the ball it was painted
on, the whole crowd of them combed round to the sphere's own poles so they made a fan — a spruce top, not a
clipped fig. And the numbers were worse than the picture: the visible surface was `bushEdge` at
**(65,92,16)** on the start view, a lime green brighter than the hedge beside it, and its darkest pixel was
(20,37,3) — no dark anywhere in a thing that is a foot of leaves deep.

**So the outside leaf of a bush is geometry now.** The same lesson the belt's near rank and the hedge's crest
learned, one size smaller:

- **`bushClusterCanvas` (an atlas of sprays)** in `src/textures.js`: sixteen cells on a 512 canvas, one
  **spray** to a cell — ten pointed leaves of 4 to 7 cm thrown out from a **bud**, over a wobbled dark mass,
  with a few mossy twigs and the lit leaves outermost. Nothing crosses a cell, so the texture is clamped
  and a card's border falls in air.
- **`skinAnchors`** in `src/mesh.js`: places to stand a leaf on, taken off the *crumpled* mesh's own
  triangles — a triangle's middle and the way it faces, both read in the world. A card planted on the ball
  the skin was cut from floats in the air or buries itself in a hollow; planted on the skin it is where the
  leaf actually is.
- **`bushLeafage`** in `src/garden.js`: one quad per anchor, one whole cell of the atlas to a card, at one
  of eight turnings and a size of its own, its normal **up-and-out** (the crest's lesson: out second, up
  first, or the card sees the bush and not the sun), its own tone — a little brighter the higher it sits —
  and the mean of a mass normalised back to one so this shapes a bush and does not repaint the garden.
  **18,736 cards** over 40 meshes, 37,472 triangles, and it costs nothing measurable: 1.9 fps against the
  released Villa's 1.9 in the same sandbox.
- **`mats.bushLeaf`**: the atlas with the air cut out, both faces drawn, sheen taken to 0.02 (a card at the
  low sun with the 0.25 the other greens keep blew to (246,99,99) — a pink flower in a green bush,
  `pictures/s51-crown-crop.png`) and an emissive of **(0.09,0.16,0.04)**, between the shell's and the
  crest's, because a card has no inside.
- **The shell went down to be the dark inside.** `bushEdgeCanvas` grew `leafFrom`/`leafMore`/`sprigs`/
  `shade`/`rib` switches and the bush's shell now wears small, thick, darker leaf (0.86 shade, 380 sprigs,
  a rib at 26 instead of 48). The hedge's crest keeps the old call unchanged. The cards are the lit leaf;
  the shell is what you see between them.

**What it reads as now.** The `grass` camera, where one shrub fills the bottom of the frame at 2.4 m:
`bushLeaf` 5.8% of the frame at **(35,59,8)**, darkest (14,22,0), brightest **(134,202,50)**, and
`bushEdge` behind it at (58,88,14) — a dark green mass with lit leaf tips and a ragged edge, where the
whole bush used to be one flat lime tone from (20,37,3) to (112,155,26). On the big pot's own bush at
3.8 m the cards sit at (53,72,13) with darkest (7,20,5) (`pictures/s51-mid4.png`, `pictures/s51-pot-final-crop.png`).

### Fault 47: a card's winding is part of its lighting, and getting it wrong is silent

The first cards came out in **black starbursts** in the middle of a sunlit bush, and the whole crest lesson
said *normals*, so normals is where I went: rewriting every card's normal buffer to point straight up in a
live page moved the mean by two points and left the darkest pixel at (3,9,6). `twoSidedLighting = false`
moved it. `receiveShadows = false` moved it **not at all** — byte for byte the same picture, which is how I
know the bush's own casters were not shading it. The culprit was the **index order**: a quad built from
corners `[0,0],[1,0],[0,1],[1,1]` and wound `(0,2,1),(1,2,3)` has its geometric front face pointing at
**−N**, so with `twoSidedLighting` on, every card seen from the side its normal points at was lit by −N —
under a warm bounce and no sky, which is (13,3,2): maroon. `indices.push(at, at+1, at+2, at+1, at+3, at+2)`
makes the winding agree with the normal buffer and both the black stars and the maroon tufts went away. The
rule to keep: **a normal buffer and a winding are one fact, not two**, and `--js` on a live page will prove
which of them is lying in ten seconds.

### Fault 48: a colour buffer is four numbers per CORNER, and `tools/draw.js` was the only thing that noticed

`tools/draw.js` died with `RangeError: Invalid typed array length: 8848` inside Babylon's own
`getFloatData`. The cards' colour buffer held **1800 floats for 1800 vertices**: I had pushed one tone per
*card* and a card has four corners. The browser does not complain about reading past the end of a vertex
buffer; it paints whatever lies there, which is most of the dark blotching and some of the maroon. Two
things come out of it. Write vertex colours per corner (`for (let k = 0; k < 4; k++) colourList.push(r, l, b, 1)`),
and **believe `tools/draw.js`: it is the only reader in this folder that asks for the buffer back by name.**
If a hand-written mesh ever makes it throw, do not work around the throw — the throw is the find.

### Fault 49: an atlas's air is black, and a mip level is a block average

A card far off is inked from a small mip level, and a mip level averages the leaf with the air round it,
and the air of a canvas fresh from a 2d context is **(0,0,0)**. So `padAtlas` fills every transparent pixel
with the colour of the opaque one nearest it and leaves it transparent: one sweep along each row, one down
each column, the whole 512 atlas in a couple of milliseconds. It moved the measured mean hardly at all
(45,68,10 → 45,68,10) but it is the reason the twigs had to go mossy: whatever hue the twigs have is
smeared over the whole cell by the padding, and brown twigs came back as a maroon bush. They are
`rgba(56,58,32)` now. **`canopyClusterCanvas` is not padded** and is the next candidate: the same black air
is in its cells, twenty metres off instead of four.

### What the pictures say, against the released Villa

All seventeen standing views re-photographed twice more (`pictures/1990-home.png` … `2006-backstore.png`
and the last set `2010-home.png` … `2026-backstore.png`, against `1870`…`1886`'s successor `1930`…`1946`,
weighed with `tools/scan_old_new.js 1930 2010`): **every view within three points of luminance, nothing
blown to white anywhere, the colour share unchanged** — and the honest cost: **the dark end went slightly
the other way.** Pixels at L31 or below rose in the six views that have a big shrub in them (home 0.1 →
0.3, rear 0.9 → 1.9, west 0.2 → 1.2, westlawn 3.0 → 4.1, grass 2.5 → 4.6, backstore 0.5 → 0.9). That is
what a bush with dark between its leaves costs: the old bushes had no dark at all, and the green's range in
the frame went from (20…112) to (14…134) on the same camera. Two rounds of lifting — the atlas's four tones
up, the emissive to (0.09,0.16,0.04), the per-card tone narrowed to `0.94+0.3·crown` × `0.92+0.24·rand`
because a wide tone spread came out harlequin — took the worst of it back from +2.2 to +1.6 points. **The
knob, if the next session wants the last point: `bushClusterCanvas`'s `massTone` and `deep`**, which are the
pixels that show in the holes between the sprays.

### What is still wrong

1. **At arm's length the cards thatch.** `pictures/s51-pot-final-crop.png`, two hands from a bush: the
   cards near the crown lie nearly flat and merge into a swept thatch instead of a crowd of separate
   leaves. Their normals are deliberately up-and-out; a wider roll about the leaf's own length would break
   it up, and the leaves could be smaller still.
2. **The dark between the sprays is a shade too dark** in the three views listed above.
3. **`canopyClusterCanvas` is unpadded** (see fault 49).
4. Still open from the last session and untouched here: **the palm fronds are flat fans**; **the court's
   paving is a big plain grid**; **a crown directly overhead still shows big flat leaves**; **the hedge's
   foot is still a straight line** where it meets the lawn.

### Pruning

New pictures: the pot bush at arm's length through every stage (`s51-pot`, `-pot2`, `-pot3-crop`,
`-pot4`, `-pot-final-crop`), the atlas as it is painted (`s51-atlas`), the mid-distance ladder
(`s51-mid`…`-mid5`), the grass and west cameras (`s51-grass`, `s51-west`), and three standing sets
(`195x`–`196x`, `197x`–`198x`, `199x`–`200x`, `201x`–`206x`). The superseded ones were deleted at the end
(`195x`–`198x`); `201x`–`206x` is the set that shows the Villa as it now is, against `193x`–`194x` as it
was released.

## What was done this session (fiftieth, 2026-10-17) — the near rank was cut on card borders, and the hedge was a wall 🃏📏➡️🌿

The browser was in the room (**2009 of 2048 slots free**) and every picture and number below came out of
it. `node --check` passes on every file touched; `tools/standup.js` walks the Villa clean (652 meshes,
11 lights, 51 materials, four clean frames); `tools/feet.js` still blocks the whole boundary (the hedge is
44 walls now instead of four, every one of them 5.7 m long and about 2 m tall); `tools/shadows.js` is clean
(409 casters, all meshes); `tools/sheets.js` is clean **and one long-standing fault of the drawing's went
with it** (below); `tools/fps.js` says **2.0 fps against the released v0.48.0's 2.1 in the same sandbox**,
and `tools/bootcost.js` **5.4 s to the third frame** (the released Villa in this folder's notes: 5.0–7.0 s).
No tool was added and none was changed. **Released as v0.49.0, and again as v0.49.1** (comments only: four notes in the Villa and its tools still
named the canvas the near rank no longer wears, and the term `branch-end` went out of use with it — released
folders are not edited, so the correction is its own release). `releases/v0.49.1/preview.png` is the start
view of its own copy and answers `pictures/1930-home.png`, and `releases/v0.49.1/src` is byte for byte the
working tree's.

### Fault 44, the one the last session put at the top: the near rank was cut on card borders

It was not the painting. `nearCanopyCanvas` was one seamless tile, inked edge to edge, and `cardRank` gave
every card a window on it wherever the window fell — so **the straight edge a visitor was looking at was the
CARD's own border cutting across whatever leaf it happened to fall on**, two and a half metres of ruler line
with air behind it (`pictures/48-near-south.png`, and the same frame as it stood when this session started,
`pictures/s50-near-south.png`). No amount of painting over a seam helps when the seam is the geometry. On the
camera `0,1.6,20,0,0.05` the belt was 41% of the frame, its darkest pixel (5,17,1), and `tools/pixels.js
--find "b>r+40 && b>120"` found **not one pixel of sky in the whole frame**: the rank had completely closed
over the horizon, and the dark of its inside was doing most of the painting.

**So the canvas is not one tile now: it is an atlas.** `canopyClusterCanvas` paints 4 × 4 separate
clusters of leaf on a 1024 canvas — a head of about ninety leaves of 20–36 cm thrown out from one middle
over a wobbled dark mass, with twigs in it and lit leaves on its rim — and **every card is inked with exactly
one whole cluster**, at one of eight orientations and at a size of its own. The cluster has air all round it,
so a card's border falls in air and there is nothing out there for the border to cut: the outline a visitor
sees is the outside leaves, nibbled leaf by leaf. `canopyAtlas` (size 1024, 4 columns, 2 m per cluster) is
read by the painter in `textures.js` and the cutter in `world.js` both, which is the only reason the two
cannot drift apart, and `texture()` grew a `clamp` switch because a wrapped cell would drag the next cluster
into this one's border. On the cutter's side `cover` went 1.4 → 1.85 (a cluster is leaf *and air*, and the
air is what makes the edge ragged, so more of them are needed to keep a crown from being see-through) and the
card count per crown came up from 8–40 to 10–90.

### Fault 45: the hedge was a wall, and it is a hedge now

Four boxes, 68 m long, two and a tenth high, and a browser said exactly that: one straight line along the
top of the whole sixty-odd metres of it, and a face of two noise washes at a metre and a tenth to a repeat —
clumps eighteen centimetres across over a speckle seventeen millimetres across, which is a knitted stocking
at three metres and one flat green at twenty (`pictures/1912-eastlawn.png`, `pictures/1914-southborder.png`).
Three things changed:

- **The face is painted as leaf now.** `hedgeCanvas` paints a metre and four tenths of hedge at a time:
  four clumps to it (one sweep of the shears), then eleven hundred leaves of 4–7 cm each with its own midrib
  and its own shade, then the tips that catch the sun, then a weather a metre and a half across so one repeat
  is not visibly the same repeat as the one four metres down the run. Its mean is **(73,109,46)** against the
  two washes' (73,107,47) — a shape change and not a light one, measured with `tools/canvasstats.js` — and
  its spread survives being block-averaged 16 ways (11,14,6), which the old 64-cell speckle never did.
- **The top line wanders, and it carries leaf.** `buildBoundary` builds the hedge in 44 segments of 5.5 m,
  each standing its own height off a crest line that wanders at the scale of a tree and of a branch, and
  `hedgeCrest` stands a fringe of about 2,900 leaf cards on that line — three to every 26 cm of run, leaned
  out of the plane of the face so the crest has half a metre of depth and not one flat sheet across the top.
  Each card is written with its own tone at its own corners, so 244 m of crest is not one green band.
- **The face's tone wanders too.** `hedgeSkin` writes a colour at every corner of every segment: lighter and
  darker along the run at two wavelengths, and 0.84 at the ground against 1.16 at the crest, which keeps the
  mean over a segment at one — so the darker foot is bought out of the lighter top and not out of the frame.

**The crest's lighting, which took four browser runs and one lesson.** The fringe came out a scorched band
along a sunlit hedge — crest (31,63,10) against face (73,111,19) — and neither a brighter texture nor a
stronger emissive would move it: `albedoColor` at 2.2 bought nine points of green. What moved it was the
**normals**. The cards were written with their normals along their own faces, which for a card lying along
the line of the hedge means it sees the hedge and not the sky; rewriting the normal buffer to point up-and-out
in `tools/cover.js --js` — same cards, same places, one probe run — read **(129,170,54)**, and that is what
`hedgeCrest` writes now (`share` 0.3–0.75 out, 1 up). The same probe said `twoSidedLighting = false` changes
nothing at all, so the rule to keep is: **a card that reads black is a normal problem, not a colour problem**,
and `cover.js --js` can rewrite a normal buffer on the live page in ten seconds to find out.

### What the pictures say, against the released Villa

All seventeen standing views re-photographed (`pictures/1930-home.png` … `pictures/1946-backstore.png`
against `1870` … `1886`, weighed with `tools/scan_old_new.js 1870 1930`): **every one within one point of
luminance**, nothing blown to white anywhere, colour share unchanged, and **the black gave back a fifth of
itself** — 31.4% of the set's pixels at L31 or below came down to 25.2%, view by view (southborder 6.0 →
3.7, grass 3.3 → 2.5, westlawn 3.4 → 3.0, frontcorner 0.8 → 0.2, pool 1.1 → 0.3). On the `southborder`
camera, the belt's own numbers against `releases/v0.48.0` (`tools/cover.js`, step 24): share 24 → 25.6%,
mean (28,70,7) → (29,65,8), **darkest (7,18,1) → (13,26,2), brightest (80,174,13) → (137,185,70)**, runs
14,33,4 → 16,26,7 over 381 → 407 points. The dark floor lifted, the lit tips came out warm, and the green's
own spread came down a little (33 → 26) while red and blue's went up: a wider range of tone and a narrower
range of green, which is what a wood of separate trees does and a printed sheet does not.

### One drawing fault closed, seven sessions old

`tools/sheets.js` had complained since the thirty-third session that the CPU drawing put a glow beside the
hedge bigger than its emissive could pay for. The drawing's `glow` for `hedge` was the material's raw
`emissiveColor` (0.05,0.075,0.03) instead of what that colour leaves once the leaf canvas has taken its
share — now written as **(0.004,0.012,0.001)**, and `sheets.js` is clean. It is also a better calibration:
the drawn hedge on the `eastlawn` camera is (74,111,36) against the browser's (75,111,19), where the old
glow drew it at (85,116,64). `hedge` gained `vertex: true`, and the crest has a `hedgeCrest` entry of its
own, so `tools/draw.js` stops throwing 5,688 of its faces away as turned from the eye.

### What is still wrong

1. **The clipped bushes are broccoli**, and they are in the start view: four pots on the deck edge in
   `pictures/1930-home.png` and the big one bottom-right of `pictures/1938-westlawn.png` — hard-edged leaf
   cards on a dome, and one of them fills the corner of `pictures/1931-rear.png`. This is the worst thing a
   visitor is shown now.
2. **The palm fronds are flat fans** — one flat sheet per leaf with a printed fan on it, and at the top of
   `pictures/1937-pool.png` and `pictures/1939-eastlawn.png` they read as green table-tops.
3. **The court's paving is a big plain grid**, 3.1 m to a repeat of near-uniform stone (`pictures/1935-path.png`).
4. **A crown directly overhead still shows big flat leaves.** The camera `0,1.6,20,0,0.05` has a crown two to
   three metres up it, and a cluster two metres across is 40–60 cm leaves there. The rank reads at ten metres
   and above; under a tree it does not yet.
5. **The hedge's foot is still a straight line** where it meets the lawn — the crest got leaf, the base did not.
6. `tools/sheets.js` notes that `bushEdge` and `hedgeCrest` add so little light that the emissive is hardly
   worth a knob. True, and left: their light comes from the sky now, which is where it should come from.

### Pruning

Nothing was deleted. New pictures this session: the belt and the hedge before and after (`s50-near-south`,
`-after`, `-c2`, `-c3`; `s50-clusters.png`, the atlas as it is painted, cut at the cards' own 0.42;
`s50-hedge-east2..6`, `s50-crest-crop..3`, `s50-hedge-c1`), the seven views mid-session (`1900`–`1904`,
`1910`–`1914`), and the full set as released (`1930`–`1946`). `pictures/` is now roughly 1,300 files and
2 GB; the note about reading the notes before pruning anything still stands.

## What was done this session (forty-ninth, 2026-10-17) — the lawn was a printed sheet 🌱➡️🌾

The browser was in the room (**2009 of 2048 slots free**) and every picture and number below came out of it.
`node --check` passes on every file touched; `tools/standup.js` walks the Villa clean (610 meshes, 11 lights,
51 materials, four clean frames); `tools/feet.js` builds it whole with reachable ground from the start still
**81.8%**; `tools/shadows.js` is clean; `tools/sheets.js` is clean; `tools/fps.js` says **2.1 fps** against the
released Villa's 1.9 in the same sandbox. One tool came out of it (**`tools/bootcost.js`**) and one had a real
bug in it (**`tools/canvassave.js`**).

### Fault 43, and what it actually was

The last session's own list of what was worst said two things, and the second was this: the lawn at eye height
is a printed sheet with clumps on it. It was right, and the reason was arithmetic before it was anything else.
One lawn tile is six metres of ground (`grassTileMetres` in `src/world.js`) and the tile was 512 pixels across,
so a texel was 1.2 cm of grass: a blade is thinner than the paper it had to be drawn on. Worse, every layer in
that tile — `paintField`, `mownBands`, `mixByField`, `wash`, `barePatch` — is a soft noise wash, so nothing in
it had an edge at any size at all. Standing on the garden and looking down, a visitor got a green carpet with
blobs on it (`pictures/s48-lawnfeet.png`), and the tile laid three times over (`pictures/s48-tile-grass-3x.png`)
was a lattice of soft blobs: the far rank of the jungle's fault, in the ground instead of above it.

### What is painted now, and why not blades

The tile is **1024** — six millimetres to a texel — and it carries two new layers over the old ones, which are
untouched.

**`swardGrain`** is the one that does the work. One random number per texel, averaged along a short leaning
line (eleven taps up and across, plus a shorter set of four leaning the other way) and multiplied over
everything under it. That is the tips of the blades: half catching the sun, half not, at two millimetres
across and six to seven centimetres long, which is the size a lawn is actually read at from three metres off.
It is noise and not drawing, and that was learnt the hard way: the first attempt painted ten thousand separate
blades — quadratic curves, each with its own lean, tone and shadow, gathered into tussocks — and the browser
came back with scattered green commas lying on a smooth field (`pictures/s48b-grass.png`). Forty times too few
marks at forty times too big a size. The strokes stayed, but at half the length, two thirds the width and a
third lighter, and only for the few metres where a crown — five leaves arcing out of one root, all leaning the
same way — is a thing a person can pick out.

The grain is applied last, over the bare places too, and `tools/draw.js` lays the same streak (`grain` in
`SURFACES.lawn`) so the CPU drawing does not go back to drawing a flat lawn.

### What it is worth, measured against the released Villa

- **The mean did not move, which was the whole trick.** `tools/canvasstats.js`: the tile's mean is
  (83,119,63) where it was (84,119,63), and its own spread went **11,8,4 → 12,11,5**. A shape change and not
  a colour one: the blades are painted symmetrically about the ramp the wash already laid, so the lawn keeps
  the tone the last sessions measured it to.
- **`tools/cover.js` on the `grass` camera**, against `releases/v0.47.0`: the lawn still paints **43.6%** of
  the frame and (103,153,42) where it painted (104,153,41), and its `runs` went **21,18,11 → 22,20,11**, its
  darkest pixel in from (57,99,24) to (50,99,20) and its brightest out to (157,207,61) from (142,203,78).
- **All seventeen standing views** re-photographed (`pictures/1870-home.png` … `pictures/1886-backstore.png`,
  weighed against `1830` … `1846` with `tools/scan_old_new.js`): every one within a point of luminance, nothing
  blown to white, nothing crushed to black, colour share unchanged. Read two of them with the eyes, not only
  the table: `1864`-style near views are where the change lives, and `1870-home` is what a visitor arrives on.
- **The relief had to be re-paid for.** The bump is now the colour canvas drawn down to 512 (`bumpFromCanvas`
  takes a `toSize` now) instead of a second canvas painted at 256, so the blades are in the relief and not
  only in the colour — and a fine, blurred bump eats a great deal more light than the crisp old one: on the
  sward 7.6 m off (`tools/lawnbump.json`) level 0.35 left L151, 0.25 left L155, 0.15 leaves **L160** against
  L161 with no bump at all. So the level came down from 0.25 to **0.15**: a tenth and a half costs one point
  of light and keeps all of the relief. Same lesson the teak floor taught (fault 4), on a new map.

### The clock, which nothing here could read before

A million pixels of noise is not free, and the Villa has to be there the moment the page opens. So
**`tools/bootcost.js`** now counts it: page load, the Villa standing, the third frame drawn. The released v0.47.0
drew its third frame in 5.0–7.0 s in this sandbox and this build in 7.1–8.0 s; the machine swings that much
between runs, so all that can honestly be said is that the finer tile costs about a second of boot here and is
not free. What could be cheapened was: the grain used to hash its salt again for every tap of every streak —
six million hashes for one tile — and now throws the salt once (one million) and reads it back. `node
tools/standup.js` builds in 1.2 s with the whole change in.

### What is still wrong

1. **The near rank of the jungle is cut on hard card borders.** At seven metres a visitor at the south hedge
   sees straight edges and black holes where the outermost card is cut and nothing is behind it
   (`pictures/48-near-south.png`). This is the fault that was top of the list and it is still there: the card
   itself, and the crowns' dark interior, not the paint on the card.
2. **The hedge is a flat green wall with a dead-straight top** and a knitted pattern on its face
   (`pictures/1865-southborder.png`): it is the biggest green mass in half the standing views and it has no
   irregularity on its crest and none in its foot.
3. **The clipped bushes are broccoli** — hard-edged leaf cards on a dome (`pictures/1870-home.png`, the four
   pots on the deck edge, and the big one bottom-right of `1858-westlawn`).
4. **The court's paving is a big plain grid** (`pictures/1855-path.png`): 3.1 m to a repeat of near-uniform
   stone, and it is the largest thing in three of the standing views.
5. `tools/sheets.js` still complains that the CPU drawing puts a glow beside the hedge bigger than its
   emissive can pay for (drawing 0.050,0.075,0.030 against 0.003,0.011,0.001 added). Pre-existing, and a
   fault in the drawing and not in the Villa.

### Pruning

Nothing was deleted. New pictures this session: the before/after pair on the feet-height and `grass` cameras
(`s48-*`, `s48b-*`, `s48c-*`, `s48d-*`), the lawn tiles at one and three tiles (`s48-tile-*`, `s48c-tile1.png`,
`s48c-crop2x.png`), the drawn lawn's grain blown up (`s48-drawn-crop.png`), and the seventeen standing views
twice (`1850`–`1866` mid-session, `1870`–`1886` as released). `pictures/` is now roughly 1,260 files and
1.9 GB; the note about reading the notes before pruning anything still stands.

## What was done this session (forty-eighth, 2026-10-16) — the near rank was confetti 🌿🍃➡️🌴

The browser was in the room (**2008 of 2048 slots free**) and every picture and number below came out of it.
`node --check` passes on every file in `src/` and `tools/`; `tools/standup.js` walks the Villa clean (611
meshes, 11 lights, 51 materials, four clean frames); `tools/feet.js` builds it whole with reachable ground
from the start still **81.8%**; `tools/shadows.js` is clean (409 casters, all meshes); `tools/sheets.js` is
clean; `tools/fps.js` says **2.1 fps** against the 1.9 the last session reported. One tool came out of it:
**`tools/canvassave.js`**.

### Fault 42, and what it actually was

Fault 42 said the near rank close to is flat panels of leaf, and it was right, but the fault was not the panel
and not the colour: it was the **spray**. The near rank wore a canvas of 160 sprays of five to nine leaves at a
metre and a quarter to a repeat, every spray one rosette of one size, each leaf eleven to eighteen centimetres
and every single one of them carrying a pale midrib. At thirteen metres a leaf is a quarter of a card and a
rosette is forty pixels: the eye matches one against the next and calls it wallpaper
(`pictures/48-near-before-crop.png`, blown up). This is v0.46.0's fault on the far rank, one rung nearer, and
it needed the same two medicines: make the unit bigger than a leaf, and draw nothing twice.

So `nearCanopyCanvas` in `src/textures.js` replaces the spray canvas (the old one is **gone**, nothing else
wore it), at **two metres and six tenths of crown to a repeat**, and its unit is the **branch-end** — a twig
half a metre to eight and a half decimetres long with seven to thirteen leaves on it, all leaning the twig's
way, the end a metre and a half across and its own tone, read off a noise field three to a tile so the mass
changes at the size of a branch and not only at the size of a leaf. Below it twelve soft daubs of the darkest
green in the tile, above it a few leaves at the top of a crown brighter than everything under them. Each leaf
carries a shadow of itself at 0.3 alpha, which is *under* the cards' 0.42 cut-off, so a shadow lying on a leaf
darkens it and a shadow lying on air holds nothing up — that is what makes a heap of leaf look like a heap.
The midrib is painted on **one leaf in four**, and either lighter or darker than its own face: a pale midrib on
EVERY leaf is the thing that turned the sprays into stars.

**The card's own UV was the other half of the fault.** `cardRank` in `src/world.js` used to lay every card from
`0,0` to its own size, so every card in the belt sampled the *same corner* of the canvas — the same leaves, in
the same places, at the same size — however the canvas was painted. Each card now takes a random window
(`u0,v0`), which is a one-line change and worth as much as the canvas.

### The air in the tile, measured, because it had to be chosen

`tools/canvassave.js` was written for this: it paints a canvas in the browser, lays it two or three tiles over
a dark ground at the material's own cut-off, and prints how much of the tile is air. The old spray canvas and
the new one both came out at **0.0% air** the first time — every card was an opaque board, which is why the
belt had no ragged edge at all and why the straight card borders showed. The counts were then set by that
number, on the same camera:

| air in the tile | what it looked like | kept |
| --- | --- | --- |
| 0.0% (`shade` 44) | a board; no edge to cut on | no |
| 2.9% (`fill` 60) | a mass, but every border a straight cut | no |
| **5.3%** (`fill` 26, `shade` 12) | a mass of leaf with pinholes; the borders break about | **yes** |
| 9.7% (`fill` 20) | beginning to thin at the top of a crown | no |
| 16.8% (`fill` 14, `shade` 7) | lonely leaves on twigs against the hedge (`pictures/48-near-south-air17.png`) | no |

### What it is worth, measured on the same camera against the released Villa

`tools/cover.js --view "6,1.6,13,0.27,0" --step 32`, run against `releases/v0.46.0/index.html` and against
the working tree, one after the other:

| | share | colour | its own `runs` | darkest | brightest |
| --- | --- | --- | --- | --- | --- |
| v0.46.0 | 28.1% | (21,57,5) | 9,20,3 | (4,27,2) | (65,158,12) |
| now | 26.5% | (27,68,7) | **14,32,4** | (7,20,1) | (80,181,18) |

The rank's own spread is half again as wide, and that is the branch tone reaching the screen: a deeper hollow
and a brighter top, which is what a canopy does and a wallpaper cannot. The share fell by a point and a half
because there is air in the tile now where there was none. All seventeen standing views were re-photographed
(**`pictures/1830-home.png` … `pictures/1846-backstore.png`** against `1810` … `1826`,
`node tools/scan_old_new.js 1810 1830`): means within two points of luminance, nothing blown to white, nothing
crushed to black, and only the two frames where the rank is big moved at all (`southborder` L81 → L83, 98.4 →
97.5 in colour, dark 6.4 → 6.0%). The frame rate and the walk are untouched.

### What the CPU drawing does with it, and where it still lies

`tools/draw.js`'s `cut: "crown"` shape test went to seven blobs to a repeat at a 0.1 threshold, and the
`jungle` washes in `src/surface-colours.js` now copy the canvas scale for scale (3 cells is a branch, 7 a
hand, 14 the leaf), and `glow` is the (0.013,0.069,0.005) that `tools/sheets.js` measures off the live page.
The tint was cut hard to bring the drawn mean down to the browser's, and this is the lesson: **the tint and
washes are not what set that surface's brightness.** Cutting them by half moved the drawn green from 95 to 93.
The drawing's own sky fill is what lights a card, so the belt is still twenty-five points of green too light
there — fault 4 and fault 44 together, and not answerable from these bytes. `pictures/48-drawn-southborder.png`
against `pictures/1845-southborder.png` says so in one line: drawn (40,93,30) over 23.2% of the frame, browser
(27,68,7) over 26.5%. Share and shape agree; the light does not.

### What is still wrong

45. **New, and now the worst thing in the Villa: at seven metres the near rank is cards.** Stand at the south
    hedge (`0,1.6,20,0,0.05`, `pictures/48-near-south.png`) and the crowns overhead show a long straight card
    border with air behind it, and black holes where the outermost card is cut and nothing is behind. The
    canvas is ragged now; the card is a rectangle. The lever is the card's own outline — six or eight corners
    with their radii jittered, or smaller cards and more of them at the same total skin — and it costs
    triangles, so measure what the belt costs now (`jungleBelt`: 34,788 vertices, 17,394 triangles, asked with
    `tools/dump.js`) before spending.
36. **Still open, and the largest surface in most frames: the lawn at eye height is a printed sheet with clumps
    on it.** The bottom half of `pictures/1844-grass.png` is a pale swirled plate with sprigs glued to it. It
    was looked at again this session and not touched, and three things were found out first, so the next session
    does not start blind. On the `grass` camera the lawn is **40.6% of the frame at (104,153,42) with its own
    `runs` 23,20,11** — it is not flat, it is *blurred*: `pictures/48-tile-grass.png` is `grassCanvas` shown
    two tiles over, and its blotches are a metre across with nothing at the ten-to-twenty-centimetre scale a
    sward is actually read at. And it is not a filtering fault: every texture in the Villa already asks for
    `anisotropicFilteringLevel = 8` (`texture()` in `src/textures.js`), so grazing views are already being
    helped all they will be. The third finding is the warning: the twenty-second and thirty-second sessions cut
    this canvas's fine field on purpose, because a 19 cm field washed on at 0.42 ran the sunlit lawn to the top
    of the picture and painted black commas through the bump map (`src/textures.js`, the `grassCanvas` note).
    Any new grain here has to be narrow in value and measured with `tools/lawndark.json` and
    `tools/lawnshine.json` as well as looked at.
44. **Narrowed again, not closed: the CPU drawing paints the belt too light** — see above; it is the drawing's
    sky fill and not the material.

### Pruning

This session names `pictures/48-near-before.png` and `-crop`, `pictures/48-near-after.png` and `-crop`,
`pictures/48-tile-old.png`, `pictures/48-tile-v1.png`, `-v1b`, `-v2`, `-v3` and `-v3-crop`,
`pictures/48-tile-air1.png`, `pictures/48-tile-mid.png`, `pictures/48-near-south.png`,
`pictures/48-near-south-air17.png`, `pictures/48-southborder-wide.png`, `pictures/48-southborder-air17.png`,
`pictures/48-southborder-mid.png`, `pictures/48-edge-crop.png`, `pictures/48-cover-before.png`,
`pictures/48-cover-after.png`, `pictures/48-cover-grass.png`, `pictures/48-tile-grass.png`,
`pictures/48-drawn-southborder.png`, the whole drawn set `pictures/drawn-home.png` …
`pictures/drawn-backstore.png` (redrawn with `./tools/views.sh`), the set `pictures/1830-home.png` …
`pictures/1846-backstore.png`, and `releases/v0.47.0/preview.png`. Nothing was deleted.

## What was done this session (forty-seventh, 2026-10-16) — the far rank was a wall of stamped leaves 🌿🔁➡️🌴

The browser was in the room (**2009 of 2048 slots free**, no zombies) and every picture and number below came
out of it. `node --check` passes on the four files touched (`src/textures.js`, `src/materials.js`,
`src/world.js`, `src/surface-colours.js`); `tools/standup.js` walks the Villa clean (611 meshes, 11 lights,
51 materials, four clean frames); `tools/feet.js` builds it whole with every foot-place `ok` and reachable
ground from the start still **81.8%**; `tools/shadows.js` is clean (409 casters, all meshes);
`tools/fps.js` says **1.9 fps**, which is what v0.44.0 said. One tool came out of it: **`tools/canvasstats.js`**.

Fault **43** of the last session — "the curtain still repeats" — was not a curtain that repeated a little.
It was a lattice, and it was the ugliest thing in the Villa.

### The fault: a shape is a pattern, whatever scatters it

`pictures/47-farrank-before.png` is the west lawn at `?fov=0.4`, and `pictures/47-crop-hill.png` is a corner
of it blown up twice: **rows of one identical little plant**, evenly spaced, the whole way up the far rank.
The same stamp sits on the ridge in `pictures/1763-westlawn.png` and in every standing view that shows the
belt. Two faults in one, and only one of them is about size:

- a spray of `crownLeafCanvas` is a **shape** — five to nine ellipses out of one bud, always the same five to
  nine at the same scale. Scattering a shape does not unmake it: an outline an eye can match against its
  neighbour is a pattern, and the eye is built to find that and cannot be talked out of it.
- at two metres to a repeat, sixty-odd sprays fit across one crown of the far rank, whose head is six to
  twelve metres wide. Their spacing there is a metre and a half, which at the eighty-seven metres the west
  lawn sees is forty pixels of the frame: a grid, at a size the frame can resolve.

### The fix: crowns, and nothing drawn twice

`farCanopyCanvas` (in `src/textures.js`), worn by `mats.jungleFar` at **twelve metres to a repeat** — because
out there the thing that has size is the crown and not the leaf. Four scales: crowns (value noise, six
metres), branches (value noise, two and a half), **1400 leaf clusters** of three to seven ellipses each,
every one taking its own number, sizes, offsets, angles and tone, and **1000 tips**. Nothing is drawn twice,
which is the whole point: no outline in the tile can be matched against its neighbour.

Three things had to be learned to get there, and two of them are in the comments beside the code:

1. **Value noise at the size of a leaf is a smooth blur.** The first version of this canvas was noise at four
   scales and nothing drawn: it came to the screen as one flat green fog, `pictures/47-crop-hill-tile12.png`,
   runs 4,7,3 across the curtain where the drawn clusters give 5,14,3. Grain has to be *drawn*; noise only
   carries tone. `tools/canvasstats.js` says so in the tile itself: the noise-only canvas carries
   (9,12,6) bytes of spread and every one of them survives a 16-pixel block average — nine bytes, which is a
   wash and not a texture — where the drawn clusters take the tile to (25,34,14) and keep (14,19,8) of it
   after the same averaging.
2. **A wash over a wash is a vote, and the last big one wins.** Laying a stronger branch wash over the crowns
   wiped the crowns out and the tile came back one blur; the crowns are now the strongest wash in the tile and
   each wash after it is weaker than the last.
3. **A warp has to be small against the thing it warps.** `skylineBand`'s `warp` is now `{ at, wave, lean }`
   instead of a switch: at a twelve-metre tile the old squeeze — spacing wandering between 0.4 and 1.6 of a
   tile every six metres — dragged a six-metre crown five metres sideways within half a crown's width, and
   the crowns came out smeared. A quarter of a tile over sixteen metres is enough. The lean stays at seven
   degrees, because a lean is an angle and not a distance and the old lesson about rain-stripes still holds.

### What it is worth, measured where the wood is the whole frame

This was a pattern fault and not a colour fault, and the belt region says so in advance of the crops: the
belt on the `grass` camera, in blocks of eight pixels (`pictures/1764-grass.png` against
`pictures/1824-grass.png`, `tools/pixels.js --patch "0,0,1280,170" --block 8`):

| | mean | block L std | channel spread between blocks |
| --- | --- | --- | --- |
| stamped | (30,65,15) L54 | 18.9 | r 16.4 g 23.0 b 8.8 |
| crowns and clusters | **(31,64,14) L53** | **19.5** | r 16.4 g 23.7 b 8.8 |

`tools/cover.js`, same camera: the rank covers 11.1% of the frame at **(25,54,13)** where it covered 11.6% at
(30,60,20) — six points of green short, and paid for, since a haze wash over every leaf in the tile is gone
and so is the sky that used to show through a cut. Seen from far enough off for the clusters to average out
there is nothing to see at all: the same sample at 87 m paints **(42,69,34)** against the (42,71,35) it
painted before. The honest instrument for a lattice is `tools/pixels.js --repeat` over a rectangle that is
all belt: before, the brightest self-correlation of the row was −0.26 at 123 px along x (an anti-period, and
an anti-period is still a lattice); after, **no peak at all, either way**.

The seventeen standing pictures are **`pictures/1810-home.png` … `pictures/1826-backstore.png`** against
`1740` … `1756` (`node tools/scan_old_new.js 1740 1810`): means within one point of luminance, nothing blown
to white, nothing crushed to black. Two columns moved and both are the change: the frames where the belt is
big are about a point *less* "in colour" (99.4 → 98.4 on `grass`) and carry a point and a half more of dark
(1.7 → 2.7% at L≤31). That is the shade between crowns, which is a dark green the metric counts as nearly
neutral. The deep tone was lifted from [24,38,14] to [22,44,15] for exactly that reason and no further.

### What is still wrong

43. **Closed by v0.46.0.** The far rank is a mass with an edge and a granular skin; the lattice is gone and
    the self-correlation says so.
44. **Narrowed, not closed: the CPU drawing still paints the curtain too light.** Its washes now copy
    `farCanopyCanvas` scale for scale — for a curtain whose UV is twelve metres to a repeat, a wash `cells`
    count *is* a metre count, which is the one case where fault 44 could be answered at all — and it draws
    (44,79,37) on the `grass` camera where the browser paints (25,54,13). That last twenty is fault 4, the
    drawing's shaded-face bias, and not this canvas.
42. **Still open, and now the worst thing in the Villa: the near rank, close to, is flat panels of leaf.**
    Same camera as above but at the south border, and `tools/cover.js` says the near rank is **43.1% of the
    frame at 13.5 m** while the curtain behind it is 6.1%: what a visitor standing at the south hedge is
    looking at is `jungleBelt`'s cards, whose leaves are 11-22 cm and read as confetti at that distance, on
    cards whose straight edges you can see (`pictures/47-southborder-narrow-before.png`, `pictures/1825-southborder.png`).
    The lever is the same one that worked here — fewer, larger leaves on each card and a silhouette broken at
    the size of a branch, not a stencil the eye can match.
36. **Also open and untouched this session: the lawn at eye height is a printed sheet with clumps on it** — the
    bottom half of `pictures/1824-grass.png` and `pictures/1818-westlawn.png` is a pale swirled plate with
    sprigs glued to it. It is the largest single surface in most frames and it is the next thing to look at.

### Pruning

This session names `pictures/47-farrank-before.png`, `pictures/47-crop-hill.png`,
`pictures/47-crop-hill-tile12.png`, `pictures/47-crop-hill-clusters.png`, `pictures/47-crop-hill-after.png`,
`pictures/47-farrank-after.png`, `pictures/47-southborder-narrow-before.png`, `pictures/47-crop-southborder-after.png`,
`pictures/47-drawn-grass.png`, `pictures/1763-westlawn.png`, `pictures/1764-grass.png`,
`pictures/1810-home.png` … `pictures/1826-backstore.png`, `pictures/1824-grass.png`, `pictures/1825-southborder.png`
and `releases/v0.46.0/preview.png`. Twenty-six scratch pictures from the ladder of attempts (the four
half-fitted canvases and the standing set photographed before the deepest leaf tone was lifted) were deleted
after they had served, and nothing else: `pictures/` is still heavy and any pruning must read the notes first.

## What was done this session (forty-sixth, continued) — the lawn was the colour of pond scum 🦠➡️🌱

The second fault was found while looking for the first: every picture taken of the belt had a third of a
yellow-green field in the bottom of it, and at the grazing eye that field reads as algae on a stagnant tank.
This time the numbers were taken where nothing but grass is in the frame — the straight-down camera the notes
already use for the lawn's own scale, `?float=1&view=-16,20,8,3.1416,1.5708`, and a rectangle of it with no
paving, no path and no planting in it.

### The two numbers, and what they said

Over that rectangle in blocks of forty pixels (`node tools/pixels.js <png> --patch "60,120,400,680" --block 40`):

| | mean colour | between blocks: warmth (red − blue) |
| --- | --- | --- |
| as it was | (103,148,23) L129 | mean 80.0, std 18.8, range **47 to 126** |
| dry end alone retuned | (102,148,23) L129 | mean 79.1, std 14.5, range 52 to 116 |
| dry end and lift retuned | **(85,146,32)** L125 | mean **53.1**, std 12.8, range 29 to 86 |

Two separate faults pull in the same direction there. `tools/pixels.js` says sun against shade moves warmth
by a point or two and dust against damp by ten: a lawn whose blocks run 47 to 126 is not varying in light, it
is varying in *kind* — the dry places were the colour of the laterite under the lawn and not the colour of
thinner grass. And a mean of (103,148,23) is a green carrying a twenty-second of itself in blue, which is
acid however it is mottled.

### What was changed, and what it is worth at the eye

1. **`src/lawn.js`: dry grass is pale, and pale means every channel up.** `parched` was `[1.3, 1.02, 0.64]`
   — a third more red, more than a third less blue — and is `[1.16, 1.04, 0.86]`; `lush` went
   `[0.9, 1.07, 0.96]` → `[0.9, 1.07, 1.02]`. The tone is normalised to mean one per channel across the
   garden, so this cannot brighten or dim the lawn: what it bought is the rust going out of the dry patches
   (the middle line of the table: the warmth's std came down from 18.8 to 14.5 with the mean untouched).
2. **`src/materials.js`: the sward's lift, `[4.2, 3.6, 2.4]` → `[3.44, 3.6, 3.36]`.** That lift was the
   fortieth session's answer to a mint glare and it spent the glare's colour on red; the acid needed paying
   back in blue instead. Measured with `node tools/tint.js --fresh` — the ladder, on two cameras, with the
   middle rung kept as a picture too (`pictures/46-lawn-halfway.png`):

   | lift | `grass` camera | sunlit `westlawn` |
   | --- | --- | --- |
   | [4.2, 3.6, 2.4] as it was | (121,155,31) L139 | (123,161,34) L144 |
   | [3.78, 3.6, 2.88] | (112,154,36) L137 | (115,160,40) L142 |
   | **[3.44, 3.6, 3.36]** | **(105,153,42) L135** | **(108,160,47) L141** |

   The middle rung was looked at and was still yellow. The last one is the first that reads as a lawn in the
   pictures (`pictures/46-lawn-asbuild.png` against `pictures/46-lawn-lift-after.png`) and it is *not* back
   to the printer's green of fault 29: that measured (114,175,70), a blue two fifths of its green, and this
   is under a third — `westlawn`'s brightest sunlit blade went (156,197,35) → (136,199,53), which is warm,
   and grass. The sun's own (1,0.71,0.46) eats part of the blue back every frame.
3. **`src/surface-colours.js`: the CPU drawing followed the hue**, `lawn.tint` [96,148,66] → [84,148,74],
   which moves the drawn lawn (68,108,43) → (65,108,45). The drawing is thirty-odd points dark on sunlit
   ground whatever it is given (fault 4), so the hue was what could be matched there and the lightness could
   not.

### What the seventeen standing pictures say, and why they say so little

`pictures/1740-home.png` … `pictures/1756-backstore.png` against `1720` … `1736`: twelve views unchanged and
five down by one point of luminance; nothing blown, nothing crushed, in colour where it was. That is the
expected report and not a weak one — **a hue move is all but invisible to a whole-frame luminance**, which is
exactly why the lawn's own block readings and the two camera readings above are the evidence and the frame
means are not. The eye-height proof is `pictures/1754-grass.png` and `pictures/1748-westlawn.png` against
`1734` and `1728`.

`tools/standup.js` walks the Villa clean; the walk is untouched; `pictures/tmp/` is empty again.

**Pruning.** This part of the session names `pictures/1740-home.png` … `pictures/1756-backstore.png` (the set
v0.45.0 ships on), `pictures/1734-grass.png` and `pictures/1728-westlawn.png` (the same two before),
`pictures/46-lawn-over-before.png`, `pictures/46-lawn-dryend-only.png`, `pictures/46-lawn-after.png`,
`pictures/46-lawn-asbuild.png`, `pictures/46-lawn-halfway.png`, `pictures/46-lawn-lift-after.png` and
`pictures/46-drawn-grass.png`.

## What was done this session (forty-sixth, 2026-10-16) — the far rank of the jungle was torn green sails, and it is a wood now 🌿🪞➡️🌴

The browser was in the room (**2009 of 2048 slots free**, no zombies) and every picture and number below came
out of it. `node --check` passes on the three files touched (`src/world.js`, `src/materials.js`,
`src/surface-colours.js`); `tools/standup.js` walks the Villa with no fault (611 meshes, 11 lights, 51
materials, four clean frames); `tools/feet.js` still builds it whole, every foot-place and every reachable
place answers `ok`, and reachable ground from the start is **81.8%** — exactly what it was, which is the
point: this is all out beyond the hedge; `tools/shadows.js` is clean (409 casters, all meshes);
`tools/dump.js` says the meshes are there and how big they are.

Fault **42**, found and closed here, was the ugliest thing in the Villa and had never been written down.

### The fault: a crown is the wrong shape at fifty metres

`pictures/46-farrank-before.png` — the west lawn at `?fov=0.4`, the belt two-thirds of the frame — shows the
far rank twenty-six to fifty-two metres beyond the hedge as **torn paper**: a spire of green shards where the
tallest crown stood, ragged sails either side of the sala, sky through every one of them, and pale leaf
blown up to the size of a table. The same shards sit over the roof in `pictures/1600-home.png` and poke
behind the sala in `pictures/1606-west.png`.

The reason is size and not paint, and it is arithmetic. A crown of the far rank is six to eleven metres
across and the cards it was built from are a third of that: **the outline steps about in pieces two to four
metres wide**, and forty metres off, one step is fifty pixels of straight edge with a hole behind it. At the
near rank, nine to twenty metres out, exactly the same card is the size of a leaf cluster and reads as leaf
— which is why the near rank is left exactly as the thirty-fourth session built it and only the far rank is
touched. Nothing about the canvas could pay for the silhouette, and no amount of `cover` will, because the
holes are the edge and not the inside.

### The fix: build it the way the far tree line is built

The far tree line has been a curtain of flat quads along a ring since the thirty-ninth session, and the
picture that made it change said the thing a wood shows from far off is **a mass with an edge** and not a
row of trees. The far rank needed the same answer at three times the nearness, which sets every number on
it (`beltHigh` in `src/world.js`, still named `jungleHighBelt`, still wearing `mats.jungleFar`):

- the edge wanders at **three wavelengths** — 30 m of stand, 10 m of clump, 4 m of one crown — between 13 m
  and 27 m up, so its head shows over the near rank and under the far line. A first recipe had a fourth
  wave at 1.8 m and the crest came out a saw, tooth after tooth, all alike: a wave shorter than three
  samples of the step the ring is walked at is an alias, and an alias is regular by construction;
- the ring is walked at **1 m**, its line pushed in and out by ±11 m over a wave of seventy, so it is not a
  box;
- the leaf pattern goes on at **2 m** to a repeat, not the far line's 30 m, and is then warped off its grid
  (below);
- the material is **solid**: no `alphaCutOff`, no `hasAlpha`, no `sheet()`. What the cut was doing out there
  was punching holes big enough to see the sky through, and that is the fault that closed.

**29,532 triangles of alpha-tested card crowns went out of every frame and 872 came back**, which is worth
having in its own right at this frame rate: `node tools/fps.js` says **1.9 fps** for this build against
**1.3** for `releases/v0.43.0`.

### The second fault the fix brought in, and the two wrong answers to it

A curtain lays its pattern on one clean strip, and at a 2 m tile the leaf canvas repeated every forty-odd
pixels of the frame. The eye, which is built to find exactly that, called it wallpaper the first time it was
photographed (`pictures/46-curtain-3m-grid.png`). So `skylineBand` grew a `warp`, and three ways of warping
were measured before two were kept:

| the warp | what the browser showed |
| --- | --- |
| spacing wanders (0.4-1.6 of a tile, 6 m wave) + rows slid up and down with the ring position (±0.6 tile, 11 m wave) | the columns went, and a **comb** came: the pattern stepped a fifth of a tile at every quad, so the leaf was combed vertically along each one (`pictures/46-combed-shear.png`) |
| spacing wanders + the whole pattern leans over as it goes up, 0.45 tile per tile of height | columns gone, **rain-stripe** in their place — a shear of 24° turns every leaf into a streak (`pictures/46-lean-too-strong.png`) |
| spacing wanders + a lean of **0.12** tile per tile of height | kept: a lean of seven degrees, which slides the leaf a full repeat and a half sideways over the curtain's own 25 m and does not streak it |

The lesson, which is the same one the tone curve and the mown bands teach: **a warp has to be smooth and
small.** Anything that jumps from quad to quad is a comb, whatever it was meant to be.

### What the curtain is worth in the ladder

Measured on the `grass` camera with `tools/cover.js`, the same camera and grid as before the change
(`pictures/46-grass-cover-before.png` against `pictures/46-grass-cover-after.png`):

| | share of the frame | colour painted | its own spread |
| --- | --- | --- | --- |
| far rank, cards | 5.2% | (34,65,24) | 28,24,26 |
| far rank, curtain, material as it was | 11.6% | (29,58,20) | 30,27,29 |
| far rank, curtain, bytes ×1.15 | 11.6% | **(30,60,20)** | 30,27,29 |

It covers twice as much of the frame now, because it is a wall instead of a sieve. The ×1.15 was asked for
to pay back the five points of green the cut used to fake — it came back with two, which is where it stays,
because the step the ladder wants is not a greener step. Read as colour against light the four steps on that
camera run hedge (63,98,15) → near rank (23,60,7) → far rank (30,60,20) → far line (68,93,61): green and red
thirty-seven apart in front of the hedge, thirty here, twenty-five out on the sky, and blue climbing the
whole way.

### What the seventeen standing pictures say

The set is **`pictures/1720-home.png` … `pictures/1736-backstore.png`**, against `1600` … `1616` (`node
tools/scan_old_new.js 1600 1720`): **every view the same or down** — six unchanged, four down 3-4 points,
`pool` and `southborder` down 11 — and nothing blown to white, nothing crushed to black, in-colour the same
or a hair better (95.9→96.2 on `pool`, 99.0→99.2 on `southborder`). Down is the right direction and it is
worth saying why, because a lift of eleven points would have been a fault: what reached those pixels before
was the sky, seen through a hole in a card.

The CPU drawing was re-run on all seventeen (`tools/views.sh`) and its `jungleFar` line re-fitted, since it
had been fitted to a surface that was half cut-away: [52,66,52] with a blue-grey wash drew (63,93,49) with
7,7,5 of spread where the browser paints (30,60,20) with 30,27,29. The new fit is [30,50,24] with the near
rank's wash lifted a shade; it draws (51,87,39). That is as far as the drawing is going — see fault 44.

### What is still wrong

42. **The near rank, close to, is flat panels.** `pictures/46-combed-shear.png` (which is the `southborder`
    camera cropped and blown up) has the near rank within nine metres of the eye, and the cards show as
    flat quadrilaterals with straight edges and one soft gradient each. It is the same fault the far rank
    had, at the other end of the size range, and it was there before this session: the near rank is the
    thirty-fourth session's answer to a row of green eggs and it is a good answer at fifteen metres, but at
    nine you can read the geometry. The lever is fewer, smaller cards per crown and a bigger leaf on each,
    or crowns built from clusters rather than from single quads.
43. **The curtain still repeats.** At the `?fov=0.4` crop (`pictures/46-curtain-after.png` at the same
    camera as the before) the sprays are still countable in runs. The warp stopped it reading as wallpaper;
    it has not stopped it reading as a pattern. The next lever is a canvas with fewer, smaller, less
    contrasty sprays for this one material — not a smaller tile, which is what put the grid there.
44. **The CPU drawing paints the curtain flat.** It gives `jungleFar` 5,6,3 of spread against the browser's
    30,27,29, because it has no leaf pattern for a curtain — the old `cut: "crown"` stand-in went out with
    the cut, and `wash` cells in UV space cannot make a leaf that is laid in metres. Same missing term as
    fault 4 and fault 33: read the drawn belt for coverage and nothing else.
1. **Also standing, and nothing to do with this session:** `tools/feet.js`'s third report lists 0.46-0.50 m
    steps at the terrace ends (x = ±6.3 to ±7.5, z = 0.3-0.5) — the terrace floor at 0.50 above the paving at
    0.04. It is the terrace's own edge and there is an invisible wall in it (`terraceEndWest`,
    `terraceEndEast`), so nobody walks off it, but it is in the report and was in it before this session.

### Pruning

This entry names `pictures/1720-home.png` … `pictures/1736-backstore.png` (the set this release ships on),
`pictures/1600-home.png` and `pictures/1606-west.png` (the same two views before, from `v0.43.0`),
`pictures/46-farrank-before.png`, `pictures/46-curtain-after.png`, `pictures/46-curtain-3m-grid.png`,
`pictures/46-lean-too-strong.png`, `pictures/46-combed-shear.png`, `pictures/46-grass-cover-before.png`,
`pictures/46-grass-cover-after.png` and `pictures/drawn-southborder.png`.

Gone: `pictures/tmp/` (the belt ladder, the camera probes, the crops that are not named above). The kept
before-and-after pictures were deliberately given names that start with a digit, following last session's
warning about a grep pattern that could not see a name that did not.

## What was done this session (forty-fifth, 2026-10-16) — the grass stopped growing in the waterline 🌱➡️🟫

The browser was in the room (**2009 of 2048 slots free**, no zombies) and every number and picture below came
out of it. `node --check` passes on all ten files touched; `tools/standup.js` walks the Villa with no fault
(611 meshes, 11 lights, 51 materials, four clean frames); `tools/feet.js` still builds it whole and every
foot-place and every reachable place answers `ok`; `tools/shadows.js` and `tools/sheets.js` are clean;
`node tools/tuftfoot.js` says 1758 sheets, 0 on built stone, 0 in the pool.

Fault **39** (the capstone overhanging grass) and fault **40**, found here (a grass pinstripe at the water
itself), are both closed — and they were the same fault, which is why 39's first fix did not finish it.

### The fault, and the two numbers that proved what it was

At the water's edge, down the whole 5 m of the pool's **east** side, one column of pixels came out
`(97,162,25)` — grass green — while the west, north and south edges came out teal.
`pictures/poolring-before-edge.png` is that edge blown up eight times, photographed out of `releases/v0.42.0`
itself: water, the dark band of the exposed wall, one lime hairline, the damp foot, the stone. The whole pool
from 14 m up is `pictures/poolring-before-v0420.png` before and `pictures/poolring-after-v0430.png` after, and
`pictures/poolring-after-edge.png` is the same crop afterwards — clean stone. So this was not grass showing
*outside* the capstone (fault 39, which was closed first and is closed properly now): it was grass showing
*inside* it, at the water.

What it was: the lawn's four strips were laid out to the pool's own inner face — `x = ±5`, `z = 2.1` and `7.1` —
so a plane of grass at `y = 0` ended in the same vertical plane as the wall, 20 cm above the water. A tread
meeting a riser at a grazing eye: along that whole line the two surfaces are a hair's breadth apart in depth
(1.7 cm at one pixel, worked out on paper and then believed only after the browser agreed), so the rasteriser
hands the pixel to the grass on one side of the pool and to the wall on the other. It is in `1453-home` …
`1469-backstore` nowhere and in the overhead everywhere: **a fault that only shows from the air is still a
fault.**

Three live cases settled it, in `tools/lawnedge.json`, each one a switch thrown on the running Villa and the
same camera photographed again (count with the new `--find` in `tools/pixels.js`; as built it answers 595):

| the case | green pixels by the east edge |
| --- | --- |
| as built | 595 |
| the water, the caustics, the wet band, the wet tile, the tile's environment, roughness 1 — all switched out one by one (`tools/edgeline.json`) | 405 to 522: nothing moves |
| the east wall's box widened | 578 — still there |
| `lawn3` moved 0.45 m east (its cut edge under the paving) | **64**, all of it legitimate lawn at the far side of the frame |
| `lawn3` sunk 6 cm | **64** |
| the lawn switched off | **0** |

So it was never the pool. Every knob on the wall and the water was measured on a fault that was not in them,
which is the same trap the forty-third session wrote down about an invisible surface, seen from the other side:
**when a fault will not move for anything on the thing it appears to be on, stop tuning that thing and ask what
else is in the pixels.**

### The fix: the stone goes to the pool, and the grass goes under the stone

- **`src/court.js`** now names the pool's wall shell — `poolShell = { x: 5.3, z0: 1.8, z1: 7.4 }`, the pit's own
  30 cm walls — and all four paving rectangles meet on those four numbers. This closes three things at once.
  The capstone (0.42 m proud of the water's edge, 9 cm proud of the deck) used to stop 2.5 cm *short* of the
  paving, so there was a slot all the way round the water, 2.5 cm wide and 7 cm deep, floored by grass: now the
  cap stands on stone the whole way round. The paving edges no longer overlap one another by 5 mm either, which
  is two coplanar 0.14-high top faces fighting for every pixel over the overlap. And fault 39 is closed properly
  rather than by 2 cm of overshoot.
- **`src/world.js`**: the lawn's four strips stop **15 cm inside** the paving on every side of the water
  (`x = ±5.45`, `z = 1.65` and `7.55`), and the two side strips were widened across the whole garden so no bare
  band opens where the north and south strips used to end. The slab is solid from `y = 0` to `0.14` and opaque,
  so a cut edge of grass under 15 cm of it cannot be seen from any angle a visitor has, and there is no longer a
  line for two surfaces to quarrel over. The strips were also checked for the other way this fails: through the
  slot and under the cap there was a floor only because the lawn happened to reach that far; now the paving is
  the floor and nothing looks down into the world's back side.
- **`src/world.js`**: the path out through the south was being built **twice** — the loop over `pavedGround`
  already builds it (the filter only excluded the two side decks) and then the file built it again by hand. One
  slab of boards, drawn twice in the same place, with two coplanar faces for the depth test to choose between.
  The second call is gone; the loop's own copy carries the path's 12 cm height through `rect`. The scene went
  from 612 meshes to 611, and `tools/feet.js` from 49 floors to 48.

### Measuring: two new instruments, and a rule about the eye

- **`node tools/scanline.js <png> --row N | --col N --from A --to B [--step n] [--run n]`** — the colour of
  every pixel along one row or column, printed in order, with `warm` (red − blue) on every line. A two-pixel
  stripe between a capstone and a paving slab is not findable by any grid average in `tools/pixels.js`; it is
  findable by reading a line of pixels straight across it. `--run 4` collapses a band of one colour into one
  line with how many pixels it covers, which is how a stripe is measured in pixels instead of guessed at.
- **`--find "g-b>50 && g-r>25" [--where x0,y0,x1,y1]` in `tools/pixels.js`** — count the pixels that answer a
  rule written in the channels, and say where in the frame they lie. That turns "is the hairline gone?" into one
  number (595 → 64 → 0) and `--where` keeps the hunt out of the lawn next door.
- **A pixel rectangle means nothing across a different eye.** `?fov=` and a plan's per-view `fov` both work, and
  between 0.5 and the Villa's own 0.85 the pool's east edge sits at x 1143 in one frame and x 934 in the other.
  Half of this session's ladders measured nothing at all because the probe box belonged to the other eye. Say
  which eye a probe belongs to, in the plan's own `note`, before a later session reads it.
- `tools/capgap.json`, `tools/capprobe.json`, `tools/paverprobe.json` and `tools/lawnprobe.json` were all re-run
  after the change: the gap answers `deckWalk/paver` and `deckFar/paver` where it answered `lawn0` and `lawn1`;
  the damp foot is still (164,145,126) L148 against the dry capstone's (191,169,138) L172 — **0.86**, and `?wet=0`
  puts it back at L173; the paving's own vertex tone still reaches the screen (a place by the coping moves
  L113 → L119 when the tone is flattened) and so does the lawn's.

### What the pictures say

The standing set is **`pictures/1600-home.png` … `pictures/1616-backstore.png`**, against last session's
`1453-home` … `1469-backstore` (which is what `v0.42.0` shipped, and which is also the *before* picture of this
fault). `node tools/scan_old_new.js 1453 1600`: **every one of the seventeen views is `+0` on luminance** — not
"nearly": zero on all seventeen, nothing blown to white, nothing crushed to black, the lit band's colour and
spread where they were. That is the right result for a fault that lives under a capstone and one pixel wide.
The evidence is elsewhere: `pictures/poolring-before-edge.png` (the hairline, from `v0.42.0`) against
`pictures/poolring-after-edge.png` (the same crop of this build — clean stone the whole way round), and
`pictures/court-overhead-v0430.png`, the whole court from 26 m up, where the lawn meets the paving on every side
with no bare band, no hairline and nothing to see through.

To look at this fault again from the air, the camera is:
`node tools/look.js "http://localhost:8090/villa/index.html?float=1&view=0,14,4.6,3.1416,1.5708&fov=0.5" out.png 4000`
— `float=1` or the walk sets the visitor back down on the ground and the camera is in the paving.

`tools/views.sh` was redrawn; the CPU drawing follows the same source, needs no change, and shows the same
thing: water, the wall's dark band, the damp foot, the stone, and no green (`pictures/drawn-poolover.png`).

### What is still wrong

37. **No refraction.** Left open on purpose, as last session said: a second render pass per frame is what it
 costs, and this sandbox draws the Villa at about 1.7 fps. The bottom under the near half of the surface is
 drawn crisp and unmoved.
33. **The CPU drawing still paints the water as a flat sheet** — read it for shape and coverage only.
41. **The damp foot of the capstone reads darker in single pixels than the box mean suggests.** At 100 px/m
 straight down, `--scanline` over the foot came out L81–91 against the dry capstone's L120–145, where
 `tools/capprobe.json`'s box mean says 0.86. The pixels are landing on the stone's own joints. Nobody has
 yet measured the foot's joints and the dry stone's joints *as joints*; until someone does, a visitor at arm's
 length may see the damp band as a stripe of a slightly different stone rather than as the same stone damp.

### Pruning

This entry names `pictures/1600-home.png` … `pictures/1616-backstore.png` (the set this release ships on),
`pictures/1453-home.png` and `pictures/1460-pool.png` (the same two views before), `pictures/poolring-before-v0420.png`,
`pictures/poolring-before-edge.png`, `pictures/poolring-after-v0430.png`, `pictures/poolring-after-edge.png`,
`pictures/court-overhead-v0430.png` and `pictures/drawn-poolover.png`.

Gone: this session's working pictures and probe saves (`pictures/tmp/` is empty now — the edge, edge2, edge3,
edge4 and lawnedge probe sets, the picks and the wet=0 controls), and every numbered set no entry names any
more: `960…1016` except `1000-home` and `1014-grass`, `1100…1121` except the six named, `1200…1266` and
`1300…1350` except the five named. `pictures/` went from 2.3 GB to 1.7 GB.

**One warning about pruning, learned the hard way here.** The keep-list was built with
`grep -oh "[0-9][0-9A-Za-z._-]*\.png" NOTES.md CHANGELOG.md` — a pattern that starts with a digit, so it caught
no `tmp-*` name at all, and the sweep deleted the four pictures the forty-third and forty-fourth entries name:
`tmp-pA-crop`, `tmp-new-pool-crop`, `tmp-wl-cap`, `tmp-wl-final`. Their arguments survive in the numbers written
in those entries, and the states themselves are not lost: **a released copy is a permanent witness.** That is
why this entry's before picture is `releases/v0.42.0` photographed from the air rather than a working file, and
it is the better way round. When a prune is next run, use `grep -oh "[A-Za-z0-9._-]*\.png"` — no leading digit
— and re-take anything important off a release instead of keeping a scratch file for it.

## What was done this session (forty-fourth, 2026-10-16) — the pool got a waterline 🌊✆

The browser was in the room (**2009 of 2048 slots free**, no zombies) and everything below was photographed out
of it. `node --check` passes on every file touched; `tools/standup.js` still walks the Villa with no fault
(612 meshes, 11 lights, 51 materials, 60 textures, four clean frames); `tools/feet.js` still builds it whole.

Fault 38 — “nothing marks where the water meets the walls” — is closed.

### What was built: two materials and eight thin boxes

A pool with no line at its edge is a hole in the ground with a blue film in it. Nothing said where the water
stopped, the eye could not find the surface's edge, and the water's top band ran straight into the grout
(`pictures/1341-pool.png` is the released picture of that). So now there is:

- **`mats.poolWet`** — the 14 cm of tile the water actually touches, from the surface up. It is the pool
  mosaic's own texture and bump, worn as a MULTIPLIER of a darker, cooler colour, so the joints in the band
  cannot shift out of true where it meets the wall. Four boxes, `wetWest/East/North/South`, laid on the face
  of the wall and not in it (a band in the wall's own plane z-fights and flickers).
- **`mats.copingWet`** — the inner 13 cm of the capstone, damp all day where people climb out. Four boxes,
  `splashWest/East/North/South`.
- **`?wet=`** from the address bar. `?wet=0` paints both materials back to the numbers of the dry ones they
  copy, which is the control case; any other number dials the darkening, which is how the bytes were found.
  `tools/draw.js` knows both materials (`src/surface-colours.js`), and neither is in the pool's own mirror
  (`?wet=` off would otherwise be measured against a cube that had already drawn them).

### The damp foot is a band of the capstone, not a plate laid on it

The first version of the splash strip was a 6 mm plate sitting on top of the coping, and the browser showed
why that will not do: **anything proud of a capstone throws a shadow of its own height**. Six millimetres of
shade is two pixels at arm's length and it read as a groove sawn in the stone (`pictures/tmp-wl-cap.png` caught
it at the plate, before the change). Three millimetres was half a pixel and still a fight at nine metres. So
the coping ring is now **eight boxes instead of four**: every side is its dry stone plus the damp foot, side by
side in one plane, tops at the same height, edges butting — the same continuous metre-measured pattern on
both, so the block joints run straight across the join. No pixel is ever asked to choose between them.

Whether the dark line on the coping was the join or the stone's own joint was asked and answered properly
(`tools/capjoin.json`, one-centimetre picks with the mesh each one answers printed beside it): the join is at
z = 1.97 and the dark pixels lie where the coping's pattern puts a joint, and they are the same pixels with
`?wet=0`, when there is no join to see. Not a seam.

### Measuring a two-pixel strip, which was the session's real difficulty

Every reading taken from the bank was useless and the numbers show it: at 6 m the wet band is two pixels tall,
and `tools/lights.js` averages a small box, so the band was painted back to its neighbours — the same pick
read L141 in one run and L125 in the next, and the damp foot on the coping read L173, *brighter* than the dry
stone beside it, because the box around it was mostly dry stone. Two instruments fixed it:

- **`tools/bandprobe.json`** puts a camera 10 cm above the water, 2.2 m from the north wall, where a 14 cm
  band is fifty pixels and nothing is in front of it. **`tools/wetladder.json`** is the same camera with
  `?wet=` as a ladder. Reading the band three centimetres below its top against the dry tile six centimetres
  above it, the tile holds (124,160,158) L152 at every setting while the band came to L129 as first built
  (0.85 — a shrug), L108 at six tenths, L94 at four, L80 at a quarter. Six tenths stands: **the band reads
  (95,133,135) L125 against the dry tile's L152** at the wall, and the tile above and the water below never
  move, which is the proof that the change is where it is meant to be. With `?wet=0`, which paints the wet
  materials back to the dry ones' numbers, the same place reads L170 — the wall before, in one number.
- **`tools/capprobe.json`** looks straight down on the north coping, where the damp foot is thirty pixels
  wide. At roughness 0.4 with the dome's mirror full on it read (147,136,125) L138 against the dry capstone's
  (213,186,150) L189 — four fifths of the stone in a hard band, a stripe of paint and not an edge. It now
  keeps the dry stone's own roughness with the dome at 0.7, and reads **(174,154,134) L156 — 0.83** of the dry
  stone, cooler by twenty in red against blue, which is what damp limestone looks like beside dry.

- **Rule for this file: a strip thinner than a finger cannot be measured from where a person stands.** Move
  the camera so the thing being measured is forty pixels wide, or do not believe the number.

### Two things weighed and not done

- **Refraction, fault 37, left open on purpose.** A second full render of the scene per frame is what a
  see-through-wobble costs, and this sandbox already draws the Villa at about 2 frames a second; the last
  session's own measurement of eight new meshes was “no difference at all”, which is the price of geometry and
  not of a second camera pass. Not this fault, not this way.
- **The paving does not reach the coping** (new fault 39, measured below). Two numbers in `src/court.js` would
  close it, but four files read those rectangles — the paving's tone is averaged over them and the grass
  fringes are laid along them — and the fault is invisible at eye height. It is next session's, with its
  numbers written down.

### What the pictures say

The standing set is **`pictures/1453-home.png` … `pictures/1469-backstore.png`**, against last session's
`1334…1350` (which is what `v0.41.0` shipped). `node tools/scan_old_new.js 1334 1453`: **nothing moves by more
than three points of luminance anywhere** — `home` and `pool` −3 (116 → 113), `path`, `salaroof` and `westwall`
−1, the other twelve unchanged — no pixel blown to white, none crushed to black, and the mean colour where the
light is keeps its saturation. That is what a waterline should do to a whole view: the pool's edge is a few
hundred pixels of a 1280 × 720 frame. Up close the change is not three points: `pictures/tmp-wl-final.png` is
the far edge at 6 m and `pictures/tmp-wl-cap.png` is the same corner from straight above, and there the dark
line at the water and the damp foot of the capstone are the whole story of the edge.

`tools/fps.js` says **1.7 fps for this build (612 meshes) and 1.4 fps for `releases/v0.41.0` (604)**: eight
boxes and a second material are nothing against a software renderer's own second and a half per frame.

### What is still wrong

39. **The pool's capstone overhangs grass on the north and south sides.** The coping's outer edge stands at
    z = 1.68 and z = 7.52; the paving stops at z = 1.6 and z = 7.6 (`deckWalk` and `deckFar` in `src/court.js`),
    so 4–8 cm of lawn shows between the stone and the capstone, and from straight above it is a bright lime
    hairline all the way round (`tools/capgap.json` names `lawn0` and `lawn1` in the gap on both sides; the
    west and east decks are right, standing at x = ±5.445 against the coping's ±5.42 and meeting it). The fix
    is `deckWalk.z1 → 1.70` and `deckFar.z0 → 7.50` — but `paverTone` averages over those rectangles, the grass
    fringes are laid along their edges and `tools/draw.js` weathers by them, so re-measure after: the check is
    `tools/capgap.json` answering `paver` where it now answers `lawn`, and then a full standing set.

### Pruning

This entry names `pictures/1341-pool.png`, `pictures/1453-home.png`, `pictures/1460-pool.png`,
`pictures/tmp-wl-cap.png` and `pictures/tmp-wl-final.png`; the numbered sets `1400…1418`, `1419…1435` and
`1436…1452` were intermediate builds of this same work and nothing names them, so they are gone, with the
`tmp-wl-*` crops the drafts named.

## What was done this session (forty-third, 2026-10-16) — the pool had no water in it at all 🕳️💧➡️🏊

The browser was in the room (**2008 of 2048 slots free**, no zombies) and everything below was photographed
out of it. `node --check` passes; `tools/feet.js` still builds the Villa whole (603 meshes) and
`tools/standup.js` still walks it with no fault.

### The surface was wound facing down, so the browser never drew it

`src/pool.js` laid the water sheet with `rx = -Math.PI / 2`: a single-sided plane facing the centre of the
earth. Babylon culls back faces, so **there was no water in the Villa**. `pictures/tmp-pA-crop.png` is the
released `v0.40.1` over the pool: a dry tiled pit, its steps high and dry, and a scatter of white glitter
hanging in the middle of the air — which is the two caustics sheets, lying where the surface was supposed to
be, with no surface under them. The same picture at the start camera is why the pool has read as “flat and
dark” for twenty-two sessions: it was a *pit*, and the pale band the measurements kept finding was the tiles
seen from above, not water.

`tools/cover.js` named `water` at every grid point over the basin the whole time, because **picking does not
respect winding**. That is the trap in this, and it is a mean one: any dial tried on the water material was
measured on a surface that was never drawn, so it appeared that nothing the water material was given had any
effect. The one inch of code that fixed it is `rx = Math.PI / 2`, and the proof is that the picture changed.

- **Rule for this file: if a change to a surface does not move a single pixel, do not tune it — check that
  the surface is drawn at all.** Make it emissive red, or delete it, and look.

### The water, built again as water

A sheet you can see *through*, and not a painted lid: `alpha` 0.48, `roughness` 0.06, an albedo of
(0.02,0.045,0.045) — near black, because a pale albedo on a transparent sheet is the bucket of milk the
twenty-first session refused (measured again this session: the same sheet at roughness 0.12 instead of 0.32
takes the pit *down* from L129 to L87) — an emissive film of (0.25,0.66,0.62) for the colour the water puts
over everything it lies over, and a ripple bump of its own (`rippleCanvas` in `src/textures.js`) at level
0.7, which turns the sun's return off the surface from one white coin into a field of sparkle. The
caustics went down to the floor where they belong, at 5 cm and 9 cm above the tiles, and `causticsCanvas` was
rewritten as thin lines instead of dinner-plate blots; the two sheets' strength is now each mesh's own
`visibility` (0.55 and 0.3) and not the shared material's alpha, which the last session set twice and so
only ever got the second value.

### The alpha now follows the angle you look at it from, and that needed the library's shader

`src/water.js`. Babylon's PBR alpha does not vary with the viewing angle on its own, so the patch takes the
library's own pixel shader and adds one line where the library has settled the alpha:

    alpha = alpha + (1 - alpha) * pow(1 - NdotV, power)      // power 4; ?wfp= to dial it, ?nofresnel=1 to weigh it

Looking straight down you see the bottom; grazing, the surface closes up into a mirror. Two things bit, and
both are in the file's header so nobody re-bites them: `cameraPosition` is **not** declared in the pbr pixel
shader in this build (the compile says so, loudly, and the material silently falls back), so `NdotV` comes
from `normalW` and `viewDirectionW`, which the library has already made above that line; and an integer in
GLSL is not a number — `pow(x, 4)` fails to compile and `pow(x, 4.0)` does not.

The dials, measured on the water patch of the start and over-pool views (`node tools/watertest.js "…" "…"`,
one url per case, and it prints the patch for each):

| the water's alpha | start view patch | over-pool patch |
| --- | --- | --- |
| no angle at all (`?nofresnel=1`) | (93,130,124) L122 | (111,151,151) L143 |
| power 3 | (93,130,125) L122 | (115,154,154) L146 |
| **power 4, what stands** | (91,128,123) L120 | (111,151,151) L143 |
| power 4 with a 0.5 floor | (82,122,117) L113 | (101,142,142) L134 |
| power 2 | (83,122,117) L113 | (103,144,144) L135 |

### What the water mirrors, and a fault that was costing the whole Villa its ambient light

The mirror is filled by a **second cube** (`main.js`), taken from the pool's own surface at the height of
the water, of every mesh but the pool's own — handed to `mats.water.reflectionTexture` and to nothing else,
so `scene.environmentTexture` is untouched and no other surface in the Villa moves by a byte. It is what
puts the house and the palms upside down in the far half of the basin, and it is *darker* than the sky cube
it replaces (the start view's water: L110 with it, L118 with the sky cube): a mirror of a shaded house and a
lawn is a darker mirror than a mirror of open sky, which is why it was kept.

**Filled after the first frame, and that is not idleness.** With `poolCube.render()` at boot — while the sky
cube's `prefilter` is still running, since `prefilter` answers later and not at once — the whole Villa loses
its ambient light, in pictures with no pool in them at all: `backstore` L99 → L84, `westwall` L90 → L72,
`rear` L87 → L63, and all seventeen standing views down between 5 and 24 points. It took the whole standing
set to see, because nothing else about the pool looked wrong. `scene.onAfterRenderObservable.addOnce` fixed
it dead: the fifteen views without the pool came back byte for byte.

### The tiles under the water were in a pit with nowhere to get light from

The coping standing free in the sun reads L195 and the submerged tiles read L129 — two thirds of the stone
beside them, which is a coal scuttle and not a swimming pool. This renderer has no bounced light, so
`mats.poolTile.emissiveColor` carries a little (0.07,0.14,0.15) as a standing-in for it: the tiles come up to
about L150 and the water over them to L132. Measured and written into `materials.js` so nobody re-weighs
them: the shadow map is **not** the cause (sun shadows off: L126 → L126), and a glossier tile makes it
**worse** (roughness 0.12 → L87).

### What the pictures say

Standing set **`1334-home` … `1350-backstore`** against `1250`…`1266` (`node tools/scan_old_new.js 1250 1334`).
The whole-frame means move almost nowhere — `home` −1, `pool` +1, three views ±1, thirteen unchanged — which
is the point of note: **a pool that gains a surface does not move a frame mean, because the basin is a tenth
of the frame and the water landed near the tone the dry pit already had.** The patch numbers are the ones
that tell it, over the same box (40,470→1240,700) on the same camera, the released `v0.40.1` against now:

| the start view's water band | mean | between-block L | warmth (r−b) | brightest block |
| --- | --- | --- | --- | --- |
| `v0.40.1` — a dry pit | (112,142,136) L135 | std 20.3, range 61–167 | −24.3 | (131,177,179) |
| now — water | (96,138,133) L129 | std 21.4, range 61–188 | **−36.7** | (127,204,211) |

Bluer by twelve points of warmth, a wider spread between one patch and the next, and a brighter top end;
nothing black anywhere, and `>240` at 0.0% in that patch at the start camera (the over-pool camera's glitter
runs 2.7% over 240, which is the sun coming back off a ripple and is allowed). The pictures to look at are
`pictures/tmp-pA-crop.png` (before: a dry pit with glitter in the air) and `pictures/tmp-new-pool-crop.png`
(after: steps going down under a surface, a sparkle field where the sun mirrors, a bright shallow floor, and
the far wall mirrored across the top band). Both were pruned-later-proof: they are named here, so keep them.

### Two things weighed and refused

- **An opacity map to make the see-through half shimmer.** Putting the water's own skin canvas into
  `opacityTexture` (at alpha 0.6) took the patch from L108 to L99, and the caustics canvas in at alpha 0.75
  took it to L90: the alpha multiplies *down*, and the film is dimmer than the sunlit floor it covers, so an
  opacity map buys shimmer only by giving the depth back three times over. Left out; it is fault 37 instead.
- **Brightening the film further still.** At ×1.6 the water reached L115 at the start camera, but the mirror
  band at the coping went white with it. ×1.5 over the old film is what stands, and no more.

### What is still wrong

New faults **37** (the see-through half of the surface does not wobble: there is no refraction, so the
bottom is drawn crisp and unmoved and the near half of the pool reads like glass laid over a mosaic) and
**38** (no waterline: nothing marks where the water meets the tile, and the coping has no wet band). The
CPU drawing in `src/surface-colours.js` was retuned to describe the new pool — the pale mosaic, the net on
the floor, a 0.48 sheet — but it is still a flat sheet and says so in its own comment; fault 33 stands.

### Tools

- `node tools/watertest.js "<url args>" "<url args>" …` — photographs the start and over-pool cameras at
  each set of url args and prints the water patch of each, mean, brightest and how much is over 240. That is
  how the dials above were weighed.
- `node tools/shaderdump.js <material> [needle]` — prints the shader text the library would compile for a
  material, and where a word appears in it. That is how the alpha line and the two vectors were found, and it
  is the tool to reach for before writing any shader patch.
- **A second `?` in a url silently eats every parameter after it.** Half of this session's dial ladders
  measured the default build, because the case strings were joined with `?` onto a url that already had one.
  Join with `&`. If a ladder says three different settings gave three identical numbers, suspect the url and
  not the setting.
- **Pruning this session's working pictures also removed a dozen crops named by older sessions** —
  `tmp-deckcrop`, `tmp-bush-before/after`, `tmp-tuft-before/after`, `tmp-grassA/C`, `tmp-gsA/C`,
  `tmp-court-over`, `tmp-far-east`, `tmp-air-south`, `tmp-stick`, and the two the forty-second session named
  as ranges. They are gone from `pictures/` and cannot be re-taken; what each showed is written out in numbers
  in the entry that names it, which is where the argument lives anyway. The two this session's own entry rests
  on were kept and are named above: `pictures/tmp-pA-crop.png` (the dry pit) and
  `pictures/tmp-new-pool-crop.png` (the same water, after). Before pruning `pictures/` again, run this and
  keep what it lists: `grep -o "pictures/tmp-[A-Za-z0-9._-]*\.png" NOTES.md CHANGELOG.md | sed 's/^[^:]*://'
  | sort -u`.

## What was done this session (forty-second, 2026-10-16) — the pool deck was grey asphalt, and it is cut sandstone now 🛞➡️🟨

The browser was in the room (**2008 of 2048 slots free**, no zombies) and every number and picture below
came out of it. `node --check` passes; `tools/feet.js` and `tools/standup.js` still build the Villa whole.
This session took the forty-first session's item 1 — the paving as "the same fault one surface later" —
and found it was a different fault wearing the same clothes.

### The deck was dark because its stone was grey, not because it was shiny

`mats.paver` wore sheen 0.25 over a pattern whose stone was (150,141,126) with a grain wash down to
(96,90,80). Photographed on the `path` camera, where the court is a third of the frame, it laid itself out
at **(133,113,87) L115**, its brightest 40-pixel block at L131, while its own coping stood at L206 —
ninety-one points darker than the kerb that borders it (`pictures/tmp-deckcrop.png`, cut from
`pictures/1232-path.png`, is the deck at arm's length: pitted, grey, and read for tarpaper). A sawn
limestone poolside is pale and warm; `src/paving.js` already lays the dust and the damp over it at a scale
bigger than the tile, so the tile itself had no business being grey. `paverCanvas` is (176,161,134) slabs,
a grain wash from (143,131,108) to (219,205,178), and a warm-brown grout instead of a black line.

### The sheen comes down to 0.18, and NOT the way the lawn's did

The forty-first session expected the lift to come down as the sheen goes. It does not, and the ladder says
so (`tools/tint.js --fresh` on `path`; the four pictures of that ladder were pruned afterwards, so the
numbers stand here in full):

| the deck, one third of the `path` frame | mean | light | red − blue | brightest |
| --- | --- | --- | --- | --- |
| sheen 0.25, old grey stone (as it was) | (133,113,87) | L115 | 46 | (211,176,137) |
| sheen 0.08, same stone | (87,76,58) | L77 | **29** | (139,116,88) |
| sheen 0.08, warm payment r×1.2 g×1.05 b×0.7 | (99,80,43) | L81 | 56 | (156,119,65) |
| **new pale stone**, sheen 0.25 | (174,144,105) | L148 | 69 | (238,193,139) |
| **new pale stone, sheen 0.18** | **(155,129,94)** | **L132** | **61** | (231,186,132) |
| new pale stone, sheen 0.12 | (135,114,82) | L117 | 53 | (219,176,122) |

- **the glare on stone is warm and the glare on grass was blue.** Taking the sheen off the deck took
  thirty-eight points of light and *seventeen of warmth* with them: the sun's glint off a dry slab is the
  sun's own colour, and the lawn's veil was the sky's. So the payment back is not a bigger lift — the stone
  had to be painted pale in the first place — and the sheen can stop at 0.18 instead of 0.08.
- 0.18 and not 0.12 because at 0.12 the deck is back to grey (warmth 53) and, on the `west` view where the
  sun rakes it at 14°, only L145; and not 0.25 because the pale stone at the old sheen put the sunlit deck
  at L176 on `west` with its brightest pixel (244,195,139) — at the ceiling again, which is fault 1 all
  over. At 0.18: `west` L163, `path` L132, and the block-to-block spread is the biggest of any of them
  (std 7.4 against the old pattern's 6.7), which is the tone curve *not* being fed a clipped surface.
- the coping takes 0.14: it is a fresh-cut arris and not a worn slab, so it has less to be forgiven. Its
  brightest pixel on `path` comes from (252,217,178) to (249,210,164) and its mean from L206 to L196.
- `src/surface-colours.js` `paver` is mirrored to the new canvas in the same breath, so the CPU drawing is
  at least describing the same stone. **And the drawing now over-paints it**: (190,159,123) against the
  browser's (155,129,94), 26 points over on a sunlit horizontal face, where the whole `path` frame runs L136
  against the browser's L116. That is faults 4 and 33 — no ground bounce, one sky term, no notion of which
  way a face is turned — and it was left alone on purpose: the previews that get walked come from a browser.

### What the pictures say

Standing set **`1250-home` … `1266-backstore`**, against `1227`…`1243` (`node tools/scan_old_new.js 1227
1250` prints the whole table). The frame means move only where the deck is big: `path` +6 L (the court is a
third of it), `sala` +2, `westlawn` and `salaroof` +1, `home` −3 and twelve views unchanged to the point.
Nothing black, nothing blown, `>240` nowhere above 0.2%. `in colour` came up a fraction on `path`, `west`,
`sala`, `pool`, `salaroof`, `westlawn` and went down 1.1 on `home`, whose bit of deck lies in the house's
own shade and lost a little of what the shine used to hand it. On the sunlit patch itself (`--patch
"380,540,900,700"`, 40 px blocks) the deck went (132,115,91) L117 warmth 41 → **(154,131,96) L133 warmth
57**, range 117-149: brighter, warmer, and with more difference between one patch and the next, which is
the dust and the damp coming back through.

### Two things weighed and refused, and written down so nobody weighs them again

- **The six hill spheres are not in the picture.** 🔍 They were painted red in a live page and `cover.js`
  asked what the browser used to paint the `west` frame: **0.1%**, one grid point out of 880 — and with
  `farBelt.isVisible = false` the rest of them was still behind the far tree line. **The smooth green
  "hills" in every standing view are the far tree line**, reading (77,101,72) at 160 m, which is the last
  green step the eye is ever given; that is why the horizon above the wood is one dark band and then sky.
  They were then pushed to 300-380 m and raised until they cleared the band (`diameterY` 160-240, tops
  70-110 m) and photographed: they come out (100,125,93) — a properly hazy pale, exactly the step the haze
  ladder wants — but six smooth domes peeking over a ragged wood is not a ridge and they covered 0.4% of
  the frame. They stand back where the forty-first session left them, and `src/world.js` now says the
  alternative: build the ridge the way `skylineBand()` builds the tree line, or delete the spheres and stop
  saying the Villa has hills.
- **The lawn at arm's length is acid, and neither colour lever fixes it, because the two distances want
  opposite colours.** The forty-first session's item 2 asked for "a little blue back in the low end". Both
  readings were weighed on the two cameras at once (`grass`, 2 m, and `southborder`, raking at 10 m):
  raising the material's blue lift by 2.1 takes the 2 m sward (125,154,28) → (121,152,55), which is grass
  and looks it — and turns the 10 m sward (124,175,54) → **(124,175,88)**, which is mint: see
  `pictures/tmp-grassA.png` against `pictures/tmp-grassC.png` and `pictures/tmp-gsA.png` against
  `pictures/tmp-gsC.png`. That is the forty-first session's "printer's green" catch again, from the other
  side. The other lever — blue only at the *bottom* of the sward ramp, the canvas's darks (46→60, the mix
  low 54→60, the fine wash low 46→54, the blades' foot 48→56) — was built and measured and moves nothing
  that matters: (124,153,32) at 2 m and (124,175,60) at 10 m, four and six points. The sunlit mean is made
  out of the ramp's bright end and the material's lift, not its foot. So it was reverted, and the fault is
  not a colour: a lawn at 2 m is a flat printed sheet with clumps standing on it, and the next word there
  is near-range structure (more contrast between a blade and the gap beside it, dirt showing between
  them), not another multiplier.

### What the next session should do, in order

1. **The horizon has two steps and needs three.** The far tree line is the last green the eye gets and it
   reads as hills: (77,101,72) at 160 m, its top a ragged dark edge. Either give it a ridge behind it — one
   long mass with a ragged top, its own pale bytes (the weighed target is about (100,125,93)), 300 m out,
   built like `skylineBand()` and not like six domes — or say goodbye to the hill spheres in `src/world.js`.
   The tattered vertical towers that stick up above the band in `west` and `path` (near-rank crowns whose
   cards read torn) are the other half of the same complaint.
2. **The pool water is the biggest flat thing left.** In the start view it is a third of the frame and reads
   (120,160,170)-ish: pale, milky, and its caustics pattern reads as crumpled foil rather than as water
   over a mosaic floor; nothing of the house is in it. Weigh it the way the deck was weighed — `cover.js`
   for what the browser paints, `--patch` for whether it has any movement in it, then one knob at a time.
3. **The lawn at arm's length** — see the refusal above: structure at 2 m, not colour.
4. **The belt and the hedge from a metre above them** (the fortieth session's item 1, still untouched):
   leaf relief on `jungle` and `jungleFar` the way `bush` has it, and the near rank filled so no lawn shows
   through it from above.
5. **`tools/tint.js` now stops on a failed ladder step** (the forty-first session's item 6, closed here):
   a step that throws prints `step N FAILED — this step was not measured` and is skipped, instead of
   printing the built Villa's own numbers under a line that did nothing — which is how one wrong blame for
   the sky fill's blue nearly got written down twice.
6. `westlawn` as a standing camera still has a palm trunk dead centre.

### And one tool that used to lie

`tools/tint.js` printed a failing ladder step and then measured the Villa anyway, so a step that threw gave
the same numbers as a knob that does nothing. It now prints `step N FAILED — this step was not measured` and
skips it, checked by asking it to set a material that is not there.

### Released

**v0.40.0**, "the pool deck was grey asphalt; it is cut sandstone now". Three source files changed
(`src/textures.js` `paverCanvas`; `src/materials.js` the two sheens and the argument for them;
`src/surface-colours.js` the deck's mirror of the new canvas). `diff -r releases/v0.40.0/src src` came out
empty, and `releases/v0.40.0/preview.png` is a live-browser picture of the copy: the coping and the pool
edge in the foreground, four planted pots, and the pale stone at the bottom of the frame.

**v0.40.1**, the same Villa with two comments repaired: the pruning below took the ladder pictures those
comments sent a reader to, so a released file was pointing at a picture that no longer exists. Nothing on
screen moved — `diff -r releases/v0.40.1/src src` empty, and v0.40.0's measurements stand.

## What was done this session (forty-first, 2026-10-16) — the lawn was a mirror aimed at the sky 🌿🪞➡️🌱

The browser was in the room (**2009 of 2048 slots free**, no zombies) and every number and picture below
came out of it. `node --check` passes; `tools/feet.js` still builds the Villa whole. This session fixed
fault 29, which is twenty-two sessions old and which the thirty-sixth session left with two levers named.
**Both of those levers are dead**, and the fault was a third thing nobody had weighed.

### The mint was the sky, and not the grass

Fault 29 named the top end of `grassCanvas` and the sky fill's blue. Both were weighed on the south-border
camera (lawn 12% of the frame, `tools/tint.js --fresh`; the pictures of that ladder are named `-01` to `-07`
below and are pruned now — the numbers are in the table in `src/materials.js`):

- the sky fill's blue: `hemi.diffuse.b` at 0.7, and at 0.6, both leave the sward at **(142,183,85)**
  against the built Villa's (142,183,87). **Nothing.** Two sessions' worth of blame, gone.
- the canvas's light: `albedoColor.scale(0.85)` — a fifth of the sward's brightness taken out — moves the
  mean five points, (135,171,82).
- `specularIntensity`: **this is the whole fault.** At the sheen the house and garden were given (0.25) the
  sunlit sward is (142,183,87) L167 with its brightest pixel (189,223,127). At **0.08** it is (82,119,45)
  L106; at **0** it is (30,70,18) L58 with its brightest pixel 43,90,32. Sixty-one points of a lawn that
  looked like grass was the sky cube reflected off a flat sheet turned square at the sky and raked by the
  eye — the one geometry a mirror likes best. The same fault the jungle's cards were cleared of in the
  thirty-fourth session, on a bigger surface.

### What is written, and why those numbers

`matte` now takes **three numbers as well as one** — red, green and blue separately — because a lawn has to
pay its glare back in a particular colour and not in grey:

```
mats.lawn  sheen 0.08, lift [4.2, 3.6, 2.4]      was  sheen 0.25, lift 1.8
mats.tuft  sheen 0.08, lift [1, 1, 1] × 2.6
```

- sheen 0.08 with the old lift lands (114,175,70) L154: the right light, but a green standing 61 above its
  red with 70 of blue in it, which is printer's green and not a lawn in evening sun. Spending the same
  light on red instead of blue — 4.2/3.6/2.4 — gives **(124,175,54) L155** with red and blue sixty-nine
  apart, and it is what a sunlit sward reads as in a photograph.
- **the lift is in `albedoColor` and not in the canvas** on purpose: `grassCanvas` is also the lawn's bump
  (`bumpFromCanvas(grassCanvas(256), 60)`), so brightening the pattern would move the relief with it. The
  material's own colour is bump-neutral.
- **why 0.08 and not 0**, weighed at three angles at once in `tools/lawnmint.json` (raking, raked from the
  west, and straight down from 20 m — the last is where a lift paid for a glare that is not there from
  above would over-brighten). On a lawn pick 20 m under the camera: as built (72,110,20) L96 → 0.08/3.6
  **(73,122,21) L104** → 0.08/2.6 (59,98,16) L84 → 0/3.6 (43,84,13) L70. At nought sheen the lawn from the
  air is a dead green; at 0.08 it gains eight points of light and twenty-one of green.
- the tufts take sheen 0.08 with a lift of 2.6 only. Their sheets stand at every angle, so far less of
  their light was the sky: measured alone, 0.08 moved a clump (106,143,49) L128 → (94,131,43) L117, and
  they are paid back so far as to stay under the sward they stand in — (92,134,30) L118 against the lawn's
  L155.

### What the pictures say

Standing set taken three times: `1103-1119` as it was, `1206-1222` with the uniform lift, **`1227-1243`
as released**. Whole-picture means move gently and all where the lawn is big: `southborder` −4 L,
`rear` +5, `rearcorner` +4, `grass` +2, `eastlawn` +2, and `home`, `path`, `colonnade`, `frontcorner`,
`west`, `pool`, `westwall` and `rearup` not at all — those frames have no lawn in them, which is the check
that nothing else moved. Nothing black, nothing blown anywhere; `in colour` 98.1% (`southborder`), 99.0%
(`grass`), 97.5% (`home`, unchanged).

Where the lawn fills the frame, read the patch and not the frame:

| a stretch of lawn | as it was | released |
| --- | --- | --- |
| south border, raked (64 px blocks) | (126,160,67) L146 | **(109,150,40) L133** |
| straight down from 20 m | (113,122,45) L114 | **(99,148,23) L129** |
| two metres off (`grass`) | (97,133,30) L118 | **(105,139,22) L123** |

The overhead (`pictures/1226-air.png`) is where the fault was worst and the cure most obvious: the lawn
there was (113,122,45), nine points of green, which is dried straw with a blue cast over it. It is a lawn
with mown bands and clumps in it now.

**The CPU drawing did not move, and does not need to.** `tools/draw.js` reads its colours from
`src/surface-colours.js` and never touches a material's `albedoColor`, so it kept painting the lawn as
before — (73,127,44) L110 on the same south-border patch. Against the browser that is a shortfall of 23
points where it used to be 36, still inside fault 4's band (a sunlit view comes out 4-29 points under).
No refit needed; do not "fix" the drawing by chasing the browser's mint back into it.

### And the two great pots at the terrace steps are planted 🏺🌿

The fortieth session's last item said some of the terrace pots were empty, and it was right: the two great
pots that flank the steps — 0.8 m of terracotta on the paving, at x ±3.1 — held nothing at all, while the
potted plants a metre either side of them carried clipped shrubs. In the start view that is four pots in a
row and two of them empty, which reads as a plan nobody finished.

They now wear a soil disc at the mouth and a leafy mass two thirds of it across: `makeLeafyMass` is
exported from `src/garden.js` for the purpose (the same making as a shrub and as a potted bush, so the
shape and the leaf-light are already paid for) and `src/props.js` lays it. The bush stands about 1.5 m
over all — shoulder height for a person on the step between them. `tools/feet.js`: **603 meshes (was 597),
45 floors, 89 blockers (both unchanged — the pots' own blockers were already there), 81.8% of the garden
reachable**; `tools/planted.js` **90 plant parts, 0 rooted in built stone**. Pictures: `1244-home`,
`1245-colonnade`, `1246-frontcorner` and `1247-sala`, which is where the pots are best seen from the side.

### What the next session should do, in order

1. **The pool deck is the same fault, one surface later.** `mats.paver` is sheen 0.25 with a lift of 2.05 —
   the biggest lift in the Villa. A horizontal slab raked by the eye is exactly the mirror that just cost
   the lawn sixty-one points, so the sandy pale of `path` and `west` is glare as much as stone, and the
   grey apron of `pictures/1102-air.png` is what is left when the glare goes. Weigh it the same way
   (`tools/tint.js --fresh`, then `tools/lawnmint.json`'s three-angle shape) and expect the lift to come
   down as the sheen does. The coping takes the same weighing.
2. **The lawn at arm's length is still straw-yellow** — the fortieth session's item 3, and this session did
   not cure it: `grass` reads (86,117,24), green 31 above red and 93 above blue. From 10 m and from the air
   the sward is right; from 2 m it is acid. A little blue back in the low end of the sward ramp, or less
   red in its high end, is the move, and `--at` on `pictures/1241-grass.png` is the check.
3. **The belt and the hedge from a metre above them** — the fortieth session's item 1, unchanged: leaf
   relief on `jungle` and `jungleFar` the way `bush` has it, and the near rank filled so no lawn shows
   through it from above.
4. **Outside the hedge is a flat pale strip** from anything above hedge height, and it meets the hedge in
   a ruled line. Worth noting that this session made that strip greener and no less flat.
5. `westlawn` as a standing camera has a palm trunk dead centre: the Villa is fine, the camera is not.
6. **`tools/tint.js` should stop on a failed ladder step.** It prints `step N failed: …` and then measures
   the built Villa again, so a step that throws looks exactly like a knob that does nothing — which is how
   the sky fill's blue very nearly got blamed for a second fault. Mark such a row `FAILED`, or stop.

### Released

**v0.38.0**, "the lawn was a mirror aimed at the sky". One source file changed (`src/materials.js`: the
sheen and the two lifts, and `matte` learning to lift three channels); one probe added
(`tools/lawnmint.json`, under `tools/`, which `release.sh` does not copy), so `walkable_items` needed no
change. `diff -r releases/v0.38.0/src src` and `diff releases/v0.38.0/index.html index.html` came out
empty, so what was measured is what was published.

**v0.39.0**, "the two great pots at the terrace steps are planted". Two source files changed
(`src/garden.js`: `makeLeafyMass` exported, nothing else touched; `src/props.js`: the two pots, their
soil and their bushes). Both `diff` checks came out empty again, and the release's `preview.png` — the
start view — is the one picture where all four planted pots are in the frame at once.

## What was done this session (fortieth, 2026-10-16) — the visitor got wings, and the air showed two faults 🕊️🌴🌿

The browser was in the room (**2013 of 2048 slots free**) and every number and picture below came out of
it. `node --check` passes on every file; `tools/feet.js` **597 meshes, 45 floors, 89 blockers, 81.8% of
the garden reachable**; `tools/planted.js` **0 of 90 plant parts in built stone**; `tools/sheets.js`
clean; `tools/shadows.js` **399 casters, all meshes**; `tools/standup.js` **4 renders, no fault**;
`tools/fps.js` **1.8 fps**, the same figure the released Villa drew in the same minute — the wings cost
nothing. `tools/flight.js` **12 of 12** and `tools/walk.js` **8 places, nobody fell out of the world**.

### The wings (what the EDICT asked for)

- **`space` is the whole control**, as ordered. One tap takes the ground's hold away, the next tap gives
  it back. `src/main.js`, in `setupWalking`. Key repeat is guarded (`if (!down.has("Space"))`), because a
  held space would otherwise flick between walking and flying at the repeat rate, and `preventDefault`
  stops the page scrolling under it.
- **No new keys were added, and that was a decision, not an oversight.** Flying reuses `W A S D` and
  Shift: walking, the sight line is flattened before it is used, so looking up at the roof does not lift
  you off the paving; flying, it is not flattened, so you go where you are looking. Shift gives 18 m/s
  instead of 8 (against 5.5 and 9.5 afoot).
- **On the wing the walk's keep-off rectangles are let go of.** `src/ground.js` reads walls as columns
  that run from the ground up, so a blocker that stops you at 30 m is not a wall, it is a cage. A flyer
  goes over the pool, the house and the hedge; the check in `tools/flight.js` measures both from the same
  start: the walker is stopped at z 7, the flyer reached z -7.8.
- **Two floors, and one of them is a real fall.** A flyer cannot go below `ground.heightAt + 0.3` (so a
  nose-dive ends on the grass and not under it) nor above 220 m. Coming back down when gravity returns is
  a fall at a set 11 m/s, *not* the 14/s ease the walk uses for a step: eased from 25 m that ease starts
  at near three hundred metres a second and goes through the floor on the way — the same fault that once
  left the start view at y = -45 m. Measured: from y 22.7 the visitor is at 1.74 (floor 0.14 + eye) in
  about four seconds, with no bounce.
- **`?float=1` and flying are now two different things**, which they were not. `float` pins the camera
  where the address bar put it and no key moves it — that is what every tool that photographs a particular
  place depends on, and it is now a `pinned` flag in front of `walk.step` instead of the old `walking`
  flag. `?fly=1` starts the Villa off the ground, and `window.__villa.walk.fly(true|false)` and
  `.flying()` are there for tools.
- **The one word on the plate answers the tap**, so the key is not a mystery: "a Thai pool villa, half
  past five" becomes "on the wing over the garden". `#hint` says `space — off the ground, and back`.
- **`tools/flight.js`** asks twelve questions of a real browser and prints the numbers it decided on:
  one tap lifts and does nothing else, looking up and forward climbs, a flyer hangs where told, the grass
  stops a dive, the second tap lands you, `R` lands you, and the plate says which you are on.

### What the air showed (the Villa had never been photographed from 16 m up)

`pictures/1102-air.png`, `1101-westlawn.png`, `1100-grass.png`. Two faults, both big and both new to me:

1. **The eight palms on the skyline were telegraph poles with a green plate nailed on top.** Their crown
   was seven cards hung *tangentially* (`ry: azimuth` turns a plane's width across the radius, not along
   it), so the head was a flat pancake 1.1 m tall on a 0.5 m trunk — from the lawn a bare stick with
   nothing on it (`pictures/tmp-air-south.png`, crop `pictures/tmp-stick.png`). They are now built by the
   garden's own `makePalm` at 1.5 scale, which hangs eleven fronds radially and drooping and leans the
   trunk: one idea of what a coconut palm's head is, not two. `makePalm` is exported, and gained `nuts: 0`
   and `foot: false` — a palm nobody can walk to needs no coconuts and no blocker (the blocker count is
   89 both before and after, as it should be).
2. **The lawn's bare earth was a spill, not a thin place.** `barePatch(canvas, thin, 0.6, 0.8, [122,90,60],
   0.86)` covered about a fifth of the lawn in laterite and the sun lifted it to **(193,133,42)** at the
   three pixels read in `pictures/1014-grass.png` — a glowing rust the eye reads as a stain. The ramp now
   runs 0.72-0.94, the colour is [92,62,40] and it lies at 0.66 so the thin sward shows through its own
   thin place. The same three pixels now read (138,168,43), (120,133,30), (148,174,56) — grass — and the
   whole-picture mean moved only three points of red, which is the shape of a good fix: the ugly thing is
   gone and the light did not change. The grit pass went with it (0.72-0.92 [150,122,88] at 0.3 →
   0.78-0.96 [118,94,66] at 0.24).

### Also published by this release, and not this session's work

The working tree held a day of work that was never written up and never released (after v0.36.0): the
shrubs and the potted bushes rebuilt as **leafy masses** — unequal lumps, crumpled at two scales, a
parallel shell wearing `bushEdge` so the silhouette ends in leaf tips, and `skinTint` lighting each mass
from its own shape — on top of `spaceNoise`/`spacePatch` in `src/noise.js`. It is in `CHANGELOG.md` under
0.37.0 so the history says where it landed. The mesh count went from 559 (v0.36.0) to 597 with it, and the
bushes in `pictures/1103-home.png` are the proof it was worth shipping.

### The seventeen standing views, and a fault of mine

Taken twice: `1000-1016` before the lawn change, `1103-1119` after. Against `700-716` (what v0.36.0 drew)
the whole-picture means are identical to a tenth of a point and the mean gap per channel is 0.0-0.5 of
255. Nothing pure black and nothing blown anywhere; `in colour` 69.4% (backstore) to 99.0% (grass).
**Read that honestly: the palm and lawn work is all but invisible in the standing set.** The palms are
eighty metres out and a few pixels each, and the lawn's mean barely moved. It is the overhead view that
shows both, and a visitor with wings will look from there.

- **A fault of mine, written down so it is not repeated**: `pictures/1017-home-comments.png`, which an
  older note names, was deleted by mistake by a badly quoted shell loop in this session. It cannot be
  recovered and the measurement it carried is gone. New pictures are numbered 1000-1119 to stay clear of
  the numbers the notes already name.

### What the next session should do, in order

1. **A flyer can now climb into the jungle belt, and the belt is built for the ground only.** 🪜
   `pictures/1121-airborne.png` is what a visitor gets for taking off, climbing to 15 m and flying north:
   the near and far ranks are a heap of torn shingles and slats with the pale lawn showing through them, and
   the far band behind is a smooth olive wall with no leaf at that scale. From the pavement every standing
   view is honest — this is not a regression, it is a place nobody could reach until today. The answer is
   not more cards: it is that `cardRank` crowns must read from above and behind as well as from below
   (leaf relief on `jungle` and `jungleFar`, the way `bush` has it — see the thirty-ninth's closing line),
   and the near rank wants filling so no ground is visible through it from a metre or two above the hedge.
2. **The court is an airport apron from the air.** `pictures/1102-air.png` shows the paving as one huge
   grey grid, larger in the frame than the house. It has pattern in it up close; from 15 m it is a grid of
   identical grey squares with no weather, no joint shade and no change of tone across it. Nothing at eye
   level shows this, so nobody has fixed it.
3. **The lawn is very yellow.** Its mean is (82,114,30) — the red channel is only 32 below green. The
   bare-earth spill is gone; what is left is that the sward itself runs straw-yellow in the sun. Try
   easing the top of the sward ramp's red and see what the same `--at` reads.
4. **Outside the hedge is a flat pale strip.** From anything above hedge height the ground beyond the
   boundary is one untextured yellow-green plane, and it meets the hedge in a hard line.
5. `westlawn` as a standing camera has a palm trunk dead centre: the Villa is fine, the camera is not.
   Move it a few metres and the set gets a west-lawn view that is not through a tree.
6. **Some of the terracotta pots on the terrace are empty.** In the start view the two by the pool's near
   edge (`pictures/1103-home.png`, about 480,520 and 725,520) hold nothing at all while their neighbours
   carry clipped shrubs. Either they are meant to be empty — in which case a couple more, and no visitor
   will wonder — or a plant is missing out of them. Worth a look with `tools/feet.js`/`--pick` before
   anything is painted into them, and `tools/planted.js` will say if a shrub is put somewhere it should not be.

### Released

**v0.37.0**, "space to fly, and what the air showed about the palms and the lawn". Its `preview.png` is a
real browser picture of the released copy — the start view, with the new `space` line in the hint and the
lawn free of its rust spill — and `diff -r releases/v0.37.0/src src` and `diff releases/v0.37.0/index.html
index.html` both came out empty, so what was measured is what was published.

## What was done this session (thirty-ninth, 2026-10-16) — the horizon was a field of rocks, and it is a ridge of jungle now 🪨➡️⛰️

The browser was in the room again (**2009 of 2048 slots free**) and every number and picture below came out
of it. `node --check` passes on every file; `tools/feet.js` **559 meshes, 45 floors, 89 blockers, 81.8% of
the garden reachable**; `tools/planted.js` **0 clumps in built stone**; `tools/sheets.js` clean;
`tools/shadows.js` clean; `tools/standup.js` four renders, no fault. `tools/fps.js` says **2.4 and 1.9 fps**
for this Villa and **1.8** for the released v0.35.0 in the same minute: the machine is slower than the one
that measured 4.1, and nothing was bought away.

Item 34 was the job, and it was the whole job: the belt and the far tree line read as rock. `607-grass` and
`601-westlawn` are the before; `666-home`, `671-path`, `674-westlawn` and `680-grass` are the after.

1. **The far tree line was standing in grey fingers, and the formula said so.** Its height was
   `max(14, width × (1.3 + rand·1.2) × lump)`, so a narrow crown was *asked* to be tall: up to 72 m of a
   9 m crown, and the tallest stood 65 m up at 130 m — twenty-seven degrees of sky, which is a campanile.
   Crowns of nine to seventeen metres wide at that height are boulders with sky down the gaps, which is
   what the picture called them. It is not a row of trees now: **it is a band** — `skylineBand()` in
   `src/world.js`, 596 flat quads laid round a 116 × 106 m ring, from 4 m under the ground up to a top that
   wanders at three scales (a stand at 46 m, a clump at 13, a single head at 4.5, which at 130 m is a step
   of forty-odd pixels). The far rank tops out at twelve degrees from where a person stands, so the band
   stands 24-44 m up to show its head over it, which is a ridge of jungle and not a treeline of trees.
2. **Its colour had blue over green, which is the colour of a stone.** Measured at 184 m it came out
   (104,114,117); the fog colour is bluer than any leaf and a third of that pixel is fog, so the leaf bytes
   have to start green the better of blue by a good deal. `farTree` went from bytes 66,88,84 to 80,110,84,
   and it now reads (106,115,116) at 165 m and greener (71,85,77) at 115 m, where the fog has not had it.
   The pattern behind it was too plain to be a wood — `distanceCanvas` is laid at 30 m to a repeat over the
   band, so its seven masses were 4 m blotches and its 44 speckles 70 cm ones, both worth less than a pixel
   out there, and the mass ran **11 points of spread across 77 grid points**. Nine masses and 26 speckles
   with the range opened from 105 bytes to 132: three-metre clumps of trees and a metre and a half of leaf
   glitter.
3. **A band of quads striped like a blind, until its wavelengths were longer than its steps.** The first
   one jittered its faces in and out at a six-metre wavelength and mottled its tone at four, against a step
   of three metres: every other quad got its own light, and `632-rearcorner` came out barred like a window
   blind. Long waves only now — 70 and 19 m for the faces, 48 and 15 m for the tone — and the bars are gone.
   The same trap in the same mesh, and worth writing down because it is general: **a variation the size of
   the thing it varies reads as a rhythm, not as variation.**
4. **The far rank of the belt was flat on purpose, and that was the wrong half of haze.** `jungleFar` spent
   half the pattern range of the near rank (148-236 against 78-255) to look hazed, and the browser painted
   it (67,85,57) with **11 points of spread over 55 grid points**: a smooth green hillside and not a wood
   (`pictures/tmp-far-east.png`, a narrow eye on the east belt, is nothing but flat green lumps). Haze lifts
   the floor of a range; it does not wipe the range out. 104-246 now, and the material's own bytes up from
   94,118,84 to 106,130,92 so the mean light stays where it was measured.
5. **Every crown in the belt was a balloon, and now every one is a tree.** Three things. `crumple` moved out
   of `src/garden.js` into `src/mesh.js` so the shrubs and the belt share one implementation, and the belt
   crowns are pushed 0.30 and the far rank's 0.26, which at four segments is a lump and not a dome. A
   crumpled foot can end up in the air, so each crown is now sunk until its own lowest point is half a
   metre under the garden — a crown with daylight under it is a stool. And **every crown wears its own
   tone**, 0.78-1.22 of light, the pale ones given a little more red and the dark ones a little less blue:
   written at the corners of the crown and kept through the merge (`MergeMeshes` takes
   `preserveVertexColors`, which the belt now passes `true` to), read back off the live page at 0.702-1.339
   on `jungleBelt`. A crowd of crowns all of one tone is one balloon with bumps on it.
6. **What the seventeen standing views say** (`tools/scan_old_new.js 593 666`, released v0.35.0 against
   this): nothing pure black and nothing blown anywhere; every frame 0-12 points of light **down**, because
   a hazed ridge is darker than the bright sky it stands in place of (`pool` -9, `southborder` -12);
   `in colour` down 0.4-8.5 points for the same reason — blue sky counts as colour and pale haze does not,
   and this is the honest price of the change, not a fault in it. Where the sunlit stone is weighed the
   spread came **up**: `westlawn` s37 → s73, `southborder` s52 → s77, `west` s63 → s85, and the last of the
   pale-blue lit bands that used to sit at the top of those frames went with the sky they came from.
7. **What the CPU drawing does not know, and now must be told.** The band's tone and the crowns' tones are
   vertex colours, and `tools/draw.js` has no notion of vertex colours at all: it paints `farTree` flat at
   (123,133,131) where the browser paints (106,115,116) at 165 m, and it paints both ranks one tone. Item 33
   carries that alongside the tints. The drawing does get the new geometry, and its own read of the band is
   honest about its shape: 10.2% of the west-lawn frame against the browser's 9.1%.

### Next

**Item 33, the CPU drawing's tints**, and it is now two jobs at once: the twenty-five surfaces whose fitted
bytes still describe a Villa with the varnish on, and the vertex colours the drawing cannot see at all
(the band's tone, the crowns' tones, and the lawn and deck patches it fakes through `broad`). Behind that:
the shrubs still read as a heap of cabbages at arm's length (`pictures/680-grass.png`, middle of the frame)
even crumpled — twenty lumps is still too few and too big a lump; item 30 (does a shaded bush want emissive
at all); and item 5 (nobody may wade the pool).

## What was done this session (thirty-eighth, 2026-10-16) — the grass was hanging from its tips, and the lawn was sown with black commas 🌿🙃➡️🌱

The browser was in the room again (**2009 of 2048 slots free**) and every number and picture below came out of
it. `node --check` passes on every file; `tools/feet.js` **559 meshes, 45 floors, 89 blockers, 81.8% of the
garden reachable**; `tools/planted.js` **0 clumps in built stone**; `tools/sheets.js` clean; `tools/shadows.js`
clean; `tools/standup.js` four renders, no fault; `tools/draw.js` still builds the same world.

Item 28 was the job. It was not a straw palette and it was not a floating foot: **every clump in the Villa was
upside down.**

1. **The tuft sheets wore their pattern the wrong way up.** `makeTufts` hand-writes four UVs per sheet and its
   comment swore by a half-red, half-green test that the feet belonged at `v = 1`; with that mapping the engine
   puts the canvas's own bottom row — the crown, where the leaves come out — at the *top* of the sheet, so
   **586 clumps** hung like wet mop heads, each with a flat black crown in the air and its leaves dripping down
   to the ground it was meant to grow out of. That is what item 28 had been calling "skirts of dead straw
   floating above the lawn", and `pictures/tmp-tuft-before.png`, one clump forty centimetres off, shows it in
   a way no measurement will. Feet at `v = 0`, tips at `v = 1`: grass. `tools/draw.js` cuts its own stand-in
   blades from the same squares and had the same fault written the same way round; its `isWhole` rises them from
   the ground line now, so a drawn clump and a photographed one agree.
2. **The lawn's black commas were its own bump map, and the probe is `tools/lawndark.json`.** Over the west lawn
   (`567-grass`, a patch from 60,430 to 1200,700) **11.0% of the frame sat under L55 at a mean of (28,47,7)**
   while the same patch averaged (96,118,25) — dashes the size of a hand, everywhere. Lightening the blade
   strokes in the *colour* map moved that not at all (11.0% → 12.2%), which was the useful failure: the same
   bytes are also what `bumpFromCanvas` reads as **height**, so every dark blade was a sharp ridge and every
   ridge has a back slope the 24° sun never reaches. With the strokes brought near the sward — one family,
   `rgb(74..114,106..142,48..72)` at 0.34 instead of `rgb(56..156,92..178,44..84)` at 0.55, 2100 of them
   instead of 3200, a third shorter, plus a dead straw in fifty — the same patch reads **7.6% dark, mean
   (101,124,28)**, and the ladder says five bump levels (0.25, 0.18, 0.12, 0.07, off) now paint *identical*
   lawns: the pattern's contrast was the fault and not the relief's strength, so `bumpTexture.level` stays at
   0.25 and means what it always meant.
3. **A shrub was a heap of melons.** Twelve squashed lumps at a third of the bush across, each shading as one
   clean ball from lit crown to dark foot, is the second thing a picture cannot forgive. `crumple()` in
   `src/garden.js` pushes a sphere's vertices along their own radius by four random second-lobe fields
   (`(3·(d·a)²−1)/2`) and recomputes the normals, so the skin carries no single gradient; twenty lumps at a
   quarter of the bush across now sit over a crumpled heart instead of on bare air. The potted plants got the
   same at their scale: nine lumps, crumpled, instead of five smooth ones at half the pot's width. **No number
   moves** — a box over the shrub in the west-lawn view is (79,104,20) before and after — so this one lives or
   dies in `pictures/tmp-bush-before.png` against `pictures/607-grass.png`, and the melons are gone.
4. **All seventeen standing views photographed three times** — `553`–`569` before, `570`–`586` after the grass
   and the lawn, `593`–`609` as it stands — and looked at. `node tools/scan_old_new.js 553 593`: nothing pure
   black and nothing blown anywhere, `in colour` flat to within 0.1% everywhere (the Villa got *shape*, not
   light), and the lawn views came up 1-4 points: `grass` 106 → 109, `eastlawn` 125 → 129, `rearcorner` 111 →
   114, `westlawn` 115 → 117, `southborder` 112 → 114. The `grass` view's lit band came down from s52 to s17,
   which is the commas going away, and the walk did not move an inch.
5. **What it cost.** The drawn `grass` view puts **254,209** faces toward the eye where it put 195,401 — the
   extra lumps — and `tools/fps.js` in software WebGL says **4.1 fps**, inside the 1.6-3.7 band this folder has
   always quoted. Nothing was trimmed on the strength of a number that is not there.

### Next

**Item 33, the CPU drawing's tints** — `src/surface-colours.js` still describes a Villa with the varnish on and
now also with an upside-down lawn pattern and melons for shrubs; the drawn `home` runs L130 against the
browser's L123. Behind that, the belt behind the hedge: from the `grass` camera the near rank is a row of
enormous smooth green eggs (`pictures/607-grass.png`, upper third) and the far tree line's domes are smooth in
the same way — item 34 gave them crowns and a canopy pattern but they still read as boulders at 30 m, and that
wants `tools/treeline.js` and a hard look rather than a guess. Also still open: item 30 (does a shaded bush want
emissive at all now that its diffuse is honest) and item 5 (nobody may wade the pool).

## What was done this session (thirty-seventh, 2026-10-16) — the house took off the same varnish the garden took off 🏠✨➡️🧱

The browser was in the room: `tools/headroom.js` said **2009 of 2048 slots free**, and everything below was
measured and photographed in Chromium, not drawn. `node --check` passes on every file; `tools/feet.js`
still says **45 floors, 89 blockers, 81.8% of the garden reachable** and `tools/planted.js` **0 clumps in
built stone** — nothing here is geometry, only materials. `tools/sheets.js` clean; `tools/draw.js` still
builds the same world.

Item 32 was the job and it was the whole job: in the thirty-sixth session the garden's glare came off and
the house was left standing there in its own, deliberately, so that nobody could say which of the two moved
what. `460-home` at the start of this session was an honest garden in front of a house of painted foam.

1. **Ten more surfaces through `matte()` in `src/materials.js`** — `plaster`, `plasterDark`, `teak`,
   `teakWall`, `teakFloor`, `wood`, `cloth`, `coping`, `paver`, `roof` — sheen to 0.25, brightness paid back
   as the surface's own colour. The start view, measured before / with the sheen cut alone / after the lift:

| the sunlit house (start view) | as built | sheen 0.25 | final |
| --- | --- | --- | --- |
| coping | (199,179,146) L181 | (136,127,102) L127 | **(178,165,135) L166** @1.8 |
| teakWall | (216,125, 64) L140 | (152, 81, 24) L 92 | **(185,100, 35) L113** @1.5 |
| roof | (189, 87, 52) L106 | (117, 48, 26) L 61 | **(164, 70, 38) L88** @2.1 |
| teakFloor | (220,132, 67) L145 | (137, 79, 34) L 88 | **(168, 97, 43) L108** @1.5 |
| plaster | (210,169,127) L175 | (167,133, 94) L137 | **(201,161,117) L166** @1.5 |
| plasterDark | (242,204,153) L208 | (190,157,109) L161 | **(219,183,130) L187** @1.5 |
| paver (sunlit, `west`) | (213,177,135) L182 | L111 | **L154** @2.05 |
| wood | (243,165,106) L177 | (202,126, 59) L137 | **(224,143, 75) L155** @1.5 |

   and the same ten in the shade of the north face (`rear`), which is where the argument was decided:
   plaster (122,113,94) L114 → L89 → **L124** @1.5, teakWall (55,34,10) L37 → L33 → **L41**, plasterDark
   (57,62,53) L60 → L47 → **L67**, teak (73,45,13) L49 → L41 → **L52**. One lift per surface has to serve
   both halves, and the compromise lands the sunlit face 10-38 points under what it was and the shaded face
   3-7 over. That is the shape the fault list has wanted since item 3 — this house has been too dark on its
   shaded sides and too white on its sunlit ones for six sessions.
2. **Why the odd lifts.** `cloth` only 1.35: the sunbed cushions were already sitting on the ceiling at red
   250 and needed nothing. `coping` 1.8 and `paver` 2.05: the paving is a third of the `path` frame and a
   visitor rakes it at a low angle, which is the one case where the sky's reflection was doing some honest
   work on a rough horizontal slab — at 1.5 the paving went to L133 sunlit, a sandy stone gone muddy, and at
   2.05 it sits L154 with the slab joints, the dust drifts and the damp band all readable. `roof` 2.1: at
   1.65 the clay came out L88 and read as dried mud; clay under a 24° sun is the reddest thing in the frame
   and the most-seen surface of the house, so it is paid back hardest.
3. **The interior through the front glass was checked and not touched** — `pictures/517-room.png`, the room
   camera at (0, 2.2, -6.2) looking north: the lime walls still carry the lamp's pool of light, the joinery
   reads as teak and not as orange card. `interiorPlaster`, `glass` and the three lamps stay out of this, as
   item 32 asked.
4. **All seventeen standing views retaken twice** — `518-home` … `534-backstore` at the first lifts, and the
   last set `536-home` … `552-backstore` as it now stands — and looked at, plus a drawn `home` and a
   `cover.js` read of the start view. `tools/scan_old_new.js 480 536` is the summary: nothing pure black and
   nothing blown anywhere, `in colour` up on twelve of the seventeen (westwall 72.5% → 82.2%, rear 83.9% →
   86.2%, backstore 62.3% → 65.9%), and the blow off the sunlit half — the start view put 8.2% of itself at
   L200 and above and puts 2.7% now, with *more* colour left in what remains (spread 83 → 88; the colonnade
   87 → 100). Per-surface channel spread, which is what a varnish kills: coping 112 points, teakWall 77,
   roof 48. The roof tiles show their courses now; that alone was worth the session.
5. **A trap in `tools/tint.js` worth knowing, because it ate three ladders.** A ladder line is `eval`'d as
   it stands, and a lift list built as one flat array — `for(const[n,l]of [["a",1],["b",2]])` written by
   mistake as `["a",1,"b",2]` — destructures once and silently lifts **only the first surface**. The tell is
   two steps printing byte-identical numbers across 17% of a frame. Same for a shell function that builds
   the JS: quote twice and the steps fail with `Cannot read properties of undefined`, which at least complains.
   `--fresh` per step is not optional either (item 36, fourth lesson).

**What this session did not do, and says so.** `src/surface-colours.js` still describes the Villa with the
varnish on — fifteen garden surfaces from item 33, and now ten more of the house. The check: the drawn start
view now runs **L130 against the browser's L123**, seven points over, where the same pair ran seven points
*under* before this change (item 4's list has the old per-view gaps). Item 33 carries both sets of ratios.
The CPU drawing is a stand-in for a browser that may be dead next session, and its previews are not what a
release is judged on since v0.9.0; guessing at its tints would only make a worse stand-in.

### Next

**Item 28, the standing grass**, and the westwall picture says why better than any number: `549-westwall`
shows the clumps along the plinth as a row of green cards with daylight under every one of them, so a
visitor sees a skirt of stems and not grass. Its straw palette is `tuftCanvas` in `src/textures.js`, its
height and foot in `makeTuftPlan` / `makeTufts` in `src/garden.js`, and item 20 has the rest. Measure one
clump against the dirt and the lawn beside it with `tools/cover.js` before touching anything. Behind that,
item 33 (the drawing's tints, both families) and item 30 (whether a shaded bush wants any emissive at all
now that its diffuse is honest).

## What was done this session (thirty-sixth, 2026-10-16) — the garden was wearing a varnish, and it was called grass 🌿✨➡️🌱

The master's `EDICT.md` bug again: *"The garden has no texture, and is fully translucent."* Three sessions
have now looked at that sentence and two of them pronounced it dead, because they looked for a translucent
surface and there is none. It was never translucency. **It was glare, and the glare was on the material.**

`pbr()` sets no `specularIntensity`, so every surface in the Villa carries the library's own default of 1
— which is not four per cent of a dielectric's glassiness, it is the whole of it, a varnish over rough dry
grass. Measured with `tools/tint.js` on the south border, where the garden fills half the frame:

| the sunlit garden | as it was | sheen 0.25 | and the colour back |
| --- | --- | --- | --- |
| lawn | (195,217,127) L206 | (114,133, 64) | **(137,172, 80) L158** |
| tuft | (133,153, 66) L142 | ( 75, 99, 27) | **( 87,117, 32) L105** |
| hedge | ( 29, 64, 12) L 53 | ( 24, 50,  8) | **( 27, 57,  9) L 47** |
| jungle | ( 42, 73, 29) L 63 | ( 30, 54, 18) | **( 33, 60, 19) L 51** |
| bush | ( 45, 66, 24) L 59 | ( 26, 45, 12) | ( 28, 50, 13) L 43 — soot, so lifted again: **(34,63,15) L53** |
| earth | (231,175,129) L184 | (167,119, 77) | (169,121, 78) L127 |
| boulder (`stone`) | (198,175,136) L177 | (136,120, 90) | **(154,137,104) L138** |

Read the lawn: its green used to stand 22 above its red, which is not a green at all but mint cream, a
sheet of shallow water over sand — *that* is the translucency the master saw, and it is why the mown bands
and the two swards underneath never got to be seen. At sheen 0.25 the green stands 35 above the red and
the pattern is visible, because a white wash is what the eye reads first and it was lying on top of every
leaf in the garden.

1. **`matte(mats, name, {sheen, lift})` in `src/materials.js`, and fifteen surfaces put through it:** the
   two swards (`lawn`, `tuft`) at a diffuse lift of 1.8, the leafy masses (`hedge`, `jungle`, `jungleFar`,
   `leaf`, `frond`, `stalk`) at 1.3 and the `bush` at 1.7 (released as v0.33.1: at 1.3 it came off as a
   soot-coloured hole in the picture), and `palmBark`, `earth`, `soil`, `farTree` at 1 — the
   sheen cut alone was payment enough for those. Boulders and terracotta pots went with them at 1.25:
   four cream eggs lying on the west lawn at (198,175,136) is not granite, and unglazed clay is not
   varnish either. The lift is the brightness the glare was carrying, paid back as the surface's own
   colour instead of as the sun's white.
2. **`mat.usePhysicalLightingMode = true` is gone out of `pbr()`, because it does nothing.** It is still a
   property in Babylon 9.30; switching it off on all fifteen surfaces moved **no pixel whatever** across
   an 880-point grid (`432-mode-01` against `-02`), so the line was a wish and not a setting. Everything
   here has always been shaded one way, and the knob that matters is `specularIntensity`.
3. **The dirt beds stopped being salmon paper.** `earth` was the second-brightest thing in the garden
   frames at (231,175,129); it is laterite now, (169,121,78), and it took no lift at all to get there.
4. **`tools/tint.js` was written in the interrupted part of the last session and is the tool that found
   this.** It runs a ladder of JavaScript against the Villa in a browser and prints what each named
   material came out as, `--fresh` if each step should start from the Villa as built. A colour cannot be
   reasoned at from a desk when the tone curve sits between the number and the screen; it has to be
   measured. Worth knowing that the interrupted session's "diffuse alone is only L39" was an artefact of
   its own accumulating ladder: run the ladder `--fresh`.

**What the pictures say.** All seventeen standing views retaken and looked at twice: `460-home` …
`476-backstore` at v0.33.0 and `480-home` … `496-backstore` as released in v0.33.1 (`440-456` is the same
garden before the boulders and pots went in). Nothing black, nothing blown, and past
L230 down to **0.0% of the frame on fifteen of the seventeen** (`rearup` keeps 0.4%, the pool 2.5%, where
the sky and the water are the bright things and not a surface). `495-southborder` is the one to keep an eye
on: the lawn
shows its bands and the hedge shows its leaves, and the frame as a whole came *up* from L104 to L108 while
the sunlit lawn itself came down 48 points of luminance — the shade and the leafy masses lifted as the blow
came off, which is how the colour came back without the garden going dark. `tools/feet.js` still says **45 floors, 89 blockers, 81.8%** of the
garden reachable and nothing here is solid; `tools/planted.js` **0 clumps in built stone**; `tools/sheets.js`
clean; `tools/draw.js` builds the same world. Item 33 records the one cost: the CPU drawing's tints still
describe the Villa with the varnish on.

**And one thing I did not do, on purpose.** The house is untouched. `teakWall` still paints (216,125,64),
the coping (199,179,146) and the roof (190,87,52), all of them varnished, and `460-home` now shows the
contrast: an honest garden in front of a house of painted foam. I measured the fix and left it whole for
the next session — item 32 has the ladder. A hundred fitted tints were fitted to the browser with the
varnish in them; moving the garden and the house in one session would not have told us which of the two
moved what.

### Next

One of two, in this order. **Item 32:** take the same varnish off the house — the ladder is measured and
waiting, and the start view is asking for it. **Item 28:** the standing grass, which is the last thing in
the garden that looks like nothing alive — its straw palette is in `tuftCanvas` and its height and foot in
`makeTuftPlan` in `src/garden.js`, and it wants measuring at one camera before anything is touched. Item 33
is the bookkeeping behind either: `surface-colours.js` still describes the Villa with the varnish on.

## What was done this session (thirty-fifth, 2026-10-15) — the shrubs were striped loaves and the bananas were tables 🌿🍌➡️🪴

The browser was in the room and stayed there: `tools/headroom.js` said **2008 of 2048 slots free**, no
zombies, and twenty-odd browser pictures were taken and **looked at**, which is the only way any of this
was found. `node --check` passes on every file; `tools/feet.js` **45 floors, 89 blockers, 81.8% of the
garden reachable** — unchanged, and nothing built here is solid; `tools/planted.js` **0 clumps in built
stone**; `tools/sheets.js` clean, with one complaint of mine closed; `tools/draw.js` builds the same world
and knows both new surfaces.

The master's `EDICT.md` bug — "the garden has no texture, and is fully translucent" — was looked at again
from the start view, the pool, the west lawn and the south border: the lawn wears `grassCanvas`, its mown
bands and its broad patches, it is opaque, and `tools/cover.js` names no see-through ground anywhere. What
*was* wrong in the garden, and was plain in every picture, was what grows in it.

1. **A shrub was four bare spheres wearing the hedge's leaf pattern, and it was a green loaf striped like
   a watermelon.** Two faults at once: the hedge's pattern is a metre and a tenth to a repeat, so on a bush
   a metre across there is one clump and a half of it, and wrapped round a sphere that reads as bands; and
   four spheres make a smooth round outline, which is the thing that gives a model bush away whatever you
   paint on it. A bush is **twelve squashed lumps** now — a heart and eleven laid in a golden-angle spiral
   over the crown and down the flanks — wearing a pattern of its own, `bushCanvas`: **420 small leaves laid
   over one another at 44 cm of bush to a repeat** (thumb-width, the size a clipped hedge's leaves are),
   with the same canvas sent back as relief at level 0.3. Two things were learned the hard way: the relief
   at 0.7 makes a **cabbage** and not a bush, and cards of leaves stuck on the outside of a ball float off
   the skin like a dandelion gone to seed — that was the first attempt, and it is worse than the fault.
2. **A banana plant was five thin sticks with a flat green disc nailed to the top of each** — a row of
   little tables. It is a clump of **two or three pseudostems** of different ages now, in a pattern of its
   own (`stalkCanvas`: green sheaths laid one beside the next up the stem, with the maroon flush, 0.5 m to
   a repeat — the palm's bark made every clump three palm saplings), and each crown carries **nine leaves on
   stalks**, old ones out and drooping, young ones spear-ing up the middle. Each leaf is **four cards laid
   end to end and hinged** — stalk, broad blade, narrower blade, tip — each hinge turned a little further
   down, the cards overlapping a fifth so they read as one blade; and every leaf is **rolled 26-49° on its
   stalk**, which is the number that matters: laid flat a banana leaf is invisible from a person's height
   and reads as a line drawn in the air. A maroon bud hangs under each tall crown.
3. **The potted plants were the same flat-disc fault** — seven leaves laid nearly level, which read as a
   green table top on a pot — and are now a little bush of the same leaf-skinned lumps, wider than the rim.
   `tools/roomprobe.json`, which switches the room's plant out to measure what it is worth, had to be told
   the mesh's new name.
4. **Two new surfaces, both read by the CPU drawing.** `bush` and `stalk` in `src/surface-colours.js`. The
   bush tint is measured and not fitted: a sunlit bush on the start view is **(86,117,25)** where the hedge
   beside it is (134,182,51) — a bush is a darker green than a hedge, because a hedge shows its young outer
   leaf to the sky and a bush shows the shade inside it — and the tint keeps the same fourth-part-of-the-
   sunlit-byte ratio the hedge's line keeps. Its `glow` is what the emissive *adds* once the leaf pattern is
   multiplied in — (0.001, 0.004, 0) from a colour of (0.02, 0.035, 0.012) — which is why
   `tools/sheets.js` no longer complains about it, and why `hedge` and `jungle` still do (fault 23).
5. **`tools/planted.js` was crying wolf, and that is worth writing down because the tool is the proof.** It
   read each plant's place off `mesh.position`, but a plant folded into one mesh carries its place in its
   geometry and leaves `position` at the origin, so it reported a shrub and a banana standing at x=0, z=0
   — the middle of the teak terrace, the one place a shrub cannot grow. It reads the middle of each mesh's
   own world box now, which is where a plant stands whether it was built as nine meshes or one.
6. **The plants are merged, which nobody asked for and which is a gift.** A bush is one draw and a banana
   two instead of ten, so the browser went from **766 meshes to 560**. What that costs is triangles: the
   drawn `grass` view put 124,069 faces toward the eye before and **195,401** now, which is the leaf cards.
   Frame rate could not be told from its own noise — 2.2 and 2.3 fps against the thirty-fourth session's
   1.6-3.7 band — so nothing was merged or un-merged on the strength of a number that is not there.

**What the pictures said.** All seventeen standing views re-taken (`pictures/319-…` to `pictures/335-…`, and
the plant views again at `317`-`318` before the pots were fixed). Nothing black, nothing blown, in any of
them. `home`: bush 1.9% of the frame at (86,117,25), leaf 1% at (122,172,63), and the two planted pots by
the steps read as clipped bushes instead of table tops. `west`, `grass`, `southborder`, `westlawn`, `pool`
all show bushes with a ragged edge and leaf in them, and banana clumps you can tell from a palm. Three
things a picture shows that are still wrong are written into the fault list below: the **tufts** along the
stone (they read as skirts of dead straw floating above the lawn), the **lawn's mint tone** at a grazing
angle, and the fact that a bush in shade is a good deal darker than the browser's own sunlit byte would
lead the drawing to expect.

For whoever takes those next, the numbers `tools/cover.js` gave on the `southborder` camera (step 24, so
1590 samples): tuft **19.6% at (134,153,69)**, its brightest pixel (228,244,157) — near the ceiling, which
is the straw read — and its darkest (17,40,2); lawn 13.7% at (191,214,123); hedge 10.3% at (29,63,13);
bush 2.1% at (55,74,30); leaf 3.4% at (38,101,25); stalk 0.6% at (45,56,15). On the start view the same
spread is lawn (169,201,83) and tuft (75,89,28) — so the clumps are dark and quiet where the sun is in
front of them and blown and pale where it is behind them, and the straw is half the top end of the canvas
and half the tone curve's ceiling.

## What was done this session (thirty-fourth, 2026-10-15) — the jungle behind the hedge was a row of green eggs 🌳🥚➡️🌴

The browser was in the room and, for the first time in this folder, so were **eyes**: the master's
`EDICT.md` says vision is on, so every one of the thirty-odd browser pictures below was *looked at*, and
that is how this fault was found at all. `tools/headroom.js` said **2009 of 2048 slots free** and it never
dropped. `node --check` passes on every file; `tools/feet.js` **45 floors, 89 blockers, 81.8% of the garden
reachable**, unchanged — none of this is solid and none of it casts a shadow; `tools/planted.js` 0 clumps
rooted in built stone; `tools/sheets.js` has the belt's glow honest for the first time.

The master's bug — "the garden has no texture, and is fully translucent" — was looked at again from the
start view, from the lawn, from the pool and from the south border: the lawn has its pattern and its
mown bands, it is opaque, and `tools/cover.js` names no see-through ground. **What has no texture, and
was the thing a picture actually showed, was everything beyond the hedge**: three ranks of smooth green
domes, and that is what this session fixed.

1. **The two ranks of the belt are built in clumps now, and the crowns are small.** Each ring point used
   to carry one ball: five to eleven metres across and up to seventeen tall, standing three metres behind
   a two-metre hedge. At forty metres one of those is a fifth of the frame, it lights one flank, the far
   side of it goes to soot across one hard line, and every one of them has that line in the same place —
   which is the read of a balloon and not of a tree. Each ring point now carries a **clump**: one big
   crown and three to five lesser ones crowded against it at a quarter to nine-tenths of its height,
   four and a half to eight metres across in the near rank (64 clumps where there were 66 balls) and six
   to eleven in the far one (84 clumps where there were 76). Crowns are **domes** — the height is
   0.55-0.75 of the width, so the sun has a top to light instead of a flank — and the near rank's tops
   are now mostly 4-10 m instead of up to 17 m. `tools/treeline.js` (new, below) reads the skyline: on
   the west view the tree line now **steps more than eight pixels 65 times** across the frame where it
   stepped 47, with a 198-pixel step against 146, and `home` went from 67 steps to 83.
2. **The far tree line shrank to its size.** It had 52 crowns of **sixteen to thirty-four metres** across
   at 110-150 m, and at those sizes the last smooth thing on the horizon was this: the line read as a
   ridge of pale domes, and once the belt in front of it got lower the hills behind it came out at 7.2%
   of the west view while the tree line itself did nothing. It is **96 crowns of nine to seventeen
   metres**, their heights wandering with `lump` so the band has tall stands and short ones, and turned
   to a random quarter so no two wear their pattern the same way. farTree in the browser went from 3.8%
   of the west view at (103,115,115) to **4.5% at (104,116,117)**: same colour, more of it, one tenth the
   size of each piece of it.
3. **The belt got a canopy pattern of its own, laid at a size that survives the distance.** It was
   wearing the boundary hedge's leaf canvas, which is a metre and a bit to a repeat and is the right size
   for a hedge twenty metres off. So `canopyCanvas` in `src/textures.js` was painted: three scales of
   grey and no leaf in it — the hollows between trees, one tree's head, and the glitter of leaf mass —
   and it is laid at **2.4 m to a repeat on the near rank and 4 m on the far one**. The number that
   matters is 2.4 and not "once to a crown": the first try laid one repeat to a crown, the way the far
   tree line has it, and `tools/compare.js` said the picture with the canvas's hollows deepened was the
   **same picture to 0.0 of a channel** — stretched to a fifth of its own size a pattern has nothing left
   to show. The size that works was found by painting the near rank red and running its pattern eight
   times to a crown, live, with `tools/cover.js --js`.
4. **The haze ladder is a ladder now.** `mats.jungle` and `mats.jungleFar` are painted through `paint`
   like the far line always was, and their colours were fitted on the browser and not on the drawing, so
   each step is lighter, greener-to-bluer and flatter than the one in front of it — which is what haze
   does: it lifts the darks *and* it takes the blue in, and the far rank's canvas is painted with a
   third less range of its own for the second of those. Measured with `tools/cover.js` on the same west
   camera, luminance and the red-minus-blue that says how green a thing is: hedge (72,111,33) L96 / +39,
   near rank (72,103,52) L85 / +20 at 41 m, far rank **(107,120,96) L112 / +11** at 84 m, tree line
   (104,116,117) L110 / −13 at 127 m. The far rank used to be (94,114,76) / +18: a green as strong as the
   hedge's, standing twice as far off. And `tools/sheets.js` no longer complains about the belt: its
   emissives are written as the light they actually add, so the drawing's glow and the browser's now cost
   the same. Only `hedge` is left in that complaint.

**What the seven controls did.** Nothing went black and nothing blew out in any of the seventeen views.
The distance took light everywhere it is seen, and the whole frame's mean went: `home` L137 → L137 (the
house blocks the horizon), `west` L129 → L133, `westlawn` L121 → L127, `pool` L130 → L141, `sala`
L119 → L125, `southborder` L104 → L125, `rear` L78 → L78, `backstore` L103 → L101. "In colour" fell by
2-7 points on the views whose horizon is big (`pool` 93.0% → 83.1%), and that is the haze and not a loss:
haze *is* a colour going towards the sky's, and the pixels that fell out of that count are the distant
crowns, which are 40-130 m off and were the greenest things in the frame.

**What it cost.** Meshes unchanged — **711** in the drawing, 766 in the browser, because every rank is
folded into one mesh. Triangles turned toward the eye on the west view went 93,425 → **126,229**, and to
pay some of it back the crowns are built on **four** segments and not six, which is the cheapest place in
the Villa to buy a lump. `tools/fps.js` could not tell the two apart through its own noise: three runs,
released v0.30.0 against this, gave 4.7/3.7, 1.6/3.6 and 2.0/2.1 fps, and the tool's own note says to read
it as a band.

### Tools found on the way

- **`node tools/treeline.js <picture.png> [--print]`** — reads the skyline: how high up the frame the
  trees come, how many times their top edge steps, and where the sky gets down between the crowns. A
  wood and a fence differ here and nothing else in this folder could say so. `--print` draws the edge as
  a map of `#`.
- **`node tools/crop.js <in.png> <out.png> <x> <y> <w> <h> [--scale N]`** — cuts a part of a picture out
  and can blow it up, which is how you look at one crown's edge instead of at a whole frame shrunk down.
- **`node tools/ask.js "<javascript with a return>"`** — one question to the Villa standing in a
  browser, answered as text. This is how it was proved that the belt's pattern was live (the mesh has
  36,120 vertices, its UVs run 0-1 and its material's pattern is `jungleCanopy`) after a CPU-side guess
  said otherwise.

### Next

- **The crowns are still domes and the terminator is still theirs.** Lower, smaller, hazier and patterned,
  and at 40 m they read as a wood's edge; at 10-15 m, from the south border and the lawn, each one is
  still a smooth lit cap over a dark flank. The next step is not another pattern: it is **per-crown
  colour**, so one crown sits a fifth darker than its neighbour and the mass breaks up, and after that
  leaf cards on the near rank the way the palms have fronds. Both are new work, and `tools/treeline.js`
  plus a close camera are the measures for them.
- **`mats.jungle` and `mats.jungleFar` have no bump**, so the pattern is colour only and catches no
  light. `hedge` has one and it is worth four points to the hedge (see the note in `materials.js`).
- Item 23 of the fault list is now only about the **hedge**: the drawing paints it a glow of
  (0.050,0.075,0.030) where its emissive over its own leaf adds (0.003,0.011,0.001). The two jungle ranks
  came out of that complaint by being written as added light.

## What was done this session (thirty-third, 2026-10-15) — the store room's own face got a band of lit glass 🪟🕯️

The browser was in the room: `tools/headroom.js` said **2009 of 2048 slots free**, and every number below
was photographed and not hoped for. `node --check` passes on every file; `tools/standup.js` stands up in
0.6 s at **764 meshes, 10 lights, 46 materials, 53 textures**, 4 frames clean; `tools/shadows.js` clean;
`tools/feet.js` **45 floors, 89 blockers, 81.8% of the garden reachable** from the start, no stumbles.

1. **Item 17's last wish is paid: the store room's face has a window.** The store's north face at
   z = -13.85 was 3.2 x 3.4 m of bare cement, and it is the one big flat surface left on the Villa. First
   the measurement item 17 never had: a north face **never sees this sun** (24° high, out of the south), so
   the whole face lives on sky fill and bounce and reads **L39-60** — `tools/storewin.json` says L39 for the
   face and L93 for the main back wall beside it, 4 cm away in the world. Painting that mass any brighter
   would be a lie about the sun; the only light that can honestly live there is a light *inside* the room.
   So: a **band window** — 2.0 x 0.38 m at x 4.6-6.6, y 2.92-3.30, high under the store's lid, in the middle
   of that face — with teak boards for the sill, head, two jambs and one 8 cm mullion, two panes of the
   Villa's own glass sitting 6 cm deep in the reveal, and a 6 cm ledge on the sill facing the lawn, which
   is what makes it a window with a shelf rather than a slot. Nothing about it is decorative: the room
   behind it is 2.84 m high and the band is 13% of that height, which is what a store room's high window
   is, and it lights nothing you can stand in — nobody can walk into that room.
2. **A lamp on the shelf, and one thing learned about glass.** Behind the east pane, 0.55 m below the band,
   a small timber box with an `interiorGlow` plate and a 5.5-point point light of 5.5 m range, joined to
   `scene.roomLamps` so `?room=` and the night button dial it with the rest of the house. My first attempt
   at filling the band was a **cool sky-wash light**, and it painted the panes grey-blue — (56,60,59) and
   (65,76,66), fog in a frame. Deleted. A window reads as a room only when what shines out of it is the
   warm colour of the room's own surfaces; the lamp alone does it: **panes (128,111,84) L112 and
   (178,153,117) L155 against the wall's L80-93**, warm, with a spread of 48-61 of 255 across the two
   panes so the light is coming from one place and not from the whole sky. With the lamp off the panes
   fall to L95 and L138 (the glow box carries what is left); with the glass taken out they read L116 and
   L159 — so the glass costs about four points and cools the room a little, which is the same bill the
   front of glass pays (item 17's own finding).
3. **The store room had no ceiling.** Its lining had a floor, four walls and no top, because until now
   nothing could be looked at through it: rays going up through the new band would have left the room and
   hit the bare underside of the store's roof lid. A lining ceiling went in, 0.16 m below the lid and flush
   with the tops of the side linings, and the lining's north wall is now cut to the same opening as the
   shell's so the reveal reads all the way through.
4. **The wall-with-holes helper moved home.** `wallNorthWithDoor` in `src/villa.js` already built a wall in
   pieces around a hole; it is `zWallWithOpenings()` in `src/mesh.js` now, with a `thickness` argument, and
   both the back wall's doorway and the store's band are cut by the same code. This is what item 17's
   second half asked for, and it cost nothing else: `tools/shadows.js` is clean and reachable ground is
   unchanged. The walk does go from 44 floors and 87 blockers to **45 and 89**: the new floor and two of the
   new blockers are the window's own sill and head boards, which `src/ground.js` reads as standing surfaces
   wherever they are, and at 2.9 m up over a bare cement face nobody can reach them.
5. **A seventeenth standing camera, because the sixteen could not see the thing.** From `rear`, 5 m off the
   north face, every point of the store's face projects outside the right edge of the picture — the picks
   come back OUT OF FRAME for x = 5.1 and everything east of it. So `backstore`
   (`5.6,1.6,-19,0,-0.14`) is in `tools/cameras.txt`, and the set is now **177-home … 193-backstore**. The
   band reads **L110 over a face at L39** there, which is the whole point of the change.

### What the pictures say

- **Nothing moved in the sixteen views that already existed.** `node tools/scan_old_new.js 130 177` prints
  **+0 luminance on every one of the sixteen**, and `tools/compare.js` puts the frame gap at 0.0-0.4 of 255
  (film grain). From the front the store's doorway through the glass went L131 → **L137** and the pane
  beside it L112 → L117: the room behind the front glass is a shade warmer and that is all the visitor
  crossing the lawn is offered. This is an honest description of the change, not a sales pitch: it is a
  change to the back of the house, seen from the back of the house.
- **Against the released v0.29.0 at the same new camera** (`pictures/1300-v029-backstore.png` against
  `pictures/193-backstore.png`) `tools/diffgrid.js` puts 24,951 of 921,600 pixels — 2.7% of the frame —
  over 40 summed channels, and every heavy one of them is the band and its boards, in a rectangle where
  the band is. Nothing else in the frame moved but grain.
- One thing worth knowing, found by accident: with `?room=0` the store's own lining falls 75-107 points and
  the bedroom's wall sharing its east partition only 15-20, so the store's lamps are doing the work in
  that corner. But a point light throws no shadow: **a store lamp wound past a few points will light the
   bedroom through 0.1 m of wall**, which is a fault, not a mood. `?room=` is the dial and 5.5 is where it
   sits.

### Next

- Item 14 is corrected below and is now the cheapest visible thing left: **`mats.teakWall` has no bump at
  all** and 31 meshes wear it — the front's pier, sill, head, panels and mullions, the back band, the
  alcove, the sala's table, and the store's new joinery. The sunlit teak in the colonnade reads
  (208,120,63), so there is headroom under the ceiling at 248 for a light bump where the sunlit deck has
  none.
- The CPU drawing runs **26 luminance hot on the store's face** (`drawn-backstore` L129 against the
  browser's L103) for the same reason as item 4: `shade()` has no term for a wall the sun never reaches,
  so a north face is drawn as though it were facing the sun. Noted as item 27. Do not re-colour the Villa
  on the drawing's say-so here.

## What was done this session (thirty-second, 2026-10-15) — the back wall got a doorway, and there is a lit room behind it 🚪🏮🕯️

A browser the whole session (`headroom.js`: 2009 of 2048 free, nothing left behind). This is the
remainder of fault 17, which the thirty-first session named as the biggest thing left in the start view:
10.8 m of glass at (116,90,63) with a room behind it that you look *at* and never *into*.

1. **The service block is a room now.** Behind the east end of the living hall stood `serviceBlock`: a
   solid lump of `plasterDark`, poking 0.3 m into the room, that had never had a use since fault 17 took
   its outdoor lamp away. It is `store` now — x 4.0 to 7.2, z -13.85 to -11.9, y 0.5 to 3.9 — and **its
   outside is the box that block always was, to the centimetre**, which is why the rear elevation did not
   have to be re-learned: `pictures/979-rear.png` against `pictures/1113-rear.png`, cell for cell the same
   (L123 on the back wall, nothing black, nothing blown). Inside, `storeIn` is 2.5 x 1.725 m of floor and
   2.84 m of plaster — a store room, which is what a villa behind the kitchen wall has.
2. **The doorway is a hole, not a drawing of one.** `zWallWithOpenings()` builds an east–west wall in
   pieces round a rectangle: `storeDoor` is x 4.9 to 6.3 (1.4 m) with its head at 2.85, cut through the
   back wall, and the room's 5 cm inner lining is cut the same way so the opening has a reveal you can
   see the thickness of. The wall pieces are `wallBackPart0..3` and the lintel; the room's lining is
   built with the same helper.
3. **What is in it, and where the lamp hangs mattered more than anything else in it.** A jar, a crate, a
   shelf with a bowl and a small pot, a teak floor, three plaster linings — and first a wall case high on
   the north plaster, which was wrong: measured through the doorway it lit a patch of plaster at L180 and
   left the bottom of the opening at L87, *darker* than the glass beside it, because a point light here
   falls as 1/(d²+1) and a case on the wall is 2 m from everything that matters. It is a **lantern hung in
   the middle of the room** now — a rod off the ceiling, a 0.3 m glow box at y 2.05, one point light of
   intensity 4.2 and range 6 kept to the store's own meshes (`includedOnlyMeshes`, the same discipline as
   the room's four and the pool's four). Every surface in the room is then between 0.4 m and 2.2 m of it.
4. **What it reads, through the glass, in Chromium.** From where a visitor starts the lit plaster comes out
   **L146 to L157** and the lantern itself **L188**, against the room's back plaster at L82 and the lit
   alcove at L112 — the brightest thing behind the glass, which is the point — and still under the sunlit
   coping at L211, so the front is not a shop window. The jar and crate come out at L73, dark against the
   lit wall, which is how a room with things in it looks. From `frontcorner` the wall by the lamp reads
   L179; from `colonnade` the opening is a lit strip and its middle reads (230,170,118) where the same
   pixels with the store's inside switched off read (117,111,92). `tools/doorpick.json` and
   `tools/doorpick2.json` hold those probes as places in metres, not as pixels.
5. **Honest about size: at the two standing cameras this is a glimpse, not a subject.** The start view
   moved **0.2 of a channel** over the frame and the colonnade 0.7 — `tools/compare.js` would report that
   as "nothing happened". The lit part of the doorway is 25 x 40 px at x 480..505, y 275..315 in the start
   view. That is why **`tools/diffgrid.js`** was written: it counts, per cell of a grid, how many pixels
   moved by more than a threshold, so a change of 0.1% of the frame shows as a shape (and not as grain).
   Set the store's contents against the same cameras with `tools/doorwhere.json`: `storegone` switches the
   room's inside off, and the grid draws where it was being seen.
6. **What had to be wired so the light stayed honest.** The store's meshes go into `scene.roomMeshes`
   beside the room's, so none of the pool's four lamps leaks into either room through the doorway; they go
   through `shutOutSkyFill()` like the room, or the plaster would be lit by a sky it cannot see through its
   own roof; and the garden's north fringe was split in two so the new `storePlinth` stands on plinth and
   not the lawn hanging under it.
7. **The walk cost nothing and gained a room it cannot enter: 749 meshes, 44 floors, 87 blockers** (was
   730/41/83). `tools/feet.js` still says "the room behind the glass: kept off", the lawn behind the villa
   is still walkable, and the store's floor registers as a step at 0.5 m but sits behind the invisible
   `terraceBack` blocker at z = -12.3, so a visitor on the back lawn is stopped 1.5 m short of it. The
   store's meshes carry sun + one lamp; the room's carry sun + five. `tools/roomprobe.json` with the store
   built still drops the room to L55 when the room's lamps go off: no leak through the doorway.

**What the next session should take up.** The store is a room you look at, not into: nobody can walk
through that doorway, and the one face of it that shows on the rear elevation — 3.2 x 3.4 m of
`plasterDark` at L123 — is a blank. A small high window there would break it and give the room daylight,
and the store could then carry a second, cooler light at the pane; it needs `zWallWithOpenings()` on the
store's north wall and a decision about what a lit pane means. Behind that: the grass clumps that read as
three crossed cards at 2 m (fault 20, and it wants a measure first), and fault 4's ground-bounce term in
`tools/draw.js`.

## What was done this session (thirty-first, 2026-10-15) — the court gave 111 m² of its stone back to the lawn 🌿🟫📐

A browser the whole session (`headroom.js`: 2009 of 2048 free, nothing left behind). This is fault 25:
the court was still mostly stone after the borders went in, and the apron of paving outside them was wider
than anything a person needs to walk on.

1. **The fault, measured.** Photographed straight down from 26 m the paving was **38% of the frame and the
   grass 24%** (`pictures/976-court-before.png`, read by `tools/cover.js`): a 30 m apron of cut stone
   round a 10 x 5 m pool. The two outer edges stood at x = ±15 for no reason anyone could name.
2. **They stand at x = ±11.9 now**, both sides, the whole length of the court: **111.3 m² of stone gone**
   (the paved ground measured in rects goes from 486.2 m² to 374.9 m², and 24.8 m² of what was left is
   the dirt of the borders). The same camera reads **paver 25.9%, lawn 34.4%, tuft 3.8%**
   (`pictures/1016-court-overhead.png`) — the water now lies in a garden with stone around it instead of
   the stone lying around it. There is still 4.15 m of free stone outside each border: room to lay a
   sunbed and walk behind it, and a metre of stone between the coping and the dirt, so the pool can still
   be walked all the way round.
3. **What the standing frames say, honestly.** Sixteen views before (`960`–`975`) and after
   (`1000`–`1015`): **luminance the same to a point on fifteen of sixteen** (salaroof −2), **in colour up
   or flat on all sixteen** and never down, nothing black anywhere, nothing blown. Where stone turned to
   grass the frame keeps more colour: westlawn's lit band `s87 → s96` and its frame 92.3% → 92.7% in
   colour, salaroof `s82 → s94`, sala 96.3% → 96.4%. And the honest half: **the start view did not move
   at all** (L136, 97.2%, cell for cell the same) — a standing frame reaches the ground only 4.2 m ahead,
   and the edges that changed are 6 to 10 m off that line. This is the same lesson fault 21 wrote down: the
   court's outer edge is not where a visitor looks. It is still the right change — the plan was wrong, and
   the lawn views and any view from above say so — but nobody should be told the start view got greener.
   Turning west on the west deck, which is where the change lands closest, `995-oldwestedge` against
   `994-newwestedge` moves 3.0 of a channel over the frame: where it was shadow at (40,71,6) it is now
   sunlit grass at (136,156,45).
4. **Five things had to move with the edge, and one of them was standing on nothing.** The railing that
   edges the west deck's south side came from 8 posts over 8.9 m to 6 over 5.7 m — and it was 0.1 m
   *beyond* the paving (z 15.9, the stone's edge at 15.8), so every post hung with its foot a full 14 cm
   above the grass; it stands at z = 15.7 now, on the stone, and `ground.heightAt` says 0.140 under all
   three sampled posts. The two outer lamps came in from x = ±13.2 to ±11.1 so they are still on stone
   and not sunk in grass. The west sunbed came from x = -11.3 to -10.9: at -11.3 there was 0.27 m of stone
   between its frame and the kerb, grass past that, and no way behind it; now there is 0.67 m to walk.
   All six grass fringes that had been
   laid on the old line now read the edge from the plan instead of repeating a number, and two new
   scatters lay grass through the fresh strips.
5. **The plan of the court is one file now: `src/court.js`** — `courtEdge`, `pavedGround`, `courtBeds`,
   `bedTop`, `bedTone`. It was worth making a file for it the moment four readers disagreed about where
   the stone was: `src/paving.js` was averaging the stone's tone over a rectangle out to x = ±15.2, three
   metres of which is lawn now, and the fringes were laid to a number the paving had outgrown. The tone is
   re-measured over the real paved rects: mean exactly **1.0000** per channel over the deck, range
   0.856–1.293.
6. **Fault 24, the drawing not knowing the borders' tone: wired, and worth less than expected.**
   `bedTone` answers one outside the beds, which is what lets `mats.earth` carry the laterite at the foot
   of the house untouched, and `broad: "bed"` puts it in `tools/draw.js`. Measured on the `west` drawing:
   26,922 pixels move — 2.9% of the frame, the dirt's own share — by at most 6 summed channels and 1.9 on
   average, because the tone itself is only ±3%. Small fix, small worth, but the two renderers now agree.
7. **Fault 26, the unmerged shrubs, is measured and retired instead of done.** `tools/fps.js` at 1280 x
   720: **v0.24.0 with 669 meshes draws 4.7 fps, v0.27.0 with 732 draws 4.8, and this Villa with 730
   draws 4.8.** Mesh count is not what binds this renderer, so folding the 136 shrub spheres and the 100
   banana parts into one mesh each would buy nothing measurable here and would cost the picking tools
   their per-part names. Written down rather than built.
8. **Fault 14, the teak bump at 0.55, is settled by looking at who wears it.** `mats.teak`, the one with
   the 0.55 bump, is worn by exactly one mesh in the Villa: the back door. The front posts, the mullions
   and the eave boards wear `mats.teakWall`, which has **no bump map at all**, and the two floors wear
   `mats.teakFloor` at the measured 0.3. So the knob is not costing the uprights anything; what is left to
   wonder about is the opposite thing — that the uprights have no board relief at all.
9. **The walk is the walk**: 730 meshes, 41 floors, 83 blockers, **81.8% of the garden reachable** from
   the start (was 81.7% — the lawn is bigger and better connected), and the ten stumbles `feet.js` names
   are byte for byte the ten it named before (checked by putting `courtEdge` back to 14.995 and diffing
   the report). `planted.js` finds 0 plants in built stone and `tuftfoot.js` 0 sheets on it: the grass
   that was laid along the new edge is in soil. The sala's east base, which used to stand in paving,
   stands in grass now, its plaster going down to the lawn; it is still climbed only at its steps.

**What the next session should take up.** The start view is the Villa's front door and it has not been
improved in three sessions: the glass is 8.9% of it at (116,90,63) and the room behind it is a room you
look *at*. Fault 17's remainder — a door in the back wall with a lit passage behind it — is the biggest
thing left in that frame. Behind it: the grass clumps that read as three crossed cards at 2 m (fault 20,
and it wants a measure first), and fault 4's ground-bounce term in `tools/draw.js`.

## What was done this session (thirtieth, 2026-10-15) — the court was 440 m² of cut stone, and two borders of dirt are cut out of it 🪴🟫🌴

A browser the whole session (`headroom.js`: 2009 of 2048 free). This is fault 21's leftover done: the
garden brought *inside* the pool court, instead of fringed along edges the frame cannot reach.

1. **The fault, measured.** Photographed straight down from 26 m (`pictures/tmp-court-over.png`) the
   court was stone from x = -15 to -5.4 and from 5.4 to 15 the whole way from the terrace to z = 15.8:
   about two thirds of that frame's width was paving and one third garden, for a pool that is 10 x 5 m.
   And the paving was not only large, it was the only thing there: from the west camera the ground in the
   frame was 22.4% paving and 5.2% coping against 0.9% lawn.
2. **Three beds are now cut out of that stone** — `courtBeds` in `src/world.js`: one along each long side
   of the water, x ±(6.05…7.75), and the east one split in two by a stone landing so that you come down
   off the sala's steps onto stone and not into a bed. The west bed is 1.70 m by 8.30 m = 14.1 m² and the
   east beds 6.3 m² and 4.4 m²: **24.8 m² of stone given back**, and the side decks go from 9.55 m wide to
   the same 9.55 minus a border, because the beds are holes in the paving and not something laid on it.
   A metre of stone is kept between the coping and the dirt (that metre plus the 0.42 m coping is the walk
   all round the pool).
   The paving on each side is now built as *the pieces that are left*: `stoneLeft()` answers a deck
   rectangle and its holes with a band north of all of them, a band south, a strip down each side and one
   band in every gap. The deck was 4 slabs and is 11, and because `groundUVs` and `paverTone` are both
   asked in ground metres the slab pattern and the dust and damp run straight across the joins.
3. **The dirt stands 4.5 cm above the lawn and 9.5 cm under the top of the stone**, so the paving's cut
   edge shows as a curb all the way round each bed (`bedTop` in world.js, `slab()` + `mats.earth` laid
   0.7 m to a repeat + `tintFromGround` with a `bedTone` of ±10% red). That height was not guessed:
   `planted.js` and `tuftfoot.js` call anything above 0.05 built stone, so a bed at 6 cm would have
   refused its own shrubs and grass, and both tools now say nought against 218 plant parts and 1635
   sheets.
4. **What grows in them**: eight shrubs, one banana at the outer end of each side, and grass at the seam
   where the dirt meets its cut stone edge and through the planting — fringe on both long edges (0.75 m
   apart, 0.26 m in from the stone) plus a scatter of about one clump per square metre, all standing at
   `bedTop`. `makeShrub`, `makeBanana` and `makeLamp` had to be given a `y` for the ground they stand on,
   which they did not have: they all assumed the 0.14 paving.
5. **Two faults found on the way, both of which a picture would have shown but nothing in the code
   could.** (a) **Two garden lamps were standing on the teak terrace.** Their spots were (±6.4, −0.6),
   and the terrace's face is at z = 0.7 with its boards reaching that far: both posts came up through the
   deck a visitor walks on. They now stand at the head of each border, in the dirt, at (±6.9, 1.6).
   (b) **A pot walled the sala in.** The third pot went onto the stone landing in front of the sala's
   steps, and its invisible wall — which is its size plus the visitor's 0.32 m girth — closed the gap
   between the sala's two west face-blocks: `feet.js` went to 81.4% reachable and named the sala's floor
   as ground you cannot get to. Moved to the sala's south-west corner, it is 81.7% again and names no
   unreachable ground anywhere in the court. The three pots now flank the walkway that comes down from the
   terrace steps (x ±4.6) instead of crowding the corner where the east border is.
6. **What a browser paints, the released v0.26.0 against now, same cameras (`tools/cover.js` takes a
   url, and a release is a walkable url).** From the west camera: paving 22.4% → **5.7%**, coping 5.2% →
   1.9%, and in their place hedge 5.2% → **16.8%**, banana leaf 0.2% → 5.2%, grass 2.1% → 4.7% and the
   dirt itself 0 → **2.4%** at (172,112,63) with 42,26,18 of spread in it. The shrubs' own colour spread
   in that frame went from 17,18,7 to 54,60,22 — the same leaves with more range in them. From the pool
   camera (down from the terrace): paving 10.8% → 8.7%, hedge 7.3% → 8.0%, leaf 0 → 0.9%, and the water
   keeps every one of its 25.7%. From where a visitor starts: paving 3.1% → 1.0%, hedge 2.1% → 4.0%,
   grass 0.2% → 1.4% — and no more, for the reason in fault 21: the frame's ground is the water and the
   coping, and the east border stands at the frame's left edge at 8…11 m.
7. **All sixteen standing views re-photographed** (`pictures/940-home` … `955-southborder`; `node
   tools/scan_old_new.js 766 940` prints the table). Nothing anywhere is pure black or blown, colour is
   up or flat on all sixteen (west 90.8 → 92.3, sala 95.3 → 96.3), and light is down only where stone left:
   west −10, sala −4, pool −2, home/path/westlawn/salaroof −1, the rest 0. The west view is the whole
   argument in one number: 10 points of pale stone traded for 1.5 points of colour and 24% of hedge.
8. **The CPU drawing sees it too, and does not lie about it** — `earth` is 3.2% of its west frame against
   the browser's 2.4%, nothing came out black and nothing blew. Its dirt is (83,52,32) against Chromium's
   (172,112,63): 58 points of light under, which is the same shortfall it has on every sunlit surface
   (the paving in the same frame is 56 under) and is fault 4, not a new one. What is new and is written up
   as fault 24: the drawing does not multiply `bedTone` in, and `tools/fps.js` is new (see 10).
9. **The walk is the walk**: 732 meshes (from 669), and the ground now answers for 40 floors where it had
   30 — the deck is 11 pieces instead of 4 and the beds are 3 more — against the same 83 blockers.
   81.7% of the garden is reachable from the start, no unreachable ground is named anywhere in the court,
   and `standup.js` / `feet.js` / `shadows.js` / `planted.js` / `tuftfoot.js` / `sheets.js` are all clean.
10. **`tools/fps.js` is new**, because the notes have been quoting a frame rate since the twelfth session
    without anything in this folder being able to measure one. Same browser, same 1280 x 720, nine seconds
    of drawing, one reading: v0.26.0 **5.0 fps**, this **4.5–4.8 fps** over three runs. The borders cost
    about half a frame a
    second in software WebGL, and the reason is mesh count: the shrubs are four spheres each and the
    bananas ten, none of them merged, so eight shrubs and two plants are 52 of the 63 new meshes. Merging
    each shrub into one mesh the way a palm's crown already is would buy most of it back.

**Released as v0.27.0**, whose `preview.png` is a real browser picture of its own copy — (141,138,105),
L136, 96.0% of the frame in colour, nothing black and nothing blown, the same numbers the working start view
gives — and whose `src` is the working tree byte for byte (`diff -r releases/v0.27.0/src src` empty).

What comes next: the side decks are still 7.85 m wide outside the borders and the lawn could come in over
half of it (fault 25); the CPU drawing has no `bedTone` and no ground bounce (faults 4 and 24); the
shrubs and bananas want merging into one mesh each (fault 26); and if more garden is wanted in the first
view it has to be tall enough to clear the frame's bottom edge, which cuts the ground 4.2 m ahead.

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who put dirt where the
master asked for it and found two lamps standing on the teak deck on the way 🐀🪴

## What was done this session (twenty-ninth, 2026-10-15) — every leaf was lit from the wrong side of the sheet 🍌🌴🌿

A browser the whole session (`headroom.js`: 2010 of 2048 free). This began as a weight of fault 20's
leftover — "`mats.frond.doubleSided = true` is one line and should be weighed" — and turned out to be a
fault in everything with a leaf in it, and a false note in these pages.

1. **The library's own switch was inert, and the shipped Villa was one-sided anyway.** Read off the Villa
   standing in Chromium: `frond` had `backFaceCulling false, twoSidedLighting false`; `leaf` the same;
   and `tuft` — the standing grass, whose material carries `mats.tuft.doubleSided = true` in
   `src/materials.js` — had **`backFaceCulling TRUE` and `twoSidedLighting false`**. On this library's
   PBR material `doubleSided`'s setter never reaches `_twoSidedLighting`: set it in a live page and the
   property reads back what you wrote while `_twoSidedLighting` stays false and the picture is byte for
   byte the same (`node tools/dump.js` prints it). So the twenty-eighth session's item 4 — "the same clump
   then reads (189,205,56)" — was measuring a switch that was not on. **What the shipped Villa was doing:**
   half of every grass clump was not drawn at all (the far side of each of its arms was culled), and every
   palm frond and banana leaf seen from behind was lit by a normal facing up into the sun instead of the
   eye — which is a thing the switch does and the mesh's own normals do not explain, so it is written here
   as measured and not as understood: the same crown goes (55,104,71) → (42,101,62) when the switch comes
   on. That is not a dark-card fault, as the last note guessed: it is a **chalk** fault. Anything back-lit
   came out pale and out of colour.
2. **The fix is one helper, `sheet()`, in `src/materials.js`: `backFaceCulling = false` and
   `twoSidedLighting = true`**, put on `frond`, `leaf` and `tuft`. Both are needed and they do different
   things — one draws the far side, the other lights a face from the side it is seen from — but, as 8 below
   found, they are not needed by the same sheets, which is how the fault survived being looked at: whichever
   one you checked, half the Villa looked fixed.
3. **The light the honest normals take off is paid back as light through the leaf — and what a leaf's own
   light is worth had to be measured, not guessed.** The emissives were small (0.05). `frond` and `leaf`
   now carry (0.3, 0.55, 0.2) and the clumps (0.5, 0.85, 0.3): under a coconut crown 4.8 m off, the frond's
   own colour goes (52,87,69) as it stood → (55,104,71) with the honest switch turned back off and the new
   light already in → **(42,101,62)** as it ships, and its darkest leaf comes up from (13,33,5) to
   (23,61,6). The number that
   matters is not the emissive colour but what it *adds*, because the engine multiplies it by the emissive
   pattern and that pattern is dark. Reading the painted canvases back off the live page — the one way to
   know, since only the browser paints them — a frond's 256² canvas carries (0.055, 0.196, 0.030) of light
   over the 56% of itself that is leaf, the rest being gap, so (0.3,0.55,0.2) of emissive **adds**
   (0.016, 0.108, 0.006). Small against a sun that arrives at 1.6-2.8 of raw light, and a great deal in a
   shaded leaf whose diffuse is near nothing. A banana leaf carries (0.059,0.222,0.036) and so adds
   (0.018,0.122,0.007); a grass clump, pale and bare-branched, carries (0.117,0.210,0.042) and so adds
   (0.058,0.178,0.013) — which is why the clumps carry the biggest emissive of the three and not the
   smallest. The hedge, at (0.05,0.075,0.03), adds only (0.003,0.011,0.001) — not nothing in a shade, but a
   seventh of the (0.050,0.075,0.030) the CPU drawing writes beside it, which is the same fault one
   material further on and is now fault 23 on the list.
4. **What a visitor sees, on the sixteen standing cameras (`node tools/scan_old_new.js 700 766`).** The
   change shows where there is foliage and nowhere else. Frame light −9 to +1: southborder −9 (that view
   looks due south, into the sun, so everything in it is back-lit), rearcorner −3, westlawn −3, pool −1,
   the other eleven within one point. **In colour flat to up** — westwall 71.9 → 73.4, westlawn 91.4 →
   92.1, rear 86.7 → 87.2, home 97.0 → 97.1, none down. Nothing black anywhere, nothing newly blown, `>240`
   still 0.0-1.0% on every view. Per material, on the south-border view: palm fronds (132,141,99) →
   **(42,103,35)**, and their brightest pixel in that frame from (254,242,221) — white, no leaf in it — to
   (157,206,226); the grass clumps (161,181,92) → **(129,151,64)**; a banana clump 7 m off (153,194,103) →
   **(120,177,84)** with its own channel spread running from 22,26,21 to 56,51,40, which is the point of
   the whole thing: the same leaves, with their colour back in them. `tools/compare.js` on the pair: the
   south-border frame moves 10.1 of a channel on average, `grass` 0.6, `home` 0.4 — a change in the trees
   and nowhere else.
5. **`tools/sheets.js` is new and fails on any of it.** It reads the two switches off the Villa standing in
   a browser, takes the list of sheets from `src/surface-colours.js` (the entries with a `cut` or a
   `double`, so the two renderings cannot disagree about the list), complains if a surface marked `cut`
   tests no alpha, reads the emissive patterns back off the page to work out what each sheet's light is
   worth (3 above) and fails if the CPU drawing's `glow` has drifted more than about 1.5 times from it,
   and **fails if anything anywhere assigns `doubleSided`** — because a knob that reads back what you wrote
   and changes no pixel is the most expensive kind. Exit 1 on any of it, so it belongs beside `standup.js`,
   `feet.js`, `shadows.js`, `planted.js` and `tuftfoot.js`.
6. **The CPU drawing had to be kept from lying about it.** It has always turned the normal for a back face
   (`tools/draw.js`, `faceSign`), so the browser was the liar and the drawing the honest one; and for the
   clumps it was drawing both faces already (`double: true` in the notes) while the browser drew one. Its
   `glow` for a sheet is now the added light of 3 above — (0.016,0.108,0.006) for a frond, and so on —
   measured off the page and written down, with `tools/sheets.js` holding the two together. Copying the
   material's emissive in there was tried first and is wrong: a flat number lands on every pixel of the
   sheet, leaf and gap alike, and it put the drawn fronds at (169,225,138) against Chromium's (42,103,35).
   On the south-border camera, drawn against photographed at the same eye: frond (62,136,36) against
   (48,104,40) — too bright but the right green; clumps (85,145,38) against (131,154,66), which is the
   clump-to-lawn ratio of 0.67 that the tint there carries, confirmed on a second camera; and the lawn
   itself (67,120,51) against (195,218,125), which is faults 4, 6 and 22 still: a sunlit surface in the CPU
   drawing is a long way dark, and no leaf number of mine will mend that. All sixteen standing views
   redrawn: nothing black, and the only white is `rearup`'s own sky at 0.9% (fault 22).
7. **Fault 21 is settled, and it is geometry, not density.** `tools/visibleground.js` — new, and it answers
   "which ground can this view see" in metres — says that from where a visitor starts, the frame's ground
   is the **water** (19.6% of the frame, z 2.3…6.2) and the **pool's coping** (16.8%, z 0.7…7.5), with
   paving only on one flank (x 5.8…10.9): the bottom edge of the frame cuts the ground 4.2 m ahead of the
   visitor, and they stand 3.4 m from the water, so that cut falls on the coping at the pool's south end.
   No grass can be seen from the start however thickly it is laid, because the ground there is the pool.
   The garden would have to come into the court to be seen: the strip between the coping and the sala — x
   5.45…7.6 either side, z 2…8 — is 2.15 m wide and free of anything built (the sala's outer step lands at
   x 7.75, the sunbeds at z 9.2), which is where a planted edge would go if the master wants green in the
   first thing he sees.
8. **Also found on the way**: the two `colorShader` wire materials and a couple of the lamp glows are the
   only surfaces in the Villa with no colour map at all (that is `cover.js`'s complaint, and it is fine for
   wires); and **the Villa has two kinds of sheet, and a different switch matters on each.** The palm
   fronds, the banana leaves and the distance belt's fronds are library planes built `Mesh.DOUBLESIDE`,
   which carries its own reversed triangles and its own flipped normals — measured on a fresh one: 8
   vertices, four with normal (0,0,-1) and four with (0,0,1), and the second triangle set wound the other
   way. On those, `backFaceCulling` is a knob that changes nothing (measured: frond (42,101,62) with
   culling on is (42,101,62) with it off) and `twoSidedLighting` is the switch that moves the picture.
   The grass clumps are the other kind: `grassTufts` has 5892 vertices for its 1473 sheets — four each,
   one winding, every normal pointing up — so its far side genuinely was never drawn and
   `backFaceCulling = false` is what bought it back. Anyone reading one switch as the answer for all the
   sheets will get half of them wrong, which is what happened here.

Nothing else moved: 669 meshes, 9 lights, 30 floors, 83 blockers, 491 clumps with none on built stone or in
the water, `standup.js` / `feet.js` / `shadows.js` / `planted.js` / `tuftfoot.js` / `sheets.js` all clean,
software WebGL still 5 fps at 1280x720. **Released as v0.26.0**, whose `preview.png` answers the start view
at (143,139,107) against v0.25.1's (143,138,107) with 96.0% of the frame in colour against 95.8% — the
change is in the trees, and where a visitor starts, the trees are not the ground.

What comes next: the CPU drawing's sunlit surfaces are still far too dark and its sky still blows on
`rearup` (faults 4, 6, 22); the hedge and the three jungle ranks have a `glow` in the drawing about three
times the light their emissives actually add, so bring them together one way or the other (fault 23); the
clumps are still three flat cards and want bowing or more sheets (fault 20); and if the master wants garden
in the first view, it has to be planted inside the court on the pool's two long sides (7 above), not
fringed along edges the frame cannot reach.

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who found that half the
garden had never been drawn at all 🐀🍃

## What was done this session (twenty-eighth, 2026-10-15) — the garden learned to stand up: grass where it meets the stone 🌿🟫

A browser the whole session (`headroom.js`: 2010 of 2048 free). The master's `EDICT.md` carried one
small bug: *"The garden has no texture, and is fully translucent. I suggest adding some grass, dirt, or
whatever you were intending to put around the terrace."* That turned into two pieces of work: proving the
first half of it is dead, and doing the second half.

1. **The garden is neither flat nor translucent any more, and now there is a number for it.** Checked in
   Chromium with `tools/dump.js`: `mats.lawn` answers `alpha 1`, `needAlphaBlending() false`, and an
   albedo map 512 x 512 — there is no blending anywhere in the ground. Photographed west of the pool
   (`520-deckedge`) the lawn paints (141,169,55) and a `--patch` over a stretch of it between two places
   2 m apart gives an L standard deviation of 24 over a range of 54 to 186, which is a busy sward and not
   a printed sheet. The fault itself was the `groundPlane` winding, killed in the twelfth session (see the
   note in `src/mesh.js`: the strips were built `BACKSIDE` and the renderer threw every one of their faces
   away, so the whole garden was invisible), and the master's note had simply been left in the edict.
2. **What was really missing was grass that *stands*.** The lawn has a good pattern and it is all lying
   down: every blade in `grassCanvas` is a five-pixel stroke flat on the ground, which reads across the
   garden and reads as green gravel at a visitor's feet. And the seams were bare — 100 metres of ruled
   join between the pool court's cut stone and the lawn, with nothing growing at any of it, plus the beds
   at the foot of the house, which are bare laterite by design and had nothing planted in them. So: 491
   clumps of standing grass, laid along every edge where the garden meets something built.
3. **`tuftCanvas` in `src/textures.js`, `mats.tuft` in `src/materials.js`, `makeTufts` and `makeTuftPlan`
   in `src/garden.js`.** A clump is three sheets crossed like a star (60 degrees apart, so six arms) each
   one a square of the painted cut-out standing on its own bottom edge, leaning a little, sized 0.26 to
   0.62 m across. All 1 473 sheets are folded into **one mesh**, `grassTufts`, so a garden full of grass
   costs one draw; every clump carries its own colour at its corners (the same vertex-colour trick the lawn
   uses) so some have gone straw and some have kept a dark green. They receive the roof's shadow and throw
   none: leaves a hand wide in a 2048 shadow map cost more than they are worth. Where they go is all one
   list in `makeTuftPlan` — the four sides of the pool court, the path out through the south planting, the
   three beds at the foot of the plinth, the two south border beds, a scatter 1-3 m out into the lawn
   beside the stone, and three clumps round the feet of every palm and boulder. The pool's own lip is left
   clean on purpose.
3b. **A plan is not ground: `tools/tuftfoot.js`, and the 82 clumps of grass it found growing out of the
   paving.** The first version of the plan put the far paving's south edge at z = 13.2 and the path's north
   end at z = 15.5, because I read the strip list wrong — the paving beyond the pool is 8.6 m deep centred at
   z = 11.9, i.e. **z 7.6 to 16.2**, and the path starts *under* it. So a fringe laid "beside" that edge was
   laid in the middle of the stone, and eight tenths of a metre of the path's fringes too: **82 places where
   grass grew out of cut stone**, the very fault `planted.js` exists for, and in the `path` view it filled
   12.3% of the frame with grass standing on paving. So (a) `makeTuftPlan` now asks the Villa's own ground —
   `makeGround(scene)`, the same reader the walk uses — and throws out any foot that finds more than 5 cm of
   built floor under it; and (b) `tools/tuftfoot.js` asks the same question from outside, sheet by sheet, and
   whether any clump is in the pool basin. It now answers `1473 sheets looked at; 0 places on built stone, 0
   in the pool`, and that view's grass fell from 12.3% to a truthful 1.6%. **The lesson is worth more than
   the clumps: a rectangle written down beside a paving strip is not the same statement as one on the ground,
   and the Villa has a ground reader — use it before shipping.**
4. **Three findings about this engine, all measured, all of them things I had assumed.**
   - **`backFaceCulling = false` does not light the back of a sheet.** A cut-out sheet seen from behind was
     lit by its own front normal, which points away from the eye: a clump measured (74,88,26) against
     (113,172,49) for the lawn beside it — half of every clump a dark card. The library's own switch is
     `material.doubleSided = true` (it clears culling *and* flips the normal for the far side in the
     shader, behind a `TWOSIDEDLIGHTING` define that is off by default). The same clump then reads
     (189,205,56) against the lawn's (180,201,67). The fronds and the leaves are still one-sided; see the
     new fault 20.
     **Corrected in the twenty-ninth session.** `doubleSided` is inert on this library's PBR material: its
     setter never reaches `_twoSidedLighting`, and reading it back in a live page returns what you wrote.
     So the switch believed to fix this fixed nothing, and the far side of a clump was not a dark card but
     simply absent — `backFaceCulling` was still true and half of every clump was never drawn. The real
     switches are `backFaceCulling = false` *and* `twoSidedLighting = true`; with both, and the leaf-light
     in tenths, a frame full of back-lit leaves moves 10.1 of a channel and the fronds come out
     (42,103,35) instead of (132,141,99). See the twenty-ninth session's entry, and `tools/sheets.js`,
     which now fails if anything assigns `doubleSided`.
   - **an emissive colour has to be in tenths in this scene.** The fronds, the leaves and the hedge all
     carry `emissiveColor` around 0.05 to stand for light coming through a leaf. The Villa's sun arrives at
     the tone curve at 1.6 to 2.8 of raw light, so 0.05 of a texture whose own bytes are ~0.2 of light is
     nothing: putting the clump's glow from 0.045 to 0.085 moved a browser's mean for the material by two
     bytes out of 255, and only ×10 (1.5, 2.6, 0.9) moved the frame's ground band by 9 points. The tufts
     ship at (0.15, 0.26, 0.09) — worth a couple of points, which is all they are asked for.
   - **a `DynamicTexture` lies upright on a plane**: the canvas's top row is the plane's top, so `v = 0` is
     the top of what you painted. Settled by painting a square half green and half red, drawing it on a
     plane in a real browser, and reading the pixels — the plane's top half came out green. Worth writing
     down because a tuft built on the other convention is a tuft growing downwards, and nothing complains.
5. **What the clump is worth in the same light as the lawn**: Chromium paints a sunlit clump at
   (94,120,36) where the lawn beside it comes out (141,169,55) — about two thirds. That is not a fault: a
   mass of upright leaves self-shades, and an uncut verge at a 24-degree sun really is darker and denser
   than the mown sward next to it. The bright tips are there (the same sample's brightest is
   (195,220,83)), so it is a busy dark green and not a black line.
6. **What the pictures say** (`node tools/scan_old_new.js 503 700`, sixteen standing cameras before and
   after): luminance between +1 and −4 (grass −4 and southborder −3, the two views the fringe fills
   most); **in colour flat to up** (westwall 71.2 → 71.9, rear 86.2 → 86.7, westlawn 91.2 → 91.4, none
   down by more than 0.2); the sunlit band's colour and spread unchanged on all sixteen (home 242,206,158
   s85 → 242,205,158 s85); nothing black anywhere, nothing newly blown, `>240` still 0.0-1.1%. Below L31
   moved up by a few tenths of a percent on three views — the shaded base of the fringe. How much grass a
   view holds varies hugely, which is the nature of an edge: 14.1% of the west court edge, 8.2% of
   `westlawn`, 8.5% of `grass`, 1.6% of `path` and 0.2% of the start view (new fault 21). The drawing agrees
   on coverage: 9.7% of the deckedge frame against the browser's 10.4%.
7. **How to look at a clump, and the trap.** A cut-out sheet is still **pickable where the paint is cut
   away**, so a ray pick can name `grassTufts` while the pixel it stands for shows the paving behind
   through the gap — one pick confidently named a tuft at 2.2 m and printed (203,171,136), which is stone.
   Measure a clump with `--patch` over a rectangle that is all fringe, or with `--at` on several pixels, and
   never trust one pick inside a cut-out. `tools/tuftprobe.json` is the ladder for it (as built / glow off /
   glow x10 / the whole mesh switched off), run with `node tools/lights.js --plan tools/tuftprobe.json
   --save pictures/tmp/tuft` and then measured with `--patch`.
8. **The drawing had to be told.** `tuft` is a new entry in `src/surface-colours.js` and `tools/draw.js`
   learned a `cut: "tuft"` shape (twelve blades rising to wandering heights) so a drawn clump has holes in
   it. Its tint is a **calibrated fudge**, marked as one: the canvas's own colours are about [100,140,60]
   and the entry says [58,76,34], which is the browser's 0.67 ratio folded in, because `shade()` has no
   self-shadowing and would otherwise paint every clump brighter than the lawn it is darker than.
9. **Nothing else moved**: 670 meshes (the one new one is `grassTufts`), 9 lights, 30 floors, 83 blockers,
   491 clumps with none of them on built stone or in the water, 176 plant parts with none of them in built
   stone, `standup.js` / `feet.js` / `shadows.js` / `planted.js` / `tuftfoot.js` all clean,
   software-WebGL fps unchanged at 5, and all sixteen standing views redrawn with
   nothing black. One drawn view, `rearup`, blows 0.9% of its frame to white where the browser puts 0.2%
   past L240: that is the drawing's own sky (item 4/6), it predates this session, and it is listed below.

What comes next, from where this leaves the list: the fringe is nearly invisible from where a visitor
**starts** (0.2% of the start frame, because the court's long edges fall outside a 0.85-radian eye at the
start) — new fault 21 says where to thicken it if the master wants grass in the first thing he sees. After
that the old list stands: the drawing has no ground bounce (fault 4), the room wants a door in its back
wall (fault 17), the pool cannot be waded (fault 5), and the uprights still wear a bump at 0.55 (fault 14).


## What was done this session (twenty-seventh, 2026-10-15) — the sunlit half was living in the last six bytes of the picture 🎨🌇

A browser the whole session (`headroom.js`: 2009 of 2048 free). Everything below is Chromium's own work:
the sixteen standing cameras before (`471-home` … `486-southborder`) and after (`503-home` …
`518-southborder`), three probe ladders (`tools/toneprobe.json`, `tools/tonefine.json`,
`tools/tonefinal.json`) and a new eye, `tools/rawlight.js`.

1. **Fault 1 was the standing fault and it is now answered: the top of the picture was a ceiling, not a
   range.** `tools/rawlight.js` loads the Villa with no tone curve at all (`?tonemap=lin&contrast=1
   &vignette=0&bloomThreshold=99&exposure=0.25`), so the byte the browser paints is the light divided by
   a known number and put through sRGB, and it prints the light back out. On the start view the sunlit
   surfaces arrive at the curve at: teak post 1.62, granite 1.92, coping 2.25, the cement at the foot of
   the deck 2.56, plaster 2.83 — a factor of 1.75 of light, which the library's curve turned into 245,
   247, 249, 250, 251. Six bytes. That is what "the sunlit half is pressed against a ceiling" meant, and
   it is why the twentieth session's patterns on a sunlit pot or chair seat could not be seen: red came
   out at 252-254 and there was nowhere for a pattern to go.
2. **`src/tone.js` is the Villa's own curve**, put into the library's shader at page load by replacing
   the text of `Effect.IncludesShadersStore["imageProcessingFunctions"]` before the rendering pipeline
   compiles it. It is *the library's own function with its two hard-coded numbers made knobs* — `knee`
   (where the bend starts, library 0.76), `white` (what the brightest light is worth on the screen,
   library 1.0) and `desat` (how much white is mixed into a colour folded far, library 0.15) — so
   `?tonemap=khronos` is byte for byte what the Villa shipped yesterday and every change can be weighed
   against it in one browser. With `?tonemap=lin` the same patch is how raw light is read. The patch
   answers whether it took (`window.__villa.tone`), so no tool has to believe a run that quietly left
   the library's curve in.
3. **The shipped curve is knee 0.5, white 1.0, desaturation 0.05, exposure 0.76** — every one of them
   measured, and the argument is written out at the foot of `src/tone.js`. Two findings worth the
   remembering, because neither is obvious from the maths:
   - **the desaturation works against the knee if it is left alone.** It mixes white in proportion to how
     far a colour was folded, so folding everything the sun touches at the library's rate buries the
     colour the knee was moved for: on the colonnade the sunlit band's channel spread is 60 as it was,
     **58 with the knee moved and nothing else**, 83 with `desat` down beside it. Refusing to touch it
     would have made the Villa worse and looked like a success on the light measures.
   - **the white point is nearly worthless as a knob and expensive.** 0.94, 0.96 and 1.0 move the sunlit
     half by one byte of spread, and what they do move is the very top: capped at 0.96 nothing in the
     Villa can exceed byte 247, so a sun glint on the water and a lamp's glass lose their white. It
     stays at 1.0.
   The exposure 0.72 → 0.76 pays for the fold: below the knee the curve is a straight line, so a
   multiplier hands the shade and the sky their light back and the sunlit half, which is what was too
   bright, buys none. Measured, the start view stands at L137 against L138 with the library's curve.
4. **What the pictures say** (`node tools/scan_old_new.js 471 503`): luminance within two points on all
   sixteen; in colour **up on all sixteen** (pool 93.2 → 94.7, westwall 69.7 → 71.2, colonnade 94.9 →
   95.5, rear 85.5 → 86.2); the share past L240 **down on all sixteen** (rearcorner 3.2% → 0.1%,
   southborder 2.4% → 0.1%, pool 4.7% → 1.1%, and 0.0% on eleven of them); below L31 down everywhere and
   nothing blackened; no pure white pixel anywhere. The lit band keeps more colour where the Villa needs
   it (home 75 → 85, colonnade 60 → 86, sala 94 → 101, path 69 → 81, eastlawn 108 → 112) and a shade
   less in three views that are mostly bright sky or bright grass (rearup 70 → 60, grass 148 → 139,
   frontcorner 97 → 93) — which is only what folding does to a colour that was not clipped: a uniform
   scale under sRGB costs byte separation near the top. Take it as the price, not a new fault.
5. **Two tools kept honest.** `tools/backlight.js` had been left inverting ACES at exposure 0.88 — three
   versions stale, and a tool that prints numbers nobody checks is a tool that lies — so it now inverts
   the Villa's own curve (peak inverted by bisection, the shader's dark-channel offset put back in closed
   form) and carries `--round`, which prints the round trip: worst 0.14 of a unit of light out of 4.
   `tools/draw.js` takes its curve and its exposure from `src/tone.js` too, so the drawing and the
   shader are compiled from one description; it stands 8 points under the browser on the start view
   where it stood 7, i.e. untouched, and its own shortfall is still fault 4.
6. **Nothing else moved**: 669 meshes, 9 lights, 30 floors, 83 blockers, 81.7% of the garden reachable
   from the start, 176 plant parts with none of them in built stone, `tools/standup.js`, `feet.js`,
   `shadows.js` and `planted.js` all clean, and all sixteen standing views redrawn on the CPU with
   nothing black and nothing blown.
7. **`tools/propprobe.json` was found partly broken and mended.** Its four close cameras ask the same
   place twice — once as built, once with the patterned materials forced back to one flat byte — and the
   difference between the two runs is what a painted pattern is worth. Half its picks had been printing
   `NaN,NaN,NaN`: the walking code eases the visitor onto the ground under them every frame, so a camera
   aimed at a chair seat was lifted to eye height within one frame and the chair left the bottom of the
   picture. The cases carry `float=1` now, and `tools/lights.js` prints `OUT OF FRAME` instead of NaN.
   With that fixed the pattern is worth six to twenty-five bytes on a sunlit teak seat, where the
   twentieth session measured a tenth of one — which is fault 16 paid, and it needed the new curve to pay
   it.

What comes next, from where this leaves the list: the drawing still has no ground bounce (fault 4), the
room behind the glass wants a door in its back wall and a lit passage behind it (fault 17), and the pool
cannot be waded (fault 5). The uprights are still wearing a bump map at 0.55 that nobody has measured
(fault 14), and four picks in `tools/propprobe.json` still land outside the picture and want re-aiming
(new fault 19).


## What was done this session (twenty-sixth, 2026-10-15) — the room behind the front glass was a board, and now it is a room 🛋️🟧

A browser in the room again (`headroom.js`: 2010 of 2048 free), so everything below is Chromium's own
work: the fifteen standing cameras before (`407-home` … `422-southborder`) and after (`423-home` …
`438-southborder`), a probe plan `tools/roomprobe.json` that switches one thing at a time in one render,
and `tools/dump.js` picking rays through the glass to say what a visitor actually looks at.

1. **What the room was.** One lamp for a 13 x 7.6 m room, standing over its middle; a bare teak floor;
two boxes, one called a sofa and one called a table. Through the glass the whole front came out between
(115,86,61) and (60,60,51) — that last one the west end, a grey-green nothing.
2. **`src/interior.js` (new) fits the room out**: a rug 5.2 x 3.8 m of rust silk, a sofa with a frame, a
back, two arms and two cushions, two chairs turned to face across the rug, a low table with a bowl and a
tray on it, a floor lamp in the west corner, two framed panels on the back wall, four beams across the
ceiling, and a big potted plant in the east corner (the same `makePottedPlant` the garden uses, now
exported from `garden.js`). One new material, `mats.rug`, whose canvas is in `textures.js` and whose
match in `surface-colours.js` is the same bytes, so the CPU drawing lives in the same Villa.
3. **Three lamps instead of one** — one over each half of the room and a small one in the floor lamp —
all restricted to the room's meshes with `includedOnlyMeshes`, hung on `scene.roomLamps`, and dialled
together by `?room=` in `main.js` (the floor lamp stays at 0.325 of the ceiling lamps). The scene now
carries 8 lights with `maxSimultaneousLights` at 6, which silently drops the seventh: measured over
every mesh with `dump.js`, none is lit by more than six ✅. A/B in one browser — the probe case "one lamp
over the middle" *is* the old arrangement — puts the west pane at (60,60,51) → **(80,73,59)**, the east
pane at (66,67,55) → **(80,77,61)**, and the mid band of a close view at L109 → **L117**. Refused: twice
the light (mid L123). At that level the front stops being a room somebody might be standing in and
becomes a shop window; the eye-level pane is kept at (95,86,69), which is what v0.17 settled on.
4. **Every mesh in the room had to be told to receive the roof's shadow, and that was the bigger half of
the fix.** A mesh that does not receive shadows is drawn in the open sun wherever it stands, and the sun
at 24° comes over the eave and through three metres of glass and lies on the room's floor: the new panels
came out of Chromium at (254,228,178) — blown white — and the rug at (245,151,84) with its weave painted
out, while the plaster behind them, which does receive, stood at (100,86,60). One line at the end of
`fitRoom`.
5. **The rug's canvas came down after that was measured, not before**: [132,66,44] → [104,52,34]. Across
the sunlit part of the floor the band now runs (202,132,61) to (225,155,85), L141-165, with light and
shade walking across it; before the change it was one flat (245,150,84) edge to edge, red within ten bytes
of the ceiling (faults 1 and 16 again, indoors).
6. **The four uprights in the front glass and the pier at its east end are shadow casters now**, so the
sun patch inside is crossed by their stripes: measured across the lit floor from inside, there is a
shadow in it at L51 where the band around it is L141-165. Nothing outside moved, and that is arithmetic
and not luck: the sun stands at azimuth 160°, so these shadows fall north — into the room, not onto the
terrace.
7. **The two panels on the back wall did not read, and had to be turned round.** They were a pale plaster
square in a dark teak frame on a wall of the same pale plaster: measured from inside, panel (101,85,58)
against the wall's (95,82,57) — nothing; from the start view, through the glass, the panel stood 10 points
below the wall (L93 against L103), which at fourteen metres is a smudge. So the panel is dark teak in a
lighter timber frame now — one dark rectangle on a pale wall from far off, two things from near, and what
a Thai house hangs there anyway. The same two places after: **(77,43,7)** against the wall's (96,84,59)
inside, and **(77,49,30) L54** against (127,99,72) L103 through the glass: a read nearly five times as
strong, and the frame's numbers unchanged to a tenth of a point. Probe: `/tmp/panel.json`, one browser, the
old way put back with two lines of `material`.
8. **What the standing cameras say.**

| view | before | now |
| --- | --- | --- |
| `colonnade`, in colour | 74.3% | **87.9%** (middle band (162,122,92) L128 → (151,109,80) L116) |
| `frontcorner`, in colour | 79.5% | **89.4%** (L121 → L119) |
| `home` (the start view) | L138, in colour 91.9% | L138, in colour **94.7%** |

Nothing came out black in any of the sixteen; nothing new blew out; the glass band in the colonnade view
went from a pale milky board — (90,86,73), (122,111,90), (215,164,121) side by side — to a warm room with
light and shade in it, (94,82,65), (78,63,46), (167,123,82). Two sets were taken, `423-home` … `438-southborder`
after the fit-out and `439-home` … `454-southborder` after the panels were turned round; only the second is
what v0.22.1 ships.
9. **The one fact worth the next session's time: from where a visitor starts, the room's floor is not
visible at all.** 264 pick rays thrown through the glass band from the start camera: 174 hit the back
wall's lining, 28 a ceiling beam, 11 a piece of furniture, 8 the floor, 5 the plant, **1 the rug**. The
sill's top at 0.8 m and the eye at 1.74 m cut the floor out at about the room's own depth. So switching
the rug off moves the start view by nothing at all, and what carries the room from the start is the back
wall, the beams and the furniture's silhouettes against them. If the floor and its rug are ever wanted
from the start view, the sill comes down or the glass goes to the floor — that is a decision about the
front elevation and not a furniture job.
10. **Cost.** 669 meshes in the end, 9 lights, 45 materials, 52 textures; the walk is untouched — 30 floors, 83
blockers, every standing place ok, no ledge handed to `ground.js` inside the room. `tools/shadows.js`:
503 casters, all valid. `tools/standup.js`: four frames through the loop, no fault. The CPU drawing
redraws all fifteen standing views with nothing black and nothing blown, and its `interiorPlaster` still
matches the browser to a byte ((110,95,67) there, (111,93,65) here).
11. **Then the room was given the one thing a furnished box cannot give itself: something to look *into*.**
    A teak case 1.8 m wide and 2 m high stands against the back wall between the two panels with its front
    left out, a shelf across the middle, a brass bowl on the shelf and a terracotta jar below it, and a
    lamp shut up inside. The room's lamps light the wall; this is a recess with a lip, a shelf and two
    things standing in a square of light, and at fourteen metres that is what depth looks like. Measured:
    inside, the lit plaster reads (132,110,76) L112 against the wall beside it at (100,84,57) L85; through
    the glass from the start view, dead centre of the house, where the bare back wall used to paint
    (95,86,69) L87, it now paints **(236,198,143) L202** — the eye lands there first — while the whole
    view still measures L138 with nothing new blown (`>230` 0.6%, `ceiling 0.00%`). The lamp's strength was
    read off a probe and not guessed: at 3.2 the plaster under it came out (234,185,133) and the top of the
    case was lit too, which is a lamp showing its own filament; at 2.4 those fall to (225,176,125) and
    (203,149,103) with the lit square still thirteen points over the wall beside it; at 1.8 it starts going
    grey. Four lamps now in the room and nine lights in the scene — and that brought a fault out of hiding:
    every mesh in the room was standing in **seven light sources** (the sun, the room's four, and the two
    lamps in the pool, which reach through a wall as far as the engine is concerned) while the shaders carry
    six, so Babylon had been quietly dropping one of them and still was. Measured with `dump.js` over every
    mesh: 7 on `liningBack`, on every lining, on the rug, on the sofa, on all nine alcove meshes. The pool's
    lamps are now kept out of the room's meshes in `main.js`, which is what they were for anyway — they light
    the water and the deck and not a room behind a wall — and the count came down to five everywhere, with
    nothing in the scene over six. The room lost two points of light for it (`mid` L81 → L79 inside, the
    wall beside the alcove L84 → L82) and the front of the house did not move at all, which is the truth
    rather than the leak. The alcove's own lamp is given a 3 m reach so it stops at its case, and the four
    lamps now carry their strengths in `interior.js` as ratios of one another, so `?room=` in the url turns
    the room up or down as one light instead of flattering one corner.
12. **Released as v0.22.0 (the fit-out, the lamps, the shadows, the rug), v0.22.1 (the panels turned round)
    and v0.23.0 (the lit alcove).** The standing set as v0.23.0 ships is `471-home` … `486-southborder`: the
    start view 95.5% in colour where it was 91.9%, the colonnade view 91.7% where it was 74.3%, the front
    corner 92.9% where it was 79.5%, and nothing black and nothing blown in any of the sixteen — the worst
    white share anywhere in the set is 0.1%. The release previews were weighed the same way.
13. **One lesson about the tools, since it cost an hour:** `tools/photos.sh` takes about half a minute a
    picture when it is the only thing asking for a browser, and about three times that when another browser
    or node tool is run beside it — and a run that is still going is not a run that has died. Let it finish
    alone, and check with `ls pictures/4??-*.png` rather than by guessing from the clock.

What is left, in the order I would do it:
1. **A door in the back wall and a lit passage behind it.** The alcove is a square of light to look into and
   it has bought the room some depth, but the room is still a room you look AT, and that is the last flat
   thing about it. `interior.js` says so at its head too.
2. The room's west end stands behind the solid teak panel that closes the west 2.6 m of the front, so the
floor lamp's shade is never seen from outside and that corner is lit by a light you cannot find. If that
lamp is ever wanted in the picture, the panel moves, not the lamp.
3. The twenty-fifth session's list is untouched: the sunlit base course is as bright as the coping, the
service block is a bare plate, the south lawn is at the ceiling. All three are the exposure and the curve
(fault 1), not the materials.

## What was done this session (twenty-fifth, 2026-10-15) — the foot of the house was painted soot, and the south hedge got a bed 🟫⬛🪴

A browser in the room again (`headroom.js`: 2010 of 2048 free), so everything below is Chromium's own
work: the fifteen standing cameras photographed before (`351-home` … `365-grass`) and after
(`372-home` … `386-grass`), two close cameras aimed at the faces a standing view never shows big enough,
and a probe plan, `tools/plinth.json`, that puts the old fault back on one switch so before and after are
the same render.

1. **The black thing at the back of the house was not only the plinth — the big one is the service block.**
   `tools/cover.js` on the `rear` view named `plasterDark` at **10.2% of the frame, mean (26,22,12),
   running 3 of 255 across 90 grid points**: a flat black plate where the lime wall beside it painted
   (111,102,84). Three things were proved before anything was moved, because "dark" is not a diagnosis:
   - *it is not the light.* Putting `mats.plaster` on the plinth and the block left them at (103,93,74)
     and (118,109,90) against the wall's (138,125,100) — the foot of the house stands in about two thirds
     of the light the wall gets, from a lower view of the sky, and not in a fifth of it; `tools/dump.js`
     said the two fill lamps exclude nothing outside the room, and switching `receiveShadows` off on both
     moved the plinth by nought, so no shadow was taking it either. It was the albedo, the whole of it.
   - *the albedo asked for it.* [86,74,62] against the lime's [204,182,152] is 0.42 of the bytes but only
     **0.157 of the light**, and at the bottom of the tone curve the picture is near straight through: the
     block came out at 0.23 of the wall's luminance, which is what 0.157 in light buys. Bytes lie about
     dark colours; only light adds up.
   - *a lift is cheap at the bottom and dear at the top.* Measured as multipliers on the same material:
     ×1.6 gave the block (36,27,14) and ×6.4 gave (103,93,74), while the **sunlit** face of the same
     material — the 50 cm band under the deck in the start view — went from (229,166,106) to
     (252,203,164) on the way and is now level with the pool coping. Same wall, same sun, faults 1 and 16
     met from the other end: there is no room at the top of the curve, and the shade only stands up by
     spending room there.
2. **`plasterDark` is a grey cement now, not a soot.** [150,144,126], cooler than the lime above it, with
   its weathering spread a third stronger: `plasterCanvas` takes a third argument, `spread` — how far the
   patches wander from the base colour — because a base course is what the rain comes off a roof onto and
   what the sprinkler throws at, so it weathers unevenly and should look it. `roughness` 0.7 → 0.78: sand
   and cement is not smoother than the render over it. `src/surface-colours.js` was given the same bytes
   and the same two washes, so the drawing and the browser still stand in one Villa.
3. **What the pictures say.** Same cameras, same code path, the old bytes put back with one line of
   `albedoColor`:

| place | the old soot | as built now | the neighbour that did not change |
| --- | --- | --- | --- |
| plinth at the back (rear view) | (20,22,15) L21 | **(53,55,46) L54** | back wall (111,102,84) → (112,103,84) |
| plinth on the west (westwall) | (22,25,18) L24 | **(63,65,56) L64** | west wall (132,123,103) → (132,124,104) |
| service block, 3.3 m off | (22,27,22) L26 | **(68,74,66) L72** | — |
| plinth in full sun (start view) | (220,181,124) L185 | (252,221,179) L224 | coping (240,217,185) → (241,218,185) |

   Over the fifteen standing views the soot bands simply stop being soot: the **`rear` view puts 1.6% of
   its frame below L31 where it put 12.8%**, `rearup` 0.3% where it put 10.0%, `westwall` 2.9% where it put
   11.0%, `rearcorner` 0.6% where it put 3.7%. Luminance: rear +4, rearup +4, westwall +7, eastlawn +5,
   home +2, rearcorner +2, and nothing else moved more than a point. Nothing blackened anywhere; nothing
   new blew out (`home` keeps `>230` at 0.8% and its brightest pixel short of white, `ceiling 0.00%`); the
   lit share grew where the sunlit band is (`home` 9.2% → 11.5%, `frontcorner` 4.5% → 5.7%). "In colour"
   is unchanged to a tenth of a point in every view — a grey cement is less saturated than a brown one, and
   the frames gained light rather than colour.
4. **The walk cost nothing** — a colour is a colour: 622 meshes, 30 floors, 83 blockers, 81.7% of the
   garden reachable from the start, no stumbles. `tools/shadows.js` and `tools/standup.js` clean.
5. **Tools.** New `tools/dump.js` (documented above), new probe `tools/plinth.json`, and `plinth` and
   `block` added to `tools/propcams.txt`. All fifteen standing views re-drawn on the CPU: nothing black,
   nothing blown, the winding check names no face, and the drawing's `plasterDark` now runs 10,9,8 instead
   of lying flat. Note before anyone "calibrates" it: in the drawn `rear` that surface means (109,96,75)
   where the browser means about (60,58,49) — that is the drawing's missing ground bounce (fault 4), not a
   wrong tint, and the tint must stay byte for byte what `materials.js` paints with.

6. **Then the south border got its beds too, and only after a second look said they were worth it.**
   The same `makeEarthBed()` laid as two bands of laterite along the inside of the south hedge —
   `earthBedSouthWest` and `earthBedSouthEast`, 2.4 m wide, stopped 0.5 m short of the paved path so the
   walk still runs out through the planting instead of dead-ending in dirt — so that the eight shrubs
   planted along that hedge stand in earth and not in a carpet, the way the ones at the back of the house
   have since the last session. They were nearly thrown away: from `southborder` they looked like 1.8% of
   the frame painted (250,211,177), a bone-pale strip, and the probe said the colour would not answer an
   albedo brought down five times — which was the foliage trap again, the pick ray going through the shrub
   leaves and painting them. Looked at from straight above, where nothing is between the eye and the ground,
   the sunlit bed reads **(189,110,47) where the lawn beside it reads (110,191,71)**, a warm brown band
   against the grass, and it answers its albedo normally (×0.45 → (120,69,22)). Switched off and on in one
   browser the beds take the blown end of the view down — `southborder` puts 10.7% of its frame past L230
   with them and 12.1% without, `pathside` 7.0% and 8.3% — and move the mean by two points. That is a small
   gain and it is a real one; the standing set says they touch nothing else (every other view unchanged to
   a tenth of a point). One thing refused on the way: **no rings of dirt under the isolated shrubs and
   bananas on the open lawn.** A one-metre basin under one plant is under a tenth of a point of any view, and
   it is two more meshes and another edge to keep honest; the border bands were worth it because eight plants
   and a whole stretch of hedge edge were in them, and a single banana is not.

What is left, in the order I would do it:
1. The sunlit base course is now as bright as the coping it stands under (L224 against L220), so the front
   has lost some of its weight at the feet. The levers are the exposure (0.72) and the curve's start of
   compression, and they are fault 1: nothing here can be fixed from the material side, because the shade
   and the sun are the same cement now and the shade is right.
2. The service block is a 3.2 x 3.4 m plate with nothing on it. It reads as a volume now instead of a hole,
   but a louvre, a vent, or a pipe run would give the back of the house something besides flat cement —
   new work, and the `block` camera is aimed at it.
3. The sunlit lawn at the south of the garden is at the ceiling: read from a visitor's height it paints
   (229,247,157) and (217,245,155) — green with the red gone past 230, the same complaint the grass has
   everywhere (faults 1, 2 and 16). The border beds took 1.4 points of the frame out of that blown end and
   no more; the exposure and the curve are where the rest of it is.
4. Nothing is laid under the isolated shrubs and bananas on the open lawn, and that is now a decision and
   not an oversight — see item 6.

## What was done this session (twenty-fourth, 2026-10-15) — the garden was a glowing sheet, and the foot of the wall was bare 🌿🟫

`EDICT.md` came back with one bug: *"The garden has no texture, and is fully translucent. I suggest
adding some grass, dirt, or whatever you were intending to put around the terrace."* Taken literally the
first half is not true and was checked before anything was changed: `node tools/cover.js` lists every
see-through thing in the scene and the lawn is not on that list — `lawn` is alpha 1, no blend mode, with a
colour map and a bump; the only translucent materials in the Villa are caustics, glass, water, frond and
leaf. What IS true, and what a visitor is seeing when he says translucent, was found by measuring a
stretch of grass 20 m off (`-13.5,1.5,8,-1.57,0.18`, kept as the `grass` camera in `tools/cameras.txt`):

1. **The lawn's bump map was stealing a third of its light and glittering on top of what was left.**
   The bump was at level 0.5 — the strongest in the Villa after the hedge's at 1 — and it is a field of
   random tilts laid over a sheet of ground that is otherwise flat. Near, that is grass. At 20 m every
   pixel is tilted somewhere else: measured over the frame with `tools/lawnbump.json` the view stood at
   **L126 with the bump as it was, L133 at 0.25 and L142 with it off**; a 60 x 60 patch of sunlit sward
   ran from **L44 to L228**, which is not texture, it is television static over mud. Same fault as the
   teak floor's (fault 4 of the nineteenth session) found in a third place. Now 0.25.
2. **Nothing was painted at the scale a person steps over.** The grass tile is 6 m and held broad patches
   at 1.5 m and speckle at 19 cm and finer, with nothing between — and the speckle was washed on at 0.42
   across a 94-point range, which at 20 m is two pixels and averages to a flat acid sheet. New in
   `grassCanvas`: a `mixByField` pass (new in `src/textures.js`: two colours on two sides of a field with
   a crossfade in the middle, so it paints *two kinds of thing side by side* and not one gradient) at nine
   cells to the tile — 67 cm clumps of thick deep sward against thin strawy ones — and the fine field cut
   to 26 cells, two octaves, 0.24 across a narrow range.
3. **The pattern's top end left the sun nowhere to go.** Its brightest paint was (180,196,84) and the
   brightest lawn pixel a browser paints is 233,247,78: at the ceiling of the picture the tone curve has
   already taken the colour out. The ramp was stopped at about (150,168,84) and the blue lifted through
   the whole of it, because a green with no sky in it is a paint chart and not a lawn.
4. **The hedge's bump was at 1**, the highest number in the Villa, on the garden's biggest green mass,
   mostly seen from far off: four points of light gone (L133 → L137 with it off, `tools/hedgebump.json`).
   Now 0.3.

What the pictures said. On the `grass` camera the lawn went **(140,179,41) → (155,181,57)** — sixteen
points of blue given back, luminance up — its `runs` from 52,55,20 to 43,41,20 and the fine sparkle over a
lawn-wide rectangle from L std 49.9 to 47.9. The *broad* read is what was missing and it is there now:
straight down from 20 m over the west lawn, in 1.2 m blocks, between-block warmth std **15.6 → 18.3** and
channel spread in red **13.9 → 16.4**, so the patches read as different colours and not merely lighter and
darker. Across the fourteen standing views (`node tools/scan_old_new.js 297 335`) the Villa elsewhere did
not move: luminance within ±3 everywhere (eastlawn +5), in colour slightly *up* where there was garden
(westwall 61.2 → 62.3, rearcorner 88.6 → 88.9), nothing blackened anywhere, and the only view that gained
at the bright end is rearcorner (1.9% → 3.2% past L240) where the sunlit lawn is brighter than it was.

**And the dirt the master asked for.** Three bands of bare laterite — `mats.earth` (a paler, redder draw of
`soilCanvas`, laid 0.7 m to a repeat) run by `makeEarthBed()` in `src/garden.js` — along the three faces of
the plinth that look onto lawn: west 1.15 m, east 1.15 m, back 1.9 m, their outer edges wandering on two
waves that are not multiples of one another so the grass ends at an edge and not a ruled line. The two
faces that look onto paving have none, which is right: dirt does not lie on a paved court. Read in a
browser at the back of the house, the ground now runs plaster **(133,125,106)** → plinth **(34,26,14)** →
earth **(106,73,41)** → lawn **(56,99,51)**: three edges where there was one, and the shrubs along the back
wall stand in earth instead of growing out of a carpet. The CPU drawing was told in the same breath
(`earth` in `src/surface-colours.js`, the `mix` step in `tools/draw.js`) and reads earth at 5.2% of the
`rear` view and 8% of `westwall`; its winding check ("NOTHING of these faces the eye") names no bed, which
is the proof that all three look up at the sky.

One thing measured and refused, because it will be tried again: **the sun's specular and the lawn's
roughness map do nothing at all.** Setting `sun.specular` to black, and pulling the roughness map out of
`mats.lawn`, left the picture pixel for pixel the same (`tools/lawnshine.json`). With
`usePhysicalLightingMode` on, the sparkle on a horizontal surface is the bump and nothing else. Chase the
bump.

Next time:
1. The plinth's own band is nearly black — (34,26,14) and (29,21,10) at the back of the house — and now
   that a lit band of earth lies in front of it, that dark 50 cm strip is the deadest thing at the foot of
   the building. It is `plasterDark` in the house's own shade, which is fault 1 again, but a shade of its
   own at the plinth (it is 50 cm tall and never in the sun) may be worth asking for directly.
2. The grass still blows: the brightest lawn pixel in full sun is 237,236,84. Faults 1 and 16 (the
   exposure at 0.72 and the curve's start of compression) are the only levers and are still unmoved.
3. Nothing was laid at the south border along the hedge, or under the isolated shrubs and bananas on the
   open lawn — the same trick as the plinth beds, one call each, when the beds have proved they read well.
4. `mipmaps: true` on the lawn, hedge and earth bumps changed nothing measured (overhead lawn at 40 m:
   fine std 33.3 → 34.1). It is kept because a 6 m tile minified past two pixels a texel has nothing else
   to average with, and nothing measured objected; the other eleven bump maps still say `mipmaps: false`
   and nobody has tried them.
5. "Fully translucent" may still mean something this session missed. Ask the master where he was standing.

## What was done this session (twenty-third, 2026-10-15) — every pattern was sized to the face, not to the world 📏🧱

The fault: a face's texture coordinates ran from one edge of the face to the other, so every piece of the
Villa got exactly ONE repeat of its pattern however big it was. Measured over the standing Villa with
`node tools/pitch.js` (new: it answers how many metres one repeat covers on every face in the scene, and
sorts by how far out that is) — before, in metres to a repeat: the back wall's plaster 6.1, the hedge 22.7,
`hedge5` one repeat down its whole 45 m run, a palm trunk 4.3 (rings 70 cm deep against the 20 cm the
canvas itself paints: six rings to a repeat), the boundary timber 10.4, the sala soffit's boards 4.3 m to
a repeat of nine = 48 cm, the coping 2.5 m to a stone, and the columns so small they got 116 cm of mosaic
per 5 cm of their width, which is no grout at all. Now: plaster 1.2, coping 0.5 (one stone to a repeat,
joint at the edge), pool mosaic 0.8, hedge and the two ranks of jungle 1.1 / 2.2 / 3, timber and teak 0.9
and 1.8, a palm's rings 0.45, rock 0.9, cloth 0.5, soil 0.6, pots 0.8. The sizes are written once, as
`pattern:` on the material in `materials.js`; `metricUVs` in `mesh.js` writes the coordinates in metres for
boxes, flat sheets and cylinders, per face and along the face's own two directions, so a wall's pattern runs
continuously from one piece of it to the next and one that leans or turns is still measured along itself.
Spheres, hip roofs and cornered-up grounds are left to their builders — `groundUVs` already laid the lawn,
the deck and the two teak floors in metres, which is why the terrace has always shown boards and the walls
have not.

What the pictures said. Over the fourteen standing views (before 255-268, after 297-310,
`node tools/scan_old_new.js 255 297`): luminance within one point on every view, colour within 0.9 of a
point, nothing new blown out (start 0.0%, pool 4.5% where it was 4.8%), nothing blackened. Where the pattern
is the whole surface, the local spread is what moved: a strip across the near coping 2.7 -> 6.3 between-block
spread and its darkest block 181 -> 160, so the joints are seen; a metre of the west wall at 1.2 m went
3.9 -> 4.6 (small — see the refusals below). The browserless drawing followed without one line of change to
`tools/draw.js` beyond the `scale: 1` on the patterns whose repeats moved into the mesh: it reads the mesh's
own texture coordinates, so browser and drawing move together, and all fourteen standing views redrew with
nothing black and only `rearup` blown out, at 0.0%. `tools/standup.js`, `tools/feet.js`, `tools/shadows.js`
clean. Release preview: luminance 136, 0.0% white, 0.0% black, 91.9% in colour, ~5420 distinct colours.

Two refusals, both put back. Strengthening the plaster's trowel sweeps: deepening the broad wash evenly
across all three channels cost the shaded faces two points of colour; deepening them on the red while
holding the blue cost twenty — `westwall` fell from 61.9% of its frame in colour to 43.8% — because a
plaster wall's colour IS its warmth (red 204 against blue 152) and a wash that takes more out of red than
out of blue is a wash of grey. So the plaster canvas is as it was and only its size is right. That also
tells where the texture of a shaded wall has to come from: not the paint but the light — faults 1 and 16 in
`EDICT.md`, the sun's ceiling and the strength of the sky fill. A sunlit wall has no room at the top (its
brightest pixel in the start view is 254 of red); a shaded one is nearly all fill and bounce.

Next time:
1. Faults 1 and 16 are still up, and they are the anvil this Villa is forged on: a sunlit surface cannot be
   pushed past (208,170,132), and the only way to darken a shaded face without wrecking it was found to be
   cooling it (EDICT fault 16). Every attempt to paint more texture into shade comes back as a colour loss.
2. `stone` answers for 0.82 to 1.40 m to a repeat across ten surfaces, because where a face is not four
   corners to a flat face `metricUVs` leaves it be: the mortared boulders at the pool head and the rock group
   on the west lawn want a per-mesh `tile:`, smaller on the small stones.
3. `tools/draw.js` blows the roof in `rearup` to 1.1% white where a browser pictures 0.1% there. The browser
   is the witness, but the drawing should be brought round to agree.
4. Unexamined still: the frond canvases (palms are built from geometry, so their leaves), the sand and the
   sea, and `roofTileCanvas`, the one big sunlit surface left at its old scale — 1.17 m to a repeat of about
   six tiles, a plausible clay barrel, but never measured against a real roof.
5. This file is long again (about 1950 lines). Fold whole sessions 1-13 into a paragraph the way this one
   folded twenty-second; the measurements live in `releases/releases.json` per release, which is the place
   for them.
6. `tools/look.js --pick` read its numbers as raw pixels while every note here used fractions, so every
   fraction was taken as the top-left corner of the picture. Fixed: under one is a fraction now, and the
   coping, the glass and the water were named correctly the first time afterwards. If a pick answers the sky
   where the ground should be, suspect the tool before you suspect the Villa.
7. What a picture cannot prove. The terrace soffit's boards went from about a metre apart to 20 cm, and no
   picture will show it: across the same band its own shading runs from L30 at the far end to L255 at the
   sunlit edge, ten times the boards, so between-block spread there is 34 before and 35 after and the repeat
   finder finds nothing. `tools/pitch.js` is the witness for faces lit like that; the coping, where the light
   lies flat across the stones, is where a picture proves the measure. Measured at
   `0,2.1,0.5,3.1416,-0.51` with the pick on `soffit` (4.0 m, (71,43,11)).

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who measured the pattern
before he painted it, and found the Villa had been painting one repeat to a wall and another to a post. 🐀📏


## What was done in the twenty-second session (2026-10-15) — the front glass became a window, and the boundary put on planting 🪟🌿

Folded to a paragraph; the full numbers are under `v0.17.0` in `releases/releases.json`. The room behind
the front glass had never had a lamp (a guard on a Babylon static that is not in the vendored library): it
is a real `PointLight` (26, (1,0.72,0.42), 15 m), kept off the two fill lamps — `light.shadowGlowLayer.meshes`
is the ONLY live exclusion list in this Babylon, `light.rootMesh` is dead code — its ceiling stands under the
soffit, its service block stands a doorway wide off the glass, and the room is lit by one lamp dialled from
the url with `?room=`. The glass came down to roughness 0.04, `environmentalIntensity` 0.5, alpha 0.34. The
boundary's sawn boards and scaffold poles (7% of the start view) went under 224 five-metre crowns standing
3-11 m beyond the hedge and 84 farther yet, the lawn shrunk to 54 x 60 with its hedge running inside it, and
the hedge was repainted for distance: clumps over a metre across, grain at a twelfth, the dark end of its
sweeps taken out of the green and not out of the grey (a grey shade swamps a (45,49,30) base by 92%), and the
pattern measured on the box's LONG side, because 139 of 142 standing samples of a hedge are side faces.
Outdoor emissives are capped at half, or the bloom takes the frame. The plinth's shadow gap is a real shadow
(floor boards raised 3 cm; the hemisphere's 55 was filling the gap), the coping is chamfered four ways, the
terrace roof's four board bands are one fascia and a soffit that faces DOWN (`rx = +Math.PI/2` faces the
sky), the raft ends are capped, the vertical glass has a drip shot, and the steps are one slab with grooves
sawn across the face you walk down — a bump map cannot cross a merged mesh's seams. Added `tools/standup.js`
(six checks in a headless engine) and `tools/pixels.js --relief` and `--repeat`, which is how the coping's
false joints and the boundary's stretched pattern were caught. Cameras are now fourteen (`salaroof`,
`westwall`). The walk is custom: Babylon's camera collisions must never come back.


## What was done this session (twenty-first, 2026-10-15) — the pool was given a real surface and refused, and the sala floor got a weather of its own 🌧️🪵

A browser was in the room all session (2011 of 2048 process slots free, `tools/headroom.js`), so every
claim below is out of Chromium's own pictures. `pictures/196-home.png` … `209-westwall.png` are the
fourteen standing views as this session left them, and `210-sala.png` the sala after the last fix.

1. **The pool water was a painted sheet, and I tried to make it a real surface. It was refused on the
   numbers, and the Villa is unchanged for the attempt.** The old `disableLighting = true` on
   `mats.water` meant the sun, the sky and every lamp hit the pool and went nowhere: one flat turquoise
   with a net crawling over it, the same whatever side you stood on. So the water was rebuilt as a body
   of painted turquoise under a lit surface — roughness 0.06, the sky cube mirrored back at
   `environmentIntensity` 0.7, a dim diffuse so it was not a pure mirror, and a wave map of its own in
   `bumpTexture` (three trains of swell and a chop, 30-80 cm and 5-10 cm, one tile to 1.7 m of water,
   drifting with the painted net so the sparks land on the crests). `tools/waterprobe.json` holds the
   plan; the caustics sheets were switched off inside it so only the surface was being weighed.

   Over the pool, in a 1280x720 frame, water from y 500 to 700:

   | the surface | mean light | share over L180 | share over L220 |
   |---|---|---|---|
   | painted, as it stands | L156 | 26.8% | 6.8% |
   | lit, flat, no waves | L159 | 27.5% | **16.5%** |
   | lit, with the waves | **L146** | 15.8% | 6.7% |

   and the middle of the frame — the pool, which is the subject of the start view — went from
   (109,173,172) to (106,165,162). It is duller and it is dimmer, and the reason is Fresnel: looked at
   from any height a pool mirrors about two per cent of what is above it, so the sky's share reads as a
   pale wash over the whole basin (that is the 16.5%, the bucket of milk the fourteenth session warned
   about) where the sun's share — which is the only thing that would have paid for it — is a *line*, not
   a band: at a flat surface it sat at z 3.4 in the over-pool view and nowhere else, and raising the wave
   level from 1 to 2.5 did not spread it. The bump machinery is not at fault (flat to level 1 moved a
   tenth of the pool's light, and the teak floor's bump moved by the same kind of amount); the fault is
   that a point sun on a nearly-flat surface has nowhere to put a sparkle. **Anyone who tries this again
   should start from an area light or a mirror texture of the villa, not from these numbers.** The
   measurement is kept in the comment over `mats.water`, where it cannot be lost, and the working tree is
   back to what v0.15.0 drew.

2. **The sala floor now has a weather, and that is what is released.** It was fault 12's leftover: a 4 x 4
   m floor whose tone came out one number (1.00, 1.00, 0.99), because everything in `src/teak.js` is
   terrace weather — the drip band follows the house's eave, the walked lanes are the terrace's — and a
   sala is roofed on all four sides so the shelter term was a constant across it.

   What a sala floor actually gets, now put in `src/teak.js`:

   - **Rain blown in under the eave.** The sala's roof hangs a metre past its floor on every side, so a
     storm mostly drops its water clear of the boards; what wets them is wind-driven rain, and it gets
     about a metre in and stops. `blownRain(x, z)` is a ring one metre inside each edge, and it is
     wettest on the **windward** sides — the south and the west, since the monsoon blows up the Gulf from
     the south-west — and dryest at the north-east corner. Wet boards take the drip tone (dark, and a grey
     green left where the red was), and the same wet pushes the boards towards silver in `weather()`.
   - **The sala's one walked line.** You come up the steps in the middle of the west face and walk east to
     where the seats are; `traffic()` now knows that line, so it comes back darker and warmer, like the
     terrace's lanes.

   The tone across the sala floor went from a range of 0.95-1.04 to **0.75-1.17**, which is the terrace's
   spread (0.68-1.18) rather than a flat board, and it stays inside the sala's own average so the floor did
   not get darker or lighter as a whole.

3. **What the browser shows of it.** `tools/salaprobe.json` (new) photographs the sala twice, once as
   built and once with the floor's vertex tones forced to 1, and picks the same six places on the floor
   each time. As built against flat: the oiled middle 241,139,71 against 236,139,71; the walked lane
   229,134,65 against 233,136,67; the windward west edge **220,132,65 against 232,137,69** — twelve points
   of red gone where the weather got at the boards. Over the sala floor's own patch of the frame,
   11.6% of the pixels moved by more than 6 points and the worst moved 56. Both readers get it: the CPU
   drawing multiplies the same `teakTone` in (`broad: "teak"`, `tools/draw.js` line 675).

   One early version put the wet ring on the north and east, reasoned from where the afternoon sun could
   not reach in under the eave to dry; the sun at azimuth 160° reaches nearly the whole 4 m floor, so that
   reason was wrong and the wettest sides are now the windward ones. Worth noting because the *first*
   plausible story is often the wrong one and only the picked pixels catch it.

4. **Nothing else moved.** `pictures/182-…195` against `196-…209`, every standing view: the worst whole-
   frame change is `home` at a mean of 2.3 points with 2.4% of pixels over 6, and the sala view sits in
   that same band (mean 2.0, 2.2% over 6) — which is this change plus the pool's animated net and the sway,
   not drift in the lighting. Whole-frame colour is where it was (`sala` 367,380,263 before and after).
   Luminance by view: home 132, rear 63, rearup 120, rearcorner 107, sala 112, path 128, west 134,
   pool 127, westlawn 114, eastlawn 120, colonnade 121, frontcorner 112, salaroof 117, westwall 81 — all
   within a point or two of the last set, no view went black, none blew out.

5. **What I would do next.** Fault 1 still heads the list: the sunlit top of the range is compressed, and
   this session found it again in a third place (the sala's sunlit floor could not show its honey because
   its red is at 241 of 255). Item 14 — the bump level on the posts, doors and sala planks, still 0.55 and
   never measured — is the cheapest thing left that has never been looked at. Then the glass front: in the
   start view it is 9.2% of the frame at (149,123,93), which is neither a view into the room nor a
   reflection of the sky, and it is the biggest thing between a visitor and the house.

## What was done this session (twentieth, 2026-10-15) — the furniture, the pots and the boulders were flat colour 🪵🏺🪨

The browser was in the room (2010 of 2048 slots free, no zombies left behind), and every number below is
one Chromium painted. One fault: four materials in the Villa were one flat colour each, with no pattern
of any kind — the furniture timber (56 meshes: sunbed frames, deck chairs, the bench, the railing, the
table tops), terracotta (45, the great pots, the plant pots and the coconuts), stone (10, the garden
boulders and the post feet) and soil (3, the earth in the mouth of each pot). `node tools/cover.js` had
been naming them `NO COLOUR MAP` all along. Worse, `src/surface-colours.js` already had `wash` entries
for soil, pot and stone, so **every drawn picture in `pictures/` had been painting mottling that the
Villa never had**, and `wood` was flat in both.

1. **Four new patterns, in `src/textures.js`**, each one built on the house plan: a middle byte, broad
   patches first, then the small stuff, and bytes spread about the middle rather than replaced.
   **`timberCanvas`** is outdoor furniture timber — silvered grey where sun and rain get at it, dark and
   oily where they do not, grain along the length of the piece, a knot or two, the tooth of sanded wood.
   **`terracottaCanvas`** is a wheel-thrown pot: how the clay came out of the kiln in hand-sized patches,
   the wheel rings, clay grit, a pale mineral crust high up and a dark damp at the foot.
   **`rockCanvas`** is granite: fist-sized weathered masses, wandering quartz veins, the salt and pepper
   of quartz, feldspar and mica, and a grey-green lichen crust.
   **`soilCanvas`** is potting soil: damp and dry patches, crumbs, grit and perlite, a little old leaf.
   Each of the four also wears a bump map at a low level (0.22 to 0.4 — the nineteenth session's lesson
   that a steep bump throws light away was kept in mind, and the props are small anyway).
   `surface-colours.js` was told the same four patterns in the same breath, so a drawn view cannot come
   out flatter than the Villa it draws.
2. **The first version was too fine to see, and that is the finding worth keeping.** Every surface of the
   first cut was grain and grit and no weather, and it vanished: on the terrace chairs, the picture with
   the pattern and the picture without it came out **the same colour to a tenth of a channel** (mean gap
   0.1 of 255). The reason is the same one the lawn met in the seventeenth session — the engine shrinks a
   pattern to a mip of its own average long before the thing is far off, so fine detail is a thing you
   find when you stand over a thing, and broad patches are the thing you see at all. So each pattern was
   rebuilt with the big scale first and nearly the whole way from one end to the other: three weather
   blotches across a tile of timber going from (88,54,24) to (184,152,116) bytes, three to four kiln
   patches on a pot, three stone masses and a lichen crust over five cells. The grain, the grit and the
   perlite stayed, underneath, for the close views.
3. **What it measures, in `tools/propprobe.json`** (four close cameras, each aimed until the surface it is
   named for filled a fifth of the frame, every place asked twice — as built, and with the four patterns
   forced back to the flat bytes): between 8-pixel blocks of one material, the spread of light and of
   colour between them went up every time —
   * terracotta pot: L std **10.5 → 17.6**, channel spread r 12.5/g 9.8/b 12.7 → **r 16.4/g 18.0/b 22.5**;
   * granite boulder: L std **28.3 → 32.2**, its green spread **23.6 → 28.5**;
   * the weathered rail: L std **8.5 → 10.2**, and the rail top's own colour went (236,145,71) → **(229,151,84)**:
     thirteen of blue taken back out of it, which is what silvered timber looks like and not a varnish.
   Meanwhile the means held, which is the other half of the job: on the four close-ups the whole-picture
   means sit within **2 points** of v0.14.0 (pot L137 against L135, boulder L165 against L164, rail L142
   against L142), and at 15 m, where a pot is a fist of pixels, the same two places in the west view came
   out (250,174,132) against (250,173,133) and (187,103,42) against (191,104,43).
   One material needed paying: with its middle at the old [138,130,118] the lit boulder came back five
   points of light under the flat one, so the stone's middle went to [146,138,126] to hand those five
   back — a pattern's average put through the tone curve is not the flat colour put through it.
4. **Nothing else moved, and that was checked rather than hoped.** All fourteen standing views came out at
   **+0 luminance** with in-colour within 0.1 of a point and no view blowing out or blacking out anywhere
   (`node tools/scan_old_new.js 140 168`): the props are a sixth of the west frame and less of the rest,
   so this is a change you read in the close-ups, the way the teak floors are read in `teakprobe.json`.
   The drawing came out a shade *closer* to the browser where the props show: the sala view 17 points under
   → 16, the west view 14 → 9, home 7 → 7, colonnade 4 → 5. The walk is the same walk (607 meshes, 30
   floors, 83 blockers, 81.7% of the garden reachable from the start, no stumbles), and so is the frame
   rate: three frames a second at 1280 x 720 in software WebGL, measured twice on this tree and twice on
   v0.14.0, which is the same. The Villa now carries 48 textures where it carried 40.
5. **Two faults found, and left.** The first is fault 1 on the standing list, wearing a new hat: a sunlit
   horizontal timber face is already at the ceiling, so nothing you paint on it shows — the terrace chair
   seat reads **(252,200,162)** with the pattern and (252,197,160) without it, red at 252 both times, and
   that is the whole `chairs` probe saying nothing (mean gap 0.1 of 255). The rocks at close range are the
   same (254,227,195). The fix is the exposure or the curve's start of compression, not these four
   materials. The second is that the drawing has no bump maps, so a patterned prop still reads flatter in
   a drawing than in the Villa; the four new bumps are in `materials.js` and in no drawing.
6. **Tools.** `tools/propprobe.json` is the props' regression test, run the same way as the lawn, paving
   and teak probes (views, picks given in metres of ground, and a case that forces the material back to
   flat). `tools/propcams.txt` and `tools/propshots.sh` photograph those four cameras, of the working tree
   or of any release, so `tools/pixels.js --patch` can be pointed at one surface instead of at a lawn.
   `tools/lights.js` takes **`--url`** now, which is how v0.14.0 was weighed against this tree with the
   same probes, and a pick given in metres now prints the pixel it landed on, which is how the rectangles
   above were found. Note for the picture archive: `140`–`153` are v0.14.0, `154`–`167` and `168`–`181`
   are this tree, photographed twice, and `scan_old_new.js 154 168` says +0 on every view — that pair is
   the control that says the tool is not imagining change.
7. **The Master's note in `EDICT.md`** — "the garden has no texture, and is fully translucent" — was the
   lawn turned face-up in the twelfth session and given grass and dirt in the seventeenth. Checked again
   now: `cover.js --alpha` lists only caustics (0.07), glass (0.36), the water skin (0.94) and the cut-out
   leaves as see-through, and every ground surface — lawn, paving, coping, terrace, path, sala floor and
   the soil in the pots — now wears a colour map. Nothing in the garden is transparent or bare.
8. **What I would do next.** Fault 1 first, and the chair-seat and boulder numbers above are its evidence
   now: a sunlit flat top face of timber or granite has no headroom, so no pattern on a horizontal sunlit
   surface will ever show. Then the sala floor's own story (item 12 below, still flat), then the uprights'
   bump at 0.55 (item 14, still unlooked at), then the drawing's missing ground bounce (item 4).

Released as **v0.15.0**.

## What was done this session (nineteenth, 2026-10-15) — the two teak floors were printed things 🪵, and a palm was growing in the paving

The browser was in the room (2009 of 2048 slots free, no zombies left behind), and every number below is
one Chromium painted. Two faults, one the eighteenth session put first for this one and one it did not
know about: the terrace and sala floors were one board pattern in one tone from end to end, and a good
many of the garden's plants were standing on built stone instead of in soil. `pictures/terraceover-before.png`
(that release, v0.13.0) and `pictures/terraceover-after.png` (this tree) are the terrace from seven
metres straight up with the same 1.2 rad eye; `pictures/drawn-teakover.png` is the CPU drawing of the
same view; `140-home` … `153-westwall` are the fourteen standing views, and
`node tools/scan_old_new.js 126 140` is that set weighed against the last release's.

1. **The fault.** The terrace deck is 16.2 x 4.4 m of teak and the sala floor is 4 x 4 m of it, and both
   wore one pattern of boards at one tone everywhere: the same thing the lawn was (seventeenth) and the
   pool deck was (eighteenth). The machinery for the cure already existed — `slab()` plus a tone asked in
   metres of ground — so this was a matter of writing the weather and rebuilding the two floors to carry
   it.
2. **`src/teak.js`, new**, on the lawn's and the paving's plan. What happens to teak in a Thai garden:
   **silvering**, because sun and monsoon take the golden oil out of exposed wood and leave it grey, while
   wood under a roof keeps its oil and stays honey — `honey` [1.14, 1.0, 0.865] and `silver`
   [0.85, 1.045, 1.175], blended by how much weather reaches the place (`exposure`, driven rain fading
   under an eave but never stopping: the sala has no wall and a 24-degree sun reaches seven metres under
   its 3.16 m eave, so a third of the weather gets through everywhere under a roof); **the drip**, a
   broken dark band a metre out from where the main roof lets go of its rain, because wet wood is dark
   wood and a storm empties 4.2 m of roof over that edge; **the traffic**, the lane from the front steps
   in to the glass and the lane along the glass, where feet abrade the grey layer off and polish the wood
   back darker and warmer; and **wear**, a little light and dark the size of a room, which is the only part
   that moves the floor's *light*. One finding, and it is why the first attempt did nothing: the blue of a
   teak pattern is a dark brown's blue, about a fiftieth of its red, so multiplying it moves the painted
   pixel hardly at all — 12 per cent into the blue moved the browser by two points, because most of the
   blue it paints comes off the sky's own light and not out of the wood. The red and the green do the
   work; that is the same law the lawn found, that the middle channel carries a surface's light.
3. **Each floor keeps its own average, and that was the real work.** The first version divided both floors
   by one shared average. The sala is four square metres of roofed, oiled, honey boards, so it dragged the
   shared number warm and bright, and the open terrace paid: straight down, the stretch of deck south of
   the eave — the part that should only have gone *cool* — ran (241,146,88) in v0.13.0 and came back
   (213,132,73), less red and less blue both, which is a dimming and not a silvering. Averaged floor by
   floor the weather can only move colour inside the floor it is standing on, and the colonnade view's
   colourfulness came back from 78.4% to 88.9%, which is where the release sits. What the tone is now,
   measured in Node one metre at a time: under the eave (1.08, 0.98, 0.87), the walked lane (1.08, 0.93,
   0.76), the drip band (0.84, 0.96, 1.10), the open deck (0.96..1.02, 0.99..1.09, 0.95..1.13). In the
   browser the same two places 0.8 m apart under one roof — the walked lane and the drip band next to it —
   come out (215,129,69) and (186,108,46): twenty-nine points of red, on a floor that used to be one flat
   colour.
4. **The teak bump was stealing light, and this is worth remembering whatever surface you are on.** Two
   places 2 m apart on the sunlit deck, seen from 7 m up, read (219,144,93) and (107,64,21) with the bump
   level the uprights wear, 0.55: whole stretches of boards tilt away from a 24-degree sun. Straight down
   the frame mean ran L117 at 0.55, L123 at 0.3, L127 at 0.15 and L130 with no bump at all; 2 m in front of
   a man standing on the deck the same knob ran 180, 167, 158 and 150 — so the bump earns its keep close
   to and not beyond, and `mats.teakFloor` now wears 0.3. (v0.13.0 had the same fault in a milder draw of
   the lottery: its frame lost 5 points to the bump and one place lost 55.) Note what did *not* fix it:
   mipmaps on the bump changed nothing at all, because at seven metres the boards are about one texel to a
   pixel and there is nothing to average. Measured with `tools/lights.js` and the world-place picks below.
5. **The two floors were rebuilt to carry the tone.** `teakFloor()` in `src/villa.js` builds each with
   `slab()`, lays the boards from the ground with `groundUVs(mesh, [5.4, 1.8])` — one tile of the pattern
   per 5.4 x 1.8 m of deck, so the boards are 30 cm wide and the grain runs 5.4 m — and carries the tone at
   their corners with `tintFromGround`. `groundUVs` in `src/mesh.js` now takes either one tile size or
   `[along, across]`, and `mats.teakFloor` is the teak family at that ground metric with the softer bump.
   The CPU drawing was told in the same breath: `broad: "teak"` in `src/surface-colours.js` and `teakTone`
   in `tools/draw.js`, so a drawn deck weathers too (drawn against browser on the straight-down view: L111
   against L127, the drawing's known shortfall of range on a sunlit face).
6. **A palm was growing in the paving.** While putting places into the deck I found the garden's plants were
   rooted wherever the layout was tidy and not where soil was: `tools/planted.js`, new, reads the ground
   heights `tools/feet.js` builds and names every plant clump whose feet stand on paving, terrace or sala
   floor. The first run said **15 clumps out of 176 parts** — two palms in the pool court and on the terrace,
   six shrubs sitting on the deck and the paving as though they were planted in them, two bananas on the
   pool paving, and the three rocks west of the court on the stone. All re-sited in `src/garden.js` to lawn
   and beds; the tool now says *176 parts looked at, 0 clumps rooted in built stone*. It cost a tenth of a
   point of walking ground (81.8% → 81.7%), because out in the lawn they shade a few cells they did not
   shade on the stone.
7. **What the pictures say.** `tools/scan_old_new.js 126 140` over the fourteen standing views: six did not
   move at all (home, rear, rearup, sala, eastlawn, colonnade, frontcorner, westwall — all +0), four moved two
   points up (rearcorner, path, pool) and the four that moved properly are garden and not teak — salaroof +5
   and west +4 where palms and shrubs came off the built stone into sun, westlawn −3 where they came onto the
   lawn. Nothing blew out, nothing blacked out, in-colour held within 0.4 of a point everywhere and the
   bright end moved only in the pool view (4.9% → 4.8%) — the deck is a fifth of the colonnade frame, which
   is why even the deck's own 29-point weathering does not show in a whole-view average; it shows in
   `tools/teakprobe.json`, which is now the teak regression test. Straight down over the deck the frame sits
   at (196,115,54) L128 against the release's (209,119,55) L134, with the colour spread further than it was
   (657 distinct colours to 754 in that frame): about five of those six points are the tone itself, which is
   spending light at the bright end of a nearly-saturated orange where the screen gives less back than it
   takes — the same ceiling as fault 1 on the standing list.
8. **What it cost.** 608 meshes (unchanged), 92,072 vertices against 91,978 — ninety-four corners, which is
   the two floors cornered up at one metre and nothing else — 30 floors and 83 blockers, five frames a
   second at 1280 x 720 in software WebGL (unchanged from v0.13.0, measured the same way in `tools/look.js`),
   `standup.js` clean, `feet.js` clean, no console messages but the Babylon version line.
9. **Tools.** `tools/planted.js`, above, is the keep-out test for plants in stone. **`tools/lights.js` can
   now be asked for a place in world metres** — a pick is `{ "place": [x, y, z] }` as well as a fraction of
   the screen — and it projects that place through the Villa's own camera and reads the pixel it lands on.
   That is what made every measurement in this entry possible: a place on the deck is the same place in the
   release and in the working tree, so the two can be weighed against each other with no guessing where a
   pixel is. `tools/teakprobe.json` is the teak test (the deck as built, with the tone forced to one, and
   with the tone forced to a third, which is how I proved the tone was reaching the screen at all);
   `tools/shrubwatch.json` is gone, superseded by `planted.js`. One caution: `tools/photos.sh` starts its
   numbering at 025 unless you pass `--from`, so two runs on one day write over one another's names — pass
   `--from 140` and the set stays one clean block for `scan_old_new.js`.
10. **What I would do next.** The sala floor is now honest but flat — a floor its roof covers on every side
    keeps its oil everywhere, so its tone is one number: give it its own story instead, a wet track of pool
    water and sunscreen at the edge it is stepped in from, which is a different weather from the terrace's.
    The uprights' bump is still at 0.55, and the doors and posts in the sun's path are losing light the same
    way the deck was (item 4 above has the numbers and the knob). Then fault 4 on the standing list, the
    ground-bounce term missing from `tools/draw.js`, is still the largest gap between a drawing and what the
    browser paints — this session's straight-down pair is 16 points of it.

Released as **v0.14.0**.

## What was done this session (eighteenth, 2026-10-15) — the pool deck was a printed thing, and now it is stone

The browser was in the room (2010 of 2048 slots free, no zombies left behind), and every number below is
one Chromium painted. One fault, the one the seventeenth session put first for this one: about four
hundred square metres of pool deck is one pattern of stone slabs three metres and a tenth across, laid
again and again, so every slab in the first tile is the twin of the slab in the thirteenth. `pictures/126-home`
… `139-westwall` are this session's fourteen standing views, and `pictures/deckover-before.png` and
`deckover-after.png` are the west deck from ten metres straight up, before and after.

1. **The fault, and why it nearly could not be measured.** The first thing I tried was the lawn's own test
   — `--patch` over the deck from straight above — and it said the paving was *not* flat: one-metre blocks
   differed by 33 of red and their light by a standard deviation of 21. All of that was shade and light,
   and none of it was the deck. Two things came of it. One, `--patch` now prints each block's **warmth**
   (mean red minus mean blue, one number), which a change of light barely moves and a change of dust and
   damp moves by ten: that is the column that can watch this fault. Two, the tile's own repeat did not show
   in `--repeat` either, because at ten metres up the engine averages the four-slab grid into one tone — so
   the fault had to be proved on the surface places, twice, which is `tools/paverprobe.json`.
2. **`src/paving.js`, new**, and it is the lawn's plan over again: fields asked in metres of ground, read
   by the browser at the deck's own corners and by `tools/draw.js` at every pixel it lays (`broad:`
   "paver" in `src/surface-colours.js`). Three things are in it. **Dust**, because a Thai pool deck in the
   hot months carries a film of garden dust and baked limestone goes pale and warm: red up, blue taken
   out, the green left nearly alone — the same law the lawn found, that the middle channel carries the
   light of a surface. It drifts over ten metres and is crusted at two metres, the size a person walking
   actually sees. **Damp**, because every swimmer tracks water onto the stone and wet stone is darker and
   cooler: a band along the coping that fades out over about two metres, and where it reaches it beats the
   dust down. **Wear**, a little light and dark for where the stone has been walked and washed — the only
   part that moves the deck's light, as against its colour. All of it is divided by its own average over
   the paved ground, so the patches cannot quietly repaint the deck.
3. **Two false starts, both worth remembering.**
   - The first tone divided the raw noise field by a range picked by hand around its supposed middle of
     0.5, and the deck moved by a point or two of a channel: nothing. The field's own middle over this
     ground is 0.36 and hardly anything in it reaches 0.66, so nearly all of the deck sat at one end of the
     blend. Now the cut is taken at the deck's own median and its eighty-eighth percentile, measured over
     the deck at load: half the deck is dry stone, an eighth is fully dusty, and there is a graded band
     between with edges to it. The spread went from p05..p95 of 0.967..1.043 in red to 0.913..1.182.
   - The first seed left the west deck 3.4 per cent up in the red and the walkway 5.9 per cent under the
     whole paving's colour, which is a warm deck beside a cool one and not dust — the same fault the lawn
     made with a forty-metre gradient. Fifty seeds were tried and the one kept (21076) leaves no strip more
     than 3.0 per cent off. The paving tone also needed the deck's corners at **one metre** and not two:
     at two the crust could not be carried at all and a whole ten-metre strip came out one flat dusty
     colour.
4. **The deck had to be rebuilt to carry any of it.** A box has four corners to a face, so a tone can only
   vary at the four ends of a ninety-square-metre strip; `slab()` in `src/mesh.js` is new — a top cornered
   up into one-metre squares and four sides wound to face out, one mesh, placed like a box, and left open
   underneath because nothing in this Villa is ever seen from below. `groundUVs` lays the slab pattern from
   the ground, so the stone now wraps over the deck's edge instead of restarting on each box face. The
   winding was checked with a pick and not with hope: from the lawn the west face is named at
   (−15, 0.08, 6.8) and comes out (33,31,22), in its own shade; from above, every top face is +y. Note that
   a 14 cm face under a 1.6 m eye is nearly invisible anyway — it is there so the edge is not a hole.
5. **What the browser says now.** `tools/paverprobe.json`: thirteen paving places, once as built and once
   with the deck's vertex colours forced to one, move by up to (+20, +10, −6) where the stone is dusty and
   (−8, −5, 0) where the damp band reaches, while the hedge, sky, water, teak and coping places in the same
   two runs move by nought or one — the control. `tools/cover.js` on the `west` view, the released v0.12.0
   against this tree: the paving's own colour spread (`runs`) goes from 35,30,26 to 41,34,29 while its mean
   only moves from (205,169,129) to (208,172,131). Over the west deck from straight above, the warmth
   between one-metre blocks runs from a standard deviation of 13.3 to 14.5 and its range widens from 34-91
   to 34-98, with the mean light two points lower — that window happens to sit in a dusty part of the west
   strip, which is why its own mean went (169,140,106) → (186,147,98) while the strip as a whole moved
   0.8 per cent. And the whole picture did not move: all fourteen standing views came out within one point
   of the last release's luminance, nothing blew out and nothing blacked out, and in-colour held to within
   half a point. `>240` is unchanged everywhere but the pool view, where it went 4.7% → 4.9%.
6. **What it cost, which is nothing.** 607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable
   from the start, no place the ground jumps, `standup.js` and `shadows.js` clean, and five frames a second
   at 1280 x 720 in software WebGL — the same numbers v0.12.0 made, with about two thousand seven hundred
   more corners in the garden.
7. **The CPU drawing kept up.** With `broad: "paver"` its patch spread over the paving window went from
   r 27.3 to r 28.6 and its warmth spread from std 14.7 to 17.7, against the browser's 29.8 and 14.5; so a
   drawn deck is no longer flatter than the built one. (Measured by drawing the same view with and without
   the `broad` line in `src/surface-colours.js`, which is the honest way to ask a tool what it added.) The
   drawn deck view is kept as `pictures/drawn-deckover.png`, so the next session can set it against
   `pictures/deckover-after.png` with `tools/compare.js`.
8. **Tools.** `--patch` prints warmth per block; `tools/paverprobe.json` is the paving's regression test;
   `tools/cover.js` takes a url as its first argument, which is how a released copy was measured against
   the working tree for the `runs` pair above.
9. **What I would do next.** The two big flat things left that a visitor stands on are the **terrace floor**
   and the **sala floor** — teak boards in one case and stone in the other, both tiled and both one tone
   over their whole area; the terrace is what fills the bottom of the colonnade and frontcorner views. The
   machinery is all here now: `slab()` plus a tone asked in metres. After that, fault 4 on the standing
   list — the ground-bounce term missing from `tools/draw.js`, still the single largest difference between
   a drawing and what the browser paints.

Released as **v0.13.0**: "the pool deck is a deck now: dust drifts, a damp band at the coping, and wear,
all measured on the screen". `releases/v0.13.0/preview.png` was looked at: 1280 x 720, average
(145,141,110) L140, nothing blown (its brightest pixel is 243), nothing black, 96.0% in colour, and
`tools/compare.js` says it is the same picture as `pictures/126-home.png` to a tenth of a point. Its `src`
is byte for byte the working tree's.

## What was done this session (seventeenth, 2026-10-15) — the garden was a printed thing, and now it is a garden

The browser was in the room (2009 of 2048 slots free, no zombies left behind), and everything below is a
colour Chromium painted. One fault, the ninth on the standing list, and it was the kind that is easy to
read past because nothing about it is *wrong*: the lawn is a six-metre tile of grass laid again and again
across forty metres of garden, so every patch is the same green and every mown band lands in the same
place twice. `pictures/112-home` … `125-westwall` are this session's fourteen standing views.

1. **The fault, measured.** Twenty metres straight down over sixteen by fifteen metres of the west lawn
   (`?float=1&view=-16,20,8,3.1416,1.5708`, 39.8 px to the metre), in blocks of a metre: one block's
   colour differed from another's by 7.5 of red, 8.7 of green, 3.5 of blue, and the strip of lawn lined
   up with a shifted copy of itself again at r = 0.52 at 239 px, which is six metres — the tile, showing
   itself. A pattern cannot answer a pattern: what a real lawn has that a tile cannot is shapes far
   bigger than the tile.
2. **`src/lawn.js`, new.** Two fields asked in metres of ground and not in the tile. `lawnTone(x, z)`
   returns three multipliers, one per channel, for how the grass lies in a place — `lush` (deep, cool)
   to `parched` (straw-pale, warm) — with a small light-and-dark field on top for where the sward is
   thick and where it has been walked thin; about two places in five come out dry. `lawnBend(x, z)`
   says how far the pattern is nudged off its grid, up to 1.3 m over a wavelength of thirty to forty,
   which is what makes the mown bands describe long shallow curves instead of ruling the garden. The
   multipliers are divided by their own average over the garden, so the patches can vary the lawn
   without brightening or dimming it whole. `groundNoise` and `groundPatch` came to `src/noise.js`
   because a field sampled in metres has to be plain maths, not a canvas: that way the Villa and
   `tools/draw.js` stand in one garden and the drawing cannot lie about this.
3. **How it gets into the picture.** `groundPlane` in `src/mesh.js` takes a `spacing` and builds the
   lawn with `CreateGround` in squares two metres across — eighteen thousand corners where it had eight,
   which the software renderer did not notice (see point 6). `tintFromGround` writes a colour at every
   one of those corners, which the engine multiplies into the grass pattern in its own light; and
   `groundUVs` takes the bend as a third argument and lays the pattern from the ground it lies on, bent.
   `src/world.js` puts the two of them on all four strips. `tools/draw.js` multiplies the same field in
   at each pixel it shades, through `broad: "lawn"` in `src/surface-colours.js`, and reads the bent
   coordinates out of the mesh, so the drawn garden and the built one agree.
4. **Two faults made on the way here, both worth remembering.**
   - The first `tintFromGround` called `setVerticesData(ColorKind, colours, false)`. The third argument
     is `updateIfNotExists`, and a fresh plane has no colour buffer to update, so the engine did nothing
     at all and the garden stayed flat while the code said otherwise. It is `true` now. The proof it is
     needed: `tools/lawnprobe.json` runs the same twenty-four places on the west lawn twice, once as
     built and once with the vertex colours forced back to one by hand — with the tone missing, the two
     cases printed the same colours, and that is how you will notice it again.
   - The first fields wandered over forty metres, and the whole west half of the garden came out straw
     and the whole east half green: a gradient, not a lawn. And the first `parched` took the green
     channel down along with the dryness, which is a lawn in shadow and not a lawn in the hot months —
     the west lawn read seventeen points darker in that attempt. Green carries four fifths of the light
     in grass, so dryness now moves red and blue and leaves the green nearly alone, and the light goes
     up and down only with the thickness of the sward.
5. **What the browser says now.** Same window, same blocks: the block means differ by 15.0 of red (was
   7.5), 9.1 of green, 3.4 of blue, their light by a standard deviation of 8.6 (was 7.1), and the patch
   map has turned from a field of one glyph into blobs — dry masses with deep green between them. The
   lawn's own six-metre repeat fell from r = 0.52 to r = 0.44, while the comb at one metre, which is the
   mown bands and should stay, held at 0.72. That the mean only moved from (115,168,43) to (117,161,37)
   is the point: this is a redistribution of the garden's colour, not a repaint of it. Proven at twelve
   grass places in `tools/lawnprobe.json`, where turning the tone off moves the painted grass by
   (r +2.3, g −7.7, b −6.3) on average and by up to 15 of a channel at the driest and the lusher; the
   twelve paving and water places in the same probe moved by nought or one, which is the control.
6. **What it cost, which is nothing you can see or feel.** Every one of the fourteen standing views came
   out within one point of the last session's luminance (rearcorner, rear and eastlawn +1, westlawn −1,
   the other ten unmoved); no view blew out or blacked out anywhere; in-colour held to a tenth. The walk
   is the walk it was — **607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable from the
   start, no stumbles** — `standup.js` and `shadows.js` are clean, and at 1280 x 720 in software WebGL
   this copy and `releases/v0.11.0` both draw five frames a second, so the eighteen thousand corners of
   the lawn are free next to the two million pixels.
7. **The CPU drawing kept up, and grew a shade more honest-looking about one thing.** Over the same
   window its own patch spread went from r 6.1 with the tone to 11.2 with it, so it is not drawing the
   flat garden any more. What it did was deepen its old shortfall against the browser in the lawn-heavy
   sunlit views: eastlawn was 29 points under and is 33, rearcorner 14 → 16, west 13 → 14, path 12 → 13,
   while the shaded rear came two points closer at +22. Same cause as fault 4 — no ground bounce in
   `shade()` — with a byte-versus-light difference on top, since the drawing's tints are fitted bytes and
   the engine multiplies this field in light.
8. **Tools.** `tools/pixels.js` gained `--patch` (how much a stretch of ground differs from one part of
   itself to another, in blocks) and `--repeat` (whether it repeats itself at all, which is how a tiled
   garden is caught); `tools/cover.js` now prints `runs` against every material, which is that material's
   own colour spread in one number; `tools/lawnprobe.json` is the tone's regression test, described
   under “How to look at it”. The standing browser set is now `112-home` … `125-westwall`.
9. **What I would do next.** The same treatment wants putting on the pool paving: forty metres of stone
   that is one colour, and the biggest flat thing left in the Villa. The tools to measure it are here and
   the tone already works on a subdivided plane, so it wants a field of its own — dust blown in from the
   garden, darker where water has stood by the coping — and a top cornered up like the lawn's. After that,
   fault 4: the bounce term in `tools/draw.js`, which is now the largest single difference between a
   drawing and what the browser paints.

*Done in the eighteenth session, which is the entry above: the paving got its field, the deck got its
subdivided top, and what is left of that plan is written down there.*

Released as **v0.12.0**: “the garden is a garden now: the lawn has parched and lush patches, and the mown
bands wander”. `releases/v0.12.0/preview.png` was looked at: 1280 x 720, average (146,142,110) L141,
nothing blown, nothing black, 96% in colour, and the lawn strip along the bottom of it comes out in
patches rather than one green. And asked at seven places on the west lawn, in the two releases one
against the other with the camera in the very same place, the painted grass went from a band — red 128 to
169, green 190 to 215 — to a garden: red 74 to 173, green 111 to 233, a deep sward beside a bright one
with dry grass among both.

## What was done this session (sixteenth, 2026-10-15) — the tone curve was wrong, not the sun

The browser was in the room (2009 of 2048 slots free, no zombies left behind), so every number below is
one Chromium painted. One fault, the top of the standing list, and it was not the sun and not any surface:
it was the curve the light was squeezed through on its way to the screen.

1. **What the fault was, in one line.** ACES fits every channel apart and ends at white, so the brighter
   a surface was the paler it went. On the start view the sunlit band — everything at L200 and above —
   came out (241,225,196) with only 46 of channel spread in it, 4.5% of the frame was past L230 and the
   coping's brightest pixel was (254,247,238): teak, plaster and potting soil all arrived at the same
   pale sand, which is why the fourteenth session's weathering of the timber moved them so little.
2. **A pull on the bright end only was tried first, and it is a dimmer and not a shoulder.** The library's
   colour curves (`BABYLON.ColorCurves`, applied after the tone mapping and the gamma) are three
   display-domain gains keyed on how bright a pixel already is — shadows under a luma of 0.5, highlights
   over 0.833, a straight line between, and the gain is quadratic in the slider: −50 gives ×0.875, not
   ×0.75. Tried at −18, −34, −50 and −60 against ACES on five views. At −60 the sunlit band of the start
   view read (208,204,194) with **14** of channel spread against the 46 it has as things stand: the pixels
   that were merely bright get pulled down into the band with the ones that were over the top, and a
   multiplier cannot put back separation the tone curve has already crushed. Kept as `?shoulder=` and
   refused; under the new curve it is worse again (−40 takes the band's spread from 74 to 56).
3. **The cure: Khronos PBR Neutral, the library's third tone curve, with the exposure down from 0.88 to
   0.72** (`tonemap` and `exposure` on the url). It leaves everything under 0.76 of raw light on a
   straight line, bends only the top over so the brightest channel lands just under white, and does both
   to the whole colour rather than one channel at a time — so a lit surface keeps its hue instead of
   drifting to white as it brightens. The exposure came down a fifth because the Neutral curve is some
   thirteen points brighter through the midtones, and the two were set together and not one after the
   other. Start view: L142 against L145, past L230 from 4.5% to 0.7%, **nothing whatever at the
   ceiling**, and the sunlit band keeps (244,216,173) with 74 of spread. The front post went from
   (250,216,161) to (252,182,143) — red-brown timber, not pale sand. (Those five numbers come from one
   `tools/lights.js` run at 640x360; the fourteen standing pictures in point 4 are the same Villa at
   1280x720 and read a point or two apart, so quote whichever the reader can reproduce.)
4. **All fourteen standing views** (`pictures/098-home` … `111-westwall`; `node tools/scan_old_new.js 084 098`
   prints the whole table, which now carries the lit band):

| view | L before → after | in colour % | past L240 % | dark L≤31 % | sunlit band, spread |
| --- | --- | --- | --- | --- | --- |
| home | 143 → 140 | 90.9 → 96.3 | 3.3 → 0.0 | 0.8 → 0.4 | s47 → **s75** |
| rear | 67 → 73 | 74.0 → 86.1 | 0.0 → 0.0 | 24.1 → 11.8 | s37 → s77 |
| rearup | 119 → 120 | 78.5 → 87.1 | 0.5 → 0.4 | 15.1 → 10.0 | s28 → s70 |
| rearcorner | 114 → 118 | 71.3 → 88.2 | 1.1 → 1.6 | 6.8 → 3.9 | s37 → s81 |
| sala | 122 → 122 | 81.0 → 95.6 | 2.4 → 0.0 | 2.6 → 0.4 | s64 → s103 |
| path | 136 → 133 | 87.5 → 94.6 | 2.8 → 0.0 | 2.5 → 1.9 | s49 → s66 |
| west | 136 → 136 | 76.4 → 89.4 | 1.3 → 0.1 | 1.0 → 0.1 | s43 → s80 |
| pool | 133 → 134 | 62.7 → 93.2 | 8.3 → 4.7 | 1.9 → 0.1 | s22 → s58 |
| westlawn | 126 → 128 | 76.9 → 89.0 | 0.5 → 0.0 | 2.4 → 0.9 | s60 → s104 |
| eastlawn | 141 → 141 | 95.1 → 97.1 | 0.9 → 0.0 | 1.0 → 0.5 | s58 → s123 |
| colonnade | 129 → 124 | 79.2 → 89.1 | 7.1 → 0.0 | 2.3 → 0.9 | s55 → s59 |
| frontcorner | 129 → 126 | 84.4 → 90.9 | 0.9 → 0.0 | 3.5 → 0.6 | s90 → s110 |
| salaroof | 117 → 119 | 76.1 → 94.1 | 0.9 → 0.2 | 5.1 → 0.9 | s46 → s86 |
| westwall | 87 → 89 | 50.5 → 63.9 | 0.1 → 0.0 | 18.4 → 12.0 | s62 → s117 |

   Luminance moves by at most six points in any view and by three in most; colour rises in every one of
   the fourteen, the sunlit end of every frame roughly doubles the spread it keeps, and the washed-out
   top of the picture is gone. Nothing blew out or blacks out anywhere.
5. **Fault 3 answered by accident.** The deep shade was the same fault as the chalky sun: ACES was
   crushing the top and lifting the bottom towards it at the same time. The north face now keeps 11.8% of
   its frame below L31 where it kept 24.1%, the west wall 12.0% where it kept 18.4%, the sala roof 0.9%
   against 5.1% — and all three came up in colour with it, which no amount of fill was doing.
6. **The far distance did not move**, so the fifteenth session's ladder stands and no far colour had to be
   set again: measured with the new plan `tools/distance.json`, a hill went (129,138,142) → (126,136,140)
   and the far tree line (120,133,131) → (117,131,129), both still well under the sky and cooler than it.
   The sunlit crowns that fault 2 left at (241,199,147) are (221,221,146) now: a lit leaf, with green in it.
7. **The CPU drawing was given the same curve** (`neutral()` in `tools/draw.js`, copied out of the library
   like the ACES fit was, with `--tonemap` to switch) so it does not lie about the Villa it draws. Against
   the browser it came out *closer* than it was, same fault 4 shape: 4 to 29 points under in the sunlit
   views (frontcorner −23, eastlawn −29, sala −17, west −13, path −12, pool −11, rearcorner −14, home −7,
   colonnade −4) and 15 to 24 over in the two shaded ones (rear +24, westwall +18). It still has no ground
   bounce, which is what fault 4 is about.
8. **Tools.** `tools/stats.js` now weighs the lit band on its own and `describe()` prints `>200 … >230 …
   ceiling … lit <colour> s<spread>`, so any `lights.js` run says whether a change opened the top of the
   picture or merely darkened it; `tools/scan_old_new.js` gained a column for the same thing; two plans are
   new — `tools/shoulder.json` (the tone-curve sweep, with the refused pulls in it) and
   `tools/distance.json` (the far ladder, before and after).
9. The walk is the walk it was: **607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable from
   the start, no stumbles**, and `standup.js` runs the render loop clean.

## What was done this session (fifteenth, 2026-10-14 into the 15th) — the far tree line came off the sky

The browser was in the room and healthy, so everything below is a colour a renderer painted. One fault,
the second on the standing list, and it turned out to be two faults wearing one coat.

1. **How bad it was, measured.** In the `path` view the far tree line read **(203,207,195) at 117 m**,
   while the sky one arm's-width above it read (103,142,154): the thing that is supposed to recede into
   the sky was sixty-eight points brighter than the sky, and flat — down a column of the old picture,
   sampled every third pixel across the band, the red never left 201-207, which is not a wood, it is a
   board.
2. **The bytes were being read as light, and that was most of those seventy points.** `mats.farTree` had
   `[58,78,74]` set straight on `albedoColor`, the same mistake the fourteenth session found in the pots
   and the deck chairs and deliberately left in the two far greens. Three cases in one browser said it
   plainly: painting the bytes alone brought the band from (203,207,195) to (124,140,130); painting them
   and setting them as the thing's own light gave (121,136,131); painting them and taking the fog off the
   mesh gave (134,155,135). Every one landed within thirteen points of every other, and all three are a
   long way under 203, so it was the albedo doing the blowing and not the haze. `mats.hill` had the same
   disease and is painted too.
3. **A flat colour cannot be a wood, so the far things got a pattern of their own.** New
   `distanceCanvas` in `src/textures.js`: broad masses (which part of the far wood is nearer, which is a
   clearing) under a fine speckle (one tree top against the next), and **painted grey on purpose** — the
   colour is the material's business and a colour painted twice is counted twice. `farTree` is now
   `paint([66,88,84])` under that pattern and `hill` is `paint([84,100,84])` under a slower copy of it.
   Both byte sets are lifted over the measured green to pay for the light the pattern does not give back:
   the canopy pattern's own mean is (217,220,222) in bytes, which is 0.71 in light, and the hill pattern's
   is (227,230,232), which is 0.79; raise the bytes by the reciprocal and the product comes back to
   (57,76,72) and (76,90,76) — the greens the CPU drawing has always used for them, [58,78,74] and
   [74,88,72] in `src/surface-colours.js`, to within a byte or two. That is why nothing in the drawing
   needed changing, and how it happens that the two now agree on the band measured rather than by luck: at
   the band the drawing paints (122,131,134) where the browser paints (118,134,127).
4. **What the distance reads now** — the same pixel of the kept pictures, before (`07x`, `079`) and after
   (`08x`, `09x`), a 9x9 mean, because the picture has grain in it:

   | where the eye lands | which way it looks | how far off | before | after |
   | --- | --- | --- | --- | --- |
   | sky just over the band (path view) | north-north-west | 500 m | 103,142,154 | 103,142,154 |
   | the band, middle (path view) | north-north-west | 117 m | **203,207,195** | **117,133,126** |
   | the band, lower edge (path view) | north-north-west | 114 m | 202,207,194 | 114,130,123 |
   | the band (west view) | east, side-on to the sun | 139 m | 106,122,128 | 95,106,110 |
   | the band (eastlawn view) | west, side-on to the sun | 128 m | 113,129,134 | 95,107,110 |
   | a hill | north-west | 206-264 m | never measured, see below | 129,138,142 |
   | jungle, far rank (path view) | north-north-west | 86 m | 87,104,63 | 87,104,63 — not touched |
   | jungle, near rank (path view) | north-north-west | 45 m | 136,170,72 | 136,170,72 — not touched |

   Note which view blew and which did not, because it says what the fault was. Looking north-north-west —
   that is, looking *at the sunlit sides* of things, the sun being behind the visitor — the old band was
   203 against a 103 sky. Looking east or west, where you see the flanks instead, the same material was
   only 106-113. A diffuse surface lit by one lamp, blowing out on its lit side and not on its flank: that
   is an albedo, not a haze.

   The ladder is a ladder now: green at 45 m, cooler green at 86 m, a cool grey-green band at 117 m that
   sits a little under the sky and has a light side and a dark side to it, and the hills behind it paler
   still. The hills were measured from 90 m up with `float=1` (`tools/horizon.json`), and that is the
   honest state of that row: nobody had ever said what colour the hills are, because from the ground they
   hide — their tops are lower than the tree line's, so they show only where the tree line has a gap. They
   read (129-137, 137-144, 140-143) — haze, as hills should be.
5. **What did not move, and why that is not a contradiction.** The fourteen standing views came out at
   the same luminance to within one point and the start view's cells agree to a tenth of a point
   (`compare.js 070-home 084-home`: mean gap 0.1 of 255) — the far line is under 1% of any of those
   frames. The fault was never in the frame average; it was in one thin strip that a visitor looks
   straight at. Nothing blows out or blacks out anywhere, and the walk is the same walk: **607 meshes,
   30 floors, 83 blockers, 81.8% of the garden reachable from the start, no stumbles.** `standup.js`
   and `shadows.js` are clean (37 textures now, two of them new).
6. **The garden the master complained of is grass, and opaque — at a distance and underfoot.** `EDICT.md`
   still carries the note that the garden has no texture and is translucent; that was the twelfth session's
   `sideOrientation` fix and it holds. This session's pictures paint the lawn (174,198,106) with a spread
   from (135,163,87) to (197,213,118), the east lawn view is 95% in colour with ground (136,162,75) in it,
   and standing on the west lawn and looking down at it five paces off, the frame is 100% lawn at
   (126,157,73) and runs from (26,29,16) in a patch of shade to (236,240,181) where the sun is on it. So
   the claim is measured here and not just inherited.

**Pictures**: `pictures/084-home` … `097-westwall` are this session's fourteen standing views, and
`pictures/drawn-*.png` were redrawn to match. `node tools/scan_old_new.js 070 084` prints the
before-and-after table.

**Still there, and now seen clearly.** The far line's *sun-facing crowns* still come out as bright as
(241,199,147) at 120 m — the same patch read (254,209,150) before a material four times darker was put
on it, so that is the bright-end floor (fault 1) and not the material. And standing on the south lawn
looking south-east, the near belt is backlit and reads (16,37,17): a dark green, but not far off fault
3's soot. Both are the sun and the shade, not the paint.

## What was done this session (fourteenth, 2026-10-14) — the bloom was a fog, the teak was wearing a mirror, and the props were painted in the wrong colour space

The browser was in the room (2008 of 2048 slots free), so everything below was photographed in Chromium
and no number here comes from the CPU drawing. Three faults, all of them in the standing list, and all
three found by asking the same question of a browser: *what does this one surface actually come out as?*

1. **The bloom was laying a fog over the sunlit half of the Villa, and that was the "sunlit teak clips"
   fault all the way down.** `bloomThreshold` stood at 1.0, which in this scene is no threshold at all:
   run a sunlit plaster fascia — (237,212,188) on the screen — back through `tools/backlight.js` and it
   says the light behind it is 2.4. Every lit surface in the Villa was over the threshold and spilling,
   and `bloomKernel` 96 smeared that spill across the whole frame. Proof, not theory: the same camera
   photographed with the bloom on and off (`pictures/tmp/sweep2/`), weighed cell by cell with
   `tools/compare.js`, puts **17 to 31
   points of light it had not earned** on every cell across the front of the house (cell 2,1 (218,189,148)
   with it, (177,158,126) without) and 7 points on the frame as a whole. Raising the threshold to 2.2
   took a point off, which says the blooming values are between 2.2 and 10, not just over 1.
   So: threshold 1.6, weight 0.2 → 0.14, kernel 96 → 40. A bright thing keeps a halo and the frame stops
   fogging. Photographed again, all fourteen views came down 1-8 points (`node tools/scan_old_new.js 042
   070` prints the table) and none of them blew out or went black anywhere.
   - The pool paid sixteen points for this — bloom had been lighting it — so `mats.water.emissiveColor`
     went (0.42,1.2,1.05) → (0.5,1.38,1.21) and the `pool` view's water is back to (114,155,160) against
     the target of (110,149,154). Not further: at (139,164,168) the notes call it a bucket of milk.
   - The shade had been eating some of that fog too, so the sky fill went 6.5 → 6.8 and the bounce 4 → 6,
     which brings the north face back to L67 from 65 and the west wall to L87 with their colour (61% and
     41% of the frame) nearly intact. Sky fill alone, at 7.2 with the bounce left at 4, measured greyer:
     60% and 40%. That is why the bounce moved too.
2. **Sunlit teak was a sheen, not an albedo, and this is the fault the thirteenth session could not move
   with six attempts.** The sun stands behind the visitor, so a board turned square to it mirrors the sun
   into the eye, and `mats.teak` at roughness 0.42 and `teakWall` at 0.5 let all of it through. Both are
   0.75 now, which is also the truth about weathered outdoor teak: the front post in the colonnade went
   from (254,228,174) to (245,190,111), the terrace floor from (195,148,104) to (212,149,88) — brown, with
   grain in it — and the shaded back door moved from (52,30,16) to (49,29,16), so nothing in the shade
   went dark. `mats.wood`, which is the deck chairs, went 0.55 → 0.72 for the same reason. Note what was
   *not* the answer: the sun's own `specular` down to zero changed nothing at all (a PBR material in
   physical lighting mode does not read it), and neither did `environmentIntensity` on the wood (the deck
   moves 8 points, the post not one).
3. **Every material with no pattern on it was about twice as bright as it should be, and had been since
   the beginning.** `albedoColor` is read as raw light; a canvas pattern is decoded out of sRGB into
   light, and a colour set straight on the material skips that step. So the terracotta pot by the steps,
   [176,118,78], painted (253,246,235) — white, no clay in it at all — and the deck chairs, [150,104,62],
   painted (250,238,217). `src/materials.js` has a `paint()` now, which does the same conversion a
   pattern gets, and it is applied to the things with no pattern: pot, wood, stone, soil, the three
   cheeses, the fruit, the grapes, brass, darkMetal. Measured after: the pot (222,169,113), a chair
   (247,213,156), a stone post foot (240,225,204), and in the sala view the cheese wedge (214,187,111),
   the pale wheel (234,223,200) and the blue round (194,208,202) — a board of cheese and not a board of
   lamps. Left alone deliberately: the byte colours that *multiply* a pattern (paving, coping) and the
   far greens (`jungle`, `jungleFar`, `farTree`, `hill`), all of which were fitted to browser pictures
   with the multipliers where they were. Moving a multiplier and a pattern together tells you nothing.
4. **Two tool fixes.** `tools/cover.js` now prints, for every material in the frame, its darkest and its
   brightest pixel and where they sit: a surface that is half blown and half shaded cannot be told from a
   flat one by its mean, and that is exactly the shape of fault 1 and 2. And `tools/cameras.txt` described
   the yaw backwards — yaw 0 looks south, not north — which would have cost the next session a confused
   hour.

The walk is untouched, as it should be: **607 meshes, 30 floors, 83 blockers, 81.8% of the garden
reachable from the start, no stumbles.** `node tools/standup.js` and `node tools/shadows.js` are clean.
The CPU drawing came closer to the browser by itself, because it never had the fog: `drawn-home` is 12
points under the photographed start view and `drawn-colonnade` 7, against 15-32 and 22 last session.

What the start view's materials read, before → after (`tools/cover.js`, mean of the material's own pixels):
teakWall (209,150,93) → (215,151,83), teak (186,136,94) → (219,154,88), roof (179,100,66) → (169,87,58),
pot (237,218,194) → (222,169,113), stone (246,239,232) → (240,225,204), water (113,150,153) →
(115,153,157), wire (161,138,93) → (127,112,72), coping (200,188,164) → (198,187,164) — unchanged, as it
should be: that one really is that bright.

## What was done this session (thirteenth, 2026-10-14) — the shaded side of the house got light, and the reflection cube stopped lying

The browser was in the room again (2009 of 2048 slots free), so this session was spent looking, not
guessing. The Villa's front was bright and colourful and the back of it was near black: the standing
rear view read L54 with 33% of its pixels at the dark end. Four things were wrong and all four were
measured before and after.

1. **The reflection cube was photographed from the walking camera, so it changed when the visitor
   looked around.** `src/main.js` made the sky cube with no camera of its own and let it refresh once,
   which meant the cube kept whatever sky the camera happened to be facing when the first frame went
   round: a `?view=` url (camera set before the first frame) and a scripted camera move (set after it)
   gave different reflections in the same wall. Measured on the rear view's back wall: (117,109,92)
   one way, (141,129,108) the other, same surface, same light. There is now a `skyCamera` that exists
   only to photograph the sky — parked at the start place, facing straight ahead, `refreshRate` set so
   it is rendered once, by hand, before anything else. Both ways of moving the camera now read the same
   wall to within one byte.
2. **`scene.environmentIntensity` came down from 0.5 to 0.4.** The cube now holds a real sun, so at the
   full strength it poured grey over everything. Measured: the shaded back wall (140,130,109) at 0.5
   against (129,120,101) at 0.4, and the pool — which is the one surface that is a mirror — (139,164,168),
   a bucket of milk, against (110,149,154), a sunlit tropical pool. `mats.water.environmentIntensity`
   does nothing while `disableLighting` is on, and setting it to 0 left the water within a point of
   what it was, so the pool can only be balanced against the rest of the scene in `src/main.js`.
3. **The sky fill and the bounce were turned up** (`src/world.js`): hemisphere 4 → 6.5, bounce 1.6 → 4
   and its colour changed from a cool blue (0.45,0.6,0.85) to a warm (0.62,0.5,0.36), because what
   stands behind a visitor on the north lawn is sunlit paving, not sky.
4. **The vignette was eating the picture.** It stood at `vignetteWeight 2.6` with no stretch and a black
   edge colour, which measured as 12 luminance points off the rear view and half of its colour:
   with it on the frame read L44 and 29% in colour, with it off L56 and 62%. It is now weight 1.2,
   stretch 0.35, edge colour (0.13,0.10,0.08) — still a frame, no longer a curtain. `tools/draw.js`
   follows the same numbers.

And a small thing that was on the fault list: **the ridge is tiled now.** `ridgeCap` and `salaRidge` wore
`plasterDark` and came out as a pale sand strip along the top of orange tiles; they wear `mats.roof`
with their UVs scaled to the roof's own tile pitch (7.5/17.6 of the roof's width, 0.42/11.2 of its
depth), so the tiles on the cap are the same 0.28 m as the tiles on the slope. From the start view the
ridge reads (129,54,37) against the slope's (176,81,55) — a ridge in its own shade, the right way round.

### What the fourteen standing pictures said

Old set 025-038 against the new set 042-055, whole frame, in `tools/scan_old_new.js`'s words
(luminance, then how much of the frame is white / black / in colour / at the bright end / at the dark end):

| view | luminance | in colour % | dark end % |
|---|---|---|---|
| home | 118 → 146 | 87.5 → 91.3 | 2.2 → 0.6 |
| rear | 54 → 66 | 66.9 → 75.3 | 33.3 → 22.5 |
| rearup | 135 → 120 | 81.0 → 79.8 | 12.1 → 13.9 |
| rearcorner | 100 → 116 | 67.8 → 72.0 | 12.2 → 5.2 |
| sala | 105 → 126 | 76.5 → 82.7 | 11.1 → 1.5 |
| path | 118 → 140 | 88.2 → 88.3 | 4.0 → 1.8 |
| west | 120 → 140 | 74.3 → 77.4 | 4.0 → 0.9 |
| pool | 129 → 138 | 46.0 → 60.7 | 9.3 → 1.8 |
| westlawn | 111 → 129 | 73.1 → 78.1 | 9.1 → 1.3 |
| eastlawn | 122 → 143 | 90.3 → 95.8 | 3.2 → 0.7 |
| colonnade | 111 → 137 | 71.6 → 83.8 | 5.1 → 1.0 |
| frontcorner | 106 → 132 | 70.1 → 86.8 | 12.0 → 0.6 |
| salaroof | 104 → 121 | 70.6 → 77.4 | 10.0 → 2.3 |
| westwall | 64 → 86 | 26.1 → 52.2 | 27.1 → 15.1 |

Every view but `rearup` came up (the rear wall of the house went from (98,92,78) to (129,120,101), and
the west wall from (77,72,60) to (127,118,98)); nothing went past (250,235,205) where the old numbers
had left the coping at (238,228,213) — it is now (243,235,222), which is the one number to watch; and
no frame has any pure black left. `rearup` fell 15 points, which is the honest price of the fixed cube:
before, the cube in that upward view held a sun that was not where it should be.

Things tried and refused, with the numbers:

- **sun 60 → 50 → 42**: the sunlit teak post stays clipped (252,213,146 → 246,195,119) while the roof
  tiles go dull (175,81,55 → 155,70,49) and the sunlit lawn goes from (126,160,67) to (105,141,53).
  The teak is clipped by the sun's diffuse term, not its specular — `light.specular` down to 0.15 moved
  it not at all (`usePhysicalLightingMode` swallows that knob, as other knobs have been swallowed before).
- **exposure 0.88 → 0.82 → 0.76**: buys back the bright end by taking the shade straight back down (rear
  L66 → 59, in colour 64% → 48%). Refused.
- **`scene.environmentIntensity` between 0.2 and 0.5**: 0.4 is where the shade keeps a floor and the
  pool stays a pool.

### Tools

- `tools/lights.js` grew `--pick "name:fx,fy;..."` and a per-view `picks` list: for each named pixel it
  prints the mean colour of a 9x9 box, the mesh and material there, the distance, the world place and the
  face normal — the same surface can now be followed through a whole plan of cases. Its `js` cases can now
  reach `pipeline`, `ground`, `walk`, `scene` and the three lights by name, and each view's `fov` from
  `tools/cameras.txt` is respected, so a narrow view is measured narrow.
- **`tools/scan_old_new.js 025 042`** — the table above, printed. Reads `tools/cameras.txt` for the names.
- `tools/photos.sh --from 042` numbered its pictures as octal (`--from 042` made 034). The zeros come off
  plainly now.
- `tools/lights.js`, `tools/look.js` and `tools/cover.js` all report a picked pixel's normal with
  `hit.getNormal(true)`, which returns the **vertex** normal, and on a `poly()` mesh that can point into
  the solid. It is the tool that is wrong, not the Villa: the roof's own normals were read straight out of
  the vertex buffer and are all up and out (-0.15,0.95,-0.29 and its three sisters). Use
  `hit.getNormal(true, false)` for a face normal. Do not "fix" a roof on a `getNormal(true)` reading.

### Where the CPU drawing stands against the browser now

Redrawn with the new vignette and the auto-scaled gains, against the new browser pictures (whole-frame
luminance gap, drawing minus browser): `home` +15, `rear` −22, `rearup` −6, `rearcorner` +17, `sala` +24,
`path` +20, `west` +20, `pool` +20, `westlawn` +11, `eastlawn` +32, `colonnade` +18, `frontcorner` +30,
`salaroof` +19, `westwall` −12.

The drawing is short of range, not short of light: its sunlit views are 15-32 under and its shaded views
12-22 over. `--hemiGain` was swept to find out if one number could do it (0.55 as shipped, 0.9, 1.3): at
1.3 the sunlit views come level (`home` +4, `sala` +8, `west` +9) and the shaded ones fall over (`rear`
−45, `westwall` −35). So no single gain will do it; what is missing is a term that lights horizontal
surfaces from the sky and leaves a shaded vertical wall alone, which is the ground-bounce job in item 2
of the fault list.

### What the next session should do

The Villa itself is in good order and released as **v0.9.0**; the browser is in the room, so spend the
while it is here on things that need eyes. In order: the ground-bounce term in `tools/draw.js` (fault 1 —
it is the one place where a change can be checked, since `tools/scan_old_new.js` and
`tools/compare.js` now both weigh a drawing against a browser picture), then the sunlit teak (fault 2),
then the pool you can wade (fault 3, which is walk work and needs no eyes at all). The numbers for all
three are in the fault list; none of them needs a new instrument.

## What was done this session (twelfth, 2026-10-14) — the garden faces up, and a browser looked at all of it

**The browser came back.** `tools/headroom.js` said 2009 of 2048 slots free at the start of this session —
a fresh sandbox, no corpses. Everything below was measured in Chromium, which has not been possible since
the third session. If the next sandbox is dead again, at least the pictures in `pictures/025-…038-` are
real ones now.

The master's edict was one line: *"The garden has no texture, and is fully translucent. I suggest adding
some grass, dirt, or whatever you were intending to put around the terrace."* He was right, and he was
looking at what he always looks at — a release. The fix was already sitting in the working tree, made by
the eleventh session and never written down or released, so no version in the menu had it.

1. **The whole garden was wound facing the middle of the earth.** `groundPlane` built its planes
   `sideOrientation: Mesh.BACKSIDE`, which with `rotation.x = +PI/2` points the one face of each of the
   four lawn strips downward. A renderer draws only the front of a face, so Chromium was not drawing the
   lawn at all: what survived in the picture was an unlit remnant. Measured on the released v0.7.3, at
   `-20,1.6,10,1.57,-0.02`, the lawn painted **(129,130,130)** — grey, no grass in it — and the whole
   view stood at 56.6% in colour. `FRONTSIDE` is how the engine lays a ground plane itself; the same
   winding now throws a shadow-casting check and the lawn paints **(123,151,67)** and the view reads
   70.9% in colour. The same fault was in the main soffit and the sala's (facing up into the roof instead
   of down at the garden: the roof was a shell you could see through from underneath) and in both pool
   caustics sheets (facing the pool floor, so nobody standing on the coping could ever have seen them).
   `tools/draw.js` missed it for nine sessions because it lit both faces of everything; it now throws
   away the faces that point away, the way a renderer does, and names any mesh left with nothing to show.
2. **Grass, and dirt, as asked for.** The old pattern was speckle with no scale — 32 cells of green across
   one nine-metre tile, which mipmaps into one flat green sheet at any distance. One tile is six metres
   now: mown bands a metre across, six to a tile; bare laterite patches a metre and a half across where
   the grass thins, with grit in them so dirt is not one flat brown; three-metre patches of light and
   shade; blades for when you stand on it. `groundUVs` lays the pattern from where the lawn actually lies,
   so the bands run straight across all four strips instead of starting again at every join. Measured in
   Chromium looking down at the lawn (`pictures/039-garden-close.png`): **86% grass, 10.8% dirt at
   (139,113,75)**, from (31,52,22) in shade to (77,116,33) in the sun.
3. **Fourteen standing cameras photographed for the first time** — `pictures/025-home` … `038-westwall`,
   with `tools/photos.sh` and the shared camera list. The Villa stands up clean: 608 meshes, 5 lights,
   41 materials, 35 textures, no page error, 3-5 fps in software WebGL. Nothing blows out and nothing
   blacks out in any of the fourteen; the worst is `032-pool` at 2.5% white, which is sun glitter on
   water. New `tools/cover.js` says what each frame is made of and what colour each material was painted
   in — the numbers below are all from it.
4. **Questions the fault list said only a browser could answer, now answered.**
   - *Is the new pool water a glowing cocktail bar?* No. In the start view the water reads **(46,112,119)**
     against the coping beside it at **(167,152,127)** and the paving at (127,99,70): the water is clearly
     the darkest large thing in its own band of the picture, which is what a pool in this sun does, and the
     emissive lift of the ninth session can stand.
   - *Is the room behind the glass too bright?* No, and it is not cool either: the glass reads **(118,97,75)**
     against the sunlit teak mullion at (197,136,82) — a warm room, darker than the timber, as the eighth
     session argued it should be from the geometry of the eave's shadow.
   - *Does the jungle belt read as a wood or as a wall?* From the west camera: hedge (66,85,43) at 30 m →
     near rank (49,63,40) at 36 m → far tree line (120,128,125) at 165 m, with the sky down to 26.8% of the
     frame. Three steps, each cooler and hazier than the one in front. It reads as distance, not as a fence.
   - *Does film grain do anything?* Yes. The same flat west wall, loaded twice, differs by 1.35 of 255 per
     pixel (worst pixel 65) because `grain.animated` is on. The CPU drawing has no grain at all, which is
     part of why it looks dead next to a browser picture.
   - *Does the walk survive 4 fps with the real camera?* Yes, and it agrees with `tools/feet.js` to the
     centimetre: `node tools/look.js ... --keys KeyW:4000` ends at (1.12, 1.83, 7.1) — feet on the coping
     at 0.23, 3.4 m north of the start, which is what the Node tool predicted (3.35 m, stopping at 0.23).
5. **Two small tool things.** `?fov=0.45` narrows the browser's eye so a photograph can be made of the
   same slice of the Villa a drawing takes (the two narrow cameras in `cameras.txt` need it). And
   `tools/look.js` now accepts its picture as the first argument without eating it as a url, which is what
   its own header always claimed it did.

### What the drawing gets wrong, now that there is a browser to weigh it against

Same cameras, same order, browser on the left. The gap is luminance points the drawing is short:

| view | browser L | drawing L | gap | | view | browser L | drawing L | gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 118 | 110 | -8 | | westlawn | 111 | 97 | -13 |
| rear | 54 | 57 | +3 | | eastlawn | 122 | 91 | -31 |
| rearup | 135 | 99 | -36 | | colonnade | 111 | 97 | -14 |
| rearcorner | 100 | 75 | -25 | | frontcorner | 106 | 81 | -25 |
| sala | 105 | 80 | -25 | | salaroof | 104 | 81 | -23 |
| path | 118 | 99 | -18 | | westwall | 64 | 65 | +2 |
| west | 120 | 99 | -21 | | pool | 129 | 98 | -32 |

Read this carefully, because it is a trap for the next session: **the drawing is dark wherever the frame is
sunlit ground and sky, and it agrees wherever the frame is a wall in the house's own shade.** It is not one
knob set wrong — `--hemiGain 0.85 --envFloor 0.12` puts westlawn exactly on the browser (gap 0) and pushes
rear to +28 and westwall to +26 at the same time. The term the drawing does not have at all is light coming
back off the ground, which is exactly what lights a sunlit lawn and a paving field. So: do not deepen a
colour because the drawing says it is dark. The drawing's sky band is also 9-16 points under the browser's
in every view, which is worth a look before `--skyGain` is trusted.

### Decided, and why

- **The dark block at the back stays as it is, for now, and here is the number that makes it arguable.**
  From the north lawn the service block paints **(11,11,11)** and the board band above the back wall
  (36,27,17), while the same `plasterDark` in full sun (the ridge cap) paints (180,138,93). That is a
  sun-to-shade ratio of about 16 to 1 in sRGB, which is too violent: it reads as a hole punched in the
  picture rather than as shade. But the cure is not the paint — `plasterDark`'s albedo (86,74,62) is
  already only about 7% reflectance, and lifting it moves the sunlit side towards white before it lifts a
  shadow at all (gamma eats the change: a +25% albedo moves (11,11,11) to about (14,14,14)). The cure is a
  floor under the shading — the environment cube at 0.5, or the hemisphere's ground colour, or both — and
  that changes every surface in the Villa at once. It wants doing on purpose, with the front views watched
  for blow-out, not slipped in beside a garden fix.
- **The ridge cap wears `plasterDark`, not the roof's tiles**, and in the start view it paints (180,138,93)
  — a pale sand ridge on top of orange tiles (175,93,58). It is a one-word change to `mats.roof`, and I did
  not make it: the tile pattern's repeat on a 0.42 m wide cap has to be looked at before it is believed,
  and this session's release is the garden.
- **`--hemiGain` and `--envFloor` were left alone in the drawing tool**, for the reason above.

## What the last browser pictures said (019-024, third session; no browser since)

`019-home` the start view · `020-rear` the villa from the north lawn · `021-sala` the sala from the
paving · `022-path` the villa from the south path · `023-west` east along the west paving ·
`024-terrace-pool` the pool from the terrace. (Views 013-018 of the second session are the same
scenes; nothing visual changed since.)

| view | mean rgb | L | blown | black | in colour | distinct |
| --- | --- | --- | --- | --- | --- | --- |
| home | 128,127,107 | 126 | 0.0% | 0.0% | 79% | ~3500 |
| rear | 91,97,92 | 95 | 0.0% | 0.0% | **4%** | ~1100 |
| sala | 120,122,106 | 120 | 0.0% | 0.0% | 78% | ~3600 |
| path | 127,123,102 | 122 | 0.4% | 0.4% | 82% | ~2900 |
| west | 133,136,121 | 134 | 0.0% | 0.0% | 71% | ~3500 |
| terrace→pool | 115,122,107 | 119 | 0.0% | 0.0% | 76% | ~3300 |

Light now: sun azimuth 160°, elevation 24°, sky luminance 0.22, turbidity 2, rayleigh 4, mie
0.002, sun 60, hemi 4, bounce 1.6, environment 0.5, exposure 0.88, bloom weight 0.2 at threshold
1.0, vignette weight 2.6 at stretch 0.2 toward (0.05,0.03,0.02), contrast 1.1. The drawn gains that
agree with it: sun 5.5, sky fill 0.55, bounce 0.6, dome floor 0.05, sky dome 1.15, bloom 0.2 at 0.5
after the tone mapping, and each material's own `emissiveColor` added to what it is lit by.

## What was done this session (third, 2026-10-14) — the walk, and nothing you can see

No picture could be taken (see above), so this session only touched things that cannot change a
pixel: where a visitor is stopped, and where their feet go.

1. **New tool `tools/feet.js`** (Node + NullEngine, no browser). It found four real faults below.
   `tools/headroom.js` was added with it, and look/walk/lights/tweak now call it before launching.
2. **The villa's front steps were unusable.** The pool's inner walls and floor were marked solid,
   so their bounding boxes stood as an invisible wall a third of a metre proud of the pit on every
   side — right where the front steps come down, and all round the coping. Those boxes are not
   solid now (`src/pool.js`); the pool says where a visitor may not walk through `pool.walkBlocks`,
   which is the pit less the strip the front steps come down through. The coping is now ground to
   stand on (top y 0.23, 9 cm above the paving), so walking the pool's perimeter no longer drops
   you 0.14 m into a hole.
3. **Small props are solid.** New `blocker()` in `src/mesh.js`: an invisible box, nothing to see,
   something to bump into. Added for the loungers, the side tables, the sala's low table, the bench,
   the railing (one box: seven posts would leave five gaps), the big pots and potted plants, the
   garden lamps, the boulders, and the foot of every palm. A palm's own meshes are still not solid:
   a merged trunk's box takes in the lean, and a crown is 5 m across.
4. **You could walk into the living room through a wall.** The teak panel that closes the front
   between the west wall and the glass had no collisions; it has them now, and a small invisible
   seal closes the 0.68 m gap where the glass stops short of the east wall. The room behind the
   glass is unreachable again — `feet.js` checks it.
5. **The sides of the terrace plinth are sealed** (two invisible blockers): it was walked up from
   the lawn anywhere along its long faces, half a metre in one stride. The deck now has one way up,
   the front steps, and `feet.js` confirms it is still reachable.

Measured after the changes: 84% of the garden reachable from the start; the water, the room and the
underwater steps all kept off; every named place stands at the height expected.

## What was done this session (fourth, 2026-10-14) — eyes without a browser, the walkway, and the back of the house

Still no Chromium (2003 of 2048 task slots gone, 1963 of them corpses; `screenshot` dumps core). So
this session built a way of *seeing* that needs no browser, then fixed what it showed.

1. **New tool `tools/draw.js`** — a CPU picture of the Villa (see "How to look at it"). Six views are
   kept as `pictures/drawn-*.png`. It found the faults below, and it is what the numbers quoted here
   come from. Two Babylon/graphics gotchas it hit, both worth remembering:
   - meshes under the Null engine expose their vertices only through `getVerticesData(VertexBuffer.…)`
     and `getIndices()` — there is no `mesh.positions` and no `getGeometry()`;
   - light colours (`sunLight.diffuse`, `fogColor`) are already linear: passing them through a
     sRGB→linear conversion made the sun orange and the shade navy.
2. **The front steps hung over the water** (fault 3 of the last list). The pool now spans **z 2.1..7.1**
   (was 1.2..6.2) and the paving has a **walkway strip between the terrace and the pool**, so the
   steps (tops 0.41 and 0.27) land on paving, not on the coping or the water. The loungers, side
   tables and the fruit platter moved south with the water (z 8.8); the great pots and the potted
   plants moved off the coping to either side of the steps.
3. **The sala can no longer be walked up from anywhere** (fault 4): its base is sealed on all four
   faces with invisible blockers and its west steps — rebuilt as two treads of 17 cm each, in the
   middle of that face — are the only way up. The terrace's north face and corners are sealed too.
   `feet.js` now reports **no stumbles at all**: nowhere in the garden does free ground jump more than
   0.42 m over half a metre. 82% of the garden is reachable; the water, the room behind the glass and
   the underwater steps are still kept off.
4. **The back of the house got something to say** (fault 1). It had been worse than the picture said:
   the villa's walls stand at y 0.5 and the lawn behind it is at 0, so the whole north face **floated
   half a metre above the grass**. Now:
   - a **plinth runs on behind the glass** (`backPlinth`, dark plaster, top 0.5) so the house stands on
     something and the plaster meets the lawn on a dark band — a shadow gap, not a floating box;
   - a **band of dark teak boards** along the north wall under the eaves, a **boarded door** with jambs
     and a head, and **two lanterns** (dark metal and lamp glow) beside it, so the shade has a line,
     an edge and two warm points in it;
   - the north lawn is **planted along the wall**: six shrubs, two bananas at the corners, a palm off
     each end.
   The drawn rear view went from one grey sheet to eight surfaces: plaster 31%, lawn 24%, teak boards
   16%, hedge 14%, dark plinth 11%, teak door 4%, and the lanterns and their caps.
5. **The water is drawn as the material makes it** — `SURFACES.water` now carries the turquoise of
   `poolWaterCanvas` and is treated as self-lit (`disableLighting` in `materials.js`), and the caustics
   net is thin streaks that are also its own see-through. Before that the pool drew as a blown white
   sheet in every drawn picture.

### What the drawn pictures said then

The gains then (sun 1.0, sky fill 0.3, bounce 0.35, floor 0.035) were dialled under a broken tone
curve and were replaced in the fifth session. Coverage is what that session was working from, and it
is still right: the plaster, lawn, boards, hedge and plinth are the whole rear view; the front steps
land on paving; the sala reads from the paving.

The gains were dialled against the browser's own pictures: sunlit paving ~117, shaded plaster ~95.
They land close on the sunlit side (drawn-home L138 against the browser's L126) and too dark on the
shaded side (drawn-rear L73 against L95) — the drawing has neither bloom nor bounced light, so a
dark corner in it can be perfectly readable in the Villa. Believe it about shape and coverage; do not
believe it about shade depth. Corrected view list for `--view`, since the notes had one wrong:
home `2.4,1.74,10.5,3.2,0.06` · rear `0,1.6,-19,0,0.06` · sala `3.5,1.6,11,2.25,-0.02` · path
`-3,1.7,19,2.9,0.02` · west `-11,1.7,6.8,1.57,-0.02` (the notes said yaw -1.3, which looks at the
hedge) · pool `0,2.1,-1.5,0,0.1`.

## What was done this session (fifth, 2026-10-14) — the drawing had no colour, and the Villa's sunlit walls had none either

Still no Chromium: 16 of 2048 process slots free, 1994 of them corpses of old runs. Both `screenshot`
and `chromium --single-process` die with `pthread_create: Resource temporarily unavailable`. So this
session is drawing-tool work plus one Villa change, all of it measured with drawn pictures.

1. **The drawer was applying the ACES matrix one channel at a time, which drains colour out of
   everything.** A sky of (0.14,0.26,0.55) came out 125,158,202 — a washed lilac — terracotta came
   out biscuit, and every drawn picture read cream: the start view was "in colour 36%" where the
   browser's is 79%. `tools/draw.js` now runs the browser's own chain, read out of the library:
   exposure → the ACES input matrix across the whole colour → Babylon's RRT/ODT fit
   (`v(v+0.0245786)-0.000090537` over `v(0.983729v+0.432951)+0.238081`) → the ACES **output** matrix
   (the drawer had the XYZ-to-sRGB one there, which is not the same matrix) → sRGB → then the
   contrast, which the library does in encoded values as a nudge toward `x*x*(3-2x)`. The start view
   is now "in colour 76%" and its whole-frame luminance is 126 against the browser's 126.
2. **New `tools/backlight.js`** runs those steps backwards, so a byte a browser picture showed
   becomes the light that must have made it. Every number quoted below went through it. (It must
   invert *both* matrices, not just the input one; inverting only the input gave light that was not
   the colour it claims to be — caught by pushing each answer back through the forward chain.)
3. **New `tools/compare.js`**: two pictures of one view, cell by cell, with the gap in numbers and
   the ten cells furthest apart. That is how the drawing was calibrated and how it will be checked
   again when a browser works.
4. **The drawer's light, sky and water were re-dialled against the browser pictures** — the old gains
   were dialled under the broken curve and were worthless. Now: sunGain 5.5, sky fill 0.55,
   bounce 0.6, dome floor 0.05. The sky is four measured bands (high and low, on the sun's side and
   off it) mixed by height and by how near the sun you are looking, instead of a guessed two-colour
   gradient: anti-sun 24° up is light (0.12,0.29,0.36), 70° round toward the sun at the same height
   (0.21,0.51,0.64), at the horizon (0.45,0.70,0.60). The water stand-in is the browser's deep teal
   — light (0.07,0.27,0.29), which comes out (34,102,114) — not the canvas's turquoise.
   `src/surface-colours.js` now says in its header that its numbers are what a browser picture
   showed, not what the canvas is painted, because the material's own colour and roughness sit
   between the two.
5. **The drawer has bloom now** (weight 0.2, threshold 0.5 taken after the tone mapping, two widths
   of blur) and prints how much of a picture blew out to white. Measured, it lifts about 1 L off the
   whole frame: it was NOT what made the drawn shade darker than the browser's, so it is left small.
   `--bloom 0` turns it off, `--bloomThreshold` moves it.
6. **The drawing now runs the browser's vignette, with the library's own numbers instead of a guess
   of my own.** `src/main.js` asks for weight 2.6, stretch 0.2 and a near-black colour, and the
   library works it in raw light after the exposure and before the tone mapping: take the pixel's
   place in the frame from -1 to 1, scale it by a half-width and half-height that come from a field of
   view of 0.5 and the shape of the picture, mix each toward their own geometric mean by the stretch,
   square them, add one (the third axis of that vector is 1, which is what keeps the middle of the
   frame whole), raise it to minus twice the weight, and mix the answer between the dark colour and no
   change at all. At the corner of a 16:9 frame that leaves about a third of the light. Measured
   against the browser at the same pixel of the start view: the sky in a corner goes from (83,115,130)
   to (47,70,80) against the browser's (47,75,89), and in another view, where the browser's sky is
   half as much light 300 px off the middle as it is at the middle, the library's maths says 0.50 and
   the browser measured between 0.40 and 0.50. `--vignette 0` turns it off, and
   `--vignetteStretch`, `--vignetteFov` are there if the Villa's settings change.
7. **The sky was still about a quarter too dark.** That only shows once the vignette is right, because
   most of the calibration was done near the middle of the frame where the vignette does nothing, and
   then it was compared over whole frames. `skyGain` is now 1.15, and with it the sky in the sala view
   reads (66,108,128) and (52,87,104) where the browser reads (67,111,137) and (53,92,115); in the
   path view (69,107,127) against (70,113,135). The west view, which looks toward the sun, is still a
   little short there.
8. **The drawing ignored every material's own light.** `materials.js` gives the leaves, the fronds and
   the hedge a little `emissiveColor` so a backlit leaf stays a green leaf, and the engine adds that
   to whatever the sun and the sky manage; the drawing only ever used `glow` for lamp glass and the
   pool. Now a lit surface gets its `glow` added too, and the hedge stand-in has the hedge's own
   (0.05,0.075,0.03) written down. Measured: a shaded shrub in the rear view goes from (30,43,34) to
   (58,77,51) against the browser's (55,66,67) at the same pixel, and the browser's own shaded leaf
   measures (61,78,39) - about what 0.08 of green comes to after the tone mapping. This lifted every
   one of the six views 3 to 9 points nearer the browser.
9. **The Villa change: the plaster is deeper and warmer.** The browser's own start view had 4.1% of
   its pixels blown to (253,249,243) and worse — the villa's south face and its fascia, with the
   trowel sweeps and the grain crushed flat out of them. `plasterCanvas` goes from (224,212,190) to
   (204,182,152), and `src/surface-colours.js` went with it. Measured in the drawer: the shaded back
   wall goes from (126,124,132) to (113,103,101) against the browser's (96,95,86) to (121,126,119),
   so the shade stays about where it was and stops going blue, while the sunlit fascia comes down
   from (241,224,219). **This one change has not been seen by a browser.** If the walls come out
   murky, walk the base back toward (214,196,170).

### What the drawn pictures say now, and how far they are from the last browser ones

| view | drawn mean rgb | L | browser L | gap | drawn in colour |
| --- | --- | --- | --- | --- | --- |
| drawn-home | 105,112,104 | 110 | 126 | -16 | 71% |
| drawn-rear | 56,56,50 | 56 | 95 | -39 | 0.1% |
| drawn-sala | 92,94,84 | 93 | 121 | -28 | 58% |
| drawn-path | 111,105,94 | 105 | 123 | -17 | 78% |
| drawn-west | 96,110,104 | 106 | 135 | -28 | 63% |
| drawn-pool | 84,112,108 | 106 | 119 | -13 | 66% |

Those gaps are the browser pictures being of the older garden, not the light being wrong. Per
surface, with `--pick` on one and `--at` on the other, they agree: sunlit paver (134,108,93) against
(133,104,74); roof (170,58,50) against (166,71,45); water (0,98,113) against (0,77,93); shaded back
wall (113,103,101) against (118,118,108); shaded lawn (47,62,51) against (43,53,54); shaded shrub
(58,77,51) against (55,66,67); sky in a corner (47,70,80) against (47,75,89). The frame gaps come from
places the Villa has changed since those pictures: the shrubs planted on the west and south borders
stand where 023-west showed sunlit paving; in the rear view the whole bottom of the frame, which the
browser shows as a pale band at (192,191,191), is lawn now, and the top of the frame, which the
browser shows as sky, is the dark board band and the dark service block that v0.3.0 put there - the
single darkest cell of the drawn rear is the back band at (26,17,14), and its opposite in the browser
is sky. Do not read a whole-frame gap as a light fault; check the surface with `--pick`.

## What was done this session (tenth, 2026-10-14) — the Villa would not stand up in a real browser, and now it will

**The owner's own Chromium, on Win11, said:** *"The Villa did not stand up: e.getChildMeshes is not a
function or its return value is not iterable"* and drew nothing. That is the first time a browser has
tried the Villa since the third session, so everything built since — the horizon, the windows cut into
the side walls, the teak, the pool's new colour — has never been seen by a renderer at all.

Still no browser here: `tools/headroom.js` says **6 of 2048 slots free** (2036 corpses of old runs).

1. **The fault: eleven wall pieces were handed to the shadow lamp as two entries.** `wallWithOpenings`
   returns an array of its pieces — seven for the west wall, four for the east — and `cast()` in
   `src/villa.js` did `[].concat(meshes)`, which flattens one level and no more. So the two arrays went
   into the shadow list as items, and Babylon ran `for (const child of mesh.getChildMeshes())` on the
   first of them and threw. `vendor/babylon/babylon.js` has that loop as `for(const t of
   e.getChildMeshes())`, which is where the `e` of the message comes from. It threw inside `buildVilla`,
   before the pool, the garden and the props were ever built, so the page stopped at the error plate.
   `cast` now flattens all the way down, and the list says `...west, ...east` so the intent is plain on
   the page. The wall pieces throw a shadow again, as the single-box walls of v0.5.0 did.
2. **Nothing in this folder could have seen it — so two tools were written that can.** `tools/feet.js`
   and `tools/draw.js` both stood the shadow lamp out as `{ addShadowCaster() {} }`, painted no canvas
   and ran no post pipeline: the whole path that broke was never walked. Both stand-ins now throw if what
   they are handed is not a mesh, which is what Babylon does, so the class of fault cannot come back
   quietly. `node tools/shadows.js` builds the world and names every bad argument with the line that
   gave it: `an array of 7 <- cast (src/villa.js:46)`.
   The bigger one is **`node tools/standup.js`**: it loads the Villa's own `src/main.js` — the same file
   the browser loads, with the same `vendor/materials/babylonjs.materials.min.js` for `SkyMaterial` —
   under Babylon's NullEngine, given a small DOM (one canvas, a body, a window, an address bar for the
   `?view=` switches) and a canvas 2d context that counts what is painted and hands back blank pixels,
   and then drives the render loop by hand. It reports: stands up in 0.5 s, 608 meshes, 5 lights, 41
   materials, 35 textures, 2630 filled rectangles and 5856 paths painted, 4 frames clean. `--key KeyW
   --frames 60` holds a key down and walks 3.35 m north, stopping at the coping with the feet on 0.23 —
   the walking and `pool.animate` run on every one of those frames. **Put the fault back in a copy and
   it prints the browser's message word for word**, which is the proof that this is the fault and that
   the tool sees it. What it cannot do: it says nothing about how the Villa looks — the patterns are
   blank and NullEngine draws nothing, so pictures are still `tools/draw.js`.
3. **The CPU drawing had been inventing shadows and forgetting others, and now it keeps the Villa's
   own.** `buildShadowMap` guessed the casting meshes from their flags (`checkCollisions ||
   receiveShadows`), which is not the list the Villa hands the shadow lamp: 23 meshes were casting in
   the drawing and not in the browser (the lawn, the deck, the path, the hedge, the glass panes, the
   sala steps) and 110 were casting in the browser and not in the drawing (the sala roof, the four
   fascia boards, the ridge cap, the soffit, the back door and its frame, the palm crowns, the banana
   stalks). The drawing now uses the recorded cast list — 498 meshes — so the two agree, and `--castcheck`
   prints any difference. The biggest single lie this took out: the sala cushions, which the drawing put
   at (245,231,228) — all but white — although a roof is over them; they now read (101,93,94) in the
   sala's own shade. Full-size effects: see the table.
4. **`tools/views.sh`** redraws all fourteen standing views at once, with the cameras in one place in
   the script instead of scattered through these notes. `sh tools/views.sh home west` does two.

### What the pictures say now

All fourteen standing views re-drawn. Nothing blows out and nothing comes out black in any of them; the
only entry is 0.0% of `teakWall` in three views. Mean luminance, drawing before this session → after:

| view | L before → after | why it moved |
| --- | --- | --- |
| frontcorner | 97 → 86 | the sala roof's shadow, which the drawing never had |
| sala | 86 → 80 | same, and the cushions |
| rearcorner | 80 → 76 | the fascia and the palms |
| colonnade | 105 → 102 | the fascia board's shadow along the head of the glass |
| home | 114 → 110 | palms and sala, a little |
| westlawn | 94 → 98 | brighter: the lawn and the glass were shading themselves |
| westwall | 71 → 68 | the palm off the west wall |

`rear` and `rearup` did not move at all (0.0 gap in `tools/compare.js`): nothing behind the house was
missing a caster. The rest moved 1-6 points. Walk untouched: **607 meshes, 30 floors, 83 blockers,
81.8% of the garden reachable from the start, no stumbles** — the fix only changed who throws a shadow.

### Decided, and why

- **The boundary hedge stays out of the casters.** At azimuth 160° and 24° high a 2.1 m hedge throws its
  shadow 4.6 m north and 1.6 m west: a band at z 21.4..26 and x 28.4..33, both at the raw edge of the
  garden where the palms already stand between it and any view. It would also stretch the shadow map's
  fit from about 40 m across to 66 m — from 2 cm a texel to 3.2 cm on a 2048 map — to buy a shadow
  nobody stands in. That is new work, not a fix, and it cannot be looked at here.
- **The invisible blockers and the water stay out of the shadows too** (they already were): they are
  painted, not solid, and a shadow off a sheet of water or a wall you cannot see is a fault, not a fix.

## What was done this session (ninth, 2026-10-14) — the strings had nothing to hang from, the pool was a hole in the picture, and the teak was lying

Still no browser: `tools/headroom.js` said **5 of 2048 slots free** at the start, every one of the rest a
corpse of an old Chromium run. Everything below was measured one node process at a time with
`UV_THREADPOOL_SIZE=1`, which worked every time. `node --check` passes on every file.

1. **Three strings of bulbs were hanging from nothing.** The eighth session moved the four terrace posts
   back under the eave at z = -2.05, and left the strings where they were: both ends of all three
   started at (±6.6, 3.5, 0.5) and (2.2, 3.5, 0.5), which is **2.55 m in front of the nearest timber**,
   in the air over the deck; and the third ran out to (-11.5, 3.6, 6.4), a point in the sky above the
   west lawn with nothing at all there. Now: three runs slung along the four posts, tied at 3.9 m just
   under the 4.06 m soffit edge, and one run from the east post down to the sala's near post (8.8, 3.0,
   3.6 — its top is 3.16). The west string is gone, because nothing stands where it ended. Proof, with
   `--pick` from (-4.6, 1.6, 4) looking up at 0.34 rad: `lampGlow (bulb)` at (-4.88, 3.48, -1.80) and
   (-4.17, 3.48, -1.80), against the soffit behind at 7.3 m. Before, a pick along that line named only
   sky and soffit. The bulbs also hung 0.1 m *above* their wire, which puts the wire through the middle
   of every one of them; they now hang 0.07 m below it.
2. **The pool — 18% of the first view — was a black hole.** Measured on the browser's own `019-home`: the
   water read (34,102,114) where it is brightest and (0,77,93) where it is not, while the coping beside
   it read (233,220,199) and the paving beyond (203,183,153). A pool villa whose water is the darkest
   large thing in the picture. `backlight` says (34,102,114) is light (0.069, 0.270, 0.291) and a sunlit
   pool — (60,150,158) — is (0.094, 0.514, 0.505), so `mats.water.emissiveColor` went from (0.3, 0.66,
   0.62) to (0.42, 1.2, 1.05), and the canvas's red floor from 18 to 40 (water with no red in it is ink;
   green and blue were left alone so this only warms, it does not brighten). The drawing's stand-in went
   with it: `SURFACES.water` tint (40,116,132)→(62,142,152), glow (0.6,0.6,0.35)→(0.9,0.9,0.6). Measured
   after: the start view's water rows went from (40,117,128) and (5,97,111) to (66,154,160) and
   (46,142,149); from the terrace the water reads (50,148,155). **No browser has seen this.** If it comes
   out as a glowing cocktail bar, the lever is `emissiveColor` in `src/materials.js`, back by that same
   ratio toward (0.3, 0.66, 0.62), and `water` in `src/surface-colours.js` beside it.
3. **The drawing's teak was a lie, and it had been lying for six sessions.** The line between two boards
   is 2.4 px of an 85 px plank in `teakCanvas` — under 3% of the area. In `SURFACES.teak.grid` the gap
   was 0.045, and `albedoAt` paints grout over the whole band `gap*2.4` wide on either side of every
   boundary, which is about a third of the surface. So the terrace floor drew (53,37,38). Picking the
   browser's own `019-home` in the band where that same sunlit deck lies (a line of pixels from 640,390 to
   1000,405: (158,106,69), (157,106,70), (160,106,62), (119,83,57), (167,119,82), and (155,105,70) at the
   middle of the run) said about (158,106,69) — three times the light the drawing was giving it, and
   `teakWall` carries the front's posts, mullions, sill, head and pier: 20% of the colonnade view. `gap`
   is 0.012, which covers what the canvas covers, and the boards' green and blue came up by the eighteen
   and thirteen per cent the measurement asked for; the deck now draws (158,100,66) against the browser's
   (158,106,69). Nothing in the Villa changed: this was the drawing reading its own notes badly, and every
   kept picture with teak in it was re-drawn.
4. **The sunbeds were sunk in the stone and crowded each other.** They were built at y = 0 while the
   paving they stand on is 0.14 up, so all three were buried to the knee. And their blockers — 0.8 m
   across each, at x -3.4, -1.4 and 2.6, with side tables at 0.6 and 4.6 — left 1.29 m gaps to thread a
   person through the middle of the pool's south edge. Now: the west pair stands out on free stone at x
   -11.3 and -6.3 with a table between them at -8.8, the third at x 4.4 with its table at 6.8, all at y =
   0.14, and the cheese platter went with its table (it had always stood on it; both were simply 14 cm too
   low). Gaps: 1.79 m between the west pair, 1.69 m east of the last sunbed, and 0.63 m of stone between
   the coping and a sunbed, which is where you would leave one. **`tools/feet.js` caught a fault in my own
   first attempt**: leaving the east lounger where it was (x 2.6) but sliding the row to z 9.2 put its
   blocker's face 5 cm from the start point (2.4, 10.5), and the walk reported *0.0% of the garden
   reachable* — the visitor started wedged behind a sunbed. Moved out to 4.4 it is 1.6 m clear, and the walk
   reports 81.8% reachable, every named place standing at its height, and no stumbles.
5. **The railing ended in the middle of nothing.** It ran x -15.6 to -7.2 along the north edge of the
   west paving, but that paving runs -15 to -5.45: the top board hung 0.6 m over the grass at one end
   and stopped 1.75 m short of the paving's own corner at the other. It now runs -14.6 to -5.8 on eight
   posts, and the top board ends over the outer pair.
6. **The potted plants by the terrace steps were 14 cm under the paving**, for the same reason as the
   sunbeds. They, the sunbeds and the side tables now take a `y` for the ground they stand on.
7. **New to see, and this was fault 2 on the old list: the terrace has chairs on it.** Two teak armchairs
   with a small table between them, on the deck east of the steps at (4.35, -2.85) and (6.15, -2.85),
   facing the water. Sixteen metres of bare deck with four posts on it read as a floor that had not been
   furnished, while the sala had cushions and the pool had sunbeds. They read in the start view at
   (228,164,106) against the glass behind at (129,130,123). Something worth knowing, found while placing
   them: **at this sun the roof shades nothing at floor level.** The eave is 4.2 m up and the sun is 24°
   high, so the eave's shadow line falls 8 m north of the eave — behind the house. The whole deck, the
   glass front and the chairs stand in direct sun, and only the top half a metre of the glass is under
   the roof's shadow. That also changes what to make of the bright room behind the glass: see the fault
   list.
8. **Two tool fixes.** `--pick` on a pixel outside the picture crashed `tools/draw.js` with a bare
   `undefined.toFixed`; it now says which pixel and moves on. And the water entry in
   `src/surface-colours.js` is now marked in that file's header as the one tint there that was **not**
   read off a browser picture, so nobody mistakes it for measured evidence again.

### What the drawn pictures say now

All fourteen standing views re-drawn (the teak fix touched nearly every one). Nothing blows out and
nothing blacks out anywhere except two, both honest: `drawn-rearup` has 0.5% white, which `--pick` says
is the sky's own glare around the sun — the camera looks south and up at a roof with the 24° sun 20° off
its axis — and `drawn-rear` sits at L56 against the browser's L95, which is the drawing's missing
bounced light and not a Villa fault.

| view | mean rgb | L | in colour | what fills the frame (top four) |
| --- | --- | --- | --- | --- |
| home | 108,117,105 | 114 | 78% | water 18, coping 14, sky 12, glass 9 |
| rear | 57,58,51 | 57 | 6% | plaster 31, lawn 24, teakWall 16, hedge 14 |
| rearup | 84,98,106 | 96 | 46% | sky 48, plaster 26, teakWall 10, plasterDark 10 |
| sala | 86,87,76 | 86 | 59% | paver 23, sky 17, jungle 15, teakWall 11 |
| path | 107,101,88 | 101 | 79% | paver 35, sky 20, jungle 8, hedge 5 |
| west | 92,104,97 | 101 | 66% | sky 27, paver 20, hedge 11, jungle 10 |
| terrace→pool | 74,105,98 | 98 | 64% | water 24, jungle 19, paver 11, sky 10 |
| rearcorner | 68,84,69 | 80 | 40% | lawn 40, sky 15, plaster 10, palmBark 6 |
| colonnade | 122,102,90 | 105 | 53% | glass 39, teakWall 20, sky 16, roof 12 |
| westwall | 72,72,64 | 71 | 17% | plaster 36, glass 16, plasterDark 14, lawn 9 |
| frontcorner | 104,98,72 | 97 | 52% | glass 29, teakWall 17, jungle 11, leaf 10 |
| salaroof | 73,85,79 | 82 | 48% | sky 26, paver 14, jungle 12, hedge 10 |
| westlawn | 84,98,87 | 94 | 63% | sky 26, paver 19, lawn 14, jungle 11 |
| eastlawn | 85,100,78 | 95 | 80% | lawn 36, sky 19, plaster 12, jungle 9 |

The walk costs six more meshes and three more blockers than the eighth session left: **607 meshes, 30
floors, 83 blockers, 81.8% of the garden reachable from the start, no stumbles.** The three new blockers
are the two deck chairs and the table that goes between them.

## What was done this session (eighth, 2026-10-14) — four things that were not true: posts that held nothing, windows that were not holes, a gap in the front, and a roof you could see through


Still no browser: `tools/headroom.js` said **7 of 2048 slots free** at the start (2005 zombies, every one
a child of pid 1, which is this folder's own `http-server`; `CapEff` has no `CAP_SYS_PTRACE`,
`/sys/fs/cgroup` is read-only). Everything below was measured with `tools/draw.js`, one node process at
a time with `UV_THREADPOOL_SIZE=1`, which worked every time. All four faults were found by reading the
metres in `src/villa.js` and `src/mesh.js` against each other and then asking the drawing to prove it —
not by luck.

1. **The front colonnade held up nothing.** The four posts stood at z = 0.45, their tops at 4.2 m, and
   the roof's south eave is at z = -2.2: **2.65 m of open sky** between the tallest posts in the Villa
   and the thing they should carry. From the start view the fascia board hid it; from any oblique it
   showed. The posts now stand under the eave at z = -2.05, two of them moved out to x = ±6.85 to pick
   up the line of the side walls, and their tops are raised to 4.3 so they meet the slope (the roof
   surface there is 4.27). Proof, `--view "2.2,1.6,9,3.1416,-0.14" --fov 0.45`, a column of pixels up
   the post: teak to 4.28 and **roof above it, not sky**. Note what was *not* done: the roof was not
   extended over the deck. At this sun — 24° high — a roof edge at 4.2 m throws its shadow 9 m north,
   so a veranda roof over the deck would put the whole pool and the paving the visitor starts on into
   the house's shade. The deck stays in the sun and the pool keeps its light.
2. **The side windows were panes glued to the outside of a solid wall.** `--pick` on a west window gave
   `glass (westGlassA) at 6.0 m` — the same distance as the plaster beside it, because there was no
   hole: the pane read as a pale patch of wall, glass (117,114,114) against plaster (107,96,94).
   `wallWithOpenings()` in `src/villa.js` now builds each side wall in pieces around its openings — a
   pier between them, a sill under each hole, a header over it — and the glass stands in the middle of
   the 0.35 m reveal. Two things that came with it and matter:
   - every opening carries an invisible **sill blocker**, because `ground.js` reads a 0.5 m sill band
     as something to *stand on*: without it a visitor walked through the window and stood in the room
     with their feet on a metre-high ledge;
   - the east window was **staggered** into the pier between the two west ones (z -8.3..-7.3, was
     -7.8..-5.4). Level with either one and the two holes make a tunnel and you see the garden straight
     through the house — a bright hole where the room should be.
   Now the openings show a room: (127,130,132) at the middle of a west opening, (103,103,104) near its
   head, against the shaded wall's (91,81,79); and from inside, looking out, the same glass reads
   (120,123,114) with the floor dark under it at (36,28,29). See `jargon.md` for pier, sill, header,
   reveal, staggered.
3. **The front had a slot in it.** The glass stops 0.68 m short of the east wall and only an invisible
   blocker shut the gap, so you could look through the front into the room and out again. It is a teak
   pier now (`frontPier`, 0.72 m wide at x 5.98..6.70, full height, solid to walk into) and the fifth
   mullion, which crowded that corner anyway, is gone: four mullions and the pier, every pane 2.7 m
   wide. `tools/feet.js` still reports the spot as stopped.
4. **The roof could not be seen from the north — it was wound inside-out.** In `hipRoof`, z0 is the
   *smaller* z, which is the **north** end (-z is north), and the comments in `src/mesh.js` said the
   opposite; the north slope's triangles were wound the other way round, so the face was culled and the
   roof was a hole in the picture from the back of the house. Measured before the fix, `--view
   "0,1.6,-21,0,-0.35" --fov 0.8` (standing in the north lawn, looking up at the house): sky from the
   top of the frame all the way down to the ridge cap, **no roof at all**. After it, the same view puts
   roof 3% in the frame and `--pick` gives the face normal `0.33,0.70,-0.63` — up and north, which is
   what a north slope's normal has to be. All four faces now show from outside, checked from the north
   lawn, the front, and both sides: south slope `0.15,0.95,0.29`, west hip `-0.23,0.95,0.22`, east hip
   and north slope as above. **The sala's roof was wrong the same way** and is right with it. `mesh.js`
   now says which end is which, in the comment and in the vertex labels.
   The same fault in the soffit: it was 11 m deep, stopping at z = -12.3 while the roof runs to -13.4,
   so there was 1.1 m of open underside behind the north fascia and you could look up through the roof
   there. It now covers the whole footprint (17.6 x 11.2) and the fascia boards close the 14 cm left
   over between the plane and the roof edge; `salaSoffit` went 5.8 → 6.0 to match its roof's 6 x 6.

### What the pictures say now

The seven standing cameras, plus four this session added because nothing else showed the faults.
Nothing blew out and nothing came out black in any of them.

| view | camera | what fills the frame (top four) |
| --- | --- | --- |
| home | `2.4,1.74,10.5,3.2,0.06` | water 18, coping 14, sky 12, glass 9 — unchanged, and the glass still reads (134,135,128) |
| rear | `0,1.6,-19,0,0.06` | plaster 34, lawn 22, hedge 15, teakWall 14 |
| rearup | `0,1.6,-21,0,-0.35` | sky 48, plaster 26, teakWall 11, plasterDark 10, **roof 3** (was: no roof at all) |
| westwall | `-13,1.6,-8,1.57,0` | plaster 36, **glass 16**, plasterDark 14, lawn 9 — the windows now read as windows from the side |
| colonnade | `2.2,1.6,9,3.1416,-0.14` fov 0.45 | glass 39, teakWall 21, sky 16, roof 12 |
| frontcorner | `6.34,1.6,6,3.1416,-0.02` fov 0.45 | glass 27, teakWall 17, jungle 11, leaf 10 |
| salaroof | `16,1.6,-2,-0.63,-0.1` | sky 26, paver 14, jungle 12, hedge 10 — and the sala's soffit reads (50,37,35), a dark underside |

`drawn-home`, `-rear`, `-rearcorner`, `-sala`, `-path`, `-west`, `-pool`, `-westlawn`, `-eastlawn` were
all re-drawn after the changes; `drawn-rearup`, `-westwall`, `-colonnade`, `-frontcorner`, `-salaroof`
and `-rearhouse` are new standing views. The walk cost nothing: **572 meshes, 30 floors, 80 blockers,
81.9% of the garden reachable from the start, no stumbles** — the side walls are now 7 pieces and 4
instead of one each, the sill blockers and the front pier are new, and nothing out there was made a
shadow caster that was not one before.

## What was done this session (seventh, 2026-10-14) — the jungle was too short to see

**Still no browser, and two more routes were closed off so the next session does not try them.** 2005
of the 2048 task slots are zombies and every one of them is a child of pid 1, which is this folder's
own `http-server`; `kill -CHLD 1` does not make it reap them, and `/sys/fs/cgroup` is mounted
read-only so `pids.max` stays 2048 and no sub-cgroup can be made. `tools/headroom.js` said 5 slots
free all session. Everything below was measured with `tools/draw.js`, one node process at a time with
`UV_THREADPOOL_SIZE=1`, which worked every time.

1. **New `--hist` in `tools/pixels.js`**: how a picture's light is spread over the bands of
   brightness, plus what colour the darkest and brightest band is and which grid cells hold it. This
   is what turned "the back looks dark" into a number. Measured on the browser pictures: 019-home
   puts 1.6% of the frame below L=31 (and that is the vignette'd corners), 021-sala 4.0% (dark
   foliage), 020-rear 0.5%. So the browser's renderer has almost nothing in the soot bands, and a
   drawn view that puts 24% of a frame there is either a real fault or the drawing's own lack of
   bounced light — now tellable apart at a glance. Second use, already paid: **the drawn start view
   now has nothing above L=240 at all where 019-home had 4.9% of the frame blown to (251,246,236)**,
   which is what v0.3.1's plaster deepening was for. It did the job, as far as a drawing can tell.
2. **The jungle belt was too short to see, and that was measured, not guessed.** The west view drew 5%
   jungle against 29% sky. The reason: a 6 m tree standing 50 m off covers seven degrees of sky and no
   more, so the sky came down between the crowns all the way to the hedge top. `buildDistance` now
   lays the belt in **two ranks** instead of one:
   - a **near rank** of about 58 trees standing 3-11 m beyond the hedge, whose trunks hide behind it
     and whose crowns are **5-19 m** — three times the old height, and close enough to read. This is
     the rank that sets the skyline, because the nearest tall thing hides the taller ones behind it:
     the first attempt this session put the tall trees 26-52 m out and the coverage did not move at
     all, hidden by their own short relations;
   - a **far rank** of about 71 trees, 26-52 m beyond the hedge, 9-26 m tall, which fills the gaps the
     near rank leaves and fills the hole there was between the belt and the far tree line.
   Both ranks are **clumped**: `lump()` wanders along the ring, so a low patch of 5 m trees gives way
   to a patch of 18 m ones. A level top was what made the first belt read as a curtain, and the sky
   has to get down into a wood somewhere. 12% gaps in the near rank, 7% in the far one.
3. **A third green between the belt and the sky.** New `mats.jungleFar` / `SURFACES.jungleFar` — the
   hedge's leaf pattern, paler and bluer than the near rank's and repeated finer, because at 30-50 m a
   leaf is a speckle and not a leaf. Measured down one column of the terrace→pool view: hedge
   (88,112,79) at 27 m → near rank (66,84,66) at 28 m → far rank (73,89,82) at 57 m → far tree line
   (113,119,128) at 120 m. Each layer is cooler than the one in front until the haze turns them all to
   blue-grey. The whole horizon now costs the browser five draws, not thirty.

### What the pictures said, before and after

The same seven cameras. `sky` is what the trees had to give up; `jungle` is the near rank,
`jungleFar` the new one, `farTree` the line on the horizon.

| view | sky before → after | jungle | jungleFar | farTree |
| --- | --- | --- | --- | --- |
| west | 29 → 27 | 5 → 10 | — (hidden) | 7 → 4 |
| sala | 20 → 17 | 7 → 15 | 1 | 7 → 3 |
| path | 21 → 20 | 5 → 7 | 2 | 4 → 2 |
| terrace→pool | 11 → 10 | 14 → 19 | 3 | 9 → 2 |
| home | 13 → 12 | 4 → 6 | — | 3 → — |
| rearcorner | 13 → 15 | 5 → 4 | 2 | 4 → 2 |

Read honestly: **the sky only gave up two or three points, because the skyline is set by the nearest
ring** — the tall near rank ate the far line's coverage as much as it ate the sky's. What changed is
what the trees are worth in the frame: the belt's own share roughly doubled in every view, it stands
26-30 m off now instead of 45-60 m so its crowns, their colour washes and their clumps read, and there
are three greens between the hedge and the horizon where there were two. Nothing blows out or blacks
out in any view, and the walk is untouched — `tools/feet.js` still says 81.9% of the garden is
reachable from the start, 27 floors, 71 blockers, no stumbles.

Two more views are kept for next time, both from lawn where a visitor wanders: `drawn-westlawn`
(`-20,1.6,10,1.57,-0.02`, east along the west lawn) and `drawn-eastlawn` (`20,1.6,-14,-1.57,0`, west
from the north-east lawn).

## What was done this session (sixth, 2026-10-14) — the Villa gets a horizon

**The browser is gone for certain, and this time it was proved instead of assumed.** The corpses of
old Chromium runs are children of pid 1, and pid 1 is this folder's own `http-server`, which does
not reap them. We are uid 0 but `CapEff` is `00000000800405fb`: no `CAP_SYS_PTRACE`, so nothing may
attach to pid 1 to reap them, and no `CAP_SYS_ADMIN`, so `mount -o remount,rw /sys/fs/cgroup` fails
with "cannot remount cgroup2 read-write, is write-protected" and `pids.max` (2048) cannot be raised.
One last route was tried and failed: `npm i gl` (headless-gl, a CPU WebGL in Node, which would have
let Babylon draw for real) — the prebuilt download never completed and the source build wants
`python3` and a C++ toolchain, neither of which is installed. Do not try any of that again: a browser
comes back only with a fresh sandbox. Two costs worth knowing: one `screenshot` attempt burns about
four of the free slots, and with only a handful free, **run one node tool at a time** — two at once
have died with `uv_thread_create: Resource temporarily unavailable`. `UV_THREADPOOL_SIZE=1` gives
node a better chance when the room is that small.

1. **Three depths were put outside the hedge** (`buildDistance` in `src/world.js`). It had 36 blobs of
   hedge-green at 36-48 m and five hills: one thin fringe, and everywhere else bare sky. Now:
   - a **jungle belt** of about 56 canopy trees on a ring round the hedge rectangle (so it sits 9-21 m
     off the hedge on every side, not 30 m off on the diagonals), mostly 4-9 m tall with about one in
     six at 14-20 m, and roughly one place in eight left open so it is a wood and not a fence;
   - **eight coconut palms** over the belt, 13-19 m, which is what puts something thin against the
     sky;
   - a **far tree line** on a ring 100-150 m out and further still at the corners, 18-44 m tall — tall
     on purpose, because lower than the belt in front and it hides behind it and does no good;
   - the **hills** went back to 170-240 m so they stand behind the tree line and not in it.
   Each layer is a different green, cooler than the one in front (see `jargon.md`: aerial
   perspective): `mats.jungle` is the hedge's own leaf pattern under a cool grey, `mats.farTree` is a
   flat blue-green with no leaves at all, and the fog does the rest — at 130 m it has taken about a
   third of what a thing is. Measured in the west view, near hedge (97,125,82), belt (89,111,85),
   far line (113,119,128).
   All four layers are `Mesh.MergeMeshes`d into one mesh each, so the whole horizon is four draws and
   the scene went from 542 meshes to 511. Nothing out there has `checkCollisions` and nothing is a
   shadow caster, so the walk and the shadow map are untouched: `tools/feet.js` still says 81.9% of
   the garden is reachable from the start and nothing is a jump.
2. **The drawing's glass was lying, and badly.** `tools/draw.js` shaded window glass like a pale lit
   wall and then laid it over what was behind at 36%, which came out (162,177,166) where the browser
   shows (127,116,106) — a lit board where the Villa has a dark window. Glass now keeps a tenth of
   the sun, and its sheen is the sky in its own mirror direction weighted as glass is weighted (about
   4% head-on, nearly all of it along the horizon: `shade()` in `tools/draw.js`). The `glass` entry in
   `src/surface-colours.js` also carries a small `glow`, which stands for the lit room the browser
   shows through the pane — the drawing has no sun getting into a closed room, and without that the
   window came out (83,94,91), too dark. The start view's window now reads (134,135,128).
3. **`tools/headroom.js` run on its own now says how much room there is.** It used to print nothing at
   all, which read as a broken tool rather than a full process table.

### What the drawn pictures say after this session

Same six views, plus a seventh (`rearcorner`, `-15,1.6,-20,0.66,0.05`, the north-west corner of the
house from the lawn — the rear view from the notes stands 7 m off a wall and is not a view of a
house so much as of a wall). The seven cameras, for whoever re-takes the browser pictures:

```
home  2.4,1.74,10.5,3.2,0.06      rear   0,1.6,-19,0,0.06
sala  3.5,1.6,11,2.25,-0.02       path   -3,1.7,19,2.9,0.02
west  -11,1.7,6.8,1.57,-0.02      pool   0,2.1,-1.5,0,0.1
rearcorner  -15,1.6,-20,0.66,0.05
```

| view | mean rgb | L | in colour | what fills the frame (top three) |
| --- | --- | --- | --- | --- |
| home | 101,107,99 | 105 | 75% | water 18, coping 14, sky 13 |
| rear | 56,56,50 | 56 | 6% | plaster 31, lawn 24, teakWall 16 |
| sala | 89,90,81 | 89 | 61% | paver 25, sky 20, teakWall 10 |
| path | 108,101,90 | 102 | 78% | paver 35, sky 21, jungle 5 |
| west | 92,104,99 | 101 | 67% | sky 29, paver 19, hedge 11 |
| terrace→pool | 72,98,93 | 92 | 65% | water 24, jungle 14, sky 11 |
| rearcorner | 67,82,67 | 78 | 38% | lawn 40, sky 13, plaster 10 |

The sky gave place to the trees everywhere it could: sala 26%→20%, terrace→pool 24%→11%, path
27%→21%, west 35%→29%. Nothing in any view blows out or blacks out.

**The old browser pictures no longer line up with the drawn views, so do not compare whole frames
until they are re-taken.** `020-rear` shows sky where the drawing shows the board band, and at
`640,250` of `019-home` the browser has one surface and the drawing has the glass, because the pool
moved, the front steps were rebuilt and the cameras were corrected after those pictures were taken.
The whole-frame gaps in the fifth session's table are that, and not a light fault.


## Faults still to fix, in the order I would do them

A browser was available for the thirty-ninth session and every one before it back to the twelfth, so the
list below is what a renderer actually showed and not what the CPU drawing hoped for. **Item 34 (the horizon
read as a field of rocks) is closed — the far tree line is a band of jungle on a ridge now, the far rank got
its pattern range back, and every crown in the belt wears its own tone. Item 33 (the drawing's tints, and now
also its vertex colours) is what I would do next**, and item 32 went in the thirty-seventh session, and item
17 is closed to the bottom now, and items 14, 24, 25 and 26 were closed in the thirty-first session, when the
court gave 111 m² of its stone back to the lawn, and item 21 in the thirtieth — the garden went *into* the
court. The master’s `EDICT.md` bug — the garden being untextured and translucent — was pronounced dead in the
twenty-eighth session, was reported again in the thirty-sixth, and was then found for true: it was specular
glare on every green surface, and it is dead now (item 29, and that session’s entry for the measurements) —
and in v0.34.0 the same glare went off the house too.

1. **Done in the twenty-seventh session, and released as v0.24.0: the sunlit half was living in the last
   six bytes of the picture.** The library's curve starts bending at 0.76 of raw light and flattens
   everything above it towards white, and every surface the sun touches here arrives at it between 1.6
   and 2.8: teak post 1.62, granite 1.92, coping 2.25, the cement at the foot of the deck 2.56, plaster
   2.83 — a factor of 1.75 of light turned into 245, 247, 249, 250, 251. The Villa now runs its own
   curve, in `src/tone.js`: the library's shape, knee at 0.5 instead of 0.76, desaturation 0.05 instead
   of 0.15, white point left at the library's 1.0, and the exposure 0.72 → 0.76 to pay the shade for
   what the fold takes off the sunlit half. The same five surfaces come out 231, 235, 238, 240, 241;
   past L240 fell on all sixteen standing views to 0.0-1.1% of the frame; in colour came up on all
   sixteen. What is left of it, and it is small: **the fold costs a colour that was never clipped a few
   bytes of separation** — the sky in `rearup` keeps 60 of channel spread where it kept 70, sunlit grass
   in `grass` 139 where it kept 148 — because scaling a colour down under sRGB squeezes bytes near the
   top, and that is arithmetic and not a fault to fix. And the sunlit zone is still a narrow one: the
   whole family of curves in this shape can put 1.6…2.8 over at most ~30 bytes while the middle of the
   picture keeps its light, so a sunlit teak and a sunlit pot are still only a few bytes apart. The
   levers are on the url (`?knee=`, `?white=`, `?desat=`, `?tonemap=khronos` to put the old curve back in
   one browser) and the whole argument is at the foot of `src/tone.js`.
2. **Done twice: the far tree line was a white board on the sky, and then it was a ridge of pale
   domes.** The board went in the fifteenth session (v0.10.1) — bytes read as raw light, and no pattern at
   all, both written up in that session's entry; the sun-facing crowns at (241,199,147) went with the tone
   curve and read (221,221,146), a lit leaf with green in it. The domes went in the thirty-fourth: 52
   crowns of sixteen to thirty-four metres at 110-150 m are one fifth of a frame apiece, which is a ridge
   and not a tree line. It is 96 crowns of nine to seventeen metres now.
3. **Done too, by the same change: the shaded views had gone a shade deep.** When the bloom came off, the
   west wall put 18.4% of its frame below L31 and the north face 24.1%. They are at 12.0% and 11.8% now
   and both came up in colour with it (westwall 50.5% → 63.9%, rear 74.0% → 86.1%), which the sky fill and
   the bounce in `src/world.js` had been trying to do for three sessions and could not: ACES was lifting
   the bottom towards the washed-out top at the same time as it crushed the top. Nothing in any of the
   fourteen views is pure black. If a shaded view ever reads as soot, the fills in `src/world.js` are still
   where to look, but they are not looking tired now.
4. **The CPU drawing is short of range, and no single gain will do it.** Photographed against drawn after
   the tone curve changed, the drawing runs under the browser in the sunlit views — frontcorner 23 points,
   eastlawn 33, sala 17, west 14, path 13, pool 11, rearcorner 16, home 7, colonnade 4 — and over it in
   shaded ones, where its flat sky fill is all the light there is: rear 28 points over → 24 now, westwall
   19 → 18, rearup 14 → 15. It is a shade closer than it was, but the same shape: what is missing is a
   ground-bounce / sky-view term in `shade()` in `tools/draw.js` that lights horizontal surfaces and
   leaves a shaded vertical wall alone — the lawn and the paving lit partly by what lies beside them. The
   lawn's broad patches (seventeenth session) made this shortfall a little bigger in the lawn-heavy views —
   eastlawn was 29 under and is 33 — because the engine multiplies that field in light and the drawing
   multiplies it into fitted bytes. Until then nothing may be re-coloured on the drawing's say-so.
5. **The pool cannot be entered or waded** (carried over): a floor in `ground.js` at -1.62 plus a way back
   out. The window sills are the pattern to copy for keeping a person out of a place that is only painted.
6. **The drawing has no scene reflections and no film grain**, which the browser demonstrably does have
   (a flat wall differs by 1.35 of 255 between two loads, because `grain.animated` is on). Its bloom is
   also its own model — a threshold of 0.5 after the tone mapping, weight 0.2 — so it no longer matches
   what the browser does since the browser's spill was tightened. It is closer to the browser overall
   than it was, for the same reason: the drawing never had the bloom fog to lose.
7. **The drawing cannot see a wire.** The string lights' wires are `MeshBuilder.CreateLines`, which
   `tools/draw.js` does not draw at all, so a drawn view shows bulbs floating in a row. A browser does draw
   them — `tools/cover.js` names them `wire` (`colorShader`) at 12.8 m in the start view, now reading
   (127,112,72) instead of the washed (161,138,93) it used to — so the sag can be judged in a picture. If
   it is wrong, the numbers are the last argument of each `makeStringLights` call in `src/garden.js`.
8. **Nothing on the west of the garden has anything to hang a light from.** The third string used to run
   out over the west lawn and was cut for want of an anchor. A lamp post, a post by the west paving, or a
   second sala would give that side a reason at dusk. New work, not a fix.
9. **Done in the seventeenth session, and released as v0.12.0: the lawn no longer reads as a printed
    thing.** Its six-metre tile used to land the same way everywhere, and the cure was a second pattern on
    a bigger scale — broad patches of lush and dry grass, and mown bands that wander, in `src/lawn.js`,
    carried into the browser at the lawn's own corners. What is left of it: the grass *tile* is still six
    metres and still repeats at six metres — `--repeat` over the west lawn gives r = 0.44 at 239 px where
    it gave 0.52 — because the tone sits over the tile rather than breaking it up, and a one-metre block
    still catches the mown bands (the comb at 41 px, r = 0.72, is the bands and not a fault). If it ever
    reads printed again at a low sun, the next step is a second grass pattern in `src/textures.js` on a
    scale between the tile and the tone — not a smaller tile, which puts the speckle back and is the fault
    the eleventh session took out.
10. **Done: the sunlit coping no longer has only a point or two of headroom.** Its brightest pixel in the
    start view used to be (251,247,238); the brightest pixel anywhere in that frame is now L243 and the
    coping's own brightest is (255,255,241) at one spot in the pool view. The check is still worth making
    after any lift to the sun, the exposure or `scene.environmentIntensity` — `node tools/lights.js` with
    `"picks": [{"name":"coping sun","x":0.55,"y":0.60}]` on the `home` view, the `coping` line that
    `node tools/cover.js` prints, and the `>230`/`ceiling` columns that `tools/scan_old_new.js` and every
    `lights.js` run now print.
11. **Done in the eighteenth session, and released as v0.13.0: the pool paving no longer reads as a printed
    thing.** It was one pattern of slabs three metres and a tenth across laid over four hundred square
    metres, and the cure was the lawn's cure — broad shapes bigger than the tile: dust drifts of ten metres
    with a two-metre crust, a damp band along the coping, and wear, in `src/paving.js`, carried at the
    deck's own corners. What is left of it: the slab **tile** still repeats at three and a tenth — `--repeat`
    over the west deck gives nothing above the noise floor at that distance, so it is not a fault a picture
    can catch, and the obvious next lever (bending the slab grid the way the mown bands are bent) was
    refused on purpose: bent grout lines are curved stone, and that is a fault, not a variation. The floor
    of the terrace and the floor of the sala are the two big flat surfaces left that a visitor stands on —
    teak boards and stone, one tone each over their whole area, and the terrace fills the bottom of the
    colonnade and frontcorner views. `slab()` and a tone asked in metres are all it needs now.
12. **Done in the twenty-first session, and released as v0.16.0: the sala floor has a weather of its own.**
    It was rain blown in under the eave — a wet, silvered ring one metre inside the windward edges, the
    south and the west — and the one walked line from the steps to the seats. Its tone now ranges 0.75-1.17
    across itself against the terrace's 0.68-1.18, and the windward edge lost twelve points of red where it
    used to lose none. What is left of it: the sala floor is *seen* mostly at a raking angle from the south
    and west, where the sunlit boards are near the ceiling in red (241 of 255) and cannot show the honey —
    that is item 16 again, and it will not be fixed from here.
13. **Done too: nothing in the garden is planted in paving any more.** 15 clumps of palms, shrubs, bananas
    and rocks stood on built stone; `tools/planted.js` now names any that do and says nought. Worth running
    after anything in `src/garden.js` moves.
14. **Half of this item is now false, and the rest is the cheapest thing left.** It used to say the doors,
    the posts and the sala's planks were still wearing the teak bump at 0.55. They are not: `mats.teak`,
    which is the one at 0.55, is worn by exactly one mesh — `backDoor` (`src/villa.js:287`). The sala's
    planks and the terrace floor wear `mats.teakFloor` at 0.3, and the uprights, the front's pier, sill,
    head, panels and mullions, the back band, the alcove and the store's joinery — 31 meshes — wear
    **`mats.teakWall`, which has no bumpTexture at all**: a painted grain, a roughness wander, and no
    relief. That is the flat-brown-board complaint, and there is room for it: the sunlit `teakWall` in the
    colonnade cover reads (208,120,63), so a light bump has headroom there where the sunlit deck (item 18
    of this list, and the nineteenth session's item 4) has none. Start at 0.25 and measure the colonnade
    and `frontcorner`, not the deck.
15. **Done in the twentieth session, and released as v0.15.0: the furniture, the pots, the boulders and the
    soil in the pots are not flat colour any more.** `timberCanvas`, `terracottaCanvas`, `rockCanvas` and
    `soilCanvas` in `src/textures.js`, worn by `mats.wood`, `mats.pot`, `mats.stone` and `mats.soil` and
    multiplied in again by `tools/draw.js` through `src/surface-colours.js`. What is left of it: the four
    bump maps are in the Villa and in no drawing (the drawing has no bump maps at all, item 6), and the
    patterns only show at close range on a surface that still has headroom — see 16.
16. **Paid in the twenty-seventh session: a pattern on a sunlit flat top shows now.** The old fault was
    that there was no room for one — the terrace chair seat came out of Chromium at (252,197,160) and the
    lit face of the west boulder at (254,227,195), red at 252 and 254, and `tools/propprobe.json` measured
    the same mean with the pattern on and off: 0.1 of 255 apart. With the Villa's curve the same probe
    (re-aimed: see 19) says the pattern is worth this much on the same sunlit faces — chair seat
    (243,154,91) against a flat (249,165,116), the lit face of the boulder (240,201,149) against
    (248,210,170), the pot (247,163,115) against (244,152,99), the table top (188,114,47) against
    (200,114,40): six to twenty-five bytes of a pattern where there was a tenth of one. Nothing new to do
    here; re-run the probe after any change to the curve or to those four materials.
19. **`tools/propprobe.json` still has four picks that land outside the picture** — the controls (the coping
    and the deck beside the pot, the lawn beside the boulder, the paving by the rail) and the pot's high
    face, all aimed at places that leave the frame once the close camera is where the plan puts it. They
    now print `OUT OF FRAME at pixel x,y` instead of `NaN,NaN,NaN`, which is honest but useless: they want
    re-aiming at the camera each one stands behind, which is a five-minute job with `tools/look.js` and no
    risk to the Villa.

20. **Done in the twenty-eighth session, released as v0.25.0 and corrected in v0.25.1: the garden now has
    grass that stands up where it meets the stone.** The master's edict asked for it, and the flat/translucent
    half of his report
    was already dead (killed by the `groundPlane` winding in the twelfth session; the check is in that
    session's entry). What was new is `tuftCanvas`, `mats.tuft` and 491 clumps in one mesh along every seam
    between the garden and anything built on it. What is left of it, in order of worth:
    - the **sheets are the whole of a clump's shape**: at 2 m off a clump reads as three crossed cards and
      not a handful of leaves, because a card is what it is. More sheets per clump, or sheets bowed along
      their width, is the next step; it wants a measure first, and `tools/tuftprobe.json` is not it.
    - **Done in the twenty-ninth session: the fronds, the banana leaves and the standing grass are sheets
      now** — both faces drawn and both lit from the side they are seen from, which took the two real
      switches (`backFaceCulling = false` *and* `twoSidedLighting = true`) and not the inert `doubleSided`.
      Back-lit foliage stopped being chalk: palm fronds (132,141,99) → (42,103,35) on the south-border view,
      their brightest pixel off the ceiling, and no standing view lost colour doing it.
    - **Done too: the leaf-light is in tenths.** `frond` and `leaf` carry (0.3,0.55,0.2) and the clumps
      (0.5,0.85,0.3), measured on a crown 4.8 m off and on the west fringe, and worth (0.108,0.122,0.178)
      of green once each one's own pattern is multiplied in. What is left of it is fault 23: the hedge and
      the two jungle ranks, whose drawing glow is some seven times what their emissives can pay for.
21. **Done in the twenty-ninth and thirtieth sessions: the garden is inside the court now, and why the
    old fringe was invisible is settled.** The twenty-ninth session found the reason nothing laid at the
    court's edges could ever be seen from where a visitor starts: 0.2% of the start frame, against 14.1% of
    the west court edge — `tools/visibleground.js` says the frame's ground there is the **water** (19.6%,
    z 2.3…6.2) and the **coping** (16.8%, z 0.7…7.5), with paving only on one flank (x 5.8…10.9), because
    the bottom edge of the frame cuts the ground 4.2 m ahead of a visitor who stands 3.4 m from the water.
    **So the garden had to be planted inside the court**, and the thirtieth session did it: three beds of
    dirt cut out of the side decks, shrubs, bananas and grass at their seams — `courtBeds` in
    `src/world.js`, and that session's entry for the sizes and the measurements. What is left of it, in
    order of worth: the borders are 1.7 m of the 9.55 m each side of the court is wide (**fault 25**), and
    from where a visitor starts the east border shows at the frame's left edge at 8…11 m (hedge 2.1% →
    4.0% of that frame) — anything nearer than 4.2 m will not show at ground level however green it is.
22. **The CPU drawing blows its own sky out on `rearup`**: 0.9% of the frame past white where the browser
    puts 0.2% of that view above L240. It is the drawing's flat sky and haze (`sky and haze 50%` of that
    frame), not the Villa's, and it predates the twenty-eighth session; it sits with faults 4 and 6, which
    are the same shortfall — no ground bounce, no real sky term, no bloom model that matches. Every other
    drawn view comes out with nothing black and nothing blown.
23. **The hedge carries a glow in the CPU drawing about seven times what its emissive can pay for.**
    Found while doing the sheets in the twenty-ninth session. `hedge` draws a glow of (0.050,0.075,0.030)
    where its `emissiveColor` of (0.05,0.075,0.03) multiplied by its own leaf pattern adds only
    (0.003,0.011,0.001). In the browser it is lit by the sun and the sky and gets its colour from the
    pattern, not from this knob; in the drawing the flat number is a standing tip-up of the same kind the
    sheets had. Either bring the drawing's number down to what is added — which will darken the biggest
    green area of `westlawn`, `grass` and `southborder` and wants weighing there, not from a script — or
    make the emissive honest and let the engine do the work. `tools/sheets.js` prints the pair every run
    until it is settled. **The two jungle ranks are out of this complaint**: the thirty-fourth session
    wrote their `emissiveColor` as the light it actually adds — (0.0046,0.0153,0.0014) and
    (0.003,0.0103,0.0011) — and the drawing now costs what the browser costs.

24. **Done in the thirty-first session: the CPU drawing now knows the borders' tone.** `bedTone` moved
    from `src/world.js` to `src/court.js` and answers `[1,1,1]` outside the three beds, which is what lets
    the same `mats.earth` pave the laterite at the foot of the house untouched; `broad: "bed"` in
    `src/surface-colours.js` and one branch in `shade()` put it in `tools/draw.js`. Measured on the `west`
    drawing, where dirt is 2.9% of the frame: 26,922 pixels move, by at most 6 summed channels and 1.9 on
    average — because the tone is only ±3%. So the two renderers agree, and nothing else got brighter.
    What is still lying about the same dirt is fault 4: the drawing's dirt sits some 58 points under the
    browser's, and that is the missing ground bounce, not this.

25. **Done in the thirty-first session: the court gave 111.3 m² of stone back to the lawn.** The two outer
    edges came in from x = ±15 to ±11.9 (`courtEdge` in `src/court.js`), and what stood out there moved
    with them: the railing shortened to the new south edge (and lifted onto the stone it had been standing
    0.1 m past), the two outer lamps from ±13.2 to ±11.1, the west sunbed from -11.3 to -10.9, and every
    fringe in `makeTuftPlan` reading `courtEdge` instead of a stale number. Straight down from 26 m the
    paving went from 38% of the frame to 25.9% and the lawn from 24.3% to 34.4%. The lawn views and the
    view from above are greener and keep more colour; the start view is unchanged, for the reason item 21
    wrote down. Nothing left here but the taste of it: if the apron outside a border (4.15 m) ever reads
    too wide or too narrow, it is one number now.

26. **Measured and retired in the thirty-first session: merging the shrubs and banana plants would buy
    nothing.** A shrub is still four spheres and a banana plant ten meshes — 136 and 100 meshes of the
    Villa's 730 — and it was blamed for a frame rate fall. Weighed with `tools/fps.js` at 1280 x 720 in
    software WebGL: **v0.24.0 (669 meshes) 4.7 fps, v0.27.0 (732) 4.8, the thirty-first session's Villa
    (730) 4.8.** The old 5.0 against 4.5-4.8 was inside one page's own spread: mesh count is not what binds
    this renderer at this size, so the merges were left undone rather than done for a number that is not
    there. If the Villa ever grows a second garden's worth of planting, look at `tools/fps.js` again before
    merging anything.

17. **Done in the twenty-second session, and released as v0.17.0: the front of glass is a window.** It was
    9% of the start view at (149,123,93) — not a view into a room and not a reflection of the sky, and the
    biggest thing between a visitor and the house. Four faults were in it: the room's lamp had never
    existed (a guard on a Babylon static that is not in the vendored library, so the light was never
    built); the sky's fill and the ground bounce lit the room through its roof; the room's ceiling stood
    above the roof's soffit where nothing could be drawn from it; and the service block poked 0.3 m into
    the room, where an outdoor lamp made it the brightest thing in the front at L184. Then the sheet
    itself: a third glass and two thirds everything else, which is not what glass does. The check is
    `tools/roomprobe.json`, which puts each of those faults back on its own and prints what each was worth.
    What was left there — a rug, a chair or two, something on the table, and the dead west end — the
    twenty-sixth session did and released as v0.22.0 and v0.22.1; read that entry, and note two things this
    item could not know then: the west pane now reads (80,73,59) where it read (59,59,51), and from where a
    visitor starts the room's FLOOR is never visible at all, so anything laid on it has to be wanted from
    closer. **What was left of it is done in the thirty-second session, released as v0.29.0:** the service
    block is a store room, the back wall has a 1.4 x 2.35 m doorway cut through it, and a lantern hangs in
    the middle of that room, so the front of glass is a wall with a lit opening in it now. Read that entry.
    Two things it could not know then: the room is still one you look at and not into — nobody can walk
    through that doorway — and the store's single face on the rear elevation is 3.2 x 3.4 m of blank cement
    at L123, which wants a small high window. **The window is done in the thirty-third session** (read that
    entry: band of glass, shelf lamp, a seventeenth standing camera to see it from). What is left of this
    item: the room is still one you look at and not into, and the store's face is still a dark mass — L39-60
    — around its lit band, because a north face never sees this sun and no fill should pretend otherwise.

18. **Done in the twenty-fifth session, and released as v0.20.0: the foot of the house was soot.**
    `plasterDark` — the cement of the plinth and of the service block at the back — was bytes [86,74,62],
    which is 0.157 of the lime wall's light, and Chromium painted it (20,22,15) to (22,27,22) in the shade
    against (111,102,84) for the wall two metres away: 12.8% of the `rear` view and 11.0% of `westwall`
    under L31, the block alone 10.2% of the rear view flat to 3 of 255. It is [150,144,126] now, a grey
    cement cooler than the lime over it, with its weathering spread a third stronger; those bands came up
    to L54-L72 and the soot bands fell to 1.6% / 2.9% / 0.3%. What it cost, and what is left of it: the
    **sunlit** face of the same cement, the 50 cm band under the deck, went from (229,166,106) to
    (252,221,179) and now reads as bright as the pool coping at (241,218,185), so the front has less weight
    at its feet than it had. That is item 1 and item 16 again — the shade and the sun are one cement now and
    only the shade is right — and the way to pay for it is the exposure or the curve's shoulder, not the
    material. **The twenty-seventh session's curve paid for it**: that band now comes out (247,210,163)
    against the coping's (245,223,181), off the ceiling and with red back in it, so the front has its weight
    at its feet again without the cement being touched. The `block` and `plinth` cameras in
    `tools/propcams.txt` and the probe `tools/plinth.json` hold the whole argument, old bytes and new.

27. **The CPU drawing does not know that a north face never sees this sun.** Photographed against the
    browser at the new `backstore` camera, `drawn-backstore` comes out **L129 against the browser's L103**,
    and the store's own face is the whole of the gap: the drawing paints `plasterDark` at its fitted bytes
    as though the face were facing the sun, and Chromium paints it L39-60 because a face turned away from a
    24° southern sun gets only sky and bounce. Same root as item 4 — `shade()` has one sky term and no
    notion of which way a face is turned for it — and the same warning: the gap is the drawing's, so nothing
    may be re-coloured on its say-so. The browser's own numbers for that face are in
    `tools/storewin.json` (`backclose` and `backstore` views).

28. **Done in the thirty-eighth session, and released as v0.35.0: the standing grass was hanging from its
    tips, and the lawn was sown with black commas.** Not straw and not floating: `makeTufts` hand-wrote its four
    UVs the wrong way up, so all 586 clumps dangled crown-up with their leaves dripping to the ground, and the
    lawn's own bump — made from the same painted pattern — turned every dark blade into a ridge whose back
    slope the sun never reaches, 11.0% of a west-lawn patch at (28,47,7). Both closed, with the shrubs' melon
    shading behind them; the thirty-eighth's entry has the numbers and the pictures. What is left of the grass:
    the sheets are still flat planes (three crossed cards per clump, and a bowed sheet would be better than a
    straight one), and at arm's length a clump is still painted strokes rather than separate leaves.

29. **Done in the thirty-sixth and forty-first sessions, and released as v0.33.0 and v0.38.0: a sunlit lawn
    at a grazing angle was mint, not grass.** The thirty-sixth session took `specularIntensity` off the
    library's default of 1 and called it dead; it had only taken three quarters of it off.
    `tools/cover.js` on the start view had put `lawn` at **(169,201,83)** and `tuft` at (75,89,28) — a lawn
    that bright in red and green with only 83 of blue is highlighter, and the same mint is what makes the
    garden look translucent to the master even though it is opaque and patterned.
    **What was left of it is now measured, and both levers this item named are dead.** On the south-border
    camera, with the sheen already at 0.25 and the lawn at (142,183,87) L167: the sky fill's blue at 0.7
    and at 0.6 moves it to (142,183,85) — not at all; a fifth of the canvas's light out moves it five
    points; and the sheen itself, 0.08 and then 0, takes it to L106 and then to L58. Sixty-one of those
    points were the sky cube reflected off a flat sheet raked by the eye. It is sheen 0.08 now, paid back
    as (4.2, 3.6, 2.4) of the sward's own colour, and the raked lawn reads (109,150,40) L133 where it read
    (126,160,67) L146. Read the forty-first session's entry for the ladder, for why the lift is three
    numbers and sits in `albedoColor` and not in the canvas, and for `tools/lawnmint.json`, which weighs
    the same change at three angles so a glare paid for at one does not over-brighten at another.
    **What is left of it**: at two metres the sward is still straw-yellow — (124,153,32) now, green 29 above
    red and 121 above blue — which is the sward ramp's own bytes and not the glare. **Both colour levers for
    it were weighed in the forty-second session and both refused**, because the two distances want opposite
    colours: the material's blue lift fixes 2 m and turns 10 m mint, and the canvas's dark end moves neither
    by more than six points. Item 36 is what is left of it now, and it is a pattern question and not a
    multiplier.

30. **A bush in shade is a very dark mass, and nobody has weighed whether that is right.** In
    `334-southborder` the bushes between the hedge and the laterite are nearly soot against a mint lawn.
    `mats.bush` carries a small emissive (0.02,0.035,0.012) and the drawing's `bush` glow is now honest to
    it, so this is not a lying knob; it is that a bush's own leaves shade one another and the drawing and
    the fill lights have no self-shadowing to work that out with (the same shortfall item 20 writes for the
    tufts and the fronds). Measure a shaded bush against the hedge behind it before lifting anything.
    **Half weighed in the thirty-sixth session:** taking the varnish off left a shaded bush at (28,50,13)
    where it had been (45,66,24) — a hole in the picture under a hedge at (27,57,9) — so its lift went
    1.3 → 1.7 and it paints (34,63,15) now, released as v0.33.1. 2.3 was tried and came out brighter than
    the hedge behind it, which is the wrong way round. What is left of this item is the question of whether
    a bush needs any emissive at all now that its diffuse is honest: `mats.bush` still carries
    (0.03,0.05,0.018) on top of the lift.

31. **Nobody has measured what a leaf card's shadow is** — and the banana is now OUT of this question and
    the palms were out of it already: `mats.bananaLeaf` carries no alpha at all since the fifty-third
    session, so a banana's shade is its own outline whatever the shadow map does with a cut. What is left
    in it is every surface that is still an alpha-tested sheet AND a shadow caster: `bushEdge`, `bushLeaf`,
    `hedgeCrest`, `jungle` and `tuft`. If Babylon's shadow map ignores an alpha cut, each of those throws a
    whole rectangle of shade and not a leaf. No rectangle was spotted in any of the seventeen views, and
    absence in a picture at 4 fps is not a measurement: the check is a camera stood where one of those
    meshes throws its shade on pale paving, switched off and on through `tools/cover.js --js`, and a
    `tools/diffgrid.js` of the pair. If it is a fault, the remedy is probably to stop casting from the card
    meshes and let the body do it.

32. **Done in the thirty-seventh session, and released as v0.34.0: the house was wearing the same varnish
    the garden just took off.** Ten surfaces — `plaster, plasterDark, teak, teakWall, teakFloor, wood, cloth,
    coping, paver, roof` — went through `matte()` at the sheen cut of 0.25, with lifts of 1.5 for the walls
    and the timber, 1.35 for the sunbed cloth, 1.8 and 2.05 for the coping and the paving and 2.1 for the
    clay roof. That session's entry has the before / after table for both a sunlit view and a shaded one,
    and what it cost: the sunlit faces landed 10-38 points under what they were and the shaded ones 3-7
    over, which is the wanted shape. Nothing left here but the taste of the two big lifts: if the paving ever
    reads too grey at a raking sun it is `paver`'s 2.05 to walk back, and if the roof ever reads as dried
    mud it is the roof's 2.1 — both measured in a browser, both cheap to try with `tools/tint.js --fresh`.
    The interior family (`interiorPlaster`, `glass`, the three lamps) is still deliberately untouched.

33. **`src/surface-colours.js` now describes the Villa as it was, not as it is, for twenty-five surfaces.**
    Every tint there was read off a browser picture with the varnish on, so the CPU drawing paints the whole
    Villa too bright now: at `southborder` the drawn frame is L112 against the browser's L108 (the garden,
    fifteen surfaces, left by the thirty-sixth session), and the thirty-seventh session's ten house surfaces
    put the same drawing at **L130 on the start view against the browser's L123** — where the same pair had
    run seven points *under* before the house came off, on item 4's per-view list. So the drawing is now
    over by about what it used to be under, and both families' ratios are in the tables at the head of those
    two sessions' entries, to be read in light and not in bytes. `tools/compare.js <browser> <drawn>` is the
    check, view by view. Do not "fix" it by guesswork: the drawing is a stand-in for a dead browser, and the
    released previews come from a live one.

    **And it has no notion of vertex colours at all**, which since the thirty-ninth session is a second fault
    and not the same one: the far band's tone and every crown's tone in the belt are written at the corners
    of the mesh, and `tools/draw.js` never reads them, so it paints `farTree` flat at (123,133,131) where the
    browser paints (106,115,116) at 165 m, and both jungle ranks in one flat tone. The lawn's and the deck's
    broad patches are the old version of the same gap, faked there through `broad` in this file. Either teach
    the drawing to read `ColorKind` once, which settles all of them together, or go on faking them one by one.

34. **Done in the thirty-ninth session, and released as v0.36.0: the horizon was a field of rocks.** Three
    faults stood beyond the hedge, all of them measured and photographed: the far tree line was a row of
    domes whose height was read off their width, so the tallest stood 65 m up at 130 m — a grey finger, 27°
    of sky — and the rest were boulders with sky down the gaps between them; its colour came out (104,114,117)
    at 184 m, blue over green, which is slate and not leaf; and the far rank of the belt was painted with
    half the pattern range of the near one to look hazed, which left it at 11 points of spread over 55 grid
    points — a smooth green hillside and not a wood. It is a **band** now: one mass with a ragged top,
    `skylineBand()` in `src/world.js`, with its haze put back into its colour and its pattern instead of into
    a flat tone, and every crown of the belt crumpled and wearing its own tone. That session's entry has the
    numbers and the two traps — a variation the size of the thing it varies reads as a rhythm, not as
    variation; and half a quad wound the wrong way still looks perfectly well, so the check is the mean
    normal (0.88 with 99% of the vertices turned at the middle of the garden, 0.03 when it was wrong). What
    the band is *not*: it reads as hills rather than as treetops at 150 m, which is what haze does to a wood,
    and the near rank's crowns are still smooth domes at 25 m — leaf relief on `jungle`, the way `bush` has
    it, is the next word there.

35. **The Villa has no hills in it, and the horizon is one step short.** 🔍 Painted red in a live page and
    counted with `tools/cover.js` over the `west` frame, the six `hill` spheres cover **0.1% of the
    picture** — one grid point in 880 — and with `farBelt` hidden the rest of them is still behind that
    band. Everything in the standing views that reads as a hill IS the far tree line: (77,101,72) at 160 m,
    a dark band with a ragged top, and above it nothing but sky. Pushing them out to 300-380 m with 70-110 m
    tops was tried, photographed and refused — they come out the right hazy pale, (100,125,93), but six
    smooth ellipses poking over a wood are not a ridge and they filled 0.4% of the frame. The way to close
    this is a second band and not spheres: one long mass with a ragged top like `skylineBand()`, its own pale
    bytes, 300 m out, drawn behind `farBelt`. Until then, do not write that the Villa has hills at 170-240 m:
    it does not.
36. **A lawn at two metres is a printed sheet with clumps on it**, and it is not a colour fault. (124,153,32)
    at 2 m against (124,175,54) at 10 m: the near reading is acid, the far one is right, and one multiplier
    cannot move one without the other — see item 29 and the forty-second session's refusal for the two levers
    weighed and the pictures of both. What the near view lacks is structure at its own scale: blade against
    gap, thatch and dirt between the blades, and clumps (`tuft`, 8% of that frame) that stand *on* the sward
    instead of rising out of it. `pictures/1264-grass.png` is the camera and `--patch "100,300,1100,680"
    --block 48` its numbers — L std 26, which is plenty of light and dark already, so it is the shape of the
    near pattern that reads printed and not its range.

37. **The half of the pool you see *through* does not wobble.** There is no refraction in this renderer (or
    in the water patch of `src/water.js`, which touches the alpha and nothing else), so the floor and the
    steps are drawn crisp and in exactly the place they would be if the water were not there: `pictures
    /tmp-new-pool-crop.png` is the proof, and it is why the near half of the basin still reads as a sheet of
    glass laid over a mosaic rather than as water. The surface's own bump bends the *mirror* and the sparkle
    only. Two ways forward, both weighed a little: a refraction texture (a third cube, or the pool cube again
    with `mats.water.refractionTexture` and an index of refraction — untried) or shimmer in the transparency
    instead, which was tried and refused this session — an opacity map over the water multiplies the alpha
    *down*, and the film is dimmer than the sunlit floor under it, so it took the patch from L108 to L99 and
    to L90 with the caustics canvas. An opacity map is only affordable alongside a brighter film.

38. ~~Nothing marks where the water meets the walls.~~ **Done in the forty-fourth session:** `mats.poolWet` and
    `mats.copingWet`, eight thin boxes round the basin, and `?wet=` to weigh them. What is left of the fault is
    the third thing that entry names and this file has not got — **the shadow the surface itself throws on the
    floor at the far end** of the pool, where the water lifts off the wall. That wants either a shadow the
    water casts (a shadow caster that is a translucent sheet: untried) or a dark band on the floor where the
    wall meets it, which is the same trick as the wet tile and would want measuring at the deep end, 1.6 m down,
    where the floor is already dark.

39. **The pool's capstone overhangs grass on the north and south sides**, and a strip of lawn about as wide as
    a thumb shows between the paving and the coping — bright lime from any steep view, and no support under the
    stone. The coping's outer edge stands at z = 1.68 and z = 7.52; `deckWalk` and `deckFar` in `src/court.js`
    stop at z = 1.6 and z = 7.6. The side decks are right (x = ±5.445 against the coping's ±5.42, so they meet
    it), which is how sure the numbers are: `tools/capgap.json` picks straight down in two-centimetre steps and
    answers `lawn0` and `lawn1` in the gap, `copingNorth` and `copingSouth` beyond it. Two numbers would close
    it, but four files read those rectangles — the paving's tone is averaged over them, the grass fringes are
    laid along them, and `tools/draw.js` weathers by them — so it is a job with a re-measurement in it, not a
    typo. The standing views do not see it at all: from where a person stands the capstone covers its own gap.

40. **Done in the fiftieth session, and released as v0.49.0: the near rank was cut on card borders.** The
    straight lines at seven metres were the cards' own borders cutting the leaf, not the leaf pattern; the
    canvas is an atlas of separate clusters now and one card wears one cluster, so a card ends in air. See
    fault 44 in this session's entry for the numbers.
41. **Done in the fiftieth session, and released as v0.49.0: the hedge was a wall.** Four straight-topped
    boxes with a knitted face; it is 44 segments on a wandering crest line now, with a leaf face and a crest
    of leaf cards. See fault 45 in this session's entry, and note the lesson there about a card that reads
    black being a normal problem and not a colour one.
42. ~~The clipped bushes are broccoli, and they are in the start view.~~ **Done in the fifty-first session,
    and released as v0.50.0** — a shrub's outside leaf is 18,736 cards of leaf now. What is left of it is in
    that session's entry: the cards thatch at arm's length, and the dark between them is a shade too dark.
43. ~~The palm fronds are flat fans.~~ **Done in the fifty-second session, and released as v0.51.0**: a
    coconut leaf is a stalk with 390 leaflet cards standing off it in a V and drooping — see that session's
    entry for the numbers and for the denser crown that was tried and refused. What is left of it: the bare
    knuckle at the top of the trunk where the fronds rise out of one point, and the fact that a leaflet is two
    straight segments and not a curving blade.
44. ~~A banana is a handful of flat green plates, and it is the worst thing in the mid distance now.~~
    **Done in the fifty-third session, and released as v0.52.0**: a leaf is a rib marched along an arc with a
    blade laid level across it and torn by missing geometry — see that session's entry for the numbers, for
    the four-flat-bands leftover, and for the two lies it found (one mesh wears one material in `mergeParts`,
    and a bud was wearing bark because of it). All that is left of the banana is the blade's own curvature.
45. ~~A palm trunk was a stack of brown coins, dark as a shaded hedge.~~ **Done in the fifty-eighth session,
    and released as v0.56.0**: grey bark, leaf scars 4.5-14 cm apart, the bump halved, nine segments and not
    six — that session's entry has the numbers on both sides. What is left of the palm, in the order I would
    do it: **the three coconuts wear the trunk's bark**, so they are ringed tan lumps, and a husk is a fibrous
    green-brown thing (`mats.nut` and a small canvas would close it, and `tools/feet.js` needs no change for
    it); **the trunk is a cone**, straight from the foot to the crown, where a coconut palm curves out and
    then back over the years, and `makePalm`'s lean is a rotation per segment and not a bent spine; and the
    **bare knuckle** the fifty-second session left, where thirty-nine fronds rise out of one point with
    nothing between them.
46. ~~The ridge was a salmon plank laid on top of the roof.~~ **Done in the fifty-ninth session, and released
    as v0.57.0**: `ridgeCap` and `salaRidge` are low four-faced crests built by `hipRoof` (`crest`, of a roof,
    in `jargon.md`), inked from the ground by `groundUVs` so a tile is 0.28 m across on the crest as on the
    slope. Measured at 14 m off: the plank was (247,115,85) L141 against (85,35,16) L44 at its foot; the crest
    is (132…196, 52…69) L67–93, inside the roof's own range. That session's entry says why a box's UVs made the
    blow-out arithmetic and not paint. What is left of the roof, in the order I would do it: **the hips have no
    finial**, so every hip ends in a plain cut and a Thai roof of this shape usually wears something upstanding
    at the ridge ends; **the eave course is a straight line** while the crest line of the hedge wanders, and a
    roof that hangs 1.3 m out over a terrace could wear the same small sag; and the **tiles are one canvas at
    one scale over 200 m²**, so the same four tile shapes repeat 25 times across the slope, which reads as a
    printed sheet from `rearup` and nowhere else.

47. ~~A clump of standing grass was a spiky green crown sitting on the lawn.~~ **Done in the sixtieth session,
    and released as v0.58.0**: four crossed sheets and not three, narrow blades (0.9–2.8 px of a 256 square)
    with less of them splaying out, a lower narrower clump, a lighter foot and a tint held close to the sward.
    That session's entry has the before-and-after colours and the pairs of pictures. What is left, in the
    order I would do it: **a clump is painted and not grown** — at arm's length every blade lies in one of four
    flat planes, so nothing leans toward the eye and the spray has no depth to it (see
    `pictures/s60-tuft-close-pair.png`, which shows it plainly); **a clump casts no shadow onto the sward**, so a
    drift of long grass sits on the lawn with no shade at its foot, which is why the fringe along the paving
    still reads as laid-on and not grown-up; and the **straw clumps are a tint and not a paint** — one clump
    in nine is called dead by multiplying its green down, where dead grass is a warm papery thing with the
    leaf shape gone, which is a fifth cell in `tuftAtlasCanvas` and not a multiplier.

48. ~~Every wood in the Villa was one marmalade, and the posts wore horizontal rings.~~ **Done in the
    sixty-first session, and released as v0.60.0**: three woods — a pale weathered **deck**, a dark brown
    **structure**, a golden **furniture** timber — and the upright woods' boards stand up now. That session's
    entry has the before-and-after table and the two dead ends (a grey deck reads salmon in this sun; a neutral
    board reads olive in this shade). What is left, in the order I would do it: **the sky's fill is green**,
    `(0.4, 0.58, 0.88)`, and that single fact is why no floor can be a cool grey in its shade and a warm tan in
    its sun — a bluer, less green fill (and the bounce that goes with it) is the root fix, and it moves the
    whole Villa's shade, so it wants a session to itself and `tools/lights.js --plan` in one hand; **the
    terracotta still has two families in it** — roof, pots and the sala's floor are all in the same red-orange
    band, and a roof that is not a pot wants its own clay; and the **furniture timber is one canvas for every
    chair, bench, lounger and railing**, so the terrace's chairs and the pool's loungers are the same board.

## How the pieces fit

- `src/main.js` — engine, camera, walking and flying (`space`, and `?fly=1`; `?float=1` is the tools'
  pinned camera and is a different thing), the sky cube for reflections, the post pipeline (bloom, the
  Villa's own tone curve from `src/tone.js` at exposure 0.76, vignette, grain), the debug url switches,
  and `window.__villa = { engine, scene, camera, mats, sun, ground, walk, pipeline, tone }` for the tools.
- `src/tone.js` — **the tone curve**, in one place: the three numbers (knee, white, desat), the shader text
  the browser compiles, the CPU copy `tools/draw.js` shades with, and the argument for every number at the
  foot of the file. `patchToneCurve(BABYLON, curve, over)` rewrites the library's image-processing include
  before the pipeline is built and answers whether it took; `?tonemap=khronos` puts the library's own byte
  for byte back, `?tonemap=lin` takes the curve out altogether, which is how `tools/rawlight.js` reads a
  light off the screen.
- `src/world.js` — sky (SkyMaterial/Preetham), sun + hemisphere + bounce, shadows, fog, lawn and
  paving strips (laid from the plan in `src/court.js`), the boundary hedge, and beyond it `buildDistance`: the hills, the jungle belt in two
  ranks (near `jungleBelt`, far `jungleHighBelt`) — **clumps of crumpled domed crowns**, 4.5-8 m and 6-11 m
  across, each one wearing its own tone, and `canopyCanvas` at 2.4 m and 4 m to a repeat —, the eight
  far palms, and the far tree line as a **band**: `skylineBand`, one curtain of 596 quads round the far ring,
  24-44 m up, its top wandering at three scales and its tone written at its corners. Each layer is merged
  into one mesh and none of it is solid.
- `src/court.js` — **the plan of the pool court**: `courtEdge` (how far the stone reaches from the pool's
  centre line, x = ±11.9), `pavedGround` (every paved rectangle, `x0 x1 z0 z1` in metres of ground),
  `courtBeds` and `bedTop` (the dirt cut out of it), and `bedTone`, which weathers that dirt and answers
  one everywhere else. Four readers, one plan: `src/world.js` lays its slabs from it, `src/paving.js`
  averages the stone's tone over it, `src/garden.js` lays grass fringes along its edges, and
  `tools/draw.js` asks it where the dirt of a bed is.
- `src/ground.js` — where the visitor's feet go, read off the built meshes. A mesh shorter than
  0.75 m whose top is above the ground is something to *stand on*; taller is something to walk into.
  Anything more solid than that is a `blocker()`.
- `src/lawn.js` — the garden's big shapes: `lawnTone(x, z)`, how lush or parched the grass is in a place,
  as three multipliers of light averaged to one across the garden, and `lawnBend(x, z)`, how far the
  six-metre grass pattern is nudged off its grid there. Both are asked in metres of ground, so the browser
  (which carries them at the lawn's corners through `tintFromGround` and `groundUVs` in `mesh.js`) and
  `tools/draw.js` (which asks them at every pixel it shades) stand in one garden.
- `src/paving.js` — the same plan over stone instead of grass. `paverTone(x, z)` answers how dusty, how
  damp and how walked a place on the pool deck is, as three multipliers of light averaged to one across
  the paved ground. The dust drifts at ten metres and crusts at two; the damp lies in a band along the
  coping where water is tracked, gone two metres out; the wear is the size of a room and is the only part
  that moves the deck's light rather than its colour. Read at the deck's corners, which stand a metre
  apart, and again by `tools/draw.js` through `broad: "paver"` in `src/surface-colours.js`.
- `src/teak.js` — the same plan over teak boards instead of grass or stone. `teakTone(x, z)` answers how far
   the weather has silvered a place's boards, how wet it is where the roof drips, how worn it is where feet
   walk, and a little light and dark besides, as three multipliers **averaged to one across whichever floor
   the place stands on** — floor by floor and not pooled, or the roofed sala dims the open terrace instead
   of keeping its own oil. Read at the two floors' corners, which stand a metre apart, and again by
   `tools/draw.js` through `broad: "teak"` in `src/surface-colours.js`.
- `src/villa.js` — terrace, walls, the glass front (at `z = -3.95`, facing the pool) with its teak pier
  at the east end, the two side walls built in pieces around their window openings (`wallWithOpenings`:
  piers, sills, headers, the glass set in the reveal, sill blockers to keep a person out of the holes),
  roof, eaves, the four posts that stand under the eave, the open sala, the boarded door and lanterns on
  the north face, the soffit that closes the underside of the whole roof footprint, and the invisible
  blockers that seal the terrace and sala plinths so they are climbed only at their steps. Behind the
  front glass it also builds **the room**: `liningBack`/`liningWest`/`liningEast`, the plaster ceiling,
  the floor, the glow strip, and three warm lamps — two over the halves of the room and one in a floor
  lamp — which are `scene.roomLamps` and hang where `src/interior.js` says. `shutOutSkyFill` in
  `src/world.js` keeps the sky's fill and the ground bounce off every mesh in there, and `?room=` in the
  url dials all three together.
- `src/interior.js` — what stands in that room and is what a visitor looks at through the glass: the rug,
  the sofa, two chairs, the table and what is on it, the floor lamp, two panels on the back wall, four
  ceiling beams and a potted plant. Every mesh it returns is lit by those three lamps and by nothing else,
  receives the roof's shadow, and is not a blocker for `src/ground.js`.
- `src/pool.js` — basin, coping (eight boxes: the dry stone and its damp foot, side by side on every side),
  the waterline strips on the wall, steps, the water sheet, caustics, pool lamps and lights,
  `animate(time)`, and `walkBlocks` (where a visitor may not walk).
- `src/garden.js`, `src/props.js` — palms, shrubs, bananas, pots, lamps, string lights, rocks;
  loungers, tables, the poolside platter, sala furniture, the two deck chairs, the bench, railing.
  A coconut palm is `makePalm`: a trunk in six leaning segments and a crown from `palmCrown`, which lays
  thirteen fronds round the bud at the golden angle and marches each one along an arc, two leaflet cards to a
  station — thirty leaflets to a frond and 3,536 triangles to one crown, where all fourteen crowns in the
  Villa together used to be 924 — and the eight palms on the horizon take a third of even the new number
  (`frondsNear`, `stationsNear`, `segmentsNear`).
  A shrub is `makeLeafyMass`: three or four crumpled lumps of unequal size — one big mass with shoulders,
  not a ring of equal balls — each one a heart in `mats.bush` (small leaves at 44 cm to a repeat) inside a
  shell in `mats.bushEdge` whose leaf is cut clean out, and about thirty `bushLeafage` cards of a spray to
  the square metre of skin standing out of the shell on cards of `bushClusterCanvas`, one spray to a card,
  tilted out of the skin and lit by its own face. **A card is 15 cm of bush holding about thirty leaves of
  2.4-4.4 cm, and a small pot bush's cards shrink with its size** (`scale` in `bushLeafage`, 0.55 to 1.1):
  it used to be 17 cm and ten leaves of 4-7 cm, which made every bush a dome of ten-paddle fans — and its
  material lift is three numbers and not one, because a shrub's shaded faces are lit by warm ground bounce
  and pay evenly only in olive. See `bush` in `src/materials.js` for the measure and
  `bushClusterCanvas` for the shape. A banana is
  a clump of pseudostems in `mats.stalk` crowned by `bananaCrown`, which builds each leaf out of mesh: a rib
  marched along an arc, a blade laid level across it in four sagging bands, and the wind's tears left as
  missing geometry; both are folded into one or two meshes by `mergeParts` — which gives ONE MESH ONE
  MATERIAL, the material of its first part, so a part with a material of its own (the banana's maroon bud)
  goes in a group of its own. Potted plants are a little bush in a pot, for the same reason.
  Anything that stands on a built surface takes a `y` for it — the paving top is 0.14, the path 0.12, the
  terrace floor 0.54 and the dirt in the court's borders 0.045 — and a prop built at y 0 on any of them is
  sunk to the knee. `makeEarthBed()` lays a
  ribbon of bare laterite along a wall or a hedge, its outer edge wandering so the grass ends at an edge
  and not a ruled line: five of them now, three at the foot of the plinth and two along the south hedge.
  It is walked with the outside on the right hand, and it wears `mats.earth`. `makeTuftPlan()` says where
  the grass that *stands* goes — every seam between the garden and anything built on it, and the feet of
  the palms and the boulders — and `makeTufts()` builds all of it as one mesh, `grassTufts`: 3,829 sheets
  in about 870 clumps of four crossed sheets each (five on an old wide crown), every clump wearing its own
  colour at its corners, lit on both faces and throwing no shadow. The sheets are inked one cell apiece from `tuftAtlas` — four separate clumps of
  four ages painted into one 512 skin — so nine hundred clumps are four plants and not one, and `fringe`
  lays the verge as **drifts** (a crown and three or four crowded beside it, then a bare place) instead of
  a clump every half metre.
- `src/textures.js` — every pattern painted on a canvas (noise from `src/noise.js`), including
  `distanceCanvas`, the grey mass-and-speckle pattern the far tree line and the hills wear so that
  distance is not one flat tone. `plasterCanvas(size, base, spread)`: `base` is the render's bytes and
  `spread` how far its patches wander from them — 1 for a wall freshly trowelled, 1.35 for the base course
  the weather gets at.
- `src/materials.js` — one PBR material per surface, `matte()`, which takes the library's default glare
  (`specularIntensity` at 1) off a rough dry surface and pays the brightness back as its own colour —
  twenty-five surfaces have been through it, the garden's fifteen and the house's ten. Its `lift` is one
  number, or three (red, green and blue, for a surface that must pay its glare back in a colour and not in
  grey: the lawn is [4.2, 3.6, 2.4] at sheen 0.08). `paint()` turns bytes a picture measured into the light
  the engine works in. `src/mesh.js` — box/cylinder/plane/sphere/hip-roof/
  blocker, and `slab()` — a flat piece of ground with thickness, its top cornered up into squares
  so it can carry a tone at its corners: the paving strips, the path and the two teak floors are built with
  this, where a box (four corners to a face) could not.
- Layout: villa north (negative z), pool spans z 2.1..7.1 and x -5..5 with a paved walkway between it
  and the terrace, the visitor starts at (2.4, 1.74, 10.5) looking north, eye height 1.6 m over
  whatever floor is under them. The terrace plinth (top 0.5) runs on behind the glass to z -12.1, so
  the whole house stands on it.

- The release list: `releases/releases.json` carries every release up to **v0.63.0**, and the newest
  have `preview.png` files that are real browser pictures of the copies themselves. v0.9.0 was the first
  browser preview since the third session gave up on Chromium; one cosmetic slip is frozen into that copy
  — a second `# Changelog` title line in the middle of its `CHANGELOG.md` — and released folders may not be
  edited, so the working copy is fixed and every release from there up carries the clean file.

## Housekeeping

- **Released this session: v0.75.0 and v0.76.0** ("the butterflies and the cockroach can now be found",
  then "three cockroaches, and one of them is under your feet"). The master
  walked v0.74.0 and met neither creature, and he was right: `tools/where.js`, written for the job, counted
  five pixels of butterfly in the first picture and none of roach. Three files changed — `src/creatures.js`
  (sizes, places, and a swing across the view instead of at it), `src/materials.js` (the wings off their
  mirror and the three glows doubled) and `src/main.js` (hand `creatures` to `window.__villa`, so a probe can
  turn their clock) — plus one new tool, `tools/where.js`, which sits under `tools/` so `walkable_items` in
  `release.sh` needed no change, and no new file is loaded at the top level. Standing views for the next
  session: **2794-home … 2810-backstore** (`pictures/s79-set-0760.png`), with 2777–2793 as v0.75.0 left them
  (`pictures/s79-set-0750.png`) and 2740–2756 as v0.74.0 left them. The change itself is `pictures/s78-work2-butterfly7.png` (v0.74.0 at two and a half metres: five
  pixels, no wings) against `pictures/s79-final-butterfly7.png` and `pictures/s79-final-butterfly8.png`, the
  roach at arm's length as `pictures/s79-roach2-cockroach.png`, and the mirror the wings were wearing as
  `pictures/s79-near12.png`. `diff -r releases/v0.76.0/src src` and `diff releases/v0.76.0/index.html index.html`
  must both come out empty, and `releases/v0.76.0/preview.png` is a real browser picture of the copy itself.

- **Released this session twice: v0.68.0** ("the pool under the water stopped being graph paper") **and
  v0.69.0** ("the room's ceiling beams are timbers, not shingles"). Both `preview.png` files are real browser
  pictures of their own copies; `diff -r releases/v0.69.0/src src` came out empty, and `diff -r
  releases/v0.68.0/src src` was empty the moment it was made, so what was measured is what was published.
  Nothing new is loaded at the top level — no new file, no new folder — so `walkable_items` in `release.sh`
  needed no change. Six source files between them: `src/textures.js` (the mosaic's joint), `src/materials.js`
  (the wall-net material, the beam wood, and the two refused water dials written where the next hand will
  look), `src/pool.js` (the four wall nets and `animate`), `src/main.js` (the `?net=` and `?wrib=` switches),
  `src/interior.js` (the beams wearing `mats.beam`) and `src/surface-colours.js` (the CPU drawing told about
  all three). Standing views for the next session: **`887-home` … `903-backstore`**, against `870`–`886` with
  the pool done and the beams not, and `850`–`866` as v0.67.0 left them. The changes themselves are
  `pictures/s71-grout-pair.png`, `pictures/s71-water-pair.png`, `pictures/s71-net-pair.png`,
  `pictures/s71-beam-pair.png` and `pictures/s71-ceiling-pair.png`.
- **Released this session: v0.67.0** ("the room behind the glass was a concrete board; it is lime-washed now").
  Four source files: `src/materials.js` (the interior plaster's bytes, and why), `src/interior.js` (the two
  lamps over the room at 30, with the ladder written next to them), `src/surface-colours.js` (the CPU drawing
  following the plaster) and `src/water.js` plus `src/main.js` (the water's colour following the angle, and the
  two switches `?wem=` / `?nofilmangle=1`). Nothing new is loaded at the top level, so `walkable_items` needed
  no change. `diff -r releases/v0.67.0/src src` and `diff releases/v0.67.0/index.html index.html` must both come
  out empty after the release. Standing views for the next session: **`850-home` … `866-backstore`**, against
  `830`–`846` as v0.66.0 left them; the change itself is `pictures/s70-room-pair.png` (the frontage before and
  after, full size), `pictures/s70-room-full-pair.png`, `pictures/s70-water-pair.png`, the room from inside as
  `pictures/s70-room-inside.png`, and the whole set in one read as `pictures/s70-set.png`.
- **Released this session: v0.66.0** ("every lamp in the Villa was burning at half past five; they are
  switched off now"). Four source files: `src/materials.js` (the garden bulbs, the pool lenses and the
  room's shades come off `disableLighting` and off their burn, and the front glass loses its default
  glare), `src/pool.js` (the two point lights in the south wall are `poolFill±2.6` now, not `poolLamp`,
  and the note says they are the pit's fill and what they are worth), `src/main.js` (the same words,
  about keeping them out of the room) and `src/surface-colours.js` (the CPU drawing following the three
  fittings). Nothing new is loaded at the top level, so `walkable_items` needed no change, and no new
  tool came in. `diff -r releases/v0.66.0/src src` and `diff releases/v0.66.0/index.html index.html`
  must both come out empty after the release; `releases/v0.66.0/preview.png` is a real browser picture
  of the copy itself. Standing views for the next session: **`830-home` … `846-backstore`**, against
  `717`–`733` as v0.65.0 left them; the change itself is `pictures/s69-pool-pair.png` (the pool with
  and without its two cyan coins), `pictures/s69-bulbs-pair.png` (string bulbs, flat cream discs against
  glass globes), `pictures/s69-glass-balls.png` against `pictures/s69-glass-clean.png` (the same tool
  camera at `0,2.1,-0.3,3.1416,-0.02`), the refused frosted pane as `pictures/s69-glass-rough.png`, and
  the whole set in one read as `pictures/s69-set.png`.
- **The lesson worth carrying: a light that is only ever *seen* and never *seen by* is paint, and paint
  that lies is worse than no paint.** Fourteen sessions of tuning went into the cyan of that pool and not
  one of them asked whether a lamp burning under water at half past five is a thing that happens. The
  whole-frame numbers were useless for it — every one of the seventeen standing views stands at the same
  luminance it did — and the fault was one 32x32 cell whose mean moved 148 of 255 (`tools/diffgrid.js`
  on the two builds), plus two balls you only notice when a picture is *read* and not measured. So:
  `read` the picture, then ask of anything bright in it *what is that, and is it switched on?* The
  second cheapest question after that one is "what would this be if the sun were where it is?" — the
  same three materials went from a lie to a fact with no new geometry, no new light and no new key.
- **What the eye asked for next, in the order the pictures put it.** Read `pictures/s69-set.png` (all
  seventeen at 830) with these: (1) **the room behind the glass is board-marked grey concrete.** The
  lining reads cold, flat and dead while everything outside it is warm and varied; `?room=` dials the
  four point lamps together and `src/interior.js` says where they hang, and a warm plaster in place of
  that grey would carry the whole front of the house. It is now the largest unappealing area in the start
  view. (2) **the pool seen at a grazing angle is graph paper.** From the south path the far two thirds
  of the water shows the floor's tile grid crisp and pale and no ripple bends it, because this renderer
  has no refraction to bend it with — `?wfp=` (the water's Fresnel power) was laddered at 2, 4 and 7 and
  moved the frame by three points of luminance, which is not the answer; the answer is a pattern on the
  *transmitted* floor, not on the surface. (3) **a potted bush at six metres is broccoli** — a rounded
  bun of one green, leafless at that distance, and the same shape in all four pots (`830-home`,
  `833-sala`). The shrub work in v0.59.0 was measured at two metres. (4) The lounger cushions are one
  flat white slab each in the `west` and `pool` views. (5) From the last session's list, still true: the
  near rank of the belt wears an unpadded atlas (measured and refused, `tools/atlasair.js`), and the roof,
  the pots and the platter's ware are all one terracotta.
- **A pictures trap, met and written down so it is not met again.** `./tools/photos.sh --from N` must be
  given a number that no earlier set used *for the same camera name*, and the folder holds sets from
  three different numbering schemes in the 700s, 800s and 900s: `pictures/730-home.png` (an old set)
  sat beside `pictures/730-westwall.png` (the last session's), so a loop that globs `730-*` compared two
  different views and printed a change that did not exist. This session's sets are at 717-733 (before)
  and 830-846 (after); the older 800s are somebody else's and one file, `pictures/800-home.png`, was
  overwritten by this session's first four shots — the notes name no file in that range, so nothing
  citable was lost. Find the free numbers with `ls pictures | sed 's/-.*//' | sort -n | uniq | tail`,
  and compare whole sets by camera name, never by a bare number glob.
- **`pictures/` is up to about 2,200 files and 2.9 GB.** Nothing was pruned beyond this session's own
  `tmp-*` scratch; the eight `s69-*` pictures above are the ones kept and cited. Same warning as every
  session: read the notes before pruning anything, and look for a note that names a run as a *range*
  (`717`–`733`), which a grep for whole file names misses.

- **Released this session: v0.64.0** ("the pool was wearing a wire frame, and fifteen bump maps had no
  mip chain"). Two source files: `src/textures.js` (`cellNetField` new and `causticsCanvas` rewritten on
  it, and `texture()` now saying in its own doc why every map asks for a chain) and `src/materials.js`
  (sixteen bumps mipmapped, the water's measured as not needing it and written down as the exception);
  one tool followed in `tools/draw.js` (the CPU drawing's caustics stand-in) and `src/surface-colours.js`
  carries the net's two pitches. One new probe, `tools/causladder.json`, under `tools/`, which
  `release.sh` does not copy, so `walkable_items` needed no change. `diff -r releases/v0.64.0/src src`
  and `diff releases/v0.64.0/index.html index.html` both came out empty, the changelog was written
  BEFORE the release was run, and `releases/v0.64.0/preview.png` is a real browser picture of the copy
  itself: (110,117,89) L113, nothing black, nothing blown, 92.7% in colour, and the pool reading as a
  grid of pale tiles under moving light rather than a wire frame. Standing views for the next session: **`700-home` … `716-backstore`**, against `650`–`666` as
  v0.63.0 left them; the pairs the change lives on are `pictures/s67-home-pair.png` and
  `pictures/s67-grid-pair.png`, the canvas is `pictures/s67-caustics-old.png` against
  `pictures/s67-caustics-net.png`, and the released grid is kept as `pictures/s67-grid-before.png`.
  **`pictures/025-…038-` are no longer the sixth session's set**: `tools/photos.sh` was run without
  `--from` and overwrote them. Always check the newest number in `pictures/` before photographing a set.

- **Released this session: v0.63.0** ("the dark inside a shrub was wearing a mirror, and the atlas's air
  was black"). Four source files: `src/materials.js` (the three shrub greens all at sheen 0.02, and the
  shell's and the cards' lifts paid back), `src/textures.js` (`padAtlas` learning to give the air a quarter
  of a leaf's alpha, which is the only way a canvas will keep a colour there at all), `src/garden.js`
  (`makeLeafyMass`'s four lumps, one lean side and `ride`; the cards' tilt and the skirt's `bottom`) and
  `src/surface-colours.js` (the three bush lines re-fitted to the browser). Two tools came in, both under
  `tools/`, so `walkable_items` needed no change: **`tools/atlasair.js`** (what an atlas's air is filled
  with, and what a mip chain leaves standing) and `tools/bushface.json`, rewritten as the mirror ladder.
  `diff -r releases/v0.63.0/src src` and `diff releases/v0.63.0/index.html index.html` both came out empty,
  the changelog was written BEFORE the release was run, and `releases/v0.63.0/preview.png` is a real browser
  picture of the copy itself: (107,115,86) L111, nothing black, nothing blown, 92.7% in colour, and the four
  planted pots reading as rounded leafy mounds. Standing views for the next session: **`650-home` …
  `666-backstore`**, against `2576`–`2592` as v0.62.1 left them; the change itself is
  `pictures/s65-bush-before.png` against `pictures/s65-bush-final.png`, the two refused shapes are
  `pictures/s65-bush-shape.png` (the egg) and `pictures/s65-bush-shape2.png` (the plates), the refused card
  tilt is `pictures/s65-bush-cards.png`, and the whole set is `pictures/s65-set.png`. `pictures/` is up to
  about 2,100 files and 2.8 GB; nothing was pruned, and the warning stands — read the notes first, and look
  for a run named as a *range*, which a grep for whole file names misses.
- **The one lesson worth carrying from it: a knob that moves no pixel is a lie about the Villa, and so is a
  helper whose whole job is undone by the platform.** The bush's layer order was handed on with three
  experiments already done and the pigments cleared; the fourth, `specularIntensity` on the shell, was worth
  thirty-nine points of light, and the padding that has run on the two atlases in this garden ever since it
  was written had never once reached the GPU, because a canvas keeps no colour in a pixel with no alpha. Both
  were invisible to a change of colour and obvious to a ladder that switched one thing at a time and printed
  what the browser painted. Ask what a knob is worth before arguing about the pigment: `tools/tint.js
  --ladder` answers it in one browser run, and `tools/atlasair.js` answers it for an atlas without a scene.
- **What the eye asked for next, in the order the pictures put it.** Read `pictures/s65-set.png` (all
  seventeen views at 650) with these: (1) **The belt's near rank wears an unpadded atlas.**
  `canopyClusterCanvas` is cut out and is never passed through `padAtlas`, and it stands 27-53 m off, which
  is exactly where a mip level does its damage: pad it and measure it on the south-border camera. (2) **A
  shrub is a rounded bun with a lopsided top now** — no longer a dome with three small domes beside it, but
  at two metres a spray card is big enough to read as a spray, so the silhouette wants leafy clumps on its
  rim and not only on its face. (3) **The privet leaf in the atlas is holly**: pointed, with one bright rib;
  a privet leaf is rounder and duller. (4) **The pool's two grids sit on each other**: the mosaic and the
  caustics are both square grids at near the same size, so `home` and `pool` read as a computer grid rather
  than water over tile — one of the two wants turning to a diamond or changing its pitch. (5) The far palm
  trunks and the near one are pale, smooth and too straight, and the lawn's mower stripes still show only
  from straight above. (6) From the wood session: **the sky's fill is green** (fault 48), which is why no
  floor can be a cool grey in its shade and a warm tan in its sun; and **the terracotta is one family** —
  roof, pots and the poolside platter's ware all sit in the same red-orange band, and a roof that is not a
  pot wants its own clay.
- **Released this session: v0.60.0** ("every wood in the Villa was one marmalade; there are three woods now").
  Five source files: `src/textures.js` (`teakWoods`, `quarterTurn`, and `teakCanvas` taking a wood and a grain
  direction), `src/materials.js` (the three woods declared, the upright ones marked), `src/mesh.js`
  (`patternUp`, and `metricUVs` putting the height on the pattern's other axis), `src/teak.js` (the weather
  retuned and each floor given a base colour of its own), `src/props.js` (the sala's table moved to the
  furniture timber) and `src/surface-colours.js` (the CPU drawing followed). Two probe plans were added under
  `tools/` — `woodprobe.json`, which measures the named wood places in any build (point its `url` at a release
  folder to get the before column), and `decktone.json`, a ladder of deck colours against the same pixels. Both
  sit under `tools/`, which `release.sh` does not copy, so `walkable_items` needed no change. Standing views
  for the next session: **`2491-home` … `2507-backstore`**, against `2440-home` … `2456-backstore` as v0.59.1
  left them; the whole-set sheets are `pictures/s62-before.png` and `pictures/s62-woods.png`.
- **Released last session twice: v0.59.0 and v0.59.1.** ("a shrub was a dark green dumpling of ten paddles;
  it is a bush of small leaves now", and then comments only). The second exists for one reason: two comments
  in v0.59.0's own `src/textures.js` gave the new spray numbers the code does not carry — "about three
  quarters of half a cell" where `reach` plus a leaf comes to about half — and released folders are not
  edited, so v0.59.1's `src` is the working tree byte for byte and its preview answers v0.59.0's to a tenth
  of a channel (mean gap 0.0 of 255). The same lesson as v0.52.1, v0.54.1 and v0.55.1, met for the fourth
  time: **write the comment before you release, or release again after you write it.** Four source files
  changed for v0.59.0 — `src/textures.js` (`bushAtlas.cluster` 0.17 → 0.15,
  `bushClusterCanvas` repainted: smaller leaves, more of them, a smaller and speckled mass, brighter tones),
  `src/garden.js` (`bushLeafage` learnt `scale`, density 150 → 200 and its cap 150 → 210, the cards stand
  further out of the skin, `makeLeafyMass` passes a scale with the plant's size), `src/materials.js` (the
  three bush materials' lift 1.7 → [2.38, 3.32, 2.3] and their emissive greens up) and
  `src/surface-colours.js` (the three bush lines re-fitted to the browser, hue and not lightness). Nothing
  new is loaded at the top level, so `walkable_items` in `release.sh` needed no change, and no new tool came
  in. `diff -r releases/v0.59.1/src src` and `diff releases/v0.59.1/index.html index.html` both came out
  empty, the changelog was written BEFORE each release was run, and `releases/v0.59.1/preview.png` is a real
  browser picture of the copy itself: (109,112,83) L109, nothing black, nothing blown, 94.1% in colour — and
  the planted pots reading as four green clipped bushes in the start view. Standing views for the next
  session: **`2440-home` … `2456-backstore`**, against `2400`–`2416` as v0.58.1 left them; the pairs this
  change lives on are `pictures/s61-shrub-v0581.png` against `pictures/s61-shrub-after.png` (a bed shrub at
  two metres) and `pictures/s61-pot-v0581.png` against `pictures/s61-pot-after.png` (the big pot), the spray
  itself as `pictures/s61-spray-before.png` against `pictures/s61-spray-small.png`, and the whole set in one
  picture as `pictures/s61-set-2440.png`.
- **The one lesson worth carrying from it: a cut-out material's mean in `tools/cover.js` is a mean of the
  PLANT and not of its leaves.** Twenty files of that grid, and it cost an hour: `bushLeaf` "measured"
  (40,65,10) L56 while sixty per cent of the pixels attributed to it were the air between the cards showing
  the bush's interior, and `--patch` over the shrub's own disc answered L78 in the same minute. The bullet
  under *How to look at it* now says so. The honest measure for a plant is `--patch` over its own silhouette
  in a picture, and the before numbers for this change were taken again off `releases/v0.58.1/index.html` at
  the same cameras so that before and after are the same question.
- **Released this session twice: v0.55.0 and v0.55.1.** The second exists for one reason: three comments
  in v0.55.0's own `src/textures.js` pointed at `tmp-s57-*` working pictures that are deleted at the end
  of the session, and released folders are not edited — so `diff -r releases/v0.55.0/src src` names those
  three comment lines and nothing else, and v0.55.1's `src` is the working tree byte for byte. No pixel
  moved between them: `tools/canvassave.js tuftCanvas 256 x.png --tile 1` paints a clump whose md5 is
  `0e783ead7578cff454c48ba9ff63c0ca` from either. **The lesson, which is the same one v0.52.1 and v0.54.1
  were made for: name the pictures a comment will cite BEFORE the release, or write the comment after it.**
  Everything below belongs to both.
- **Released this session: v0.55.0** ("a clump of grass was a maize plant and a cabbage; it is grass
  now"). Four source files changed — `src/textures.js` (`tuftShapes`, `clumpCanvas`, `tuftAtlas`,
  `tuftAtlasCanvas` for the old one-clump `tuftCanvas`, which is kept as a one-clump painter for
  `tools/canvassave.js` and the CPU drawing), `src/materials.js` (the skin is an atlas and clamped, and
  `mats.tuft.emissiveColor` down to (0.21,0.36,0.13)), `src/garden.js` (`makeTufts` wears an atlas cell,
  `fringe` lays drifts, the lawn's scattered clumps are smaller) and `src/surface-colours.js` (`tuft`'s
  tint and glow) — plus one new tool, `tools/sheet.js`, under `tools/`, which `release.sh` does not copy,
  so `walkable_items` needed no change. `diff -r releases/v0.55.0/src src` and
  `diff releases/v0.55.0/index.html index.html` both came out empty, the changelog was written BEFORE the
  release was run, and `releases/v0.55.0/preview.png` is a real browser picture of the copy itself: the
  start view, the pool, the villa lit, nothing blown. Standing views for the next session to compare
  against: **`2187-home` … `2203-backstore`**, against `2170`–`2186` as v0.54.1 left them; the
  before-and-afters this change lives on are `s57-clump-maize.png` / `s57-clump-grass.png` (one clump at
  three metres), `s57-verge-maize.png` / `s57-verge-cabbage.png` / `s57-verge-grass.png` (the west fringe
  at six metres, three stages), `s57-tile-maize.png` / `s57-tile-grass.png` (the squares) and
  `s57-atlas-four.png` (the skin of four clumps).
- **`tools/sheet.js` is the new way to look at a lot of pictures at once**: `node tools/sheet.js out.png
  --set 2187 --cols 3 --width 420` pastes the seventeen standing views into one PNG, each lettered with
  its own name, and one read of it is what found the cabbage. It takes a list of files instead of `--set`
  for before-and-after pairs. Every set of seventeen costs about 3 MB until it is shrunk; the pictures it
  made this session were scratch and are deleted, and only the ones named above are kept.
- **`pictures/` is up to about 1720 files.** Nothing was pruned; nine working pictures were renamed to
  `s57-*` because the notes name them, and the scratch `tmp-s57-*` crops are deleted. The same warning as
  last session: read the notes before pruning anything, and look for runs named as a *range* or a glob,
  which a grep for whole file names misses.
- **Released this session: v0.53.0** ("a lawn of separate blades, the mower's stripes, and no more mint").
  Four source files changed — `src/textures.js` (`swardCrowd`, from the session before this one),
  `src/lawn.js` (`mowStripes`, in `lawnTone`), `src/materials.js` (the `lawn` and `tuft` lifts in the table `matte` builds) and `src/surface-colours.js` (the two tints) — plus four probe plans under `tools/`, which
  `release.sh` does not copy, so `walkable_items` needed no change. `diff -r releases/v0.53.0/src src` and
  `diff releases/v0.53.0/index.html index.html` both came out empty, the changelog was written BEFORE the
  release was run (the last session's bookkeeping slip, not repeated), and `releases/v0.53.0/preview.png`
  is a real browser picture of the copy itself: the start view, the pool, the villa lit, nothing blown.
  Standing views for the next session to compare against: **`2114-home` … `2130-backstore`**, against
  `2097`–`2113` as v0.52.1 left them; the before-and-afters this change lives on are
  `s54-tile-grass.png` / `s54-tile-crowd.png` / `s54-tile-crowd3.png` (the tile, three attempts),
  `s55-lawnover-before.png` against `s55-lawnover-deep.png` (twenty metres straight down, the stripes in
  and out), and `2112-southborder.png` against `2129-southborder.png` (the mint, before and after).
- **`pictures/` is up again to 1686 files and 2.3 GB.** Forty-eight scratch `tmp-*` crops were deleted at
  the end of the session; nothing named by a note was touched. The same warning as last session: read the
  notes before pruning anything, and look for runs named as a *range* or a glob, which a grep for whole file
  names misses.
- **Released this session twice: v0.52.0 and v0.52.1.** The second exists for one reason: two comments in
  v0.52.0's own `src` still described the three-band blade and a vein spacing that was never measured, and
  released folders are not edited — so `diff -r releases/v0.52.0/src src` names those comments and nothing
  else, and v0.52.1's `src` is the working tree byte for byte. Nothing on screen moved between them. The
  standing set and the pictures below belong to both. One bookkeeping slip to own up to: `release.sh` writes
  a release's menu page out of `CHANGELOG.md` at the moment it is run, and v0.52.1 was run before its
  changelog entry was written — so `releases/notes/v0.52.1.md` was made by hand with the very code the script
  uses (the script refuses to re-release a version, and old copies are not edited). Release after you write.
- **Released this session: v0.52.0** ("a banana was a handful of flat green plates; it is a plant now").
  Four source files changed — `src/textures.js` (`bananaBladeCanvas` for `leafCanvas`, and `stalkCanvas`
  repainted), `src/materials.js` (`mats.bananaLeaf` for `mats.leaf`, plus `mats.bud`), `src/garden.js`
  (`bananaCrown`, and the bud in its own mesh) and `src/surface-colours.js` (`bananaLeaf` and `bud` in,
  `leaf` out, `stalk` re-made) — plus one shape test out of `tools/draw.js` (an unknown `cut` now throws)
  and two probes re-aimed in `tools/foliage.json`. One new tool, `tools/tris.js`, under `tools/`, which
  `release.sh` does not copy, so `walkable_items` needed no change. `diff -r releases/v0.52.0/src src` and
  `diff releases/v0.52.0/index.html index.html` both came out empty, and its `preview.png` is a real browser
  picture of the copy itself. Standing views for the next session to compare against: **`2080-home` …
  `2096-backstore`**, against `2050`–`2066` as v0.51.0 left them; the before-and-afters this change lives on
  are `pictures/s53-banana-before.png` against `pictures/s53-banana-close.png` (same camera, 2.1 m) and
  `s53-banana-far.png` at 3 m, with the tune steps `s53-banana-mesh/02/03/04.png`, the bud crop
  `s53-bud-crop.png`, three CPU drawings of that camera (`s53-drawn-banana*.png`) and the shade pair
  `s53-shade-on.png` / `s53-shade-off.png` (fault 31, which the banana is now out of).
- **`tools/tris.js` is the new way to price a plant.** The Villa is 672,991 triangles and the shrubs and
  their leaf cards are **393,600 of them (58.5%)** — everything else is single-digit percentages. Nothing
  about that has cost a frame yet (1.8 fps, unchanged in a same-run comparison), so this is not a fault; it
  is only where a session that ever needs triangles back should look, and it is now measured instead of
  guessed.
- **`pictures/` is heavier than ever**: 1606 files and 2.2 GB, and every standing set from `2050` up is in
  it at ~1.5 MB a picture. Nothing was pruned this session because the notes name particular files back to
  the third session, and a note that points at a deleted picture is a note that cannot be checked. If it is
  pruned, read the notes first (and look for a note that names a run as a *range*, which a grep for whole
  file names misses — see the pruning warning two bullets below this one).
- **Released this session: v0.51.0** ("the palms were flat fans; they are trees now"). Five source files
  changed — `src/textures.js` (`palmBladeCanvas` for `frondCanvas`), `src/materials.js` (`mats.palmLeaf` for
  `mats.frond`), `src/garden.js` (`palmCrown`, and the nuts), `src/world.js` (the far palms' detail and their
  vertex colours) and `src/surface-colours.js` (the new sheet's entry) — plus one shape test out of
  `tools/draw.js` and two probes re-aimed in `tools/foliage.json` and `tools/cover.js`'s help. Nothing new is
  loaded at the top level, so `walkable_items` in `release.sh` needed no change. Standing views for the next
  session to compare against: **`2050-home` … `2066-backstore`**, against `2010`–`2026` as v0.50.0 left them.
- **A pruning, and the trap in it.** Thirty-five working pictures were cleared out of `pictures/` at the end
  of the forty-second session, on the rule that a file no note names is safe to lose. **Nine of them were
  named** — `tmp-mint-01..07.png` and `tmp-warm-01..02.png`, the forty-first session's lawn ladder — because
  a note that names a run as a *range* is invisible to a grep for whole file names. The two source comments
  and the three notes that pointed at them now say plainly that they are pruned, and the numbers they carried
  are written out in full where the pictures used to be (`src/materials.js` has the lawn ladder and the deck
  ladder in tables, so nothing measured is lost — only the pictures). If you prune here, look for `..` in the
  notes before you delete anything, and renumber your own pictures out of the ranges the notes already name.
- **Released this session: v0.47.0** ("the near rank of the jungle was confetti; it is a wood of branch-ends
  now"). Its `preview.png` is a real browser picture of its own copy, and `diff -r releases/v0.47.0/src src`
  came out empty afterwards, so what was measured is what was published. Nothing new sits at the top level, so
  `walkable_items` in `release.sh` needed no change; the one new file in the folder is `tools/canvassave.js`.
- **Released this session: v0.58.0 and v0.58.1** ("the grass that stands up out of the lawn was a row of
  green crowns; it is grass now", and the lawn's strays coming down to size after it).
  Four files changed — `src/textures.js` (`clumpCanvas`: blade width, count, splay, foot wash, and the
  `young` shape), `src/garden.js` (`makeTufts`: sheets, width, height; `makeTuftPlan`: the tint, the
  fringe's bare places and the strays' size), `src/surface-colours.js` (the clump's tint and glow,
  re-fitted) and `tools/draw.js` (the cut's blade
  columns) — and `diff -r releases/v0.58.1/src src` came out empty afterwards, so what was measured is what
  was published. Nothing new is loaded at the top level, so `walkable_items` in `release.sh` needed no
  change. Standing views for the next session to compare against: **`2400-home` … `2416-backstore`**, with
  the before-and-after pairs `2320-home` against `2400-home` and `2328-westlawn` against `2408-westlawn`, and
  the close work named `s60-*`. `pictures/` is up to about 1,880 files; the working pictures of this session
  are the twenty `s60-` ones and every number quoted here can be checked against them.
- **Released this session: v0.56.0 and v0.57.0.** Two notes on the bookkeeping, both worth keeping. First,
  **the loop must be run to the end**: v0.56.0 (the palm bark) was measured, written into `CHANGELOG.md` and
  into these notes by the fifty-eighth session, and never published — the fifty-eighth session simply stopped
  after writing the entry, so for a whole session the owner's menu was still serving the brown-coin trunk and
  `diff -r releases/v0.55.1/src src` was not empty. A change that is not released is a change the owner never
  sees, which is the rule at the bottom of these notes; check `diff -r releases/<latest>/src src` before you
  call a session finished. Second, both copies were checked the way the notes ask: `diff -r releases/v0.56.0/src
  src` and `diff -r releases/v0.57.0/src src` both came out empty, and each `preview.png` is a real browser
  picture of its own copy — v0.56.0 at (108,111,82) L108, nothing black, nothing blown, 94.1% in colour, and
  v0.57.0 answering it to half a channel, because the ridge change moves no pixel in the start view that
  a whole-frame average can see. Standing views for the next session: **`2320-home` … `2336-backstore`**.
  One source file changed for v0.57.0 (`src/villa.js`, and `jargon.md` for the word `crest`); nothing new is
  loaded at the top level, so `walkable_items` in `release.sh` needed no change.
- **Released this session: v0.45.0** ("the lawn was the colour of pond scum; it is grass now"). Three source
  files changed — `src/lawn.js` (the two ends of the grass), `src/materials.js` (the sward's lift),
  `src/surface-colours.js` (the drawing's hue for it) — and `diff -r releases/v0.45.0/src src` came out empty.
  Standing views: **`1740-home` … `1756-backstore`**.
- **Released this session: v0.44.0** ("the far rank of the jungle was torn green sails; it is a wood now").
  Its `preview.png` is a real browser picture of its own copy and answers the working start view
  (`pictures/1720-home.png`) to 0.1 of a channel — (109,112,83) L110, nothing black, nothing blown, 95.8% in
  colour — and `diff -r releases/v0.44.0/src src` came out empty, so what was measured is what was published.
  Three source files changed: `src/world.js` (the far rank is a `skylineBand` curtain now, and `skylineBand`
  grew `waves` and `warp`), `src/materials.js` (`mats.jungleFar` is solid, not cut, and its bytes went up a
  sixth), `src/surface-colours.js` (the drawing's fit for it, re-made). One new probe plan, `tools/beltcurtain.json`.
  Nothing new is loaded at the top level, so `walkable_items` in `release.sh` needed no change. Standing views
  for the next session to compare against: **`1720-home` … `1736-backstore`**.
- **Released this session: v0.40.0** ("the pool deck was grey asphalt; it is cut sandstone now"). Three
  source files changed — `src/textures.js` (`paverCanvas`), `src/materials.js` (the paving's sheen 0.18, the
  coping's 0.14, and the ladder that chose them), `src/surface-colours.js` (the deck's mirror of the new
  canvas) — and `diff -r releases/v0.40.0/src src` came out empty, so what was measured is what was
  published. Nothing new is loaded at the top level, so `walkable_items` in `release.sh` needed no change.
  Standing views for the next session to compare against: **`1250-home` … `1266-backstore`**, with the
  before-and-after pairs `1232-path` against `1255-path` (the deck, a third of the frame) and `1233-west`
  against `1256-west`; the close-ups the change was decided on are `pictures/tmp-deckcrop.png` (the old grey
  tarpaper), `tmp-deck3a-crop.png` (pale stone at sheen 0.25, too bright) and `tmp-deck3b-crop.png` (the same
  stone at 0.12, back to grey); and the two refusals are photographed as `tmp-hillred.png` / `tmp-hillhide.png`
  (the hills that are not there) and `tmp-grassA`/`tmp-grassC`, `tmp-gsA`/`tmp-gsC` (the lawn's two distances
  wanting opposite colours).
- **Released this session: v0.39.0** ("the two great pots at the terrace steps are planted"), on top of
  **v0.38.0** ("the lawn was a mirror aimed at the sky"). See the forty-first session's entry for the
  files, the checks and the pictures; both releases' `diff -r …/src src` came out empty.
- **Released this session: v0.38.0** ("the lawn was a mirror aimed at the sky"). One source file changed
  (`src/materials.js`: the lawn's and the tufts' sheen and lifts, and `matte` learning to lift three
  channels separately); one probe added (`tools/lawnmint.json`, under `tools/`, which `release.sh` does not
  copy), so `walkable_items` needed no change and the Villa loads nothing new at the top level. `diff -r
  releases/v0.38.0/src src` and `diff releases/v0.38.0/index.html index.html` came out empty, so what was
  measured is what was published. Standing views for the next session to compare against: **`1227-home`
  … `1243-backstore`**, with the overhead `pictures/1226-air.png` — except that `1244-home`, `1247-sala`,
  `1248-west` and `1249-pool` show those four places after the pots were planted, and are the ones to
  compare a terrace against; the ladder the change was decided on was photographed as
  `pictures/tmp-mint-01..07.png` and `pictures/tmp-warm-01..02.png` — all nine of those are pruned now, so
  what can still be checked is the numbers in `src/materials.js` and `src/lawn.js` — and the
  before-and-after pairs are
  `1118-southborder` against `1242-southborder`, `1102-air` against `1226-air`, `1117-grass` against
  `1241-grass`.
- **Released this session: v0.37.0** ("space to fly, and what the air showed about the palms and the
  lawn"). Four source files and the page changed: `src/main.js` (the flying, and `pinned` where `walking`
  was), `index.html` (one line of hint), `src/garden.js` (`makePalm` exported, with `nuts` and `foot`
  knobs), `src/world.js` (the eight far palms built by that builder) and `src/textures.js` (the lawn's bare
  earth) — plus the leafy-shrub work the previous session left unpublished. `diff -r
  releases/v0.37.0/src src` and `diff releases/v0.37.0/index.html index.html` both came out empty. One new
  tool, `tools/flight.js`, under `tools/`, which is not copied, so `walkable_items` in `release.sh` needed
  no change. Standing views for the next session to compare against: `1103-home` … `1119-backstore`, with
  the overhead `1102-air.png`, the flight screenshots `1120-airborne.png` and `1121-airborne.png`, and the
  two before-and-afters `pictures/1014-grass.png` (rust) against `pictures/1100-grass.png` (grass).
- **Released this session: v0.35.0** ("the grass was hanging from its tips, and the lawn was sown with black
  commas"). Its `preview.png` is a real browser picture of its own copy and answers the working start view
  (`pictures/593-home.png`) to 0.1 of a channel — (126,124,99) L123, nothing black, nothing blown, 94.9% in
  colour — and `diff -r releases/v0.35.0/src src` came out empty, so what was measured is what was published.
  Three source files changed (`src/garden.js`, `src/textures.js`, and the tuft cut in `tools/draw.js`, which is
  not copied); nothing new is loaded at the top level, so `walkable_items` in `release.sh` needed no change.
  One probe was added (`tools/lawndark.json`, also not copied). Standing views for the next session to compare
  against: `593-home` … `609-backstore`; the two before-and-after close-ups the shrub and the tufts live on are
  `pictures/tmp-bush-before.png`, `pictures/tmp-bush-after.png`, `pictures/tmp-tuft-before.png` and
  `pictures/tmp-tuft-after.png`.
- **Released this session: v0.34.0** ("the house took off its varnish: a clay roof, teak walls and stone
  paving"). Its `preview.png` is a real browser picture of its own copy and answers the working start view
  (`pictures/536-home.png`) to 0.1 of a channel — (126,124,99) L123, nothing black, nothing blown, 95.9% in
  colour — and `diff -r releases/v0.34.0/src src` came out empty, so what was measured is what was published.
  One source file changed (`src/materials.js`, ten `matte()` lines and their measurements); nothing new is
  loaded at the top level, so `walkable_items` in `release.sh` needed no change. Standing views for the next
  session to compare against: `536-home` … `552-backstore`.
- **Released this session: v0.33.1** ("the shrubs came off the varnish as soot; they are paid back a little
  more"). One number: the bush's diffuse lift 1.3 → 1.7, measured with `tools/tint.js`
  (`pictures/477-bush-01..03.png`). `diff -r releases/v0.33.1/src src` empty.
- **Released this session: v0.33.0** ("the garden was wearing a varnish, and it was called grass"). Its
  `preview.png` is a real browser picture of its own copy and answers the working start view
  (`pictures/460-home.png`) to the last byte — (136,131,106) L130, nothing black, nothing blown, 94.2% in
  colour — and `diff -r releases/v0.33.0/src src` came out empty, so what was measured is what was
  published. Nothing new is loaded at the top level — one material knob in `src/materials.js`, which is
  already copied — so `walkable_items` in `release.sh` needed no change, and `tools/tint.js`, the tool that
  found the fault, sits under `tools/`, which is not.
- **Released this session: v0.32.0** ("the shrubs were striped green loaves and the bananas were little
  tables; they are a bush and a banana now"). Its `preview.png` is a real browser picture of its own copy —
  the start view with the two planted pots reading as clipped bushes — and `diff -r releases/v0.32.0/src src`
  came out empty, so what was measured is what was published. Two new source-level surfaces went in
  (`bushCanvas`, `stalkCanvas`, and their two `SURFACES` entries); nothing new is loaded at the top level, so
  `walkable_items` in `release.sh` needed no change. One tool was corrected (`tools/planted.js`, world box
  not `mesh.position`) and one probe re-aimed (`tools/roomprobe.json`, the room plant's new mesh name); both
  live under `tools/`, which is not copied.
- **Released this session: v0.31.0** ("the jungle behind the hedge was a row of green eggs; it is a canopy
  of crowns now"). Its `preview.png` is a real browser picture of its own copy — the start view at L137,
  95.0% in colour, nothing black, nothing blown — and `diff -r releases/v0.31.0/src src` came out empty,
  so what was measured is what was published. Three new tools went in with it (`tools/treeline.js`,
  `tools/crop.js`, `tools/ask.js`); all three sit under `tools/`, which `release.sh` does not copy, so
  `walkable_items` needed no change — the Villa loads nothing new at the top level.
- **Released this session: v0.28.0** ("the court gave 111 m² of its cut stone back to the lawn") **and
  v0.28.1** (three comments in the released copy still described the old court; nothing on screen moved).
  Both `preview.png` files are real browser pictures of their own copies and answer the working start view
  (`pictures/1000-home.png`, `1017-home-comments.png`) to 0.1 of a channel, nothing black, nothing blown,
  96.0% in colour; `diff -r releases/v0.28.1/src src` came out empty, so what was measured is what was
  published. v0.28.0's `src/garden.js` carries a stale comment about where the court's stone ends, which is
  why v0.28.1 exists at all — released folders are not edited. One new source file went in with the change
  (`src/court.js`); it sits inside `src/`, so `walkable_items` in `release.sh` needed no change.
- **Released this session: v0.27.0** ("the pool court was 440 m² of stone; two borders of dirt and planting
  are cut into it"). Its `preview.png` is a real browser picture of its own copy and answers the working
  start view exactly — (141,138,105), L136, nothing black, nothing blown — and `diff -r releases/v0.27.0/src
  src` came out empty, so what was measured is what was published.
- **Released this session: v0.25.0** ("grass that stands up where the garden meets the stone") and
  **v0.25.1** (the same grass, corrected: 82 clumps had been laid on the pool paving, and the far paving was
  in the wrong place in the plan). Both previews are real browser pictures of their own copies; `diff -r
  releases/v0.25.0/src src` was empty before the correction, and v0.25.1's `src` is the working tree byte for
  byte. v0.25.0 is frozen with the grass on the stone — old releases are not edited — so compare v0.25.1 if
  you are looking at the fringe.
- Released this session: **v0.24.0**, "the sunlit half was living in the last six bytes of the picture; the
  Villa runs its own tone curve now". Its `preview.png` is a real browser picture of the released copy and
  its `src` folder is the working tree's byte for byte, so what was measured is what was published.
- Released this session twice: **v0.20.0**, "the foot of the house was soot; the base course is a weathered
  grey cement now", and **v0.21.0**, "the shrubs along the south hedge stand in a bed of laterite now". Both
  previews are real browser pictures of their own copies and both `src` folders came out byte for byte the
  working tree's, so what was measured is what was published.
- Released this session as **v0.14.0**, "teak floors that have lived outdoors: silvered in the sun, honey
  under the roof, damp where the roof drips". Its `preview.png` is a real browser picture of the copy and
  matches the working start view to a tenth of a point (L140, 96.0% in colour, brightest pixel 243, nothing
  black), and `diff -r releases/v0.14.0/src src` came out empty — so what was measured is what was
  published, which is worth saying out loud because it has not been true of every past release.
  Releases since v0.8.0 have had real browser previews; v0.3.0 through v0.7.3 carry CPU
  drawings named `preview-drawn.png`, because those sandboxes could not start a browser — read those as
  shape and colour scheme and not as proof. What each release did is in `CHANGELOG.md`, which is where
  per-release detail belongs; this file is for what is still wrong and for what the tools mean.
- One line in the released note for **v0.10.1** is frozen a shade strong: `releases/notes/v0.10.1.md` says
  "thirteen pixels in a column and not one of them differing", where what was measured is that the red
  never left 201-207 across the band. The working `CHANGELOG.md` says it exactly; released folders are not
  edited, so the slip stays where it is, as v0.9.0's does (a second `# Changelog` title in its copy).
- **Finish the loop every time: fix, look, `NOTES.md`, `CHANGELOG.md`, release.** The menu serves
  releases, not the working tree, so work left in `src/` unseen is work the owner never sees — which is
  why a garden that had been fixed still looked grey to him the session after it was fixed.
- **A tool that stands a Babylon API out is a lie about the Villa.** Every tool here passes a stand-in for
  the shadow lamp, and because two of them made it do nothing, a bad shadow-caster argument went unseen
  for seven sessions and reached a real browser as a page that never drew. If a stand-in cannot do the
  work, make it at least check its arguments — that is what `tools/feet.js` and `tools/draw.js` do now.
  `vendor/babylon/babylon.js` is Babylon 9.30's `babylon.max.js` byte for byte, which is why the owner's
  error message reads `e.getChildMeshes` and not a mangled name.
- **When there is no browser, say so and release anyway with a stub**, so a release is never left half
  made: `PATH=/tmp/relbin:$PATH ./release.sh <version> "…"`, with a `screenshot` in `/tmp/relbin` that
  refuses at once and a link to node beside it. The script warns, as it should, and carries a drawing
  instead of a photograph.
- `./release.sh <version> "<one line>"` publishes; the owner's menu is `releases/index.html`.
  Never edit an old folder under `releases/`. `walkable_items` in the script is `index.html src
  vendor assets`; nothing new is loaded at the top level, so it has not needed changing.
- **A card that reads black is a normal problem and not a colour problem.** The hedge's crest came out a
  scorched band along a sunlit hedge — crest (31,63,10) against face (73,111,19) — and nothing on the
  colour side of the material could buy it back: `albedoColor` at 2.2 times its own value moved
  the green nine points, and `twoSidedLighting = false` moved it none at all. Rewriting the mesh's
  normal buffer to point up-and-out rather than along each card's own face — same cards, same places,
  same everything else — read (129,170,54). The test costs one browser run: `tools/cover.js --js` will
  rewrite a vertex buffer on the live page (`const m = scene.meshes.find(x => x.name === "hedgeCrest");
  const n = m.getVerticesData("normal"); …`) and it answers the question a picture can only ask. Written
  up in `hedgeCrest` in `src/world.js`, and the rule under it is that a flat card is a proxy for a
  *cluster* of leaf, so its normal is the cluster's average facing and not the plane the quad happens
  to lie in.
- **A second cube map rendered at boot costs the whole Villa its ambient light.** Filling a probe
  (`RenderTargetTexture.render()`) while the sky cube's `prefilter` is still running — and `prefilter`
  answers later, not at once — leaves every shaded face in every view 5 to 24 points of luminance darker,
  in pictures that have no pool in them at all: this was caught only by running the whole standing set
  (`backstore` L99 → L84, `westwall` L90 → L72). Fill probes after the first frame with
  `scene.onAfterRenderObservable.addOnce`, and read the fifteen views that have nothing to do with the
  change before believing a change was local.
- **A single-sided surface wound the wrong way is simply not drawn, and `tools/cover.js` will still name it:
  picking ignores winding.** The pool's water lay wound facing the centre of the earth for who knows how
  many sessions — the released Villa has a dry pit with two glowing sheets floating in the air over it
  (`pictures/tmp-pA-crop.png`) — because every pick over the basin answered `water` and every material dial
  therefore seemed to be a dial that did nothing. Same lesson as the `poly()` roof below, and wider: **after
  any change to a flat surface, make the picture change.** If a change to a material moves no pixel, do not
  tune it: paint it emissive red, or delete the mesh, and find out whether it was ever on screen.
- **A second `?` in a url silently eats every parameter after it.** `…index.html?view=…&float=1?wfp=3`
  asks for `float=1?wfp=3`, one parameter, and the page runs its defaults. Half of a dial ladder measured
  the same build three times that way; join with `&`, and treat "three settings, three identical numbers" as
  a broken url and not as a setting that does nothing.
- **A vertex buffer that does not exist is not updated.** `mesh.setVerticesData(kind, data, false)` does
  nothing at all when the mesh has no such buffer — the third argument is *update if it exists*. The lawn's
  tone was written that way and the garden stayed flat while the code insisted otherwise; `true` creates the
  buffer. `tools/lawnprobe.json` is the check: it paints the same places twice, with the tone and with the
  colours forced back to one, and if the two agree the engine is not carrying the colours.
- **A mesh built by `poly()` has one skin and no thickness: a face wound the wrong way is culled and
  simply is not there, and nothing complains. The hip roof's north slope was wound that way for six
  sessions and the house had no visible roof from the lawn behind it. After any change to `hipRoof`, or
  to any `poly()` mesh, stand a camera on each side of it and read `--pick`: the face normal must point
  out of the building, and the surface must be named at all where it should be.
- Babylon 9 details that bit: `ShadowGenerator.addShadowCaster` (not `addMesh`); a colour pattern
  used directly as a bump map renders black ground; `usePhysicalLightingMode` (set in `pbr()`) makes
  some specular knobs do nothing; `imageProcessingConfiguration.toneMappingCurve` changed no pixels
  at runtime; `SkyMaterial` wants `useSunPosition`/`sunPosition`, not `sunDirection`; and the camera
  collision engine is not fit for this frame rate, as above.
- NullEngine (npm `babylonjs`, no GPU) builds the whole scene in Node — that is how `feet.js` works.
  Give it a `Proxy` of plain `PBRMaterial`s and no canvas, and skip `buildSky`.
- **The folder is getting heavy**: `pictures/` holds 1213 files and 1.9 GB, most of them superseded sets of
  the seventeen standing views. Nothing was pruned in the thirty-eighth session because the older notes name
  particular files — `pictures/460-home.png`, `pictures/431-spec-01.png`, and so on — and a note that points
  at a deleted picture is a note that cannot be checked. If it is ever pruned, read the notes first and keep
  every file one of them names.



### The pond's rim, and the black triangles on top of its stones

Two faults from the 2860 standing set, both of them stone.

**The rim was a kerb.** Thirty stones, every one between 1 and 12 cm proud of the grass, all of them the same
material and all touching: a chain of brown buns. What broke it, in order of what the picture showed:
- **crown height over a four-times wider range** (`-0.02 + rand()*0.26`): some buried to the shoulder, some a
  hand high. The silhouette is what the eye reads first on a row.
- **a fifth of them are flat slabs** (7 cm thick, a third wider across the edge) laid over the bank instead of
  buns. First cut in `mats.coping` — the pool's pale cut stone — and that gave a line of paper plates at **L129
  against L67..77**; vertex tone took the edge off and did not hide it, so the shape stayed and the material went
  back to the pond's own rock.
- **two or three to an edge not fetched** (`rand() < 0.1`, never at a corner): the chinking fills the hole and a
  little bank shows through. A rim that stops and starts is wallered; an unbroken rim is a kerb.
- **sizes and a per-stone `tone`** (new option on `skinTint`, applied *after* the mean is divided out — put
  before it, it divides straight back out again), and a third of them in the lawn's greyer rock.

Tried and put back: `segments: 8` on the corner boulders with a rougher fold, on the strength of the wheel look
below. It gouged the struck face into a pumice of black wedges. Six cuts stays.

**The black triangles.** `facet` decides which way a face looks by leaning it away from the stone's own middle.
On a struck crown the wedges meet at the sphere's pole, their centres sit almost on the middle, and the test was
deciding by a hair — half of them came out pointing at the earth and were lit by nothing, so the big near boulder
looked as though it was holed (`pictures/s86-pondlawn-c.png`, and `pickat` said the dark pixels were `pondBoulder3`
at L58, so the stone was whole: it was *unlit*, not open). Now a face above a stone's own middle may not point
downward; below the middle, where the underside is buried, it is left as it is. The lean of the struck face was
steepened to `0.34..0.64` so the flat reads foreshortened from the lawn instead of full-face.

Released as **v0.84.0**. Nothing WRONG, 81.0% on foot (a tenth of a point down: two rim stones are now buried and
do not count as ground to stand on), 60.0 fps at 961 meshes, 2006 of 2048 shader slots free.
Pictures: `pictures/s86-rim-pair.png` (the rim before and after at one camera), `pictures/s86-pond-rim-c.png`,
`pictures/s86-pondlawn-c.png`, `pictures/s86-rocklawn-c.png`.

### The beds are planted now, not queued

Every shrub in the Villa is made by one builder, `makeLeafyMass`, at one clipping height (`SHRUB_CLIP = 0.46`)
and a size picked from a short list. That is how the back of the house came to have two identical cauliflower
balls three metres apart on either side of the door, and the south hedge eight bushes of a height.

The fix is one number per plant, not a new plant: `clip` is the height the shears went across, as a fraction of
the plant's own width, and `clip: 1` leaves the dome alone. So the six along the back wall now carry their own
size and their own clipping — `1.35/1`, `0.85/0.62`, `1.15/0.86`, `1.4/1`, `0.8/0.6`, `1.2/0.9` — and the eight
by the hedge likewise. What makes a row read as a plan is that one plant was cut to knee height and the next was
left free, which is the only thing a gardener actually does differently from a machine.

Released as **v0.83.4**. Nothing WRONG, 81.1% on foot, 60.1 fps at 960 meshes, 2006 of 2048 shader slots free.
Pictures: `pictures/s84-rearbed-c.png` (the door, its threshold, and the bed) and `pictures/s83-rearbed.png`
(the whole back wall — lanterns as dark cases, door in its reveal, weathering at the wall's foot).

### The pond takes the sky

`environmentalIntensity` on `mats.pondWater` was 0.4, a number set when the fear was a plate of pale foil seen
from a first-floor window (the note above the material still says so). At a person's eye on the bank the same
number left a dark green sheet — L41..60 — and a dark green sheet twelve metres off reads as a hole in the lawn
and not as water.

Half of any pond is seen at a shallow angle, and a shallow angle is where water mirrors the sky: that sheen is
the standing signal, the one that says WATER before you are near enough to see the bottom. The near half, looked
down through, still shows the silt, because the alpha and the near-black albedo were not touched. To **0.85**
takes the water to **L42..100** along the bank view, the bright end being wave crests, and the cast stays green
and not blue — the bump (`level 0.2`) and the glass roughness (0.05) stay as they were, so the glint is tight.

Checked from overhead too: straight down it is a dark sheet with small glints, which is what a pond is from a
tree. No standing view took damage.

Released as **v0.84.1**. Nothing WRONG, 81.0% on foot, 60.0 fps at 961 meshes.
Pictures: `pictures/s87-pond-bank-c.png`, `pictures/s87-pond-west-c.png`.

### Frogs you can actually find, and stones that do not float

`tools/where.js` measures what a creature *moves* on the screen: the same moment drawn twice, once with the
creature cut out, and every pixel that changed IS the animal. Stood at the pond bank it said what I had not
bothered to ask — **three of the five frogs moved nothing at all**: one behind `pondBoulder1`, one in the sedge
(`picks grassTufts`), one on the stone under the visitor's own feet, projecting below the bottom of the frame.
A frog nobody can find is not a frog.

- **`pond.markPerches(scene)`** — one ray per perch, from a visitor's eye at the bank (the `pondbank` standing
  camera, `-15.6,1.62,17.4`) to the crown, asked *after the garden is standing*, because what hides a frog is the
  boulder beyond the stone and not the stone. Water, pads and ripple rings are transparent to the question. A
  perch is `seen` if the first thing the ray meets is that perch's own stone. Called from `src/main.js` before
  `buildCreatures`.
- Frogs pick their home among the `seen` perches when any are near the spot they were planted at
  (`showable` in `buildCreatures`), and fall back on the rest if none are.
- Two of the spots moved: the first frog off the boulder at the visitor's feet onto the south rim one stone
  west, and the bold one off the north-east corner — dead behind the big boulder from the bank — onto the east
  rim. Measured after: **five of five seen**, `frog1 0..394 px, frog2 0..479, frog3 160..296, frog4 86..93,
  frog5 279..306`. The zeroes inside those ranges are dives: the measuring camera counts as a visitor, and a
  visitor makes a shy frog go in. That is the behaviour working, not failing.
- The ray height was tried at +0.02 (the frog's flank) and +0.04; +0.06 (its eye) marked the best set of stones,
  so it stays at the eye and the measure is `where.js` rather than a theory about frog anatomy.

**Floating stones, found while checking the frogs.** Rim crown and rim thickness were drawn independently, so a
7 cm slab could be told to stand 24 up — and was, a flat stone on a stalk of air, a mushroom ring the whole way
round (`pictures/s87-frog-c.png`, taken at 3× over the near edge). Now `py` never puts a stone's crown above
four fifths of its own thickness, so what varies is how deep it is sunk and not whether it hovers. The rim stones
were also given a thickness in proportion to their own width (a third to a half again) instead of a fixed
12–33 mm: a pancake's crown is the whole pole of the sphere it was made from, which is a smooth radial fan, and
the pond edge had been tessellating into a hundred little paper parasols. Eight cuts instead of six helped the
same way; the tilt went up to ±0.62 so the pole points sideways as often as up.

Released as **v0.85.0**. Nothing WRONG, 81.0% on foot, 60.0 fps at 961 meshes, 2007 of 2048 shader slots free.

### The lilies were holes, and then they were in flower

Two faults in one canvas and one missing object.

- **The pads were darker than the water.** `lilyPadCanvas` was based at [44,86,40] and a pad measured **L47**
  while the water beside it measured **L73** — so all the work on notches, scalloped rims and tilt was invisible
  at six metres: a crowd of dark holes on the surface. A pad is a leaf, top side up in the sun: the base went to
  [88,134,66] and the leaf reads as a leaf (`pictures/s88-pond-c.png`).
- **The pond had no flowers.** Water lilies flower; a pond of pads alone is a puddle with leaves in it. Four
  are out now — three open, one bud — on the biggest pads and one small one beside them, each in **two rings**:
  outer splayed nearly flat (tilt ≈ 0.3), inner come up over the middle (≈ 0.75), a ball of warm yellow at the
  centre (`mats.lilyFlower`, `mats.lilyHeart`). One ring at one angle gave a white tulip standing in a saucer —
  a cut flower in a vase — and the first flowers rode 3 cm above their pads on air until they were laid down at
  1.2 cm. Petals are planes on arms: the arm does the turning about the middle, the petal only lies flat and is
  tipped, so each angle means one thing.
- Flowers are parented to their pad, so they bob with it (no new clock), and are counter-turned on x and z
  against the pad's own tilt so the star does not lie down along the dip.

Cost: 60 meshes (960 → 1020), still 60.0 fps. Released as **v0.86.0**. Nothing WRONG, 81.0% on foot, 2007 of
2048 shader slots free. From the west lawn at twelve metres the four flowers are the brightest specks on the
water, which is the whole point of putting them there (`pictures/s88-pondwest-c.png`).

### Two bare bands at the foot of the house

Three faces of the plinth were given a band of laterite (`earthBedWest`, `earthBedEast`, `earthBedNorth`) so the
house meets the ground in three edges, and I had planted exactly one of them. The west and east bands were ten
metres of red soil with a fringe of grass sprouts at their outer edge and bare plaster over the top: a trench, not
a bed.

Five shrubs a side now, at x = ±8.9 (measured off the bounding boxes of the two beds with `tools/dump.js` —
`earthBedWest` runs x -9.55..-8.23 — rather than guessed), z spread the length of the wall, at `y: 0.05` because
the bed is 7 cm of soil laid on the ground and not lawn. Sizes and clipping vary per plant, the same treatment
`northBorder` got in v0.83.4, and it is the variation that stops the row reading as a queue: `0.85/0.66`,
`1.15/1`, `0.7/0.6`, `1.05/0.86`, `0.8/0.7` on the west, a different lot on the east so nothing matches its
fellow across the house.

Cost: 30 meshes (1020 → 1050), still 60.0 fps. Pictures: `pictures/s88-westbed.png` (the standing west view with
the wall's windows and the lit interior beyond) and `pictures/s88-westbed-c.png`.

Released as **v0.87.0**. Nothing WRONG, 81.0% on foot, 2007 of 2048 shader slots free.

### The court is laid in stone, not printed in squares

The last session's standing set (`pictures/2890-home.png` … `2908-backstore.png`) went over the whole garden
again and the fault that stopped me every time was underfoot: the paving. `tools/canvasstats.js` said why in
one line — `paverCanvas @512 mean 165,153,131 std 4,4,3`. **Four points of standard deviation in a whole
painted stone is not a stone.** The pattern was four equal squares to a repeat and two soft washes, and a
browser laid the deck out as a pale sheet scored by a grid: every slab the twin of every other, the same
four-slab pattern marching four times over inside one view, and every joint a dark rule. The court is the
biggest surface in `path`, `home`, `sala` and `west`, so this was the most-seen fault in the Villa.

`paverCanvas` is painted again, and the file now says what cut stone is:

- **Courses, not a grid.** Eight modules to the repeat — a module is 39 cm of the Villa's 3.1 m tile, a
  sawn paver off the shelf — laid in four courses of unequal height (2.5, 1.5, 2, 2 modules; halves are
  allowed and every height and width still adds to eight, or the pattern prints a seam down the deck),
  whose cross-joints are staggered by a quarter to a module and a half. The first pass had a course of
  nineteen-centimetre strips and it read as a soldier course of setts, which is why no slab is under half
  a metre either way now.
- **Every slab its own stone**: its own tone within about a tenth, a lean that is mostly warm (a symmetric
  lean made the small slabs read grey-blue and the big ones tan, which is not a plan, it was chance), two
  to four veins along the bed, a scatter of grit, a bright worn arris at the edges, and a chipped corner
  on some slabs — a bite half in the slab and half in the joint, which is where a sawn edge actually fails.
- **Grain multiplied and not mixed.** `wash` MIXES toward one of two colours at one opacity and the two
  ends cancel: a 0.36 wash over stone left the four points of spread above. New helper
  `multiplyByField(canvas, field, amount)` scales what is under it; three fields go over the whole tile
  (clouds the bigness of a slab and a half, a mid grain of a few centimetres, a fine one of a centimetre),
  joints included, because sand in a joint is grainy too. The tile now measures
  `mean 168,154,130 std 11,11,11` — the same mean as before, eleven times the spread. The albedo is painted
  at 1024 instead of 512 so the grain is the size it is on a slab and not four times too big.
- **The joints are no longer ruled in black.** The colour canvas had its joint lightened ages ago, but
  `bumpFromCanvas` reads height off the same picture, so the bump was built with a dark joint and a steep
  slope and ten millimetres of joint a pixel and a half wide is all edge: in the late sun every slab wore a
  black rule round it. The relief is now painted on its own terms — `paverCanvas(size, { relief: true })`
  keeps the joints, the arris and the grit and drops the slab-to-slab tone and the veins, so no slab stands
  proud of its bed because it happens to be a pale stone — with the slope down from 34 to 22, the joint a
  degree lighter at that end, and `bumpTexture.level` down from 0.6 to 0.45. Measured in the near
  foreground of the south path the darkest pixel in the deck rose from **L9.5 to L16.4**, and the deck as a
  whole came down from L132 to L126, which is a shade less milky and no harm at all.
- **The courses wander.** The lawn has had `lawnBend` for sessions; the paving now has `pavingBend`
  (a metre and a half of sideways pull over a wavelength of forty, in `src/paving.js`, wired through
  `groundUVs`'s third argument in `pavingSlab`), so the courses of the west deck no longer line up with
  the courses of the east deck and the pattern cannot be watched marching away from you down the court.
- `src/surface-colours.js` keeps a square grid for the CPU drawing — it has one grid to draw and it says so
  in the file — but it keeps the module (eight to the repeat), the 10 mm joint and the spread between the
  palest and darkest stone, so `tools/draw.js` still draws a deck of the right size and tone.

What the pictures said: `pictures/s88-paver-before.png` and `s88-paver-after.png` are four tiles of the
pattern before and after, and the before one is a lattice and the after one is a paving plan.
`s88-deck-before-c.png` / `s88-deck-after-c.png` are the same cut out of the standing south-path camera at
the same pixels: the near deck went from graph paper to sawn stone, and the mid-distance courses did **not**
break into dashes (checked: darkest pixel in that band L19, and no moire the eye can catch).
The new standing set is `pictures/2910-home.png` … `2928-backstore.png`.

Released as **v0.88.0**. Nothing WRONG, 81.0% on foot, 60.0 fps at 1050 meshes, 2005 of 2048 process slots
free.

## The Villa gets an ear, and geckos on the walls at night (v0.93.0)

The master asked for night: geckos on the villa walls, small but not tiny (cockroach-sized), cute, discoverable
and not obvious, with gecko noises; and frogs croaking at night. Looking first, the Villa had **no sound at
all** — no `AudioContext` anywhere, nothing in `vendor/` that made a noise. The pond had been drawing itself for
forty releases without once croaking. So the ear came before the animals that use it.

**`src/sound.js`, `buildSound()`.** Every noise is synthesized out of oscillators when it is asked for: nothing
is downloaded, and the first picture is no slower than it was. Four voices — a frog's croak, a gecko's piping, a
raven's caw, a coin's tink — each placed in the garden where it happened, so a croak behind you is behind you and
quiet. Two things that had to be learned:

- A browser will not let a page make a noise until a person touches it, so the ear sleeps through the first
  picture (which the Villa's own rule about not delaying the first picture allows) and is armed by the first
  click or key. `M` mutes, and the hint line says so, because a key nobody knows is not a sound.
- A pond where every frog starts croaking in one frame is a wall of buzz. The ear counts its live voices and
  refuses the fifteenth. The first cut raised the count when a voice started and lowered it only by a
  `setTargetAtTime` ramp, which approaches zero and never arrives — so after fourteen calls the garden was silent
  for the rest of the night. Voices are now booked at once and returned on a timer, without waiting for the fade.

**`tools/ears.js`, because a screenshot cannot show a noise.** It clicks the page the way a visitor does, prints
`ready: true, armedBy: click`, renders each voice into samples in the page and reports peak, loudness and a rough
pitch from zero crossings; then it stands in the garden and counts what the animals actually say. What it found
and what was then changed:

- The first frog measured 1314 crossings a second — two and a half times too bright, sitting in the gecko's
  register, which is one animal and not two. Its throat band is down to 400 Hz; it now measures 1014 against the
  gecko's 2605.
- The first coin was the loudest thing in the garden, 0.90 of full scale against the frog's 0.23, so a gold coin
  landed like a karst dropped in a tin shed. Partials and level both down; it now measures 0.12, about a frog.
- Ninety seconds of night on the pond bank: **104 croaks and 21 gecko calls**, with no voices left stuck.
- At half past five, `{"geckosAbroadAtDaytime":false,"anyOn":false,"earBuilt":true}` — the night ones are away by
  day, which is the whole point of night ones.

**`src/gecko.js`, four of them**, fifteen centimetres nose to tail, the cockroach's size class as ordered. Plaster-
coloured bumps with rust spots so a gecko on a wall *is* the wall until it moves; amber eyes, wet, faintly lit
from inside, with a black slit — the eyes are the whole of finding one. It sits, then scuttles with a stutter in
the middle of the run, then nothing for a long while; a boot within two and a half metres sends it climbing out of
reach; each one pipes every eight to twenty-six seconds and lifts its head while it does, and the noise travels
with the animal.

What the pictures said: the first four went high on corners, which put two of them behind the terrace roof from
every place a person can stand, and against dark teak at night nothing is visible at all. A 15 cm animal 2.5 m off
measures forty pixels in a 1280-wide frame — the size was never the fault, the wall was. So two went onto the
**outside of the front glass at eye level**, where the lit room throws them as silhouettes, which is exactly how a
gecko is found in a real Thai villa at ten at night. That picture then showed the fault that mattered: it read as
a hanging sausage with two eyes on it, because the legs were tucked in at 0.95 radians and a fifth of the body
long. A gecko pressed on a window IS four splayed spoons and a tail and nothing else; the legs are now out to
nearly a right angle and long enough for the pads to stand clear of the flank in the silhouette.
`s96-gecko-window.png` is the record.

Standing stone: the geckos are night things and gone by day; the ear is silent until touched; `M` is the only key
any of this costs the visitor.

Look at: `s96-gecko-window.png`, `s96-front-night.png`.

Next after this, in order:

1. **The raven, which is still only a voice.** `sound.js` has a caw and a coin's tink and nothing calls them. The
   wish is a raven that sometimes sits on the roof, drops a gold coin into the yard every few days, and is heard
   now and then without being seen. Decided here, because it is the sort of thing a later session would otherwise
   invent twice: the coin is stamped with a **royal emblem** — a pointed crown, a chakra wheel, two talk-back
   scrolls either side — and not with the face of the living king, because a living person's likeness is not
   something to paint into a toy. `royalCoinCanvas` in `src/textures.js`.
2. Frogs are silent by day (right) and the toad never joins in — his croak is a deeper one and he is the one
   animal nobody has ever heard.
3. The gecko eyes are the only emissive animals outdoors at night; if the night lamps are ever raised, they will
   want matching, because a gecko that glows is a gecko that is obvious.
4. The shark follow-ups still owed: a dorsal swept back a little more, and `tools/where.js` does not know sharks
   exist.

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who gave the Villa an ear after
forty releases of drawing the pond in silence, and who measured a croak in samples because there is no other way
to tell a frog from a gecko when the garden is dark. A Villa that will not croak is a worse adulteration than
sugar in coffee — at least the sugar is honest about its teaspoon.

## A bite could cost you your walk, and no longer can (v0.93.1)

The master reported that after the shark bites, the camera stays wrong and walking gets difficult. Worth writing
down, because the way it was found is the way the next fault will be found too.

Nothing in the code looked wrong. The old after-effect decayed `knock` to zero and put `camera.rotation.z` back to
zero, and a probe that walked the visitor before a bite and after one reported everything clean: same heading,
same footing, same distance, 60 fps, 1265 meshes before and after, no leak. So the fault was not "the bite leaves
the camera tilted", and reading the code harder was not going to say what it was.

What it actually was, and the measurement that caught it: **the walk read its heading off the camera and then
rubbed the height off the vector.** `getDirectionToRef(Axis.Z)` followed by `forward.y = 0` leaves a vector whose
length is `cos(pitch)`, and it was never re-normalised — so a step taken while looking down at the water was
shortened by that cosine. Measured on the released Villa with `tools/recover.js --steep`: one step level **220 cm
**, the same step looking at their own feet **100 cm — 45% of a step**. That is the whole of "movement becomes
difficult", and a bite is precisely the thing that makes a person point their sight at the pool. It had nothing to
do with the bite at all, which is why it hid: the shark only supplied the reason to look down.

The heading now comes from the yaw alone — a flat metre of forward and a flat metre of right, whatever the sight
is aimed at — and flying still reads the camera, because there the sight line *is* the control. Same measurement
after: **100% at both pitches.**

The second fault was latent rather than felt, and it is fixed in the same breath. The jolt used to sit on
`camera.rotation.z` and be cleaned up on the frame the counter happened to reach zero. That means the animal owns
the camera in between, and the walk — which asks that camera where north is every frame — is steered by the bite
while the shake lasts; and any frame eaten by a backgrounded tab, a slow draw, or a second bite arriving before
the first finished was a horizon left tilted for good. Now the roll is put on immediately before `scene.render()`
and taken off immediately after in a `finally`, so the camera is never the animal's for even one frame. Proved
from inside the render, not from the code: with a flinch held, the wildest frame was drawn rolled **1.64°** over
180 frames while the camera between frames held **exactly nothing**.

`tools/recover.js` is the new instrument and does all of this without a human: stand on the coping, measure a
step, wait to actually be bitten, measure again — camera, footing, heading, fps, mesh and material counts, and
whether a step looking down is still a step. `--steep` weighs the pitch on the stride, `--jolt` weighs the shake
from inside the render. Also learned here, and worth remembering: **in this Babylon build a Vector3's x, y and z do
not survive spreading**, so `{...camera.position}` yields an empty object — ask for each number by name, or your
probe reports `undefined` at you instead of a distance.

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who was told the camera was
broken and found the walk was the thing with its nose in the water, and who measured a step at 220 cm and 100 cm
before believing it. A stride that shortens when you look down is an insult to the visitor's knees.

### What I would do next, in the order the pictures say

1. **The pool's near half is a milky plate.** `pictures/2910-home.png`: the half of the water nearest the
   visitor is a flat pale cyan with one blown band of glare along the far edge, and it is the brightest
   thing in the frame apart from the sky. The pond took the sky in v0.84.1 and got better; the pool is the
   same ask at a shallower angle and it is the first thing a visitor sees. Measure before touching: the
   water's `environmentalIntensity`, alpha and the glint's width, at the start camera and from overhead.
2. **The pots are onions with moss balls on them.** Six of them in `2910-home` alone: a bulb on a foot and a
   perfect sphere of moss for a plant. The pots should be pots (a rim, a belly, a foot, in two or three
   heights, not all one) and they should hold six *different* planted things — lemongrass, a chilli bush, a
   small citrus, a bunch of marigolds — the same `clip`/size treatment the shrub beds got in v0.83.4.
3. **The lounger cushions are near-black boards.** `pictures/2916-west.png` at the left: a mattress that
   reads as a slab of bitumen. Either the fabric is too dark or it is not lit at all — `pickat` will say
   which.
4. **The garden lamps burn white.** The little solar bollards and the string's bulbs come out as blown
   white discs in `2914-sala` and `2922-colonnade`. They are meant to be a warm glow at half past five, not
   holes in the picture.

## A gun for the shark, and the pool measured (v0.94.0)

**This session's model could not be shown a picture.** `read pictures/x.png` came back omitted — the model in
the room has no eyes. Everything below was therefore judged with the number tools and not with the view:
`tools/cover.js` (which mesh and which colour sits at each point of a grid), `tools/pixels.js --patch`
(whether a stretch has large shapes in it at all), `tools/diffgrid.js` (where two pictures of one view
differ), and picks asked of a live page. That is enough to build and to measure; it is NOT enough to say a
thing looks beautiful, and the colour calls below are marked as measurements and not as taste. If the next
session has eyes, look at `pictures/s98-gun-armed.png`, `s98-gun-water.png` and `s98-gun-shark.png` before
believing any of it.

**The gun (`src/weapon.js`) is finished and wired.** It arrived in the folder half-built from the last
session and unwired: it called `box("gunBody", …)` where `box` wants `box(scene, "gunBody", …)`, it asked for
six materials that did not exist, it called `pool.splash(x, z, 0.55)` where the pool's own call is
`pool.splash(x, z, {across, span, show, life})`, and it was keyed `L, I, M` — and `M` is the ear's mute key,
so arming the gun would have silenced the garden. All four are put right. The word is now `g u n`, typed, and
the same three letters put the gun away; nothing new is added to the plate but one line.

What the numbers say, all of it measured in a browser:

- **The word works as a control.** `tools/shoot.js` types `g`, `u`, `n` at the page with the keyboard and
  reads `armed: true`; types them again and reads `armed: false`. That is the honest test of a typed control —
  calling `arm(true)` from the page would have tested the wiring and not the keypresses.
- **A round finds what it is pointed at.** Standing at the coping and looking at the pool, the line stops on
  `water` at 5.37 m, at `0.00,-0.20,4.60` — the middle of the basin, which is where the sight was put.
- **The marks are cheap and they go away.** Six rounds: 6 spurts out, **1305 meshes before the burst and 1305
  after** (nothing is built per round; six cards are reused), and a second later `spurts: 0`. **60 fps idle,
  60 fps with the button held for two and a half seconds.**
- **The animal answers.** Nine rounds at a shark held near the surface: `state: hit`, `hits: 9`, 26 blood
  lumps out, and the blood is drawn — 769 pixels of the pool's patch warmed by more than twelve points of
  red-against-blue where the cloud lies, at `0.00,-0.25,4.58`, three to seven centimetres under the film.
- **How much of the picture the gun takes: 8.3%.** Asked by picking a 16-pixel grid over the whole frame with
  the gun out (299 of 3600 points) and with it away (0 of 3600). It is a corner of the frame and not a wall.
- **What it is made of, read back as colour.** barrel mean (75,81,82) L80 running to L156; body (54,71,75)
  L68; magazine (96,140,146) L131 — that one is the metal taking the sky, which is the whole reason the
  material is `metalness 0.85, roughness 0.36`; stock (24,18,10) L19, which was a hole in the corner of the
  picture, so the polymer was lifted from (44,38,33) to (66,57,48) and its sheen from 0.35 to 0.45.
- **The muzzle flash is seen and not merely built**: the brightest pixel in the gun's corner is (240,214,193)
  L218 at 864,442, which is the flash card, and its emissive (2.3,1.25,0.4) sits above the bloom's 1.6
  threshold so it glows like the night lamps do.

**`getDirectionToRef` in this Babylon build writes into the vector you hand it and hands back NOTHING.**
`const f = camera.getDirectionToRef(Vector3.Forward(), new Vector3())` is an `f` of `undefined`, and a ray
built on it has no direction. Measured: hand it `new Vector3(9,9,9)` and read the vector afterwards —
`-0.058,-0.060,-0.996`. The half-built gun did exactly this and would have fired thirty shapeless rounds a
second. Put in the same family as the note that a `Vector3` does not survive spreading.

**Only a shallow shark can be hit, and that is the rule, not a bug.** A line from the eye stops on the
water's sheet: the animal is under it. So `hitIfNear` in `src/shark.js` asks whether the struck mark is
inside the animal's own length and girth AND whether its back lies within `SPEC.deep*0.5 + 0.3` = 0.395 m of
the surface. A shark cruising a metre down cannot be shot from the bank, which is why the animal goes deep
when it is annoyed and why the fin is the warning. Three good hits and it gives up on the visitor: `sulk` for
14-22 seconds, `dread` for 22-32, and it goes to `farCorner` — the corner of the basin away from whoever is
standing there. Nothing dies in this Villa; that was decided and not fallen into.

**The pool, measured at last, since the note said to measure before touching.** Start view, 2602 water
points picked, split at 6.4 m:

```
as it is        near half (97,146,149) L136   far half (102,151,154) L141   0% blown, 3% over L200
?wsky=0         near (79,129,132) L119        far  (78,129,131) L118        the sky's mirror costs 22 points
?wem=0          near (93,127,128) L120        far  (99,136,136) L128        the cyan film costs 13-16
?nofilmangle=1  near (98,152,157) L141        far  (104,161,166) L150       the painted lid, and worse
?net=0          near (95,146,150) L135        far  (103,161,163) L149       the caustic net, and no help
```

So the water is **not blown out** (0% of it is white) and the near half is not brighter than the far half —
the old complaint's "one blown band of glare" is gone. What is left is a **colour** fault and it starts
under the water: the basin's own tile is painted (76..120, 150..196, 168..206) with grout at (172,190,186)
and an emissive cheat of (0.07,0.14,0.15) on top (`poolTileCanvas` in `src/textures.js`, `mats.poolTile` in
`src/materials.js`), and the water over it is alpha 0.48. A pale cyan floor under a half-transparent film is
a pale cyan pool, whatever the film does. **Next session: take the cyan out of the TILE** — a real pool
mosaic is off-white and cream with a few blue glass tiles and grey grout, and the turquoise belongs to the
water's film, which already owns it. Weigh it with `?wem=` and these same 2602 points, and do not touch
`?wsky=` first: the mirror is what makes the far half a mirror.

**The tile was done in the same session, and it is the floor that was mint, not the water.** The glass moved
from (76..120, 150..196, 168..206) to (74..116, 136..180, 186..226) — eighteen points of blue clear of its
green — the joint from (172,190,186) to (162,174,180), and the tile's pit-glow from (0.07,0.14,0.15) to
(0.06,0.12,0.16). Same camera, same 2602 points:

```
before   near (97,146,149) L136   far (102,151,154) L141   over L200: 3.1%
after    near (94,140,153) L131   far  (99,145,158) L136   over L200: 1.1%
```

Blue now stands thirteen points above green where the two were level, and the share of the water burning over
L200 fell by two thirds — the "one blown band of glare" going with it. The tile wall itself reads (130,174,191)
where it read (122,172,168), and down the pool's own axis (102,139,149) over a floor at (82,139,170): a pool,
not a drained one — the old lesson that a dark teal floor reads as a green empty pit at L78 was kept in view,
and the floor sits at L130. The joint was NOT lightened or evened: the sixty-ninth session's graph-paper
finding stands.

**Also measured and found already fixed**, so nobody chases them again: the lounger cushions in the west view
are `cushion` at mean (97,86,65) L88 running from (55,50,33) to (211,168,126) — a lit mattress, not a board
of bitumen. The garden lamps at hour 21 paint `lampGlow` at (234,202,140): warm gold, not a white hole.

Standing stone after this: the walk is a walk (one step level 229 cm, the same step looking down at the water
229 cm, 100% of it, `tools/recover.js --steep`), the ear is silent until touched, and the gun costs the
visitor one line on the plate.

Look at: `s98-gun-armed.png`, `s98-gun-water.png`, `s98-gun-shark.png`, `s98-cover-home.png`.

Next after this, in order:

1. **Look at the pool with eyes.** `s98-tile-after.png` and `s98-pool-tile.png` are the two views; the numbers
   say the water went from mint to blue and the glare band down by two thirds, but only a pair of eyes can say
   whether the mosaic now reads as glass and grout or as a blue-painted tank. If it is too blue, take eight
   points back off the glass's blue and four off the joint's.
2. **The pots are onions with moss balls on them** — six in the start view. Still owed, and it wants eyes or
   the `clip`/size treatment the shrub beds got in v0.83.4.
3. **The raven still has no coin photographed on the ground.** `tools/perch.js` puts the bird up and opens its
   purse; nobody has yet looked at a coin lying on paving at 26 mm and said whether the strike reads.
4. The shark follow-ups still owed: a dorsal swept back a little more, and `tools/where.js` does not know
   sharks exist.

— Viscount Gary of Syntax, Grand High Custodian of the Tropical Fromage-Fortress, who armed the visitor
without eyes to see with, and who measured a gun at 8.3% of the frame and a step at 229 cm before calling it
fit. A garden gun that costs sixty frames a second or leaves a dead animal under a sunlounger is no better
than a coffee with an unmeasured spoon of sugar in it: both are adulteration, and neither can be defended.
