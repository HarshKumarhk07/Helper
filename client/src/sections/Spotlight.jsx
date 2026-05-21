import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listCategories } from '../api/categories.js';

export default function Spotlight() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories({ isActive: true })
      .then((categories) => {
        const cardData = categories.map((cat) => {
          const bgColor = cat.color || '#1a1a1a';
          const isDarkBg = parseInt(bgColor.replace('#', ''), 16) < 0xffffff / 2;
          return {
            bgColor,
            text: isDarkBg ? 'text-paper' : 'text-ink',
            title: cat.name,
            subtitle: cat.description || null,
            cta: 'Book now',
            ctaCls: 'bg-paper text-ink hover:bg-paper/90',
            to: `/services?cat=${cat.slug}`,
            image: cat.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
            imageAlt: cat.name,
          };
        });
        setCards(cardData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-paper pt-0 pb-20 md:pt-0 md:pb-24">
      <div className="container-velora">
        <FadeUp>
          <h2 className="heading-display text-2xl md:text-3xl lg:text-4xl text-ink mb-8">
            In the spotlight
          </h2>
        </FadeUp>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-56 md:h-60 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {cards.map((c, i) => (
              <FadeUp key={c.to} delay={i * 0.05} className="h-full">
                <Link
                  to={c.to}
                  className={`group relative flex flex-col sm:block h-[260px] sm:h-56 md:h-60 rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-500`}
                  style={{ backgroundColor: c.bgColor }}
                >
                  <div className="relative w-full h-32 shrink-0 sm:hidden overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.imageAlt}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                    />
                  </div>

                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    aria-hidden
                    className="hidden sm:block absolute inset-y-0 right-0 h-full w-[58%] object-cover opacity-90 transition-transform duration-[1.2s] group-hover:scale-110"
                  />
                  <div
                    aria-hidden
                    className="hidden sm:block absolute inset-y-0 left-0 w-[60%]"
                    style={{
                      backgroundColor: c.bgColor,
                      WebkitMaskImage:
                        'linear-gradient(to right, #000 75%, transparent 100%)',
                      maskImage:
                        'linear-gradient(to right, #000 75%, transparent 100%)',
                    }}
                  />

                  <div className="relative z-10 flex flex-1 flex-col justify-between p-3.5 sm:p-5 md:p-6 sm:h-full sm:w-[60%]">
                    <div>
                      <h3
                        className={`${c.text} text-[13px] sm:text-[15px] md:text-[17px] font-semibold leading-snug tracking-tight line-clamp-3`}
                      >
                        {c.title}
                      </h3>
                      {c.subtitle && (
                        <p
                          className={`mt-1 text-[11px] sm:text-xs md:text-[13px] ${c.text} opacity-80 leading-snug line-clamp-2`}
                        >
                          {c.subtitle}
                        </p>
                      )}
                    </div>

                    {c.cta && (
                      <span
                        className={`mt-3 inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 transition-colors duration-300 ${c.ctaCls}`}
                      >
                        {c.cta}
                      </span>
                    )}
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
