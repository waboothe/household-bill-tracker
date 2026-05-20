import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { ShieldCheck, AlertTriangle, ShieldAlert, Pencil, Check, Sparkles, TrendingUp } from 'lucide-react';
import {
  averageMonthly, biweeklyRequired, depositStatus, formatCurrency,
  MONTHS_SHORT, nextSpikeMonth, projectedMonthlyTotals, totalAnnual,
} from '../data/calc.js';

const STATUS_THEME = {
  SAFE: {
    label: 'SAFE',
    sub: 'Your direct deposit covers every bill — and then some.',
    Icon: ShieldCheck,
    ring: 'from-emerald-400 to-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  WARNING: {
    label: 'WARNING',
    sub: 'Your buffer is shrinking — within 5% of the line.',
    Icon: AlertTriangle,
    ring: 'from-amber-400 to-amber-500',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
  },
  ACTION: {
    label: 'ACTION REQUIRED',
    sub: 'Underfunded — increase the deposit or trim a bill.',
    Icon: ShieldAlert,
    ring: 'from-rose-400 to-rose-600',
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function Dashboard({ bills, lockedDeposit, onLockedDepositChange, lastYear }) {
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const annual = useMemo(() => totalAnnual(bills), [bills]);
  const biweekly = useMemo(() => biweeklyRequired(bills), [bills]);
  const avgMonthly = useMemo(() => averageMonthly(bills), [bills]);
  const monthlyTotals = useMemo(() => projectedMonthlyTotals(bills, year), [bills, year]);
  const status = depositStatus(lockedDeposit, biweekly);

  const spike = useMemo(
    () => nextSpikeMonth(monthlyTotals, currentMonth),
    [monthlyTotals, currentMonth],
  );

  const chartData = useMemo(
    () => MONTHS_SHORT.map((m, i) => ({
      month: m,
      current: Math.round(monthlyTotals[i]),
      prior: Math.round(lastYear[i] ?? 0),
    })),
    [monthlyTotals, lastYear],
  );

  return (
    <div className="flex flex-col gap-4 py-3">
      <PeaceOfMindCard
        status={status}
        lockedDeposit={lockedDeposit}
        biweekly={biweekly}
        onLockedDepositChange={onLockedDepositChange}
      />

      <BufferPredictor spike={spike} status={status} />

      <SummaryRow annual={annual} avgMonthly={avgMonthly} biweekly={biweekly} />

      <ComparisonChartCard chartData={chartData} />
    </div>
  );
}

/* ---------- Peace of Mind / Safety Gauge ---------- */

function PeaceOfMindCard({ status, lockedDeposit, biweekly, onLockedDepositChange }) {
  const theme = STATUS_THEME[status];
  const { Icon } = theme;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lockedDeposit);

  // Gauge fill ratio: deposit relative to required (cap 1.5x for the visual)
  const ratio = Math.max(0.05, Math.min(lockedDeposit / Math.max(biweekly, 1), 1.5));
  const fillPct = Math.round((ratio / 1.5) * 100);

  const commit = () => {
    const next = Math.max(0, Number(draft) || 0);
    onLockedDepositChange(next);
    setEditing(false);
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-indigo-900 text-white p-5 shadow-card"
      aria-label="Peace of mind summary"
    >
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">
            Locked Direct Deposit
          </p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-bold">$</span>
              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commit()}
                autoFocus
                className="w-32 bg-transparent border-b border-white/40 text-3xl font-bold focus:outline-none"
              />
              <button
                onClick={commit}
                className="ml-1 h-9 w-9 inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 transition"
                aria-label="Save deposit"
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setDraft(lockedDeposit); setEditing(true); }}
              className="mt-1 flex items-baseline gap-2 group"
              aria-label="Edit locked direct deposit"
            >
              <span className="text-4xl font-extrabold tracking-tight">
                {formatCurrency(lockedDeposit)}
              </span>
              <span className="text-white/50 text-sm">/biweekly</span>
              <Pencil size={14} className="text-white/40 group-hover:text-white/80 transition" />
            </button>
          )}
          <p className="text-xs text-white/50 mt-1">Set once a year — tap to edit.</p>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${theme.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
          {theme.label}
        </div>
      </div>

      {/* Visual safety gauge */}
      <div className="relative mt-5">
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${theme.ring} transition-[width] duration-500`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {/* The "required biweekly" goal post sits at 1/1.5 = ~66.67% of the bar */}
        <div
          className="absolute -top-1.5 h-6 w-0.5 bg-white/70 rounded-full"
          style={{ left: '66.6%' }}
          aria-hidden
        />
        <div
          className="absolute top-5 -translate-x-1/2 text-[10px] text-white/70 whitespace-nowrap"
          style={{ left: '66.6%' }}
        >
          Required {formatCurrency(biweekly)}
        </div>
      </div>

      <div className="relative mt-9 flex items-center gap-2 text-sm text-white/80">
        <Icon size={16} className="shrink-0" />
        <span>{theme.sub}</span>
      </div>
    </section>
  );
}

/* ---------- Smart Cash-Flow Buffer Predictor ---------- */

function BufferPredictor({ spike, status }) {
  // No spike — celebrate the calm.
  if (!spike) {
    return (
      <Callout
        tone={status === 'ACTION' ? 'rose' : 'emerald'}
        Icon={Sparkles}
        title="Smooth sailing ahead"
        body="No big quarterly or yearly bills are queued up for the next few months. Your biweekly transfer keeps pace easily."
      />
    );
  }

  const monthName = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][spike.monthIndex];

  return (
    <Callout
      tone={status === 'ACTION' ? 'rose' : 'amber'}
      Icon={AlertTriangle}
      title={`Heads-up: high expense month in ${monthName}.`}
      body={`Projected ${formatCurrency(spike.amount)}. Your account buffer will temporarily dip, but your biweekly deposit handles it as long as you don't drain the cushion.`}
    />
  );
}

function Callout({ tone, Icon, title, body }) {
  const tones = {
    emerald: 'bg-emerald-50 ring-emerald-200 text-emerald-900 [&_svg]:text-emerald-600',
    amber: 'bg-amber-50 ring-amber-200 text-amber-900 [&_svg]:text-amber-600',
    rose: 'bg-rose-50 ring-rose-200 text-rose-900 [&_svg]:text-rose-600',
  };
  return (
    <div className={`rounded-2xl ring-1 p-4 flex gap-3 ${tones[tone]}`}>
      <Icon size={20} className="shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <p className="text-xs mt-1 text-ink-600 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ---------- Quick Summary Metrics ---------- */

function SummaryRow({ annual, avgMonthly, biweekly }) {
  const items = [
    { label: 'Annual', value: annual, accent: 'text-indigo-600' },
    { label: 'Avg / Mo', value: avgMonthly, accent: 'text-violet-600' },
    { label: 'Biweekly', value: biweekly, accent: 'text-emerald-600' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div key={it.label} className="bg-white rounded-2xl p-3 shadow-card">
          <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">{it.label}</p>
          <p className={`text-lg font-bold mt-1 ${it.accent}`}>{formatCurrency(it.value)}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Comparison Chart ---------- */

function ComparisonChartCard({ chartData }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-card" aria-label="Year over year comparison">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-indigo-600" />
            Monthly spend
          </h2>
          <p className="text-[11px] text-ink-400">This year vs. last year</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-indigo-600 rounded" />
            This yr
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-ink-400" />
            Last yr
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                boxShadow: '0 8px 24px -12px rgb(15 23 42 / 0.18)',
              }}
            />
            <Legend wrapperStyle={{ display: 'none' }} />
            <Line
              type="monotone"
              dataKey="prior"
              name="Last year"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="This year"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#4f46e5' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
