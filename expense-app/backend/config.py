import os
from pathlib import Path

# ── Ollama ────────────────────────────────────────────────────────────────────
# Store raw env vars separately (None = not set) so downstream code can
# distinguish "operator explicitly configured this" from "using default".
OLLAMA_URL_ENV: str | None = os.environ.get("OLLAMA_URL")
OLLAMA_MODEL_ENV: str | None = os.environ.get("OLLAMA_MODEL")

OLLAMA_URL_DEFAULT = "http://localhost:11434"
OLLAMA_MODEL_DEFAULT = "mistral"

# ── Database ──────────────────────────────────────────────────────────────────
_db_path = os.environ.get("DB_PATH")
if not _db_path:
    raise RuntimeError("DB_PATH environment variable is required. Run the app via Docker.")
DB_PATH = Path(_db_path)

# ── HTTP timeouts (seconds) ───────────────────────────────────────────────────
CATEGORIZE_TIMEOUT = 180.0
TEST_TIMEOUT = 5.0

# ── Categorizer ───────────────────────────────────────────────────────────────
BATCH_SIZE = 5

# ── Dashboard / Reports ───────────────────────────────────────────────────────
MONTHLY_TREND_MONTHS = 6
RECENT_TRANSACTIONS_LIMIT = 10
TOP_EXPENSES_LIMIT = 10

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
