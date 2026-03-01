from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.database import init_db
from routers import transactions, dashboard, reports, accounts, budgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Ledgr — Expense Tracker API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(transactions.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")



@app.get("/api/health")
def health():
    return {"status": "ok"}
