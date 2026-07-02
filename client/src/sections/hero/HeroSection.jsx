import HeroLeft from './HeroLeft';
import HeroRight from './HeroRight';
import StatsBar from './StatsBar';

const C = {
  bg: '#13294B',
};

export default function HeroSection() {
  return (
    <div style={{ backgroundColor: C.bg }} className="w-full overflow-x-hidden -mt-24">
      {/* Outer section holds the top part of the hero */}
      <section className="relative w-full overflow-hidden">
        {/* Content container — sits below the fixed navbar */}
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 pt-24 pb-12 lg:pt-36 lg:pb-20">
          <div className="grid gap-8 lg:grid-cols-[55%_45%] lg:gap-12 items-start lg:items-center">
            <HeroLeft />
            <HeroRight />
          </div>
        </div>
      </section>

      {/* Stats bar overlaps the bottom of the hero and sits completely on the same #F7F8FA background */}
      <div className="pb-16 md:pb-24">
        <StatsBar />
      </div>
    </div>
  );
}
