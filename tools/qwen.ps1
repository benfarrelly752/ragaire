<#
  qwen.ps1: run a local Ollama model and write the result straight to a file.
  Claude calls this so bulk text never passes through Claude's context.

  examples:
    tools\qwen.ps1 -Model ragaire-writer -Prompt "write 20 loading-screen tips" -Out drafts\tips.txt
    tools\qwen.ps1 -Model ragaire-json -Prompt "extract the licence" -Input page.txt -Schema tools\qwen\credit.schema.json -Out x.json

  -Prompt   text, or a path to a .txt/.md file containing the prompt
  -Input    optional files appended to the prompt as context (each fenced with its name)
  -Schema   optional JSON-schema file; Ollama then guarantees valid JSON
  prints a one-line summary (never the output itself)
#>
param(
  [ValidateSet('ragaire-writer','ragaire-json','qwen3:8b')] [string]$Model = 'ragaire-writer',
  [Parameter(Mandatory)] [string]$Prompt,
  [string[]]$Input = @(),
  [string]$Schema,
  [Parameter(Mandatory)] [string]$Out,
  [int]$MaxTokens = 2048
)
$ErrorActionPreference = 'Stop'

$text = if (Test-Path -LiteralPath $Prompt -PathType Leaf) { Get-Content -LiteralPath $Prompt -Raw } else { $Prompt }
foreach ($f in $Input) {
  $text += "`n`n--- $([IO.Path]::GetFileName($f)) ---`n" + (Get-Content -LiteralPath $f -Raw)
}

$body = @{
  model   = $Model
  prompt  = $text
  stream  = $false
  think   = $false
  options = @{ num_predict = $MaxTokens }
}
if ($Schema) { $body.format = Get-Content -LiteralPath $Schema -Raw | ConvertFrom-Json }

$json = $body | ConvertTo-Json -Depth 50
$r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json; charset=utf-8' `
       -Body ([Text.Encoding]::UTF8.GetBytes($json)) -TimeoutSec 900

# belt and braces: strip any stray thinking block
$outText = ($r.response -replace '(?s)<think>.*?</think>', '').Trim()

if ($Schema) { $null = $outText | ConvertFrom-Json }   # throws if somehow invalid

$dir = Split-Path -Parent $Out
if ($dir) { New-Item -ItemType Directory -Force $dir | Out-Null }
$full = [IO.Path]::GetFullPath((Join-Path (Get-Location) $Out))
[IO.File]::WriteAllText($full, $outText, (New-Object Text.UTF8Encoding $false))

$tps = if ($r.eval_duration) { [math]::Round($r.eval_count / ($r.eval_duration / 1e9), 1) } else { 0 }
"qwen ok: $Model -> $Out  ($($outText.Length) chars, $(( $outText -split "`n").Count) lines, $($r.eval_count) tok @ $tps tok/s)"
