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
} from '../lib/api'

// ─── Budget Types (stored in localStorage) ────────────────────────────────────

export interface BudgetCategory {
  id: string
  name: string
  group: string
  budgetAmount: number
  emoji?: string
  rules?: CategorizationRule[]
}

export interface BudgetGroup {
  id: string
  name: string
  collapsed: boolean
}

export interface CategorizationRule {
  id: string
  matchType: 'contains' | 'regex' | 'starts_with' | 'ends_with'
  pattern: string
  categoryId: string
}

export interface BudgetState {
  groups: BudgetGroup[]
  categories: BudgetCategory[]
  version: number
}

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
