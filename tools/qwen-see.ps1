<#
  qwen-see.ps1: ask the local vision model (qwen2.5vl:7b) about an image and write JSON to a file.
  Used to screen asset thumbnails and playtest screenshots before Claude ever looks at them.

  example:
    tools\qwen-see.ps1 -Image thumb.png -Question "is this a lobster? is there a watermark?" -Out screen\lobster.json

  default output schema: { "ok": bool, "matches": bool, "watermark": bool, "style": "lowpoly|scan|photo|drawing|other", "notes": string }
  pass -Schema to use a different one.
#>
param(
  [Parameter(Mandatory)] [string]$Image,
  [Parameter(Mandatory)] [string]$Question,
  [Parameter(Mandatory)] [string]$Out,
  [string]$Schema
)
$ErrorActionPreference = 'Stop'

$schemaObj = if ($Schema) { Get-Content -LiteralPath $Schema -Raw | ConvertFrom-Json } else {
  [ordered]@{
    type = 'object'
    properties = [ordered]@{
      ok        = @{ type = 'boolean'; description = 'true if the image is usable for the stated purpose' }
      matches   = @{ type = 'boolean'; description = 'true if the image shows what the question asks about' }
      watermark = @{ type = 'boolean' }
      style     = @{ type = 'string'; enum = @('lowpoly','scan','photo','drawing','ui','other') }
      notes     = @{ type = 'string'; description = 'one short sentence' }
    }
    required = @('ok','matches','watermark','style','notes')
  }
}

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Image).Path))
$body = @{
  model  = 'qwen2.5vl:7b'
  prompt = "$Question`nanswer as json only."
  images = @($b64)
  stream = $false
  format = $schemaObj
  options = @{ temperature = 0.1; num_predict = 300 }
} | ConvertTo-Json -Depth 20

$r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json; charset=utf-8' `
       -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 600
$null = $r.response | ConvertFrom-Json

$dir = Split-Path -Parent $Out
if ($dir) { New-Item -ItemType Directory -Force $dir | Out-Null }
Set-Content -LiteralPath $Out -Value $r.response -Encoding UTF8
"see ok: $([IO.Path]::GetFileName($Image)) -> $Out"
