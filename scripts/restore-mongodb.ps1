param(
  [Parameter(Mandatory = $true)]
  [string]$Archive,
  [string]$Uri = $env:MONGODB_URI,
  [switch]$DropExisting,
  [switch]$SkipIntegrityCheck
)

$ErrorActionPreference = 'Stop'
$resolvedArchive = (Resolve-Path -LiteralPath $Archive).Path

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
$restoreCommand = Get-Command mongorestore -ErrorAction SilentlyContinue
if (-not $restoreCommand -and $env:USERPROFILE) {
  $restoreCommand = Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads\mongodb-database-tools-windows-*') -Recurse -Filter mongorestore.exe -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $restoreCommand) { throw 'Khong tim thay mongorestore. Hay them MongoDB Database Tools\bin vao PATH.' }
$restoreExecutable = if ($restoreCommand.Source) { $restoreCommand.Source } else { $restoreCommand.FullName }

Write-Warning 'Khoi phuc co the ghi de du lieu. Hay kiem tra URI va tep backup truoc khi tiep tuc.'
$confirmation = Read-Host 'Nhap RESTORE de xac nhan'
if ($confirmation -cne 'RESTORE') { throw 'Da huy khoi phuc.' }

$arguments = @("--uri=$Uri", "--archive=$resolvedArchive", '--gzip')
if ($DropExisting) { $arguments += '--drop' }
& $restoreExecutable @arguments
if ($LASTEXITCODE -ne 0) { throw "mongorestore that bai voi ma $LASTEXITCODE" }
Write-Host 'Khoi phuc hoan tat. Hay chay smoke test va doi chieu so luong ban ghi.'
