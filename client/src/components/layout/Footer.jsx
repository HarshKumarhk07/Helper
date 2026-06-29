import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCategories } from '../../api/categories.js';
import { listProductCategories } from '../../api/productCategories.js';

export default function Footer() {
  const year = new Date().getFullYear();
  const [serviceCats, setServiceCats] = useState([]);
  const [productCats, setProductCats] = useState([]);

  // Pull a few real categories so footer links always reflect the current
  // catalog instead of hardcoded labels that drift when categories change.
  useEffect(() => {
    listCategories({ active: 'true' })
      .then((cats) => setServiceCats((cats || []).slice(0, 4)))
      .catch(() => {});
    listProductCategories({ active: 'true' })
      .then((cats) => setProductCats((cats || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-ink/5 bg-sand pt-20 pb-10 text-ink">
      <div className="container-velora grid gap-12 md:grid-cols-4 md:gap-8">

        <div className="col-span-1 md:col-span-1 pr-4">
          <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-70 transition">
            <div className="h-8 w-8 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-lg">H</div>
            <div className="text-sm font-semibold tracking-[0.2em] uppercase">HELPER</div>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-ink/60 font-light">
            Premium service, commerce, and workforce operations for modern homes.
            Designed with elegance, built for scale.
          </p>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Shop</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li>
              <Link to="/products" className="hover:text-ink transition-colors w-max inline-block">
                All Products
              </Link>
            </li>
            {productCats.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/products?category=${encodeURIComponent(c.name)}`}
                  className="hover:text-ink transition-colors w-max inline-block"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Services</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li>
              <Link to="/services" className="hover:text-ink transition-colors w-max inline-block">
                All Services
              </Link>
            </li>
            {serviceCats.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/services?cat=${c.slug}`}
                  className="hover:text-ink transition-colors w-max inline-block"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Studio</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li>
              <Link to="/#philosophy" className="hover:text-ink transition-colors w-max inline-block">
                Our Philosophy
              </Link>
            </li>
            <li>
              <Link to="/me/support" className="hover:text-ink transition-colors w-max inline-block">
                Help | Support
              </Link>
            </li>
            <li>
              <a
                href="mailto:support@helper.com"
                className="hover:text-ink transition-colors w-max inline-block"
              >
                Contact Us
              </a>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-ink transition-colors w-max inline-block">
                Saved Items
              </Link>
            </li>
          </ul>
        </div>

      </div>

      <div className="container-velora mt-20">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 md:flex-row">
          <span className="text-xs text-ink/50 font-medium uppercase tracking-widest">
            © {year} Helper — Unified Operations
          </span>
          <span className="text-xs text-ink/40 font-medium tracking-wide">
            Powered by advanced tracking | seamless booking.
          </span>
        </div>
      </div>
    </footer>
  );
}
