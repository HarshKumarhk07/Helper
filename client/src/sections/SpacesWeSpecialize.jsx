import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  Utensils, 
  Heart, 
  Baby, 
  Leaf, 
  Fan, 
  Wind, 
  Wrench, 
  Zap, 
  Sparkles, 
  Droplets,
  Hammer,
  Paintbrush
} from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

/* ── Card data ── */
const SERVICES_LIST = [
  { icon: Utensils, title: 'Utensils cleaning', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLQExiMy0xbTowGZcP0LIJr67JayabswnbUZIGmR6sKZ4oL2t_7m8P0z7R&s=10' },
  { icon: Heart, title: 'Pet care', img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=300&h=300' },
  { icon: Baby, title: 'Childcare', img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=300&h=300' },
  { icon: Leaf, title: 'Gardener', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjmZI_oTEs9rFP5bvJXfmUQelaey5qWtaF3gBRxmABRQ&s=10' },
  { icon: Fan, title: 'AC service', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300&h=300' },
  { icon: Wind, title: 'Cooler cleaning', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-iMoUvCxEIgYTCorCtddNlu3ep5Gwz-X-SjYWdzLIeA&s=10' },
  { icon: Wrench, title: 'Plumber', img: 'https://t4.ftcdn.net/jpg/01/99/81/11/360_F_199811106_Td5Yi9Jbua2w3pUslZoK8EpUxFlPISvc.jpg' },
  { icon: Zap, title: 'Electrician', img: 'https://img.magnific.com/free-photo/man-electrical-technician-working-switchboard-with-fuses_169016-24062.jpg?semt=ais_hybrid&w=740&q=80' },
  { icon: Sparkles, title: 'Deep Cleaning', img: 'https://img.magnific.com/free-photo/man-doing-professional-home-cleaning-service_23-2150359025.jpg?semt=ais_hybrid&w=740&q=80' },
  { icon: Droplets, title: 'Car Washing', img: 'https://img.magnific.com/free-photo/professional-washer-blue-uniform-washing-luxury-car-with-water-gun-open-air-car-wash_496169-333.jpg' },
  { icon: Hammer, title: 'Carpenter', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyuXM7ZRTdg2AnwGytkdkpyK7mN8czrcqGmuQ06p8BItVeY_VkL-IVh6g&s=10' },
  { icon: Paintbrush, title: 'Painting', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUqSQumj2Ue05o3dyeDsCpAb_Icyr-xgEoQgXJHh_cg-n_k13K4STeAAg&s=10' },
];

export default function SpacesWeSpecialize() {
  return (
    <section className="bg-[#FAFBFB]">
      <div className="container-velora py-16 md:py-24">
        {/* ── Top row: heading + CTA ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <FadeUp>
            <div>
              {/* Label */}
              <div className="mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                  What we do
                </span>
              </div>

              {/* Heading */}
              <h2 className="font-sans text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tightest text-ink">
                Services we
                <br />
                specialize in
              </h2>

              {/* Subtext */}
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/60">
                From everyday chores to specialized repairs, we provide 
                <br className="hidden sm:block" />
                over 100+ professional services to keep your
                <br className="hidden sm:block" />
                home and workspace running perfectly.
              </p>
            </div>
          </FadeUp>

          {/* CTA button — aligned bottom-right */}
          <FadeUp delay={0.1}>
            <Link
              to="/services"
              className="inline-flex items-center gap-3 rounded-full bg-brand px-7 py-4 text-sm font-bold text-ink transition duration-300 hover:bg-brand-dark shadow-sm self-end"
            >
              <span>Explore all services</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper shrink-0">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </span>
            </Link>
          </FadeUp>
        </div>

        {/* ── Services Grid (Premium Vertical Cards) ── */}
        <div className="mt-14 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 md:gap-5">
          {SERVICES_LIST.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.04}>
              <Link 
                to={`/services?q=${encodeURIComponent(s.title)}`} 
                className="flex flex-col bg-white border border-slate-100 rounded-2xl p-1.5 sm:p-2.5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_30px_rgba(19,41,75,0.06)] hover:border-[#13294B]/10 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image frame */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-1.5 sm:mb-2.5 bg-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback image in case Unsplash fails to load
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=300&h=300';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-60" />
                </div>
                
                {/* Title block */}
                <div className="w-full text-center py-1 sm:py-1.5 bg-slate-50 rounded-lg border border-slate-100 transition-colors duration-300 group-hover:bg-[#E8F5F1] group-hover:border-[#C6E8DB] flex items-center justify-center min-h-[32px] sm:min-h-[40px]">
                  <span className="text-[8px] xs:text-[9.5px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-[#103D2E] px-0.5 block whitespace-normal leading-tight text-center">
                    {s.title}
                  </span>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
