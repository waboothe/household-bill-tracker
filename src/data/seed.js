// Mock seed data. Realistic household bills across all frequency types,
// auto-pay vs manual, fixed vs variable, and split between the spouses.
// Bills are stored in their NATIVE frequency; everything is normalized
// to "annual" at calculation time (see src/data/calc.js).

export const FREQUENCIES = ['Monthly', 'Quarterly', 'Yearly'];

// Locked direct deposit (per paycheck, biweekly). User edits once per year.
export const DEFAULT_LOCKED_DEPOSIT = 1850;

// dueDay = day of month (1-31) for monthly/quarterly.
// dueDate = ISO "YYYY-MM-DD" for yearly bills (year ignored, month+day used).
// variableAmounts: keyed by "YYYY-MM" for the current year so the user can
// log this month's value. If absent for the current month, the bill shows
// in the "Pending Action" section of Tab 2.
// paidMonths: set of "YYYY-MM" strings the user has marked as paid.

export const SEED_BILLS = [
  {
    id: 'b-mortgage',
    name: 'Mortgage',
    frequency: 'Monthly',
    dueDay: 1,
    autoPay: true,
    variable: false,
    amount: 2150,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-electric',
    name: 'Electric',
    frequency: 'Monthly',
    dueDay: 15,
    autoPay: false,
    variable: true,
    amount: 145, // placeholder average
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-gas',
    name: 'Natural Gas',
    frequency: 'Monthly',
    dueDay: 12,
    autoPay: false,
    variable: true,
    amount: 60,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-internet',
    name: 'Internet',
    frequency: 'Monthly',
    dueDay: 5,
    autoPay: true,
    variable: false,
    amount: 79,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-water',
    name: 'Water & Sewer',
    frequency: 'Quarterly',
    dueDay: 20,
    autoPay: false,
    variable: false,
    amount: 210,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-streaming',
    name: 'Streaming Bundle',
    frequency: 'Monthly',
    dueDay: 22,
    autoPay: true,
    variable: false,
    amount: 38,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-phone',
    name: 'Cell Phones',
    frequency: 'Monthly',
    dueDay: 8,
    autoPay: true,
    variable: false,
    amount: 165,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-insurance-auto',
    name: 'Auto Insurance',
    frequency: 'Quarterly',
    dueDay: 18,
    autoPay: true,
    variable: false,
    amount: 685,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-insurance-home',
    name: 'Home Insurance',
    frequency: 'Yearly',
    dueDate: '2026-09-01',
    autoPay: false,
    variable: false,
    amount: 1850,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-property-tax',
    name: 'Property Taxes',
    frequency: 'Yearly',
    dueDate: '2026-11-15',
    autoPay: false,
    variable: false,
    amount: 5400,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-hoa',
    name: 'HOA',
    frequency: 'Quarterly',
    dueDay: 1,
    autoPay: true,
    variable: false,
    amount: 295,
    variableAmounts: {},
    paidMonths: [],
  },
  {
    id: 'b-gym',
    name: 'Gym',
    frequency: 'Monthly',
    dueDay: 3,
    autoPay: true,
    variable: false,
    amount: 45,
    variableAmounts: {},
    paidMonths: [],
  },
];

// Last-year actual monthly totals for the comparison chart. These are the
// "true" historical numbers (not derived from current bills) — gives the
// dashboard something rich to look at on first load.
export const LAST_YEAR_MONTHLY = [
  2680, 2710, 3120, 2695, 2745, 3020,
  2880, 2730, 4495, 2705, 8190, 3360,
];
