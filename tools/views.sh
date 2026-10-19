#!/bin/sh
# Redraws every standing camera into pictures/, so the next session has a set to compare against.
#
#   ./tools/views.sh            -> all of them
#   ./tools/views.sh home west  -> the named ones
#
# The cameras live in tools/cameras.txt, shared with tools/photos.sh, which photographs the very same
# places in a real browser. One line per camera: the name the picture is saved under, where a visitor
# stands and what they look at, and a narrow eye angle where the wide one is no use.
set -e
cd "$(dirname "$0")/.."

show() {
	node tools/draw.js "$@" | { grep -E "^pictures/|what fills the frame|faces |blew out|came out black" || true; } | sed 's/^/  /'
}

WANT="$*"
while read -r name cam fov; do
	[ -z "$name" ] && continue
	case "$name" in \#*) continue ;; esac
	if [ -n "$WANT" ]; then
		case " $WANT " in *" $name "*) ;; *) continue ;; esac
	fi
	printf '%s\n' "$name"
	if [ "$fov" = "-" ]; then
		show --out "pictures/drawn-$name.png" --view "$cam"
	else
		show --out "pictures/drawn-$name.png" --view "$cam" --fov "$fov"
	fi
done < tools/cameras.txt
