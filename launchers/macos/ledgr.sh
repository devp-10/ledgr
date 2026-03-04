#!/usr/bin/env bash
# ledgr.sh — Start Ledgr, open the browser, shut down on exit

# Augment PATH so docker/curl are found when launched as a .app bundle
export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../../docker-compose.yml"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000/docs"
FRONTEND_TIMEOUT=60
BACKEND_TIMEOUT=300
LOG_FILE="/tmp/ledgr-compose.log"

_notify() {
    osascript -e "display notification \"$1\" with title \"Ledgr\"" > /dev/null 2>&1 || true
}

_alert() {
    osascript -e "display alert \"Ledgr\" message \"$1\" as critical" > /dev/null 2>&1 || true
}

_show_running_indicator() {
    osascript -e 'display dialog "Ledgr is running at http://localhost:3000\n\nClick Stop to shut down." with title "Ledgr" buttons {"Stop"} default button "Stop"' > /dev/null 2>&1 || true
}

cleanup() {
    echo "[ledgr] Shutting down services..."
    docker compose -f "$COMPOSE_FILE" down > /dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# ── Pre-flight: Docker must be running ───────────────────────────────────────
_notify "Starting Ledgr…"
if ! docker info > /dev/null 2>&1; then
    _alert "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# ── Start services ───────────────────────────────────────────────────────────
echo "[ledgr] Starting services..."
if ! docker compose -f "$COMPOSE_FILE" up -d > "$LOG_FILE" 2>&1; then
    _alert "Failed to start services. Check $LOG_FILE for details."
    exit 1
fi

# ── Phase 1: wait for frontend (nginx — fast) ────────────────────────────────
echo "[ledgr] Waiting for frontend at $FRONTEND_URL ..."
elapsed=0
until curl -sf --max-time 2 "$FRONTEND_URL" > /dev/null 2>&1; do
    if [ "$elapsed" -ge "$FRONTEND_TIMEOUT" ]; then
        _alert "Frontend did not start in time. Check $LOG_FILE for details."
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done
echo "[ledgr] Frontend is ready."

# ── Phase 2: wait for backend (FastAPI — slower; Ollama model load) ──────────
_notify "Waiting for backend to be ready…"
echo "[ledgr] Waiting for backend at $BACKEND_URL ..."
elapsed=0
until curl -sf --max-time 2 "$BACKEND_URL" > /dev/null 2>&1; do
    if [ "$elapsed" -ge "$BACKEND_TIMEOUT" ]; then
        _alert "Backend did not start in time. Check $LOG_FILE for details."
        exit 1
    fi
    sleep 3
    elapsed=$((elapsed + 3))
done
echo "[ledgr] Backend is ready."
_notify "Ledgr is ready!"

# ── Open browser ─────────────────────────────────────────────────────────────
CHROME_BIN=""
for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [ -x "$candidate" ]; then
        CHROME_BIN="$candidate"
        break
    fi
done

CHROME_PROFILE="/tmp/ledgr-chrome-profile"

if [ -n "$CHROME_BIN" ]; then
    # --user-data-dir forces an isolated Chrome process (not handed off to an
    # existing instance), so we can wait on its PID and detect window close.
    "$CHROME_BIN" --app="$FRONTEND_URL" --new-window \
        --user-data-dir="$CHROME_PROFILE" &
    BROWSER_PID=$!
    wait "$BROWSER_PID"
else
    # No Chrome/Chromium: can't detect window close for arbitrary browsers,
    # so fall back to a blocking Stop dialog.
    open "$FRONTEND_URL"
    _show_running_indicator
fi
# EXIT trap fires here → docker compose down
