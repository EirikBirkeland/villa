// The teak floors' broad tones: which boards the weather has silvered and which have kept their oil.
//
// Why this exists. The Villa has two teak floors a visitor stands on: the terrace deck in front of the
// glass (16.2 x 4.4 m) and the floor of the sala by the pool (4 x 4 m). Both wear one pattern of
// boards, so the whole terrace is one tone and the whole sala another, and neither changes from one
// corner of itself to the other: the same fault the lawn had (src/lawn.js) and the pool paving had
// (src/paving.js), and the cure is the same — shapes asked in metres of ground, carried at the floor's
// own corners, bigger than anything the pattern can make.
//
//   teakTone(x, z)          three multipliers, one per colour channel, averaged to one across
//                           whichever floor the place stands on, so putting the patches in cannot
//                           quietly repaint a floor or brighten it.
//   teakVertexSpacing       how far apart the corners stand, in metres.
//
// What actually happens to teak in a Thai garden, and what is put in here.
//
//   Silvering. Teak left out of doors weathers to a silvery grey: the sun and the monsoon together
//   take the golden oil out of the surface and leave the wood grey. Boards under a roof keep their
//   oil — the strip of the terrace under the house's own eave, and the sala floor, which its roof
//   covers on every side — and stay honey-brown. This is the one thing about a real deck a board
//   pattern cannot guess at, because it belongs to the weather and the building and not to the wood:
//   the line it follows is the line of the eave. Grey, then: red down, blue up, the light kept about
//   where it was. Honey: the same wood warmer, the blue taken out.
//
//   The drip. Where the roof lets go of its rain the deck below it stays wet long after the storm has
//   passed, and wet wood is dark wood; in time a green of algae settles on it. So there is a dark
//   band along the eave line, a metre deep, and it is broken and patchy rather than ruled, because
//   no gutter runs true.
//
//   The rain that blows in. An open sala has no wall, and its roof hangs a metre past its floor on
//   every side, so a storm mostly drops its water clear of the boards — but wind-driven rain gets a
//   metre in under the eave and stops there. The ring of boards next to the eave is therefore the
//   wettest and the greyest, and it is wettest on the windward sides: the monsoon blows up the Gulf from
//   the south-west, so the south and west edges of the floor take the weather and the north-east corner
//   of a sala stays dry enough to keep its oil. The middle keeps its oil too.
//
//   The traffic. Feet abrade the silver layer off. The line from the front steps in to the glass, and
//   the line along the glass, come back darker and warmer than the boards nobody walks on, and they are
//   the only boards that look oiled again. The sala has its own one line, from its steps to where
//   people sit.
//
//   Wear. A little light and dark on the scale of a room, for where the boards have been washed and
//   where the rain stood. This is the only part that moves the floor's light; the weather moves its
//   colour and leaves its light alone — the law the lawn found, that the middle channel carries the
//   light of a surface and dryness moves the two ends.
//
// Both readers, one set of numbers: the browser gets these at the floors' corners through
// `tintFromGround` in mesh.js, and tools/draw.js multiplies them in at every pixel it lays (`broad`
// in surface-colours.js), so the CPU drawing cannot flatten the deck either.

import { groundPatch } from "./noise.js";

/**
 * How far apart the floors' corners stand, in metres. The weather changes over metres, not centimetres,
 * but the drip band is a metre deep and that is the narrowest thing carried here. The two floors
 * together are 87 square metres, so this is about nine hundred corners: nothing beside the two million
 * pixels the software renderer is pushing.
 */
export const teakVertexSpacing = 1;

/**
 * The two floors, as src/villa.js builds them, and the wood each one is made of now.
 *
 * `base` is the floor's own colour, put on AFTER the weather has been averaged out (see `floorMeans`
 * below: the weather is divided by each floor's own average, so anything uniform across a floor is
 * divided straight back out again — which is why the sala used to come out the same colour as the
 * terrace). The terrace deck stands out in the sun and the monsoon on three sides and has silvered;
 * the sala's floor is roofed on all four, is oiled every hot season, and keeps its oil. That is a
 * difference of a whole floor and not of a patch, so it lives here and not in the weather field, and it
 * is what the joiner's eye reads first: a pale silver deck with a honey floor in the pavilion.
 * They are measured, not guessed: the sala floor came back (116,123,58) — green over red, olive — under
 * a sky fill of (0.4, 0.58, 0.88), and the red went up and the blue down until it came back brown.
 */
const floors = [
	{ x0: -8.1, x1: 8.1, z0: -3.9, z1: 0.5, base: [1.0, 1.0, 0.98] }, // the terrace deck
	{ x0: 8.6, x1: 12.6, z0: 3.4, z1: 7.4, base: [1.35, 0.8, 0.62] }, // the sala floor
];

/** Where the sala's steps land, and where the seats are: the sala's one walked line. */
const salaSteps = { z: 5.4, half: 1.0, inFrom: 8.6, length: 2.2 };

/** How far the storm gets under the sala's eave, in metres; the roof hangs a metre past the floor. */
const salaEaveIn = 1.1;

/** The two roofs that stand over them, and the height of each eave, in metres. */
const mainRoof = { x0: -8.8, x1: 8.8, z0: -13.4, z1: -2.2, eave: 4.2 };
const salaRoof = { x0: 7.6, x1: 13.6, z0: 2.4, z1: 8.4, eave: 3.16 };

// The two ends of the same wood. `honey` is teak with its oil still in it: warm, the blue taken out.
// `silver` is the same boards after a few wet seasons and a few hundred hours of sun: grey, and grey
// means the channels come together — red down, blue up. Neither end makes the floor much lighter or
// darker, which is the point: weathering is a change of colour before it is a change of light, and the
// sunlit deck is already near the top of what the screen can show (see the first fault in NOTES.md).
//
// The blue is the whole of the work now, and that is a change of finding. The teak pattern used to paint
// a dark brown's blue — about a fiftieth of its red — so multiplying that channel moved the painted
// pixel hardly at all: the first version of this put 12 per cent into the blue and the browser moved it
// by two points, because most of the blue it painted came off the sky's own blue light and not out of
// the wood at all. The lawn found the same thing from the other side (src/lawn.js). The deck's pattern
// now carries real blue (`teakWoods` in src/textures.js), so the multiplier has something to work on —
// and it needs a big swing, because the sala floor read (116,123,59) under this sky: green over red,
// olive. A shaded board is lit by a green sky, so the honey has to keep the red well on top of it and
// the blue out of it, and the silver is what the blue is for.
const honey = [1.08, 1.0, 0.82];
const silver = [0.9, 1.0, 1.16];

// Where the roof lets go of the rain: a band a metre deep along the eave, darkening the boards and
// letting a little green in. A storm drops the whole sky on 4.2 m of roof and it all goes over the
// edge here, so this is the wettest strip of the deck in a monsoon and the last to dry. Wet wood is
// darker wood, and what light comes back off it comes back with the red drunk out of it and a grey
// green left behind.
const dripDepth = 1.0;
const dripTone = [0.72, 0.82, 1.0];

// What feet do to boards: they take the grey layer off and polish what is left, so the walked lines
// come back darker and warmer than the boards nobody walks on — and warmer now means taking the blue
// out, which is what an oiled board is.
const wornTone = [0.9, 0.96, 0.78];

// The traffic, in metres: the line the front steps land on and the line along the glass.
const laneUp = { at: 0, half: 1.6 }; // from the steps straight in to the glass
const laneAlong = { at: -3.1, half: 0.9 }; // along the glass, both ways

/** How far inside a rect a place is, in metres; nought when it is outside. */
function insideDepth(x, z, r) {
	if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) return 0;
	return Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
}

function band(x, at, half) {
	return Math.min(1, Math.max(0, 1 - Math.abs(x - at) / half));
}

/**
 * How much of the weather reaches a place: 1 where it stands in the sun and the rain, 0 well under a
 * roof. Driven rain gets a metre or two in under an eave and then stops, so the shelter fades in over
 * that distance rather than starting at the wall.
 */
function exposure(x, z) {
	const underMain = insideDepth(x, z, mainRoof);
	const underSala = insideDepth(x, z, salaRoof);
	if (underMain === 0 && underSala === 0) return 1;
	// At the eave itself the weather still reaches — a monsoon rain blows a metre or two in under any
	// roof edge — and it never stops altogether. A roof shelters from above only, and the two roofs do
	// very different amounts of it. The terrace lies under the house's eave with three sides open to the
	// wind, so the weather keeps working there and a third of it gets through; the sala's roof hangs a
	// metre past its floor on every face, so everything but the ring that `blownRain` counts stays dry,
	// and dry teak under a roof keeps its oil for years. Hence two floors, and the sala's is the low one.
	const depth = Math.max(underMain, underSala);
	const shelter = underSala > underMain ? 0.14 : 0.34;
	return Math.max(shelter, 0.62 * Math.exp(-depth / 1.5));
}

/** How far feet have worn the boards, 0 to 1: the lines people walk, and nowhere else. */
function traffic(x, z) {
	const terrace = Math.max(band(x, laneUp.at, laneUp.half) * 0.9, band(z, laneAlong.at, laneAlong.half) * 0.7);
	// Into the sala you come up the steps in the middle of the west face and walk east to where the
	// seats are; that is the line, and it dies out a couple of metres in.
	const intoSala = band(z, salaSteps.z, salaSteps.half) * Math.max(0, 1 - (x - salaSteps.inFrom) / salaSteps.length);
	return Math.max(terrace, intoSala);
}

/**
 * How wet the sala's boards are from the rain that blows under its eave, 0 to 1: a ring one metre in
 * from every edge, the middle of the floor dry. Wettest on the sides the storm wind comes at — the
 * south and the west, since the monsoon blows up the Gulf from the south-west — and driest at the
 * north-east corner, which the weather only brushes on its way past.
 */
function blownRain(x, z) {
	const s = floors[1];
	if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) return 0;
	const inset = Math.min(x - s.x0, s.x1 - x, z - s.z0, s.z1 - z);
	const ring = Math.max(0, 1 - inset / salaEaveIn);
	// Which way the place faces, taken from the middle of the floor and scaled to about one: north is
	// -z, east is +x, so the windward pair is -x and +z.
	const east = (x - 10.6) / 2;
	const south = (z - 5.4) / 2;
	const windward = Math.max(0.1, Math.min(1, 0.5 + 0.4 * (south - east)));
	const broken = groundPatch(x + 71, z + 19, { broad: 1.7, fine: 0.8, seed: 4421 });
	return ring * windward * (0.5 + 0.9 * broken);
}

/** How wet the boards are where the roof lets go, 0 to 1, broken up so it is not ruled with a ruler. */
function drip(x, z) {
	if (x < mainRoof.x0 || x > mainRoof.x1) return 0;
	const edge = mainRoof.z1; // the eave hangs at z = -2.2; the boards below it, going south, get wet
	if (z < edge) return 0;
	const wet = Math.max(0, 1 - (z - edge) / dripDepth);
	const broken = groundPatch(x + 12, z - 88, { broad: 2.6, fine: 1.1, seed: 3307 });
	return wet * (0.45 + 1.1 * broken);
}

/**
 * How far the weather has got with a place's boards: 0 (its own oiled honey) to 1 (fully silvered).
 * The open deck comes out silvered with patches in it, the strip under the eave stays honey, and the
 * sala floor — roofed on all four sides — stays honey with only the weather that blows under its
 * eaves. Feet abrade the silver layer off, so the walked lines sit further back toward the honey.
 */
function weather(x, z) {
	const patch = groundPatch(x + 31, z - 47, { broad: 4.4, fine: 1.5, seed: 8123 });
	const w = 0.14 + 0.72 * exposure(x, z) + 0.5 * (patch - 0.5) - 0.3 * traffic(x, z) + 0.45 * blownRain(x, z);
	return Math.min(1, Math.max(0, w));
}

/** How much lighter or darker a place is, about a twelfth of a stop out at the ends. */
function wear(x, z) {
	return (groundPatch(x - 55, z + 28, { broad: 5.5, fine: 1.9, seed: 6613 }) - 0.5) * 0.16;
}

function rawTone(x, z) {
	const w = weather(x, z);
	const wet = Math.min(1, drip(x, z) + 0.8 * blownRain(x, z));
	const lane = traffic(x, z);
	const lift = 1 + wear(x, z);
	const out = [];
	for (let c = 0; c < 3; c++) {
		// the weather between the two ends of the wood, then the drip and the feet on top of it
		const wood = honey[c] + (silver[c] - honey[c]) * w;
		out.push(wood * (1 - wet * (1 - dripTone[c])) * (1 - lane * (1 - wornTone[c])) * lift);
	}
	return out;
}

// What those multipliers average across each floor, so the patches vary them without moving a floor
// whole. Measured one metre at a time, which is the spacing the corners stand at anyway.
//
// Each floor keeps its own average, and that is a finding and not a whim. The first version divided
// both floors by one shared average, and the sala — four square metres of roofed, oiled, honey boards
// — dragged that shared number warm and bright, so the open terrace paid for it. Seen straight down,
// the stretch of deck south of the eave, the part that should only have gone cool, ran (241,146,88)
// in the last release and came back (213,132,73): less red and less blue both, a dimming where a
// silvering was wanted. Averaged floor by floor, the weather can only move colour about inside the
// floor it is standing on.
const floorMeans = floors.map((f) => {
	const sum = [0, 0, 0];
	let n = 0;
	for (let x = f.x0; x <= f.x1; x += 1) {
		for (let z = f.z0; z <= f.z1; z += 1) {
			const t = rawTone(x, z);
			sum[0] += t[0];
			sum[1] += t[1];
			sum[2] += t[2];
			n++;
		}
	}
	return { f, mean: sum.map((s) => s / n), base: f.base };
});

/** The floor a place stands on; when it is a finger outside every one, the floor it is nearest. */
function meanFor(x, z, what = "mean") {
	let best = null;
	let least = Infinity;
	for (const entry of floorMeans) {
		const f = entry.f;
		const dx = Math.max(f.x0 - x, 0, x - f.x1);
		const dz = Math.max(f.z0 - z, 0, z - f.z1);
		const d = dx * dx + dz * dz;
		if (d < least) {
			least = d;
			best = entry;
		}
	}
	return best[what];
}

/**
 * How the boards in a place differ from the teak's own colour: three multipliers, one per channel, that
 * average to one across the floor the place stands on and then carry that floor's own `base`. Read as
 * light, the way every colour multiplier here is.
 */
export function teakTone(x, z) {
	const t = rawTone(x, z);
	const mean = meanFor(x, z);
	const base = meanFor(x, z, "base");
	return [0, 1, 2].map((c) => (t[c] / mean[c]) * base[c]);
}
