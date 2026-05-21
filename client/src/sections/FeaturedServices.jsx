import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listServices } from '../api/services.js';
import ServiceCard from '../components/services/ServiceCard.jsx';

export default function FeaturedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listServices({ active: 'true', featured: 'true' })
      .then((items) => setServices(items.slice(0, 4)))
      .catch(() => toast.error('Failed to load featured services'))
      .finally(() => setLoading(false));
  }, []);

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
                Featured <span className="italic font-serif text-[#6f5cff]">services</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {services.map((svc, i) => (
              <FadeUp key={svc._id} delay={i * 0.05} className="h-full">
                <ServiceCard service={svc} />
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
