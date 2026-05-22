"""SQLite layer.

Single-file DB so the whole thing lives in one Docker volume. We use the
stdlib `sqlite3` driver — no ORM. The data model is tiny (2 tables) and an
ORM would be pure ceremony here.

Bills store `lastYearMonths`, `variableAmounts`, and `paidMonths` as JSON
blobs in TEXT columns. They're opaque to SQL queries (we always load the
whole bill anyway) and trying to normalize them into child tables would
just add joins for zero gain. YAGNI.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DB_PATH = Path(os.environ.get("BILL_TRACKER_DB", "/data/bills.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS bills (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    frequency        TEXT NOT NULL,
    due_day          INTEGER,
    due_date         TEXT,
    auto_pay         INTEGER NOT NULL DEFAULT 0,
    variable         INTEGER NOT NULL DEFAULT 0,
    amount           REAL NOT NULL DEFAULT 0,
    last_year_months TEXT NOT NULL DEFAULT '[]',
    variable_amounts TEXT NOT NULL DEFAULT '{}',
    paid_months      TEXT NOT NULL DEFAULT '[]',
    sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def init_db() -> None:
    """Create the DB file + schema on boot. Idempotent."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    """Context-managed connection with sane defaults (Row factory, FK on)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


# ---- Row <-> dict helpers --------------------------------------------------
# Kept here (not in routes) so the JSON-blob encoding rules live next to the
# schema that owns them. One place to change if the storage format evolves.

_JSON_FIELDS = {"last_year_months", "variable_amounts", "paid_months"}
_SNAKE_TO_CAMEL = {
    "due_day": "dueDay",
    "due_date": "dueDate",
    "auto_pay": "autoPay",
    "last_year_months": "lastYearMonths",
    "variable_amounts": "variableAmounts",
    "paid_months": "paidMonths",
    "sort_order": "sortOrder",
}
_CAMEL_TO_SNAKE = {v: k for k, v in _SNAKE_TO_CAMEL.items()}


def row_to_bill(row: sqlite3.Row) -> dict:
    """Translate a SQLite row into the camelCase shape the React app speaks."""
    out: dict = {}
    for key in row.keys():
        value = row[key]
        if key in _JSON_FIELDS:
            value = json.loads(value or ("[]" if key != "variable_amounts" else "{}"))
        elif key in {"auto_pay", "variable"}:
            value = bool(value)
        out[_SNAKE_TO_CAMEL.get(key, key)] = value
    # Drop nulls for the optional due_* fields so the frontend sees `undefined`
    # rather than literal `null` — matches the seed shape it was built against.
    for k in ("dueDay", "dueDate"):
        if out.get(k) is None:
            out.pop(k, None)
    return out


def bill_to_columns(bill: dict) -> dict:
    """Inverse of `row_to_bill` — camelCase dict → snake_case column dict."""
    cols: dict = {}
    for key, value in bill.items():
        col = _CAMEL_TO_SNAKE.get(key, key)
        if col in _JSON_FIELDS:
            value = json.dumps(value)
        elif col in {"auto_pay", "variable"}:
            value = 1 if value else 0
        cols[col] = value
    return cols
