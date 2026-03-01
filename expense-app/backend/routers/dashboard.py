from fastapi import APIRouter, Query
from datetime import date

import config
from models import DashboardSummary, Transaction
from services.database import get_connection

router = APIRouter()


def _month_bounds(year: int, mon: int):
    """Returns (month_start, month_end) as 'YYYY-MM-DD' strings using open interval."""
    month_start = f"{year:04d}-{mon:02d}-01"
    if mon == 12:
        month_end = f"{year + 1:04d}-01-01"
    else:
        month_end = f"{year:04d}-{mon + 1:02d}-01"
    return month_start, month_end


def _prev_month(year: int, mon: int):
    if mon == 1:
        return year - 1, 12
    return year, mon - 1


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(month: str = Query(None)):
    if not month:
        month = date.today().strftime("%Y-%m")

    try:
        year, mon = map(int, month.split("-"))
    except ValueError:
        year, mon = date.today().year, date.today().month

    month_start, month_end = _month_bounds(year, mon)

    with get_connection() as conn:
        # Current month transactions
        rows = conn.execute(
            "SELECT amount, transaction_type FROM transactions WHERE date >= ? AND date < ?",
            (month_start, month_end),
        ).fetchall()

        total_spending_neg = sum(r["amount"] for r in rows if r["amount"] < 0 and r["transaction_type"] != "transfer")
        total_income = sum(r["amount"] for r in rows if r["transaction_type"] == "income" and r["amount"] > 0)
        net_cash_flow = total_income + total_spending_neg

        # Spending by category (expenses only)
        cat_rows = conn.execute(
            """SELECT category, SUM(amount) as total
               FROM transactions
               WHERE date >= ? AND date < ? AND amount < 0
               GROUP BY category
               ORDER BY total ASC""",
            (month_start, month_end),
        ).fetchall()

        total_abs = abs(total_spending_neg) or 1.0
        spending_by_category = [
            {
                "category": r["category"] or "Uncategorized",
                "amount": round(abs(r["total"]), 2),
                "percentage": round(abs(r["total"]) / total_abs * 100, 1),
            }
            for r in cat_rows
        ]

        # Monthly trend: last MONTHLY_TREND_MONTHS months
        trend = []
        for i in range(config.MONTHLY_TREND_MONTHS - 1, -1, -1):
            t_year, t_mon = year, mon - i
            while t_mon <= 0:
                t_mon += 12
                t_year -= 1
            ms, me = _month_bounds(t_year, t_mon)

            t_rows = conn.execute(
                "SELECT amount, transaction_type FROM transactions WHERE date >= ? AND date < ?",
                (ms, me),
            ).fetchall()
            trend.append({
                "month": ms[:7],
                "spending": round(abs(sum(r["amount"] for r in t_rows if r["amount"] < 0 and r["transaction_type"] != "transfer")), 2),
                "income": round(sum(r["amount"] for r in t_rows if r["transaction_type"] == "income" and r["amount"] > 0), 2),
            })

        # Recent transactions (across all time)
        recent_rows = conn.execute(
            f"SELECT * FROM transactions ORDER BY date DESC, imported_at DESC LIMIT {config.RECENT_TRANSACTIONS_LIMIT}"
        ).fetchall()

    recent_txns = [Transaction(**dict(r)) for r in recent_rows]

    return DashboardSummary(
        total_spending=round(abs(total_spending_neg), 2),
        total_income=round(total_income, 2),
        net_cash_flow=round(net_cash_flow, 2),
        transaction_count=len(amounts),
        month=month,
        spending_by_category=spending_by_category,
        monthly_trend=trend,
        recent_transactions=recent_txns,
    )
