import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listServices } from '../api/services.js';
import ServiceCard from '../components/services/ServiceCard.jsx';

export default function FeaturedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    listServices({ active: 'true', featured: 'true' })
      .then((items) => setServices(items))
      .catch(() => toast.error('Failed to load featured services'))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 330; // width of card + gap
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!loading && services.length === 0) return null;

  return (
    <section className="relative bg-sand py-20 md:py-28">
      <div className="container-velora">
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                  Most booked
                </span>
                <span className="h-px w-10 bg-ink/15" />
              </div>
              <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl text-ink leading-tight">
                Featured <span className="italic font-serif text-[#13294B]">services</span>
              </h2>
              <p className="mt-3 text-ink/55 max-w-lg">
                Hand-picked services delivered by background-verified professionals near you.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink transition group"
            >
              See all services
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </FadeUp>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Left Scroll Button */}
            <button
              onClick={() => scroll('left')}
              className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-paper text-ink shadow-lg border border-ink/5 hover:scale-105 hover:bg-sand transition-all"
              title="Scroll left"
            >
              <ChevronLeft size={20} className="text-[#13294B]" />
            </button>

            {/* Horizontal Scrollable container */}
            <div
              ref={containerRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-4"
            >
              {services.map((svc, i) => (
                <div key={svc._id} className="w-[280px] sm:w-[310px] shrink-0 snap-start h-full">
                  <ServiceCard service={svc} />
                </div>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scroll('right')}
              className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-paper text-ink shadow-lg border border-ink/5 hover:scale-105 hover:bg-sand transition-all"
              title="Scroll right"
            >
              <ChevronRight size={20} className="text-[#13294B]" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
