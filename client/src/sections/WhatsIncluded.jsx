import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listCategories } from '../api/categories.js';
import { mediaUrl, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';

// Fallback imagery + copy if a category has no image / while loading.
const FALLBACK = [
  { name: 'Home Cleaning', description: 'Dusting, vacuuming, mopping', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kitchen & Appliances', description: 'Countertops, stove top, exterior appliances', img: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=600&q=80' },
  { name: 'Bathroom & Fixtures', description: 'Toilet, sink, floor, tile, mirror, faucet cleaning', img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80' },
  { name: 'Windows & Glasses', description: 'Interior windows, glass partitions, all kinds of mirrors', img: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80' },
];

const onImgError = (e) => {
  if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE) e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
};

export default function WhatsIncluded() {
  const [cards, setCards] = useState(FALLBACK);

  useEffect(() => {
    listCategories({ active: 'true' })
      .then((cats) => {
        const top = (cats || []).slice(0, 4);
        if (top.length) {
          setCards(
            top.map((c, i) => ({
              name: c.name,
              slug: c.slug,
              description: c.description || FALLBACK[i % FALLBACK.length].description,
              img: mediaUrl(c.image) || FALLBACK[i % FALLBACK.length].img,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-sand">
      <div className="container-velora py-16 md:py-24">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/40">
          Nothing left behind
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tightest text-ink">
            What's included
            <br />
            in our services
          </h2>
          <p className="text-base leading-relaxed text-ink/60">
            Everything we clean, organize, and refresh — so your space feels brand new again.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <FadeUp key={c.slug || c.name} delay={Math.min(i * 0.05, 0.2)}>
              <Link
                to={c.slug ? `/services?cat=${c.slug}` : '/services'}
                className="group block overflow-hidden rounded-[22px] border border-ink/10 bg-paper transition hover:shadow-card"
              >
                <div className="overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.name}
                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={onImgError}
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold text-ink">{c.name}</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/55">{c.description}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
