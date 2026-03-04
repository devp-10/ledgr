# ledgr.ps1 — Start Ledgr, open the browser, shut down on exit
#
# Run via ledgr.bat (double-click) or:
#   powershell -ExecutionPolicy Bypass -File ledgr.ps1

$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile    = Join-Path $ScriptDir '..\..\docker-compose.yml'
$FrontendUrl    = 'http://localhost:3000'
$BackendUrl     = 'http://localhost:8000/docs'
$FrontendTimeout = 60
$BackendTimeout  = 300
$LogFile        = Join-Path $env:TEMP 'ledgr-compose.log'

Add-Type -AssemblyName System.Windows.Forms

function Show-Info($msg) {
    [System.Windows.Forms.MessageBox]::Show($msg, 'Ledgr', 'OK', 'Information') | Out-Null
}

function Show-Error($msg) {
    [System.Windows.Forms.MessageBox]::Show($msg, 'Ledgr', 'OK', 'Error') | Out-Null
}

function Wait-Url($url, $timeoutSec, $label) {
    $elapsed = 0
    Write-Host "[ledgr] Waiting for $label at $url ..."
    while ($true) {
        try {
            Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing | Out-Null
            return $true
        } catch {
            if ($elapsed -ge $timeoutSec) { return $false }
            Start-Sleep -Seconds 3
            $elapsed += 3
        }
    }
}

function Cleanup {
    Write-Host '[ledgr] Shutting down services...'
    docker compose -f $ComposeFile down 2>&1 | Out-Null
}

# ── Pre-flight: Docker must be running ───────────────────────────────────────
Write-Host '[ledgr] Checking Docker...'
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Show-Error 'Docker is not running. Please start Docker Desktop and try again.'
    exit 1
}

try {
    # ── Start services ───────────────────────────────────────────────────────
    Write-Host '[ledgr] Starting services...'
    docker compose -f $ComposeFile up -d 2>&1 | Out-File -FilePath $LogFile -Encoding utf8
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to start services.`nCheck $LogFile for details."
        exit 1
    }

    # ── Phase 1: wait for frontend (fast) ────────────────────────────────────
    if (-not (Wait-Url $FrontendUrl $FrontendTimeout 'frontend')) {
        Show-Error "Frontend did not start in time.`nCheck $LogFile for details."
        exit 1
    }
    Write-Host '[ledgr] Frontend is ready.'

    # ── Phase 2: wait for backend (slower — Ollama model load) ───────────────
    Show-Info 'Ledgr services are starting. Waiting for the backend to be ready (this may take a few minutes on first run)…'
    if (-not (Wait-Url $BackendUrl $BackendTimeout 'backend')) {
        Show-Error "Backend did not start in time.`nCheck $LogFile for details."
        exit 1
    }
    Write-Host '[ledgr] Backend is ready.'

    # ── Open browser ─────────────────────────────────────────────────────────
    $ChromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Chromium\Application\chrome.exe"
    )
    $ChromeBin = $ChromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($ChromeBin) {
        $proc = Start-Process -FilePath $ChromeBin `
            -ArgumentList "--app=$FrontendUrl", '--new-window' `
            -PassThru
        $proc.WaitForExit()
    } else {
        # No Chrome/Chromium: open default browser + block on dialog
        Start-Process $FrontendUrl
        Show-Info "Ledgr is running at $FrontendUrl`n`nClick OK to shut down."
    }
} finally {
    Cleanup
}
