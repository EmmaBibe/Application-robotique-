# Compile Ampère Académie en APK signé, sans Gradle (aapt2, javac, d8, zipalign, apksigner).
# Prérequis : outils\build.ps1 a produit dist\index.html.
# Usage : powershell -ExecutionPolicy Bypass -File android\build.ps1
$ErrorActionPreference = 'Stop'
function Run($exe) { $e = $ErrorActionPreference; $ErrorActionPreference = 'Continue'; & $exe @args 2>&1 | ForEach-Object { "$_" }; $ErrorActionPreference = $e; if ($LASTEXITCODE) { throw "$exe a echoue ($LASTEXITCODE)" } }
$here  = $PSScriptRoot
$root  = Split-Path $here -Parent
$tools = 'C:\Users\SUZANE\AndroidBuild'
$env:JAVA_HOME = (Get-ChildItem "$tools\jdk" -Directory | Select-Object -First 1).FullName
$jbin  = "$env:JAVA_HOME\bin"
$bt    = "$tools\sdk\build-tools\34.0.0"
$jar   = "$tools\sdk\platforms\android-34\android.jar"
$dist  = "$root\dist"
if (-not (Test-Path "$dist\index.html")) { throw "dist\index.html introuvable : lance d'abord outils\build.ps1" }

# Tout se construit dans un dossier temporaire court (certains outils refusent les chemins de plus de 260 caractères)
$w = Join-Path $env:TEMP 'ampere-apk'
Remove-Item -Recurse -Force $w -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$w\assets\www", "$w\gen", "$w\classes", "$w\dex" | Out-Null
Copy-Item -Recurse "$here\res", "$here\src" $w
Copy-Item "$here\AndroidManifest.xml" $w
Copy-Item "$dist\index.html", "$dist\manifest.webmanifest", "$dist\icon-192.png", "$dist\icon-512.png" "$w\assets\www\"

# --- Icônes ---
Add-Type -AssemblyName System.Drawing
function Resize($src, $size, $dst) {
    $img = [Drawing.Image]::FromFile($src); $b = New-Object Drawing.Bitmap $size, $size
    $g = [Drawing.Graphics]::FromImage($b); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose(); $img.Dispose(); $b.Save($dst, [Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
$sizes = @{ 'mipmap-mdpi' = 48; 'mipmap-hdpi' = 72; 'mipmap-xhdpi' = 96; 'mipmap-xxhdpi' = 144; 'mipmap-xxxhdpi' = 192 }
foreach ($k in $sizes.Keys) { New-Item -ItemType Directory -Force "$w\res\$k" | Out-Null; Resize "$dist\icon-512.png" $sizes[$k] "$w\res\$k\ic_launcher.png" }
New-Item -ItemType Directory -Force "$w\res\drawable-nodpi" | Out-Null
Copy-Item "$root\app\icon-glyph.png" "$w\res\drawable-nodpi\icon_glyph.png"

# --- Clé de signature : la garder ! Sans elle, impossible de mettre à jour l'application installée. ---
# La clé est conservée hors du dépôt, dans le dossier des outils (sauvegarde à faire aussi sur un autre support).
$ksDir = "$tools\cles\ampere-academie"; $pf = "$ksDir\keystore.properties"
New-Item -ItemType Directory -Force $ksDir | Out-Null
if (-not (Test-Path "$ksDir\ampere-academie.jks")) {
    $pw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Set-Content $pf "storePassword=$pw" -Encoding ascii
    Run "$jbin\keytool.exe" -genkeypair -keystore "$w\k.jks" -alias ampereacademie -keyalg RSA -keysize 2048 `
        -validity 10000 -storepass $pw -keypass $pw -dname "CN=Ampere Academie, O=Ampere Academie, C=CD"
    Copy-Item "$w\k.jks" "$ksDir\ampere-academie.jks"
}
Copy-Item "$ksDir\ampere-academie.jks" "$w\k.jks" -Force
$pw = ((Get-Content $pf) -replace '^storePassword=', '')

# --- Compilation ---
Push-Location $w
try {
    Run "$bt\aapt2.exe" compile --dir res -o res.zip
    Run "$bt\aapt2.exe" link -o base.apk -I $jar --manifest AndroidManifest.xml --java gen res.zip
    $srcs = Get-ChildItem -Recurse src, gen -Filter *.java | ForEach-Object FullName
    Run "$jbin\javac.exe" -encoding UTF-8 --release 8 -classpath $jar '-Xlint:-options' -d classes @srcs
    $classes = Get-ChildItem -Recurse classes -Filter *.class | ForEach-Object FullName
    Run "$bt\d8.bat" --release --min-api 24 --lib $jar --output dex @classes
    Run "$jbin\jar.exe" -uMf base.apk -C dex classes.dex assets
    Run "$bt\zipalign.exe" -p -f 4 base.apk aligned.apk
    Run "$bt\apksigner.bat" sign --ks k.jks --ks-key-alias ampereacademie --ks-pass "pass:$pw" --out Ampere-Academie.apk aligned.apk
    Run "$bt\apksigner.bat" verify Ampere-Academie.apk
} finally { Pop-Location }
Copy-Item "$w\Ampere-Academie.apk" "$dist\Ampere-Academie.apk" -Force
Remove-Item -Recurse -Force $w -ErrorAction SilentlyContinue
"APK prêt : $dist\Ampere-Academie.apk ({0:N1} Mo)" -f ((Get-Item "$dist\Ampere-Academie.apk").Length / 1MB)
