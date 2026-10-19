// Small mesh builders. Every dimension is in metres, y is up, and a mesh is placed by its centre.

import { randomGenerator, spacePatch } from "./noise.js";

const { Vector3, VertexData, VertexBuffer, Mesh, MeshBuilder, Color3 } = BABYLON;

/** A box. x/y/z are its size, px/py/pz where its centre goes. */
export function box(scene, name, { x = 1, y = 1, z = 1, px = 0, py = 0, pz = 0, mat = null, ry = 0, rx = 0, rz = 0, parent = null, uv = null, tile = null }) {
	const mesh = MeshBuilder.CreateBox(name, { width: x, height: y, depth: z, faceUV: uv || undefined }, scene);
	mesh.position.set(px, py, pz);
	if (ry) mesh.rotation.y = ry;
	if (rx) mesh.rotation.x = rx;
	if (rz) mesh.rotation.z = rz;
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	if (!uv) metricUVs(mesh, tile || patternMetres(mat), patternUp(mat));
	return mesh;
}

/**
 * How big one repeat of a material's pattern is in the world, in metres of the surface it lies on.
 *
 * A pattern is painted on a square canvas and knows nothing about the thing it is laid on, and a
 * box's face runs its texture coordinates from one edge of the face to the other: so a 14.7 m wall
 * and a 0.3 m post each got exactly one repeat of their pattern, and the wall's plaster was fifty
 * times too big to see at all. A material that is given `patternMetres` in `materials.js` answers
 * that — every box, sheet and cylinder built wearing it has its pattern measured in metres instead
 * of in fractions of itself. `0` or none means: keep the old way, one repeat to a face.
 */
export function patternMetres(mat) {
	return mat && typeof mat.patternMetres === "number" && mat.patternMetres > 0 ? mat.patternMetres : 0;
}

/**
 * Whether a material's pattern has a top and a bottom to it. `false` (the default) leaves a box's faces
 * as the library lays them, which takes the two remaining axes in the order x, y, z: a north or south
 * face therefore gets `v` up the face, and an east or west face gets `v` along the ground. Plaster and
 * stone do not care — their patterns are the same in every direction — but boards do: the teak wall
 * material laid that way ran its boards horizontally across the front of the house and vertically up
 * its return, and made every square post read as a stack of plates (`pictures/tmp-post.png`).
 *
 * A material that says `patternUp = true` in `materials.js` gets the upright treatment: on every
 * vertical face `v` is the height and `u` is the horizontal, so one painted pattern runs the same way
 * up on all four faces of a post and of a wall.
 */
export function patternUp(mat) {
	return !!(mat && mat.patternUp);
}

/**
 * Rewrites a box's or a flat sheet's texture coordinates so the pattern lies at a fixed size in
 * metres of surface, running continuously from one piece of a wall to the next.
 *
 * Each face's own two directions are taken from the mesh, so a box that leans or turns is still
 * measured along its own faces; where it lands on the ground only shifts the pattern, and a shift of
 * a painted noise is nothing the eye can see. Anything that is not four corners to a flat face —
 * a sphere, a hip roof, a ground the builder cornered up — is left alone and keeps whatever its
 * builder gave it (`groundUVs` lays the lawn, the deck and the two teak floors in metres already).
 */
export function metricUVs(mesh, tileMetres, up = false) {
	if (!tileMetres) return mesh;
	const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	// Four corners to a face, three numbers to a corner; anything else is not a box or a sheet.
	if (!pos || pos.length < 12 || pos.length % 12 !== 0) return mesh;
	if (mesh.parent) mesh.parent.computeWorldMatrix(true);
	const world = mesh.computeWorldMatrix(true);
	const count = pos.length / 3;
	const uvs = new Array(count * 2);
	const tu = Array.isArray(tileMetres) ? tileMetres[0] : tileMetres;
	const tv = Array.isArray(tileMetres) ? tileMetres[1] : tileMetres;
	const axis = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
	for (let start = 0; start < count; start += 4) {
		const local = [];
		for (let k = 0; k < 4; k++) local.push(new Vector3(pos[(start + k) * 3], pos[(start + k) * 3 + 1], pos[(start + k) * 3 + 2]));
		// The axis the four corners all agree on is the way the face looks; the other two are its own.
		let looking = -1;
		for (let a = 0; a < 3; a++) {
			const key = local[0].asArray()[a];
			if (local.every((p) => Math.abs(p.asArray()[a] - key) < 1e-6)) {
				looking = a;
				break;
			}
		}
		if (looking < 0) return mesh; // not four corners to a flat face after all: leave it be
		const along = [0, 1, 2]
			.filter((a) => a !== looking)
			.map((a) => Vector3.TransformNormal(axis[a], world));
		// Asked to stand the pattern up, and this is a wall and not a floor: put the height on `v`.
		if (up && looking !== 1 && along[1].y === 0) along.reverse();
		for (let k = 0; k < 4; k++) {
			const at = Vector3.TransformCoordinates(local[k], world);
			uvs[(start + k) * 2] = Vector3.Dot(at, along[0]) / tu;
			uvs[(start + k) * 2 + 1] = Vector3.Dot(at, along[1]) / tv;
		}
	}
	mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
	return mesh;
}

/**
 * The same, for a cylinder: `u` goes once round the barrel and `v` once up it, so a pattern laid in
 * metres wants the barrel's girth and the height in metres instead.
 */
export function metricCylinderUVs(mesh, tileMetres, { diameter = 1, diameterTop = null, height = 1 }) {
	if (!tileMetres) return mesh;
	const girth = Math.PI * ((diameter + (diameterTop === null ? diameter : diameterTop)) / 2);
	return scaleUVs(mesh, girth / tileMetres, height / tileMetres);
}

/** A cylinder or cone. */
export function cylinder(scene, name, { diameter = 1, diameterTop = null, height = 1, tessellation = 16, px = 0, py = 0, pz = 0, mat = null, ry = 0, rx = 0, rz = 0, parent = null, cap = true, tile = null }) {
	const mesh = MeshBuilder.CreateCylinder(name, { diameter, diameterTop, height, tessellation, cap: cap ? undefined : Mesh.NO_CAP }, scene);
	mesh.position.set(px, py, pz);
	if (ry) mesh.rotation.y = ry;
	if (rx) mesh.rotation.x = rx;
	if (rz) mesh.rotation.z = rz;
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	metricCylinderUVs(mesh, tile || patternMetres(mat), { diameter, diameterTop, height });
	return mesh;
}

/**
 * An invisible box whose only job is to stop a walk: nothing to see, something to bump into.
 * Use this instead of giving a thing's own meshes collisions, because a merged or part-built mesh
 * brings the whole of its bounding box — a palm trunk merged with its crown would bar a circle of
 * lawn five metres across. Make it taller than 0.75 m and a person walks around it; shorter and
 * they step up onto it.
 */
export function blocker(scene, name, { x = 1, y = 0.9, z = 1, px = 0, py = 0, pz = 0, parent = null }) {
	const mesh = box(scene, name, { x, y, z, px, py: py + y / 2, pz, parent });
	mesh.isVisible = false;
	mesh.isPickable = false;
	mesh.checkCollisions = true;
	mesh.receiveShadows = false;
	return mesh;
}

/** A flat plane lying flat on the ground (rotated -90 degrees on x). */
/**
 * A flat sheet of ground, facing up.
 *
 * This used to be built `sideOrientation: Mesh.BACKSIDE`, and that wound every one of the four lawn
 * strips so their front faces pointed at the middle of the earth: a renderer draws only the front
 * face of a triangle, so the whole garden was invisible in a browser — see through, with no pattern
 * on it, which is exactly what the owner reported. `tools/draw.js` did not see it for nine sessions
 * because it drew both faces of everything; it now throws away the faces that point away, and says
 * which meshes are left with nothing to show. `FRONTSIDE` with `rotation.x = +PI/2` is the way the
 * engine lays a ground plane itself, and the probe is a ray straight down: `feet.js`/`draw.js` now
 * report it.
 */
export function groundPlane(scene, name, { width = 1, height = 1, px = 0, py = 0, pz = 0, mat = null, parent = null, spacing = 0 }) {
	let mesh;
	if (spacing > 0) {
		// The same flat sheet, but cornered up into squares of `spacing` metres so that something can be
		// carried at every corner of it — a tone, a bend of the pattern — instead of only at its four.
		// `CreateGround` lays a plane facing up by itself, which is the facing this whole file learned the
		// hard way: a ground the renderer cannot see from above is a garden that is not there.
		mesh = MeshBuilder.CreateGround(
			name,
			{
				width,
				height,
				subdivisionsX: Math.max(1, Math.round(width / spacing)),
				subdivisionsY: Math.max(1, Math.round(height / spacing)),
			},
			scene,
		);
		mesh.position.set(px, py, pz);
	} else {
		mesh = MeshBuilder.CreatePlane(name, { width, height, sideOrientation: Mesh.FRONTSIDE }, scene);
		mesh.rotation.x = Math.PI / 2;
		mesh.position.set(px, py, pz);
	}
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	return mesh;
}

/**
 * A slab of ground with thickness: its top is cornered up into squares of `spacing` metres, and it has
 * four sides down to its bottom. One mesh, placed by its centre, the way a box is.
 *
 * Why not a box. A box has four corners to a face, so anything carried at the corners of the top — the
 * paving's broad tones, `tintFromGround` below — could only vary at the four ends of a ninety-square-metre
 * deck. A box has no way to be subdivided either. The sides are kept because the deck's edge is seen from
 * the lawn, and they are wound to face out: a face wound the wrong way is thrown away by the renderer and
 * the edge of the deck becomes a hole you can look through into the world (see the note on `hipRoof`).
 * There is no bottom, because nothing in this Villa is ever seen from underneath.
 */
export function slab(scene, name, { x = 1, y = 1, z = 1, px = 0, py = 0, pz = 0, mat = null, parent = null, spacing = 2 }) {
	const nx = Math.max(1, Math.round(x / spacing));
	const nz = Math.max(1, Math.round(z / spacing));
	const xd = x / 2;
	const zd = z / 2;
	const yTop = y / 2;
	const yBot = -y / 2;
	const positions = [];
	const indices = [];
	const at = (i, j) => j * (nx + 1) + i;
	for (let j = 0; j <= nz; j++) {
		for (let i = 0; i <= nx; i++) {
			positions.push(-xd + (x * i) / nx, yTop, -zd + (z * j) / nz);
		}
	}
	// Wound so every top face points at the sky: the same rule `hipRoof` was checked against, that the
	// engine's normal runs cross(C - A, B - A) for a triangle A, B, C.
	for (let j = 0; j < nz; j++) {
		for (let i = 0; i < nx; i++) {
			indices.push(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i, j + 1));
		}
	}
	// One side at a time, each four corners wound the wrong way round if you are not careful, so the
	// corners are set out in the order the faces were checked in: north (-z), south (+z), east (+x),
	// west (-x), each starting at the +z end of its top edge and going down and along.
	const sides = [
		[-xd, yTop, -zd, -xd, yBot, -zd, xd, yBot, -zd, xd, yTop, -zd], // north, facing -z
		[xd, yTop, zd, xd, yBot, zd, -xd, yBot, zd, -xd, yTop, zd], // south, facing +z
		[xd, yTop, zd, xd, yTop, -zd, xd, yBot, -zd, xd, yBot, zd], // east, facing +x
		[-xd, yTop, zd, -xd, yBot, zd, -xd, yBot, -zd, -xd, yTop, -zd], // west, facing -x
	];
	for (const s of sides) {
		const base = positions.length / 3;
		for (let c = 0; c < 4; c++) positions.push(s[c * 3], s[c * 3 + 1], s[c * 3 + 2]);
		indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
	}
	const mesh = poly(scene, name, { positions, indices, mat, parent });
	mesh.position.set(px, py, pz);
	return mesh;
}

/**
 * An upright plane facing +z by default.
 *
 * Which way it looks, since a plane is only one skin: with `rx = +PI/2` the face points at the sky
 * and you see it from above (a floor); with `rx = -PI/2` it points at the ground and you see it from
 * below (a ceiling, a soffit). Get the sign wrong and a browser simply does not draw the thing.
 */
export function plane(scene, name, { width = 1, height = 1, px = 0, py = 0, pz = 0, mat = null, ry = 0, rx = 0, rz = 0, parent = null, bothSides = false, tile = null }) {
	const mesh = MeshBuilder.CreatePlane(name, { width, height, sideOrientation: bothSides ? Mesh.DOUBLESIDE : Mesh.FRONTSIDE }, scene);
	mesh.rotation.y = ry;
	if (rx) mesh.rotation.x = rx;
	if (rz) mesh.rotation.z = rz;
	mesh.position.set(px, py, pz);
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	metricUVs(mesh, tile || patternMetres(mat));
	return mesh;
}

/** A sphere. */
export function sphere(scene, name, { diameter = 1, diameterX = null, diameterY = null, diameterZ = null, segments = 12, px = 0, py = 0, pz = 0, mat = null, parent = null, ry = 0, tile = null } = {}) {
	const dx = diameterX === null ? diameter : diameterX;
	const dy = diameterY === null ? diameter : diameterY;
	const dz = diameterZ === null ? diameter : diameterZ;
	const mesh = MeshBuilder.CreateSphere(name, { diameter, diameterX, diameterY, diameterZ, segments }, scene);
	mesh.position.set(px, py, pz);
	mesh.rotation.y = ry;
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	// A crown's wrap: once round the barrel, once over the pole. Not exact — a sphere is not a barrel —
	// but a crown's pattern only has to come out leaf-sized, and this says how many metres of crown one
	// repeat of the canvas lands on instead of how many crowns one repeat covers. Without it the same
	// leaf canvas is one repeat on a 1 m shrub and one repeat on a 20 m treetop, and on the treetop its
	// leaves are half a metre across and read as nothing at all.
	const tileMetres = tile || patternMetres(mat);
	if (tileMetres) scaleUVs(mesh, (Math.PI * ((dx + dz) / 2)) / tileMetres, dy / tileMetres);
	return mesh;
}

/**
 * Push a ball's skin in and out along its own radius, so it is a lump and not a ball.
 *
 * A sphere shades as one clean gradient, bright where the sun reaches and dark at the foot, and it is
 * the gradient and not the outline that says *ball* — a leaf pattern painted over the top of it never
 * argues with it. So each vertex is moved along its own radius by two fields at once.
 *
 * The first is a set of soft lobes — `lobes` of them, four by default: for a vertex pointing at `d`
 * and a chosen axis `a`, the push is the second lobe of a spherical harmonic, `(3·(d·a)² − 1) / 2`,
 * which is smooth, is positive near that axis and negative in a belt round it, and is turned to a
 * random axis and given a random weight per lump. This is what breaks the round outline: it gives the
 * mass three or four shoulders and hollows the size of half the thing.
 *
 * The second, `leafy`, is a random field laid over the skin in metres — the same way the lawn's
 * patches are laid over the lawn — at two wavelengths, one for a cluster of leaves and one for a
 * leaf. `leafSize` is the wide one, in metres of skin. This is what breaks the outline at the scale a
 * bush is actually ragged at: without it a crumpled ball is a potato, and a potato is only ever so
 * many lumps. Amplitudes are fractions of the ball's own radius, so one pair of numbers serves a
 * shrub a metre across and a treetop twenty.
 *
 * The normals are then recomputed from the new positions, because the whole point is that the light
 * now falls on a crumpled skin. The answer is a list of how far each corner moved — `push` — which
 * `skinTint` below reads to light the thing from its own shape.
 *
 * Used on the shrubs and potted plants in the garden and on every crown of the jungle belt, which are
 * the same fault at two sizes: a smooth dome reads as a balloon however it is painted.
 */
export function crumple(mesh, { at = 0.1, seed = 1, lobes = 4, leafy = 0, leafSize = 0.45 } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	const indices = mesh.getIndices();
	if (!positions || !indices) return null;
	const rand = randomGenerator(seed);
	const axes = [];
	for (let i = 0; i < lobes; i++) {
		const c = rand() * 2 - 1;
		const a = rand() * Math.PI * 2;
		const s = Math.sqrt(Math.max(0, 1 - c * c));
		axes.push({ x: Math.cos(a) * s, y: c, z: Math.sin(a) * s, w: rand() * 2 - 1 });
	}
	const count = positions.length / 3;
	// How far the skin stands from the middle, in metres, so `leafSize` can be asked in metres of skin
	// and not in whatever size the ball happens to be built at.
	let meanRadius = 0;
	for (let i = 0; i < positions.length; i += 3) {
		meanRadius += Math.hypot(positions[i], positions[i + 1], positions[i + 2]);
	}
	meanRadius /= count;
	const push = new Float32Array(count);
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		const x = positions[i];
		const y = positions[i + 1];
		const z = positions[i + 2];
		const len = Math.hypot(x, y, z);
		if (len < 1e-6) continue;
		const dx = x / len;
		const dy = y / len;
		const dz = z / len;
		let f = 0;
		for (const a of axes) {
			const d = dx * a.x + dy * a.y + dz * a.z;
			f += a.w * (3 * d * d - 1) * 0.5;
		}
		// The leaf field is read where the skin actually is — a point in the air, not an angle — so it
		// can be sampled on a rounded thing without pinching at a pole.
		const g = leafy ? spacePatch(dx * meanRadius, dy * meanRadius, dz * meanRadius, { broad: leafSize, fine: leafSize * 0.4, seed: seed * 7 + 3 }) * 2 - 1 : 0;
		const move = at * f + leafy * g;
		push[v] = move;
		const scale = 1 + move;
		positions[i] = x * scale;
		positions[i + 1] = y * scale;
		positions[i + 2] = z * scale;
	}
	mesh.setVerticesData(VertexBuffer.PositionKind, positions, true);
	const normals = new Float32Array(positions.length);
	VertexData.ComputeNormals(positions, indices, normals);
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	return push;
}

/**
 * Cut the top off a lump of leaf at one height, the way a hedge is cut with a board.
 *
 * Every shrub in this garden was a dome: `crumple` pushes the skin in and out and leaves the outline an
 * arc, and a mass of leaf whose outline is one arc is a bun however well its leaves are painted (see
 * `makeLeafyMass` in `src/garden.js`). A privet that is clipped once a year is not a dome. It has a
 * plateau where the shears went across it, its flanks fall away from the edge of that plateau, and the
 * plateau itself is a crowd of cut shoots standing up into the sun.
 *
 * So: every corner of the lump that stands above the board is pulled down onto it, and the normals are
 * recomputed so the cut face is lit as the flat face it is now. The corners that were below the board
 * are not touched, so the flanks keep their crumple and the outline goes flat on the top and ragged
 * everywhere else — which is what a clipped plant's silhouette is.
 *
 * `at` is the height of the board in the world, in metres. `ragged` is how far the board itself wanders,
 * on a slow field laid over the ground in metres: a hedger lays his board by eye and it sags, and a crown
 * cut to a dead level looks sawn by machine. `span` is the wavelength of that sag and `seed` picks the
 * field — pass one seed to every lump of one plant and the whole plant is cut by one board, which is
 * what it was.
 *
 * Returns which corners were cut — 1 for a corner that came down onto the board, 0 for one that was left
 * alone — or null if nothing stood above the board. `skinTint` reads that list back: a cut corner is a
 * shoot's tip, and a tip is in the sun.
 */
export function shearTop(mesh, { at = 0, ragged = 0, span = 0.6, seed = 1 } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	const indices = mesh.getIndices();
	if (!positions || !indices) return null;
	const world = mesh.computeWorldMatrix(true);
	const back = world.clone().invert();
	const here = new Vector3();
	const count = positions.length / 3;
	const cut = new Uint8Array(count);
	let any = 0;
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		here.set(positions[i], positions[i + 1], positions[i + 2]);
		const p = Vector3.TransformCoordinates(here, world);
		const board = at + (ragged ? (spacePatch(p.x, 0, p.z, { broad: span, fine: span * 0.35, seed }) * 2 - 1) * ragged : 0);
		if (p.y <= board) continue;
		p.y = board;
		const local = Vector3.TransformCoordinates(p, back);
		positions[i] = local.x;
		positions[i + 1] = local.y;
		positions[i + 2] = local.z;
		cut[v] = 1;
		any++;
	}
	if (!any) return null;
	mesh.setVerticesData(VertexBuffer.PositionKind, positions, true);
	const normals = new Float32Array(positions.length);
	VertexData.ComputeNormals(positions, indices, normals);
	mesh.setVerticesData(VertexBuffer.NormalKind, normals, true);
	return cut;
}

/**
 * Light a crumpled skin from its own crumple, by writing a colour at every corner.
 *
 * A bush is a foot of leaves deep: the ones on the outside catch the sun and the ones in behind them
 * do not, and no lamp in the scene can say so because the scene has no notion of a leaf. The shape
 * knows, though. `crumple` hands over how far each corner was pushed, and this turns that into light:
 * a corner pushed out is a tip in the sun, a corner left behind is a hollow in the shade of its
 * neighbours, and the skirt of the mass is darker than its crown because the crown sees the sky and
 * the skirt sees the ground. The spread is normalised so the mean over the mesh stays where the
 * material's own colour put it — the shading moves light about inside one bush and cannot repaint it.
 *
 * The engine multiplies these colours into whatever pattern the mesh wears (see `tintFromGround`, the
 * same trick at the scale of a lawn), and `tools/draw.js` reads them back off the mesh.
 */
	// How much whiter or browner than its fellows this one lump is. Every stone in a barrow of rock
	// is a slightly different rock, and a row of stones that are all the same tone is a machine-laid kerb
	// whatever else you do to them.
export function skinTint(mesh, push, { at = 0.22, low = 0.26, tone = 1 } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	if (!positions || !push) return mesh;
	const count = positions.length / 3;
	// Heights are read in the world and not in the mesh's own coordinates: a lump that has been turned
	// over has no reason for its own y to be the way up, and the crown of a bush is the part that sees
	// the sky whichever way its sphere happens to be wound.
	const world = mesh.computeWorldMatrix(true);
	const up = new Float32Array(count);
	let lo = Infinity;
	let hi = -Infinity;
	let y0 = Infinity;
	let y1 = -Infinity;
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		if (push[v] < lo) lo = push[v];
		if (push[v] > hi) hi = push[v];
		const y = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), world).y;
		up[v] = y;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	const spread = hi - lo || 1;
	const rise = y1 - y0 || 1;
	const light = new Float32Array(count);
	let mean = 0;
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		const tip = (push[v] - lo) / spread; // 0 in a hollow, 1 at a tip
		const lifted = (up[v] - y0) / rise; // 0 at the skirt, 1 at the crown
		light[v] = (1 - at + 2 * at * tip) * (1 - low * (1 - lifted));
		mean += light[v];
	}
	mean /= count;
	const colours = new Array(count * 4);
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		const tip = (push[v] - lo) / spread;
		// `tone` goes here and not into `light` above: `light` is divided by its own mean two lines up,
		// so a tone put in there is divided straight back out again.
		const l = (light[v] / mean) * tone;
		// A tip is not only brighter: it is a young leaf, so a little more red in it; a hollow is an old
		// one in the dark, so a little more blue. Small, and enough to stop the mass being one green.
		colours[v * 4] = l * (1 + 0.06 * (tip - 0.5));
		colours[v * 4 + 1] = l;
		colours[v * 4 + 2] = l * (1 - 0.08 * (tip - 0.5));
		colours[v * 4 + 3] = 1;
	}
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/**
 * Knock the crown of a lump of stone onto one tilted plane, so it has a flat face it can catch the light on.
 *
 * `crumple` pushes a ball of stone outwards and nowhere else, which leaves a dome however hard it is worked,
 * and a dome is a rolled thing: a boulder that has been rolled is a river stone, and a boulder that was
 * quarried has a where-it-broke-still-looking-like-the-quarry face on it. So the crown is folded down onto a
 * plane that leans a little, and the vertices are folded rather than cut away so the skin stays one closed
 * surface — a sliced sphere would leave a hole and a hole in a stone is a cave you can see the sky through.
 * Ask for this before `facet`, which reads the positions it is handed to work out the lighting.
 */
export function fracture(mesh, { at = 0.05, lean = 0.25, seed = 1, rough = 0.03 } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	if (!positions) return mesh;
	const rand = randomGenerator(seed);
	const tiltX = lean * (0.6 + rand() * 0.8);
	const tiltZ = lean * (rand() * 0.9 - 0.2);
	const spread = rand() * Math.PI * 2; // which way the struck face looks
	// How far the struck face is allowed to be uneven, in metres of the lump's own size.
	let reach = 0;
	for (let v = 0; v < positions.length; v += 3) {
		reach = Math.max(reach, Math.hypot(positions[v], positions[v + 1], positions[v + 2]));
	}
	const bump = reach * rough;
	for (let v = 0; v < positions.length; v += 3) {
		const x = positions[v];
		const y = positions[v + 1];
		const z = positions[v + 2];
		const plane = at + x * tiltX * Math.cos(spread) + z * tiltZ * Math.sin(spread);
		// Folded all the way onto the plane and not most of the way. Leaving a tenth of the crown above it
		// — which is what this did first — leaves a shallow cone where the struck face should be, and the
		// triangles that used to meet at the pole of the sphere fan out across that cone like the rings of a
		// sawn log. Flat, and they are coplanar, and flat-shaded they are one face.
		if (y > plane) positions[v + 1] = plane + (rand() * 2 - 1) * bump;
	}
	mesh.setVerticesData(VertexBuffer.PositionKind, positions, true);
	return mesh;
}

/**
 * Give a mesh flat faces: every corner of every triangle is handed that triangle's own normal, so each face
 * is one even tone of light instead of a gradient into its neighbours.
 *
 * This is what makes broken stone read as broken stone. A lump crumpled out of a sphere comes out bulged but
 * still shaded the way a ball is, and at arm's length a smoothly shaded lump of rock is a loaf of bread
 * (pictures/s80-pond-standing-c.png showed the pond's corner boulders that way, and
 * pictures/s81-boulder-before-c.png shows them yet). Rock is not read from its outline: it is read from the
 * angles between its faces, and a face only exists on screen while its corners hold one light value.
 *
 * The triangles are pulled apart into independent faces to do it, because a sphere shares its corners
 * between neighbouring triangles and a shared corner cannot belong to two faces at once — the last face to
 * write it would win and half the facets would leak back into the gradient. The vertex count of the mesh
 * triples, which at a few dozen triangles a stone is nothing, and the mesh is handed back so this can be
 * chained onto `crumple`.
 */
/**
 * Darken a wall towards its foot, the way a lime-washed wall goes dirty.
 *
 * Rain comes off the eaves and runs down, the grass is watered against the wall, and a monsoon throws
 * the garden back at the house: every plastered wall in Thailand is a half-metre darker at its bottom
 * than it is at its shoulder, and half a metre above that the line goes uneven because nothing that
 * happens to a wall happens in a straight line.
 *
 * This is written as a vertex colour rather than as a texture because the plaster's own pattern has
 * been tuned across a dozen sessions and belongs to every wall, window and fascia in the garden; and
 * because the wall is a handful of boxes whose corners are all the ramp needs — a box face takes one
 * even gradient between its corners, which is what a broad wash of dirt is. Any colour the mesh already
 * carried is kept and multiplied, so a wall that was tinted for another reason stays tinted.
 *
 * The mesh's own place in the world is what the ramp is keyed to, so a wall built out of six pieces
 * around six openings comes out as one dirty wall and not as six pieces each dirty in its own corner.
 * It reads the positions without undoing a rotation, which is fine for these walls: they are boxes,
 * stood up and not tilted.
 */
export function grimFeet(mesh, { floor = 0, rise = 1.15, shade = 0.7, lean = 0.05 } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	if (!positions) return mesh;
	const had = mesh.getVerticesData(VertexBuffer.ColorKind);
	const count = positions.length / 3;
	const colours = new Float32Array(count * 4);
	const base = mesh.getAbsolutePosition();
	for (let v = 0, i = 0; v < count; v++, i += 3) {
		const worldY = base.y + positions[i + 1];
		// The dirt line waves. One end of a wall is dirtier than the other, which is what years of a
		// driving monsoon do, and a level line of dirt reads as a painted skirting. It is a wave and not the
		// position itself, and that matters: the first version added the vertex's own place in the garden,
		// which is a big number, so a wall standing north of here came out with its grime a metre deeper
		// than one standing south. Bounded, and every wall is dirtied the same amount and waves the same
		// three-pace way, wherever it happens to be.
		const along = base.x + positions[i] + base.z + positions[i + 2];
		const u = Math.min(1, Math.max(0, (worldY - floor + lean * Math.sin(along * 0.8)) / rise));
		const g = shade + (1 - shade) * u;
		// Dirt is warm, not grey: the red keeps its value and the blue is what is lost.
		const r = g;
		const gr = g * (1 - 0.02 * (1 - u));
		const b = g * (1 - 0.06 * (1 - u));
		colours[v * 4] = (had ? had[v * 4] : 1) * r;
		colours[v * 4 + 1] = (had ? had[v * 4 + 1] : 1) * gr;
		colours[v * 4 + 2] = (had ? had[v * 4 + 2] : 1) * b;
		colours[v * 4 + 3] = had ? had[v * 4 + 3] : 1;
	}
	mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	return mesh;
}

export function facet(mesh) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	const uvs = mesh.getVerticesData(VertexBuffer.UVKind);
	const colours = mesh.getVerticesData(VertexBuffer.ColorKind);
	const indices = mesh.getIndices();
	if (!positions || !indices) return mesh;
	const n = indices.length;
	const pos = new Float32Array(n * 3);
	const nrm = new Float32Array(n * 3);
	const uv = uvs ? new Float32Array(n * 2) : null;
	const col = colours ? new Float32Array(n * 4) : null;
	for (let t = 0; t < n; t += 3) {
		const corner = [indices[t], indices[t + 1], indices[t + 2]];
		// The face's own normal, and its centre, which is only wanted to ask which way the face is looking.
		const p = corner.map((v) => [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]]);
		const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2];
		const vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], vz = p[2][2] - p[0][2];
		let nx = uy * vz - uz * vy;
		let ny = uz * vx - ux * vz;
		let nz = ux * vy - uy * vx;
		const len = Math.hypot(nx, ny, nz) || 1;
		nx /= len; ny /= len; nz /= len;
		// Which way is outward? The stones these are used on are built about their own middle and are all of
		// them convex, so the face normal has to lean away from that middle. Asking, instead of trusting the
		// winding, means the facets come out right whatever built the mesh.
		const mx = (p[0][0] + p[1][0] + p[2][0]) / 3;
		const my = (p[0][1] + p[1][1] + p[2][1]) / 3;
		const mz = (p[0][2] + p[1][2] + p[2][2]) / 3;
		if (nx * mx + ny * my + nz * mz < 0) { nx = -nx; ny = -ny; nz = -nz; }
		// A face above the stone’s own middle may not point downward. This is the tail of the wheel: a struck
		// crown is folded flat onto its plane, so the wedges that meet at the sphere’s pole have their centres
		// almost on the middle itself, where the test above is choosing between two answers by a hair. Half of
		// them came out pointing at the earth and were lit by nothing, so the top of the pond’s biggest boulder
		// was set with black triangles like holes (pictures/s86-pondlawn-c.png). The crown of a stone is the
		// face a visitor sees; its underside is buried. Under the middle, leave it as it is.
		if (my > 0 && ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
		for (let k = 0; k < 3; k++) {
			const v = corner[k];
			const o = (t + k) * 3;
			pos[o] = p[k][0]; pos[o + 1] = p[k][1]; pos[o + 2] = p[k][2];
			nrm[o] = nx; nrm[o + 1] = ny; nrm[o + 2] = nz;
			if (uv) { uv[(t + k) * 2] = uvs[v * 2]; uv[(t + k) * 2 + 1] = uvs[v * 2 + 1]; }
			if (col) {
				col[(t + k) * 4] = colours[v * 4];
				col[(t + k) * 4 + 1] = colours[v * 4 + 1];
				col[(t + k) * 4 + 2] = colours[v * 4 + 2];
				col[(t + k) * 4 + 3] = colours[v * 4 + 3];
			}
		}
	}
	mesh.setVerticesData(VertexBuffer.PositionKind, pos, true);
	mesh.setVerticesData(VertexBuffer.NormalKind, nrm, true);
	if (uv) mesh.setVerticesData(VertexBuffer.UVKind, uv, true);
	if (col) mesh.setVerticesData(VertexBuffer.ColorKind, col, true);
	const straight = new Uint32Array(n);
	for (let i = 0; i < n; i++) straight[i] = i;
	mesh.setIndices(straight);
	mesh.refreshBoundingInfo();
	return mesh;
}

/**
 * Light a whole mass of leaf at the size it is seen at, and let every plant be its own plant.
 *
 * `skinTint` shapes one lump at the scale of the crumple — a tip lit, a hollow dark — and it keeps the
 * mean of every mesh where the material put it, which is right for one lump and wrong for a garden.
 * Photographed at six metres a shrub is not a tip and a hollow any more: it is one shape of one green,
 * and when four of them stand in a row at a terrace front they are four copies of one bun.
 * This writes on top of the crumple's work at two scales the eye still reads from four metres out:
 *
 *   own     every plant a shade of itself. A shrub is a plant and not a stamping: one is a little
 *           hungrier and reads yellow-green, the next is older and reads blue-green, and no two are
 *           the same brightness. Unlike everything else here this one DOES move a plant's mean, and
 *           that is the whole point of it.
 *   lobes   a slow field in the world, two or three times over a bush: a mass of leaf is not one skin
 *           of one tone. It has crowns of new growth and shoulders of old, and from six metres those
 *           read as soft lobes of lighter and darker green across the plant.
 *
 * The field is averaged back to one over the mesh, so the lobes move light about inside the plant and
 * cannot repaint the garden; `own` is the one dial that does, and it is small on purpose.
 *
 * Multiply into colours already written by `skinTint`, after the parts are merged: one pass per mesh.
 */
export function massTint(meshes, { seed = 3, own = 0.14, lobes = 0.2, span = 0.45 } = {}) {
	const rand = randomGenerator(seed * 17 + 11);
	const lit = 1 - own + rand() * own * 2;
	// The plant's own lean of hue: a young leaf is a little redder, an old one a little bluer, and one
	// shrub has more of one than the other. The same two pence `skinTint` spends on a tip and a hollow.
	const bias = 1 + (rand() - 0.5) * 0.12;
	const broad = span * (1.7 + rand() * 1.1);
	const fine = broad * 0.45;
	// Shifted off the origin so two plants standing side by side do not read the same field.
	const drift = rand() * 211;
	for (const mesh of meshes) {
		const colours = mesh.getVerticesData(VertexBuffer.ColorKind);
		const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
		if (!colours || !positions) continue;
		const world = mesh.computeWorldMatrix(true);
		const count = positions.length / 3;
		const field = new Float32Array(count);
		let mean = 0;
		for (let v = 0, i = 0; v < count; v++, i += 3) {
			const p = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), world);
			field[v] = spacePatch(p.x + drift, p.y + drift, p.z + drift, { broad, fine, seed: seed * 13 + 7 }) * 2 - 1;
			mean += field[v];
		}
		mean /= count;
		for (let v = 0; v < count; v++) {
			const k = lit * (1 + lobes * (field[v] - mean));
			const j = v * 4;
			colours[j] *= k * bias;
			colours[j + 1] *= k;
			colours[j + 2] *= k / bias;
		}
		mesh.setVerticesData(VertexBuffer.ColorKind, colours, true);
	}
	return meshes;
}

/**
 * Places to stand a leaf on: the middle of `count` of a mesh's own triangles, with the way that triangle
 * faces, both read in the world and not in the mesh's own coordinates.
 *
 * This is why the cards of a shrub are nailed to the mesh they dress instead of to a ball of the same
 * size: `crumple` has already pushed the skin in and out, and a card planted on the ball the skin was
 * cut from floats in the air or buries itself in a hollow. Take the place and the tilt off the finished
 * skin and the card sits where the leaf actually is. Triangles are drawn at random out of the list, so
 * the big ones of a crumpled skin give up more places than the small ones, which is roughly what an
 * even spread over a lumpy surface means.
 *
 * `keep` can throw a place away — a shrub's skirt, say, or the part of a lump that is inside a pot.
 */
export function skinAnchors(mesh, { count = 40, seed = 1, keep = null } = {}) {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
	const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
	const indices = mesh.getIndices();
	if (!positions || !normals || !indices) return [];
	const world = mesh.computeWorldMatrix(true);
	const rand = randomGenerator(seed);
	const faces = Math.floor(indices.length / 3);
	const here = new Vector3();
	const anchors = [];
	// A whole turn of the generator is cheap and a stuck loop is not: if a `keep` throws away everything
	// the caller gets what it managed, and not a hang.
	for (let tries = 0; tries < count * 12 && anchors.length < count; tries++) {
		const f = Math.floor(rand() * faces) * 3;
		here.set(0, 0, 0);
		let nx = 0;
		let ny = 0;
		let nz = 0;
		for (let k = 0; k < 3; k++) {
			const i = indices[f + k] * 3;
			here.x += positions[i] / 3;
			here.y += positions[i + 1] / 3;
			here.z += positions[i + 2] / 3;
			nx += normals[i] / 3;
			ny += normals[i + 1] / 3;
			nz += normals[i + 2] / 3;
		}
		const at = Vector3.TransformCoordinates(here, world);
		const len = Math.hypot(nx, ny, nz) || 1;
		const out = Vector3.TransformNormal(new Vector3(nx / len, ny / len, nz / len), world);
		if (keep && !keep(at, out)) continue;
		anchors.push({ x: at.x, y: at.y, z: at.z, nx: out.x, ny: out.y, nz: out.z });
	}
	return anchors;
}

/**
 * A mesh from raw vertices. normals are worked out from the triangles, so callers only
 * have to give positions, indices and (optionally) uvs.
 */
export function poly(scene, name, { positions, indices, uvs, mat = null, parent = null }) {
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.uvs = uvs || new Float32Array(((positions.length / 3) * 2) | 0).fill(0.5);
	const normals = new Array(positions.length).fill(0);
	VertexData.ComputeNormals(positions, indices, normals);
	vertexData.normals = normals;
	vertexData.applyToMesh(mesh, true);
	if (mat) mesh.material = mat;
	mesh.parent = parent;
	return mesh;
}

/**
 * A surface of revolution: a profile of [radius, height] pairs spun once about the vertical axis.
 *
 * This is how a pot is made — a pot is thrown, and what a throwing leaves is a wall of revolution with a
 * lip at the top of it. `cylinder` can only make a straight taper between two diameters, and a browser at
 * the terrace steps showed what that does for a pot: a ribbed paper cup, no foot, no belly, no lip, and
 * therefore no pot (`pictures/tmp-home-s.png`). A profile says all four: a foot the pot stands on, a belly
 * that is the widest thing about it, a shoulder and neck drawing back in, and a moulded rim with a
 * thickness to it.
 *
 * The profile runs UP THE OUTSIDE and back DOWN THE INSIDE, so one mesh carries the wall, the lip and the
 * bore and there is no seam and no cap where a hollow pot would otherwise open. The last point of the
 * profile should be on or near the axis, or the bore is left open and the soil disc inside closes it.
 *
 * `u` goes round the barrel and `v` up it, both in metres of the pattern's own size, which is what
 * `metricCylinderUVs` does for a cylinder: the pattern's rings are wheel lines and want to be measured in
 * centimetres of clay and not in fractions of a shape that changes size.
 *
 * The faces are wound so their normals point OUT of the axis, which is what a pot wants: with the angle
 * going counterclockwise as seen from above and the profile going up, the cross product of (along the
 * angle) against (along the height) points away from the middle.
 */
export function revolve(scene, name, { profile, sides = 18, px = 0, py = 0, pz = 0, mat = null, parent = null, tile = null, ry = 0, flipV = false }) {
	const positions = [];
	const uvs = [];
	const indices = [];
	const step = (Math.PI * 2) / sides;
	// One girth for the whole pot, taken at its widest belly: the pattern is laid once round that and the
	// narrower parts of the wall take a slightly tighter repeat, which is what a cylinder has always done.
	let widest = 0;
	let top = 0;
	for (const [r, h] of profile) { widest = Math.max(widest, r); top = Math.max(top, h); }
	const t = tile || patternMetres(mat) || 1;
	const girth = Math.PI * 2 * widest;
	for (let i = 0; i < profile.length; i++) {
		const [rad, h] = profile[i];
		for (let j = 0; j < sides; j++) {
			const a = j * step;
			positions.push(Math.sin(a) * rad, h, Math.cos(a) * rad);
			// `flipV` lays the pattern top downward. A thrown pot wants it: the clay canvas is painted
			// with a pale mineral crust along one edge and the dark damp of a foot that never dries along
			// the other, and laid the wrong way a pot wears its damp on its shoulder and its lime crust on
			// its base — which reads, at six metres, as a second and smaller pot standing inside the first.
			uvs.push(((j / sides) * girth) / t, (flipV ? top - h : h) / t);
		}
	}
	for (let i = 0; i < profile.length - 1; i++) {
		for (let j = 0; j < sides; j++) {
			const A = i * sides + j;
			const B = (i + 1) * sides + j;
			const C = i * sides + ((j + 1) % sides);
			const D = (i + 1) * sides + ((j + 1) % sides);
			// Babylon counts a face front when its vertices go CLOCKWISE, which is the other way
			// round from the right-hand rule: wound the mathematical way a revolve comes out inside
			// out, and a pot so wound shows its far wall through its own near one, with a pale
			// flat patch of the wall behind it where the far wall runs out (`pictures/tmp-greatpot.png`).
			indices.push(A, B, C, C, B, D);
		}
	}
	const mesh = poly(scene, name, { positions, indices, uvs, mat, parent });
	mesh.position.set(px, py, pz);
	if (ry) mesh.rotation.y = ry;
	return mesh;
}

/**
 * A hip roof: a rectangular eave at the bottom and a ridge line along x at the top.
 * Returns the roof mesh. Slopes face out on all four sides.
 *
 * The winding matters: a face wound the wrong way is culled and vanishes, and a roof you can see
 * through from one side is the worst thing a roof can be. z0 is the smaller z, which is the north
 * end of the plan (-z is north), so the first pair below is the north slope and the second the
 * south. `tools/draw.js` now throws away the faces that point away from the eye, the way a renderer
 * does, and names any mesh left with nothing facing the camera: that is how the north slope was found
 * wound the wrong way for the second time — the earlier check was made with a drawing that lit both
 * sides of every face and could not see the fault.
 */
export function hipRoof(scene, name, { x0, x1, z0, z1, yBase, yTop, ridgeHalf = null, mat = null, parent = null, uvScale = 1 }) {
	const zm = (z0 + z1) / 2;
	const xm = (x0 + x1) / 2;
	const rh = ridgeHalf === null ? (x1 - x0) * 0.24 : ridgeHalf;
	const positions = [
		x0, yBase, z0, // 0 north-west eave
		x1, yBase, z0, // 1 north-east eave
		x1, yBase, z1, // 2 south-east eave
		x0, yBase, z1, // 3 south-west eave
		xm - rh, yTop, zm, // 4 west ridge end
		xm + rh, yTop, zm, // 5 east ridge end
	];
	const indices = [
		0, 1, 5, 0, 5, 4, // north slope — wound so its face points up and north, at the lawn behind
		2, 3, 4, 2, 4, 5, // south slope
		1, 2, 5, // east hip
		3, 0, 4, // west hip
	];
	const width = x1 - x0;
	const depth = z1 - z0;
	const uvs = [];
	const put = (x, z) => uvs.push(((x - x0) / width) * uvScale, ((z - z0) / depth) * uvScale);
	put(x0, z0);
	put(x1, z0);
	put(x1, z1);
	put(x0, z1);
	put(xm - rh, zm);
	put(xm + rh, zm);
	return poly(scene, name, { positions, indices, uvs, mat, parent });
}

/**
 * Lays a flat mesh's texture coordinates from where it actually lies in the garden, one repeat
 * every `tileMetres`. Four lawn strips each starting their pattern at their own corner made the
 * mown bands and the bare patches jump across the join; measured from the ground they are laid on,
 * the whole garden is one pattern.
 *
 * `tileMetres` may be one number, or `[along, across]` when the pattern is not square: the teak floors
 * want their grain measured one way and the width of a board the other, and one square tile cannot
 * say both at once.
 */
export function groundUVs(mesh, tileMetres, bend = null) {
	const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	if (!pos) return mesh;
	const world = mesh.computeWorldMatrix(true);
	const uvs = new Array((pos.length / 3) * 2);
	for (let i = 0; i < pos.length / 3; i++) {
		const p = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), world);
		// A bend pushes the pattern off its grid, in metres, so a tiled pattern stops landing in the same
		// place every tile. The pattern itself knows nothing about it: it is the same grass, just not on a grid.
		let x = p.x;
		let z = p.z;
		if (bend) {
			const [bx, bz] = bend(x, z);
			x += bx;
			z += bz;
		}
		const tu = Array.isArray(tileMetres) ? tileMetres[0] : tileMetres;
		const tv = Array.isArray(tileMetres) ? tileMetres[1] : tileMetres;
		uvs[i * 2] = x / tu;
		uvs[i * 2 + 1] = z / tv;
	}
	mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
	return mesh;
}

/**
 * Writes a colour into every corner of a mesh, read from the ground it lies on.
 *
 * The engine multiplies a mesh's own vertex colours into whatever pattern it wears, which is how a big
 * flat sheet gets shapes far bigger than its pattern can make: broad patches of lush grass and dry
 * grass over a lawn whose tile is six metres across. `toneAt(x, z)` answers in multipliers of light,
 * about one, the same way `paint()` in materials.js reads a colour — see src/lawn.js for the fields.
 */
export function tintFromGround(mesh, toneAt) {
	const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	if (!pos) return mesh;
	const world = mesh.computeWorldMatrix(true);
	const colours = new Array((pos.length / 3) * 4);
	for (let i = 0; i < pos.length / 3; i++) {
		const p = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), world);
		const tone = toneAt(p.x, p.z);
		colours[i * 4] = tone[0];
		colours[i * 4 + 1] = tone[1];
		colours[i * 4 + 2] = tone[2];
		colours[i * 4 + 3] = 1;
	}
	// `true` because a fresh plane has no colour buffer at all: told `false`, the engine quietly does
	// nothing when there is no buffer to update, and the garden carries no tone.
	mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colours, true);
	return mesh;
}

/** Scale a mesh's texture coordinates, so a pattern can be sized in metres instead of per face. */
export function scaleUVs(mesh, su, sv = su) {
	const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
	if (!uvs) return mesh;
	for (let i = 0; i < uvs.length; i += 2) {
		uvs[i] *= su;
		uvs[i + 1] *= sv;
	}
	mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
	return mesh;
}

/** A row of posts, beams, or any mesh repeated along a line. */
export function row(mesh, count, step, axis = "x") {
	const out = [mesh];
	for (let i = 1; i < count; i++) {
		const clone = mesh.clone(`${mesh.name}-${i}`);
		clone.position[axis] = mesh.position[axis] + step * i;
		out.push(clone);
	}
	return out;
}

/**
 * A wall running east-west at a fixed z, with real holes in it: `box` turned into pieces.
 *
 * `z` is the centre of the wall and `thickness` its depth in z; `openings` are
 * [{ x0, x1, y0, y1 }] with x0 < x1. The pieces are the wall left over around the holes — west of,
 * below, above, east of each one, and the stretches between — so a hole is a hole and not a pane of
 * a colour glued to the face of a wall.
 *
 * A wall is walked against however it is cut, so the pieces keep their collisions unless `collide`
 * says otherwise; a lining inside a wall needs none of its own, and passes `collide: false`.
 */
export function zWallWithOpenings(scene, name, { z, thickness, x0, x1, y0 = 0.5, y1 = 4.25, openings, mat, collide = true }) {
	const parts = [];
	const sorted = [...openings].sort((a, b) => a.x0 - b.x0);
	let n = 0;
	let edge = x0;
	const piece = (px, py, sx, sy) =>
		parts.push(box(scene, `${name}Part${n++}`, { x: sx, y: sy, z: thickness, px, py, pz: z, mat }));
	for (const o of sorted) {
		if (o.x0 > edge) piece((edge + o.x0) / 2, (y0 + y1) / 2, o.x0 - edge, y1 - y0);
		if (o.y0 > y0) piece((o.x0 + o.x1) / 2, (y0 + o.y0) / 2, o.x1 - o.x0, o.y0 - y0);
		if (o.y1 < y1) piece((o.x0 + o.x1) / 2, (o.y1 + y1) / 2, o.x1 - o.x0, y1 - o.y1);
		edge = o.x1;
	}
	if (edge < x1) piece((edge + x1) / 2, (y0 + y1) / 2, x1 - edge, y1 - y0);
	for (const mesh of parts) {
		mesh.checkCollisions = collide;
		mesh.receiveShadows = true;
	}
	return parts;
}

export { Color3, Vector3, MeshBuilder };
