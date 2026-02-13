# Ledgr — Personal Expense Tracker

A single-user expense tracking web app that analyzes bank statements using a local LLM (Ollama).

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **AI**: Ollama (local, default model `llama3.2`)

---

## Running the App

### Option A — Docker (recommended, no installs required)

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

That's it. Docker handles Python, Node.js, and Ollama — nothing else needs to be installed.

> **First run** downloads `llama3.2` (~2 GB) and builds the images — takes a few minutes.
> Subsequent `docker compose up` starts in seconds; the model and database are cached in Docker volumes.

**Stop the app:**
```bash
docker compose down
```

**Wipe all data** (transactions + downloaded model weights):
```bash
docker compose down -v
```

---

### Option B — Run locally (requires Python, Node, Ollama installed)

<details>
<summary>Expand for manual setup</summary>

**Prerequisites**: Python 3.11+, Node.js 18+, [Ollama](https://ollama.ai)

```bash
# Terminal 1 — Ollama
ollama serve
ollama pull llama3.2

# Terminal 2 — Backend
cd expense-app/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 3 — Frontend
cd expense-app/frontend
npm install
npm run dev
```

Open http://localhost:5173

</details>

---

## Features

| Feature | Description |
|---------|-------------|
| **Upload** | Drag-and-drop CSV or Excel bank statements. Auto-detects columns (date, description, amount, or debit/credit split). Previews rows before import. Deduplicates automatically. |
| **AI Categorization** | Transactions are categorized by Ollama in batches of 20. Progress bar shows status. Falls back gracefully if Ollama is unavailable. |
| **Dashboard** | Summary cards (spending, income, net cash flow, count), spending donut chart, 6-month trend line, recent transactions. Month selector. |
| **Transactions** | Full list with search, filters (category, date range, amount range), sortable columns, pagination. Click any category badge to edit inline. Bulk re-categorize. |
| **Reports** | Category breakdown with % of total and month-over-month % change. Top 10 expenses. Printable layout (`Print` button hides nav). |
| **Settings** | Configure Ollama URL and model, test connection, add custom categories, export all data as CSV, clear all data. |
| **Dark mode** | System preference detection, manual toggle, persisted to localStorage. |

## Data

- **Database**: SQLite, stored in a Docker volume (`db_data`). Survives `docker compose down`; wiped by `docker compose down -v`.
- **Deduplication**: Transactions are hashed by `date + description + amount` — re-uploading the same file is safe.
- **Model weights**: Cached in `ollama_data` Docker volume (~2 GB, downloaded once).

## API Docs

Start the app then visit http://localhost:8000/docs for interactive FastAPI documentation.
(In Docker, temporarily add `ports: ["8000:8000"]` to the `backend` service to expose it.)
