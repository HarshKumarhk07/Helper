import { useSearchParams } from 'react-router-dom';

export default function CategoryChips({ categories, value, onChange }) {
  const [params] = useSearchParams();
  const active = value ?? params.get('cat') ?? 'all';

  const select = (slug) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('cat');
    else next.set('cat', slug);
    onChange?.(slug, next);
  };

  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 md:pb-0 md:flex-wrap w-full snap-x">
      <button
        type="button"
        onClick={() => select('all')}
        className={`snap-start rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap border ${
          active === 'all'
            ? 'bg-ink text-paper border-ink shadow-md scale-105'
            : 'bg-paper/50 text-ink/60 border-ink/10 hover:bg-paper hover:text-ink hover:border-ink/30 hover:shadow-sm'
        }`}
      >
        All Services
      </button>
      {categories.map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() => select(c.slug)}
          className={`snap-start rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap border ${
            active === c.slug
              ? 'bg-ink text-paper border-ink shadow-md scale-105'
              : 'bg-paper/50 text-ink/60 border-ink/10 hover:bg-paper hover:text-ink hover:border-ink/30 hover:shadow-sm'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
