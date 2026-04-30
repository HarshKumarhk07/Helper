import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listMyOrders } from '../../api/orders.js';
import { downloadInvoice } from '../../api/invoices.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { formatDateTime, formatPrice } from '../../lib/booking.js';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="container-velora py-12 md:py-16">
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        (My orders)
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl">ORDER HISTORY.</h1>
      
      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="skeleton h-32 w-full" />
        ) : orders.length === 0 ? (
          <div className="rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm dark:border-paper/10">
            No orders found.
          </div>
        ) : (
          orders.map((order, i) => (
            <FadeUp key={order._id} delay={i * 0.05}>
              <div className="card-rounded p-5 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50 mb-2">
                    {order.orderId}
                  </div>
                  <div className="font-bold text-lg">Total: {formatPrice(order.totalAmount)}</div>
                  <div className="text-xs text-ink/70 dark:text-paper/60 mt-1">Status: {order.status.toUpperCase()}</div>
                  <div className="text-xs text-ink/70 dark:text-paper/60 mt-1">Placed: {formatDateTime(order.createdAt)}</div>
                </div>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.product} className="flex gap-4 text-sm bg-sand p-2 rounded-lg items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-ink/60 text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-4 border-t border-ink/10 dark:border-paper/10 pt-3">
                    <button 
                      onClick={() => downloadInvoice('order', order._id, `Invoice_ORDER_${order.orderId}.pdf`)}
                      className="text-xs uppercase tracking-widest text-ink/70 hover:text-ink transition dark:text-paper/70 dark:hover:text-paper"
                    >
                      Download PDF Invoice
                    </button>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))
        )}
      </div>
    </section>
  );
}
