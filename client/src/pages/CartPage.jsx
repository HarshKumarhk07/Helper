import { useCart } from '../context/CartContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const productCart = cart.filter((item) => item.kind !== 'service');
  const serviceCart = cart.filter((item) => item.kind === 'service');
  const productSubtotal = productCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceSubtotal = serviceCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandTotal = productSubtotal + serviceSubtotal;
  const hasProducts = productCart.length > 0;
  const serviceOnlyCart = !hasProducts && serviceCart.length > 0;

  if (cart.length === 0) {
    return (
      <section className="container-velora py-20 text-center">
        <h1 className="heading-display text-4xl mb-4 text-ink dark:text-paper">YOUR CART IS EMPTY</h1>
        <p className="text-ink/70 dark:text-paper/60 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <PillButton to="/services">Continue Shopping</PillButton>
      </section>
    );
  }

  return (
    <section className="container-velora py-16">
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50 mb-3">
        (Your Cart)
      </div>
      <h1 className="heading-display text-4xl md:text-5xl mb-8">SHOPPING BAG</h1>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, i) => (
            <FadeUp key={item.product} delay={i * 0.05}>
              <div className="flex gap-4 p-4 card-rounded items-center">
                <div className="w-20 h-24 bg-sand flex-shrink-0 rounded-xl overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink/40">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  {item.kind === 'service' && (
                    <div className="mb-1 text-[10px] uppercase tracking-[0.35em] text-ink/50 dark:text-paper/45">
                      Service booking
                    </div>
                  )}
                  <h3 className="text-sm font-bold">{item.name}</h3>
                  <div className="text-xs text-ink/60 dark:text-paper/60 mt-1">₹{item.price}</div>
                  {item.kind === 'service' ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/book/${item.product}`)}
                        className="rounded-pill border border-ink/20 px-3 py-2 text-xs font-medium transition hover:bg-ink hover:text-paper dark:border-paper/20"
                      >
                        Book service
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateQuantity(item.product, item.quantity - 1)} className="p-1 border border-ink/20 rounded hover:bg-ink hover:text-paper dark:border-paper/20">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product, item.quantity + 1)} className="p-1 border border-ink/20 rounded hover:bg-ink hover:text-paper dark:border-paper/20">
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col justify-between h-full items-end gap-6">
                  <button onClick={() => removeFromCart(item.product)} className="text-red-500 hover:text-red-700 transition">
                    <Trash2 size={16} />
                  </button>
                  <div className="text-sm font-bold">₹{item.price * item.quantity}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
        
        <div>
          <div className="card-rounded p-6 sticky top-24 text-ink dark:text-paper">
            <h2 className="heading-display text-xl mb-6 text-ink dark:text-paper">ORDER SUMMARY</h2>
            <div className="space-y-3 text-sm mb-6 border-b border-ink/10 dark:border-paper/10 pb-6">
              {hasProducts && (
                <div className="flex justify-between">
                  <span className="text-ink/70 dark:text-paper/60">Products subtotal</span>
                  <span className="text-ink dark:text-paper tabular-nums">₹{productSubtotal}</span>
                </div>
              )}
              {serviceCart.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink/70 dark:text-paper/60">
                    Services <span className="text-[10px] uppercase tracking-widest opacity-60">({serviceCart.length})</span>
                  </span>
                  <span className="text-ink dark:text-paper tabular-nums">₹{serviceSubtotal}</span>
                </div>
              )}
              {hasProducts && (
                <div className="flex justify-between">
                  <span className="text-ink/70 dark:text-paper/60">Shipping</span>
                  <span className="text-ink dark:text-paper">Free</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold text-lg mb-2 text-ink dark:text-paper">
              <span>Total</span>
              <span className="tabular-nums">₹{grandTotal}</span>
            </div>
            {serviceCart.length > 0 && (
              <p className="mb-6 text-xs text-ink/60 dark:text-paper/50">
                Services are paid when you confirm each booking. Tap a service below to schedule it.
              </p>
            )}

            {hasProducts ? (
              <button
                onClick={() => navigate('/checkout')}
                className="w-full rounded-pill bg-ink py-3 text-sm font-semibold tracking-tightish text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink"
              >
                Proceed to Checkout · ₹{productSubtotal}
              </button>
            ) : serviceOnlyCart ? (
              <div className="space-y-2">
                {serviceCart.map((s) => (
                  <button
                    key={s.product}
                    onClick={() => navigate(`/book/${s.product}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-pill bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink"
                  >
                    <span className="truncate">Book {s.name}</span>
                    <span className="shrink-0 tabular-nums opacity-80">₹{s.price}</span>
                  </button>
                ))}
                <p className="pt-2 text-center text-[11px] uppercase tracking-widest text-ink/50 dark:text-paper/45">
                  Services are checked out via the booking flow
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
