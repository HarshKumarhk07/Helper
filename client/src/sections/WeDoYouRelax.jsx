import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import { CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';

const COLS = [
  {
    n: '01',
    title: 'We handle it',
    body: 'Our vetted pros arrive on time, fully equipped, and ready to work — thoroughly and safely.',
    img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  },
  {
    n: '02',
    title: 'You relax',
    body: 'Enjoy a spotless, sorted home or workspace that looks, feels, and smells truly cared for.',
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  },
];

const onImgError = (e) => {
  if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE) e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
};

export default function WeDoYouRelax() {
  return (
    <section className="bg-paper">
      <div className="container-velora py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          {/* Two image columns */}
          <div className="grid gap-5 sm:grid-cols-2">
            {COLS.map((c) => (
              <FadeUp key={c.n}>
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-brand">{c.n}</span>
                    <span className="text-lg font-semibold text-ink">{c.title}</span>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-ink/60">{c.body}</p>
                  <div className="overflow-hidden rounded-[22px]">
                    <img
                      src={c.img}
                      alt={c.title}
                      className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                      onError={onImgError}
                    />
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Ready to get started */}
          <FadeUp delay={0.1}>
            <div className="flex h-full flex-col justify-center rounded-[22px] border border-ink/10 bg-sand/60 p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/50">
                Ready to get started?
              </div>
              <p className="mt-4 text-lg font-medium leading-relaxed text-ink">
                Simple pricing, no hidden fees — see what works for your space.
              </p>
              <Link
                to="/services"
                className="mt-6 inline-flex w-max items-center gap-2 rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-dark"
              >
                View Pricing <ArrowUpRight size={16} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
