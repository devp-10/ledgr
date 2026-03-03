# Ledgr

**Track your spending without sending your data anywhere.**

Ledgr is a self-hosted personal finance app. Import your bank statements, let a local AI categorize your transactions, and get a clear picture of where your money is going — all running on your own machine.

[![Docker Pulls](https://img.shields.io/docker/pulls/YOUR_DOCKERHUB_USERNAME/ledgr-backend?label=Docker%20pulls&logo=docker)](https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/ledgr-backend)
[![GitHub Stars](https://img.shields.io/github/stars/YOUR_GITHUB_USERNAME/ledgr?style=flat&logo=github)](https://github.com/YOUR_GITHUB_USERNAME/ledgr)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

![Ledgr screenshot](docs/screenshot.png)
<!-- Add a screenshot at docs/screenshot.png to make this show up -->

---

## Why Ledgr?

- **100% private** — your transactions never leave your machine. No cloud sync, no accounts, no telemetry.
- **AI categorization that works offline** — uses [Ollama](https://ollama.com) to run a local LLM. No OpenAI key, no API costs.
- **Import from any bank** — drag and drop a CSV or Excel export from your bank. Duplicates are detected automatically.
- **Budget tracking** — set monthly budgets per category and see actual vs. planned at a glance.
- **Spending analytics** — visualize net cash flow, category breakdowns, income, and savings rate over any time period.
- **One command to run** — the only requirement is Docker.

---

## Install

**Requirement:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free)

### Option A — one-liner

```bash
curl -L https://github.com/YOUR_GITHUB_USERNAME/ledgr/releases/latest/download/docker-compose.yml -o docker-compose.yml && docker compose up
```

### Option B — manual

1. Go to the [latest release](https://github.com/YOUR_GITHUB_USERNAME/ledgr/releases/latest) and download `docker-compose.yml`
2. Place it in an empty folder
3. Run:

```bash
docker compose up
```

Then open **[http://localhost:3000](http://localhost:3000)**.

> **First run:** Ledgr downloads the `mistral` AI model (~4 GB). This takes a few minutes depending on your internet speed. Subsequent starts are instant — the model is cached locally.

### Stop the app

```bash
docker compose down
```

### Uninstall completely

```bash
docker compose down -v   # removes cached model weights
rm docker-compose.yml
rm -rf data/             # removes your transaction database
```

---

## Getting useful in 10 minutes

**1. Add your accounts**
Click the card icon in the top-right header. Add each bank account or credit card you want to track. The account type matters for how import signs are interpreted.

**2. Set up your budget categories**
Go to the **Plan** tab. Create groups like "Housing" or "Food", then add categories inside each group (e.g. "Rent", "Groceries"). Optionally assign a monthly budget amount to each.

**3. Import transactions**
Go to **Ledger → Import**. Drag and drop a CSV exported from your bank, choose the account it belongs to, and confirm. The AI will categorize everything in the background.

**4. Review**
The **To Review** tab shows newly imported transactions. Confirm or correct each one's category, then mark it as reviewed.

**5. Explore**
- **Plan** — budget vs. actual spending this month
- **Reflect** — charts for any time period: cash flow, spending breakdown, savings rate
- **Ledger** — full searchable and filterable transaction list

---

## Change the AI model

The default model is `mistral` (~4 GB, good balance of speed and accuracy). To use a different one:

```bash
# in the same folder as your docker-compose.yml
echo "OLLAMA_MODEL=llama3.2" > .env
docker compose up
```

Any model available on [ollama.com/library](https://ollama.com/library) will work. It is downloaded automatically on the next start.

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_MODEL` | `mistral` | Which Ollama model to use for AI categorization |
| `OLLAMA_URL` | `http://ollama:11434` | Ollama service URL (set automatically by Docker Compose) |
| `DB_PATH` | `/data/expenses.db` | Path to the SQLite database inside the container |

Copy `.env.example` to `.env` and uncomment any lines you want to change.

---

## Your data

| What | Where |
|---|---|
| Transaction database | `./data/expenses.db` next to your `docker-compose.yml` |
| AI model weights | Docker volume (managed by Docker, not a folder on disk) |

The database survives all Docker operations including `docker compose down -v`. Only `rm -rf data/` deletes it.

Transactions are deduplicated by date + description + amount — re-importing the same file is safe.

---

## Contributing

Ledgr is built with FastAPI, React, SQLite, and Ollama. To run from source:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/ledgr.git
cd ledgr
docker compose up --build
```

The app rebuilds automatically when you change backend or frontend source files.

<details>
<summary>Tech stack details</summary>

- **Backend:** Python 3.12, FastAPI, SQLite (via raw `sqlite3`), Ollama Python client
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, shadcn/ui
- **AI:** Ollama — runs any GGUF-compatible model locally
- **Infrastructure:** Docker Compose, nginx (frontend), multi-arch images (amd64 + arm64)

</details>

Pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

---

## License

MIT — see [LICENSE](LICENSE).
