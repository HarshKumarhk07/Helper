import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const HERO_IMG = '/hero.avif';
const CARD_IMG = '/hero2.avif';

// Real trust avatars.
const AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100',
];

export default function HeroCleaning() {
  return (
    // Full-screen image hero. -mt-24 pulls it under the fixed navbar so the
    // white island floats on top of the image.
    <section className="relative -mt-24 h-screen min-h-[640px] overflow-hidden bg-ink text-paper">
      {/* Background image */}
      <img
        src={HERO_IMG}
        alt="Professional cleaning in action"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Legibility overlays: darker on the left for the headline. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-ink/15" />

      <div className="container-velora relative z-10 flex h-full flex-col pt-28 pb-10 md:pt-32">
        <div className="grid flex-1 gap-10 lg:grid-cols-[1.5fr_minmax(0,400px)]">

          {/* Left column: heading near top, paragraph at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col justify-between"
          >
            {/* Top group: trusted badge + heading */}
            <div className="pt-4">
              {/* Trusted-by text + avatars */}
              <div className="mb-5 flex items-center gap-3">
                <span className="text-xs font-medium text-paper/90 tracking-tightish">
                  Trusted by 200+ businesses &rarr;
                </span>
                <div className="flex -space-x-1.5">
                  {AVATARS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-5 w-5 rounded-full border border-paper/60 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ))}
                </div>
              </div>

              <h1 className="font-sans text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tightest">
                Clean space
                <br />
                starts here
              </h1>
            </div>

            {/* Bottom group: paragraph pinned near bottom */}
            <p className="max-w-md text-base leading-relaxed text-paper/85 pb-4">
              Professional cleaning services for offices, homes,
              <br />
              and commercial spaces - done right, every time.
            </p>
          </motion.div>

          {/* Right: floating quote card — pushed up with self-start + top padding */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="w-full justify-self-center self-start pt-6 lg:justify-self-end max-w-[380px]"
          >
            <div className="overflow-hidden rounded-[20px] border border-[#9da86e]/60 bg-ink/50 p-3 shadow-2xl backdrop-blur-md">
              {/* Card image — top portion */}
              <img
                src={CARD_IMG}
                alt="A freshly cleaned room"
                className="h-44 w-full rounded-[14px] object-cover"
              />

              {/* Discount text */}
              <div className="space-y-1.5 px-2 pt-4 pb-1 text-[13px] font-medium text-paper/90 tracking-tightish">
                <div>* 16% discount for first time user</div>
                <div>* 28% discount for repeating clients</div>
              </div>

              {/* Explore services button */}
              <Link
                to="/services"
                className="mt-4 flex items-center justify-between gap-3 rounded-full bg-brand px-5 py-3 text-sm font-bold text-ink transition duration-300 hover:bg-brand-dark"
              >
                <span>Explore the services ...</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper shrink-0">
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
