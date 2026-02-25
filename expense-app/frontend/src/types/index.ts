// Re-export API types from api.ts (source of truth for backend shapes)
export type {
  Account,
  Transaction,
  TransactionType,
  TransactionUpdate,
  CreateTransactionRequest,
  SplitItem,
  ParsedTransaction,
  UploadPreviewResponse,
  ImportRequest,
  ImportResponse,
  CategorizationStatus,
  PaginatedTransactions,
  TransactionFilters,
  SpendingCategory,
  MonthTrend,
  DashboardSummary,
  CategoryBreakdown,
  MonthlyReport,
  BudgetRule,
  BudgetCategory,
  BudgetGroup,
  BudgetResponse,
} from '../lib/api'

// ─── UI Types ────────────────────────────────────────────────────────────────

export type TabId = 'plan' | 'reflect' | 'ledger'

export type Theme = 'light' | 'dark' | 'system'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export type QuickFilter = 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'all-time'

export type LedgerView = 'all' | 'review'

export type GroupBy = 'date' | 'account' | 'type' | 'month'
