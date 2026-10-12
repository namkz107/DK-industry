param(
  [Parameter(Mandatory = $true)]
  [string]$Archive,
  [string]$Uri = $env:MONGODB_URI,
  [switch]$DropExisting
)

$ErrorActionPreference = 'Stop'
$resolvedArchive = (Resolve-Path -LiteralPath $Archive).Path

if (-not $Uri) {
  $envFile = Join-Path $PSScriptRoot '..\backend\.env'
  if (Test-Path -LiteralPath $envFile) {
    $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
    if ($line) { $Uri = $line.Substring('MONGODB_URI='.Length).Trim().Trim('"').Trim("'") }
  }
}

if (-not $Uri) { throw 'Không tìm thấy MONGODB_URI. Hãy cấu hình backend/.env hoặc truyền -Uri.' }
$restoreCommand = Get-Command mongorestore -ErrorAction SilentlyContinue
if (-not $restoreCommand -and $env:USERPROFILE) {
  $restoreCommand = Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads\mongodb-database-tools-windows-*') -Recurse -Filter mongorestore.exe -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $restoreCommand) { throw 'Không tìm thấy mongorestore. Hãy thêm MongoDB Database Tools\bin vào PATH.' }
$restoreExecutable = if ($restoreCommand.Source) { $restoreCommand.Source } else { $restoreCommand.FullName }

Write-Warning 'Khôi phục có thể ghi đè dữ liệu. Hãy kiểm tra URI và tệp backup trước khi tiếp tục.'
$confirmation = Read-Host 'Nhập RESTORE để xác nhận'
if ($confirmation -cne 'RESTORE') { throw 'Đã hủy khôi phục.' }

$arguments = @("--uri=$Uri", "--archive=$resolvedArchive", '--gzip')
if ($DropExisting) { $arguments += '--drop' }
& $restoreExecutable @arguments
if ($LASTEXITCODE -ne 0) { throw "mongorestore thất bại với mã $LASTEXITCODE" }
Write-Host 'Khôi phục hoàn tất. Hãy chạy smoke test và đối chiếu số lượng bản ghi.'
