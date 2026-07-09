import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Wallet,
  CalendarClock,
  ShieldCheck,
  Star,
  TrendingUp,
  Package,
  ArrowRight,
} from 'lucide-react';
import JoinApply from './JoinApply.jsx';

const WORKER_POINTS = [
  { Icon: Wallet, title: 'Earn on your terms', body: 'Set your own price per service — fixed or quote-based. Keep the majority; transparent commission.' },
  { Icon: CalendarClock, title: 'Work when you want', body: 'Toggle availability on/off. Accept or decline jobs. You control your schedule.' },
  { Icon: Star, title: 'Build your reputation', body: 'Verified booking reviews grow your rating and bring you more, better-paying jobs.' },
  { Icon: ShieldCheck, title: 'Get paid securely', body: 'Payments are collected up front and settled to you on a regular payout schedule.' },
];

const BRAND_POINTS = [
  { Icon: Package, title: 'List your catalog', body: 'Bring your products to a growing marketplace of intent-driven customers.' },
  { Icon: TrendingUp, title: 'Grow with insights', body: 'Track orders, inventory, and performance from one seller dashboard.' },
  { Icon: ShieldCheck, title: 'Verified & trusted', body: 'A one-time KYC verification unlocks your storefront and builds buyer trust.' },
];

const STEPS = [
  { n: 1, title: 'Tell us about you', body: 'Fill a short form with your details (and documents for verification).' },
  { n: 2, title: "We verify you", body: 'Our team reviews your KYC — usually within 24 hours.' },
  { n: 3, title: 'Go live & earn', body: 'Once approved, sign in to your portal and start receiving work or orders.' },
];

export default function JoinUs() {
  const [role, setRole] = useState('worker');

  const scrollToForm = (roleType) => {
    setRole(roleType);
    const element = document.getElementById('hero-apply-form');
    if (element) {
      const yOffset = -100; // Offset for navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/5 bg-sand/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%), radial-gradient(50rem 50rem at 100% 100%, rgba(26,26,26,0.05), transparent 55%)',
          }}
        />
        <div className="container-velora py-16 md:py-24 px-6 md:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column — Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col justify-center text-left"
            >
              <span className="self-start inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/90">
                Partner with Helper
              </span>
              <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-light leading-[1.02] tracking-tightest">
                Grow your work.
                <span className="mt-1 block font-semibold">Join Helper.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg font-normal leading-relaxed text-ink/75">
                Whether you're a skilled professional looking for steady work or a brand ready to reach
                more customers — Helper gives you the platform, the trust, and the tools to succeed.
              </p>

              {/* Interactive Form Toggles in Hero */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setRole('worker')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wider transition duration-300 cursor-pointer shadow-sm ${
                    role === 'worker'
                      ? 'bg-ink text-paper'
                      : 'border border-ink/20 bg-paper/50 text-ink/80 hover:bg-ink/5'
                  }`}
                >
                  <Briefcase size={14} /> Join as a professional
                </button>
                <button
                  onClick={() => setRole('brand')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wider transition duration-300 cursor-pointer shadow-sm ${
                    role === 'brand'
                      ? 'bg-ink text-paper'
                      : 'border border-ink/20 bg-paper/50 text-ink/80 hover:bg-ink/5'
                  }`}
                >
                  <Building2 size={14} /> Register your brand
                </button>
              </div>
            </motion.div>

            {/* Right Column — Integrated KYC / Apply Form */}
            <div id="hero-apply-form" className="w-full flex justify-center lg:justify-end scroll-mt-28">
              <JoinApply inline={true} role={role} setRole={setRole} />
            </div>
          </div>
        </div>
      </section>

      {/* Worker benefits */}
      <section className="container-velora py-12 md:py-16">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper"><Briefcase size={18} /></span>
          <div>
            <h2 className="text-2xl font-semibold">For professionals & workers</h2>
            <p className="text-sm text-ink/60">Turn your skills into a steady income.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKER_POINTS.map(({ Icon, title, body }) => (
            <div key={title} className="card-rounded p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/5 text-ink"><Icon size={18} /></span>
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => scrollToForm('worker')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 hover:opacity-85 cursor-pointer"
          >
            Apply as a professional <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Brand benefits */}
      <section className="bg-sand/30">
        <div className="container-velora py-12 md:py-16">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper"><Building2 size={18} /></span>
            <div>
              <h2 className="text-2xl font-semibold">For brands & companies</h2>
              <p className="text-sm text-ink/60">Reach more customers, sell more.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BRAND_POINTS.map(({ Icon, title, body }) => (
              <div key={title} className="card-rounded bg-paper p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/5 text-ink"><Icon size={18} /></span>
                <div className="mt-3 font-semibold">{title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={() => scrollToForm('brand')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 hover:opacity-85 cursor-pointer"
            >
              Register your brand <ArrowRight size={15} />
            </button>
            <Link to="/brand/pricing" className="text-sm font-medium text-[#13294B] underline-offset-4 hover:underline">
              View brand pricing & commission
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-velora py-12 md:py-16">
        <h2 className="text-2xl font-semibold">How joining works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card-rounded p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">{s.n}</div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl border border-ink/10 bg-ink p-8 text-paper sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-semibold">Ready to get started?</div>
            <p className="mt-1 text-sm text-paper/70">It takes a few minutes. Verification is usually within 24 hours.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => scrollToForm('worker')}
              className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 cursor-pointer"
            >
              <Briefcase size={16} /> Join as professional
            </button>
            <button
              onClick={() => scrollToForm('brand')}
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-paper/10 cursor-pointer"
            >
              <Building2 size={16} /> Join as brand
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
