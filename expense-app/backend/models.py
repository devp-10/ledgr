from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

VALID_CATEGORIES = [
    "Groceries",
    "Dining & Restaurants",
    "Transportation",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Subscriptions",
    "Travel",
    "Housing",
    "Insurance",
    "Personal Care",
    "Education",
    "Gifts & Donations",
    "Income",
    "Transfer",
    "Fees & Charges",
    "Other",
]


class Transaction(BaseModel):
    id: int
    hash: str
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    source_file: Optional[str] = None
    imported_at: str
    updated_at: str


class TransactionUpdate(BaseModel):
    category: str


class BulkUpdateRequest(BaseModel):
    ids: List[int]
    category: str


class ParsedTransaction(BaseModel):
    date: str
    description: str
    amount: float
    hash: str


class UploadPreviewResponse(BaseModel):
    transactions: List[ParsedTransaction]
    total_rows: int
    duplicate_count: int
    columns_detected: dict


class ImportRequest(BaseModel):
    transactions: List[ParsedTransaction]
    source_file: str


class ImportResponse(BaseModel):
    imported: int
    skipped_duplicates: int
    categorization_status: str
    job_id: Optional[str] = None


class CategorizationStatus(BaseModel):
    total: int
    completed: int
    status: str


class PaginatedTransactions(BaseModel):
    items: List[Transaction]
    total: int
    page: int
    page_size: int
    total_pages: int


class DashboardSummary(BaseModel):
    total_spending: float
    total_income: float
    net_cash_flow: float
    transaction_count: int
    month: str
    spending_by_category: List[dict]
    monthly_trend: List[dict]
    recent_transactions: List[Transaction]


class MonthlyReport(BaseModel):
    month: str
    category_breakdown: List[dict]
    top_expenses: List[Transaction]
    total_spending: float
    total_income: float


class OllamaSettings(BaseModel):
    url: str = "http://localhost:11434"
    model: str = "llama3.2"


class OllamaTestResult(BaseModel):
    connected: bool
    message: str
    available_models: Optional[List[str]] = None
