import config
from services.database import get_connection


def get_ollama_settings() -> tuple[str, str]:
    """
    Resolve Ollama URL and model name with explicit precedence:

      1. Env var  — set by Docker / operator; always wins
      2. DB value — saved by user via the Settings UI
      3. Default  — defined once in config.py

    This is the single authoritative implementation. All code that needs
    Ollama connection details must call this function instead of reading
    env vars or the DB directly.
    """
    # Env var wins — deployment-level config cannot be overridden from the UI
    if config.OLLAMA_URL_ENV:
        return (
            config.OLLAMA_URL_ENV,
            config.OLLAMA_MODEL_ENV or config.OLLAMA_MODEL_DEFAULT,
        )

    # Fall back to user-saved DB overrides (local / no-env-var scenarios)
    with get_connection() as conn:
        url_row = conn.execute(
            "SELECT value FROM settings WHERE key='ollama_url'"
        ).fetchone()
        model_row = conn.execute(
            "SELECT value FROM settings WHERE key='ollama_model'"
        ).fetchone()

    url = url_row["value"] if url_row else config.OLLAMA_URL_DEFAULT
    model = model_row["value"] if model_row else config.OLLAMA_MODEL_DEFAULT
    return url, model
