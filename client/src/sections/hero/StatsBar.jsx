import { motion, useReducedMotion } from 'framer-motion';
import { Gift, UserCheck, Star, MapPin } from 'lucide-react';

const C = {
  blue: '#13294B',
  dark: '#0B0F19',
  gray: '#6B7280',
  green: '#16A34A',
  star: '#FACC15',
  border: '#E5E7EB',
};

const STATS = [
  {
    icon: Gift,
    value: '12K+',
    label: 'Bookings Completed',
    iconBg: '#DBEAFE',
    iconColor: C.blue,
  },
  {
    icon: UserCheck,
    value: '500+',
    label: 'Verified Professionals',
    iconBg: '#DCFCE7',
    iconColor: C.green,
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Average Rating',
    iconBg: '#FEF9C3',
    iconColor: C.star,
  },
  {
    icon: MapPin,
    value: '50+',
    label: 'Cities Covered',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
];

export default function StatsBar() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      id="stats-bar"
      initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
      whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[1400px] px-6 md:px-10 -mt-6 relative z-20"
    >
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden shadow-lg"
        style={{ backgroundColor: C.border, border: `1px solid ${C.border}` }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 bg-white px-3 py-4 sm:px-5 sm:py-5 lg:gap-4 lg:px-8 lg:py-6"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: stat.iconBg }}
            >
              <stat.icon size={22} strokeWidth={2} style={{ color: stat.iconColor }} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-extrabold sm:text-xl lg:text-2xl" style={{ color: C.dark }}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm truncate" style={{ color: C.gray }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
