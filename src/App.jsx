import { useMemo, useState } from 'react';
import { LayoutDashboard, ListChecks, Settings2 } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import BillList from './components/BillList.jsx';
import ManageBills from './components/ManageBills.jsx';
import { SEED_BILLS, DEFAULT_LOCKED_DEPOSIT, LAST_YEAR_MONTHLY } from './data/seed.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'bills', label: 'Bill List', Icon: ListChecks },
  { id: 'manage', label: 'Manage', Icon: Settings2 },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [bills, setBills] = useState(SEED_BILLS);
  const [lockedDeposit, setLockedDeposit] = useState(DEFAULT_LOCKED_DEPOSIT);

  // Memoize the immutable last-year array so chart props are stable.
  const lastYear = useMemo(() => LAST_YEAR_MONTHLY, []);

  // Single source of truth for mutating a bill — every component edits via
  // these helpers so we don't sprinkle setBills logic across the tree.
  const updateBill = (id, patch) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const setVariableAmount = (id, monthKey, value) =>
    setBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, variableAmounts: { ...b.variableAmounts, [monthKey]: value } }
          : b,
      ),
    );

  const togglePaid = (id, monthKey) =>
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const paid = new Set(b.paidMonths || []);
        paid.has(monthKey) ? paid.delete(monthKey) : paid.add(monthKey);
        return { ...b, paidMonths: [...paid] };
      }),
    );

  const addBill = (bill) =>
    setBills((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        variableAmounts: {},
        paidMonths: [],
        ...bill,
      },
    ]);

  const removeBill = (id) =>
    setBills((prev) => prev.filter((b) => b.id !== id));

  return (
    <div className="min-h-screen w-full flex justify-center">
      {/* Centered phone-frame for desktop; full-bleed on mobile */}
      <div className="w-full max-w-md min-h-screen bg-ink-100 relative pb-24">
        <Header tab={tab} />
        <main className="px-4 pt-2">
          {tab === 'dashboard' && (
            <Dashboard
              bills={bills}
              lockedDeposit={lockedDeposit}
              onLockedDepositChange={setLockedDeposit}
              lastYear={lastYear}
            />
          )}
          {tab === 'bills' && (
            <BillList
              bills={bills}
              onSetVariableAmount={setVariableAmount}
              onTogglePaid={togglePaid}
            />
          )}
          {tab === 'manage' && (
            <ManageBills
              bills={bills}
              onAddBill={addBill}
              onUpdateBill={updateBill}
              onRemoveBill={removeBill}
            />
          )}
        </main>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  );
}

function Header({ tab }) {
  const title = {
    dashboard: 'Peace of Mind',
    bills: 'This Month',
    manage: 'Manage Bills',
  }[tab];
  return (
    <header className="sticky top-0 z-20 bg-ink-100/80 backdrop-blur-md px-4 py-3 border-b border-ink-200/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold">
            Nest · Household
          </p>
          <h1 className="text-xl font-bold text-ink-900 leading-tight">{title}</h1>
        </div>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-card">
          N
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tab, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-ink-200 shadow-[0_-4px_24px_-12px_rgba(15,23,42,0.18)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-3">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? 'text-indigo-600' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
