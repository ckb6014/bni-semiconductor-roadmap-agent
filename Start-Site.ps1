$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = if (Test-Path $bundledNode) { $bundledNode } else { "node" }

function Test-PortAvailable {
  param([int]$Port)
  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    return $true
  }
  catch {
    return $false
  }
  finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

if ($env:PORT) {
  $port = [int]$env:PORT
}
else {
  $port = 8080
  while (-not (Test-PortAvailable -Port $port)) {
    $port += 1
  }
  $env:PORT = [string]$port
}

if (-not $env:OPENAI_API_KEY) {
  $secureKey = Read-Host "OpenAI API Key를 입력하세요. GPT 검색을 건너뛰려면 Enter" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ($plainKey) {
      $env:OPENAI_API_KEY = $plainKey
    }
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

Write-Host "Serving BNI Semiconductor Roadmap AI Agent at http://localhost:$port/site/"
if ($env:OPENAI_API_KEY) {
  Write-Host "GPT API: enabled"
}
else {
  Write-Host "GPT API: disabled. Restart and enter OPENAI_API_KEY to use GPT search."
}
Write-Host "Press Ctrl+C to stop."

Set-Location $root
& $node .\server.js
