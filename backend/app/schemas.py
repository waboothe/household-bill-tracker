"""Pydantic schemas for the API surface.

Mirrors the camelCase shape the React app already uses, so the frontend
diff stays minimal. The DB layer handles snake_case translation.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Frequency = Literal["Monthly", "Quarterly", "Yearly"]


class BillBase(BaseModel):
    """Fields a client can supply when creating/updating a bill."""

    model_config = ConfigDict(extra="ignore")

    name: str
    frequency: Frequency
    dueDay: int | None = None
    dueDate: str | None = None
    autoPay: bool = False
    variable: bool = False
    amount: float = 0
    lastYearMonths: list[float] = Field(default_factory=lambda: [0] * 12)
    variableAmounts: dict[str, float] = Field(default_factory=dict)
    paidMonths: list[str] = Field(default_factory=list)


class BillCreate(BillBase):
    """Server assigns `id`, so it's optional on the way in."""

    id: str | None = None


class BillPatch(BaseModel):
    """Partial update — only the keys the client sends are touched."""

    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    frequency: Frequency | None = None
    dueDay: int | None = None
    dueDate: str | None = None
    autoPay: bool | None = None
    variable: bool | None = None
    amount: float | None = None
    lastYearMonths: list[float] | None = None
    variableAmounts: dict[str, float] | None = None
    paidMonths: list[str] | None = None


class Bill(BillBase):
    id: str


class VariableAmountIn(BaseModel):
    value: float


class Settings(BaseModel):
    lockedDeposit: float
