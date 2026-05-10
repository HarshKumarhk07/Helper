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
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => select('all')}
        className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest font-bold transition ${
          active === 'all'
            ? 'border-ink bg-ink text-paper'
            : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() => select(c.slug)}
          className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest font-bold transition ${
            active === c.slug
              ? 'border-ink bg-ink text-paper'
              : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
