import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Clock, ArrowUpRight } from 'lucide-react';
import { getService } from '../api/services.js';
import { formatPrice } from '../lib/booking.js';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FALLBACK_IMG =
  'https://picsum.photos/seed/service-detail-fallback/1200/1600';

export default function ServiceDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getService(id)
      .then(setService)
      .catch(() => toast.error('Service not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const startBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${id}` } });
      return;
    }
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <section className="container-velora py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <SkeletonCard />
          <div className="space-y-3">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="container-velora py-24 text-center">
        <h1 className="heading-display text-3xl">Service not found.</h1>
        <PillButton to="/services" className="mt-6">
          Back to catalog
        </PillButton>
      </section>
    );
  }

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <Link to="/services" className="text-xs uppercase tracking-widest text-ink/60 hover:underline dark:text-paper/50">
          ← Back to catalog
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr,1fr]">
          <FadeUp>
            <div className="card-rounded">
              <img
                src={service.image || FALLBACK_IMG}
                alt={service.name}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <div>
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                {service.category?.name}
              </div>
              <h1 className="heading-display mt-2 text-4xl md:text-5xl">{service.name}</h1>

              <div className="mt-4 flex items-center gap-4 text-xs text-ink/70 dark:text-paper/60">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} /> {service.rating?.toFixed(1) || '—'} ({service.ratingCount || 0})
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> {service.durationMinutes} min
                </span>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/80 dark:text-paper/70">
                {service.description ||
                  'A premium service delivered by vetted Velora professionals. Transparent pricing, on-time arrival, and a 100% satisfaction guarantee.'}
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="text-3xl">{formatPrice(service.price)}</div>
                <span className="text-xs text-ink/60 dark:text-paper/50">starting price</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <PillButton variant="solid" onClick={startBooking}>
                  Book now <ArrowUpRight size={14} />
                </PillButton>
                <PillButton to="/services">Continue browsing</PillButton>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
