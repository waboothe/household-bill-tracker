import { useMemo, useState } from 'react';
import { AlertCircle, Check, History, Zap, User, Users, Heart } from 'lucide-react';
import { billsDueInMonth, formatCurrency, monthKey } from '../data/calc.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'You', label: 'My Bills' },
  { id: "Spouse", label: "Spouse's" },
];

export default function BillList({ bills, onSetVariableAmount, onTogglePaid }) {
  const [filter, setFilter] = useState('all');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const mKey = monthKey(now);

  const dueThisMonth = useMemo(() => billsDueInMonth(bills, year, month), [bills, year, month]);

  // Apply the owner filter ("All" keeps Joint visible everywhere).
  const filtered = useMemo(() => {
    if (filter === 'all') return dueThisMonth;
    return dueThisMonth.filter(({ bill }) => bill.assignedTo === filter || bill.assignedTo === 'Joint');
  }, [dueThisMonth, filter]);

  // Classify each due bill into one of three buckets.
  const overdue = [];
  const pending = [];
  const autoFixed = [];

  for (const entry of filtered) {
    const { bill, dueDateObj } = entry;
    const isPaid = (bill.paidMonths || []).includes(mKey);
    const hasVariableEntry = bill.variable && bill.variableAmounts?.[mKey] != null;

    if (isPaid) {
      // Paid bills always go to the "settled" auto-fixed bucket visually.
      autoFixed.push({ ...entry, isPaid });
      continue;
    }
    if (!bill.autoPay && dueDateObj.getDate() < today && !isPaid) {
      overdue.push({ ...entry, isPaid });
      continue;
    }
    if (bill.variable && !hasVariableEntry) {
      pending.push({ ...entry, isPaid });
      continue;
    }
    autoFixed.push({ ...entry, isPaid });
  }

  const totalCount = filtered.length;
  const settledCount = filtered.filter(({ bill }) => (bill.paidMonths || []).includes(mKey) || bill.autoPay).length;

  return (
    <div className="flex flex-col gap-4 py-3">
      <ProgressBar settled={settledCount} total={totalCount} />

      <div role="tablist" aria-label="Filter bills" className="flex gap-1.5 p-1 bg-white rounded-full shadow-card">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`flex-1 text-xs font-semibold py-2 rounded-full transition ${
                active ? 'bg-ink-900 text-white shadow' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <Section
        title="Overdue"
        emoji="🔴"
        accent="rose"
        emptyMsg="Nothing past-due. Nice work."
        items={overdue}
      >
        {(entry) => (
          <BillRow
            key={entry.bill.id}
            entry={entry}
            tone="rose"
            mKey={mKey}
            actionSlot={
              <button
                onClick={() => onTogglePaid(entry.bill.id, mKey)}
                className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-full inline-flex items-center gap-1"
              >
                <Check size={14} /> Mark Paid
              </button>
            }
          />
        )}
      </Section>

      <Section
        title="Pending action"
        emoji="🟡"
        accent="amber"
        emptyMsg="No variable bills waiting on your input."
        items={pending}
      >
        {(entry) => (
          <PendingVariableRow
            key={entry.bill.id}
            entry={entry}
            mKey={mKey}
            onSetVariableAmount={onSetVariableAmount}
          />
        )}
      </Section>

      <Section
        title="Auto-pay & fixed"
        emoji="🟢"
        accent="emerald"
        emptyMsg="No set-and-forget bills for this month."
        items={autoFixed}
        muted
      >
        {(entry) => <BillRow key={entry.bill.id} entry={entry} tone="emerald" mKey={mKey} />}
      </Section>
    </div>
  );
}

/* ---------- Pieces ---------- */

function ProgressBar({ settled, total }) {
  const pct = total === 0 ? 0 : Math.round((settled / total) * 100);
  return (
    <section className="bg-white rounded-2xl p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-ink-900">
          {settled} of {total} <span className="font-normal text-ink-400">bills settled this month</span>
        </p>
        <span className="text-xs font-semibold text-indigo-600">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full bg-ink-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

const SECTION_THEME = {
  rose: 'bg-rose-50/70 ring-rose-200',
  amber: 'bg-amber-50/70 ring-amber-200',
  emerald: 'bg-emerald-50/60 ring-emerald-200',
};

function Section({ title, emoji, accent, items, emptyMsg, muted, children }) {
  return (
    <section className={`rounded-2xl ring-1 p-3 ${SECTION_THEME[accent]} ${muted ? 'opacity-95' : ''}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        <span className="text-[11px] font-semibold text-ink-600 bg-white/80 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-400 px-2 py-3">{emptyMsg}</p>
      ) : (
        <ul className="flex flex-col gap-2">{items.map((entry) => children(entry))}</ul>
      )}
    </section>
  );
}

function OwnerBadge({ owner }) {
  const map = {
    You: { Icon: User, cls: 'bg-indigo-100 text-indigo-700' },
    Spouse: { Icon: Heart, cls: 'bg-pink-100 text-pink-700' },
    Joint: { Icon: Users, cls: 'bg-violet-100 text-violet-700' },
  };
  const { Icon, cls } = map[owner] || map.Joint;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>
      <Icon size={10} />
      {owner}
    </span>
  );
}

function BillRow({ entry, tone, mKey, actionSlot }) {
  const { bill, dueDateObj, isPaid } = entry;
  return (
    <li className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${isPaid ? 'line-through text-ink-400' : 'text-ink-900'}`}>
            {bill.name}
          </p>
          {bill.autoPay && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              <Zap size={10} /> Auto
            </span>
          )}
          <OwnerBadge owner={bill.assignedTo} />
        </div>
        <p className="text-[11px] text-ink-400 mt-0.5">
          Due {dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '}
          {bill.frequency}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className={`text-sm font-bold ${tone === 'rose' ? 'text-rose-700' : 'text-ink-900'}`}>
          {formatCurrency(bill.variable ? (bill.variableAmounts?.[mKey] ?? bill.amount) : bill.amount, { cents: true })}
        </p>
        {actionSlot}
      </div>
    </li>
  );
}

function PendingVariableRow({ entry, mKey, onSetVariableAmount }) {
  const { bill, dueDateObj } = entry;
  // Last month's stored value (or fall back to the placeholder amount).
  const [year, month] = mKey.split('-').map(Number);
  const lastMonth = new Date(year, month - 2, 1); // month is 1-indexed in key
  const lastKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const lastValue = bill.variableAmounts?.[lastKey] ?? bill.amount;
  const [draft, setDraft] = useState('');

  const save = (value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) return;
    onSetVariableAmount(bill.id, mKey, v);
  };

  return (
    <li className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink-900 truncate">{bill.name}</p>
            <OwnerBadge owner={bill.assignedTo} />
          </div>
          <p className="text-[11px] text-ink-400 mt-0.5 flex items-center gap-1">
            <AlertCircle size={11} className="text-amber-500" />
            Variable · enter this month's bill
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder={`Enter $ (avg ${lastValue})`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save(draft)}
            className="w-full pl-7 pr-3 py-2 rounded-lg border border-ink-200 focus:border-indigo-500 focus:ring-0 text-sm"
            aria-label={`Amount for ${bill.name}`}
          />
        </div>
        <button
          onClick={() => save(draft)}
          disabled={!draft}
          className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-ink-200 disabled:text-ink-400 transition"
          aria-label="Save amount"
        >
          <Check size={18} />
        </button>
        <button
          onClick={() => save(lastValue)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-2 rounded-lg whitespace-nowrap"
          title="Use last month's amount"
        >
          <History size={12} /> Last
        </button>
      </div>
      <p className="text-[10px] text-ink-400 mt-1">
        Due {dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </li>
  );
}
