#!/usr/bin/env bash
# Construit la version Windows portable de l'application VIGIE (dossier + zip) à partir d'un binaire Electron officiel.
# Même contenu que l'APK : l'application assemblée par vigie-app/build.mjs.
set -euo pipefail
cd "$(dirname "$0")"
node ../build.mjs
V="${ELECTRON_VERSION:-33.2.1}"
MIRROR="${ELECTRON_MIRROR:-https://github.com/electron/electron/releases/download/v}"
CACHE=../../desktop/cache                     # même cache que la version Windows de RoboMaster
ZIP="$CACHE/electron-v$V-win32-x64.zip"
mkdir -p "$CACHE"
[ -f "$ZIP" ] || curl -fL -o "$ZIP" "$MIRROR$V/electron-v$V-win32-x64.zip"
OUT=dist/VIGIE-Windows
rm -rf "$OUT" && mkdir -p "$OUT"
unzip -q "$ZIP" -d "$OUT"
mv "$OUT/electron.exe" "$OUT/VIGIE.exe"
rm -f "$OUT/resources/default_app.asar"
APP="$OUT/resources/app"
mkdir -p "$APP"
cp package.json main.js "$APP/"
cp -r ../dist/www "$APP/www"
cp ../README.md "$OUT/LISEZMOI.md"
(cd dist && rm -f VIGIE-Windows.zip && zip -qr VIGIE-Windows.zip VIGIE-Windows)
echo "Prêt : vigie-app/desktop/dist/VIGIE-Windows.zip"
