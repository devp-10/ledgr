import io
import csv
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse

from models import (
    UploadPreviewResponse,
    ImportRequest,
    ImportResponse,
    TransactionUpdate,
    CreateTransactionRequest,
    BulkUpdateRequest,
    BulkReviewRequest,
    BulkDeleteRequest,
    SplitRequest,
    PaginatedTransactions,
    Transaction,
    VALID_CATEGORIES,
    TRANSACTION_TYPES,
)
from services.parser import parse_file
from services.database import get_connection
from services import categorizer

router = APIRouter()

# In-memory progress store (single-user desktop app)
_categorization_progress: dict = {}


def _infer_type(amount: float) -> str:
    return "income" if amount > 0 else "expense"


def _make_hash(date: str, description: str, amount: float) -> str:
    raw = f"{date}|{description.strip().lower()}|{amount:.2f}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


@router.post("/upload", response_model=UploadPreviewResponse)
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    try:
        transactions, col_map = parse_file(content, file.filename or "upload")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    with get_connection() as conn:
        rows = conn.execute("SELECT hash FROM transactions").fetchall()
        existing_hashes = {r["hash"] for r in rows}

    duplicates = sum(1 for t in transactions if t.hash in existing_hashes)

    col_map_str = {k: str(v) for k, v in col_map.items()}

    return UploadPreviewResponse(
        transactions=transactions,
        total_rows=len(transactions),
        duplicate_count=duplicates,
        columns_detected=col_map_str,
    )


@router.post("/transactions/import", response_model=ImportResponse)
async def import_transactions(request: ImportRequest, background_tasks: BackgroundTasks):
    with get_connection() as conn:
        existing = {r["hash"] for r in conn.execute("SELECT hash FROM transactions").fetchall()}

    to_insert = [t for t in request.transactions if t.hash not in existing]
    skipped = len(request.transactions) - len(to_insert)

    inserted_pairs: list = []
    with get_connection() as conn:
        for t in to_insert:
            tx_type = _infer_type(t.amount)
            cursor = conn.execute(
                """INSERT OR IGNORE INTO transactions
                   (hash, date, description, amount, transaction_type, notes, reviewed, source_file, account_id)
                   VALUES (?, ?, ?, ?, ?, '', 0, ?, ?)""",
                (t.hash, t.date, t.description, t.amount, tx_type, request.source_file, request.account_id),
            )
            if cursor.lastrowid:
                inserted_pairs.append((cursor.lastrowid, t.description))

    job_id = None
    if inserted_pairs and request.auto_categorize:
        inserted_ids = [p[0] for p in inserted_pairs]
        inserted_descs = [p[1] for p in inserted_pairs]
        job_id = str(inserted_ids[0])
        background_tasks.add_task(_run_categorization, job_id, inserted_ids, inserted_descs)
        cat_status = "pending"
    else:
        cat_status = "complete"

    return ImportResponse(
        imported=len(inserted_pairs),
        skipped_duplicates=skipped,
        categorization_status=cat_status,
        job_id=job_id,
    )


async def _run_categorization(job_id: str, ids: list, descriptions: list):
    total = len(ids)
    _categorization_progress[job_id] = {"total": total, "completed": 0, "status": "running"}

    async def on_progress(completed: int, total: int):
        _categorization_progress[job_id]["completed"] = completed

    try:
        await categorizer.categorize_transactions(ids, descriptions, on_progress)
        _categorization_progress[job_id]["status"] = "complete"
        _categorization_progress[job_id]["completed"] = total
    except Exception as e:
        _categorization_progress[job_id]["status"] = f"error: {str(e) or type(e).__name__}"


@router.get("/transactions/categorization-status/{job_id}")
def get_categorization_status(job_id: str):
    progress = _categorization_progress.get(job_id)
    if not progress:
        return {"total": 0, "completed": 0, "status": "unknown"}
    return progress


# NOTE: /transactions/bulk* MUST be registered before /transactions/{id}
@router.patch("/transactions/bulk")
def bulk_update(request: BulkUpdateRequest):
    if not request.ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")
    placeholders = ",".join("?" * len(request.ids))
    with get_connection() as conn:
        conn.execute(
            f"UPDATE transactions SET category=?, updated_at=CURRENT_TIMESTAMP WHERE id IN ({placeholders})",
            [request.category] + request.ids,
        )
    return {"updated": len(request.ids)}


@router.patch("/transactions/bulk-review")
def bulk_review(request: BulkReviewRequest):
    if not request.ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")
    placeholders = ",".join("?" * len(request.ids))
    with get_connection() as conn:
        conn.execute(
            f"UPDATE transactions SET reviewed=1, updated_at=CURRENT_TIMESTAMP WHERE id IN ({placeholders})",
            request.ids,
        )
    return {"reviewed": len(request.ids)}


@router.delete("/transactions/bulk")
def bulk_delete(request: BulkDeleteRequest):
    if not request.ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")
    placeholders = ",".join("?" * len(request.ids))
    with get_connection() as conn:
        conn.execute(
            f"DELETE FROM transactions WHERE id IN ({placeholders})",
            request.ids,
        )
    return {"deleted": len(request.ids)}


@router.post("/transactions/recategorize")
async def recategorize_all(background_tasks: BackgroundTasks):
    with get_connection() as conn:
        rows = conn.execute("SELECT id, description FROM transactions ORDER BY id").fetchall()
    if not rows:
        return {"job_id": None, "total": 0}
    ids = [r["id"] for r in rows]
    descs = [r["description"] for r in rows]
    job_id = f"recategorize-{ids[0]}"
    background_tasks.add_task(_run_categorization, job_id, ids, descs)
    return {"job_id": job_id, "total": len(ids)}


@router.get("/transactions", response_model=PaginatedTransactions)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: str = Query(None),
    category: str = Query(None),
    transaction_type: str = Query(None),
    reviewed: int = Query(None),  # 0 = pending, 1 = reviewed, None = all
    date_from: str = Query(None),
    date_to: str = Query(None),
    amount_min: float = Query(None),
    amount_max: float = Query(None),
    account_id: int = Query(None),
    sort_by: str = Query("date"),
    sort_dir: str = Query("desc"),
):
    allowed_sort = {"date", "description", "amount", "category", "imported_at", "transaction_type"}
    if sort_by not in allowed_sort:
        sort_by = "date"
    sort_dir_sql = "DESC" if sort_dir.lower() == "desc" else "ASC"

    where_clauses = []
    params: list = []

    if search:
        where_clauses.append("LOWER(description) LIKE ?")
        params.append(f"%{search.lower()}%")
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    if transaction_type:
        where_clauses.append("transaction_type = ?")
        params.append(transaction_type)
    if reviewed is not None:
        where_clauses.append("reviewed = ?")
        params.append(reviewed)
    if date_from:
        where_clauses.append("date >= ?")
        params.append(date_from)
    if date_to:
        where_clauses.append("date <= ?")
        params.append(date_to)
    if amount_min is not None:
        where_clauses.append("amount >= ?")
        params.append(amount_min)
    if amount_max is not None:
        where_clauses.append("amount <= ?")
        params.append(amount_max)
    if account_id is not None:
        where_clauses.append("account_id = ?")
        params.append(account_id)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM transactions {where_sql}", params
        ).fetchone()[0]

        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT * FROM transactions {where_sql} ORDER BY {sort_by} {sort_dir_sql}, id DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()

    items = []
    for r in rows:
        d = dict(r)
        d["reviewed"] = bool(d.get("reviewed", 1))
        d.setdefault("transaction_type", "expense")
        d.setdefault("notes", "")
        items.append(Transaction(**d))

    total_pages = max(1, -(-total // page_size))

    return PaginatedTransactions(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/transactions", response_model=Transaction)
def create_transaction(req: CreateTransactionRequest):
    if req.transaction_type not in TRANSACTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of: {TRANSACTION_TYPES}")

    tx_hash = _make_hash(req.date, req.description, req.amount)

    with get_connection() as conn:
        cursor = conn.execute(
            """INSERT INTO transactions
               (hash, date, description, amount, category, transaction_type, notes, reviewed, account_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (tx_hash, req.date, req.description, req.amount, req.category,
             req.transaction_type, req.notes, req.account_id),
        )
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (cursor.lastrowid,)).fetchone()

    d = dict(row)
    d["reviewed"] = bool(d.get("reviewed", 1))
    d.setdefault("transaction_type", "expense")
    d.setdefault("notes", "")
    return Transaction(**d)


@router.patch("/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(transaction_id: int, update: TransactionUpdate):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Transaction not found")

        fields = []
        params = []
        if update.category is not None:
            fields.append("category=?")
            params.append(update.category)
        if update.transaction_type is not None:
            if update.transaction_type not in TRANSACTION_TYPES:
                raise HTTPException(status_code=400, detail="Invalid transaction type")
            fields.append("transaction_type=?")
            params.append(update.transaction_type)
        if update.description is not None:
            fields.append("description=?")
            params.append(update.description)
        if update.date is not None:
            fields.append("date=?")
            params.append(update.date)
        if update.amount is not None:
            fields.append("amount=?")
            params.append(update.amount)
        if update.notes is not None:
            fields.append("notes=?")
            params.append(update.notes)
        if update.reviewed is not None:
            fields.append("reviewed=?")
            params.append(1 if update.reviewed else 0)
        if update.account_id is not None:
            fields.append("account_id=?")
            params.append(update.account_id)

        if not fields:
            d = dict(row)
            d["reviewed"] = bool(d.get("reviewed", 1))
            d.setdefault("transaction_type", "expense")
            d.setdefault("notes", "")
            return Transaction(**d)

        fields.append("updated_at=CURRENT_TIMESTAMP")
        params.append(transaction_id)
        conn.execute(
            f"UPDATE transactions SET {', '.join(fields)} WHERE id=?",
            params,
        )
        updated = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()

    d = dict(updated)
    d["reviewed"] = bool(d.get("reviewed", 1))
    d.setdefault("transaction_type", "expense")
    d.setdefault("notes", "")
    return Transaction(**d)


@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Transaction not found")
        # Also delete linked transfer pair
        if row["linked_transaction_id"]:
            conn.execute("DELETE FROM transactions WHERE id=?", (row["linked_transaction_id"],))
        conn.execute("DELETE FROM transactions WHERE id=?", (transaction_id,))
    return {"deleted": transaction_id}


@router.post("/transactions/{transaction_id}/duplicate", response_model=Transaction)
def duplicate_transaction(transaction_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Transaction not found")
        d = dict(row)
        # New unique hash
        import time
        new_hash = _make_hash(d["date"], d["description"] + f"_dup_{int(time.time())}", d["amount"])
        cursor = conn.execute(
            """INSERT INTO transactions
               (hash, date, description, amount, category, transaction_type, notes, reviewed, source_file, account_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (new_hash, d["date"], d["description"], d["amount"], d.get("category"),
             d.get("transaction_type", "expense"), d.get("notes", ""), d.get("reviewed", 1),
             d.get("source_file"), d.get("account_id")),
        )
        new_row = conn.execute("SELECT * FROM transactions WHERE id=?", (cursor.lastrowid,)).fetchone()

    nd = dict(new_row)
    nd["reviewed"] = bool(nd.get("reviewed", 1))
    nd.setdefault("transaction_type", "expense")
    nd.setdefault("notes", "")
    return Transaction(**nd)


@router.post("/transactions/{transaction_id}/split")
def split_transaction(transaction_id: int, req: SplitRequest):
    """Split an expense transaction into multiple sub-transactions."""
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (transaction_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Transaction not found")
        d = dict(row)
        if d.get("transaction_type", "expense") != "expense":
            raise HTTPException(status_code=400, detail="Only expense transactions can be split")

        # Delete original
        conn.execute("DELETE FROM transactions WHERE id=?", (transaction_id,))

        # Insert splits
        created = []
        import time
        for i, split in enumerate(req.splits):
            amount = float(split.get("amount", 0))
            description = str(split.get("description", d["description"]))
            category = split.get("category")
            new_hash = _make_hash(d["date"], description + f"_split_{i}_{int(time.time())}", amount)
            cursor = conn.execute(
                """INSERT INTO transactions
                   (hash, date, description, amount, category, transaction_type, notes, reviewed, source_file, account_id)
                   VALUES (?, ?, ?, ?, ?, 'expense', ?, ?, ?, ?)""",
                (new_hash, d["date"], description, amount, category, d.get("notes", ""),
                 d.get("reviewed", 1), d.get("source_file"), d.get("account_id")),
            )
            new_row = conn.execute("SELECT * FROM transactions WHERE id=?", (cursor.lastrowid,)).fetchone()
            nd = dict(new_row)
            nd["reviewed"] = bool(nd.get("reviewed", 1))
            nd.setdefault("transaction_type", "expense")
            nd.setdefault("notes", "")
            created.append(Transaction(**nd))

    return {"splits": [t.model_dump() for t in created]}


@router.get("/categories")
def list_categories():
    with get_connection() as conn:
        custom = [r["name"] for r in conn.execute("SELECT name FROM categories ORDER BY name").fetchall()]
    return {"categories": VALID_CATEGORIES + custom, "custom": custom}


@router.post("/categories")
def add_category(data: dict):
    name = str(data.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name required")
    with get_connection() as conn:
        try:
            conn.execute("INSERT INTO categories (name) VALUES (?)", (name,))
        except Exception:
            raise HTTPException(status_code=409, detail="Category already exists")
    return {"name": name}


@router.post("/export")
def export_csv():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT date, description, amount, category, transaction_type, notes, source_file, imported_at FROM transactions ORDER BY date DESC"
        ).fetchall()

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["date", "description", "amount", "category", "transaction_type", "notes", "source_file", "imported_at"],
    )
    writer.writeheader()
    for row in rows:
        writer.writerow(dict(row))

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.delete("/data")
def clear_all_data():
    with get_connection() as conn:
        conn.execute("DELETE FROM transactions")
        conn.execute("DELETE FROM categories")
    return {"message": "All data cleared"}
