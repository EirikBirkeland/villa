// The garden: coconut palms, shrubs, banana plants, pots, and the lamps and string
// lights that come on as the sun goes.

import { box, cylinder, plane, sphere, poly, revolve, blocker, patternMetres, crumple, fracture, facet, shearTop, skinTint, massTint, skinAnchors } from "./mesh.js";
import { makeGround } from "./ground.js";
import { courtBeds, bedTop, courtEdge } from "./court.js";
import { lawnTone } from "./lawn.js";
import { inPond, inPondStone, pondRect } from "./pond.js";
import { inStream, inStreamStone } from "./stream.js";
import { bushAtlas, tuftAtlas } from "./textures.js";
import { randomGenerator } from "./noise.js";

const { Vector3, Mesh, TransformNode, Color3, VertexBuffer, VertexData } = BABYLON;

/**
 * One coconut palm: a trunk that leans as it rises, a crown of fronds, and a few nuts.
 * The parts are merged into two meshes, so a palm costs the browser two draws.
 * Exported, because the far palms out on the horizon are the same tree at a bigger scale and
 * there is no reason for two ideas of what a coconut palm's head looks like.
 */
export function makePalm(scene, mats, { x, z, height = 6.5, lean = 0.5, twist = 0, seed = 1, scale = 1, nuts = 3, foot = true, frondsNear = 13, stationsNear = 16, segmentsNear = 2 }) {
	const rand = randomGenerator(seed);
	const trunkParts = [];

	// Nine segments and not six: the lean is put on a bit at a time, and six left a knuckle at every
	// joint — a step in the silhouette where one frustum met the next. A dark, finely banded trunk hid
	// it; a pale smooth one shows it at once (`pictures/s58-trunk-pair.png`, the left half, has three of
	// the knuckles in it). The top of the trunk is the same thickness it was: the taper step goes down
	// with the segment count, and the trunk is 4,680 triangles instead of about 3,100 — 0.7% of the Villa.
	const segments = 9;
	const taper = 0.02 * scale;
	const segHeight = height / segments;
	let baseX = 0;
	let baseY = 0;
	let baseZ = 0;
	for (let i = 0; i < segments; i++) {
		// the trunk leans a little more with every segment, all in one direction
		const angle = lean * ((i + 0.5) / segments);
		const climb = Math.cos(angle) * segHeight;
		const drift = Math.sin(angle) * segHeight;
		const bottom = (0.34 - i * taper) * scale;
		const segment = cylinder(scene, "trunk", {
			diameter: bottom,
			diameterTop: bottom - taper,
			height: segHeight * 1.05,
			tessellation: 10,
			px: baseX + (Math.sin(twist) * drift) / 2,
			py: baseY + climb / 2,
			pz: baseZ + (Math.cos(twist) * drift) / 2,
			mat: mats.palmBark,
		});
		segment.rotation.z = -Math.sin(twist) * angle;
		segment.rotation.x = Math.cos(twist) * angle;
		trunkParts.push(segment);
		baseX += Math.sin(twist) * drift;
		baseY += climb;
		baseZ += Math.cos(twist) * drift;
	}

	const crownY = baseY;
	const crownX = baseX;
	const crownZ = baseZ;
	// The crown: a bud with a ring of fronds arching out of it. See `palmCrown` for what a frond is.
	const leafMesh = palmCrown(scene, mats, {
		px: crownX,
		py: crownY,
		pz: crownZ,
		scale,
		seed,
		fronds: frondsNear,
		stations: stationsNear,
		segments: segmentsNear,
	});
	// three coconuts hanging under the crown, close enough to read as one cluster and far enough apart to
	// see as three balls. They wear the trunk's bark and not the flower-pots' clay: a coconut is a brown
	// husk, and on the terracotta material three of them came out as three pink lumps in the middle of the
	// crown (`pictures/s52-palm-02.png`).
	const nutsHere = [];
	for (let i = 0; i < nuts; i++) {
		nutsHere.push(
			sphere(scene, "nut", {
				diameter: 0.22 * scale,
				segments: 6,
				px: crownX + Math.cos((i / Math.max(1, nuts)) * Math.PI * 2) * 0.17 * scale,
				py: crownY - 0.3 * scale,
				pz: crownZ + Math.sin((i / Math.max(1, nuts)) * Math.PI * 2) * 0.17 * scale,
				mat: mats.palmBark,
			}),
		);
	}

	// Fold the hierarchy into flat meshes: bark, and everything green.
	for (const mesh of trunkParts) mesh.computeWorldMatrix(true);
	const trunkMesh = Mesh.MergeMeshes(trunkParts, true, true, undefined, false, false);
	if (trunkMesh) {
		trunkMesh.material = mats.palmBark;
		trunkMesh.name = "palmTrunk";
	}

	const meshes = [leafMesh, trunkMesh, ...nutsHere].filter(Boolean);
	for (const mesh of meshes) {
		mesh.position.x += x;
		mesh.position.z += z;
		mesh.receiveShadows = true;
	}
	// The trunk leans, so it is the foot of it that a person would bump into: a small square there,
	// rather than the trunk mesh itself, whose bounding box takes in the whole lean. A palm nobody
	// can walk to — the eight on the horizon — does not need one.
	if (foot) blocker(scene, "palmFoot", { x: 0.75, y: 1.5, z: 0.75, px: x, pz: z });
	return meshes;
}

/**
 * The crown of a coconut palm: a bud with a ring of fronds arching out of it, every frond a stalk with a
 * row of leaflets standing off it.
 *
 * Every version of this in the Villa's history has been a flat card with a feather painted on it, and
 * every version has read as a green table-top (`pictures/s52-palm-before2.png`: eleven flat paddles stuck
 * in one point like a pinwheel, each one in one plane, its leaflets belonging to the paint and not to the
 * tree). A coconut leaf is a hundred and more separate leaflets on a stalk that leaves the bud pointing up
 * and hangs below the horizontal before it is three metres out — so that is what is built here, the same
 * lesson the belt's near rank, the hedge's crest and the shrub's outside leaf learnt, one size smaller:
 * **the thing a visitor sees is geometry, and the picture on it is only the inside of the thing.**
 *
 * A frond is marched station by station along its own arc: `rise` radians above the horizontal at the bud,
 * bending down to `fall` below it at the tip, with a roll about its own length so the leaflets of two
 * neighbouring fronds are never in the same plane. At each station two leaflets stand, one either side,
 * swept forward off the stalk, lifted out of the frond's own plane into the V a leaflet is folded in, and
 * drooping at their own tips as they go.
 *
 * The ages are mixed round the crown on purpose. `age` runs 0 to 1 over the fronds and it sets all four of
 * a frond's lengths and angles: a young leaf is short, pale and stands nearly upright in the middle of the
 * crown; an old one is long, dark and hangs down past the horizontal. They are laid out by the golden angle
 * so the young and the old are next to one another all the way round, which is what gives a crown its bulk
 * and, from a long way off, its ragged edge.
 *
 * `fronds`, `stations` and `segments` are knobs because a palm eighty metres out has no leaf a visitor can
 * count, and this crown is the heaviest thing in the garden: near ones are 13 fronds x 30 leaflets x 4
 * quads, and the ones on the horizon take a third of it.
 */
function palmCrown(scene, mats, { px, py, pz, scale = 1, seed = 1, fronds = 13, stations = 16, segments = 2 }) {
	const rand = randomGenerator(seed * 17 + 11);
	const positions = [];
	const uvs = [];
	const normals = [];
	const tones = [];
	const indices = [];

	const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	const norm = (a) => {
		const l = Math.hypot(a[0], a[1], a[2]) || 1;
		return [a[0] / l, a[1] / l, a[2] / l];
	};
	const addv = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
	const mulv = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

	/** One card: four corners, one normal, one tone. Corners go (u0,v0), (u1,v0), (u0,v1), (u1,v1). */
	const quad = (c, n, uv, tone) => {
		const at = positions.length / 3;
		for (let k = 0; k < 4; k++) {
			positions.push(c[k][0], c[k][1], c[k][2]);
			normals.push(n[0], n[1], n[2]);
			uvs.push(uv[k][0], uv[k][1]);
			tones.push(tone);
		}
		// The winding and the normal buffer are one fact and not two: wound the other way, half of every
		// crown's leaflets are lit by the opposite of the normal they were given (fault 47).
		indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2);
	};

	for (let f = 0; f < fronds; f++) {
		const age = (f + 0.4) / fronds;
		const azimuth = f * GOLD + (rand() - 0.5) * 0.35;
		const rx = Math.cos(azimuth);
		const rz = Math.sin(azimuth);
		const rise = 1.0 - 1.7 * age + (rand() - 0.5) * 0.25;
		const fall = 0.65 + 1.0 * age + rand() * 0.35;
		const length = (1.4 + 2.0 * age + rand() * 0.4) * scale;
		const roll0 = (rand() - 0.5) * 1.1;
		const rollTwist = (rand() - 0.5) * 1.6;
		const frondTone = 1.1 - 0.3 * age + (rand() - 0.5) * 0.12;
		const ds = length / stations;
		let sx = px + rx * 0.1 * scale;
		let sy = py - 0.06 * scale;
		let sz = pz + rz * 0.1 * scale;
		let last = null;
		for (let i = 0; i <= stations; i++) {
			const t = i / stations;
			// the arc: up out of the bud, over the top, down past the horizontal at the tip
			const th = rise - (rise + fall) * Math.pow(t, 1.3);
			const T = norm([rx * Math.cos(th), Math.sin(th), rz * Math.cos(th)]);
			// the frond's own frame: along it, across it, and out of its face; then rolled about its length
			const P0 = norm(cross(T, [0, 1, 0]));
			const N0 = cross(T, P0);
			const roll = roll0 + rollTwist * t;
			const cr = Math.cos(roll);
			const sr = Math.sin(roll);
			const P = addv(mulv(P0, cr), N0, sr);
			const N = addv(mulv(N0, cr), P0, -sr);
			const sw = (0.05 - 0.032 * t) * scale;
			const p = [sx, sy, sz];
			const sky = norm([N[0], N[1] + 0.6, N[2]]);
			// the stalk, inked from the rib band of the very same canvas the leaflets wear
			if (last) {
				const u0 = (i - 1) / stations;
				const u1 = i / stations;
				quad([addv(last.p, last.P, -last.sw), addv(p, P, -sw), addv(last.p, last.P, last.sw), addv(p, P, sw)], sky, [[u0, 0.47], [u1, 0.47], [u0, 0.53], [u1, 0.53]], frondTone * 0.86);
			}
			// two leaflets at this station, one either side, none at the bud and none at the very tip
			if (i > 0 && i < stations) {
				const shape = Math.max(0.18, Math.sin(Math.PI * (0.16 + 0.76 * t)));
				const leafLen = shape * 0.78 * scale * (0.85 + rand() * 0.3);
				const half = leafLen * 0.085;
				const sweep = 1.02 + 0.5 * t;
				const lift = 0.3 + rand() * 0.35;
				const tone = frondTone * (0.86 + rand() * 0.3);
				for (const side of [-1, 1]) {
					const D = norm(addv(mulv(T, Math.cos(sweep)), mulv(P, side * Math.sin(sweep))));
					const d = norm(addv(mulv(D, Math.cos(lift)), mulv(N, Math.sin(lift))));
					const A = norm(cross(d, N));
					const nA = norm(addv(N, mulv(A, -0.55), 1).map((v, k) => (k === 1 ? v + 0.4 : v)));
					const nB = norm(addv(N, mulv(A, 0.55), 1).map((v, k) => (k === 1 ? v + 0.4 : v)));
					// march the leaflet: a midrib line that droops, with the two edges of the V standing up off it
					let mid = addv(p, mulv(P, side * sw * 0.6));
					let dir = d;
					const rows = [];
					for (let j = 0; j <= segments; j++) {
						const s2 = j / segments;
						const w = half * Math.max(0.14, Math.sin(Math.PI * (0.24 + 0.7 * s2)));
						const raise = w * 0.6;
						rows.push([mid, addv(addv(mid, mulv(A, w)), mulv(N, raise)), addv(addv(mid, mulv(A, -w)), mulv(N, raise))]);
						if (j < segments) {
							// the leaflet droops as it goes: a coconut's own leaves hang, they do not stand out
							// stiff as a comb's teeth, and the whole softness of a crown comes from that
							dir = norm([dir[0], dir[1] - 0.9, dir[2]]);
							mid = addv(mid, mulv(dir, leafLen / segments));
						}
					}
					for (let j = 0; j < segments; j++) {
						const u0 = j / segments;
						const u1 = (j + 1) / segments;
						const [m0, a0, b0] = rows[j];
						const [m1, a1, b1] = rows[j + 1];
						quad([m0, m1, a0, a1], nA, [[u0, 0.5], [u1, 0.5], [u0, 0.0], [u1, 0.0]], tone);
						quad([m0, m1, b0, b1], nB, [[u0, 0.5], [u1, 0.5], [u0, 1.0], [u1, 1.0]], tone);
					}
				}
			}
			last = { p, P, sw };
			sx += T[0] * ds;
			sy += T[1] * ds;
			sz += T[2] * ds;
		}
	}

	if (!positions.length) return null;
	let mean = 0;
	for (const t of tones) mean += t;
	mean /= tones.length;
	const colours = [];
	for (const t of tones) {
		const l = t / mean;
		// A lit card is a young leaf and a little redder for it; a shaded one is an old one and a little
		// bluer. Normalised to a mean of one, so this shapes a crown and does not repaint the garden.
		const r = l * (1 + 0.05 * (l - 1));
		const b = l * (1 - 0.07 * (l - 1));
		// four corners to a card, and a colour for every one of them (fault 48)
		for (let k = 0; k < 4; k++) colours.push(r, l, b, 1);
	}
	const mesh = poly(scene, "palmLeaves", { positions, indices, uvs, mat: mats.palmLeaf });
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/**
 * The golden angle, in radians. Walking round a crown by this much each step puts N things at even
 * angles round it without any of them lining up with the one before, which is how a plant that grows
 * one leaf per turn of its stem actually looks and not the rings of a spruce top.
 */
const GOLD = Math.PI * (3 - Math.sqrt(5));

/**
 * A mass of leaves: one big lump with three lesser ones ridden up its flank, every one of them
 * crumpled, the whole thing lit from its own shape. This is what a shrub is made of, and what the
 * little bush in a pot is made of — the same fault at two sizes.
 *
 * It used to be a ring of equal balls laid in a spiral over a middle one, and a photograph said what
 * that was: a heap of green dumplings. Two reasons, and both are about the *shape* and not the
 * painting. Equal balls all one size, laid at even steps down the mass, each throw one clean
 * gradient of light and each bulge a clean circular outline, and a crowd of circles is read as a
 * crowd of small balls however well its skin is painted. So: the lumps are of unequal size and stand
 * at uneven heights — a bush is one big mass with shoulders, not N bulges — and every one of them is
 * crumpled at two sizes, `at` for the shoulders and hollows half the bush across and `leafy` for
 * clusters of leaves a hand and a half across, which is where a clipped hedge's outline is actually
 * ragged. A sphere crumpled only at the big scale is a potato; the small field is what stops that.
 *
 * And then the SILHOUETTE, which was the next thing a picture said. The main lump was two thirds as
 * high as it was wide and its three lesser ones stood on the lawn around its foot, so every shrub in
 * this garden was one dome with three small domes beside it — `pictures/s65-bush-layers.png` is that
 * bush, and it is a mushroom. The lump is as high as it is wide now, there are four of them, and the
 * three lesser ones are gathered on one side of the plant (`leanTo`) and ridden a hand up its flank
 * (`ride`) instead of standing on the grass beside it. That is one plant leaning toward the light and
 * not four balls on a table, and the outline goes up on the one side and away down on the other.
 *
 * Then the light. A bush is a foot of leaves deep: the outside ones catch the sun and the ones behind
 * them do not, and no lamp can say so. `skinTint` reads the crumple back and writes a dark in every
 * hollow, a brightness on every tip, and a shade along the skirt where the ground steals the sky —
 * which is the one thing about a bush that a smooth ball can never show, and the thing the eye reads
 * first. The average light over each mass is left where the material's own colour put it, so this
 * shapes a bush without repainting the garden.
 *
 * Then the SHEARS. This garden's shrubs are clipped ones — they edge a paved court and flank a terrace
 * at a front door, and nothing is left to grow into a blob there — and a clipped privet has a PLATEAU
 * where the board went across it, not a dome. `shearTop` in `src/mesh.js` lays that board at
 * `clip` times the plant's own width above the ground it stands on: everything that pokes above it is
 * pulled down, the normals are recomputed so the cut face is lit as a flat face, and the leaf cards on
 * that face are stood up (see `bushLeafage`) so the crown bristles with cut shoots instead of lying
 * flat. `clip: 1` declines to cut anything and puts the dome back; that is how the cut was weighed, and
 * `?clip=` in the url dials the whole garden's height from one number.
 *
 * `size` is the width across; `y` is the ground it stands on.
 *
 * Exported for the two great pots at the terrace steps (`src/props.js`), which were terracotta for a
 * long while and nothing in them: a pot standing empty at a front door reads as a plan that was never
 * finished, and the planted pots an arm's length away said so.
 */
// Where the board lies, as a fraction of the plant's width. Measured on the `rear` camera with
// `tools/crown.js`, over the middle of the big border shrub: uncut (`?clip=1`) its top edge drops 32 px
// and only 14% of its columns sit within 3 px of the crown's own middle, which is a dome; at 0.46 it
// drops 22 px, wanders 5.6, and 47% of the columns are on the plateau — a board with a little sag to it.
// Higher than that leaves a bun with a flat patch on it; at 0.36 the plant loses its shoulders and
// becomes a mat. The whole ladder is `?clip=` in the address bar.
export const SHRUB_CLIP = 0.46;

/**
 * Tell `skinTint` that the corners a shear brought down onto the board are tips: give them the brightest
 * value the crumple has, because a cut shoot's end is young leaf standing in the sun.
 */
function liftTips(push, cut) {
	if (!push || !cut) return;
	let hi = -Infinity;
	for (const p of push) if (p > hi) hi = p;
	for (let v = 0; v < cut.length; v++) if (cut[v]) push[v] = hi;
}

export function makeLeafyMass(scene, mats, { x, z, size = 1, seed = 3, y = 0, name = "shrub", clip = SHRUB_CLIP }) {
	const rand = randomGenerator(seed);
	const edgeName = `${name}Leaf`;
	const hearts = [];
	const leaves = [];
	const lumps = 4;
	// Where the shears went across this plant, in the world. `clip` is that height as a fraction of the
	// plant's own width, and a little play is thrown in per plant so a row of them is not cut to one dead
	// level. `clip: 1` leaves the dome alone, which is how the cut was weighed.
	const board = clip >= 1 ? null : y + size * (clip + (rand() - 0.5) * 0.06);
	// Which side of itself the bush leans to. The lesser lumps are gathered on that side and rode UP the
	// flank of the main one, so the outline goes up on one side and away down on the other and is not the
	// same arc twice over. `GOLD` used to space the lumps evenly round the middle, which is the one thing
	// a plant never does: a shrub grows toward the light and toward whichever neighbour is not shading it.
	const leanTo = rand() * Math.PI * 2;
	for (let i = 0; i < lumps; i++) {
		const main = i === 0;
		const wide = size * (main ? 0.7 + rand() * 0.14 : 0.34 + rand() * 0.24);
		// The main lump used to be `wide * (0.56 + rand()*0.2)` tall, and a ball that is two thirds as high
		// as it is wide, sitting with a third of itself under the grass, is a DOMELID: the whole silhouette
		// was one arc and every shrub in the garden was the same mushroom. Standing that up to one was tried
		// and is photographed as `pictures/s65-bush-shape.png`: a green egg on the lawn, taller than the
		// hedge behind it reads. So: upright-ish, and still broader than it is high, which is what a privet
		// clipped once a year is. The lesser lumps may stand taller than they are wide, which is what a shoot
		// that found the light at the edge of a hedge does.
		const tall = wide * (main ? 0.66 + rand() * 0.22 : 0.62 + rand() * 0.4);
		const az = main ? rand() * Math.PI * 2 : leanTo + (rand() - 0.5) * 1.7;
		const reach = main ? 0 : size * (0.16 + rand() * 0.16);
		const px = x + Math.sin(az) * reach;
		const pz = z + Math.cos(az) * reach;
		const py = y + tall * 0.5;
		// How far above the ground this lump's own foot sits, once the lump has been sunk into the earth
		// below. A lesser lump that stands on the lawn beside the middle one is a second, smaller bush; the
		// same lump ridden a hand up the flank is a shoulder on one.
		const ride = main ? 0 : size * rand() * 0.11;
		const worked = { at: 0.22, lobes: 6, leafy: 0.075, leafSize: Math.max(0.26, size * 0.3) };
		const lumpSeed = seed * 97 + i * 13;
		// Every lump is tilted a little, and turned. A sphere's pattern runs to a pair of poles, and at
		// the pole the leaves comb into a fan — which is a thing a ball does and not a thing a bush does,
		// and with every lump sitting upright the fans all came out at the crown of the bush. Turned over
		// a bit, each lump's poles go off to one side and the crowd of them is a tangle instead.
		const lean = [rand() * 0.9 - 0.45, rand() * 0.9 - 0.45, rand() * Math.PI * 2];
		const heart = sphere(scene, name, {
			diameterX: wide,
			diameterY: tall,
			diameterZ: wide,
			segments: 18,
			px,
			py,
			pz,
			mat: mats.bush,
		});
		heart.rotation.set(lean[0], lean[2], lean[1]);
		const push = crumple(heart, { ...worked, seed: lumpSeed });
		// The shell: the same lump again, six per cent bigger and crumpled by the very same field, so it
		// lies parallel to the heart all the way round and cannot poke through it. It wears
		// `mats.bushEdge`, whose leaf has air cut out around it, and that is where the bush's edge comes
		// from: the silhouette stops being the six-sided outline of a ball and becomes a tangle of
		// leaf tips with a dark between them, which is what a bush is when you stand in front of one.
		const shell = sphere(scene, edgeName, {
			diameterX: wide * 1.06,
			diameterY: tall * 1.06,
			diameterZ: wide * 1.06,
			segments: 18,
			px,
			py,
			pz,
			mat: mats.bushEdge,
		});
		shell.rotation.set(lean[0], lean[2], lean[1]);
		const shellPush = crumple(shell, { ...worked, seed: lumpSeed });
		// Sunk until the heart's own lowest corner is under the ground it stands on: a crumpled foot can
		// end in the air, and a mass with daylight under its skirt is a stool. Read in the world and not
		// in the lump's own coordinates, because the lump is turned over and its lowest corner is no
		// longer underneath its centre.
		const world = heart.computeWorldMatrix(true);
		const pos = heart.getVerticesData(VertexBuffer.PositionKind);
		let lowest = Infinity;
		for (let k = 0; k < pos.length; k += 3) {
			const p = Vector3.TransformCoordinates(new Vector3(pos[k], pos[k + 1], pos[k + 2]), world);
			if (p.y < lowest) lowest = p.y;
		}
		heart.position.y += y - 0.04 * size - lowest + ride;
		shell.position.y = heart.position.y;
		if (board !== null) {
			// The board is laid on the shell, because the shell is the skin that shows, and the heart is cut
			// two centimetres under it: two flat faces at one height quarrel for every pixel.
			const cutHeart = shearTop(heart, { at: board - 0.02 * size, ragged: size * 0.035, span: size, seed });
			const cutShell = shearTop(shell, { at: board, ragged: size * 0.035, span: size, seed });
			// A corner that came down onto the board is a shoot that was cut: its tip is young leaf, and it
			// stands in the sun. `skinTint` is told so, and lights it as a tip.
			liftTips(push, cutHeart);
			liftTips(shellPush, cutShell);
		}
		skinTint(heart, push, { at: 0.26, low: 0.3 });
		skinTint(shell, shellPush, { at: 0.26, low: 0.3 });
		heart.receiveShadows = true;
		shell.receiveShadows = true;
		hearts.push(heart);
		leaves.push(shell);
	}
	// The leaf that stands out of the skin. Read the places off the finished shells, before they are
	// merged into one mesh and their vertices go to sleep. A card is scaled with the plant it grows on: a
	// spray is 15 cm of bush and the big shrubs are a metre across, but the two great pots at the terrace
	// steps carry a bush of 62 cm, and a 15 cm spray on a 62 cm bush is a palm on a coffee cup — which is
	// what made those two pots read as a mound of cut greens in the start view.
	const leafage = bushLeafage(scene, mats, leaves, {
		seed,
		// The skirt of leaf stops a hand above the ground rather than at it. A card is a flat sheet a hand
		// across centred on the skin, so one planted at the foot lies out over the lawn like a fallen plate —
		// and the tufts that edge the planted beds start at the same place, so two green things were fighting
		// over the same strip of ground.
		bottom: y + 0.07 * size,
		scale: Math.max(0.55, Math.min(1.1, size / 1.05)),
		board,
	});
	const parts = mergeParts(scene, [[hearts, name], [leaves, edgeName]], null, true);
	if (leafage) parts.push(leafage);
	// And the plant's own light, at the size a stranger sees it from: see `massTint`. The span goes with
	// the plant, so a bush a hand across and a shrub a metre across each get two or three lobes across
	// themselves and not two or three metres across themselves.
	massTint(parts, { seed, own: 0.15, lobes: 0.26, span: size * 0.8 });
	return parts;
}

/**
 * The outside of a shrub: a crowd of small leaf cards standing on the skin of its lumps.
 *
 * A bush is a shell of leaves over a dark heart, and until now the shell was painted: `bushEdgeCanvas`
 * laid over a crumpled ball, every leaf as flat as the ball it was drawn on and every one of them combed
 * round to the ball's own poles. Two metres off a browser said the truth about that — a dome of flat
 * green paddles with a fan in it (`pictures/s51-pot.png`). So the outside leaf is geometry now: one
 * spray of `bushClusterCanvas` to a card, planted on the crumpled skin where a leaf of that bush would
 * actually be, tilted out of it. A card catches the sun on its own face, throws a shade on the card
 * behind it, and sticks out past the outline, so the edge of a bush is a tangle of leaf tips at every
 * distance and not the edge of a ball.
 *
 * Three things the cards are told, all of them learnt the hard way on the hedge's crest:
 *
 *   normal   the way a leaf LIVES and not the way the card is cut: out of the skin and up at the sky.
 *            A card whose normal lies along the skin sees the bush and not the sun, and comes out scorched.
 *   tone     its own, and a brighter one the higher it sits on the mass, because a crown sees the sky and
 *            a skirt sees the ground. The mean over a bush is left at one, so this shapes the bush and
 *            does not repaint the garden.
 *   angle    its own roll about the leaf's own stem, and a size of its own, because ten sprays of one
 *            pattern laid one way is a wallpaper and not a shrub.
 *
 * `bottom` is the height below which nothing is planted: a shrub's skirt stops above its own foot and a
 * potted one stops above the rim of its pot, and a card poking out of terracotta is a leaf growing in a
 * vase of clay.
 */
function bushLeafage(scene, mats, shells, { seed = 7, bottom = -Infinity, density = 200, scale = 1, board = null } = {}) {
	const rand = randomGenerator(seed * 31 + 5);
	const anchors = [];
	for (const shell of shells) {
		// How much skin this lump has, off its own box in the world: the crumple has already moved it, so
		// the ball it was cut from is not a measure of it.
		shell.computeWorldMatrix(true);
		const bb = shell.getBoundingInfo().boundingBox;
		const mean = (bb.maximum.x - bb.minimum.x + (bb.maximum.y - bb.minimum.y) + (bb.maximum.z - bb.minimum.z)) / 6;
		const area = 4 * Math.PI * mean * mean;
		// A card of `scale` times the standard spray covers scale-squared of the ground, so the crowd of
		// them per square metre of skin goes up by the same factor the other way and the bush stays as thick
		// as it was at every size.
		const per = density / (scale * scale);
		const count = Math.max(16, Math.min(Math.round(210 / (scale * scale)), Math.round(area * per)));
		anchors.push(...skinAnchors(shell, { count, seed: Math.round(area * 997) + seed, keep: (at) => at.y > bottom }));
	}
	if (!anchors.length) return null;
	let low = Infinity;
	let high = -Infinity;
	for (const a of anchors) {
		if (a.y < low) low = a.y;
		if (a.y > high) high = a.y;
	}
	const rise = high - low || 1;

	const positions = [];
	const uvs = [];
	const normals = [];
	const colourList = [];
	const indices = [];
	const tones = [];
	const cellSpan = 1 / bushAtlas.cols;
	const inset = 1 / bushAtlas.size; // a texel, so no card ever drinks from the cell next door
	for (const a of anchors) {
		// The way it is lit: out of the skin and up at the sky, with a roll so a crowd of them is a tangle.
		// UP still leads — a card whose normal lies along the skin sees the bush's own skirt instead of the
		// sky, and a browser painted the worst of them maroon, (13,4,6) under a warm bounce and no sky at all
		// (`pictures/s51-mid3-crop.png`), and the hedge's crest learnt the same lesson the hard way. But it
		// led too much: at the crown of a lump the skin points at the sky already, so a card told to stand up
		// there was laid flat on it, and a flat sheet a hand across with the sky in its face is a PLATE — the
		// top of every shrub in the garden was a saucer of them (`pictures/s65-bush-shape2.png`). So the
		// sky's weight came down from 1.0-1.6 to 0.9-1.5, and each card is kicked aside by a big
		// quarter-turn of its own in the horizontal: a bush is a tangle of sprays standing out of a mass, and
		// neither a dome of scales nor a stack of plates. Between the extremes the middle was kept — at
		// `share` 0.7-1.2, where the skin leads, the shell showed through as bare hollows
		// (`pictures/s65-bush-cards.png`), and at the old 1.0-1.6 with no kick the crown was plates.
		const share = 0.55 + rand() * 0.5;
		// Where the skin looks at the sky — the crown of a lump, and the whole of a sheared one — a card laid
		// in the skin lies flat and a flat sheet a hand across with the sky in its face is a PLATE. The kick
		// above leans them aside a little; on a cut face they are stood up outright, because what a sheared
		// crown carries is a crowd of cut shoots standing straight up into the sun and not a saucer of leaves.
		const sheared = a.ny > 0.7;
		const az = rand() * Math.PI * 2;
		let nx = sheared ? Math.cos(az) * (0.72 + rand() * 0.28) : a.nx * share + (rand() - 0.5) * 0.8;
		let ny = sheared ? 0.1 + rand() * 0.3 : 0.9 + rand() * 0.6;
		let nz = sheared ? Math.sin(az) * (0.72 + rand() * 0.28) : a.nz * share + (rand() - 0.5) * 0.8;
		let nl = Math.hypot(nx, ny, nz) || 1;
		nx /= nl;
		ny /= nl;
		nz /= nl;
		// Across the lump, so the cards fan round it and not all along one meridian. At the crown of a
		// lump the skin points at the sky and there is no "across" to be had: take east.
		let wx = a.nz;
		let wy = 0;
		let wz = -a.nx;
		if (Math.hypot(wx, wy, wz) < 0.2) {
			wx = 1;
			wz = 0;
		}
		// ...then squared up against the face it is to be lit by, so the four corners lie in that face.
		const dot = wx * nx + wy * ny + wz * nz;
		wx -= nx * dot;
		wy -= ny * dot;
		wz -= nz * dot;
		let wl = Math.hypot(wx, wy, wz) || 1;
		wx /= wl;
		wy /= wl;
		wz /= wl;
		// Along the leaf: in the face, at right angles to the width.
		let lx = ny * wz - nz * wy;
		let ly = nz * wx - nx * wz;
		let lz = nx * wy - ny * wx;
		// And the card is rolled about its own normal by any angle at all. It used to be turned one of EIGHT
		// ways, by editing its texture coordinates; the browser counted them and said what a bush with eight
		// possible leaves looks like — the same spray, the same number of times, all over the front of the
		// mass. Rolling the frame instead of the UVs costs nothing and gives every card its own angle.
		const roll = rand() * Math.PI * 2;
		const cs = Math.cos(roll);
		const sn = Math.sin(roll);
		const rx = wx * cs + lx * sn;
		const ry = wy * cs + ly * sn;
		const rz = wz * cs + lz * sn;
		lx = -wx * sn + lx * cs;
		ly = -wy * sn + ly * cs;
		lz = -wz * sn + lz * cs;
		wx = rx;
		wy = ry;
		wz = rz;
		// Sizes are TWO populations and not one. Every card was drawn from 0.7 to 1.1 of a spray, and at six
		// metres a bush whose every leaf is the size of the next is one fine even fuzz — broccoli. A shrub has
		// shoots: a few sprays a good hand across that stand out of the mass and throw a shade on the crowd
		// under them, and a mass of small filler leaf between. So a sixth of the cards are grown to a lobe.
		const lobe = rand() < 0.15;
		const wide = bushAtlas.cluster * scale * (lobe ? 1.3 + rand() * 0.5 : 0.68 + rand() * 0.4);
		const long = wide * (0.85 + rand() * 0.3);
		const cx = a.x + nx * 0.012;
		const cy = a.y + ny * 0.012;
		const cz = a.z + nz * 0.012;
		// Brighter the higher it sits, and each card its own shade besides — but NARROW shades: a crowd of
		// cards given a wide spread of tone came out mottled, dark blobs in a lit bush, and a bush is one
		// green mass with a few lit tips and not a harlequin. Normalised to a mean of one below, so a bush
		// is shaped by this and not repainted by it. Narrowed again the day the atlas was rebuilt: the lit
		// tops were running to (128,215,40) against the hedge's (88,137,22), which is a flare and not a leaf.
		const crown = (a.y - low) / rise;
		const tone = (0.88 + 0.3 * crown) * (0.95 + rand() * 0.14);
		tones.push(tone);
		const cu = Math.floor(rand() * bushAtlas.cols) * cellSpan;
		const cv = Math.floor(rand() * bushAtlas.cols) * cellSpan;
		const mirror = rand() < 0.5;
		const at = positions.length / 3;
		for (const [su, sv] of [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
		]) {
			const u = mirror ? 1 - su : su;
			positions.push(cx + wx * (su - 0.5) * wide + lx * (sv - 0.5) * long, cy + wy * (su - 0.5) * wide + ly * (sv - 0.5) * long, cz + wz * (su - 0.5) * wide + lz * (sv - 0.5) * long);
			normals.push(nx, ny, nz);
			uvs.push(cu + inset + u * (cellSpan - 2 * inset), cv + inset + sv * (cellSpan - 2 * inset));
		}
		// A shoot that grew up through the board was cut with it, so nothing of a card standing on the cut
		// face may come more than a finger's width above the board — or the top of a clipped shrub is a comb,
		// which is worse than the bun it replaced. The card slides down; what is buried in the mass is hidden.
		if (sheared && board !== null) {
			let top = -Infinity;
			for (let k = 0; k < 4; k++) top = Math.max(top, positions[(at + k) * 3 + 1]);
			const over = top - board - 0.02;
			if (over > 0) for (let k = 0; k < 4; k++) positions[(at + k) * 3 + 1] -= over;
		}
		indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2);
	}
	let mean = 0;
	for (const t of tones) mean += t;
	mean /= tones.length;
	for (const t of tones) {
		const l = t / mean;
		// A lit card is a young leaf and a little redder for it; a shaded one is an old one and a little
		// bluer. The same two pence of colour `skinTint` spends on the skin under these.
		const r = l * (1 + 0.05 * (l - 1));
		const b = l * (1 - 0.07 * (l - 1));
		// Four corners to a card, and a colour for every one of them: a colour buffer written once per
		// card is a quarter of the length the engine expects, and it reads whatever lies past the end —
		// which is where the dark blotches and the maroon cards came from.
		for (let k = 0; k < 4; k++) colourList.push(r, l, b, 1);
	}
	const mesh = poly(scene, "bushLeafage", { positions, indices, uvs, mat: mats.bushLeaf });
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	mesh.setVerticesData(VertexBuffer.ColorKind, colourList, true);
	mesh.receiveShadows = true;
	return mesh;
}

/**
 * A shrub: a mass of leaves, planted in the ground. See `makeLeafyMass`.
 *
 * They wear a pattern of their own, `bushCanvas`: three hundred small leaves laid over one another at
 * four and a half decimetres to a repeat, thumb-width leaves the size a clipped hedge's leaves are,
 * with the same canvas sent back as relief so each one throws its own shade. The bushes used to wear
 * the boundary hedge's pattern, which is a metre and four tenths to a repeat: on a bush a metre across
 * that is one clump and a half, and wrapped round a sphere it came out as the stripes on a
 * watermelon. Cards of leaves stuck on the outside of a ball were tried before all this and are
 * worse: they float off the skin like a dandelion gone to seed. Everything is folded into one mesh,
 * so a bush costs the browser one draw and not four.
 */
function makeShrub(scene, mats, { x, z, size = 1, seed = 3, y = 0, clip = SHRUB_CLIP }) {
	return makeLeafyMass(scene, mats, { x, z, size, seed, y, name: "shrub", clip });
}

/**
 * The crown of a banana: its leaves, built out of mesh and not out of cards.
 *
 * Every banana this Villa has had was a stalk with four flat oval cards hinged along it, and a browser
 * said plainly what that is: a handful of green plates (`pictures/s53-banana-before.png`) — every card
 * in one flat plane, and the torn edge a real leaf has belonging to the paint and not to the plant. A
 * banana leaf is a broad blade on a pale midrib: it leaves the crown pointing out or up and hangs below
 * the horizontal before it is two metres out, and the wind splits it between its veins back from each
 * margin, sometimes nearly to the rib. Those tears ARE its silhouette, which is why they are geometry
 * here — the lesson the belt's near rank, the hedge's crest, the shrub's outside leaf and the palm's
 * crown all learnt, one leaf larger.
 *
 * One leaf is marched station by station along its rib — `rise` above the horizontal at the crown,
 * bending down to `fall` below it at the tip. At every station the blade is laid out LEVEL across the
 * rib (a banana's blade lies flat in the air whatever its rib is doing — a twist no hinged card can
 * show), in four bands out from the rib, sagging as they go; and on a young leaf curling UP instead,
 * because a spear leaf is a rolled tube and not a board. The rib itself is built as a narrow band of
 * its own, standing proud of the blade and inked from the pale middle of the very same canvas.
 *
 * The margin is not a ruled line. Each station's own width wanders a little, and now and then it is cut
 * back hard: a stretch of blade cut to a tenth of its width has no blade at all between its two stations
 * — the rib goes on and the blade stops on both sides, which is a slit from the margin clean through to
 * the rib — while a stretch cut to about half keeps its inner band and loses the rest. Old leaves are
 * cut far more often than young ones, which is what a banana does.
 *
 * `scale` goes with the size of the planting; `young` is the spear coming up in the middle of the clump.
 */
function bananaCrown(scene, mats, { px, py, pz, scale = 1, seed = 1, leaves = 9, young = false }) {
	const rand = randomGenerator(seed * 31 + 7);
	const positions = [];
	const uvs = [];
	const normals = [];
	const tones = [];
	const indices = [];

	const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	const norm = (a) => {
		const l = Math.hypot(a[0], a[1], a[2]) || 1;
		return [a[0] / l, a[1] / l, a[2] / l];
	};
	const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

	/** One card: four corners, one normal, one tone. Corners go (u0,v0), (u1,v0), (u0,v1), (u1,v1). */
	const quad = (c, n, uv, tone) => {
		const at = positions.length / 3;
		for (let k = 0; k < 4; k++) {
			positions.push(c[k][0], c[k][1], c[k][2]);
			normals.push(n[0], n[1], n[2]);
			uvs.push(uv[k][0], uv[k][1]);
			tones.push(tone);
		}
		// the same winding the palm's leaflets use: a card's winding and its normal are one fact
		indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2);
	};
	/**
	 * A card's own face, turned up towards the sky. A blade card stands for a crowd of leaf that all
	 * lean a little differently, and a flat card lit by its own exact normal goes black as soon as it
	 * edges off the sun — the hedge crest's rule (`hedgeCrest` in src/world.js), on a leaf a metre wide.
	 */
	const skyward = (a, b, c, d) => {
		let n = norm(cross(sub(b, a), sub(c, a)));
		if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
		return norm([n[0] * 0.55, Math.max(0.45, n[1]) + 0.4, n[2] * 0.55]);
	};

	// The bands the blade is laid in, from the rib out to the margin, as fractions of half a blade. Five and
	// not four: four turned a blade this broad down in four flat shelves, and the crease between two of them
	// is a straight line you could lay a ruler along (`pictures/s64-banana-after.png`). Four were wanted
	// when the blade was a strap; the strap is a paddle now and a paddle wants one more bend in it.
	const bands = young
		? [[0.06, 0.32], [0.32, 0.54], [0.54, 0.72], [0.72, 0.87], [0.87, 1]]
		: [[0.06, 0.24], [0.24, 0.43], [0.43, 0.61], [0.61, 0.8], [0.8, 1]];
	// The rib's own half-width, in the same fractions: it matches the pale band inked at the middle of
	// `bananaBladeCanvas`, so the mesh rib wears exactly the paint the canvas means for a rib.
	const RIB = 0.055;

	for (let i = 0; i < leaves; i++) {
		const age = (i + 0.5) / leaves;
		const az = i * GOLD + (rand() - 0.5) * 0.5;
		const rx = Math.cos(az);
		const rz = Math.sin(az);
		const rise = (young ? 1.15 : 0.62) - (young ? 0.5 : 1.65) * age + (rand() - 0.5) * 0.22;
		const fall = 0.4 + 1.2 * age + rand() * 0.35;
		const length = (young ? 0.72 + rand() * 0.35 : 1.55 + rand() * 0.45) * scale * (1 - 0.1 * age);
		// A banana's blade is a PADDLE: on a plant two metres tall it is well over half a metre across, and
		// the version before this one laid it at 0.6-0.78 — a strap, and a crown of ten straps with the
		// margins torn to ribbons was a palm and nothing else (`pictures/s64-banana-before.png`).
		const half = (young ? 0.13 + rand() * 0.06 : 0.4 + rand() * 0.12) * scale;
		// a young leaf curls up at the margins and an old one hangs: one number, and its sign does it
		const sag = young ? -0.5 : 0.32 + rand() * 0.22;
		const stations = young ? 7 : 11;
		const tone0 = (young ? 1.22 : 1.06) - 0.3 * age + (rand() - 0.5) * 0.14;
		const ribLift = (young ? 0.012 : 0.024) * scale;
		const ds = length / stations;

		// march the rib: up out of the crown at the near end, hanging below the horizontal at the far.
		// Each station carries its own `wob`, the wander of the margin: a blade is a soft thing with a
		// wavy edge and not a sheet of plywood. It is written on the STATION and read by `point`, which is
		// a pure function of station and width, so the two bands that meet at a line always agree on it.
		const rows = [];
		let sx = px + rx * 0.05 * scale;
		let sy = py;
		let sz = pz + rz * 0.05 * scale;
		for (let s = 0; s <= stations; s++) {
			const t = s / stations;
			const th = rise - (rise + fall) * Math.pow(t, 1.25);
			const T = norm([rx * Math.cos(th), Math.sin(th), rz * Math.cos(th)]);
			let P = cross(T, [0, 1, 0]);
			if (Math.hypot(P[0], P[2]) < 0.06) P = [rx, 0, rz]; // a leaf stood straight up: any level cross will do
			rows.push({ p: [sx, sy, sz], P: norm(P), t, wob: (rand() - 0.5) * 0.3 });
			sx += T[0] * ds;
			sy += T[1] * ds;
			sz += T[2] * ds;
		}
		// An oblong blade: bare rib for the first stretch (every banana leaf stands on a stalk of its
		// own), broad for most of the leaf, and running to a point at the end.
		const shape = (t) => Math.pow(Math.max(0.04, Math.min(1, (t - 0.08) / 0.18, (1 - t) / 0.3)), 0.6);
		/**
		 * How much of the blade is left in each stretch between two stations — one whole, a little over a
		 * tenth and the wind has been right through to the rib. It is asked per STRETCH and not per
		 * station on purpose: a real tear is a slit, long way out along the veins and narrow way along the
		 * leaf, and a station-wide cut opens a hole twice as wide as it is deep, which reads as a bite out
		 * of a biscuit and not as a torn leaf.
		 */
		const cuts = [];
		for (let s = 0; s < stations; s++) {
			const t = rows[s].t;
			let cut = 1.04 + rand() * 0.06;
			if (t > 0.14 && t < 0.94) {
				const r = rand();
				// About one stretch in nine of an old leaf and one in twenty of a young one, and the wound is
				// always a TEAR: it comes in from the margin along the veins and stops short of the rib. The
				// version before this one also cut clean through to the rib now and then, and a gap that wide
				// across a blade that is only 15 cm between stations is a hole, not a tear — the leaf came out
				// punched (`pictures/s64-grass-bud.png`). What a leaf the wind has had is a handful of slits of
				// different depths, and depth is the only thing that needs varying.
				const torn = young ? 0.05 : 0.09 + 0.1 * age;
				if (r < torn) cut = 0.26 + rand() * 0.46;
			}
			cuts.push(cut);
		}
		const point = (row, f) => {
			const a = Math.abs(f);
			const d = f * half * shape(row.t) * (1 + row.wob * a * a);
			// the blade turns down off the rib in a shallow V, and the rib itself stands proud of it
			const cup = f === 0 ? ribLift : ribLift * (0.65 - 0.65 * Math.min(1, a / 0.25));
			return [row.p[0] + row.P[0] * d, row.p[1] + cup - sag * Math.abs(d), row.p[2] + row.P[2] * d];
		};
		const vAt = (f, side) => 0.5 + side * f * 0.5;

		for (let s = 0; s < stations; s++) {
			const t0 = rows[s].t;
			const t1 = rows[s + 1].t;
			const cut = cuts[s];
			const tone = tone0 * (0.86 + rand() * 0.28);
			const r0 = point(rows[s], -RIB);
			const r1 = point(rows[s + 1], -RIB);
			const r2 = point(rows[s], RIB);
			const r3 = point(rows[s + 1], RIB);
			quad([r0, r1, r2, r3], skyward(r0, r1, r2, r3), [[t0, 0.465], [t1, 0.465], [t0, 0.535], [t1, 0.535]], tone * 1.02);
			for (const side of [-1, 1]) {
				for (const [f0, f1] of bands) {
					if (f1 > cut) continue;
					const a0 = point(rows[s], side * f0);
					const a1 = point(rows[s + 1], side * f0);
					const b0 = point(rows[s], side * f1);
					const b1 = point(rows[s + 1], side * f1);
					quad([a0, a1, b0, b1], skyward(a0, a1, b0, b1), [[t0, vAt(f0, side)], [t1, vAt(f0, side)], [t0, vAt(f1, side)], [t1, vAt(f1, side)]], tone);
				}
			}
		}
	}

	if (!positions.length) return null;
	let mean = 0;
	for (const t of tones) mean += t;
	mean /= tones.length;
	const colours = [];
	for (const t of tones) {
		const l = t / mean;
		// A lit card is a young leaf and a little redder for it; a shaded one an old one and a little
		// bluer. Normalised to a mean of one, so this shapes a crown and does not repaint the garden.
		const r = l * (1 + 0.06 * (l - 1));
		const b = l * (1 - 0.08 * (l - 1));
		for (let k = 0; k < 4; k++) colours.push(r, l, b, 1);
	}
	const mesh = poly(scene, "bananaLeaves", { positions, indices, uvs, mat: mats.bananaLeaf });
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/**
 * The bunch and its bud, hanging out of the crown of a tall stem.
 *
 * It used to be a plain truncated cone on a short pin, and a photograph four metres off made it a pink
 * party hat stuck in the leaves (`pictures/s64-bud-before.png`). Three faults: it hung straight down the
 * stem's own axis, so it sat in the middle of the crown and the leaves hid it; it was one smooth cone, so
 * it had no bracts on it; and it was the width of a man's forearm and the length of a arm, where a bud is
 * a fist. So: the rachis comes out of the crown leaning over and THEN gives and hangs, which carries the
 * bud clear of the stem and down under the leaf roots; the body is a teardrop in five shingled courses;
 * and the whole thing is the size of a hand.
 *
 * Every part wears `mats.bud` and goes in its own group when the clump is folded: one mesh one material,
 * which is how the bud once came out wearing its own stalk (`pictures/s53-banana-before.png`).
 */
function bananaBud(scene, mats, { px, py, pz, scale = 1, az = 0, seed = 5 }) {
	const rand = randomGenerator(seed);
	const parts = [];
	const UP = new Vector3(0, 1, 0);
	/** One length of the hanging chain: from `p` along `d` for `len`, `dia` at its bottom and `diaTop` at its top. */
	const lay = (name, p, d, len, dia, diaTop) => {
		const l = len * scale;
		const mesh = cylinder(scene, name, {
			diameter: dia * scale,
			diameterTop: diaTop * scale,
			height: l,
			tessellation: 7,
			px: p[0] + (d[0] * l) / 2,
			py: p[1] + (d[1] * l) / 2,
			pz: p[2] + (d[2] * l) / 2,
			mat: mats.bud,
		});
		const n = Math.hypot(d[0], d[1], d[2]) || 1;
		mesh.rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(UP, new Vector3(d[0] / n, d[1] / n, d[2] / n), new BABYLON.Quaternion());
		mesh.receiveShadows = true;
		parts.push(mesh);
		return [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l];
	};
	// A hanging direction, `hang` radians out of straight down towards the azimuth `az`.
	const hang = (lean) => [Math.sin(az) * Math.sin(lean), -Math.cos(lean), Math.cos(az) * Math.sin(lean)];

	// The rachis: out over the margin of the crown, then a bit more, then it gives. It is long enough that
	// the bud hangs PAST the leaf roots and not among them: a bunch buried in its own crown is a purple
	// smudge in every view of the plant, and the Villa's bananas are seen from four metres, where a bud is
	// eight pixels. So the first leg leans hard — forty-eight degrees off straight down — and reaches a
	// good hand beyond the stem before the second leg gives at all.
	let p = [px, py, pz];
	p = lay("bananaBudStalk", p, hang(0.84 + rand() * 0.24), 0.3, 0.032, 0.044);
	p = lay("bananaBudStalk", p, hang(0.4 + rand() * 0.14), 0.22, 0.044, 0.056);
	const drop = 0.06 + rand() * 0.06;
	const bud = hang(drop);
	// The bud itself: a hand long and two spans across at its shoulder, fullest a fifth of the way down
	// and drawn to a blunt point at the bottom. It is laid in five courses along a girth that runs down
	// that profile, and every course but the top one starts a tenth fatter than the one above it ends: that
	// step is the shingle of the bracts, and it is the only thing on a bud at this size that says BRACT
	// rather than CONE. The two versions before this one got that wrong both ways — one plain cone (a pink
	// party hat) and then three separate rings laid over a straight barrel (a red fire extinguisher with a
	// bolt round its neck). A third try, thin as this one's first cut, was a chilli pepper: the girth here
	// is a fist and the neck is short, which is the proportion the eye actually has a word for.
	const fat = 0.13 + rand() * 0.02;
	const long = 0.24 + rand() * 0.05;
	// The girth at five places down the bud, as multiples of `fat`: the shoulder, the full of it, and away
	// to the point.
	const knots = [0.55, 1, 0.9, 0.7, 0.44, 0.12];
	const girth = (t) => {
		const at = Math.max(0, Math.min(knots.length - 1, t * (knots.length - 1)));
		const a = Math.floor(at);
		const b = Math.min(knots.length - 1, a + 1);
		return fat * (knots[a] + (knots[b] - knots[a]) * (at - a));
	};
	const courses = 5;
	let foot = p;
	for (let i = 0; i < courses; i++) {
		const t0 = i / courses;
		const t1 = (i + 1) / courses;
		const near = girth(t0) * (i === 0 ? 1 : 1.1);
		foot = lay("bananaBud", foot, bud, long / courses, near, girth(t1));
	}
	// A dried tip, so the point is not the raw cut of a cone.
	lay("bananaBudTip", foot, bud, 0.045, girth(1) * 1.1, 0.012);
	return parts;
}

/**
 * A banana plant: a clump of pseudostems, each crowned with broad leaves.
 *
 * The old one was five thin sticks tied together at the feet with a flat green disc nailed to the top
 * of each, which a picture turned into a row of little tables. A banana is nothing like that: it has a
 * thick stem — a rolled sheath of leaf bases, taller than a person on the big ones — and its leaves
 * come out of the crown on stalks, held up for a while and then folding over to droop; and the whole
 * plant is a clump of stems of three ages, the old ones outward and a young one coming up in the
 * middle. The stems used to wear the palm's bark, which made every clump three palm saplings: a
 * pseudostem is a green sheath, and it now wears a pattern of its own.
 *
 * The leaves are `bananaCrown`, above: one mesh per stem, built where they stand. The stems stay
 * cylinders and are folded into one mesh for the whole clump.
 */
function makeBanana(scene, mats, { x, z, seed = 7, scale = 1, y = 0 }) {
	const rand = randomGenerator(seed);
	const stemParts = [];
	const budParts = [];
	const crowns = [];
	const canes = rand() < 0.45 ? 3 : 2;

	for (let c = 0; c < canes; c++) {
		const young = c > 0;
		const height = (young ? 0.8 + rand() * 0.45 : 1.9 + rand() * 0.5) * scale;
		const ox = young ? (rand() - 0.5) * 0.66 : 0;
		const oz = young ? (rand() - 0.5) * 0.66 : 0;
		const leanDir = rand() * Math.PI * 2;
		const lean = 0.05 + rand() * 0.12;
		const foot = 0.2 * scale * (young ? 0.62 : 1);
		const stem = cylinder(scene, "bananaStem", {
			diameter: foot,
			diameterTop: foot * 0.68,
			height,
			tessellation: 8,
			px: x + ox,
			py: y + height / 2,
			pz: z + oz,
			mat: mats.stalk,
		});
		stem.rotation.z = -Math.sin(leanDir) * lean;
		stem.rotation.x = Math.cos(leanDir) * lean;
		stem.receiveShadows = true;
		stemParts.push(stem);

		// The crown of a leaning stem is not straight above its foot.
		const topX = x + ox + Math.sin(leanDir) * lean * height;
		const topY = y + Math.cos(lean) * height;
		const topZ = z + oz + Math.cos(leanDir) * lean * height;

		const crown = bananaCrown(scene, mats, {
			px: topX,
			py: topY,
			pz: topZ,
			scale,
			seed: seed * 7 + c,
			leaves: young ? 5 : 9,
			young,
		});
		if (crown) {
			crown.receiveShadows = true;
			crowns.push(crown);
		}

		// One hanging bud on the tall stem, which is how you know it is a banana and not a palm.
		if (!young) {
			budParts.push(...bananaBud(scene, mats, {
				px: topX,
				py: topY - 0.02 * scale,
				pz: topZ,
				scale,
				az: rand() * Math.PI * 2,
				seed: seed * 3 + c,
			}));
		}
	}

	return [...mergeParts(scene, [[stemParts, "bananaStems"], [budParts, "bananaBud"]], null), ...crowns];
}

/**
 * Folds a plant's parts into flat meshes, one per material, so a banana costs the browser two draws and
 * a bush one instead of thirty — the same way a palm does (see `makePalm`). Each group is the parts and
 * the name the finished mesh is to answer to.
 *
 * One mesh wears one material: the finished mesh is given the material of the FIRST part in its group,
 * and a part wearing anything else is silently repainted. That is how a banana's flower ended up the
 * colour of its own stalk, so a part with its own material goes in its own group.
 */
function mergeParts(scene, groups, crown, keepColours = false) {
	const out = [];
	for (const [parts, name] of groups) {
		if (!parts.length) continue;
		for (const mesh of parts) mesh.computeWorldMatrix(true);
		const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, keepColours);
		if (merged) {
			merged.material = parts[0].material;
			merged.parent = null;
			merged.receiveShadows = true;
			merged.name = name;
			out.push(merged);
		}
	}
	if (crown) crown.dispose();
	return out;
}

/**
 * Three thrown shapes, each a list of [radius, height] in metres, up the outside and back down the inside.
 *
 * A pot is thrown on a wheel, and what a wheel leaves is a foot the pot stands on, a belly that is the
 * widest thing about it, a shoulder and neck drawing back in, and a moulded rim with a thickness to it.
 * `cylinder` could only give a straight taper, and a browser at the terrace steps showed what that is: a
 * ribbed paper cup (`pictures/tmp-home-s.png`), and four identical cups in a row besides.
 *
 *   urn     the tall one: foot, belly, neck, a rim like a bead. The temple-and-hotel pot.
 *   basin   low and wide, the shape a nursery sells a shrub in.
 *   jar     a ginger jar: small mouth, the belly outside the mouth's width by a good way.
 *
 * `soil` is where the earth is put in, and `across` how wide the bore is there, so the plant's foot can be
 * stood in the ground and not on the rim or floating in the middle of a hollow.
 */
const POT_SHAPES = {
	// The common terracotta flower pot, and it is called an urn no longer in look, whatever the name says.
	// The profile used to be widest at half its height, pinching in to a neck two thirds up and flaring a little
	// for a rim: measured on the mesh, radius 0.166 at the foot, 0.284 at half, 0.204 at nine tenths. That is an
	// onion, and every pot of that shape in this garden was one. A thrown pot is the other way about: a foot,
	// a wall that grows all the way up because that is how it is turned, and a band of thickened clay at the
	// brim where the thrower's finger went round. So the widest point is the rim, and the neck is gone.
	//
	// The inside is drawn too, because a pot is a vessel and a visitor leans over a terrace rail: the wall
	// comes back down on the inside to the floor of the hollow, and `soil` sits in it below the brim.
	// `across` is the bore's DIAMETER at `soil`.
	urn: {
		profile: [
			[0.0, 0.0], [0.15, 0.0], [0.152, 0.022], [0.168, 0.06], [0.186, 0.13], [0.206, 0.22], [0.226, 0.32],
			[0.244, 0.42], [0.258, 0.5], [0.268, 0.555],
			// the brim: thickened, standing out from the wall, and flat across where the finger left it
			[0.286, 0.568], [0.292, 0.585], [0.292, 0.622], [0.278, 0.632], [0.262, 0.62],
			// and back down the inside, to the floor of the hollow
			[0.248, 0.55], [0.232, 0.44], [0.214, 0.32], [0.196, 0.2], [0.18, 0.11], [0.0, 0.09],
		],
		soil: 0.52,
		across: 0.46,
	},
	basin: {
		profile: [
			[0.0, 0.0], [0.2, 0.0], [0.195, 0.03], [0.235, 0.09], [0.27, 0.2], [0.285, 0.3],
			[0.3, 0.335], [0.3, 0.365], [0.275, 0.375], [0.26, 0.36], [0.25, 0.28], [0.235, 0.16], [0.0, 0.13],
		],
		soil: 0.3,
		across: 0.44,
	},
	jar: {
		profile: [
			[0.0, 0.0], [0.13, 0.0], [0.125, 0.03], [0.17, 0.075], [0.25, 0.17], [0.29, 0.3], [0.275, 0.42],
			[0.205, 0.52], [0.16, 0.6], [0.158, 0.65], [0.185, 0.665], [0.185, 0.705], [0.165, 0.715],
			[0.148, 0.7], [0.142, 0.6], [0.0, 0.55],
		],
		soil: 0.6,
		across: 0.26,
	},
};

/**
 * One terracotta pot, thrown. Returns the pot and the soil in it; `y` is the ground it stands on.
 *
 * Nothing about a pot is exact — it dried unevenly, it warped, and the thrower's hand was a hand — so each
 * one is given a slight egg (a squash in one direction and the same stretch in the other, so the girth is
 * kept), a turn, and a little more or less height. Left to the same mesh the four pots on the terrace were
 * four copies and the eye read copies at once, which is a plant nursery and not a terrace.
 */
function makePot(scene, mats, { x, z, y = 0, size = 1, shape = "urn", seed = 3 }) {
	const plan = POT_SHAPES[shape] || POT_SHAPES.urn;
	const rand = randomGenerator(seed);
	const pot = revolve(scene, `pot${shape}${seed}`, { profile: plan.profile, sides: 16, px: x, py: y, pz: z, mat: mats.pot, flipV: true });
	const egg = 1 + (rand() - 0.5) * 0.08;
	pot.scaling.set(size * egg, size * (0.94 + rand() * 0.12), size / egg);
	pot.rotation.y = rand() * Math.PI * 2;
	const soil = cylinder(scene, `potSoil${seed}`, {
		diameter: plan.across * size * 0.98,
		height: 0.06,
		tessellation: 12,
		px: x,
		py: y + (plan.soil - 0.01) * size,
		pz: z,
		mat: mats.soil,
	});
	soil.scaling.y = 1;
	return { parts: [pot, soil], mouth: plan.soil * size, across: plan.across * size };
}

/**
 * What grows in the pot. Six of them, because five pots wearing one clipped green ball is a row of green
 * eggs and not a terrace: a Thai pool terrace has a clump of lemongrass, a chilli plant, a kumquat, a pot
 * of marigolds for the altar, and a basil pot by the door, and it buys them at different times in
 * different pots, which is why the pots differ too.
 *
 *   lemongrass  a splayed fountain of grass, cut often, the pale yellow-green of a cut clump
 *   marigold    a low green cushion with gold and orange heads on top of it
 *   chilli      an open green little tree with a few red fingers hanging at its skirt
 *   kumquat     a round mass the size of the pot, with orange in it
 *   basil       low, wide and dark: a herb that has been picked, not a shrub that has been clipped
 *   banana      a young one, the whole pot a fan of paddles
 *   mass        the plain clipped mass, for the room behind the glass where a pot is furniture
 */
function makePotGreenery(scene, mats, { kind = "mass", x, z, y, size = 1, seed = 11, clip = SHRUB_CLIP, name = "potted" }) {
	const rand = randomGenerator(seed + 7);
	if (kind === "lemongrass") {
		// The lawn's grass clump, big, old and splayed: lemongrass IS a grass, and a cut one at that,
		// so the wide low fountain of an old crown is the shape and not a young spike.
		//
		// `tint` is a MULTIPLIER on the atlas, not a colour: the clump's vertex colours are read as 0-1
		// floats, and handing it [176,196,116] painted the pot's fountain at (254,253,190) — a yellow-white
		// starburst on the terrace that the release preview made very hard to miss. It is taken off the sward
		// the garden already grows, a little paler and yellower, which is what a cut lemongrass looks like
		// beside a mown lawn.
		const sward = lawnTone(x, z);
		return [
			makeTufts(scene, mats, [
				{
					x, y, z, size: size * 0.72, seed: seed + 3, ry: rand() * Math.PI, age: 0.86,
					tint: [sward[0] * 1.14, sward[1] * 1.05, sward[2] * 0.76],
				},
			]),
		];
	}
	if (kind === "banana") {
		return makeBanana(scene, mats, { x, z, seed: seed + 5, scale: size * 0.36, y: y - size * 0.06 });
	}
	const crownSize = { marigold: 0.36, chilli: 0.38, kumquat: 0.46, basil: 0.42 }[kind] || size * 0.8;
	// A pot plant is pinched out with the finger and thumb, not sheared level with the hedge shears the
	// court's shrubs wear (`clip`). Sheared, a herb in a jar came out as a green coin laid on the mouth —
	// `pictures/tmp-pot-court.png` — because the flat board of the cut sat under the rim and only the middle
	// of the dome was left showing. Left alone it is a mound, which is what a pot plant is.
	// How far the crown sits below the pot's mouth. A marigold and a basil are picked low and make a cushion
	// inside the rim; a chilli and a kumquat are small plants and stand up out of the pot and over its neck.
	// Set all of them at the mouth, and the low ones read as a lid laid on a jar; set all of them sunk, and
	// the tall ones were drowned in the pot (`pictures/tmp-pots2.png`).
	const sink = kind === "marigold" || kind === "basil" ? 0.05 : 0.0;
	// A kumquat in a pot is a small TREE. Its crown used to sit down on the soil with its skirt at the rim, and
	// a picture said what that is: a green ball laid on a pot, a moss ball with orange pins in it. A citrus
	// bought for a terrace has a trunk you can see the top span of, and limbs that come out of it and are
	// hidden again by leaf. So the crown is lifted on a stump, and three limbs go out from the stump into it —
	// which also lifts the fruit off the rim, where a kumquat hangs it.
	const rise = kind === "kumquat" ? size * 0.22 : 0;
	const parts = [...makeLeafyMass(scene, mats, { x, z, size: crownSize * size, seed, y: y - size * sink + rise, name: `${name}Bush`, clip: 1 })];
	const middle = y - size * sink + rise + crownSize * size * 0.72;
	const reach = crownSize * size * 0.82;
	/** `count` things scattered over the crown's own width, at `height` above its middle. */
	const sow = (count, height, make) => {
		for (let i = 0; i < count; i++) {
			const a = rand() * Math.PI * 2;
			const out = reach * (0.3 + rand() * 0.62);
			make(x + Math.sin(a) * out, middle + height + (rand() - 0.5) * crownSize * size * 0.22, z + Math.cos(a) * out, a);
		}
	};
	// The stump and its limbs, for the one pot plant that is a tree. The stump is a finger thicker than the
	// pot's rim is wide and it is leaned a degree or two, because nothing that grew is plumb.
	if (rise) {
		const stump = rise + crownSize * size * 0.3;
		const trunk = cylinder(scene, "kumquatTrunk", {
			diameter: size * 0.062, height: stump, tessellation: 9,
			px: x, py: y + stump * 0.5 - crownSize * size * 0.14, pz: z,
			mat: mats.wood,
		});
		trunk.rotation.z = (rand() - 0.5) * 0.07;
		trunk.rotation.x = (rand() - 0.5) * 0.05;
		parts.push(trunk);
		for (let i = 0; i < 3; i++) {
			const a = rand() * Math.PI * 2;
			const lean = 0.7 + rand() * 0.35;
			const length = crownSize * size * (0.42 + rand() * 0.16);
			const root = y + rise * 0.72;
			const limb = cylinder(scene, "kumquatLimb", {
				diameter: size * 0.026, height: length, tessellation: 6,
				px: x + Math.sin(a) * length * 0.5 * Math.sin(lean),
				py: root + length * 0.5 * Math.cos(lean),
				pz: z + Math.cos(a) * length * 0.5 * Math.sin(lean),
				mat: mats.wood,
			});
			limb.rotation.y = a;
			limb.rotation.x = lean;
			parts.push(limb);
		}
	}
	if (kind === "marigold") {
		// The heads ride the TOP of the cushion of leaf, where a marigold holds them. Scattered through the
		// crown they were buried in their own leaves and the pot read as a green shrub with nothing on it.
		for (let i = 0; i < 13; i++) {
			const a = rand() * Math.PI * 2;
			const out = reach * (0.15 + rand() * 0.7);
			sphere(scene, "marigold", {
				diameter: size * (0.07 + rand() * 0.03), segments: 6,
				px: x + Math.sin(a) * out,
				py: y + crownSize * size * (0.5 + rand() * 0.3),
				pz: z + Math.cos(a) * out,
				mat: rand() < 0.45 ? mats.marigoldDeep : mats.marigold,
			});
		}
	} else if (kind === "chilli") {
		// The pods hang at the skirt of the bush, out under the leaves, and they hang DOWN. The first try
		// scattered them through the crown upright and a browser showed what that is: a pot of red chopsticks
		// (`pictures/tmp-pots.png`). A chilli is a finger pointing at the ground.
		for (let i = 0; i < 7; i++) {
			const a = rand() * Math.PI * 2;
			const out = reach * (0.72 + rand() * 0.3);
			const pod = box(scene, "chilli", {
				x: size * 0.026, y: size * (0.06 + rand() * 0.025), z: size * 0.026,
				px: x + Math.sin(a) * out,
				py: middle - crownSize * size * (0.28 + rand() * 0.3),
				pz: z + Math.cos(a) * out,
				mat: mats.chilli,
			});
			pod.rotation.y = a;
			pod.rotation.z = 0.25 + rand() * 0.5;
		}
	} else if (kind === "kumquat") {
		sow(7, 0, (px, py, pz) => sphere(scene, "kumquat", { diameterX: size * 0.06, diameterY: size * 0.05, diameterZ: size * 0.06, segments: 6, px, py, pz, mat: mats.citrus }));
	}
	return parts;
}

/**
 * A plant in a terracotta pot: the thing every Thai terrace has by the steps. `y` is the ground it
 * stands on. Exported because the room behind the front glass stands one in its east corner, on the
 * room's own floor (see src/interior.js).
 *
 * The plant's foot goes in at the soil line of its own pot shape, which is where a plant's foot belongs;
 * it used to be hung at a fixed 0.56 of the pot's size whatever the shape, so a plant sat on top of the
 * rim with its roots in the air.
 */
export function makePottedPlant(scene, mats, { x, z, size = 1, seed = 11, y = 0, clip = SHRUB_CLIP, shape = "urn", kind = "mass" }) {
	const pot = makePot(scene, mats, { x, z, y, size, shape, seed });
	return [
		...pot.parts,
		...makePotGreenery(scene, mats, { kind, x, z, y: y + pot.mouth, size, seed, clip, name: "potted" }),
	];
}

/** How tall a thrown pot of this shape and size stands, and how wide its mouth is: for the props that
 * stand things on a pot's rim or need to know where its top is. */
export function potMouth(shape = "urn", size = 1) {
	const plan = POT_SHAPES[shape] || POT_SHAPES.urn;
	return { mouth: plan.soil * size, across: plan.across * size };
}

/**
 * A bed of bare earth along a wall: a ribbon of ground laid over the lawn, `width` wide, its outer
 * edge wandering in and out so the grass ends at an edge and not at a ruled line.
 *
 * This is what the master asked for when he said the garden wanted dirt: where the plaster of the
 * plinth met the grass straight there was one line, nothing growing at it, and the house sat on the
 * lawn like a cake on a plate. A band of baked laterite at the foot of the wall gives the ground a
 * third edge — stone, earth, grass — and gives the shrubs along it something to be planted in.
 *
 * Two things to know. The walk along the wall decides which side is out: the outward normal is the
 * travel direction turned a quarter turn clockwise in plan (outward = dz, -dx), and a caller that
 * walks the wall the wrong way finds its bed laid inside the house. And this is one skin with no
 * thickness — 7 cm off the ground where it tucks under the wall, 2 cm out at the grass, which is
 * enough that the renderer does not flicker the two surfaces against each other and too little to
 * see from anywhere. A face wound the wrong way is culled and the bed simply is not there, so
 * `tools/draw.js`, which throws away the faces that point away from the eye, is the proof that this
 * one looks up at the sky.
 */
function makeEarthBed(scene, mats, { name = "earthBed", x0, z0, x1, z1, width = 1, seed = 3 }) {
	const dx = x1 - x0;
	const dz = z1 - z0;
	const length = Math.hypot(dx, dz);
	// One step every half metre: finer and the edge is a saw, coarser and it is a staircase.
	const steps = Math.max(3, Math.round(length / 0.5));
	const nx = dz / length;
	const nz = -dx / length;
	const tile = patternMetres(mats.earth) || 0.7;
	const rand = randomGenerator(seed);
	const phase = rand() * 6.283;
	const positions = [];
	const uvs = [];
	const indices = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const wx = x0 + dx * t;
		const wz = z0 + dz * t;
		// Two waves that are not multiples of one another, so the edge never falls into a rhythm, and
		// both are whole multiples of the run, so the bed finishes square at the corner of a wall.
		const wander =
			0.84 +
			0.2 * Math.sin(t * Math.PI * 4 + phase) * Math.sin(t * Math.PI * 2) +
			0.08 * Math.sin(t * Math.PI * 14 + phase * 2);
		const w = width * wander;
		positions.push(wx - nx * 0.07, 0.07, wz - nz * 0.07);
		positions.push(wx + nx * w, 0.02, wz + nz * w);
		const along = (t * length) / tile;
		uvs.push(0, along, w / tile, along);
	}
	for (let i = 0; i < steps; i++) {
		const a = i * 2;
		indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
	}
	const mesh = poly(scene, name, { positions, indices, uvs, mat: mats.earth });
	mesh.receiveShadows = true;
	return mesh;
}

/**
 * Grass that stands up out of the ground, as opposed to the grass painted flat on it.
 *
 * The lawn has had a pattern for a long time and it is a good one, but every blade in it is a
 * five-pixel stroke lying down: read across the garden it is a lawn, and read from where a visitor
 * stands it is green gravel. Outdoors, grass *stands* — a handful of long leaves arcing out of a
 * crown, 20 to 50 cm tall — and it is thickest where a wall or a paving edge shuts off the mower.
 * So these clumps are laid where the garden meets something built: that is the seam the master
 * complained was bare, and a clump of grass is what a seam like that actually has on it.
 *
 * One clump is four sheets — five, if it is an old wide one — crossed like a star, each a square of
 * the clump skin standing on its own bottom edge, so the clump is a clump from every side and not a
 * card that thins to nothing when it turns. They are wound so their faces look out of the star's middle
 * and each sheet is given its own flat normal, because a computed normal on three sheets crossing one
 * another shades the clump as a creased lump. Every clump in the garden is then folded into ONE mesh,
 * so a garden full of grass costs the browser a single draw, and each clump carries its own colour at
 * its corners — the tone of the ground it actually stands on (`lawnTone`), and a straw one in nine —
 * the same way the lawn carries its patches (see `tintFromGround` in mesh.js).
 *
 * THE SKIN IS FOUR CLUMPS AND NOT ONE. `tuftAtlasCanvas` paints four separate clumps, one of each age
 * in `tuftShapes`, and a clump is inked with exactly one of them — the one that matches its own age,
 * with a jitter, so the garden is four ages of plant and not one plant nine hundred times over. Every
 * clump wearing the same painted square was the fault left over when the tile was last rebuilt: at six
 * metres the same silhouette, the same raggedness in the same place, in every clump in the picture.
 * Same trick as the belt's near rank and the shrub's leaf cards; see `tuftAtlas` in src/textures.js.
 *
 * `spots` is one entry per clump: where it stands (`x`, `z`) and how high the ground under it is
 * (`y`, since a bed at the foot of the wall is a little above the lawn), how big across (`size`),
 * which way it is turned (`ry`), how old (`age`, 0 to 1, left out for a clump to draw its own), a tint
 * of three multipliers, and a seed for its own drawing.
 */
function makeTufts(scene, mats, spots) {
	const positions = [];
	const uvs = [];
	const indices = [];
	const normals = [];
	const colours = [];
	for (const s of spots) {
		const rand = randomGenerator(s.seed);
		// A clump's age, 0 (a young crown, tight and upright) to 1 (an old one, wide, low and splayed).
		// Every clump used to be cut to the same proportions, and a garden of one age of anything is a
		// plantation. The age sets how wide and how tall its sheets are and how far they lean out; the
		// old ones get a fourth sheet, because a wide star of three thins to nothing when it turns.
		const age = s.age === undefined ? rand() : s.age;
		// The painted square is about four fifths of a clump across and eleven twelfths of it tall, so
		// these are the clump's own width and height once the paint's own margins are allowed for. A
		// young crown is a tight spike; an old one is a low wide fountain. Long grass by a wall stands
		// 15 to 30 cm high and about as wide again: anything taller is a ornamental grass and not the
		// stuff a mower went past.
		const wide = s.size * (0.72 + age * 0.2 + rand() * 0.14);
		const tall = s.size * (0.56 - age * 0.06 + rand() * 0.16);
		const leanOf = 0.04 + age * 0.2 + rand() * 0.1;
		// FOUR sheets and not three. Three crossed cards are six arms of a star, and a browser looking
		// down on the mown lawn from the west saw every one of them: the scattered clumps came out as
		// little green arrowheads and the verge as a row of spiky crowns (`pictures/tmp-tuft5m-crop.png`,
		// and the same darts in `pictures/2328-westlawn.png`). A fourth card, and a fifth on an old wide
		// crown, fills the star in from every side at the cost of two triangles a clump per clump.
		const sheets = age > 0.72 ? 5 : 4;
		// Which painted clump this one wears. Every clump used to be inked with the same square, and a
		// browser six metres off showed the trick at once — the same silhouette, the same raggedness in
		// the same place, in nine hundred clumps. The skin is four separate clumps of four ages
		// (`tuftAtlasCanvas` in src/textures.js) and a clump wears the one that matches its own age, with
		// a little jitter so a row of them does not go young, middle, old, straggly, young, middle.
		const cell = Math.max(0, Math.min(tuftAtlas.cols * tuftAtlas.cols - 1, Math.round(age * 3 + (rand() - 0.5) * 0.9)));
		const col = cell % tuftAtlas.cols;
		const row = Math.floor(cell / tuftAtlas.cols);
		// Two texels off every edge of the cell: a clump small on the screen is drawn from a coarser mip
		// of the whole skin, and without the inset it would pick up the leaves of the clump next door.
		const inset = 2 / tuftAtlas.size;
		const u0 = col / tuftAtlas.cols + inset;
		const u1 = (col + 1) / tuftAtlas.cols - inset;
		// The engine lays a canvas with v growing upwards from its own bottom row, so the cell's TOP row
		// on the canvas is the smaller row number and the higher v.
		const vTip = 1 - row / tuftAtlas.cols - inset;
		const vFoot = 1 - (row + 1) / tuftAtlas.cols + inset;
		for (let q = 0; q < sheets; q++) {
			// 45 degrees apart at four sheets, so eight arms of a star and no sheet lies flat on
			// another however the clump is turned.
			const yaw = s.ry + (q * Math.PI) / sheets + rand() * 0.35;
			const rx = Math.sin(yaw);
			const rz = Math.cos(yaw);
			// The clump's own left and right, and the way its face looks.
			const nx = Math.cos(yaw);
			const nz = -Math.sin(yaw);
			// A little lean, so no two leaves in the garden go straight up at the eye.
			const lean = leanOf * (0.7 + rand() * 0.6);
			// Not every sheet of a clump grows to the same height, or as wide as its neighbour. Four sheets
			// of one height are four copies of one silhouette stood forty-five degrees apart, and the union
			// of those is an eight-pointed star — which is what a browser made at four metres, a green burr
			// with eight points and no crown (that browser picture was working scratch and is pruned; the two
			// builds side by side at the west verge are `pictures/s77-clump-close-pair.png`). One sheet grown tall and the
			// next cropped, sheet by sheet, and the clump is a mound instead of a star.
			const crown = 0.74 + rand() * 0.32;
			const spread = 0.86 + rand() * 0.26;
			const tipX = nx * Math.sin(lean) * tall * crown;
			const tipZ = nz * Math.sin(lean) * tall * crown;
			const up = Math.cos(lean) * tall * crown;
			// The sheet's normal is not the sheet's face: a leaf arcs over, so the light a clump sees on
			// average comes from above the horizon and not along it. Laid flat the sheets see the sun and
			// the sky at their own azimuth only, and a browser measured the clumps at (84,102,33) against
			// (141,169,55) for the lawn they stand in — a dark seam along the stone instead of grass. So
			// the normal is tilted up off the horizontal, which is what arcing leaves add up to.
			const face = 0.87; // cosine of about 30 degrees up
			const nX = nx * face;
			const nY = Math.sqrt(1 - face * face);
			const nZ = nz * face;
			const base = positions.length / 3;
			// Four corners: the two feet on the ground and the two tips above them. The feet go 2 cm
			// under the ground it stands on so the cut edge of the sheet is buried and no hairline of
			// sky shows between the clump and the lawn.
			positions.push(s.x - (rx * wide * spread) / 2, s.y - 0.02, s.z - (rz * wide * spread) / 2);
			positions.push(s.x + (rx * wide * spread) / 2, s.y - 0.02, s.z + (rz * wide * spread) / 2);
			positions.push(s.x - (rx * wide * spread) / 2 + tipX, s.y + up, s.z - (rz * wide * spread) / 2 + tipZ);
			positions.push(s.x + (rx * wide * spread) / 2 + tipX, s.y + up, s.z + (rz * wide * spread) / 2 + tipZ);
			// The feet of the sheet sit at the BOTTOM of its cell on the skin — the ground line, where the
			// leaves come out of the crown — and its tips at the cell's top. The engine lays a canvas with v
			// growing upwards from the canvas's own bottom row, which a plane built by
			// `MeshBuilder.CreatePlane` accounts for in its own UVs and which these hand-written ones once
			// had backwards: with the feet at the top of the square every clump in the garden hung from its
			// tips, a flat black crown in the air with the leaves dangling under it
			// (`pictures/tmp-tuft-before.png`). The proof, not a guess: feet at the cell's low v, tips at
			// its high v, and the leaves stand.
			uvs.push(u0, vFoot, u1, vFoot, u0, vTip, u1, vTip);
			indices.push(base, base + 2, base + 3, base, base + 3, base + 1);
			for (let k = 0; k < 4; k++) normals.push(nX, nY, nZ);
			for (let k = 0; k < 4; k++) colours.push(s.tint[0], s.tint[1], s.tint[2], 1);
		}
	}
	const mesh = poly(scene, "grassTufts", { positions, indices, uvs, mat: mats.tuft });
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	mesh.receiveShadows = true;
	return mesh;
}

/**
 * Where the clumps go. `fringe` lays a verge along a straight edge, `reach` metres out on the lawn
 * side of it; `scatter` strews them over a rectangle. Both fill the same list, in metres of ground,
 * and neither is allowed near the pool's edge: grass at the lip of the water is a thing a garden does,
 * but a swimmer brushing it with a shoulder is not.
 *
 * A VERGE COMES IN DRIFTS. `fringe` does not set a clump down every `every` metres — that is a planted
 * hedge, and six sessions of pictures show what it did: a row with gaps in it, one clump, a gap, one
 * clump, all the size of one another. It walks the edge and, where a drift starts, sets down a crown
 * and two, three, four more crowded in beside it, then leaves the next place bare. Two metres of long
 * grass, two metres of close-cropped edge, the way a mower actually misses a kerb.
 */
function makeTuftPlan(scene, feet = []) {
	const spots = [];
	// What a clump is coloured by. It wears the tone of the ground it actually stands on — a dry place
	// of the lawn grows dry grass and a lush one grows lush grass, which is the whole answer to "a tuft
	// is cooler and darker than the sward it stands in" — over a small random spread of its own, and one
	// clump in nine has gone straw outright.
	const tint = (x, z, rand) => {
		const ground = lawnTone(x, z);
		if (rand() < 0.11) return [ground[0] * 1.16, ground[1] * 1.05, ground[2] * 0.74]; // a clump that has gone straw
		// Held close to the sward it stands in. Below about 0.95 a clump is a dark plant in a light lawn:
		// Chromium put these clumps 24 points of light under the grass they grow out of, which is a
		// cabbage, not a patch the mower went past.
		const v = 0.95 + rand() * 0.26;
		return [ground[0] * v * 0.99, ground[1] * v * 1.02, ground[2] * v * 0.94];
	};
	const fringe = ({ name, x0, z0, x1, z1, nx, nz, every = 0.8, reach = 0.3, size = 0.36, y = 0, skip = 0.2, ageFrom = 0.3, ageMore = 0.7 }) => {
		const rand = randomGenerator(name);
		const length = Math.hypot(x1 - x0, z1 - z0);
		const steps = Math.max(1, Math.round(length / every));
		for (let i = 0; i < steps; i++) {
			// A bare place in the verge. A line of clumps at even spacing is a planted hedge; long grass
			// comes in drifts, with two metres of bare edge between one drift and the next where the mower
			// went close.
			if (rand() < skip) continue;
			const t = (i + rand()) / steps;
			// One drift: this crown and two, three, four more crowded in beside it. `rand() * rand()` so
			// the big drifts are the rare ones — most places get a crown and its next-door neighbour.
			const crowd = 1 + Math.floor(rand() * rand() * 5);
			for (let k = 0; k <= crowd; k++) {
				const along = (rand() - 0.5) * every * 1.7;
				const tt = t + along / length;
				if (tt < 0 || tt > 1) continue;
				// Out from the stone, never onto it: the offset is always positive, which is what keeps a
				// drift of grass off the cut paving (`tools/tuftfoot.js` checks that it does).
				const off = 0.06 + rand() * reach;
				const px = x0 + (x1 - x0) * tt + nx * off;
				const pz = z0 + (z1 - z0) * tt + nz * off;
				spots.push({
					x: px,
					z: pz,
					y,
					size: size * (0.72 + rand() * 0.7),
					ry: rand() * Math.PI,
					age: ageFrom + rand() * ageMore,
					tint: tint(px, pz, rand),
					seed: name + i * 7 + k,
				});
			}
		}
	};
	// The clumps scattered through the mown lawn are the ones the mower went over and missed: young,
	// short and upright, SMALLER than the long grass along the stone on purpose — a clump of grass the
	// size of a cabbage head in the middle of a mown lawn is a planted specimen, and there are ninety
	// of them in a frame from the west lawn. At `size: 0.2` a straggle reads as a rough patch of the
	// sward; at 0.26-0.28 it was a plant standing on it, and a field of them was a field of little green
	// arrowheads — `pictures/s60-southborder-pair.png`, whose left half is that camera at v0.57.0.
	const scatter = ({ name, x0, x1, z0, z1, count, size = 0.2, y = 0, ageFrom = 0, ageMore = 0.45 }) => {
		const rand = randomGenerator(name);
		for (let i = 0; i < count; i++) {
			const px = x0 + (x1 - x0) * rand();
			const pz = z0 + (z1 - z0) * rand();
			spots.push({
				x: px,
				z: pz,
				y,
				size: size * (0.6 + rand() * 0.7),
				ry: rand() * Math.PI,
				age: ageFrom + rand() * ageMore,
				tint: tint(px, pz, rand),
				seed: name + i * 13,
			});
		}
	};

	// ---- the pool court: where the cut stone ends and the garden begins -----
	// These are the court's outer joins — fifty-six metres of straight, ruled line between paving and
	// lawn (18 m down each side, 6.45 across each south end and 3.5 at each north end), since the two
	// outer edges came in to x = ±11.9 (see src/court.js) — and every one of them is
	// one clean line with nothing growing at it unless this lays grass there. The numbers come from the
	// same plan the paving is laid from, so a fringe cannot be left behind on a line the stone no longer
	// has: when the court moved in, these moved with it.
	fringe({ name: 101, x0: -courtEdge, z0: -2.2, x1: -courtEdge, z1: 15.8, nx: -1, nz: 0, every: 0.7, reach: 0.45, size: 0.38 });
	fringe({ name: 107, x0: courtEdge, z0: -2.2, x1: courtEdge, z1: 15.8, nx: 1, nz: 0, every: 0.7, reach: 0.45, size: 0.38 });
	fringe({ name: 113, x0: -courtEdge, z0: 15.8, x1: -5.45, z1: 15.8, nx: 0, nz: 1, every: 0.7, reach: 0.45, size: 0.38 });
	fringe({ name: 127, x0: 5.45, z0: 15.8, x1: courtEdge, z1: 15.8, nx: 0, nz: 1, every: 0.7, reach: 0.45, size: 0.38 });
	// The paving beyond the far end of the pool: its south edge is at z = 16.2, and the path runs out
	// through it, so the fringe is laid on either side of the path and not across the mouth of it. (The
	// north end of that paving, at z = 7.4, gets none on purpose: it stands under the pool's capstone, and
	// grass coming through a joint between two cut stones reads as a weed in the grout.)
	fringe({ name: 131, x0: -5.45, z0: 16.2, x1: -1.7, z1: 16.2, nx: 0, nz: 1, every: 0.7, reach: 0.45, size: 0.38 });
	fringe({ name: 137, x0: 1.7, z0: 16.2, x1: 5.45, z1: 16.2, nx: 0, nz: 1, every: 0.7, reach: 0.45, size: 0.38 });
	// The north ends of the two decks, where lawn runs up to the stone on either side of the terrace.
	fringe({ name: 139, x0: -courtEdge, z0: -2.2, x1: -8.4, z1: -2.2, nx: 0, nz: -1, every: 0.7, reach: 0.45, size: 0.38 });
	fringe({ name: 149, x0: 8.4, z0: -2.2, x1: courtEdge, z1: -2.2, nx: 0, nz: -1, every: 0.7, reach: 0.45, size: 0.38 });
	// The path out through the south planting. It starts under the far paving, at z = 16.2, and its own
	// boards are 0.12 high against the paving's 0.14, so a fringe at its north end would be a clump
	// standing on stone: `tools/tuftfoot.js` is what checks that a plan like this one is on ground.
	fringe({ name: 151, x0: -1.7, z0: 16.3, x1: -1.7, z1: 21.5, nx: -1, nz: 0, every: 0.65, reach: 0.4, size: 0.4 });
	fringe({ name: 157, x0: 1.7, z0: 21.5, x1: 1.7, z1: 16.3, nx: 1, nz: 0, every: 0.65, reach: 0.4, size: 0.4 });
	fringe({ name: 163, x0: -1.7, z0: 21.5, x1: 1.7, z1: 21.5, nx: 0, nz: 1, every: 0.65, reach: 0.4, size: 0.4 });

	// ---- the beds at the foot of the house, and along the south hedge ------
	// Bare laterite is right for the seam a wall sits in, but a bed with nothing growing in it is a
	// trench. These stand on the bed, which is 7 cm high where it tucks under the wall.
	fringe({ name: 167, x0: -8.3, z0: -2.2, x1: -8.3, z1: -12.5, nx: -1, nz: 0, every: 0.6, reach: 0.8, size: 0.34, y: 0.05, skip: 0.08 });
	fringe({ name: 173, x0: 8.3, z0: -12.5, x1: 8.3, z1: -2.2, nx: 1, nz: 0, every: 0.6, reach: 0.8, size: 0.34, y: 0.05, skip: 0.08 });
	// The north fringe stops at the store room's plinth on the east — grass cannot grow out of a
	// plinth, and `tools/tuftfoot.js` says so — and the gap it leaves is the plinth's own width.
	fringe({ name: 179, x0: -9.6, z0: -12.5, x1: 3.9, z1: -12.5, nx: 0, nz: -1, every: 0.65, reach: 1.5, size: 0.38, y: 0.05, skip: 0.08 });
	fringe({ name: 185, x0: 7.3, z0: -12.5, x1: 9.6, z1: -12.5, nx: 0, nz: -1, every: 0.65, reach: 1.5, size: 0.38, y: 0.05, skip: 0.08 });
	fringe({ name: 181, x0: -2.2, z0: 23.3, x1: -19.5, z1: 23.3, nx: 0, nz: 1, every: 0.7, reach: 2.0, size: 0.4, y: 0.04, skip: 0.08 });
	fringe({ name: 191, x0: 19.5, z0: 23.3, x1: 2.2, z1: 23.3, nx: 0, nz: 1, every: 0.7, reach: 2.0, size: 0.4, y: 0.04, skip: 0.08 });

	// ---- a little grass against the stone, not only along it ----
	// The fringe alone is a line, however untidy: this is the same grass a metre or three out into the
	// lawn, so the garden thickens as it comes off the paving instead of ending at it. Every rectangle
	// here is ground with nothing built on it — `tools/tuftfoot.js` checks that, because a rectangle
	// drawn on a plan is not the same as ground: the first version of this plan scattered grass over
	// the far paving and over the south ends of the two decks, and the tool named 82 clumps of grass
	// growing out of cut stone.
	scatter({ name: 193, x0: -18.8, x1: -15.2, z0: -1.6, z1: 15.4, count: 40 });
	scatter({ name: 197, x0: 15.2, x1: 18.8, z0: -1.6, z1: 15.4, count: 40 });
	// The two strips given back to the lawn when the court's outer edges came in (see src/court.js):
	// three metres of fresh grass down each side of the water, between the new stone edge and the palms
	// and shrubs that already stood out there. Grass scattered through it keeps it a lawn and not a
	// painted carpet beside a clean-cut kerb.
	scatter({ name: 205, x0: -courtEdge - 3.1, x1: -courtEdge - 0.3, z0: -1.6, z1: 15.4, count: 34 });
	scatter({ name: 209, x0: courtEdge + 0.3, x1: courtEdge + 3.1, z0: -1.6, z1: 15.4, count: 34 });
	// The south lawn: between the far paving and the planting at the border, either side of the path.
	scatter({ name: 199, x0: -5.4, x1: -1.8, z0: 16.4, z1: 21.4, count: 22, size: 0.2 });
	scatter({ name: 211, x0: 1.8, x1: 5.4, z0: 16.4, z1: 21.4, count: 22, size: 0.2 });
	scatter({ name: 223, x0: -14.6, x1: -5.6, z0: 16.1, z1: 21.4, count: 26, size: 0.2 });
	scatter({ name: 227, x0: 5.6, x1: 14.6, z0: 16.1, z1: 21.4, count: 26, size: 0.2 });

	// ---- the pond's edge ----
	// Sedges and long grass right up to the water, in drifts, with the stones between them left bare:
	// this is what says "a pond in a lawn" instead of "a tank laid in a lawn". The near (south) side is
	// deliberately the thin one, because that is where a person stands and where three of the five frogs
	// sit — grass a visitor has to part to find the feature is grass in the way of the feature.
	fringe({ name: 231, x0: pondRect.x0, z0: pondRect.z0, x1: pondRect.x1, z1: pondRect.z0, nx: 0, nz: -1, every: 0.5, reach: 0.4, size: 0.5, skip: 0.22, ageFrom: 0.1, ageMore: 0.42 });
	fringe({ name: 233, x0: pondRect.x1, z0: pondRect.z0, x1: pondRect.x1, z1: pondRect.z1, nx: 1, nz: 0, every: 0.5, reach: 0.4, size: 0.5, skip: 0.3, ageFrom: 0.1, ageMore: 0.42 });
	fringe({ name: 237, x0: pondRect.x1, z0: pondRect.z1, x1: pondRect.x0, z1: pondRect.z1, nx: 0, nz: 1, every: 0.55, reach: 0.4, size: 0.44, skip: 0.55, ageFrom: 0.1, ageMore: 0.42 });
	fringe({ name: 239, x0: pondRect.x0, z0: pondRect.z1, x1: pondRect.x0, z1: pondRect.z0, nx: -1, nz: 0, every: 0.5, reach: 0.4, size: 0.5, skip: 0.28, ageFrom: 0.1, ageMore: 0.42 });

	// The court's borders: the dirt that was cut out of the paving for the planting (see `courtBeds`
	// in src/court.js). Grass at the seam where the dirt meets its cut stone edge, and a scattering through
	// the planting. Both edges of a bed face inwards, whichever side of the pool it is on, which is why
	// the offsets below are +x on one edge and -x on the other. The borders stand 0.6 m off the coping,
	// so this is not grass at the water's lip — the rule that keeps the pool's own edge bare holds.
	for (const [i, b] of courtBeds.entries()) {
		fringe({ name: 301 + i, x0: b.x0, z0: b.z0, x1: b.x0, z1: b.z1, nx: 1, nz: 0, every: 0.9, reach: 0.26, size: 0.32, y: bedTop, skip: 0.22 });
		fringe({ name: 311 + i, x0: b.x1, z0: b.z1, x1: b.x1, z1: b.z0, nx: -1, nz: 0, every: 0.9, reach: 0.26, size: 0.32, y: bedTop, skip: 0.22 });
		scatter({
			name: 321 + i,
			x0: b.x0 + 0.2,
			x1: b.x1 - 0.2,
			z0: b.z0 + 0.2,
			z1: b.z1 - 0.2,
			count: Math.round((b.x1 - b.x0) * (b.z1 - b.z0)),
			size: 0.26,
			y: bedTop,
		});
	}

	// Around the feet of things. A palm trunk or a boulder sitting straight on close grass has no
	// base to it at all; three clumps round the foot is what a trunk actually grows out of.
	for (const f of feet) {
		const rand = randomGenerator(f.seed);
		for (let i = 0; i < 3; i++) {
			const at = rand() * Math.PI * 2;
			const off = 0.3 + rand() * 0.4;
			const fx = f.x + Math.sin(at) * off;
			const fz = f.z + Math.cos(at) * off;
			spots.push({
				x: fx,
				z: fz,
				y: f.y || 0,
				size: 0.3 + rand() * 0.26,
				ry: rand() * Math.PI,
				// Grass at the foot of a trunk is never mown and never young.
				age: 0.4 + rand() * 0.6,
				tint: tint(fx, fz, rand),
				seed: f.seed * 5 + i,
			});
		}
	}

	// Nothing above is taken on trust. A plan is numbers on a page and the paving is in the way more often
	// than a rectangle drawn beside it suggests — the first version of this plan grew 82 clumps out of the
	// far paving and the decks — so the Villa's own ground is asked, floor by floor, whether each foot is
	// in soil, and a clump that lands on cut stone is dropped instead of built. The beds at the foot of the
	// wall stand 5 cm proud of the lawn and pass; the pool paving at 14 and the terrace at 54 do not.
	// `tools/tuftfoot.js` asks the same question from outside, for when this filter is broken.
	const soil = makeGround(scene);
	return spots.filter(
		(s) =>
			soil.heightAt(s.x, s.z) <= 0.05 &&
			!inPond(s.x, s.z) &&
			!inPondStone(s.x, s.z) &&
			// And nothing is planted IN the watercourse or on its stones. The margin is 6 cm from the water's own
			// edge at that place along the course, which is the pond's answer to the same question: the sedges at a
			// real edge grow up to the water and a little into it, and a bald ring both sides of a stream is a
			// swept garden and not a wet one (`src/stream.js`, `inStream`).
			!inStream(s.x, s.z, 0.06) &&
			!inStreamStone(s.x, s.z),
	);
}

/** A garden lamp: a short post with a warm bulb, thrown into the dusk. `y` is the ground it stands on. */
function makeLamp(scene, mats, { x, z, height = 1.05, y = 0 }) {
	const parts = [];
	parts.push(
		cylinder(scene, "lampPost", {
			diameter: 0.09,
			height,
			tessellation: 8,
			px: x,
			py: y + height / 2,
			pz: z,
			mat: mats.darkMetal,
		}),
	);
	parts.push(
		sphere(scene, "lampBulb", {
			diameter: 0.22,
			segments: 8,
			px: x,
			py: y + height + 0.06,
			pz: z,
			mat: mats.lampGlow,
		}),
	);
	parts.push(
		sphere(scene, "lampShade", {
			diameterX: 0.44,
			diameterY: 0.2,
			diameterZ: 0.44,
			segments: 8,
			px: x,
			py: y + height + 0.16,
			pz: z,
			mat: mats.brass,
		}),
	);
	return parts;
}

/** A string of bulbs slung between two points, sagging in the middle. */
function makeStringLights(scene, mats, a, b, bulbs = 9, sag = 0.7) {
	const parts = [];
	const points = [];
	const steps = 22;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const p = Vector3.Lerp(a, b, t);
		p.y -= Math.sin(Math.PI * t) * sag;
		points.push(p);
	}
	// the wire itself is a drawn line: one pixel thick is exactly what a wire is
	const wire = BABYLON.MeshBuilder.CreateLines("wire", { points, color: new Color3(0.09, 0.08, 0.07) }, scene);
	wire.isPickable = false;
	parts.push(wire);
	for (let i = 1; i < bulbs; i++) {
		const t = i / bulbs;
		const p = Vector3.Lerp(a, b, t);
		// The bulb hangs below the wire, by about its own radius. It used to be set 0.1 m *above* it,
		// which straddled the wire through the middle of every bulb.
		p.y -= Math.sin(Math.PI * t) * sag + 0.07;
		parts.push(
			sphere(scene, "bulb", {
				diameter: 0.12,
				segments: 6,
				px: p.x,
				py: p.y,
				pz: p.z,
				mat: mats.lampGlow,
			}),
		);
	}
	return parts;
}

export function buildGarden(scene, mats, shadows, { clip = SHRUB_CLIP } = {}) {	const built = [];
	const add = (...meshes) => {
		for (const mesh of meshes) {
			if (!mesh) continue;
			built.push(mesh);
			shadows.addShadowCaster(mesh);
		}
	};

	// Palms, placed so they frame the pool without hiding the house.
	const palms = [
		// Every palm is rooted in soil and not in the court's stone, which spreads from x = -11.9 to -5.4
		// and from 5.4 to 11.9 the whole way from the terrace to z = 15.8 (see src/court.js). Five of these
		// once stood in the middle of it — a trunk coming up between the sunbeds, which is not a thing a
		// garden does — and they were moved out to the lawn that frames the stone. `tools/planted.js` names
		// any plant whose foot finds paving under it, and it names none.
		{ x: -17.4, z: 9.6, height: 7.6, lean: 0.7, twist: 0.4, seed: 3, scale: 1.1 },
		{ x: -17.0, z: 0.6, height: 6.2, lean: 0.5, twist: 2.1, seed: 5, scale: 0.95 },
		{ x: 17.2, z: 11.4, height: 8.2, lean: 0.8, twist: 1.2, seed: 8, scale: 1.15 },
		{ x: 13.4, z: -2.5, height: 6.6, lean: 0.6, twist: 3.4, seed: 12, scale: 1 },
		{ x: -9.5, z: -6.5, height: 7, lean: 0.55, twist: 5.1, seed: 15, scale: 1.05 },
		{ x: 7.6, z: 21.4, height: 5.8, lean: 0.65, twist: 0.9, seed: 19, scale: 0.9 },
		{ x: -2.8, z: 15.2, height: 6.4, lean: 0.45, twist: 2.6, seed: 23, scale: 1 },
		{ x: 15.5, z: 5.5, height: 7.2, lean: 0.7, twist: 4.2, seed: 27, scale: 1.05 },
	];
	for (const spec of palms) add(...makePalm(scene, mats, spec));

	// Shrubs along the walls and the hedge — and, as with the palms, in soil and not on the stone: eight
	// of these stood on the pool court and two were growing up through the teak terrace, their tops
	// poking above the boards a visitor walks on.
	const shrubSpots = [
		[-16.2, 1.4, 1.1], [-16.6, 4.8, 0.9], [-16.0, 7.8, 1.2], [16.6, 2.4, 1],
		[16.4, 6.6, 1.2], [-7.4, 17.6, 1], [7.2, 17.8, 1.1], [-16.8, 12.8, 1.3],
		[10.4, -4.4, 1.1], [-11.2, -9.6, 1.2], [9.6, -3.4, 0.75], [-9.6, -3.4, 0.8],
	];
	shrubSpots.forEach((s, i) => add(...makeShrub(scene, mats, { x: s[0], z: s[1], size: s[2], seed: 40 + i, clip })));

	// Banana plants behind the sala and beside the drive.
	// The bananas by the pool stood on the stone too, like the palms and the shrubs (see above).
	add(...makeBanana(scene, mats, { x: -19.0, z: 6.6, seed: 61 }));
	add(...makeBanana(scene, mats, { x: -20.4, z: 8.2, seed: 62, scale: 0.9 }));
	add(...makeBanana(scene, mats, { x: 14.6, z: -6.2, seed: 63, scale: 1.1 }));
	add(...makeBanana(scene, mats, { x: 16.6, z: 14.8, seed: 64 }));

	// The beds at the foot of the house. Three bands of bare laterite, one along each face of the
	// plinth that looks onto lawn — west, east and back — so the building meets the ground in three
	// edges instead of one, and the shrubs along the back wall stand in earth instead of growing out
	// of a carpet. The two faces that look onto paving have none: dirt does not lie on a paved court.
	// They are laid walking each wall with the ground outside on the right hand.
	const beds = [
		{ name: "earthBedWest", x0: -8.3, z0: -2.2, x1: -8.3, z1: -12.5, width: 1.15, seed: 5 },
		{ name: "earthBedEast", x0: 8.3, z0: -12.5, x1: 8.3, z1: -2.2, width: 1.15, seed: 9 },
		{ name: "earthBedNorth", x0: -9.6, z0: -12.5, x1: 9.6, z1: -12.5, width: 1.9, seed: 13 },
	];
	for (const spec of beds) {
		const bed = makeEarthBed(scene, mats, spec);
		built.push(bed);
	}

	// The same trick at the south border, where the shrubs along the hedge stand in bare lawn. Turn
	// round from the pool and this is the middle distance of the picture: grass up to a hedge, and
	// shrubs coming up out of it with no ground under them that is any different from the lawn they are
	// planted in. Two bands of laterite, stopped short of the path so the paved walk still runs out
	// through the planting and does not dead-end in dirt. Both are walked westward, because that is the
	// way that puts the outside on the right hand — see `makeEarthBed`.
	const borderBeds = [
		{ name: "earthBedSouthWest", x0: -2.2, z0: 23.3, x1: -19.5, z1: 23.3, width: 2.4, seed: 17 },
		{ name: "earthBedSouthEast", x0: 19.5, z0: 23.3, x1: 2.2, z1: 23.3, width: 2.4, seed: 21 },
	];
	for (const spec of borderBeds) {
		const bed = makeEarthBed(scene, mats, spec);
		built.push(bed);
	}

	// The north border. The back of the house is looked at from this lawn, so the foot of the wall is
	// planted: shrubs along it, bananas at the corners, a palm off each end. Bare lawn against bare
	// plaster was the plainest thing in the Villa.
	// The six are given their own height AND their own clipping. They used to be one size family at six seeds,
	// and the two that flank the back door came out as identical cauliflower balls three metres apart, which is
	// no gardener’s work: a real bed has plants cut to different levels — one sheared flat at knee height, one
	// left free to go up where it likes — and the difference in the silhouette is what makes a row of plants look
	// like a plan rather than a queue. `clip: 1` leaves the dome alone (see `makeLeafyMass`).
	const northBorder = [
		[-6.6, -14.4, 1.35, 1], [-4.2, -14.9, 0.85, 0.62], [-1.4, -14.3, 1.15, 0.86],
		[2.2, -14.7, 1.4, 1], [5.6, -14.2, 0.8, 0.6], [8.4, -14.6, 1.2, 0.9],
	];
	northBorder.forEach((s, i) => add(...makeShrub(scene, mats, { x: s[0], z: s[1], size: s[2], seed: 140 + i, clip: s[3] })));
	// The west and east beds. Both were laid as bands of bare laterite against the plinth — three faces of
	// the house given a band of dirt, and only the back one was planted. A bed with nothing in it is a trench
	// dug round the house, and the browser said exactly that: ten metres of red earth, a few grass sprouts at
	// its outer edge, and bare plaster over the top of it (pictures/s88-westbed-c.png). So: shrubs, five to
	// a side, each with its own size and its own clipping like the back of the house (see `northBorder`), and
	// set 0.6 m off the plaster so the biggest of them brushes the wall and does not lean on it. The bed is
	// 0.07 m of soil on the ground, so they stand at that height and not on the lawn's own level.
	const sideBorder = [
		// the west face, south to north
		{ x: -8.9, z: -3.1, size: 0.85, clip: 0.66, seed: 301 },
		{ x: -8.95, z: -5.2, size: 1.15, clip: 1, seed: 302 },
		{ x: -8.85, z: -7.3, size: 0.7, clip: 0.6, seed: 303 },
		{ x: -8.95, z: -9.3, size: 1.05, clip: 0.86, seed: 304 },
		{ x: -8.9, z: -11.5, size: 0.8, clip: 0.7, seed: 305 },
		// the east face, south to north, no one of them matching its fellow across the house
		{ x: 8.9, z: -2.8, size: 1.0, clip: 0.9, seed: 311 },
		{ x: 8.95, z: -4.9, size: 0.72, clip: 0.6, seed: 312 },
		{ x: 8.9, z: -6.9, size: 1.2, clip: 1, seed: 313 },
		{ x: 8.95, z: -9.0, size: 0.8, clip: 0.72, seed: 314 },
		{ x: 8.9, z: -11.2, size: 1.1, clip: 0.95, seed: 315 },
	];
	for (const s of sideBorder) {
		add(...makeShrub(scene, mats, { x: s.x, z: s.z, size: s.size, seed: s.seed, y: 0.05, clip: s.clip }));
	}

	add(...makeBanana(scene, mats, { x: -9.6, z: -14.2, seed: 71 }));
	add(...makeBanana(scene, mats, { x: 10.8, z: -13.4, seed: 74, scale: 1.05 }));
	add(...makePalm(scene, mats, { x: -13.4, z: -16.2, height: 7.2, lean: 0.6, twist: 1.1, seed: 41, scale: 1.05 }));
	add(...makePalm(scene, mats, { x: 13.8, z: -17, height: 6.4, lean: 0.5, twist: 2.7, seed: 44 }));

	// The south border. Turn around from the pool and this is what you are looking at, so it is
	// planted: shrubs along the foot of the hedge, palms and bananas behind them, and a path
	// running in through the middle.
	// The same treatment as the back of the house (see `northBorder`): size and clipping given per plant, so
	// the row along the hedge is a plan and not eight of the same bush. This is the middle distance of the
	// picture when a visitor turns round from the pool, and eight same-sized balls read as a queue.
	const southBorder = [
		[-16.6, 24.6, 1.35, 0.95], [-12.8, 24.2, 0.9, 0.6], [-9, 24.7, 1.4, 1], [-5.4, 23.6, 0.95, 0.72],
		[5.4, 23.6, 1.2, 0.85], [9, 24.6, 0.85, 0.6], [12.8, 24.2, 1.3, 1], [16.4, 24.4, 1.05, 0.75],
	];
	southBorder.forEach((s, i) => add(...makeShrub(scene, mats, { x: s[0], z: s[1], size: s[2], seed: 120 + i, clip: s[3] })));
	add(...makePalm(scene, mats, { x: -11, z: 21.4, height: 7.4, lean: 0.6, twist: 1.7, seed: 31, scale: 1.05 }));
	add(...makePalm(scene, mats, { x: 11.2, z: 22, height: 6.8, lean: 0.7, twist: 4.6, seed: 34, scale: 1 }));
	add(...makePalm(scene, mats, { x: 24.6, z: 19.4, height: 6, lean: 0.5, twist: 2.9, seed: 37, scale: 0.95 }));
	add(...makeBanana(scene, mats, { x: -5.6, z: 20.8, seed: 66 }));
	add(...makeBanana(scene, mats, { x: 5.6, z: 21.2, seed: 67, scale: 1.05 }));

	// The court's two borders — the dirt the court was cut for (see `courtBeds` in src/court.js). Dirt
	// with nothing growing in it is a trench, so: shrubs along each of them, a banana at the end of
	// each, and grass at the seam where the dirt meets its cut stone edge and through the planting.
	// The borders stand 0.6 m off the coping, so nothing in them hangs over the water where a swimmer
	// would brush it; the rule that keeps the pool's own lip bare still holds.
	const courtPlanting = [
		[-6.8, 2.1, 0.8], [-7.1, 3.6, 1.1], [-6.75, 5.2, 0.8], [-7.0, 6.6, 1.0], // west border
		[6.75, 2.7, 0.85], [7.05, 3.8, 1.0], // east border, north of the sala's steps
		[6.7, 6.9, 0.7], [6.9, 8.5, 0.9], // east border, south of them
	];
	courtPlanting.forEach((s, i) => add(...makeShrub(scene, mats, { x: s[0], z: s[1], size: s[2], seed: 200 + i, y: bedTop, clip })));
	add(...makeBanana(scene, mats, { x: -6.95, z: 8.1, seed: 77, scale: 0.95, y: bedTop }));
	add(...makeBanana(scene, mats, { x: 7.0, z: 7.6, seed: 78, scale: 0.8, y: bedTop }));

	// Pots at the head of the court: a pair flanking the walkway that comes down from the terrace steps,
	// and one at the sala's south-west corner. They stand on the paving, which is 0.14 up, so they are
	// given that much ground under them; before that they sat 14 cm sunk in the stone. They used to all
	// three crowd the court's north-east corner, where the borders now are; the stone landing at the
	// foot of the sala's steps is kept clear, because a pot standing on it walls the sala in — which is
	// exactly what the first version of this plan did, and `feet.js` said the sala could not be reached.
	const potSpots = [
		// A different plant and a different pot in each of them, which is what a terrace looks like when the
		// pots were bought as they were needed and planted with what the kitchen and the altar wanted.
		// They stand a metre nearer the pool than they did, and clear of the great pots' line: from the start
		// place at the water's edge the two pairs were dead in line, and a small jar behind a big one at ten
		// metres is not two pots but one pot wearing a bucket (`pictures/tmp-bare-pot-c.png`).
		{ x: -5.1, z: 0.35, size: 1.05, seed: 71, shape: "urn", kind: "lemongrass" },
		{ x: 5.1, z: 0.35, size: 1.0, seed: 72, shape: "basin", kind: "basil" },
		{ x: 9.0, z: 8.6, size: 0.9, seed: 73, shape: "jar", kind: "marigold" },
	];
	for (const p of potSpots) {
		add(...makePottedPlant(scene, mats, { x: p.x, z: p.z, size: p.size, seed: p.seed, y: 0.14, clip, shape: p.shape, kind: p.kind }));
		blocker(scene, `potBlock${p.seed}`, { x: 0.95 * p.size, y: 0.9, z: 0.95 * p.size, px: p.x, pz: p.z, py: 0.14 });
	}

	// Lamps along the paving edge, on the path out, and one at the head of each of the court's two
	// borders. The outer pair stands 0.8 m inside the court's new edge (see src/court.js): it used to
	// be at ±13.2, which was the stone then and is lawn now, and a lamp post sunk in grass with its
	// bulb at a person's chest is a trip and not a lamp. The pair that used to stand at (±6.4, −0.6) was standing on the teak terrace: the
	// terrace's face is at z = 0.7 and its boards came over them, so both posts came up through the
	// deck a visitor walks on. They are in the dirt at the north end of each border now, which is where
	// a garden lamp belongs and where the string of bulbs already reaches.
	const lampSpots = [
		[-8.4, 12.6, 0.14], [8.4, 12.6, 0.14], [-11.1, 5.4, 0.14], [11.1, 3.4, 0.14],
		[-2.7, 22.4, 0.12], [2.7, 22.4, 0.12], // the path out is 0.12 up, not 0.14
		[-6.9, 1.6, bedTop], [6.9, 1.6, bedTop], // the head of each border
	];
	lampSpots.forEach(([x, z, y], i) => {
		add(...makeLamp(scene, mats, { x, z, y }));
		blocker(scene, `lampBlock${i}`, { x: 0.5, y: 1.2, z: 0.5, px: x, pz: z });
	});

	// Strings of bulbs along the front of the terrace and away to the sala.
	//
	// Every end of every wire is nailed to something. They used to start at (±6.6, 3.5, 0.5) and run
	// out over the deck and the lawn, which was written when the terrace posts stood out on the deck
	// at z = 0.45; the posts have since gone back to live under the eave at z = -2.05, and the wires
	// were left hanging from nothing — three strings of bulbs suspended in thin air, 2.6 m in front of
	// the nearest timber. So: three runs along the four posts, slung just under the roof edge, and one
	// from the east post down to the near post of the sala. The third old string, the one that ran west
	// over the lawn, had nothing to run to and is gone.
	const post = (px) => new Vector3(px, 3.9, -1.85); // the four terrace posts: 4.3 m tall, faces at z -2.2..-1.9
	add(
		...makeStringLights(scene, mats, post(-6.85), post(-2.2), 7, 0.34),
		...makeStringLights(scene, mats, post(-2.2), post(2.2), 7, 0.34),
		...makeStringLights(scene, mats, post(2.2), post(6.85), 7, 0.34),
		...makeStringLights(scene, mats, post(6.85), new Vector3(8.8, 3.0, 3.6), 8, 0.5), // to the sala's near post, whose top is 3.16
	);

	// A few boulders in the lawn, so the ground is not bare everywhere. West of the watercourse now, at x -24.5
	// to -28: these were sown at x -19 to -22.5, which is exactly where the stream now runs, and
	// `tools/streamroute.js` named all six of them standing in the channel. They were first moved off the pool
	// court, at x -16 and -12, where half of them sat on the paving — a lump of stone laid on cut stone, sunk
	// in nothing, and something to trip over on a walkway. `tools/planted.js` counts them with the plants for
	// the same reason.
	const rand = randomGenerator(88);
	const rockFeet = [];
	for (let i = 0; i < 6; i++) {
		// Chunky and not pancake-flat. The first heap drew width up to 1.6 m against a height of 0.4, which is
		// a four-to-one flat: seen from a visitor's eye it is a mound whatever you do to it, and no amount of
		// tipping or breaking makes a flat thing look broken. A boulder that came out of a quarry is roughly
		// two-thirds as tall as it is wide, and the sizes now vary threefold instead of by a head.
		const width = 0.55 + rand() * rand() * 1.1;
		const height = width * (0.5 + rand() * 0.35);
		const depth = width * (0.7 + rand() * 0.4);
		const rx = -24.5 - rand() * 3.5;
		const rz = -6 + rand() * 10;
		const rock = sphere(scene, `rock${i}`, {
			diameterX: width,
			diameterY: height,
			diameterZ: depth,
			// Seven cuts, not five: the pole of a sphere is a fan of long thin triangles, and
			// flat-shaded, each wedge of the fan takes its own tone of light — which is the sawn-log rings
			// again, this time on the lumps that were never struck. More, narrower wedges and the fan stops
			// reading as a pattern.
			segments: 7,
			// Sunk to the girth: the giveaway of a stone laid on the ground rather than set into it is the whole
			// belly showing, so the middle of the lump is below the lawn and the tufts at its feet close what is
			// left of the seam.
			px: rx,
			py: 0.02,
			pz: rz,
			mat: mats.lawnStone,
		});
		// Broken and not laid. These were plain ellipsoids, which came out as six eggs on the grass — and a
		// dome is a rolled thing, so a stippled smooth dome is breakfast and not stone. Worked, tinted by
		// its own relief, struck along one leaning plane, and given flat faces to catch the light on: see
		// `crumple`, `fracture` and `facet` in src/mesh.js, which the pond's rim went through first.
		rock.rotation.y = rand() * 3;
		// Tipped over as they were tipped out of the cart. A squat lump lying level is a cushion; tipped, it
		// has a profile that is not a dome and a face that catches the light differently from its neighbours.
		rock.rotation.x = (rand() - 0.5) * 1.1;
		rock.rotation.z = (rand() - 0.5) * 1.1;
		// Three big bites rather than four small ones: at four the lump is crumpled, at three it is broken.
		const worked = crumple(rock, { at: 0.4, seed: 9100 + i * 11, lobes: 3 });
		skinTint(rock, worked, { at: 0.3, low: 0.68 });
		// Struck along a leaning plane: the flat broken face is the strongest cue that a thing is stone and
		// not a mound, and it is what the pond's boulders got too. The first attempt at this left a wood
		// cookie in the grass, which was `fracture` folding the crown only part of the way and leaving a
		// cone; see the note on it in src/mesh.js.
		fracture(rock, { at: height * (0.2 + rand() * 0.2), lean: 0.1 + rand() * 0.22, seed: 9300 + i });
		facet(rock);
		rock.receiveShadows = true;
		add(rock);
		// A stone you walk through is the worst of all: block it, and square the block to cover the
		// stone turned as it is.
		const across = Math.max(width, depth);
		blocker(scene, `rockBlock${i}`, { x: across, y: 0.9, z: across, px: rx, pz: rz });
		rockFeet.push({ x: rx, z: rz, seed: 340 + i });
	}

	// Grass that stands up: the seam between the garden and everything built on it, the beds at the
	// foot of the house, and the feet of the palms and the boulders. One mesh, whatever the count, and
	// it throws no shadow: these are leaves a hand wide, and a shadow map full of them would cost more
	// than the whole of the villa's furniture and buy a darkening nobody can point at.
	const tuftFeet = palms.map((p, i) => ({ x: p.x, z: p.z, seed: 300 + i })).concat(rockFeet);
	built.push(makeTufts(scene, mats, makeTuftPlan(scene, tuftFeet)));

	return built;
}
