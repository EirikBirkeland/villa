// ears — measure the Villa's sounds, since a screenshot cannot show a noise.
//
// The Villa makes its sounds out of oscillators (`src/sound.js`), so they can be rendered and weighed instead
// of believed. This opens the Villa in the browser, clicks it the way a visitor would to wake the ear up,
// renders every voice into a buffer of samples in the page, and reports how loud each one is, how long it
// lasts, and how high it sits — the last by counting how often the wave crosses zero, which is a crude pitch
// and the right crude pitch: a frog should come out low and a gecko high, and if they come out the same the
// two animals are one animal.
//
// It then sits in the garden for a while at night and counts what the garden actually says out loud, so a
// "chorus" can be reported as a number and not as a hope.
//
//   node tools/ears.js                          every voice, then forty seconds of night by the pond
//   node tools/ears.js --voices                the voices only
//   node tools/ears.js --listen 60              how long to stand in the garden and count
//   node tools/ears.js --view 0,1.6,12,0.1     where to stand while counting
//
// Peak is the loudest single sample and rms is the steady loudness, both of a full-scale 1. A call that comes
// out under about 0.02 peak is a call nobody would hear over the wind in the palms.

import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

requireHeadroom();

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--use-angle=vulkan",
	"--enable-features=Vulkan",
	"--ignore-gpu-blocklist",
	"--autoplay-policy=no-user-gesture-required",
];

const argv = process.argv.slice(2);
const flag = (name, at) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] ?? at : at);
const only = (name) => argv.includes(name);
const listenFor = Number(flag("--listen", "40"));
const view = flag("--view", "-14,1.6,13.5,2.2,-0.05"); // the pond bank, where the frogs are
const url = `http://localhost:8090/villa/?hour=21.5&float=1&view=${view}`;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
const page = await browser.newPage();
await (await page.context().newCDPSession(page)).send("Network.setCacheDisabled", { cacheDisabled: true });
page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 5000));

// The click a visitor has to make before any browser will let a page make a noise.
await page.mouse.click(400, 300);
await new Promise((resolve) => setTimeout(resolve, 600));

const gate = await page.evaluate(async () => {
	const villa = window.__villa;
	if (!villa.sound) return { error: "no ear — is the Villa built with one?" };
	const mod = await import("./src/sound.js");
	return {
		ready: villa.sound.ready,
		armedBy: villa.sound.armedBy,
		muted: villa.sound.muted,
		voicesBuilt: Object.keys(mod.VOICES).length,
	};
});
console.log("ear:", JSON.stringify(gate));

const measures = await page.evaluate(async () => {
	const { VOICES, LEVEL } = await import("./src/sound.js");
	const rate = 22050;
	const out = {};
	for (const [name, make] of Object.entries(VOICES)) {
		const ctx = new OfflineAudioContext(1, Math.round(rate * 2.2), rate);
		// The same gain `play` would put on it, so these numbers are what a listener is offered and not the raw
		// voice before the mixer ever got near it.
		const head = ctx.createGain();
		head.gain.value = LEVEL[name] ?? 0.4;
		head.connect(ctx.destination);
		let seed = 20251019;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed / 0x7fffffff;
		};
		const says = make(ctx, head, rand);
		const buffer = await ctx.startRendering();
		const data = buffer.getChannelData(0);
		let peak = 0;
		let sum = 0;
		let crossings = 0;
		let last = 0;
		let heard = 0;
		for (let i = 0; i < data.length; i++) {
			const v = data[i];
			const a = Math.abs(v);
			if (a > peak) peak = a;
			sum += v * v;
			if (a > 0.002) heard = i;
			if ((v > 0 && last <= 0) || (v < 0 && last >= 0)) crossings++;
			last = v;
		}
		out[name] = {
			peak: Number(peak.toFixed(4)),
			rms: Number(Math.sqrt(sum / data.length).toFixed(5)),
			// Zero crossings a second, over the part that is actually sound: twice the mean zero-crossing
			// frequency, which is a pitch for a wave this simple and a good enough sort for a frog against a
			// gecko.
			pitchHz: Math.round(crossings / Math.max(0.05, heard / rate)),
			seconds: Number((heard / rate).toFixed(2)),
			toldMe: Number(String(says).slice(0, 5)),
		};
	}
	return out;
});
console.log("voices:", JSON.stringify(measures, null, 1));

/**
 * The held sounds, weighed.
 *
 * A bed is not a call: it has no beginning, no end, and no peak worth speaking of, and the ear rides its gain
 * with the visitor's distance, so what matters is its STEADY loudness against the calls it sits under. These are
 * recordings now — the synthesised wash this folder wrote for the channel was thrown out after the master heard
 * it — so the numbers are the file's own, brought to its `recordingGain`, put through the LEVEL the mixer would
 * hand it, and rendered for three seconds. The seam is reported too: where a short loop is cut is a thing you
 * should be able to see.
 */
const held = await page.evaluate(async () => {
	const mod = await import("./src/sound.js");
	const rate = 22050;
	const out = {};
	for (const name of ["trickle"]) {
		const res = await fetch(mod.RECORDING_FILES[name]);
		if (!res.ok) {
			out[name] = { error: `${mod.RECORDING_FILES[name]} -> ${res.status}` };
			continue;
		}
		const full = new OfflineAudioContext(2, 1, rate);
		const buffer = await full.decodeAudioData(await res.arrayBuffer());
		const rec = { buffer, gain: mod.recordingGain(buffer), seconds: buffer.duration };
		const ctx = new OfflineAudioContext(1, Math.round(rate * 3), rate);
		const voice = mod.loopVoice(ctx, ctx.destination, rec);
		voice.level.gain.setValueAtTime(mod.LEVEL[name] ?? 0.1, 0);
		const rendered = await ctx.startRendering();
		const data = rendered.getChannelData(0);
		let peak = 0;
		let sum = 0;
		let crossings = 0;
		let last = 0;
		// The first half second is the loop getting under way; it is left out of the pitch, which is otherwise
		// dragged about by a start that has not settled.
		const skip = Math.floor(rate * 0.5);
		for (let i = 0; i < data.length; i++) {
			const v = data[i];
			const a = Math.abs(v);
			if (a > peak) peak = a;
			if (i < skip) continue;
			sum += v * v;
			if ((v > 0 && last <= 0) || (v < 0 && last >= 0)) crossings++;
			last = v;
		}
		out[name] = {
			level: mod.LEVEL[name],
			fileSeconds: Math.round(buffer.duration * 100) / 100,
			ownGain: Math.round(rec.gain * 1000) / 1000,
			seam: voice.seam ? `${Math.round(voice.seam.from * 100) / 100}s to ${Math.round(voice.seam.to * 100) / 100}s` : "the whole file",
			peak: Number(peak.toFixed(4)),
			rms: Number(Math.sqrt(sum / (data.length - skip)).toFixed(5)),
			pitchHz: Math.round(crossings / 2 / ((data.length - skip) / rate)),
		};
	}
	return out;
});
console.log("held:", JSON.stringify(held, null, 1));

/**
 * Is the file the animal, or is it the weather?
 *
 * A borrowed recording can be honest about its title and still be wrong for the garden: the "Crickets At Night"
 * that this folder took and then removed turned out to be loudest at 220 Hz and to have a loudest quarter-second
 * only twice its quietest — a wind, or a stream, baked in, which is what the master heard and called a
 * waterfall. An insect is the other way about: energy up in the chirp's own band, and a loud part many times the
 * quiet part, because a chirp is a spike over a floor and a wash is a floor with nothing on it.
 *
 * So every recording is weighed four bands wide (220, 800, 2600, 6500 Hz) and pulsed-or-smooth, and the rule for
 * letting a creature in is written down: an animal's file should be strongest above 800 Hz and should measure
 * `loudOverQuiet` of four or better. A bed that fails both is weather, and weather in a file is a fault.
 */
const character = await page.evaluate(async () => {
	const mod = await import("./src/sound.js");
	const rate = 22050;
	const out = {};
	for (const [name, file] of Object.entries(mod.RECORDING_FILES)) {
		const res = await fetch(file);
		if (!res.ok) {
			out[name] = { error: `${file} -> ${res.status}` };
			continue;
		}
		const probe = new OfflineAudioContext(2, 1, rate);
		const buffer = await probe.decodeAudioData(await res.arrayBuffer());
		const bands = {};
		for (const [label, hz] of [["low", 220], ["mid", 800], ["high", 2600], ["top", 6500]]) {
			const ctx = new OfflineAudioContext(1, Math.round(rate * Math.min(12, buffer.duration)), rate);
			const src = ctx.createBufferSource();
			src.buffer = buffer;
			const f = ctx.createBiquadFilter();
			f.type = "bandpass";
			f.frequency.value = hz;
			f.Q.value = 0.8;
			src.connect(f);
			f.connect(ctx.destination);
			src.start(0, 0);
			const data = (await ctx.startRendering()).getChannelData(0);
			let sum = 0;
			for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
			bands[label] = Number(Math.sqrt(sum / data.length).toFixed(5));
		}
		// Twenty-five millisecond windows over half a minute: the spread between the loud windows and the quiet
		// ones is the difference between a creature that says things and a hiss that says none.
		const win = Math.floor(rate * 0.025);
		const frames = Math.floor(rate * Math.min(30, buffer.duration));
		const ctx2 = new OfflineAudioContext(1, frames, rate);
		const src2 = ctx2.createBufferSource();
		src2.buffer = buffer;
		src2.connect(ctx2.destination);
		src2.start(0);
		const full = (await ctx2.startRendering()).getChannelData(0);
		const wins = [];
		for (let i = 0; i + win < full.length; i += win) {
			let s = 0;
			for (let j = 0; j < win; j++) s += full[i + j] * full[i + j];
			wins.push(Math.sqrt(s / win));
		}
		wins.sort((a, c) => a - c);
		const loud = wins[Math.floor(wins.length * 0.95)];
		const quiet = wins[Math.floor(wins.length * 0.05)];
		const loudest = Object.entries(bands).sort((a, c) => c[1] - a[1])[0][0];
		out[name] = {
			seconds: Math.round(buffer.duration * 10) / 10,
			bands,
			loudestBand: loudest,
			loudOverQuiet: Number((loud / Math.max(quiet, 1e-7)).toFixed(2)),
			// The rule, said as a number rather than as a sentence, so a file can be refused by a tool.
			readsAs: loudest === "low" || loud / Math.max(quiet, 1e-7) < 4 ? "WEATHER, not a creature" : "a creature",
		};
	}
	return out;
});
console.log("character:", JSON.stringify(character, null, 1));

/**
 * The borrowed recording, weighed the same way as the shapes.
 *
 * A recording is a different sort of thing from a voice: it arrives as samples rather than as oscillators, it
 * carries somebody else's microphone and level, and it is played in SLICES by `clip` rather than built note by
 * note. So this fetches the file the Villa would fetch, decodes it, runs one slice through the same gain the
 * mixer would put on it, and reports the same four numbers — and the whole length of the recording, since how
 * long the borrowed pond is, and how long a piece of it is taken at a time, are both worth knowing.
 */
const takes = await page.evaluate(async () => {
	const mod = await import("./src/sound.js");
	const ear = window.__villa.sound;
	const out = { loaded: ear.recordingsReady, error: ear.recordingError, takes: {} };
	for (const [name, file] of Object.entries(mod.RECORDING_FILES)) {
		const res = await fetch(file);
		if (!res.ok) {
			out.takes[name] = { error: `${file} -> ${res.status}` };
			continue;
		}
		const rate = 22050;
		const ctx = new OfflineAudioContext(1, Math.round(rate * 3), rate);
		const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
		const rec = { buffer, gain: mod.recordingGain(buffer) };
		const head = ctx.createGain();
		head.gain.value = mod.LEVEL[name] ?? 0.4;
		head.connect(ctx.destination);
		let seed = 20251019;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed / 0x7fffffff;
		};
		const says = mod.clip(rec, mod.recordingSpec(name), head, rand);
		const rendered = await ctx.startRendering();
		const data = rendered.getChannelData(0);
		let peak = 0;
		let sum = 0;
		let crossings = 0;
		let last = 0;
		let heard = 0;
		for (let i = 0; i < data.length; i++) {
			const v = data[i];
			const a = Math.abs(v);
			if (a > peak) peak = a;
			sum += v * v;
			if (a > 0.002) heard = i;
			if ((v > 0 && last <= 0) || (v < 0 && last >= 0)) crossings++;
			last = v;
		}
		out.takes[name] = {
			file,
			recordingSeconds: Number(buffer.duration.toFixed(2)),
			sliceSeconds: Number(String(says).slice(0, 4)),
			peak: Number(peak.toFixed(4)),
			rms: Number(Math.sqrt(sum / data.length).toFixed(5)),
			pitchHz: Math.round(crossings / Math.max(0.05, heard / rate)),
		};
	}
	return out;
});
console.log("recordings:", JSON.stringify(takes, null, 1));

if (!only("--voices")) {
	// Stand in the garden and count what it says. The counter is wrapped around the Villa's own `play`, so it
	// hears exactly what the animals hear and not what this tool hopes they say.
	await page.evaluate(() => {
		const ear = window.__villa.sound;
		window.__counted = {};
		const before = ear.play.bind(ear);
		ear.play = (what, at, loud) => {
			window.__counted[what] = (window.__counted[what] || 0) + 1;
			return before(what, at, loud);
		};
	});
	await new Promise((resolve) => setTimeout(resolve, listenFor * 1000));
	const chorus = await page.evaluate(() => ({
		counted: window.__counted,
		voices: window.__villa.sound.voices,
		abroad: window.__villa.geckos ? window.__villa.geckos.abroad : null,
		hour: Number(window.__villa.day.hour.toFixed(2)),
	}));
	console.log(`night over ${listenFor}s:`, JSON.stringify(chorus));
}

await browser.close();
