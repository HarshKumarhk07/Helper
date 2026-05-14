import { Link } from 'react-router-dom';
import { Star, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listServices } from '../api/services.js';
import { resolveCatalogImage } from '../lib/catalogImage.js';

export default function FeaturedServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listServices({ active: 'true', featured: 'true' })
      .then((items) => setServices(items.slice(0, 4)))
      .catch(() => toast.error('Failed to load featured services'))
      .finally(() => setLoading(false));
  }, []);

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
                <div className="group h-full flex flex-col rounded-2xl bg-paper border border-ink/8 overflow-hidden shadow-soft hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-500">
                  <div className="relative aspect-[4/3] overflow-hidden bg-ash/40 shrink-0">
                    <img
                      src={resolveCatalogImage(svc)}
                      alt={svc.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.07]"
                    />
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-full bg-paper/95 backdrop-blur px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wide text-ink shadow-sm">
                      Featured
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-3 sm:p-5">
                    <h3 className="text-[13px] sm:text-base font-semibold text-ink tracking-tight line-clamp-2 leading-snug min-h-[2.4rem] sm:min-h-[1.6rem]">
                      {svc.name}
                    </h3>
                    <p className="mt-1 text-[11px] sm:text-xs text-ink/55 line-clamp-2 leading-relaxed min-h-[2.1rem] sm:min-h-[2.4rem]">
                      {svc.description || svc.category?.name || 'Premium service'}
                    </p>

                    <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 sm:px-2 font-semibold text-emerald-700">
                        <Star size={11} className="fill-emerald-600 text-emerald-600" />
                        {svc.rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="text-ink/45">({svc.ratingCount || 0} reviews)</span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-ink/50">
                        <Clock size={12} /> {svc.durationMinutes} min
                      </span>
                    </div>

                    <div className="mt-auto pt-3 sm:pt-4 border-t border-ink/8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
                      <div>
                        <div className="text-base sm:text-lg font-semibold text-ink leading-none">
                          ₹{Number(svc.price || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <Link
                        to={`/book/${svc._id}`}
                        className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 whitespace-nowrap rounded-full bg-ink text-paper text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-[#6f5cff] transition-all duration-300 hover:translate-x-0.5"
                      >
                        Book now <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}