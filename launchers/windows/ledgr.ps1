# ledgr.ps1 — Start Ledgr, open the browser, shut down on exit
#
# Run via ledgr.bat (double-click) or:
#   powershell -ExecutionPolicy Bypass -File ledgr.ps1
$ErrorActionPreference = 'Stop'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile = Join-Path $ScriptDir '..\..\docker-compose.yml'
$FrontendUrl = 'http://localhost:3000'
$HealthTimeout = 120
$LogFile     = Join-Path $env:TEMP 'ledgr-compose.log'

Add-Type -AssemblyName System.Windows.Forms

function Show-Error($msg) {
    [System.Windows.Forms.MessageBox]::Show($msg, 'Ledgr', 'OK', 'Error') | Out-Null
}

function Cleanup {
    Write-Host '[ledgr] Shutting down services...'
    docker compose -f $ComposeFile down
}

try {
    Write-Host '[ledgr] Starting services...'
    docker compose -f $ComposeFile up -d 2>&1 | Out-File -FilePath $LogFile -Encoding utf8

    Write-Host "[ledgr] Waiting for frontend at $FrontendUrl ..."
    $elapsed = 0
    while ($true) {
        try {
            Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 2 -UseBasicParsing | Out-Null
            break
        } catch {
            if ($elapsed -ge $HealthTimeout) {
                Show-Error "Ledgr failed to start.`nCheck $LogFile for details."
                exit 1
            }
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    }

    Write-Host '[ledgr] Frontend is ready.'

    # Try Chrome/Chromium --app mode: standalone window, process exits when closed
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
        [System.Windows.Forms.MessageBox]::Show(
            "Ledgr is running at $FrontendUrl`n`nClick OK to shut down.",
            'Ledgr', 'OK', 'Information') | Out-Null
    }
} finally {
    Cleanup
}
