from collections import defaultdict
from fastapi import APIRouter, Path

import config
from models import MonthlyReport, Transaction
from services.database import get_connection

router = APIRouter()


def _month_bounds(year: int, mon: int):
    month_start = f"{year:04d}-{mon:02d}-01"
    if mon == 12:
        month_end = f"{year + 1:04d}-01-01"
    else:
        month_end = f"{year:04d}-{mon + 1:02d}-01"
    return month_start, month_end


@router.get("/reports/{month}", response_model=MonthlyReport)
def get_monthly_report(month: str = Path(...)):
    try:
        year, mon = map(int, month.split("-"))
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Month must be in YYYY-MM format")

    month_start, month_end = _month_bounds(year, mon)

    # Previous month bounds
    prev_year, prev_mon = (year, mon - 1) if mon > 1 else (year - 1, 12)
    prev_start, prev_end = _month_bounds(prev_year, prev_mon)

    with get_connection() as conn:
        curr_rows = conn.execute(
            "SELECT amount, category FROM transactions WHERE date >= ? AND date < ?",
            (month_start, month_end),
        ).fetchall()

        prev_rows = conn.execute(
            "SELECT amount, category FROM transactions WHERE date >= ? AND date < ?",
            (prev_start, prev_end),
        ).fetchall()

        top_rows = conn.execute(
            f"""SELECT * FROM transactions
               WHERE date >= ? AND date < ? AND amount < 0
               ORDER BY amount ASC LIMIT {config.TOP_EXPENSES_LIMIT}""",
            (month_start, month_end),
        ).fetchall()

    # Aggregate by category (expenses only)
    curr_by_cat: dict = defaultdict(float)
    for r in curr_rows:
        if r["amount"] < 0:
            curr_by_cat[r["category"] or "Uncategorized"] += abs(r["amount"])

    prev_by_cat: dict = defaultdict(float)
    for r in prev_rows:
        if r["amount"] < 0:
            prev_by_cat[r["category"] or "Uncategorized"] += abs(r["amount"])

    total_spending = sum(curr_by_cat.values())
    total_income = sum(r["amount"] for r in curr_rows if r["amount"] > 0)
    total_for_pct = total_spending or 1.0

    breakdown = []
    for cat, amt in sorted(curr_by_cat.items(), key=lambda x: x[1], reverse=True):
        prev_amt = prev_by_cat.get(cat, 0.0)
        pct_change = ((amt - prev_amt) / prev_amt * 100) if prev_amt > 0 else None
        breakdown.append({
            "category": cat,
            "amount": round(amt, 2),
            "pct_of_total": round(amt / total_for_pct * 100, 1),
            "prev_amount": round(prev_amt, 2),
            "pct_change": round(pct_change, 1) if pct_change is not None else None,
        })

    top_expenses = [Transaction(**dict(r)) for r in top_rows]

    return MonthlyReport(
        month=month,
        category_breakdown=breakdown,
        top_expenses=top_expenses,
        total_spending=round(total_spending, 2),
        total_income=round(total_income, 2),
    )
