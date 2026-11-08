#!/usr/bin/env bash
# Construit la version Windows portable (dossier + zip) à partir d'un binaire Electron officiel.
set -euo pipefail
cd "$(dirname "$0")"
V="${ELECTRON_VERSION:-33.2.1}"
MIRROR="${ELECTRON_MIRROR:-https://github.com/electron/electron/releases/download/v}"
ZIP="cache/electron-v$V-win32-x64.zip"
mkdir -p cache
[ -f "$ZIP" ] || curl -fL -o "$ZIP" "$MIRROR$V/electron-v$V-win32-x64.zip"
OUT=dist/RoboMaster-Windows
rm -rf "$OUT" && mkdir -p "$OUT"
unzip -q "$ZIP" -d "$OUT"
mv "$OUT/electron.exe" "$OUT/RoboMaster.exe"
rm -f "$OUT/resources/default_app.asar"
APP="$OUT/resources/app"
mkdir -p "$APP/www"
cp package.json main.js "$APP/"
cp -r ../index.html ../manifest.webmanifest ../css ../js ../assets "$APP/www/"
cp ../README.md "$OUT/LISEZMOI.md"
(cd dist && rm -f RoboMaster-Windows.zip && zip -qr RoboMaster-Windows.zip RoboMaster-Windows)
echo "Prêt : desktop/dist/RoboMaster-Windows.zip"
