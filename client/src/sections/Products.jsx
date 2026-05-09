import FadeUp from '../components/ui/FadeUp.jsx';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const PRODUCT_CATEGORIES = [
  {
    title: 'Cleaning Essentials',
    count: '24 items',
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    title: 'Beauty & Skincare',
    count: '36 items',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    title: 'Smart Home Devices',
    count: '12 items',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    title: 'Luxury Decor',
    count: '18 items',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
];

export default function Products() {
  return (
    <section className="bg-sand py-24 md:py-32 relative">
      <div className="container-velora">
        
        <FadeUp>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/40">
                  Shop Retail
                </span>
                <div className="h-[1px] w-12 bg-ink/20"></div>
              </div>
              <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                SHOP THE <br />
                <span className="text-ink/30 italic font-serif tracking-normal">Collection</span>
              </h2>
            </div>
            
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-ink hover:text-ink/60 transition-colors group pb-2 border-b border-ink/20 hover:border-ink/60"
            >
              View Full Catalog
              <ArrowUpRight size={16} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </FadeUp>

        {/* Product Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {PRODUCT_CATEGORIES.map((cat, i) => (
            <FadeUp key={cat.title} delay={i * 0.1}>
              <Link to={cat.link} className="group block w-full h-full cursor-pointer relative overflow-hidden rounded-[2rem] bg-paper shadow-sm transition-all duration-700 hover:shadow-2xl">
                
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                  
                  {/* Category Text overlay */}
                  <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-xs font-bold text-paper/70 uppercase tracking-widest mb-1">{cat.count}</p>
                    <h3 className="text-xl font-medium text-paper tracking-tight">{cat.title}</h3>
                  </div>
                </div>

              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
