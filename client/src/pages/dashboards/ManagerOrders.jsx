import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';
import StatusBadge from '../../components/booking/StatusBadge.jsx';
import { listScopedBookings } from '../../api/manager.js';
import { listUsers } from '../../api/users.js';
import { assignWorker, autoAssign, transitionStatus } from '../../api/bookings.js';
import { formatDateTime, formatPrice, BOOKING_STATUS } from '../../lib/booking.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.PLACED, label: 'Placed' },
  { key: BOOKING_STATUS.ASSIGNED, label: 'Assigned' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
  { key: BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
];

export default function ManagerOrders() {
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listScopedBookings(filter === 'all' ? {} : { status: filter })
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);
  useEffect(() => {
    listUsers({ role: 'worker' })
      .then(setWorkers)
      .catch(() => {});
  }, []);

  const onAssign = async (booking, workerId) => {
    if (!workerId) return;
    try {
      await assignWorker(booking._id, workerId);
      toast.success('Assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Assign failed');
    }
  };

  const onAuto = async (booking) => {
    try {
      await autoAssign(booking._id);
      toast.success('Auto-assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Auto-assign failed');
    }
  };

  const onTransition = async (booking, to) => {
    if (to === 'cancelled') {
      const ok = window.confirm(
        `Cancel booking ${booking.code || ''}? The customer will be notified and this can't be undone.`
      );
      if (!ok) return;
    }
    let pin;
    if (to === 'completed') {
      pin = window.prompt(
        `Enter the end PIN given to the customer to mark ${booking.code || 'this booking'} complete:`
      );
      if (pin === null) return; // user cancelled the prompt
      pin = pin.trim();
      if (!pin) return;
    }
    try {
      await transitionStatus(booking._id, to, undefined, pin);
      toast.success(`Moved to ${to.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Transition failed');
    }
  };

  return (
    <DashboardShell eyebrow="Manager" title="Bookings in your categories">
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
              filter === f.key
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/20 hover:border-ink/40:border-paper/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="p-4 font-normal">Code</th>
              <th className="p-4 font-normal">Service</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Worker</th>
              <th className="p-4 font-normal">Scheduled</th>
              <th className="p-4 font-normal">Amount</th>
              <th className="p-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-ink/60">
                  No bookings in your categories yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id} className="transition hover:bg-sand/30:bg-[#18181A]/50">
                  <td className="p-4 font-mono text-xs">{b.code}</td>
                  <td className="p-4">
                    <div>{b.service?.name}</div>
                    {b.category?.name && (
                      <div className="text-xs text-ink/60">
                        {b.category.name}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div>{b.user?.name}</div>
                    <div className="text-xs text-ink/60">{b.user?.email}</div>
                  </td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4 text-xs">
                    {b.worker && (
                      <>
                        <div>{b.worker.name}</div>
                        {b.worker.kycStatus !== 'verified' && (
                          <div className="text-amber-600">
                            KYC {b.worker.kycStatus}
                          </div>
                        )}
                      </>
                    )}
                    {/* Assign / reassign — allowed while the booking is still
                        placed or assigned (incl. after auto-assignment). */}
                    {['placed', 'assigned'].includes(b.status) && (
                      <select
                        key={b.worker?._id || 'none'}
                        defaultValue=""
                        onChange={(e) => onAssign(b, e.target.value)}
                        className={`rounded-pill border border-ink/20 bg-paper px-3 py-1 text-xs ${b.worker ? 'mt-1' : ''}`}
                      >
                        <option value="">{b.worker ? 'Reassign…' : 'Assign…'}</option>
                        {workers
                          .filter((w) => w._id !== b.worker?._id)
                          .map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>
                  <td className="p-4 text-xs">
                    {b.scheduledAt ? formatDateTime(b.scheduledAt) : 'Instant'}
                  </td>
                  <td className="p-4 tabular-nums">{formatPrice(b.amount)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {b.status === 'placed' && !b.worker && (
                        <button
                          onClick={() => onAuto(b)}
                          className="rounded-pill border border-ink/30 px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper"
                        >
                          Auto
                        </button>
                      )}
                      {['placed', 'assigned'].includes(b.status) && (
                        <button
                          onClick={() => onTransition(b, 'cancelled')}
                          className="rounded-pill border border-red-300 px-3 py-1 text-[10px] uppercase tracking-widest text-red-700 hover:bg-red-700 hover:text-paper"
                        >
                          Cancel
                        </button>
                      )}
                      {b.status === 'in_progress' && (
                        <button
                          onClick={() => onTransition(b, 'completed')}
                          className="rounded-pill border border-ink/30 px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
