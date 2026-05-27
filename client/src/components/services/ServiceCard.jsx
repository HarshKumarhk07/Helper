import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Heart, BadgeCheck, Flame, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../lib/booking.js';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../../lib/catalogImage.js';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function ServiceCard({ service }) {
  const image = resolveCatalogImage(service);
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const isFavorited = favorites.some((fav) => fav._id === service._id);
  const isPopular = (service.ratingCount || 0) >= 50;
  const isFeatured = service.isFeatured;

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ ...service, kind: 'service' });
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id: service._id,
      kind: 'service',
      name: service.name,
      price: service.price,
      image,
    });
  };

  return (
    <div className="group flex flex-col h-full w-full max-w-full min-w-0 cursor-pointer bg-paper rounded-[1.5rem] p-2.5 sm:p-3 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-ink/5 hover:border-ink/10 overflow-hidden">
      {/* Image container — overflow-hidden keeps every badge clipped inside */}
      <div
        className="block relative w-full overflow-hidden rounded-[1rem] bg-sand aspect-[4/5]"
        onClick={() => navigate(`/services/${service._id}`)}
      >
        <img
          src={image}
          alt={service.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Inline SVG placeholder — no remote fetch, no CORB risk.
            if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE) {
              e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
            }
          }}
          className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
        />

        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500"></div>

        {/* Top-left Badges — compact on mobile so they never reach the heart */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 max-w-[60%]" style={{ zIndex: 10 }}>
          {isFeatured && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide sm:tracking-widest text-white shadow-sm">
              <BadgeCheck size={10} /> Featured
            </span>
          )}
          {isPopular && !isFeatured && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide sm:tracking-widest text-white shadow-sm">
              <Flame size={10} /> Popular
            </span>
          )}
        </div>

        {/* Heart Button */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white hover:shadow-md transition-all hover:scale-110 flex items-center justify-center text-ink/70"
          style={{ zIndex: 10 }}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            className={`transition-colors duration-300 ${isFavorited ? 'fill-red-500 text-red-500' : 'hover:text-red-400'}`}
            strokeWidth={isFavorited ? 2 : 1.5}
          />
        </button>

        {/* Floating duration badge — pinned inside the image at bottom-left.
            Rating star removed per spec; duration alone reads cleanly. */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center text-paper text-[10px] font-medium tracking-wide max-w-[calc(100%-16px)]">
          <div className="inline-flex min-w-0 items-center gap-1 bg-ink/45 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full border border-paper/20 truncate">
            <Clock size={11} className="text-paper/90 shrink-0" />
            <span className="truncate">{service.durationMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Service Info — min-w-0 lets long names truncate instead of forcing
          the card wider than its grid cell on narrow screens. */}
      <div className="mt-3 sm:mt-4 px-1 flex flex-col flex-1 min-w-0" onClick={() => navigate(`/services/${service._id}`)}>
        <div className="flex-1 min-w-0 group/title">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] font-extrabold text-ink/50 mb-1 truncate">
            {service.category?.name || 'Service'}
          </div>
          <h3 className="text-[14px] sm:text-base font-semibold text-ink line-clamp-2 leading-tight min-h-[2.4em] transition-colors group-hover/title:text-[#6f5cff]">
            {service.name}
          </h3>
        </div>

        {/* Bottom: Price + Actions — stacks on mobile so nothing overlaps.
            The button row is w-full so flex-1 actually expands the Book CTA
            instead of leaking past the card edge. */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ink/5 flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-medium mb-0.5">Price</span>
            <span className="text-sm sm:text-lg font-bold text-ink truncate">{formatPrice(service.price)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Add to cart"
              title="Add to cart"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-all duration-300 hover:bg-ink hover:text-paper"
            >
              <ShoppingCart size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/book/${service._id}`);
              }}
              aria-label="Book"
              title="Book"
              className="flex flex-1 sm:flex-none min-w-0 items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-white bg-ink rounded-full py-2 sm:py-3 px-3 sm:px-5 whitespace-nowrap hover:bg-[#6f5cff] transition-all duration-300 hover:shadow-lg hover:shadow-[#6f5cff]/20"
            >
              {/* "Book" label is hidden on mobile (< sm) so the tight cards
                  show just the arrow instead of clipping to "OOK". Desktop
                  / tablet (≥ 640px) gets the full "Book →" label. */}
              <span className="hidden sm:inline">Book</span>
              <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
