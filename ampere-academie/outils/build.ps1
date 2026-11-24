# Construit Ampère Académie en un seul fichier dist\index.html (+ icônes, manifeste)
# et génère les icônes si elles manquent.
# Usage : powershell -ExecutionPolicy Bypass -File outils\build.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$app  = Join-Path $root 'app'
$dist = Join-Path $root 'dist'

# --- Icônes : carré encre bleu-noir, « A » cuivre, sinusoïde ambre ---
Add-Type -AssemblyName System.Drawing
function New-Icon($size, $path, $pad, $bg) {
    $b = New-Object Drawing.Bitmap $size, $size
    $g = [Drawing.Graphics]::FromImage($b)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([Drawing.Color]::Transparent)
    $o = [single]($size * $pad); $w = [single]($size - 2 * $o); $r = [single]($w * 0.28)
    if ($bg) {
        $gp = New-Object Drawing.Drawing2D.GraphicsPath
        $gp.AddArc($o, $o, $r, $r, 180, 90); $gp.AddArc($o + $w - $r, $o, $r, $r, 270, 90)
        $gp.AddArc($o + $w - $r, $o + $w - $r, $r, $r, 0, 90); $gp.AddArc($o, $o + $w - $r, $r, $r, 90, 90); $gp.CloseFigure()
        $g.FillPath((New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(18, 24, 33))), $gp)
        $edge = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(232, 137, 74)), ([single]($w * 0.035))
        $g.DrawPath($edge, $gp)
    }
    $u = $w / 40.0
    $P = { param($x, $y) New-Object Drawing.PointF ([single]($o + $x * $u)), ([single]($o + $y * $u)) }
    $cop = New-Object Drawing.Drawing2D.LinearGradientBrush (& $P 0 0), (& $P 40 40), ([Drawing.Color]::FromArgb(255, 192, 143)), ([Drawing.Color]::FromArgb(176, 84, 33))
    $pen = New-Object Drawing.Pen $cop, ([single]($u * 3.4))
    $pen.LineJoin = 'Round'; $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawLines($pen, [Drawing.PointF[]]@((& $P 11.5 30.5), (& $P 20 9.5), (& $P 28.5 30.5)))
    $amb = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(255, 180, 58)), ([single]($u * 2.2))
    $amb.StartCap = 'Round'; $amb.EndCap = 'Round'
    $pts = for ($i = 0; $i -le 60; $i++) { $x = 7 + 26 * $i / 60; & $P $x (23 - 3.2 * [Math]::Sin(($x - 7) / 6.5 * [Math]::PI)) }
    $g.DrawLines($amb, [Drawing.PointF[]]$pts)
    $g.Dispose(); $b.Save($path, [Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
if (-not (Test-Path "$app\icon-512.png")) {
    New-Icon 512 "$app\icon-512.png" 0.03 $true
    New-Icon 192 "$app\icon-192.png" 0.03 $true
    New-Icon 512 "$app\icon-maskable.png" 0.0 $true
    New-Icon 432 "$app\icon-glyph.png" 0.12 $false
}

# --- Fichier unique ---
$utf8 = New-Object Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText("$app\index.html", $utf8)
$styleBlock = [regex]::Match($html, '<!--STYLE-->(.*?)<!--/STYLE-->', 'Singleline').Groups[1].Value
$css = ''
foreach ($m in [regex]::Matches($styleBlock, 'href="([^"]+)"')) { $css += [IO.File]::ReadAllText((Join-Path $app $m.Groups[1].Value), $utf8) + "`n" }
$html = [regex]::Replace($html, '<!--STYLE-->.*?<!--/STYLE-->', { param($m) "<style>`n$css`n</style>" }, 'Singleline')
$scripts = [regex]::Match($html, '<!--SCRIPTS-->(.*?)<!--/SCRIPTS-->', 'Singleline').Groups[1].Value
$js = ''
foreach ($m in [regex]::Matches($scripts, 'src="([^"]+)"')) {
    $f = Join-Path $app $m.Groups[1].Value
    if (-not (Test-Path $f)) { throw "Script manquant : $($m.Groups[1].Value)" }
    if ((Get-Item $f).Length -lt 100) { throw "Fichier source suspect (presque vide) : $($m.Groups[1].Value)" }
    $js += "`n/* ---- " + $m.Groups[1].Value + " ---- */`n" + [IO.File]::ReadAllText($f, $utf8)
}
$js = $js -replace '</script', '<\/script'
$html = [regex]::Replace($html, '<!--SCRIPTS-->.*?<!--/SCRIPTS-->', { param($m) "<script>$js`n</script>" }, 'Singleline')
if ($html.IndexOf([char]0) -ge 0) { throw "Caractere NUL detecte dans les sources : fichier corrompu." }

New-Item -ItemType Directory -Force $dist | Out-Null
[IO.File]::WriteAllText("$dist\index.html", $html, $utf8)
Copy-Item "$app\manifest.webmanifest", "$app\icon-192.png", "$app\icon-512.png", "$app\icon-maskable.png" $dist -Force
"OK : $dist\index.html ({0:N0} Ko)" -f ((Get-Item "$dist\index.html").Length / 1KB)
