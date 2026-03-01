import os
from pathlib import Path

# ── Ollama ────────────────────────────────────────────────────────────────────
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "mistral")

# ── Database ──────────────────────────────────────────────────────────────────
_db_path = os.environ.get("DB_PATH")
if not _db_path:
    raise RuntimeError("DB_PATH environment variable is required. Run the app via Docker.")
DB_PATH = Path(_db_path)

# ── HTTP timeouts (seconds) ───────────────────────────────────────────────────
CATEGORIZE_TIMEOUT = 180.0

# ── Categorizer ───────────────────────────────────────────────────────────────
BATCH_SIZE = 5

# ── Dashboard / Reports ───────────────────────────────────────────────────────
MONTHLY_TREND_MONTHS = 6
RECENT_TRANSACTIONS_LIMIT = 10
TOP_EXPENSES_LIMIT = 10

