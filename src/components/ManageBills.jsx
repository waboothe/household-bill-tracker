import { useState } from 'react';
import { Plus, Trash2, Zap, Repeat, User, Heart, Users, X } from 'lucide-react';
import { FREQUENCIES, OWNERS } from '../data/seed.js';
import { formatCurrency } from '../data/calc.js';

export default function ManageBills({ bills, onAddBill, onUpdateBill, onRemoveBill }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 py-3 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-400">{bills.length} bills registered</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-card transition"
        >
          <Plus size={16} /> Add New Bill
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {bills.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill}
            onUpdate={(patch) => onUpdateBill(bill.id, patch)}
            onRemove={() => onRemoveBill(bill.id)}
          />
        ))}
      </ul>

      {modalOpen && (
        <AddBillModal
          onClose={() => setModalOpen(false)}
          onSave={(bill) => { onAddBill(bill); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

/* ---------- Card for each registered bill ---------- */

function BillCard({ bill, onUpdate, onRemove }) {
  const dueLabel =
    bill.frequency === 'Yearly'
      ? new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `Day ${bill.dueDay}`;

  return (
    <li className="bg-white rounded-2xl p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900 truncate">{bill.name}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">
            {bill.frequency} · {dueLabel} · {formatCurrency(bill.amount, { cents: true })}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-ink-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition"
          aria-label={`Delete ${bill.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <Toggle
          on={bill.autoPay}
          onChange={(v) => onUpdate({ autoPay: v })}
          Icon={Zap}
          label="Auto-pay"
        />
        <Toggle
          on={bill.variable}
          onChange={(v) => onUpdate({ variable: v })}
          Icon={Repeat}
          label="Variable"
        />
        <OwnerPill owner={bill.assignedTo} onChange={(v) => onUpdate({ assignedTo: v })} />
      </div>
    </li>
  );
}

function Toggle({ on, onChange, Icon, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold transition ${
        on ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-400'
      }`}
    >
      <Icon size={12} />
      {label}
      <span
        className={`ml-0.5 h-3 w-5 rounded-full transition ${
          on ? 'bg-emerald-500' : 'bg-ink-300'
        } relative`}
      >
        <span
          className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-transform ${
            on ? 'translate-x-2.5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function OwnerPill({ owner, onChange }) {
  const map = {
    You: { Icon: User, cls: 'bg-indigo-100 text-indigo-700' },
    Spouse: { Icon: Heart, cls: 'bg-pink-100 text-pink-700' },
    Joint: { Icon: Users, cls: 'bg-violet-100 text-violet-700' },
  };
  const { Icon, cls } = map[owner] || map.Joint;
  return (
    <label className={`relative inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold ${cls}`}>
      <Icon size={12} />
      <span>{owner}</span>
      <select
        value={owner}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Assigned to"
      >
        {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/* ---------- Add Bill Modal ---------- */

function AddBillModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    frequency: 'Monthly',
    dueDay: 1,
    dueDate: new Date().toISOString().slice(0, 10),
    autoPay: false,
    variable: false,
    assignedTo: 'Joint',
    amount: '',
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !(Number(form.amount) > 0)) return;
    const base = {
      name: form.name.trim(),
      frequency: form.frequency,
      autoPay: form.autoPay,
      variable: form.variable,
      assignedTo: form.assignedTo,
      amount: Number(form.amount),
    };
    onSave(
      form.frequency === 'Yearly'
        ? { ...base, dueDate: form.dueDate }
        : { ...base, dueDay: Math.max(1, Math.min(31, Number(form.dueDay) || 1)) },
    );
  };

  return (
    <div
      className="fixed inset-0 z-30 bg-ink-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-card animate-[slideUp_.2s_ease-out]"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">New bill</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-ink-100 text-ink-400" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-3">
          <Field label="Bill name">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Trash service"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequency">
              <select
                value={form.frequency}
                onChange={(e) => set({ frequency: e.target.value })}
                className="input"
              >
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>

            {form.frequency === 'Yearly' ? (
              <Field label="Due date">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set({ dueDate: e.target.value })}
                  className="input"
                />
              </Field>
            ) : (
              <Field label="Due day">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.dueDay}
                  onChange={(e) => set({ dueDay: e.target.value })}
                  className="input"
                />
              </Field>
            )}
          </div>

          <Field label={form.variable ? 'Last year average ($)' : 'Amount ($)'}>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
              placeholder="0.00"
              className="input"
            />
          </Field>

          <Field label="Assigned to">
            <select
              value={form.assignedTo}
              onChange={(e) => set({ assignedTo: e.target.value })}
              className="input"
            >
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <div className="flex items-center justify-between gap-3 mt-1">
            <ToggleField label="Auto-pay" on={form.autoPay} onChange={(v) => set({ autoPay: v })} />
            <ToggleField label="Variable amount" on={form.variable} onChange={(v) => set({ variable: v })} />
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-card transition"
        >
          Save bill
        </button>

        <style>{`
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-400">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({ label, on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg border border-ink-200 bg-white"
    >
      <span className="text-sm text-ink-800 font-medium">{label}</span>
      <span className={`h-5 w-9 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-ink-200'} relative`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
