param(
  [string]$Uri = $env:MONGODB_URI,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups'),
  [string]$AgeRecipient = $env:BACKUP_AGE_RECIPIENT
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
if (-not $AgeRecipient) { throw 'Thieu BACKUP_AGE_RECIPIENT. Chi cung cap age public recipient; khong dat private key tren may backup.' }
if ($AgeRecipient -notmatch '^age1[0-9a-z]{50,}$') { throw 'BACKUP_AGE_RECIPIENT khong dung dinh dang age public recipient.' }

$dumpCommand = Get-Command mongodump -ErrorAction SilentlyContinue
if (-not $dumpCommand -and $env:USERPROFILE) {
  $dumpCommand = Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads\mongodb-database-tools-windows-*') -Recurse -Filter mongodump.exe -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $dumpCommand) { throw 'Khong tim thay mongodump. Hay them MongoDB Database Tools\bin vao PATH.' }
$dumpExecutable = if ($dumpCommand.Source) { $dumpCommand.Source } else { $dumpCommand.FullName }
$ageCommand = Get-Command age -ErrorAction SilentlyContinue
if (-not $ageCommand) { throw 'Khong tim thay age. Hay cai age CLI va them vao PATH.' }
$ageExecutable = if ($ageCommand.Source) { $ageCommand.Source } else { $ageCommand.Path }

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$encryptedArchive = Join-Path $resolvedOutput "dk-industry-$timestamp.archive.gz.age"
$hashFile = "$encryptedArchive.sha256"
$temporaryArchive = Join-Path ([System.IO.Path]::GetTempPath()) "dk-industry-$([guid]::NewGuid().ToString('N')).archive.gz"

try {
  & $dumpExecutable "--uri=$Uri" "--archive=$temporaryArchive" --gzip
  if ($LASTEXITCODE -ne 0) { throw "mongodump that bai voi ma $LASTEXITCODE" }

  & $ageExecutable --recipient $AgeRecipient --output $encryptedArchive $temporaryArchive
  if ($LASTEXITCODE -ne 0) { throw "age ma hoa that bai voi ma $LASTEXITCODE" }
  if (-not (Test-Path -LiteralPath $encryptedArchive)) { throw 'age khong tao tep backup ma hoa.' }

  $hash = Get-FileHash -LiteralPath $encryptedArchive -Algorithm SHA256
  Set-Content -LiteralPath $hashFile -Value "$($hash.Hash.ToLowerInvariant()) *$([System.IO.Path]::GetFileName($encryptedArchive))" -Encoding ascii
  Write-Host "Backup ma hoa hoan tat: $encryptedArchive"
  Write-Host "SHA256: $($hash.Hash)"
  Write-Host "Tep kiem tra: $hashFile"
} catch {
  Remove-Item -LiteralPath $encryptedArchive, $hashFile -Force -ErrorAction SilentlyContinue
  throw
} finally {
  Remove-Item -LiteralPath $temporaryArchive -Force -ErrorAction SilentlyContinue
}
