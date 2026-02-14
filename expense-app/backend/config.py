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
_db_default = Path(__file__).parent.parent.parent / "data" / "expenses.db"
DB_PATH = Path(os.environ.get("DB_PATH", str(_db_default)))

# ── HTTP timeouts (seconds) ───────────────────────────────────────────────────
CATEGORIZE_TIMEOUT = 180.0
TEST_TIMEOUT = 5.0

# ── Categorizer ───────────────────────────────────────────────────────────────
BATCH_SIZE = 5

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
