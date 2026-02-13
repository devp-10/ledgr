import httpx
import json
import re
from typing import List, Optional, Callable, Awaitable

from models import VALID_CATEGORIES
from services.database import get_connection

BATCH_SIZE = 20
DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"


def get_ollama_settings():
    with get_connection() as conn:
        url_row = conn.execute("SELECT value FROM settings WHERE key='ollama_url'").fetchone()
        model_row = conn.execute("SELECT value FROM settings WHERE key='ollama_model'").fetchone()
    url = url_row["value"] if url_row else DEFAULT_OLLAMA_URL
    model = model_row["value"] if model_row else DEFAULT_MODEL
    return url, model


def build_prompt(descriptions: List[str]) -> str:
    categories_str = ", ".join(VALID_CATEGORIES)
    numbered = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(descriptions))
    return f"""You are a financial transaction categorizer. Categorize each transaction into exactly one of these categories:
{categories_str}

Rules:
- Positive amounts or descriptions containing "salary", "payroll", "direct deposit" → Income
- Negative amounts are expenses
- Use "Other" if uncertain

Respond with ONLY a JSON array of strings, one category per transaction, in the same order.
Example for 3 transactions: ["Groceries", "Dining & Restaurants", "Transportation"]

Transactions to categorize:
{numbered}

JSON array:"""


async def categorize_batch(
    descriptions: List[str],
    client: httpx.AsyncClient,
    url: str,
    model: str,
) -> List[str]:
    prompt = build_prompt(descriptions)
    try:
        response = await client.post(
            f"{url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
        response.raise_for_status()
        raw = response.json()["response"].strip()
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if not match:
            return ["Other"] * len(descriptions)
        categories = json.loads(match.group())
        validated = []
        for cat in categories:
            validated.append(cat if cat in VALID_CATEGORIES else "Other")
        while len(validated) < len(descriptions):
            validated.append("Other")
        return validated[: len(descriptions)]
    except Exception:
        return ["Other"] * len(descriptions)


async def categorize_transactions(
    transaction_ids: List[int],
    descriptions: List[str],
    progress_callback: Optional[Callable[[int, int], Awaitable[None]]] = None,
) -> int:
    url, model = get_ollama_settings()
    total = len(transaction_ids)
    completed = 0

    async with httpx.AsyncClient() as client:
        for i in range(0, total, BATCH_SIZE):
            batch_ids = transaction_ids[i : i + BATCH_SIZE]
            batch_descs = descriptions[i : i + BATCH_SIZE]

            categories = await categorize_batch(batch_descs, client, url, model)

            with get_connection() as conn:
                for tid, cat in zip(batch_ids, categories):
                    conn.execute(
                        "UPDATE transactions SET category=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        (cat, tid),
                    )

            completed += len(batch_ids)
            if progress_callback:
                await progress_callback(completed, total)

    return completed


async def test_connection(url: str, model: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{url}/api/tags", timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            models = [m["name"] for m in data.get("models", [])]
            model_available = any(m.startswith(model) for m in models)
            msg = f"Connected. Model '{model}' {'found' if model_available else 'not found — run: ollama pull ' + model}."
            return {"connected": True, "message": msg, "available_models": models}
        except httpx.ConnectError:
            return {
                "connected": False,
                "message": f"Cannot reach Ollama at {url}. Start it with: ollama serve",
                "available_models": None,
            }
        except Exception as e:
            return {"connected": False, "message": str(e), "available_models": None}
