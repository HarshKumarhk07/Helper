import { Link } from 'react-router-dom';
import FadeUp from '../components/ui/FadeUp.jsx';

const CARDS = [
  {
    // Dark — AC service
    bg: 'bg-[#1a1a1a]',
    text: 'text-paper',
    title: 'Deep clean with foam-jet AC service',
    subtitle: 'AC service & repair',
    cta: 'Book now',
    ctaCls: 'bg-paper text-ink hover:bg-paper/90',
    to: '/services?cat=appliance-services',
    image:
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    imageAlt: 'AC repair technician',
  },
  {
    // Beige — revamp
    bg: 'bg-[#e9e2d4]',
    text: 'text-ink',
    badge: {
      label: 'New launch',
      cls: 'bg-[#6f5cff] text-paper',
    },
    title: 'revamp',
    subtitle: "Spring '26 Collection",
    chips: ['New emboss', 'New textures'],
    cta: null,
    to: '/services',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    imageAlt: 'Modern interior wall textures',
  },
  {
    // Purple — Insta help
    bg: 'bg-[#6f5cff]',
    text: 'text-paper',
    badge: {
      label: 'Insta Help 10 mins',
      cls: 'bg-emerald-400 text-ink',
    },
    title: 'Trained house help when your maid is on leave',
    subtitle: null,
    cta: 'Book now',
    ctaCls: 'bg-paper text-ink hover:bg-paper/90',
    to: '/services?cat=cleaning-services',
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    imageAlt: 'House help cooking in kitchen',
  },
  {
    // Pink — Salon at home
    bg: 'bg-[#fce4ec]',
    text: 'text-ink',
    title: 'Salon at home up to 50% off',
    subtitle: "Women's & Men's Salon",
    cta: 'Book now',
    ctaCls: 'bg-[#6f5cff] text-paper hover:bg-[#5a45ff]',
    to: '/services?cat=beauty-wellness',
    image:
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    imageAlt: 'Modern salon interior',
  },
];

export default function Spotlight() {
  return (
    <section className="bg-paper pt-6 pb-20 md:pt-10 md:pb-24">
      <div className="container-velora">
        <FadeUp>
          <h2 className="heading-display text-2xl md:text-3xl lg:text-4xl text-ink mb-8">
            In the spotlight
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {CARDS.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.05}>
              <Link
                to={c.to}
                className={`group relative block h-56 md:h-60 rounded-2xl overflow-hidden ${c.bg} shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-500`}
              >
                {/* Background image (right side, masked into the panel) */}
                <img
                  src={c.image}
                  alt={c.imageAlt}
                  loading="lazy"
                  className="absolute inset-y-0 right-0 h-full w-[58%] object-cover opacity-90 transition-transform duration-[1.2s] group-hover:scale-110"
                />
                {/* Solid panel + fade so left text stays readable */}
                <div
                  className={`absolute inset-y-0 left-0 w-[60%] ${c.bg}`}
                  style={{
                    WebkitMaskImage:
                      'linear-gradient(to right, #000 75%, transparent 100%)',
                    maskImage:
                      'linear-gradient(to right, #000 75%, transparent 100%)',
                  }}
                />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-5 md:p-6 w-[60%]">
                  <div>
                    {c.badge && (
                      <span
                        className={`inline-block ${c.badge.cls} text-[10px] md:text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-md mb-3`}
                      >
                        {c.badge.label}
                      </span>
                    )}
                    <h3
                      className={`${c.text} text-[15px] md:text-[17px] font-semibold leading-snug tracking-tight`}
                    >
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <p
                        className={`mt-1 text-xs md:text-[13px] ${c.text} opacity-80 leading-snug`}
                      >
                        {c.subtitle}
                      </p>
                    )}
                    {c.chips && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.chips.map((chip) => (
                          <span
                            key={chip}
                            className="text-[10px] md:text-[11px] font-medium px-2.5 py-1 rounded-full bg-paper/60 text-ink/70 border border-ink/8"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {c.cta && (
                    <span
                      className={`inline-flex w-fit items-center justify-center rounded-full text-xs font-semibold px-4 py-2 transition-colors duration-300 ${c.ctaCls}`}
                    >
                      {c.cta}
                    </span>
                  )}
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
