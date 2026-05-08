import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Users, History, RefreshCw, Banknote, AlertCircle } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  listPendingByWorker,
  listWorkerPendingEntries,
  createPayoutBatch,
  listPayoutBatches,
  getPayoutSummary,
  backfillEarnings,
} from '../../api/payouts.js';
import { useAuth } from '../../context/AuthContext.jsx';

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

const TABS = [
  { key: 'pending', label: 'Pending Payouts', Icon: Users },
  { key: 'history', label: 'Settlement History', Icon: History },
];

const METHOD_LABEL = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cash: 'Cash',
  other: 'Other',
};

export default function AdminPayouts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState('pending');
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerEntries, setWorkerEntries] = useState([]);
  const [workerTotals, setWorkerTotals] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [sum, pendList, hist] = await Promise.all([
        getPayoutSummary(),
        listPendingByWorker(),
        listPayoutBatches({ limit: 100 }),
      ]);
      setSummary(sum);
      setPending(pendList.pending || []);
      setBatches(hist || []);
    } catch (e) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openWorkerModal = async (workerRow) => {
    setSelectedWorker(workerRow);
    setSelectedIds(new Set());
    setMethod('bank_transfer');
    setReference('');
    setNotes('');
    try {
      const data = await listWorkerPendingEntries(workerRow.workerId);
      setWorkerEntries(data.entries || []);
      setWorkerTotals(data.totals || null);
      setSelectedIds(new Set((data.entries || []).map((e) => e._id)));
    } catch (e) {
      toast.error('Failed to load earnings');
    }
  };

  const closeWorkerModal = () => {
    setSelectedWorker(null);
    setWorkerEntries([]);
    setWorkerTotals(null);
    setSelectedIds(new Set());
  };

  const toggleEntry = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedTotals = useMemo(() => {
    const sel = workerEntries.filter((e) => selectedIds.has(e._id));
    return sel.reduce(
      (acc, e) => {
        acc.gross += e.grossAmount;
        acc.commission += e.commissionAmount;
        acc.net += e.netAmount;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, net: 0, count: 0 }
    );
  }, [workerEntries, selectedIds]);

  const handleSettle = async () => {
    if (!selectedWorker) return;
    if (selectedIds.size === 0) {
      toast.error('Select at least one earning to settle');
      return;
    }
    if (!isAdmin) {
      toast.error('Only admins can settle payouts');
      return;
    }
    setWorking(true);
    try {
      const batch = await createPayoutBatch({
        workerId: selectedWorker.workerId,
        earningIds: Array.from(selectedIds),
        method,
        reference: reference.trim(),
        notes: notes.trim(),
      });
      toast.success(`Settled ${inr(batch.totalNet)} to ${batch.worker?.name || 'worker'}`);
      closeWorkerModal();
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Settlement failed');
    } finally {
      setWorking(false);
    }
  };

  const handleBackfill = async () => {
    if (!isAdmin) return;
    setWorking(true);
    try {
      const res = await backfillEarnings();
      toast.success(`Backfilled ${res.created} earnings (${res.skipped} already existed)`);
      refresh();
    } catch (err) {
      toast.error('Backfill failed');
    } finally {
      setWorking(false);
    }
  };

  return (
    <DashboardShell eyebrow="Finance" title="Payouts">
      <FadeUp>
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard
            label="Pending payout"
            value={inr(summary?.summary?.pendingNet || 0)}
            sub={`${summary?.summary?.pendingCount || 0} jobs`}
            tone="amber"
          />
          <SummaryCard
            label="Settled to date"
            value={inr(summary?.summary?.settledNet || 0)}
            sub={`${summary?.summary?.totalBatches || 0} batches`}
            tone="green"
          />
          <SummaryCard
            label="Platform commission"
            value={inr(summary?.summary?.totalCommission || 0)}
            sub={`${Math.round((summary?.commissionRate || 0) * 100)}% rate`}
            tone="ink"
          />
          <SummaryCard
            label="Last settlement"
            value={fmtDate(summary?.summary?.lastSettledAt)}
            sub="latest batch"
            tone="ink"
          />
        </div>
      </FadeUp>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, Icon }) => {
            const active = key === tab;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                  active
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                    : 'border border-ink/15 hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleBackfill}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50 dark:border-paper/15 dark:hover:border-paper/40"
              title="Create earnings for completed bookings that don't have one yet"
            >
              <RefreshCw size={14} />
              Backfill earnings
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50 dark:border-paper/15 dark:hover:border-paper/40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {tab === 'pending' && (
        <PendingPanel
          loading={loading}
          rows={pending}
          onOpen={openWorkerModal}
          isAdmin={isAdmin}
        />
      )}

      {tab === 'history' && <HistoryPanel loading={loading} batches={batches} />}

      {selectedWorker && (
        <SettleModal
          worker={selectedWorker}
          entries={workerEntries}
          totals={workerTotals}
          selectedIds={selectedIds}
          onToggle={toggleEntry}
          onClose={closeWorkerModal}
          onSubmit={handleSettle}
          method={method}
          setMethod={setMethod}
          reference={reference}
          setReference={setReference}
          notes={notes}
          setNotes={setNotes}
          selectedTotals={selectedTotals}
          working={working}
          isAdmin={isAdmin}
        />
      )}
    </DashboardShell>
  );
}

function SummaryCard({ label, value, sub, tone }) {
  const toneClasses = {
    amber: 'border-amber-300 bg-amber-50/50 dark:border-amber-400/20 dark:bg-amber-400/5',
    green: 'border-green-300 bg-green-50/50 dark:border-green-400/20 dark:bg-green-400/5',
    ink: 'border-ink/10 dark:border-paper/10',
  }[tone];
  return (
    <div className={`card-rounded p-4 sm:p-5 border ${toneClasses}`}>
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">{sub}</div>
    </div>
  );
}

function PendingPanel({ loading, rows, onOpen, isAdmin }) {
  if (loading) {
    return <div className="card-rounded p-10 text-center text-ink/60">Loading…</div>;
  }
  if (!rows.length) {
    return (
      <div className="card-rounded p-10 text-center text-sm text-ink/60 dark:text-paper/50">
        No pending payouts. Earnings appear here when workers complete jobs.
      </div>
    );
  }
  return (
    <div className="card-rounded overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
          <tr>
            <th className="p-4 font-normal">Worker</th>
            <th className="p-4 font-normal">Jobs</th>
            <th className="p-4 font-normal">Gross</th>
            <th className="p-4 font-normal">Commission</th>
            <th className="p-4 font-normal text-right">Net Payable</th>
            <th className="p-4 font-normal">Oldest</th>
            <th className="p-4 font-normal" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
          {rows.map((r) => (
            <tr
              key={r.workerId}
              className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50"
            >
              <td className="p-4">
                <div className="font-medium">{r.worker?.name || '—'}</div>
                <div className="text-xs text-ink/60 dark:text-paper/50">
                  {r.worker?.email}
                  {r.worker?.kycStatus && r.worker.kycStatus !== 'verified' && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                      <AlertCircle size={11} /> KYC {r.worker.kycStatus}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4">{r.jobs}</td>
              <td className="p-4">{inr(r.gross)}</td>
              <td className="p-4 text-ink/70 dark:text-paper/70">{inr(r.commission)}</td>
              <td className="p-4 text-right font-semibold">{inr(r.net)}</td>
              <td className="p-4 text-xs text-ink/60 dark:text-paper/50">
                {fmtDate(r.oldest)}
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => onOpen(r)}
                  disabled={!isAdmin}
                  title={!isAdmin ? 'Only admins can settle' : undefined}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-40 dark:bg-paper dark:text-ink"
                >
                  <Banknote size={14} />
                  {isAdmin ? 'Settle' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryPanel({ loading, batches }) {
  if (loading) {
    return <div className="card-rounded p-10 text-center text-ink/60">Loading…</div>;
  }
  if (!batches.length) {
    return (
      <div className="card-rounded p-10 text-center text-sm text-ink/60 dark:text-paper/50">
        No settlement history yet.
      </div>
    );
  }
  return (
    <div className="card-rounded overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
          <tr>
            <th className="p-4 font-normal">Code</th>
            <th className="p-4 font-normal">Worker</th>
            <th className="p-4 font-normal">Jobs</th>
            <th className="p-4 font-normal">Net Paid</th>
            <th className="p-4 font-normal">Method</th>
            <th className="p-4 font-normal">Reference</th>
            <th className="p-4 font-normal">Settled</th>
            <th className="p-4 font-normal">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
          {batches.map((b) => (
            <tr key={b._id} className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50">
              <td className="p-4 font-mono text-xs">{b.code}</td>
              <td className="p-4">
                <div className="font-medium">{b.worker?.name || '—'}</div>
                <div className="text-xs text-ink/60 dark:text-paper/50">{b.worker?.email}</div>
              </td>
              <td className="p-4">{b.earningsCount}</td>
              <td className="p-4 font-semibold">{inr(b.totalNet)}</td>
              <td className="p-4 text-xs uppercase tracking-widest">
                {METHOD_LABEL[b.method] || b.method}
              </td>
              <td className="p-4 text-xs">{b.reference || '—'}</td>
              <td className="p-4 text-xs">{fmtDateTime(b.settledAt)}</td>
              <td className="p-4 text-xs">{b.settledBy?.name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettleModal({
  worker,
  entries,
  totals,
  selectedIds,
  onToggle,
  onClose,
  onSubmit,
  method,
  setMethod,
  reference,
  setReference,
  notes,
  setNotes,
  selectedTotals,
  working,
  isAdmin,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-6 backdrop-blur-sm">
      <div className="card-rounded flex max-h-[90vh] w-full max-w-4xl flex-col border border-paper/10 bg-paper text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-6 dark:border-paper/10">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Settle payout
            </div>
            <h3 className="heading-display mt-2 text-2xl">{worker.worker?.name}</h3>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/60">
              {worker.worker?.email} · {worker.jobs} pending job{worker.jobs === 1 ? '' : 's'}
            </p>
          </div>
          <button onClick={onClose} className="pill-btn text-xs">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
                <tr>
                  <th className="p-3 font-normal">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === entries.length && entries.length > 0}
                      onChange={() => {
                        if (selectedIds.size === entries.length) {
                          entries.forEach((e) => onToggle(e._id));
                        } else {
                          entries.forEach((e) => {
                            if (!selectedIds.has(e._id)) onToggle(e._id);
                          });
                        }
                      }}
                    />
                  </th>
                  <th className="p-3 font-normal">Booking</th>
                  <th className="p-3 font-normal">Service</th>
                  <th className="p-3 font-normal">Completed</th>
                  <th className="p-3 font-normal text-right">Gross</th>
                  <th className="p-3 font-normal text-right">Commission</th>
                  <th className="p-3 font-normal text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                {entries.map((e) => (
                  <tr key={e._id} className="text-sm">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(e._id)}
                        onChange={() => onToggle(e._id)}
                      />
                    </td>
                    <td className="p-3 font-mono text-xs">{e.booking?.code || e.booking}</td>
                    <td className="p-3">{e.booking?.service?.name || '—'}</td>
                    <td className="p-3 text-xs text-ink/70 dark:text-paper/70">
                      {fmtDateTime(e.completedAt)}
                    </td>
                    <td className="p-3 text-right">{inr(e.grossAmount)}</td>
                    <td className="p-3 text-right text-ink/70 dark:text-paper/70">
                      {inr(e.commissionAmount)}
                    </td>
                    <td className="p-3 text-right font-semibold">{inr(e.netAmount)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-ink/60 dark:text-paper/50">
                      No pending earnings
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Payout method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={!isAdmin}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/20 dark:focus:border-paper/60"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Reference (txn id, UPI ref, etc.)
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={!isAdmin}
                placeholder="Optional reference for audit trail"
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/20 dark:focus:border-paper/60"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isAdmin}
                rows={2}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/20 dark:focus:border-paper/60"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 p-6 dark:border-paper/10">
          <div className="text-sm">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Selected
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
              <span>{selectedTotals.count} job{selectedTotals.count === 1 ? '' : 's'}</span>
              <span className="text-ink/70 dark:text-paper/70">Gross {inr(selectedTotals.gross)}</span>
              <span className="text-ink/70 dark:text-paper/70">
                Commission {inr(selectedTotals.commission)}
              </span>
              <span className="font-semibold">Net {inr(selectedTotals.net)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="pill-btn text-xs" disabled={working}>
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={working || !isAdmin || selectedIds.size === 0}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-xs uppercase tracking-widest text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <Wallet size={14} />
              {working ? 'Settling…' : `Mark settled · ${inr(selectedTotals.net)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
