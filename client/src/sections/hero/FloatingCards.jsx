import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight, Star, Wrench, Zap, PaintBucket, FlaskConical } from 'lucide-react';

const C = {
  blue: '#2F5FF6',
  dark: '#0B0F19',
  gray: '#6B7280',
  bg: '#F7F8FA',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  star: '#FACC15',
  border: '#E5E7EB',
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};
const noMotion = { hidden: {}, show: {} };

export default function FloatingCards() {
  const shouldReduce = useReducedMotion();
  const container = shouldReduce ? noMotion : containerVariants;
  const card = shouldReduce ? noMotion : cardVariants;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative w-full h-full"
    >
      {/* ──────────── Decorative elements (Desktop only) ──────────── */}
      <svg
        className="hidden lg:block absolute left-[25%] top-[38%] w-[200px] h-[140px] z-0"
        viewBox="0 0 200 140" fill="none" aria-hidden
      >
        <path d="M20 10 C 70 10, 60 70, 110 70 S 180 130, 180 130"
          stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" opacity="0.5" />
      </svg>
      <div className="hidden lg:block absolute bottom-[12%] left-[15%] w-16 h-16 rounded-full bg-blue-200/60 z-0" />
      <svg className="hidden lg:block absolute top-[5%] right-[12%] w-7 h-7 z-0"
        viewBox="0 0 24 24" fill="#94A3B8" opacity="0.4" aria-hidden>
        <path d="M12 0l1.8 5.6L19.4 6.5l-4.6 3.9L16.5 16 12 12.5 7.5 16l1.7-5.6L4.6 6.5l5.6-.9L12 0z" />
      </svg>

      {/* ──────────── Card 1: Booking Confirmed ──────────── */}
      {/* Mobile: top-left | Desktop: top-center-left */}
      <motion.div
        variants={card}
        className="absolute top-[3%] left-[3%] w-[56%] z-30
                   lg:top-[8%] lg:left-[18%] lg:w-[220px] lg:z-30
                   bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl
                   p-2.5 sm:p-3 lg:p-5"
        style={{ border: `1px solid ${C.border}80` }}
      >
        <div className="flex items-center gap-2 lg:flex-col lg:items-center lg:text-center">
          <div
            className="flex h-8 w-8 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-full shadow-md"
            style={{ backgroundColor: C.green }}
          >
            <Check size={16} strokeWidth={3} className="text-white lg:hidden" />
            <Check size={22} strokeWidth={3} className="text-white hidden lg:block" />
          </div>
          <div className="min-w-0 lg:w-full">
            <h3 className="text-xs sm:text-sm lg:text-base font-bold lg:mt-3" style={{ color: C.dark }}>
              Booking Confirmed!
            </h3>
            <p className="text-[10px] sm:text-[11px] lg:text-xs leading-snug lg:mt-1.5" style={{ color: C.gray }}>
              Arrives <span className="font-bold" style={{ color: C.dark }}>10–12 AM</span>
            </p>
          </div>
        </div>
        {/* Track Service — desktop only */}
        <div className="hidden lg:block">
          <div className="mt-3 w-full border-t" style={{ borderColor: C.border }} />
          <button className="mt-3 flex w-full items-center justify-between text-sm font-bold" style={{ color: C.dark }}>
            <span>Track Service</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
              <ChevronRight size={14} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </motion.div>

      {/* ──────────── Card 2: Living Room Cleaning ──────────── */}
      {/* Mobile: bottom-left | Desktop: mid-left */}
      <motion.div
        variants={card}
        className="absolute top-[35%] left-[2%] w-[60%] z-20
                   lg:top-[48%] lg:left-[6%] lg:w-[270px] lg:z-20
                   bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl
                   px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3.5"
        style={{ border: `1px solid ${C.border}80` }}
      >
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex h-8 w-8 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-lg lg:rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
            <FlaskConical size={14} strokeWidth={2} className="text-white lg:hidden" />
            <FlaskConical size={22} strokeWidth={2} className="text-white hidden lg:block" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] sm:text-xs lg:text-sm font-bold truncate" style={{ color: C.dark }}>
              Living Room Cleaning
            </h4>
            <p className="text-[10px] lg:text-xs mt-0.5" style={{ color: C.gray }}>2 Hrs • Standard</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] sm:text-xs lg:text-sm font-bold" style={{ color: C.dark }}>₹899</div>
            <span className="inline-block mt-0.5 rounded-full px-1 lg:px-2 py-px lg:py-0.5 text-[8px] lg:text-[10px] font-bold"
              style={{ backgroundColor: C.greenLight, color: C.green }}>Completed</span>
          </div>
        </div>
      </motion.div>

      {/* ──────────── Card 3: Review ──────────── */}
      {/* Mobile: top-right | Desktop: mid-right */}
      <motion.div
        variants={card}
        className="absolute top-[15%] right-[2%] w-[38%] z-20
                   lg:top-[32%] lg:right-[3%] lg:w-[210px] lg:z-20
                   bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl
                   p-2 sm:p-2.5 lg:p-4"
        style={{ border: `1px solid ${C.border}80` }}
      >
        <div className="flex gap-0.5 mb-1 lg:mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} fill={C.star} stroke={C.star} className="lg:hidden" />
          ))}
          {[...Array(5)].map((_, i) => (
            <Star key={`lg-${i}`} size={14} fill={C.star} stroke={C.star} className="hidden lg:block" />
          ))}
        </div>
        <p className="text-[9px] sm:text-[10px] lg:text-xs leading-snug italic" style={{ color: `${C.dark}CC` }}>
          "Very professional and punctual."
        </p>
        <div className="mt-1.5 lg:mt-3 flex items-center gap-1 lg:gap-2">
          <div className="flex h-5 w-5 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-pink-100 text-[8px] lg:text-xs font-bold text-pink-600">N</div>
          <span className="text-[9px] lg:text-xs font-medium" style={{ color: C.gray }}>— Neha R.</span>
        </div>
      </motion.div>

      {/* ──────────── Card 4: Popular in your area ──────────── */}
      {/* Mobile: bottom-right | Desktop: bottom-right */}
      <motion.div
        variants={card}
        className="absolute bottom-[3%] right-[2%] w-[48%] z-20
                   lg:bottom-[10%] lg:right-[8%] lg:w-[230px] lg:z-20
                   bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl
                   p-2 sm:p-2.5 lg:p-4"
        style={{ border: `1px solid ${C.border}80` }}
      >
        <h4 className="text-[11px] sm:text-xs lg:text-sm font-bold mb-1.5 lg:mb-3" style={{ color: C.dark }}>
          Popular in your area
        </h4>
        <div className="flex items-center gap-1.5 lg:gap-3">
          {[
            { icon: Wrench,       bg: 'bg-blue-100',   color: '#2F5FF6' },
            { icon: Zap,          bg: 'bg-yellow-100',  color: '#F59E0B' },
            { icon: PaintBucket,  bg: 'bg-purple-100',  color: '#7C3AED' },
            { icon: FlaskConical, bg: 'bg-cyan-100',    color: '#0891B2' },
          ].map(({ icon: Icon, bg, color }, i) => (
            <button key={i}
              className={`flex h-7 w-7 lg:h-10 lg:w-10 items-center justify-center rounded-full ${bg} transition-transform hover:scale-110`}>
              <Icon size={13} strokeWidth={2} className="lg:hidden" style={{ color }} />
              <Icon size={18} strokeWidth={2} className="hidden lg:block" style={{ color }} />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
