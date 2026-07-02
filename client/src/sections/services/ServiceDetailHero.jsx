import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ArrowUpRight, Check, ShieldCheck } from 'lucide-react';

const noMotion = { hidden: {}, show: {} };

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

export default function ServiceDetailHero({
  categoryLabel = 'Signature Service',
  categoryIcon = <ShieldCheck />,
  titlePrimary = '',
  titleAccent = '',
  description = '',
  features = [],
  price = 0,
  coverImage = '',
  trustCards = {
    topRight: { icon: <ShieldCheck />, title: 'Verified Quality', subtext: 'Safe & certified service delivery' },
    bottomLeft: { icon: <ShieldCheck />, title: 'Guaranteed Fit', subtext: 'Expert technicians in action' },
  },
  avatars = [],
  onBook = () => {},
  backLinkHref = '/services',
}) {
  const shouldReduce = useReducedMotion();
  const container = shouldReduce ? noMotion : containerVariants;
  const fadeUp = shouldReduce ? noMotion : fadeUpVariants;

  return (
    <div
      className="relative w-full overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28 -mt-24"
      style={{
        backgroundColor: '#13294B'
      }}
    >
      {/* Soft diffused background glow blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-500 blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-yellow-500 blur-[120px] opacity-10 pointer-events-none" />

      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center"
        >
          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col">
            
            {/* Category badge pill */}
            <motion.div variants={fadeUp} className="mb-6">
              <div
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-sm text-xs font-bold tracking-widest uppercase border border-slate-200/60"
                style={{ color: '#2F5FF6' }}
              >
                {categoryIcon && React.cloneElement(categoryIcon, { size: 14, className: 'shrink-0' })}
                {categoryLabel}
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-sans text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tightest mb-6"
              style={{ color: '#FFFFFF' }}
            >
              <span>{titlePrimary}</span>
              {titleAccent && (
                <>
                  {' '}
                  <span
                    style={{
                      color: '#F5C518',
                      display: 'inline-block',
                    }}
                  >
                    {titleAccent}
                  </span>
                </>
              )}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg font-normal leading-relaxed text-slate-300 mb-8 max-w-xl"
            >
              {description}
            </motion.p>

            {/* Feature icons row (4 items: 4-across desktop, 2x2 mobile) */}
            {features && features.length > 0 && (
              <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-white/10 mb-8">
                {features.map((feat, i) => {
                  const isEven = i % 2 === 0;
                  const bg = isEven ? '#E8EEFF' : '#FEF3C7';
                  const iconColor = isEven ? '#2F5FF6' : '#D97706';
                  return (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full mb-2.5 shadow-sm shrink-0"
                        style={{ backgroundColor: bg }}
                      >
                        {feat.icon && React.cloneElement(feat.icon, { size: 18, strokeWidth: 2.2, style: { color: iconColor } })}
                      </div>
                      <span className="text-xs font-bold text-slate-200 leading-snug max-w-[110px]">
                        {feat.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Action buttons (stacked on mobile, side-by-side tablet+) */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8"
            >
              <Link
                to={backLinkHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-bold transition-colors whitespace-nowrap shadow-sm bg-white"
                style={{ borderColor: '#2F5FF6', color: '#2F5FF6' }}
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
                Go back to services
              </Link>
              <button
                onClick={onBook}
                className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold text-[#0B1220] transition-colors duration-300 whitespace-nowrap shadow-md"
                style={{ backgroundColor: '#FBBF24' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5B400'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FBBF24'; }}
              >
                <span>Book service — ₹{price}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2F5FF6] text-white shrink-0 shadow-sm">
                  <ArrowUpRight size={13} strokeWidth={3} />
                </span>
              </button>
            </motion.div>

            {/* Social proof row */}
            {avatars && avatars.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
                <div className="flex -space-x-2 shrink-0">
                  {avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-8 w-8 rounded-full border-2 border-white object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ))}
                </div>
                <span
                  className="flex h-6 items-center rounded-full px-2.5 text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: '#F5B400' }}
                >
                  10K+
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-300">
                  Trusted by 10,000+ happy customers
                </span>
              </motion.div>
            )}

          </div>

          {/* ── RIGHT COLUMN (Image + Floating Cards) ── */}
          <div className="relative w-full px-4 py-6 lg:px-0 lg:py-0 overflow-visible flex flex-col lg:block items-center">
            
            {/* Background circular decoration (Desktop only) */}
            <div className="hidden lg:block absolute left-[-10%] top-[-10%] w-[120%] h-[120%] border border-white/10 rounded-full pointer-events-none z-0" />
            
            {/* Decorative dot grids (Desktop only) */}
            <div className="hidden lg:block absolute top-[5%] left-[-4%] w-16 h-24 opacity-25 z-0" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px)',
              backgroundSize: '10px 10px'
            }} />

            {/* Main Cover Image container */}
            <div className="relative w-full max-w-[500px] lg:max-w-none lg:w-full h-[480px] lg:h-[450px] rounded-2xl shadow-xl z-10 overflow-hidden lg:overflow-visible transition-transform duration-500 lg:transform lg:rotate-[-1.5deg] lg:hover:rotate-0">
              <img
                src={coverImage}
                alt={titlePrimary}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />

              {/* Card 1: Top-Right */}
              {trustCards?.topRight && (
                <div
                  className="absolute top-[4%] right-[4%] w-[62%] lg:top-[8%] lg:-right-[6%] lg:w-[220px] bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-3 lg:p-4 border border-slate-100 z-25 text-left"
                >
                  <div className="flex gap-2.5 lg:gap-3">
                    <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-[#E8EEFF] shrink-0">
                      {trustCards.topRight.icon && React.cloneElement(trustCards.topRight.icon, { size: 15, style: { color: '#2F5FF6' } })}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] lg:text-xs font-bold text-[#0B1220] leading-tight">{trustCards.topRight.title}</h4>
                      <p className="text-[9px] lg:text-[10px] text-slate-400 mt-0.5 lg:mt-1 leading-snug">{trustCards.topRight.subtext}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Bottom-Left */}
              {trustCards?.bottomLeft && (
                <div
                  className="absolute top-[38%] left-[4%] w-[68%] lg:top-auto lg:bottom-[-6%] lg:left-[-6%] lg:w-[235px] bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-3 lg:p-4 border border-slate-100 z-25 text-left"
                >
                  <div className="flex gap-2.5 lg:gap-3">
                    <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-[#E8EEFF] shrink-0">
                      {trustCards.bottomLeft.icon && React.cloneElement(trustCards.bottomLeft.icon, { size: 15, style: { color: '#2F5FF6' } })}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] lg:text-xs font-bold text-[#0B1220] leading-tight">{trustCards.bottomLeft.title}</h4>
                      <p className="text-[9px] lg:text-[10px] text-slate-400 mt-0.5 lg:mt-1 leading-snug">{trustCards.bottomLeft.subtext}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Bottom-Right Price Badge */}
              <div
                className="absolute bottom-[4%] right-[4%] w-[48%] lg:bottom-[6%] lg:-right-[4%] lg:w-[150px] bg-[#2F5FF6] rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-3 lg:p-3.5 text-white z-25 flex items-center gap-2 lg:gap-2.5 text-left"
              >
                <div className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-[#F5B400] shrink-0 text-white shadow-sm">
                  <Check size={14} strokeWidth={3} className="lg:hidden" />
                  <Check size={16} strokeWidth={3} className="hidden lg:block" />
                </div>
                <div>
                  <span className="text-[9px] lg:text-[10px] text-white/70 block leading-none">Starts at</span>
                  <span className="text-base lg:text-xl font-bold block mt-0.5 leading-none">₹{price}</span>
                  <span className="text-[8px] lg:text-[9px] text-white/70 block mt-0.5 leading-none">per service</span>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
