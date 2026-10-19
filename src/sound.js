// The Villa's sounds: things that go croak, chirp, caw and tink.
//
// WHY A WHOLE FILE FOR IT. Until now this Villa has been entirely mute: everything in it could be looked at
// and nothing could be heard, and a garden you can walk in the dark of, with frogs on the pond stones and a
// cat of a shark in the water, is not a garden that is quiet. Sound is also the one sense this Villa has
// never had, and the cheapest to add — no model, no texture, no download.
//
// NO FILES ARE FETCHED BEFORE THE EAR IS WOKEN, and that is the whole of the rule about files. Every synthesised
// sound here is built out of oscillators and filtered noise at the moment it is asked for, which keeps the first
// picture instant and means a call can be placed at a metre and a half from the ear or thirty, and be quiet
// there. What is synthesised is not a recording of a frog and does not pretend to be: it is the SHAPE of the
// thing — a low pulse train for the frog, a high pip-pip-pip for a small gecko, a rasp for a raven, a ring for a
// coin — and it is mixed low behind the picture rather than in front of it.
//
// THE ONE RECORDING, and why it is allowed. `sounds/frogs-night.mp3` is a real pond of frogs, recorded by WIM
// and borrowed from freesound.org under a CC-BY licence; `sounds/CREDITS.md` says so, and the Villa says so too.
// A recording is worth having where a shape is not enough, and a frog chorus is the case: three hundred animals
// arguing on a pond is not five oscillators. So the frog's call is now a slice of the real thing, and the
// recording is FETCHED ONLY AFTER THE EAR IS ARMED — the first picture is drawn and the first step taken with no
// sound file asked for at all. Until the file has been read, and if it cannot be read at all, the garden falls
// back on the synthesised croak above, so a missing file costs a shade of realism and nothing else.
//
// WHY A SLICE AND NOT THE WHOLE THIRTY-FOUR SECONDS. The scheduler in `src/creatures.js` places a call at a
// stone, at a distance, and the whole pleasure of a placed sound is that it is somewhere: a thirty-four second
// chorus looped at one stone would be a pond that never stops talking and a panner lying about it. A one-to-two
// second slice, started at a random point in the recording, is the same animals heard at a different moment of
// their argument, and the voice budget still means something.
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
 * The recordings the Villa owns, and the slice taken from each. A name here wins over the synthesised voice of
 * the same name, and the voice stays in the file underneath as the fallback.
 *
 * `slice` is the shortest and longest piece taken from the recording, in seconds.
 */
const RECORDINGS = {
	// `trim` is the recording's own volume against `LEVEL`. It is not a guess: the borrowed chorus, brought to a
	// known peak, came out at 0.449 against the synthesised croak's 0.117 at the same LEVEL — three and a half
	// times as loud, which is a pond shouting over the whole garden. Trimmed to a third it sits just above one
	// animal's call, which is what a chorus a hundred metres away ought to do.
	frog: { file: "sounds/frogs-night.mp3", slice: [1.0, 2.1], trim: 0.34 },
	// The house gecko of this climate, recorded in the Philippines: a string of hard "tok" pulses ending in a
	// drawn-out squeak. Short slices, because the animal says three or four syllables and no more, and trimmed
	// hard, because a tokay recorded at the microphone is a scream and a gecko two metres up a wall is not.
	gecko: { file: "sounds/gecko-tokay.mp3", slice: [0.55, 1.5], trim: 1.3 },
	// The trickle: droplets over stone, recorded close up. Twelve and a half seconds, which is short enough
	// that where the loop is cut matters — so `loopVoice` looks for quiet places to cut at instead of running
	// the file end to end.
	trickle: { file: "sounds/stream-trickle.mp3", slice: [1.0, 3.0], trim: 1 },
};

/** The file behind each recording, for a tool that wants to weigh it without waking the ear. */
export const RECORDING_FILES = Object.fromEntries(Object.entries(RECORDINGS).map(([n, s]) => [n, s.file]));
export const recordingSpec = (name) => RECORDINGS[name] || { slice: [0.8, 1.6] };

/**
 * The gain that brings a recording to a known loudness, so a borrowed file and a synthesised voice can be
 * balanced by `LEVEL` alone instead of by guessing at how loud somebody else's microphone was.
 *
 * TWO numbers are needed and not one. A peak alone is at the mercy of a single crack — a mic bumped, one shout
 * closer than the rest — and a whole minute of frogs normalised to a peak of 0.9 is a wall of sound. So the
 * steady loudness (the root mean square) is what the gain is set by, and the peak is only a ceiling: the file is
 * brought up until its average sits at a twelfth of full scale, and never so far that its loudest moment goes
 * past nine tenths. Every seventh sample is enough for both: a fraction of a decibel either way.
 */
export function recordingGain(buffer) {
	let peak = 0;
	let sum = 0;
	let n = 0;
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < data.length; i += 7) {
			const v = Math.abs(data[i]);
			if (v > peak) peak = v;
			sum += v * v;
			n++;
		}
	}
	const rms = Math.sqrt(sum / Math.max(1, n));
	return Math.min(0.9 / Math.max(peak, 0.0001), 0.12 / Math.max(rms, 0.0001));
}

/**
 * How loud each kind of call is, against the master gain. Worked out by ear against the mix, and the frog is
 * the loudest of them because it is the farthest away when it is heard at all.
 */
export const LEVEL = {
	frog: 0.5,
	gecko: 0.3,
	raven: 0.6,
	coin: 0.2,
	shot: 0.34,
	launch: 0.3,
	// Measured: at 0.95 the blast came out at 1.01 of full scale — past the top of the numbers, which
	// is a click and not a boom. Half that is the loudest thing in the garden by a distance and still fits.
	boom: 0.5,
	// Held sounds: a bed that is going all the time rather than a call, heard at the ear's own distance.
	// `loopVoice` hands the file to `recordingGain`, which brings a recording's steady loudness to a known level,
	// so the number below balances against the calls the bed sits under instead of guessing at somebody else's
	// microphone. There is no cricket bed: the one that was tried turned out to be a wind in a file, and the
	// master asked what the waterfall was. See `src/main.js`.
	// The channel's trickle. Sixty-two metres of water were silent for a session; this folder then tried to
	// voice them out of filtered noise and the master's word for the result was unprintable and fair — a
	// band-passed hiss is a hiss and never was water. So the water has a TRICKLE, small and borrowed, heard only
	// from the bank, and `M` takes it away with the frogs and the gecko as it takes away everything else.
	trickle: 0.12,
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
	// Each loaded recording, once read: its samples and the gain that brings its loudest moment to about full
	// scale, so that a recording and a synthesised voice can be balanced against each other by `LEVEL` alone
	// instead of by guessing at how loud somebody else's microphone was.
	const recordings = {};
	let loading = null;
	let loadError = "";
	// Held sounds: chains that are started once and ridden up and down with the visitor's distance, rather than
	// voices that are made, played and thrown away. See `startMurmur`.
	const murmurs = [];

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
			// And now, and not before, the recording is asked for: after the first picture, after the first
			// gesture, and never at all if the ear was never woken.
			state.loadRecordings();
			return ctx;
		},

		/**
		 * Read every recording in `RECORDINGS` into the context. Safe to call twice; it keeps the first promise.
		 * A file that will not come, or audio that will not decode, is written into `loadError` and the garden
		 * goes on making its own shapes instead.
		 */
		loadRecordings() {
			if (!ctx || loading) return loading;
			loading = Promise.all(
				Object.entries(RECORDINGS).map(async ([name, spec]) => {
					const res = await fetch(spec.file);
					if (!res.ok) throw new Error(`${spec.file} -> ${res.status}`);
					const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
					recordings[name] = { buffer, gain: recordingGain(buffer), seconds: buffer.duration };
				})
			).catch((error) => {
				loadError = String(error && error.message ? error.message : error);
			});
			return loading;
		},
		get recordingsReady() {
			return Object.keys(recordings).length;
		},
		get recordingError() {
			return loadError;
		},
		recordingSeconds(name) {
			return recordings[name] ? recordings[name].seconds : 0;
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
			// And the held sounds ride with the ear. A panner is no use for sixty-two metres of water — a point
			// source would go quiet at one end of it and loud at the other — so the gain is written from the
			// distance to the nearest point of the watercourse instead, which is what `near` answers.
			for (const m of murmurs) {
				const over = Math.max(0, 1 - (m.near(p) - m.bank) / m.span);
				// `scale` is the other thing that can hold a bed back: an insect is not out at ten in the morning,
				// and the day already knows how dark it is.
				const want = m.loud * over * over * (m.scale ? m.scale() : 1);
				if (Math.abs(want - m.level) > 0.0005) {
					m.level = want;
					// Ridden with a time constant rather than set flat: a visitor walking along the bank should
					// hear the water come up and go away, not step from one loudness to the next.
					m.voice.level.gain.setTargetAtTime(want, ctx.currentTime, 0.35);
				}
			}
		},

		/**
		 * Start a sound that holds. `near` is given the listener's place and answers metres to the thing making
		 * the sound; the gain is full within `bank` metres and gone at `bank + span`. `scale` is asked every frame
		 * for a further multiplier — the hour, for an insect that sleeps. `file` names a recording to wear; there is no
		 * synthesised bed any more, because the one this folder wrote for the channel sounded like a hiss and was
		 * thrown out. Returns the handle, or nothing if the ear has not been woken — and the ear is woken by the
		 * first click, which is the only reason this is not called where the water itself is built.
		 */
		startMurmur({
			name = "murmur",
			near = () => 0,
			loud = LEVEL.trickle,
			bank = 1.2,
			span = 11,
			file = null,
			scale = null,
		} = {}) {
			if (!ctx) return null;
			const attach = (voice) => {
				const entry = { name, near, loud, bank, span, scale, voice, level: -1 };
				murmurs.push(entry);
				return entry;
			};
			if (!file) return null;
			const rec = recordings[file];
			// `loopVoice` puts the recording's own gain on the file, so the level here is `loud` and nothing more.
			// Multiplying by the recording's gain a second time — which is what this line used to do — left the bed
			// standing at 1.1 against a master of 0.9: a clipped wash over the garden.
			if (rec) return attach(loopVoice(ctx, master, rec));
			// The recording has not finished arriving: the ear is woken by the first touch and the file is asked
			// for at the same moment. So the bed joins when its samples do, and the garden is not silent while it
			// waits — the frogs and the gecko are already there.
			Promise.resolve(loading)
				.then(() => {
					const late = recordings[file];
					if (late) attach(loopVoice(ctx, master, late));
				})
				.catch(() => {});
			return null;
		},

		/** What the held sounds are doing right now, for `tools/ears.js` and for anybody checking the mix. */
		get murmurs() {
			return murmurs.map((m) => ({ name: m.name, level: Math.round(m.level * 1000) / 1000 }));
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
			// A recording if there is one, and the shape of the animal if there is not.
			const stop = recordings[what]
				? clip(recordings[what], recordingSpec(what), head, rand)
				: VOICES[what](ctx, head, rand);
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

/** The slice lengths asked for by name are in `RECORDINGS`; `recordingSpec` hands them out. */

/**
 * Play a piece of a recording into the gain it was given, and say how many seconds it will take.
 *
 * The piece starts at a random point in the recording — which is what makes five calls from five stones sound
 * like five animals rather than one animal on a loop — and it is faded in and out over a few tens of
 * milliseconds, because an AudioBufferSourceNode stopped mid-waveform is a click you can hear through a wall.
 */
export function clip(rec, { slice, trim = 1 }, out, rand) {
	const ctx = out.context;
	const from = slice[0] + rand() * (slice[1] - slice[0]);
	const room = rec.buffer.duration - from - 0.05;
	if (room <= 0.05) return 0.1;
	const at = ctx.currentTime + 0.02;
	const src = ctx.createBufferSource();
	src.buffer = rec.buffer;
	const env = ctx.createGain();
	const level = rec.gain * trim;
	env.gain.setValueAtTime(0, at);
	env.gain.linearRampToValueAtTime(level, at + 0.03);
	env.gain.setValueAtTime(level, at + Math.max(0.04, from - 0.09));
	env.gain.exponentialRampToValueAtTime(0.0008, at + from);
	src.connect(env);
	env.connect(out);
	src.start(at, rand() * Math.max(0.01, rec.buffer.duration - from), from);
	return from;
}

/**
 * A recording worn as a held sound: the whole of it, looped, at the gain `recordingGain` worked out for it.
 *
 * The loop is CUT, not smoothed. A seam in the middle of a cricket chorus is a chirp landing on a chirp and is
 * lost; a seam in twelve seconds of droplets is a click you can chase round the garden. So `loopVoice` looks for
 * the quietest sample in the first third of the file and the quietest in the last third, and loops between them:
 * the join happens where almost nothing is being said. `seam` reports where it was cut, in seconds, because a
 * loop point you cannot see is a loop point you cannot defend.
 */
export function loopVoice(ctx, out, rec) {
	const source = ctx.createBufferSource();
	source.buffer = rec.buffer;
	source.loop = true;
	const seconds = rec.buffer.duration;
	const rate = rec.buffer.sampleRate;
	const data = rec.buffer.getChannelData(0);
	// The quietest sample in a band of the file. Sampling every eleventh frame is plenty: what is being looked
	// for is a place where the water is between words, and a tenth of a millisecond either way is nothing.
	const quietest = (from, to) => {
		let best = Math.floor(from * rate);
		let low = Infinity;
		for (let i = Math.floor(from * rate); i < Math.min(data.length, Math.floor(to * rate)); i += 11) {
			const v = Math.abs(data[i]);
			if (v < low) {
				low = v;
				best = i;
			}
		}
		return best;
	};
	let seam = null;
	// Only worth cutting when the file is short enough to hear round. Minutes of anything loop at their ends and
	// nobody has ever heard the turn of a long field recording.
	if (seconds < 40) {
		source.loopStart = quietest(0, seconds / 3) / rate;
		source.loopEnd = quietest((2 * seconds) / 3, seconds) / rate;
		seam = { from: source.loopStart, to: source.loopEnd };
	}
	const own = ctx.createGain();
	own.gain.value = rec.gain;
	const level = ctx.createGain();
	level.gain.value = 0;
	source.connect(own);
	own.connect(level);
	level.connect(out);
	// Start inside the loop, or the first pass would play the part of the file the loop excludes.
	source.start(0, source.loopStart || 0);
	return { level, source, own, seam };
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
	/**
	 * A gunshot: a crack of noise and a thump underneath it, and it is over in a fifth of a second.
	 *
	 * Nothing in this garden makes one, so it is built the way a pistol is actually heard rather than the way
	 * a bird is: a hard pressure wave, which is a burst of noise with every frequency in it opened at once and
	 * shut again in ten milliseconds, and a low thump from the powder, which is where the sound is felt rather
	 * than heard. The noise is band-limited on purpose — raw white noise at this length is a torn sheet of
	 * paper, and a real report from the far side of a yard has lost its very highest and very lowest before it
	 * arrives.
	 */
	shot(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.005;
		const len = 0.19;
		const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			// Crackle first and fastest, then the tail: a plain exponential from the first sample is a hiss.
			const u = i / data.length;
			data[i] = (Math.random() * 2 - 1) * Math.pow(1 - u, 2.6);
		}
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		const crack = ctx.createBiquadFilter();
		crack.type = "bandpass";
		crack.frequency.value = 1500 + rand() * 700;
		crack.Q.value = 0.6;
		const body = ctx.createBiquadFilter();
		body.type = "lowpass";
		body.frequency.value = 2400;
		const env = ctx.createGain();
		env.gain.setValueAtTime(0.9, t0);
		env.gain.exponentialRampToValueAtTime(0.002, t0 + len);
		src.connect(crack);
		crack.connect(body);
		body.connect(env);
		env.connect(out);
		src.start(t0);
		// The thump. Sixty-odd Hz, down to nothing in a twelfth of a second, and a quarter as loud as the crack.
		const osc = ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(120 + rand() * 30, t0);
		osc.frequency.exponentialRampToValueAtTime(46, t0 + 0.09);
		const thump = ctx.createGain();
		thump.gain.setValueAtTime(0, t0);
		thump.gain.linearRampToValueAtTime(0.3, t0 + 0.006);
		thump.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
		osc.connect(thump);
		thump.connect(out);
		osc.start(t0);
		osc.stop(t0 + 0.14);
		return 0.22;
	},

	/**
	 * A rocket leaving the tube: a hiss that climbs, and the thud of the charge lighting.
	 *
	 * A rocket is not a gun. A gun is one crack and it is over; a rocket is a sound that STARTS and keeps going
	 * for a quarter of a second while the thing is still in the tube, because the propellant is burning along
	 * its length rather than going off at a point. So this is a band of noise with the band sliding up as the
	 * gas leaves, and a low thump under the first tenth of a second, which is the overpressure arriving at the
	 * ear before the hiss does.
	 */
	launch(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.005;
		const len = 0.42;
		const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			const u = i / data.length;
			// Loud at the start, and a long slow tail: the pressure falls away as the tube empties.
			data[i] = (Math.random() * 2 - 1) * Math.pow(1 - u, 1.5) * (0.7 + 0.3 * Math.sin(u * 40));
		}
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		const band = ctx.createBiquadFilter();
		band.type = "bandpass";
		band.Q.value = 1.1;
		// The band slides from a growl to a scream: 400 Hz to 3 kHz over the length of the hiss.
		band.frequency.setValueAtTime(380 + rand() * 120, t0);
		band.frequency.exponentialRampToValueAtTime(2600 + rand() * 900, t0 + len * 0.85);
		const env = ctx.createGain();
		env.gain.setValueAtTime(0.85, t0);
		env.gain.exponentialRampToValueAtTime(0.001, t0 + len);
		src.connect(band);
		band.connect(env);
		env.connect(out);
		src.start(t0);
		const osc = ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(150 + rand() * 40, t0);
		osc.frequency.exponentialRampToValueAtTime(52, t0 + 0.16);
		const thud = ctx.createGain();
		thud.gain.setValueAtTime(0, t0);
		thud.gain.linearRampToValueAtTime(0.4, t0 + 0.01);
		thud.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
		osc.connect(thud);
		thud.connect(out);
		osc.start(t0);
		osc.stop(t0 + 0.24);
		return len + 0.1;
	},

	/**
	 * A blast: a crack, a wall of low pressure, and a long rumble behind it.
	 *
	 * Three parts, in the order they actually arrive. First the crack — the shock front, which is the loudest
	 * thing and the shortest, and which has every frequency in it. Then the pressure, which is felt more than
	 * heard: a sine that starts well above audibility and falls to thirty hertz, which is where a chest notices
	 * it. Then the rumble, which is the same noise as the crack turned the other way round — band-limited to
	 * the bottom end and lasting a second and a half, because a blast does not stop when the fire stops; the
	 * ground and the walls go on answering for a while afterwards.
	 */
	boom(ctx, out, rand) {
		const t0 = ctx.currentTime + 0.005;
		const rate = ctx.sampleRate;
		// The crack.
		const crackLen = 0.12;
		const crack = ctx.createBuffer(1, Math.floor(rate * crackLen), rate);
		const cd = crack.getChannelData(0);
		for (let i = 0; i < cd.length; i++) {
			cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cd.length, 1.8);
		}
		const crackSrc = ctx.createBufferSource();
		crackSrc.buffer = crack;
		const bright = ctx.createBiquadFilter();
		bright.type = "highpass";
		bright.frequency.value = 900 + rand() * 500;
		const crackEnv = ctx.createGain();
		crackEnv.gain.setValueAtTime(0.75, t0);
		crackEnv.gain.exponentialRampToValueAtTime(0.001, t0 + crackLen);
		crackSrc.connect(bright);
		bright.connect(crackEnv);
		crackEnv.connect(out);
		crackSrc.start(t0);
		// The pressure: a tone that falls out of hearing.
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(180 + rand() * 60, t0);
		osc.frequency.exponentialRampToValueAtTime(28, t0 + 0.85);
		const pressure = ctx.createGain();
		pressure.gain.setValueAtTime(0, t0);
		pressure.gain.linearRampToValueAtTime(1, t0 + 0.02);
		pressure.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
		osc.connect(pressure);
		pressure.connect(out);
		osc.start(t0);
		osc.stop(t0 + 1.05);
		// The rumble: the low end of the same noise, slow to arrive and slow to leave.
		const rumbleLen = 1.6;
		const rumble = ctx.createBuffer(1, Math.floor(rate * rumbleLen), rate);
		const rd = rumble.getChannelData(0);
		for (let i = 0; i < rd.length; i++) {
			const u = i / rd.length;
			// A swell rather than a decay: the rumble is loudest a tenth of a second after the crack, because
			// that is when the reflected pressure from the ground and the walls comes back.
			rd[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u * 0.5);
		}
		const rumbleSrc = ctx.createBufferSource();
		rumbleSrc.buffer = rumble;
		const low = ctx.createBiquadFilter();
		low.type = "lowpass";
		low.frequency.setValueAtTime(420, t0 + 0.02);
		low.frequency.exponentialRampToValueAtTime(120, t0 + rumbleLen);
		const rumbleEnv = ctx.createGain();
		rumbleEnv.gain.setValueAtTime(0.5, t0);
		rumbleEnv.gain.exponentialRampToValueAtTime(0.001, t0 + rumbleLen);
		rumbleSrc.connect(low);
		low.connect(rumbleEnv);
		rumbleEnv.connect(out);
		rumbleSrc.start(t0);
		return rumbleLen + 0.2;
	},
};
