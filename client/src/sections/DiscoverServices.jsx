import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import { listServices } from '../api/services.js';
import { resolveCatalogImage } from '../lib/catalogImage.js';
import FadeUp from '../components/ui/FadeUp.jsx';

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
                  src={getCustomServiceImage(service) || resolveCatalogImage(service)} 
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
