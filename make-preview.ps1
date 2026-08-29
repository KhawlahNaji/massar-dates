$files = Get-ChildItem ".\uploads" -File | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png|webp)$'
}

$html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MASSAR Uploads Preview</title>
<style>
body { font-family: Arial; background:#eee; padding:20px; }
.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.card { background:white; padding:10px; border-radius:10px; box-shadow:0 2px 8px #aaa; }
.card img { width:100%; height:180px; object-fit:contain; background:#f5f5f5; }
.num { font-size:22px; font-weight:bold; margin:5px 0; }
.name { font-size:12px; word-break:break-all; }
</style>
</head>
<body>
<h1>MASSAR DATES - Uploads Preview</h1>
<div class="grid">
"@

$i = 1
foreach ($file in $files) {
    $name = [System.Net.WebUtility]::HtmlEncode($file.Name)
    $html += "<div class='card'><div class='num'>#$i</div><img src='uploads/$name'><div class='name'>$name</div></div>"
    $i++
}

$html += "</div></body></html>"

Set-Content ".\uploads-preview.html" $html -Encoding UTF8
Start-Process ".\uploads-preview.html"
