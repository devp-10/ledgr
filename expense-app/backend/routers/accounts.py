from fastapi import APIRouter, HTTPException

from models import Account, CreateAccountRequest
from services.database import get_connection

router = APIRouter()


@router.get("/accounts", response_model=list[Account])
def list_accounts():
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.created_at, COUNT(t.id) as transaction_count
            FROM accounts a
            LEFT JOIN transactions t ON t.account_id = a.id
            GROUP BY a.id
            ORDER BY a.name
            """
        ).fetchall()
    return [Account(**dict(r)) for r in rows]


@router.post("/accounts", response_model=Account, status_code=201)
def create_account(data: CreateAccountRequest):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Account name required")
    with get_connection() as conn:
        try:
            cursor = conn.execute("INSERT INTO accounts (name) VALUES (?)", (name,))
            new_id = cursor.lastrowid
        except Exception:
            raise HTTPException(status_code=409, detail="Account already exists")
        row = conn.execute(
            "SELECT id, name, created_at, 0 as transaction_count FROM accounts WHERE id = ?",
            (new_id,),
        ).fetchone()
    return Account(**dict(row))


@router.delete("/accounts/{account_id}")
def delete_account(account_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM accounts WHERE id = ?", (account_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Account not found")
        conn.execute(
            "UPDATE transactions SET account_id = NULL WHERE account_id = ?", (account_id,)
        )
        conn.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    return {"ok": True}
