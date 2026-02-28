from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ─── Budget Models ────────────────────────────────────────────────────────────

class BudgetRule(BaseModel):
    id: str
    match_type: str
    pattern: str
    category_id: str


class BudgetCategory(BaseModel):
    id: str
    name: str
    group_id: str
    budget_amount: float
    emoji: str = "📦"
    rules: List[BudgetRule] = []


class BudgetGroup(BaseModel):
    id: str
    name: str
    collapsed: bool
    categories: List[BudgetCategory] = []


class BudgetResponse(BaseModel):
    groups: List[BudgetGroup]


class CreateGroupRequest(BaseModel):
    name: str


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    collapsed: Optional[bool] = None


class CreateCategoryRequest(BaseModel):
    name: str
    group_id: str
    budget_amount: float = 0
    emoji: str = "📦"


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    group_id: Optional[str] = None
    budget_amount: Optional[float] = None
    emoji: Optional[str] = None
    rules: Optional[List[BudgetRule]] = None


# ─── Transaction / Category Models ───────────────────────────────────────────

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


TRANSACTION_TYPES = ["expense", "income", "transfer"]


class Account(BaseModel):
    id: int
    name: str
    created_at: str
    transaction_count: int = 0


class CreateAccountRequest(BaseModel):
    name: str


class Transaction(BaseModel):
    id: int
    hash: str
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    transaction_type: str = "expense"
    notes: str = ""
    reviewed: bool = True
    linked_transaction_id: Optional[int] = None
    source_file: Optional[str] = None
    account_id: Optional[int] = None
    imported_at: str
    updated_at: str


class TransactionUpdate(BaseModel):
    category: Optional[str] = None
    transaction_type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    reviewed: Optional[bool] = None
    account_id: Optional[int] = None


class CreateTransactionRequest(BaseModel):
    date: str
    description: str
    amount: float
    transaction_type: str = "expense"
    category: Optional[str] = None
    account_id: Optional[int] = None
    notes: str = ""


class BulkUpdateRequest(BaseModel):
    ids: List[int]
    category: str


class BulkReviewRequest(BaseModel):
    ids: List[int]


class BulkDeleteRequest(BaseModel):
    ids: List[int]


class BulkCategorizeRequest(BaseModel):
    ids: List[int]


class SplitRequest(BaseModel):
    splits: List[dict]  # [{amount: float, category: str, description: str}]


class ParsedTransaction(BaseModel):
    date: str
    description: str
    amount: float
    hash: str
    transaction_type: Optional[str] = None


class UploadPreviewResponse(BaseModel):
    transactions: List[ParsedTransaction]
    total_rows: int
    duplicate_count: int
    columns_detected: dict


class ImportRequest(BaseModel):
    transactions: List[ParsedTransaction]
    source_file: str
    account_id: Optional[int] = None
    auto_categorize: bool = True


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

