import FloatingCards from './FloatingCards';

const BG = '#13294B';

export default function HeroRight() {
  return (
    <div className="relative w-full mt-6 h-[500px] rounded-3xl overflow-hidden lg:mt-0 lg:h-[620px] lg:overflow-visible lg:rounded-none">
      {/* Image fills the container as background */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <img
          src="/assets/hero-living-room.png"
          alt="Bright, modern living room"
          className="w-full h-full object-cover"
        />
        {/* Mobile gradient: very subtle bottom fade */}
        <div
          className="absolute inset-0 rounded-3xl lg:hidden"
          style={{
            background: `linear-gradient(to bottom, transparent 60%, ${BG}33 85%, ${BG}66 100%)`,
          }}
        />
        {/* Desktop-only fades (unchanged) */}
        <div
          className="hidden lg:block absolute inset-0 rounded-3xl"
          style={{ background: `linear-gradient(to top, ${BG}CC, ${BG}33, transparent)` }}
        />
        <div
          className="hidden lg:block absolute inset-0 rounded-3xl"
          style={{ background: `linear-gradient(to left, ${BG}66, transparent, ${BG}B3)` }}
        />
        <div
          className="hidden lg:block absolute inset-0 rounded-3xl"
          style={{ background: `linear-gradient(to bottom, ${BG}4D, transparent, transparent)` }}
        />
      </div>

      {/* Floating cards — absolute on both mobile and desktop */}
      <div className="absolute inset-0 z-10 lg:absolute lg:inset-0">
        <FloatingCards />
      </div>
    </div>
  );
}
