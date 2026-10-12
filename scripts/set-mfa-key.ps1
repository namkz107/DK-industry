param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $repositoryRoot 'backend\.env'

if (-not (Test-Path -LiteralPath $environmentFile)) {
  throw "backend/.env was not found. Create the environment file first."
}

$existingLines = Get-Content -LiteralPath $environmentFile -Encoding UTF8
$existingKey = $existingLines | Where-Object { $_ -match '^MFA_ENCRYPTION_KEY=.+$' } | Select-Object -First 1
if ($existingKey) {
  Write-Host 'MFA_ENCRYPTION_KEY already exists. No changes were made.' -ForegroundColor Yellow
  exit 0
}

$bytes = New-Object byte[] 48
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
$secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$lines = [System.Collections.Generic.List[string]]$existingLines
$index = -1
for ($i = 0; $i -lt $lines.Count; $i += 1) {
  if ($lines[$i] -match '^MFA_ENCRYPTION_KEY=') { $index = $i; break }
}
if ($index -ge 0) { $lines[$index] = "MFA_ENCRYPTION_KEY=$secret" }
else { $lines.Add("MFA_ENCRYPTION_KEY=$secret") }

[System.IO.File]::WriteAllLines($environmentFile, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host 'MFA_ENCRYPTION_KEY was generated in backend/.env. The value was not printed.' -ForegroundColor Green
