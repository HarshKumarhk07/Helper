import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listCategories } from '../api/categories.js';
import { mediaUrl } from '../lib/catalogImage.js';

const FALLBACK = [
  { name: 'Home Cleaning', description: 'For homes that deserve better' },
  { name: 'Workspace Cleaning', description: 'For growing teams & busy professionals' },
  { name: 'Store Cleaning', description: 'For shops, studios & showrooms' },
];

export default function OtherServices() {
  const [rows, setRows] = useState(FALLBACK);

  useEffect(() => {
    listCategories({ active: 'true' })
      .then((cats) => {
        const list = (cats || []).slice(0, 5);
        if (list.length) {
          setRows(
            list.map((c) => ({
              name: c.name,
              slug: c.slug,
              description: c.description || 'Trusted professionals, transparent pricing',
              image: mediaUrl(c.image),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-paper">
      <div className="container-velora py-16 md:py-24">
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-tightest text-ink">
          Other Services
        </h2>

        <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
          {rows.map((r, i) => (
            <FadeUp key={r.slug || r.name}>
              <Link
                to={r.slug ? `/services?cat=${r.slug}` : '/services'}
                className="group flex items-center gap-5 py-6 transition hover:bg-sand/40"
              >
                <span className="w-8 shrink-0 text-sm font-semibold text-ink/40">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Second row shows a rating chip, mirroring the reference. */}
                {i === 1 && (
                  <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-ink/10 bg-sand/50 px-4 py-3 sm:flex">
                    {r.image && (
                      <img src={r.image} alt="" className="h-10 w-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <div className="flex items-center gap-1 text-sm font-bold text-ink">
                        <Star size={13} className="fill-brand text-brand" /> 4.9
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-ink/50">avg rating</div>
                    </div>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-ink md:text-xl">{r.name}</div>
                  <div className="mt-0.5 text-sm text-ink/55">{r.description}</div>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition group-hover:bg-ink group-hover:text-paper">
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
