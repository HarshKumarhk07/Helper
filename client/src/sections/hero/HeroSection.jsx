import HeroLeft from './HeroLeft';
import HeroRight from './HeroRight';
import StatsBar from './StatsBar';
import SearchBar from './SearchBar';
import TrustStrip from './TrustStrip';

const C = {
  bg: '#13294B',
};

export default function HeroSection() {
  return (
    <div style={{ backgroundColor: C.bg }} className="w-full overflow-x-hidden -mt-24">
      
      {/* ── DESKTOP HERO VIEW ONLY (lg:block) ── */}
      <div className="hidden lg:block">
        <section className="relative w-full overflow-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-10 pt-36 pb-20">
            <div className="grid grid-cols-[55%_45%] gap-12 items-center">
              <HeroLeft />
              <HeroRight />
            </div>
          </div>
        </section>
        <div className="pb-24">
          <StatsBar />
        </div>
      </div>

      {/* ── MOBILE/TABLET HERO VIEW ONLY (lg:hidden) ── */}
      <div className="lg:hidden flex flex-col pt-[60px] pb-12">
        
        {/* Lady Image Container + Overlapping SearchCard (Full Width Screen!) */}
        <div className="relative w-full mb-[12.5rem] h-[480px] sm:h-[520px]">
          
          {/* Cleaner Photo */}
          <div className="absolute inset-0 overflow-hidden shadow-lg">
            <img
              src="/assets/cleaner_lady_living_room.png"
              alt="Professional Home Cleaner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Subtle light gradient for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/20 to-transparent pointer-events-none z-10" />

          {/* Absolute Heading and Description Overlaid on the Image */}
          <div className="absolute top-8 left-6 right-6 z-10 select-none">
            <h1 className="font-sans text-[clamp(2.1rem,7.5vw,3.2rem)] font-extrabold leading-[1.0] tracking-tightest text-[#13294B] text-left">
              <span>Reliable home</span>
              <br />
              <span>services, </span>
              <span style={{ color: '#F5C518' }}>just a</span>
              <br />
              <span style={{ color: '#F5C518' }}>few clicks away.</span>
            </h1>
            <p className="mt-3 max-w-[80%] text-[13px] font-semibold leading-relaxed text-[#334155] text-left">
              Book trusted professionals for all your home needs.
              Fast, reliable and hassle-free.
            </p>
          </div>

          {/* Overlapping Search Card */}
          <div className="absolute left-4 right-4 -bottom-[11.5rem] z-20">
            <SearchBar />
          </div>
        </div>

        {/* 3. Bottom Content with padding */}
        <div className="px-6 flex flex-col">
          {/* Stats / Trust Strip */}
          <div className="mt-2 mb-2">
            <TrustStrip />
          </div>
        </div>

      </div>

    </div>
  );
}
