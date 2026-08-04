import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listBrandOrders, updateOrderStatus } from '../../api/orders.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { Package, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatPrice } from '../../lib/booking.js';

export default function BrandOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = (p = 1) => {
    setLoading(true);
    listBrandOrders({ page: p, limit: 15 })
      .then((res) => {
        setOrders(res.orders || []);
        setPagination(res.pagination || null);
      })
      .catch((err) => {
        console.error('Failed to load brand orders', err);
        toast.error('Failed to load orders');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrders(current => current.map(order => 
        order._id === id 
          ? { ...order, ...updated, user: order.user, items: order.items } 
          : order
      ));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <DashboardShell eyebrow="Seller" title="Order History">
      {loading && orders.length === 0 ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <FadeUp>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">Your Sold Products</h2>
            <div className="text-sm text-ink/60">
              Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          <div className="card-rounded overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
                <tr>
                  <th className="p-4 font-normal">Order / Date</th>
                  <th className="p-4 font-normal">Customer</th>
                  <th className="p-4 font-normal">My Products Sold</th>
                  <th className="p-4 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-ink/50">
                      <Package size={24} className="mx-auto mb-2 opacity-50" />
                      No orders found yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    // Filter order items to only include products owned by this brand
                    const myItems = order.items.filter(
                      (item) => item.product && String(item.product?.brand) === String(user._id)
                    );

                    return (
                      <tr key={order._id} className="transition hover:bg-sand/30">
                        <td className="p-4 align-top">
                          <button 
                            onClick={() => setSelectedOrder({ order, myItems })}
                            className="group flex flex-col items-start focus:outline-none"
                          >
                            <span className="font-mono text-xs font-semibold group-hover:underline text-ink flex items-center gap-1.5">
                              #{order._id.slice(-8)}
                            </span>
                            <span className="text-[10px] text-ink/60 mt-1 uppercase tracking-widest text-left">
                              {new Date(order.placedAt || order.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-blue-600 mt-1.5 hover:underline flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity font-medium">
                              <Eye size={12} /> View Details
                            </span>
                          </button>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-medium">{order.user?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-ink/60">{order.user?.email}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="space-y-2">
                            {myItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="h-6 w-6 shrink-0 overflow-hidden rounded bg-sand">
                                  {item.product?.image ? (
                                    <img
                                      src={item.product.image.startsWith('http') ? item.product.image : `/${item.product.image}`}
                                      alt={item.product.name}
                                      className="h-full w-full object-cover"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <Package size={12} className="m-auto h-full text-ink/30" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">{item.quantity}x</span>{' '}
                                  {item.product?.name || 'Unknown Product'}{' '}
                                  <span className="text-ink/60">({formatPrice(item.price)})</span>
                                </div>
                              </div>
                            ))}
                            {myItems.length === 0 && (
                              <span className="text-ink/40 text-[10px] italic">No items found</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right align-top">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={order.status === 'cancelled' || order.status === 'delivered'}
                            className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none border border-transparent cursor-pointer hover:border-ink/20 focus:border-ink/40 transition appearance-none text-center ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          >
                            <option value="placed">Placed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                className="rounded-full border border-ink/10 px-4 py-2 font-medium tracking-wide transition hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
              >
                Previous
              </button>
              <div className="font-mono text-xs opacity-60">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="rounded-full border border-ink/10 px-4 py-2 font-medium tracking-wide transition hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
              >
                Next
              </button>
            </div>
          )}
        </FadeUp>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-12 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="card-rounded w-full max-w-2xl border border-paper/10 bg-paper p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">Order Details</div>
                <h3 className="heading-display mt-2 text-2xl text-ink">#{selectedOrder.order._id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="pill-btn text-xs">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-ink">Customer</h4>
                <div className="text-sm">
                  <div className="font-medium">{selectedOrder.order.user?.name || 'Unknown User'}</div>
                  <div className="text-ink/70">{selectedOrder.order.user?.email}</div>
                  {selectedOrder.order.address && (
                    <div className="mt-3 text-ink/80 text-sm leading-relaxed border-t border-ink/5 pt-3">
                      <div className="font-medium text-ink mb-1 text-xs uppercase tracking-widest">Shipping Address:</div>
                      {selectedOrder.order.address.line1}<br />
                      {selectedOrder.order.address.line2 && <>{selectedOrder.order.address.line2}<br/></>}
                      {selectedOrder.order.address.city}, {selectedOrder.order.address.state} {selectedOrder.order.address.pincode}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-ink">Order Info</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Status:</span>
                    <span className="font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded bg-ink/5">{selectedOrder.order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Date:</span>
                    <span>{new Date(selectedOrder.order.placedAt || selectedOrder.order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Payment:</span>
                    <span className="uppercase text-[10px] tracking-widest font-bold">{selectedOrder.order.paymentMode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-ink/10 pt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-ink">Your Items in this Order</h4>
              <div className="space-y-4">
                {selectedOrder.myItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 border border-ink/10 rounded-xl p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-sand">
                      {item.product?.image ? (
                        <img
                          src={item.product.image.startsWith('http') ? item.product.image : `/${item.product.image}`}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={20} className="m-auto h-full text-ink/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-ink/60">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
