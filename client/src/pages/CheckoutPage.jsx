import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/payments.js';
import { validateCoupon } from '../api/coupons.js';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: '', city: '', state: '', pincode: ''
  });
  const [paymentMode, setPaymentMode] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cartTotal - discount;

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (paymentMode === 'online' && !razorpayReady) {
        throw new Error('Payment gateway is still loading. Please try again in a moment.');
      }

      const items = cart.map(c => ({ product: c.product, quantity: c.quantity }));
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
        clearCart();
        navigate('/me/orders');
      } else {
        const rpOrder = await createRazorpayOrder({ amount: payableAmount, receipt: order.orderId, type: 'ecommerce' });
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx', 
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: "Velora House",
          description: "Order Payment",
          order_id: rpOrder.id,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                ...response,
                referenceId: order._id,
                type: 'ecommerce'
              });
              toast.success('Payment successful & Order placed!');
              clearCart();
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
          theme: { color: "#18181A" }
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
    <section className="container-velora py-16 max-w-3xl">
      <h1 className="heading-display text-4xl mb-8">CHECKOUT</h1>
      
      <form onSubmit={handleCheckout} className="space-y-8">
        <div className="card-rounded p-6">
          <h2 className="text-xl mb-4 font-bold">Shipping Address</h2>
          <div className="grid gap-4">
            <input required placeholder="Line 1" className="p-3 border rounded-xl" value={address.line1} onChange={(e) => setAddress({...address, line1: e.target.value})} />
            <input required placeholder="City" className="p-3 border rounded-xl" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="State" className="p-3 border rounded-xl" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} />
              <input required placeholder="Pincode" className="p-3 border rounded-xl" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="card-rounded p-6 flex gap-4">
          <input
            placeholder="Coupon Code"
            className="flex-1 p-3 border rounded-xl"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button type="button" onClick={handleApplyCoupon} className="pill-btn-solid whitespace-nowrap">
            Apply
          </button>
        </div>

        <div className="card-rounded p-6">
          <h2 className="text-xl mb-4 font-bold">Payment Method</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMode" value="online" checked={paymentMode === 'online'} onChange={() => setPaymentMode('online')} />
              Pay Online (Razorpay)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="paymentMode" value="cod" checked={paymentMode === 'cod'} onChange={() => setPaymentMode('cod')} />
              Cash on Delivery
            </label>
          </div>
        </div>

        <div className="flex flex-col items-end text-lg font-bold px-4">
          {discount > 0 && (
            <div className="text-sm text-ink/60 line-through">Subtotal: ₹{cartTotal}</div>
          )}
          {appliedCoupon && (
            <div className="mb-1 text-xs uppercase tracking-widest text-green-700 dark:text-green-400">
              Coupon {appliedCoupon.code} saved • ₹{appliedCoupon.discount} off
            </div>
          )}
          <div className="mb-4">Total Payable: ₹{total}</div>
          <button disabled={loading} type="submit" className="pill-btn-solid">
            {loading ? 'Processing...' : `Place Order (₹${total})`}
          </button>
        </div>
      </form>
    </section>
  );
}
