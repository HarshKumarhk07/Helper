import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, Star, CheckCircle2, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { getService, getServiceWorkers, getServiceReviews } from '../api/services.js';
import { formatPrice } from '../lib/booking.js';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';

export default function ServiceDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getService(id),
      getServiceWorkers(id).catch(() => []),
      getServiceReviews(id).catch(() => [])
    ])
      .then(([svc, wrkrs, revs]) => {
        setService(svc);
        setWorkers(wrkrs);
        setReviews(revs);
      })
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
      <section className="container-velora bg-paper pt-6 pb-16 lg:pt-8 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <SkeletonCard />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/4 rounded-full" />
            <div className="skeleton h-16 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-1/2 rounded-full mt-10" />
            <div className="skeleton h-4 w-2/3 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="container-velora bg-paper pt-8 pb-20 text-center">
        <h1 className="heading-display text-4xl text-ink">Service not found.</h1>
        <p className="mt-3 text-sm text-ink/65">
          It may have been removed or never existed.
        </p>
        <Link
          to="/services"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:opacity-90"
        >
          Browse the catalog
        </Link>
      </section>
    );
  }

  const coverImage = service.coverImage || resolveCatalogImage(service);

  return (
    <div className="bg-paper flex flex-col min-h-screen">
      
      {/* ── Hero Section (Navy Blue) ── */}
      <section className="bg-ink text-paper pt-36 pb-20 md:pt-40 md:pb-28 rounded-b-[3rem] -mt-24 relative z-10">
        <div className="container-velora flex flex-col items-center text-center mb-16 md:mb-24">
          
          <FadeUp>
            <div className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">
              {service.category?.name || 'SIGNATURE SERVICE'}
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="font-sans text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-tightest mb-6 max-w-4xl">
              {service.name}
            </h1>
            <p className="text-base md:text-lg font-normal text-paper/70 leading-relaxed max-w-2xl mx-auto mb-10">
              {service.description || 'Consistent, safe, and detail-focused cleaning that makes your space feel lighter, fresher, and fully yours again.'}
            </p>
          </FadeUp>

          <FadeUp delay={0.2} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/services"
              className="rounded-full border border-paper/20 px-8 py-4 text-sm font-semibold hover:bg-paper/10 transition-colors"
            >
              Go back to services
            </Link>
            <button 
              onClick={startBooking}
              className="inline-flex items-center gap-3 rounded-full bg-brand px-8 py-4 text-sm font-bold text-ink transition duration-300 hover:bg-brand-dark"
            >
              <span>Book service — {formatPrice(service.price)}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper shrink-0">
                <ArrowUpRight size={15} strokeWidth={2.5} />
              </span>
            </button>
          </FadeUp>
          
        </div>

        {/* ── Full Width Cover Image ── */}
        <div className="container-velora relative z-20 px-4 md:px-8">
          <FadeUp delay={0.3}>
            <div className="w-full h-64 md:h-[500px] overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-paper bg-paper">
              <img 
                src={coverImage} 
                alt={service.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE }}
              />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── What's Included Section ── */}
      <section className="container-velora py-24 md:py-32">
        <FadeUp>
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                NO SPOT LEFT BEHIND
              </div>
              <h2 className="font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[1.05] tracking-tightest text-ink max-w-xl">
                What's included in this service
              </h2>
            </div>
            <p className="text-base text-ink/60 max-w-xs md:text-right leading-relaxed">
              Everything we clean, organize, and refresh, so your space feels brand new again.
            </p>
          </div>
        </FadeUp>

        {service.includedItems && service.includedItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {service.includedItems.map((item, idx) => (
              <FadeUp key={idx} delay={idx * 0.1}>
                <div className="bg-sand rounded-[2rem] p-6 h-full flex flex-col gap-6">
                  {item.image && (
                    <div className="w-full h-40 overflow-hidden rounded-2xl">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-ink mb-2">{item.title}</h3>
                    <p className="text-sm text-ink/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        ) : (
          <FadeUp>
            <div className="bg-sand rounded-[2rem] p-12 text-center border border-dashed border-ink/20">
              <p className="text-ink/50">Admin has not added specific inclusions for this service yet.</p>
            </div>
          </FadeUp>
        )}
      </section>

      {/* ── Worker Profiles ── */}
      {workers && workers.length > 0 && (
        <section className="bg-sand py-24 md:py-32">
          <div className="container-velora">
            <FadeUp>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                OUR PROFESSIONALS
              </div>
              <h2 className="font-sans text-3xl md:text-5xl font-normal tracking-tightest text-ink mb-12">
                Who will be working
              </h2>
            </FadeUp>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {workers.map((ws, i) => (
                <FadeUp key={ws._id} delay={i * 0.1}>
                  <div className="bg-paper rounded-3xl p-6 border border-ink/5 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-brand/20">
                      {ws.worker?.avatar ? (
                        <img src={ws.worker.avatar} alt={ws.worker?.name || 'Worker'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-ink/5 flex items-center justify-center">
                          <UserCircle2 size={40} className="text-ink/20" />
                        </div>
                      )}
                    </div>
                    {ws.worker?.isRecommended && (
                      <div className="text-[10px] uppercase tracking-widest font-bold text-brand bg-brand/10 px-3 py-1 rounded-full mb-3">
                        Best Service Provider
                      </div>
                    )}
                    <h4 className="text-lg font-bold text-ink mb-1">
                      {ws.worker?.name || 'Worker'}
                    </h4>
                    {ws.worker?.phone && (
                      <p className="text-sm text-ink/60 mb-2">{ws.worker.phone}</p>
                    )}
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          size={14} 
                          className={idx < Math.round(ws.worker?.ratingAvg || 0) ? "text-brand fill-brand" : "text-ink/10"} 
                        />
                      ))}
                    </div>
                    {ws.pricingType === 'fixed' && ws.amount > 0 && (
                      <div className="text-sm font-medium text-ink bg-sand px-3 py-1.5 rounded-full w-full">
                        Charges {formatPrice(ws.amount)}
                      </div>
                    )}
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── User Feedback ── */}
      <section className="container-velora py-24 md:py-32">
        <FadeUp>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            REAL EXPERIENCES
          </div>
          <h2 className="font-sans text-3xl md:text-5xl font-normal tracking-tightest text-ink mb-12">
            What our clients say
          </h2>
        </FadeUp>

        {reviews && reviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, idx) => (
              <FadeUp key={review._id} delay={idx * 0.1}>
                <div className="bg-paper rounded-3xl p-8 border border-ink/10 h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < review.rating ? "text-brand fill-brand" : "text-ink/10"} />
                      ))}
                    </div>
                    <p className="text-ink/80 text-sm leading-relaxed mb-6 italic">
                      "{review.comment}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {review.user?.avatar ? (
                      <img src={review.user.avatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
                        <UserCircle2 size={20} className="text-ink/30" />
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-bold text-ink">{review.user?.name || 'User'}</h5>
                      {review.booking?.worker && (
                        <p className="text-xs text-ink/50">
                          Serviced by {review.booking.worker.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        ) : (
          <FadeUp>
            <div className="bg-sand rounded-[2rem] p-12 text-center border border-dashed border-ink/20">
              <p className="text-ink/50">No reviews for this service yet. Be the first to try it!</p>
            </div>
          </FadeUp>
        )}
      </section>
      
    </div>
  );
}