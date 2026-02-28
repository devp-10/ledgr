import httpx
import json
import re
from typing import List, Optional, Callable, Awaitable

import config


def _load_budget_category_names() -> List[str]:
    from services.database import get_connection
    with get_connection() as conn:
        return [r["name"] for r in conn.execute("SELECT name FROM budget_categories ORDER BY name").fetchall()]


def build_prompt(descriptions: List[str], categories: List[str]) -> str:
    categories_str = ", ".join(categories)
    numbered = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(descriptions))
    return f"""You are a financial transaction categorizer. Categorize each transaction into exactly one of these categories:
{categories_str}

Rules:
- Positive amounts or descriptions containing "salary", "payroll", "direct deposit" → Income
- Negative amounts are expenses
- If uncertain, pick the closest matching category from the list above

Respond with ONLY a JSON array of strings, one category per transaction, in the same order.
Example for 3 transactions: ["{categories[0] if categories else 'Other'}", "{categories[1] if len(categories) > 1 else 'Other'}", "{categories[2] if len(categories) > 2 else 'Other'}"]

Transactions to categorize:
{numbered}

JSON array:"""


def match_rule(description: str, match_type: str, pattern: str) -> bool:
    """Return True if description matches the given rule."""
    desc_lower = description.lower()
    if match_type == 'contains':
        return pattern.lower() in desc_lower
    if match_type == 'starts_with':
        return desc_lower.startswith(pattern.lower())
    if match_type == 'ends_with':
        return desc_lower.endswith(pattern.lower())
    if match_type == 'regex':
        try:
            return bool(re.search(pattern, description, re.IGNORECASE))
        except re.error:
            return False
    return False


def apply_rules(description: str, rules_with_categories: List[dict]) -> Optional[str]:
    """
    Check description against a list of rules.
    Each rule dict: {match_type, pattern, category_name}
    Returns the matched category_name or None.
    """
    for rule in rules_with_categories:
        if match_rule(description, rule['match_type'], rule['pattern']):
            return rule['category_name']
    return None


async def categorize_batch(
    descriptions: List[str],
    client: httpx.AsyncClient,
    url: str,
    model: str,
    valid_categories: List[str],
) -> List[str]:
    fallback = valid_categories[0] if valid_categories else "Other"
    prompt = build_prompt(descriptions, valid_categories)
    response = await client.post(
        f"{url}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=config.CATEGORIZE_TIMEOUT,
    )
    response.raise_for_status()
    raw = response.json()["response"].strip()
    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if not match:
        return [fallback] * len(descriptions)
    result = json.loads(match.group())
    validated = []
    for cat in result:
        validated.append(cat if cat in valid_categories else fallback)
    while len(validated) < len(descriptions):
        validated.append(fallback)
    return validated[: len(descriptions)]


async def categorize_transactions(
    transaction_ids: List[int],
    descriptions: List[str],
    progress_callback: Optional[Callable[[int, int], Awaitable[None]]] = None,
    rules_with_categories: Optional[List[dict]] = None,
) -> int:
    """
    Categorize transactions. If rules_with_categories is provided, rule-based
    matching is attempted first; unmatched transactions fall through to AI.

    rules_with_categories: list of {match_type, pattern, category_name}
    """
    url, model = config.OLLAMA_URL, config.OLLAMA_MODEL
    total = len(transaction_ids)
    completed = 0

    # Pre-screen with budget rules if available
    rule_results: dict[int, str] = {}
    if rules_with_categories:
        for tid, desc in zip(transaction_ids, descriptions):
            matched_cat = apply_rules(desc, rules_with_categories)
            if matched_cat:
                rule_results[tid] = matched_cat

    # Persist rule-matched categories immediately
    if rule_results:
        from services.database import get_connection
        with get_connection() as conn:
            for tid, cat in rule_results.items():
                conn.execute(
                    "UPDATE transactions SET category=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    (cat, tid),
                )

    # Collect transactions that still need AI categorization
    ai_ids = [tid for tid in transaction_ids if tid not in rule_results]
    ai_descs = [desc for tid, desc in zip(transaction_ids, descriptions) if tid not in rule_results]

    # Update progress for rule-matched ones
    completed += len(rule_results)
    if progress_callback and completed > 0:
        await progress_callback(completed, total)

    # Load budget category names for AI prompt and validation
    valid_categories = _load_budget_category_names()

    # AI categorization for remaining transactions
    async with httpx.AsyncClient() as client:
        for i in range(0, len(ai_ids), config.BATCH_SIZE):
            batch_ids = ai_ids[i : i + config.BATCH_SIZE]
            batch_descs = ai_descs[i : i + config.BATCH_SIZE]

            categories = await categorize_batch(batch_descs, client, url, model, valid_categories)

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
