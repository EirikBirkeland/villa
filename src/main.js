// The Villa, assembled: engine, scene, sky, house, pool, garden, and the visitor's own two feet.
// Everything the browser loads is in this folder. Nothing is fetched from anywhere else.

import { createMaterials } from "./materials.js";
import { sunDirection, buildSky, buildLights, buildFog, buildGround, buildBoundary, buildDistance } from "./world.js";
import { buildVilla } from "./villa.js";
import { buildPool } from "./pool.js";
import { buildPond } from "./pond.js";
import { buildStream } from "./stream.js";
import { buildGarden, SHRUB_CLIP } from "./garden.js";
import { buildProps } from "./props.js";
import { makeGround } from "./ground.js";
import { buildDuck } from "./duck.js";
import { buildFireflies } from "./fireflies.js";
import { buildDayCycle, hourWords } from "./daylight.js";
import { buildSound, LEVEL } from "./sound.js";
import { buildGeckos } from "./gecko.js";
import { buildRaven } from "./raven.js";
import { buildCreatures } from "./creatures.js";
import { buildKoi } from "./koi.js";
import { buildShark } from "./shark.js";
import { buildWeapon } from "./weapon.js";
import { buildRocket } from "./rocket.js";
import { buildFlashlight } from "./flashlight.js";
import { installWaterAlpha } from "./water.js";
import { patchToneCurve } from "./tone.js";

const {
	Engine, Scene, FreeCamera, Vector3, Color3, Color4, DefaultRenderingPipeline,
	ImageProcessingConfiguration, RenderTargetTexture, HDRFiltering, Axis, Space, ColorCurves,
} = BABYLON;

// Where the sun is standing, in degrees clockwise from north (-z) and above the horizon.
// 160 puts it south-south-east, behind the visitor: the villa's front is raked from the right
// and the villa's shadow falls north, behind the house, instead of across the pool.
// 24 degrees: low enough for long shadows and a lit horizon, high enough that the sky keeps its
// colour on the side away from the sun. At 17 the anti-solar half of the dome went grey.
const SUN_AZIMUTH = 160;
const SUN_ELEVATION = 24;

// Where the visitor stands when they arrive, and where R puts them back. Chosen by counting
// what fills the frame: from here the pool holds a tenth of the picture, the villa's front
// stands above it, and there is still sky at the top. The height is only a starting guess: the
// ground under the point sets the visitor's feet as soon as the Villa is built.
const START_POSITION = new BABYLON.Vector3(2.4, 1.74, 10.5);
const START_LOOK = new BABYLON.Vector3(0.06, 3.2, 0);

const canvas = document.getElementById("view");
const oops = document.getElementById("oops");

function reportFailure(error) {
	if (!oops) return;
	oops.hidden = false;
	oops.textContent = `The Villa did not stand up: ${error && error.message ? error.message : error}`;
}

let engine;
let scene;
let camera;
let pool;
let duck = null;
let poolCube = null;
let creatures;
let shark = null;
// Two numbers a bite leaves behind: `knock` is the jolt up the camera and `sting` the red at the edges of
// the sight. Both are decayed in the render loop and both are the whole of what a bite does to the visitor,
// who cannot be hurt: there is no health in this Villa and no intention of any. `stingShown` remembers that
// the red has been painted at least once, so the frame after it drains is written back to its everyday colour.
let knock = 0;
let sting = 0;
let stingShown = false;
// True for the tools only: `?float=1` pins the camera where the address bar put it.
let pinned = false;
let time = 0;

try {
	boot();
} catch (error) {
	reportFailure(error);
	throw error;
}

function boot() {
	// Small switches, for looking at the Villa while it is being built. A visitor never sees them.
	//   ?noshadow=1  ?noenv=1  ?nofog=1  ?float=1   turn a thing off
	//   ?lock=0                    drag to look instead of the sight taking the mouse (a lock is the default)
	//   ?fly=1                   start off the ground (the same key the visitor taps: space)
	//   ?view=x,y,z,yaw,pitch   stand the visitor somewhere particular
	//   ?roach=14             the cockroach in centimetres: 4.5 is the animal, 14 what it is shown at
	//   ?fov=0.45              a narrower or wider eye, in radians
	//   ?still=1               the butterflies and the cockroach hold still, so a moving thing can be
	//                          photographed: their clock is stopped, not the Villa's
	//   ?sky=0.12  ?sun=3  ?hemi=1  ?env=1.1  ?exposure=1.15   dial the light from the address bar; each one
	//                          of these that is written wins over the day's table (see `locks` below), or a
	//                          tool that weighs a lamp by switching it off would be weighing the table
	//   ?room=20                 the lamps inside the house, seen through the front glass
	//   ?tonemap=aces  ?shoulder=-40   the tone curve, and a pull on the bright end
	//   ?tonemap=villa|khronos|lin ?knee= ?white= ?desat=   the Villa's own curve and its three numbers
	//   ?contrast=1  ?vignette=0   the last two nudges, which are in the way when a light is read off
	//   ?clip=1                   lay the shears out: the shrubs keep their domes (see src/garden.js)
	//   ?nofresnel=1                take the angle out of the water's alpha (see src/water.js)
	//   ?wet=1                      how wet the strip at the water's edge is; 0 takes the strips out (src/pool.js)
	//   ?wfp=4                      the one number of that angle
	//   ?wem=1.5                    how strong the water's own colour is, and ?nofilmangle=1 to stop
	//                               the angle taking it off where the surface mirrors
	//   ?wsky=0                     how loud the sky is in the water's mirror (see src/water.js)
	//   ?wrib=1.1                   how hard the water's chop bites (its ripple bump level)
	//   ?net=0.45                   how loud the net of light on the pool's four walls is; 0 takes it off
	//   ?hour=21                    where the day starts, on a 24 clock (see src/daylight.js)
	//   ?daylen=360                 seconds of real time for a whole day; 0 pins the sun and the lamps, and
	//                               is what `?still=1` does — which is how a picture can be drawn twice and
	//                               mean the same thing
	//   ?duck=0                     take the toy duck out of the pool (see src/duck.js)
	//   ?shark=0                    take the shark out of the pool, and its blood with it (see src/shark.js)
	//   ?gun=0                      leave the gun out of the build (see src/weapon.js)
	//   ?rocket=0                   leave the launcher out, and keep the house standing (see src/rocket.js)
	//   ?stream=0                   take the watercourse out of the garden (see src/stream.js)
	const switches = new URLSearchParams(window.location.search);
	const dial = (name, value) => (switches.has(name) ? Number(switches.get(name)) : value);

	engine = new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: false, antialias: true }, true);
	engine.setHardwareScalingLevel(1 / Math.min(1, window.devicePixelRatio || 1));
	scene = new Scene(engine);
	scene.autoClear = true;

	camera = new FreeCamera("walk", START_POSITION.clone(), scene);
	camera.minZ = 0.06;
	camera.maxZ = 1200;
	camera.fov = 0.85;
	camera.rotation = START_LOOK.clone();
	camera.inertia = 0.74;
	camera.speed = 9;
	// A narrow eye for looking at one part of the Villa at a time, matched to the drawing tool.
	camera.fov = dial("fov", camera.fov);

	const sun = sunDirection(dial("sunAzimuth", SUN_AZIMUTH), dial("sunElevation", SUN_ELEVATION));

	buildFog(scene);
	if (switches.has("nofog")) scene.fogMode = Scene.FOGMODE_NONE;
	const { sky, dome } = buildSky(scene, sun);
	sky.luminance = dial("sky", sky.luminance);
	sky.turbidity = dial("turb", sky.turbidity);
	sky.rayleigh = dial("rayl", sky.rayleigh);
	const { light, hemi, bounce, shadows } = buildLights(scene, sun);
	light.intensity = dial("sun", light.intensity);
	hemi.intensity = dial("hemi", hemi.intensity);
	if (switches.has("noshadow")) scene.shadowsEnabled = false;

	const mats = createMaterials(scene);

	// The water's alpha follows the angle you look at it from, which is the one thing the library's
	// transparent PBR cannot do and the one thing that says "water" and not "glass over a tank".
	// `src/water.js` has the whole argument; `?nofresnel=1` leaves it out, which is how it was weighed.
	if (!switches.has("nofresnel")) {
		const water = installWaterAlpha(BABYLON, mats.water, {
			power: dial("wfp", 4),
			filmAngle: !switches.has("nofilmangle"),
			// What the surface sees when it mirrors, and how loud that is. `src/materials.js` owns the colour
			// with every other surface byte; `?wsky=0` is the control and a bigger number is a louder sky.
			// The sky is paid at the same Fresnel factor that took the film off, and no steeper: `src/water.js`
			// weighed a steeper payment and it bought two points of luminance, so it was thrown away.
			mirror: dial("wsky", 1),
			mirrorColor: mats.water.mirrorColor || [0.3, 0.46, 0.5],
		});
		if (!water.ok) console.error(`the water's shader did not go in: ${water.why}`);
		// The pond wears the same law with its own numbers, and must be patched separately: the colour a
		// surface mirrors is baked into the shader text and not passed as a uniform, so one patched shader
		// is one sheet of water. See `src/water.js`.
		const pondSkin = installWaterAlpha(BABYLON, mats.pondWater, {
			name: "villaPondWater",
			power: dial("wfp", 4),
			filmAngle: !switches.has("nofilmangle"),
			mirror: dial("wsky", 1),
			mirrorColor: mats.pondWater.mirrorColor || [0.23, 0.31, 0.24],
		});
		if (!pondSkin.ok) console.error(`the pond's shader did not go in: ${pondSkin.why}`);
		// And the stream's, a third patched shader for a third sheet of water, mirroring the hedge on one bank
		// and the open sky on the other. Same reason the pond needed its own: the mirrored colour is baked into
		// the text (`src/water.js`).
		const streamSkin = installWaterAlpha(BABYLON, mats.streamWater, {
			name: "villaStreamWater",
			power: dial("wfp", 4),
			filmAngle: !switches.has("nofilmangle"),
			mirror: dial("wsky", 1),
			mirrorColor: mats.streamWater.mirrorColor || [0.35, 0.42, 0.38],
		});
		if (!streamSkin.ok) console.error(`the stream's shader did not go in: ${streamSkin.why}`);
	}
	// The strength of the film the water paints over whatever lies under it. The library's own knob.
	mats.water.emissiveIntensity = dial("wem", mats.water.emissiveIntensity);
	// How hard the water's own chop bites — the bump level of its ripple map. See `src/materials.js`.
	mats.water.bumpTexture.level = dial("wrib", mats.water.bumpTexture.level);

	// The sky, reflected: every glossy surface in the Villa reads the same sky out of this cube.
	// One cube render at the start, then it is a still picture: the sky does not move.
	// How many pixels across the reflected sky is. It stays 256; `?envpx=64` exists because a rough shaded face
	// samples one of this cube's low levels, and the fewer pixels it starts with, the softer the sky it reads back.
	// That is the whole question about the comb of marks on the store's panel — see NOTES.md, session eighty-four.
	const ENV_PX = dial("envpx", 256);
	const envCube = new RenderTargetTexture("skyCube", { width: ENV_PX, height: ENV_PX }, scene, true, true, engine.TEXTUREFORMAT_FLOAT, true);
	envCube.renderList = [dome];
	// The cube gets its own camera, standing in the middle of the garden, and it is rendered once.
	//
	// It used to render with the walking camera, which meant the sky that every reflective and every
	// shaded surface reads was a picture of the sky taken from wherever the visitor happened to be
	// when the cube was filled — and the sky dome hangs on the camera (`infiniteDistance`), so moving
	// 10 m sideways shifts the sun's glow in the cube by a degree and a half, which is nothing to the
	// eye and a great deal to the mie term. Measured on the north face of the house, the same wall at
	// the same metre read (141,129,108) when the url put the camera there before the first frame and
	// (117,109,92) when the same camera was moved there a second later: twenty points of ambient for
	// every shaded surface in the Villa, decided by chance. From a camera fixed at the origin the sky
	// in the cube is one sky, and it is the sky the visitor is standing under.
	const skyCamera = new FreeCamera("skyCamera", START_POSITION.clone(), scene);
	skyCamera.minZ = 1;
	skyCamera.maxZ = 900;
	envCube.activeCamera = skyCamera;
	envCube.render();
	// Once is enough: the sky does not move, and six dome draws every frame is a dear price in
	// software WebGL for a picture that never changes again.
	envCube.refreshRate = 0;
	scene.environmentTexture = envCube;
	// The cube now has a real sun in it, so it must not be poured over the scene undiluted: at 1.1
	// it greyed out every lit surface and took the colour out of the picture. 0.4 is where the shade
	// has a floor and the pool is still a pool: measured in Chromium, the shaded plaster at the back of
	// the house reads (129,120,101) at 0.4 and (140,130,109) at 0.5, but the water — which is the one
	// surface that is a mirror — goes from (110,149,154), a sunlit tropical pool, to (139,164,168), a
	// bucket of milk. Note for whoever comes next: `mats.water.environmentIntensity` does nothing at
	// all while `disableLighting` is on, and setting it to 0 left the water within a point of what it
	// was, so the pool can only be balanced against the rest of the scene here, not on its own.
	scene.environmentIntensity = dial("env", 0.4);
	// Soften the cube by roughness, which is what PBR reflections want. Finished in the first frames.
	const hdrFilter = new HDRFiltering(engine, { lodGenerationScale: 0.8, lodGenerationOffset: -0.5 });
	hdrFilter.prefilter(envCube).catch(() => {});

	buildGround(scene, mats);
	buildBoundary(scene, mats);
	buildDistance(scene, mats);
	const villaParts = buildVilla(scene, mats, shadows);
	// A dial for the lamps inside the house, so a room can be weighed in a picture and not guessed at.
	// One number sets the pair over the room; the lamp in the floor lamp keeps its ratio to them.
	if (switches.has("room")) {
		const ceiling = Number(switches.get("room"));
		for (const lamp of scene.roomLamps || []) {
			// One number for the whole room: every lamp keeps the strength `src/interior.js` gave it
			// relative to the pair over the room, so the dial cannot make the alcove shout.
			lamp.intensity = ceiling * ((lamp.baseIntensity || 20) / 20);
		}
	}
	pool = buildPool(scene, mats, shadows);
	// The pond in the west lawn, built before the garden and before the walk is read: its rim stones are
	// something to stand on, and the water is a place to keep off (`src/pond.js` has the whole account).
	const pond = buildPond(scene, mats, shadows);
	// The stream: water running in from the north-east hedge and ending in the pond, built straight after the
	// pond because its mouth is handed the pond's own splash rings and the two must agree about where the
	// water lands (`src/stream.js`).
	const stream = dial("stream", 1) > 0 ? buildStream(scene, mats, shadows, { pond }) : null;

	// ---- the waterline ---------------------------------------------------------------
	// Off, and the two wet materials are painted back to the numbers of the dry ones they copy: same bytes, same
	// roughness, same mirror of the dome. That is the honest control now the damp foot is a band of the capstone
	// and not a plate laid on it — `?wet=0` used to take the wet strips out of the scene, which was honest while
	// they were plates and became nonsense the moment one of them was coping: it left the cap 13 cm narrower and
	// a gap to the water. `?wet=0.6` and friends dial the darkening, which is how the bytes in `materials.js`
	// were ladderred. Asked after the basin is built, because that is where the waterline lives.
	const wetline = dial("wet", 1);
	if (wetline <= 0) {
		for (const [wet, dry] of [["poolWet", "poolTile"], ["copingWet", "coping"]]) {
			mats[wet].albedoColor = mats[dry].albedoColor.clone();
			mats[wet].emissiveColor = mats[dry].emissiveColor.clone();
			mats[wet].roughness = mats[dry].roughness;
			mats[wet].metallic = mats[dry].metallic;
			mats[wet].environmentalIntensity = mats[dry].environmentalIntensity;
			if (mats[wet].bumpTexture && mats[dry].bumpTexture) mats[wet].bumpTexture.level = mats[dry].bumpTexture.level;
		}
	} else if (wetline !== 1) {
		for (const n of ["poolWet", "copingWet"]) mats[n].albedoColor.scaleToRef(wetline, mats[n].albedoColor);
	}
	// How loud the net of moving light is on the four walls of the pit. `?net=0` takes it off, which is how
	// it was weighed; `?net=0.8` and above is a wire cage.
	for (const mesh of pool.causticWalls || []) mesh.visibility = dial("net", mesh.visibility);
	// The room behind the front glass already carries the sun and its own four lamps, and the shaders hold
	// six lights and drop a seventh without saying which. The pool's two fill lights are therefore kept out
	// of it — which is what they were always for anyway: they are for the water and the pit, not a room
	// behind a wall. Measured before this was done, every mesh in the room stood in seven light sources.
	for (const lamp of pool.lights || []) {
		lamp.excludedMeshes = [...(lamp.excludedMeshes || []), ...(scene.roomMeshes || [])];
	}
	// The one yellow toy duck in the water (`src/duck.js`). Built here rather than with the furniture in
	// `props.js` because it needs the pool's own plan — where the surface lies and how far the walls are —
	// and because it is the only prop in the Villa that moves by itself. `?duck=0` takes it out, which is how
	// it was weighed against a pool with nothing in it.
	if (dial("duck", 1) > 0) {
		duck = buildDuck(scene, mats, pool.bounds, { x: dial("duckx", -1.9), z: dial("duckz", 4.6), shadows });
		duck.animate(0);
	}
	buildGarden(scene, mats, shadows, { clip: dial("clip", SHRUB_CLIP) });
	buildProps(scene, mats, shadows, { clip: dial("clip", SHRUB_CLIP) });

	// Where the visitor's feet go, read off the meshes that were just built. The pool hands over the
	// places to keep off: the pit, less the strip the front steps come down through. The pond hands over
	// its water, which is a place to keep off too, and stops a person wading.
	const ground = makeGround(scene, pool.walkBlocks.concat(pond.walkBlocks, stream ? stream.blockers : []));

	// What the water mirrors: a second cube, taken from the pool's own surface, of everything standing
	// round about it — the house, the palms, the hedge, the far wood — and not of the sky alone.
	//
	// The sky cube above holds the dome and nothing else, which is why every attempt at a real reflecting
	// pool has come out as a pale wash: with nothing but sky to mirror, a pool mirrors two per cent of it
	// straight down and the whole basin goes milky (`tools/waterprobe.json`, and the twenty-first
	// session's refusal). Seen from where a person stands, the far half of a real pool is the house and the
	// trees upside down in it; that only happens if they are in the mirror to be seen.
	//
	// So this cube is handed to the water ALONE — `scene.environmentTexture` is untouched, so no other
	// surface in the Villa changes by one byte — and it holds every mesh but the pool's own: the pit, the
	// steps, the coping, the water and its two caustics sheets are left out, or the water mirrors its own
	// bottom. It is filled from the pool's own surface, at the height of the water, once and never again:
	// nothing in it moves but the visitor, and a pool that mirrors the back of the visitor's own head is
	// not a feature.
	//
	// FILLED AFTER THE FIRST FRAME, and that is not idleness. Rendering a second cube at boot — while the
	// sky cube's prefilter is still running, since `prefilter` answers later and not at once — costs the
	// whole Villa its ambient light: with this call at boot, every view in the standing set went down,
	// `backstore` from L99 to L84 and `westwall` from L90 to L72, in pictures with no pool in them at all.
	// Wait for a frame and the Villa is itself again, with a mirror in the water from the second frame in.
	//
	// `?noreflect=1` leaves it out, which is how it was weighed against nothing: the start view's water
	// reads L110 with this cube against L118 with the sky cube in its place — a mirror of a shaded house
	// and a lawn is a darker mirror than a mirror of open sky, which is the truth of it and why it stayed.
	if (!switches.has("noreflect")) {
		// Everything but the pool's own lining: its water, its tiles, its damp band and its coping, the
		// caustics sheets, the wires of the string lights, and the splash strip on the coping. A mirror of
		// the basin's own walls is a mirror of the thing the mirror is drawn ON, and it darkens the far half
		// of the water for nothing.
		const skip = /^(pool|coping|water|caustics|wire|wet|splash)/;
		poolCube = new RenderTargetTexture("poolCube", { width: 256, height: 256 }, scene, true, true, engine.TEXTUREFORMAT_FLOAT, true);
		poolCube.renderList = scene.meshes.filter((m) => m.isEnabled() && m.isVisible && !skip.test(m.name));
		const poolCamera = new FreeCamera("poolCamera", new Vector3(0, -0.1, 4.6), scene);
		poolCamera.minZ = 0.35;
		poolCamera.maxZ = 900;
		poolCube.activeCamera = poolCamera;
		poolCube.refreshRate = 0;
		scene.onAfterRenderObservable.addOnce(() => {
			poolCube.render();
			mats.water.reflectionTexture = poolCube;
			mats.water.markDirty();
		});
	}

	// A MIRROR FOR THE POND WAS BUILT, MEASURED, AND TAKEN OUT AGAIN, and the numbers are left here so nobody
	// builds it a second time. It was the pool's own trick — a cube taken once, after the first frame, from a
	// camera at the water's height, with the pond's own parts left out of it — and it cost a second render
	// target and did this: at the standing camera on the south bank, with the water's own baked sky turned
	// off on both sides of the comparison, the water read L26..32 WITH the cube and L36..42 without it.
	// That is the whole of its service: it took the water down by a ten of luminance and showed nothing in
	// it, because a basin this shallow has no far bank for the sky to lean on, and its lower hemisphere is
	// the empty air under a floor that was left out of the cube on purpose. A pond five metres across is
	// seen THROUGH, not mirrored: what makes it read as water is the dark silt under it, the chop on it and
	// the sky it takes at a graze, which `src/water.js` already pays. The pool keeps its cube because the
	// pool is nine metres across, a metre and a half deep, and has the whole front of the villa standing
	// over it.

	// Colour, tone, and a touch of bloom and grain: the difference between a render and a picture.
	// There is no separate glow layer: the bloom below does the lamps' work, and the pictures are
	// steadier for one compositing pass fewer.
	const pipeline = new DefaultRenderingPipeline("post", true, scene, [camera]);
	pipeline.fxaaEnabled = true;
	// Four samples of multisampling on top of FXAA, which is what the master asked for and which is not a
	// doubling of the same work: MSAA smooths the geometry edges while they are still triangles, and FXAA
	// smooths what the post chain draws afterwards — the bloom's edge, the tone-mapped skyline, and anything
	// the hardware refuses multisampling for. `?msaa=1` puts it back to a single sample, which is how the
	// staircase count in `tools/jaggies.js` was measured either way. The Villa is built for a card with room
	// to spare and not for a software renderer, so the cost is paid where there is money.
	pipeline.samples = Math.max(1, dial("msaa", 4));
	pipeline.bloomEnabled = true;
	// The bloom used to start at 1.0, which in this scene is no threshold at all: a sunlit face here is
	// between 1.5 and 4 in raw light (back a sunlit plaster fascia through `tools/backlight.js` and it
	// says 2.4), so every lit surface in the Villa spilled, and a 96-pixel kernel smeared that spill over
	// the whole frame. Measured against the same view with the bloom off, the front of the house was
	// carrying 17 to 31 points of light it had not earned, cell by cell, and the whole frame 7 points
	// (`tools/compare.js` on the two pictures in `pictures/tmp/sweep2/`). That is why sunlit teak and
	// sunlit coping both read as pale sand and no amount of darkening the wood would move them: the wash
	// was laid over the top of them. So: the spill starts above sunlit stone, it is weaker, and the
	// kernel is a quarter of what it was, so a bright thing keeps a halo rather than fogging the frame.
	// The pool paid for this and was paid back in `src/materials.js`.
	pipeline.bloomThreshold = dial("bloomThreshold", 1.6);
	pipeline.bloomWeight = dial("bloomWeight", 0.14);
	pipeline.bloomKernel = 40;
	pipeline.bloomScale = 0.5;
	pipeline.imageProcessing.toneMappingEnabled = true;
	// Which tone curve the light is squeezed through. The Villa ships its own, in src/tone.js, which
	// puts it into the library's shader source before the pipeline is built; `?tonemap=` picks another
	// one for the tools to weigh against it — `aces`, `standard`, `khronos` (the library's own numbers
	// written the Villa's way) and `lin` (no curve at all, which is how a raw light value is read off a
	// screen with tools/rawlight.js).
	//
	// ACES, which the Villa ran on until the sixteenth session, was why the sunlit half was chalk: its
	// fit runs every channel apart and ends at white, so the brighter a surface was the paler it went.
	// Khronos PBR Neutral was the cure and bent the whole colour rather than one channel at a time, so
	// a lit surface kept its hue; but it starts bending at 0.76 of raw light and flattens everything
	// above that towards white, and by the twenty-sixth session the sunlit half of this Villa — a factor
	// of 1.75 in light, from a teak post to a plaster wall — was living in the last six bytes of the
	// picture. src/tone.js keeps the library's shape and moves the number that says where the bend
	// starts: from 0.76 of raw light down to 0.5, so everything the sun touches is folded instead of
	// only the very top of it, and the ceiling stays where the library puts it, so a sun glint on the
	// water can still be white. The exposure goes 0.72 -> 0.76 with it, since a multiplier below the
	// bend hands the shade its light back and the sunlit half, which is what was too bright, does not
	// buy any. Every number, and what each was measured on, is written down at the foot of src/tone.js.
	const toneChoice = switches.get("tonemap") || "villa";
	// Only a number the visitor actually typed turns a knob; an absent one leaves the shipped value.
	const toneDial = {};
	for (const knob of ["knee", "white", "desat"]) {
		if (switches.has(knob) && Number.isFinite(Number(switches.get(knob)))) toneDial[knob] = Number(switches.get(knob));
	}
	const tone =
		toneChoice === "aces" || toneChoice === "standard"
			? { ok: true, curve: toneChoice, text: `the library's ${toneChoice} curve` }
			: patchToneCurve(BABYLON, toneChoice, toneDial);
	if (!tone.ok) console.error(`the tone curve did not go in: ${tone.why}`);
	pipeline.imageProcessing.toneMappingType =
		toneChoice === "aces"
			? ImageProcessingConfiguration.TONEMAPPING_ACES
			: toneChoice === "standard"
				? ImageProcessingConfiguration.TONEMAPPING_STANDARD
				: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;
	pipeline.imageProcessing.exposure = dial("exposure", 0.76);
	pipeline.imageProcessing.contrast = dial("contrast", 1.1);
	pipeline.imageProcessing.vignetteWeight = dial("vignette", 1.2);
	pipeline.imageProcessing.vignetteEnabled = true;
	// The vignette was turned up far too high, and it was not a matter of taste. Measured in Chromium
	// on the north face of the house: with the weight at 2.6 the whole frame lost 12 points of
	// luminance and the sky in a corner lost 40 (82,101,99 against 123,151,147 with no vignette at
	// all), because at that weight the falloff starts at the middle of the picture and not at the
	// corners — so the shaded third of the Villa was being darkened a second time, on top of its own
	// shade, and the colour went with it (29% of the frame in colour against 61% without it).
	// 1.2 with a wider stretch keeps the corners a little quiet and leaves the Villa alone.
	pipeline.imageProcessing.vignetteStretch = 0.35;
	pipeline.imageProcessing.vignetteColor = new Color4(0.13, 0.1, 0.08, 0.0);
	pipeline.imageProcessing.vignetteBlendMode = 0;
	// A lift off the bright end only, kept as a switch and refused as a cure.
	//
	// The library's colour curves are three display-domain gains keyed on how bright a pixel already
	// is — shadows below a luma of 0.5, highlights above 0.833, a straight line between — and left
	// alone they do nothing at all, which is why they are switched off unless `?shoulder=` is given.
	// A pull of the highlights was tried at -18, -34, -50 and -60 against the ACES curve, and it is a
	// dimmer, not a shoulder: at -60 the sunlit band of the start view came out (208,204,194) with 14
	// of channel spread against the 46 it has as things stand, because the pixels that are merely
	// bright get pulled down into the band with the ones that were over the top, and a multiplier can
	// put back no separation that the tone curve already crushed. Under PBR Neutral it is worse still,
	// since that curve has the shoulder in it already: at -40 it took the sunlit band's spread from
	// 74 to 56. The switch stays so nobody spends a session rediscovering this.
	pipeline.imageProcessing.colorCurvesEnabled = dial("shoulder", 0) !== 0;
	if (pipeline.imageProcessing.colorCurvesEnabled) {
		const shoulder = new ColorCurves();
		// In the library these three exposures are display-domain gains keyed on how bright the pixel
		// already is: shadows below a luma of 0.5, highlights above 0.833, a straight line between.
		// Left alone they are all 1, and the curves do nothing at all.
		shoulder.highlightsExposure = dial("shoulder", 0);
		pipeline.imageProcessing.colorCurves = shoulder;
	}
	// A touch of film grain, and now with a measured number under it. On the store's dark panel, two frames 0.7
	// seconds apart moved a mean of 1.92 (of 765) with the grain at 3.5 and 0.66 with it silenced, and the worst
	// pixel moved ten levels against three. Most of what the master has been calling the flickering panel is this
	// line: an animated grain shimmering on a dark flat face where there is nothing else for the eye to hold.
	// It stays — grain is the difference between a render and a photograph — but at a third of the strength,
	// measured with it still and not moving, and `?grain=` now reaches it: `?grain=0` is a clean plate and
	// `?grain=3.5` is the Villa as it was. The animation is off by default and `?grainmove=1` puts it back.
	// Measured on the panel with everything else frozen: animated at this strength it moves a mean of 0.40 of
	// 765 between frames and its worst pixel moves 3; not animated, the panel is identical between frames to the
	// byte — 0.00 mean, worst 0. The complaint was a flickering panel, and a still grain cannot flicker.
	pipeline.grainEnabled = dial("grain", 1.1) > 0;
	pipeline.grain.intensity = dial("grain", 1.1);
	pipeline.grain.animated = dial("grainmove", 0) > 0;

	// The look is given the address bar's switches rather than reaching for them: the walking is set up in a
	// function of its own and cannot see them, and a click that throws an error inside that function is a click that
	// does half its work and stops.
	const walk = setupWalking(ground, { wantLock: dial("lock", 1) > 0 });
	// The ear. Until now this Villa has been stone dead silent, and a garden at ten at night is not silent.
	// Every sound is synthesised at the moment it is asked for (`src/sound.js`) — nothing is fetched — and the
	// browser will not let a page make a noise until a person has touched it, so the first click or key is what
	// wakes the ear up. `M` turns it off and on again, which is the only new key any of this costs.
	const sound = dial("sound", 1) > 0 ? buildSound(camera) : null;
	let nightHeld = false;
	// The held sounds: the channel's trickle and the cricket bed under the whole night. Neither is a call — each
	// is going all the time, and what changes is how loud the visitor is standing to it. They cannot start where
	// the garden is built, because the ear does not exist until a person has touched the page, so they start with
	// the first touch and only once. `M` takes both away, as it takes away every other sound in this garden.
	let bedsHeard = false;
	const startBeds = () => {
		if (bedsHeard || !sound.context) return;
		bedsHeard = true;
		if (stream) {
			// A TRICKLE, and a short-armed one. The first attempt at voicing sixty-two metres of water was a
			// synthesised wash heard from twelve metres away in every part of the garden, and it was, in the
			// master's words, the worst sound imaginable — rightly: a noise you cannot locate and cannot walk away
			// from is a fault, not an atmosphere. So the water is recorded droplets, and it is only there when you
			// are standing at the bank, and it is gone when you take three steps back.
				sound.startMurmur({
					name: "trickle",
					file: "trickle",
					loud: LEVEL.trickle,
					near: (p) => stream.distanceTo(p.x, p.z),
					bank: 0.7,
					span: 4.5,
				});
		}
		// No held chorus at the water. One was built — a second, looped recording of tropical frogs
		// bedded under the four animals on the stones — and the master sent it back inside the hour: "really weird
		// sounds around the lake", "high-pitched", and then the word that settles it about the croak they chose
		// themselves: "that sound is holy". The frogs in this garden are the ones in `sounds/frogs-night.mp3`,
		// called animal by animal from the stones, exactly as they were in v0.98.3, and nothing else talks at the
		// water. The trickling stream keeps its own small bed, and `M` takes both.
		// No cricket bed. One was tried, and the master asked what the waterfall was. There is no waterfall in
		// this garden: the answer was the borrowed "crickets" — three and a half minutes whose loudest band is
		// 220 Hz, and whose loudest quarter-second is only twice its quietest. That is a wind, or a stream, baked
		// into a file; it is not a chorus of insects. Crickets are left out of the Villa for now, and a recording
		// that does not measure as chirps (see `tools/ears.js`) does not get in.
	};
	if (sound) {
		const arm = (how) => {
			if (!sound.ready) sound.arm(how);
			startBeds();
		};
		const keyHeld = new Set();
		window.addEventListener("pointerdown", () => arm("click"), { passive: true });
		window.addEventListener("keydown", (event) => {
			if (event.code === "KeyM") {
				// One tap, one change of mind, the same rule the flying key follows: a held M would flick the
				// garden in and out of silence forty times a second.
				if (!keyHeld.has("KeyM")) {
					arm("key");
					sound.toggle();
				}
				keyHeld.add("KeyM");
				return;
			}
			arm("key");
		});
		window.addEventListener("keyup", (event) => keyHeld.delete("KeyM"));
		window.addEventListener("blur", () => keyHeld.clear());
	}
	// The butterflies and the cockroach, last of all, so they are not in the pool's mirror: a five
	// centimetre dot baked into a 256-pixel cube of the garden is nothing to see and a thing that ought
	// not to be frozen there in any case. `?bugs=0` leaves them out, which is how they were weighed.
	// Which of the pond's stones a visitor on the bank can actually see, asked now that the garden is
	// standing: see `markPerches` in src/pond.js. The frogs are given this before they are built, so a
	// frog's home stone is a stone somebody sees.
	const perchesSeen = pond.markPerches ? pond.markPerches(scene) : 0;
	if (dial("bugs", 1) > 0) creatures = buildCreatures(scene, mats, ground, {
		roachCm: dial("roach", 14),
		frogCm: dial("frog", 13),
		sound,
		// The frogs are given the ear and word of when it is dark, because a croak is a sound and this Villa
		// had never made one before: the throat has been inflating on those stones for forty releases.
		isNight: () => nightHeld,
		perches: pond.perches,
		// The frogs are told where the middle of the water is, how high its surface lies, how to mark a
		// plunge on it, and where the visitor stands — which is the whole of what a frog needs to know about
		// a pond and about a person at the edge of one.
		pond: {
			middle: { x: pond.plan.cx, z: pond.plan.cz },
			waterY: pond.plan.waterY,
			splash: pond.splash,
			visitor: () => camera.position,
		},
	});
	// The koi, in the pond. They are built here rather than inside `buildCreatures` because they need the
	// pond's whole plan — its walls, its surface, its floor — and everything else that is alive only needs to
	// know where the ground is. The same `?bugs=0` leaves them out too: they are creatures and not fittings.
	let koi = null;
	if (dial("bugs", 1) > 0) {
		koi = buildKoi(scene, mats, {
			plan: pond.plan,
			middle: { x: pond.plan.cx, z: pond.plan.cz },
			waterY: pond.plan.waterY,
			splash: pond.splash,
			visitor: () => camera.position,
		});
	}
	// The shark in the pool (`src/shark.js`), and the blood it leaves (`src/blood.js`). Built with the other
	// living things and after the pool's mirror, so neither the animal nor a red cloud is baked into the
	// cube the water reflects: a moving thing in a mirror that is rendered once is a thing painted on glass.
	//
	// It is given the pool's own plan, the way to mark a disturbance on its surface, and where the visitor
	// stands, and it is told what a bite is worth: `onBite` is the ONLY thing that may touch the visitor, and
	// what it does is knock the camera and put a red ring at the edges of the sight for a moment. The visitor
	// is not hurt, cannot be hurt, and nothing else about them changes.
	if (dial("shark", 1) > 0) {
		shark = buildShark(scene, mats, {
			...pool.bounds,
			splash: pool.splash,
			visitor: () => camera.position,
		}, {
			onBite: ({ power }) => {
				// A hard bite is a knock and a red sight; a snap that came up short of the boot is a shake of
				// the head and a pink flush, which is what the visitor can actually see coming at them.
				knock = Math.max(knock, 0.55 + power * 0.45);
				sting = Math.max(sting, 0.35 + power * 0.5);
			},
		});
	}
	// A stopped clock for the creatures, so a camera can be aimed at a place they are actually in.
	const still = switches.has("still");
	// The two fireflies (`src/fireflies.js`). Built with the other living things and switched off until dark
	// by the day below: a firefly in daylight is not a firefly.
	let fireflies = null;
	if (dial("bugs", 1) > 0) fireflies = buildFireflies(scene, mats, ground);
	// The day (`src/daylight.js`). One number — the hour — moves the sun, the sky's fill, the bounce, the
	// haze, the sky in the mirrors and every lamp in the garden, and it says who of the small living things
	// is awake. It starts at half past five, which is where this Villa has always stood, and the row of the
	// table it starts on is that Villa's numbers to the byte, so every picture in `pictures/` still means
	// what it said. A whole day takes `?daylen` seconds — six minutes, so the light is visibly different
	// whenever a visitor looks up from one corner to another — and `?still=1` or `?daylen=0` pins it.
	const plate = document.querySelector("#plate .note");
	// The geckos on the villa walls (`src/gecko.js`): four of them, and every one of them on a face with a
	// light behind it or on it. Two are on the outside of the front glass, where a gecko sits against the light
	// of the room and is seen as a shape and two beads — which is how a gecko is actually found at ten at night,
	// and the answer to the master's "discoverable, not obvious". One is on the west wall between the shuttered
	// windows for whoever walks the west path, and one on the east wall over the store room's end.
	let geckos = null;
	if (dial("gecko", 1) > 0 && sound) {		geckos = buildGeckos(scene, mats, {
			sound,
			spots: [
				{ x: -2.95, y: 2.42, z: -3.9, face: [0, 0, 1], seed: 11 },
				{ x: 4.25, y: 1.6, z: -3.9, face: [0, 0, 1], seed: 23 },
				{ x: -7.05, y: 1.95, z: -6.3, face: [-1, 0, 0], seed: 37 },
				{ x: 7.05, y: 2.12, z: -6.9, face: [1, 0, 0], seed: 53 },
			],
		});
	}
	// The bird on the ridge (`src/raven.js`): it comes, it sits, it calls from up there and you hear it before you
	// find it, and every few days of the Villa's own day it drops a gold coin into the yard and the coin is still
	// there when the page is opened again — which is why the day count and where the coins fell are written into
	// `localStorage`, and why `?raven=0` is here for anyone who wants the garden without the bird.
	let raven = null;
	if (dial("raven", 1) > 0) raven = buildRaven(scene, mats, { ground, sound });
	// The gun (`src/weapon.js`). It is not on the plate and it is not offered: the Villa is a garden, and the
	// first thing a visitor meets ought to be the garden. It is asked for by typing `g u n`, and the same three
	// letters put it away. `?gun=0` leaves it out of the build for anyone photographing the place without it.
	let gun = null;
	let launcher = null;
	if (dial("gun", 1) > 0) {
		// The rocket launcher (`src/rocket.js`) is built with the gun and lives inside it: `5` while the gun is
		// in your hands swaps the gun for the tube. One switch covers both, because a visitor who has no gun has
		// no use for a launcher either.
		launcher = dial("rocket", 1) > 0 ? buildRocket(scene, mats, { camera, sound, ground, villa: villaParts }) : null;
		gun = buildWeapon(scene, mats, { camera, pool, shark, sound, launcher });
		// `R` already brings the visitor back to where they started. It also puts the house back: the Villa is the
		// work, and a visitor who can take the house apart and not put it back has lost the thing they came to
		// walk in. The listener is a second one and not a line inside the walk's own, because the walk does not
		// know that a launcher exists.
		if (launcher) {
			window.addEventListener("keydown", (event) => {
				if (event.code === "KeyR") launcher.restore();
			});
		}
	}
	// The flashlight (`src/flashlight.js`): `F`, and the night becomes a place you can walk in. It is built
	// whether or not there is a gun, because the garden at midnight is the reason to be out in it.
	let flashlight = null;
	if (dial("flash", 1) > 0) {
		flashlight = buildFlashlight(scene, mats, { camera, shadows });
		const flashHeld = new Set();
		window.addEventListener("keydown", (event) => {
			if (event.code !== "KeyF") return;
			// One tap, one change of mind: a held `F` would stutter the beam forty times a second, which is a
			// seizure and not a signal.
			if (!flashHeld.has("KeyF")) flashlight.toggle();
			flashHeld.add("KeyF");
		});
		window.addEventListener("keyup", (event) => flashHeld.delete("KeyF"));
		window.addEventListener("blur", () => flashHeld.clear());
	}
	// The day has to be counted and not merely told, because "every few days" is the whole of the raven's bill and
	// the day clock only knows the hour. It ticks when the hour goes past midnight, and so a page left open
	// overnight gets its coin overnight, which is what a bird would have done.
	let lastHour = dial("hour", 17.5);
	const day = buildDayCycle(scene, {
		sky, light, hemi, bounce, mats,
		water: mats.water,
		// Materials whose emissive colour stands for daylight — on the water, in the damp earth of the
		// watercourse's banks, and coming through the garden's leaves. None of them has a lamp of its own, so the
		// day cycle takes the borrowed light back when the sun goes; see `sunGlow` in `src/daylight.js`.
		sunGlow: [
			{ mat: mats.pondWater, amount: 0.92 },
			{ mat: mats.streamWater, amount: 0.92 },
			{ mat: mats.streamEarth, amount: 0.92 },
			// The veil is the one surface in the garden that draws all its light from itself (`disableLighting`),
			// so its emissive is not a nudge but the whole of it: taken down to a fifth, it is a dim silver thread
			// under the moon instead of a lit sheet at midnight.
			{ mat: mats.streamFall, amount: 0.8 },
			...["bush", "bushEdge", "bushLeaf", "palmLeaf", "bananaLeaf", "jungle", "jungleFar", "tuft", "hedge", "hedgeCrest", "lilyHeart"]
				.map((name) => ({ mat: mats[name], amount: 0.62 })),
		].filter((entry) => entry.mat),
		roomLamps: scene.roomLamps,
		// Every lamp in the garden that is out by day and burning by night: the two cases at the back door
		// (`src/villa.js`). Anything else that wants to burn at night — a lantern on a post, a bulb on a wire —
		// joins this list and the day cycle does the rest.
		nightLamps: scene.nightLamps,
		poolLights: pool.lights,
		start: dial("hour", 17.5),
		daySeconds: still ? 0 : dial("daylen", 360),
		noFog: switches.has("nofog"),
		// An address-bar dial that names a light beats the table. `?sun=0` has to mean the sun is off at
		// whatever hour the day is standing at — the tools that weigh a light by switching it clean off (the
		// note on `?room=` in src/interior.js, and half the numbers in `NOTES.md`) would otherwise be reading
		// the table and reporting the dial. This was found the hard way: the first noon was measured with
		// `?sun=0` and the glass did not move a single point, because the day was writing the sun back.
		locks: {
			sun: switches.has("sun"),
			hemi: switches.has("hemi"),
			sky: switches.has("sky"),
			rayl: switches.has("rayl"),
			turb: switches.has("turb"),
			env: switches.has("env"),
		},
		// The two cubemaps, redrawn when the light has moved enough to matter, and how the sky cube is
		// softened for rough surfaces afterwards (`prefilter` is what makes a glossy surface blur its own
		// reflection instead of mirroring it in focus).
		refreshSky: () => envCube.render(),
		refreshView: () => { if (poolCube) poolCube.render(); },
		prefilter: () => hdrFilter.prefilter(envCube).catch(() => {}),
		// Who is awake. Butterflies by day, cockroaches and fireflies by night (`src/creatures.js`,
		// `src/fireflies.js`), and the frogs are left alone, being amphibious and particular about nothing
		// except being left alone.
		onNight: (isNight) => {
			nightHeld = isNight;
			if (creatures) creatures.night(isNight);
			if (fireflies) fireflies.night(isNight);
			if (geckos) geckos.night(isNight);
		},
		// The line of type under the villa's name says what hour it is, because the Villa no longer keeps one.
		onHour: (hour) => { if (plate) plate.textContent = `a Thai pool villa, ${hourWords(hour)}`; },
	});
	day.set(day.hour);
	// `?float=1` is for the tools: the camera is pinned exactly where the address bar put it and no key
	// moves it. That is not the visitor's fly mode (`?fly=1`, or space): there the ground stops holding
	// them up, but W A S D still carry them, along the line they are looking.
	if (switches.has("float")) pinned = true;
	if (switches.has("fly")) walk.fly(true);
	if (switches.has("view")) {
		const [x, y, z, yaw, pitch] = switches.get("view").split(",").map(Number);
		camera.position.set(x, y, z);
		camera.rotation.set(pitch || 0, yaw || 0, 0);
		// Standing the visitor on the ground, unless the picture wants them exactly where asked.
		if (!pinned) walk.settle();
	}

	window.addEventListener("resize", () => engine.resize());
	window.addEventListener("error", (event) => reportFailure(event.error || event.message));

	// Whether the last frame left the day's lamps shaded by a cloud. Outside the loop, because inside it the
	// flag would be born again every frame and the branch that puts the light back would never be reached.
	let litShaded = false;
	engine.runRenderLoop(() => {
		const delta = engine.getDeltaTime() / 1000;
		time += delta;
		if (!pinned) walk.step(delta);
		pool.animate(time, delta);
		// The pond wants the delta as well as the clock: its ripple rings are spent over a span of seconds,
		// and a ring that is never given a delta is a ring that sits on the water for the rest of the day.
		pond.animate(time, delta);
		if (stream) stream.animate(time, delta);
		if (creatures) creatures.animate(still ? 0 : time, still ? 0 : delta);
		// The ear goes where the eye goes, and the geckos are told where the boots are so they can be shy of
		// them. Both are cheap and both are wrong without the frame they live in.
		if (sound) sound.listen();
		if (geckos) {
			geckos.visit(camera.position);
			geckos.animate(still ? 0 : time, still ? 0 : delta);
		}
		// The raven is told the hour, whether it is dark, whether the hour has just gone past midnight, and how
		// long the Villa has been awake: the first two decide where the bird is, the third pays out a coin and the
		// fourth is the only clock that does not skip when the tab is left in a corner.
		if (raven) {
			const wrapped = day.hour < lastHour - 0.5;
			lastHour = day.hour;
			raven.animate({ delta: still ? 0 : delta, night: !!nightHeld, wrapped, elapsed: time });
		}
		if (duck) duck.animate(still ? 0 : time);
		if (fireflies) fireflies.animate(still ? 0 : time, still ? 0 : delta);
		// The day goes on whether the small things are frozen or not — unless `?still=1`, which stops it too,
		// because a picture that is drawn twice has to mean the same thing both times.
		if (!still) day.advance(delta);
		if (koi) koi.animate(still ? 0 : time, still ? 0 : delta);
		if (shark) shark.animate(still ? 0 : time, still ? 0 : delta);
		// The gun is the visitor's own action and not one of the animals, so its clock is never stopped: a tool
		// that photographs a spurt on the water does it in a still picture, and a mark that only appears when
		// the day happens to be running would be a mark nobody could aim at.
		if (gun) gun.animate(delta);
		if (launcher) launcher.animate(time, delta);
		if (flashlight) flashlight.step();
		// A cloud twenty-six metres over the garden shades the garden, and the day knows nothing about it: the
		// sun, the sky's fill and the bounce are all written from the hour alone. So the shade is multiplied in
		// here — after the day has written its numbers and after the cloud has measured itself, and before the
		// frame is drawn — and it is multiplied rather than set, so that `?sun=3` and `?hemi=1` still mean what
		// they say. The sun loses more than the fill does because a cloud stops the sharp light and lets the grey
		// light through: the shadows go soft and the garden stays legible, which is what a cloud does and is not
		// the same thing as a dimmer.
		if (launcher && launcher.shade > 0) {
			const under = launcher.shade;
			const wrote = day.state.lamps;
			light.intensity = wrote.sun * (1 - 0.62 * under);
			hemi.intensity = wrote.hemi * (1 - 0.34 * under);
			bounce.intensity = wrote.bounce * (1 - 0.5 * under);
			litShaded = true;
		} else if (litShaded) {
			// And put the day's own numbers back. Without this branch the garden would stay dim after the cloud
			// went, because under `?still=1` the day writes nothing at all and the lamps keep whatever they were
			// last handed.
			const wrote = day.state.lamps;
			light.intensity = wrote.sun;
			hemi.intensity = wrote.hemi;
			bounce.intensity = wrote.bounce;
			litShaded = false;
		}
		// What a bite leaves on the visitor: a roll of the sight that is gone in half a second, and a red
		// ring at the edges of the sight that takes a second and a half to drain out of the picture.
		//
		// The roll is written onto the FRAME and wiped off again in the same frame, and it is never left on the
		// camera at all. It used to be: `knock` set `camera.rotation.z` and a later branch put it back to zero when
		// the counter ran out, and that is a worse arrangement than it sounds. The walk reads its heading out of
		// the camera every frame, so a camera rolled by the animal is a camera that walks the visitor somewhere they
		// did not steer; and a reset that only happens on the frame the counter hits zero is a tilt that can be
		// left behind by anything that eats that frame — a backgrounded tab, a slow frame, an exception, a second
		// bite arriving before the first has finished. So the roll goes on immediately before `scene.render()` and
		// comes off immediately after, whatever the render does, and the only thing the animal is ever allowed to
		// hold is one picture.
		if (knock > 0) knock = Math.max(0, knock - delta * 2.4);
		const jolt = knock > 0 ? Math.sin(time * 44) * 0.03 * knock : 0;
		if (sting > 0 || stingShown) {
			sting = Math.max(0, sting - delta * 0.8);
			stingShown = sting > 0;
			// The vignette multiplies: whatever colour is in it is what the edges of the sight are multiplied BY.
			// So a red flush is made by leaving the red channel alone and taking the other two away, and NOT by
			// painting red into it — the first attempt put red IN the multiplier, which darkened all three and
			// came out as a brown corner five points down. Drained, this is the everyday vignette again, byte for
			// byte, and not something close to it.
			const red = pipeline.imageProcessing.vignetteColor;
			red.r = 0.13 + sting * 0.87;
			red.g = 0.1 * (1 - sting * 0.9);
			red.b = 0.08 * (1 - sting * 0.9);
			pipeline.imageProcessing.vignetteWeight = 1.2 + sting * 1.8;
		}
		const rollWas = camera.rotation.z;
		camera.rotation.z = rollWas + jolt;
		try {
			scene.render();
		} finally {
			camera.rotation.z = rollWas;
		}
	});
	document.body.classList.add("ready");
	window.__villa = { engine, scene, camera, mats, sun, sunLight: light, hemi, bounce, ground, walk, pipeline, tone, creatures, koi, shark, pond, pool, stream, duck, fireflies, day, sound, geckos, raven, gun, launcher, flashlight };
	// The two numbers a bite leaves, for the tools. Read them to see what the animal left behind; write them to
	// pose a flinch, because a jolt that lasts a third of a second is not something a picture can wait for.
	window.__villa.bite = {
		get knock() { return knock; },
		set knock(value) { knock = value; },
		get sting() { return sting; },
		set sting(value) { sting = value; },
	};
}

/** How the visitor moves: the keys walk, the mouse looks, the ground holds them up — until they fly. */
function setupWalking(ground, { wantLock = true } = {}) {
	const EYE = 1.6; // soles to eye, metres
	const WALK = 5.5;
	const RUN = 9.5;
	// Flying: a move faster than a run, since on the wing you cross the whole garden and the roof
	// tops as well, and a shift-push on top of that for anyone who wants to reach the jungle belt.
	const FLY = 8;
	const FLY_RUN = 18;
	const FALL = 11; // metres a second coming back down: no bouncing, and no nose-dive kept up
	const SKIN = 0.3; // how close to the ground a flyer may get, so a dive ends at the grass
	const CEILING = 220; // above this the Villa is a stamp and the sky is a smear

	// Whether the ground is holding the visitor up. Space takes that away and gives it back.
	let flying = false;
	let gravity = true;

	// The keys are ours, not Babylon's: its keyboard input listens on the canvas, which no browser
	// focuses on its own, and the movement it makes wants a collision engine to consume it.
	const down = new Set();

	// One word on the plate, so a tap of space is answered by something the eye is already on.
	const note = document.querySelector("#plate .note");
	const WALKED_NOTE = note ? note.textContent : "";
	const FLOWN_NOTE = "on the wing over the garden";
	const setNote = () => {
		if (note) note.textContent = flying ? FLOWN_NOTE : WALKED_NOTE;
	};

	const turn = 0.0026;
	let dragging = false;
	let lastX = 0;
	let lastY = 0;
	let lastMove = 0;
	// How long a gap in the mouse's movements is not a movement at all but a return to the page: an alt-tab, a
	// stall, a lock the browser took back without asking. The distance across such a gap is a jump, and a jump of
	// two hundred pixels at this sensitivity is half a turn of the world, aimed at the floor, at the exact moment
	// the visitor was trying to walk somewhere. The master called this "the camera does not restore after being
	// bitten", and the bite was only ever the thing that made a person move their hand.
	const STALE = 240;

	const setPitch = (value) => {
		camera.rotation.x = Math.max(-1.25, Math.min(1.25, value));
	};

	const look = (dx, dy) => {
		camera.rotation.y += dx * turn;
		setPitch(camera.rotation.x + dy * turn);
	};

	const rebase = (event) => {
		lastX = event.clientX;
		lastY = event.clientY;
		lastMove = event.timeStamp || performance.now();
	};

	canvas.addEventListener("pointerdown", (event) => {
		dragging = true;
		rebase(event);
		// THE SIGHT TAKES THE MOUSE, AS AN FPS DOES, and that is the default. The first click on the picture asks
		// the browser for a pointer lock: after it the sight follows the hand with no button held, which is what a
		// person walking a garden with a shark in the pool expects. `?lock=0` puts the old drag-only control back
		// for anyone who would rather keep their cursor.
		//
		// What makes a lock safe to take by default is not the lock, it is the two guards below. A lock can be
		// taken back at any moment without asking — Escape, a backgrounded tab, a browser that simply tires of it —
		// and the movement that arrives in the same instant as such a change is a jump of two hundred pixels, half
		// a turn of the world aimed at the floor, at the exact moment the visitor was trying to walk somewhere. So
		// a movement that comes too soon after another, or across a lock changing hands, is thrown away; and the
		// drag path underneath still works, so a lost lock costs nothing but the habit of holding the button.
		if (wantLock) {
			// `setPointerCapture` throws `InvalidStateError` when the pointer is not in a state to be captured — a
			// synthetic pointer, a pointer already gone, a second request while the browser is still deciding about
			// the first. Measured: the Villa logged `page error: Failed to execute 'setPointerCapture'` and carried
			// on, which is the right OUTCOME and the wrong way to get there. So it is asked for and refused in the
			// same breath, and the lock below is what actually matters.
			try {
				if (canvas.setPointerCapture && canvas.hasPointerCapture && !canvas.hasPointerCapture(event.pointerId)) {
					canvas.setPointerCapture(event.pointerId);
				}
			} catch (error) {
				/* the pointer is not capturable: dragging still works, and the lock does not need it */
			}
			const request = canvas.requestPointerLock || canvas.webkitRequestPointerLock;
			if (request) {
				try {
					const result = request.call(canvas);
					if (result && result.catch) result.catch(() => {});
				} catch (error) {
					/* no pointer lock is fine: dragging still works */
				}
			}
		}
	});

	canvas.addEventListener("pointermove", (event) => {
		const now = event.timeStamp || performance.now();
		const gap = now - lastMove;
		if (document.pointerLockElement === canvas) {
			// Under a lock there are no coordinates to re-base from, only a delta — so a long gap is thrown away
			// instead, which is the same protection stated in the only units this path is given.
			if (gap < STALE) look(event.movementX || 0, event.movementY || 0);
			lastMove = now;
			return;
		}
		if (!dragging) return;
		if (gap < STALE) look(event.clientX - lastX, event.clientY - lastY);
		rebase(event);
	});

	// Letting go is listened for on the window and not on the canvas, because a person who drags past the edge of
	// the picture and releases there does tell the window about it and does not tell the canvas.
	const stopDrag = () => {
		dragging = false;
	};
	window.addEventListener("pointerup", stopDrag);
	window.addEventListener("pointercancel", stopDrag);
	window.addEventListener("blur", stopDrag);
	// And when a lock is lost or gained — however it is lost, and the browser never asks — the drag is over
	// whatever the mouse was doing a moment ago, and `lastMove` is zeroed so the first movement across that
	// change is thrown away instead of being read as a swipe across the whole garden.
	const changeHands = () => {
		dragging = false;
		lastMove = 0;
	};
	document.addEventListener("pointerlockchange", changeHands);
	document.addEventListener("pointerlockerror", changeHands);

	const forward = new Vector3(0, 0, 1);
	const right = new Vector3(1, 0, 0);
	let feet = 0;

	/** Put the visitor down on the ground under them, at once. */
	const settle = () => {
		feet = ground.heightAt(camera.position.x, camera.position.z) + EYE;
		camera.position.y = feet;
	};
	settle();

	/** Off the ground, or back on it: what the space bar does, and what `?fly=1` did at the start. */
	const changeFlight = (on = !flying) => {
		flying = !!on;
		gravity = !flying;
		// Let go of the ground's height wherever in the air the visitor is: on the way back down,
		// `feet` starts there and gravity walks it to the floor.
		feet = camera.position.y;
		setNote();
		return flying;
	};

	window.addEventListener("keydown", (event) => {
		if (event.code === "Space") {
			// One tap, one change of mind. A key held down repeats, and a repeating space would
			// flick between walking and flying forty times a second.
			if (!down.has("Space")) changeFlight();
			// space would also scroll a page, and there is no page here
			event.preventDefault();
			down.add("Space");
			return;
		}
		down.add(event.code);
		if (event.code === "KeyR") {
			camera.position.copyFrom(START_POSITION);
			camera.rotation.copyFrom(START_LOOK);
			flying = false;
			gravity = true;
			setNote();
			settle();
		}
	});
	window.addEventListener("keyup", (event) => down.delete(event.code));
	window.addEventListener("blur", () => {
		dragging = false;
		down.clear();
	});

	const pressed = (codes) => codes.some((code) => down.has(code));

	return {
		settle,
		fly: changeFlight,
		flying: () => flying,
		step(delta) {
			const ahead = pressed(["KeyW", "ArrowUp"]) ? 1 : 0;
			const back = pressed(["KeyS", "ArrowDown"]) ? 1 : 0;
			const rightward = pressed(["KeyD", "ArrowRight"]) ? 1 : 0;
			const leftward = pressed(["KeyA", "ArrowLeft"]) ? 1 : 0;
			const push = new Vector3(rightward - leftward, 0, ahead - back);
			if (push.lengthSquared() > 0) {
				// Walking, the heading comes out of the yaw and from nowhere else: a flat forward and a flat right,
				// both exactly one metre long, whatever the sight is doing. It used to be read off the camera with
				// `getDirectionToRef` and then have its height rubbed off, which was two faults standing in a trench.
				// Rubbing `forward.y` off a vector that was pointing at the roof leaves a stub, and a stub is a step
				// taken at a tenth of the speed — look down at the water, where the shark is, and the walk goes heavy
				// under you. And a direction read off the camera is a direction the camera can bend: anything that
				// rolls the sight, a bite or any future sway, steers the visitor as well.
				if (!flying) {
					forward.set(Math.sin(camera.rotation.y), 0, Math.cos(camera.rotation.y));
					right.set(Math.cos(camera.rotation.y), 0, -Math.sin(camera.rotation.y));
				} else {
					// Flying, the sight line is what you are steered by, up included: look where you want to go and
					// press forward. No new keys for the visitor to remember.
					camera.getDirectionToRef(BABYLON.Axis.Z, forward);
					camera.getDirectionToRef(BABYLON.Axis.X, right);
					right.y = 0;
				}
				const running = down.has("ShiftLeft") || down.has("ShiftRight");
				const speed = flying ? (running ? FLY_RUN : FLY) : running ? RUN : WALK;
				const step = (delta * speed) / Math.max(1, push.length());
				const dx = (forward.x * push.z + right.x * push.x) * step;
				const dz = (forward.z * push.z + right.z * push.x) * step;
				if (flying) {
					// Over the garden, the water and the roof. The blockers are walls read as columns
					// that run from the ground up, so a column that stops you at 30 m is not a wall, it
					// is a cage: on the wing the walk's keep-off rectangles are simply let go of.
					camera.position.x += dx;
					camera.position.z += dz;
					camera.position.y += forward.y * push.z * step;
					// Nowhere near the grass, and no orbiting the planet from the edge of space.
					const floor = ground.heightAt(camera.position.x, camera.position.z) + SKIN;
					camera.position.y = Math.min(CEILING, Math.max(floor, camera.position.y));
					feet = camera.position.y;
				} else {
					// one axis at a time, so a wall slides you along it instead of stopping you
					const nx = camera.position.x + dx;
					const nz = camera.position.z + dz;
					if (ground.free(nx, camera.position.z)) camera.position.x = nx;
					if (ground.free(camera.position.x, nz)) camera.position.z = nz;
				}
			}
			// the ground either holds you up or it does not: ease the height so a step up is not a jump
			if (gravity) {
				const target = ground.heightAt(camera.position.x, camera.position.z) + EYE;
				if (feet > target + 0.002) {
					// Coming down is a fall at a set pace, not a rubber band: stepped off a roof, an
					// eased drop starts at a hundred metres a second and goes straight through the
					// floor on the way, which is how the old float switch left a person at y = -45 m.
					feet = Math.max(target, feet - FALL * delta);
				} else {
					feet += (target - feet) * Math.min(1, delta * 14);
				}
				camera.position.y = feet;
			}
		},
	};
}
