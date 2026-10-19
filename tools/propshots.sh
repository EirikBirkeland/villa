#!/bin/sh
# Photographs the close-up cameras in tools/propcams.txt, so a small surface — one pot, one sunbed's
# timber, a boulder — can be measured with tools/pixels.js --patch instead of guessed at.
#
#   ./tools/propshots.sh                       -> the working tree
#   ./tools/propshots.sh releases/v0.14.0      -> a released copy, to weigh the two against each other
#
# Pictures are pictures/prop-<name>.png for the working tree and pictures/prop-<name>-<tag>.png for
# a released copy, where <tag> is the release's version. Needs a browser: `node tools/headroom.js`
# says whether this sandbox has room for one.
set -e
cd "$(dirname "$0")/.."

node tools/headroom.js | grep -q "a browser will start" || {
	echo "no browser in this sandbox — see tools/headroom.js" >&2
	exit 1
}

BASE="${1:-.}"
TAG=""
[ "$BASE" != "." ] && TAG="-$(basename "$BASE" | sed 's/^v//')"

while read -r name cam fov; do
	[ -z "$name" ] && continue
	case "$name" in \#*) continue ;; esac
	url="$BASE/index.html?view=$cam"
	printf '%s ... ' "$name"
	screenshot "http://localhost:8090/villa/$url" "pictures/prop-$name$TAG.png" 960 540 14000 >/dev/null 2>&1 || {
		echo "FAILED (no browser, or the page did not stand up)"
		continue
	}
	echo "pictures/prop-$name$TAG.png"
done < tools/propcams.txt
