import httpx
import json
import re
from typing import List, Optional, Callable, Awaitable

import config
from models import VALID_CATEGORIES

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
    response = await client.post(
        f"{url}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=config.CATEGORIZE_TIMEOUT,
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


async def categorize_transactions(
    transaction_ids: List[int],
    descriptions: List[str],
    progress_callback: Optional[Callable[[int, int], Awaitable[None]]] = None,
) -> int:
    url, model = config.OLLAMA_URL, config.OLLAMA_MODEL
    total = len(transaction_ids)
    completed = 0

    async with httpx.AsyncClient() as client:
        for i in range(0, total, config.BATCH_SIZE):
            batch_ids = transaction_ids[i : i + config.BATCH_SIZE]
            batch_descs = descriptions[i : i + config.BATCH_SIZE]

            categories = await categorize_batch(batch_descs, client, url, model)

            from services.database import get_connection
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
