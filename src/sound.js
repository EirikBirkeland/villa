// The Villa's sounds: things that go croak, chirp, caw and tink.
//
// WHY A WHOLE FILE FOR IT. Until now this Villa has been entirely mute: everything in it could be looked at
// and nothing could be heard, and a garden you can walk in the dark of, with frogs on the pond stones and a
// cat of a shark in the water, is not a garden that is quiet. Sound is also the one sense this Villa has
// never had, and the cheapest to add — no model, no texture, no download.
//
// NO FILES ARE FETCHED, and none will be. Every sound here is built out of oscillators and filtered noise at
// the moment it is asked for, which keeps the Villa inside this folder as it must be, keeps the first picture
// instant, and means a call can be placed at a metre and a half from the ear or thirty, and be quiet there.
// What is synthesised is not a recording of a frog and does not pretend to be: it is the SHAPE of the thing —
// a low pulse train for the frog, a high pip-pip-pip for a small gecko, a rasp for a raven, a ring for a coin
// — and it is mixed low behind the picture rather than in front of it.
//
// THE BROWSER WILL NOT MAKE A NOISE UNTIL A PERSON HAS TOUCHED THE PAGE. That is a rule of the platform and
// not a choice: an `AudioContext` starts suspended and stays there until a click or a key. So the Villa stays
// silent through the first picture — which is what the house rules ask for anyway — and `arm()` is called from
// the first pointer or key press. `M` mutes, and the muting is remembered while the page lasts.
//
// WHERE A SOUND COMES FROM. Every call is placed with a `PannerNode` at the thing that makes it — the stone
// the frog is on, the patch of wall the gecko is stuck to, the roof tree the raven is standing on — and the
// ear is the camera. A croak from the pond behind you is therefore behind you and quiet, and the same croak
// at arm's length is loud and in front. The listener is written from the camera every frame.

import { randomGenerator } from "./noise.js";

/**
 * How loud each kind of call is, against the master gain. Worked out by ear against the mix, and the frog is
 * the loudest of them because it is the farthest away when it is heard at all.
 */
export const LEVEL = {
	frog: 0.5,
	gecko: 0.3,
	raven: 0.6,
	coin: 0.2,
};

/** No more of these at once. A pond full of frogs all starting together is a wall of buzz. */
const MAX_VOICES = 14;

export function buildSound(camera) {
	const rand = randomGenerator(9);
	let ctx = null;
	let master = null;
	let voices = 0;
	let muted = false;
	let armedBy = null;

	const state = {
		/** Called from the first click or key. Nothing is heard before it, and nothing is heard without it. */
		arm(how) {
			if (ctx) return ctx;
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return null;
			ctx = new AC();
			master = ctx.createGain();
			master.gain.value = muted ? 0 : 0.9;
			master.connect(ctx.destination);
			armedBy = how || "click";
			return ctx;
		},

		get ready() {
			return !!ctx && ctx.state === "running";
		},
		get context() {
			return ctx;
		},
		get muted() {
			return muted;
		},
		get armedBy() {
			return armedBy;
		},

		toggle() {
			muted = !muted;
			if (master) master.gain.value = muted ? 0 : 0.9;
			return muted;
		},

		/** Put the ear where the camera is. Called every frame; it is five number writes and costs nothing. */
		listen() {
			if (!ctx) return;
			const l = ctx.listener;
			const p = camera.position;
			const f = camera.getForwardRay ? camera.getForwardRay().direction : { x: 0, y: 0, z: 1 };
			if (l.positionX) {
				l.positionX.value = p.x;
				l.positionY.value = p.y;
				l.positionZ.value = p.z;
				l.forwardX.value = f.x;
				l.forwardY.value = f.y;
				l.forwardZ.value = f.z;
				l.upX.value = 0;
				l.upY.value = 1;
				l.upZ.value = 0;
			} else if (l.setPosition) {
				l.setPosition(p.x, p.y, p.z);
				l.setOrientation(f.x, f.y, f.z, 0, 1, 0);
			}
		},

		/**
		 * Make a noise at a place in the garden.
		 *
		 * `what` is the kind — `frog`, `gecko`, `raven`, `coin`. `at` is a place (anything with x, y, z) and
		 * `loud` scales it. Returns whether anything was actually made, so a caller can spend its voice budget
		 * honestly and a tool can count what was tried and what was heard.
		 */
		play(what, at, loud = 1) {
			if (!ctx || muted || !VOICES[what]) return false;
			if (ctx.state === "suspended") ctx.resume().catch(() => {});
			if (voices >= MAX_VOICES) return false;
			const head = ctx.createGain();
			head.gain.value = (LEVEL[what] || 0.4) * loud;
			const pan = ctx.createPanner();
			pan.panningModel = "equalpower";
			pan.distanceModel = "inverse";
			pan.refDistance = 2.4;
			pan.maxDistance = 45;
			pan.rolloffFactor = 1.1;
			if (pan.positionX) {
				pan.positionX.value = at.x;
				pan.positionY.value = at.y;
				pan.positionZ.value = at.z;
			} else if (pan.setPosition) {
				pan.setPosition(at.x, at.y, at.z);
			}
			head.connect(pan);
			pan.connect(master);
			voices += 1;
			const stop = VOICES[what](ctx, head, rand);
			// The voice is given back when the sound it made has run out. `onended` cannot do this: it belongs to
			// the oscillators, which are buried inside the voice and out of reach here, and a gain node never
			// fires it at all — so a counter wired to it never comes back down and the garden goes silent for
			// want of a budget spent on ghosts.
			window.setTimeout(() => {
				voices = Math.max(0, voices - 1);
				try {
					head.disconnect();
					pan.disconnect();
				} catch (gone) {
					/* already taken apart: nothing to say about it */
				}
			}, Math.max(60, (stop + 0.08) * 1000));
			return true;
		},

		/** How many are sounding or recently were. For `tools/sound.js` and for anybody counting. */
		get voices() {
			return voices;
		},
	};

	return state;
}

/**
 * The voices. Each one is given the context, a gain to hang its parts on, and the Villa's own random source,
 * and each one returns how many seconds it will take — which is what `play` waits on before giving the voice
 * back to the pool.
 */
export const VOICES = {
	/**
	 * A frog: a low pulse train, three or four of them, each one a grind and not a whistle.
	 *
	 * The animal is built out of a low sawtooth pushed through a narrow band — a frog has no lips to whistle
	 * with, it pushes air through a slit and the whole throat resonates, which is why the sound has a bump in
	 * it around 600 Hz and not much above — and the grind inside each pulse comes from opening and shutting it
	 * thirty times a second. That buzz inside the note is the whole of what makes it a frog and not a phone.
	 */
	frog(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.02;
		const notes = 2 + Math.floor(rand() * 3);
		const low = 96 + rand() * 34;
		for (let i = 0; i < notes; i++) {
			const at = t0 + i * (0.2 + rand() * 0.05);
			const dur = 0.13 + rand() * 0.09;
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			// Each note a shade lower than the last: a frog's breath goes out and its pitch goes with it.
			osc.frequency.setValueAtTime(low * (1 - i * 0.06), at);
			const mouth = ctx.createBiquadFilter();
			mouth.type = "bandpass";
			// Measured with `tools/ears.js`: at 560 Hz the croak came out at the same register as the gecko's
			// whistle two metres away, which made one animal and not two. A bullfrog's throat is a big one and
			// its bump sits lower than that.
			mouth.frequency.value = 400 + rand() * 150;
			mouth.Q.value = 5.5;
			const env = ctx.createGain();
			const grind = ctx.createGain();
			grind.gain.value = 0.62;
			// The rasp, at about thirty openings a second.
			const rasp = ctx.createOscillator();
			rasp.type = "square";
			rasp.frequency.value = 24 + rand() * 12;
			const raspDepth = ctx.createGain();
			raspDepth.gain.value = 0.38;
			rasp.connect(raspDepth);
			raspDepth.connect(grind.gain);
			env.gain.setValueAtTime(0, at);
			env.gain.linearRampToValueAtTime(0.9, at + 0.02);
			env.gain.setValueAtTime(0.9, at + dur * 0.6);
			env.gain.exponentialRampToValueAtTime(0.001, at + dur);
			osc.connect(mouth);
			mouth.connect(grind);
			grind.connect(env);
			env.connect(out);
			osc.start(at);
			osc.stop(at + dur + 0.02);
			rasp.start(at);
			rasp.stop(at + dur + 0.02);
		}
		return notes * 0.25 + 0.2;
	},

	/**
	 * A small gecko: three to six high pips, each one a descending chirp, and all of them quiet.
	 *
	 * This is the house gecko of this climate, which is a palm of a animal and sounds like a whistle being
	 * squeezed. Nothing about it is low: the whole call sits between 2 and 3.5 kHz, and the reason it reads as
	 * cute and not as a warning is that each pip falls a little as it dies.
	 */
	gecko(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.02;
		const pips = 3 + Math.floor(rand() * 4);
		const top = 2500 + rand() * 700;
		for (let i = 0; i < pips; i++) {
			const at = t0 + i * (0.14 + rand() * 0.05);
			const dur = 0.05 + rand() * 0.03;
			const osc = ctx.createOscillator();
			osc.type = "triangle";
			const from = top * (1 - i * 0.035);
			osc.frequency.setValueAtTime(from, at);
			osc.frequency.exponentialRampToValueAtTime(from * 0.78, at + dur);
			const air = ctx.createBiquadFilter();
			air.type = "bandpass";
			air.frequency.value = from * 1.05;
			air.Q.value = 2.4;
			const env = ctx.createGain();
			env.gain.setValueAtTime(0, at);
			env.gain.linearRampToValueAtTime(0.55 * (1 - i * 0.06), at + 0.008);
			env.gain.exponentialRampToValueAtTime(0.001, at + dur);
			osc.connect(air);
			air.connect(env);
			env.connect(out);
			osc.start(at);
			osc.stop(at + dur + 0.01);
		}
		return pips * 0.19 + 0.1;
	},

	/**
	 * A raven: two caws, the second one lower, and a rasp through both.
	 *
	 * A crow's call is a saw being pulled through a wet strap — a tone with a rough edge and a downward slide,
	 * and about a third of it is noise. The waveshaper is what gives it the edge: a bare oscillator, however
	 * buzzy, sounds like a telephone and not like a bird.
	 */
	raven(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.02;
		const curve = new Float32Array(64);
		for (let i = 0; i < 64; i++) {
			const x = (i / 63) * 2 - 1;
			curve[i] = Math.tanh(x * 3.4);
		}
		let last = 0;
		for (let c = 0; c < 2; c++) {
			const at = t0 + c * (0.34 + rand() * 0.08);
			const dur = 0.22 + rand() * 0.08;
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			const f = (420 - c * 60) * (0.94 + rand() * 0.12);
			osc.frequency.setValueAtTime(f * 1.16, at);
			osc.frequency.exponentialRampToValueAtTime(f * 0.72, at + dur);
			const rasp = ctx.createGain();
			const wobble = ctx.createOscillator();
			wobble.type = "square";
			wobble.frequency.value = 52 + rand() * 18;
			const wobDepth = ctx.createGain();
			wobDepth.gain.value = 0.42;
			wobble.connect(wobDepth);
			wobDepth.connect(rasp.gain);
			const shaper = ctx.createWaveShaper();
			shaper.curve = curve;
			shaper.oversample = "2x";
			const throat = ctx.createBiquadFilter();
			throat.type = "bandpass";
			throat.frequency.value = 1250;
			throat.Q.value = 1.6;
			const env = ctx.createGain();
			env.gain.setValueAtTime(0, at);
			env.gain.linearRampToValueAtTime(0.8, at + 0.03);
			env.gain.setValueAtTime(0.72, at + dur * 0.7);
			env.gain.exponentialRampToValueAtTime(0.001, at + dur);
			osc.connect(shaper);
			shaper.connect(throat);
			throat.connect(rasp);
			rasp.gain.value = 0.6;
			rasp.connect(env);
			env.connect(out);
			osc.start(at);
			osc.stop(at + dur + 0.02);
			wobble.start(at);
			wobble.stop(at + dur + 0.02);
			last = at + dur;
		}
		return last - ctx.currentTime + 0.1;
	},

	/**
	 * A coin on the paving: a small metal ring and a tick, and gone in a third of a second.
	 *
	 * Two partials a fifth or so apart, decaying at different rates, which is what makes metal sound like
	 * metal and not like a beep. Turned down twice — the partials themselves and again in `LEVEL` — because the
	 * raw voice came out at 0.90 of full scale against the frog's 0.23 (`tools/ears.js`), and a gold coin
	 * landing in an empty garden should be heard and not announced. It now measures about as loud as a frog.
	 */
	coin(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.01;
		const root = 1900 + rand() * 500;
		for (const [ratio, decay, peak] of [[1, 0.3, 0.34], [1.53, 0.19, 0.23], [2.41, 0.1, 0.11]]) {
			const osc = ctx.createOscillator();
			osc.type = "sine";
			osc.frequency.value = root * ratio * (0.99 + rand() * 0.02);
			const env = ctx.createGain();
			env.gain.setValueAtTime(0, t0);
			env.gain.linearRampToValueAtTime(peak, t0 + 0.004);
			env.gain.exponentialRampToValueAtTime(0.001, t0 + decay);
			osc.connect(env);
			env.connect(out);
			osc.start(t0);
			osc.stop(t0 + decay + 0.02);
		}
		return 0.36;
	},
};
