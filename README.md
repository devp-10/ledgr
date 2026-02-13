# Ledgr — Personal Expense Tracker

A single-user expense tracking web app that analyzes bank statements using a local LLM (Ollama).

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **AI**: Ollama (local, default model `llama3.2`)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (optional — categorization falls back gracefully if unavailable)

### 1. Start Ollama

```bash
ollama serve
ollama pull llama3.2
```

### 2. Backend

```bash
cd expense-app/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd expense-app/frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **Upload**: Drag-and-drop CSV or Excel bank statements. Auto-detects columns (date, description, amount or debit/credit).
- **AI Categorization**: Transactions are automatically categorized by Ollama in batches of 20.
- **Dashboard**: Summary cards, spending donut chart, 6-month trend, recent transactions. Month selector.
- **Transactions**: Full list with search, filters (category, date range, amount range), sort, pagination. Inline category edit and bulk re-categorize.
- **Reports**: Category breakdown with % of total and comparison vs previous month. Top 10 expenses. Printable layout.
- **Settings**: Configure Ollama URL and model. Add custom categories. Export CSV. Clear all data.
- **Dark mode**: System preference detection, persisted to localStorage.

## Data

SQLite database stored at `data/expenses.db`. Transactions are deduplicated by a hash of date + description + amount.

## API Docs

Visit http://localhost:8000/docs for interactive API documentation.
