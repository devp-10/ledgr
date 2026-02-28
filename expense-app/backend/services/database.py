import sqlite3
import hashlib
from contextlib import contextmanager

import config

DB_PATH = config.DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'bank_account',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'expense',
    notes TEXT NOT NULL DEFAULT '',
    reviewed INTEGER NOT NULL DEFAULT 1,
    linked_transaction_id INTEGER REFERENCES transactions(id),
    source_file TEXT,
    account_id INTEGER REFERENCES accounts(id),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    collapsed INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_id TEXT NOT NULL REFERENCES budget_groups(id) ON DELETE CASCADE,
    budget_amount REAL NOT NULL DEFAULT 0,
    emoji TEXT DEFAULT '📦',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budget_rules (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL,
    pattern TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
"""

DEFAULT_BUDGET_GROUPS = [
    ("bills",     "Housing & Bills",  0, 0),
    ("lifestyle", "Lifestyle",        0, 1),
    ("transport", "Travel & commute", 0, 2),
    ("shopping",  "Shopping",         0, 3),
    ("personal",  "Personal",         0, 4),
]

DEFAULT_BUDGET_CATEGORIES = [
    # bills
    ("rent",          "Rent",              "bills",      1500, "🏠", 0),
    ("utilities",     "Utilities",         "bills",       150, "⚡", 1),
    ("internet",      "Subscriptions",     "bills",       100, "📡", 2),
    # lifestyle
    ("groceries",     "Groceries",         "lifestyle",   500, "🍓", 0),
    ("dining",        "Eating Out",        "lifestyle",   100, "🍕", 1),
    ("entertainment", "Entertainment",     "lifestyle",   100, "⛷️", 2),
    ("household",     "General Household", "lifestyle",     0, "🛒", 3),
    ("alcohol",       "Alcohol & Bars",    "lifestyle",     0, "🍺", 4),
    # transport
    ("transport_cat", "Car Rental",        "transport",   200, "🚘", 0),
    ("flights",       "Flights",           "transport",     0, "✈️", 1),
    ("bus_trains",    "Bus/Trains",        "transport",     0, "🚆", 2),
    ("hotels",        "Hotels",            "transport",     0, "🏨", 3),
    ("uber_cabs",     "Uber/Cabs",         "transport",     0, "🚕", 4),
    # shopping
    ("shopping_cat",  "Shopping",          "shopping",    300, "🛍️", 0),
    ("clothing",      "Clothing",          "shopping",      0, "👕", 1),
    # personal
    ("education",     "Education",         "personal",      0, "📚", 0),
    ("personal_cat",  "Personal",          "personal",      0, "🫵", 1),
]


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        # Migrations: add columns to transactions if they don't exist
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(transactions)").fetchall()]
        if "account_id" not in cols:
            conn.execute(
                "ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)"
            )
        if "transaction_type" not in cols:
            conn.execute("ALTER TABLE transactions ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'expense'")
        if "notes" not in cols:
            conn.execute("ALTER TABLE transactions ADD COLUMN notes TEXT NOT NULL DEFAULT ''")
        if "reviewed" not in cols:
            conn.execute("ALTER TABLE transactions ADD COLUMN reviewed INTEGER NOT NULL DEFAULT 1")
        if "linked_transaction_id" not in cols:
            conn.execute("ALTER TABLE transactions ADD COLUMN linked_transaction_id INTEGER REFERENCES transactions(id)")
        # Migrate accounts table
        acct_cols = [r["name"] for r in conn.execute("PRAGMA table_info(accounts)").fetchall()]
        if "account_type" not in acct_cols:
            conn.execute("ALTER TABLE accounts ADD COLUMN account_type TEXT NOT NULL DEFAULT 'bank_account'")
        # Seed budget defaults if tables are empty
        count = conn.execute("SELECT COUNT(*) FROM budget_groups").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO budget_groups (id, name, collapsed, sort_order) VALUES (?,?,?,?)",
                DEFAULT_BUDGET_GROUPS,
            )
            conn.executemany(
                "INSERT OR IGNORE INTO budget_categories (id, name, group_id, budget_amount, emoji, sort_order) VALUES (?,?,?,?,?,?)",
                DEFAULT_BUDGET_CATEGORIES,
            )


@contextmanager
def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def compute_hash(date_str: str, description: str, amount: float) -> str:
    raw = f"{date_str}|{description.strip().lower()}|{amount:.2f}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
