import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Snowflake,
  RefreshCw,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getMyWallet, getMyTransactions } from '../../api/wallet.js';

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

const SOURCE_LABEL = {
  admin_credit: 'Admin credit',
  admin_debit: 'Admin debit',
  refund: 'Refund',
  cashback: 'Cashback',
  promo: 'Promo',
  order_payment: 'Order payment',
  booking_payment: 'Booking payment',
  adjustment: 'Adjustment',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Credits' },
  { key: 'debit', label: 'Debits' },
];

export default function UserWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = 50;

  const loadWallet = () =>
    getMyWallet()
      .then((data) => setWallet(data.wallet))
      .catch(() => toast.error('Failed to load wallet'));

  const loadTransactions = (currentSkip = 0) => {
    const params = { limit, skip: currentSkip };
    if (filter !== 'all') params.type = filter;
    return getMyTransactions(params)
      .then((data) => {
        setTransactions((prev) =>
          currentSkip === 0 ? data.transactions : [...prev, ...data.transactions]
        );
        setTotal(data.total || 0);
      })
      .catch(() => toast.error('Failed to load transactions'));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadWallet(), loadTransactions(0)]).finally(() => setLoading(false));
    setSkip(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleLoadMore = async () => {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    await loadTransactions(nextSkip);
  };

  const stats = useMemo(() => {
    const acc = { credits: 0, debits: 0 };
    transactions.forEach((t) => {
      if (t.type === 'credit') acc.credits += t.amount;
      else acc.debits += t.amount;
    });
    return acc;
  }, [transactions]);

  return (
    <DashboardShell eyebrow="Customer" title="Wallet">
      <FadeUp>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card-rounded p-5 bg-ink text-paper">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
              <Wallet size={14} /> Balance
            </div>
            <div className="mt-2 text-3xl font-bold sm:text-4xl">
              {loading ? '—' : inr(wallet?.balance || 0)}
            </div>
            <div className="mt-1 text-xs opacity-70">{wallet?.currency || 'INR'}</div>
            {wallet?.isFrozen && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs uppercase tracking-widest">
                <Snowflake size={11} /> Frozen
              </div>
            )}
          </div>
          <div className="card-rounded border border-green-300 bg-green-50/50 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60">
              <ArrowDownCircle size={14} /> Credits (this view)
            </div>
            <div className="mt-2 text-2xl font-semibold sm:text-3xl">
              {inr(stats.credits)}
            </div>
          </div>
          <div className="card-rounded border border-red-300 bg-red-50/50 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60">
              <ArrowUpCircle size={14} /> Debits (this view)
            </div>
            <div className="mt-2 text-2xl font-semibold sm:text-3xl">
              {inr(stats.debits)}
            </div>
          </div>
        </div>
      </FadeUp>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                  active
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 hover:border-ink/40:border-paper/40'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            setSkip(0);
            loadWallet();
            loadTransactions(0);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-xs uppercase tracking-widest hover:border-ink/40:border-paper/40"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="p-4 font-normal">When</th>
              <th className="p-4 font-normal">Type</th>
              <th className="p-4 font-normal">Source</th>
              <th className="p-4 font-normal text-right">Amount</th>
              <th className="p-4 font-normal text-right">Balance after</th>
              <th className="p-4 font-normal">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60">
                  No wallet activity yet.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t._id}
                  className="transition hover:bg-sand/30:bg-[#18181A]/50"
                >
                  <td className="p-4 text-xs text-ink/70">
                    {fmt(t.createdAt)}
                  </td>
                  <td className="p-4">
                    {t.type === 'credit' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium uppercase tracking-widest text-green-700">
                        <ArrowDownCircle size={11} /> Credit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium uppercase tracking-widest text-red-700">
                        <ArrowUpCircle size={11} /> Debit
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs uppercase tracking-widest">
                    {SOURCE_LABEL[t.source] || t.source}
                  </td>
                  <td
                    className={`p-4 text-right font-semibold tabular-nums ${
                      t.type === 'credit'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {t.type === 'credit' ? '+' : '−'}
                    {inr(t.amount)}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {inr(t.balanceAfter)}
                  </td>
                  <td className="p-4 text-xs text-ink/65">
                    {t.note || <span className="opacity-50">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > 0 && transactions.length < total && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="rounded-full border border-ink/15 px-5 py-2 text-xs uppercase tracking-widest hover:border-ink/40:border-paper/40"
          >
            Load more ({total - transactions.length} more)
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
