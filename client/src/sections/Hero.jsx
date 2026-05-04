import { ArrowUpRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import PillButton from '../components/ui/PillButton.jsx';

const HERO_IMAGE =
  'https://picsum.photos/seed/urban-service-hero/1600/1000';

export default function Hero() {
  return (
    <section className="bg-paper dark:bg-[#0E0E10]">
      <div className="container-velora pt-16 md:pt-24">
        <FadeUp className="text-center">
          <h1 className="heading-display mx-auto max-w-5xl text-4xl leading-[0.98] sm:text-6xl md:text-7xl lg:text-[88px] dark:text-paper">
            THE URBAN SERVICE
            <br />
            COLLECTION
          </h1>
        </FadeUp>

        <FadeUp delay={0.1} className="mt-8 flex flex-wrap justify-center gap-3">
          <PillButton to="/services">Book Services</PillButton>
          <PillButton to="/services?cat=home-services">Browse Categories</PillButton>
        </FadeUp>
      </div>

      <div className="container-velora mt-12 md:mt-16">
        <FadeUp delay={0.15}>
          <div className="card-rounded relative aspect-[16/10] w-full">
            <img
              src={HERO_IMAGE}
              alt="Urban heritage hero"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="overlay-info">
              <p className="text-sm leading-relaxed">
                Urban service delivery for modern homes — from deep cleaning and beauty
                visits to appliance repair and everyday essentials, with visible imagery
                and fast booking built in.
              </p>
              <a
                href="#categories"
                className="mt-4 inline-flex items-center gap-2 border-b border-paper/40 pb-1 text-sm tracking-tightish text-paper/90 hover:border-paper"
              >
                Explore the Collection
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
