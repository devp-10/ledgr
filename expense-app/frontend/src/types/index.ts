// Re-export API types from api.ts (source of truth for backend shapes)
export type {
  Account,
  Transaction,
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

export type QuickFilter = 'this-month' | 'last-30' | 'last-90' | 'this-year' | 'all-time'
