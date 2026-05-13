import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder } from '../api/orders.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/payments.js';
import { validateCoupon } from '../api/coupons.js';
import { getProduct } from '../api/products.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Tag, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: '', city: '', state: '', pincode: ''
  });
  const [paymentMode, setPaymentMode] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const fieldClass = 'w-full rounded-xl border border-ink/10 bg-sand/50 px-5 py-3.5 text-sm font-medium text-ink outline-none transition-all placeholder:text-ink/40 focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5';

  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon) {
      setCouponCode(urlCoupon);
    }
  }, [searchParams]);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    const existing = document.getElementById(scriptId);

    const markReady = () => setRazorpayReady(true);

    if (existing) {
      if (window.Razorpay) {
        setRazorpayReady(true);
      } else {
        existing.addEventListener('load', markReady, { once: true });
      }
      return () => existing.removeEventListener('load', markReady);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = markReady;
    script.onerror = () => toast.error('Unable to load Razorpay checkout');
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  const productCart = cart.filter((item) => item.kind !== 'service');
  const serviceCart = cart.filter((item) => item.kind === 'service');
  const cartTotal = productCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cartTotal - discount;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    if (productCart.length === 0 && serviceCart.length > 0) {
      toast.error('Your cart has services only. Book them from the service page.');
      navigate('/cart');
    }
  }, [cart.length, productCart.length, serviceCart.length, navigate]);

  if (cart.length === 0 || (productCart.length === 0 && serviceCart.length > 0)) {
    return null;
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (paymentMode === 'online' && !razorpayReady) {
        throw new Error('Payment gateway is still loading. Please try again in a moment.');
      }

      const uniqueProductIds = [...new Set(productCart.map((item) => item.product).filter(Boolean))];
      const validationResults = await Promise.allSettled(uniqueProductIds.map((productId) => getProduct(productId)));
      const invalidProductIds = validationResults
        .map((result, index) => (result.status === 'fulfilled' ? null : uniqueProductIds[index]))
        .filter(Boolean);

      if (invalidProductIds.length > 0) {
        invalidProductIds.forEach((productId) => removeFromCart(productId));
        throw new Error('Your cart contains unavailable items. Please review your cart and try again.');
      }

      const items = productCart.map((c) => ({ product: c.product, quantity: c.quantity }));
      const activeCouponCode = (appliedCoupon?.code || couponCode).trim().toUpperCase();
      const order = await createOrder({
        items,
        address,
        paymentMode,
        couponCode: activeCouponCode || undefined,
      });
      const payableAmount = order.totalAmount ?? total;

      if (paymentMode === 'cod') {
        toast.success('Order placed successfully!');
        uniqueProductIds.forEach((productId) => removeFromCart(productId));
        navigate('/me/orders');
      } else {
        const rpOrder = await createRazorpayOrder({ amount: payableAmount, receipt: order.orderId, type: 'ecommerce' });
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx', 
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: "UrbanEase",
          description: "Premium Order Checkout",
          order_id: rpOrder.id,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                ...response,
                referenceId: order._id,
                type: 'ecommerce'
              });
              toast.success('Payment successful & Order placed!');
              uniqueProductIds.forEach((productId) => removeFromCart(productId));
              navigate('/me/orders');
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: "Customer",
            email: "customer@example.com",
            contact: "9999999999"
          },
          theme: { color: "#111111" }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          toast.error('Payment failed');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await validateCoupon({ code: couponCode, orderValue: cartTotal });
      setDiscount(res.discount);
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: res.discount });
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid coupon');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  return (
    <section className="bg-sand/30 min-h-screen pt-32 pb-24">
      <div className="container-velora max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="heading-display text-4xl md:text-5xl text-ink">SECURE CHECKOUT</h1>
          <p className="mt-4 text-ink/60 text-sm font-medium">Complete your order with UrbanEase.</p>
        </motion.div>
        
        <form onSubmit={handleCheckout} className="grid md:grid-cols-[1fr,360px] gap-8 items-start">
          
          <div className="space-y-6">
            {/* Shipping Address */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="card-rounded p-8 bg-paper"
            >
              <h2 className="text-xl mb-6 font-semibold text-ink flex items-center gap-2">
                <Truck size={20} className="text-ink/60" />
                Shipping Details
              </h2>
              <div className="grid gap-5">
                <input required placeholder="Street Address / Line 1" className={fieldClass} value={address.line1} onChange={(e) => setAddress({...address, line1: e.target.value})} />
                <input required placeholder="City" className={fieldClass} value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                <div className="grid grid-cols-2 gap-5">
                  <input required placeholder="State / Province" className={fieldClass} value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
                  <input required placeholder="PIN Code" className={fieldClass} value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} />
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="card-rounded p-8 bg-paper"
            >
              <h2 className="text-xl mb-6 font-semibold text-ink flex items-center gap-2">
                <CreditCard size={20} className="text-ink/60" />
                Payment Method
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${paymentMode === 'online' ? 'border-ink bg-ink/5' : 'border-ink/10 hover:border-ink/30'}`}>
                  <input type="radio" name="paymentMode" value="online" checked={paymentMode === 'online'} onChange={() => setPaymentMode('online')} className="sr-only" />
                  <CreditCard size={28} className={paymentMode === 'online' ? 'text-ink' : 'text-ink/40'} />
                  <span className={`text-sm font-medium ${paymentMode === 'online' ? 'text-ink' : 'text-ink/60'}`}>Pay Online (Secure)</span>
                </label>
                <label className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${paymentMode === 'cod' ? 'border-ink bg-ink/5' : 'border-ink/10 hover:border-ink/30'}`}>
                  <input type="radio" name="paymentMode" value="cod" checked={paymentMode === 'cod'} onChange={() => setPaymentMode('cod')} className="sr-only" />
                  <Truck size={28} className={paymentMode === 'cod' ? 'text-ink' : 'text-ink/40'} />
                  <span className={`text-sm font-medium ${paymentMode === 'cod' ? 'text-ink' : 'text-ink/60'}`}>Cash on Delivery</span>
                </label>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="card-rounded p-8 bg-paper sticky top-24"
          >
            <h2 className="text-xl mb-6 font-semibold text-ink">Order Summary</h2>
            
            {/* Coupon Code */}
            <div className="flex flex-col gap-3 mb-8">
              <label className="text-xs font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1.5">
                <Tag size={14} /> Gift Card or Coupon Code
              </label>
              <div className="flex gap-3">
                <input
                  placeholder="Enter code"
                  className={`${fieldClass} flex-1 py-2.5 px-4 text-sm`}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" onClick={handleApplyCoupon} className="pill-btn-solid !py-2.5 !px-6 rounded-xl">
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>Code {appliedCoupon.code} applied</span>
                  <span>-₹{appliedCoupon.discount}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium text-ink border-t border-ink/10 pt-6">
              <div className="flex justify-between items-center text-ink/70">
                <span>Subtotal ({productCart.length} items)</span>
                <span>₹{cartTotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-ink/70">
                <span>Shipping</span>
                <span className="text-green-600 uppercase text-xs font-bold tracking-wider">Free</span>
              </div>
              <div className="border-t border-ink/10 pt-4 flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {serviceCart.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium leading-relaxed">
                Note: {serviceCart.length} service item(s) remain in your cart and are handled separately.
              </div>
            )}

            <button disabled={loading} type="submit" className="pill-btn-solid w-full mt-8 py-4 text-base shadow-xl flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              {loading ? 'Processing...' : `Pay ₹${total}`}
            </button>
            <p className="text-center text-[10px] text-ink/40 mt-4 uppercase tracking-widest">
              Secure Encrypted Checkout
            </p>
          </motion.div>

        </form>
      </div>
    </section>
  );
}
