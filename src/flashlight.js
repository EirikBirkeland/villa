// The visitor's flashlight.
//
// `F` switches it on, `F` again puts it out. It hangs off the sight, so wherever the visitor is looking is where
// the beam falls, and it is worth having because the night here is genuinely dark: measured at a quarter to
// midnight on the pond's bank, the middle of the picture sits at 19 of 255, and the paving under the sight at 11.
// Nothing else in the Villa lets a visitor choose to light the garden — the lamps of the house are fixed to the
// house — and the moon was never meant to be a reading lamp.
//
// Two things make the beam, and they are deliberately separate things:
//
//   a SPOTLIGHT, which is what actually lights the paving, the water and the leaves;
//   a CONE of dust, a pale solid, which is what a beam looks like from the side, because light crossing clean
//   air is invisible and a torch in a real garden shows up in the dust and moisture of the air.
//
// The cone is drawn as a solid of a few points of alpha rather than with a real volumetric light, which is what
// a browser will do sixty times a second, and it is switched off when the lamp is off. Both are the visitor's own
// device, so neither is part of the day cycle's lighting of the garden: the day cycle does not know about it,
// and the torch works at noon as well as at midnight, dim as it is then.
//
// `step()` runs in the render loop and is a no-op while the lamp is out and settled.
// Babylon is loaded here as a global script, the same as every other file in this folder: nothing is fetched
// from a package at run time, so there is nothing to import.
const { Color3, MeshBuilder, SpotLight, TransformNode, Vector3 } = BABYLON;

// The numbers below were swept in the dark, with a night picture read three ways: the ground the beam is on, the
// whole frame, and the top strip of the frame, which is where too much dust shows up as a pale wash over the sky.
// The cone of dust does most of the work of making a beam LOOK like a beam: at 0.03 it lifted the ground under the
// sight from 21 of 255 to 32 and left the sky at 20, which is what is wanted — light where the beam is, night
// everywhere else. At 0.06 the ground reached 41, which is a searchlight; at 0.015 it was barely a beam. Drawn
// longer than about nine metres the cone starts washing the sky, because a nine-metre cone seen from its own tip
// covers the whole view, and thirteen metres washed the sky from 20 to 31.
//
// The lamp's own strength is a bigger number than it looks, because a spot light's intensity is spread over the
// whole cone: measured with the dust hidden and the sight on the paving two metres below, 2.4 lifted the middle
// of the picture from 11 to 14 and the brightest of it from 14 to 26.
const LAMP = 4; // the lamp's strength when lit
const DUST = 0.03; // how much of the filament's warm white the air hands back
const REACH = 8; // metres the cone is drawn for: it is dust, not a laser

export function buildFlashlight(scene, mats) {
	const api = {
		// Written by `toggle()`, read every frame. A tool may write these too, which is the only honest way to
		// sweep them: `step()` would otherwise overwrite anything a page tried to set.
		lit: false,
		lamp: LAMP,
		dust: DUST,
		reach: REACH,
	};

	// The lamp. Warm, because a torch is a filament and not the moon, and the garden's own lamps are warm too;
	// a cold white beam reads as a police searchlight.
	//
	// The spread is written by name after the light is made. When it was passed by position it landed in the
	// constructor's `exponent` slot, and nine there narrows the beam to a pinprick: with the cone of dust hidden,
	// the light then moved the middle of a night frame by one point of luma, which is to say it lit nothing at
	// all. Two is the even pool a real torch throws.
	const light = new SpotLight("flashlight", new Vector3(0, 1.6, 0), new Vector3(0, 0, 1), 0.62, 0, scene);
	light.exponent = 2;
	light.diffuse = new Color3(1, 0.93, 0.79); // a filament, not the moon
	light.specular = new Color3(0.7, 0.66, 0.6);
	light.range = 26;
	light.intensity = 0;

	// The cone. A tube that starts thin at the eye and opens to a little over half a metre across at the end of
	// its nine metres, which at the angles involved is about the width of the pool of light on the ground. It is
	// a solid, unlit and shadowless, so it is a bright shape and never a hole in the dark: the night has plenty
	// of black in it and a shadow-casting cone would put more.
	const beam = new TransformNode("flashlightBeam", scene);
	const cone = MeshBuilder.CreateCylinder(
		"flashlightCone",
		{ diameterTop: 0.05, diameterBottom: 0.075, height: 1, tessellation: 16, sideOrientation: MeshBuilder.DOUBLESIDE },
		scene,
	);
	cone.material = mats.flashlightBeam;
	cone.isPickable = false;
	cone.applyFog = false;
	// A metre of tube, tipped so its length runs along the beam's own forward, scaled to the reach in `step()`.
	// Half a metre of that tube is a metre of reach, and the scaling is along the tube's own axis, which is why
	// the length is set here and not the width: the tip of the cone is where the light actually goes.
	cone.rotation.x = -Math.PI / 2;
	cone.position.z = 0.5;
	beam.setEnabled(false);
	cone.parent = beam;

	const forward = new Vector3(0, 0, 1);
	const right = new Vector3(0, 0, 0);
	const down = new Vector3(0, 0, 0);

	let intensity = 0;
	let last = -1;

	const place = () => {
		const c = scene.activeCamera;
		// The torch is carried at the shoulder, not at the eyeball: hanging the lamp a hand's width below and
		// beside the sight means the cone does not fill the middle of the screen it is lighting, and the pool of
		// light sits a little under the sight line the way a real beam does when the arm is not level.
		c.getDirectionToRef(Vector3.Forward(), forward);
		c.getDirectionToRef(Vector3.Right(), right);
		c.getDirectionToRef(Vector3.Down(), down);
		light.position.set(
			c.position.x + forward.x * 0.18 + right.x * 0.16 + down.x * 0.22,
			c.position.y + forward.y * 0.18 + right.y * 0.16 + down.y * 0.22,
			c.position.z + forward.z * 0.18 + right.z * 0.16 + down.z * 0.22,
		);
		light.direction.set(forward.x, forward.y, forward.z);
		beam.position.copyFrom(light.position);
		beam.rotation.set(Math.atan(Math.hypot(forward.x, forward.z) > 1e-5 ? -forward.y / Math.hypot(forward.x, forward.z) : 0), Math.atan2(forward.x, forward.z), 0);
	};

	api.toggle = () => {
		api.lit = !api.lit;
		beam.setEnabled(api.lit);
		return api.lit;
	};
	api.on = () => {
		if (!api.lit) api.toggle();
	};
	api.off = () => {
		if (api.lit) api.toggle();
	};

	api.step = (dt = 16) => {
		// The cone is scaled to the reach, and re-scaled only when that number moves, because scaling a mesh
		// every frame is work nobody asked for. Its diameter grows with it, which is what a fixed-angle beam does.
		if (cone.scaling.y !== api.reach) {
			cone.scaling.y = api.reach;
			cone.scaling.x = api.reach;
			cone.scaling.z = api.reach;
			cone.position.z = 0.5 * api.reach;
		}
		const to = api.lit ? api.lamp : 0;
		// Off is not instant on, and on is not instant off: clicking a torch is a hard click, but the dust in the
		// air takes a moment to fill the cone and to clear it, and a beam that snapped on and off like a strobe
		// would look like a fault rather than a device. About ninety milliseconds to settle, which is five or six
		// frames: enough to take the edge off, short enough that it still feels like the click of a switch.
		intensity += (to - intensity) * Math.min(1, dt / 90);
		// Settled. Without this the fade above never lands exactly on zero and the beam would be re-placed for the
		// rest of the afternoon, however dark it was.
		if (!api.lit && intensity < 0.004) intensity = 0;
		if (!api.lit && intensity === 0) {
			if (last !== 0) {
				place();
				light.intensity = 0;
				last = 0;
			}
			return;
		}
		place();
		light.intensity = intensity;
		const glow = api.lamp > 0 ? Math.max(0, Math.min(1, intensity / api.lamp)) : 0;
		// The cone is an ordinary additive blend, so the brightness IS the alpha: the emissive colour is fixed to
		// the filament's warm white and the amount of it let through rides the lamp's own fade, so the cone fills
		// and clears with the beam instead of snapping on.
		mats.flashlightBeam.alpha = api.dust * glow;
		last = intensity;
	};
	api.step(0);
	return api;
}
