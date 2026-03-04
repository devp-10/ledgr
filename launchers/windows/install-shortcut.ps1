# install-shortcut.ps1 — Create a Desktop shortcut for Ledgr
#
# Run once:
#   powershell -ExecutionPolicy Bypass -File install-shortcut.ps1

$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target       = Join-Path $ScriptDir 'ledgr.bat'
$Desktop      = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Ledgr.lnk'

$Shell    = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath       = $Target
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description      = 'Launch Ledgr expense tracker'
$Shortcut.Save()

Write-Host "Shortcut created: $ShortcutPath"
