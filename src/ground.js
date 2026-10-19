// Where the visitor's feet go.
//
// Every floor in the Villa is a flat rectangle, so the visitor is set down on top of one instead
// of being handed to a collision engine. The engine takes its steps per frame, not per second, and
// this Villa is often drawn at a dozen frames a second: with a metre of travel in one step a person
// walks through the paving and drops out of the world. Here the ground simply holds them.
//
// The floors and walls are read off the scene's own meshes — whatever was built as solid ground is
// found here — so these heights cannot drift away from the geometry.

const RADIUS = 0.32; // how thick the visitor is, in metres

/**
 * Reads the scene once and returns { heightAt, free }.
 * `water` is a list of rectangles [x0, x1, z0, z1] to keep off — the pool.
 */
export function makeGround(scene, water = []) {
	const floors = [];
	const walls = [];

	for (const mesh of scene.meshes) {
		if (!mesh.checkCollisions || !mesh.isEnabled()) continue;
		mesh.computeWorldMatrix(true);
		const box = mesh.getBoundingInfo().boundingBox;
		const min = box.minimumWorld;
		const max = box.maximumWorld;
		if (!isFinite(min.x) || !isFinite(max.y)) continue;
		const height = max.y - min.y;
		if (height <= 0.75 && max.y > -0.01) {
			// flat and level with the ground or just above it: something to stand on
			floors.push({ x0: min.x, x1: max.x, z0: min.z, z1: max.z, top: max.y });
		} else if (height > 0.3) {
			// tall enough to walk into
			walls.push({ x0: min.x - RADIUS, x1: max.x + RADIUS, z0: min.z - RADIUS, z1: max.z + RADIUS });
		}
	}

	for (const rect of water) {
		walls.push({ x0: rect[0], x1: rect[1], z0: rect[2], z1: rect[3] });
	}

	const inside = (rect, x, z) => x > rect.x0 && x < rect.x1 && z > rect.z0 && z < rect.z1;

	return {
		floors: floors.length,
		walls: walls.length,

		/** How high the ground is under a point: the highest floor there, or the lawn. */
		heightAt(x, z) {
			let top = 0;
			for (const floor of floors) {
				if (x > floor.x0 && x < floor.x1 && z > floor.z0 && z < floor.z1 && floor.top > top) top = floor.top;
			}
			return top;
		},

		/** Whether a person may stand at a point: no wall, no water. */
		free(x, z) {
			for (const wall of walls) {
				if (inside(wall, x, z)) return false;
			}
			return true;
		},
	};
}
