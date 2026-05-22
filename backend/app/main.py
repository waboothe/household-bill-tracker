"""FastAPI app — all routes for bills + settings.

Routes are intentionally in one module because the surface is small. If
this grows past ~250 lines, split per resource into `routes/`.
"""

from __future__ import annotations

import json
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .schemas import Bill, BillCreate, BillPatch, Settings, VariableAmountIn
from .seed import DEFAULT_LOCKED_DEPOSIT, SEED_BILLS

app = FastAPI(title="Household Bill Tracker API", version="0.1.0")

# CORS for local dev (Vite on :5173 talking to API on :8000). In Docker
# nginx fronts both so same-origin and CORS is a no-op.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Startup --------------------------------------------------------------

@app.on_event("startup")
def _startup() -> None:
    db.init_db()
    _seed_if_empty()


def _seed_if_empty() -> None:
    """First-boot ergonomics: pre-fill the demo data so the UI isn't empty."""
    with db.connect() as conn:
        (count,) = conn.execute("SELECT COUNT(*) FROM bills").fetchone()
        if count == 0:
            for idx, bill in enumerate(SEED_BILLS):
                _insert_bill(conn, {**bill, "sortOrder": idx})
        existing = conn.execute(
            "SELECT 1 FROM settings WHERE key = 'lockedDeposit'"
        ).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO settings(key, value) VALUES('lockedDeposit', ?)",
                (str(DEFAULT_LOCKED_DEPOSIT),),
            )


# ---- Bills ----------------------------------------------------------------

_BILL_COLUMNS = (
    "id, name, frequency, due_day, due_date, auto_pay, variable, amount, "
    "last_year_months, variable_amounts, paid_months, sort_order"
)


def _insert_bill(conn, bill: dict) -> None:
    cols = db.bill_to_columns(bill)
    conn.execute(
        f"""
        INSERT INTO bills ({_BILL_COLUMNS}) VALUES (
            :id, :name, :frequency, :due_day, :due_date, :auto_pay, :variable,
            :amount, :last_year_months, :variable_amounts, :paid_months,
            :sort_order
        )
        """,
        {
            "id": cols["id"],
            "name": cols["name"],
            "frequency": cols["frequency"],
            "due_day": cols.get("due_day"),
            "due_date": cols.get("due_date"),
            "auto_pay": cols.get("auto_pay", 0),
            "variable": cols.get("variable", 0),
            "amount": cols.get("amount", 0),
            "last_year_months": cols.get("last_year_months", "[]"),
            "variable_amounts": cols.get("variable_amounts", "{}"),
            "paid_months": cols.get("paid_months", "[]"),
            "sort_order": cols.get("sort_order", 0),
        },
    )


def _fetch_bill(conn, bill_id: str) -> dict:
    row = conn.execute(
        f"SELECT {_BILL_COLUMNS} FROM bills WHERE id = ?", (bill_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id!r} not found")
    return db.row_to_bill(row)


@app.get("/api/bills", response_model=list[Bill])
def list_bills() -> list[dict]:
    with db.connect() as conn:
        rows = conn.execute(
            f"SELECT {_BILL_COLUMNS} FROM bills ORDER BY sort_order, name"
        ).fetchall()
        return [db.row_to_bill(r) for r in rows]


@app.post("/api/bills", response_model=Bill, status_code=201)
def create_bill(payload: BillCreate) -> dict:
    bill = payload.model_dump(exclude_none=False)
    bill["id"] = bill.get("id") or f"b-{int(time.time() * 1000)}"
    with db.connect() as conn:
        (max_order,) = conn.execute(
            "SELECT COALESCE(MAX(sort_order), -1) FROM bills"
        ).fetchone()
        bill["sortOrder"] = max_order + 1
        _insert_bill(conn, bill)
        return _fetch_bill(conn, bill["id"])


@app.patch("/api/bills/{bill_id}", response_model=Bill)
def update_bill(bill_id: str, patch: BillPatch) -> dict:
    updates = patch.model_dump(exclude_unset=True)
    if not updates:
        # Nothing to do — just echo back. Saves a pointless write.
        with db.connect() as conn:
            return _fetch_bill(conn, bill_id)
    cols = db.bill_to_columns(updates)
    set_clause = ", ".join(f"{k} = :{k}" for k in cols)
    cols["id"] = bill_id
    with db.connect() as conn:
        cursor = conn.execute(
            f"UPDATE bills SET {set_clause} WHERE id = :id", cols
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Bill {bill_id!r} not found")
        return _fetch_bill(conn, bill_id)


@app.delete("/api/bills/{bill_id}", status_code=204)
def delete_bill(bill_id: str) -> None:
    with db.connect() as conn:
        cursor = conn.execute("DELETE FROM bills WHERE id = ?", (bill_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Bill {bill_id!r} not found")


# Convenience endpoints — the frontend calls these constantly so the
# semantics deserve to be explicit in the API surface, not buried in a
# generic PATCH the caller has to assemble.

@app.put("/api/bills/{bill_id}/variable-amounts/{month_key}", response_model=Bill)
def set_variable_amount(bill_id: str, month_key: str, payload: VariableAmountIn) -> dict:
    with db.connect() as conn:
        current = _fetch_bill(conn, bill_id)
        amounts = dict(current["variableAmounts"])
        amounts[month_key] = payload.value
        conn.execute(
            "UPDATE bills SET variable_amounts = ? WHERE id = ?",
            (json.dumps(amounts), bill_id),
        )
        return _fetch_bill(conn, bill_id)


@app.post("/api/bills/{bill_id}/paid/{month_key}", response_model=Bill)
def toggle_paid(bill_id: str, month_key: str) -> dict:
    with db.connect() as conn:
        current = _fetch_bill(conn, bill_id)
        paid = set(current["paidMonths"])
        paid.discard(month_key) if month_key in paid else paid.add(month_key)
        conn.execute(
            "UPDATE bills SET paid_months = ? WHERE id = ?",
            (json.dumps(sorted(paid)), bill_id),
        )
        return _fetch_bill(conn, bill_id)


# ---- Settings -------------------------------------------------------------

@app.get("/api/settings", response_model=Settings)
def get_settings() -> dict:
    with db.connect() as conn:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = 'lockedDeposit'"
        ).fetchone()
        value = float(row["value"]) if row else DEFAULT_LOCKED_DEPOSIT
        return {"lockedDeposit": value}


@app.put("/api/settings", response_model=Settings)
def update_settings(payload: Settings) -> dict:
    with db.connect() as conn:
        conn.execute(
            """
            INSERT INTO settings(key, value) VALUES('lockedDeposit', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (str(payload.lockedDeposit),),
        )
        return {"lockedDeposit": payload.lockedDeposit}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
