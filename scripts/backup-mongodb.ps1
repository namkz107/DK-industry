param(
  [string]$Uri = $env:MONGODB_URI,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$ErrorActionPreference = 'Stop'

if (-not $Uri) {
  $envFile = Join-Path $PSScriptRoot '..\backend\.env'
  if (Test-Path -LiteralPath $envFile) {
    $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
    if ($line) { $Uri = $line.Substring('MONGODB_URI='.Length).Trim().Trim('"').Trim("'") }
  }
}

if (-not $Uri) { throw 'Khong tim thay MONGODB_URI. Hay cau hinh backend/.env hoac truyen -Uri.' }
$dumpCommand = Get-Command mongodump -ErrorAction SilentlyContinue
if (-not $dumpCommand -and $env:USERPROFILE) {
  $dumpCommand = Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads\mongodb-database-tools-windows-*') -Recurse -Filter mongodump.exe -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $dumpCommand) { throw 'Khong tim thay mongodump. Hay them MongoDB Database Tools\bin vao PATH.' }
$dumpExecutable = if ($dumpCommand.Source) { $dumpCommand.Source } else { $dumpCommand.FullName }

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archive = Join-Path $resolvedOutput "dk-industry-$timestamp.archive.gz"

& $dumpExecutable "--uri=$Uri" "--archive=$archive" --gzip
if ($LASTEXITCODE -ne 0) { throw "mongodump that bai voi ma $LASTEXITCODE" }

$hash = Get-FileHash -LiteralPath $archive -Algorithm SHA256
$hashFile = "$archive.sha256"
Set-Content -LiteralPath $hashFile -Value "$($hash.Hash.ToLowerInvariant()) *$([System.IO.Path]::GetFileName($archive))" -Encoding ascii
Write-Host "Backup hoan tat: $archive"
Write-Host "SHA256: $($hash.Hash)"
Write-Host "Tep kiem tra: $hashFile"
