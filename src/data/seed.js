// Mock seed data. Realistic household bills across all frequency types,
// auto-pay vs manual, fixed vs variable. Bills are stored in their NATIVE
// frequency; everything is normalized to "annual" at calculation time
// (see src/data/calc.js).
//
// Each bill also carries `lastYearMonths` — a 12-slot array of actual
// amounts paid each month last year. Used by the comparison + per-bill
// charts. For non-monthly bills the inactive months are 0, matching the
// same rules the projection helper uses for the current year.

export const FREQUENCIES = ['Monthly', 'Quarterly', 'Yearly'];

// Locked direct deposit (per paycheck, biweekly). User edits once per year.
export const DEFAULT_LOCKED_DEPOSIT = 1850;

// Small builders so the per-bill arrays stay declarative + DRY.
const monthly = (n) => Array(12).fill(n);
const quarterly = (n) => [n, 0, 0, n, 0, 0, n, 0, 0, n, 0, 0];
const yearly = (monthIdx, n) => Array.from({ length: 12 }, (_, i) => (i === monthIdx ? n : 0));

export const SEED_BILLS = [
  {
    id: 'b-mortgage',
    name: 'Mortgage',
    frequency: 'Monthly',
    dueDay: 1,
    autoPay: true,
    variable: false,
    amount: 2150,
    lastYearMonths: monthly(2125), // small payment-shop refi last fall
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
    // Seasonal: AC summer, heat winter, mild shoulders.
    lastYearMonths: [185, 170, 150, 120, 110, 145, 195, 215, 180, 135, 140, 175],
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
    // Heavy winter spike, near-zero summer.
    lastYearMonths: [125, 115, 85, 55, 35, 25, 22, 22, 30, 55, 85, 120],
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
    lastYearMonths: monthly(74),
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
    lastYearMonths: quarterly(195),
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
    lastYearMonths: monthly(32), // price hike kicked in this year
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
    lastYearMonths: monthly(160),
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
    lastYearMonths: quarterly(625),
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
    lastYearMonths: yearly(8, 1720),
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
    lastYearMonths: yearly(10, 5180),
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
    lastYearMonths: quarterly(280),
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
    lastYearMonths: monthly(40),
    variableAmounts: {},
    paidMonths: [],
  },
];
