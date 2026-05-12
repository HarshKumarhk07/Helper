import { Link } from 'react-router-dom';
import { Star, ArrowRight, Clock } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

const FEATURED = [
  {
    title: 'AC Service & Repair',
    blurb: 'Foam-jet deep clean by certified technicians',
    image:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80',
    rating: 4.88,
    reviews: '24.5K',
    price: 699,
    mrp: 999,
    duration: '60–90 min',
    slug: 'appliance-services',
    tag: 'Bestseller',
  },
  {
    title: 'Full Home Deep Cleaning',
    blurb: 'Kitchen, bath, floors, dusting — all in one visit',
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    reviews: '32K',
    price: 2499,
    mrp: 3499,
    duration: '4–5 hrs',
    slug: 'cleaning-services',
    tag: 'Most Booked',
  },
  {
    title: 'Haircut & Beard Grooming',
    blurb: 'Salon-quality styling at your home',
    image:
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80',
    rating: 4.85,
    reviews: '18.9K',
    price: 249,
    mrp: 349,
    duration: '30 min',
    slug: 'beauty-wellness',
    tag: 'New',
  },
  {
    title: 'Electrician — Switch & Wiring',
    blurb: 'Trusted pros for repairs, installation & fittings',
    image:
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80',
    rating: 4.82,
    reviews: '12.4K',
    price: 199,
    mrp: 299,
    duration: '30–45 min',
    slug: 'home-services',
    tag: 'Trusted',
  },
];

function discountPct(price, mrp) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export default function FeaturedServices() {
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
                Hand-picked services delivered by background-verified
                professionals near you.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {FEATURED.map((svc, i) => {
            const disc = discountPct(svc.price, svc.mrp);
            return (
              <FadeUp key={svc.title} delay={i * 0.05}>
                <div className="group h-full flex flex-col rounded-2xl bg-paper border border-ink/8 overflow-hidden shadow-soft hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-500">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-ash/40">
                    <img
                      src={svc.image}
                      alt={svc.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.07]"
                    />
                    {/* Tag */}
                    {svc.tag && (
                      <span className="absolute top-3 left-3 rounded-full bg-paper/95 backdrop-blur px-3 py-1 text-[11px] font-semibold tracking-wide text-ink shadow-sm">
                        {svc.tag}
                      </span>
                    )}
                    {/* Discount */}
                    {disc != null && (
                      <span className="absolute top-3 right-3 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm">
                        {disc}% OFF
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-base font-semibold text-ink tracking-tight line-clamp-1">
                      {svc.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink/55 line-clamp-2 leading-relaxed">
                      {svc.blurb}
                    </p>

                    {/* Rating + duration */}
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                        <Star size={12} className="fill-emerald-600 text-emerald-600" />
                        {svc.rating}
                      </span>
                      <span className="text-ink/45">({svc.reviews})</span>
                      <span className="inline-flex items-center gap-1 text-ink/50">
                        <Clock size={12} /> {svc.duration}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="mt-5 pt-4 border-t border-ink/8 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-ink leading-none">
                          ₹{svc.price.toLocaleString('en-IN')}
                        </div>
                        {svc.mrp > svc.price && (
                          <div className="mt-1 text-xs text-ink/40 line-through">
                            ₹{svc.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/services?cat=${svc.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper text-xs font-semibold px-4 py-2.5 hover:bg-[#6f5cff] transition-all duration-300 hover:translate-x-0.5"
                      >
                        Book now <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
