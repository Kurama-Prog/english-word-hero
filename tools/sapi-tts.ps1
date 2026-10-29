# ============================================================
# sapi-tts.ps1 - batch generate word pronunciations via Windows SAPI
# Called by tools/build-audio.js (ASCII-only on purpose: Windows
# PowerShell reads non-BOM UTF-8 as ANSI and garbles CJK text)
# Params: -WordsJson path  -OutDir path
# ============================================================
param(
  [Parameter(Mandatory = $true)][string]$WordsJson,
  [Parameter(Mandatory = $true)][string]$OutDir
)

Add-Type -AssemblyName System.Speech

$words = Get-Content -LiteralPath $WordsJson -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $words) { Write-Error "empty word list"; exit 1 }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

$voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }
$pick = $voices | Where-Object { $_.VoiceInfo.Name -match 'Zira' } | Select-Object -First 1
if (-not $pick) { $pick = $voices | Where-Object { $_.VoiceInfo.Culture.Name -eq 'en-US' } | Select-Object -First 1 }
if (-not $pick) { $pick = $voices | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1 }
if (-not $pick) { Write-Error "no english voice installed"; exit 2 }

$synth.SelectVoice($pick.VoiceInfo.Name)
Write-Output ("voice: " + $pick.VoiceInfo.Name + " / " + $pick.VoiceInfo.Culture)

$synth.Rate = 0
$synth.Volume = 100

$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo -ArgumentList @(
  16000,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono
)

$ok = 0
$fail = 0
foreach ($w in $words) {
  $file = Join-Path $OutDir ($w.id + '.wav')
  try {
    $synth.SetOutputToWaveFile($file, $fmt)
    $synth.Speak($w.speech)
    $ok++
  } catch {
    $fail++
    Write-Output ("failed: " + $w.id + " -> " + $_.Exception.Message)
  }
}

$synth.SetOutputToNull()
$synth.Dispose()

Write-Output ("sapi done: ok=" + $ok + " fail=" + $fail)
