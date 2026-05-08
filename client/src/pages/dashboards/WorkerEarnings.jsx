import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, CheckCircle2, Hourglass } from 'lucide-react';
import { getMyEarnings, getMyEarningEntries } from '../../api/earnings.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { formatPrice } from '../../lib/booking.js';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  settled: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  voided: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function WorkerEarnings() {
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyEarnings(),
      getMyEarningEntries({ limit: 200 }),
    ])
      .then(([summary, list]) => {
        setData(summary);
        setEntries(list);
      })
      .catch(() => toast.error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries =
    statusFilter === 'all' ? entries : entries.filter((e) => e.status === statusFilter);

  const commissionPct = Math.round((data?.commissionRate || 0) * 100);

  return (
    <DashboardShell eyebrow="Worker" title="Your earnings">
      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : data ? (
        <div className="space-y-8">
          <FadeUp>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="card-rounded p-4 sm:p-5 bg-ink text-paper dark:bg-paper dark:text-ink">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
                  <Wallet size={14} /> Net earnings
                </div>
                <div className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatPrice(data.totals.net)}
                </div>
                <div className="mt-1 text-xs opacity-70">all-time</div>
              </div>
              <div className="card-rounded border border-amber-300 bg-amber-50/50 p-4 sm:p-5 dark:border-amber-400/20 dark:bg-amber-400/5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  <Hourglass size={14} /> Pending
                </div>
                <div className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatPrice(data.totals.pending)}
                </div>
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">
                  awaiting payout
                </div>
              </div>
              <div className="card-rounded border border-green-300 bg-green-50/50 p-4 sm:p-5 dark:border-green-400/20 dark:bg-green-400/5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  <CheckCircle2 size={14} /> Settled
                </div>
                <div className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatPrice(data.totals.settled)}
                </div>
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">paid out</div>
              </div>
              <div className="card-rounded p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  <TrendingUp size={14} /> Jobs done
                </div>
                <div className="mt-2 text-2xl font-bold sm:text-3xl">{data.totals.jobs}</div>
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">
                  {commissionPct}% platform fee
                </div>
              </div>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SmallStat label="Total gross" value={formatPrice(data.totals.gross)} />
            <SmallStat label="Platform commission" value={formatPrice(data.totals.commission)} />
            <SmallStat
              label="Net per job (avg)"
              value={
                data.totals.jobs > 0
                  ? formatPrice(Math.round(data.totals.net / data.totals.jobs))
                  : '—'
              }
            />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Daily breakdown</h3>
            </div>
            <div className="card-rounded overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
                  <tr>
                    <th className="p-4 font-normal">Date</th>
                    <th className="p-4 font-normal text-right">Jobs</th>
                    <th className="p-4 font-normal text-right">Gross</th>
                    <th className="p-4 font-normal text-right">Commission</th>
                    <th className="p-4 font-normal text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                  {data.dailyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-ink/60 dark:text-paper/50">
                        No earnings yet — complete a booking to see it here.
                      </td>
                    </tr>
                  ) : (
                    data.dailyBreakdown.map((e, i) => (
                      <tr
                        key={i}
                        className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50"
                      >
                        <td className="p-4 font-medium">{e.date}</td>
                        <td className="p-4 text-right">{e.jobs}</td>
                        <td className="p-4 text-right text-ink/70 dark:text-paper/70">
                          {formatPrice(e.gross)}
                        </td>
                        <td className="p-4 text-right text-ink/70 dark:text-paper/70">
                          {formatPrice(e.commission)}
                        </td>
                        <td className="p-4 text-right font-bold">{formatPrice(e.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Per-job ledger</h3>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'settled'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition ${
                      statusFilter === s
                        ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                        : 'border border-ink/15 hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-rounded overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
                  <tr>
                    <th className="p-4 font-normal">Booking</th>
                    <th className="p-4 font-normal">Service</th>
                    <th className="p-4 font-normal">Completed</th>
                    <th className="p-4 font-normal text-right">Net</th>
                    <th className="p-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-ink/60 dark:text-paper/50">
                        No entries.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e) => (
                      <tr
                        key={e._id}
                        className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50"
                      >
                        <td className="p-4 font-mono text-xs">
                          {e.booking?.code || '—'}
                        </td>
                        <td className="p-4">{e.booking?.service?.name || '—'}</td>
                        <td className="p-4 text-xs text-ink/70 dark:text-paper/70">
                          {fmtDate(e.completedAt)}
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {formatPrice(e.netAmount)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                              STATUS_BADGE[e.status] || ''
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="card-rounded p-4">
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
