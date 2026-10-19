#!/bin/sh
# Photographs every standing camera in a real browser, so the Villa is judged on what a renderer
# draws and not on what the CPU drawing hopes for.
#
#   ./tools/photos.sh                      -> all of them, into pictures/
#   ./tools/photos.sh home west            -> the named ones
#   ./tools/photos.sh --from 040 home      -> start the numbering at 040
#
# The cameras live in tools/cameras.txt, the same list tools/views.sh draws, so a browser picture and
# a drawing of the same place line up pixel for pixel and tools/compare.js can weigh them against
# each other. Needs a browser: `node tools/headroom.js` says whether this sandbox has room for one.
set -e
cd "$(dirname "$0")/.."

node tools/headroom.js | grep -q "a browser will start" || {
	echo "no browser in this sandbox — see tools/headroom.js" >&2
	exit 1
}

FROM=25
if [ "$1" = "--from" ]; then
	FROM="$2"
	shift 2
fi
# Leading zeros off, plainly: a number with a leading zero would be read as octal by the shell's
# arithmetic (so --from 042 quietly meant 34), and the shell that runs this file has no 10# to force
# decimal back.
FROM=$(printf '%s' "$FROM" | sed 's/^0*//')
[ -n "$FROM" ] || FROM=0
WANT="$*"

n=0
while read -r name cam fov; do
	[ -z "$name" ] && continue
	case "$name" in \#*) continue ;; esac
	if [ -n "$WANT" ]; then
		case " $WANT " in *" $name "*) ;; *) continue ;; esac
	fi
	n=$((n + 1))
	num=$(printf '%03d' $((FROM + n - 1)))
	url="index.html?view=$cam"
	# The day is pinned here, and that is not laziness: the standing set is a comparison, and a picture of
	# 18:40 is not the same garden as a picture of 17:30 no matter how little else moved. `HOUR=21.5
	# tools/photos.sh night` is how the night is photographed, and `DAYLEN=360` lets the day run.
	url="$url&hour=${HOUR:-17.5}&daylen=${DAYLEN:-0}"
	[ "$fov" != "-" ] && url="$url&fov=$fov"
	printf '%s %s ... ' "$num" "$name"
	screenshot "http://localhost:8090/villa/$url" "pictures/$num-$name.png" 1280 720 14000 >/dev/null 2>&1 || {
		echo "FAILED (no browser, or the page did not stand up)"
		continue
	}
	echo "pictures/$num-$name.png"
done < tools/cameras.txt
