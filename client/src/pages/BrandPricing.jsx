import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { ShieldCheck, Award, ArrowRight, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

export default function BrandPricing() {
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState({
    brandRegistrationCharge: 500,
    productListingCharge: 50,
    brandCommissionRate: 0.15,
    featuredWorkerFee: 999,
  });

  useEffect(() => {
    api.get('/settings/public')
      .then(({ data }) => {
        setPricing({
          brandRegistrationCharge: data.brandRegistrationCharge,
          productListingCharge: data.productListingCharge,
          brandCommissionRate: data.brandCommissionRate,
          featuredWorkerFee: data.featuredWorkerFee,
        });
      })
      .catch((err) => {
        console.error('Failed to load public settings, using defaults.', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPercent = (val) => `${Math.round(val * 100)}%`;

  return (
    <>
      {/* Premium cinematic background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-paper" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(70rem 70rem at 85% 10%, rgba(111,92,255,0.07), transparent 60%), radial-gradient(50rem 50rem at 15% 90%, rgba(26,26,26,0.05), transparent 55%)',
        }}
      />

      <section className="relative min-h-screen px-4 sm:px-6 pt-28 pb-16">
        <div className="mx-auto w-full max-w-5xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <FadeUp>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#6f5cff]/20 bg-[#6f5cff]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f5cff]">
                Seller Partner Portal
              </span>
              <h1 className="font-display text-4xl sm:text-6xl font-light leading-tight tracking-tightest mt-6 text-ink">
                Simple, transparent <span className="font-semibold block sm:inline">pricing.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-ink/75 leading-relaxed">
                Grow your brand on the region's leading marketplace. Set up your storefront, list your catalogue, and start selling with absolute transparency.
              </p>
            </FadeUp>
          </div>

          {/* Pricing Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            {/* Registration Fee Card */}
            <FadeUp delay={0.1}>
              <div className="card-rounded p-6 flex flex-col justify-between h-full bg-white/70 backdrop-blur-md border border-ink/5 hover:border-ink/10 hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#6f5cff] font-bold mb-4">Start Selling</div>
                  <h3 className="text-lg font-semibold mb-1 text-ink">Registration Fee</h3>
                  <p className="text-xs text-ink/50 mb-6">One-time security and boarding deposit</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold tracking-tight">₹{pricing.brandRegistrationCharge}</span>
                    <span className="text-xs text-ink/60">/ one-time</span>
                  </div>

                  <ul className="space-y-3 text-xs text-ink/75">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Dedicated brand storefront</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>KYC verification check</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Seller analytics dashboard</span>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeUp>

            {/* Listing Fee Card */}
            <FadeUp delay={0.2}>
              <div className="card-rounded p-6 flex flex-col justify-between h-full bg-white/70 backdrop-blur-md border border-ink/5 hover:border-ink/10 hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#6f5cff] font-bold mb-4">Your Catalog</div>
                  <h3 className="text-lg font-semibold mb-1 text-ink">Product Listing Fee</h3>
                  <p className="text-xs text-ink/50 mb-6">Standard listing fee per unique product</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold tracking-tight">₹{pricing.productListingCharge}</span>
                    <span className="text-xs text-ink/60">/ product</span>
                  </div>

                  <ul className="space-y-3 text-xs text-ink/75">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>High-resolution media hosting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Real-time inventory manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Automated product SEO tags</span>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeUp>

            {/* Platform Commission Card */}
            <FadeUp delay={0.3}>
              <div className="card-rounded p-6 flex flex-col justify-between h-full bg-[#1a1a1a] text-paper border border-[#1a1a1a] hover:shadow-xl hover:shadow-[#6f5cff]/10 transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#6f5cff] font-bold mb-4">Fair Split</div>
                  <h3 className="text-lg font-semibold mb-1 text-paper">Platform Commission</h3>
                  <p className="text-xs text-paper/50 mb-6">Charged only on successful item sales</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold tracking-tight text-white">{formatPercent(pricing.brandCommissionRate)}</span>
                    <span className="text-xs text-paper/60">/ order item</span>
                  </div>

                  <ul className="space-y-3 text-xs text-paper/85">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Centralized payment clearing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Fraud prevention protection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#6f5cff]" />
                      <span>Automatic buyer invoicing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Additional details */}
          <FadeUp delay={0.4}>
            <div className="rounded-[2rem] border border-ink/5 bg-white/40 p-6 sm:p-8 backdrop-blur-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 mt-1 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-ink text-sm">Need Premium Visibility?</h4>
                  <p className="text-xs text-ink/70 mt-1 max-w-lg leading-relaxed">
                    Sellers can boost their brand listing ranking or participate in promotional featured slots for a dynamic featured package charge of ₹{pricing.featuredWorkerFee}. Speak with support once verified.
                  </p>
                </div>
              </div>
              <Link
                to="/signup?role=brand"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-paper rounded-full py-3 px-6 text-xs font-bold uppercase tracking-widest whitespace-nowrap hover:bg-[#6f5cff] transition-all duration-300 hover:shadow-lg hover:shadow-[#6f5cff]/20 shrink-0"
              >
                Start Selling <ArrowRight size={14} />
              </Link>
            </div>
          </FadeUp>

          {/* Footer Back Link */}
          <div className="text-center mt-12">
            <Link to="/signup" className="text-xs uppercase tracking-widest text-ink/55 hover:text-ink transition-colors">
              ← Back to Sign Up Options
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
