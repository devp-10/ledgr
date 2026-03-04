# Ledgr — Personal Expense Tracker

A single-user expense tracking web app that runs entirely on your machine. Import bank statements, let a local LLM (Ollama) categorize your transactions, and analyze your spending across three views: **Plan**, **Reflect**, and **Ledger**.

<!-- Screenshot -->
<!-- ![Ledgr UI](assets/screenshot.png) -->

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **AI**: Ollama (local LLM, default model `mistral`)
- **Container**: Docker Compose — no local Python, Node, or Ollama installation required

---

## Quick Start

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone <repo-url>
cd ledgr
docker compose up --build
```

Then open **http://localhost:3000**.

> **First run** downloads the `mistral` model (~4 GB) and builds the Docker images. This takes a few minutes depending on your connection.
> Subsequent `docker compose up` starts in seconds — the model is cached in a Docker volume.

### Stop the app

```bash
docker compose down
```

### Wipe the downloaded model weights (database is unaffected)

```bash
docker compose down -v
```

---

## Changing the LLM model

The default model is `mistral`. To use a different Ollama model, set `OLLAMA_MODEL` before starting:

```bash
# one-time in your shell
OLLAMA_MODEL=llama3.2 docker compose up --build

# or create a .env file at the repo root (Docker Compose picks it up automatically)
echo "OLLAMA_MODEL=llama3.2" > .env
docker compose up --build
```

The `ollama-init` service pulls the chosen model on first run. The backend reads the same variable and uses it for all categorization requests.

---

## Getting Started (first-time workflow)

1. **Open the app** at http://localhost:3000.
2. **Set up accounts** — click the credit card icon in the top-right header. Add your bank accounts and credit cards. Account type matters: credit card imports treat positive amounts as expenses; bank account imports trust the sign in the CSV.
3. **Set up your budget categories** — go to the **Plan** tab. Create category groups (e.g. "Housing", "Food") and add categories inside each group (e.g. "Rent", "Groceries"). You can assign a monthly budget amount and an emoji to each category. Optionally add auto-categorization rules (keyword or regex) to each category — these fire at import time before the LLM runs.
4. **Import transactions** — go to the **Ledger** tab and click **Import**. Drag-and-drop a CSV or Excel file exported from your bank. Select the account it belongs to. Preview detected rows, then confirm import. With "Auto-categorize" enabled, Ollama will categorize every transaction in the background while a progress bar tracks it.
5. **Review transactions** — after import, the Ledger switches to the **To Review** tab automatically. Confirm or correct each transaction's category, type, and description, then mark it as reviewed.
6. **Analyze** — visit **Reflect** for period-level charts (net cash flow, spending breakdown, income, savings rate). Visit **Plan** to see actual spending vs. your budget for the current month.

---

## The Three Views

### Plan (`/`)

A YNAB-style budget table organized into **groups** and **categories**.

| Column | Description |
|--------|-------------|
| **Assigned** | Monthly budget amount you set for this category |
| **Activity** | Actual spending pulled from reviewed transactions |
| **Available** | Assigned − Activity |

- Use the **month picker** to browse any month's budget vs. actuals.
- Click a category row to open the **Category Modal**: rename it, change emoji, set a budget amount, move it to a different group, and define auto-categorization rules (contains / starts-with / regex).
- The right panel shows a **spending donut** (actual vs. budget breakdown) and a **budget progress** bar chart.

### Reflect (`/reflect`)

Period-level financial analytics with an optional **compare with previous period** toggle.

| Chart | Description |
|-------|-------------|
| **Summary cards** | Total income, total spending, net cash flow, and transaction count for the period |
| **Net Cash Flow** | Bar chart of income vs. spending per month in the period |
| **Spending** | Stacked bar chart of spending by category per month |
| **Income** | Bar chart of income per month |
| **Spending by Category** | Donut chart aggregated across the full period |
| **Savings Rate** | Savings rate % per month, with an average line |

Available periods: **This Year**, **Last Month**, **Last 3 Months**, **Last 6 Months**. When "compare" is on, each chart overlays the equivalent prior period in a muted color.

### Ledger (`/ledger`)

The full transaction list, split into two tabs:

**All Transactions tab**
- Search by description
- Filter by category, account, transaction type (expense / income / transfer), date range, and amount range
- Sort by date, description, amount, category, or type
- Inline edit: click any cell to change the category, type, description, date, amount, or notes
- Paginated (50 per page), with infinite-scroll load more

**To Review tab**
- Shows only transactions not yet reviewed (newly imported ones land here)
- Review each transaction one at a time: confirm or correct category and type, then mark as reviewed
- Reviewed transactions move to the All Transactions tab

**Bulk actions** (select one or more rows in either tab):
- Re-categorize all selected
- Mark all as reviewed (To Review tab only)
- AI re-categorize selected (uses Ollama)
- Delete selected

**Other actions:**
- **Import** (top-right): drag-and-drop CSV or Excel, choose account, preview, confirm
- **Add** (top-right): manually create a single transaction
- **Split**: from the row actions menu, split one expense into multiple sub-transactions with their own categories
- **Duplicate**: clone a transaction row

---

## Accounts

Click the **credit card icon** (top-right header) to manage accounts.

- Add bank accounts (🏦) or credit cards (💳)
- Accounts appear as a filter in the Ledger and as a selector during import
- Deleting an account unlinks its transactions but does not delete them
- Account type affects import sign correction:
  - **Credit card**: positive CSV amounts → stored as negative expenses; negative → positive income
  - **Bank account**: sign in the CSV is preserved

---

## AI Categorization

Categorization runs in the background after import (or on demand via bulk-select → AI Categorize).

1. **Rules first**: each budget category can have keyword/regex rules. Transactions matching a rule are categorized instantly without touching the LLM.
2. **LLM fallback**: remaining transactions are sent to Ollama in batches of 5. The model is given your category list and returns a JSON array of assignments.
3. **Progress**: a progress bar in the UI polls the backend every second until the job completes.
4. **Graceful degradation**: if Ollama is unreachable, import still completes — transactions just arrive uncategorized.

The LLM is configured via environment variables (see [Changing the LLM model](#changing-the-llm-model)).

---

## Data

| Item | Location |
|------|----------|
| **Database** | `./data/expenses.db` in the repo directory (host filesystem) |
| **Model weights** | `ollama_data` Docker volume |

- The database persists across all Docker operations including `docker compose down -v` (only the volume is wiped, not `./data/`).
- **Deduplication**: transactions are hashed by `date + description + amount`. Re-uploading the same file is safe — duplicates are skipped automatically.
- **Export**: in the Ledger, use the export endpoint (`POST /api/export`) to download all transactions as CSV. The API docs at http://localhost:8000/docs list all available endpoints.

---

## Desktop Launchers

Platform launchers live in `platform/`. Each one starts Docker Compose, waits for the frontend to be ready, opens the app in Chrome's app-mode (falling back to the default browser), and shuts everything down when you close the window.

### macOS

`platform/macos/Ledgr.app` is a macOS app bundle you can launch from the Dock or Spotlight.

To install: drag `platform/macos/Ledgr.app` to your `/Applications` folder.

### Windows

`platform/windows/` contains a PowerShell launcher and a one-time shortcut installer.

| File | Purpose |
|------|---------|
| `ledgr.bat` | Double-click to launch Ledgr |
| `ledgr.ps1` | PowerShell launcher (called by the `.bat`) |
| `install-shortcut.ps1` | Run once to add a **Ledgr** shortcut to your Desktop |

**First-time setup** (run once in PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File platform\windows\install-shortcut.ps1
```

After that, double-click the **Ledgr** shortcut on your Desktop — or run `platform\windows\ledgr.bat` directly.

---

## API Docs

Start the app, then open http://localhost:8000/docs for the interactive Swagger UI.

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_MODEL` | `mistral` | Ollama model to pull and use for categorization |
| `OLLAMA_URL` | `http://ollama:11434` | Ollama service URL (set automatically by Docker Compose) |
| `DB_PATH` | *(required)* | Path to SQLite database file (set automatically by Docker Compose) |
