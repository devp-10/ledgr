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

  updateTransaction: (id: number, category: string) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ category }),
    }),

  bulkUpdateTransactions: (ids: number[], category: string) =>
    request<{ updated: number }>('/transactions/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, category }),
    }),

  getCategories: () =>
    request<{ categories: string[]; custom: string[] }>('/categories'),

  addCategory: (name: string) =>
    request<{ name: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getDashboard: (month?: string) =>
    request<DashboardSummary>(`/dashboard${month ? `?month=${month}` : ''}`),

  getReport: (month: string) =>
    request<MonthlyReport>(`/reports/${month}`),

  getOllamaSettings: () =>
    request<OllamaSettings>('/settings/ollama'),

  saveOllamaSettings: (settings: OllamaSettings) =>
    request<{ saved: boolean }>('/settings/ollama', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  testOllama: (settings: OllamaSettings) =>
    request<OllamaTestResult>('/settings/ollama/test', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  recategorize: () =>
    request<{ job_id: string | null; total: number }>('/transactions/recategorize', { method: 'POST' }),

  exportCsv: () =>
    fetch(`${BASE}/export`, { method: 'POST' }),

  clearData: () =>
    request<{ message: string }>('/data', { method: 'DELETE' }),
}

// ─── API Type Definitions ─────────────────────────────────────────────────────

export interface Transaction {
  id: number
  hash: string
  date: string
  description: string
  amount: number
  category: string | null
  source_file: string | null
  imported_at: string
  updated_at: string
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  hash: string
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
  date_from?: string
  date_to?: string
  amount_min?: number | string
  amount_max?: number | string
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

export interface OllamaSettings {
  url: string
  model: string
}

export interface OllamaTestResult {
  connected: boolean
  message: string
  available_models: string[] | null
}
