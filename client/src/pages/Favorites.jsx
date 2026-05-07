import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              (Favorites)
            </div>
            <h1 className="heading-display mt-3 text-4xl md:text-6xl">YOUR SAVED PRODUCTS</h1>
          </div>
          <PillButton to="/">Continue browsing</PillButton>
        </div>

        {favorites.length === 0 ? (
          <div className="mt-12 rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70 dark:border-paper/10 dark:text-paper/60">
            No favorites saved yet. Tap the heart on a product to save it here.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((product) => (
              <div key={product._id} className="card-rounded group flex h-full flex-col overflow-hidden">
                <Link to={`/products/${product._id}`} className="overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
                <div className="space-y-2 p-4">
                  <div className="text-sm line-clamp-1">{product.name}</div>
                  <div className="text-xs text-ink/60 dark:text-paper/50">₹{product.price}</div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product)}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 transition hover:text-ink dark:text-paper/50 dark:hover:text-paper"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}