// The pool: a pit of turquoise mosaic sunk in the paving, water that takes the sky,
// caustics moving on the floor, and lamps under the water.

import { box, groundPlane, cylinder, plane } from "./mesh.js";

const { Vector3, Color3 } = BABYLON;

// Inner face of the pit. The pool sits far enough south of the house that a paved walkway fits
// between the terrace and the water: 1 m of stone to walk round the pool on every side.
const X0 = -5;
const X1 = 5;
const Z0 = 2.1;
const Z1 = 7.1;
const WATER_Y = -0.2;
const FLOOR_Y = -1.62;
const DECK_TOP = 0.14;

export function buildPool(scene, mats, shadows) {
	const built = [];
	const zc = (Z0 + Z1) / 2;
	const zSpan = Z1 - Z0;
	const wallHeight = DECK_TOP - FLOOR_Y;
	const wallY = (DECK_TOP + FLOOR_Y) / 2;

	// The four inner faces, and the floor, all in mosaic.
	const west = box(scene, "poolWest", { x: 0.3, y: wallHeight, z: zSpan + 0.6, px: X0 - 0.15, py: wallY, pz: zc, mat: mats.poolTile });
	const east = box(scene, "poolEast", { x: 0.3, y: wallHeight, z: zSpan + 0.6, px: X1 + 0.15, py: wallY, pz: zc, mat: mats.poolTile });
	const north = box(scene, "poolNorth", { x: X1 - X0 + 0.6, y: wallHeight, z: 0.3, px: 0, py: wallY, pz: Z0 - 0.15, mat: mats.poolTile });
	const south = box(scene, "poolSouth", { x: X1 - X0 + 0.6, y: wallHeight, z: 0.3, px: 0, py: wallY, pz: Z1 + 0.15, mat: mats.poolTile });
	const floor = box(scene, "poolFloor", { x: X1 - X0 + 0.3, y: 0.14, z: zSpan + 0.3, px: 0, py: FLOOR_Y - 0.07, pz: zc, mat: mats.poolTile });
	floor.receiveShadows = true;
	// The pit is not a wall. These boxes are below the ground the visitor walks on, and the water
	// sheet is kept off-limits in main.js instead; given collisions here, their bounding boxes made
	// an invisible wall a third of a metre proud of the pit on every side — which stood right where
	// the villa's front steps come down, and turned the whole coping into a no-go band.
	for (const mesh of [west, east, north, south, floor]) {
		mesh.receiveShadows = true;
		built.push(mesh);
	}

	// The pale stone edge all the way round, slightly proud of the paving.
	//
	// The ring is eight boxes and not four: every side is the dry stone plus its damp foot, the inner 13 cm of
	// the capstone, where a swimmer climbing out leaves the water and the stone stays damp all day. The two
	// bands lie side by side in one plane, their top faces at the same height and their edges butting — the damp
	// foot is not a plate laid over the coping.
	//
	// A plate has to stand proud of the stone to win the depth test, and anything proud of a capstone throws a
	// shadow of its own height: at six millimetres the damp foot began with a black hairline across the stone
	// — six millimetres of shade, two pixels at arm's length, which reads as a groove sawn in the cap and not
	// as water (`pictures/tmp-wl-cap.png`). Three millimetres was half a pixel and still a risk at nine.
	// Side by side, neither band can ever fight the other, because no pixel is asked to choose between them.
	const edge = 0.42;
	const splash = 0.13;
	const capY = DECK_TOP + 0.01;
	// How far a band laid on a wall's own face stands proud of that face, so the depth test never has to
	// choose between two coplanar surfaces. One centimetre was enough at ten metres; see `wetTile` below.
	const skin = 0.02;
	const coping = [
		box(scene, "copingWest", { x: edge - splash, y: 0.16, z: zSpan + edge * 2 + 0.1, px: X0 - splash - (edge - splash) / 2, py: capY, pz: zc, mat: mats.coping }),
		box(scene, "copingEast", { x: edge - splash, y: 0.16, z: zSpan + edge * 2 + 0.1, px: X1 + splash + (edge - splash) / 2, py: capY, pz: zc, mat: mats.coping }),
		box(scene, "copingNorth", { x: X1 - X0, y: 0.16, z: edge - splash, px: 0, py: capY, pz: Z0 - splash - (edge - splash) / 2, mat: mats.coping }),
		box(scene, "copingSouth", { x: X1 - X0, y: 0.16, z: edge - splash, px: 0, py: capY, pz: Z1 + splash + (edge - splash) / 2, mat: mats.coping }),
	];
	// The west and east feet run the coping's whole length, as their dry twins do, so the damp line is
	// continuous round the corners; the north and south feet butt between them. They are no thinner than the
	// stone they share a face with: a person walks on the damp foot as on any other part of the edge.
	//
	// Each one is laid `skin` proud of the pit on the water side, and that is not slack in the drawing: the
	// foot's pool-facing face and the pool wall's inner face stand in the same plane, and where they overlap —
	// the wall comes up to 0.14 and the foot's face runs from 0.07, so seven centimetres of them — the depth
	// test had to choose one on the strength of nothing. It chose by column: a browser showed the far waterline
	// as a comb of turquoise teeth standing up into the damp stone, one tooth every five pixels, and
	// `tools/pickat.js` named both surfaces in the same column (`splashNorth` at y 0.21 and `poolNorth` at
	// y 0.12, both at z = 2.1). Standing the foot 2 cm into the pit is what the waterline bands below do for
	// their own reason; the teeth are gone and the coping still walks level with the paving.
	const wetCap = [
		box(scene, "splashWest", { x: splash + skin, y: 0.16, z: zSpan + edge * 2 + 0.1, px: X0 - (splash - skin) / 2, py: capY, pz: zc, mat: mats.copingWet }),
		box(scene, "splashEast", { x: splash + skin, y: 0.16, z: zSpan + edge * 2 + 0.1, px: X1 + (splash - skin) / 2, py: capY, pz: zc, mat: mats.copingWet }),
		box(scene, "splashNorth", { x: X1 - X0, y: 0.16, z: splash + skin, px: 0, py: capY, pz: Z0 - (splash - skin) / 2, mat: mats.copingWet }),
		box(scene, "splashSouth", { x: X1 - X0, y: 0.16, z: splash + skin, px: 0, py: capY, pz: Z1 + (splash - skin) / 2, mat: mats.copingWet }),
	];
	// The coping is the edge of the pool: something to stand on and to walk along, level with the
	// paving, so a person walking the perimeter keeps their feet at paving height.
	for (const mesh of [...coping, ...wetCap]) {
		mesh.receiveShadows = true;
		mesh.checkCollisions = true;
		built.push(mesh);
	}

	// The waterline on the wall: the strip of tile the water actually touches. Its partner on the capstone is
	// built with the coping itself, above.
	//
	// Without them the pool has no edge: a browser showed a flat sheet of tile meeting a flat sheet of pale
	// coping in one hard bright line, and nothing to say where the water was (`pictures/1341-pool.png` is the
	// released picture of it). Wet stone is darker than the same stone a hand's width above it, and cooler, and
	// the coping right where people climb out is damp all day.
	//
	// The band starts AT the surface and goes up 14 cm: what is below the surface is under the water film and
	// is already darkened by it, and a band running below the line would only be a dark stripe seen through
	// the wrong end of it. The two strips are a hair thicker than they need to be and sit on the face of the
	// wall, not in it: a band laid exactly in the wall's own plane z-fights with the wall and flickers.
	const wetTop = WATER_Y + 0.14;
	const wetY = (WATER_Y + wetTop) / 2;
	const wetH = wetTop - WATER_Y;
	const wetTile = [
		box(scene, "wetWest", { x: skin, y: wetH, z: zSpan, px: X0, py: wetY, pz: zc, mat: mats.poolWet }),
		box(scene, "wetEast", { x: skin, y: wetH, z: zSpan, px: X1, py: wetY, pz: zc, mat: mats.poolWet }),
		box(scene, "wetNorth", { x: X1 - X0, y: wetH, z: skin, px: 0, py: wetY, pz: Z0, mat: mats.poolWet }),
		box(scene, "wetSouth", { x: X1 - X0, y: wetH, z: skin, px: 0, py: wetY, pz: Z1, mat: mats.poolWet }),
	];

	for (const mesh of wetTile) {
		mesh.receiveShadows = true;
		built.push(mesh);
	}

	// The net of moving light on the four WALLS, for the first 80 cm under the surface.
	//
	// Why here and not on the water: a caustic is not a pattern on the surface, it is the sun's light
	// focused by the surface and thrown onto whatever the surface lies over — and at the start camera most
	// of the transmitted pool is the far wall, not the floor. The floor has had its two sheets for many
	// sessions and the walls have had nothing, which is half of why the basin read as graph paper: the
	// joint grid was the only pattern down there, and a grid sawn dead straight and dead even over half a
	// picture is a drawing of a pool and not one.
	//
	// The top of the band starts two centimetres UNDER the film, so the wet band above it (`wetTile`, which
	// stands from the waterline up 14 cm) and this one never share a pixel: two transparent skins in one
	// plane blend twice and flicker. Each is `skin` proud of its wall for the same reason the wet tiles
	// are: see the note on the splash boxes above.
	const netTop = WATER_Y - 0.02;
	const netH = 0.8;
	const netY = netTop - netH / 2;
	const causticWalls = [
		box(scene, "netWest", { x: skin, y: netH, z: zSpan, px: X0, py: netY, pz: zc, mat: mats.causticsWall }),
		box(scene, "netEast", { x: skin, y: netH, z: zSpan, px: X1, py: netY, pz: zc, mat: mats.causticsWall }),
		box(scene, "netNorth", { x: X1 - X0, y: netH, z: skin, px: 0, py: netY, pz: Z0, mat: mats.causticsWall }),
		box(scene, "netSouth", { x: X1 - X0, y: netH, z: skin, px: 0, py: netY, pz: Z1, mat: mats.causticsWall }),
	];
	for (const mesh of causticWalls) {
		// Under half: see `mats.causticsWall` in `src/materials.js`. Dialed from the address bar by `?net=`.
		mesh.visibility = 0.45;
		mesh.receiveShadows = false;
		built.push(mesh);
	}

	// Steps down into the water at the south end.
	const steps = [];
	for (let i = 0; i < 3; i++) {
		const top = -0.42 - i * 0.4;
		steps.push(
			box(scene, `poolStep${i}`, {
				x: 3,
				y: 0.4,
				z: 0.55,
				px: -3.2,
				py: top - 0.2,
				pz: Z1 - 0.4 - i * 0.55,
				mat: mats.poolTile,
			}),
		);
	}
	// Under the water, so no walking is asked of them.
	steps.forEach((mesh) => {
		mesh.receiveShadows = true;
		built.push(mesh);
	});

	// The water itself: one sheet, facing UP, and see-through.
	// It used to be two sheets, one of them facing down so that a head under water would still see water —
// but from above you then saw the dark underside of the surface through the surface itself, and the
	// pool read as mud. Now that the water is genuinely translucent, a second face in the same sheet would
	// blend twice and lay a second film over the bottom: one face, from above, which is the only side a
	// person standing on the coping has.
	//
	// And it has to be the RIGHT way up, which the sheet used to get away with not being. A flat sheet with
	// one skin is drawn from one side only, and turned the other way it is not there: no error, no warning,
	// and — this is the trap — `tools/cover.js` still picks it and still says it covers a quarter of the
	// frame, because a ray pick does not care about the winding. The Villa ran three sessions of water
	// measurements on a sheet that was not drawn at all, and every knob on it (alpha, emissive, albedo)
	// answered "nothing changed" — which is the true answer about a surface that is invisible, and the wrong
	// answer about the pool.
	//
	// `rx = +PI/2` is the way up, the same as the caustics sheets below. The check is not the share and not
	// the pick: it is that the picture CHANGES when the sheet is switched off (`tools/waterprobe3.js`).
	const water = plane(scene, "water", {
		width: X1 - X0,
		height: zSpan,
		px: 0,
		py: WATER_Y,
		pz: zc,
		mat: mats.water,
		rx: Math.PI / 2,
		bothSides: false,
	});
	water.receiveShadows = false;
	// Everything here is drawn in the ordinary order, sorted by distance from the eye like the rest of the garden.
	// It used to be put in a render group of its own so that a cloud of blood under the film could not be drawn
	// after the sheet it belongs under. A render group is a blunt instrument: whatever is in a later group is
	// drawn over everything in an earlier one, and the villa is mostly glass, which is transparent and so does
	// not write depth — so the whole pool was being painted across the walls of the house, dry deck and all.
	// The ordering wanted is the ordering the distance sort already gives: blood lies under the surface, so it
	// is further from the eye, so it is drawn first. What does have to be said out loud is that the film must
	// not write depth, because a surface that writes depth and is only half there is a mask over everything it
	// is drawn across.
	mats.water.forceDepthWrite = false;
	built.push(water);

	// Six rings of disturbance on the surface, spent by whatever breaks it: the shark's fin, its tail, and
	// the bite. The pond has had these for sessions (`src/pond.js`) and the pool has not, which is why
	// anything that came through the pool's surface did so silently.
	const rippleRings = [];
	for (let i = 0; i < 6; i++) {
		const ring = plane(scene, `poolRipple${i}`, {
			width: 1, height: 1, px: 0, py: WATER_Y + 0.014, pz: zc, mat: mats.ripple, rx: Math.PI / 2,
		});
		ring.isVisible = false;
		ring.visibility = 0;
		// Group 3: a ring IS the surface, so it is drawn over the water's film and not under it.
		rippleRings.push({ mesh: ring, left: 0, from: 0.3, span: 1, show: 0.5, life: 2 });
	}
	built.push(...rippleRings.map((r) => r.mesh));

	/**
	 * Mark a disturbance on the surface at (x, z).
	 *
	 * Called `splashRing` and not `splash` because `splash` is already the name of the damp foot of the
	 * capstone higher up this file, and two things in one file cannot both be the wet bit.
	 *
	 * Same shape of call as the pond's: `across` is the ring's own starting width, `span` how far it travels
	 * out, `show` its brightest visibility and `life` how long it is seen. A swell, a slap and a bite are all
	 * the same mechanism wearing different numbers, and the caller is the one who knows which it is making.
	 */
	function splashRing(x, z, shape = {}) {
		const sx = Math.min(X1 - 0.08, Math.max(X0 + 0.08, x));
		const sz = Math.min(Z1 - 0.08, Math.max(Z0 + 0.08, z));
		const slot = rippleRings.find((r) => r.left <= 0) || rippleRings.reduce((a, b) => (a.left < b.left ? a : b));
		slot.from = shape.across === undefined ? 0.3 : shape.across;
		slot.span = shape.span === undefined ? 1.05 : shape.span;
		slot.show = shape.show === undefined ? 0.6 : shape.show;
		slot.life = shape.life === undefined ? 2 : shape.life;
		slot.mesh.position.set(sx, WATER_Y + 0.014, sz);
		slot.mesh.visibility = slot.show;
		slot.mesh.scaling.setAll(slot.from);
		slot.mesh.isVisible = true;
		slot.left = slot.life;
	}

	// Two sheets of moving light lying on the pool FLOOR, crossing each other.
	//
	// They rode the surface for a while, which is how a pool ends up looking like a sheet of crumpled foil:
	// caustics are not a pattern on the surface, they are the sun's light concentrated by the surface and
	// thrown DOWN onto the bottom, and they only exist where the floor is. With the water see-through they
	// belong where they always belonged, under it — and they read as depth instead of as a skin.
	//
	// One material, two sheets, so the strength of each is the MESH's `visibility` and not the material's
	// alpha: setting `causticsA.material.alpha` and then `causticsB.material.alpha` (which is what this
	// file used to do) sets one number twice and the second wins.
	const causticsA = plane(scene, "causticsA", { width: X1 - X0, height: zSpan, px: 0, py: FLOOR_Y + 0.05, pz: zc, mat: mats.caustics, rx: Math.PI / 2 });
	const causticsB = plane(scene, "causticsB", { width: X1 - X0, height: zSpan, px: 0, py: FLOOR_Y + 0.09, pz: zc, mat: mats.caustics, rx: Math.PI / 2 });
	causticsA.visibility = 0.55;
	causticsB.visibility = 0.3;
	causticsA.receiveShadows = false;
	causticsB.receiveShadows = false;
	built.push(causticsA, causticsB);

	// The two fittings set into the south wall, and the light they do NOT throw.
	//
	// They used to be lit: cyan discs a metre under the water, burning at full strength in a Villa that is
	// standing in afternoon sun, and mirrored by the front glass into the middle of the living room.
	// `mats.poolLamp` says what an off fitting looks like now. What the two POINT lights are doing here
	// is a separate question and the honest answer is: they are the pit's fill, not lamps. This renderer
	// has no bounced light, and a basin walled on four sides with a sun above it came out a coal scuttle
	// until something gave it a second source — the same reason `mats.poolTile` carries an emissive
	// cheat, and measured there at twelve points of luminance on the water from the `pool` view (L146
	// with these two, L134 without, at the same camera and the same fittings). They are left below the
	// water line where a lamp would be and out of the room's account (`src/main.js`), and they throw no
	// specular, so they cannot put a white coin on the surface.
	const lamps = [];
	const lampLights = [];
	for (const px of [-2.6, 2.6]) {
		lamps.push(
			cylinder(scene, `poolLamp${px}`, {
				diameter: 0.34,
				height: 0.1,
				tessellation: 14,
				px,
				py: -0.62,
				pz: Z1 - 0.04,
				rx: Math.PI / 2,
				mat: mats.poolLamp,
			}),
		);
		const lampLight = new BABYLON.PointLight(`poolFill${px}`, new Vector3(px, -0.7, Z1 - 0.5), scene);
		lampLight.diffuse = new Color3(0.45, 1.1, 1.2);
		lampLight.intensity = 26;
		lampLight.range = 11;
		// No specular: this fill is here for the tiles and the floor, and a light that throws a mirror
		// image of itself onto the surface puts two white coins on the water.
		lampLight.specular = new Color3(0, 0, 0);
		lampLights.push(lampLight);
	}
	built.push(...lamps);

	for (const mesh of [west, east, north, south, floor, ...coping, ...wetCap, ...steps]) shadows.addShadowCaster(mesh);

	return {
		meshes: built,
		lights: lampLights,
		bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1, cx: 0, cz: zc, waterY: WATER_Y, floorY: FLOOR_Y },
		// Where a visitor may not walk: the whole pit. Its water is a painted sheet, not a floor, and
		// the villa's front steps now land on the paving north of it, so nothing needs an exception.
		walkBlocks: [[X0, X1, Z0, Z1]],
		water,
		caustics: [causticsA, causticsB],
		causticWalls,
		splash: splashRing,
		animate(time, delta = 0) {
			// The net of light on the floor crawls one way and the surface's ripples the other, so the
			// pattern never repeats itself while you are watching it — and the floor and the surface never
			// lock together into one shape either.
			mats.water.albedoTexture.uOffset = time * 0.014;
			mats.water.albedoTexture.vOffset = time * 0.009;
			mats.water.bumpTexture.uOffset = time * 0.017;
			mats.water.bumpTexture.vOffset = -time * 0.011;
			mats.caustics.emissiveTexture.uOffset = time * 0.021;
			mats.caustics.emissiveTexture.vOffset = time * 0.012;
			// The wall net at its own pace and on its own seed, so it never rhymes with the floor's.
			mats.causticsWall.emissiveTexture.uOffset = -time * 0.013;
			mats.causticsWall.emissiveTexture.vOffset = time * 0.019;
			// A second read of the same map, running the other way, doubles the pattern.
			causticsB.rotation.y = Math.PI;
			// Rings that are out travel out and lose their height as they grow, which is what a ripple does.
			for (const r of rippleRings) {
				if (r.left <= 0) continue;
				r.left -= delta;
				const u = 1 - Math.max(0, r.left) / r.life;
				const across = r.from + u * r.span;
				r.mesh.scaling.set(across, across, across);
				r.mesh.visibility = (1 - u) * (1 - u) * r.show;
				if (r.left <= 0) r.mesh.isVisible = false;
			}
		},
	};
}
