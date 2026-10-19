#!/bin/sh
# Publishes a release of the Villa: copies the walkable Villa into releases/v<version>/, takes a picture
# of that copy, and lists it in releases/releases.json, which the menu page (releases/index.html) reads.
#
# Usage: ./release.sh <version> "<one line summary>"
#        ./release.sh 0.1.0 "A house, a pool and a sun"
#
# If CHANGELOG.md has a "## <version>" entry, it becomes the release's page in the menu.
# A release is a copy that is never edited afterwards: old versions stay walkable as they were.

set -e
cd "$(dirname "$0")"

version="$1"
summary="$2"
tag="v$version"

# What the browser loads. Add to this when the Villa starts loading a new top-level file or folder.
# A release must walk with no node_modules beside it and no network to fetch from.
walkable_items="index.html src vendor assets sounds"

if [ -z "$version" ] || [ -z "$summary" ]; then
  echo 'usage: ./release.sh <version> "<one line summary>"'
  exit 1
fi

if ! echo "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "The version must look like 0.1.0, got: $version"
  exit 1
fi

if [ -e "releases/$tag" ]; then
  echo "$tag already exists. Pick the next version."
  exit 1
fi

if [ ! -f index.html ]; then
  echo "There is no index.html to release."
  exit 1
fi

echo "Checking syntax..."
for item in $walkable_items; do
  [ -e "$item" ] || continue
  [ "$item" = "vendor" ] && continue
  find "$item" -type f \( -name '*.js' -o -name '*.mjs' \) | while read -r file; do
    node --check "$file"
  done
done

destination="releases/$tag"
mkdir -p "$destination"
for item in $walkable_items; do
  [ -e "$item" ] && cp -r "$item" "$destination/"
done

# A picture of the copy itself, as a visitor would first see it — at the hour the villa is named after, and
# with the sun pinned. The day runs by itself now (src/daylight.js), and a preview taken half an hour of villa
# time after the one before it is not the same picture and cannot be compared with it.
if command -v screenshot >/dev/null 2>&1; then
  echo "Taking a picture of the release..."
  screenshot "http://localhost:8090/villa/$destination/index.html?hour=17.5&daylen=0" "$(pwd)/$destination/preview.png" 1280 720 15000 || true
  [ -s "$destination/preview.png" ] || echo "WARNING: no picture was taken. Look at the release yourself."
fi

node --input-type=commonjs -e '
const fs = require("fs");
const [version, summary] = process.argv.slice(1);

const manifestPath = "releases/releases.json";
const releases = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
const now = new Date();
releases.unshift({ version, date: now.toISOString().slice(0, 10), released: now.toISOString(), summary });
fs.writeFileSync(manifestPath, JSON.stringify(releases, null, 2) + "\n");

// The full description, when CHANGELOG.md has one: everything under "## <version>" up to the next heading.
if (!fs.existsSync("CHANGELOG.md")) process.exit(0);
const lines = fs.readFileSync("CHANGELOG.md", "utf8").split("\n");
const isHeading = line => line.startsWith("## ");
const start = lines.findIndex(line => isHeading(line) && line.slice(3).split(/\s/)[0] === version);
if (start < 0) process.exit(0);
const body = lines.slice(start + 1);
const nextHeading = body.findIndex(isHeading);
const entry = (nextHeading < 0 ? body : body.slice(0, nextHeading)).join("\n").trim();
if (!entry) process.exit(0);
fs.mkdirSync("releases/notes", { recursive: true });
fs.writeFileSync(`releases/notes/v${version}.md`, entry + "\n");
' "$version" "$summary"

echo "Released $tag. It is now in the menu. Look at $destination/preview.png."
