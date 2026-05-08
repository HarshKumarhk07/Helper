import { useCallback, useEffect, useState } from 'react';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../api/payments.js';
import { useAuth } from '../context/AuthContext.jsx';

const SCRIPT_ID = 'razorpay-checkout-js';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.Razorpay) return resolve(window.Razorpay);

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });

// Hook that wraps the full Razorpay checkout flow:
// 1. Create order on the server
// 2. Open the Razorpay checkout modal
// 3. Verify the signature on the server
// Returns { ready, openCheckout, processing }.
//
// usage:
//   const { openCheckout, ready, processing } = useRazorpay();
//   await openCheckout({ amount: 1500, type: 'booking', referenceId: bookingId });
export default function useRazorpay() {
  const { user } = useAuth();
  const [ready, setReady] = useState(
    typeof window !== 'undefined' && !!window.Razorpay
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCheckout = useCallback(
    async ({
      amount,
      type, // 'booking' | 'ecommerce' | 'order' (alias of ecommerce)
      referenceId,
      receipt,
      name = 'Velora House',
      description = 'Velora House payment',
      prefill,
      theme,
      onSuccess,
      onFailure,
      onDismiss,
    }) => {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('amount (in INR) is required');
      }
      if (!type || !referenceId) {
        throw new Error('type and referenceId are required');
      }

      const Razorpay = await loadScript();
      const verifyType = type === 'order' ? 'ecommerce' : type;

      setProcessing(true);
      let rzpOrder;
      try {
        rzpOrder = await createRazorpayOrder({
          amount,
          receipt,
          type: verifyType,
        });
      } catch (err) {
        setProcessing(false);
        if (onFailure) onFailure(err);
        throw err;
      }

      return new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || rzpOrder.key_id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          order_id: rzpOrder.id,
          name,
          description,
          prefill: {
            email: prefill?.email || user?.email,
            contact: prefill?.contact || user?.phone,
            name: prefill?.name || user?.name,
          },
          theme: theme || { color: '#1a1a1a' },
          handler: async (response) => {
            try {
              const verified = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                referenceId,
                type: verifyType,
              });
              setProcessing(false);
              if (onSuccess) onSuccess({ response, verified });
              resolve({ response, verified });
            } catch (err) {
              setProcessing(false);
              if (onFailure) onFailure(err);
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              if (onDismiss) onDismiss();
              reject(new Error('payment_dismissed'));
            },
          },
        });
        rzp.on('payment.failed', (resp) => {
          setProcessing(false);
          const err = new Error(
            resp?.error?.description || 'Payment failed'
          );
          err.detail = resp?.error;
          if (onFailure) onFailure(err);
          reject(err);
        });
        rzp.open();
      });
    },
    [user]
  );

  return { ready, processing, openCheckout };
}
