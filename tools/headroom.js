// A word of warning before a browser is started: this sandbox counts threads and processes against
// a cgroup limit (`cat /sys/fs/cgroup/pids.max`), and old Chromium runs leave corpses behind that
// never get reaped, so the room shrinks over a long-lived sandbox. When the room is gone Chromium
// dies with "pthread_create: Resource temporarily unavailable" and a picture tool hangs or dumps
// core, which looks like a fault in the Villa and is not.
//
//   import { requireHeadroom } from "./headroom.js";
//   requireHeadroom();   // stops here with this explanation if there is not enough room
//
// What to do when it stops: the corpses can only be reaped by their parent. Measured in this
// sandbox (fifth session): their parent is pid 1, which is the folder's own `http-server` and not a
// reaping init; we are root but without CAP_SYS_PTRACE, so nothing may attach to it, and
// /sys/fs/cgroup is mounted read-only (and we have no CAP_SYS_ADMIN), so pids.max cannot be raised
// either. Nothing inside here clears them: only a fresh sandbox does. Say so in NOTES.md, do the
// work that needs no browser (tools/feet.js checks the walking without one), and try again later.
//
// One more thing while the room is small: node itself wants a handful of threads, so run the tools
// one at a time. Two `node` commands at once have been seen to die with `uv_thread_create` failed.

import fs from "node:fs";

export function headroom() {
	try {
		const max = Number(fs.readFileSync("/sys/fs/cgroup/pids.max", "utf8").trim());
		const current = Number(fs.readFileSync("/sys/fs/cgroup/pids.current", "utf8").trim());
		if (!isFinite(max) || !isFinite(current) || max <= 0) return null;
		return { max, current, free: max - current };
	} catch (error) {
		void error;
		return null;
	}
}

/** A Chromium with software WebGL wants roughly a hundred threads. Stop early if there are not. */
export function requireHeadroom(want = 130) {
	const room = headroom();
	if (!room) return;
	if (room.free >= want) return;
	console.error(
		`no browser this time: the sandbox has ${room.free} of ${room.max} process slots free and Chromium wants about ${want}.` +
			`\n  Most of what is used up are corpses of old Chromium runs (ps -eo stat | grep -c Z counts them).` +
			"\n  They cannot be cleared from in here; only a fresh sandbox fixes it." +
			"\n  Meanwhile: node tools/feet.js checks the walking without a browser.",
	);
	process.exit(1);
}

// Run on its own, it just says how much room there is.
if (process.argv[1] && process.argv[1].endsWith("headroom.js")) {
	const room = headroom();
	if (!room) console.log("headroom: no pids limit to read.");
	else if (room.free >= 130) console.log(`headroom: ${room.free} of ${room.max} slots free — a browser will start.`);
	else
		console.log(
			`headroom: ${room.free} of ${room.max} slots free — no browser (${room.current - room.free} of them are corpses of old runs).`,
		);
}
