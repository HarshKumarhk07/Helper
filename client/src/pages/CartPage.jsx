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
        <h1 className="heading-display text-4xl mb-4 text-ink">YOUR CART IS EMPTY</h1>
        <p className="text-ink/70 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <PillButton to="/services">Continue Shopping</PillButton>
      </section>
    );
  }

  return (
    <section className="container-velora py-16">
      <div className="text-xs uppercase tracking-widest text-ink/60 mb-3">
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
                    <div className="mb-1 text-[10px] uppercase tracking-[0.35em] text-ink/50">
                      Service booking
                    </div>
                  )}
                  <h3 className="text-sm font-bold">{item.name}</h3>
                  <div className="text-xs text-ink/60 mt-1">₹{item.price}</div>
                  {item.kind === 'service' ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/book/${item.product}`)}
                        className="rounded-pill border border-ink/20 px-3 py-2 text-xs font-medium transition hover:bg-ink hover:text-paper"
                      >
                        Book service
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateQuantity(item.product, item.quantity - 1)} className="p-1 border border-ink/20 rounded hover:bg-ink hover:text-paper">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product, item.quantity + 1)} className="p-1 border border-ink/20 rounded hover:bg-ink hover:text-paper">
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
          <div className="card-rounded p-6 sticky top-24 text-ink">
            <h2 className="heading-display text-xl mb-6 text-ink">ORDER SUMMARY</h2>
            
            {/* Main Products Summary */}
            <div className="space-y-3 text-sm mb-4 border-b border-ink/10 pb-4">
              {hasProducts && (
                <>
                  <div className="flex justify-between">
                    <span className="text-ink/70">Products subtotal</span>
                    <span className="text-ink tabular-nums">₹{productSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/70">Shipping</span>
                    <span className="text-green-600 font-medium tracking-wide uppercase text-xs">Free</span>
                  </div>
                </>
              )}
              {!hasProducts && serviceCart.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink/70">
                    Services <span className="text-[10px] uppercase tracking-widest opacity-60">({serviceCart.length})</span>
                  </span>
                  <span className="text-ink tabular-nums">₹{serviceSubtotal}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg mb-4 text-ink items-center">
              <span>{hasProducts ? 'Total Payable Now' : 'Total Service Value'}</span>
              <span className="tabular-nums text-xl">₹{hasProducts ? productSubtotal : serviceSubtotal}</span>
            </div>

            {hasProducts ? (
              <button
                onClick={() => navigate('/checkout')}
                className="w-full rounded-pill bg-ink py-3.5 text-sm font-semibold tracking-wide text-paper shadow-md transition hover:bg-[#6f5cff]"
              >
                Proceed to Checkout · ₹{productSubtotal}
              </button>
            ) : serviceOnlyCart ? (
              <div className="space-y-3">
                {serviceCart.length === 1 ? (
                  <button
                    onClick={() => navigate(`/book/${serviceCart[0].product}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-pill bg-ink px-5 py-3.5 text-sm font-semibold text-paper transition hover:bg-[#6f5cff] shadow-md"
                  >
                    <span className="truncate pr-2">Book {serviceCart[0].name}</span>
                    <span className="shrink-0 tabular-nums opacity-90 font-bold">₹{serviceCart[0].price}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/book/cart')}
                    className="w-full rounded-pill bg-ink py-3.5 text-sm font-semibold tracking-wide text-paper shadow-md transition hover:bg-[#6f5cff]"
                  >
                    Book All Services · ₹{serviceSubtotal}
                  </button>
                )}
                <p className="pt-1 text-center text-[11px] uppercase tracking-widest text-ink/50">
                  Services are scheduled via the booking flow
                </p>
              </div>
            ) : null}

            {/* Separated Services Context Block */}
            {serviceCart.length > 0 && hasProducts && (
              <div className="mt-6 rounded-2xl border border-ink/10 bg-sand/30 p-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ink/60 mb-3 border-b border-ink/5 pb-2">
                  <span>Services ({serviceCart.length})</span>
                  <span>₹{serviceSubtotal}</span>
                </div>
                {serviceCart.length === 1 ? (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink font-medium truncate pr-2">{serviceCart[0].name}</span>
                    <button
                      onClick={() => navigate(`/book/${serviceCart[0].product}`)}
                      className="text-[10px] bg-ink text-paper px-3 py-1.5 rounded-full font-bold uppercase tracking-wider hover:bg-[#6f5cff] transition-all shrink-0"
                    >
                      Schedule · ₹{serviceCart[0].price}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 border-b border-ink/5 pb-2">
                      {serviceCart.map((s) => (
                        <div key={s.product} className="flex justify-between text-[11px] text-ink/80 font-medium">
                          <span className="truncate pr-2">· {s.name}</span>
                          <span className="tabular-nums font-semibold">₹{s.price}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/book/cart')}
                      className="w-full bg-ink text-paper py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#6f5cff] transition-all shadow-sm"
                    >
                      Schedule All Services · ₹{serviceSubtotal}
                    </button>
                  </div>
                )}
                <p className="mt-3 text-[10px] leading-relaxed text-ink/50 text-center uppercase tracking-wider">
                  Paid on completion after service
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
