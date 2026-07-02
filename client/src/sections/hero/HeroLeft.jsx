import { motion, useReducedMotion } from 'framer-motion';
import SearchBar from './SearchBar';
import TrustStrip from './TrustStrip';

// Color constants — inline styles bypass Tailwind config hot-reload issues
const C = {
  blue: '#13294B',
  dark: '#0B0F19',
  gray: '#6B7280',
  border: '#E5E7EB',
};

// Real user avatar photos for the trust badge
const TRUST_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80&h=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80&h=80',
];

export default function HeroLeft() {
  const shouldReduce = useReducedMotion();

  const fadeUp = shouldReduce
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col justify-center py-8 lg:py-0">
      {/* Trust Badge Pill */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-nowrap items-center gap-2 sm:gap-3 w-fit max-w-full rounded-full bg-white px-4 py-2 shadow-sm"
        style={{ border: `1px solid ${C.border}` }}
      >
        <span className="text-xs xs:text-sm font-medium whitespace-nowrap shrink-0" style={{ color: C.blue }}>
          <span className="hidden sm:inline">Trusted by </span>10,000+ happy customers
        </span>
        <div className="flex -space-x-2 shrink-0">
          {TRUST_AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-7 w-7 rounded-full border-2 border-white object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ))}
        </div>
        {/* 10K+ dark pill — uses inline bg to guarantee visibility */}
        <span
          className="flex h-6 items-center rounded-full px-2.5 text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: C.dark }}
        >
          10K+
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        {...fadeUp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: shouldReduce ? 0 : 0.1 }}
        className="mt-6 text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tightest"
      >
        <span style={{ color: '#FFFFFF' }}>Reliable home</span>
        <br />
        <span style={{ color: '#FFFFFF' }}>services, </span>
        <span style={{ color: '#F5C518' }}>just a</span>
        <br />
        <span style={{ color: '#F5C518' }}>few clicks away.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: shouldReduce ? 0 : 0.2 }}
        className="mt-5 max-w-md text-base leading-relaxed md:text-lg"
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
      >
        Book trusted professionals for all your home needs.
        <br className="hidden sm:block" />
        Fast, reliable and hassle-free.
      </motion.p>

      {/* Search Bar */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: shouldReduce ? 0 : 0.3 }}
      >
        <SearchBar />
      </motion.div>

      {/* Trust Strip */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: shouldReduce ? 0 : 0.4 }}
      >
        <TrustStrip />
      </motion.div>
    </div>
  );
}
