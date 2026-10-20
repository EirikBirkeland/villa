# Changelog

## 0.102.0 — 2026-10-20
- The watercourse is water and not a grey tarpaulin. Seen from the lawn the whole thirty-four metres of it came
  out at (73,87,60) with regular ribs across it, like a canvas sheet laid in a trench (`tools/cover.js` named
  every rib `streamWater`). Two causes, both in the material: the chop was tiled at one repeat to the metre on
  UVs that are metres, so it stood in registers all the way down the course, and the surface mirrored the open
  sky at (112,130,106) wherever the view ran along it. The ripple tiles are now stretched with the flow, bent off
  their lines by a slow pair of sines in `src/stream.js` the same way the banks' soil is bent, the chop is
  halved and the mirror is the shade of the bank: the same stand now paints (57,69,40) and reads as a dark run
  of water with a current in it. `?strib=` reaches the chop from the address bar.
- The sun's shadow map is on the address bar: `?shadowpx=`, `?shadowq=` (low, medium, high, pcf, poisson,
  exponential, soft, blur) and `?shadowblur=`. Measured and refused: a 4096 map changes 6 319 pixels of 454 500
  and nothing the eye can find, because Babylon fits the shadow frustum to the whole garden and the edge is
  limited by the filter and not by the texel — so 2048 and `medium` stay, and `tools/shadowsoft.js` and
  `tools/crop.js` are there to show why to anyone who wants to argue.
- Ambient occlusion was tried and is not in. The vendored library's default pipeline has no SSAO2 in this build,
  and the standalone pass comes back un-tone-mapped: the same sala view went from a mean L66 to L126 and every
  colour went pale. The finding is written up in `NOTES.md` with the pictures of both states.

## 0.101.0 — 2026-10-19
- The pond koi are carps and not lozenges. The tail fin was lying at the world's origin, never attached to the
  fish and never seen by anyone; the dorsal stood wholly inside the body, so the animal wore no fin at all; the
  head tapered from nape to snout, which makes a dolphin with fins on it. The fish now has a blunt plateau of a
  head with a mouth bar on the front, a back that arches at the nape and falls away both ways, pectorals rooted
  on the flank instead of six centimetres inside it, and ventral, anal and dorsal fins hung off the skin the
  tables say the skin is at. 1 500 triangles a fish, and every piece now lies between the tail tip and the snout.
- The stream's mouth is a fall. It was eleven centimetres of drop spread over a metre and a half of run — a
  four-degree sheet laid across the north of the basin, which minified into a ladder of white slats floating on
  the water (`tools/pickat.js` named the slats `streamFall`). The tail of the channel is now banked up over its
  last two metres, so the water leaves the lip 0.45 m above the pond and the sheet stands at 42 degrees. The end
  of the channel, which was a tube with its end cut off, is closed with a lumped rock face; the raised banks are
  dressed with boulders out of the same barrow as the rim; the veil is translucent water with rivulets and foam
  at lip and plunge, and not an additive white glow.
- `stream.waterY` answered a ReferenceError. The accessor read `WATER_Y`, a name that exists only in
  `src/pond.js`, so anything that asked the question got nothing. It answers with the water's height at the
  mouth now — 0.414 m, where it was 0.074 m.

## 0.100.1 — 2026-10-19
- The flickering panel, at last: it flickers because of the film grain. The pipeline ran an animated grain at
  intensity 3.5, and on a dark flat face that has nothing else for the eye to hold, an animated grain is a
  flickering panel. Measured on the panel two frames apart: mean change 1.92 of 765 with the grain as it was,
  0.66 with it silenced. The grain is now 1.1 and does not move, and the panel is byte for byte the same between
  frames (mean 0.00, worst 0). `?grain=` now reaches the number — it never used to — and `?grainmove=1` restores
  the motion for anyone who wants it.
- A correction forward, not a rewrite: the 0.100.0 note said the panel was largely cured by the daylight
  rebalance. The step metric said so and the eye says otherwise — the hard diagonal and the comb of level marks
  are still there. They are the un-convolved sky cube read as diffuse light, and the cure is the HDRI that is
  still to come. Suspects killed on the way, all measured: cube resolution, specular environment, fog, geometry
  (the panel is one flat box), and the tone curve.

## 0.100.0 — 2026-10-19
- The daylight rebalance: four fifths of the Villa's daylight was ambient fill, so the hemisphere, bounce and
  sky fill are halved in daylight and the sun lifted to pay part of it back. Sunlit timber has shadow under it,
  the roof has relief, and a pot is round. The night is byte for byte what it was, proved against v0.99.3.
- The dark panel in the grey frame at the side of the house — the flickering one — is largely cured: the hard
  steps inside that one face go from 3.13% of the face to 0.57%, and the row-to-row swing from 50.5 to 29.4.
  It came from the same fill: the marks were the sky cube read into a rough shaded face.
- Dusk and dawn stop arguing with the sun. At half past six the terrace used to be twice as bright as the whole
  sky over it (ratio 0.49); the sun now falls near the horizon as it does in the air, and the sky is lifted to
  match. Dawn likewise, 0.68 to 0.84.
- The potted kumquat by the pool fruits like one: nineteen small round fruit set in among the leaves instead of
  seven big faceted balls parked on top of the crown.
- The koi are in the pond and they show: four fish under the lily pads, eleven to seventeen centimetres under
  the surface, their whites coming back grey-green through the water.

## 0.99.3 — 2026-07-28

- Textures are filtered at sixteen times anisotropy instead of eight, which is what the master asked for. At a
  graze across the court the ground keeps about a ninth more of its own brushwork (grain 8.64 at one filter to
  9.62 at sixteen) and the frame mean does not move, so no calibrated colour has shifted.
- The post chain now runs four samples of multisampling alongside FXAA: measured staircases fall from 1495 to
  1440. Both are wanted — the samples smooth the triangles, FXAA smooths what the post chain draws after them.
- Two switches for the record: `?aniso=` and `?msaa=`, and `tools/sharpness.js` to weigh them.
- The whole day was walked hour by hour with `tools/hoursweep.js` and found sound: no hour over 1.4% pure
  black, no blown pixels, and a blue sky at every hour sampled — rgb(96,153,165) at noon, rgb(18,43,42) at
  midnight.

## 0.99.2 — 2026-07-28

- The frogs are the master's frogs again. The pond croak that was chosen for the Villa is back exactly as it
  was in v0.98.3, animal by animal off the rim stones, and the two recordings I put in front of it are gone from
  the folder and from the credits. The ear was right and my theory was not.
- The two lanterns at the back door are lamps now, and not painted glass. At midnight the north face of the
  house was a black board with two bright dots on it: mean 12 across the view and 19.0% of it pure black. It is
  now mean 29 with 2.6% black, and the plaster reads warm under them instead of (8,7,3). No daylight view moved.
- A light switched to zero still costs a surface one of its six light slots, so a dark lantern is now taken out
  of the scene altogether rather than left burning at nought.

## 0.99.1 — 2026-07-28
The barred-up back door is a door on the room's side too.

  Out on the garden it always was: a lined recess, a teak leaf, a shadow gap. Inside the house the
  same stretch of wall was bare plaster with a small dark framed panel hung high over it, so the door
  you can walk round to did not exist on the face you actually look at from the room — it read as a
  window, or as a boarded hatch. The room now gets the same recipe read from the other side: a hole in
  the lining, a board across its back, and a leaf standing in the reveal with four centimetres of dark
  showing all round it, with two battens and a brass catch. The panel that stood square over it hangs
  further west now.

  Measured from inside by projecting the world points and reading the picture back at them: plaster
  L170, teak leaf L58, shadow gap L12. The gap first wore the Villa's dark metal and came back at
  L74 to L142, metal catching every lamp in the room, so shadow gaps have a matte near-black of their
  own now. Walked past sideways, none of it will not hold still: plaster swings 5 points, the leaf 2,
  the gap 1 (`tools/shadowcrawl.js`, which follows the surface and not the pixel).

## 0.99.0 — 2026-07-28
The visitor carries a flashlight now, on `F`.

  A warm cone of light from the sight, eight metres out, with a little dust in it so the beam
  shows from the side and not only where it falls. Nothing else to press: one key, and this
  garden is dark enough at eleven at night to want one. `?flash=0` leaves it out of the build.
  Frames unchanged at 60.

  Measured and not assumed: with the cone of dust hidden, the lamp lifts the paving under the
  sight from 11 to 15 and its brightest part from 14 to 30; with the lamp hidden, the dust lifts
  a night frame's middle from 21 to 24 and eats half of its black (3.5% to 1.7%).

  Three faults found on the way and mended, none of them visible in a single picture: the module
  imported a library this Villa loads as a script, so the page never booted at all; the
  constructor's sixth argument is the width of a cone and not its brightness, so the lamp was a
  pinprick; and the dust was given a decal blend instead of an additive one, so it painted a
  black wedge over the garden where a little warmth was meant.

## 0.98.3 — 2026-07-28
The raven pays its coin properly now, and so does the Villa's metal.

  Its coins used to land ankle-deep in lawn, in flowerbeds and on the table where the fruit sits,
  and they lay so low that the paving stones ran over them: a 26 mm coin standing on its edge was
  showing about 4 mm above the ground. The twelve places it chooses are places a visitor can
  actually stand — paved, dry, outdoors, clear of furniture — and the coin now rests on the top of
  what it falls on, showing 18 to 20 mm of itself.

  Every metal in this Villa was lying. The material helper wrote `mat.metalness`, and this library
  reads `mat.metallic`, so sword, muzzle, barrel, shark's eye and ploughshare were all struck as
  though they were made of plaster. They are metal again, and the coin is painted the colour of the
  gold it is struck from: where it used to draw a muddy (32,27,11) it now draws (184,148,44).

  Only the materials that asked for metal were touched. Setting the same value on everything would
  re-shade the whole garden — the lawn by the pond went from 60 to 44 mean — and that is the master's
  colour call, not mine.

## 0.98.2 — 2026-10-19

- **The head of the watercourse is a hill now, not a lid.** The earthen hummock where the water comes in was a
  flat disc 12 centimetres tall lying behind the end of the channel; it is now half a metre high, straddles the
  start of the course, and buries the water for its first three quarters of a metre, so the stream comes out of
  the hillside instead of out from behind a plate. The stone on top is settled on the hill's own surface, the
  hill keeps walkers off it, and nothing plants on it.
- **The night takes back the light it lent.** A great many materials here carry a little `emissiveColor`
  standing in for daylight bouncing off the lawn, which is honest at noon and a lie at midnight: measured at
  midnight the water sat at (41,44,23) and its banks at (44,33,14) against a lawn of (8,20,2) — a dark garden
  with a luminous ditch through it — and palm and banana leaves were at (26,67,5) and (26,65,3). The day cycle
  now owns that glow and dims it with the hour, water and earth almost all the way and the leaves 62%, which
  keeps a frond readable against the lawn under the moon. The pool's water is left alone: it has two real lamps
  in its far wall.
- **At the same hour in daylight the change costs one point of luminance** (102 against 103 measured against
  v0.98.1 on the arrival view), because the multiplier is exactly 1 while it is day.

## 0.98.1 — 2026-10-19

- **The trickle no longer turns itself up as you lean in.** Inside the bank distance the held-sound gain kept
  climbing past the level it is set to — measured 0.157 against 0.12 — because it was clamped at the bottom and
  not at the top. Now: in the water 0.12, at the lip 0.117, on the bank 0.102, at the house silent.

## 0.98.0 — 2026-10-19

- **The stream runs straight to the back of the property now.** It used to start at the north-east hedge, run
  the length of the east side, turn the corner and follow the whole south boundary to the pond — 62 metres
  round the entire yard. It now runs 33.7 metres from the back hedge to the pond's north edge, never straying a
  metre off its bearing, with a sway of two unequal waves on it so it is not a drawn line. The plank bridge is
  gone with the bend it stood on: straight to the back, the water never crosses the path.
- **It is cut in earth and not lined in stone.** No coping course, no dressed walls, no pale stone bed: from
  the water out there is the bank's face, a bare damp band 25-65 centimetres wide, and a grass apron down to
  the lawn — the pond's own trick, since the cut edge of a lawn must never meet water. Stones are laid at the
  edge, sunk and turned, 31 of them with five boulders at the head and mouth. The head's dressed slab is a
  mound of earth with three stones in it, and the fall is eight tenths of the water's width instead of a weir
  across the whole channel.
- **The water's colour went with the bed.** Over dirt the film is the pond's tannin, not blue: measured across
  a bank view, water (43,45,23), earth (47,35,15), stones (37,30,18), lawn (63,84,20).
- **Grass comes to the water's edge, and so does the visitor.** The bald ring both sides is gone: sedges grow to
  within 6 centimetres of the water and stop at the stones, and the walk is kept 1.27 metres from the centre
  line instead of 1.82, so you may stand on the bank and crouch at the lip.
- **Three faults fixed on the strength of the pictures**: edging stones buried under their own bank (the crown
  is now set after the stone is tilted and crumpled — 36 stones, none showing less than 2 centimetres); a south
  bank wound backwards and lit from below by the ground's own green light; and a station lookup that drifted by
  a whole station over thirty-four metres.
- **The raven's croak is a real croak**: `sounds/raven-croak.mp3`, "CrowOrRaven2.wav" by iwanPlays, CC0, from
  freesound.org — weighed before it was let in (loudest band 2600 Hz, one call filling its own 1.26 seconds),
  and the loudest call in the garden at peak 0.218 against the frog's 0.153.
- **A new tool**: `tools/streamroute.js` walks a proposed watercourse and names everything standing in it,
  which is how the six lawn boulders in the channel were found.

## 0.97.3 — 2026-10-19

- **The cricket sound is gone, and it was the waterfall.** There is no waterfall in this garden: the thing being
  heard was the borrowed "crickets at night", which weighed out loudest at 220 Hz with its loudest quarter-second
  only twice its quietest — a wind or a stream baked into the file, not a chorus of insects. The file, its credit
  and its five megabytes are out of the build.
- **A borrowed creature is now weighed before it is let in.** `tools/ears.js` prints, for every recording, which
  of four bands is loudest and how far the loud parts stand above the quiet ones, and says plainly whether the
  file reads as a creature or as weather. A creature's file is refused if its loudest band is the lowest or if
  the loud parts stand less than four times above the quiet: a wash with no transients is what an ear calls a
  waterfall.
- What the garden's ear keeps: frogs, gecko, raven, coin, the shot and the blast, and the channel's small
  trickle at the bank. All of it under `M`, as ever.
- Crickets are left out for now, at the master's order.

## 0.97.2 — 2026-10-19

- **The stream's synthesised water is gone.** The channel's murmur was filtered noise, and it sounded like what
  it is: a hiss. It has been taken out of the build, and nothing in this Villa makes water out of noise again.
- **The channel has a trickle instead, and a small one.** Twelve and a half seconds of recorded droplets over
  stone (NikoletB, CC0), looped at quiet points so the turn is not heard. It is full within a metre of the bank
  and gone five metres away: 0.086 at the bank, 0.053 on the plank bridge, nothing at all by the house. It is a
  third as loud as the borrowed frogs.
- **The night has a bed of crickets.** Three minutes forty-two of recorded crickets (Defelozedd94, CC0), worn
  under everything at night and held flat at zero in daylight — measured 0.1 at ten at night, 0 at ten in the
  morning. It sits under the frogs on purpose.
- **No new key.** Both sounds are part of the garden and `M` takes them away with everything else, as it always
  has.
- `tools/ears.js` now weighs held sounds as recordings: the file's length, its own gain, where the loop is cut,
  and its steady loudness against the calls it sits under.

## 0.97.1 — 2026-10-19

- **The terracotta pots are pots and not onions.** Measured on the mesh, the common pot stood widest at half its
  height and pinched in near the top — 0.166 m at the foot, 0.284 m at the middle, 0.204 m at nine tenths —
  which is the outline of a bulb. It is rewritten the way a pot comes off the wheel: a foot, a wall that grows
  all the way up, and a band of thickened clay at the brim. Now 0.161 m at the foot to 0.313 m at the rim. The
  inside of the pot is drawn as well, and the earth sits below the brim where a pot is filled.
- **The kumquat at the terrace steps is a small tree.** Its crown used to lie on the soil at the pot's mouth: a
  green dome 1.4 metres across with orange in it, which is a moss ball. It has a stump now, leaned a degree,
  with three limbs out of it into the leaf, and the crown stands half a metre above the rim — which also lifts
  the fruit off the pot, where a kumquat hangs it rather than rests it.
- The start view at a fixed hour is unchanged within a point of its old brightness, so the two fixes are shape
  and not light.

## 0.97.0 — 2026-10-19

- **The stream makes a sound.** Sixty-two metres of moving water had been silent. It has a murmur now: two
  seconds of noise looped through two bands with a slow wobble on the low one, which is the whole of why it
  reads as water over stone rather than as a hiss off a tap. It is a **held** sound, not a call — it is going
  all the time, and the visitor's distance from the watercourse is what turns it up and down. Full within a
  metre and a bit of the bank, gone at thirteen metres, and moved smoothly rather than stepped, so walking the
  bank hears the water come up. The fall at the mouth has its own, higher, shorter-reaching hiss.
- **The blast's cloud shades the garden.** A mushroom twenty-six metres over the lawn and the sun shining at
  full strength was a fault, and it is mended: the sun, the sky's fill and the bounce are multiplied down while
  the smoke is up, and back up again when it thins. Measured at a fixed hour, the sun goes 65.8 → 25.0 at the
  deepest and returns to 65.8; the picture goes from mean 106 to 79 and back. The sun loses more than the grey
  light does, so the shadows soften rather than the garden going dim.
- **The head of the cloud stops going out before the stem does.** A smoke card turns pale as it rises, and the
  fade that decides fire from smoke was reading the material, so the moment a card became part of the cap it
  started going out like a flame.
- **The duck has a bill instead of a party hat.** Not this session's work: another hand is at
  work in this folder, and its drawn bill came along with the copy of `src/` that a release makes. Measured
  in the release: 66 mm long, widest 0.59 of the way along, with a keel along the top.
- For anybody who weighs the sounds rather than listening for them: `tools/ears.js` now renders the held sounds
  as well as the voices, and `tools/rocket.js` reports what the three lamps are doing.

## 0.96.0 — 2026-10-19

- **A rocket launcher, and the house coming apart.** While the gun is in your hands (typed `g u n`), `5` swaps
  it for a tube, and the left button throws one rocket down the sight: thirty metres a second, a line of smoke
  behind it, and a blast when it strikes anything or after three seconds and a half. The control is one number
  and it does nothing when your hands are empty.
- **A mushroom cloud, made of three numbers.** Nine cards of fire, a shock ring going out along the ground, a
  scorch that fades over half a minute, and forty cards of smoke that rise fast, lose their lift, and then go
  sideways — which is the whole of how a mushroom is made. Measured after one rocket: 8 m wide at a second and a
  half, 17 m at five and a half, **27 m wide and 26 m tall at nine and a half**. The head goes pale as it rises,
  because a card changes from warm soot to cool cloud at thirteen metres.
- **The house is broken into pieces and thrown.** Every part of it standing within twenty-six metres of the
  blast is cut on a metre grid and sent away from the blast, lifted first, because a wall that only falls
  sideways is a wall that fell. One rocket at the front of the house: 106 meshes out of the picture, 412 pieces
  on the ground, and still sixty frames a second. The pieces are instances of three boxes — plaster, roof,
  timber — so four hundred of them cost four hundred places and not four hundred meshes.
- **A blast takes the walls and the roof and leaves the floors.** Two reasons, both load-bearing: the ground a
  person walks on, and the ground the pieces come to rest on, are read once when the Villa starts, so a smashed
  slab would leave rubble resting on a floor that is no longer there — and a visitor who has blown the house up
  should still be able to walk through where it stood.
- **`R` puts the house back.** It already returned the visitor to where they started; it now rebuilds what was
  blown up and sweeps the pieces away, because the Villa is the work. `?rocket=0` leaves the launcher out of
  the build altogether.
- The gun is unchanged in every other way: the same typed word arms it and puts it away, and putting it away
  puts the tube away with it.

## 0.95.0 — 2026-10-19

- **A stream, running the length of the garden into the pond.** Water comes in at the north-east hedge, runs
  62 metres down the east side of the house, turns the corner by the sala, crosses the garden in front of the
  path out to the gate, and falls over a stone lip into the pond's south edge between its two corner boulders.
  It is a lined channel — 1.76 m of water between coping stones, walls, a pale stone bed, and grass banks that
  run down and disappear under the lawn — and not a trench, because this garden's lawn is a plane and there is
  nothing in it to dig.
- **It is walkable, and it stops you.** One invisible block to each stretch of the course goes to the walk
  beside the pool's and the pond's, so the water is off-limits; and where the path crosses there is a plank
  bridge, six planks on two stringers, standing eight centimetres proud of the coping, which the walk treats as
  a floor. From the gate: 11.3 metres north, over the bridge, and up the far side. Against the bank: 1.1
  metres, and stopped.
- **The water moves.** Its pattern is laid in metres of ground along the course, so it slides downstream at
  eight and a half centimetres a second; the bed does not, because the bottom of a stream stays where it is.
  At the mouth a veil of streaked water goes over the lip and the pond is handed the splash, so a ring goes out
  from where it lands every couple of seconds.
- **The pond's rim makes a gap for it.** No rim stone and no chinking where the water comes through
  (`inStreamMouth` in `src/pond.js`), so the veil has a hole to pass by and the stone edge does not stop half
  way round for no reason a visitor can see.
- **Five plants, two lamps and three standing cameras were in the watercourse and were moved.** The path
  camera now stands at the path's south end and looks north over the bridge, which is the best view of the
  thing: the water covers 7.5% of that frame and the coping 3.6%.
- **Four faults the pictures caught, all fixed.** The channel had a lid of grass over the water (one strip
  joined its section points across the top: a scan of the whole frame found no blue at all); the stones that
  lie across the channel were turned the wrong way, because `ry` takes the normal's x first; the blocks keeping
  people out closed the bridge's opening; and the water painted grey because it stood on the pond's black silt,
  which is the pool's old lesson again — the colour lives in the floor under the film and not in the film.
- Sixty frames a second with it, and sixty without: `?stream=0` takes the whole watercourse out.

## 0.94.1 — 2026-10-19

- **The pool stopped being mint.** The master's complaint was a milky plate in the near half of the water, and
  the measurement says the glare is gone but the colour was not: at the start camera the water painted
  (97,146,149) — its green and its blue level, which is printer's mint and not a pool. The film over the water
  already carries the turquoise, so the flatness came from under the water: the basin's mosaic was painted with
  its glass level between its green and its blue and its joint greener than either, and a half-transparent
  film hands a floor's colour straight to the picture.
- The glass is now eighteen points of blue clear of its green and the joint with it, and the tile's little
  glow is paid to blue rather than to green. Measured at the same camera over the same 2602 points of water:
  near half (94,140,153) L131 and far half (99,145,158) L136 — blue thirteen points above green where it was
  level — and the share of the water over L200 fell from 3.1% to 1.1%, which is the glare band going away
  with it. The tile wall itself reads (130,174,191) where it did (122,172,168).
- What was NOT touched, and was measured first so nobody chases it again: the sky's mirror in the water
  (`?wsky=` costs 22 points and flattens near against far), the water's own cyan film (`?wem=` costs 13 to 16)
  and the caustic net (`?net=`). None of those is the fault, and the joint was left a dull grey because the
  sixty-ninth session proved that a bright even joint is graph paper.

## 0.94.0 — 2026-10-19

- **The visitor may arm themselves against the shark.** Type `g u n` and a gun is in your hands; type it again
  and it goes away. The left mouse button sprays. It is not on the plate's list of keys beyond one line, it has
  no ammo and no modes, and nothing in the garden dies: a shark that is hit three times gives up on you and
  goes to lie at the dark end of the pool for a quarter of an hour. A round that finds the water throws a ring
  and a crown; one that finds stone or soil throws dust; one that finds the animal throws the animal — it is
  shoved along the line the round came in on, and it bleeds into the pool.
- **Only a shark you can see the top of can be hit.** A line from the eye stops on the water's sheet, so the
  rule is the animal's own shape plus how far its back lies under the surface. A shark cruising a metre down is
  safe, which is why it goes deep when it is annoyed and why the fin cutting the surface is the warning.
- **The gun costs nothing you can feel**: 60 fps with the button held, 1305 meshes before a burst and 1305
  after (six marks are reused rather than built), and 8.3% of the frame with the gun out against 0% with it
  away — a corner of the picture, not a wall across it.
- **New tool: `tools/shoot.js`**, which types the word at the page, aims, fires, and reports what the line
  stopped on, how many marks are in the air, what the animal's state and hit count are, and what the frame
  rate and mesh count did. It found a real fault on the way: in this library `getDirectionToRef` writes into
  the vector you hand it and hands back nothing, so the half-built gun was throwing rounds with no direction.
- **The pool was measured before anything was touched**, and the old complaint is half gone: none of the water
  is blown out and the near half is no brighter than the far half. What is left is a colour fault under the
  water — the basin's tile is painted pale cyan and the film over it is half transparent, so the pool is pale
  cyan whatever the water does. `NOTES.md` has the numbers and the fix, which is the tile and not the water.

## 0.93.2 — 2026-10-19

- **The pool is inside the pool again.** The master noticed that the water could be seen through the walls of the
  house. It was not the walls: the water's sheet, the blood and the surface rings had each been put in a render
  group of their own, so that a cloud of blood would not be drawn on top of the film it belongs under. A render
  group is a blunt instrument — whatever is in a later group is drawn over everything in an earlier one — and the
  villa is mostly glass, which is transparent and so does not write depth. The whole pool was being painted
  across the house: glass, wall, dry deck.
- All three are back in the ordinary order, sorted by distance from the eye like the rest of the garden, which
  gives the wanted ordering by itself: blood lies under the surface, so it is further away, so it is drawn first.
  What has to be said out loud is said now, where the film is made: the water does not write depth.
- Measured, not assumed: the same view from the west deck before and after. Before, a blue sheen with a hard
  diagonal edge lay across the dry teak for two metres. After, the teak is teak, the coping is stone, and a held
  bleed still spreads its rust-coloured cloud under the film exactly as it did before the change.
- New tool: `tools/perch.js`, which puts the raven on the roof and opens its purse, so a bird that arrives when
  it feels like it and a coin that falls every three days can actually be photographed.


## 0.93.1 — 2026-10-19

- **A bite can no longer cost you your walk.** The master reported that after the shark bites, the camera stays
  wrong and walking gets difficult. Two faults were underneath it, and the first is the one that was felt:
  the walk read its heading off the camera and then rubbed the height off the vector, which left a short one.
  So a step taken while looking down at the water — which is exactly where a bitten person looks — was
  **shortened to 45% of itself**: measured on the released Villa, one step level took 220 cm and the same step
  looking at their own feet took 100 cm. The heading now comes out of the yaw alone, a flat metre of it whatever
  the sight is pointed at, and the same step is now 100% whether the visitor looks at the roof or at their feet.
- **The jolt is written on the picture and wiped off in the same frame.** It used to sit on `camera.rotation.z`
  and be cleaned up on the frame the counter ran out, which meant the animal owned the camera in between: the
  walk, which reads its heading out of the camera, was steered by the bite while the shake lasted, and anything
  that ate the cleanup frame — a backgrounded tab, a slow frame, a second bite before the first was done —
  left the horizon tilted for good. Now the roll is put on immediately before the frame is drawn and taken off
  immediately after, whatever the drawing does. Measured: with a flinch held, the wildest frame was drawn rolled
  1.64° over 180 frames, and between frames the camera held exactly nothing. After a real bite the visitor stands
  on the ground as before and walks as far as before, at 60 fps and 1265 meshes both before and after, so the
  blood and the rings on the water are not leaking anything either.
- **`tools/recover.js`**, which is how all of that was found instead of guessed: it stands the visitor on the
  coping, measures a step, waits to actually be bitten, and measures again — camera, footing, heading, frame
  rate, mesh count, and whether a step looking down is still a step. `--steep` weighs the sight's pitch on the
  stride and `--jolt` weighs the shake from inside the render, where the drawn frame lives.

## 0.93.0 — 2026-10-19

- **The Villa has an ear.** Until now it was stone dead silent. `src/sound.js` makes its noises out of
  oscillators at the moment they are asked for — nothing is downloaded, and the first picture is no slower than
  it was. Four voices so far: a frog's croak, a small gecko's piping, a raven's caw and a coin's tink, each one
  placed in the garden at the spot that made it, so a croak behind you is behind you and quiet. A browser will
  not let a page make a noise until a person touches it, so it is silent through the first picture and wakes up
  on the first click or key. `M` turns the whole thing off and on again, and the line of hints says so.
- **Frogs croak.** The four on the pond stones have been inflating their throats for forty releases without
  making a sound; now every croak after dark is heard, low and grating, and none of them croak at noon.
- **Geckos on the villa walls at night** (`src/gecko.js`): four of them, fifteen centimetres long, one on each
  face a person walking the terrace after dark passes. Two sit on the outside of the front glass against the
  light of the room, which is how a gecko is actually found at ten at night — you see a shape and two amber
  beads, and then you know where the animal is. They sit and then scuttle with a stutter in the middle of the
  run, they pipe at eight to twenty-six second intervals and lift their heads while it lasts, and they climb out
  of reach when a boot comes near. They are put away at daylight.
- **`tools/ears.js`**, because a screenshot cannot show a noise: it renders each voice into samples in the page
  and reports how loud and how high it is, then stands in the garden and counts what the animals actually say.
  Measured the night this was written — frog 0.12 of full scale at about a thousand crossings a second, gecko
  0.12 at twenty-six hundred, raven 0.39, coin 0.12; and ninety seconds of night by the pond came to 104 croaks
  and 21 gecko calls. The first cut of the frog was two and a half times too bright and sat in the same register
  as the gecko, and the first cut of the coin was the loudest thing in the garden by far.

## 0.92.4 — 2026-10-19

- **The open mouth stopped being a red ball.** Photographed from above with the jaw held dropped, the animal had
  a red bauble with a white rivet in it where its throat should be. Two causes, both found by looking and not by
  reading the code: the gullet was as fat as the head, so it filled its own window and presented its face to the
  sight instead of sitting behind it; and the palate was taking a specular highlight, which on a surface three
  centimetres across is a coin. The gullet is a hand narrower than the skin now, and the mouth carries no
  specular at all — flesh inside an animal is matte beside skin. `pictures/s95-gape-nocoin.png`.
- A top view (`pictures/s95-gape-top.png`) was taken at last, and the animal reads as a shark from overhead too:
  broad through the shoulders, dorsal and both pectorals and the tail all in their places.

## 0.92.3 — 2026-10-19

- **The shark is broader, and it is now possible to see it coming.** Measured off its own bounding box in the
  running Villa, the body through the middle was narrower than it was tall, which is a fish and not a shark:
  the width is up from 0.24 to 0.26, which puts it at the bull shark's own fourteen to ten. A note had said the
  animal "reads thin" and I had meant the girth tables; the measure said the tables were right and the width was
  not.
- **`tools/scare.js` can hold the lunge now**, not just the closed mouth: the whole animal nose-up with its back
  through the surface film, which is the one thing a visitor is never stood still in front of long enough to
  look at. `pictures/s95-lunge3.png` is the first picture of it.

## 0.92.2 — 2026-10-19

- **The mouth now has something inside it.** The throat was as black as a hole punched in the drawing, which is
  what an open mouth looks like when it is not one: it carries a dark red of its own now, and it survives the
  pool's film. The upper teeth were lengthened and stood more upright, so a shut mouth is a dark seam with a
  hint of white in it and an open one is two rows of them. Judged at half a metre with `tools/scare.js`, from
  just above the water at the coping.

## 0.92.1 — 2026-10-19

- **A bite now reddens the edges of the sight instead of browning them.** The vignette multiplies: what is in
  it is what the picture's edges are multiplied BY, and the red put INTO the multiplier took red away with
  the rest and came out a brown corner five points down (measured). The flush now leaves the red channel alone
  and takes the other two with it, and the corners go to a deep crimson and drain back to the everyday
  vignette byte for byte. `tools/scare.js --flinch` fires a bite at the camera and photographs what it does.

## 0.92.0 — 2026-10-19

- **There is a shark in the pool, and it bites.** A metre of bull shark (`src/shark.js`) cruises the basin with
  its dorsal cutting the surface about half the time; come within four metres of the water and it drops deep,
  turns, throws itself at the edge where your boots are and shuts its mouth. A bite throws rings off the
  surface, rolls a cloud of blood out under the film (`src/blood.js`) and leaves you with a rolled sight and a
  red ring at the edges of the picture. You cannot be hurt here and no health was added. The mouth is a real
  hole cut in the head, not a line painted on it, so the jaw can actually drop: eleven teeth, a dark throat
  behind them, and nothing showing outside the skin when it is shut. Turn it off with `?shark=0`.
- **The koi and the shark are now built by the same loft** (`src/loft.js`), which learned to leave a window in
  the skin. The koi were photographed after the move and are the fish they were.
- **Two tools for things that move too fast to photograph**: `tools/scare.js` poses the animal and holds it
  against its own behaviour, and `tools/bite.js` stands at the coping and waits to be bitten, saying each change
  of state as it happens.

## 0.91.3 — 2026-10-19

- **Dawn and sunrise were under-lit and the dawn sky was mud; both are put right.** A standing frame at quarter
  past five stood at mean L43 with 6.0% of it pure black, and half past six at L60 with no rake to speak of —
  the columns threw nothing on the terrace wall and the half of the dome away from the sunrise (which is all a
  north-facing view ever gets) was the colour of a wet slate roof. Turbidity is what turns the anti-solar sky
  to mud when the sun is low and behind you, so it came down (2.6 → 2.1 at dawn, 2.3 → 2.0 at sunrise), the
  dome came up (0.05 → 0.075, and 0.12 → 0.17 at sunrise), and the sunrise's own sun went from 28 to 40 with
  its fill and mirrors after it. Measured after: dawn **L44, black down to 4.0%**, sunrise **L65, in colour
  72.4% → 77.0%**, and at half past six the paving is warm and the columns lay long shadows across it.
- **The deep night's dome lifted a little** (0.014 → 0.019) so the hours between eleven and four are a dark
  blue and not a black ceiling.
- Standing frames of the hours are kept: `pictures/3150-dawn.png`, `3151-sunrise.png`, `3152-morning.png`,
  beside `3140-noon.png`, `3141-dusk.png` and the night set `3120`–`3122`.

## 0.91.2 — 2026-10-19

- **The noon hour was the roughest in the day, and is now only rough.** It stood at sun 70 with a nearly white
  diffuse and the fill at 7.6, and a browser showed a frame that was bright and flat at once: the middle band
  at L136 against L108 at half past five, and the front glass a sheet of cream with no room behind it. A
  third taken off the sun (61), a shade of warmth put back into it, and a little out of the fill and the
  mirrors: middle down to L125, mean 146 → 136, and the chairs behind the glass are furniture again.
  **What still blows at noon is not a fault** — the middle of the glass mirrors the sun out of the sky cube,
  and it stays at (242,201,155) with the sun's lamp switched clean off, because the dome keeps its sun; at
  half past five, with the room's lamps off, the same pixel falls to (58,53,39). A glazed south front at noon
  is a mirror and a glare. Measured, written down in the table, and left alone.
- **The address-bar light dials work again, and they had been silently dead.** `?sun=0`, `?hemi=`, `?sky=`,
  `?env=`, `?turb=` and `?rayl=` are how half the numbers in `NOTES.md` were got, by switching a light clean
  off and measuring what moved. The day cycle was writing those same numbers every boot, so the dials were
  being overwritten — and the first noon was measured with `?sun=0` reported as doing nothing at all, which
  was a lie about the sun and not about the glass. Each dial named in the address now `locks` its own number
  out of the day's hands.
- The half-past-five row was checked again after all of this: mean 115 against the old 114, ground L135
  against L134, in colour 92.6% both times.

## 0.91.1 — 2026-10-19

- **The sunbed's back rest is a back rest now.** At four metres it had read as a second piece of furniture —
  a grey slab parked beyond a pale one, because the only thing joining it to the bed was the pad it lay
  against, and its face is in shade while the top of the pad is in sun. It is built the way a sunbed's back
  is built now: two teak stiles carried up from the side rails, a teak slat across them, and a **thinner**
  cushion laid on top — so the eye gets a hierarchy (thick mattress, thin cushion) and the teak, which is
  the same warm wood as the frame, is what carries the rake. Two lessons in the numbers: stiles at 0.78 m
  came through at both ends and skewered the cushion like crossed sticks, and the bounding boxes had to be
  asked before the tips went flush.
- **The towel is a towel.** It wore `clothStripe`, which is a mid-brown awning cloth, and it lay half sunk
  into the pad: a terracotta tile let into a mattress. Pale cotton with two bands at each end, its own
  pattern scale (at half a metre to a repeat a forty-centimetre towel shows no band at all), folded as two
  folds so it has a step and a shadow under it.

## 0.91.0 — 2026-10-19

- **The Villa keeps a day now.** One number — the hour — moves the sun, the sky's fill, the bounce off the
  ground, the haze, the sky that the water mirrors, and every lamp in the garden, from a table of eleven hours
  written out in full in `src/daylight.js`. There are no formulas in it: a sun path solved from latitude was
  written first and thrown out, because this Villa's half past five is not an astronomical half past five and
  the light must agree with the picture, not with arithmetic. **The row at 17.5 carries the old bytes to the
  byte** (sun 60 at 1, .71, .46 — the whole rig), because every picture in `pictures/` was measured against
  them; and the start view was checked against the old picture afterwards and came back at mean 115 against
  114, in colour 92.6% both times. A whole day takes six minutes of walking, `?hour=21` starts it anywhere,
  `?daylen=0` pins the sun, and the line of type under the villa's name now says the hour in words — "half
  past five", "quarter to six" — because the Villa no longer keeps one hour.
- **Two fireflies, and the night belongs to the cockroaches.** `src/fireflies.js`: two of them, two and a half
  centimetres, a flash of a third of a second out of a period of two, drift, banking into the turn, and a
  long rest dark in a grass tuft. By day they are switched off and so are the cockroaches, and the butterflies
  are shut up with their wings folded — which means the fourteen-centimetre cockroach that was a monster under
  a visitor's boots at noon is now a thing you find at night, on the stone the pool lights. Measured with
  `tools/fffoot.js` from the two standing cameras that see them: 280 px of glow, and 168.
- **A yellow toy duck in the pool.** One, not three: `src/duck.js`. Nineteen centimetres of moulded plastic
  riding high on the water, bobbing, rolling a beat behind the bob, and drifting within a metre of where it was
  left. From the start it paints a 17×19 patch at mean 215,164,34 — the only saturated colour in the whole
  water, and the first thing a child in this house would go for.
- **What the browser corrected**, as usual. The afterglow sky was a black board until the sun was left a degree
  above the line and the dome lifted from 0.045 to 0.075 — at five degrees under, the atmosphere shader has
  nothing left to scatter. The night's pool glowed like a shampoo bottle until the water's own emissive came
  down by half after dark, which left the bright band at the fittings and dark blue everywhere else, as it
  should be. The first fireflies were dots: a light organ is six millimetres and the scatter round it is a
  finger's width, and this Villa's bloom is tight on purpose, so the glow is painted as two shells of lit
  glass. And setting the hour at boot re-prefiltered the sky cube a second time, which cost four points of
  light off the whole picture — measured 110 against 114 — before it was believed.

## 0.90.2 — 2026-10-19

- **The thrown pots were inside out.** Babylon counts a face as front when its three vertices go *clockwise*,
  which is the other way round from the right-hand rule that a surface of revolution comes out by: wound the
  mathematical way, every pot made by `revolve` showed its far wall through its own near one. On screen that
  was a flat pale patch of the wall behind sitting on the belly — read at the time as a chip in the clay and
  chased for a long while as a hole — and the weathering and the wheel rings were gone out of the surface.
  Reversing the winding brought all three back: the rings the throwing left, the grit in the fired clay and
  the lime crust high where water has wicked out and dried. Asked twice before it was believed: a ray fired
  at the pot from three directions found no missing band (a pick does not care which way a face is wound),
  and switching back-face culling off turned the pot flat black, which is what an inverted shell does.
- **The marigolds are on the pot now, not in it or above it.** Buried in their own leaves they were nothing
  at all — a green shrub in a jar — and lifted too high they floated over the crown like bubbles off a boiled
  egg. They sit in the top of the cushion now, and the gold has been deepened: a marigold is the colour of a
  marigold and not of a blanded apricot.

## 0.90.1 — 2026-10-19

- **The lemongrass was on fire.** A grass clump's `tint` is a *multiplier* read as bytes between 0 and 1, and
  the pot was handed one in 0-255: the fountain came out of Chromium at (254,253,190), 218 blown pixels in
  the standing view from the pool, a yellow-white starburst on the terrace that the release preview made
  unmissable. It is taken off the sward the garden already grows now — `lawnTone` at the pot's own place, a
  little paler and yellower, which is what a cut lemongrass looks like beside a mown lawn. Blown pixels in
  that part of the frame: **0**.
- **A pot wore its damp on its shoulder.** The clay canvas is painted with a pale mineral crust along one
  edge and the dark damp of a foot that never dries along the other, and `revolve` laid the pattern with its
  own top at the pot's base: the crust band sat on the belly and the damp on the neck. `flipV` puts the
  pattern's top at the top, which is where the lime crust belongs and where the damp does not.
- **Two pots had lined up into one.** The court pair stood at the same distance from the water as the great
  pair, and from the start place at the water's edge a small jar sat dead behind a big one: not two pots but
  one pot wearing a bucket, with a chipped pale patch of its own. The court pair is a metre nearer the pool
  and the shapes differ, so four pots now read as four.

## 0.90.0 — 2026-10-19

- **The pots are thrown now, and they are planted with six different things 🏺🌿.** Five pots stood on the
  paving and every one of them was a `cylinder` with a straight taper and a green ball on top: a ribbed
  paper cup with a scoop of moss on it, and four of them identical into the bargain. A pot is thrown on a
  wheel, and `revolve` in `src/mesh.js` now makes one — a profile of [radius, height] spun once about the
  axis, up the outside, over a moulded rim and back down the bore, so the wall, the lip and the hollow are
  one mesh with no seam and no lid. Three shapes: an `urn` with a foot, a belly, a neck and a beaded rim, a
  low wide `basin` such as a nursery sells a shrub in, and a `jar` with a small mouth and a belly outside
  it. Each pot is given a slight egg, a turn, and a little more or less height, because nothing that came
  off a wheel is exact and the eye reads copies at once.
- **What is planted in them.** A clump of lemongrass — a grass, so the lawn's own splayed old clump, cut
  pale and wide; a chilli bush with its red fingers hanging at the skirt (they stood upright at the first
  try and the browser called them chopsticks); a kumquat with fruit in it; a pot of marigolds with their
  heads on top of the cushion of leaf and not buried in it; a basil, low and wide and dark; and the plain
  clipped mass for the room behind the glass. And a pot plant is pinched out by hand, not sheared level
  with the hedge shears the court's shrubs wear — sheared, a herb in a jar came out as a green coin laid on
  the mouth.
- **The lounger's cushion was a strip of bitumen.** Its canvas had been darkened once for a clipped sunlit
  face and darkened again by mistake, so the base was [112,108,96] and a browser at the west deck had the
  pad at **57,56,48 — L56** on its shaded side, the one dark mark on a bright deck, while its sunlit top
  was right at 212,183,146. A sunbed's canvas is a pale warm cream: the base is [196,183,158] now and the
  shaded side came up to **93,88,70 — L88**, with the sunlit face actually *lower* than it was (210,177,135,
  red 210) and so no longer at the ceiling. What owed the money was the sheen, not the colour: a cloth at
  roughness 0.88 has no business carrying a mirror's `specularIntensity` of 1, and it was the sun's white
  glare on the pad that blew its red channel, so the sheen is 0.3. The CPU drawing had been painting the
  pad pale all along, which was the measure of the lie.

## 0.89.0 — 2026-10-18

- **Four koi in the pond 🐟🪷.** The basin had water, stones, lilies and frogs, and every one of them sat
  still: a visitor who walked to the bank found a picture of a pond rather than a pond in it. There are four
  of them now, 34 to 52 cm nose to tail, in three skins — `kohaku` white with vermilion saddles, solid `gold`,
  and `lacery` with ink blotches over both — each with its own speed and its own opinion of a human boot.
  They cruise, they hold a place in the middle with the tail still going, they come and sit under the bank
  beside whoever is standing there, and the shy one drops for the far rim when you get too friendly. A body
  is hand-lofted in three parented segments so the bend runs backwards down the fish rather than the fish
  being towed along a curve, with a forked caudal fin on a hinge of its own, a short dorsal sail, two
  pectoral paddles that row at a third of the tail's rate, and two beads for eyes low on a clean head.
- **A fish under a sheet of water is hidden by the thing it swims in, so they break the surface.** Where the
  eye grazes water the surface mirrors the sky (`src/water.js`) and the far half of any basin gives its fish
  back to the clouds. Measured from the standing place on the bank with `tools/where.js`: a back 1 cm above
  the surface line paints 170-330 pixels of a 1280 by 720 frame, and the same back 3 mm under it paints 2-8.
  So about one spell in four a koi comes up with its bright back through the film, which is what a pond fish
  does at a feeding place anyway, and it pushes a wide, faint, slow swell out from it — `pond.splash` learned
  new shapes for that, because a bright hoop every second looked like a seeded pond.
- **What a browser corrected.** First try was a fat grub with a sail and no head; proportions came to a
  quarter of the length across and just under a third deep, with a stalk behind the shoulders. A wet carp
  wearing 0.6 of sky came back the colour of the water round it, so the sheen is off and the pattern does the
  talking. Painted over the crown, the marking plus two high shiny eyes was a red mask with two black holes:
  a show kohaku has a clean head, so the saddles stop short of the gill and the eyes are small, low, wide and
  dull. And 26-40 cm is not a fish at five metres, so they grew.
- **`tools/where.js` was undercounting anything seen through water, and no longer does.** It counted a
  creature's pixels only inside the box its own magenta marking had painted, and magenta seen through half a
  sheet of tea-coloured water is a muddy brown that fails the colour test — so a koi filling the frame
  reported `covers 0 px`. There is a fallback window now, a square a ninth of the frame across centred on the
  creature's own pixel, and the honest count (this frame against the same frame with the animal taken out)
  answers for itself. From the bank the garden now reports 15 of 15 living things seen.

## 0.88.0 — 2026-10-18

- **The court is laid in stone now, not printed in squares.** The paving's pattern was four equal slabs to
  a repeat and two soft washes, and `tools/canvasstats.js` said what that came to: `mean 165,153,131
  std 4,4,3` — four points of spread in a whole painted stone, which is a flat mid tone with a smudge on
  it. A browser showed the deck as exactly that: a pale sheet scored by a grid, every slab the twin of
  every other, the same pattern marching four times over inside one view. It is painted again. Eight
  modules to the repeat — a module is 39 cm of the Villa's 3.1 m tile, a sawn paver off the shelf — laid
  in four courses of unequal height whose cross-joints are staggered, and every slab its own stone: its
  own tone within about a tenth, a lean that is mostly warm, two to four veins along the bed it came off
  the quarry in, a scatter of grit, a bright worn arris at its edges and now and then a chipped corner.
  The tile now measures `std 11,11,10` at the same mean.
- **The grain is multiplied and not mixed.** `wash` mixes toward one of two colours at one opacity, and
  the two ends pull each other out: that is why a 0.36 wash over a stone left four points of spread.
  `multiplyByField` scales what is under it instead, at three sizes — clouds the bigness of a slab, a mid
  grain of a few centimetres, a fine grain of a centimetre — over the joints too, because sand in a joint
  is grainy too.
- **The joints are no longer ruled in black.** The colour canvas had its joint lightened long ago, but the
  bump was built from the same picture with a dark joint and a steep slope, and ten millimetres of joint
  a pixel and a half wide is all edge: in the late sun every slab wore a black rule round it. The relief
  is painted separately now (`relief: true` keeps the joints, the arris and the grit and drops the
  slab-to-slab tone, so no slab stands proud because it happens to be a pale stone), with a shallower
  slope and a lighter joint at that end, and the bump's level came down from 0.6 to 0.45. Measured in the
  near foreground of the south path: the darkest pixel in the deck rose from L9.5 to L16.4.
- **The courses wander.** The lawn already had `lawnBend`; the paving now has `pavingBend`, a metre and a
  half of sideways pull over a wavelength of forty, so the courses of the west deck do not line up with
  the courses of the east deck and a visitor can no longer watch one four-course pattern march away from
  them down the whole court.
- Pictures: `pictures/s88-paver-before.png` and `pictures/s88-paver-after.png` (four tiles of the pattern
  side by side, before and after — a repeat the eye can catch in one and not in the other),
  `pictures/s88-deck-before-c.png` and `pictures/s88-deck-after-c.png` (the same cut out of the south-path
  view, at the same camera, before and after).
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 1050 meshes. The CPU
  drawing's stand-in is a square grid — it says so — and it keeps the module, the 10 mm joint and the
  spread between the palest and darkest stone.

## 0.87.0 — 2026-10-18

- **The west and east beds are planted.** Three faces of the house were given a band of laterite at the plinth and
  only the back one was planted, so the other two came out as what a band of bare earth with nothing in it is: a
  trench dug round the house — ten metres of red soil, a few grass sprouts at its outer edge, and bare plaster
  above it. Five shrubs to a side now, each with its own size and its own clipping like the back of the house (one
  sheared to knee height, the next left free), set 60 cm off the plaster so the biggest brushes the wall and does
  not lean on it, and standing at the bed's own soil height of 7 cm rather than on the lawn's level
  (`pictures/s88-westbed-c.png`, `pictures/s88-westbed.png`).
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 1050 meshes, 2007 of 2048
  shader slots free.

## 0.86.0 — 2026-10-18

- **The water lilies are leaves now, and they are in flower.** The pads were drawn on a canvas based at
  [44,86,40], and a browser showed what that means at six metres: a pad measured **L47 against the water at
  L73** — a crowd of dark holes on the surface, whatever shape they were cut in. A pad is a leaf, lying top side
  up in the sun, and the green went to [88,134,66]; the notches, the scalloped rim and the veins are now things a
  visitor sees instead of things the file contains (`pictures/s88-pond-c.png`).
- **Four flowers on the water**, three open and one bud, on the biggest pads and a little one beside them, each
  a star of petals in two rings — the outer ring splayed nearly flat, the inner one come up over the middle —
  with a ball of warm yellow in the centre. One ring at one angle came out as a white tulip standing in a saucer,
  which is a cut flower in a vase and not a lily on a pond; and the first flowers rode three centimetres above
  their pads, on air, until they were put down. A water lily lies ON the water. They are parented to their pads,
  so they bob with them and no separate clock was needed, and they lean with the pad's tilt but are counter-turned
  so the star does not lie down along the dip. The garden had no white thing on the water before this; at twelve
  metres it is the four brightest specks in the frame (`pictures/s88-pondwest-c.png`).
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 1020 meshes, 2007 of 2048
  shader slots free.

## 0.85.0 — 2026-10-18

- **The frogs are where a visitor can see them.** `tools/where.js` stood at the bank and counted the pixels each
  frog actually moves over four moments of its loop: **three of the five moved none at all** — one behind a
  boulder, one in the sedge at the margin, one on the stone under the visitor's own feet, below the frame. Now
  the pond answers `markPerches`, one ray from a visitor's eye at the bank to every stone's crown, asked after
  the whole garden is standing (what hides a frog is the boulder beyond the stone, not the stone), and a frog's
  home is chosen among the stones that pass. Measured from the same camera: **five of five seen** — frog1 0..394
  px, frog2 0..479, frog3 160..296, frog4 86..93, frog5 279..306, where before it was two. The zeroes are the
  dives: the measuring camera is a visitor, and a visitor makes a shy frog go in (`pictures/s87-pond-frogs-c.png`).
- **No stone floats, and the rim's rock is thicker in proportion to itself.** Crown and thickness were drawn
  independently, so a seven-centimetre slab could be told to stand twenty-four up, and did: a flat stone on a
  stalk of air, a mushroom ring round the whole pond. A stone may not ride higher than four fifths of its own
  thickness now, and the rim stones are drawn a third to a half as thick again as they are wide instead of a
  fixed few centimetres, which also shrinks the smooth radial fan that the pole of a sphere leaves on a pancake
  — the edge had been tessellating into a hundred little paper parasols.
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 961 meshes, 2007 of 2048
  shader slots free.

## 0.84.1 — 2026-10-18

- **The pond takes the sky now.** Its water mirrored at `environmentalIntensity: 0.4`, which was chosen when the
  worry was a sheet of pale foil seen from a first-floor window; at a person's eye on the bank the same number
  left a dark green sheet that read as a hole in the lawn. Half the pond is seen at a shallow angle and a shallow
  angle is where water mirrors the sky — that is the standing signal that a thing is water — while the near half,
  looked down on, still shows the silt through it. Measured along the water in the bank view: **L41..60 before,
  L42..100 after**, the bright end being wave crests, and the cast still green and not blue
  (`pictures/s87-pond-bank-c.png`, `pictures/s87-pond-west-c.png`). Roughness and the bump stay as they were: a
  tight glint on a dark sheet is the truth, a broad one is a plate of milk.
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 961 meshes.

## 0.84.0 — 2026-10-18

- **The pond's rim is a barrow of rock and not a kerb.** Every rim stone stood between one and twelve centimetres
  proud of the grass, all of them the same rock, all of them touching: a chain of brown buns, plainest from the
  bank (`pictures/s86-rim-pair.png`, before and after at the same camera). Their crowns now range from buried to
  a hand high, their lengths vary by more than threefold, a fifth of them are flat slabs laid over the edge
  instead of buns, some wear the lawn's coarser grey rock instead of the pond's, and two or three to an edge were
  simply not fetched — the chinking shows and a little of the bank with it. The flat slabs were first cut from
  the pool's pale coping and that gave a line of paper plates (L129 against L67..77 for their neighbours), so the
  shape stayed and the pale stone went back.
- **A struck face is no longer allowed to be unlit.** `facet` asks which way each face of a stone is looking by
  leaning it away from the stone's own middle; at the crown, where the wedges of a struck face meet at the
  sphere's pole, their centres sit so near the middle that the test was deciding by a hair and half of them came
  out pointing at the earth. The biggest boulder on the near side of the pond was set with black triangles that
  read as holes (`pictures/s86-pondlawn-c.png`). A face above a stone's own middle may not point down now; the
  underside, which is buried, is left alone. The fix runs over every faceted stone in the Villa — lawn boulders,
  rim, chinking. The struck lean was steepened as well, so the flat catches the eye foreshortened instead of
  full-face from above. Eight cuts each way on the corner boulders was tried and put back: with a rough fold it
  gouged the struck face into a pumice of black wedges.
- Checked: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 961 meshes, 2006 of 2048
  shader slots free.

## 0.83.4 — 2026-10-18

- **The beds are planted, not queued.** Every shrub along the back wall and along the south hedge was cut to one
  level and sized within a handspan of its neighbour, so the two that flank the back door came out as identical
  cauliflower balls three metres apart and the eight by the hedge stood like a queue. Size AND clipping are given
  per plant now — one sheared flat at knee height, one left free to go up where it likes — which is what makes a
  row of plants read as a plan rather than a repetition (`pictures/s83-rearbed-c.png`, `pictures/s83-rearbed.png`).
- Checked: nothing WRONG in `tools/feet.js`, 81.1% of the garden on foot, 60.1 fps at 960 meshes, 2006 of 2048
  shader slots free.

## 0.83.3 — 2026-10-18

- **The sunbeds are beds on legs now.** The frame was one slab 0.8 m across on three boards 0.74 m wide, so from
  the foot of the bed the near board filled the whole width and there was no daylight anywhere under a sunbed —
  which is the one thing a sunbed is. Two rails the pad lies across, three slats under it, and four square legs
  at the corners: you can see the paving between the legs now, and a shadow falls under the bed where the bed
  is not (`pictures/s83-sunbed-c.png`).
- **The pad went back to one leaf, sixteen centimetres thick.** The two-leaf idea (a top leaf inset four
  centimetres, a piped edge) looked clever from the foot of the bed and, from the side, which is where a person
  actually sees a sunbed, came out as a mattress stacked on a mattress with a shelf between them. Thickness on
  its own, with the quilted channels across it, is what says padded. The back rest likewise: it stood nearly as
  long as the bed, steeper than a ladder, hanging out past the end of the deck with nothing under it — a diving
  board, not a place to lean. It is short now, at about the angle a person sits at, its lower edge on the pad,
  with one teak prop under it doing the visible work. The prop poked through the cushion at the first numbers
  and stood on the back rest like a splinter in a mattress; it is short and low now.
- Checked: nothing WRONG in `tools/feet.js`, 81.1% of the garden on foot, 60.0 fps at 960 meshes, 2006 of 2048
  shader slots free.

## 0.83.2 — 2026-10-18

- **The garden's lamps are glass and metal, not paper.** The bulbs wore `mats.lampGlow` at (236,230,214),
  which is a white paper cup in any light: the wall lanterns, the string lights and the bollard heads all read
  as cotton-wool balls. The material is smoked glass now — (186,184,174), roughness down to 0.16, one bright
  highlight and a body only a little lighter than what it hangs against. The two lanterns on the back wall are
  a case of dark metal with a lens set into it, because a pale box with a lid is not a lantern
  (`pictures/s83-rear.png`).
- **The sunbed pads are linen and not a plank of light.** Measured before: a sunlit pad came out at
  **L202..214 with its red channel at 247..250** — clipped, and a surface pinned at the top of the tonal range
  cannot show a seam or a weave however loudly it is painted. The cushion's cloth is a warm grey-linen now
  (the pad sits at **L182..200**, nothing clipped) and its quilted channel is four centimetres wide instead of
  1.1, which was under a pixel at three metres and simply not there. Each pad is also laid in two leaves, the
  top one four centimetres short of the lower all round: what says SOFT at three metres is that piped step, and
  one box of canvas is a slab whatever you paint on it (`pictures/s83-lounger-c.png`, `pictures/s83-home.png`).
- Checked: nothing WRONG in `tools/feet.js`, 81.1% of the garden on foot, 60.0 fps at 948 meshes, 2006 of
  2048 shader slots free.

## 0.83.1 — 2026-10-18

- **The back door is IN the wall now.** It used to be a plank panel laid flush against a solid wall — same
  teak, same plane, no depth anywhere — and it read as a door painted on. The leaf is four centimetres
  narrower than its frame and stands three inside the wall's face, with a dark board behind it, so the gap
  between leaf and casing is near-black: a door out here is read from that line of shadow and not from its
  joinery. Recessing the leaf alone, same teak and no gap, just moved a pale panel nine centimetres and it
  went on reading as a picture of a door — that was the first attempt, and it is in the pictures
  (`pictures/s83-rear.png`, `pictures/s83-door-close-c.png` are what it looks like now).
- **It has a threshold.** The floor of this house is half a metre over the lawn, the plinth says so, and the
  door used to end in mid-air at the top of it with the wall meeting the grass in one flat drop. There is a
  stone under the door now, laid at the plinth's own top. Cut coping stone, not the garden's rock: the rock's
  pattern is a metre of pitted granite and at half a metre across that came out as a block of pumice with
  holes the size of your thumb. It is a threshold and not a way in — the terrace behind is blocked to walkers,
  because climbing the back of the plinth would put a visitor inside the wall.
- Measured: the door now reads **L38..52** against the wall at **L94..98**; it was a panel of the same
  brightness as the wall around it. `tools/feet.js` nothing WRONG, 81.1% of the garden on foot, 60.0 fps at
  940 meshes.

## 0.83.0 — 2026-10-18

- **The plastered walls go dirty at the foot.** A new helper in `src/mesh.js`, `grimFeet`, darkens a wall's
  vertices towards its base over a metre and a bit, warms the dirt (the red keeps its value, the blue is what
  is lost), and lets the dirt line wave a pace either way, because a level line of dirt reads as a painted
  skirting and not as weather. Every plastered wall of the house takes it — back, both sides, and the service
  block — and it is keyed to each vertex's place in the world, so a wall cut into six pieces around six
  openings comes out as one dirty wall and not as six pieces dirty in their own corners. Before: the rear wall
  measured **L121..132 top to bottom**, one flat plane the day it was finished; after: **L91 at the foot rising
  to L116** at its shoulder (`pictures/s82-rear.png`, and the side wall in `pictures/2858-westwall.png`).
  Written as a vertex colour and not as a texture, because the plaster's own pattern has been tuned across a
  dozen sessions and belongs to every wall, window and fascia in the garden.
- One bug of the bounded kind, caught by reading the vertices back out of the browser: the first version
  leaned the dirt line by the vertex's own position in the garden, which is a big number, so a wall standing
  north of here came out with its grime a metre deeper than one standing south. It is a bounded wave now, and
  every wall is dirtied the same amount wherever it happens to be.
- Checked: nothing WRONG in `tools/feet.js`, 81.1% of the garden on foot, 60.0 fps at 938 meshes, 2007 of
  2048 shader slots free.

## 0.82.0 — 2026-10-18

- **The six boulders in the west lawn are stone now, not bread.** They were plain ellipsoids of `mats.stone`
  sitting on the grass, and in pictures they came out as six smooth biscuit-coloured loaves, or eggs, or
  turtle shells, whichever the light happened to be doing (`pictures/s81-lawnrocks-before-c.png`). They are
  worked now, tinted by their own relief, struck along a leaning plane, tipped over as they came out of the
  cart, and flat-faced to catch the light on — and they wear a grey weathered granite of their own
  (`mats.lawnStone`) measured rather than guessed: the first grey came out at **L51..88 against grass at
  L110..141**, which is a heap of wet coal, and sunlit granite is lighter than its lawn and not darker.
  After: `pictures/s81-lawnrocks-after-c.png`, `pictures/s82-rocklawn.png`.
- **`fracture` folds all the way now.** Leaving a tenth of the crown above the struck plane — which is what
  it did — leaves a shallow cone where the face should be, and the triangles that used to meet at the pole of
  the sphere fan out across that cone like the rings of a sawn log: a wood cookie lying in the grass, in
  every picture, at four metres. Folded flat they are coplanar, and flat-shaded they are one face. The struck
  face also takes a little unevenness now (3% of the lump's own size), because a perfectly flat break is a
  machined break and rocks do not machine.
- **Sizes and seat.** The lumps drew width against height at up to four to one, and a four-to-one flat is a
  mound whatever you do to it; they are roughly two-thirds as tall as they are wide now, and sunk to the
  girth, because the giveaway of a stone laid on the ground instead of set into it is the whole belly showing.
  Cut seven ways instead of five: the pole of a sphere is a fan of long thin triangles and, flat-shaded, each
  wedge takes its own tone of light — more, narrower wedges and the fan stops reading as a pattern.
- The pond's boulders and rim wear the same struck-flat rule and were re-photographed after the change:
  `pictures/s82-pond-standing-c.png`. Nothing WRONG in `tools/feet.js`, 81.1% of the garden on foot, 60.0 fps
  at 938 meshes.

## 0.81.0 — 2026-10-18

- **The pond's stones are broken now and not rolled.** Two new tools in `src/mesh.js`:
  - `fracture(mesh, ...)` folds a lump's crown down onto a tilted plane, so it has the flat struck face that
    a quarried stone keeps and a rolled one never does. The skin is folded and not sliced, because a slice
    would leave a hole and a hole in a stone is a cave you can see the sky through.
  - `facet(mesh)` hands every corner of every triangle that triangle's own normal, so each face is one even
    tone of light. The triangles are pulled apart into independent faces to do it, because a sphere shares its
    corners between neighbouring triangles and a shared corner cannot belong to two faces at once.
  The corner boulders are cut six ways instead of five and then struck and faceted; the fifty-odd rim stones
  and the chinking get the same faces. Before and after at arm's length: `pictures/s81-boulder-before-c.png`,
  `pictures/s81-boulder-after-c.png`; the whole pond from the bank: `pictures/s81-pond-standing-c.png`. A
  smoothly shaded lump of rock is a loaf of bread whatever you do to its outline — rock is read from the
  angles between its faces, and a face only exists on screen while its corners hold one light value.
- A frog sitting on a faceted stone, four metres off, silhouetted against the water: `pictures/s81-frog-on-faceted-stone-c.png`.
- Checked after the change: nothing WRONG in `tools/feet.js`, 81.0% of the garden on foot, 60.0 fps at 938
  meshes, 1848 of 2048 shader slots free. The perch crowns came down a little with the struck boulders and all
  of them still stand above the water (0.02 m to 0.38 m over a surface at -0.035 m).

## 0.80.0 — 2026-10-18

- **The frogs go into the water when you walk up to them.** A frog that lets a hand reach it is a garden
  ornament. Each of the three at the near bank now weighs where the visitor stands, and within a couple of
  paces it turns its snout to the middle of the water and goes: a flat head-first leap of half a metre, the
  nose pitched down over it, and then it is under and off the scene (`pictures/s81-frog-dive-c.png`, the leap
  held at its midpoint with the frame's clock stopped). It comes back onto the stone it left when its nerve
  comes back — and not before: if the boot is still at the edge it stays down, up to three refusals, so
  nobody can empty the pond by standing in it.
- **Two of the five are bold and never dive** (the far north-west boulder and the north-east corner). That is
  what happens at a real pond, where the animals that have been looked at most get used to it; and it keeps
  the far side of the pond stocked for the eye while the near stones empty.
- **A ring goes out over the water where a frog entered.** Five flat rings lie on the pond, spent one at a
  time: born at thirty centimetres, out to a metre and a bit, and fading on a square of the time left, which
  is how a ripple loses its height as its circle grows. At the first setting the ring came out near L190 on
  water sitting at L55, which is a painted target and not water: the emissive is a third of that now and the
  ring is a few points of light (`pictures/s81-ripple-feet-c.png`, and `pictures/s81-ripple-c.png` from
  above). They are made at build and hidden, not made at the moment of the plunge, since a mesh built
  mid-animation is a hitch in the frame.
- Two bugs of the kind that leave no error: the plunge's arc was driven *after* the frog's state chooser, so
  on the frame the leap ended the chooser had already picked the next state and the animal snapped back onto
  its stone without ever reaching the water — the arc now runs ahead of the chooser, like the wait under it
  does; and `pond.animate` was never handed a delta, so a ripple was laid down and then sat on the water for
  the rest of the day.

## 0.79.2 — 2026-10-18

- **The lily pads are leaves now and not coins.** Each was a squashed cylinder — a perfect circle, level as
  a billiard ball, ten of them — and a water lily's leaf is a circle with a wedge cut from the rim to the
  middle. `makePad` in `src/pond.js` cuts a fan with a slit in it (a different slit and a different
  direction on every pad), gives the rim two slow wobbles so it is scalloped and not a polygon, and lets
  each pad ride the water tilted, one edge in and the far one dry (`pictures/s80-lily-close-c.png`, at four
  metres). Wound the wrong way the whole disc is culled and the pond simply loses its pads, without an
  error and while a projection of their positions goes on naming their pixels: the winding and the reason
  are written down in the function.
- Notes in `src/main.js` on a pond mirror that was built, measured and taken out again, released separately
  as **v0.79.1**.

## 0.79.1 — 2026-10-18

- Notes only, no pixel changed: `src/main.js` now carries the numbers and the reason for a pond mirror that
  was built, measured and taken out again (a cube from the pond's own surface darkened the water from L36..42
  to L26..32 and showed nothing in it), so it is not built a second time.

## 0.79.0 — 2026-10-18

- **Grass grows up to the water now.** The pond's rim used to be ringed by a bald band of gravel, because the
  garden's rule for where a grass clump may stand threw out everything within forty centimetres of the water —
  a swimming pool's edge, not a pond's. Four fringes of sedges are laid round the rim now, in drifts and with
  the young upright shapes and not the old splayed ones, and the near side is deliberately the thin one, since
  that is where a person stands and where three of the five frogs sit (`pictures/s80-pond-west.png`, and the
  close view in `pictures/s80-pond-standing-c.png`).
- `inPond` keeps a clump out of the water and its immediate lip (6 cm) now, and a new `inPondStone` keeps one
  out of the fifty-odd stones, so grass comes up where there is soil and stops where there is rock.
  `tools/tuftfoot.js` builds the pond too, and still answers `0 places on built stone, 0 in the pool` over
  3847 clump sheets.
- Two standing cameras were added to `tools/cameras.txt` — `pondbank` (on the south bank, where a visitor
  stops) and `pondlawn` (twenty metres off across the lawn, with the villa behind) — so the next session has a
  fixed picture of the pond to compare against, and the photographs are `pictures/2819-pondbank.png` and
  `pictures/2820-pondlawn.png`.

## 0.78.0 — 2026-10-18

- **The pond's rim is closed, and its gravel is a colour.** Two faults a picture showed and the code could
  not. The bare strip of damp gravel between the grass and the stones was coming back (20,18,7) — L15, where
  the lawn beside it is L100 — which is not shade, it is a black gutter all round the water; `mats.pondSilt`
  is `paint([138,124,92])` now and the same strip reads L33, the colour of soil that has been raked wet. And
  the gaps between the big rim stones let the lawn's straight cut edge show through, which is the one line
  that gives a sunk rectangle away as a rectangle: twenty-five small chinking stones are wedged into every
  gap over thirty centimetres, laid low and pushed a little outboard, the way a dry-stone edge is really built
  (`pictures/s80-pond-west.png` is twenty metres off and shows the closed line).
- **Five frogs, and the fifth is where a walker comes round.** Four of them sat on the south and east sides —
  which is where the camera had been kept, and that was the error and not the pond — so there is one on the
  north-east corner now, the corner a visitor coming from the paving rounds first (`pictures/s80-pond-northeast.png`).
- **`tools/where.js` counts frogs now**, and says so from the south bank: `seen from here: 5 of 11`, the five
  painting 81, 120, 178, 377 and 647..700 pixels of a 1280x720 frame, with a pick down each one's own pixel
  naming its own body (`pictures/s80-where-frogs.png`).
- The walk is unchanged and still right: 81.0% of the garden reachable on foot, the water and open water kept
  off, the chinking stones standing as floors. 60 fps at 933 meshes.

## 0.77.1 — 2026-10-18

- **The pond's four corner boulders are squatter and harder crumpled.** Seen from the west lawn they had
  read as four coconuts set down on the grass (`pictures/s80-pond-west.png` before the change): a smooth
  sphere of stone is a coconut and a boulder is not. They are a hand's-breadth lower, a little wider, and
  crumpled at 0.34 over five lobes instead of 0.2 over four. The frogs sit on their crowns as before, and
  `tools/feet.js` still keeps a visitor out of the water.

## 0.77.0 — 2026-10-18

- **A pond in the west lawn, with four frogs on its rim.** `src/pond.js` is new: a basin sunk in the empty
  corner between the pool and the west hedge, a ring of stone slabs for its sides and its gravel band, a
  sheet of water on the pond's own patched shader (`villaPondWater`, since `src/water.js` bakes its numbers
  into the shader text and the pond must not repaint the pool), thirty-one rim stones and four corner
  boulders, and ten lily pads in three knots of different age. The lawn is cut into pieces round it, the
  grass stops growing in the water, and the walk refuses it: `?view=-15.6,1.62,17.4,-2.11,0.2` stands you
  on the south bank, where two of the four frogs are plain to see without hunting.
- **The frogs croak and hop.** `src/creatures.js` grew a frog: body, throat, eyes with a horizontal pupil,
  tucked fore legs and folded hind legs, sitting on a rim stone's actual crown — after breathing slowly, it
  croaks with its throat swelling and its eyes sinking, then hops a short way to a neighbouring stone. Shown
  at 13 cm against a real 8, the same licence the cockroach was given and for the same reason; `?frog=` dials
  it live.
- **The pale grey line all round the edge is gone, and it was never a colour.** The first pond showed a
  colourless band at its rim and no change of material would move it: a ray fired at the pixel answered
  `none`, so the eye was looking at the sky behind the garden through a slot between the lawn's cut edge and
  a gravel band too narrow to close it. The band is 45 cm wide under the turf now, it stands 2 cm under the
  grass, and the water was brought up to 3.5 cm under the lawn so the step at the water's edge went from a
  black gutter of lining to a centimetre and a half.
- Two faults the pictures caught: at even spacing the rim was a row of beads and the pads polka dots, so the
  stones are jittered in length, height, tilt and spacing and the pads are laid in knots; and a rougher water
  to calm the sparkle turned the whole sheet into a plate of pale foil from above, so it is glass-smooth
  again with a gentler chop than the pool's.
- `tools/feet.js` builds the pond now and was told about it: open water is kept off, both banks and a rim
  stone are walkable and reachable, and 81.0% of the garden is still reachable on foot. 60 fps, 892 meshes.
  Pictures: `s80-pond-standing.png`, `s80-pond-overhead.png`, and the faults above as `s80-pond-edgefault-c`,
  `s80-pond-gutter-c`, `s80-pond-beads`, `s80-pond-foil`.

## 0.76.0 — 2026-10-18

- **Three cockroaches now, and one of them is under your feet.** The master asked for more roaches, and he
  was right that one animal patrolling a corner is not a feature. `ROACH_PATCHES` is now three patches of
  paving with a roach in each: the stone a visitor stands on when they arrive, the west walk between the
  laterite bed and the water, and the east deck by the loungers — stopping short of the cheese platter at
  (6.8, 9.2), because the cheese in this Villa is insect-free and stays so. Each animal's parts carry its
  own number now (`cockroach1Shell`, `cockroach2Leg10`) instead of three beasts sharing one mesh name.
- **Debug size, on the master's order.** The animal is 4.5 cm and is shown at fourteen (`ROACH_REAL_CM`,
  `ROACH_SHOWN_CM`), and `?roach=4.5` in the address puts the honest one back live, without waiting for a
  release. Measured looking down at the standing start (`?view=2.4,1.74,10.5,3.2,1.05`: the fifth number is
  DOWNWARD pitch), the roach underfoot paints 1824..2359 pixels of a 1280x720 frame against a colour gap
  of eighty-five, and a pick at its own pixel names `cockroach1Shell`. At the honest size the same animal
  1.66 m off paints 219..250 px with a gap over a hundred — which says the real creature was always
  findable; it had simply been put where nobody looks. Its leg beat is divided by its own length, so a
  fourteen-centimetre roach takes long strides instead of blurring its legs.
- **The shine came down.** A third of a mirror on chitin put a white streak along the top of the shell and a
  needle of daylight down one antenna (`pictures/s79-feet2-cockroach1.png`); shell and legs are at 0.12 and
  0.18 now and the base went from (74,44,24) to (66,38,20), so it is a dark animal on bright stone and not a
  copper coin. Legs and antennae are a quarter thicker, in the same body fractions, so the pair in front
  reads as rods and not a row of dashes.
- Pictures: `pictures/s79-feet4.png` is the standing start looking down at the feet with a roach underfoot
  and `pictures/s79-feet4-cockroach1.png` is the same beast blown up; `pictures/s79-feet-real-cockroach1.png`
  is the honest 4.5 cm one; `pictures/s79-set-0760.png` is the seventeen standing views at 2794-home …
  2810-backstore against 2777–2793, the Villa unchanged apart from what crawls on it.

## 0.75.0 — 2026-10-18

- **The butterflies and the cockroach can now be found.** The master walked the Villa and met neither, and
  the new `tools/where.js` says why: v0.74.0's butterflies were 6.8 cm across, two metres off the ground
  in corners nobody stands, and they flew straight at you, which shows the EDGE of a wing — the first
  picture held five pixels of butterfly, and five pixels is dust on a lens. They are eleven-centimetre
  birdwings now (a real Thai size) and they hang over the coping at the pool's near end, four metres in
  front of where a visitor arrives, swinging WIDE across the view and barely along it. Measured in the
  first picture: 64..82 and 58..117 pixels of a 1280x720 frame, standing 50 to 70 parts in 255 away from
  what is behind them. The third keeps the west bed, for whoever walks round the water.
- **The cockroach moved in under the visitor's feet**, on the paving at the pool's south end — the one
  place a person stands and looks down — and grew from three centimetres to four and a half, the big house
  roach of this climate: 263 pixels at arm's length, 18..22 from the paving three metres off, a colour
  gap of about eighty-five. Its patch runs out to the coping's lip, the water is a wall to it and it turns
  back dry, and it stops short of the platter table: the cheese in this Villa is insect-free and stays so.
  It stands on its feet now instead of lying on its belly, and its legs and antennae are thick enough to
  be seen.
- **The wings stopped wearing a mirror.** The Villa's oldest fault again: a new material ships with a
  mirror's `specularIntensity` and the wing materials had never been told otherwise, so at half a metre
  they came back cream with a pale blue rim (`pictures/s79-near12.png`) instead of orange, blue and white.
  They keep 0.15 of the mirror and carry their own colour; the three glows were doubled, because a wing
  that size is lit by the sky it hangs in and the sky alone painted it a dark smudge.
- **`tools/where.js` is how a small living thing is measured now.** It stops the Villa's clock, then turns
  the creatures' clock itself at chosen moments, and for each one reports: the pixel it projects to, how
  many pixels it really paints — counted by drawing the same moment twice, once with its meshes taken out,
  so a creature that is culled or hidden cannot fake the number — the colour it is drawn against, whether a
  pick down its own pixel names it or names a pot instead, and where in the world it is standing. Switches:
  `--view`, `--times`, `--box` for a blown-up crop, `--url` to weigh a released copy. `main.js` now hands
  `creatures` to `window.__villa` so a probe can wind their clock by hand.
- **Pictures**: `pictures/s78-work2-butterfly7.png` is v0.74.0's butterfly at two and a half metres — five
  pixels and no wings; `pictures/s79-final-butterfly7.png` and `pictures/s79-final-butterfly8.png` are the
  two near ones now; `pictures/s79-roach2-cockroach.png` is the roach at arm's length; and
  `pictures/s79-set-0750.png` is the seventeen standing views (2777-home … 2793-backstore) against
  2740–2756 as v0.74.0 left them — view for view the same Villa, with something alive in it.

## 0.74.0 — 2026-10-18

- **Three butterflies over the garden, and one cockroach on the stone.** `src/creatures.js` is new. The
  butterflies have their own patch each — the laterite bed by the terrace steps, the west verge of long
  grass, the pots at the foot of the far paving — and their own colour: paper white, morpho blue, a tiger's
  orange, all three from one wing canvas painted pale and coloured by the material, so three butterflies
  are three colours and not three patterns. Each beats at its own rate, loops about its patch on three slow
  turns at different rates so it never repeats the same way inside a walk, faces where it is going, and
  leans into the turn the way a cyclist does. The cockroach goes the way roaches go — a dash, a dead stop
  with the antennae going, another dash in a new direction — over the east deck, on legs that are driven off
  how far it has actually walked so it never runs on the spot, and it stands on the same ground the
  visitor's own feet are asked about and turns back at the edges of its patch.
- **Both first attempts were refused, in the same way.** The butterfly was a pale fan with a chrome bead for
  a head: its wing was three ellipses unioned, and its dark border was a shrunk copy of the outline, which
  is thick where the wing is wide and missing where the wing is narrow. The wing is now one closed path with
  a notch where the two wings meet, and the border is STROKED, so it is one width all the way round
  (`butterflyWingCanvas` in `src/textures.js`; `pictures/s77-wing.png` is the canvas, `pictures/s77-
  butterfly-first.png` the fan that was refused and `pictures/s77-butterfly.png` what it came to). The
  cockroach was a copper coin with knitting needles in it, and the reason was the Villa's oldest fault — a
  new material ships with a mirror's `specularIntensity` — so the chitin keeps three tenths of its shine
  and no more (`pictures/s77-cockroach-first.png` against `pictures/s77-cockroach.png`, and
  `pictures/s77-roach-far.png` is the same animal from a person's own height, which is a dark speck: that
  is what three centimetres is, and it is enough).
- **Two switches for the tools, nothing new for the visitor**: `?bugs=0` takes the creatures out, and
  `?still=1` stops their clock so a camera can be aimed at a place one of them is actually in. Without the
  second one they cannot be photographed at all: `screenshot` lets a page run twelve seconds and a roach
  that has been running for twelve seconds is a metre from where it started.
- **What they cost**: 720 meshes to 745, and `tools/fps.js` in one run says 1.4 fps with them against 1.2
  without, which is no price at all. All seventeen standing views re-photographed (2740-home …
  2756-backstore, one picture of them all as `pictures/s77-set-0740.png`, and `pictures/s77-set.png` is the
  same seventeen as v0.73.0 left them): view for view the same luminance to a tenth of a point, nothing
  blown, nothing blackened. These are not for a picture of the whole garden — they are for the corner of the
  eye, and for when somebody stops and looks down.

## 0.73.0 — 2026-10-18

- **A clump of grass is drawn as leaves that bend, and not as a sheaf of straight ones.** `clumpCanvas` in
  `src/textures.js` now walks every leaf out of the crown in eleven equal strides, turning a little further
  each stride, so a leaf that turns nothing stands up and a leaf that turns two radians arcs right over and
  hangs its tip below its own peak — which is what a long blade does under its own weight and is the one
  thing that makes a clump a plant and not cut corn. There are 116 of them and not 430, and they are fatter
  (2.2–4.8 mm of a clump, in millimetres and not in texels, so the numbers survive a different atlas size).
  The back layer of the three is a dim crowd at little over half its own light, so the middle of a clump is
  SHADE and not air: a clump is not leaves sprinkled over a gap, it is a plant with an inside.
- **The skin's border is eased off, which is what was leaving a flat green bar along every border in the
  garden.** A square inked right up to its own edge, read at a coarse mip level, is a bar with a ruled top.
  The outer two per cent of each cell now fades to nothing, which is a little over one texel: nothing a
  person can see is lost, the straight line is.
- **One clump's four sheets no longer grow to one height.** Four copies of one silhouette stood
  forty-five degrees apart union into an eight-pointed star; each sheet now gets its own `crown` (0.74–1.06
  of the clump's height) and its own `spread`, and the clump is a mound. In `src/garden.js`.
- **The drawing was told.** The bush's and the clump's own light in `src/surface-colours.js` were measured
  again off the live page after the repaint (the clump's leaves are a deeper green now, so less is left for
  the emissive to multiply: its glow came down to (0.019, 0.108, 0.004)).
- **What the pictures said.** All seventeen standing views re-photographed (2700-home … 2716-backstore,
  `pictures/s77-set.png`) against v0.72.0 photographed again in the same session (2720 … 2736,
  `pictures/s76-v0720-set.png`): every view within one point of luminance, nothing blown, nothing
  blackened — which is honest way to say this change lives at a clump's own scale and not in a whole frame.
  The skin of four ages, laid on its ground, reads as grass at arm's length
  (`pictures/s77-clump-atlas.png`); `pictures/s77-clump-close-pair.png` is the two builds at the west verge
  and `pictures/s77-border-pair.png` at the south hedge. Still not right: six metres off, a scattered clump
  is a small green mark in the sward rather than a plant, and at one to two metres its widest leaves read
  broad and rosette-like. That is the next thing.

## 0.72.0 — 2026-10-18

- **The shrubs are clipped now, because this is a paved court and not a wood.** Every shrub and potted
  bush in the garden was a dome: `crumple` pushes a lump of leaf in and out and leaves its outline one arc,
  and a bun of leaf is what a privet that was never cut grows into. A clipped one has a **plateau** where
  the board went across it, its flanks fall away from the edge of that plateau, and the plateau bristles
  with cut shoots. `shearTop` in `src/mesh.js` lays that board: every corner of a lump above it is pulled
  down onto it, the board wanders a little on a slow field (a hedger lays it by eye and it sags), the normals
  are recomputed so the cut face is lit as a flat face, and the corners that came down are lit as tips.
  The board lies at 0.46 of each plant's own width (`SHRUB_CLIP`), and `?clip=1` in the address bar lays the
  shears out and puts every dome back — which is how it was weighed.
- **Cut shoots stand up, and nothing stands above the board.** On a cut face the skin looks at the sky, and a
  leaf card laid in a face that looks at the sky is a plate: so a card there is stood up outright, and then
  slid down until nothing of it is more than two centimetres over the board. Without that second half the
  crown grew a comb of upright cards, which is worse than the bun it replaced.
- **Measured with a new eye, `tools/crown.js`**, which follows the top edge of a plant across a picture. Over
  the middle of the big border shrub on the `rear` camera: uncut its top edge drops 32 px and only 14% of its
  columns sit within 3 px of the crown's own middle — a dome; as shipped it drops 22 px, wanders 5.6, and
  47% of the columns are on the plateau, and the crown stands 19 px (some 8 cm) lower. `pictures/s74-clip-
  uncut.png`, `-046.png` and `-036.png` are the ladder at one camera: above 0.46 the plant keeps a bun with a
  flat patch on it, at 0.36 it loses its shoulders and becomes a mat.
- **Nothing else in the Villa moved.** All seventeen standing views re-photographed (1203-home … 1219-backstore,
  `pictures/s74-set.png`): luminance within one point everywhere (`rear` L84 → L83, `sala` L99 → L100, `west`
  L110 → L111), nothing blown, nothing blackened. `tools/cover.js` on the `rear` view: the leaf cards give up
  5.4% of the frame → 4.3% and the shell 2.5% → 1.8%, because the plants are shorter, and their green moves
  from (41,85,11) to (38,79,11) — the cut face sits in its own shade. The walk is the same walk: 719 meshes,
  48 floors, 129 blockers, `tools/shadows.js` clean, and the CPU drawing wears the same geometry — it draws
  the same flat crowns, because it builds the same meshes.

## 0.71.0 — 2026-10-18

- **The near third of the pool was a dark tank, and it was the water's own film, not a shadow.** Standing on
  the south paving the foot of the basin read L127 against the far water's L147, and the darkest facets of
  the chop were down at L16-31 — black commas in a basin of clear water. Two explanations were bought and
  both were measured false: it is NOT the shadow of the pool's own south wall (`?noshadow=1` moves the foot
  and the middle by one point), and the floor under it is not in shade at all (take the water sheet out and
  the same three places read L174, L203, L182, sunlit clean across the pit — `tools/pitfloor.json`). It is
  the angle film in `src/water.js`: where the eye grazes the surface the alpha goes up and the emissive cyan
  goes down, and this renderer pays a dielectric's mirror next to nothing — `mats.water.environmentIntensity`
  was ladderred 0.5, 1.0, 1.6, 2.4 and moved the water by one point — so the surface was told to become a
  mirror and given no mirror to be, and stood there with an albedo of nearly black.
- **The mirror is now paid by hand, the way the pit's tiles are.** One factor, two uses: what the water stops
  painting with its own colour it gets back as the sky it sees — `finalEmissive += villaMirrorSky * villaMirror`,
  with `villaMirrorSky` the pale blue of the dome over the pool and the lit front of the house in it,
  [150,182,188] in `src/materials.js`. Because it is read off the bumped normal it shimmers by itself: a facet
  that tilts catches more sky and its neighbour catches less. On the start camera the whole pool went L126 →
  L142, the foot L127 → L142 (level with the dry coping at L143), the middle L146 → L163, the far water L147 →
  L166, and the black troughs came up from L16-31 to about L98. Nothing new blew: 2.6% of the frame past L200
  before, 2.8% after. Of the seventeen standing views only the three that can see water moved — `home`
  L113 → L116, `west` L109 → L110, `pool` L103 → L107. `?wsky=` dials it and `?wsky=0` is the control.
- **A steeper payment was tried and refused.** The sky was paid at the SQUARE of the Fresnel, on the theory
  that a flat sheet should not mirror while only its facets do: strength 2 at the square reads L142, L165,
  L170 in the foot, middle and far water against L142, L163, L166 at the plain law — two points, which is
  nothing, so the simpler law that was already in the file was kept and the second dial thrown away.
- Two source files and one mirror for the CPU drawing: `src/water.js`, `src/materials.js`, with the note
  beside `mats.water` in `src/surface-colours.js` rewritten (its bytes were deliberately NOT moved: the
  browser came up towards the drawing by itself, and moving them would have widened the gap). No new key,
  no new light, nothing to click.

## 0.70.0 — 2026-10-17

- **A shrub is a plant now, and not four copies of one bun.** Photographed at six metres every shrub and
  every potted bush in the garden came out as one dome of one green: the light the Villa writes on them
  (`skinTint`) is normalised to a mean of one per lump, so it can shape a lump and cannot make one plant
  differ from its neighbour, and every leaf card was drawn from the same 0.7–1.1 of a spray, so there was
  no leaf bigger than the next and the mass averaged to a fuzz. `massTint` in `src/mesh.js` now writes
  over the merged plant at the two scales the eye still reads from four metres out: every plant gets its
  own brightness and its own lean of hue (`own` 0.15), and a slow world field lays two or three soft lobes
  of lighter and darker green across it (`lobes` 0.26, `span` with the plant). A sixth of the leaf cards
  are grown to a lobe — 1.3–1.8 of a spray instead of one size — and the crown-to-skirt ramp on a card
  came up from 0.16 to 0.30. Measured on the `grass` camera: the outside leaf runs 39 points of green
  where it ran 10, and the shell 12 where it ran 3; `pictures/s72-bush-pair.png` is one potted bush at
  six metres, twice its own size, before and after.
- **A sunbed's pad is canvas over foam, and not a white slab.** The pad was a box wearing `mats.cloth`,
  whose grain is a shade every eight centimetres and gone entirely at the ten metres a lounger is looked
  at from: the top was one flat pale sheet with a hard edge (`pictures/s72-lounger-pair.png`, the left
  half, is a concrete block with legs). `mats.cushion` is a new material whose repeat IS one panel —
  62 cm — so the pad is quilted into three along its length: puffed a fifth brighter in the middle of
  each panel, stitched and piped at the joins, drifting softly over the whole of it, and its base is
  [198,180,152] rather than the cloth's [226,216,196], which is the difference between a cream cushion
  and a hole in the picture at the top of the tone map. The frame came out to 0.80 m against the pad's
  0.60, so a sunbed now has a band of teak of its own either side of the cushion. On the `pool` camera the
  pad reads (172,169,136) where it read (183,180,156) — 12 points off the glare, warm instead of cool.
- **The terrace soffit is boarded along the house.** It was the last piece of board in the Villa wearing
  an upright's wood: `mats.teakWall` is nine boards to a 1.8 m repeat stood up, which is right on a post
  and, laid over a ceiling 17.6 m wide, reads from the deck as boards running away from the eye with a
  joint across them every 20 cm — a comb, and not a ceiling. `mats.soffit` is the same structure teak
  with `grain: "cross"`, so on a plane that looks at the ground the boards lie under the eave and every
  one of them runs the whole width of the house (`pictures/s72-soffit-up.png`). No bump: this face is lit
  only by the ground and the sky at a graze.
- Three source files, one mirror: `src/mesh.js` (`massTint`), `src/textures.js` (`cushionCanvas`),
  `src/materials.js` (`cushion`, `soffit`), with the users in `src/garden.js`, `src/props.js` and
  `src/villa.js`, and `cushion` and `soffit` entries in `src/surface-colours.js` for the CPU drawing. No
  new key, no new light, nothing to click. All seventeen standing views re-photographed twice: whole-frame
  luminance moved by a point at most (`rear` L84 → L83) and nothing blew or blacked.

## 0.69.0 — 2026-10-17

- **The four beams across the room's ceiling are timbers, and the front of the house lost its
  shingles.** They wore the wall's wood — nine boards to a 1.8 m repeat, stood up — which on a post is
  right and on a 13 m beam lying down is a row of little blocks: a butt joint every 20 cm along a beam
  0.22 m deep, and seen from the pool through the glass at a graze, a course of dark shingles with a
  stepped hem. That band above the front glass was the sixty-ninth session's item 3, and it was never the
  soffit: it was the beams. `mats.beam` is the same structure wood at two boards to a 3.2 m repeat with
  the grain lying along the piece, so a beam's own face is narrower than one board and wears no cross
  joint, and its bump is the gentle one because the only light these faces get comes from below. From the
  front the top of the room is a ceiling with four timbers across it
  (`pictures/s71-beam-pair.png`); from the deck, one long board with its grain running its twelve metres
  (`pictures/s71-ceiling-pair.png`). Of the seventeen standing views only the three that can see into the
  room moved, and by a point: home L113 → L112, colonnade L99 → L98, frontcorner where it was.
- Two source files and one mirror for the CPU drawing: `src/materials.js`, `src/interior.js`, and a `beam`
  entry in `src/surface-colours.js`. No new key, no new light, nothing to click.

## 0.68.0 — 2026-10-17

- **The pool under the water was graph paper and it is a pool now.** The mosaic's joint was laid
  `#e4f0ec` — (228,240,236), a near-white net standing a hundred points of light above the glass it
  surrounds — and at the start camera the far two thirds of the basin are seen at a graze, where every
  course is squeezed to two or three pixels and the filtering averages each one to a dead-straight even
  line. The joint is a dull grey-green `[172,190,186]` now, every course has a width of its own, and the
  whole of a patch — joint and glass together — rides a slow field at ±16%, so the net fades up and down
  over three or four courses instead of lying even over half the picture. Measured on the start view's
  water: block-to-block channel spread 28 → 30, L std 27.8 → 30.1, whole frame unchanged at L113, because
  the fault was evenness and not light. `pictures/s71-grout-pair.png` is one crop of the far wall, twice
  its own size, before and after.
- **The four walls of the pit wear a moving net of light for the first 80 cm under the surface.** The floor
  has worn caustics for many sessions and the walls — which at a graze are most of what is seen through the
  film — had nothing but the joint grid. `mats.causticsWall` is a second caustics canvas on its own seed at
  the same pitch, emissive like the floor's, laid on four skins 2 cm proud of the inside faces at
  `visibility` 0.45 and running at its own pace, so wall and floor never lock into one pattern. `?net=0`
  takes it off: 65,981 pixels move past 24 summed channels, all of them in the water.
  `pictures/s71-water-pair.png` is the whole water band before and after, `pictures/s71-net-pair.png` the
  same corner with the net and without.
- **A theory about the pale slab in the middle of the start view, measured and buried.** It has been read
  as a mirror that wants smudging. It is not a mirror: `tools/pickat.js` puts the slab at world z = 2.4 —
  the sunlit far wall seen through the film — and its dark neighbour at z = 5.2, which is the floor in the
  shadow of the pool's own south wall (1.76 m of wall, a sun at 24 degrees, a shadow 3.95 m up the pit);
  `?noshadow=1` lifts the dark half from L85 to L148 and leaves the slab at L168. Both halves are right.
  The line between them is straight because nothing bends light on its way into this water, and that is why
  the two dials aimed at it failed: `roughness` 0.06 → 0.16 moved the water a point and the slab's edge not
  at all, and the ripple bump 0.7 → 1.8 lifted the middle by twelve points and left the edge alone. Written
  into the water block of `src/materials.js` so nobody spends a session there again.
- All seventeen standing views were re-photographed and read. Sixteen stand where v0.67.0 left them to a
  tenth of a point; the pool view came down one point (L104 → L103), which is the dull joint paying for its
  own loss of glare. Nothing blew to white and nothing is pure black. Four meshes came in — the wall nets —
  and no light. Five source files: `src/textures.js`, `src/materials.js`, `src/pool.js`, `src/main.js` for
  the two switches, and `src/surface-colours.js` to tell the CPU drawing the new joint bytes.

## 0.67.0 — 2026-10-17

- **The room behind the front glass was a concrete board, and it is a lime-washed room now.** Its plaster
  was painted `[206,200,188]` — three numbers within sixteen of one another — under lamps the colour of a
  candle, so the biggest single shape between a visitor and the house read as shuttering concrete: the
  middle of the frontage came out of Chromium at (111,94,69) L96 while the teak mullion two hand-widths
  away in the same picture stood at L137. It is a lime wash with earth in it now, `[216,194,164]` — warmer
  than the outside plaster and paler, which is what lime left under a roof looks like — and the two lamps
  over the room came up from 20 to 30 with it (laddered at 20, 26, 32, 40: at 26 the ends of the room stayed
  grey, at 40 the back wall matched the fascia boards and the whole front started reading as a shop window).
  The front now reads (131,98,60) L102 against that same mullion's L139 — a lit room behind glass, still
  short of the timber that frames it. The alcove lamp and the floor lamp keep their numbers, because the
  alcove back already stands at L181 near enough blown. `pictures/s70-room-pair.png` is the front before
  and after at full size, `pictures/s70-room-full-pair.png` the whole start view, `pictures/s70-colonnade-v0660.png`
  against `pictures/s70-colonnade.png` the room from the terrace at arm's length, and `pictures/s70-room-inside.png`
  the room from inside it. The CPU drawing was told: `interiorPlaster` in `src/surface-colours.js` prints
  (125,89,45) where the browser's room stands at (119,80,39).
- **Two theories about that grey, measured and refused, so nobody spends a session on either.** The sky cube
  is not lighting the room: putting `interiorPlaster.environmentIntensity` from 0.3 to 0 moved the back wall
  by one point of 255, and the room's meshes are already shut out of both fill lamps — the room is lit by its
  own four lamps and by nothing else, which is why the lamps are the only lever on it. And the glass is not
  veiling it: switch every pane off and the same wall through the opening goes *down*, (64,51,36) to
  (63,46,20), so the pane adds a little and takes nothing away. What a room behind glass needs is a wall
  worth mirroring, not a cleaner pane.
- **The water's own colour now comes off where the surface mirrors.** The pool wears an emissive film — the
  cyan of a metre and a half of water, and an honest cheat for the light this renderer gives a pit no bounce
  to — but emissive is added after every reflection and takes no notice of the eye, so it lay over the far
  two thirds of the basin as a painted lid: a flat plate that no ripple could ever move. It now carries the
  same Fresnel term the water's alpha already does (`src/water.js`, which patches the alpha), because the
  cyan of a pool is light that went *in*, and at a grazing angle almost nothing goes in. Measured on the
  start view: the water a metre off the far coping (91,181,192) L163 → (90,176,185) L158 and the whole pool
  view L106 → L104 — small numbers, and the gain is not in them but in the far half no longer being one flat
  colour. `?nofilmangle=1` puts the lid back and `?wem=` dials its strength; `pictures/s70-water-pair.png`
  is the two of them. The grid on the basin floor is still too crisp and too even at a grazing angle, and
  that is the next fault, not this one.
- All seventeen standing views were re-photographed and read. Twelve of them stand where they were to a tenth
  of a point; the five that moved moved by design (home L114 → L113, colonnade L97 → L99, frontcorner
  L97 → L98, backstore L99 → L100, pool L106 → L104). Nothing blew to white and nothing is pure black. The
  walk is the same walk: 716 meshes, 11 lights, no new key. Four source files — `src/materials.js`,
  `src/interior.js`, `src/surface-colours.js`, `src/water.js` — and `src/main.js` for the two new switches.

## 0.66.0 — 2026-10-17

- **Every lamp in the Villa was burning at half past five. They are switched off now.** The garden bulbs
  stood at emissive (1.9,1.25,0.6), the pool's two underwater lenses at (0.5,1.5,1.8) and the room's
  shades and cove strip at (1.15,0.72,0.36), each with `disableLighting` on so nothing could argue with
  them, under a sun at 24 degrees. What that bought, in the pictures this folder keeps: two cyan coins
  lying in the far end of the pool in the `pool` and `path` views, and — because a pane mirrors a sixth
  of what stands in front of it — the same two coins floating upside down in front of the sofa in the
  living room in the `colonnade` view. The fittings are ordinary lit surfaces now: a glass globe outdoors
  is the palest thing on the terrace, so it keeps its sun and its sky and loses only the burn, and an
  off pool light is a glass lens in a ring about the light of the tile it is set in. The room is the one
  place a lamp is still burning, because a room under a roof is dim while the garden is bright — and it
  is a lampshade now and not a searchlight: at the old number the cove strip came through the glass blown
  to one colour, brighter than the sunlit fascia above it, and the bloom spread the floor lamp over half
  the ceiling. `pictures/s69-pool-pair.png` is the pool before and after, and `pictures/s69-bulbs-pair.png`
  the string bulbs: flat cream discs before, glass globes with a lit top and a shaded underside after.
  The two point lights in the pool's south wall stayed where they are, and `src/pool.js` says plainly why:
  they are the pit's fill and not lamps — this renderer gives a walled basin no bounced light, and they
  are worth twelve points of luminance on the water (L146 with them, L134 without, same camera).
- **The front glass was showing two lamps that are not there.** Two hard balls about twenty-six pixels
  across, blown to (213,250,254) L242, sitting over the sofa: the library's default glare on a pane at
  roughness 0.07. `mats.glass.specularIntensity = 0` moves those two pixels to (152,96,45) and
  (142,86,41) — the table and the sofa, which is what stands there. Measured and refused on the way,
  so nobody spends a session on it: blackening every lamp's specular, taking the glass out of the sun's
  own account, the material's `environmentIntensity` at 0, 0.08 and 0.2, `scene.environmentIntensity`
  at 0, and hiding the water each left both balls at L237-L242; and smoothing the pane instead (the
  obvious move) frosts it — at `roughness` 0.3 the glass is a cream board with the room all but gone
  behind it (`pictures/s69-glass-balls.png`, `pictures/s69-glass-clean.png`, and the four panes in
  `pictures/s69-glass-rough.png`).
- All seventeen standing views were re-photographed and read: every one of them stands at the same
  luminance it did, to the point (home L114, pool L106, colonnade L99 → L97), nothing blew to white and
  nothing is pure black — which is the point of the change: no lamp in the Villa was lighting anything,
  it was only ever being seen. The walk is the same walk, 716 meshes, 11 lights, and no new key for the
  visitor. Four source files: `src/materials.js` (the three fittings and the glass), `src/pool.js` (the
  two point lights renamed to what they are, and the reason written down), `src/main.js` and
  `src/surface-colours.js` (the CPU drawing following the three fittings).

## 0.65.0 — 2026-10-17

- **The pool's far edge had teeth.** A row of turquoise ticks, one every five pixels, stood along the far
  waterline and up into the damp stone of the coping — a pixel or two tall, which is why no grid of
  measurements in this folder ever caught one. Two faces were in the same plane: the coping's damp foot and
  the pool wall's inner face both stand at z = 2.1, and over the seven centimetres where they overlap the
  depth test chose by column. The foot now stands 2 cm into the pit, the same way the waterline bands
  beside it already did. `pictures/s68-waterline-pair.png`, five times, before and after.
- **The court's joints were cut in soot and they are sand now.** The joint between the paving slabs came out
  of Chromium at (45,46,33) against the slab beside it at (170,144,106) — 0.31 of its own stone, twelve
  pixels wide near to hand, so from the south path the eye read a black grid and not a stone court. The
  joint is painted separately from the slabs now, and separately from the bump too, because a bump map reads
  height off the same luminance and one canvas would have had to choose between a pale joint and a sunken
  slab. The joint's body came up from (86,75,53) to (99,87,65) and that deck rose 1.7 of luminance; the
  darkest of the joint did not move, because a third of the black was the shade on a sunken slab's flank
  and that shade is right.
- **The jungle behind the hedge stopped being a mountain range.** The far rank's top edge was set by a
  thirty-metre wave, and fifty metres out that is thirty-three degrees of sky: broad humps with a smooth
  flank and no head in them. The edge is a wood, a stand, a clump of crowns and one crown now (40, 15, 8
  and 4 metres), its mean came down nine pixels of the frame, its from-side-to-side jitter went 27 → 30, and
  the pale far tree line shows over it, which is a depth the frame did not have.
- Said plainly: the third is the weakest, and the far edge still reads ridge-like here and there. What a band
  of flat quads cannot fake is one head ending and the next beginning.
- Measured and refused, so nobody spends a session on it: the belt's leaf atlas has no padding and 63% of it
  is black air, but `tools/atlasair.js` says the mip chain eats only 1-3 of red off the blocks that survive
  the cut-off, so a dense two-metre cluster does not need what a 17 cm shrub spray needed. It stays as it is.
- All seventeen standing views were re-photographed and read: each one moved by 0 to +1.9 of luminance,
  nothing blew to white, nothing is pure black, colour where it was. The walk is the same walk — 715 meshes,
  48 floors, 129 blockers, 81.8% of the garden reachable — and no new key for the visitor. New eyes:
  **`tools/pickat.js`**, which names the mesh, the material, the world point and the painted colour at any
  pixel of a standing view in a live browser; it is how the two coplanar faces at the waterline were caught.

## 0.64.0 — 2026-10-17

- **Fifteen of the Villa's seventeen bump maps were drawn without a mip chain, and the pool was wearing
  the cost.** A pattern minified *without* a chain is not blurred: it is read at a stride — one texel
  in every four or five — and a regular pattern answers that with a lattice of beats its own canvas
  never contained. The pool's tile bump is the case: its canvas is 256 across a 0.8 m repeat, so a
  mosaic tile is twenty-one texels, and at the start view's six metres a tile is four pixels. Every
  tile's arris was being sampled one texel in five and the pool came out a **wire frame over the
  tiles** at L76 — and no colour dial on the tile or the water could move it, which is what the last
  five sessions kept trying. With the chain on the same camera reads tiles at **L84** (the aliased
  normals were throwing seven points of light away from the sun), and the variation from block to
  block over that water falls **13.6 → 10.4** (`pictures/s67-grid-pair.png`, forty pixels of tile at
  three times). The other sixteen follow it for the same reason and each got cleaner in its own way:
  the paving's frame-to-frame grain 8.45 → 8.18, the plaster wall's 3.53 → 3.12, the terrace floor's
  8.24 → 7.86. The one exception, written down so nobody has to re-measure it: the water's own ripple
  changes by under a tenth of a point either way, because a 1.7 m repeat never lands in a five-fold
  minification the way a tile joint does.
- **The caustic net is a net and not a lattice.** The last session's eye put it plainly — the mosaic and
  the caustics are both square grids at nearly the same size — and it was worse than that: the net was
  two *ridged value-noise* fields, and value noise keeps the square lattice it was grown on, so the
  floor wore a grid of rounded squares at 7.8 cm against the mosaic's 6.7 cm tiles, both in register
  with the pool's own axes. The net is a honeycomb now (`cellNetField` in `src/textures.js`): scattered
  points, two pitches (eighteen cm and eleven), lines that wander and split and rejoin, brightest where
  three cells meet. It is bent sideways by a slow field, which keeps it seamless and stops any run of it
  lying straight against a course of tile, and its brightness rises and falls over four or five cells
  because a moving surface focuses the sun into bands and leaves bands dark. `pictures
  /s67-caustics-old.png` against `pictures/s67-caustics-net.png` is the canvas, twice tiled, before and
  after; the same camera a metre over the water comes back L139 against L134 with more light in the
  frame and less of it flat.
- The CPU drawing's caustics stand-in followed (`tools/draw.js`): cut harder so only the crests of the
  two fields survive, and ridden by the same slow brightness.
- All seventeen standing views were re-photographed and read: **each one moved by 0 or +1 of
  luminance**, nothing blew to white (worst view 0.1%), nothing is pure black, colour between 68.7%
  and 98% of the frame; the whole change lives on the water and is `pictures/s67-home-pair.png`.
  The walk is the same walk — 715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable, 1.8
  fps — and no new key for the visitor. New eyes: **`tools/causladder.json`**, which walks the two
  caustics sheets' strength against the floor seen from a metre above the water.

## 0.63.0 — 2026-10-17

- **The dark inside of a shrub was the brightest thing on it, and it was a mirror.** The leaf cards that
  stand OUT of a bush — the layer the sun actually reaches — painted (47,82,13) while the shell of
  cut-out leaf BEHIND them, which is meant to be the shade between the leaves, painted (70,114,20). Five
  sessions had argued about the two materials' pigments and none of it moved: forcing every card's normal
  square at the sun bought six points of light, the scene's shadows bought none, and the two materials
  already wore the same lift. It was `specularIntensity` 0.25 on a smooth lump — the sky's mirror, spread
  as a broad sun-glint over the whole camera-facing side of the ball. A real bush is a thousand waxy
  leaves at a thousand angles and the mean of that is a soft green, which was the argument the cards
  already had and was always as true of the shell. With the mirror off those two materials the shell fell
  to (42,84,11) and the cards, paid back for a glare they never had, came up to (51,95,15): the sunward
  leaf is now the brightest thing on the plant, which is what the eye reads first.
- **An atlas's air keeps its colour now, which is what padding always meant and never did.** A mip level is
  a block average, so the leaf is averaged with the air about it and the air of a canvas is black;
  `padAtlas` was written to paint the leaf's colour into it, and it did — and the canvas threw every drop
  away again, because a canvas stores its pixels multiplied by their alpha and keeps no colour at all in a
  pixel whose alpha is nought. `tools/atlasair.js` is the new probe that says so flatly: after padding, the
  shrub's atlas had leaf pixels at (91,121,59) and air still at (4,5,2). Air now carries a quarter of a
  leaf's alpha, which the material's cut-off still throws away at full size, and the colour survives into
  the mip chain. The clumps of standing grass gained three points of green, which is all they had left to
  gain; the shrub's cards had been the victim, at 53% air.
- **A shrub is not a dome.** One lump two thirds as high as it is wide, with three lesser ones standing on
  the lawn around its foot, made every shrub in the garden a mushroom — a clean arc with three small arcs
  beside it. The middle lump stands up a little, there are four lumps, and the three lesser ones are
  gathered on one side of the plant and ridden a hand up its flank, so the outline goes up on that side and
  away down on the other. The cards are kicked a quarter-turn off straight-up, because at the crown of a
  lump a card told to stand at the sky was laid flat on it and a flat sheet a hand across is a plate; and
  the skirt of leaf stops a hand above the ground instead of lying out over the lawn.
- New eyes: **`tools/atlasair.js`** (what an atlas's air is filled with, and what a mip level leaves
  standing), and `tools/bushface.json` rewritten as the ladder that settled the mirror — layer by layer,
  with the shadows switched off as a control.
- All seventeen standing views were re-photographed and read: **each one moved by 0 or +1 of luminance**,
  nothing blew to white, nothing is pure black; the bushes fill a corner of six of those frames and the
  change itself is at arm's length, in `pictures/s65-bush-before.png` against `pictures/s65-bush-final.png`.
  The walk is the same walk — 715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable, no
  stumbles — the CPU drawing was re-fitted to the browser's three new bush numbers, and no new key for the
  visitor.

## 0.62.1 — 2026-10-17

- **The bud hangs beyond its own leaves now.** The first leg of the rachis was a short one leaning forty
  degrees off straight down, so the bud hung down the axis of the stem and behind its own crown: in every
  view of a banana plant it was a maroon smudge you could not place. That leg is forty-eight degrees out and
  a hand and a half long before the second leg gives at all, which carries the bud a hand beyond the stem
  and clear below the leaf roots. Two maroon flecks of it now show in the standing `grass` frame where
  before there was none; the bud itself reads (52,16,21) to (77,10,23) at a metre and a half.
- The eyes asked for it: `tools/bushface.json`, one pixel of a shrub at a time with a layer switched off at
  a time, which is how the shell-against-cards fault was measured for the next session and is written up in
  the notes; and `tools/pair.js`, which lays two pictures of one camera side by side as one picture — the
  notes of earlier sessions kept promising a "pair" that no tool had ever written.

## 0.62.0 — 2026-10-17

- **The bananas were three palm saplings with a pink flower stuck in each; they are bananas now.** The
  pseudostem wore a net of little chevrons — two noise washes over its sheaf bands, at cells of 3 cm and of
  1 cm on a 20 cm stem, aliasing at four metres into bark, over an olive base that came back (93,105,19):
  a green twelve points over its own red, which is dry grass. `stalkCanvas` is now painted with every mark
  running the length of the stem — sheafs 3-6 cm wide, each weathered in tall narrow patches, a pale waxy
  lip and a dark seam at the lap, seven fibre lines a sheaf, and one slow mottle whose cells are a hand
  across and nothing smaller anywhere. The base went cool and the lit stem comes back **(110,154,58)**
  against the palm bark's (138,109,67). The one thing that crosses the sheafs is a **leaf-scar**, a ridge
  every twelve or fifteen centimetres, sloping a little because the sheafs spiral.
- **The flower was a pink party hat and is a maroon bract now.** A plain truncated cone on a short pin,
  coloured with bytes read as raw light — [78,32,32] is 0.31 of red, near four times what those bytes make
  inside a pattern — so it came out salmon, (200,120,110) where the sun caught it. It goes through `paint`
  now, at **[86,34,46]**, matte, with a hair of its own emissive so a bud in its crown's shade is a dark
  purple and not a hole, and the rachis leans out over the margin of the leaves before it gives and hangs.
  The bud is a hand long and two spans across in **five shingled courses**, each a tenth fatter than the
  one above it ends: that step is what says BRACT rather than CONE. Measured in place at 3.2 m: (52,16,21).
- **The blades were straps and the crown was a palm.** Half a blade was 30-39 cm on a 1.55-2.0 m leaf and
  the wind had cut a third of an old leaf's stretches to ribbons. A banana's blade is a paddle: half is
  40-52 cm, the blade is laid in five bands instead of four, and every wound is now a tear that comes in
  from the margin along the veins and stops short of the rib — the cut clean through to the rib made holes,
  not tears.
- New eyes: `tools/bananaprobe.json` (the bud and the stem, with the leaves switched off, which is the only
  way to measure either) and three close cameras — `banana`, `bud`, `stem` — in `tools/propcams.txt`.
- All seventeen standing views were re-photographed and read: **each one moved by 0 or −1 of luminance**,
  nothing blew to white, nothing is pure black. That is the honest size of a change to a plant that fills a
  corner of one of those frames; the change itself is in `pictures/s64-grass-pair.png`. The walk is the same
  walk — 715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable, no stumbles — and no new key
  for the visitor.

## 0.61.0 — 2026-10-17

- **A shrub was a crowd of green compasses; it is a mass of leaf now.** Photographed at 2.5 m, the clipped
  bushes were a bright lime ball bristling with flat paddles, punched with near-black holes, and covered
  with small five-pointed stars (`pictures/s63-urchin.png`). Four faults were in it, all of them in the
  painters. A spray's thirty leaves had been laid at even angles about the middle of their atlas cell,
  each pointing out from that middle — an asterisk — and the four "twigs" drawn from the cell's centre to
  its rim were a second star on top; the atlas had been 4×4 and a card could only be turned one of eight
  ways, so the same star came back in a rank across the front of every bush. The ring is gone: the leaf is
  grouped into **buds** of three to five on a short stem, the buds are thrown anywhere and lean any way,
  the twigs are out, the atlas is **6×6 on a 768 canvas** (thirty-six sprays, same texels to the metre) and
  every card is rolled about its own leaf-stem by any angle. `pictures/s63-atlas-stars.png` is the atlas
  before and `pictures/s63-atlas-thatch.png` after.
- **The holes were closed.** The card's atlas measured **59.7% air** and the shell of cut-out leaf behind it
  was only about a third leaf, so a card was mostly hole over a mostly-hole shell over a near-black heart —
  three darks in a row, and a browser wrote (18,30,1) where a leaf should have been. The spray's mass is
  bigger and wears the middle leaf tone instead of the darkest, and the shell now lays 5.8-10%-of-tile leaf
  at 430 sprigs instead of 4.5% at 380: about nine parts leaf in ten, so the dark between the leaves is a
  line and not a puddle.
- **The bush stopped shouting.** Its lit leaf tops were running to **(128,215,40)** against the boundary
  hedge's (88,137,22) and the lawn underneath at (164,192,54) — a green floodlight on the lawn. The cards'
  leaf-light came down from (0.09,0.27,0.048) to **(0.1,0.2,0.075)** — the green paid for the blue, because
  a green with no blue in its shade is soot — the atlas's leaf tones came down a tenth, and the cards' own
  tone spread was narrowed. The lit tops are now (111,175,45). And the whole bush was lime where the garden
  is olive: red went up and green down in both the shell and the atlas, from a painted red-over-green of
  0.54 to about 0.76, which is what a privet leaf is.
- **New eyes**: `tools/bushlayers.json` hides one layer of a bush at a time (heart, shell or cards) and is
  how the shell was found to be painting *brighter* than the cards standing outside it — the open fault
  written up in `NOTES.md`; `tools/bushlift.json` is a ladder for lifting the cards. `src/surface-colours.js`
  came down with the atlas by the same fraction, so the CPU drawing keeps the same measured gap over the
  browser on this camera.
- All seventeen standing views were re-photographed and read: **each one moved by 0 or −1 of luminance**,
  nothing blew to white, nothing is pure black, "in colour" moved by a tenth of a point. The walk is the
  same walk — 715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable from the start, no
  stumbles — and no new key for the visitor.

## 0.60.0 — 2026-10-17

- **The Villa now has three woods instead of one.** Every timber in the place used to come back the same
  saturated orange — floor, posts, wall boards, chairs, the sala's table — and the posts wore their boards
  sideways, so a square column looked like a stack of rings. There is a **deck** wood now (a pale weathered
  tan: the sunlit terrace floor went from (180,100,36) to (202,153,73)), a **structure** wood for posts, wall
  boards, soffit, beams and the door (a dark brown: the front post went from (219,116,44) to (180,116,64)),
  and a **furniture** timber for chairs, loungers, benches, railings and the sala's table (a golden middle).
  Upright timber is painted standing up, so the boards on a post run from its foot to its capital. Measured on
  identical cameras in both builds with `tools/woodprobe.json`; the water and the shaded plaster, measured in
  the same run, did not move, so it was the wood that changed and not the light.
- **The sala's floor is now warmer than the terrace's, which is what an oiled floor and a weathered one do.**
  It reads (221,127,54) in the sun against the terrace's (202,153,73). Two traps were found on the way and are
  written up in `NOTES.md`: a wood with its blue as high as its green comes back *salmon* in this sun, and a
  neutral board comes back *olive* in this shade, because the sky's fill is green over red.
- All seventeen standing views were re-photographed and read: mean light within 2 of the last release
  everywhere, nothing blown to white, nothing pure black. The one honest cost: the frame's "in colour" share
  fell by up to 4 points on the two timber-heavy views, because a wood that is not a saturated orange carries
  less spread inside a single pixel — the gap *between* the woods, which is what the eye was complaining of,
  got wider.

## 0.59.1 — 2026-10-17

- **Comments only, and this release exists so the newest one is the whole truth.** Two comments in v0.59.0's
  own `src/textures.js` described the new spray by numbers that the code does not carry — a spray "about
  three quarters of half a cell", where `reach` plus a leaf comes to about half the cell — and said the same
  thing about a potato twice within eight lines. Released folders are not edited, so v0.59.1's `src` is the
  working tree byte for byte and nothing else moved: `diff -r releases/v0.59.0/src src` names those two
  comments and nothing else, and the two `preview.png` files agree to a tenth of a channel — mean gap 0.0 of
  255 over the whole frame, and two cells of sixty a channel apart. (Its own released note says "no pixel
  differs", which is a shade stronger than what was measured: film grain moves every pixel a point or two
  between loads, and released folders are not edited. The working file says what the tool printed.)

## 0.59.0 — 2026-10-17

- **A shrub was a dark green dumpling wearing ten paddles; it is a bush now.** 🌿 Photographed two metres
  off (`pictures/s61-shrub-v0581.png` against `pictures/s61-shrub-after.png`, and the two great pots at
  `pictures/s61-pot-v0581.png` against `pictures/s61-pot-after.png`), a shrub came out **(57,90,17) L78**
  on a lawn at L111 and the potted one **(53,65,10) L58** — thirty-three and fifty-three points of light
  under the grass it stands in, with its green standing only twelve to thirty-three over its own red,
  which is olive and not a leaf. Two faults, and the browser saw both.
- **The leaf was the wrong size and the wrong number.** One card of the atlas was 17 cm of bush holding ten
  leaves of 4-7 cm — a stencil of ten paddles (`pictures/s61-spray-before.png`), laid tangentially on a
  ball so the bush shingled like a roof. A card is 15 cm now and its spray is about thirty leaves of 2.4-4.4
  cm over a mass half the cell across and speckled, not a flat daub of the darkest green (`pictures/s61-spray-small.png`);
  the cards stand further out of the skin (four fifths of the skin's own facing, where it was a
  third-and-a-bit), and a small pot bush's cards shrink with its size, because a 15 cm spray on a 62 cm
  bush is a palm on a coffee cup.
- **And the payment for a leaf was paid in the wrong channel.** The three bush materials went from one
  number to three — 1.7 → (2.38, 3.32, 2.3) — because a shrub's shaded faces are lit by the ground's
  bounce, which here is terracotta and teak, and paying every channel alike bought olive. The green of the
  emissive went up with it and the red did not. The same two cameras now answer **(68,125,21) L105** and
  **(69,100,15) L87**, the green fifty-seven and thirty-one over the red, and still under the grass.
- **Nothing else moved.** All seventeen standing views measured against v0.58.1: luminance up nought to
  three points, nothing pure black, nothing blown, colour within a tenth of a point — and the near-black
  share fell where the shrubs are big (the `grass` camera 3.6% → 1.5%, `westlawn` 1.8% → 0.2%). The walk
  is the same walk (715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable), the frame rate is
  1.9 fps against v0.58.1's 1.9 in a same-run comparison, and the Villa costs 699,778 triangles against
  679,640 — the whole +3% is the pot bushes' smaller, denser cards. The CPU drawing's three bush lines
  were re-fitted to the same browser pictures, and take the hue and not the lightness: `shade()` has no
  self-shadowing, so a bush given the material's whole lift came out forty-eight points above its own lawn
  where the browser puts it six below.

## 0.58.1 — 2026-10-17

- **The strays in the mown lawn came down to size.** The same fault as v0.58.0, one notch further: the
  clumps scattered over the sward were `size: 0.26-0.28`, which at the big end stands a quarter of a metre
  over a lawn that is cut to six — a specimen plant, and a field of them read as a field of little green
  arrowheads from the south border. They are `size: 0.2` now, and the "young" age in `tuftShapes` holds its
  blades tighter and more upright (spread 0.28, splay 0.5, against 0.34 and 0.7), because a young crown that
  has not split yet is a spike and not a fan. On the `grass` camera the clumps come out (84,117,24) L103
  over a lawn at (103,130,38) L118, fifteen points of light under the grass they grow out of; the long
  grass along the stone is unchanged, since it is an older age of plant.
- **Nothing else moved at all**: all seventeen standing views measured against v0.58.0 came out at the same
  luminance, the same colour and the same black and white; the walk is 715 meshes, 48 floors, 129 blockers
  and 81.8% of the garden reachable, and all 3,829 clump sheets are still on ground.

## 0.58.0 — 2026-10-17

- **The grass that stands up out of the lawn was a row of little green crowns; it is grass now.** 🌾➡️🌿
  Photographed four metres off along the pool paving (`pictures/s60-verge-4m-before-crop.png` against
  `pictures/s60-verge-4m-crop.png`), every clump was a spiky rosette with a saw-tooth top standing on the
  sward, and the scattered ones on the mown lawn read as green arrowheads from the west lawn
  (`pictures/s60-westlawn-pair.png`). Three things made the shape and all three were changed.
- **Four crossed sheets and not three.** A clump was three cards star-crossed, which is six arms — and
  from a raised eye the mown lawn showed every one of them, a field of asterisks. Now four, five on an
  old wide crown: `grassTufts` went from 3,038 sheets to 3,829 and 7,658 triangles, 1.1% of the Villa's
  679,640, and the frame rate is where it always is in software WebGL (1.8 fps) with boot cost inside its
  own noise.
- **Narrow blades, less splay, and a clump that is not a cabbage head.** A blade is 0.9–2.8 px of the 256
  px square and not 1.5–4.2, there are 430 of them and not 300, the outer leaves are thrown out at 0.27
  and not 0.36, and a clump stands narrower and shorter than it did (0.72/0.56 of its spot and not
  0.78/0.62), because a clump 0.8 m across is a shrub. The soot wash at the foot came off from 0.45 to
  0.30, and each clump now wears the tone of its ground at 0.95–1.21 and not 0.86–1.16.
- **What it is worth on the screen**, on the `grass` camera where the clumps are 1.7% of the frame: they
  came out **mean (77,107,21) L94** over a lawn at (103,130,38) L118 — twenty-four points of light under
  the grass they grow out of, which is a plant in a pot — and now come out **(80,112,22) L99** as a
  crowded, lower, denser clump. The CPU drawing was re-fitted to the same camera and now puts it at
  (82,123,30); `tools/sheets.js` says its own light still costs the same in both renderers.
- **Nothing else moved.** All seventeen standing views measured before and after: luminance within one
  point, nothing pure black, nothing blown, colour within a tenth of a point. The walk is the same walk —
  715 meshes, 48 floors, 129 blockers, 81.8% of the garden reachable from the start — and all 3,829
  clump sheets are on ground: none on cut stone, none in the water.

## 0.57.0 — 2026-10-17

- **The ridge was a plank; it is a roll of tiles now.** 🟥➡️🏠 Photographed 14 m off (`pictures/tmp-ridge-before.png`,
  `pictures/s59-ridge-crop.png`), the thing along the top of the roof read **(247,115,85) L141** while the tiles
  at its foot read **(85,35,16) L44**. The brightest thing on the house was not the roof: it was a salmon board
  standing on the roof, with a black line of its own shadow under it, which is why the sala's ridge looked like a
  slab floating a hand above the tiles.
- **Why it blew out, and it was not the light.** The cap was a `box` 0.42 m deep, and a box's faces are inked 0…1,
  so 11.2 m of the tile canvas was smeared across those 0.42 m: every row of tiles and every dark line between
  two rows was flattened into one stripe of the canvas's average colour. The slope next to it still showed its
  rows, so the slope stayed dark and the cap stayed pale.
- **It is a crest now: `hipRoof` again, at a steep pitch.** Four shallow faces at about 46 degrees and a ridge of
  its own — 0.72 m across, standing 0.12 m proud of the roof, which is the shape a row of curved pan tiles makes.
  One face catches the south sun, the other falls away dark, and there is no flat top drinking the whole sky. The
  same on the sala, at 0.6 m. Measured at the same camera: the crest band comes out **(132…196, 52…69) L67–93**,
  which is inside the roof's own range and not above it, and `tools/cover.js` now names `ridgeCap` as the first
  thing behind the roof material, with the roof running darkest (65,27,8) to brightest (245,189,140) over its 147
  sample points.
- **Tiles the same size on the crest as on the slope.** `groundUVs` lays the crest from where it stands in the
  world — 17.6 m to the pattern's repeat along the house, 11.2 m across it — so a tile is 0.28 m across on the
  crest as it is on the slope, and the two surfaces run into one another at the ridge instead of quarrelling.
  `scaleUVs` has nothing left to do in `src/villa.js` and is off its import list.
- **Nothing hangs in the air any more.** The plank was 7.5 m on a ridge 7.0 m long, so it hung 0.25 m past the end
  at both ends. The crest is the length of the ridge and its ends are hips that land on the roof's own hips.
- **The standing set says the change is local.** All seventeen views measured before and after: nothing pure black,
  nothing pure white, nothing at the ceiling; only the three views that can see a roof moved at all, and by two
  points of a channel at most (`colonnade` (122,91,61) → (120,91,60)). Standing set for the next session:
  **`2320-home` … `2336-backstore`**, with the before-and-after pairs `2300-home` against `2320-home` and
  `2312-salaroof` against `2332-salaroof`.

## 0.56.0 — 2026-10-17

- **A palm trunk was a stack of brown coins; it is bark now.** 🌴🟤➡️🩶 Photographed three metres and a half
  off, the bark the browser painted came out mean (80,58,22) L60 — and a face of the trunk turned away from
  the sun sat at L31, the lightness of the shaded hedge behind it, so every palm left a dark pole in front
  of the garden. `pictures/s58-trunk-pair.png` is one trunk both ways.
- **Grey, and light enough to see.** The bark is repainted on a grey-tan base of (150,136,114) with a broad
  weather sixty points wide, because a coconut trunk is a grey thing, sun-bleached. The same camera now
  reads **mean (129,107,71) L109**, forty-nine points of light back, with the brightest bark still short of
  blown out.
- **Leaf scars and not corrugation.** The old rings stood a centimetre and a half apart, where a coconut
  palm's leaf bases are five to ten: far too fine to reach the screen at all (the old square kept 5 points
  of its spread after a 16-pixel block average; the new one keeps 7). The scars are 4.5–14 cm apart now,
  each a thin bowed ridge with a pale lip and a soft shade under it, and between them the bark is smooth,
  which is what a trunk is mostly made of. A moss crust, three faint weathering streaks and a scatter of
  fibre dashes finish it.
- **The relief was costing six points of light**, so the bump came from 0.8 to 0.45 — measured with
  `tools/tint.js` on that same trunk: L105, L110, and L111 with the bump off. The scars are still ridges;
  the glitter is gone.
- **The trunk is nine segments and not six**, which is nothing to do with colour: six left a knuckle in the
  silhouette at every joint, invisible under dark bark and plain once the bark went pale. Same thickness at
  the top, 4,680 triangles instead of ~3,100 (0.7% of the Villa), and the same walk.
- **`tools/tint.js` takes `--url` now**, so a change can be measured against the released Villa and not
  against the working tree's own say-so. Every number above came from that comparison.

## 0.55.1 — 2026-10-17

- **Nothing to see, and the proof is the tile's own bytes.** Three comments in v0.55.0's own
  `src/textures.js` pointed at working pictures named `tmp-s57-*`, which are deleted at the end of a
  session like the scratch crops they are — and a note that points at a deleted picture is a note that
  cannot be checked. They now name the kept pictures instead: `pictures/s57-clump-maize.png` and
  `pictures/s57-verge-maize.png`. Released folders are not edited, so the correction is published here.
- **No pixel moved.** `node tools/canvassave.js tuftCanvas 256 x.png --tile 1` paints a clump whose md5
  is `0e783ead7578cff454c48ba9ff63c0ca` from v0.55.0's `src` and the same bytes from this one.

## 0.55.0 — 2026-10-17

- **A clump was a little maize plant and a cabbage; it is grass now.** 🌽🥬➡️🌿 Six sessions of these
  notes had the same three words for it. Photographed at three metres the clump was a dozen strap
  leaves standing straight up out of one point, each a quarter of the clump across, each with a pale
  stripe down its own middle, and you could see the paving straight through between them
  (`pictures/s57-clump-maize.png`, `pictures/s57-tile-maize.png`).
- **The tile is painted again: eight hundred narrow blades, and a SHAPE.** A leaf's height is now asked
  for the one thing that decides it — how far its own foot stands off the crown's middle — so the leaves
  at the edge are short and thrown out and the leaves in the middle are tall and nearly up: a fountain,
  not a sheaf of cut corn. The blades are a hundredth of the tile across (4 mm at a 40 cm clump)
  instead of a thirtieth, the square is 56.5% air where it was 72.4%, and what shows through the gaps
  is the shade inside the clump instead of the scene behind it. No pale midrib any more — the sun gets
  a leaf's TOP third, which is where the sun actually gets it. `pictures/s57-tile-grass.png` is the
  square itself and `pictures/s57-clump-grass.png` is one clump at the same distance as the maize one.
- **An outline that wanders, or the cabbage goes.** The first fix was dense and dome-shaped and it read,
  at six metres, as nine hundred little brussels-sprout plants (`pictures/s57-verge-cabbage.png`). Two
  waves across each crown, at random phase and random size, put a plume where a shoulder of leaves all
  grew tall and a hollow where they did not; one leaf in nine is a stray that stands a hand over its
  neighbours. The light was spent the other way too — a whisper on the tips and nothing else is a flat
  dark shape, so the top of a clump now catches the sun the way it does in a photograph.
- **One skin of four clumps, and a clump wears one.** Every clump in the Villa used to be inked with the
  same square, so every clump had the same silhouette with the same raggedness in the same place. The
  skin is four separate clumps of four ages — young, middle, old, straggly — at four seeds
  (`tuftAtlas`), and a clump is inked with the one that matches its own age, with a jitter. Same trick
  as the jungle belt and the shrub's leaf cards. `pictures/s57-atlas-four.png` is the skin.
- **The verge comes in drifts and not in a row.** Along the cut stone the clumps are laid as drifts now:
  a crown here and two, three, four more crowded in beside it, then a bare place where the mower went
  close. The long grass is denser and the grass scattered through the mown sward is smaller on purpose
  (a clump the size of a cabbage head in the middle of a mown lawn is a planted specimen): 3,038 sheets,
  6,076 triangles, 0.9% of the Villa. `pictures/s57-verge-maize.png` against
  `pictures/s57-verge-grass.png` is the west fringe before and after.
- **The clump's light is its own again.** `mats.tuft` carried (0.26,0.44,0.16) of emissive, worth
  (4,13,1) of the browser's colour: measured on the `grass` camera, 89,119,26 with the lamp and
  85,106,25 without it, over a lawn at 102,129,38. A lamp inside a plant cannot be in shade, so the lamp
  came down to (0.21,0.36,0.13) and the tile's own ramp was lifted to pay for it — now two thirds of a
  clump's light is paint that answers in shade and in sun alike. A clump sits ten points of light under
  the sward it grows out of, which is a self-shaded mass and not a hole in the picture.
- **Nothing else moved, and the numbers say so.** All seventeen standing views re-photographed
  (**2187-2203** against **2170-2186**): no frame moved more than **0.5 of a point** of mean luminance,
  colour held to 0.2 of a point, nothing black anywhere, nothing blown. The CPU drawing follows the new
  tile: `tools/sheets.js` measures the material's added light and the drawing's glow at the same
  (0.026,0.122,0.006), and on the `grass` camera the drawing paints a clump at 92,123,30 against
  Chromium's 89,119,26. Boot 5.3 s to the Villa standing and 5.5 s to the first frame, against the last
  release's 5.5 and 5.8; 2.0 fps, unchanged; the walk is the same walk — 715 meshes, 48 floors, 129
  blockers, 81.8% of the garden reachable — and `tools/tuftfoot.js` says no clump anywhere is standing
  on cut stone or in the pool.

## 0.54.1 — 2026-10-17

- **Nothing to see, and the proof is the tile's own bytes.** After v0.54.0 was published the tangent
  inside `leaf()` in `src/textures.js` was rewritten out of one unreadable line into four plain ones, and
  a comment that claimed "one leaf in thirteen has died and is straw" was corrected to fifteen — the
  numbers in the code make one in about fifteen. Released files are not edited, so the correction is
  published here instead.
- **No pixel moved.** `node tools/canvassave.js tuftCanvas 256 x.png --tile 1` paints a tile whose md5
  is `32de3b19c628141d655e96ad37483f86` before the tidy and the same bytes after it.

## 0.54.0 — 2026-10-17

- **A tuft was a little maize plant, and it is grass now.** 🌽➡️🌿 Six sessions of these notes have the
  same phrase for it, and the browser pictures say it plainly: at two metres a clump of grass was a
  handful of sweetcorn seedlings you could see straight through.
- **The tile is painted again.** Thirty-four stroked spikes on a black foot became three hundred
  filled leaves — a walked spine tapering to a point, so each is a blade with edges and not a line of
  ink — gathered on one crown in the middle of the square and thrown wide at the tips, the long ones
  arcing over until their points hang below their own peak. Light is spent the way it spends itself on
  a clump: dark low down where the leaves shut one another out of the sun, brighter up the leaf, each
  blade carrying its own folded lit side. The foot is a wash of the lawn's darkest green over the
  bottom fifth, and not thirty near-black stubs. Tile: `pictures/s56-tile-before.png` and
  `pictures/s56-tile-after.png`; a clump at a visitor's feet: `pictures/s56-clump-4x.png`.
- **A clump is the colour of the sward it stands in.** Measured on the `grass` camera, clump against the
  lawn it grows out of: **78,107,22 against 101,129,38** as it was — twenty-four points of light
  poorer and no greener, a shadow with leaves in it — and **87,118,28 against 102,130,38** now: twelve
  points poorer, which is right, a clump self-shades, with its green standing thirty-one over its own
  red against the sward's twenty-eight. The ramp is the lawn's own, moved twenty-one points greener and
  eight less blue, because a vertical mass of leaves sees less sky and none of the ground's bounce; and
  every clump now wears `lawnTone(x, z)`, the very field the lawn's corners carry, so a dry place of the
  garden grows dry grass.
- **The lamp inside the clump was half of its green, and is halved.** `mats.tuft` wore
  (0.5, 0.85, 0.3) of emissive: switching it clean out cost fifteen points of the browser's green and
  four of its red, which is why every attempt to colour a clump by painting its tile was being overruled
  and why a clump in the terrace's shade was as bright as one in the sun. It stands at (0.26, 0.44,
  0.16), and `tools/sheets.js` keeps the CPU drawing and the material at the same number.
- **Every clump has an age now.** A young crown is narrow, upright and three sheets; an old one is low,
  wide, splayed and four. The long grass along the stone is laid at old ages and the grass the mower
  went over, young — so the verge is not the same plant sixty times over.
- **Nothing else in the Villa moved.** All seventeen standing views re-photographed (2170-2186 against
  2114-2130): luminance within three points everywhere and only in the views with the most clumps in
  them (`southborder` +3, `salaroof` +3, `westlawn` +2), colour within six tenths of a point, nothing
  blown out and nothing blackened anywhere. 5.3 s to standing and 5.6 s to the first frame, 1.8 fps in
  software WebGL — where v0.53.0 stood — and the same walk: 81.8% of the garden reachable from the
  start, no clump standing on cut stone, and `tools/standup.js`, `shadows.js`, `sheets.js` and
  `planted.js` all clean.

## 0.53.0 — 2026-10-17

- **The lawn is a sward now, and not a sheet of green paint.** Three things, all of them seen in the
  browser and none of them guessed at. 🌿
- **A crowd of separate blades in the tile.** `swardCrowd` in `src/textures.js` walks about a hundred and
  seventy thousand leaves into the grass canvas by hand — one pixel of ink at a time, because the same
  crowd drawn with strokes took the boot past a second. They grow in **crowns** of a dozen out of one
  root, so light and dark arrive in handfuls at 3-20 cm and not as salt; each leaf lays its own shadow a
  hair right and below itself, which is what makes the sward read as depth and is also the height the bump
  map is read from. Every blade's tone is read back out of the pixels already under it, so the crowd is a
  shape change and not a colour one: the mown bands and the dry patches still show through it. Two
  attempts came before this and both are photographed: `pictures/s54-tile-grass.png` (smooth field,
  sprinkled with dark V's) and `pictures/s54-tile-crowd.png` (a sheet of green scribbles). A blade that
  is not the tone of the ground it stands on is a mark and not a plant.
- **The mower's stripes, eight metres across.** They used to live inside the six-metre tile, where every
  tile carries as much lit stripe as shaded stripe and fifteen metres off the engine averages the tile to
  one texel and the stripes are simply gone: a pattern cannot answer a pattern. `mowStripes` in
  `src/lawn.js` now lays them in the ground itself — eight metres apart measured east, wandering sideways
  on a slow field, the lit band warm and the shaded band cool — and they survive: straight down from twenty
  metres the sward is measurably inverted half a period away at 168 px, which is eight metres at this
  camera, and a scanline across clean lawn runs L77 to L120 from one band to the next.
- **No more mint.** Ten metres out on the south border camera the sward was painting **(117,194,79)**:
  a green seventy-seven points above its own red, and the brightest thing in the frame under the sky.
  The obvious cure was refused twice after it was measured — taking the lawn's `sheen` (the sky's mirror
  off the grass, `tools/lawnmint2.json`, `lawnmint3.json`) costs ten times the light it saves in colour,
  and the mirror is not where the acid lives: switch it off clean and the same place falls to (44,119,38),
  where the green stands seventy-five over the red. So the grass's own bytes moved: red up a quarter,
  green down an eighth, and the whole sward eighteen points of light poorer (`tools/lawnlight.json`),
  because a bright pale green reads as neon whatever its hue is. That place is **(119,160,70)** — the
  clumps took the same shift so a tuft cannot out-green the lawn it grows in.
- **What the pictures say.** All seventeen standing views re-photographed: the lawn-heavy ones came down
  4 to 9 points of luminance (`grass` L95→L86, `eastlawn` and `rearcorner` −8, `southborder` −5) and
  nothing else in the Villa moved more than two; nothing blew out anywhere, and the only cells that now
  disagree on warm or cool are lawn. At the feet the sward reads as a crowd of leaves (`pictures/2128-grass.png`),
  across the garden it arrives in bands, and the crowd costs the boot nothing that could be felt: 5.5 s to
  the Villa standing and 5.8 s to the first frame, which is where the last release stood.
- **The CPU drawing follows, partly.** `lawn` and `tuft` in `surface-colours.js` were re-hued after the
  browser; the drawn sward still runs a fifth greener than the browser's, because its pattern layers come
  from the tile's bytes, which did not move. Noted in `NOTES.md` as the drawing's own fault to close.
- **Still open**: a tuft is a little maize plant at five metres and not grass; the sward ten to fifteen
  metres off is still paler than the sward at two; a blade is four flat bands and not a curving sheet;
  the palms' crown heart is a bare knuckle; a shrub's cards thatch at arm's length; the court's paving is
  a big plain grid; the hedge's foot is a ruled line where it meets the lawn.

## 0.52.1 — 2026-10-17

- **Nothing to see, and that is the point.** Two comments in v0.52.0's own copy of the garden still
  described the three-band blade and a vein spacing nobody had measured; released folders are not edited, so
  the corrections are published here instead. `diff -r releases/v0.52.0/src src` names those two comments
  and nothing else, and this copy's `src` is the working tree byte for byte.

## 0.52.0 — 2026-10-17

- **A banana was a handful of flat green plates and it is a plant now.** 🍌➡️🌿 Four hinged cards per leaf,
every card flat, and the torn edge a real leaf has belonging to the paint: at six metres a clump read as a
palm of green paddles (`pictures/s53-banana-before.png`). A banana leaf is built out of mesh now.
`bananaCrown` in `src/garden.js` marches a pale **rib** along an arc — up out of the crown, hanging below
the horizontal before it is two metres out — and lays the **blade** out level across it in four bands, each
sagging as it goes and, on a young leaf, curling *up* instead, because a spear leaf is a rolled tube. The
blade is bare for the first stretch: every leaf stands on a stalk of its own.
- **The tears are geometry, which is the only way a torn edge can be one.** Each stretch between two
stations keeps a share of its own width: usually whole, sometimes a bite out of the margin, and now and
then a slit the whole way in to the rib, where every band of that stretch simply is not there and only the
rib goes on. Old leaves are cut far oftener than young ones, which is what a banana does. The margin wanders
at every station on top of that, so nothing about a leaf is a ruled line. **23,208 triangles where the cards
were about a thousand**, and no measurable cost: **1.8 fps against the released Villa's 1.8** in one run
beside the other, and 5.8 s to the first frame.
- **`bananaBladeCanvas` paints the inside of a blade and nothing else** — a pale rib at the middle, a
hundred and seventy veins running out to the two margins two centimetres apart on a leaf a metre and a half
long, dry along the tip, maroon where a margin is aging, and a few blotches, because no outdoor leaf is one
colour. `mats.bananaLeaf` therefore has **no alpha and no cut at all**: the ragged silhouette a visitor sees
against the sky is the outline of the leaf. `mats.leaf` is gone, `leafCanvas` with it, and the oval shape
test that used to cut a card into a leaf is gone too — `tools/draw.js` now throws on a cut name it does not
know rather than quietly drawing a board.
- **Two things that were lying, and a third that was the colour of its own stalk.** A banana's flower wore
the flower-pots' clay and was folded into the stems' mesh, and `mergeParts` gives one mesh one material:
every bud in the garden came out the colour of the trunk it hung from. It has its own material (`mats.bud`,
a dried-chilli maroon) and its own mesh, and it hangs below the crown and not inside it. And the
pseudostem canvas read (65,71,13) in a browser — the yellow of a dry wheat field, which is why every clump
looked like three palm saplings — so it is sage green now with a maroon flush where a sheaf is fresh.
- **What the pictures say.** Two metres off, a crown fills **46.5%** of the frame at **(52,108,26)**, its
lightest leaf (94,198,55) and its darkest (16,36,7): a deep green mass with pale ribs and a ragged edge,
and a maroon bud (79,42,43) where the tan pod used to be. **All seventeen standing views within three points
of luminance**, nothing blown anywhere, colour share unchanged. `tools/tris.js` is new — it counts what the
Villa is made of, plant part by plant part — and it says what this cost and where the real weight lies:
bananas 3.4% of the Villa's triangles, the palms' crowns 6.8%, and the shrubs' leaf cards **58.5%**.
- **Still open**: a blade is four flat bands and not a curving sheet at arm's length; the palms' crown heart
is still a bare knuckle; a shrub's cards thatch at arm's length; the court's paving is a big plain grid;
the hedge's foot is still a ruled line where it meets the lawn.

## 0.51.0 — 2026-10-17

- **The palms were flat fans and they are trees now.** 🌴🃏➡️🌿 A coconut palm used to be eleven flat cards
  stuck into one point like a pinwheel, each card one plane wearing a *picture* of a feather — no droop, no
  twist, no separate leaflets (`pictures/s52-palm-before2.png`). A palm's leaf is built now: `palmCrown` in
  `src/garden.js` lays **thirteen fronds** round the bud at the golden angle and marches each one along an arc
  — up out of the crown, over the top, hanging below the horizontal at the tip — with a roll about its own
  length, and stands **two leaflet cards at every station** along it, swept forward, lifted into the V a
  leaflet is folded in and drooping as they go. One number, `age`, runs from the pale upright young leaves in
  the heart to the long dark ones that skirt the trunk. **51,152 triangles where the printed cards had 924**,
  and the eight palms on the horizon take a third of it, because seventy metres out a leaflet is two pixels
  wide.
- **`palmBladeCanvas` paints a leaflet and its stalk, and nothing else.** One blade from edge to edge — the
  rib down the middle, veins leaning to the tip, dark at the two thin edges, old at the bud and dry at the
  point — with no air in it at all, because the shape is the mesh now: `mats.palmLeaf` is a sheet with both
  faces drawn and **no alpha and no cut**, and the `frond` cut is out of `tools/draw.js` with it. The rib band
  doubles as the frond's stalk, so one canvas paints both. `mats.frond` is gone; the browser's material list
  is one out and one in.
- **Two small truths.** The three coconuts wear the trunk's bark and not the flower-pots' clay — three
  terracotta balls read as three pink lumps in the middle of a green crown — and stand on a ring so they are
  three and not one. And the far palms' merged crown keeps its vertex colours now: `MergeMeshes` was throwing
  every tone written at a leaflet's corners away.
- **What the pictures say.** At the crown of the palm by the steps, 3.9 m off: leaf 15.3% of the frame at
  **(64,122,41)**, darkest (19,60,7), brightest (171,236,192) — a green mass with lit leaf tips and a ragged
  edge against the sky. **All seventeen standing views within two points of luminance**, nothing blown
  anywhere, the colour share the same or a tenth up; **1.9 fps against the released Villa's 1.5** in the same
  sandbox (read as ±0.4, as before) and 5.8 s to the first frame. A denser crown — fifteen fronds, eighteen
  stations — was built, photographed and **refused**: the young leaves merged into flat bright sheets when
  looked up at, and it cost 0.2 fps.
- **Still open**: a banana is still a handful of flat green plates and is now the worst thing in the mid
  distance; the heart of a crown is a bare knuckle where the fronds meet; a leaflet is two straight segments
  and not a curving blade; the court's paving is a big plain grid; the hedge's foot is still a ruled line.

## 0.50.0 — 2026-10-17

- **The clipped bushes were broccoli, and they are leaf now.** 🥦➡️🌿 At arm's length a browser said what
  they were: a crumpled ball wearing a *picture* of leaf — flat green paddles, every one combed round to
  the sphere's own poles, and one flat lime tone from (20,37,3) to (112,155,26) with no dark in it at all.
  The outside leaf of a shrub is geometry now: `bushClusterCanvas` paints an atlas of sixteen **sprays**
  (ten pointed leaves of 4–7 cm thrown from one bud over a wobbled dark mass), `skinAnchors` reads places
  to stand them off the crumpled skin's own triangles, and `bushLeafage` plants **18,736 leaf cards** —
  one spray to a card, tilted up-and-out, each at one of eight turnings and with its own tone, brighter the
  higher it sits. The shell underneath went down to be the dark *inside*: small, thick, darker leaf, because
  the cards are the lit leaf now. On the camera where a shrub fills the bottom of the frame the bush runs
  (35,59,8) with a darkest (14,22,0) and a brightest (134,202,50): a dark green mass with lit tips and a
  ragged edge.
- **Two silent faults, both found by tools.** A quad's winding and its normal buffer are one fact: wound
  `(0,2,1)` the cards' front faces pointed at −N, so half of them were lit by a normal pointing at the
  ground and came out maroon in a sunlit bush — rewritten winding, gone. And a vertex colour buffer is four
  numbers per *corner*, not one per card: the browser painted whatever lay past the end (dark blotches),
  and `tools/draw.js` was the only reader that asked for the buffer back and threw.
- **An atlas's air is black and a mip level is a block average**, so `padAtlas` now fills every transparent
  pixel of the shrub atlas with the colour of the leaf nearest it and leaves it transparent; the twigs went
  mossy-brown because the padding spreads whatever hue they have over the whole cell.
- **Cost and honesty**: 652 meshes to 692, **1.9 fps against the released Villa's 1.9** in the same
  sandbox, 5.7 s to the third frame. All seventeen standing views within three points of luminance,
  nothing blown, colour share unchanged — and the dark end went slightly *up* in the six views that have a
  big shrub in them (grass 2.5 → 4.6% of pixels at L31 or below), which is what a bush with dark between
  its leaves costs when the old one had none. Two rounds of lifting took the worst of it back from +2.2 to
  +1.6 points; `bushClusterCanvas`'s `massTone` and `deep` are the knob for the rest.
- **Still open**: at two hands' distance the cards near a crown thatch instead of reading as separate
  leaves; the canopy atlas is unpadded; the palm fronds are flat fans; the court's paving is a big plain
  grid; the hedge's foot is still a straight line where it meets the lawn.

## 0.49.1 — 2026-10-17

- Comments and tool help only. Four notes in the Villa and its tools still named the canvas the
  near rank does now wear (`nearCanopyCanvas`), and one jargon term (`branch-end`) went out of
  use with it; they are corrected here so the released copy describes the Villa it carries. Nothing on
  screen moved, and `tools/standup.js` and `tools/sheets.js` are clean.

## 0.49.0 — 2026-10-17

- **The near rank of the jungle was cut on card borders; it is cut from leaf now.** 🃏📏➡️🌿 At seven metres a
  visitor at the south hedge was looking at two-and-a-half metre straight edges with black air behind them
  (`pictures/48-near-south.png`, `pictures/s50-near-south.png`), and the fault was not the paint: the canvas
  was one seamless tile inked edge to edge and every card took a window on it wherever the window fell, so the
  straight line belonged to the CARD and not to the picture. The canvas is now an **atlas of sixteen separate
  clusters** (`canopyClusterCanvas`: a head of about ninety leaves of 20–36 cm thrown out from one middle over
  a wobbled dark mass, with twigs in it and lit leaves on its rim) and one card is inked with exactly one
  cluster, at one of eight orientations — so a card's border falls in air and there is nothing there to be
  cut. The outline a visitor sees is the outside leaves of the cluster, nibbled leaf by leaf. `canopyAtlas` is
  read by the painter and the cutter both, so the two cannot disagree about the layout, and the texture is
  clamped instead of wrapped, because a wrapped cell would drag its neighbour's leaf into this one's border.
- **The hedge was a wall, and it is a hedge now.** 🧱➡️🌿 Four boxes 68 m long with one ruler line along the
  top of them and a face of two noise washes — clumps of 18 cm over a speckle of 17 mm, which is a knitted
  stocking at three metres and one flat green at twenty (`pictures/1912-eastlawn.png`). It is built in
  **44 segments** now, each standing its own height off a crest line that wanders at the scale of a tree and of
  a branch; the face is painted as leaf (`hedgeCanvas`: a metre and four tenths of hedge to a repeat, eleven
  hundred leaves of 4–7 cm with their own midrib and their own shade, four shears' sweeps to it, and a weather
  a metre and half across); every segment carries a tone written at its corners that wanders along the run and
  darkens towards its foot; and a **fringe of about 2,900 leaf cards stands on the crest**, so where the hedge
  meets the sky the line is leaf tips and not a ruler.
- **A card that reads black is a normal problem and not a colour problem**, and this is what the crest cost
  to learn: the fringe came out a scorched band along a sunlit hedge — crest (31,63,10) against face
  (73,111,19) — and `albedoColor` at 2.2 times bought nine points of green, while rewriting the normal buffer
  on the live page in `tools/cover.js --js` to point up-and-out instead of along the card's own face bought
  **(129,170,54)** in the same places. That is what `hedgeCrest` writes, and `twoSidedLighting` turned out to
  change nothing at all.
- **The light did not move, which was the trick.** All seventeen standing views against the released Villa
  (`pictures/1930-home.png` … `pictures/1946-backstore.png` against `1870` … `1886`, `tools/scan_old_new.js`):
  every one within a point of luminance, nothing blown to white, colour share unchanged — and **the black gave
  back a fifth of itself**: 31.4% of the set's pixels at L31 or below came down to **25.2%** (southborder
  6.0 → 3.7, grass 3.3 → 2.5, westlawn 3.4 → 3.0). On the `southborder` camera the belt went 24 → 25.6% of
  the frame, darkest (7,18,1) → (13,26,2), brightest (80,174,13) → (137,185,70), runs 14,33,4 → 16,26,7; and
  the hedge canvas holds its mean at (73,109,46) where the two washes it replaces sat at (73,107,47), with
  sixteen times that spread surviving into a mip level the old speckle never reached.
- **A drawing fault seven sessions old closed.** The CPU drawing had been putting a glow beside the hedge
  bigger than its emissive could pay for; `SURFACES.hedge.glow` is the material's real added light now
  (0.004,0.012,0.001) and `tools/sheets.js` is clean — and the drawn hedge came nearer the browser rather than
  further, (74,111,36) against (75,111,19) on `eastlawn`. `hedge` gained `vertex: true` and the crest has an
  entry of its own, so `tools/draw.js` stops throwing 5,688 faces away.
- **It is not free and it is nearly nothing**: 611 meshes to 652, **2.0 fps against the released 2.1** in the
  same sandbox, third frame in 5.4 s. Three files of the Villa changed (`textures.js`, `materials.js`,
  `world.js`) and one of the drawing's (`surface-colours.js`); nothing new is loaded at the top level, so
  `walkable_items` in `release.sh` needed no change.
- **Still open, and now the worst things in the Villa**: the clipped bushes are broccoli and they are in the
  start view (`pictures/1930-home.png`, and one filling the corner of `pictures/1931-rear.png`); the palm
  fronds are flat fans (`pictures/1937-pool.png`); the court's paving is a big plain grid; a crown directly
  overhead still shows 40–60 cm flat leaves; and the hedge's foot is still a straight line where it meets the
  lawn — the crest got leaf, the base did not.
## 0.48.0 — 2026-10-17

- **The lawn was a printed sheet; it is a sward now.** 🌱➡️🌾 Standing on the garden and looking down, a
  visitor saw softness — a green carpet with blobs on it and not one blade. The tile is six metres of
  ground and it was painted 512 pixels across, so a texel was 1.2 cm and a blade of grass could not be
  drawn in it at all; and every layer in the tile was a soft noise wash, so nothing in it had an edge at
  any size (`pictures/s48-lawnfeet.png`, and the tile itself in `pictures/s48-tile-grass-3x.png` — the
  same fault the far rank of the jungle was caught with, in the ground instead of above it).
- **The tile is 1024 now — six millimetres to a texel — and it carries two new layers.** `swardGrain`
  is the one that does the work: one random number per texel, averaged along a short leaning line eight
  to eleven texels long, and multiplied over everything under it. That is the tips of the blades, half
  catching the sun and half not, at the size a lawn is actually read at from three metres off; and it is
  noise and not drawing, because a first attempt painted ten thousand separate blades and the browser
  came back with scattered green commas lying on a smooth field (`pictures/s48b-grass.png`). Under it
  sits a few thousand real blades, gathered into the crowns they grow from, each crown its own tone and
  each blade its own, for the few metres where a crown is a thing you can see.
- **The same light, and that is measured and not hoped.** The tile's mean is (83,119,63) where it was
  (84,119,63) — a shape change and not a colour one, so the average was held on purpose — while its own
  spread went 11,8,4 → 12,11,5 (`tools/canvasstats.js`). On the `grass` camera, against the released
  v0.47.0 (`tools/cover.js`): the lawn still paints 43.6% of the frame and (103,153,42) where it painted
  (104,153,41), and its `runs` went 21,18,11 → **22,20,11**, with the darkest blade in at 50,99,20 and
  the brightest out at 157,207,61. All seventeen standing views re-photographed (`pictures/1870-home.png`
  … `pictures/1886-backstore.png` against `1830` … `1846`): every one within a point of luminance, nothing
  blown, nothing crushed. The walk is untouched (610 meshes, 81.8% of the garden reachable) and the frame
  rate is what it was, 2.1 fps in this software renderer.
- **The relief was re-paid for, because a fine bump eats light.** The bump is now the colour canvas drawn
  down to 512 instead of a second canvas painted at 256 — one painting instead of two, and blades in the
  relief instead of blobs — and its level came down from 0.25 to 0.15, because at 0.25 the sward 7.6 m off
  stood at L155 where with no bump at all it stands at L161, and at 0.15 it stands at L160 (`tools/lawnbump.json`).
- **One thing learnt about the clock: the finer tile is not free, and nothing in this folder could say so.**
  **`tools/bootcost.js`** is new: it times the wait from opening the page to the Villa drawing its third
  frame. The released Villa gets there in 5.0–7.0 s here and this one in 7.1–8.0 s; the sandbox is not
  steady enough to divide the second up, but the order of magnitude is honest and the grain is not free.
  The grain also stopped re-hashing its salt for every tap of every streak (six million hashes became one
  million), and `tools/canvassave.js` had a real bug fixed: it read the output file's name as the canvas
  size and silently painted the default instead of what it was told.
- **Still open, and now the worst things in the Villa:** the near rank of the jungle is still cut on hard
  card borders, so at seven metres a visitor at the south hedge sees straight edges and black holes where
  the outermost card is cut and nothing is behind it (`pictures/48-near-south.png`); the hedge is a flat
  green wall with a dead-straight top and a knitted pattern on it (`pictures/1865-southborder.png`); and
  the clipped bushes are broccoli — hard-edged leaf cards on a dome.

## 0.47.0 — 2026-10-16

- **The near rank of the jungle was confetti; it is a wood of branch-ends now.** 🌿🍃➡️🌴 The far rank got its
  crown canvas in v0.46.0 and the near rank was still wearing the old spray canvas at a metre and a quarter to
  a repeat: a hundred and sixty sprays of five to nine leaves, every spray one rosette of one size, each leaf
  eleven to eighteen centimetres long and every one of them carrying a pale midrib. A browser at thirteen
  metres photographed camouflage, not trees (`pictures/48-near-before-crop.png`) — the far rank's fault over
  again at a fifth of the scale, a shape the eye can match and a spacing small enough to be a lattice.
- **`nearCanopyCanvas` is the unit a wood actually shows from there: the branch-end.** A twig half a metre to
  eight and a half decimetres long, seven to thirteen leaves on it, all leaning the twig's way and each taking
  its own size (26 to 50 cm), lean and tone; the end's own tone read off a noise field three to a tile, so the
  mass changes at the size of a branch and not only at the size of a leaf; a shadow of itself under every
  leaf, at 0.3 against the cards' 0.42 cut-off so a shadow lying on air holds nothing up; and five parts in a
  hundred of the tile left as air, which is what the card is cut on. The midrib is painted on one leaf in four
  and never the same way twice, because a pale midrib on EVERY leaf is what turned the sprays into stars. Two
  metres and six tenths to a repeat, so a leaf is twenty-seven to fifty-two pixels of the screen at the near
  rank instead of eleven to eighteen.
- **Every card now takes its own window on the tile** (`cardRank` in `src/world.js`). Before, every card in the
  belt sampled the same corner of the canvas — the same branch-ends, in the same places, at the same size —
  and a crowd of identical windows is a lattice whatever is painted inside them.
- **It is the same green and the same light, and that is measured, not hoped.** The same camera, the same grid,
  against the released v0.46.0 (`tools/cover.js` on `6,1.6,13,0.27,0`): the rank covers 26.5% of the frame
  where it covered 28.1%, it paints (27,68,7) where it painted (21,57,5), and its own spread — `runs` — went
  from 9,20,3 to **14,32,4**: half again as much light and shade across its own pixels, which is the branch
  tone reaching the screen. Its brightest leaf went (65,158,12) → (80,181,18) and its darkest (4,27,2) →
  (7,20,1): a deeper hollow and a brighter top, which is what a canopy does and a wallpaper cannot.
  All seventeen standing views re-photographed (`pictures/1830-home.png` … `pictures/1846-backstore.png`
  against `1810` … `1826`): means within two points of luminance, nothing blown to white, nothing crushed to
  black; the two frames where the rank is big are the only ones that moved at all (`southborder` L81 → L83,
  98.4 → 97.5 in colour, dark 6.4 → 6.0%). The walk is untouched (610 meshes, 81.8% of the garden reachable,
  four clean frames) and the frame rate is what it was: 2.1 fps in this software renderer.
- One tool came out of it: **`tools/canvassave.js`** paints any canvas in the browser and writes it tiled two
  or three times over a dark ground, cut at the material's own cut-off, so a lattice is seen before a whole
  Villa is built and photographed. The old spray canvas is gone from `src/textures.js` — nothing else wore it —
  and `tools/draw.js`, `src/surface-colours.js` (`glow` re-measured by `tools/sheets.js`) were re-tuned to it.
- **Still open, and now the worst thing in the Villa:** the card itself is a hard-edged quad, so at seven
  metres a visitor standing at the south hedge sees straight card borders and black holes where the outermost
  card is cut and nothing is behind it (`pictures/48-near-south.png`); and the lawn at eye height is still a
  printed sheet with clumps on it.

## 0.46.0 — 2026-10-16

- **The far rank of the jungle was a wall of stamped leaves; it is a wood now.** 🌿🔁➡️🌴 The curtain that
  v0.44.0 put there was one leaf canvas laid two metres to a repeat, and a browser photographed it as rows
  of one identical little plant, one above the other the whole way up (`pictures/47-crop-hill.png`, blown up
  twice; the same stamp on the ridge in `pictures/1763-westlawn.png`). Two faults in one: a spray is a SHAPE,
  and a shape the eye can match against its neighbour is a pattern however it is scattered; and at two metres
  to a repeat sixty-odd sprays fit across a crown whose head is six to twelve metres wide, so the spacing of
  them — one and a half metres — was forty pixels of the frame at eighty metres. A lattice, in plain sight.
- **The rank now wears a canvas of its own, `farCanopyCanvas`, at twelve metres to a repeat.** Four scales and
  nothing drawn twice: crowns (value noise, six metres, which is what a far tree's head actually IS out
  there), branches (two and a half), then fourteen hundred leaf clusters of three to seven ellipses each —
  every one taking its own number, sizes, offsets, angles and tone, from a fifth of a metre to two-thirds —
  and a thousand tips that are nothing at eighty metres and the difference between leaf and paint at
  twenty-six. Crowns and branches are noise, which wanders its own spacing and so has no lattice in it; the
  clusters are drawn, because value noise at the size of a leaf is a smooth blur and a first version built
  from noise alone came to the screen as one (`pictures/47-crop-hill-tile12.png`, runs 4,7,3 across the
  curtain where the drawn clusters give 5,14,3).
- **A twelve-metre tile cannot wear a two-metre warp.** The curtain's pattern is pulled off its grid by a
  `squeeze` and a `lean`, and the squeeze stretches whatever it wanders: at twelve metres the old numbers —
  spacing wandering between 0.4 and 1.6 of a tile every six metres — dragged a six-metre crown five metres
  sideways in half a crown's width. It is a quarter of a tile over sixteen metres now. The lean stays at
  seven degrees, because a lean is an angle and not a distance.
- **It is the same wood in the same light, and that is measured, not hoped.** Over the belt on the `grass`
  camera, in blocks of eight pixels: (30,65,15) L54 with a block spread of r 16.4 g 23.0 b 8.8 before,
  (31,64,14) L53 with r 16.4 g 23.7 b 8.8 after (`pictures/1764-grass.png` against `pictures/1824-grass.png`)
  — so this is a pattern that was wrong and not a colour or a light. From far enough off that the clusters
  average out there is nothing to see at all: the same sample at eighty-seven metres paints (42,69,34)
  against the (42,71,35) it painted before. From fifty-two metres the rank reads (25,54,13) where the old one
  read (30,60,20): six points of green short, and paid for, since two things that used to lift those pixels
  are gone — sky showing through a cut, and a haze wash laid over every leaf in the tile. All seventeen
  standing views re-photographed (`pictures/1810-home.png` … `pictures/1826-backstore.png` against
  `1740` … `1756`): means within one point of luminance, nothing blown to white, nothing crushed to black,
  the frames where the belt is big a point less “in colour” and a point and a half more of dark green, which
  is the shade between the crowns. The walk is untouched (610 meshes, 81.8% of the garden reachable, four
  clean frames) and the frame rate is what it was: 1.9 fps in this software renderer.

## 0.45.0 — 2026-10-16

- **The lawn was the colour of pond scum; it is grass now.** 🌱➡️🟩 Photographed straight down at the west
  lawn in blocks of forty pixels — a rectangle that is nothing but grass — it painted **(103,148,23)**, and
  one block differed from another by a warmth (red minus blue) of **47 to 126**, where sun against shade is
  worth one or two and dust against damp ten (`pictures/46-lawn-over-before.png`). Two things were in that,
  and they pulled the same way. The lawn's dry end was `[1.3, 1.02, 0.64]` — a third more red and more than
  a third less blue — which is not straw but the laterite under the lawn, so the dry places were patches of
  bare earth in a yellow field; and the sward's colour lift was `[4.2, 3.6, 2.4]`, which paid the grass's
  taken-away glare back in red and took it out of blue, so the green had a twenty-second of itself in blue
  and read as acid. See `pictures/46-lawn-asbuild.png` against `pictures/46-lawn-lift-after.png`, and
  `pictures/46-lawn-dryend-only.png` for what the dry end alone was worth.
- **Dry grass is pale, and pale means every channel up, not red up and blue down.** The dry end is
  `[1.16, 1.04, 0.86]` now and the lush end `[0.9, 1.07, 1.02]`; the lift is `[3.44, 3.6, 3.36]`. Measured
  again on the same rectangle: **(85,146,32)**, warmth 29 to 86 with a mean of 53 where it ran 47 to 126 over
  a mean of 80. The dry places are still paler and warmer than the lush ones — that is what a dry season in a
  lawn is — but they are now pale the way straw is pale and not the colour of the path.
- **It is not back to printer's green, and that is measured, not hoped.** The fortieth session went off to a
  mint veil at (114,175,70) — a blue two fifths of its green — and this stays under a third of it on the two
  cameras that matter: `grass` (121,155,31) L139 → **(105,153,42)** L135, and the sunlit `westlawn`
  (123,161,34) L144 → **(108,160,47)** L141, where the brightest sunlit blade went (156,197,35) →
  (136,199,53) — warm, and grass. The whole light of the garden hardly moved (L129 → L125 from above), which
  is the point: this is a colour that was wrong and not a garden that was too dark.
- **All seventeen standing pictures re-photographed** (`pictures/1740-home.png` … `pictures/1756-backstore.png`)
  against `1720` … `1736`: twelve unchanged and five down by one point of luminance, nothing blown to white,
  nothing crushed to black, in colour where it was. A hue move is invisible to a whole-frame luminance, so
  the evidence is the lawn's own blocks above and the two camera readings, not the frame means.
- **The drawing followed**, as far as a drawing goes: `lawn.tint` [96,148,66] → [84,148,74], which moves the
  drawn lawn from (68,108,43) to (65,108,45). The drawing runs thirty-odd points dark on sunlit ground
  whatever it is given, so what was matched there is the hue and not the light.

## 0.44.0 — 2026-10-16

- **The far rank of the jungle was torn green sails; it is a wood now.** 🌿🪞➡️🌴 Standing on the west lawn and
  looking at the belt through a narrow eye (`pictures/46-farrank-before.png`), the rank twenty-six to
  fifty-two metres beyond the hedge came out as broken paper: a spire of green shards where the tallest crown
  stood, ragged sails either side of the sala, and sky through every one of them. The reason is size and not
  paint — a crown out there is six to eleven metres across and the cards it was built from are a third of
  that, so its outline stepped about in pieces two to four metres wide, and forty metres off one of those
  steps is fifty pixels of straight edge with a hole behind it. Near in, at nine to twenty metres, exactly
  the same card reads as a cluster of leaf, which is why the near rank is untouched and the far one is not.
- **The far rank is now built the way the far tree line is built: one mass with an edge.** A curtain of
  872 quads laid along the ring (`skylineBand` in `src/world.js`, still named `jungleHighBelt`, still
  wearing `mats.jungleFar`) standing 13-27 m up, so its head shows over the near rank and under the far
  line. Twenty-nine thousand and five hundred alpha-tested triangles went out of every frame and eight
  hundred and seventy-two came back: **1.9 fps against the last release's 1.3** in this software renderer.
  The edge wanders at three wavelengths — 30 m of stand, 10 m of clump, 4 m of one crown — and no finer,
  because a wave shorter than three samples of the step it is walked at comes out a saw and not a crest.
- **A curtain shows a repeating pattern the way a crowd of cards never did, so the pattern is warped off its
  grid.** At a two-metre tile the leaf canvas repeated every forty pixels of the frame and the eye, which is
  built for exactly that, called it wallpaper at once (`pictures/46-curtain-3m-grid.png`, blown up twice).
  Two smooth warps now, and no seam anywhere: the spacing along the ring wanders between 0.4 and 1.6 of a
  tile, and the whole pattern leans as it goes up by 0.12 of a tile per tile of height, which slides the
  leaf a full repeat and a half sideways over the curtain's own twenty-five metres and stops the sprays
  standing in columns. Two attempts at that second warp are kept as pictures, because both were measured
  back down: a lean of 0.45 broke the columns and put a rain-stripe in their place
  (`pictures/46-lean-too-strong.png`), and a phase that slid with the ring position instead of leaning
  stepped the pattern a fifth of a tile at every quad and combed the leaf vertically
  (`pictures/46-combed-shear.png`).
- **The haze ladder still steps, and now it covers more of the frame.** Measured on the `grass` camera with
  `tools/cover.js`: the far rank used to paint 5.2% of the frame at (34,65,24) with the rest of it sky
  showing through the cut; it paints 11.6% at (30,60,20) and runs 30,27,29 across itself. Hedge (63,98,15)
  → near rank (23,60,7) → this (30,60,20) → far line (68,93,61): green and red thirty-seven apart in front
  of the hedge, thirty here, twenty-five out on the sky, and blue climbing the whole way. The material's
  bytes went up by a sixth when the cut came out, because a solid curtain shows the dark of the leaf's own
  underside where a cut one used to show sky.
- **What the seventeen standing pictures say.** All seventeen re-photographed (`pictures/1720-home.png` …
  `pictures/1736-backstore.png`) against `1600` … `1616`: every view the same or down — four views by 3-4
  points, `pool` and `southborder` by 11, six unchanged — and **nothing blown to white and nothing crushed
  to black in any of them**. Down is the right direction: what used to reach those pixels through the holes
  in the cards was sky, and a wood is darker than the sky behind it.
- **One tool gained a question.** `tools/beltcurtain.json` asks what the curtain should wear and how big the
  wear should be — tile sizes, the far line's canvas against the leaf one, the leaf cut out of the curtain
  and not, the colour up and down — and it records in its own `_note` that `query` belongs to a case in
  `tools/lights.js` and not to a view, which is how half of one ladder measured the same camera three times.

## 0.43.0 — 2026-10-16

- **The grass no longer grows in the pool's waterline.** 🌱➡️🟫 A one-pixel lime hairline ran the whole 5 m of the
  pool's east edge — `(97,162,25)` where the tiles should be, plain as a pinstripe in a picture taken from above
  (`pictures/poolring-before-edge.png` is it blown up eight times, photographed out of `v0.42.0` itself). It was
  the lawn's own cut edge: the grass was laid
  out to `x = 5.00`, which is the same vertical plane as the pool's inner wall and 20 cm above the water, so a
  tilted eye met a tread against a riser along the whole line and the rasteriser handed the pixel to the grass.
  Nothing on the water or the tiles could be tuned, because neither was at fault — switching the lawn out
  switched the line out, and widening the wall did not touch it (`tools/edgehunt.json`).
- **The court's stone now runs to the pool's wall shell, and the capstone stands on stone.** It stopped 2.5 cm
  beyond the cap's outer edge, which left a slot all the way round the water — 2.5 cm wide, 7 cm deep, floored
  by grass. Now the paving comes in to the pit's own 30 cm walls (x = ±5.3, z = 1.8 and 7.4) on all four sides,
  the four paving rectangles meet on those numbers and no longer overlap by 5 mm (two coplanar top faces at the
  same depth is a fight for every pixel over them), and the lawn stops 15 cm under the slab instead of meeting
  the pool: `tools/capgap.json` answers `paver` everywhere it used to answer `lawn`.
- **The path out through the south was being laid twice**, one slab of boards drawn in the same place twice and
  two coplanar faces offered to the depth test. It is laid once now, out of the same plan, at its own 12 cm
  height.
- **Nothing else in the Villa moved.** All seventeen standing views against `v0.42.0`: every one of them `+0` on
  luminance, nothing blown to white, nothing crushed to black, the lit band's colour where it was. From eye
  height the fault was never visible; from above the pool's ring is now clean stone all the way round
  (`pictures/court-overhead-v0430.png`), and the waterline the last session built still reads damp and distinct
  (the foot is 0.86 of the dry capstone, measured as before).

## 0.42.0 — 2026-10-16

- **The pool has a waterline now.** 🌊✆ Before, the tile was one tone from the water to the coping, so nothing
  said where the surface was and the water's top band ran straight into the grout. Two materials and eight thin
  boxes: `mats.poolWet` is the 14 cm of tile the water touches, darker and cooler and wearing the mosaic's own
  pattern so the joints cannot shift, and `mats.copingWet` is the inner 13 cm of the capstone, damp where
  people climb out. Measured from a camera laid down at the water, where the band is fifty pixels and not two:
  the wet tile reads (95,133,135) L125 against the dry tile's (124,160,158) L152, and the damp foot (174,154,134)
  L156 against the dry capstone's (213,186,150) L189. `?wet=0` takes both out, and that is the proof — the wall
  behind is the pool as it was.
- **The coping ring is eight boxes and not four.** The damp foot used to be a 6 mm plate laid on top of the
  capstone, and a plate proud of a stone throws a shadow of its own height: two pixels of black across the
  cap, which reads as a groove sawn in it. It is now the inner band of the coping itself, one plane, one
  height, its edges butting the dry stone's, so no pixel has to choose between them.
- **Nothing else in the Villa moved.** The seventeen standing views against `v0.41.0`: `home` and `pool` three
  points of a hundred down (116 → 113), `path`, `salaroof` and `westwall` one, the other twelve unchanged; no
  pixel blown to white, none crushed to black. And 1.7 fps for this build against 1.4 for the last release,
  which in a software renderer means the eight new boxes are free.

## 0.41.0 — 2026-10-16

- **The pool has water in it now.** 🕳️💧➡️🏊 The surface was a single-sided sheet wound facing downwards, so
  the browser culled it and there was no water at all: a dry tiled pit, its steps high and dry, with two
  glowing caustics sheets hanging in the air where the surface should have been (`pictures/tmp-pA-crop.png`
  is the released picture of it). It faces up now, and it is a real surface: translucent enough to see the
  mosaic, the steps and the floor net through, dark and blue where it is deep, and bright with the sun's
  sparkle where it mirrors.
- **The surface closes into a mirror as you graze it, and stays see-through when you look down**, which the
  library's alpha does not do on its own: `src/water.js` adds one line to the library's own shader,
  `alpha = alpha + (1 - alpha) * pow(1 - NdotV, 4)`. `?nofresnel=1` weighs it, `?wfp=` dials it.
- **The water has a mirror to mirror.** A second cube is filled from the pool's own surface — the house, the
  palms, the hedge, the far wood — and given to the water alone, so nothing else in the Villa changes. It is
  filled after the first frame and not at boot, which is worth knowing: a probe rendered at boot, while the
  sky cube's prefilter is still running, takes 5 to 24 points of ambient light out of every shaded face in
  the whole scene.
- **The caustics moved to the pool floor**, where light under water actually falls, drawn as thin lines
  instead of dinner-plate blots, and each sheet now has its own strength (the last one set one number twice).
  The mosaic itself came up from dark teal to pale pool glass, and carries a little glow of its own, because a
  pit walled on four sides has nowhere to get bounced light from in a renderer that has none.
- The ripple bump went to level 0.7, so the sun comes back as a field of sparkle instead of one white coin.
  `src/surface-colours.js` now describes the new pool, though the CPU drawing still paints the water as a
  flat sheet and says so.
- Start view, over the water band, released `v0.40.1` against now: (112,142,136) L135 warmth −24 →
  (96,138,133) L129 warmth **−37**, a wider spread between one patch and the next and a brighter top end.
  Nothing black, nothing blown: 0.0% of that patch over L240. The seventeen standing views outside the pool
  are unchanged to the point.

## 0.40.1 — 2026-10-16

- **Nothing moved on screen; two comments stopped pointing at pictures that are gone.** The working set of
  the last release's ladders was cleared out of `pictures/` afterwards, and `src/materials.js` still sent a
  reader to `tmp-deck2-01..04.png` and to the forty-first session's `tmp-mint-01..07.png` — neither of which
  exists. Both now say the pictures are pruned and that the numbers stand in the tables beside them, which is
  where they stand anyway. `diff -r releases/v0.40.1/src src` empty; the standing views and the measurements
  of v0.40.0 are unchanged and still the ones to compare against.

## 0.40.0 — 2026-10-16

- **The pool deck was grey asphalt and it is cut sandstone now.** 🛞➡️🟨 The stone in the pattern was
  (150,141,126) — grey — and the grain wash over it went down to (96,90,80), so a browser laid the biggest
  surface in `path` and `west` at (133,113,87) L115 with pits in it, against its own coping at L206:
  ninety-one points darker than the kerb that borders it, which is why the court read as dirty tarmac and
  not as sawn stone. The slabs are (176,161,134), the wash's ends are lifted off tar to (143,131,108) and
  (219,205,178), and the grout is a warm brown instead of a black line. The deck now reads (155,129,94)
  L132 in `path` — a third of that frame — and (196,159,111) L163 in `west`, its sunlit blocks running
  117 to 149 and its brightest pixel (231,186,132), so it is bright without any of it being at the ceiling.
  The warmth between one block of it and the next went up from 41 to 57, which is the dust and the damp
  being legible again rather than being varnished over.
- **Its shine came down, but not the way the lawn's did, and that was worth finding out.** The last session
  expected the paving to be the lawn's fault one surface later, the lift coming down as the sheen goes. On
  stone it is not: taking the sheen from 0.25 to 0.08 cost the deck thirty-eight points of light *and
  seventeen of warmth* (red minus blue 46 → 29), because a dry slab's glint comes from the warm sun and not
  from the blue sky the way a flat lawn's does. So the paving keeps a sheen of 0.18 and the coping, which is
  a fresh-cut arris and not a worn slab, 0.14 — enough to take the coping's brightest pixel from
  (252,217,178) to (249,210,164) — and the paleness comes out of the stone itself, which is where paleness
  belongs. `src/materials.js` has the whole ladder.
- **The Villa has no hills in it, and now that is written down where it can be found.** 🔍 The six hill
  spheres were painted red in a live page and asked what the browser used: 0.1% of the `west` frame, one
  grid point. The smooth green hills in every standing picture are the far tree line, which is the last
  step of green the eye is ever given. They were pushed out to 300-380 m and raised until they cleared that
  band and photographed: they come out (100,125,93), a properly hazy pale, but six smooth domes peeking over
  a ragged wood is not a ridge and they covered 0.4% of the frame. They stand back where they were and
  `src/world.js` says what to do instead.
- Standing views for the next session: `1250-home` … `1266-backstore`. Whole-frame means moved only where
  the deck is big — `path` +6 L, `sala` +2, `westlawn` and `salaroof` +1, `home` −3, the other twelve
  unchanged to the point — nothing black and nothing blown anywhere. `in colour` came up a fraction on
  `path`, `west`, `sala`, `pool`, `salaroof` and `westlawn` and went down 1.1 on `home`, where the deck
  lies in the house's own shade and lost a little of what the shine used to hand it.
- **One measured fault left where it was, and not chased.** The CPU drawing now paints the deck
  (190,159,123) where the browser paints (155,129,94) — 26 points over on a sunlit horizontal face, and the
  same drawing is 14-24 points over on a shaded wall (fault 4's shaded views). That is its missing ground bounce and its one sky term
  (faults 4 and 33) and not the deck's: `src/surface-colours.js` now mirrors the new canvas honestly, so the
  drawing is wrong in the old way rather than the new one. The previews that get seen come from a live
  browser.
- The walk is untouched: 603 meshes, 45 floors, 89 blockers, 81.8% of the garden reachable from the start,
  and no step anywhere that is a jump. `tools/standup.js` runs the render loop clean.

## 0.39.0 — 2026-10-16

- **The two great pots at the terrace steps are planted.** 🏺➡️🌿 They have been empty since the day they
  were built: 0.8 m of terracotta either side of the steps down to the pool, holding nothing, while the
  potted plants a metre away on each hand carried clipped shrubs — four pots in a row in the start view and
  two of them empty, which reads as a plan nobody finished. Each now has a disc of soil at its mouth and a
  leafy mass two thirds of the mouth across, about 1.5 m over all: shoulder height for whoever stands on
  the step between them. The garden's own `makeLeafyMass` builds it — the same making as a shrub and as a
  potted bush, so the unequal lumps, the leaf-tipped silhouette and the light read from a bush's own shape
  were all already paid for. 603 meshes against 597; the blockers, the floors and the 81.8% of the garden
  a visitor can reach are unchanged, because the pots' own blockers were already there.

## 0.38.0 — 2026-10-16

- **The lawn was a mirror aimed at the sky, and it has been turned back into grass.** 🌿🪞➡️🌱 A sunlit
  sward seen at a grazing angle came out of the browser at (142,183,87) L167 — mint cream, the oldest open
  complaint about the garden, twenty-two sessions old. Two levers had been blamed for it and both are now
  measured and dead: the sky fill's blue moved that lawn by nothing at all, and a fifth of the pattern's
  light out moved it five points. It was the shine: a flat sheet of one colour, turned square at the sky and
  raked by the eye, is the case a reflected sky likes best. At sheen 0.08 the lawn falls to L106, at nought
  to L58 — sixty-one points of what looked like grass was the sky. The shine is off now and nearly all of
  it is paid back as the sward's own colour: **(124,175,54) L155**, red and blue sixty-nine apart, which is
  a lawn in evening sun and not printer's green. The raked lawn in the south-border view went (126,160,67)
  L146 → (109,150,40) L133, and the same ground seen straight down from 20 m went (113,122,45) →
  (99,148,23): nine points of green there, dried straw with a blue cast over it, and mown bands now.
- **The payment back is three numbers and not one, and it sits in the material's colour rather than in the
  pattern.** 🎛️ 4.2 red, 3.6 green, 2.4 blue: the same light, spent on red instead of on blue, which is the
  difference between (114,175,70) and (124,175,54) at the same luminance. The pattern is left alone because
  `grassCanvas` is also the lawn's bump, and brightening a bump moves the relief with it. The standing
  grass takes the same sheen with two thirds of the payment, and stays under the sward it stands in
  ((92,134,30) against the lawn's L155).
- **Weighed at three angles at once, because a glare paid for at one can over-brighten at another.** 🔺 The
  lift that is right at a grazing angle would be too much from directly overhead, where the sky is behind
  you and there is hardly any reflection to replace: `tools/lawnmint.json` stands the camera raking, raked
  from the west, and 20 m up, and measures the same lawn in all three — which is also how it was settled
  that the sheen is 0.08 and not nought (from the air, nought leaves a dead (43,84,13) L70).
- **All seventeen standing views photographed, twice over.** 📷 Whole-picture means move gently and only
  where the lawn is big — `southborder` −4, `rear` +5, `rearcorner` +4, `eastlawn` +2, `grass` +2 — and not
  at all on the seven frames that hold no lawn, which is the check that nothing else moved. Nothing pure
  black and nothing blown anywhere; `in colour` 98.1% on the south border, 99.0% on the lawn close-up.
  The CPU drawing was left alone on purpose: it shades from its own colour table and never reads a
  material, so it sits 23 points under the browser where it used to sit 36 under — still inside its known
  bias, and not a fault to chase.
- **What is left of the same fault**: the pool deck is the same geometry one surface later — sheen 0.25 and
  the biggest lift in the Villa — so the sandy pale of the deck seen low is glare as much as stone, and the
  grey apron of the overhead view is what remains when the glare goes. And at two metres the sward is still
  straw-yellow (86,117,24): that remnant is the pattern's own bytes, not the shine.

## 0.37.0 — 2026-10-16

- **The Villa has wings: `space` takes you off the ground, `space` again hands the ground back.** 🕊️ No
  other key was added, on purpose — flying uses the same `W A S D`, and the one thing that changes is that
  the sight line is no longer flattened, so you go where you are looking; Shift is 18 m/s instead of 8.
  On the wing the walk's keep-off rectangles are let go of, because a wall that stops you at 30 m is not a
  wall but a cage, and you can go over the pool, the roof and the hedge. A flyer cannot sink below the
  ground under them nor climb past 220 m, and the way back down is a fall at a set 11 m/s and not the walk's
  ease — eased from 25 m, that ease begins at near three hundred metres a second and goes through the floor.
  The plate answers the tap: "a Thai pool villa, half past five" becomes "on the wing over the garden".
  `?float=1` (which the tools stand the camera with) is now a separate thing from flying, and
  `tools/flight.js` asks twelve questions of a real browser about all of it: **twelve pass**, and
  `tools/walk.js` still drops nobody through the world.
- **The eight palms on the skyline were telegraph poles with a green plate on top, and they are palms
  now.** 🌴 Their crown was seven cards hung tangentially — a plane's width turned *across* the radius,
  not along it — so the head was a 1.1 m pancake on a 0.5 m pole, and from the lawn it was a bare stick
  (`pictures/tmp-air-south.png`). They are built by the garden's own palm builder at 1.5 scale: eleven
  fronds hung radially and drooping, a leaning trunk, one idea of a coconut palm instead of two.
- **The lawn's bare earth was a spill and is a thin place now.** 🌿 Laterite laid at 0.6-0.8 of its field
  and 0.86 strength covered a fifth of the lawn, and the sun lifted it to (193,133,42) — a glowing rust
  read as a stain, not as soil. The ramp is 0.72-0.94 now, the colour [92,62,40], and it lies at two-thirds
  so the thin sward shows through its own thin place: the three pixels it was measured at read (138,168,43),
  (120,133,30), (148,174,56) — grass — while the whole-picture mean moved three points of red, so the ugly
  thing went and the light did not.
- **Also shipped: a day of garden work that was in the tree and never published** — the shrubs and potted
  bushes as leafy masses (unequal lumps crumpled at two scales, a parallel shell that ends the silhouette
  in leaf tips, and each mass lit from its own shape), on `spaceNoise`/`spacePatch`. 559 meshes became 597.
- **All seventeen standing views photographed, and they say the change is where the eye has to fly to
  find it**: against v0.36.0's set the whole-picture means are identical to a tenth of a point and the mean
  gap 0.0-0.5 of 255 — nothing black, nothing blown, `in colour` 69.4% to 99.0%. The overhead view
  (`pictures/1102-air.png`) is where both faults show, and a visitor with wings will use it.
  The walk is untouched: 597 meshes, 45 floors, 89 blockers, 81.8% of the garden reachable, every shadow
  caster a mesh, no plant in built stone, 1.8 fps against the released Villa's 1.8 in the same minute.

## 0.36.0 — 2026-10-16

- **The horizon was a field of rocks, and it is a ridge of jungle now.** 🪨➡️⛰️ The far tree line was a row of
  domes with their height read off their width, so a 9 m crown could be asked to stand 72 m up and the tallest
  stood 65 m above the garden at 130 m — twenty-seven degrees of sky, a grey finger. The rest were boulders
  with sky down the gaps, and their painted colour came out (104,114,117): blue over green, which is the
  colour of slate. It is a **band** now — one mass of 596 quads laid round the far ring, 24-44 m up, its top
  edge wandering at three scales so it steps about at the size of a tree (forty-odd pixels at 130 m) and
  never reads as a shape. Its haze went back into its colour and its pattern, where haze lives, instead of
  into a flat tone: bytes 80,110,84 against 66,88,84, and the distance canvas opened from a 105-byte range to
  a 132-byte one at sizes that still reach the screen out there.
- **The far rank of the belt had been painted flat on purpose, and a flat wood is a hillside.** It spent half
  the pattern range of the near rank to look hazed (148-236 against 78-255) and the browser made it
  (67,85,57) with **11 points of spread** across 55 sample points. Haze lifts the floor of a range; it does
  not wipe the range out. 104-246 now, with the material's own bytes raised by what the darker canvas spends
  so the mean light the browser was measured at does not move.
- **Every crown in the belt was a balloon; now every one is a tree.** They are crumpled along their own
  radius — 0.30 near, 0.26 far — which at four segments makes a lump and not a dome; each is sunk until its
  own lowest point is half a metre under the garden, because a crumpled foot can end in the air and a crown
  with daylight under it is a stool; and **every crown wears its own tone**, 0.78-1.22 of light, the pale
  ones given a little more red and the dark ones a little less, so a belt is a crowd of trees and not one
  balloon with bumps on it. `crumple` moved from the garden into `src/mesh.js`, so shrub and crown now share
  one implementation.
- **Two traps, both written in the source where they bit.** A variation the size of the thing it varies reads
  as a rhythm and not as variation: jittering the band's faces at six metres against a three-metre step made
  the north-west of the ring come out barred like a window blind. And half a quad wound the wrong way round
  still looks perfectly well — the band showed, and the mean normal of the mesh was 0.03, neither in nor out;
  the check is that mean, and it is 0.88 with 99% of the vertices turned at the middle of the garden.
- **All seventeen standing views photographed twice and looked at** (`666-home` … `682-backstore` as it
  stands). Nothing pure black and nothing blown anywhere. Every frame came down 0-12 points of light and
  0.4-8.5 points of `in colour`, which is the honest price of standing a pale hazed ridge where bright blue
  sky used to be; what came *up* is the spread in the sunlit part of the picture — westlawn s37 → s73,
  southborder s52 → s77, west s63 → s85 — where the last pale-blue wash went away with the sky it came from.
- **The walk is untouched**: 559 meshes, 45 floors, 89 blockers, **81.8% of the garden reachable** from the
  start, no plant rooted in built stone, every sheet still drawn on both faces, every shadow caster still a
  mesh. Frame rate weighed against the release in the same minute: 2.4 and 1.9 fps here, 1.8 for v0.35.0.

## 0.35.0 — 2026-10-16

- **Every blade of grass in the Villa was hanging upside down, and now it stands.** 🌿🙃➡️🌱
  The clumps that line the beds and the lawn's seams are squares of painted leaf cut on their own alpha,
  Five hundred and eighty-six clumps therefore dangled — a flat black crown in the air with the leaves
  dripping out of it, and the darker the garden the worse it read. The UVs said so in plain words and
  were a lie; they are turned round now, and
  `pictures/593-home.png` and `pictures/606-westwall.png` show grass growing out of the ground.
  The CPU drawing cut its own stand-in blades from the same squares and had the same fault: it now rises
  them from the ground line too, so a drawn clump and a photographed one hang neither way.
- **The lawn was covered in black commas, and it was its own relief map doing it.** The lawn's bump is
  made from its own painted pattern, and the blade strokes in that pattern ran down to a very dark
  green: each stroke became a sharp ridge whose back slope the afternoon sun never reaches. Measured
  over a west-lawn stretch, **11.0% of it came out below L55 at a mean of (28,47,7)** on a lawn whose
  own mean is (96,118,25) — a field of black dashes half a metre long. The strokes are nearer the sward
  now, a third fewer of them and thinner, and the same stretch runs **7.6% dark, at L101 mean**;
  the whole picture came up 1-4 points wherever the lawn shows and nothing went black or blown. The
  probe is `tools/lawndark.json`, and it says something worth knowing: with the strokes softened, five
  bump levels from 0.25 down to nothing now paint the same lawn — the pattern's contrast was the fault,
  not the relief's strength.
- **A shrub was a heap of melons; it is a mound of leaf-tufts now.** Twenty crumpled lumps instead of
  twelve smooth ones, each a quarter of the bush across instead of a third, and every lump's skin pushed
  in and out along its own radius so no lump carries one clean ball-gradient from its lit crown to its
  dark foot. The potted plants got the same treatment at their own scale. No number moves at all —
  a box over the shrub in the west-lawn view reads (79,104,20) before and after — which is why this one
  is only worth anything to a pair of eyes: `pictures/tmp-bush-before.png` against
  `pictures/607-grass.png`.
- **The walk is untouched**: 559 meshes, 45 floors, 89 blockers, **81.8% of the garden reachable** from
  the start, no plant rooted in built stone, every sheet still drawn on both faces and every shadow
  caster still a mesh. The drawn `grass` view puts 254,209 faces toward the eye where it put 195,401,
  and a browser still runs it at 4.1 fps in software.

## 0.34.0 — 2026-10-16

- **The garden was honest and the house was still wearing a varnish. It is off the house now.** 🏠✨➡️🧱
  Ten more surfaces went through `matte()` in `src/materials.js` — the lime walls, the cement base course,
  the teak door, the teak walls, the two teak floors, the furniture timber, the sunbed cloth, the clay roof,
  the pool paving and its coping — so the whole Villa is shaded one way at last. On the start view the sunlit
  coping was (199,179,146) and the teak wall (216,125,64): a wall with its red within 91 of its green and 152
  of its blue is painted foam, and the roof at (189,87,52) was red plastic, not clay.
- **One number per surface had to serve both halves of the picture, and it lands the sunlit face a little
  under what it was and the shaded face a little over** — which is the way round the fault list has been
  asking for it: the shaded sides of this house have been too dark for six sessions and the sunlit ones too
  white. Measured in a live browser with `tools/tint.js --fresh` on three views, because a sunlit face and a
  shaded one do not pay the same price for the same glare: plaster, plasterDark, teak, teakWall, teakFloor
  and the furniture timber ×1.5, the sunbed cloth ×1.35 (its cushions were already at the ceiling, red
  250), the coping ×1.8 and the paving ×2.05 — the paving is a third of the `path` frame and is raked by the
  eye — and the roof ×2.1, being the reddest thing in the frame and the most-seen surface of the house, and
  at ×1.65 it came out as dried mud.
- **What they came out as, on the start view**: coping (178,165,135), teakWall (185,100,35), roof
  (164,70,38), teakFloor (168,97,43), plaster (201,161,117), plasterDark (219,183,130), paver (124,104,81).
  And the pattern under the glare is there now: the coping runs over 112 points of channel spread, the
  teak walls 77, the roof 48, and the roof tiles show their courses for the first time.
- **All seventeen standing views retaken and looked at.** Nothing pure black and nothing blown in any of
  them; `in colour` went up on twelve, most on the shaded ones — the west wall 72.5% → 82.2%, the rear 83.9%
  → 86.2%, the store room 62.3% → 65.9%. The blow came off the sunlit half: the start view put 8.2% of
  itself at L200 and over and now puts 2.7%, and what is left keeps more colour than it had (spread 83 →
  88). The sunlit frames came down 4 to 13 points of light and the shaded ones came up 1 to 5.
- **The one cost, written down**: the CPU drawing in `tools/draw.js` still paints the house with the varnish
  on, as it has painted the garden since v0.33.0. The start view's drawn picture is now 7 points over the
  browser's where it used to run 7 under. The measured ratios to move the ten tints by are in `NOTES.md`.

## 0.33.1 — 2026-10-16

- **The shrubs came off the varnish as soot, and are paid back a little more than the rest.** A shaded bush
  was painting (28,50,13) — a hole cut in the picture under a hedge at (27,57,9). Its diffuse lift goes
  1.3 → 1.7 and it comes out (34,63,15), with its leaves visible on it again. Measured with `tools/tint.js`
  on the south border (`pictures/477-bush-01..03.png`); 2.3 was tried too and made a shrub brighter than
  the hedge behind it, which is the wrong way round.

## 0.33.0 — 2026-10-16

- **The garden was wearing a varnish, and it was called grass.** 🌿✨➡️🌱 Every material in this library
  ships `specularIntensity` at 1, which is not the four per cent of glassiness a dielectric has but the
  whole of it — a white varnish laid over rough dry leaves. Measured on the south border, the sunlit lawn
  came out (195,217,127): a green whose red sits 22 below its green is not a green, it is mint cream, a
  sheet of shallow water over sand. That is the master's "no texture, and fully translucent", and it was
  never translucency — a white glare sits in front of the pattern and the eye reads the glare first.
- **Fifteen surfaces had the varnish taken off and their colour paid back.** `matte()` in `src/materials.js`
  cuts the sheen to 0.25 and lifts the material's own colour to pay for what the glare was carrying: the
  lawn and the standing grass ×1.8, the hedge, the bushes, both ranks of jungle, banana leaves, fronds and
  stalks ×1.3, the palm bark, the laterite and the potting soil and the far tree line unlifted. The lawn is
  (137,172,80) now — green standing 35 above red, with its mown bands and its two swards visible for the
  first time — and the dirt beds stopped being salmon paper and became laterite (169,121,78).
- **The boulders were four cream eggs and are granite now.** (198,175,136) on a sunlit boulder is not
  stone; the boulders and the terracotta pots went through the same knob at ×1.25, and unglazed clay is a
  dry matte thing which now looks like one.
- **`usePhysicalLightingMode` is gone out of `pbr()`, because it is a wish and not a setting.** Switching it
  off on all fifteen surfaces moved no pixel whatever across an 880-point browser grid, so everything here
  has always been shaded one way and only `specularIntensity` was ever at stake.
- **Left undone on purpose:** the house. `teakWall`, `plaster`, `coping`, `paver` and `roof` carry the same
  varnish, and the start view now sets an honest garden in front of a house of painted foam. Measured and
  written down for the next session rather than bundled in here, because a hundred fitted tints were fitted
  with the varnish in them and moving garden and house at once would not say which moved what.
- **Cost: none you can see, and none you can hear.** No geometry, no meshes, no loads — one material knob.
  `tools/feet.js` still says 45 floors, 89 blockers and 81.8% of the garden reachable; `tools/planted.js`
  0 clumps rooted in built stone; `tools/sheets.js` clean.
- **Looked at, in a real browser, on all seventeen standing views**: nothing black, nothing blown, and past
  L230 down to 0.0% of the frame on fifteen of the seventeen (`rearup` keeps 0.4% and the pool 2.5%, where
  it is the sky and the water that are bright, not a surface).

## 0.32.0 — 2026-10-15

- **The shrubs are bushes now, and not striped green loaves.** Each one was four bare spheres wearing the
  boundary hedge's leaf pattern, and a picture showed two faults in that: the hedge's pattern is a metre
  and a tenth to a repeat, which on a bush a metre across wraps round the sphere as the stripes on a
  watermelon, and four spheres make a smooth round outline where a bush has a ragged one. A bush is
  twelve squashed lumps now — a heart and eleven laid in a spiral over the crown and down the flanks —
  wearing a pattern of its own, `bushCanvas`: 420 small leaves laid over one another at 44 cm of bush to
  a repeat, thumb-width, with the same canvas sent back as relief at 0.3 so each leaf throws its own
  shade. Cards of leaves stuck on the outside of a ball were tried first and are worse: they float off the
  skin like a dandelion gone to seed.
- **The banana plants are plants.** They were five thin sticks with a flat green disc nailed to the top of
  each, which a picture turned into a row of little tables. A clump is two or three pseudostems of
  different ages now — the tall one 1.9-2.4 m, a young one coming up at the side — in a pattern of its
  own (`stalkCanvas`: green sheaths laid one beside the next, with the maroon flush), and each crown
  carries nine leaves on stalks. Every leaf is four cards laid end to end and **hinged**, each turned a
  little further down than the last, and every leaf is **rolled 26-49° on its stalk**: laid flat a leaf is
  invisible from a person's height and reads as a line drawn in the air. One maroon bud hangs under each
  tall crown, which is how you know it is a banana and not a palm.
- **The potted plants stopped being green table tops**, which is what the same flat-disc fault made of
  them; a pot now holds a little bush of the same leaf-skinned lumps, wider than its rim.
- **Two new surfaces, and both are known to the CPU drawing**: `bush` and `stalk` in
  `src/surface-colours.js`. The bush tint is measured, not guessed — the browser paints a sunlit bush at
  (86,117,25) against the hedge beside it at (134,182,51), so a bush is a darker green than a hedge and
  the tint keeps that ratio — and its `glow` is what the material's emissive actually adds once its own
  pattern is multiplied in, so `tools/sheets.js` no longer has a complaint about it.
- **`tools/planted.js` was crying wolf, and is fixed.** It read each plant's place off `mesh.position`, and
  a plant folded into one mesh carries its place in its geometry and leaves `position` at the origin: it
  reported a shrub and a banana standing at x=0, z=0 — the middle of the teak terrace. It reads the middle
  of each mesh's own world box now, and says **0 clumps rooted in built stone**.
- **Cost: fewer draws, more triangles.** The browser went from 766 meshes to **560**, because a bush is one
  merged mesh and a banana two instead of ten; the drawn `grass` view went from 124,069 faces toward the
  eye to 195,401, which is what the leaf cards cost. Frame rate could not be told from its own noise (2.2
  and 2.3 fps against the thirty-fourth session's 1.6-3.7 band). The walk is untouched — `tools/feet.js`
  still says 45 floors, 89 blockers and **81.8%** of the garden reachable from the start, and nothing here
  is solid.
- **Looked at, in a real browser, on all seventeen standing views** (nothing black, nothing blown), plus
  `tools/planted.js`, `tools/feet.js`, `tools/sheets.js` and `tools/draw.js` clean.

## 0.31.0 — 2026-10-15

- **The jungle behind the hedge is a canopy now, and not a row of green eggs.** Each ring point used to
  carry one ball — 5-11 m across and up to 17 m tall, standing 3 m behind a 2 m hedge. At forty metres one
  of those is a fifth of the frame, it lights one flank and goes to soot across one hard line, and every
  one of them has that line in the same place. Each ring point now carries a **clump**: one big crown and
  three to five lesser ones leaning against it, 4.5-8 m across in the near rank and 6-11 m in the far one,
  domes rather than balls, so the sun has a top to light instead of a flank. On the west view the tree
  line now steps more than eight pixels **65 times** across the frame where it stepped 47, and on the
  start view 83 times where it stepped 67.
- **The far tree line shrank to its size**: 52 crowns of 16-34 m at 110-150 m became **96 crowns of 9-17
  m**, their heights wandering so the band has tall stands and short ones. It is the same green at the same
  share of the west view (104,116,117, 4.5%) and ten times less of it is one lump.
- **The belt wears a canopy pattern of its own** — `canopyCanvas`: hollows between trees, one tree's head,
  the glitter of leaf mass, laid at **2.4 m to a repeat on the near rank and 4 m on the far one**. It was
  wearing the boundary hedge's leaf before, stretched over a crown until nothing of it was left: the first
  try here laid it once to a crown and deepened its hollows, and `tools/compare.js` said the picture was
  the same picture to 0.0 of a channel.
- **The haze ladder is a ladder now.** Measured with `tools/cover.js` on one camera, luminance and
  red-minus-blue: hedge (72,111,33) L96/+39, near rank (72,103,52) L85/+20 at 41 m, far rank **(107,120,96)
  L112/+11** at 84 m, tree line (104,116,117) L110/−13 at 127 m. Each step is lighter, bluer and flatter
  than the one in front of it, which is what haze does; the far rank used to be (94,114,76)/+18, a green as
  strong as the hedge's standing twice as far off.
- **Cost:** meshes unchanged at 711 in the drawing and 766 in the browser, because each rank is folded
  into one mesh; triangles turned toward the eye on the west view 93,425 → 126,229, paid for partly by
  building crowns on four segments instead of six. The frame rate could not be told apart from its own
  noise across three runs (4.7/3.7, 1.6/3.6, 2.0/2.1 fps against the released v0.30.0). Nothing went black
  and nothing blew out in any of the seventeen standing views; the views whose horizon is big came up 4-21
  points of light and lost 2-7 points of "in colour", which is the distance going towards the sky's.

## 0.30.0 — 2026-10-15

- **The store room's own face has a band of lit glass in it.** The back of that room was 3.2 x 3.4 m of bare
  cement — the last flat surface on the Villa — and it reads L39-60 because a north face never sees this
  sun, so no lamp outside could ever have lit it honestly. What it has now is a window: 2.0 x 0.38 m set
  high in the wall, boarded with teak sill, head, jambs and one mullion, two panes sitting 6 cm deep in the
  reveal, and a ledge on the sill facing the lawn. Measured from 5.9 m out: **the panes L112 and L155,
  warm, against the wall's L80-93**; from the new standing camera, the band L110 over a face at L39.
- **A small lamp stands behind the east pane**, on the shelf, and it is worth 17 points on each pane. My
  first fill was a cool sky-coloured light and it painted the glass grey-blue — (56,60,59) — which is fog in
  a frame, not a room; the glass only reads as a room when what shines out of it is warm.
- **The store room got the ceiling it never had.** Its lining had four walls and a floor and no top, and
  once there was a hole to look through, rays going up through it left the building.
- **A seventeenth standing camera, `backstore`**, because none of the sixteen could see the thing: from
  `rear` the whole store face falls off the right edge of the picture.
- **The sixteen views a visitor already walks in did not move** — `tools/scan_old_new.js 130 177` prints +0
  luminance on every one; the front's doorway through the glass went L131 → L137. Against the released
  v0.29.0 at the new camera, `tools/diffgrid.js` puts all 2.7% of changed pixels on the band and its boards.
- **Cost:** 16 meshes, one more point light kept to the store's own meshes, and the walk going from 44
  floors and 87 blockers to 45 and 89 — the new ones are the window's own sill and head boards, 2.9 m up and
  out of anyone's reach; reachable ground stays at 81.8%. The wall-with-holes helper moved into
  `src/mesh.js`, so the doorway in the back wall and this window are now cut by one piece of code.

## 0.29.0 — 2026-10-15

- **The back wall has a doorway, and there is a lit store room behind it.** The lump of cement that used to
  sit behind the living hall is a room now — 2.5 x 1.7 m, plastered, floored in teak, with a jar, a crate
  and a shelf — and the wall has a 1.4 x 2.35 m hole cut through it, reveal and all, so the front of glass
  is no longer a sheet you look at but a wall you look *into*. Measured through the glass from where a
  visitor starts: the lit plaster **L146 to L157** and the lantern **L188**, against the room's dark back
  plaster at L82 and the sunlit coping at L211; the jar and the crate stand at L73, silhouetted.
- **The lamp hangs in the middle of the room, and that was the bigger half of it.** A case high on the wall
  lit a patch of plaster at L180 and left the bottom of the doorway at L87 — darker than the glass beside
  it — because a point light here falls as 1/(d²+1) and a wall case stands 2 m from everything that
  matters. A lantern on a rod, mid-room, puts every surface between 0.4 m and 2.2 m of it.
- **The rear elevation did not move: cell for cell the same picture** (`979-rear` against `1113-rear`),
  because the room's outside is the box the service block always was, to the centimetre, and it stands on
  its own plinth now instead of hanging over the lawn. Nothing can be walked into: the store's floor sits
  behind the terrace's invisible back blocker, and a visitor on the back lawn is stopped 1.5 m short of it.
- **Cost:** 19 meshes, one point light kept to the store's own meshes (as the room's four and the pool's
  four are kept to theirs), the walk unchanged at 44 floors and 87 blockers, and the start view 0.2 of a
  channel over the frame — this is a glimpse through a doorway, not a subject, and it is measured as one
  with the new `tools/diffgrid.js`.

## 0.28.1 — 2026-10-15

- **Nothing moves in this version; three comments were lying, and a released file must not contain a
  claim that is not true.** The released `src/garden.js` still said the pool court "is stone from x = -15
  to -5.4 and from 5.4 to 15", which was the plan the session before last; its fringe note said the court's
  outer joins are sixty-five metres of ruled line, where the six joins that are actually laid measure
  fifty-six (18 m down each side, 6.45 m across each south end, 3.5 m at each north end, and the number now
  sits beside them). Two notes sent readers to `courtBeds` in `src/world.js`, which is now `src/court.js`. Measured: the start view is
  the same picture it was, 0.0 of a channel over the frame, L136 against L137.

## 0.28.0 — 2026-10-15

- **The pool court gave 111.3 m² of its cut stone back to the lawn.** Its two outer edges had stood at
  x = ±15 for no reason anyone could name, which made a 30 m apron of paving round a 10 x 5 m pool:
  photographed straight down from 26 m, the paving was 38% of the frame and the grass 24%. They stand at
  x = ±11.9 now, and the same camera reads **paver 25.9%, lawn 34.4%** and standing grass 3.8% where it
  read 1.9%. The water lies in a garden with stone around it instead of the stone lying around it, and
  there is still 4.15 m of free stone outside each planting border — room to lay a sunbed and walk behind
  it — and a metre between the coping and the dirt, so the pool can still be walked all the way round.
- **Five things moved with the edge, and one of them was standing on nothing.** The railing along the
  west deck's south edge hung at z = 15.9 while the stone stopped at 15.8, so every post had its foot
  14 cm above the grass; it is at 15.7 now, on the stone (`ground.heightAt` says 0.140 under it), shortened
  from 8 posts over 8.9 m to 6 over 5.7 m. The two outer lamps came in from ±13.2 to ±11.1 so they stand
  on stone and not sunk in grass; the west sunbed came from -11.3 to -10.9, because at -11.3 there was
  0.27 m of stone between its frame and the kerb and grass past that, where now there is 0.67 m to walk
  behind it; and the six grass fringes that had been laid along the old
  line now read the edge from the plan, with two fresh scatters laid through the new strips. The sala's
  east base, which used to be set in paving, stands in grass.
- **The sixteen standing views, told honestly.** Fifteen of sixteen keep their luminance to a point
  (salaroof −2); in colour is up or flat on all sixteen and never down; nothing black anywhere and nothing
  blown. Where stone turned to grass the frame keeps more colour — westlawn's lit band `s87 → s96` and its
  frame 92.3% → 92.7% in colour, salaroof `s82 → s94`. But **the start view did not move at all**, cell for
  cell: a standing frame reaches the ground only 4.2 m ahead and the edges that changed are 6 to 10 m off
  that line. It is the lawn views and any view from above that got greener; the start view was never going
  to, and that is written down rather than glossed.
- **The plan of the court is one file now, `src/court.js`** — `courtEdge`, `pavedGround`, `courtBeds`,
  `bedTop`, `bedTone` — because four readers had started to disagree about where the stone is:
  `src/paving.js` was averaging the stone's tone over a rectangle out to ±15.2, three metres of which is
  lawn now, and the fringes were laid to a number the paving had outgrown. The tone is re-measured over the
  real paved rects: mean exactly 1.0000 per channel, range 0.856–1.293.
- **Two faults closed by measuring instead of doing.** That the unmerged shrubs were "costing frames" was
  weighed: v0.24.0 with 669 meshes draws 4.7 fps, v0.27.0 with 732 draws 4.8, and this 4.8 — mesh count is
  not what binds this renderer, so the merges were left undone rather than done for a number that is not
  there. And the steep 0.55 teak bump feared for the uprights turns out to sit on exactly one mesh, the
  back door: the posts, mullions and eave boards wear `mats.teakWall`, which has no bump map at all.
- **The CPU drawing was told about the borders' dirt** (`broad: "bed"`, with `bedTone` answering one
  outside the beds so the laterite at the foot of the house is left alone). Worth measuring rather than
  claiming: 26,922 pixels of the `west` drawing move — the dirt's own 2.9% of the frame — by at most 6
  summed channels, because the tone is only ±3%.
- The walk is the walk: 730 meshes, 41 floors, 83 blockers, **81.8% of the garden reachable** from the
  start (it was 81.7% — there is more lawn to walk on), the same ten stumbles as before and no new one,
  no plant rooted in built stone and no blade of grass growing out of paving.

## 0.27.0 — 2026-10-15

- **The pool court stopped being all stone.** It was some 440 m² of cut paving laid round a 10 x 5 m pool —
  photographed straight down, two thirds of its width was stone — and the garden only ever grew outside it.
  Three beds of dirt are cut out of the paving now, one along each long side of the water and the east one
  split by a stone landing so you come down off the sala's steps onto stone: 24.8 m² given back, a metre of
  stone kept between the coping and the dirt so the pool can still be walked all the way round. The dirt
  stands 9.5 cm under the top of the paving, so the stone's cut edge shows as a curb; it is planted with
  eight shrubs, a banana at the outer end of each side, and grass at the seam and through the planting.
  Measured in Chromium from the west paving: stone 27.6% of the frame → 7.6%, and in its place hedge
  5.2% → 16.8%, banana leaf 0.2% → 5.2%, grass 2.1% → 4.7% and the dirt itself 2.4% at (172,112,63). From
  where a visitor starts the change is small (hedge 2.1% → 4.0%) and the reason is written down: the ground
  that frame can see is the water and the coping, and nothing nearer than 4.2 m shows at ground level.
  All sixteen standing views re-photographed: nothing black, nothing blown, colour up or flat on every one,
  light down only where stone left (west −10, sala −4, the rest −1 or 0).
- **Two faults found while doing it.** Two garden lamps were standing on the teak terrace — their spots were
  at (±6.4, −0.6) and the terrace's face is at z = 0.7, so both posts came up through the boards a visitor
  walks on; they stand in the dirt at the head of each border now. And a pot put on the landing in front of
  the sala's steps walled the sala in: its invisible wall closed the gap between the sala's two face-blocks,
  `feet.js` fell to 81.4% reachable and named the sala's floor as ground you cannot get to. The three pots
  now flank the walkway that comes down from the terrace steps.
- **The paving had to be rebuilt to be cut.** Each side of the court is now built as the pieces that are
  left after its beds are taken out — `stoneLeft()` answers a deck rectangle and its holes — so the deck
  went from 4 slabs to 11 and the pattern and the dust and damp still run straight across the joins, because
  both are asked in metres of ground. The walk is the walk: 81.7% of the garden reachable from the start,
  83 blockers, and no unreachable ground named in the court.
- **`tools/fps.js` is new**: the notes have quoted a frame rate since the twelfth session without anything
  here being able to measure one. Same browser at 1280 x 720: v0.26.0 draws 5.0 frames a second and this
  4.5–4.8, because the shrubs are four spheres each and the bananas ten, unmerged — 52 of the 63 new meshes.

## 0.26.0 — 2026-10-15

- **Back-lit foliage has its colour back.** Every leaf in the Villa was lit by the normal of the side it
  was *not* seen from, and half of every clump of standing grass was not drawn at all. Two switches on
  their materials were wrong, and the one line that looked like the fix — `doubleSided = true` — does
  nothing on this library's PBR material: it reads back what you wrote and changes no pixel.
- **What a visitor sees.** On the south-border view, looking due south into the low sun: palm fronds
  (132,141,99) → **(42,103,35)**, their brightest pixel in that frame from white (254,242,221) to
  (157,206,226); a banana clump (153,194,103) → **(120,177,84)** with its channel spread running from
  22,26,21 to 56,51,40; the grass clumps (161,181,92) → **(129,151,64)**. Sixteen standing cameras: frame
  light −9 to +1, all of it where there are trees, **in colour flat to up and never down**, nothing black
  and nothing newly blown anywhere. A frame full of back-lit leaves moves 10.1 of a channel.
- **Light through a leaf is now measured and not guessed.** The engine multiplies a material's
  `emissiveColor` by its own painted leaf pattern, which is dark — a frond's canvas carries 0.20 of green
  over the part of itself that is leaf — so the fronds and banana leaves carry (0.3,0.55,0.2) and the
  clumps (0.5,0.85,0.3), and the CPU drawing's flat `glow` for each sheet is the light that actually adds,
  read off the live page instead of copied from the material.
- **A new check, `tools/sheets.js`**, reads those switches off the Villa standing in a browser, holds the
  browser's leaf-light and the drawing's glow together, and fails if anyone anywhere assigns `doubleSided`.

## 0.25.1 — 2026-10-15

- **The grass was growing out of the paving, and no longer does.** A new check, `tools/tuftfoot.js`, asks
  the Villa's own ground about the foot of every sheet of the new standing grass, and it named **82 clumps
  standing on the pool paving** and one in a palm's ring on the east deck. The cause was my plan, not the
  engine: the paving beyond the pool is 8.6 m deep centred at z 11.9 — so it runs to z 16.2, not 13.2 — and
  the path starts *under* it, so the fringes I had laid "beside" those edges were laid on cut stone. In the
  path view that mistake filled 12.3% of the frame with grass on paving; the honest figure there is 1.6%.
- **The plan now checks itself against the ground as it is built**: `makeTuftPlan` asks `makeGround(scene)`,
  the same reader the walk uses, and throws out any clump whose foot finds more than 5 cm of built floor
  under it. The new grass stands at 491 clumps, of which none are on stone and none are in the water.
- **What a visitor sees**: sixteen standing cameras weighed against the set before this session started —
  frame light between +1 and −4 points, in colour flat to up (westwall 71.2 → 71.9, rear 86.2 → 86.7), the
  sunlit band's colour unchanged on all sixteen, nothing black and nothing newly blown anywhere.

## 0.25.0 — 2026-10-15

- **The grass now stands up instead of being painted flat.** The lawn has a good pattern but every blade in
  it lies down, which reads across the garden and reads as green gravel at your feet; and every seam where
  the garden met something built was one ruled line with nothing growing at it. There are 465 clumps of
  standing grass now — three crossed sheets each, 0.26 to 0.62 m across, some green and some gone straw —
  along the four sides of the pool court, the path through the south planting, the beds at the foot of the
  house, the two south border beds, a scatter out into the lawn beside the stone, and round the feet of
  every palm and boulder. All of it is one mesh, so it costs the browser one draw, and it throws no shadow.
  The pool's own lip is left clean.
- **The other half of what was reported — that the garden had no texture and was see-through — was already
  dead, and is now measured rather than asserted.** In Chromium the lawn answers alpha 1, no blending, a
  512 map on it, and paints (141,169,55) with a 24-point spread between two places 2 m apart. That fault
  was the ground planes being wound to face the middle of the earth, killed three sessions ago.
- **Two engine switches that were quietly doing nothing, found by measuring a clump.** `backFaceCulling =
  false` does not light the back of a cut-out sheet: half of every clump was a dark card until the library's
  own `doubleSided` was set, which also flips the normal — the same clump went from (74,88,26) to (189,205,56)
  against the lawn's (180,201,67). And the little `emissiveColor`s meant for light through a leaf are worth
  two bytes out of 255 in a scene whose sun arrives at 1.6 to 2.8 of raw light: glow has to be in tenths here.
- **What a visitor sees.** Sixteen standing cameras before and after: frame light between +1 and −6 points
  (the two views the grass fills moved most), in colour flat to up (westwall 71.2 → 71.9, rear 86.2 →
  86.7), the sunlit band's colour and spread unchanged on all sixteen, nothing black and nothing newly
  blown anywhere. A sunlit clump comes out at about two thirds of the light of the lawn beside it, which is
  what an uncut verge in a low sun does.
- Nothing else moved: 670 meshes, 30 floors, 83 blockers, no plant rooted in built stone, and every standing
  view drawn with nothing black.

## 0.24.0 — 2026-10-15

- **The sunlit half of the Villa is no longer pressed against the top of the picture.** A new eye,
  `tools/rawlight.js`, reads the light off the screen with no curve in the shader at all, and it says
  that everything the sun touches arrives at the tone curve between 1.6 and 2.8 — a factor of 1.75.
  The library's curve turned that into 245, 247, 249, 250, 251: six bytes, one sunlit surface two bytes
  under the next. Lit plaster came out (254,226,204), the cement at the foot of the deck (253,223,186),
  a big pot (253,193,167) and a teak post (252,182,143) — red at the ceiling in every case, which is
  why nothing painted on a sunlit surface could be seen. The Villa now runs a curve of its own: the
  library's shape with the number that says where the bend starts moved from 0.76 of raw light down to
  0.5. The same five surfaces come out 231, 235, 238, 240, 241, and there are 30 bytes of room between
  the sunlit lawn and a sunlit wall where the library gave them 13.
- **The desaturation was the bigger half of the cure, and it works against you if left alone.** The
  curve mixes white into a colour in proportion to how far it had to fold that colour, so a knee that
  folds everything the sun touches makes the library's rate bury the very colour the knee was moved
  for. On the colonnade, where the sunlit band is teak and glass, that band's own channel spread is 60
  as the Villa stands, **58 with the knee moved and nothing else** — worse, not better — and 86 with the
  desaturation down from 0.15 to 0.05 beside it. 0.03 was weighed (97) and refused: at that rate the few
  highlights that genuinely do go white were going orange.
- **What a visitor sees.** Sixteen standing cameras photographed before (`471-home` … `486-southborder`)
  and after (`503-home` … `518-southborder`): frame light within two points on every one of them;
  **in colour up on all sixteen** — pool 93.2% → 94.7%, west wall 69.7% → 71.2%, colonnade
  94.9% → 95.5%; the share past L240 down on all sixteen — rear corner 3.2% → 0.1%, south border
  2.4% → 0.1%, pool 4.7% → 1.1%; the deep end down everywhere, nothing blackened anywhere. The sunlit
  band keeps more colour where colour is the picture: home 75 → 85, colonnade 60 → 86, sala 94 → 101,
  path 69 → 81. The exposure went 0.72 → 0.76 to hand back what the fold takes off the sunlit half — a
  multiplier below the bend gives the shade its light back and the sunlit half, which is what was too
  bright, buys none of it.
- **Three numbers, all of them on the address bar**: `?tonemap=villa|khronos|aces|standard|lin` with
  `?knee=`, `?white=`, `?desat=`, where `khronos` is byte for byte the library's own curve, so any
  change can be weighed against what was (`tools/toneprobe.json`, `tools/tonefine.json` and
  `tools/tonefinal.json` are the ladders). The white point was weighed at 0.94, 0.96 and 1.0 and left
  where the library puts it: it barely touches the sunlit half, and what it does move is the very top,
  where a sun glint on the water has to be allowed to be white.
- **The drawing cannot drift from the picture, because both read the curve out of `src/tone.js`** — the
  shader text the browser compiles and the copy the CPU works from stand in one file. The drawing comes
  out 8 points under the browser on the start view against 7 before, so its own known shortfall (no
  ground bounce, fault 4) is untouched by this and is still why nothing may be re-coloured on its
  say-so. `tools/backlight.js`, which turns a byte a picture showed back into light, had been left
  inverting ACES at exposure 0.88 — three versions stale, so it had been quietly lying — and now
  inverts the Villa's own curve, with `--round` to prove how closely: out of four units of light it is
  wrong by at most 0.14.
- Nothing moved but the light: 669 meshes, 30 floors, 83 blockers, 81.7% of the garden reachable from
  the start, no plant rooted in built stone, no fault in `tools/standup.js`, `tools/shadows.js` or
  `tools/planted.js`, and every standing view drawn came out with nothing black and nothing blown.

## 0.23.0 — 2026-10-15

- **The room behind the glass has something to look *into* now.** A teak case stands against the back wall
between the two panels with its front left out — a shelf across the middle, a brass bowl on it, a terracotta
jar below, and a lamp shut up inside. From where a visitor starts, the dead centre of the front of the house
used to paint (95,86,69), which was the bare back wall; it now paints **(236,198,143)**, and the eye lands
there first. The rest of the view did not move: the start view is still L138 and nothing new blew out.
- **Its lamp was read off a probe, not guessed.** Three strengths were weighed in one browser: at the
strongest the plaster under the lamp came out (234,185,133) and lit the top of the case as well, which is a
lamp showing its own filament; at the middle one the lit square still stands thirteen points over the wall
beside it and nothing is blown; at the weakest it starts going grey. The middle one is what ships, and the
room's four lamps now carry their strengths as ratios of one another, so `?room=` in the url turns the room
up or down as one light.

## 0.22.1 — 2026-10-15

- **The two panels on the back wall of the room now read.** They were pale plaster on a pale plaster wall,
and measured three luminance points apart from the wall, which at fourteen metres is no shape at all.
They are dark teak in a lighter timber frame now — a dark square hung on a pale wall — and the same place
through the glass went from (104,92,72) to **(77,49,30)** where the wall behind holds (127,99,72).

## 0.22.0 — 2026-10-15

- **The room behind the front glass is a room now.** It holds a rug, a sofa with a back and arms, two
chairs, a table with a bowl and a tray, a floor lamp, two framed panels on the back wall, four beams
across the ceiling and a plant in the east corner. Before, it held a bare floor and two boxes, and the
whole front of the house came out of the browser as one warm-dark board.
- **One lamp became three, and the two dead ends woke up.** A lamp over each half of a 13 m room and a
small one in the floor lamp: measured in one browser, switching the old single lamp back on puts the west
pane at (60,60,51) where the two lamps give (80,73,59), and the east pane (66,67,55) → (80,77,61). Twice
the light was tried and refused: a room that bright through 10.8 m of glass is a shop window.
- **The furniture was being lit straight through the roof.** Anything that does not *receive* the roof's
shadow is drawn in the open sun wherever it stands, and the late sun comes over the eave and through the
glass: the new wall panels came out (254,228,178), blown white. With that put right the rug had to come
down a shade too, and the front's uprights were made to cast, so the sun patch inside is crossed by their
stripes.
- **What a visitor sees.** The view down the colonnade, where the glass matters most, went from 74.3% of
the frame in colour to 87.9%, and the front corner from 79.5% to 89.4%. One thing learned and written
down: from where you start, the room's *floor* is never visible — the sill cuts it out — so what carries
the room is its back wall, its beams and the shapes standing against them.

## 0.21.0 — 2026-10-15

- **The shrubs along the south hedge stand in earth now.** Two bands of laterite, 2.4 m wide, laid inside
  the south hedge and stopped 0.5 m short of the paved path so the walk runs out through the planting
  instead of dead-ending in dirt. Turn round from the pool and the middle distance used to be grass up to
  a hedge with eight shrubs coming up out of it out of no ground in particular; it is lawn, then earth, then
  hedge, which is three edges where there were two — the same cure the foot of the house got last session.
- **Seen properly, the band is a warm brown and not a pale strip.** From a visitor it reads (250,211,177)
  and looks like blown bone, and a probe swore the colour would not answer an albedo brought down five
  times: both were the pick ray going through the shrub leaves and painting them. From straight above,
  where nothing is between the eye and the ground, the sunlit bed is **(189,110,47)** where the lawn beside
  it is (110,191,71), and it answers its albedo normally.
- **What the pictures say.** Switched off and on in one browser, the beds take the blown end of the south
  view down — 10.7% of the frame past L230 with them against 12.1% without — and lift its mean two points;
  across the sixteen standing cameras nothing else moves at all. `tools/planted.js`: 176 plant parts
  looked at, none of them rooted in stone. The walk is untouched: 624 meshes, 30 floors, 83 blockers,
  81.7% of the garden reachable, no stumbles.
- **Refused, with the number attached:** no rings of dirt under the single isolated shrubs and bananas on
  the open lawn. A one-metre basin under one plant is under a tenth of a point of any view, and it costs
  two meshes and another edge to keep honest.

## 0.20.0 — 2026-10-15

- **The foot of the house was painted soot, and now it is a grey cement.** `plasterDark` — the base course,
  the cement on the plinth the house stands on and on the service block at the back — was bytes [86,74,62].
  Against the lime wall's [204,182,152] that is 0.42 of the bytes but only **0.157 of the light**, and at
  the bottom of the tone curve the picture is near straight through, so Chromium painted the shaded faces
  (20,22,15) to (22,27,22) where the wall two metres away painted (111,102,84). The service block alone was
  **10.2% of the rear view, flat to 3 of 255** — a black plate with nothing on it. It is [150,144,126]
  now, a grey cement cooler than the lime over it, and about two thirds of the wall's light instead of a
  quarter; `roughness` went 0.7 → 0.78, because sand and cement is not smoother than the render above it.
- **It was the albedo and nothing else, and that was proved first.** Putting the wall's own plaster on the
  plinth and the block left them at (103,93,74) and (118,109,90) against the wall's (138,125,100) — the foot
  of the house stands in about two thirds of the light the wall gets, not a fifth of it; new `tools/dump.js`
  said in one line that the sky's fill and the ground bounce exclude nothing outside the room; and switching
  the plinth's shadows off moved it by nought.
- **A base course that weathers should look it.** `plasterCanvas` takes a third argument, `spread`: how far
  its patches wander from the base colour. One is a wall freshly trowelled; the plinth, which is what the
  roof rains on and the sprinkler throws at, wears 1.35.
- **What the pictures say.** The soot bands stop being soot: the `rear` view puts **1.6% of its frame below
  L31 where it put 12.8%**, `rearup` 0.3% where it put 10.0%, `westwall` 2.9% where it put 11.0%. Luminance
  rear +4, rearup +4, westwall +7, eastlawn +5, home +2; nothing blackened anywhere and nothing new blew out
  (the start view keeps 0.8% of its frame past L230 and puts nothing pure white). The shaded faces came up
  from L21-L26 to L54-L72 and the sunlit band under the deck from (229,166,106) to (252,221,179), which is
  as bright as the coping beside it — the top of the curve has no room in it yet, so the shade was bought
  with room there, and that is written up as fault 18.
- The walk cost nothing: 622 meshes, 30 floors, 83 blockers, 81.7% of the garden reachable from the start,
  no stumbles. `tools/shadows.js`, `tools/standup.js` clean, all fifteen standing views re-drawn on the CPU
  with nothing black and nothing blown, and `tools/plinth.json` keeps the before and the after on one switch.

## 0.19.0 — 2026-10-15

- **The lawn is grass again, not a glowing sheet.** Measured twenty metres off, the sward was running from
  L44 to L228 inside a patch two metres across and its sunlit tops were hitting (233,247,78) — sparkle at
  the top of the picture, mud under it, no local colour anywhere, which is a fair thing to call
  translucent. Three faults were in it: the bump map was at level 0.5 over a flat sheet of ground, which
  took **sixteen points of light** off the garden (L126 as it was, L142 with the bump switched clean off)
  and tilted every pixel somewhere else; nothing was painted at the half-metre scale a person steps over,
  so the engine averaged 19 cm speckle into one flat acid sheet; and the pattern's own top end started at
  (180,196,84), which leaves the sun nowhere to go. The bump is now 0.25 and the hedge's was brought from
  1 to 0.3 for the same reason (four points); the grass canvas has `mixByField` — thick deep sward and
  thin strawy sward in 67 cm clumps side by side, not a gradient between them — a fine field cut to a
  quarter of its width and half its strength, blue lifted through the whole ramp and the top end stopped at
  about (150,168,84). On the lawn camera: mean (140,179,41) → (155,181,57), sparkle std 49.9 → 47.9, and
  over the west lawn from 20 m up the 1.2 m patches went from 15.6 to 18.3 of between-block warmth, so the
  garden now has patches that are different *colours* and not merely lighter and darker.
- **The house stands in ground now.** Three bands of bare laterite at the foot of the plinth — west, east
  and back, the three faces that look onto lawn; the two that look onto paving have none — laid by
  `makeEarthBed()` with their outer edge wandering on two waves so the grass ends at an edge and not a
  ruled line, wearing a new `mats.earth`. The back of the house reads plaster (133,125,106) → plinth
  (34,26,14) → earth (106,73,41) → lawn (56,99,51): three edges where there was one, and the shrubs along
  the back wall are planted in something.
- **Two knobs were measured and found to be inert**, so nobody wastes an evening on them: with
  `usePhysicalLightingMode` on, `sun.specular = black` and pulling the lawn's roughness map out both left
  the picture pixel for pixel the same. On a horizontal surface all the sparkle is the bump.
- Over the fourteen standing views nothing else in the Villa moved: luminance within ±3 (eastlawn +5),
  colour up where there is garden (westwall 61.2 → 62.3), nothing blackened, nothing new blown beyond
  rearcorner's sunlit lawn (1.9% → 3.2% past L240). `tools/standup.js`, `tools/feet.js`, `tools/shadows.js`
  clean; the CPU drawing was told about both the clumps and the earth and redrew all views with nothing
  black and no bed facing the wrong way.

## 0.18.0 — 2026-10-15

- **Every pattern is now measured in metres of surface.** A box face ran its texture from one edge of the
  face to the other, so a 14.7 m wall and a 0.3 m post each got exactly one repeat of their pattern: the
  back wall wore its plaster six metres to a repeat, the hedge twenty-three, the boundary one repeat for
  the whole forty-five metre run, and a palm trunk one for four. A material can now be told how big one
  repeat of its pattern is in the world (`pattern:` in `materials.js`), and every box, sheet and cylinder
  built wearing it is given texture coordinates measured in metres — so plaster is 1.2 m to a repeat, the
  coping one stone to 0.5 m, the pool mosaic 0.8 m, the hedge and the jungle about 1 m, the timber 0.9 m,
  a palm's rings 0.45 m. Measured over the standing Villa with `node tools/pitch.js`, which answers how
  many metres one repeat covers on every face in the scene.
- **The coping is stones again.** One stone to a repeat with its joint at the edge, plus weather on a 2 m
  scale, grain and flecks. In the start view a strip across the near coping went from 2.7 to 6.3 of
  between-block brightness spread, and its darkest block from 181 to 160: the joints are seen.
- **Two tries at strengthening the plaster sweeps were refused by the numbers** and put back: deepening the
  sweeps evenly cost the shaded faces two points of colour, and deepening them more on the red than the
  blue cost twenty — the west wall in its own shade fell from 61.9% of its frame in colour to 43.8% —
  because a plaster wall's colour IS its warmth. The reason the wall reads flat in shade is the sun's
  ceiling and the fill (faults 1 and 16), not the paint.
- Over the fourteen standing views the whole-frame measures held: luminance within one, colour within
  0.9 of a point, nothing new blown out or blackened. `node tools/standup.js`, `tools/feet.js`,
  `tools/shadows.js` clean; the browserless drawing redrew all fourteen standing views with nothing black and
  nothing blown out except `rearup`, where the drawing blows the roof to 1.1% and the browser pictures 0.1%.

## 0.17.0 — 2026-10-15

- **The front of glass is a window now.** It is the biggest thing between a visitor and the house — 9% of
  the start view — and until now it showed a room that could not exist: the room had never once had the lamp
  the code claimed to give it (a guard on a Babylon static that is not in the vendored library, so the
  light was never built at all), the sky's fill and the ground bounce were lighting it through its own roof,
  its ceiling stood above the roof's soffit where nothing could ever be drawn from it, and the service block
  poked 0.3 m into it, where an outdoor lamp made that face the brightest thing in the whole front at
  (239,174,114) — brighter than sunlit teak outside at (188,125,86). The room is lined with its own plaster
  on the three solid walls and the ceiling, kept off the two fill lamps, lit by one real warm lamp dialed
  from the url with `?room=`, and the block stands behind the back wall now. In the start view the panes
  read (121,90,63) low, (96,87,70) at eye height and (59,59,51) at the west end; with the lamp off they were
  (46,57,53) and (41,51,47) — a dark green board.
- **The glass stopped being two thirds glass.** At alpha 0.36 the sheet laid its own green over everything
  behind it, which is not what glass of that thickness does: it mirrors about a sixth and lets the rest
  through. At 0.16 the same three places in the front come out ten to fifteen points brighter and warmer,
  and every standing view that has glass in it keeps MORE colour than it did — colonnade 69.1% → 76.2%,
  frontcorner 75.4 → 81.1, westwall 58.4 → 61.9, home 91.4 → 93.0 — with luminance flat to +3 and nothing
  blowing out or blacking out anywhere. The glass band in the colonnade view runs from (48,48,38) to
  (254,227,200), so it has a full range in it and is not a dead sheet.
- **The CPU drawing was caught lying about the front, and is a little less lying.** It lit its glass like a
  pale matte wall — the sun had been cut to a tenth for glass, the sky's fill and the bounce never had — and
  it had nothing behind the glass to show, falling back to a dark grey nothing for the room's plaster. Glass
  now keeps a twentieth of that fill, and `src/surface-colours.js` carries the room's plaster, set by putting
  the drawing's eye inside the room against the browser's own (110,95,67). And `tools/draw.js` prints each
  surface kind's own share, mean colour, spread and extremes — the very numbers `tools/cover.js` prints for
  a browser picture — so the two eyes are weighed material against material: on the start view the browser
  paints glass at 8.9% of the frame at (103,96,79) and the drawing paints it at 8.9%, (102,99,78).
- **`tools/roomprobe.json` is the front's regression test**, and it is built the way the lawn, the paving,
  the teak and the props' probes are: the same places asked twice, once as built and once with each old
  fault put back on its own — the ceiling hoisted over the soffit, the block let into the room, the lamp
  switched off — which is how each of those was measured rather than believed (the block was worth 95 points
  of light on one pick). `tools/roomlamp.json` is the lamp ladder, eye inside the room.
- The room is 13 meshes where the house had none indoors: 620 meshes, 6 lights, 49 textures. The walk is the
  same walk — 30 floors, 83 blockers, 81.7% of the garden reachable from the start, no place where the
  ground jumps, no fault in `tools/standup.js` or `tools/shadows.js`.

## 0.16.0 — 2026-10-15

- **The sala floor has a weather of its own.** Its tone used to come out one number (1.00, 1.00, 0.99): every
  weathering in `src/teak.js` is terrace weather — the drip follows the house's eave, the walked lanes are the
  terrace's — and a sala is roofed on all four sides, so nothing reached it. Now rain blown in under the eave
  wets a ring a metre inside the windward edges (the south and the west, since the monsoon blows up the Gulf
  from the south-west), silvering those boards and darkening them, and the one line from the steps to the
  seats comes back worn and warm. The floor's tone now ranges 0.75-1.17 across itself against the terrace's
  0.68-1.18, and the windward edge reads 220,132,65 where flat it reads 232,137,69 — twelve points of red
  where it used to lose none. The whole floor keeps its average, so it did not get darker or lighter.
- **The pool was given a real lit surface, measured, and refused.** The painted sheet (`disableLighting`) was
  tried as a body of turquoise under a lit skin with waves in its bump map, so the sun and sky could come off
  it. In Chromium it was duller and dimmer — the pool fell from L156 to L146 and lost green in the middle of
  the frame — because a pool mirrors about two per cent at the angles it is looked at, so the sky came back as
  a pale wash over the whole basin and the sun came back as one line and nowhere else. Numbers in the comment
  over `mats.water`, and the pool is as it was.

## 0.15.0 — 2026-10-15

- **The furniture, the pots and the boulders stop being flat colour.** Four materials in the Villa were one
  flat byte each from end to end — the furniture timber (sunbed frames, deck chairs, the bench, the
  railing, the table tops, 56 meshes), terracotta (45), stone (10) and the soil in the pots (3). Each now
  wears a painted pattern of its own: outdoor timber silvered grey where the weather gets at it and dark
  and oily where it does not, with grain and a knot or two; a wheel-thrown pot with its kiln patches, its
  wheel rings, a pale mineral crust high up and a damp foot; granite with fist-sized masses, quartz veins
  and the salt and pepper of mica and feldspar under a grey-green lichen; and potting soil with crumbs,
  grit and perlite in it.
- **The big things come first, and that was the finding.** The first cut of these patterns was all grain and
  grit and no weather, and it simply vanished — the engine shrinks a fine pattern to a mip of its own
  average long before the chair is far off, so the same sunlit chair seat came out the same colour with
  the pattern and without it. Rebuilt with weather blotches a hand-span and bigger, it shows: over blocks
  of one material the light spread between them goes from 10.5 to 17.6 on the pot and from 8.5 to 10.2 on
  the rail, and the rail top's own colour went from (236,145,71) to (229,151,84) — weathered grey and not
  varnish.
- **The same colour, spread about and not replaced.** The middle of every pattern is the byte the material
  used to be painted, so nothing got brighter: on the four close-up views the whole-picture means sit
  within 2 points of v0.14.0, and at 15 m the same place on a pot reads (250,174,132) against (250,173,133).
  Only the granite needed paying: its middle went up eight bytes to hand back five points of light the
  tone curve was taking. All fourteen standing views came out at the same luminance to the point, nothing
  blew out or blacked out, and the drawn views came out a shade closer to the browser where the props show
  (the west view 14 points under, now 9).
- **New eyes for small things**: `tools/propprobe.json` asks four close cameras twice, once as built and
  once with these patterns forced back to flat; `tools/propshots.sh` photographs those cameras of the
  working tree or of any release; and `tools/lights.js` takes `--url`, so a released copy can be weighed
  against the working tree with the same probes.
- The walk is untouched: 607 meshes, 30 floors, 83 blockers, 81.7% of the garden reachable from the start,
  no stumbles, and the same three frames a second at 1280 x 720 in software WebGL as v0.14.0.

## 0.14.0 — 2026-10-15

- **The teak floors stop being a printed thing.** The terrace deck (16.2 x 4.4 m) and the sala floor (4 x 4 m)
  wore one board pattern in one tone from end to end. `src/teak.js` now gives them weather: boards silver to
  a silvery grey where the sun and the monsoon get at them, honey-brown where a roof shelters them, a dark
  broken band a metre out from where the main roof lets go of its rain, and darker worn lanes where feet go
  in from the steps and along the glass. Each floor keeps its own colour average, so the weather moves
  colour about inside a floor instead of dimming the other one. Measured in the browser: the walked lane and
  the drip band, 0.8 m apart under one roof, come out (215,129,69) and (186,108,46) where the floor used to
  be one flat colour everywhere.
- **The deck's bump map was throwing light away**, and is now gentle where it was only glittering: two
  places 2 m apart on the sunlit deck used to read (219,144,93) and (107,64,21) from above, whole stretches
  of boards tilting away from a low sun. Close to a person the relief stays; beyond, the deck keeps its
  light.
- **The garden is planted in soil again.** Fifteen clumps of palms, shrubs, bananas and rocks were standing
  on the pool paving, the terrace and the sala floor; they are in the beds and the lawn now, and
  `tools/planted.js` names any plant whose feet are on built stone so it stays fixed. The four standing
  views that moved, moved 3-5 points of light with more sun where the plants came off the stone.

## 0.13.0 — 2026-10-15

- **The pool deck stops being a printed thing.** The paving is one pattern of stone slabs three metres
  and a tenth across, laid again over about four hundred square metres, so every slab in the first tile
  is the twin of the slab in the thirteenth. `src/paving.js` now gives the deck broad tones of its own,
  asked in metres of ground and carried at the deck's corners the way the lawn's are: dust drifts ten
  metres across with a crust of dust a couple of metres across on top (pale, warm, the blue taken out), a
  band of damp stone along the coping where every swimmer tracks water out (darker, cooler, out over
  about two metres), and a little wear of light and dark for where the stone has been walked. All of it
  averaged back to one across the paved ground, so this is a redistribution of the deck's colour and not
  a repaint of it.
- **Measured on the screen.** `tools/paverprobe.json` asks thirteen paving places twice, once as built and
  once with the deck's vertex colours forced back to one: the dry places move by up to (+20, +10, −6) of a
  channel and the damp ones by (−8, −5, 0), while the hedge, sky, water, teak and coping in the same two
  runs move by nought or one, which is the control. `tools/cover.js` on the `west` view: the paving's own
  colour spread (`runs`) goes from 35,30,26 to 41,34,29 while its mean only moves from (205,169,129) to
  (208,172,131). Straight down over the west deck the warmth between one-metre blocks — red minus blue,
  one number — runs from a standard deviation of 13.3 to 14.5 and its range widens from 34-91 to 34-98,
  while the mean light falls two points. All fourteen standing views came out within one point of the last
  release's luminance, nothing blew out and nothing blacked out anywhere.
- **The deck had to be built over to carry it.** A box has four corners to a face, so a tone could only
  vary at the four ends of a ninety-square-metre strip: `slab()` in `src/mesh.js` is new — a top cornered
  up into squares one metre apart (about eight hundred corners over the whole deck) and four sides wound
  to face out. The sides were checked with a pick and not with hope: standing on the lawn the west face is
  named at (−15, 0.08, 6.8) and comes out (33,31,22) in its own shade. The slab pattern also wraps over
  the deck's edge now instead of restarting on each face of a box. Nothing else moved: 607 meshes, 30
  floors, 83 blockers, 81.8% of the garden reachable from the start, no stumbles, five frames a second at
  1280 x 720 in software WebGL — the same as v0.12.0.
- **Two faults made on the way, both worth the remembering.** The first tone divided its noise field about
  a hand-picked middle, and the deck moved by a point or two of a channel, which is nothing to see: the
  cut between dust and not-dust is now taken at the deck's own median and eighty-eighth percentile, so the
  field makes half dry stone, an eighth dusty and a graded band between — patches with edges. And the
  first seed left the west deck 3.4 per cent up in the red and the walkway 5.9 per cent under, which is a
  warm deck beside a cool one and not dust: the seed now stands chosen, and no strip sits more than 3.0
  per cent off the whole paving's colour.
- **Tools, and the drawing kept honest.** `--patch` in `tools/pixels.js` prints the warmth of every block
  (red minus blue), which is the only way found so far to tell a change of colour from a change of light;
  `tools/paverprobe.json` is the paving's regression test; and `tools/cover.js` takes a url as its first
  argument, which is how a released copy was measured against the working tree for the numbers above.
  `tools/draw.js` multiplies the same field in (`broad: "paver"`): its own patch spread over the paving
  went from r 27.3 to 28.6 and its warmth spread from 14.7 to 17.7, so a drawn deck cannot be flatter than
  the built one.

## 0.12.0 — 2026-10-15

- **The garden stops being a printed thing.** The lawn is one six-metre tile of grass laid again and again
  across forty metres of garden, so every patch came out the same green and every mown band landed in the
  same place twice: measured straight down at the west lawn, a one-metre patch differed from its neighbour
  by 7.5 of red, and the lawn lined up with a shifted copy of itself at r = 0.52 at six metres, which is
  the tile showing itself. `src/lawn.js` now lays two fields over the garden in metres of ground — how
  parched or lush the grass is there, and how thick the sward — and they go in at the lawn's own corners,
  where the engine multiplies them into the grass in light. One metre patch now differs from another by
  15.0 of red, the six-metre repeat is down to r = 0.44, and the mown bands wander a metre and a half off
  their grid instead of ruling the garden straight for sixty metres.
- **Which colour, and why that one.** Dry Thai lawn in the hot months is pale, not dark, so the green
  channel — four fifths of the light in grass — is left nearly alone and the dryness moves red and blue:
  up to a third less blue and a fifth more red at the driest places, with about two places in five coming
  out dry and a little light and dark on top for where the sward is thick and where it has been walked
  thin. All of it is averaged back to one across the garden, so this is a redistribution of the garden's
  colour and not a repaint: over the west lawn the mean moved from (115,168,43) to (117,161,37).
- **It was measured on the screen and not in the code.** `tools/lawnprobe.json` asks the same twenty-four
  places twice, once as built and once with the lawn's vertex colours forced back to one: the twelve grass
  places move by (r +2.3, g −7.7, b −6.3) on average and by up to 15 of a channel, and the twelve paving
  and water places by nought or one, which is the control. All fourteen standing views came out within one
  point of luminance of the last release's, none blew out or blacked out, and the lawn-heavy ones gained
  colour spread (eastlawn 123 → 124, rearcorner 81 → 82).
- **The lawn is cornered up two metres across to carry this** — eighteen thousand corners where it had
  eight — and nothing changed that anyone can see or feel: five frames a second at 1280 x 720 in software
  WebGL, the same as the last release, and the same walk (607 meshes, 30 floors, 83 blockers, 81.8% of the
  garden reachable from the start, no stumbles).
- **New eyes, and the CPU drawing kept honest.** `tools/pixels.js` gained `--patch` (how much a stretch of
  ground differs from one part of itself to another) and `--repeat` (whether it repeats at all), and
  `tools/cover.js` now prints `runs`, each material's own colour spread in one number. `tools/draw.js`
  multiplies the same two fields in at every pixel it shades — its own patch spread over the test window
  went from 6.1 of red to 11.2 — so a drawn garden cannot be flatter than the built one. Where that left
  the drawing's known shortfall against the browser, and what is still left of the six-metre tile, is in
  `NOTES.md`.

## 0.11.0 — 2026-10-15

- **The Villa is in colour, and the fault was never the sun.** The light was being squeezed through the
  ACES tone curve, which fits every colour channel apart and ends at white, so the brighter a surface
  was the paler it went: sunlit teak, sunlit plaster and potting soil all arrived at the same pale sand,
  4.5% of the start view was past L230 and the coping had a pixel at the ceiling. The Villa now runs on
  the library's Khronos PBR Neutral curve, which leaves dim light on a straight line and bends only the
  top over — and bends the whole colour, not one channel at a time, so a lit surface keeps its hue. Same
  lamp, same surfaces: on the standing start view, L140 against L143, 96.3% of the frame in colour
  against 90.9%, and its sunlit band keeps 75 of channel spread against 47 — `node tools/scan_old_new.js
  084 098` prints all of that. A `tools/lights.js` pick on the front post went from (250,216,161) to
  (252,182,143): red-brown timber. The exposure came down from 0.88 to 0.72 to pay for the new curve,
  which is brighter through the middle.
- **Every one of the fourteen standing views came up in colour**, some of them dramatically: the pool view
  from 62.7% of the frame in colour to 93.2%, the sala 81% to 95.6%, the rear corner 71% to 88%, the sala
  roof 76% to 94%. Nothing blew out or blacks out anywhere, and no view moved more than six points of
  luminance.
- **The deep shade came up with it, which three sessions of fill light was not doing.** The ACES curve was
  crushing the top and lifting the bottom towards it at the same time: the north face of the house now
  keeps 11.8% of its frame below L31 where it kept 24.1%, the west wall 12.0% where it kept 18.4%, and
  both gained colour as they came up (the west wall 50.5% to 63.9%).
- **A pull on the bright end alone was tried first and refused**: it is a dimmer and not a shoulder. The
  library's colour curves, keyed on how bright a pixel already is, took the sunlit band of the start view
  down to (208,204,194) with 14 of spread — colour gone, because the merely bright pixels get pulled in
  among the ones that were over the top. It stays as `?shoulder=` so nobody rediscovers it.
- **The CPU drawing was given the same curve** so it does not lie about the Villa it draws, and it came out
  a shade closer to the browser than it was (4 to 29 points under in the sunlit views, 15 to 24 over in
  the shaded ones). Every `tools/lights.js` run and `tools/scan_old_new.js` now weigh the sunlit band on
  its own — how much of the frame is past L200 and L230, how much is at the ceiling, and what colour and
  spread the lit band keeps — which is how a change that opens the top of a picture is told from one that
  merely darkens it.
- The far distance is unchanged to three points (a hill (129,138,142) → (126,136,140), the tree line
  (120,133,131) → (117,131,129)), so the haze ladder the last session set still stands. The walk is the
  same walk: 607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable from the start, no
  stumbles.

## 0.10.1 — 2026-10-15

- **The far tree line is a wood again, and not a white board laid on the sky.** Standing on the south path
  and looking north, the band of treetops 117 m off came out of the browser as (203,207,195) while the sky
  an arm's-width above it came out as (103,142,154): the one thing that ought to recede into the distance
  was sixty-eight points brighter than the distance, and as flat as a painted board — across the band, a
  column of the old picture never left a red of 201-207. It reads (117,133,126) now: a little under the
  sky, greener than it, with a light side and a dark side to it.
- Two faults were in it, and the second had been there since the beginning. Its colour was set straight on
  the material, where a colour is read as raw light and not as a colour on a surface, and it had no
  pattern at all. It now wears a painted distance pattern — broad masses under a fine speckle, which is all
  a wood looks like at that distance — and its bytes are painted the way every other plain colour in the
  Villa is. The same fault was in the hills; they are painted honestly too, and were measured for the
  first time, from 90 m up, because from the ground they hide behind the tree line: (129,138,142) at
  206-264 m.
- Nothing else moved, and that was checked rather than hoped: all fourteen standing views came out at the
  same luminance to within a point and the start view agrees cell by cell to a tenth of a point, because
  the far line is under 1% of any of those frames. The CPU drawing and the browser now agree on the band
  to four points — (122,131,134) against (118,134,127) — which matters, because the drawing is what most
  of this folder's pictures are made with, and a horizon that lies in the drawing lies in the Villa too.

## 0.10.0 — 2026-10-14

- **The bloom was a fog over the sunlit half of the Villa, and it is off now.** The spill started at 1.0
  in raw light, and a sunlit plaster fascia here is 2.4: so every lit surface in the Villa glowed, and a
  96-pixel kernel smeared that glow across the frame. Measured against the same view with the bloom off,
  the front of the house was carrying 17 to 31 points of light it had not earned, cell by cell. The
  spill now starts above sunlit stone (1.6), is weaker, and the kernel is a quarter of what it was, so a
  bright thing keeps a halo instead of fogging the picture. Photographed again, all fourteen standing
  views came down between 1 and 8 points and the chalkiest of them — the colonnade, all teak and glass —
  came down eight. This is why the sunlit timber and the sunlit coping both read as pale sand and no
  amount of darkening the wood moved them: the wash was laid over the top of them.
- **Sunlit teak is brown now, and it was a sheen and not the wood.** The sun stands behind the visitor, so
  a board turned square to it threw the sun straight into the eye at roughness 0.42. The front post read
  (254,228,174), pale sand; the timber now wears roughness 0.75 and the same post reads (245,190,111)
  while the shaded back door moved only from (52,30,16) to (49,29,16). Weathered teak outdoors is not
  varnished anyway.
- **Everything with no pattern on it was about twice too bright, and is now the right brightness.** A
  colour set straight on a material is read as raw light, not as bytes on a screen, so the terracotta
  pot by the steps painted (253,246,235) — white, no clay in it — and the deck chairs (250,238,217).
  They come through a new `paint` now, which converts as a pattern is converted: the pot reads
  (222,169,113), a chair (247,213,156), and the cheese on its platter in the sala (214,187,111) — a
  cheese, not a lamp.
- **The shade was paid back what the fog used to give it.** The pool went down sixteen points with the
  bloom, so the water's own glow went up by about a seventh and the pool reads (114,155,160) again; the
  sky fill went 6.5 to 6.8 and the bounce 4 to 6, which brings the north face of the house back to L67
  and the west wall to L87 without greying either.
- **Tools**: `tools/cover.js` prints each material's darkest and brightest pixel in the frame and where
  they sit, which is how a partly blown surface is told from a flat one. The yaw in `tools/cameras.txt`
  was described backwards; it now says what the engine does.

## 0.9.0 — 2026-10-14

- **The shaded side of the house has light in it now.** Photographed in Chromium, the north lawn view
  stood at luminance 54 with a third of its pixels at the dark end and a black hole where the service
  block is. It is 66 now, its dark end is down from 33% of the frame to 22%, and the whole frame is
  warmer: the back wall went from (98,92,78) to (129,120,101) and the west wall from (77,72,60) to
  (127,118,98). Three things did it — the hemisphere's sky fill from 4 to 6.5, the bounce off the paving
  from 1.6 to 4 and turned from a cool blue to a warm one, and the vignette, which was costing the view
  twelve points of light and half of its colour on its own (the frame read 29% in colour with it on and 62% with it off).
- **The reflections stopped moving when you turned your head.** The sky cube that every shiny surface
  reflects was photographed from the walking camera, so the same wall read (117,109,92) when the camera
  was set by the url and (141,129,108) when it was moved by script, and a visitor who turned round got
  different reflections out of the same plaster. There is now a camera that exists only to photograph the
  sky, and the cube is shot once from it. `scene.environmentIntensity` came down to 0.4 with it, which
  took the pool from milk (139,164,168) back to a sunlit tropical pool (110,149,154).
- **The ridge is tiled.** The cap along the top of the hip roof wore the same dark plaster as the fascia
  and came out pale sand on orange tiles; it wears the roof's own tiles now, at the tiles' own size, and
  reads (129,54,37) against the slope's (176,81,55).
- **All fourteen standing views were photographed again** (`pictures/042-home` through `055-westwall`) and
  every one of them came up and came into colour: nothing is pure black anywhere, no sunlit surface went
  past the coping's old limit by more than a point, and the front view is 91% in colour. `node
  tools/scan_old_new.js 025 042` prints the whole before-and-after table.
- **Tools**: `tools/lights.js` can now follow the same surface through a whole plan of cases (`--pick`,
  and `picks` per view), and reaches the sky fill, the bounce and the post pipeline from a case's `js`;
  `tools/photos.sh` no longer reads `--from 042` as an octal number; `tools/scan_old_new.js` is new.

## 0.8.0 — 2026-10-14

- **The garden is there now.** The owner reported the ground about the terrace as "no texture, and fully
  translucent", and he was right: all four lawn strips were built `sideOrientation: Mesh.BACKSIDE`, which
  winds a ground plane with its one face toward the middle of the earth. A renderer draws only the front
  of a face, so the browser was not drawing the garden at all — what was left of it in the picture was an
  unlit remnant, flat and colourless. Measured on the released v0.7.3 in Chromium, the lawn painted
  (129,130,130) — grey, no grass in it — and the whole west-lawn view stood at 56.6% in colour. The strips
  now face up, the way the engine lays a ground plane, and the same lawn paints (123,151,67): the view
  reads 70.9% in colour. The same fault was in the sala's and the main roof's soffits, which faced up
  into the roof instead of down at the garden, and in the pool's caustics sheets, which faced the pool
  floor so that nobody standing on the coping could ever have seen them. All are turned round.
- **Grass, and dirt, as asked for.** The old pattern was speckle with no scale: 32 cells of green across
  one nine-metre tile, which the engine averaged into one flat green sheet at any distance — and a
  garden that reads as one flat colour reads as nothing. One tile is six metres now, and it carries
  things that size survives: mown bands a metre across, six to a tile, laid from where the lawn actually
  lies so the bands run straight across all four strips instead of starting again at every join;
  bare patches of red-brown laterite a metre and a half across where the grass thins, with grit in them
  so dirt is not one flat brown; three-metre patches of light and shade; and blades for when you stand
  on it. Measured in Chromium looking down at the lawn: the frame is 86% grass and 10.8% dirt at
  (139,113,75), and it runs from (31,52,22) in a patch of shade to (77,116,33) in the sun.
- **The Villa has been looked at, which had not happened since the third session.** The sandbox has a
  browser again, and fourteen standing cameras were photographed for the first time: `pictures/025-home`
  through `038-westwall`. The Villa stands up clean (608 meshes, 5 lights, no page error) and nothing
  blows out or blacks out in any of the fourteen. `tools/photos.sh` takes them and `tools/cameras.txt`
  holds the cameras, shared with `tools/views.sh`, so a browser picture and a CPU drawing are now always
  of the very same place.
- **What those pictures say about the CPU drawing.** Where the frame is sunlit ground and sky, the
  drawing is dark: 13 to 36 points of luminance below the browser (westlawn -13, eastlawn -31, rearup
  -36, pool -32, sala -25). Where the frame is a wall in the house's own shade the two agree to within
  3 (rear +3, westwall +2). So it is not one knob turned wrong — no global light setting moves the sunlit
  views onto the browser without pushing the shaded ones past it (tried: `--hemiGain 0.85 --envFloor
  0.12` puts westlawn at 0 and rear at +28). The missing term is light bouncing off the ground, which
  the drawing does not have at all. Read as a warning: do not deepen a colour because the drawing says it
  is dark, now that there is evidence of exactly how much dark the drawing is.
- **A new eye, and a new tool.** `?fov=0.45` in the address bar narrows the eye, so a browser picture can
  be had of the same slice of the Villa a drawing takes. `tools/cover.js` says what the browser paints
  the frame out of — the share of each material, the colour it actually painted there, which meshes have
  no colour map at all, and which materials are see-through. It is how the grey lawn was pinned down.
- The walk is untouched: 607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable from the
  start, and no step anywhere that is a jump. The Villa stands up under NullEngine and runs its render
  loop for four frames without a fault.

## 0.7.3 — 2026-10-14

- **The Villa stands up in a browser again.** On a real Chromium the page said "The Villa did not stand
  up: e.getChildMeshes is not a function or its return value is not iterable" and drew nothing at all.
  The two side walls, built in pieces so their windows could be real holes, hand over seven pieces and
  four; the shadow list took them as two entries, and Babylon's shadow lamp walks `getChildMeshes()` on
  every entry it is given, so it threw on an array and the house never finished building. The walls
  themselves were right; only the list that says they throw a shadow was wrong.
- Nothing in this folder could have seen it, and that is fixed too. `tools/feet.js` and `tools/draw.js`
  both stood the shadow lamp out, painted no canvas and ran no post pipeline, so the whole path that
  broke was never walked. Now `node tools/standup.js` loads the Villa's own `src/main.js` with a small
  DOM, a blank canvas and Babylon's NullEngine and runs its render loop: put the fault back and it says
  word for word what the browser said. `node tools/shadows.js` names any shadow-caster argument that is
  not a mesh, and the line that handed it over. The stand-in shadow lamp in the other two tools now
  complains instead of swallowing it.
- The CPU drawing had been inventing shadows and forgetting them. It guessed which meshes cast by
  reading their flags; it now uses the very list the Villa hands the shadow lamp, so the two agree. The
  sala's roof, the fascia boards, the palm crowns and ninety-odd more came into the drawing, and the
  glass, the lawn and the hedge went out of it: the sala cushions, which drew all but white at
  (245,231,228) with a roof over their heads, now sit in the sala's own shade at (101,93,94). Mean light
  over the sala view 86 → 80, and from the pool's east corner 97 → 86; nothing blows out and nothing
  goes black in any of the fourteen views.
- `tools/views.sh` redraws all fourteen standing views in one go.
- The walk is untouched: 607 meshes, 30 floors, 83 blockers, 81.8% of the garden reachable from the
  start, and no step anywhere that is a jump. Still no browser in this sandbox, so the menu's picture
  for this release is a CPU drawing of the release's own copy.

## 0.7.2 — 2026-10-14

- The drawing's teak is measured now instead of guessed. Picking the browser's own `019-home` along the
  line where the sunlit terrace floor lies gave (158,106,69); the CPU drawing was giving that deck
  (53,37,38), three times short of the light its own pattern should receive. The board seam had been
  painted over a third of every teak face instead of the 3% the painted canvas spends on it, and the
  boards themselves were too cold. The deck draws (158,100,66) now.
- The note about it in `src/surface-colours.js` quotes the pixels it was set from, so nobody has to
  believe a rounded figure again — which is also why the rounded figure shipped in 0.7.1 is left behind
  rather than edited in place.
- Nothing the browser loads changed; only the drawing tool's read of its own colour notes. The fourteen
  kept views are re-drawn.

## 0.7.1 — 2026-10-14

- The sunbeds spread out properly. The third now stands at x 4.4 with its table at 6.8: the gap east of
  the last sunbed is 1.69 m instead of 1.29 m, and the nearest sunbed is 1.6 m from where a visitor
  starts rather than under their feet.
- The note beside them in `src/props.js` is rewritten, because the version shipped in 0.7.0 claimed the
  old row cut off the strip between the front steps and the water and that the cheese platter floated
  with nothing under it. Neither was true: the platter had stood on its table all along, and the real
  faults were the 14 cm the sunbeds were sunk into the paving and the 1.29 m gaps left between their
  invisible walls. A released file must not contain a claim that is not true, which is why that alone is
  worth a version of its own.
- The walk is as it was: 607 meshes, 81.8% of the garden reachable from the start, no stumbles. Still no
  browser, so the menu's picture is a CPU drawing of the release's own copy.

## 0.7.0 — 2026-10-14

- The string lights hang from timber now. Their ends had been left at (±6.6, 3.5, 0.5) when the terrace
  posts went back under the eave last session, which is 2.55 m of open sky in front of the nearest post,
  and the third string ran out to a point in the air over the west lawn with nothing at either end. There
  are now three runs slung along the four posts just under the roof edge and one away to the sala's near
  post, every end tied to a post; and the bulbs hang below their wire instead of having the wire through
  their middle.
- The pool is a sunlit pool. It read (34,102,114) at its brightest where the coping beside it read
  (233,220,199) and the paving (203,183,153) — the darkest large thing in the picture, in a villa that
  is about nothing but its pool. Its own light went up by what `tools/backlight.js` says (60,150,158)
  needs, and the canvas stopped leaving red out altogether. It reads (66,154,160) in the start view now.
  No browser has seen this; the lever to walk it back is written down in `src/materials.js`.
- The terrace has chairs on it. Two teak armchairs and a small table, east of the steps, facing the
  water: sixteen metres of bare deck with four posts on it read as an unfurnished floor when the sala had
  cushions and the pool had sunbeds.
- The sunbeds came off the water's edge. One stood with its invisible wall 13 cm from the coping's corner
  where the paving is 27 cm wide, another cut the strip between the front steps and the water, and all of
  them were sunk 14 cm into the stone they stand on; the cheese platter floated at knee height over bare
  paving and now sits on a table. The first attempt put a sunbed 5 cm from where a visitor starts, and
  `tools/feet.js` said the garden was unreachable from it — so the row stands 1.8 m off the start now.
- The railing runs the length of the edge it was built on instead of stopping 1.75 m short of it and
  hanging 0.6 m over the grass at the other end.
- The drawing tool was making the Villa's teak a lie: the board seam, which is 3% of the painted canvas,
  was painted over a third of every teak face, so the sunlit terrace floor drew (53,37,38) against the
  browser's measured (150,107,89). The deck draws (155,87,60) now. Nothing in the Villa changed; every
  kept picture was re-drawn.
- The walk is untouched: 607 meshes, 81.8% of the garden reachable from the start, no stumbles. Still no
  browser in this sandbox, so the menu's picture for this release is a CPU drawing.

## 0.6.0 — 2026-10-14

- The roof can be seen from the north lawn now. The hip roof's north slope was wound the wrong way
  round, so the renderer threw the face away: standing behind the house and looking up, the roof was
  simply not there — 48% of that view was sky and not one pixel of roof, and the picks named sky
  between the ridge and the top of the frame. The sala's roof had the same mistake in it. All four
  faces of both roofs show now, each one checked from outside by the normal of the face itself.
- The four posts in front of the glass hold the roof up. They stood with 2.65 m of open sky between
  their tops and the eave, which is to say they held up nothing; they now stand under the eave, in the
  line of the side walls, and their tops meet the slope. The roof was deliberately not extended over
  the deck to meet them: a roof edge 4.2 m up throws its shadow 9 m at this hour's sun, and the whole
  pool would have gone into the house's shade.
- The side windows are holes with glass in them, and not panes glued to the outside of a solid wall.
  Each side wall is now built in pieces around its openings, with a sill, a header, and a reveal 35 cm
  deep that the eye can read; the room is in them now, (127,130,132) against the shaded wall's
  (91,81,79). The east window was moved into the pier between the two west ones, because two openings
  stood level and made a tunnel straight through the house.
- The front's last gap is filled. Between the glass and the east wall there was a 68 cm slot you could
  look through into the room, shut by nothing but an invisible wall. It is a teak pier, and the upright
  that crowded that corner is gone, so every pane is 2.7 m wide.
- The underside of the eaves is closed. The soffit stopped 1.1 m short of the north eave, and through
  that gap you could look straight up through the roof; it now covers the whole footprint of the roof
  and the fascia boards close what is left over.
- None of it costs the walk anything: 572 meshes, 81.9% of the garden still reachable from the start,
  and no step anywhere that is a jump. Still no browser in this sandbox, so the menu's picture for
  this release is a CPU drawing.

## 0.5.0 — 2026-10-14

- The jungle behind the hedge grew up. It was 4-9 m tall standing 9-21 m out, and measured in a
  picture that was worth nothing: a tree that size fifty metres off covers seven degrees of sky, so
  the sky came down between the crowns all the way to the hedge top. The near rank now stands 3-11 m
  beyond the hedge, hidden behind it, and its crowns are 5-19 m high — close enough that you can see
  they are trees, and tall enough to lean over the garden.
- A second, taller rank (9-26 m, 26-52 m out) fills the gaps the near one leaves, and it has a green of
  its own: paler and bluer than the near rank, with a finer leaf, because at fifty metres a leaf is a
  speckle. Looking south from the terrace the ladder now reads hedge (88,112,79) at 27 m, near rank
  (66,84,66) at 28 m, far rank (73,89,82) at 57 m, tree line (113,119,128) at 120 m.
- The heights come in clumps — a low patch of 5 m trees giving way to a patch of 18 m ones — which is
  how a wood grows and is nothing like a curtain. That is what lets the sky down into the skyline
  instead of the skyline being cut with a ruler.
- What it costs the eye: from the sala the belt covers 15% of the view where it covered 7%, and the sky
  gave up three points; from the west lawn 10% where it covered 5%. The sky never gave up much
  anywhere, because a skyline is set by the nearest tall thing and no further.
- Nothing moved, no new keys, and the walk is untouched: 81.9% of the garden is still reachable from the
  start and nowhere does the ground jump.
- Still no browser in this sandbox, so the menu's picture for this release is a CPU drawing.

## 0.4.0 — 2026-10-14

- The horizon fills in. Looking out from the paving used to give you a 2 m hedge and a wall of empty
  sky. There are now three depths out there: a belt of jungle trees 4-20 m tall standing hard behind
  the hedge, with gaps in it; eight coconut palms over the belt; and a far tree line 110-150 m away,
  tall enough to show above everything nearer, which the haze has already turned from green to
  blue-grey. The hills went back to 170-240 m so they stand behind the tree line and not in it.
- Each layer is cooler and paler than the one in front of it, which is how distance shows in a
  picture. Measured a hundred-odd metres out: near hedge (97,125,82), jungle belt (89,111,85), far
  tree line (113,119,128).
- What that does to the frame. From the sala: sky 26% to 20%, and trees now cover 20% where the hedge
  alone covered 14%. From the terrace looking down the pool: sky 24% to 11%, jungle 14%, far tree
  line 9%. Down the south path: sky 27% to 21%.
- It costs the browser four draws, not a hundred and thirty: each layer is merged into one mesh, and
  nothing out there is solid or casts a shadow, so the walk is untouched — 81.9% of the garden is
  still reachable from the start, and the ground is still level enough to walk anywhere on it.
- The drawing tool, which is what these pictures are made with, no longer paints the Villa's glass
  front like a pale lit wall: glass keeps a tenth of the sun and mirrors the sky only where its own
  reflection lands. The window in the start view reads (134,135,128) against the browser's
  (127,116,106), where before it came out (162,177,166).
- Still no browser in this sandbox, so the menu's picture for this release is a CPU drawing.

## 0.3.1 — 2026-10-14

- The sunlit walls keep their colour. The plaster was so bright in the afternoon sun that the front of
  the house and its fascia came out blown white, the trowel sweeps and the grain of the wall crushed
  flat out of them. The base colour is deeper and warmer now, so the lit face reads as warm sand and
  the shaded side stops going blue-grey.
- Nothing moved, nothing was added, no new keys. The picture in the menu for this release is a CPU
  drawing rather than a browser picture, because this sandbox can no longer start a browser.

## 0.3.0 — 2026-10-14

- There is a way down to the water now. The pool sits a metre further south, with a paved walkway
  between it and the terrace, and the terrace's front steps are three easy treads that land on
  paving instead of hanging over the water.
- The lounger row, the side tables and the platter of fruit went with the water and stand on the
  paving at its far side; the great pots and the potted plants now flank the steps instead of
  standing in the coping.
- The open sala is climbed at its steps — two treads of 17 cm in the middle of its west face — and
  nowhere else. The other faces of its base are closed in, so there is no half-metre hop up it from
  any side of the garden.
- The back of the house is a side of the house now. It stands on a dark plinth down to the lawn
  instead of floating half a metre above the grass, with a band of dark boards under the eaves, a
  boarded door and two lanterns beside it, and shrubs, banana plants and a palm off each end
  planted along the wall behind it.
- Nothing in the garden trips a visitor: nowhere does the ground jump more than 0.42 m across half a
  metre, and the water, the room behind the glass and the steps under the water stay off limits.

## 0.2.0 — 2026-10-14

- You can walk it now. The visitor's feet are set on the ground the villa was built with — terrace,
  sala, steps, paving, path all hold you, walls and hedges stop you, the water is off limits — and
  `Shift` runs. The physics engine that used to try this let a person walk through the paving and
  out of the world, so it is gone.
- The light was retuned: the sky's sun was not where the lamp's sun was, so the whole anti-solar side
  was dark. Sun raised to 24°, sky deepened, fill and bounce raised, and foliage given a little light
  of its own, so a backlit leaf is a dark green leaf and not a black cut-out. The turn-around view
  went from near-black to a lit garden.
- The glow layer is gone; the picture is steadier without it and one pass cheaper. The lamps still
  bloom, from the pipeline.
- The glass front is no longer a mirror: it was coming back blown white with the room behind it gone.
- Planted the south border — shrubs, palms, bananas, lamps — and put a teak bench where the path runs
  out. The sala roof's ridge is now over the middle of the roof, where it belongs.

## 0.1.0 — 2026-10-14

- The Villa stands: a low Thai pool pavilion with a terracotta hip roof, a glass front onto the water,
  a raised teak terrace, an open sala at the east end, palms, hedges, banana plants, string lights and
  a platter of cheese by the pool.
- The pool is 10 x 5 m of turquoise water with a moving net of light across it, steps at the south
  end, lamps in the walls and glitter sheets riding on the surface.
- Late afternoon with the sun behind the visitor, so the villa's front is lit raking and its shadow
  falls north, behind the house. Sky, fog and fill light cooled so the picture is coloured and not
  one warm wash.
- Walk it with `W A S D` and the mouse, `R` returns you to the start of the view over the pool.
- Every surface is painted from noise on a canvas — grass, paving, pool mosaic, plaster, teak, roof
  tiles, bark, fronds, leaves, cloth — so nothing is a flat colour.
