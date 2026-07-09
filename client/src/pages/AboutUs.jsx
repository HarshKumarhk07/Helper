import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Check, Users, Award, Clock, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FadeUp from '../components/ui/FadeUp.jsx';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function AboutUs() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      {/* ── HERO SECTION ── */}
      <section
        className="relative w-full overflow-hidden py-12 md:py-20"
        style={{ backgroundColor: '#13294B' }}
      >
        {/* Soft diffused background glow blobs */}
        <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-500 blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-amber-500 blur-[120px] opacity-15 pointer-events-none" />

        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center"
          >
            {/* Left Column */}
            <div className="flex flex-col">
              <motion.div variants={fadeUpVariants} className="mb-6">
                <div
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-sm text-xs font-bold tracking-widest uppercase border border-slate-200/60 text-brand"
                  style={{ color: '#2F5FF6' }}
                >
                  <Sparkles size={14} className="shrink-0" />
                  About Helper
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUpVariants}
                className="font-sans text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-tightest mb-6 text-white"
              >
                Connecting You to <br />
                <span style={{ color: '#FBBF24', display: 'inline-block' }}>
                  Vetted Professionals
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUpVariants}
                className="text-base md:text-lg font-normal leading-relaxed text-slate-300 mb-8 max-w-xl"
              >
                Helper is a state-of-the-art service marketplace built to simplify how home owners, occupants, and managers discover and book local professionals. We eliminate the guesswork from choosing contractors by matching you with trusted, fully verified experts.
              </motion.p>

              {/* Stats Bar */}
              <motion.div
                variants={fadeUpVariants}
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-white/10 mb-8"
              >
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white">10K+</span>
                  <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Clients</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white">500+</span>
                  <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Verified Pros</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white">4.8★</span>
                  <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Avg Rating</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white">60m</span>
                  <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Response Time</span>
                </div>
              </motion.div>

              <motion.div variants={fadeUpVariants}>
                <Link
                  to="/categories"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-[#0B1220] transition-all duration-300 whitespace-nowrap shadow-md bg-amber-400 hover:bg-amber-500"
                >
                  <span>Explore Services</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </motion.div>
            </div>

            {/* Right Column (Cover Image + Badges) */}
            <div className="relative w-full px-6 sm:px-12 py-6 lg:px-0 lg:py-0 overflow-visible flex flex-col lg:block items-center">
              {/* Background circle decoration */}
              <div className="hidden lg:block absolute left-[-10%] top-[-10%] w-[120%] h-[120%] border border-white/10 rounded-full pointer-events-none z-0" />

              <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-[450px] rounded-2xl shadow-xl z-10 overflow-visible transition-transform duration-500 lg:transform lg:rotate-[-1deg] lg:hover:rotate-0">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
                  alt="Helper Handyman"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />

                {/* Trust Badge 1 */}
                <div className="absolute top-[-6%] right-[-3%] lg:-right-[6%] lg:top-[8%] w-[130px] sm:w-[220px] bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-2.5 sm:p-4 border border-slate-100/80 z-20 text-left">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#E8EEFF] shrink-0">
                      <ShieldCheck size={14} className="text-[#2F5FF6] sm:hidden" />
                      <ShieldCheck size={16} className="text-[#2F5FF6] hidden sm:block" />
                    </div>
                    <div>
                      <h4 className="text-[9px] sm:text-xs font-bold text-[#0B1220] leading-tight">Vetted Quality</h4>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">Verified professionals.</p>
                    </div>
                  </div>
                </div>

                {/* Trust Badge 2 */}
                <div className="absolute bottom-[-6%] left-[-3%] lg:-left-[6%] lg:bottom-[-6%] lg:top-auto w-[135px] sm:w-[235px] bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-2.5 sm:p-4 border border-slate-100/80 z-20 text-left">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#FEF3C7] shrink-0">
                      <Clock size={14} className="text-amber-600 sm:hidden" />
                      <Clock size={16} className="text-amber-600 hidden sm:block" />
                    </div>
                    <div>
                      <h4 className="text-[9px] sm:text-xs font-bold text-[#0B1220] leading-tight">Instant Match</h4>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">Book in 60s.</p>
                    </div>
                  </div>
                </div>

                {/* Value Badge */}
                <div className="absolute top-[44%] right-[-3%] lg:top-auto lg:bottom-[6%] lg:-right-[4%] w-[110px] sm:w-[160px] flex bg-[#2F5FF6] rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-3.5 text-white z-20 items-center gap-2 lg:gap-2.5 text-left">
                  <div className="flex h-6.5 w-6.5 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#F5B400] shrink-0 text-white shadow-sm">
                    <Check size={12} strokeWidth={3} className="sm:hidden" />
                    <Check size={16} strokeWidth={3} className="hidden sm:block" />
                  </div>
                  <div>
                    <span className="text-[8px] sm:text-[10px] text-white/70 block leading-none">Vetted &</span>
                    <span className="text-[10px] sm:text-sm font-bold block mt-0.5 leading-none">Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION SECTION ── */}
      <section className="container-velora py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <FadeUp>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              OUR COMMITMENT
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tightest text-ink mb-6">
              Simplifying home service booking for everyone
            </h2>
            <p className="text-base text-ink/70 leading-relaxed mb-4">
              Finding a trusted professional online is notoriously difficult. With millions of unverified directory options, price negotiation disputes, and schedule coordination headaches, booking simple home care should be better.
            </p>
            <p className="text-base text-ink/70 leading-relaxed">
              Helper was founded to replace the traditional directories model. We verify every provider, set standardized, transparent prices, and allow immediate checkout bookings so your service is delivered when you need it.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="bg-sand rounded-[2rem] p-8 md:p-10 border border-ink/5 flex flex-col justify-between h-full">
              <blockquote className="text-xl font-medium italic text-ink/80 leading-relaxed mb-6">
                "Our mission is to establish the world's most transparent, high-quality, and effortless marketplace for local professionals, ensuring direct benefits for both customers and experts."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#13294B] text-white flex items-center justify-center font-bold">
                  H
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">The Helper Team</div>
                  <div className="text-xs text-ink/50">Founded in 2026</div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── VALUES SECTION ── */}
      <section className="bg-sand/30 py-16 md:py-24 border-y border-ink/5">
        <div className="container-velora">
          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50 mb-3 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              CORE VALUES
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tightest text-ink mb-4">
              Why people choose Helper
            </h2>
            <p className="text-sm text-ink/60">
              We operate under core principles to deliver a premium service experience for both clients and professionals.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FadeUp delay={0.05} className="bg-paper border border-ink/5 rounded-[2rem] p-8 flex flex-col justify-between h-full hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-6 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-2">100% Verified</h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  Every professional must undergo background checks and license verification before joining.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.1} className="bg-paper border border-ink/5 rounded-[2rem] p-8 flex flex-col justify-between h-full hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-2">Direct Booking</h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  No messy quotes or endless calls. Browse services, select your provider, and book instantly.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.15} className="bg-paper border border-ink/5 rounded-[2rem] p-8 flex flex-col justify-between h-full hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-6 shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-2">Fair Pricing</h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  Standardized, upfront rates ensure transparency. You pay exactly what is shown, no surprises.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.2} className="bg-paper border border-ink/5 rounded-[2rem] p-8 flex flex-col justify-between h-full hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6 shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-2">Quality Guarantee</h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  Your satisfaction is our goal. If anything is not up to standards, we will make it right.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="container-velora py-16 md:py-24 text-center">
        <FadeUp className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tightest text-ink mb-4">
            Ready to find your professional?
          </h2>
          <p className="text-sm text-ink/60 mb-8 leading-relaxed">
            Browse our categories catalog and match with verified local plumbers, electricians, cleaners, and caregivers in just a few clicks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-ink text-paper font-bold text-xs uppercase tracking-widest hover:bg-[#13294B] transition w-full sm:w-auto"
            >
              Browse Categories
            </Link>
            <Link
              to="/join"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 border border-ink/15 text-ink font-bold text-xs uppercase tracking-widest hover:bg-ink/5 transition w-full sm:w-auto"
            >
              Become a Professional
            </Link>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
