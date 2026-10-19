// tools/freesound.js — go and get a recorded sound from freesound.org, and write down where it came from.
//
//   node tools/freesound.js search "tokay gecko" [--cc0] [--limit 12]
//   node tools/freesound.js look <sound-id>
//   node tools/freesound.js get <sound-id> <file-name> [--dir sounds]
//
// WHY A TOOL AND NOT A CURL. Freesound's search page is rendered by a script, so a plain `curl` of the search
// url comes back with a page and no results in it. A real browser in this sandbox does get the results, so
// this file drives one, reads the list, and then downloads with plain https from `cdn.freesound.org`, which is
// public and needs no account.
//
// WHAT IS DOWNLOADED, and the licence that comes with it. Freesound's public previews are mp3 copies of the
// original upload, and every one of them still carries the uploader's Creative Commons licence. `search` and
// `look` therefore print the licence and the uploader's name, and `get` appends a line to `sounds/CREDITS.md`
// saying which file came from which sound, by whom, under what licence, at what address. A CC-BY sound that is
// used without that line is a stolen sound, and a CC-BY-NC sound must not be used at all here. `--cc0` keeps
// the search to sounds with no strings on them at all, which is what this Villa prefers.
//
// The browser is only opened for the search and the licence read; the bytes come down over https.

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { chromium } from "playwright-core";
import { requireHeadroom } from "./headroom.js";

const argv = process.argv.slice(2);
const cmd = argv[0];
const readFlag = (name, dflt) => {
	const i = argv.indexOf(`--${name}`);
	return i < 0 ? dflt : argv.splice(i, 2)[1];
};
const hasFlag = (name) => argv.includes(`--${name}`);

const flags = [
	"--no-sandbox",
	"--disable-dev-shm-usage",
	"--disable-gpu",
	"--use-gl=swiftshader",
];

/** Read one search page, or one sound page, and hand back what the site put in it. */
export async function withPage(run) {
	requireHeadroom();
	const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: flags });
	const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
	try {
		return await run(page);
	} finally {
		await browser.close();
	}
}

/** Everything the list page knows about each sound on it. */
export function parseList(html) {
	const out = [];
	// Each result is an <a> to /sounds/<id>/ with the title in it, inside a block that carries the player's
	// data. The site's markup moves between releases, so this reads the page the way a person would: find the
	// links, then look in the text around each one for the uploader, the length and the licence.
	const seen = new Set();
	for (const match of html.matchAll(/<a[^>]+href="\/sounds\/(\d+)\/"[^>]*>([\s\S]{0,300}?)<\/a>/g)) {
		const id = Number(match[1]);
		if (seen.has(id)) continue;
		seen.add(id);
		const title = match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
		const window = html.slice(Math.max(0, match.index - 1200), match.index + 4000);
		const author = (window.match(/\/people\/([^/"?]+)\//) || [])[1] || "?";
		const dur = (window.match(/(\d+:\d\d(?:\.\d+)?)/) || [])[1] || "?";
		const preview = (window.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"'\\ ]+\.mp3/) || [])[0] || "";
		const licence = /Creative Commons 0/.test(window) ? "CC0"
			: /NonCommercial/.test(window) ? "CC-BY-NC"
			: /Attribution/.test(window) ? "CC-BY" : "?";
		if (!title) continue;
		out.push({ id, title, author, dur, licence, preview });
	}
	return out;
}

export async function search(query, { cc0 = false } = {}) {
	return withPage(async (page) => {
		const f = (cc0 || hasFlag("cc0")) ? '&f=license:"Creative Commons 0"' : "";
		await page.goto(`https://freesound.org/search/?q=${encodeURIComponent(query)}&s=score+descending${f}`, {
			waitUntil: "networkidle",
			timeout: 90000,
		});
		await page.waitForTimeout(3000);
		return parseList(await page.content());
	});
}

export async function look(id) {
	return withPage(async (page) => {
		const hit = (await page.goto(`https://freesound.org/s/${id}/`, { waitUntil: "networkidle", timeout: 90000 }))
			.request().url();
		await page.waitForTimeout(2500);
		const html = await page.content();
		const preview = (html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"'\\ ]+\.mp3/) || [])[0] || "";
		const licence = /Creative Commons 0/.test(html) ? "CC0"
			: /NonCommercial/.test(html) ? "CC-BY-NC"
			: /Attribution 4\.0/.test(html) ? "CC-BY" : "?";
		const title = (html.match(/<title>Freesound - (.*)<\/title>/) || [])[1] || "?";
		const author = (hit.match(/\/people\/([^/]+)\//) || [])[1] || "?";
		const dur = (html.match(/(\d+:\d\d(?:\.\d+)?)/) || [])[1] || "?";
		return [{ id: Number(id), title, author, dur, licence, preview, url: hit }];
	});
}

function report(rows, limit) {
	if (!rows.length) {
		console.log("nothing came back — the site changed its page, or the words are wrong");
		return;
	}
	for (const r of rows.slice(0, limit)) {
		console.log(`${r.id}\t${r.licence}\t${r.dur}\t${r.author}\t${r.title}`);
		if (r.preview) console.log(`\t${r.preview}`);
	}
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
await main();
}

async function main() {
if (cmd === "search") {
	const q = argv[1];
	if (!q) {
		console.log('usage: node tools/freesound.js search "words" [--cc0] [--limit 12]');
		process.exit(1);
	}
	report(await search(q), Number(readFlag("limit", "12")));
} else if (cmd === "look") {
	report(await look(argv[1]), 1);
} else if (cmd === "get") {
	const id = Number(argv[1]);
	const name = argv[2];
	if (!id || !name) {
		console.log("usage: node tools/freesound.js get <sound-id> <file-name> [--dir sounds]");
		process.exit(1);
	}
	const [hit] = await look(id);
	if (!hit || !hit.preview) {
		console.log(`sound ${id} gave no preview address`);
		process.exit(1);
	}
	if (hit.licence === "CC-BY-NC") {
		console.log(`REFUSED: sound ${id} is ${hit.licence} (non-commercial). This Villa is not cleared for it.`);
		process.exit(1);
	}
	const dir = readFlag("dir", "sounds");
	fs.mkdirSync(dir, { recursive: true });
	const url = hit.preview.replace("-lq.mp3", "-hq.mp3");
	const file = path.join(dir, `${name}.mp3`);
	const res = await fetch(url);
	if (!res.ok) {
		console.log(`${url} -> ${res.status}`);
		process.exit(1);
	}
	const bytes = Buffer.from(await res.arrayBuffer());
	fs.writeFileSync(file, bytes);
	console.log(`${file}  ${bytes.length} bytes  <- ${url}`);
	const credits = path.join(dir, "CREDITS.md");
	const line = `- **${name}.mp3** — "${hit.title}" by ${hit.author}, ${hit.licence}, ${hit.dur}, `
		+ `from ${hit.url || `https://freesound.org/s/${id}/`} (preview mp3, downloaded ${new Date().toISOString().slice(0, 10)}).\n`;
	fs.appendFileSync(credits, line);
	console.log(`CREDITS.md: ${line.trim()}`);
} else {
	console.log('commands: search, look, get — see the head of this file');
}
}
