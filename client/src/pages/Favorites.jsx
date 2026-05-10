import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Favorites() {
  const { favorites } = useFavorites();

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              (Favorites)
            </div>
            <h1 className="heading-display mt-3 text-4xl md:text-6xl text-paper dark:text-paper">YOUR SAVED PRODUCTS</h1>
          </div>
          <PillButton to="/">Continue browsing</PillButton>
        </div>

        {favorites.length === 0 ? (
          <div className="mt-12 rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70 dark:border-paper/10 dark:text-paper/60">
            No favorites saved yet. Tap the heart on a product to save it here.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}