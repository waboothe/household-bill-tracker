// Pure helpers for billing math. Kept side-effect free so they can be
// trivially memoized in components.

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const FREQ_MULTIPLIER = { Monthly: 12, Quarterly: 4, Yearly: 1 };

export function annualCost(bill) {
  return expectedAmount(bill) * FREQ_MULTIPLIER[bill.frequency];
}

export function totalAnnual(bills) {
  return bills.reduce((acc, b) => acc + annualCost(b), 0);
}

export function biweeklyRequired(bills) {
  return totalAnnual(bills) / 26;
}

export function averageMonthly(bills) {
  return totalAnnual(bills) / 12;
}

// SAFE / WARNING / ACTION_REQUIRED status for the locked deposit gauge.
export function depositStatus(lockedDeposit, biweekly) {
  if (lockedDeposit < biweekly) return 'ACTION';
  // Within 5% buffer above the required biweekly amount → WARNING.
  const buffer = (lockedDeposit - biweekly) / biweekly;
  if (buffer <= 0.05) return 'WARNING';
  return 'SAFE';
}

// The "best guess" charge for a variable bill in a month we haven't logged.
// Prefers the running average of every month we *have* logged this year,
// falling back to the user's stored placeholder (typically prior-year avg)
// when nothing has been entered yet.
export function expectedAmount(bill) {
  const placeholder = Number(bill.amount) || 0;
  if (!bill.variable) return placeholder;
  const entries = Object.values(bill.variableAmounts || {})
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (entries.length === 0) return placeholder;
  return entries.reduce((a, b) => a + b, 0) / entries.length;
}

// Returns expected charges for each month (0-11) of the current year for
// the given bills list, treating variableAmounts overrides where present.
// - Monthly: contributes every month on dueDay.
// - Quarterly: contributes on dueDay of months 0, 3, 6, 9.
// - Yearly: contributes only in the dueDate.month.
export function projectedMonthlyTotals(bills, year) {
  const totals = Array(12).fill(0);
  for (const b of bills) {
    const perMonth = monthsForBill(b, year);
    for (let m = 0; m < 12; m++) totals[m] += perMonth[m];
  }
  return totals;
}

// Per-bill 12-month projection — same rules as projectedMonthlyTotals but
// not aggregated. Pure + reused so the dashboard total and the per-bill
// chart can never disagree.
export function monthsForBill(bill, year) {
  const months = Array(12).fill(0);
  const fallback = expectedAmount(bill);
  if (bill.frequency === 'Monthly') {
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}`;
      const override = bill.variable ? bill.variableAmounts?.[key] : null;
      months[m] = override != null ? Number(override) : fallback;
    }
  } else if (bill.frequency === 'Quarterly') {
    [0, 3, 6, 9].forEach((m) => { months[m] = fallback; });
  } else if (bill.frequency === 'Yearly') {
    const dt = bill.dueDate ? new Date(bill.dueDate) : null;
    const m = dt ? dt.getUTCMonth() : 0;
    months[m] = fallback;
  }
  return months;
}

// Helper: get bills due in the given month (0-11) for the given year.
// Each result is { bill, dueDateObj } so downstream code can sort/show.
export function billsDueInMonth(bills, year, month) {
  const out = [];
  for (const b of bills) {
    if (b.frequency === 'Monthly') {
      out.push({ bill: b, dueDateObj: new Date(year, month, b.dueDay || 1) });
    } else if (b.frequency === 'Quarterly') {
      if ([0, 3, 6, 9].includes(month)) {
        out.push({ bill: b, dueDateObj: new Date(year, month, b.dueDay || 1) });
      }
    } else if (b.frequency === 'Yearly' && b.dueDate) {
      const dt = new Date(b.dueDate);
      if (dt.getUTCMonth() === month) {
        out.push({
          bill: b,
          dueDateObj: new Date(year, month, dt.getUTCDate()),
        });
      }
    }
  }
  return out.sort((a, b) => a.dueDateObj - b.dueDateObj);
}

// "YYYY-MM" key for a Date — used for paidMonths + variableAmounts lookups.
export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Find the next month in the year with a notably-high expense spike, used
// for the cash-flow buffer predictor copy. We define "spike" as any month
// whose projected total exceeds the 12-month median by more than 35%.
export function nextSpikeMonth(monthlyTotals, fromMonth) {
  const sorted = [...monthlyTotals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const threshold = median * 1.35;
  for (let i = fromMonth; i < 12; i++) {
    if (monthlyTotals[i] > threshold) {
      return { monthIndex: i, amount: monthlyTotals[i] };
    }
  }
  return null;
}

export function formatCurrency(n, opts = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(Number(n) || 0);
}
