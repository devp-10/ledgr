const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<UploadPreviewResponse>('/upload', {
      method: 'POST',
      body: form,
      headers: {},
    })
  },

  importTransactions: (body: ImportRequest) =>
    request<ImportResponse>('/transactions/import', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCategorizationStatus: (jobId: string) =>
    request<CategorizationStatus>(`/transactions/categorization-status/${jobId}`),

  getTransactions: (params: TransactionFilters) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return request<PaginatedTransactions>(`/transactions?${qs}`)
  },

  createTransaction: (body: CreateTransactionRequest) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateTransaction: (id: number, update: Partial<TransactionUpdate>) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    }),

  deleteTransaction: (id: number) =>
    request<{ deleted: number }>(`/transactions/${id}`, { method: 'DELETE' }),

  duplicateTransaction: (id: number) =>
    request<Transaction>(`/transactions/${id}/duplicate`, { method: 'POST' }),

  splitTransaction: (id: number, splits: SplitItem[]) =>
    request<{ splits: Transaction[] }>(`/transactions/${id}/split`, {
      method: 'POST',
      body: JSON.stringify({ splits }),
    }),

  bulkUpdateTransactions: (ids: number[], category: string) =>
    request<{ updated: number }>('/transactions/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, category }),
    }),

  bulkReviewTransactions: (ids: number[]) =>
    request<{ reviewed: number }>('/transactions/bulk-review', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),

  bulkDeleteTransactions: (ids: number[]) =>
    request<{ deleted: number }>('/transactions/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  getCategories: () =>
    request<{ categories: { name: string; emoji: string }[] }>('/categories'),

  getDashboard: (month?: string) =>
    request<DashboardSummary>(`/dashboard${month ? `?month=${month}` : ''}`),

  getReport: (month: string) =>
    request<MonthlyReport>(`/reports/${month}`),

  recategorize: () =>
    request<{ job_id: string | null; total: number }>('/transactions/recategorize', { method: 'POST' }),

  bulkCategorizeAI: (ids: number[]) =>
    request<{ job_id: string | null; total: number }>('/transactions/bulk-categorize', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  exportCsv: () =>
    fetch(`${BASE}/export`, { method: 'POST' }),

  clearData: () =>
    request<{ message: string }>('/data', { method: 'DELETE' }),

  getAccounts: () =>
    request<Account[]>('/accounts'),

  addAccount: (name: string, account_type: string = 'bank_account') =>
    request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify({ name, account_type }),
    }),

  deleteAccount: (id: number) =>
    request<{ ok: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),

  // Budget
  getBudget: () =>
    request<BudgetResponse>('/budget'),

  createGroup: (name: string) =>
    request<BudgetGroup>('/budget/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateGroup: (id: string, data: { name?: string; collapsed?: boolean }) =>
    request<BudgetGroup>(`/budget/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    request<{ ok: boolean }>(`/budget/groups/${id}`, { method: 'DELETE' }),

  createCategory: (data: { name: string; group_id: string; budget_amount: number; emoji: string }) =>
    request<BudgetCategory>('/budget/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: Partial<{ name: string; group_id: string; budget_amount: number; emoji: string; rules: BudgetRule[] }>) =>
    request<BudgetCategory>(`/budget/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/budget/categories/${id}`, { method: 'DELETE' }),
}

// ─── API Type Definitions ─────────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Account {
  id: number
  name: string
  account_type: string
  created_at: string
  transaction_count: number
}

export interface Transaction {
  id: number
  hash: string
  date: string
  description: string
  amount: number
  category: string | null
  transaction_type: TransactionType
  notes: string
  reviewed: boolean
  linked_transaction_id: number | null
  source_file: string | null
  account_id: number | null
  imported_at: string
  updated_at: string
}

export interface TransactionUpdate {
  category?: string | null
  transaction_type?: TransactionType
  description?: string
  date?: string
  amount?: number
  notes?: string
  reviewed?: boolean
  account_id?: number | null
}

export interface CreateTransactionRequest {
  date: string
  description: string
  amount: number
  transaction_type: TransactionType
  category?: string | null
  account_id?: number | null
  notes?: string
}

export interface SplitItem {
  amount: number
  category?: string
  description: string
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  hash: string
  transaction_type?: string
}

export interface UploadPreviewResponse {
  transactions: ParsedTransaction[]
  total_rows: number
  duplicate_count: number
  columns_detected: Record<string, string>
  source_file?: string
}

export interface ImportRequest {
  transactions: ParsedTransaction[]
  source_file: string
  account_id?: number
  auto_categorize: boolean
}

export interface ImportResponse {
  imported: number
  skipped_duplicates: number
  categorization_status: string
  job_id: string | null
}

export interface CategorizationStatus {
  total: number
  completed: number
  status: string
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TransactionFilters {
  page?: number
  page_size?: number
  search?: string
  category?: string
  transaction_type?: string
  reviewed?: number
  date_from?: string
  date_to?: string
  amount_min?: number | string
  amount_max?: number | string
  account_id?: number
  sort_by?: string
  sort_dir?: string
}

export interface SpendingCategory {
  category: string
  amount: number
  percentage: number
}

export interface MonthTrend {
  month: string
  spending: number
  income: number
}

export interface DashboardSummary {
  total_spending: number
  total_income: number
  net_cash_flow: number
  transaction_count: number
  month: string
  spending_by_category: SpendingCategory[]
  monthly_trend: MonthTrend[]
  recent_transactions: Transaction[]
}

export interface CategoryBreakdown {
  category: string
  amount: number
  pct_of_total: number
  prev_amount: number
  pct_change: number | null
}

export interface MonthlyReport {
  month: string
  total_spending: number
  total_income: number
  category_breakdown: CategoryBreakdown[]
  top_expenses: Transaction[]
}

export interface BudgetRule {
  id: string
  match_type: string
  pattern: string
  category_id: string
}

export interface BudgetCategory {
  id: string
  name: string
  group_id: string
  budget_amount: number
  emoji: string
  rules: BudgetRule[]
}

export interface BudgetGroup {
  id: string
  name: string
  collapsed: boolean
  categories: BudgetCategory[]
}

export interface BudgetResponse {
  groups: BudgetGroup[]
}
