import uuid
from fastapi import APIRouter, HTTPException

from models import (
    BudgetResponse, BudgetGroup, BudgetCategory, BudgetRule,
    CreateGroupRequest, UpdateGroupRequest,
    CreateCategoryRequest, UpdateCategoryRequest,
)
from services.database import get_connection

router = APIRouter()


def _load_budget(conn) -> BudgetResponse:
    groups = conn.execute(
        "SELECT id, name, collapsed FROM budget_groups ORDER BY sort_order, name"
    ).fetchall()

    cats = conn.execute(
        "SELECT id, name, group_id, budget_amount, emoji FROM budget_categories ORDER BY sort_order, name"
    ).fetchall()

    rules = conn.execute(
        "SELECT id, category_id, match_type, pattern FROM budget_rules"
    ).fetchall()

    rules_by_cat: dict[str, list] = {}
    for r in rules:
        rules_by_cat.setdefault(r["category_id"], []).append(
            BudgetRule(id=r["id"], match_type=r["match_type"], pattern=r["pattern"], category_id=r["category_id"])
        )

    cats_by_group: dict[str, list] = {}
    for c in cats:
        cats_by_group.setdefault(c["group_id"], []).append(
            BudgetCategory(
                id=c["id"],
                name=c["name"],
                group_id=c["group_id"],
                budget_amount=c["budget_amount"],
                emoji=c["emoji"] or "📦",
                rules=rules_by_cat.get(c["id"], []),
            )
        )

    group_list = [
        BudgetGroup(
            id=g["id"],
            name=g["name"],
            collapsed=bool(g["collapsed"]),
            categories=cats_by_group.get(g["id"], []),
        )
        for g in groups
    ]

    return BudgetResponse(groups=group_list)


@router.get("/budget", response_model=BudgetResponse)
def get_budget():
    with get_connection() as conn:
        return _load_budget(conn)


@router.post("/budget/groups", response_model=BudgetGroup)
def create_group(req: CreateGroupRequest):
    group_id = str(uuid.uuid4())
    with get_connection() as conn:
        max_order = conn.execute("SELECT COALESCE(MAX(sort_order), -1) FROM budget_groups").fetchone()[0]
        conn.execute(
            "INSERT INTO budget_groups (id, name, collapsed, sort_order) VALUES (?,?,0,?)",
            (group_id, req.name.strip(), max_order + 1),
        )
    return BudgetGroup(id=group_id, name=req.name.strip(), collapsed=False, categories=[])


@router.patch("/budget/groups/{group_id}", response_model=BudgetGroup)
def update_group(group_id: str, req: UpdateGroupRequest):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM budget_groups WHERE id=?", (group_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        new_name = req.name.strip() if req.name is not None else row["name"]
        new_collapsed = int(req.collapsed) if req.collapsed is not None else row["collapsed"]
        conn.execute(
            "UPDATE budget_groups SET name=?, collapsed=? WHERE id=?",
            (new_name, new_collapsed, group_id),
        )
        return _load_budget(conn).groups  # re-fetch to get categories too

    # Fetch fresh after commit
    with get_connection() as conn:
        groups = _load_budget(conn).groups
        return next((g for g in groups if g.id == group_id), None)


@router.delete("/budget/groups/{group_id}")
def delete_group(group_id: str):
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM budget_groups WHERE id=?", (group_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        conn.execute("DELETE FROM budget_groups WHERE id=?", (group_id,))
    return {"ok": True}


@router.post("/budget/categories", response_model=BudgetCategory)
def create_category(req: CreateCategoryRequest):
    cat_id = str(uuid.uuid4())
    with get_connection() as conn:
        grp = conn.execute("SELECT id FROM budget_groups WHERE id=?", (req.group_id,)).fetchone()
        if not grp:
            raise HTTPException(status_code=404, detail="Group not found")
        max_order = conn.execute(
            "SELECT COALESCE(MAX(sort_order), -1) FROM budget_categories WHERE group_id=?", (req.group_id,)
        ).fetchone()[0]
        conn.execute(
            "INSERT INTO budget_categories (id, name, group_id, budget_amount, emoji, sort_order) VALUES (?,?,?,?,?,?)",
            (cat_id, req.name.strip(), req.group_id, req.budget_amount, req.emoji, max_order + 1),
        )
    return BudgetCategory(
        id=cat_id, name=req.name.strip(), group_id=req.group_id,
        budget_amount=req.budget_amount, emoji=req.emoji, rules=[],
    )


@router.patch("/budget/categories/{cat_id}", response_model=BudgetCategory)
def update_category(cat_id: str, req: UpdateCategoryRequest):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM budget_categories WHERE id=?", (cat_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Category not found")

        new_name = req.name.strip() if req.name is not None else row["name"]
        new_group = req.group_id if req.group_id is not None else row["group_id"]
        new_amount = req.budget_amount if req.budget_amount is not None else row["budget_amount"]
        new_emoji = req.emoji if req.emoji is not None else row["emoji"]

        conn.execute(
            "UPDATE budget_categories SET name=?, group_id=?, budget_amount=?, emoji=? WHERE id=?",
            (new_name, new_group, new_amount, new_emoji, cat_id),
        )

        if req.rules is not None:
            conn.execute("DELETE FROM budget_rules WHERE category_id=?", (cat_id,))
            for rule in req.rules:
                rule_id = rule.id if rule.id else str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO budget_rules (id, category_id, match_type, pattern) VALUES (?,?,?,?)",
                    (rule_id, cat_id, rule.match_type, rule.pattern),
                )

        rules = conn.execute(
            "SELECT id, category_id, match_type, pattern FROM budget_rules WHERE category_id=?", (cat_id,)
        ).fetchall()

    return BudgetCategory(
        id=cat_id, name=new_name, group_id=new_group,
        budget_amount=new_amount, emoji=new_emoji or "📦",
        rules=[BudgetRule(id=r["id"], match_type=r["match_type"], pattern=r["pattern"], category_id=cat_id) for r in rules],
    )


@router.delete("/budget/categories/{cat_id}")
def delete_category(cat_id: str):
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM budget_categories WHERE id=?", (cat_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Category not found")
        conn.execute("DELETE FROM budget_categories WHERE id=?", (cat_id,))
    return {"ok": True}
