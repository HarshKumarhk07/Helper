import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import { listProductCategories } from '../api/productCategories.js';

const DUMMY_CATEGORIES = [
  {
    _id: '1',
    name: 'Tools & Hardware',
    productCount: 1,
    image: 'https://images.unsplash.com/photo-1540104539506-613b8dd0630b?auto=format&fit=crop&q=80&w=400',
  },
  {
    _id: '2',
    name: 'Electrical Supplies',
    productCount: 0,
    image: 'https://images.unsplash.com/photo-1621905252507-b35492f0502e?auto=format&fit=crop&q=80&w=400',
  },
  {
    _id: '3',
    name: 'Plumbing Supplies',
    productCount: 0,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
  },
  {
    _id: '4',
    name: 'Smart Home & Security',
    productCount: 0,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=400',
  },
  {
    _id: '5',
    name: 'Paint & Home Improvement',
    productCount: 0,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
  }
];

export default function ShopCollection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listProductCategories()
      .then((data) => {
        setCategories(data && data.length > 0 ? data : DUMMY_CATEGORIES);
      })
      .catch(() => {
        setCategories(DUMMY_CATEGORIES);
      });
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="bg-paper py-16 md:py-24 overflow-hidden">
      <div className="container-velora">
        
        {/* Header */}
        <div className="mb-10">
          <FadeUp>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
                SHOP RETAIL
              </span>
              <span className="h-px w-10 bg-ink/15" />
            </div>
          </FadeUp>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <FadeUp delay={0.1}>
              <h2 className="leading-[1.1] tracking-tight text-ink uppercase">
                <span className="block font-sans text-3xl md:text-5xl font-bold">SHOP THE</span>
                <span className="block font-serif text-4xl md:text-6xl italic text-ink/30 normal-case -mt-1 md:-mt-2">Collection</span>
              </h2>
            </FadeUp>
            
            <FadeUp delay={0.2}>
              <Link 
                to="/products"
                className="inline-flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest text-ink hover:opacity-70 transition-opacity"
              >
                VIEW FULL CATALOG
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </Link>
            </FadeUp>
          </div>
        </div>

        {/* Horizontal Scroll Area */}
        <FadeUp delay={0.3}>
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 gap-4 md:gap-5 snap-x snap-mandatory hide-scrollbar">
            {categories.map((category, index) => {
              // Alternate dark backgrounds for dummy data to match screenshot aesthetic
              const isDark = index === 1; 

              return (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className={`relative flex-shrink-0 w-[180px] md:w-[220px] h-[240px] md:h-[280px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group snap-start border border-ink/5 ${
                    isDark ? 'bg-ink' : 'bg-sand'
                  }`}
                >
                  <img 
                    src={category.image || category.coverImage || 'https://images.unsplash.com/photo-1540104539506-613b8dd0630b?auto=format&fit=crop&q=80&w=400'}
                    alt={category.name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isDark ? 'opacity-80' : 'opacity-100'}`}
                  />
                  
                  {/* Gradient to make text readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent pointer-events-none" />
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-paper/70 mb-1">
                      {category.productCount || 0} ITEMS
                    </span>
                    <h3 className="text-lg md:text-xl font-medium text-paper leading-tight">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </FadeUp>

        {/* Add some custom CSS to hide the scrollbar but keep functionality */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
        
      </div>
    </section>
  );
}
