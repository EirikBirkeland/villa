/**
 * The tone curve: how the light the engine works in gets squeezed into a screen.
 *
 * The library's own curve — Khronos PBR Neutral — leaves everything under 0.76 of raw light on a
 * straight line and bends the rest over so that the brightest channel of any colour lands just under
 * white. That is a good curve and the Villa ran on it, and it has one fault left in it here: the bend
 * is so flat that the whole of the sunlit half of the Villa lands in the last fifteen bytes of the
 * picture. Measured before this file was written, the start view painted its lit plaster at (254,226,204),
 * its sunlit cement at (253,223,183), a sunlit pot at (253,193,168) and a sunlit teak post at
 * (252,182,143): red at 252-254 in every case, which is the ceiling, so no pattern painted on a sunlit
 * surface can show and no lit surface is brighter than any other by more than a point or two.
 *
 * The curve here is the library's own, with the two numbers the library hard-codes made knobs:
 *
 *   knee   where the bend starts (the library fixes it at 0.76)
 *   white  what the very brightest light in the world is worth on the screen (the library fixes it
 *          at 1.0, which is the ceiling; the Villa keeps that, so a sun glint can still be white)
 *   desat  how much white is mixed into a colour that had to be folded a long way (library 0.15)
 *
 * With knee 0.76, white 1.0 and desat 0.15 this is byte for byte the library's curve — `?tonemap=khronos`
 * puts it back so any change can be weighed against it in one browser — and the maths is the same shape:
 * the colour is taken as a whole and not one channel at a time, so a lit surface keeps its own hue.
 *
 * Lowering `knee` starts the bend earlier, which buys room at the top but takes light off the upper
 * middle of the picture, so it is paid for and measured, not assumed.
 */

// The library's own curve, written the way this file writes curves.
export const KHRONOS_TONE = { knee: 0.76, white: 1.0, desat: 0.15 };

// What the Villa ships. Set by measurement in the browser, surface by surface, and written down in
// the comment at the bottom of this file.
export const VILLA_TONE = { knee: 0.5, white: 1.0, desat: 0.05 };

/** A number written the way GLSL wants a float: never `1`, always `1.0`. */
const glslNumber = (value) => {
	const text = String(value);
	return text.indexOf(".") < 0 && text.indexOf("e") < 0 ? text + ".0" : text;
};

/**
 * The shader's share of the curve, as the text of a function the library's image processing pass
 * calls. One colour in, one colour out; `peak` is the brightest channel and the whole colour is
 * scaled by the same factor, so hue survives.
 */
export function toneGLSL(p) {
	return (
		`const float VillaToneKnee=${glslNumber(p.knee)};` +
		`const float VillaToneWhite=${glslNumber(p.white)};` +
		`const float VillaToneDesaturation=${glslNumber(p.desat)};` +
		"vec3 VillaToneMapping(vec3 color){" +
		"float x=min(color.r,min(color.g,color.b));" +
		"float offset=x<0.08 ? x-6.25*x*x : 0.04;" +
		"color-=offset;" +
		"float peak=max(color.r,max(color.g,color.b));" +
		"if(peak<VillaToneKnee)return color;" +
		"float a=VillaToneWhite-VillaToneKnee;" +
		"float newPeak=VillaToneWhite-(a*a)/(peak+VillaToneWhite-2.0*VillaToneKnee);" +
		"color*=newPeak/peak;" +
		"float g=1.0-1.0/(VillaToneDesaturation*(peak-newPeak)+1.0);" +
		"return mix(color,vec3(newPeak),g);}"
	);
}

/** The same curve for a colour on the CPU, worked in the same order as the shader works it. */
export function applyTone(colour, p, out = [0, 0, 0]) {
	const low = Math.min(colour[0], Math.min(colour[1], colour[2]));
	const offset = low < 0.08 ? low - 6.25 * low * low : 0.04;
	const r = colour[0] - offset;
	const g = colour[1] - offset;
	const b = colour[2] - offset;
	const peak = Math.max(r, Math.max(g, b));
	if (peak < p.knee) {
		out[0] = r;
		out[1] = g;
		out[2] = b;
		return out;
	}
	const a = p.white - p.knee;
	const newPeak = p.white - (a * a) / (peak + p.white - 2 * p.knee);
	const scale = newPeak / peak;
	const mix = 1 - 1 / (p.desat * (peak - newPeak) + 1);
	out[0] = r * scale + (newPeak - r * scale) * mix;
	out[1] = g * scale + (newPeak - g * scale) * mix;
	out[2] = b * scale + (newPeak - b * scale) * mix;
	return out;
}

/** How far one raw value is folded: `f(peak)` at peak = value. A scalar view of the curve. */
export function tonePeak(value, p) {
	if (value < p.knee) return value;
	const a = p.white - p.knee;
	return p.white - (a * a) / (value + p.white - 2 * p.knee);
}

// The two places in the library's image processing pass that this file rewrites. Both are matched
// loosely enough to survive a re-format of the library and tightly enough that a miss is a miss.
const DEFINITION = /const float PBRNeutralStartCompression[\s\S]*?return mix\(color,newPeak\*vec3\(1,1,1\),g\);\}/;
const CALL = /(result|color)\.rgb=PBRNeutralToneMapping\(\1\.rgb\);/g;

/**
 * Put the Villa's curve into the library's shader source. Call this once, before any rendering
 * pipeline is built: the pass that uses it is compiled when the pipeline is made, and a compiled
 * shader is not looked at again.
 *
 * `curve` is "villa", "khronos" (the library's own numbers, for weighing a change against), or
 * "lin" (no curve at all, which is how a raw light value is read off a picture). It answers what it
 * did, so a tool can refuse to believe a run that quietly left the library's curve in.
 */
export function patchToneCurve(BABYLON, curve = "villa", over = {}) {
	// "neutral" is what this curve was called while it was the library's own; the old probe files say it.
	const name = curve === "neutral" ? "khronos" : curve;
	const store = BABYLON && BABYLON.Effect ? BABYLON.Effect.IncludesShadersStore : null;
	const source = store ? store.imageProcessingFunctions : null;
	if (typeof source !== "string") return { ok: false, curve: name, why: "the library's imageProcessingFunctions include is not there to patch" };

	const clean = {};
	for (const knob of ["knee", "white", "desat"]) {
		if (Number.isFinite(over[knob])) clean[knob] = over[knob];
	}
	const params = { ...(name === "khronos" ? KHRONOS_TONE : VILLA_TONE), ...clean };
	let body;
	if (name === "lin") {
		body = "vec3 VillaToneMapping(vec3 color){return color;}";
	} else {
		body = toneGLSL(params);
	}

	const defined = source.replace(DEFINITION, body);
	const called = defined.replace(CALL, "$1.rgb=VillaToneMapping($1.rgb);");
	if (defined === source || !called.includes("VillaToneMapping(")) {
		return { ok: false, curve: name, why: "the library's tone mapping was not where this file expects it to be" };
	}
	store.imageProcessingFunctions = called;
	return { ok: true, curve: name, ...params, text: `curve ${name} — knee ${params.knee}, white ${params.white}, desaturation ${params.desat}` };
}

// Why knee 0.5, white 1.0 and desaturation 0.05 ship, and why the exposure went 0.72 -> 0.76 with
// them. All of it measured in Chromium with tools/rawlight.js (which reads the light off the screen
// with no curve in the shader at all) and the ladders in tools/toneprobe.json and tools/tonefine.json.
//
// The light, on the start view, in the units the curve works in:
//
//   sky over the lawn        0.27      teak post in the sun   1.62
//   hedge in its own shade   0.40      granite in the sun     1.92
//   water                    0.56      coping in the sun      2.25
//   paving in the sun        0.64      cement at the deck foot 2.56
//   lawn in the sun          0.94      plaster in the sun     2.83
//
// The library's curve turns the last five of those — a factor of 1.75 in light, everything the sun
// touches — into 245, 247, 249, 250, 251: six bytes, and a surface one step under the top of the
// picture is two bytes under it. That is fault 1, and it is why nothing painted on a sunlit surface
// could be seen: the pot, the cement, the plaster and a teak post all arrived at red 250-254.
//
// The Villa's curve puts the same five at 231, 235, 238, 240, 241, and the seven sunlit surfaces from
// the lawn up over 30 bytes where the library gave them 13. It leaves everything under the knee alone
// — the sky, the water, the hedge and the shaded walls come out within a point or two of where they
// were. The white point was weighed at 0.94, 0.96 and 1.0: it barely moves the sunlit half (29 bytes
// of room at 0.96 against 30 at 1.0) and what it does move is the very top, where a sun glint on the
// water and a lamp's glass live; capping it at 0.96 holds the whole Villa under byte 247 and takes the
// white out of those, so it stays where the library puts it.
//
// The desaturation matters more than it looks, and not the way you would guess. It mixes white into a
// colour in proportion to how far the curve had to fold it, so a knee that folds everything the sun
// touches makes the library's 0.15 bury the very colour the knee was moved for: on the colonnade,
// where the sunlit band is all teak and glass, that band's own channel spread is 60 as the Villa
// stands, 58 with the knee moved and the desaturation left alone — worse, not better — and 83 with
// the desaturation down to 0.06 beside it. 0.05 ships. 0.03 was weighed and gave 97, and refused: at
// that rate the few highlights that genuinely do go white, a sun glint on the water and a lamp's glass,
// were going orange on it.
//
// What the whole frame says, over the sixteen standing views (pictures/471-486 against 503-518),
// where the Villa ran on the library's curve and now runs on its own:
//
//   light          within 2 points of what it was on every one of the sixteen (colonnade -2, rear +2, westwall +2)
//   in colour      up on all sixteen: pool 93.2% -> 94.7%, westwall 69.7% -> 71.2%, southborder 98.1 -> 98.4
//   past L240      down on all sixteen: rearcorner 3.2% -> 0.1%, southborder 2.4% -> 0.1%, pool 4.7% -> 1.1%
//   below L31      down everywhere, nothing blackened: westwall 2.9% -> 2.3%, rear 1.6% -> 1.3%
//   lit band s     home 75 -> 85, colonnade 60 -> 86, path 69 -> 81, sala 94 -> 101, eastlawn 108 -> 112
//
// The exposure goes from 0.72 to 0.76 to hand back the light the fold takes off the sunlit half; it is
// a straight multiplier below the knee, so the shade and the sky buy their light back and the sunlit
// half, which is what was too bright, does not. Measured at 0.72 the start view stands three points
// under where it is today, at 0.76 one point off it.
//
// The levers stay on the address bar — ?knee=, ?white=, ?desat=, and ?tonemap=khronos for the library's
// own numbers — so any of this can be weighed again in one browser instead of argued about.
