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
  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%), radial-gradient(50rem 50rem at 100% 100%, rgba(26,26,26,0.05), transparent 55%)',
          }}
        />
        <div className="container-velora py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/90">
              Partner with Helper
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-light leading-[1.02] tracking-tightest">
              Grow your work.
              <span className="mt-1 block font-semibold">Join Helper.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-ink/80">
              Whether you're a skilled professional looking for steady work or a brand ready to reach
              more customers — Helper gives you the platform, the trust, and the tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/join/apply?role=worker" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:opacity-90">
                <Briefcase size={16} /> Join as a professional
              </Link>
              <Link to="/join/apply?role=brand" className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5">
                <Building2 size={16} /> Register your brand
              </Link>
            </div>
          </motion.div>
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
          <Link to="/join/apply?role=worker" className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Apply as a professional <ArrowRight size={15} />
          </Link>
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
            <Link to="/join/apply?role=brand" className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Register your brand <ArrowRight size={15} />
            </Link>
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
            <Link to="/join/apply?role=worker" className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90">
              <Briefcase size={16} /> Join as pro
            </Link>
            <Link to="/join/apply?role=brand" className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-paper/10">
              <Building2 size={16} /> Join as brand
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
