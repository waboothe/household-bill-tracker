"""Seed data — Python mirror of `src/data/seed.js`.

Kept in sync by hand because it's 12 rows that almost never change. If
this grows we'd ship a JSON file the frontend and backend both consume,
but YAGNI today.
"""

from __future__ import annotations

DEFAULT_LOCKED_DEPOSIT = 1850.0


def _monthly(n: float) -> list[float]:
    return [n] * 12


def _quarterly(n: float) -> list[float]:
    return [n, 0, 0, n, 0, 0, n, 0, 0, n, 0, 0]


def _yearly(month_idx: int, n: float) -> list[float]:
    return [n if i == month_idx else 0 for i in range(12)]


SEED_BILLS: list[dict] = [
    {"id": "b-mortgage", "name": "Mortgage", "frequency": "Monthly", "dueDay": 1,
     "autoPay": True, "variable": False, "amount": 2150,
     "lastYearMonths": _monthly(2125)},
    {"id": "b-electric", "name": "Electric", "frequency": "Monthly", "dueDay": 15,
     "autoPay": False, "variable": True, "amount": 145,
     "lastYearMonths": [185, 170, 150, 120, 110, 145, 195, 215, 180, 135, 140, 175]},
    {"id": "b-gas", "name": "Natural Gas", "frequency": "Monthly", "dueDay": 12,
     "autoPay": False, "variable": True, "amount": 60,
     "lastYearMonths": [125, 115, 85, 55, 35, 25, 22, 22, 30, 55, 85, 120]},
    {"id": "b-internet", "name": "Internet", "frequency": "Monthly", "dueDay": 5,
     "autoPay": True, "variable": False, "amount": 79,
     "lastYearMonths": _monthly(74)},
    {"id": "b-water", "name": "Water & Sewer", "frequency": "Quarterly", "dueDay": 20,
     "autoPay": False, "variable": False, "amount": 210,
     "lastYearMonths": _quarterly(195)},
    {"id": "b-streaming", "name": "Streaming Bundle", "frequency": "Monthly", "dueDay": 22,
     "autoPay": True, "variable": False, "amount": 38,
     "lastYearMonths": _monthly(32)},
    {"id": "b-phone", "name": "Cell Phones", "frequency": "Monthly", "dueDay": 8,
     "autoPay": True, "variable": False, "amount": 165,
     "lastYearMonths": _monthly(160)},
    {"id": "b-insurance-auto", "name": "Auto Insurance", "frequency": "Quarterly", "dueDay": 18,
     "autoPay": True, "variable": False, "amount": 685,
     "lastYearMonths": _quarterly(625)},
    {"id": "b-insurance-home", "name": "Home Insurance", "frequency": "Yearly",
     "dueDate": "2026-09-01", "autoPay": False, "variable": False, "amount": 1850,
     "lastYearMonths": _yearly(8, 1720)},
    {"id": "b-property-tax", "name": "Property Taxes", "frequency": "Yearly",
     "dueDate": "2026-11-15", "autoPay": False, "variable": False, "amount": 5400,
     "lastYearMonths": _yearly(10, 5180)},
    {"id": "b-hoa", "name": "HOA", "frequency": "Quarterly", "dueDay": 1,
     "autoPay": True, "variable": False, "amount": 295,
     "lastYearMonths": _quarterly(280)},
    {"id": "b-gym", "name": "Gym", "frequency": "Monthly", "dueDay": 3,
     "autoPay": True, "variable": False, "amount": 45,
     "lastYearMonths": _monthly(40)},
]
