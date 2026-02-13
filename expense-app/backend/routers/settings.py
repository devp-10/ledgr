from fastapi import APIRouter

from models import OllamaSettings, OllamaTestResult
from services.database import get_connection
from services import categorizer

router = APIRouter()


@router.get("/settings/ollama", response_model=OllamaSettings)
def get_ollama_settings():
    with get_connection() as conn:
        url_row = conn.execute("SELECT value FROM settings WHERE key='ollama_url'").fetchone()
        model_row = conn.execute("SELECT value FROM settings WHERE key='ollama_model'").fetchone()
    return OllamaSettings(
        url=url_row["value"] if url_row else "http://localhost:11434",
        model=model_row["value"] if model_row else "llama3.2",
    )


@router.post("/settings/ollama")
def save_ollama_settings(settings: OllamaSettings):
    with get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('ollama_url', ?)",
            (settings.url,),
        )
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('ollama_model', ?)",
            (settings.model,),
        )
    return {"saved": True}


@router.post("/settings/ollama/test", response_model=OllamaTestResult)
async def test_ollama(settings: OllamaSettings):
    result = await categorizer.test_connection(settings.url, settings.model)
    return OllamaTestResult(**result)
