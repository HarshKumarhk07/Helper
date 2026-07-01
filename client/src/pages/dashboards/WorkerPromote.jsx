import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardShell from './DashboardShell.jsx';
import useRazorpay from '../../hooks/useRazorpay.js';
import FadeUp from '../../components/ui/FadeUp.jsx';

export default function WorkerPromote() {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, processing } = useRazorpay();
  const [success, setSuccess] = useState(false);

  // If already featured, they don't need to be here.
  if (user?.isFeatured && !success) {
    return <Navigate to="/worker" replace />;
  }

  const handlePay = async () => {
    try {
      await openCheckout({
        amount: 5,
        type: 'featured_worker',
        referenceId: user._id,
        name: 'Helper',
        description: 'Featured Worker Promotion',
      });
      
      // On success:
      toast.success('Payment successful! You are now a featured worker.');
      await refetchUser();
      setSuccess(true);
    } catch (err) {
      if (err.message !== 'payment_dismissed') {
        toast.error('Payment failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  if (success) {
    return (
      <DashboardShell eyebrow="Promotion" title="SUCCESS">
        <FadeUp>
          <div className="max-w-xl bg-paper border border-ink/10 p-8 rounded-3xl text-center mx-auto mt-10">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-4">You are now Featured!</h2>
            <p className="text-ink/60 mb-8">
              Your profile has been successfully upgraded. You will now appear in the "Best Service Providers" section on the services page.
            </p>
            <button
              onClick={() => navigate('/worker')}
              className="pill-btn"
            >
              Return to Dashboard
            </button>
          </div>
        </FadeUp>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      eyebrow="Promotion"
      title="BECOME A FEATURED WORKER"
    >
      <FadeUp>
        <div className="max-w-4xl grid md:grid-cols-2 gap-8 items-start mt-6">
          
          {/* Info Side */}
          <div className="space-y-6">
            <p className="text-lg text-ink/70 leading-relaxed">
              Stand out from the crowd and get more bookings by upgrading your profile to <strong className="text-ink">Featured Status</strong>.
            </p>

            <ul className="space-y-4 mt-8">
              <li className="flex items-start gap-3">
                <Star className="text-brand shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-ink text-sm uppercase tracking-wider">Top Visibility</h4>
                  <p className="text-ink/60 text-sm mt-1">Appear in the exclusive "Best Service Providers" section on category pages.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="text-brand shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-ink text-sm uppercase tracking-wider">Instant Trust</h4>
                  <p className="text-ink/60 text-sm mt-1">Customers trust recommended workers. Get the "Featured" badge on your profile.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Payment Card */}
          <div className="bg-paper border border-ink/10 p-8 rounded-3xl shadow-sm flex flex-col h-full">
            <div className="text-center mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-brand mb-2">One-time payment</div>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-bold text-ink tracking-tighter">₹5</span>
              </div>
              <p className="text-sm text-ink/50 mt-3">Lifetime featured access</p>
            </div>

            <div className="mt-auto">
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full py-4 px-6 bg-ink text-paper rounded-full font-bold uppercase tracking-widest hover:bg-[#13294B] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {processing ? 'Processing...' : 'Pay ₹5 & Get Featured'}
              </button>
            </div>
            
            <p className="text-[10px] text-ink/40 text-center mt-4 uppercase tracking-widest">
              Secure payment powered by Razorpay
            </p>
          </div>

        </div>
      </FadeUp>
    </DashboardShell>
  );
}
