$ErrorActionPreference = 'Stop'
$officeRootPath = Split-Path -Parent $PSScriptRoot
$connectionWorkspacePath = Join-Path $officeRootPath '.office-data\agents\_connection'
New-Item -ItemType Directory -Path $connectionWorkspacePath -Force | Out-Null
$antigravityExecutablePath = (Get-Command agy.exe -ErrorAction Stop).Source
# The user needs the official interactive client to complete Google's sign-in.
Start-Process -FilePath $antigravityExecutablePath -WorkingDirectory $connectionWorkspacePath -WindowStyle Normal
