import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, Star, CheckCircle2, UserCircle2, Target, Shield, ShieldCheck, Home, Clock, Bug, Zap, Wrench, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ServiceDetailHero from '../sections/services/ServiceDetailHero.jsx';

import { getService, getServiceWorkers, getServiceReviews } from '../api/services.js';
import { formatPrice } from '../lib/booking.js';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';

const getCustomServiceImage = (service) => {
  const name = String(service?.name || '').toLowerCase();
  const cat = String(service?.category?.name || '').toLowerCase();
  const slug = String(service?.category?.slug || '').toLowerCase();

  // Custom image synchronization matching SpacesWeSpecialize.jsx exactly
  if (name.includes('utensil') || name.includes('dish') || name.includes('plate')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLQExiMy0xbTowGZcP0LIJr67JayabswnbUZIGmR6sKZ4oL2t_7m8P0z7R&s=10';
  }
  if (name.includes('pet') || name.includes('dog') || name.includes('cat') || slug.includes('pet')) {
    return 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=300&h=300';
  }
  if (name.includes('child') || name.includes('baby') || name.includes('nanny') || name.includes('tuition') || name.includes('class') || name.includes('coaching') || name.includes('education') || name.includes('school')) {
    return 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=300&h=300';
  }
  if (name.includes('garden') || name.includes('lawn') || name.includes('plant') || name.includes('tree') || name.includes('gardener')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjmZI_oTEs9rFP5bvJXfmUQelaey5qWtaF3gBRxmABRQ&s=10';
  }
  if (name.includes('cooler')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-iMoUvCxEIgYTCorCtddNlu3ep5Gwz-X-SjYWdzLIeA&s=10';
  }
  if (name.includes('ac ') || name.includes('air cond') || name.startsWith('ac') || name.includes('appliance') || slug.includes('appliance')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300&h=300';
  }
  if (name.includes('plumb') || name.includes('leak') || name.includes('tap') || name.includes('pipe') || name.includes('tank') || name.includes('drain')) {
    return 'https://t4.ftcdn.net/jpg/01/99/81/11/360_F_199811106_Td5Yi9Jbua2w3pUslZoK8EpUxFlPISvc.jpg';
  }
  if (name.includes('electric') || name.includes('wiring') || name.includes('fuse') || name.includes('switch') || name.includes('fan') || name.includes('cctv')) {
    return 'https://img.magnific.com/free-photo/man-electrical-technician-working-switchboard-with-fuses_169016-24062.jpg?semt=ais_hybrid&w=740&q=80';
  }
  if (name.includes('deep cleaning') || name.includes('clean') || name.includes('sofa') || name.includes('carpet') || name.includes('pest') || name.includes('control') || name.includes('bug') || name.includes('cockroach') || name.includes('termite') || name.includes('mosquito') || slug.includes('cleaning')) {
    return 'https://img.magnific.com/free-photo/man-doing-professional-home-cleaning-service_23-2150359025.jpg?semt=ais_hybrid&w=740&q=80';
  }
  if (name.includes('car wash') || name.includes('wash') || name.includes('detail') || name.includes('vehicle') || slug.includes('car')) {
    return 'https://img.magnific.com/free-photo/professional-washer-blue-uniform-washing-luxury-car-with-water-gun-open-air-car-wash_496169-333.jpg';
  }
  if (name.includes('carpent') || name.includes('furniture') || name.includes('wood') || name.includes('door') || name.includes('lock') || name.includes('shift') || name.includes('relocat') || name.includes('pack') || name.includes('move') || slug.includes('packers')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyuXM7ZRTdg2AnwGytkdkpyK7mN8czrcqGmuQ06p8BItVeY_VkL-IVh6g&s=10';
  }
  if (name.includes('paint') || name.includes('waterproof') || name.includes('texture') || slug.includes('painting')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUqSQumj2Ue05o3dyeDsCpAb_Icyr-xgEoQgXJHh_cg-n_k13K4STeAAg&s=10';
  }

  return '';
};

const getServiceMetadata = (svcName, categoryName) => {
  const nameLower = (svcName || '').toLowerCase();
  
  const avatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80&h=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80&h=80',
  ];

  const firstSpaceIdx = svcName.indexOf(' ');
  let titlePrimary = svcName;
  let titleAccent = '';
  if (firstSpaceIdx > 0) {
    titlePrimary = svcName.substring(0, firstSpaceIdx);
    titleAccent = svcName.substring(firstSpaceIdx + 1);
  }

  if (nameLower.includes('pest control')) {
    return {
      categoryLabel: categoryName || 'Cleaning & Pest Control',
      categoryIcon: <ShieldCheck />,
      titlePrimary: 'Pest',
      titleAccent: 'Control',
      features: [
        { icon: <Target />, label: 'Targeted Treatment' },
        { icon: <ShieldCheck />, label: 'Safe & Eco-friendly' },
        { icon: <Home />, label: 'Indoor & Outdoor' },
        { icon: <Clock />, label: 'Long Lasting Protection' },
      ],
      trustCards: {
        topRight: { icon: <Shield />, title: 'Safe for Families & Pets', subtext: 'Non-toxic & eco-friendly solutions' },
        bottomLeft: { icon: <Bug />, title: 'Effective on All Pests', subtext: 'Mosquitoes, ants, cockroaches, termites & more' },
      },
      avatars,
    };
  }

  if (nameLower.includes('home cleaning') || nameLower.includes('deep cleaning')) {
    return {
      categoryLabel: categoryName || 'Cleaning & Pest Control',
      categoryIcon: <Sparkles />,
      titlePrimary: 'Home',
      titleAccent: 'Cleaning',
      features: [
        { icon: <Sparkles />, label: 'Deep Sanitisation' },
        { icon: <ShieldCheck />, label: 'Verified Cleaners' },
        { icon: <Home />, label: 'Complete Dusting' },
        { icon: <Clock />, label: 'Flexible Booking' },
      ],
      trustCards: {
        topRight: { icon: <Shield />, title: 'Fully Bonded & Insured', subtext: 'Complete safety peace-of-mind' },
        bottomLeft: { icon: <Sparkles />, title: 'Premium Cleaning Agent', subtext: '100% biodegradable eco-materials' },
      },
      avatars,
    };
  }

  if (nameLower.includes('ac repair') || nameLower.includes('air conditioning')) {
    return {
      categoryLabel: categoryName || 'Appliance Repair',
      categoryIcon: <Zap />,
      titlePrimary: 'AC Repair',
      titleAccent: '& Service',
      features: [
        { icon: <Zap />, label: 'Cooling Diagnosis' },
        { icon: <ShieldCheck />, label: 'Certified Techs' },
        { icon: <Home />, label: 'Filter Cleaning' },
        { icon: <Clock />, label: 'Same-day Service' },
      ],
      trustCards: {
        topRight: { icon: <Shield />, title: 'Cooling Performance', subtext: 'Full gas-charge and coil service' },
        bottomLeft: { icon: <Zap />, title: 'Energy Savings', subtext: 'Optimize system for lower bills' },
      },
      avatars,
    };
  }

  if (nameLower.includes('electrician') || nameLower.includes('electrical')) {
    return {
      categoryLabel: categoryName || 'Home Repair & Maintenance',
      categoryIcon: <Wrench />,
      titlePrimary: 'Certified',
      titleAccent: 'Electrician',
      features: [
        { icon: <Zap />, label: 'Wiring Check' },
        { icon: <ShieldCheck />, label: 'Safety First' },
        { icon: <Wrench />, label: 'Expert Fixing' },
        { icon: <Clock />, label: 'Quick Turnaround' },
      ],
      trustCards: {
        topRight: { icon: <Shield />, title: 'Certified Electricians', subtext: '100% background verified experts' },
        bottomLeft: { icon: <Zap />, title: 'Complete Safety Check', subtext: 'Advanced surge & wiring diagnostic' },
      },
      avatars,
    };
  }

  if (nameLower.includes('plumber') || nameLower.includes('plumbing')) {
    return {
      categoryLabel: categoryName || 'Home Repair & Maintenance',
      categoryIcon: <Wrench />,
      titlePrimary: 'Professional',
      titleAccent: 'Plumber',
      features: [
        { icon: <Wrench />, label: 'Leak Detection' },
        { icon: <ShieldCheck />, label: 'Guaranteed Fit' },
        { icon: <Home />, label: 'Pipe Sealing' },
        { icon: <Clock />, label: 'On-time Arrival' },
      ],
      trustCards: {
        topRight: { icon: <Shield />, title: 'Leak-free Guarantee', subtext: 'Premium plumbing materials used' },
        bottomLeft: { icon: <Wrench />, title: 'Full Bathroom Support', subtext: 'Tap, sink & pipe replacements' },
      },
      avatars,
    };
  }

  return {
    categoryLabel: categoryName || 'Signature Service',
    categoryIcon: <Sparkles />,
    titlePrimary,
    titleAccent,
    features: [
      { icon: <ShieldCheck />, label: 'Verified Professionals' },
      { icon: <Clock />, label: 'On-Time Arrival' },
      { icon: <Home />, label: 'Premium Quality' },
      { icon: <Zap />, label: 'Same-Day Service' },
    ],
    trustCards: {
      topRight: { icon: <Shield />, title: 'Quality Guarantee', subtext: '100% satisfaction promised' },
      bottomLeft: { icon: <Sparkles />, title: 'Premium Services', subtext: 'High-grade eco-friendly tools & methods' },
    },
    avatars,
  };
};

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

  const coverImage = getCustomServiceImage(service) || service.coverImage || resolveCatalogImage(service);

  return (
    <div className="bg-paper flex flex-col min-h-screen">
      
      {/* ── Custom Dynamic Service Hero Section ── */}
      <ServiceDetailHero
        categoryLabel={getServiceMetadata(service.name, service.category?.name).categoryLabel}
        categoryIcon={getServiceMetadata(service.name, service.category?.name).categoryIcon}
        titlePrimary={getServiceMetadata(service.name, service.category?.name).titlePrimary}
        titleAccent={getServiceMetadata(service.name, service.category?.name).titleAccent}
        description={service.description || 'Consistent, safe, and detail-focused cleaning that makes your space feel lighter, fresher, and fully yours again.'}
        features={getServiceMetadata(service.name, service.category?.name).features}
        price={service.price}
        coverImage={coverImage}
        trustCards={getServiceMetadata(service.name, service.category?.name).trustCards}
        avatars={getServiceMetadata(service.name, service.category?.name).avatars}
        onBook={startBooking}
        backLinkHref="/services"
      />

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