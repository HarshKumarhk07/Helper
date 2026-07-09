import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, ShieldCheck, UserCircle2, ArrowRight, ArrowUpRight, Sparkles, Clock, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios.js';
import { getCategory } from '../api/categories.js';
import { listServices } from '../api/services.js';
import { formatPrice, getWorkerName, getWorkerAvatar } from '../lib/booking.js';
import { mediaUrl } from '../lib/catalogImage.js';
import FadeUp from '../components/ui/FadeUp.jsx';
import ServiceCard from '../components/services/ServiceCard.jsx';

export default function CategoryDetail() {
  const { slug } = useParams();

  if (slug === 'car-trips') {
    return <Navigate to="/trips" replace />;
  }

  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch Category details by slug
    getCategory(slug)
      .then(async (cat) => {
        setCategory(cat);
        
        // Fetch services in this category
        const svcs = await listServices({ category: cat._id, active: 'true' });
        setServices(svcs);

        // Fetch workers offering services in this category
        const { data } = await api.get('/users/workers', { params: { category: cat._id } });
        setWorkers(data.workers || []);
      })
      .catch((err) => {
        console.error('Error loading category detail:', err);
        toast.error('Failed to load category details');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand/20 py-24 flex items-center justify-center">
        <div className="container-velora space-y-8">
          <div className="skeleton h-16 w-1/3 rounded-2xl mx-auto" />
          <div className="skeleton h-6 w-1/2 rounded-xl mx-auto" />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 mt-12">
            <div className="skeleton h-64 rounded-3xl" />
            <div className="skeleton h-64 rounded-3xl" />
            <div className="skeleton h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-sand/20 py-24 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-ink mb-2">Category Not Found</h2>
        <p className="text-ink/60 mb-6">The category you are looking for does not exist or has been removed.</p>
        <Link to="/services" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper hover:opacity-90">
          Browse all services
        </Link>
      </div>
    );
  }

  const categoryColor = category.color || '#13294B';

  return (
    <div className="bg-paper text-ink min-h-screen">
      {/* Category Hero Section */}
      <section className="relative overflow-hidden py-10 sm:py-12 md:py-16 border-b border-ink/5" style={{ backgroundColor: `${categoryColor}06` }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            backgroundImage: `radial-gradient(60rem 60rem at 12% 0%, ${categoryColor}12, transparent 65%), radial-gradient(50rem 50rem at 100% 100%, ${categoryColor}0A, transparent 60%)`,
          }}
        />
        
        <div className="container-velora relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 max-w-2xl"
            >
              <span 
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm mb-6"
                style={{ borderColor: `${categoryColor}30`, color: categoryColor, backgroundColor: '#ffffff' }}
              >
                <Sparkles size={12} style={{ color: categoryColor }} />
                Category Overview
              </span>
              
              <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.05] tracking-tightest">
                Professional <br />
                <span className="font-semibold" style={{ color: categoryColor }}>{category.name} Services</span>
              </h1>
              
              <p className="mt-4 text-base font-medium leading-relaxed text-ink/75">
                {category.description || `Explore our high-quality, trusted ${category.name.toLowerCase()} services tailored to perfectly fit your home or office needs.`}
              </p>
            </motion.div>

            {/* Right Image Card (Opaque & Sharp on all screens, stacks below text on mobile) */}
            {category.image && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-5 mt-8 lg:mt-0"
              >
                <div className="relative aspect-[16/9] lg:aspect-[4/3] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-ink/10 shadow-lg bg-paper">
                  <img 
                    src={mediaUrl(category.image)} 
                    alt={category.name} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent pointer-events-none" />
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </section>


      {/* Services List Section */}
      <section className="container-velora py-16 md:py-24">
        <FadeUp>
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                AVAILABLE EXPERTISE
              </div>
              <h2 className="font-sans text-3xl md:text-4xl font-semibold tracking-tightest text-ink">
                Choose a Service
              </h2>
            </div>
            <p className="text-sm text-ink/60 max-w-xs leading-relaxed">
              Book directly or request custom pricing. Vetted professionals ready in under 60 minutes.
            </p>
          </div>
        </FadeUp>

        {services.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {services.map((svc, i) => (
              <FadeUp key={svc._id} delay={i * 0.05}>
                <ServiceCard service={svc} />
              </FadeUp>
            ))}
          </div>
        ) : (
          <FadeUp>
            <div className="bg-sand rounded-[2rem] p-12 text-center border border-dashed border-ink/20">
              <p className="text-ink/60">No services have been listed under this category yet. Check back soon!</p>
            </div>
          </FadeUp>
        )}
      </section>

      {/* Professionals Section */}
      {workers.length > 0 && (
        <section className="bg-sand/35 py-16 md:py-24">
          <div className="container-velora">
            <FadeUp>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                VETTED EXPERTS
              </div>
              <h2 className="font-sans text-3xl md:text-4xl font-semibold tracking-tightest text-ink mb-12">
                Top Professionals
              </h2>
            </FadeUp>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {workers.map((w, i) => {
                const workerName = getWorkerName(w);
                const workerAvatar = getWorkerAvatar(w);
                return (
                  <FadeUp key={w._id} delay={i * 0.05}>
                    <div className="bg-paper rounded-[2rem] p-6 border border-ink/5 flex flex-col justify-between items-center text-center h-full hover:shadow-xl transition-all duration-300">
                      
                      {/* Top content */}
                      <div className="flex flex-col items-center w-full">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-brand/20 shrink-0">
                          {workerAvatar ? (
                            <img src={workerAvatar} alt={workerName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-ink/5 flex items-center justify-center">
                              <UserCircle2 size={40} className="text-ink/20" />
                            </div>
                          )}
                        </div>
                        
                        {w.isRecommended && (
                          <div className="text-[10px] uppercase tracking-widest font-bold text-brand bg-brand/10 px-3 py-1 rounded-full mb-3 shrink-0">
                            Highly Rated
                          </div>
                        )}
                        
                        <h4 className="text-base font-bold text-ink mb-1 line-clamp-1">
                          {workerName}
                        </h4>
                        
                        {w.phone && (
                          <p className="text-xs text-ink/55 mb-2">{w.phone}</p>
                        )}
                        
                        <div className="flex items-center justify-center gap-1 mb-4">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={13} 
                              className={idx < Math.round(w.ratingAvg || w.displayRating || 4.5) ? "text-brand fill-brand" : "text-ink/10"} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Bottom stats and link to first service */}
                      <div className="w-full mt-auto space-y-3">
                        <div className="text-[11px] font-semibold text-ink/70 bg-sand px-3 py-1.5 rounded-full w-full">
                          {w.experienceYears ? `${w.experienceYears}y experience` : 'Verified Provider'}
                        </div>
                        
                        {/* Book direct redirects to booking flow with this worker */}
                        {services.length > 0 && (
                          <Link
                            to={`/book/${services[0]._id}?worker=${w._id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full w-full bg-ink text-paper py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-brand hover:text-ink shadow-sm"
                          >
                            Book direct
                            <ArrowUpRight size={13} strokeWidth={2.5} />
                          </Link>
                        )}
                      </div>

                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
