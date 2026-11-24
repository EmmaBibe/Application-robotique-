# Compile Ampère Académie pour Windows : dossier dist\Ampere Academie PC + archive zip.
# Prérequis : outils\build.ps1 a produit dist\index.html.
# Usage : powershell -ExecutionPolicy Bypass -File windows\build.ps1
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$root = Split-Path $here -Parent
$dist = "$root\dist"
$wv2  = 'C:\Users\SUZANE\AndroidBuild\webview2'
$csc  = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$out  = "$dist\Ampere Academie PC"
if (-not (Test-Path "$dist\index.html")) { throw "dist\index.html introuvable : lance d'abord outils\build.ps1" }

# Icône .ico (256, 48, 32, 16) à partir de l'icône de l'application
Add-Type -AssemblyName System.Drawing
$src = [Drawing.Image]::FromFile("$dist\icon-512.png")
$imgs = foreach ($s in 256, 48, 32, 16) {
    $b = New-Object Drawing.Bitmap $s, $s
    $g = [Drawing.Graphics]::FromImage($b)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($src, 0, 0, $s, $s); $g.Dispose()
    $ms = New-Object IO.MemoryStream; $b.Save($ms, [Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
    , @($s, $ms.ToArray())
}
$src.Dispose()
$ico = New-Object IO.MemoryStream; $w = New-Object IO.BinaryWriter $ico
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$imgs.Count)
$off = 6 + 16 * $imgs.Count
foreach ($i in $imgs) {
    $sz = if ($i[0] -ge 256) { 0 } else { $i[0] }
    $w.Write([byte]$sz); $w.Write([byte]$sz); $w.Write([byte]0); $w.Write([byte]0)
    $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$i[1].Length); $w.Write([uint32]$off)
    $off += $i[1].Length
}
foreach ($i in $imgs) { $w.Write($i[1]) }
New-Item -ItemType Directory -Force "$here\obj" | Out-Null
[IO.File]::WriteAllBytes("$here\obj\app.ico", $ico.ToArray())

Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$out\www" | Out-Null
Copy-Item "$dist\index.html", "$dist\manifest.webmanifest", "$dist\icon-192.png", "$dist\icon-512.png" "$out\www\"
Copy-Item "$wv2\lib\net462\Microsoft.Web.WebView2.Core.dll", "$wv2\lib\net462\Microsoft.Web.WebView2.WinForms.dll", `
    "$wv2\runtimes\win-x64\native\WebView2Loader.dll" $out

# Compilation dans un dossier temporaire court (csc .NET 4 ne gère pas les chemins de plus de 260 caractères)
$tmp = Join-Path $env:TEMP 'ampere-build'
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $tmp | Out-Null
Copy-Item "$here\src\AmpereAcademie.cs", "$here\src\app.manifest", "$here\obj\app.ico" $tmp
& $csc /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 /out:"$tmp\Ampere Academie.exe" `
    /win32icon:"$tmp\app.ico" /win32manifest:"$tmp\app.manifest" `
    /r:"$wv2\lib\net462\Microsoft.Web.WebView2.Core.dll" /r:"$wv2\lib\net462\Microsoft.Web.WebView2.WinForms.dll" `
    /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Core.dll `
    "$tmp\AmpereAcademie.cs"
if ($LASTEXITCODE) { throw "csc a echoue ($LASTEXITCODE)" }
Move-Item -Force "$tmp\Ampere Academie.exe" $out
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue

$zip = "$dist\Ampere-Academie-Windows.zip"
Remove-Item $zip -ErrorAction SilentlyContinue
Compress-Archive -Path $out -DestinationPath $zip
"Programme prêt : $out\Ampere Academie.exe"
"Archive : $zip ({0:N1} Mo)" -f ((Get-Item $zip).Length / 1MB)
