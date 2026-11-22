#!/usr/bin/env bash
# Construit l'APK de l'application VIGIE sans Gradle : assemblage (build.mjs), aapt2, javac, d8, zipalign, apksigner.
# Prérequis : Node, JDK 17+, ANDROID_HOME avec platforms;android-34 et build-tools;35.0.0.
set -euo pipefail
cd "$(dirname "$0")"
node ../build.mjs
SDK="${ANDROID_HOME:-/opt/android-sdk}"
BT="$SDK/build-tools/35.0.0"
JAR="$SDK/platforms/android-34/android.jar"
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/classes" "$OUT/dex"
cp -r ../dist/www "$OUT/assets/www"
"$BT/aapt2" compile --dir res -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest AndroidManifest.xml -A "$OUT/assets" --java "$OUT/gen" "$OUT/res.zip" --auto-add-overlay
javac -g:none -nowarn -encoding UTF-8 --release 11 -classpath "$JAR" -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java') 2>&1 | grep -v -e 'Picked up' -e 'warning' || true
(cd "$OUT/classes" && jar cf ../classes.jar .)
"$BT/d8" --min-api 24 --lib "$JAR" --output "$OUT/dex" "$OUT/classes.jar"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && zip -q -j ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
KS="${KEYSTORE:-vigie.keystore}"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass vigieapp -keypass vigieapp -alias vigie -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=VIGIE, O=RoboMaster, C=FR" 2>/dev/null
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:vigieapp --key-pass pass:vigieapp --out VIGIE.apk "$OUT/aligned.apk"
"$BT/apksigner" verify VIGIE.apk && echo "APK prête : vigie-app/android/VIGIE.apk"
