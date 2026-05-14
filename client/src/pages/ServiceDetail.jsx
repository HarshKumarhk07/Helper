import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Clock, ArrowUpRight, ShoppingCart, ShieldCheck } from 'lucide-react';
import { getService } from '../api/services.js';
import { formatPrice } from '../lib/booking.js';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { resolveCatalogImage } from '../lib/catalogImage.js';
import { motion } from 'framer-motion';

export default function ServiceDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
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

  const handleAddToCart = () => {
    addToCart({
      _id: service._id,
      kind: 'service',
      name: service.name,
      price: service.price,
      image: resolveCatalogImage(service),
    });
  };

  if (loading) {
    return (
      <section className="container-velora bg-sand pt-28 pb-16 lg:pt-32 lg:pb-20">
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
      <section className="container-velora bg-sand pt-32 pb-20 text-center">
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

  return (
    <section className="bg-sand pt-24 pb-16 lg:pt-28 lg:pb-20">
      <div className="container-velora">
        
        <FadeUp>
          <Link to="/services" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-ink/50 hover:text-ink transition-colors mb-12">
            ← Back to catalog
          </Link>
        </FadeUp>

        <div className="grid gap-16 lg:grid-cols-[1.2fr,1fr] items-center">
          
          {/* Image Section */}
          <FadeUp>
            <div className="relative rounded-[3rem] overflow-hidden bg-paper shadow-2xl aspect-[4/5] group">
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={resolveCatalogImage(service)}
                alt={service.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-ink/10 rounded-[3rem] pointer-events-none"></div>
              
              {/* Floating Quality Badge */}
              <div className="absolute bottom-8 left-8 bg-paper/90 backdrop-blur-xl px-4 py-2 rounded-full border border-paper/40 shadow-xl flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-ink">Velora Certified</span>
              </div>
            </div>
          </FadeUp>

          {/* Details Section */}
          <FadeUp delay={0.1}>
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-[1px] w-8 bg-ink/20"></div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50">
                  {service.category?.name || 'Signature Service'}
                </div>
              </div>
              
              <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-ink leading-tight mb-6">
                {service.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-ink/70 mb-10 pb-10 border-b border-ink/10">
                <span className="inline-flex items-center gap-2 bg-paper px-4 py-2 rounded-full shadow-sm">
                  <Star size={16} className={service.rating ? "text-yellow-500 fill-yellow-500" : "text-ink/30"} /> 
                  {service.rating?.toFixed(1) || 'New'} ({service.ratingCount || 0} reviews)
                </span>
                <span className="inline-flex items-center gap-2 bg-paper px-4 py-2 rounded-full shadow-sm">
                  <Clock size={16} className="text-ink/50" /> 
                  {service.durationMinutes} minutes
                </span>
              </div>

              <div className="space-y-4 mb-12">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink/40">The Experience</h3>
                <p className="text-base leading-relaxed text-ink/80 font-light">
                  {service.description ||
                    'A premium service delivered by vetted Velora professionals. Transparent pricing, on-time arrival, and a 100% satisfaction guarantee ensuring your home remains a sanctuary.'}
                </p>
              </div>

              <div className="flex items-end gap-4 mb-12">
                <div className="text-4xl lg:text-5xl font-medium tracking-tight text-ink">
                  {formatPrice(service.price)}
                </div>
                <span className="text-xs uppercase tracking-widest font-bold text-ink/40 mb-2">Base Rate</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={startBooking}
                  className="pill-btn !bg-ink !text-paper hover:!bg-ink/80 flex-1 justify-center py-4 text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Book this service <ArrowUpRight size={18} />
                </button>
                <button 
                  onClick={handleAddToCart}
                  className="pill-btn !bg-paper !text-ink border-ink/10 hover:!bg-sand flex-1 justify-center py-4 text-sm shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  Add to cart <ShoppingCart size={18} />
                </button>
              </div>
              
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}