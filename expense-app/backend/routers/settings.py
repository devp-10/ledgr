from fastapi import APIRouter

from models import OllamaSettings, OllamaTestResult
from services.database import get_connection
from services import categorizer
from services.settings_service import get_ollama_settings


router = APIRouter()


@router.get("/settings/ollama", response_model=OllamaSettings)
def get_ollama_settings_endpoint():
    # Use the single authoritative resolver — same function the categorizer uses,
    # so the UI always reflects exactly what recategorization will connect to.
    url, model = get_ollama_settings()
    return OllamaSettings(url=url, model=model)


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
