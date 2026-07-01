import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import { listServices } from '../api/services.js';
import { resolveCatalogImage } from '../lib/catalogImage.js';
import FadeUp from '../components/ui/FadeUp.jsx';

export default function DiscoverServices() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    // Fetch a good number of services for the slider
    listServices({ limit: 8 })
      .then((data) => {
        setServices(data || []);
      })
      .catch(() => {});
  }, []);

  if (services.length === 0) return null;

  // We duplicate the services array to create a seamless infinite scroll effect
  const sliderItems = [...services, ...services, ...services];

  return (
    <section className="bg-paper py-20 md:py-32 overflow-hidden">
      <div className="container-velora mb-16">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1fr,2fr]">
          <FadeUp>
            <div className="text-xs font-bold uppercase tracking-widest text-ink/40">
              OUR SERVICES
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div>
              <h2 className="font-sans text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.05] tracking-tightest text-ink mb-6">
                Discover our services<br />
                and how we do it better.
              </h2>
              <p className="text-base text-ink/60 leading-relaxed max-w-xl">
                We help people live and work in cleaner, healthier spaces with dependable, professional cleaning always tailored to what you need.
              </p>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Infinite Marquee Slider */}
      <div className="relative w-full overflow-hidden flex items-center py-4">
        {/* Inline styles for the marquee animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes infinite-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-33.333333%)); }
          }
          .animate-infinite-scroll {
            display: flex;
            width: max-content;
            animation: infinite-scroll 35s linear infinite;
          }
          .animate-infinite-scroll:hover {
            animation-play-state: paused;
          }
        `}} />

        <div className="animate-infinite-scroll gap-6 px-6">
          {sliderItems.map((service, index) => (
            <div 
              key={`${service._id}-${index}`}
              className="w-[320px] md:w-[380px] bg-sand rounded-[2rem] flex flex-col overflow-hidden shrink-0 group border border-ink/5 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Card Image */}
              <div className="relative w-full h-48 md:h-56 overflow-hidden">
                <img 
                  src={resolveCatalogImage(service)} 
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent pointer-events-none" />
                
                {/* Rating Badge */}
                <div className="absolute top-4 left-4 bg-paper/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Star size={14} className="text-brand fill-brand" />
                  <span className="text-xs font-bold text-ink">{service.rating?.toFixed(1) || 'New'}</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 md:p-8 flex flex-col flex-1 relative bg-sand z-10 -mt-4 rounded-t-[2rem]">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">
                      {service.category?.name || 'Service'}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-ink uppercase line-clamp-1">
                      {service.name}
                    </h3>
                  </div>
                  <Link 
                    to={`/services/${service._id}`}
                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 hover:scale-110"
                    aria-label={`Explore ${service.name}`}
                  >
                    <ArrowUpRight size={20} />
                  </Link>
                </div>

                <p className="text-sm text-ink/60 line-clamp-2 leading-relaxed flex-1">
                  {service.description || 'Professional, detail-oriented service for spaces that deserve better.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
