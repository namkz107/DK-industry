param(
  [Parameter(Mandatory = $true)]
  [string]$Archive,
  [string]$Uri = $env:MONGODB_URI,
  [Parameter(Mandatory = $true)]
  [string]$SourceDatabase,
  [Parameter(Mandatory = $true)]
  [string]$TargetDatabase,
  [string]$AgeIdentityFile = $env:BACKUP_AGE_IDENTITY_FILE,
  [switch]$DropExisting,
  [switch]$SkipIntegrityCheck,
  [switch]$AllowNonTestTarget,
  [switch]$ConfirmRestore
)

$ErrorActionPreference = 'Stop'
$resolvedArchive = (Resolve-Path -LiteralPath $Archive).Path
if ([System.IO.Path]::GetExtension($resolvedArchive) -ne '.age') { throw 'Chi chap nhan backup da ma hoa co duoi .age.' }
if (-not $AgeIdentityFile) { throw 'Thieu BACKUP_AGE_IDENTITY_FILE. Private key phai nam ngoai repository va ngoai thu muc backup.' }
$resolvedIdentity = (Resolve-Path -LiteralPath $AgeIdentityFile).Path
$ageCommand = Get-Command age -ErrorAction SilentlyContinue
if (-not $ageCommand) { throw 'Khong tim thay age. Hay cai age CLI va them vao PATH.' }
$ageExecutable = if ($ageCommand.Source) { $ageCommand.Source } else { $ageCommand.Path }

if (-not $SkipIntegrityCheck) {
  $hashFile = "$resolvedArchive.sha256"
  if (-not (Test-Path -LiteralPath $hashFile)) { throw "Khong tim thay tep kiem tra SHA-256: $hashFile. Chi dung -SkipIntegrityCheck khi da xac minh nguon backup doc lap." }
  $expected = ((Get-Content -LiteralPath $hashFile -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
  if ($expected -notmatch '^[a-f0-9]{64}$') { throw 'Tep SHA-256 khong hop le.' }
  $actual = (Get-FileHash -LiteralPath $resolvedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw 'SHA-256 khong khop. Dung khoi phuc de tranh dung backup bi hong hoac bi thay doi.' }
  Write-Host 'Da xac minh SHA-256 cua backup.'
}

if (-not $Uri) {
  $envFile = Join-Path $PSScriptRoot '..\backend\.env'
  if (Test-Path -LiteralPath $envFile) {
    $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
    if ($line) { $Uri = $line.Substring('MONGODB_URI='.Length).Trim().Trim('"').Trim("'") }
  }
}

if (-not $Uri) { throw 'Khong tim thay MONGODB_URI. Hay cau hinh backend/.env hoac truyen -Uri.' }
if ($SourceDatabase -notmatch '^[A-Za-z0-9_-]+$') { throw 'SourceDatabase khong hop le.' }
if ($TargetDatabase -notmatch '^[A-Za-z0-9_-]+$') { throw 'TargetDatabase khong hop le.' }
if ($SourceDatabase -eq $TargetDatabase) { throw 'TargetDatabase phai khac SourceDatabase de tranh ghi de database nguon.' }
if (-not $AllowNonTestTarget -and $TargetDatabase -notmatch '(?:_test|-test)$') {
  throw 'TargetDatabase phai ket thuc bang _test hoac -test. Chi dung -AllowNonTestTarget khi da co quy trinh phe duyet khoi phuc production.'
}
$restoreCommand = Get-Command mongorestore -ErrorAction SilentlyContinue
if (-not $restoreCommand -and $env:USERPROFILE) {
  $downloadsPath = Join-Path $env:USERPROFILE 'Downloads'
  if (Test-Path -LiteralPath $downloadsPath) {
    $restoreCommand = Get-ChildItem -Path $downloadsPath -Recurse -Filter mongorestore.exe -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  }
}
if (-not $restoreCommand) { throw 'Khong tim thay mongorestore. Hay them MongoDB Database Tools\bin vao PATH.' }
$restoreExecutable = if ($restoreCommand.Source) { $restoreCommand.Source } else { $restoreCommand.FullName }
$decryptedArchive = Join-Path ([System.IO.Path]::GetTempPath()) "dk-industry-restore-$([guid]::NewGuid().ToString('N')).archive.gz"

Write-Warning 'Khoi phuc co the ghi de du lieu. Hay kiem tra URI va tep backup truoc khi tiep tuc.'
if (-not $ConfirmRestore) {
  $confirmation = Read-Host 'Nhap RESTORE de xac nhan'
  if ($confirmation -cne 'RESTORE') { throw 'Da huy khoi phuc.' }
}

try {
  & $ageExecutable --decrypt --identity $resolvedIdentity --output $decryptedArchive $resolvedArchive
  if ($LASTEXITCODE -ne 0) { throw "age giai ma that bai voi ma $LASTEXITCODE" }
  if (-not (Test-Path -LiteralPath $decryptedArchive)) { throw 'age khong tao tep tam da giai ma.' }

  $arguments = @(
    "--uri=$Uri",
    "--archive=$decryptedArchive",
    '--gzip',
    "--nsInclude=$SourceDatabase.*",
    "--nsFrom=$SourceDatabase.*",
    "--nsTo=$TargetDatabase.*"
  )
  if ($DropExisting) { $arguments += '--drop' }
  & $restoreExecutable @arguments
  if ($LASTEXITCODE -ne 0) { throw "mongorestore that bai voi ma $LASTEXITCODE" }
  Write-Host 'Khoi phuc hoan tat. Hay chay smoke test va doi chieu so luong ban ghi.'
} finally {
  Remove-Item -LiteralPath $decryptedArchive -Force -ErrorAction SilentlyContinue
}
