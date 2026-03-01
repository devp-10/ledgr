// Re-export all shared types from api so existing imports from '../types' / '../../types' resolve.
export type {
  Account,
  Transaction,
  TransactionType,
  TransactionUpdate,
  CreateTransactionRequest,
  TransactionFilters,
  SplitItem,
  SpendingCategory,
  MonthTrend,
  DashboardSummary,
  BudgetRule,
  BudgetCategory,
  BudgetGroup,
} from './lib/api'

// Types that only belong in the UI layer
export type LedgerView = 'all' | 'review'

export type QuickFilter =
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | 'all-time'
