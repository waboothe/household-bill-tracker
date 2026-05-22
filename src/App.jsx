import { useEffect, useState } from 'react';
import { LayoutDashboard, ListChecks, Settings2 } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import BillList from './components/BillList.jsx';
import ManageBills from './components/ManageBills.jsx';
import { api } from './data/api.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'bills', label: 'Bill List', Icon: ListChecks },
  { id: 'manage', label: 'Manage', Icon: Settings2 },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [bills, setBills] = useState([]);
  const [lockedDeposit, setLockedDeposit] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  // Initial hydrate from the API. Single fetch on mount — the API is the
  // source of truth, mutators just replace single records in local state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [billsData, settings] = await Promise.all([
          api.listBills(),
          api.getSettings(),
        ]);
        if (cancelled) return;
        setBills(billsData);
        setLockedDeposit(settings.lockedDeposit);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper: replace one bill in local state with whatever the API returned.
  // Keeps the "API is truth" rule without needing a full refetch per edit.
  const replaceBill = (updated) =>
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

  const updateBill = async (id, patch) => replaceBill(await api.updateBill(id, patch));

  const setVariableAmount = async (id, monthKey, value) =>
    replaceBill(await api.setVariableAmount(id, monthKey, value));

  const togglePaid = async (id, monthKey) =>
    replaceBill(await api.togglePaid(id, monthKey));

  const addBill = async (bill) => {
    const created = await api.createBill(bill);
    setBills((prev) => [...prev, created]);
  };

  const removeBill = async (id) => {
    await api.deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const persistLockedDeposit = async (value) => {
    setLockedDeposit(value); // optimistic — single number, low stakes
    await api.updateSettings({ lockedDeposit: value });
  };

  return (
    <div className="min-h-screen w-full flex justify-center">
      {/* Centered phone-frame for desktop; full-bleed on mobile */}
      <div className="w-full max-w-md min-h-screen bg-ink-100 relative pb-24">
        <Header tab={tab} />
        <main className="px-4 pt-2">
          {status === 'loading' && <LoadingState />}
          {status === 'error' && <ErrorState message={error} />}
          {status === 'ready' && tab === 'dashboard' && (
            <Dashboard
              bills={bills}
              lockedDeposit={lockedDeposit}
              onLockedDepositChange={persistLockedDeposit}
            />
          )}
          {status === 'ready' && tab === 'bills' && (
            <BillList
              bills={bills}
              onSetVariableAmount={setVariableAmount}
              onTogglePaid={togglePaid}
            />
          )}
          {status === 'ready' && tab === 'manage' && (
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

function LoadingState() {
  return (
    <div className="py-16 text-center text-ink-400 text-sm" role="status" aria-live="polite">
      Loading your bills…
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      role="alert"
    >
      <p className="font-semibold">Couldn't reach the bill tracker API.</p>
      <p className="mt-1 text-red-600/80 break-words">{message}</p>
      <p className="mt-2 text-xs text-red-600/70">
        Is the backend container up? Try <code>docker compose up -d</code>.
      </p>
    </div>
  );
}
