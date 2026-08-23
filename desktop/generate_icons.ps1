Add-Type -AssemblyName System.Drawing

$width = 256
$height = 256
$bmp = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background: Dark Editorial Blue
$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 23, 32, 51))
$graphics.FillRectangle($bgBrush, 0, 0, $width, $height)

# Gold MONVEX 'M' Emblem
$goldPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 212, 175, 55)), 18
$goldPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$goldPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$goldPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

$points = @(
    (New-Object System.Drawing.Point 44, 200),
    (New-Object System.Drawing.Point 84, 64),
    (New-Object System.Drawing.Point 128, 148),
    (New-Object System.Drawing.Point 172, 64),
    (New-Object System.Drawing.Point 212, 200)
)
$graphics.DrawLines($goldPen, $points)

$graphics.Dispose()

# Save PNGs
$bmp.Save("d:\MONVEX\desktop\src-tauri\icons\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp32 = New-Object System.Drawing.Bitmap $bmp, 32, 32
$bmp32.Save("d:\MONVEX\desktop\src-tauri\icons\32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp128 = New-Object System.Drawing.Bitmap $bmp, 128, 128
$bmp128.Save("d:\MONVEX\desktop\src-tauri\icons\128x128.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Save genuine Windows ICO
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite("d:\MONVEX\desktop\src-tauri\icons\icon.ico")
$icon.Save($fs)
$fs.Close()

Write-Output "MONVEX Desktop Icons Generated Successfully"
