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

import { formatPrice, formatDate, formatDateTime, formatPercent } from '../../lib/format.js';

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
      toast.success(`Settled ${formatPrice(batch.totalNet)} to ${batch.worker?.name || 'worker'}`);
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
            value={formatPrice(summary?.summary?.pendingNet || 0)}
            sub={`${summary?.summary?.pendingCount || 0} jobs`}
            tone="amber"
          />
          <SummaryCard
            label="Settled amount"
            value={formatPrice(summary?.summary?.settledNet || 0)}
            sub={`${summary?.summary?.totalBatches || 0} batches`}
            tone="green"
          />
          <SummaryCard
            label="Platform commission"
            value={formatPrice(summary?.summary?.totalCommission || 0)}
            sub={`${formatPercent((summary?.commissionRate || 0) * 100)} rate`}
            tone="ink"
          />
          <SummaryCard
            label="Last settlement"
            value={formatDate(summary?.summary?.lastSettledAt)}
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
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 hover:border-ink/40:border-paper/40'
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
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50:border-paper/40"
              title="Create earnings for completed bookings that don't have one yet"
            >
              <RefreshCw size={14} />
              Backfill earnings
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50:border-paper/40"
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
    amber: 'border-amber-300 bg-amber-50/50',
    green: 'border-green-300 bg-green-50/50',
    ink: 'border-ink/10',
  }[tone];
  return (
    <div className={`card-rounded p-4 sm:p-5 border ${toneClasses}`}>
      <div className="text-xs uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-ink/60">{sub}</div>
    </div>
  );
}

function PendingPanel({ loading, rows, onOpen, isAdmin }) {
  if (loading) {
    return <div className="card-rounded p-10 text-center text-ink/60">Loading…</div>;
  }
  if (!rows.length) {
    return (
      <div className="card-rounded p-10 text-center text-sm text-ink/60">
        No pending payouts. Earnings appear here when workers complete jobs.
      </div>
    );
  }
  return (
    <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
      <table className="w-full text-left text-sm text-ink">
        <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
          <tr>
            <th className="p-4 font-normal">Worker</th>
            <th className="p-4 font-normal">Paid Jobs</th>
            <th className="p-4 font-normal">Gross earnings</th>
            <th className="p-4 font-normal">Platform commission</th>
            <th className="p-4 font-normal text-right">Net earnings</th>
            <th className="p-4 font-normal">Oldest</th>
            <th className="p-4 font-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((r) => (
            <tr
              key={r.workerId}
              className="transition-colors hover:bg-sand/30 group"
            >
              <td className="p-4 align-top pt-5">
                <div className="font-medium text-ink">{r.worker?.name || '—'}</div>
                <div className="text-[11px] text-ink/60 mt-0.5">
                  {r.worker?.email}
                  {r.worker?.kycStatus && r.worker.kycStatus !== 'verified' && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-600 border border-amber-200 bg-amber-50 px-1.5 rounded-full py-0.5">
                      <AlertCircle size={10} /> KYC {r.worker.kycStatus}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4 align-top pt-5 font-medium">{r.jobs}</td>
              <td className="p-4 align-top pt-5 text-ink/80">{formatPrice(r.gross)}</td>
              <td className="p-4 align-top pt-5 text-ink/70">{formatPrice(r.commission)}</td>
              <td className="p-4 align-top pt-5 text-right font-bold text-ink">{formatPrice(r.net)}</td>
              <td className="p-4 align-top pt-5 text-[11px] text-ink/60">
                {formatDate(r.oldest)}
              </td>
              <td className="p-4 align-top pt-5 text-right">
                <button
                  onClick={() => onOpen(r)}
                  disabled={!isAdmin}
                  title={!isAdmin ? 'Only admins can settle' : undefined}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Banknote size={12} />
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
      <div className="card-rounded p-10 text-center text-sm text-ink/60">
        No settlement history yet.
      </div>
    );
  }
  return (
    <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
      <table className="w-full text-left text-sm text-ink">
        <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
          <tr>
            <th className="p-4 font-normal">Code</th>
            <th className="p-4 font-normal">Worker</th>
            <th className="p-4 font-normal">Paid Jobs</th>
            <th className="p-4 font-normal">Net earnings</th>
            <th className="p-4 font-normal">Method</th>
            <th className="p-4 font-normal">Reference</th>
            <th className="p-4 font-normal">Settled</th>
            <th className="p-4 font-normal">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {batches.map((b) => (
            <tr key={b._id} className="transition-colors hover:bg-sand/30 group">
              <td className="p-4 align-top pt-5 font-mono text-[11px] font-semibold">{b.code}</td>
              <td className="p-4 align-top pt-5">
                <div className="font-medium text-ink">{b.worker?.name || '—'}</div>
                <div className="text-[11px] text-ink/60 mt-0.5">{b.worker?.email}</div>
              </td>
              <td className="p-4 align-top pt-5 font-medium">{b.earningsCount}</td>
              <td className="p-4 align-top pt-5 font-bold text-ink">{formatPrice(b.totalNet)}</td>
              <td className="p-4 align-top pt-5">
                <span className="inline-flex rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/70">
                  {METHOD_LABEL[b.method] || b.method}
                </span>
              </td>
              <td className="p-4 align-top pt-5 text-[11px] text-ink/60">{b.reference || '—'}</td>
              <td className="p-4 align-top pt-5 text-[11px] font-medium text-ink/80">{formatDateTime(b.settledAt)}</td>
              <td className="p-4 align-top pt-5 text-[11px] text-ink/60">{b.settledBy?.name || '—'}</td>
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
      <div className="card-rounded flex max-h-[90vh] w-full max-w-4xl flex-col border border-paper/10 bg-paper text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60">
              Settle payout
            </div>
            <h3 className="heading-display mt-2 text-2xl">{worker.worker?.name}</h3>
            <p className="mt-1 text-sm text-ink/70">
              {worker.worker?.email} · {worker.jobs} pending job{worker.jobs === 1 ? '' : 's'}
            </p>
          </div>
          <button onClick={onClose} className="pill-btn text-xs">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-xl border border-ink/5 bg-sand/10">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-sand/50 text-[10px] uppercase tracking-widest text-ink/60 border-b border-ink/5">
                <tr>
                  <th className="p-3 font-normal w-10">
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
                      className="rounded border-ink/20"
                    />
                  </th>
                  <th className="p-3 font-normal">Booking</th>
                  <th className="p-3 font-normal">Service</th>
                  <th className="p-3 font-normal">Completed</th>
                  <th className="p-3 font-normal text-right">Gross earnings</th>
                  <th className="p-3 font-normal text-right">Platform commission</th>
                  <th className="p-3 font-normal text-right">Net earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {entries.map((e) => (
                  <tr key={e._id} className="text-sm transition-colors hover:bg-sand/30">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(e._id)}
                        onChange={() => onToggle(e._id)}
                        className="rounded border-ink/20"
                      />
                    </td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-ink">{e.booking?.code || e.booking}</td>
                    <td className="p-3 text-[13px] font-medium text-ink/80">{e.booking?.service?.name || '—'}</td>
                    <td className="p-3 text-[11px] text-ink/60">
                      {formatDateTime(e.completedAt)}
                    </td>
                    <td className="p-3 text-right text-ink/80">{formatPrice(e.grossAmount)}</td>
                    <td className="p-3 text-right text-ink/70">
                      {formatPrice(e.commissionAmount)}
                    </td>
                    <td className="p-3 text-right font-bold text-ink">{formatPrice(e.netAmount)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-ink/50 text-xs uppercase tracking-widest">
                      No pending earnings
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-ink/60">
                Payout method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={!isAdmin}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-ink/60">
                Reference (txn id, UPI ref, etc.)
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={!isAdmin}
                placeholder="Optional reference for audit trail"
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs uppercase tracking-widest text-ink/60">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isAdmin}
                rows={2}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 p-6">
          <div className="text-sm">
            <div className="text-xs uppercase tracking-widest text-ink/60">
              Selected
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
              <span>{selectedTotals.count} job{selectedTotals.count === 1 ? '' : 's'}</span>
              <span className="text-ink/70">Gross earnings {formatPrice(selectedTotals.gross)}</span>
              <span className="text-ink/70">
                Platform commission {formatPrice(selectedTotals.commission)}
              </span>
              <span className="font-semibold">Net earnings {formatPrice(selectedTotals.net)}</span>
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
              {working ? 'Settling…' : `Mark settled · ${formatPrice(selectedTotals.net)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
