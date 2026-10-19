/**
 * The water's own shader: the library's PBR, with one thing put right about a flat sheet of water.
 *
 * A pool is seen through at one angle and mirrored at another. Look straight down and you see the
 * mosaic a metre and a half below; look at the far edge and you see the sky, the palms and the house
 * upside down. That is Fresnel, and it is the whole difference between water and a sheet of glass laid
 * over a tank.
 *
 * The library cannot do it for a transparent PBR material on its own: `alpha` is one number for the
 * whole surface, so the far half lets the far wall through just as much as the near half lets the floor
 * through, and a browser said so — the start view's pool read as a wall of tile seen through a window
 * (`pictures/tmp-h1c-01.png`, and item 37 in NOTES.md has the numbers). The library does have a
 * Fresnel-driven alpha in its shader source — `pbrBlockAlphaFresnel` — but nothing in the PBR material
 * in this build ever sets the define that turns it on: `alphaFresnel` appears once in the whole of
 * `vendor/babylon/babylon.js`, and that once is the dead include itself.
 *
 * So this file patches the shader the way the library invites: `customShaderNameResolve` is a material's
 * own chance to say which shader it wants, and `Effect.ShadersStore` is the library's own text, read
 * here and written back with one sentence added. Only the water asks for the patched shader, so no other
 * surface in the Villa is touched — not the glass, not the leaf cards, not the two caustics sheets.
 *
 * What is added, at the point where the library has settled the alpha (`float alpha=albedoOpacityOut.alpha;`):
 *
 *     alpha = alpha + (1 - alpha) * pow(1 - NdotV, power)
 *
 * — the material's own alpha (`src/materials.js` still owns it, and it is what the surface covers when
 * you look straight down at it) pushed up towards a mirror as the eye grazes. `NdotV` is read off the two
 * vectors the library has already built at that point in its own main: `normalW` (with the ripple bump in
 * it, so the mirror shimmers) and `viewDirectionW` (the line to the eye).
 *
 * Read off the library's own shader text, not from a manual: `cameraPosition` is NOT declared in the pbr
 * pixel shader in this build and the compile says so, and the alpha line sits after
 * `#include<pbrBlockNormalGeometric>`, which is where the normal and the view vector are made.
 *
 * THE SECOND THING THE ANGLE TAKES AWAY: the water's own colour.
 *
 * `src/materials.js` paints the sheet with an emissive film — the cyan of a metre and a half of water, and
 * it is the right cheat for the light that comes back up out of a pit this renderer gives no bounce to. But
 * emissive is *added after* every reflection and it does not care what angle you look from, so the film lay
 * over the far two thirds of the pool like a painted lid: at the start view the water a metre from the far
 * coping came out (118,204,206) L194, brighter than the sunlit coping beside it at L140, and it made a flat
 * cyan plate across a mirror that should have been showing the house, the sky and their own wobble in them.
 * That plate is why the far half of the pool read as graph paper under cellophane: nothing in an emissive
 * term can ever shimmer, because there is no light and no normal in it.
 *
 * So the film now carries the same Fresnel factor the alpha does:
 *
 *     finalEmissive *= 1 - pow(1 - NdotV, power)
 *
 * which is not a decoration but the actual physics of the thing: the cyan of a pool is light that went IN.
 * At a grazing angle almost nothing goes in — the surface mirrors — so almost no cyan comes back. Look down
 * from the coping and the film is at full strength and the water is turquoise; look along it from the far
 * path and the film is gone and what you see is a mirror. One rule, no new lamp, no new mesh, and the near
 * and the far half of one sheet stop being the same flat colour.
 *
 * THE THIRD THING: what the mirror sees.
 *
 * Taking the film away at a graze was right, and it left a hole in the picture, because this renderer pays
 * a dielectric's mirror next to nothing: `scene.environmentIntensity` stands at 0.4 for the whole scene's
 * sake, and `mats.water.environmentIntensity` was ladderred on the start view at 0.5, 1.0, 1.6 and 2.4 and
 * moved the water's three bands by one point and no more (`tools/pitfill.json`). So the surface was told to
 * become a mirror and given no mirror to be: at a graze the alpha goes up, the cyan goes down, and what is
 * left standing is an albedo of (0.02,0.045,0.045) — nearly black. That is the whole of the dark foot of
 * the start view, and the black blotches in it: the foot read L127 with the darkest facets of the chop at
 * L16-31, and the middle of the basin read L146.
 *
 * Two old explanations of that foot are now known to be wrong, and are written here so nobody buys them
 * again. It is NOT the shadow of the pool's own south wall: with `?noshadow=1` the foot and the middle move
 * by one point. And the floor under it is not in shade at all — take the water sheet out and the same three
 * places read L174, L203, L182 (`tools/pitfloor.json`), sunlit clean across the pit. The film did it.
 *
 * So the mirror is paid by hand, the way the pit's tiles are paid by hand:
 *
 *     finalEmissive += villaMirrorSky * villaMirror
 *
 * with `villaMirrorSky` the colour of what the surface actually sees — the dome over the pool and the pale
 * front of the house in it, [150,182,188] in `src/materials.js`. One factor, two uses: what the water stops
 * painting with its own colour it gets back as the sky's. And it shimmers by itself, because `villaMirror`
 * is read off the bumped normal: a facet that tilts catches more sky and its neighbour catches less.
 *
 * A second dial was built for this and then thrown away, and the reason is worth keeping. The sky was paid
 * steeper than the Fresnel — `pow(villaMirror, 2)` — on the theory that a flat sheet should not mirror while
 * only its facets do. Measured, that theory bought nothing: strength 2 at the square reads L142 at the foot,
 * L165 in the middle and L170 at the far water on the start camera, and strength 1 at the plain Fresnel
 * reads L142, L163 and L166 in the same three places — two points of luminance, which is nothing. From the
 * court, looking down, the same pair reads L130/L145 and L129/L147. So the second exponent is out and the
 * law that was already in the file is kept, which is the simpler story and the one a reader can check.
 *
 * Shipped: strength 1 at the plain Fresnel. On the start camera the water went from L126 to L142 over the
 * whole pool, the foot from L127 to L142, the middle from L146 to L163 and the far water from L147 to L166,
 * and the black troughs of the chop came up from L16-31 to about L98. Nothing new blew: 2.6% of the frame
 * over L200 before, 2.8% after. Three of the seventeen standing views moved, which is the three that can
 * see the water: `home` L113 to L116, `west` L109 to L110, `pool` L103 to L107.
 *
 * `?wsky=` in the url dials that term and `?wsky=0` takes it out again, which is how it was weighed
 * (`tools/watersky.json`, `tools/waterskydown.json`, read with `tools/bands.js`). `?wem=` dials the film's
 * strength with the material's own `emissiveIntensity`, and `?nofilmangle=1` puts the painted lid back so
 * the change can be weighed.
 */

const NEEDLE = "float alpha=albedoOpacityOut.alpha;";
// Where the library adds up what the surface emits. Everything this block declares — `finalEmissive` —
// sits in `main`'s own scope, so the line under the include can reach `villaFilmScale`, which is declared
// where the alpha is settled, forty lines earlier.
const EMIT_NEEDLE = "#include<pbrBlockFinalUnlitComponents>";

/** A number written the way GLSL wants a float: never `4`, always `4.0`. */
const glslNumber = (value) => {
	const text = String(value);
	return text.indexOf(".") < 0 && text.indexOf("e") < 0 ? text + ".0" : text;
};

/**
 * Installs the patched shader and hands it to `mat`. Answers {ok, why} so a tool can be told whether
 * it took, in the same style as `patchToneCurve`.
 */
export function installWaterAlpha(BABYLON, mat, { power = 4, filmAngle = true, mirror = 1, mirrorColor = [0.3, 0.46, 0.5], name = "villaWater" } = {}) {
	const p = glslNumber(power);
	// The mirror's colour may come as three bytes-in-linear-space numbers or as a Color3 off the material.
	const triple = Array.isArray(mirrorColor) ? mirrorColor : [mirrorColor.r, mirrorColor.g, mirrorColor.b];
	const sky = `vec3(${glslNumber(triple[0])},${glslNumber(triple[1])},${glslNumber(triple[2])})`;
	const skyTerm = mirror ? `*${glslNumber(mirror)}` : "";
	const store = BABYLON && BABYLON.Effect ? BABYLON.Effect.ShadersStore : null;
	if (!store) return { ok: false, why: "no Effect.ShadersStore to patch" };
	const vertex = store["pbrVertexShader"];
	const pixel = store["pbrPixelShader"];
	if (typeof pixel !== "string" || typeof vertex !== "string") {
		return { ok: false, why: "the library's pbr shaders are not in the store to patch" };
	}
	if (pixel.indexOf(NEEDLE) < 0) return { ok: false, why: `the alpha line this file expects is not in the shader: ${NEEDLE}` };
	if (filmAngle && pixel.indexOf(EMIT_NEEDLE) < 0) {
		return { ok: false, why: `the emission block this file expects is not in the shader: ${EMIT_NEEDLE}` };
	}

	const glsl =
		`${NEEDLE}` +
		"float villaFilmScale=1.0;" +
		"float villaMirror=0.0;" +
		"{float villaNdotV=clamp(abs(dot(normalize(normalW),normalize(viewDirectionW))),0.0,1.0);" +
		`villaMirror=pow(1.0-villaNdotV,${p});` +
		"alpha=clamp(alpha+(1.0-alpha)*villaMirror,0.0,1.0);" +
		(filmAngle ? "villaFilmScale=1.0-villaMirror;" : "") +
		"}";

	// The name is a parameter and not a constant, because the numbers below are baked into the text and not
	// passed as uniforms: two sheets of water with two different mirrors — the pool mirroring the sky, the
	// pond mirroring the palms that lean over it — need two patched shaders, or the second install would
	// silently repaint the first.
	store[name + "VertexShader"] = vertex;
	let patched = pixel.replace(NEEDLE, glsl);
	// The two half-terms of the angle, in the one place where the library has finished adding up what the
	// surface gives out: the water's own colour down by however much it mirrors, the sky's up by that much.
	if (filmAngle || mirror) {
		patched = patched.replace(
			EMIT_NEEDLE,
			`${EMIT_NEEDLE}\n` +
				(filmAngle ? "finalEmissive*=villaFilmScale;\n" : "") +
				(mirror ? `finalEmissive+=${sky}*villaMirror${skyTerm};\n` : "")
		);
	}
	store[name + "PixelShader"] = patched;
	mat.customShaderNameResolve = () => name;
	return {
		ok: true,
		power,
		filmAngle,
		text: `water alpha — power ${power}, based on the material's own alpha; the water's colour ${filmAngle ? "follows the same angle" : "does not"}`,
	};
}
