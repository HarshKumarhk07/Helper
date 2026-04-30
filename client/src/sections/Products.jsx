import { useEffect, useState } from 'react';
import { listProducts } from '../api/products.js';
import { useCart } from '../context/CartContext.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import PillButton from '../components/ui/PillButton.jsx';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-paper py-20 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="flex items-end justify-between">
          <FadeUp>
            <h2 className="heading-display text-3xl md:text-5xl">SHOP THE COLLECTION</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <span className="hidden text-xs uppercase tracking-widest text-ink/60 sm:inline dark:text-paper/60">
              {products.length} drops
            </span>
          </FadeUp>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((p, i) => (
            <FadeUp key={p._id} delay={i * 0.06}>
              <div className="card-rounded group transition hover:-translate-y-1 hover:shadow-soft flex flex-col h-full">
                <div className="overflow-hidden flex-1">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-[4/5] w-full bg-sand flex items-center justify-center text-ink/40">
                      No Image
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-sm line-clamp-1">{p.name}</div>
                    <div className="text-xs text-ink/60 dark:text-paper/50">₹{p.price}</div>
                  </div>
                  <button 
                    onClick={() => addToCart(p)}
                    className="w-full rounded-pill border border-ink/80 bg-transparent py-2 text-xs font-medium tracking-tightish text-ink transition hover:bg-ink hover:text-paper dark:border-paper/80 dark:text-paper dark:hover:bg-paper dark:hover:text-ink"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
