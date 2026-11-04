$ErrorActionPreference = 'Stop'
$officeCodex = if ($env:CODEX_BIN) { $env:CODEX_BIN } else { (Get-Command codex.exe -ErrorAction Stop).Source }
# An interactive window is needed only when the user explicitly clicks sign-in.
Start-Process -FilePath $officeCodex -ArgumentList @('login') -WindowStyle Normal
