import { useFavorites } from '../context/FavoritesContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ServiceCard from '../components/services/ServiceCard.jsx';

const isServiceFavorite = (item) => item?.kind === 'service' || item?.durationMinutes != null;

export default function Favorites() {
  const { favorites } = useFavorites();

  const serviceFavorites = favorites.filter(isServiceFavorite);
  const productFavorites = favorites.filter((item) => !isServiceFavorite(item));

  return (
    <section className="bg-paper py-16">
      <div className="container-velora">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60">
              (Favorites)
            </div>
            <h1 className="heading-display mt-3 text-4xl md:text-6xl text-ink">YOUR SAVED ITEMS</h1>
          </div>
          <PillButton to="/">Continue browsing</PillButton>
        </div>

        {favorites.length === 0 ? (
          <div className="mt-12 rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70">
            No favorites saved yet. Tap the heart on a service or product to save it here.
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {serviceFavorites.length > 0 && (
              <div>
                <div className="mb-4 text-xs uppercase tracking-widest text-ink/50">Saved services</div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceFavorites.map((service) => (
                    <ServiceCard key={service._id} service={service} />
                  ))}
                </div>
              </div>
            )}
            {productFavorites.length > 0 && (
              <div>
                <div className="mb-4 text-xs uppercase tracking-widest text-ink/50">Saved products</div>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {productFavorites.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}