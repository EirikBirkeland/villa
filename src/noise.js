// Small helpers for repeatable random numbers and tileable noise fields.
// Everything here is plain maths: no external images, no downloads.

const BABYLON = globalThis.BABYLON;

/** A small, fast, seedable random generator. Returns numbers in 0..1. */
export function randomGenerator(seed) {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

function smooth(t) {
	return t * t * (3 - 2 * t);
}

/** A grid of random values, used as the corners of value noise. */
function valueGrid(n, seed) {
	const rand = randomGenerator(seed);
	const grid = new Float32Array(n * n);
	for (let i = 0; i < n * n; i++) grid[i] = rand();
	return grid;
}

/** Value noise sampled at (x, y), wrapping every `n` units so tiles line up. */
function valueNoise(grid, n, x, y) {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = smooth(x - x0);
	const fy = smooth(y - y0);
	const at = (a, b) => grid[(((b % n) + n) % n) * n + (((a % n) + n) % n)];
	const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
	const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
	return top * (1 - fy) + bottom * fy;
}

/**
 * A square field of layered noise (fine detail on top of broad shapes), size x size,
 * values 0..1, and seamless across the edges.
 */
export function noiseField(size, baseCells, octaves, seed) {
	const out = new Float32Array(size * size);
	let amplitude = 1;
	let total = 0;
	for (let octave = 0; octave < octaves; octave++) {
		const n = Math.max(2, Math.round(baseCells * Math.pow(2, octave)));
		const grid = valueGrid(n, seed + octave * 7919);
		const scale = n / size;
		for (let y = 0; y < size; y++) {
			const row = y * size;
			const ny = y * scale;
			for (let x = 0; x < size; x++) {
				out[row + x] += amplitude * valueNoise(grid, n, x * scale, ny);
			}
		}
		total += amplitude;
		amplitude *= 0.5;
	}
	for (let i = 0; i < out.length; i++) out[i] /= total;
	return out;
}

/** One value of a grid of random numbers, for a field sampled in metres of ground. */
function corner(ix, iz, seed) {
	let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 362437);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * One smooth random value for a place in the garden, asked in metres.
 *
 * `wavelength` is how far you walk before the field wanders to a new value, in the same metres as
 * (x, z): 40 means the shapes in it are about forty metres across. Returns 0..1 and gives the same
 * answer every time for the same place, so the Villa, `tools/draw.js` and `tools/feet.js` all stand
 * in the same garden. Unlike `noiseField` this is not painted into a square of canvas: it is read
 * wherever a thing stands on the ground.
 */
export function groundNoise(x, z, wavelength, seed) {
	const fx = x / wavelength;
	const fz = z / wavelength;
	const x0 = Math.floor(fx);
	const z0 = Math.floor(fz);
	const sx = smooth(fx - x0);
	const sz = smooth(fz - z0);
	const a = corner(x0, z0, seed);
	const b = corner(x0 + 1, z0, seed);
	const c = corner(x0, z0 + 1, seed);
	const d = corner(x0 + 1, z0 + 1, seed);
	return (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz;
}

/**
 * The same, at two wavelengths at once: broad shapes with smaller ones riding on top, so nothing
 * about it looks like a grid. Returns 0..1.
 */
export function groundPatch(x, z, { broad, fine, seed }) {
	return 0.66 * groundNoise(x, z, broad, seed) + 0.34 * groundNoise(x, z, fine, seed + 7919);
}

/** One value of a cube of random numbers, for a field sampled in metres of skin. */
function corner3(ix, iy, iz, seed) {
	let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1442695041) ^ Math.imul(seed, 362437);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * One smooth random value for a place in space, asked in metres — `groundNoise` for a thing that is
 * not lying flat on the ground.
 *
 * A shrub's skin and a treetop's crown are rounded over: a field laid on the ground runs into itself
 * when you wrap it round a ball, and leaves a pinched star where the two poles are. This one is asked
 * at a point in the air instead, so it can be laid straight over a lump. `wavelength` is how far you
 * walk over the skin before the field wanders to a new value, in metres of skin. Returns 0..1.
 */
export function spaceNoise(x, y, z, wavelength, seed) {
	const fx = x / wavelength;
	const fy = y / wavelength;
	const fz = z / wavelength;
	const x0 = Math.floor(fx);
	const y0 = Math.floor(fy);
	const z0 = Math.floor(fz);
	const sx = smooth(fx - x0);
	const sy = smooth(fy - y0);
	const sz = smooth(fz - z0);
	const mix = (a, b, t) => a + (b - a) * t;
	const bottom = mix(
		mix(corner3(x0, y0, z0, seed), corner3(x0 + 1, y0, z0, seed), sx),
		mix(corner3(x0, y0 + 1, z0, seed), corner3(x0 + 1, y0 + 1, z0, seed), sx),
		sy
	);
	const top = mix(
		mix(corner3(x0, y0, z0 + 1, seed), corner3(x0 + 1, y0, z0 + 1, seed), sx),
		mix(corner3(x0, y0 + 1, z0 + 1, seed), corner3(x0 + 1, y0 + 1, z0 + 1, seed), sx),
		sy
	);
	return mix(bottom, top, sz);
}

/**
 * `spaceNoise` at two wavelengths at once, for a skin that has leaf clusters on it and leaves too:
 * broad shapes with smaller ones riding on top. Returns 0..1.
 */
export function spacePatch(x, y, z, { broad, fine, seed }) {
	return 0.66 * spaceNoise(x, y, z, broad, seed) + 0.34 * spaceNoise(x, y, z, fine, seed + 7919);
}

/** A field of sharp ridges (1 - 2*|noise-0.5|), for cracks, grain and caustic lines. */
export function ridgeField(size, baseCells, octaves, seed) {
	const field = noiseField(size, baseCells, octaves, seed);
	const out = new Float32Array(size * size);
	for (let i = 0; i < size * size; i++) {
		const v = 1 - Math.abs(field[i] - 0.5) * 2;
		out[i] = Math.pow(v, 3);
	}
	return out;
}

/** Turns a 0..1 field into a grey bump map (heights -> slope), seamless. */
export function bumpFromField(field, size, strength) {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	const image = ctx.createImageData(size, size);
	const data = image.data;
	const at = (x, y) => field[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
			const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
			// A normal pointing (dx, dy, 1), packed into rgb the way Babylon expects.
			const length = Math.hypot(dx, dy, 1);
			const i = (y * size + x) * 4;
			data[i] = ((-dx / length) * 0.5 + 0.5) * 255;
			data[i + 1] = ((dy / length) * 0.5 + 0.5) * 255;
			data[i + 2] = (1 / length) * 0.5 * 255 + 127;
			data[i + 3] = 255;
		}
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

export { BABYLON };
