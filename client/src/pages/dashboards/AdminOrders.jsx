import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';
import { listAllOrders, updateOrderNote, cancelMyOrder } from '../../api/orders.js';
import { formatPrice } from '../../lib/booking.js';
import RefundModal from '../../components/admin/RefundModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAdminSeen from '../../hooks/useAdminSeen.js';
import { Package, Eye, Search } from 'lucide-react';

export default function AdminOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [refundTarget, setRefundTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const confirmCancelOrder = async () => {
    if (!cancelConfirmId) return;
    const id = cancelConfirmId;
    try {
      const updated = await cancelMyOrder(id);
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
      if (selectedOrder?._id === id) {
        setSelectedOrder(updated);
      }
      toast.success('Order cancelled successfully');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelConfirmId(null);
    }
  };

  // Clears the dashboard "orders" badge when this page is opened.
  useAdminSeen('orders');

  const load = () => {
    setLoading(true);
    listAllOrders({ page, limit: 15, q: searchQuery }) // increased limit to 15 for table view
      .then((res) => {
        setOrders(res.orders || []);
        setPagination(res.pagination || null);
        setNotes(Object.fromEntries((res.orders || []).map((order) => [order._id, order.adminNote || ''])));
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, searchQuery]);

  const saveNote = async (id) => {
    try {
      const updated = await updateOrderNote(id, notes[id] || '');
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
      if (selectedOrder?._id === id) {
        setSelectedOrder(updated);
      }
      toast.success('Order note updated');
    } catch {
      toast.error('Failed to update order note');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'placed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <DashboardShell eyebrow="(Commerce control)" title="ORDER NOTES | REVIEW.">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name or Email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-ink/10 bg-paper py-2 pl-10 pr-4 text-sm outline-none focus:border-ink/30 transition-colors"
          />
        </div>
      </div>
      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">Order / Date</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Amount</th>
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-ink/50">
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="transition-colors hover:bg-sand/30 group">
                  <td className="p-4 align-top">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="group/btn flex flex-col items-start focus:outline-none"
                    >
                      <span className="font-mono text-xs font-semibold group-hover/btn:underline text-ink flex items-center gap-1.5">
                        #{order.orderId || order._id.slice(-8)}
                      </span>
                      <span className="text-[10px] text-ink/60 mt-1 uppercase tracking-widest text-left">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-blue-600 mt-1.5 hover:underline flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        <Eye size={12} /> Details
                      </span>
                    </button>
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-medium text-ink">{order.user?.name || 'Customer'}</div>
                    <div className="text-[11px] text-ink/60 line-clamp-1">{order.user?.email || 'No email provided'}</div>
                    {order.adminNote && (
                       <div className="mt-1.5 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block uppercase tracking-widest font-semibold border border-amber-200">Note Added</div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-bold text-ink">{formatPrice(order.totalAmount)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest font-semibold">
                      <span className="text-ink/50">{order.paymentMode}</span>
                      <span className={order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'refunded' ? 'text-blue-600' : 'text-amber-600'}>
                        &middot; {order.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
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

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 md:py-12 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="card-rounded w-full max-w-3xl border border-paper/10 bg-paper p-6 md:p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 md:top-8 md:right-8 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full bg-sand hover:bg-ink hover:text-paper transition-colors"
            >
              Close
            </button>

            <div className="mb-6 border-b border-ink/5 pb-5">
              <div className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-1">Manage Order</div>
              <h3 className="text-2xl font-bold font-mono text-ink">
                #{selectedOrder.orderId || selectedOrder._id}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {/* Left Column: Customer & Items */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3 flex items-center gap-2">
                    Customer Details
                  </h4>
                  <div className="bg-sand/20 rounded-xl p-4 md:p-5 border border-ink/5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                       <div className="h-12 w-12 rounded-full bg-ink/5 flex items-center justify-center text-xl text-ink/40 font-bold uppercase shrink-0">
                         {selectedOrder.user?.name?.charAt(0) || '?'}
                       </div>
                       <div>
                         <div className="font-bold text-lg">{selectedOrder.user?.name || 'Unknown User'}</div>
                         <div className="text-sm text-ink/60">{selectedOrder.user?.email || 'No email provided'}</div>
                       </div>
                    </div>
                    {selectedOrder.address && (
                      <div className="text-sm text-ink/80 pt-4 border-t border-ink/5 leading-relaxed">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1.5">Shipping Address</span>
                        {selectedOrder.address.line1}<br />
                        {selectedOrder.address.line2 && <>{selectedOrder.address.line2}<br/></>}
                        {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.pincode}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Order Items ({selectedOrder.items?.length || 0})</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm bg-sand/20 p-3 rounded-xl border border-ink/5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-paper flex items-center justify-center border border-ink/5">
                          <Package size={16} className="text-ink/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs text-ink/60 mt-0.5">Qty: {item.quantity} &times; {formatPrice(item.price || 0)}</div>
                        </div>
                      </div>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                       <div className="text-sm text-ink/50 p-4 text-center bg-sand/20 rounded-xl border border-ink/5">No items in this order.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Amount, Actions & Notes */}
              <div className="space-y-6">
                <div>
                   <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Order Summary</h4>
                   <div className="bg-sand/20 rounded-xl p-4 md:p-5 border border-ink/5 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-ink/60 font-medium">Status</span>
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                         {selectedOrder.status}
                       </span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-ink/60 font-medium">Date Placed</span>
                       <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-ink/60 font-medium">Payment Mode</span>
                       <span className="font-bold uppercase tracking-wider text-[10px] bg-paper px-2 py-1 rounded border border-ink/5">{selectedOrder.paymentMode}</span>
                     </div>
                     <div className="flex justify-between items-end text-sm border-t border-ink/5 pt-4 mt-1">
                       <span className="text-ink/60 font-medium">Total Amount</span>
                       <div className="text-right">
                         <div className="text-2xl font-bold text-ink leading-none">{formatPrice(selectedOrder.totalAmount)}</div>
                         <div className={`text-[10px] uppercase font-bold tracking-widest mt-1.5 ${selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : selectedOrder.paymentStatus === 'refunded' ? 'text-blue-600' : 'text-amber-600'}`}>
                           {selectedOrder.paymentStatus}
                         </div>
                       </div>
                     </div>
                     {selectedOrder.paymentStatus === 'refunded' && selectedOrder.refundAmount > 0 && (
                       <div className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50/70 p-2.5 rounded-lg text-center border border-blue-100">
                         −{formatPrice(selectedOrder.refundAmount)} Refunded
                       </div>
                     )}
                   </div>
                </div>

                {isAdmin && selectedOrder.paymentStatus !== 'refunded' && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3">Admin Actions</h4>
                    <div className="flex flex-col gap-2">
                      {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (

                        <button
                          onClick={() => setCancelConfirmId(selectedOrder._id)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                      {selectedOrder.status !== 'delivered' && (
                        <button
                          onClick={() => {
                            if (selectedOrder.status !== 'cancelled') {
                              toast.error('Please cancel the order first before issuing a refund.');
                              return;
                            }
                            setRefundTarget(selectedOrder);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        >
                          Issue Refund
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                   <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink/50 mb-3 flex items-center justify-between">
                     Internal Admin Note
                     {selectedOrder.adminNote && <span className="text-[9px] bg-ink/5 px-2 py-0.5 rounded text-ink/60">Saved</span>}
                   </h4>
                   <div className="bg-sand/20 rounded-xl p-2 border border-ink/5">
                     <textarea
                       rows={3}
                       value={notes[selectedOrder._id] ?? (selectedOrder.adminNote || '')}
                       onChange={(e) => setNotes((current) => ({ ...current, [selectedOrder._id]: e.target.value }))}
                       placeholder="Add a private note for admins..."
                       className="w-full bg-transparent px-3 py-2 text-sm outline-none focus:bg-paper focus:ring-2 focus:ring-ink/10 transition-all resize-none rounded-lg"
                     />
                     <div className="flex justify-end mt-2">
                       <button
                         type="button"
                         onClick={() => saveNote(selectedOrder._id)}
                         className="rounded-lg bg-ink text-paper px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-ink/80 transition-colors"
                       >
                         Save Note
                       </button>
                     </div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <RefundModal
          type="order"
          reference={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={() => load()}
        />
      )}

      {cancelConfirmId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onClick={() => setCancelConfirmId(null)}
        >
          <div
            className="card-rounded w-full max-w-sm border border-paper/10 bg-paper p-6 text-center text-ink shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Package size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold">Cancel Order</h3>
            <p className="mb-6 text-sm text-ink/70">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmCancelOrder}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-red-700 transition-colors"
              >
                Yes, Cancel Order
              </button>
              <button
                onClick={() => setCancelConfirmId(null)}
                className="w-full rounded-xl border border-ink/10 bg-sand/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Nevermind
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}