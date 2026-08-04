import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listAllBookings, assignWorker, autoAssign, transitionStatus } from '../../api/bookings.js';
import { listUsers } from '../../api/users.js';
import StatusBadge from '../../components/booking/StatusBadge.jsx';
import { formatDateTime, formatPrice, BOOKING_STATUS, REFUNDED_FILTER } from '../../lib/booking.js';
import RefundModal from '../../components/admin/RefundModal.jsx';
import DashboardShell from './DashboardShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAdminSeen from '../../hooks/useAdminSeen.js';
import { Eye, Package } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.PENDING_CONFIRMATION, label: 'Awaiting confirmation' },
  { key: BOOKING_STATUS.CONFIRMED, label: 'Confirmed' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
  { key: BOOKING_STATUS.REJECTED, label: 'Rejected' },
  { key: BOOKING_STATUS.WORKER_UNAVAILABLE, label: 'Worker unavailable' },
  { key: BOOKING_STATUS.CANCELLED_BY_USER, label: 'Cancelled' },
  { key: REFUNDED_FILTER, label: 'Refunded' },
];

export default function AdminBookings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useAdminSeen('bookings');

  const load = () => {
    setLoading(true);
    const query = {
      ...(filter === 'all' ? {} : filter === REFUNDED_FILTER ? { paymentStatus: 'refunded' } : { status: filter }),
      page,
      limit: 15,
    };
    listAllBookings(query)
      .then((res) => {
        setBookings(res.bookings || []);
        setPagination(res.pagination || null);
        
        // update selected booking if it's currently open
        if (selectedBooking) {
           const updated = (res.bookings || []).find(b => b._id === selectedBooking._id);
           if (updated) setSelectedBooking(updated);
        }
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(load, [filter, page]);

  useEffect(() => {
    listUsers({ role: 'worker', limit: 200, kycStatus: 'verified', isActive: 'true' })
      .then((res) => setWorkers(res.users || res))
      .catch(() => {});
  }, []);

  const onAssign = async (booking, workerId) => {
    if (!workerId) return;
    try {
      await assignWorker(booking._id, workerId);
      toast.success('Assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Assign failed');
    }
  };

  const onAuto = async (booking) => {
    try {
      await autoAssign(booking._id);
      toast.success('Auto-assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Auto-assign failed');
    }
  };

  const onTransition = async (booking, to) => {
    if (to === BOOKING_STATUS.CANCELLED_BY_USER) {
      const ok = window.confirm(
        `Cancel booking ${booking.code || ''}? The customer will be notified and this can't be undone.`
      );
      if (!ok) return;
    }
    let pin;
    if (to === BOOKING_STATUS.COMPLETED) {
      if (!booking.endPin) {
        toast.error('End PIN is not available for this booking yet');
        return;
      }
      pin = window.prompt(
        `Enter the end PIN given to the customer to mark ${booking.code || 'this booking'} complete:`
      );
      if (pin === null) return;
      pin = pin.trim();
      if (!pin) return;
    }
    try {
      await transitionStatus(booking._id, to, undefined, pin);
      toast.success(`Moved to ${to.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Transition failed');
    }
  };

  return (
    <DashboardShell eyebrow="(Operations)" title="ALL BOOKINGS.">
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${
              filter === f.key
                ? 'bg-ink text-paper border border-ink'
                : 'border border-ink/15 bg-transparent text-ink hover:border-ink/40 hover:bg-sand/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">Booking</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Worker</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="5" className="p-4">
                    <div className="skeleton h-10 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-ink/50">
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id} className="transition-colors hover:bg-sand/30 group">
                  <td className="p-4 align-top">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="group/btn flex flex-col items-start focus:outline-none text-left"
                    >
                      <span className="font-mono text-xs font-semibold group-hover/btn:underline text-ink flex items-center gap-1.5">
                        {b.code}
                      </span>
                      <span className="text-[11px] font-medium text-ink/80 mt-1 line-clamp-1">{b.service?.name}</span>
                      <span className="text-[10px] text-ink/60 mt-0.5 uppercase tracking-widest">
                        {b.scheduledAt ? formatDateTime(b.scheduledAt) : 'Instant'}
                      </span>
                    </button>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="font-medium text-ink flex items-center gap-2">
                       {b.user?.name}
                    </div>
                    <div className="text-[11px] text-ink/60 line-clamp-1 mt-0.5">{b.user?.email}</div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    {b.worker ? (
                      <div className="font-medium text-ink">{b.worker.name}</div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-ink/40 font-bold border border-ink/10 rounded px-1.5 py-0.5 bg-ink/5">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between pt-2 text-ink">
          <div className="text-xs text-ink/60">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} records)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              className="rounded-full border border-ink/10 px-4 py-1.5 text-xs font-medium hover:bg-sand/50 disabled:opacity-30 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="rounded-full border border-ink/10 px-4 py-1.5 text-xs font-medium hover:bg-sand/50 disabled:opacity-30 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 md:py-12 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="card-rounded w-full max-w-3xl border border-paper/10 bg-paper p-6 md:p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-6 right-6 md:top-8 md:right-8 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full bg-sand hover:bg-ink hover:text-paper transition-colors"
            >
              Close
            </button>

            <div className="mb-6 border-b border-ink/5 pb-5">
              <div className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-1">Manage Booking</div>
              <h3 className="text-2xl font-bold font-mono text-ink">
                {selectedBooking.code}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Service Details</h4>
                  <div className="bg-sand/20 rounded-xl p-4 md:p-5 border border-ink/5">
                    <div className="font-bold text-lg mb-1">{selectedBooking.service?.name}</div>
                    <div className="text-sm text-ink/60 mb-4">{selectedBooking.scheduledAt ? formatDateTime(selectedBooking.scheduledAt) : 'Instant'}</div>
                    <div className="text-sm text-ink/80 pt-4 border-t border-ink/5 leading-relaxed">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1.5">Service Location</span>
                        {selectedBooking.address?.line1}<br />
                        {selectedBooking.address?.line2 && <>{selectedBooking.address?.line2}<br/></>}
                        {selectedBooking.address?.city}, {selectedBooking.address?.state} {selectedBooking.address?.pincode}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Customer</h4>
                  <div className="bg-sand/20 rounded-xl p-4 border border-ink/5">
                    <div className="font-bold text-base">{selectedBooking.user?.name}</div>
                    <div className="text-sm text-ink/60">{selectedBooking.user?.email}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Worker Assignment</h4>
                  <div className="bg-sand/20 rounded-xl p-4 border border-ink/5 space-y-3">
                    {selectedBooking.worker ? (
                      <div>
                        <div className="font-bold text-base">{selectedBooking.worker.name}</div>
                        <div className="text-sm text-ink/60">{selectedBooking.worker.email}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-ink/50 italic">No worker assigned yet.</div>
                    )}

                    {selectedBooking.status === BOOKING_STATUS.PENDING_CONFIRMATION && (
                      <div className="pt-3 border-t border-ink/5 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <select
                            defaultValue=""
                            onChange={(e) => onAssign(selectedBooking, e.target.value)}
                            className="flex-1 rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm outline-none focus:border-ink/50"
                          >
                            <option value="">{selectedBooking.worker ? 'Reassign…' : 'Assign worker…'}</option>
                            {workers
                              .filter((w) => w._id !== selectedBooking.worker?._id)
                              .map((w) => (
                                <option key={w._id} value={w._id}>
                                  {w.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        {!selectedBooking.worker && (
                          <button
                            onClick={() => onAuto(selectedBooking)}
                            className="w-full flex items-center justify-center rounded-lg border border-ink bg-ink/5 px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors"
                          >
                            Auto Assign
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                   <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Booking Summary</h4>
                   <div className="bg-sand/20 rounded-xl p-4 md:p-5 border border-ink/5 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-ink/60 font-medium">Status</span>
                       <StatusBadge status={selectedBooking.status} />
                     </div>
                     <div className="flex justify-between items-end text-sm border-t border-ink/5 pt-4 mt-1">
                       <span className="text-ink/60 font-medium">Total Amount</span>
                       <div className="text-right">
                         <div className="text-2xl font-bold text-ink leading-none">{formatPrice(selectedBooking.finalPayableAmount ?? selectedBooking.amount)}</div>
                         <div className={`text-[10px] uppercase font-bold tracking-widest mt-1.5 ${selectedBooking.paymentStatus === 'paid' ? 'text-green-600' : selectedBooking.paymentStatus === 'refunded' ? 'text-blue-600' : 'text-amber-600'}`}>
                           {selectedBooking.paymentStatus || 'unpaid'}
                         </div>
                       </div>
                     </div>
                   </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Admin Actions</h4>
                  <div className="flex flex-col gap-2">
                    {[BOOKING_STATUS.PENDING_CONFIRMATION, BOOKING_STATUS.CONFIRMED].includes(selectedBooking.status) && (
                      <button
                        onClick={() => onTransition(selectedBooking, BOOKING_STATUS.CANCELLED_BY_USER)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                    
                    {selectedBooking.status === BOOKING_STATUS.IN_PROGRESS && (
                      <button
                        onClick={() => onTransition(selectedBooking, BOOKING_STATUS.COMPLETED)}
                        disabled={!selectedBooking.endPin}
                        title={selectedBooking.endPin ? 'Enter the customer end PIN to complete this booking' : 'End PIN is not available for this booking yet'}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-ink bg-ink px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-paper hover:bg-ink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark Complete {selectedBooking.endPin ? '(PIN Required)' : '(Awaiting PIN)'}
                      </button>
                    )}

                    {isAdmin && selectedBooking.paymentStatus !== 'refunded' && (
                      <button
                        onClick={() => {
                          if (selectedBooking.status !== BOOKING_STATUS.CANCELLED_BY_USER) {
                            toast.error('Please cancel the booking first before issuing a refund.');
                            return;
                          }
                          setRefundTarget(selectedBooking);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <RefundModal
          type="booking"
          reference={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={() => load()}
        />
      )}
    </DashboardShell>
  );
}
