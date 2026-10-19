// The day, and the night that comes after it.
//
// Why this file exists: the Villa was a single photograph. Every light in it — the sun at 60, the sky's fill
// at 6.8, the bounce at 6, the haze, the sky in the water — was tuned by hand against one another at one
// moment, half past five, and the whole place was that moment forever. One number (the hour) now moves them
// together, and the reason that matters is not realism for its own sake: it is that the Villa has lamps, and
// a lamp is worth nothing in a garden the sun is standing on. Two things a day gives that a permanent
// afternoon cannot — a dusk where the string bulbs earn their keep, and a night to put two fireflies in.
//
// HOW IT IS ARRANGED. One table, read top to bottom, each row a moment of the day with every number that
// changes written out in full. Between the rows the numbers are mixed. There are no formulas: a sun path
// solved from latitude and declination was written first and thrown out, because the Villa's half past five
// is not an astronomical half past five (the sun stands at azimuth 160, a low southern afternoon sun, and
// an ephemeris would have put it in the west), and every attempt to make the light agree with arithmetic
// instead of with the picture has cost this project more time than it is worth. So the table says what the
// light does, in the open, in words and numbers that can be argued with.
//
// THE ROW AT 17.5 IS SACRED. It carries the exact bytes the Villa has always stood at — sun 60 at
// (1, .71, .46), sky fill 6.8 at (.4, .58, .88), bounce 6, haze (.52,.62,.5) at .005, the dome's 0.22 and
// 4 and 2, and the environment at 0.4 — because every picture in `pictures/` and every number in `NOTES.md`
// was measured against them. Move that row and you move the Villa's reference frame, and the next session
// will not be able to tell a change from a memory.
//
// WHAT IS NOT IN THE TABLE, and why:
//   The tone curve. It is one curve for the whole day; the eye does the rest. Pulling it at night washed out
//     what little light there was.
//   The shadow map. The moon casts through the same lamp as the sun. At the moon's strength a shadow edge is
//     a rumour, which is the truth of moonlight anyway.
//   The bounce's DIRECTION. It is derived from the sun every frame, the same way `src/world.js` derived it
//     once at boot, so at half past five it is the same vector to the last decimal.
//
// THE MIRRORS. The pool's water and every glossy surface in the Villa read two cubemaps that are rendered
// ONCE (`skyCube` in src/main.js, `poolCube` besides it), because six draws of the world every frame is a
// price not worth paying for a sky that did not move. A sky that moves must pay something. So: the sky cube
// — six draws of one box — is refreshed at eight points of the day, and the pool cube, which is six draws of
// eleven hundred meshes, only at the four where the difference is undeniable: dawn, morning, dusk, night.
// Between them the pool's mirror is dimmed by the `night` column, which is both the truth (there is nothing
// to see at night, so there is nothing to mirror) and what hides a stale sunset in the water at midnight.

const { Color3 } = BABYLON;

/** A row of the table. `h` is the hour on a 24 clock; everything else is what the light does at that hour. */
const DAY = [
	// Midnight: the moon high in the south-west, a deep blue everything, and the lamps the only warm things.
	// Moon at 1.5 against the sun's 60 is a ratio of forty to one; the real figure is nearer a hundred and
	// fifty, and a night that dark is a black board with two white points in it, so it is a lie told on
	// purpose and it is the only one in this file.
	{
		h: 0, az: 212, el: 46, sun: 1.5, sunD: [0.4, 0.5, 0.76], sunS: [0.5, 0.56, 0.7],
		hemi: 0.95, hemiD: [0.16, 0.22, 0.42], hemiG: [0.09, 0.1, 0.14],
		bounce: 0.55, bounceD: [0.28, 0.32, 0.44],
		lum: 0.019, rayl: 1.0, turb: 1.5, fog: [0.045, 0.06, 0.1], fogD: 0.0055, env: 0.05, night: 1,
	},
	// The last hour of the night, held so the deep hours do not drift while nobody is looking.
	{
		h: 4.9, az: 236, el: 38, sun: 1.5, sunD: [0.4, 0.5, 0.76], sunS: [0.5, 0.56, 0.7],
		hemi: 1.05, hemiD: [0.16, 0.22, 0.42], hemiG: [0.09, 0.1, 0.14],
		bounce: 0.55, bounceD: [0.28, 0.32, 0.44],
		lum: 0.019, rayl: 1.0, turb: 1.5, fog: [0.045, 0.06, 0.1], fogD: 0.0055, env: 0.05, night: 1,
	},
	// Dawn, the sun on the line: the sky goes amber first and the ground keeps blue, and the lamps are still
	// burning because nobody has got up to switch them off. The dome is no darker than this and no cloudier:
	// at 0.05 with turbidity 2.6 the half of the sky away from the sunrise — which is all a north-facing view
	// ever gets — came out the colour of a wet slate roof, and a dawn with a grey ceiling is a Tuesday, not a
	// dawn. Less turbidity (the haze is what turns the anti-solar side to mud when the sun is low behind it)
	// and a little more luminance, and the north sky is a clean dark blue with a warm rim on the trees.
	{
		h: 5.7, az: 96, el: 0, sun: 5, sunD: [1, 0.42, 0.2], sunS: [1, 0.66, 0.4],
		hemi: 2.5, hemiD: [0.3, 0.34, 0.52], hemiG: [0.24, 0.24, 0.26],
		bounce: 2, bounceD: [0.5, 0.4, 0.34],
		lum: 0.075, rayl: 3.8, turb: 2.1, fog: [0.3, 0.27, 0.28], fogD: 0.006, env: 0.13, night: 0.7,
	},
	// Sunrise: a low orange rake, long shadows across the water, and the first moment the paving is warm.
	// Raised from 28 to 40 and the sky with it, because the first sunrise measured as a grey half-light —
	// mean L60, no rake to speak of, and every lamp still blazing — when the sun in this row is eight degrees
	// up and ought to be laying long shadows across the terrace. A low sun is weak, but 28 was weak in the
	// way of an overcast morning and not of a sunrise: the difference is that most of its light is in one
	// direction, and that needs the sun's own number to be worth something against the sky's.
	{
		h: 6.6, az: 108, el: 8, sun: 40, sunD: [1, 0.56, 0.3], sunS: [1, 0.76, 0.52],
		hemi: 5.3, hemiD: [0.38, 0.5, 0.8], hemiG: [0.36, 0.31, 0.26],
		bounce: 4.4, bounceD: [0.58, 0.46, 0.34],
		lum: 0.17, rayl: 4.0, turb: 2.0, fog: [0.44, 0.46, 0.42], fogD: 0.0055, env: 0.32, night: 0.05,
	},
	// Mid-morning: the sun has cleared the palms and the garden is itself again, cooler and whiter than the
	// late afternoon, which is the same light with the haze out of it.
	{
		h: 8.5, az: 130, el: 38, sun: 54, sunD: [1, 0.82, 0.66], sunS: [1, 0.9, 0.78],
		hemi: 6.4, hemiD: [0.4, 0.57, 0.86], hemiG: [0.42, 0.34, 0.24],
		bounce: 5.6, bounceD: [0.62, 0.5, 0.36],
		lum: 0.21, rayl: 4, turb: 2, fog: [0.51, 0.61, 0.51], fogD: 0.005, env: 0.39, night: 0,
	},
	// Noon: near overhead, the shadows under the things that cast them, and the hardest light the Villa ever
	// gets — but not the whitest, and 61 and not 70. The first noon was 70 at (1,.94,.85) with the fill up at
	// 7.6, and a browser showed what that is: the front glass, which is the biggest flat area in the start
	// view, came through at (243,207,165) — a sheet of cream with no room behind it — and the whole middle
	// band of the frame stood at L136 against L108 at half past five. A sun at the zenith is seen through less
	// air and is whiter than the evening's; it is not a lamp with the cover off. A third taken off the sun, a
	// shade of warmth put back in it, and a little out of the fill and the mirrors, and the glass shows the
	// room again instead of erasing it — the middle band of the frame came down from L136 to L125 and the mean
	// from 146 to 136, and the chairs behind the glass are furniture now.
	//
	// WHAT STILL BLOWS AT NOON, and it is not a fault: the middle of the front glass stays at (242,201,155).
	// That is the glass mirroring the sun out of the sky cube, high in the dome at noon and high in the
	// reflection from a standing eye — switched the sun's LAMP off (`?sun=0`) and it does not move a point,
	// because the dome keeps its sun; switched the room's own lamps off (`?room=0`) at half past five and the
	// same pixel falls to (58,53,39), which is what the room is then. A glazed south front at noon in this
	// climate is a mirror and a glare, and you do not see into it: leave it. The pixel sits on the tone curve's
	// shoulder, which is also why lowering the dome from 0.24 to 0.205 moved it not at all — a number already
	// past the ceiling does not care about being reduced. Note for whoever comes next and is tempted to chase
	// it: the trail leads to `mieCoefficient` in `src/world.js` and to the sky cube's raw HDR, not to this row.
	{
		h: 12, az: 150, el: 74, sun: 61, sunD: [1, 0.9, 0.78], sunS: [1, 0.93, 0.82],
		hemi: 7.1, hemiD: [0.44, 0.6, 0.9], hemiG: [0.44, 0.36, 0.26],
		bounce: 6.1, bounceD: [0.64, 0.54, 0.4],
		lum: 0.205, rayl: 4.0, turb: 1.9, fog: [0.55, 0.64, 0.56], fogD: 0.0042, env: 0.37, night: 0,
	},
	// Mid-afternoon: the light begins to lean again and to warm.
	{
		h: 15.4, az: 156, el: 46, sun: 66, sunD: [1, 0.85, 0.66], sunS: [1, 0.91, 0.76],
		hemi: 7, hemiD: [0.41, 0.58, 0.88], hemiG: [0.42, 0.34, 0.24],
		bounce: 6, bounceD: [0.62, 0.5, 0.36],
		lum: 0.23, rayl: 4, turb: 2, fog: [0.53, 0.62, 0.51], fogD: 0.0046, env: 0.41, night: 0,
	},
	// ---- HALF PAST FIVE. Do not move this row; see the head of this file. ----------------
	{
		h: 17.5, az: 160, el: 24, sun: 60, sunD: [1, 0.71, 0.46], sunS: [1, 0.88, 0.7],
		hemi: 6.8, hemiD: [0.4, 0.58, 0.88], hemiG: [0.42, 0.34, 0.24],
		bounce: 6, bounceD: [0.62, 0.5, 0.36],
		lum: 0.22, rayl: 4, turb: 2, fog: [0.52, 0.62, 0.5], fogD: 0.005, env: 0.4, night: 0,
	},
	// The last of the sun on the water: it goes down in the same quarter it came down all afternoon, and the
	// whole front of the house turns copper. The lamps come in here, because a lamp lit at sunset is what a
	// person actually does.
	{
		h: 18.6, az: 168, el: 5, sun: 44, sunD: [1, 0.54, 0.26], sunS: [1, 0.8, 0.5],
		hemi: 5.4, hemiD: [0.42, 0.5, 0.78], hemiG: [0.4, 0.32, 0.24],
		bounce: 5, bounceD: [0.6, 0.44, 0.3],
		lum: 0.15, rayl: 4.6, turb: 2.6, fog: [0.48, 0.44, 0.4], fogD: 0.0055, env: 0.3, night: 0.2,
	},
	// The afterglow: the sun is gone — only just, and that is the whole trick — the dome is still lit, and
	// this is the hour the string bulbs were designed for. Nothing here is bright and everything has colour.
	// The sun sits a degree under the line and the dome's own 0.075 rather than a dark 0.04: put it five
	// degrees down and the atmosphere shader has nothing left to scatter, and the sky behind a lit villa
	// came out a pure black board, which is what a camera sees and not what an eye sees at half past seven.
	{
		h: 19.5, az: 172, el: -1, sun: 2.5, sunD: [0.85, 0.42, 0.28], sunS: [0.6, 0.4, 0.3],
		hemi: 3.0, hemiD: [0.3, 0.33, 0.56], hemiG: [0.22, 0.21, 0.24],
		bounce: 1.8, bounceD: [0.4, 0.34, 0.34],
		lum: 0.075, rayl: 3.2, turb: 2.4, fog: [0.22, 0.23, 0.31], fogD: 0.006, env: 0.17, night: 0.85,
	},
	// Night proper: the moon is up in the east and the garden is blue-black with warm points in it.
	{
		h: 20.8, az: 196, el: 26, sun: 1.6, sunD: [0.42, 0.52, 0.78], sunS: [0.5, 0.56, 0.7],
		hemi: 1.25, hemiD: [0.17, 0.23, 0.44], hemiG: [0.1, 0.11, 0.15],
		bounce: 0.7, bounceD: [0.29, 0.33, 0.45],
		lum: 0.026, rayl: 1.2, turb: 1.6, fog: [0.06, 0.08, 0.13], fogD: 0.0055, env: 0.07, night: 1,
	},
	// Small hours, held against the same numbers as midnight.
	{
		h: 23.6, az: 206, el: 40, sun: 1.5, sunD: [0.4, 0.5, 0.76], sunS: [0.5, 0.56, 0.7],
		hemi: 0.95, hemiD: [0.16, 0.22, 0.42], hemiG: [0.09, 0.1, 0.14],
		bounce: 0.55, bounceD: [0.28, 0.32, 0.44],
		lum: 0.019, rayl: 1, turb: 1.5, fog: [0.045, 0.06, 0.1], fogD: 0.0055, env: 0.05, night: 1,
	},
];

// When the two cubemaps are redrawn. The sky cube is six draws of one box and can afford eight a day; the
// pool cube is six draws of the whole garden and is only paid for four times, at the hours where a stale
// mirror is a visible lie.
const SKY_HOURS = [5.7, 6.6, 8.5, 12, 15.4, 17.5, 18.6, 19.5, 20.8, 0];
const VIEW_HOURS = [5.9, 8.5, 18.8, 20.2];

const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Where the sun (or, at night, the moon) stands: degrees clockwise from north, and above the horizon. */
export function sunFromHour(hour) {
	return skyAt(hour);
}

/** Every light number for one hour, mixed out of the table. Read-only: it hands back new values each time. */
export function skyAt(hour) {
	const h = ((hour % 24) + 24) % 24;
	let i = 0;
	while (i < DAY.length - 1 && DAY[i + 1].h <= h) i++;
	const a = DAY[i];
	const b = DAY[(i + 1) % DAY.length];
	const span = (b.h > a.h ? b.h : b.h + 24) - a.h;
	const t = span > 0 ? Math.min(1, Math.max(0, (h - a.h) / span)) : 0;
	// Mixed with a soft step rather than a straight line: light does not change at a constant rate, it
	// loiters near the top and the bottom of its arc and moves quickest in the middle of the morning.
	const s = t * t * (3 - 2 * t);
	return {
		hour: h,
		az: lerp(a.az, b.az, s),
		el: lerp(a.el, b.el, s),
		sun: lerp(a.sun, b.sun, s),
		sunD: lerp3(a.sunD, b.sunD, s),
		sunS: lerp3(a.sunS, b.sunS, s),
		hemi: lerp(a.hemi, b.hemi, s),
		hemiD: lerp3(a.hemiD, b.hemiD, s),
		hemiG: lerp3(a.hemiG, b.hemiG, s),
		bounce: lerp(a.bounce, b.bounce, s),
		bounceD: lerp3(a.bounceD, b.bounceD, s),
		lum: lerp(a.lum, b.lum, s),
		rayl: lerp(a.rayl, b.rayl, s),
		turb: lerp(a.turb, b.turb, s),
		fog: lerp3(a.fog, b.fog, s),
		fogD: lerp(a.fogD, b.fogD, s),
		env: lerp(a.env, b.env, s),
		night: lerp(a.night, b.night, s),
	};
}

/** The hour in plain English, on the quarter hour, for the line of type under the villa's name. */
export function hourWords(hour) {
	const NAMES = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
	const h = ((hour % 24) + 24) % 24;
	const whole = Math.floor(h + 1e-4);
	const q = Math.round((h - whole) * 4) / 4;
	// "midnight" and "noon" only when it is exactly one of them: "half past noon" is the sort of phrase that
	// makes a reader think a clock is wrong.
	const exact = (i) => ((((i % 24) + 24) % 24) === 0 ? "midnight" : (((i % 24) + 24) % 24) === 12 ? "noon" : NAMES[((i % 12) + 12) % 12]);
	const plain = (i) => NAMES[((i % 12) + 12) % 12];
	if (q === 0) return exact(whole);
	if (q === 0.25) return `quarter past ${plain(whole)}`;
	if (q === 0.5) return `half past ${plain(whole)}`;
	return `quarter to ${plain(whole + 1)}`;
}

/**
 * The day, running. `rig` is everything in the scene whose numbers move with the sky; `set` and `advance`
 * are the only ways to move it, because a light number written anywhere else cannot be argued with.
 */
export function buildDayCycle(scene, rig) {
	const { sky, light, hemi, bounce, mats } = rig;
	// What the lamps look like in daylight, taken off the materials before anything is touched, so the
	// night can be added on top of the numbers `src/materials.js` chose instead of over them.
	const off = {
		glow: mats.lampGlow.emissiveColor.clone(),
		lens: mats.poolLamp.emissiveColor.clone(),
		waterEm: rig.water ? rig.water.emissiveIntensity : 1,
		poolFill: (rig.poolLights || []).map((l) => l.intensity),
		room: (rig.roomLamps || []).map((l) => l.intensity),
		mirror: rig.water && rig.water.reflectionTexture ? rig.water.reflectionTexture.level : 1,
	};
	// What they look like burning: garden bulbs a warm amber loud enough to trip the bloom (its threshold
	// is 1.6, so a bulb under that is a grey bead and over it is a lamp), and the pool's two fittings
	// turned back into the lamps they are shaped like.
	const on = {
		glow: new Color3(2.1, 1.5, 0.68),
		lens: new Color3(0.3, 1.5, 1.7),
		poolFill: 1.55,
		room: 1.5,
	};

	let hour = rig.start === undefined ? 17.5 : rig.start;
	// The hour the mirrors were baked under. `src/main.js` renders the sky cube and prefilters it once while
	// the sun still stands where `src/world.js` put it; if the day is then set to that same hour, the mirrors
	// already agree and a second pass is pure loss — measured, because it was not believed: setting the hour
	// at boot unconditionally took the start view from mean 114 to mean 110 and the ground from L134 to L130,
	// four points of light out of the whole picture, from softening an already-softened sky.
	const bootHour = hour;
	// `null` and not `false`, so that the very first `apply()` always reports which half of the day it is:
	// started at nine in the morning the night number never crosses a half, and a state written only on a
	// crossing would never be written at all — which is exactly how the cockroaches were found walking about
	// at noon with the fireflies awake alongside them.
	let wasNight = null;
	let passedSky = [];
	let passedView = [];
	const state = { hour, night: 0, sun: null };

	const crossed = (marks, from, to) => marks.filter((m) => (from < to ? m > from && m <= to : m > from || m <= to));

	function apply() {
		const s = skyAt(hour);
		const lock = rig.locks || {};
		state.hour = s.hour;
		state.night = s.night;
		const a = (s.az * Math.PI) / 180;
		const e = (s.el * Math.PI) / 180;
		const dir = { x: Math.sin(a) * Math.cos(e), y: Math.sin(e), z: -Math.cos(a) * Math.cos(e) };
		state.sun = dir;

		light.direction.set(-dir.x, -dir.y, -dir.z);
		if (!lock.sun) light.intensity = s.sun;
		light.diffuse = new Color3(...s.sunD);
		light.specular = new Color3(...s.sunS);

		if (!lock.hemi) hemi.intensity = s.hemi;
		hemi.diffuse = new Color3(...s.hemiD);
		hemi.groundColor = new Color3(...s.hemiG);

		// The same vector `src/world.js` built once at boot, so half past five gets what it always had.
		bounce.direction.set(-dir.x * 0.7 - 0.3, -0.4, -dir.z * 0.7);
		bounce.intensity = s.bounce;
		bounce.diffuse = new Color3(...s.bounceD);

		sky.luminance = lock.sky ? sky.luminance : s.lum;
		sky.rayleigh = lock.rayl ? sky.rayleigh : s.rayl;
		sky.turbidity = lock.turb ? sky.turbidity : s.turb;
		sky.sunPosition.set(dir.x * sky.distance, dir.y * sky.distance, dir.z * sky.distance);

		if (!rig.noFog) {
			scene.fogColor = new Color3(...s.fog);
			scene.fogDensity = s.fogD;
		}
		scene.environmentIntensity = lock.env ? scene.environmentIntensity : s.env;

		// The lamps. Every one of them comes up on the same `night` number, so dusk cannot leave a bulb
		// half-lit while its neighbour is already burning.
		const n = s.night;
		mats.lampGlow.emissiveColor = new Color3(
			lerp(off.glow.r, on.glow.r, n), lerp(off.glow.g, on.glow.g, n), lerp(off.glow.b, on.glow.b, n));
		mats.poolLamp.emissiveColor = new Color3(
			lerp(off.lens.r, on.lens.r, n), lerp(off.lens.g, on.lens.g, n), lerp(off.lens.b, on.lens.b, n));
		(rig.poolLights || []).forEach((l, i) => { l.intensity = off.poolFill[i] * (1 + (on.poolFill - 1) * n); });
		(rig.roomLamps || []).forEach((l, i) => { l.intensity = off.room[i] * (1 + (on.room - 1) * n); });
		// A dark garden has nothing to show the water, and saying so is what keeps a stale mirror in the
		// pool from handing midnight a sunset.
		if (rig.water && rig.water.reflectionTexture) rig.water.reflectionTexture.level = off.mirror * (1 - 0.8 * n);
		// The water's own cyan is the sun that came through it and bounced off white tiles, and at night
		// there is no such sun: what is left is what the two fittings in the far wall can carry, which is a
		// bright band at that end and dark blue everywhere else. Left whole, the whole plate glowed like a
		// shampoo bottle in a hotel advertisement.
		if (rig.water) rig.water.emissiveIntensity = off.waterEm * (1 - 0.5 * n);

		const night = n > 0.5;
		if (night !== wasNight) {
			wasNight = night;
			if (rig.onNight) rig.onNight(night);
		}
		if (rig.onHour) rig.onHour(s.hour, n);
	}

	function between(list, from, to) {
		return crossed(list, from, to);
	}

	return {
		get hour() { return hour; },
		get night() { return state.night; },
		get state() { return state; },
		/** Put the day somewhere particular and write it out at once. */
		set(hour_) {
			hour = ((hour_ % 24) + 24) % 24;
			apply();
			// Setting the hour by hand (the address bar, a tool) is also the one time to redraw the mirrors
			// whatever hour it lands on, or the water would keep the mirror of wherever it was before — unless
			// it lands on the hour they were already baked under. See `bootHour`.
			if (Math.abs(hour - bootHour) < 1e-6) return;
			if (rig.refreshSky) rig.refreshSky();
			if (rig.refreshView) rig.refreshView();
			if (rig.prefilter) rig.prefilter();
		},
		/** Let the day go on by `delta` seconds of real time. */
		advance(delta) {
			if (!rig.daySeconds || rig.daySeconds <= 0) return;
			const from = hour;
			hour = (hour + (delta * 24) / rig.daySeconds) % 24;
			passedSky = between(SKY_HOURS, from, hour);
			passedView = between(VIEW_HOURS, from, hour);
			apply();
			// The sky cube first (one box, six draws, cheap enough to pay the moment the light changes),
			// then the garden cube only at the four hours where it matters.
			if (passedSky.length) {
				if (rig.refreshSky) rig.refreshSky();
				if (rig.prefilter) rig.prefilter();
			}
			if (passedView.length && rig.refreshView) rig.refreshView();
		},
	};
}
