import pandas as pd
from io import BytesIO
from typing import Tuple, List

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

# Credit card CSVs use positive amounts for purchases (expenses) and
# negative amounts for credits/payments. These sets let us correct the sign.
_CC_EXPENSE_TYPES = {"sale", "purchase", "fee", "charge", "debit"}
_CC_INCOME_TYPES  = {"payment", "credit", "return", "refund", "deposit",
                     "rebate", "reversal", "adjustment"}


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

            if has_amount:
                amount = _to_float(row[col_map["amount"]])
                # Correct sign for credit card CSVs that export purchases as positive
                if "tx_type" in col_map:
                    type_val = str(row.get(col_map["tx_type"], "")).strip().lower()
                    if type_val in _CC_EXPENSE_TYPES and amount > 0:
                        amount = -amount   # Sale $50 → expense -$50
                    elif type_val in _CC_INCOME_TYPES and amount < 0:
                        amount = -amount   # Payment -$200 → credit +$200
            else:
                debit = _to_float(row.get(col_map.get("debit", "__missing__"), 0))
                credit = _to_float(row.get(col_map.get("credit", "__missing__"), 0))
                # credit = money in (positive), debit = money out (negative)
                amount = credit - debit

            h = compute_hash(date_str, description, amount)
            transactions.append(ParsedTransaction(
                date=date_str,
                description=description,
                amount=amount,
                hash=h,
            ))
        except Exception:
            continue  # skip malformed rows

    return transactions, col_map
