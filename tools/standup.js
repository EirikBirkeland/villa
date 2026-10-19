// Stands the Villa up the way a browser does — with no browser.
//
// Why this exists. On 2026-10-14 the owner's own Chromium opened the page and said:
//   "The Villa did not stand up: e.getChildMeshes is not a function or its return value is not iterable"
// and nothing in this folder could have seen it coming: `tools/feet.js` and `tools/draw.js` both
// stand the shadow lamp out, paint no canvas and run no post pipeline, so the whole path that broke
// was never walked. This tool walks it. It loads the Villa's real `src/main.js`, the file a browser
// loads, and gives it the least it needs to run here:
//
//   - a DOM: one canvas, a body, a window, and an address bar you can put switches on;
//   - a canvas 2d context that records what is painted and hands back blank pixels, so the
//     painted patterns still get made — they are just empty;
//   - `BABYLON.Engine` swapped for Babylon's own NullEngine, so no graphics card is wanted.
//
// Then it runs the render loop a few times, which is where `pool.animate` and the walking live.
// Anything that throws in a browser during standing up throws here too, with a real stack.
//
// What it cannot do: say anything about how the Villa looks. The patterns are blank and NullEngine
// draws nothing. For a picture, use `tools/draw.js`; for where the feet go, `tools/feet.js`.
//
//   node tools/standup.js                     -> stand it up, run 4 frames, report
//   node tools/standup.js --frames 30         -> more frames
//   node tools/standup.js --url "?view=..."   -> with address-bar switches
//   node tools/standup.js --key KeyW          -> hold a key down while the frames run (repeatable)
//   node tools/standup.js --quiet             -> only the answer and any fault

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const real = require("babylonjs");

const quiet = process.argv.includes("--quiet");
const frameIndex = process.argv.indexOf("--frames");
const FRAMES = frameIndex > 0 ? Number(process.argv[frameIndex + 1]) : 4;
const urlIndex = process.argv.indexOf("--url");
const SEARCH = urlIndex > 0 ? process.argv[urlIndex + 1] : "";
const KEYS = process.argv.flatMap((arg, i) => (process.argv[i - 1] === "--key" ? [arg] : []));

const say = (...line) => {
	if (!quiet) console.log(...line);
};

// ---------------------------------------------------------------- the painted canvas, faked
//
// Only what src/textures.js actually asks for. It counts the strokes so a pattern that painted
// nothing is visible in the report, and it hands back real pixel arrays so the noise code that
// reads them back gets a real (blank) image to mix into.

const paint = { rects: 0, paths: 0, strokes: 0, images: 0, gradients: 0, colours: new Set() };

function makeContext(canvas) {
	let image = null;
	const fresh = () => {
		if (!image || image.width !== canvas.width || image.height !== canvas.height) {
			image = { width: canvas.width, height: canvas.height, data: new Uint8ClampedArray(canvas.width * canvas.height * 4) };
		}
		return image;
	};
	const noop = () => {};
	const ctx = {
		canvas,
		fillStyle: "#000",
		strokeStyle: "#000",
		lineWidth: 1,
		lineCap: "butt",
		globalAlpha: 1,
		filter: "none",
		fillRect() {
			paint.rects++;
		},
		clearRect: noop,
		beginPath() {
			paint.paths++;
		},
		closePath: noop,
		// `clip` is used by the paving pattern (each slab is painted inside its own outline, so a vein cannot
		// leak into the joint). Without it here the Villa could not stand up under this tool at all, and the
		// fault reads as a fault in the Villa.
		clip: noop,
		transform: noop,
		arcTo: noop,
		setLineDash: noop,
		moveTo: noop,
		lineTo: noop,
		quadraticCurveTo: noop,
		ellipse: noop,
		arc: noop,
		rect: noop,
		fill: noop,
		strokeRect() {
			paint.strokes++;
		},
		stroke() {
			paint.strokes++;
		},
		save: noop,
		restore: noop,
		translate: noop,
		rotate: noop,
		scale: noop,
		setTransform: noop,
		drawImage() {
			paint.images++;
		},
		createLinearGradient() {
			paint.gradients++;
			return { addColorStop(stop, colour) { paint.colours.add(String(colour)); } };
		},
		createRadialGradient() {
			paint.gradients++;
			return { addColorStop(stop, colour) { paint.colours.add(String(colour)); } };
		},
		getImageData(x, y, w, h) {
			return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
		},
		createImageData(w, h) {
			return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
		},
		createPattern() {
			return { setTransform: noop };
		},
		measureText: (text) => ({ width: String(text).length * 8 }),
		fillText: noop,
		strokeText: noop,
		putImageData() {
			paint.images++;
		},
		_measure: () => paint.colours.size,
	};
	Object.defineProperty(ctx, "_image", { get: fresh });
	return ctx;
}

function makeCanvas(tag = "canvas") {
	const listeners = new Map();
	let ctx = null;
	const canvas = {
		tagName: tag,
		width: 1,
		height: 1,
		style: {},
		clientWidth: 1280,
		clientHeight: 720,
		getContext(kind) {
			if (kind !== "2d") return null;
			if (!ctx) ctx = makeContext(canvas);
			return ctx;
		},
		addEventListener(type, fn) {
			if (!listeners.has(type)) listeners.set(type, new Set());
			listeners.get(type).add(fn);
		},
		removeEventListener(type, fn) {
			const set = listeners.get(type);
			if (set) set.delete(fn);
		},
		dispatch(type, event) {
			for (const fn of listeners.get(type) || []) fn(event);
		},
		setPointerCapture() {},
		releasePointerCapture() {},
		requestPointerLock() {},
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
		toDataURL: () => "data:,",
	};
	return canvas;
}

const viewCanvas = makeCanvas("canvas");

const windowEvents = new Map();
const addedEventListener = (type, fn) => {
	if (!windowEvents.has(type)) windowEvents.set(type, new Set());
	windowEvents.get(type).add(fn);
};

const documentStub = {
	documentElement: { style: {}, clientWidth: 1280, clientHeight: 720 },
	body: { classList: { add() {}, remove() {}, contains: () => false }, style: {}, appendChild() {} },
	createElement: (tag) => makeCanvas(tag),
	getElementById: (id) => (id === "view" ? viewCanvas : null),
	querySelector: () => null,
	addEventListener: addedEventListener,
	removeEventListener: () => {},
	addEventListenerCount: () => windowEvents.size,
};

const windowStub = {
	document: documentStub,
	location: { search: SEARCH, href: `http://localhost:8090/villa/${SEARCH}` },
	devicePixelRatio: 1,
	innerWidth: 1280,
	innerHeight: 720,
	addEventListener: addedEventListener,
	removeEventListener: () => {},
	setTimeout: (...args) => globalThis.setTimeout(...args),
	clearTimeout: (...args) => globalThis.clearTimeout(...args),
	requestAnimationFrame: (fn) => globalThis.setTimeout(() => fn(Date.now()), 16),
	PointerEvent: function PointerEvent() {},
	Event: function Event() {},
	getComputedStyle: () => ({ getPropertyValue: () => "" }),
};

global.window = windowStub;
global.document = documentStub;
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "node standup", platform: "node", maxTouchPoints: 0 }, configurable: true, writable: true });
global.self = windowStub;
global.HTMLCanvasElement = viewCanvas.constructor;
global.HTMLElement = Object;
global.ImageBitmap = class ImageBitmap {};
global.requestAnimationFrame = windowStub.requestAnimationFrame;

// ---------------------------------------------------------------- the engine, swapped
//
// The Villa's own code reads `BABYLON` off the global, so that is where the swap is made: every
// class is the real one, except the engine, which becomes Babylon's NullEngine and records the
// render loop instead of Babylon running it, so this tool can step it by hand.

const seen = { engine: null, loop: null, creates: 0 };

class QuietEngine extends real.NullEngine {
	constructor(canvas, options) {
		super();
		seen.engine = this;
		this._canvas = canvas || null;
	}
	getDeltaTime() {
		return 16;
	}
	getRenderWidth() {
		return 1280;
	}
	getRenderHeight() {
		return 720;
	}
	resize() {}
	runRenderLoop(callback) {
		seen.loop = callback;
	}
	stopRenderLoop() {
		seen.loop = null;
	}
}

global.BABYLON = new Proxy(real, {
	get: (target, key) => (key === "Engine" ? QuietEngine : target[key]),
	set: (target, key, value) => ((target[key] = value), true),
});

// The same extra library files the page loads, so the classes they add to BABYLON are the ones the
// browser uses: `SkyMaterial` comes from here, and `buildSky` would not stand up without it.
require("../vendor/materials/babylonjs.materials.min.js");

// ---------------------------------------------------------------- stand it up

const errors = [];
const onerror = (where) => (error) => {
	errors.push({ where, error });
};
windowStub.addEventListener("error", onerror("window error handler"));

let villa = null;
const started = Date.now();
try {
	await import("../src/main.js");
	villa = window.__villa;
	if (!villa) throw new Error("main.js loaded but never set window.__villa — it stopped short of the end");
} catch (error) {
	console.error("\nTHE VILLA DID NOT STAND UP");
	console.error(error && error.stack ? error.stack : error);
	process.exit(1);
}

if (!seen.engine || !seen.loop) {
	console.error("\nTHE VILLA DID NOT STAND UP: main.js finished but left no engine and no render loop.");
	process.exit(1);
}

const scene = villa.scene;
const realRender = scene.render.bind(scene);
let rendered = 0;
scene.render = () => {
	rendered++;
	try {
		realRender();
	} catch (error) {
		errors.push({ where: "scene.render", error });
	}
};

say(`stood up in ${((Date.now() - started) / 1000).toFixed(1)} s: ${scene.meshes.length} meshes, ${scene.lights.length} lights, ${scene.materials.length} materials, ${scene.textures.length} textures`);
say(`painted canvases: ${paint.rects} filled rectangles, ${paint.paths} paths, ${paint.strokes} strokes, ${paint.images} images, ${paint.gradients} gradients, ${paint.colours.size} colours asked for`);
say(`camera starts at ${["x", "y", "z"].map((k) => villa.camera.position[k].toFixed(2)).join(", ")}; the ground under the start is ${villa.ground.heightAt(villa.camera.position.x, villa.camera.position.z).toFixed(2)} high`);
if (SEARCH) say(`address bar: ${SEARCH}`);

// Now the frames. The engine is Null, so nothing is drawn: what is being looked for is a throw in
// the walking and the pool animation, which is code that runs every single frame.
const press = (code) => {
	for (const fn of windowEvents.get("keydown") || []) fn({ code, preventDefault() {}, repeat: false });
};
for (const code of KEYS) press(code);

const first = villa.camera.position.clone();
for (let frame = 0; frame < FRAMES; frame++) {
	try {
		seen.loop();
	} catch (error) {
		errors.push({ where: `frame ${frame + 1}`, error });
		break;
	}
}
const moved = villa.camera.position.subtract(first);

if (KEYS.length) {
	const at = villa.camera.position;
	const off = at.y < -1 || at.y > 6 || Math.abs(at.x) > 60 || Math.abs(at.z) > 60;
	console.log(`  held ${KEYS.join(", ")} and ended at ${at.x.toFixed(2)}, ${at.y.toFixed(2)}, ${at.z.toFixed(2)}${off ? " — OUT OF THE GARDEN, that is a fault" : " (still in the garden)"}`);
	if (off) process.exit(1);
}

if (errors.length) {
	console.error(`\nFAULTS SEEN (${errors.length})`);
	for (const { where, error } of errors) {
		console.error(`  in ${where}: ${error && error.message ? error.message : error}`);
		if (error && error.stack) console.error(error.stack.split("\n").slice(1, 6).map((l) => `    ${l.trim()}`).join("\n"));
	}
	process.exit(1);
}

say(`${FRAMES} frames through the render loop: ${rendered} renders, camera moved ${moved.length().toFixed(3)} m, no fault.`);
console.log("the Villa stands up, and its render loop runs clean.");
