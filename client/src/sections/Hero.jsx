import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import PillButton from '../components/ui/PillButton.jsx';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

export default function Hero() {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-ink">
      {/* Background Image with Cinematic Dark Overlay */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      >
        <img
          src={HERO_IMAGE}
          alt="Premium home services"
          className="h-full w-full object-cover"
        />
        {/* Deep luxurious dark overlay */}
        <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-transparent"></div>
      </motion.div>

      <div className="container-velora relative z-10 pt-40 pb-20 flex flex-col items-center text-center">
        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md shadow-2xl mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse"></span>
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-paper/90">Premium Lifestyle Services</span>
        </motion.div>

        {/* Hero Typography */}
        <FadeUp delay={0.3}>
          <h1 className="heading-display mx-auto max-w-5xl text-5xl sm:text-6xl md:text-7xl lg:text-[80px] xl:text-[90px] text-paper leading-[1.1] drop-shadow-xl">
            THE URBAN SERVICE
            <br />
            <span className="italic font-serif tracking-normal text-paper/90">Collection</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.4} className="mt-8 max-w-2xl mx-auto">
          <p className="text-base md:text-lg text-paper/70 leading-relaxed font-light tracking-wide">
            Elevate your lifestyle with our curated selection of premium home services. 
            From expert grooming to meticulous living spaces, experience excellence in every detail.
          </p>
        </FadeUp>

        {/* Call to Actions */}
        <FadeUp delay={0.5} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
          <PillButton 
            to="/services" 
            className="!bg-paper !text-ink hover:!bg-paper/90 !border-none !px-8 !py-4 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] !text-sm !font-semibold"
          >
            Book the Collection
          </PillButton>
          <PillButton 
            to="/services?cat=home-services"
            className="!border-paper/40 !text-paper hover:!bg-paper hover:!text-ink !px-8 !py-4 backdrop-blur-sm !text-sm"
          >
            Explore Categories
          </PillButton>
        </FadeUp>

      </div>

      {/* Floating Info Element - Pinned to bottom right */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
        className="hidden md:block absolute bottom-8 right-8 lg:bottom-12 lg:right-12 z-20 w-64 p-6 rounded-[2rem] border border-paper/10 bg-ink/40 backdrop-blur-xl text-left shadow-2xl"
      >
        <p className="text-xs leading-relaxed text-paper/80 font-light tracking-wide mb-4">
          Curated excellence and seamless service delivery for the modern home.
        </p>
        <a
          href="#categories"
          className="inline-flex items-center gap-2 border-b border-paper/30 pb-1 text-[10px] tracking-[0.2em] uppercase font-bold text-paper hover:border-paper transition-colors group"
        >
          Discover More
          <ArrowUpRight size={14} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
