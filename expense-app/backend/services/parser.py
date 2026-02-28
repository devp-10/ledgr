import pandas as pd
from io import BytesIO
from typing import Optional, Tuple, List

from models import ParsedTransaction
from services.database import compute_hash

COLUMN_ALIASES = {
    "date": ["date", "transaction date", "trans date", "posting date", "value date", "trans. date", "post date"],
    "description": ["description", "memo", "narration", "details", "payee", "merchant", "transaction", "particulars", "reference"],
    "amount": ["amount", "value", "net amount", "transaction amount",
               "amount (usd)", "amount (cad)", "amount (eur)", "amount (gbp)"],
    "debit": ["debit", "withdrawal", "debit amount", "dr", "withdrawals"],
    "credit": ["credit", "deposit", "credit amount", "cr", "deposits"],
    "tx_type": ["type", "transaction type", "trans type"],
}

# Keywords indicating money going OUT (expenses/debits)
_EXPENSE_TYPE_KEYWORDS = {
    "sale", "purchase", "fee", "charge", "debit", "dr",
    "withdrawal", "withdraw", "atm", "pos", "check",
    "wire out", "ach debit", "bill payment", "payment out",
    "direct debit", "debit purchase", "debit card", "pos debit",
    "transfer out", "outgoing transfer",
}

# Keywords indicating money coming IN (income/credits)
_INCOME_TYPE_KEYWORDS = {
    "payment", "credit", "cr", "return", "refund", "deposit",
    "rebate", "reversal", "adjustment", "direct deposit",
    "ach credit", "wire in", "interest", "dividend",
    "payment in", "payroll", "salary",
    "transfer in", "incoming transfer",
}

# Keywords indicating account-to-account transfer
_TRANSFER_TYPE_KEYWORDS = {"transfer", "xfer", "internal transfer"}


def _classify_type(type_val: str) -> Optional[str]:
    """Classify a CSV type column value into 'expense', 'income', or 'transfer'."""
    # Expense and income directional keywords take priority over generic "transfer"
    if any(kw in type_val for kw in _EXPENSE_TYPE_KEYWORDS):
        return "expense"
    if any(kw in type_val for kw in _INCOME_TYPE_KEYWORDS):
        return "income"
    if any(kw in type_val for kw in _TRANSFER_TYPE_KEYWORDS):
        return "transfer"
    return None


def detect_columns(df: pd.DataFrame) -> dict:
    cols_lower = {c.lower().strip(): c for c in df.columns}
    result = {}
    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in cols_lower:
                result[field] = cols_lower[alias]
                break
    return result


def _to_float(val) -> float:
    if pd.isna(val):
        return 0.0
    s = str(val).replace(",", "").replace("$", "").replace("(", "-").replace(")", "").strip()
    if not s or s == "-":
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def parse_file(content: bytes, filename: str) -> Tuple[List[ParsedTransaction], dict]:
    fn = filename.lower()
    if fn.endswith(".csv"):
        df = pd.read_csv(BytesIO(content))
    elif fn.endswith((".xlsx", ".xls")):
        df = pd.read_excel(BytesIO(content), engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file type. Please upload a CSV or Excel file.")

    df.columns = df.columns.str.strip()
    col_map = detect_columns(df)

    if "date" not in col_map:
        raise ValueError("Could not detect a date column. Expected column names like: Date, Transaction Date, Posting Date.")
    if "description" not in col_map:
        raise ValueError("Could not detect a description column. Expected column names like: Description, Memo, Narration, Payee.")

    has_amount = "amount" in col_map
    has_debit_credit = "debit" in col_map or "credit" in col_map

    if not has_amount and not has_debit_credit:
        raise ValueError("Could not detect amount column(s). Expected: Amount, or Debit/Credit columns.")

    transactions = []
    for _, row in df.iterrows():
        try:
            raw_date = pd.to_datetime(row[col_map["date"]], dayfirst=False)
            if pd.isna(raw_date):
                continue
            date_str = raw_date.strftime("%Y-%m-%d")

            description = str(row[col_map["description"]]).strip()
            if not description or description.lower() in ("nan", "none", ""):
                continue

            transaction_type: Optional[str] = None

            if has_amount:
                amount = _to_float(row[col_map["amount"]])
                # Classify type from type column keyword (no sign correction here —
                # sign correction happens at import time based on account type)
                if "tx_type" in col_map:
                    type_val = str(row.get(col_map["tx_type"], "")).strip().lower()
                    transaction_type = _classify_type(type_val)
            else:
                debit = _to_float(row.get(col_map.get("debit", "__missing__"), 0))
                credit = _to_float(row.get(col_map.get("credit", "__missing__"), 0))
                # credit = money in (positive), debit = money out (negative)
                amount = credit - debit
                # Debit/credit column format implies type directly
                if debit > 0 and credit == 0:
                    transaction_type = "expense"
                elif credit > 0 and debit == 0:
                    transaction_type = "income"

            h = compute_hash(date_str, description, amount)
            transactions.append(ParsedTransaction(
                date=date_str,
                description=description,
                amount=amount,
                hash=h,
                transaction_type=transaction_type,
            ))
        except Exception:
            continue  # skip malformed rows

    return transactions, col_map
