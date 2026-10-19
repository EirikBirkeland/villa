// The loft: how a swimming animal is made in this Villa.
//
// Both the koi (`src/koi.js`) and the shark (`src/shark.js`) are tubes of flesh drawn along a line: a
// number of stations down the length, each one an oval ring of points, and the skin stretched between
// neighbouring rings. That is a loft, and it is the only way to make an animal that can BEND: a solid
// ellipsoid dragged along a curve is a stick being towed, and an animal swims by passing a bend backwards
// down its own body.
//
// THE ONE CONVENTION, shared by both animals so the same two functions serve them:
//
//   `t` runs from the TAIL TIP (0) to the SNOUT (1). The animal's own +z is forward, towards the snout,
//   so a mesh lofted from `from` to `to` stands with its origin at its rear station and hangs forwards.
//   `yaw` is a Babylon heading: forward is (sin yaw, 0, cos yaw), the same as the walk's.
//
// The girth of a ring is not a circle but three tables read at `t` — how far the flank stands out, how far
// the back rises, how far the belly hangs — because that is how an animal actually varies along its
// length: a fish is deepest where its dorsal begins and comes to a stalk behind it, and a shark's snout is
// a wedge and not a dome. Whoever calls `loft` owns those tables and passes them in: a herring, a carp and
// a bull shark are the same tube wearing three sets of numbers.

const { VertexData, Mesh } = BABYLON;

/** One table read at `t`, with a smooth step between the places it was measured at. */
export function along(keys, t) {
	if (t <= keys[0][0]) return keys[0][1];
	if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
	for (let i = 1; i < keys.length; i++) {
		if (t <= keys[i][0]) {
			const [ta, a] = keys[i - 1];
			const [tb, b] = keys[i];
			const u = (t - ta) / (tb - ta);
			const s = u * u * (3 - 2 * u);
			return a + (b - a) * s;
		}
	}
	return keys[keys.length - 1][1];
}

/**
 * One length of a body, lofted between two places along it, as a mesh of its own.
 *
 * The mesh's own origin is at its REAR edge — the `from` end, since `t` runs backwards from the snout — so
 * a parent node can be put at the bend it is in charge of and the flesh hangs off it in the right
 * direction. Both ends are capped: the segments overlap at the bends and a bend can open a seam, and a
 * fish with a hole in its middle is the worst thing a loft can do.
 *
 * The skin is mapped with u along the animal and v round it, which is how `koiCanvas` and
 * `sharkSkinCanvas` in `src/textures.js` are painted: the middle of the canvas is the back and the two
 * edges of it are the belly, which is one place.
 *
 * `flank`, `dorsal` and `belly` are the three girth tables (see `along`); `flank` is a fraction of the
 * animal's full WIDTH and the other two fractions of its full DEPTH, so one pair of numbers describes the
 * whole creature at any length. Pass `wide: 1, deep: 1` and the three tables become plain metres.
 *
 * `cut(t, j)`, when given, opens a HOLE. Every ring station the predicate says `true` about is left out of
 * the skin, and a quad is dropped whenever all four of its corners are cut — so what is opened is a window in
 * the tube, its edges falling on ring lines. The shark's mouth is made this way (`src/shark.js`): a mouth is
 * a hole in an animal, and anything less than actually taking the skin out is a mouth painted on a closed
 * one. Whatever the hole reveals is up to the caller; the shark puts a dark tube inside it.
 *
 * `nose` pushes the snout cap that far FORWARD of the last ring. Without it an end is closed with a flat
 * disc, which is right for a tail stalk and wrong for a head: a carp's head is a blunt dome, and a blunt
 * dome needs the cap drawn out in front of the ring it is closing.
 *
 * `capStart` and `capEnd`, either of them `false`, leave that end of the tube OPEN. A tube whose end is
 * buried inside the next tube along wants that: a buried cap is a flat disc whose rim can prick through the
 * skin it is buried in.
 */
export function loft(scene, name, mat, { long, wide, deep, from, to, rings = 20, girth = 11, flank, dorsal, belly, cut = null, nose = 0, capStart = true, capEnd = true }) {
	const positions = [];
	const uvs = [];
	const indices = [];
	const first = Math.round(from * rings);
	const last = Math.round(to * rings);
	const ringAt = (t) => {
		const half = along(flank, t) * wide;
		const up = along(dorsal, t) * deep;
		const down = along(belly, t) * deep;
		const z = (t - from) * long;
		const out = [];
		for (let j = 0; j < girth; j++) {
			// Start at the bottom of the animal and go round, so v runs 0 at the belly through 0.5 at the back
			// and home again: the canvas's two edges are the belly and meet.
			const th = -Math.PI / 2 + (j / girth) * Math.PI * 2;
			const s = Math.sin(th);
			out.push([Math.cos(th) * half, (s > 0 ? up : down) * s, z]);
		}
		return out;
	};
	const loop = [];
	for (let i = first; i <= last; i++) loop.push(ringAt(i / rings));
	loop.forEach((ring, i) => {
		const t = (first + i) / rings;
		for (let j = 0; j < girth; j++) {
			const p = ring[j];
			positions.push(p[0], p[1], p[2]);
			uvs.push(t, j / girth);
		}
	});
	// Which lattice points are cut away, so the quads that lie wholly inside the window are not made.
	const gone = (i, j) => (cut ? cut((first + i) / rings, ((j % girth) + girth) % girth) : false);
	for (let i = 0; i < loop.length - 1; i++) {
		for (let j = 0; j < girth; j++) {
			if (gone(i, j) && gone(i, j + 1) && gone(i + 1, j) && gone(i + 1, j + 1)) continue;
			const a = i * girth + j;
			const b = i * girth + ((j + 1) % girth);
			const c = (i + 1) * girth + j;
			const d = (i + 1) * girth + ((j + 1) % girth);
			indices.push(a, b, c, b, d, c);
		}
	}
	// The two caps: a fan from each end ring out to a point on the axis. The snout is a real end; the tail
	// end is where the caudal fin starts and the cap keeps it closed when the tail beats across it.
	//
	// An end that is buried inside the next tube along is NOT a real end, and capping it is a mistake: the
	// disc's rim pricks through the neighbour's skin whenever the two tubes are not running exactly together,
	// and the fish is then barbed with a bright line across its middle at every joint it bends at
	// (`pictures/tmp-koi-front.png`). `capStart` and `capEnd` leave such an end open.
	for (const end of ["start", "end"]) {
		if (end === "start" && !capStart) continue;
		if (end === "end" && !capEnd) continue;
		const base = end === "start" ? 0 : (loop.length - 1) * girth;
		const i = end === "start" ? 0 : loop.length - 1;
		// A cap is only put on a ring that is whole. A cut ring would otherwise fan out over the hole it made.
		if (cut) {
			let holed = false;
			for (let j = 0; j < girth; j++) if (gone(i, j)) holed = true;
			if (holed) continue;
		}
		const forward = end === "end";
		const z = positions[base * 3 + 2] + (forward ? nose : 0);
		const centre = positions.length / 3;
		positions.push(0, 0, z);
		uvs.push(forward ? 1 : 0, 0.5);
		for (let j = 0; j < girth; j++) {
			const a = base + j;
			const b = base + ((j + 1) % girth);
			if (forward) indices.push(a, b, centre);
			else indices.push(a, centre, b);
		}
	}
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.uvs = uvs;
	const normals = new Array(positions.length).fill(0);
	VertexData.ComputeNormals(positions, indices, normals);
	vertexData.normals = normals;
	vertexData.applyToMesh(mesh, true);
	if (mat) mesh.material = mat;
	return mesh;
}

/**
 * A fin: a strip of membrane between two edges, station by station.
 *
 * `plane` cannot do this because a fin is not a rectangle — a caudal fin is two lobes on a stalk, a dorsal
 * is a sail with a rounded top and a swept leading edge, and a pectoral is a wing laid sideways — so each
 * station says where its two edges are and the quads are laid between them. One face and its opposite,
 * drawn from both sides.
 *
 * On the "y" axis a fin stands up (dorsal, caudal, anal) and on the "x" one it lies out to the side (a
 * pectoral, a pelvic). `a` and `b` are the two edges of the strip at each station, each a [along, up] pair.
 */
export function fin(scene, name, mat, stations, axis = "y") {
	const positions = [];
	const uvs = [];
	const indices = [];
	stations.forEach((s, i) => {
		const [az, ay] = s.a;
		const [bz, by] = s.b;
		if (axis === "y") {
			positions.push(0, ay, az, 0, by, bz);
		} else {
			positions.push(ay, 0, az, by, 0, bz);
		}
		uvs.push(0, i / (stations.length - 1), 1, i / (stations.length - 1));
		if (i < stations.length - 1) {
			const n = i * 2;
			indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
		}
	});
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.uvs = uvs;
	const normals = new Array(positions.length).fill(0);
	VertexData.ComputeNormals(positions, indices, normals);
	vertexData.normals = normals;
	vertexData.applyToMesh(mesh, true);
	if (mat) mesh.material = mat;
	return mesh;
}
