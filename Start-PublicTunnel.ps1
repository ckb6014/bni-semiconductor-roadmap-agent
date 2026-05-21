$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:PORT) { [int]$env:PORT } else { 8091 }
$env:PORT = [string]$port

$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = if (Test-Path $bundledNode) { $bundledNode } else { "node" }

Set-Location $root

Write-Host "Starting local server on http://localhost:$port/site/"
$server = Start-Process -FilePath $node -ArgumentList ".\server.js" -WorkingDirectory $root -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 2

Write-Host "Creating public tunnel. Keep this PowerShell window open."
Write-Host "When the https://*.lhr.life URL appears, share that URL with your team."
Write-Host "Press Ctrl+C to stop the tunnel. Local server process id: $($server.Id)"

ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:$port nokey@localhost.run

