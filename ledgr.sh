#!/usr/bin/env bash
# ledgr.sh — Start Ledgr, open the browser, shut down on exit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
FRONTEND_URL="http://localhost:3000"
HEALTH_TIMEOUT=120
LOG_FILE="/tmp/ledgr-compose.log"

# Fallback: native macOS dialog blocks until user clicks "Stop"
_show_running_indicator() {
    osascript -e 'display dialog "Ledgr is running at http://localhost:3000\n\nClick Stop to shut down." with title "Ledgr" buttons {"Stop"} default button "Stop"' > /dev/null 2>&1 || true
}

cleanup() {
    echo "[ledgr] Shutting down services..."
    docker compose -f "$COMPOSE_FILE" down
}
trap cleanup EXIT INT TERM

echo "[ledgr] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d > "$LOG_FILE" 2>&1

echo "[ledgr] Waiting for frontend at $FRONTEND_URL ..."
elapsed=0
until curl -sf --max-time 2 "$FRONTEND_URL" > /dev/null 2>&1; do
    if [ "$elapsed" -ge "$HEALTH_TIMEOUT" ]; then
        osascript -e 'display alert "Ledgr failed to start" message "Check /tmp/ledgr-compose.log for details." as critical' > /dev/null 2>&1 || true
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

echo "[ledgr] Frontend is ready."

# Try Chrome/Chromium --app mode: standalone window, process exits when closed
CHROME_BIN=""
for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [ -x "$candidate" ]; then
        CHROME_BIN="$candidate"
        break
    fi
done

if [ -n "$CHROME_BIN" ]; then
    "$CHROME_BIN" --app="$FRONTEND_URL" --new-window &
    BROWSER_PID=$!
    wait "$BROWSER_PID"
else
    # No Chrome/Chromium: open default browser + block on native macOS dialog
    open "$FRONTEND_URL"
    _show_running_indicator
fi
# EXIT trap fires here → docker compose down
