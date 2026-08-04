import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, MapPin, ChevronDown, Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import LocationModal from '../location/LocationModal.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { listProducts } from '../../api/products.js';
import { listServices } from '../../api/services.js';
import { listCategories } from '../../api/categories.js';
import { mediaUrl } from '../../lib/catalogImage.js';
import { getCategoryLink } from '../../lib/navigation.js';

const NAV = [
  { to: '/services', label: 'Services', hasChevron: true },
  { to: '/categories', label: 'Categories', hasChevron: true, isCategoryDropdown: true },
  { to: '/products', label: 'Products' },
  // [CAR-TRIPS DISABLED] { to: '/trips', label: 'Car Trips' },
  { to: '/join', label: 'Become a Professional' },
  { to: '/about', label: 'About Us' },
];

// Hero-mode nav links shown only on homepage before scrolling.
// All map to existing routes — no 404 risk.
const HERO_NAV = [
  { to: '/services', label: 'Services', hasChevron: true },
  { to: '/categories', label: 'Categories', hasChevron: true, isCategoryDropdown: true },
  { to: '/products', label: 'Products' },
  // [CAR-TRIPS DISABLED] { to: '/trips', label: 'Car Trips' },
  { to: '/join', label: 'Become a Professional' },
  { to: '/about', label: 'About Us' },
];

const PANEL_BY_ROLE = {
  admin: '/admin',
  worker: '/worker',
  user: '/me',
};

const PANEL_LABEL_BY_ROLE = {
  admin: 'Admin panel',
  worker: 'Worker panel',
  user: 'My panel',
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const { favorites } = useFavorites();
  const { location, openLocationModal } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  // Active link by pathname — '/services' stays highlighted on filtered
  // (/services?cat=...) and detail (/services/:id) pages alike.
  const isNavActive = (item) => {
    const to = item.to;
    if (to === '/') return routerLocation.pathname === '/';

    const isServicePath = routerLocation.pathname === '/services' || routerLocation.pathname.startsWith('/services/');
    const hasCategoryQuery = new URLSearchParams(routerLocation.search).has('cat');

    if (item.isCategoryDropdown) {
      return routerLocation.pathname === '/categories' || routerLocation.pathname.startsWith('/categories/');
    }

    if (to === '/services') {
      return isServicePath && !hasCategoryQuery;
    }

    return (
      routerLocation.pathname === to ||
      routerLocation.pathname.startsWith(`${to}/`)
    );
  };
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingServices(true);
    listServices({ active: 'true' })
      .then((data) => {
        if (active) {
          setServices(data || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching services for dropdown:', err);
      })
      .finally(() => {
        if (active) {
          setLoadingServices(false);
        }
      });

    setLoadingCategories(true);
    listCategories({ active: 'true' })
      .then((data) => {
        if (active) {
          setCategories(data || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching categories for dropdown:', err);
      })
      .finally(() => {
        if (active) {
          setLoadingCategories(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const groupedServices = services.reduce((acc, svc) => {
    const cat = svc.category || { name: 'Other', slug: 'other' };
    const catKey = cat.name;
    if (!acc[catKey]) {
      acc[catKey] = {
        name: cat.name,
        slug: cat.slug,
        services: []
      };
    }
    acc[catKey].services.push(svc);
    return acc;
  }, {});

  const panelPath = PANEL_BY_ROLE[user?.role] || '/dashboard';
  const panelLabel = PANEL_LABEL_BY_ROLE[user?.role] || 'Dashboard';

  // White navbar with hero-specific links when on homepage and user hasn't
  // scrolled past the hero area. Threshold of 80px prevents a jarring flip
  // from a tiny accidental scroll — the headline is still fully visible at 80px.
  const isHome = routerLocation.pathname === '/';
  const heroMode = false;
  const iconCls = heroMode ? 'text-hero-dark/70 hover:text-hero-dark' : 'text-ink/80 hover:text-ink';
  const isWorkerOrAdmin = user && (user.role === 'worker' || user.role === 'admin');
  const baseLinks = heroMode ? HERO_NAV : NAV;
  const activeNavLinks = isWorkerOrAdmin
    ? baseLinks.filter((n) => n.label !== 'Become a Professional')
    : baseLinks;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const query = searchValue.trim();
        const [prodRes, services] = await Promise.all([
          listProducts({ q: query, limit: 5 }).catch(err => {
            console.error('Products fetch error:', err);
            return [];
          }),
          listServices({ q: query, limit: 5 }).catch(err => {
            console.error('Services fetch error:', err);
            return [];
          }),
        ]);

        const products = prodRes?.products || prodRes || [];

        console.log('Autocomplete results:', { products, services, query });

        const combined = [
          ...(products || []).map(p => ({ type: 'product', ...p })),
          ...(services || []).map(s => ({ type: 'service', ...s })),
        ];

        const queryLower = query.toLowerCase();
        combined.sort((a, b) => {
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          const aStarts = aName.startsWith(queryLower);
          const bStarts = bName.startsWith(queryLower);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        });

        setSuggestions(combined.slice(0, 6));
      } catch (err) {
        console.error('Autocomplete fetch failed:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchValue]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
      };
    }
  }, [open]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    navigate(`/services?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setSearchValue('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      navigate(`/products/${suggestion._id}`);
    } else {
      navigate(`/services/${suggestion._id}`);
    }
    setSearchOpen(false);
    setSearchValue('');
    setSuggestions([]);
  };

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 flex justify-center w-full ${
        heroMode
          ? 'bg-white border-b border-hero-border shadow-sm'
          : 'bg-paper border-b border-ink/10 shadow-[0_2px_15px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div
        className="w-full max-w-[1400px] py-3 md:py-4 px-3 md:px-5"
      >
        <div className="flex items-center justify-between gap-2 w-full h-full relative">
          
          {/* Logo (Left) */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center gap-1 group mr-2 md:mr-4"
          >
            <span className="transition-all">
              <img
                src="/HELPER LOGO 02.png"
                alt="Helper"
                className="w-auto object-contain transition-all h-9 md:h-12 max-w-[110px] md:max-w-[150px]"
              />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden min-w-0 items-center gap-2 xl:gap-4 lg:flex shrink-0">
            {activeNavLinks.map((n) => {
              const active = isNavActive(n);
              
              if (n.isCategoryDropdown) {
                return (
                  <div
                    key={n.label}
                    className="relative py-2"
                    onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
                    onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => navigate('/categories')}
                      className={`no-underline text-sm font-medium tracking-tightish transition-colors duration-300 relative flex items-center gap-1 bg-transparent border-0 cursor-pointer ${
                        heroMode
                          ? active ? 'text-hero-dark' : 'text-hero-dark/60 hover:text-hero-dark'
                          : active ? 'text-[#13294B]' : 'text-[#13294B]/60 hover:text-[#13294B]'
                      }`}
                    >
                      {n.label}
                      <ChevronDown
                        size={13}
                        strokeWidth={2}
                        className={`opacity-50 transition-transform duration-300 ${
                          isCategoriesDropdownOpen ? 'rotate-180 text-[#13294B]' : ''
                        }`}
                      />
                      {active && !heroMode && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#13294B]"
                        />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {isCategoriesDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 12 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-1 w-[260px] bg-paper/95 backdrop-blur-md border border-ink/10 rounded-2xl shadow-xl z-50 p-4"
                        >
                          {loadingCategories ? (
                            <div className="flex flex-col gap-2 p-2">
                              <div className="h-4 bg-ink/5 rounded w-1/2 skeleton animate-pulse" />
                              <div className="h-3 bg-ink/5 rounded w-2/3 skeleton animate-pulse" />
                            </div>
                          ) : categories.length === 0 ? (
                            <div className="text-sm text-ink/55 p-2">No categories available</div>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                              {categories.map((cat) => (
                                <Link
                                  key={cat._id}
                                  to={getCategoryLink(cat.slug)}
                                  onClick={() => setIsCategoriesDropdownOpen(false)}
                                  className="block text-xs font-semibold text-[#13294B]/80 hover:text-[#13294B] hover:translate-x-1 transition-all duration-200 py-1"
                                >
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (n.hasChevron) {
                return (
                  <div
                    key={n.label}
                    className="relative py-2"
                    onMouseEnter={() => setIsServicesDropdownOpen(true)}
                    onMouseLeave={() => setIsServicesDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(n.to)}
                      className={`no-underline text-sm font-medium tracking-tightish transition-colors duration-300 relative flex items-center gap-1 bg-transparent border-0 cursor-pointer ${
                        heroMode
                          ? active ? 'text-hero-dark' : 'text-hero-dark/60 hover:text-hero-dark'
                          : active ? 'text-[#13294B]' : 'text-[#13294B]/60 hover:text-[#13294B]'
                      }`}
                    >
                      {n.label}
                      <ChevronDown
                        size={13}
                        strokeWidth={2}
                        className={`opacity-50 transition-transform duration-300 ${
                          isServicesDropdownOpen ? 'rotate-180 text-[#13294B]' : ''
                        }`}
                      />
                      {active && !heroMode && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#13294B]"
                        />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {isServicesDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 12 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-1 w-[460px] bg-paper/95 backdrop-blur-md border border-ink/10 rounded-2xl shadow-xl z-50 p-5"
                        >
                          {loadingServices ? (
                            <div className="flex flex-col gap-2 p-2">
                              <div className="h-4 bg-ink/5 rounded w-1/3 skeleton" />
                              <div className="h-3 bg-ink/5 rounded w-2/3 skeleton" />
                              <div className="h-3 bg-ink/5 rounded w-1/2 skeleton" />
                            </div>
                          ) : services.length === 0 ? (
                            <div className="text-sm text-ink/55 p-2">No services available</div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-h-[320px] overflow-y-auto pr-1">
                                {Object.values(groupedServices).map((group) => (
                                  <div key={group.name} className="space-y-1.5 min-w-0">
                                    <Link
                                      to={getCategoryLink(group.slug)}
                                      onClick={() => setIsServicesDropdownOpen(false)}
                                      className="text-[10px] font-bold uppercase tracking-widest text-ink/50 hover:text-brand transition-colors mb-1 block truncate"
                                    >
                                      {group.name} →
                                    </Link>
                                    <ul className="space-y-1">
                                      {group.services.map((svc) => (
                                        <li key={svc._id} className="truncate">
                                          <Link
                                            to={`/services/${svc._id}`}
                                            onClick={() => setIsServicesDropdownOpen(false)}
                                            className="block text-xs font-semibold text-ink/80 hover:text-ink hover:translate-x-1 transition-all duration-200"
                                          >
                                            {svc.name}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-ink/5 mt-4 pt-3 flex justify-between items-center text-xs">
                                <Link
                                  to="/services"
                                  className="text-ink font-semibold hover:text-ink/80 transition-colors"
                                  onClick={() => setIsServicesDropdownOpen(false)}
                                >
                                  View All Services →
                                </Link>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={`no-underline text-sm font-medium tracking-tightish transition-colors duration-300 relative flex items-center gap-1 ${
                    heroMode
                      ? active ? 'text-hero-dark' : 'text-hero-dark/60 hover:text-hero-dark'
                      : active ? 'text-[#13294B]' : 'text-[#13294B]/60 hover:text-[#13294B]'
                  }`}
                >
                  {n.label}
                  {active && !heroMode && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#13294B]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>


          {/* Right Actions */}
          <div className="flex grow shrink-0 items-center justify-end gap-1.5 xl:gap-3">
            {/* Select Location */}
            <button
              type="button"
              onClick={openLocationModal}
              className={`hidden lg:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                heroMode
                  ? 'border-hero-border bg-white hover:bg-hero-bg text-hero-dark/70 hover:text-hero-dark'
                  : 'border-ink/10 pr-2 mr-0.5 border-r ' + iconCls
              }`}
              aria-label="Select location"
            >
              <MapPin size={16} strokeWidth={1.75} className={`shrink-0 ${heroMode ? 'text-[#13294B]' : 'text-[#13294B]'}`} />
              <span
                className="text-sm font-medium tracking-tightish truncate max-w-[120px] xl:max-w-[240px]"
                title={location?.address || location?.label || 'Select Location'}
              >
                {location?.label || 'Select Location'}
              </span>
              <ChevronDown size={14} strokeWidth={1.75} className={`shrink-0 ${heroMode ? 'text-hero-dark/40' : 'text-ink/40'}`} />
            </button>

            {/* Mobile: compact pin */}
            <button
              type="button"
              onClick={openLocationModal}
              className={`lg:hidden inline-flex items-center justify-center transition-colors ${iconCls}`}
              aria-label="Select location"
            >
              <MapPin size={20} strokeWidth={1.5} className={heroMode ? 'text-hero-dark' : 'text-[#13294B]'} />
            </button>

            <div className="flex items-center relative">
              {/* Desktop Search - Always Visible */}
              <div className="hidden lg:block relative mr-2">
                  <form
                    onSubmit={handleSearchSubmit}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition-all duration-300 ${
                      searchValue.length > 0
                        ? 'bg-paper border-ink/10'
                        : heroMode
                        ? 'bg-hero-bg border-hero-border'
                        : 'bg-ink/5 border-ink/10'
                    }`}
                  >
                    <Search size={16} className={`shrink-0 transition-colors ${
                      searchValue.length > 0 ? 'text-ink/50' : heroMode ? 'text-hero-dark/50' : 'text-ink/50'
                    }`} />
                    <input
                      ref={searchInputRef}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search services, products, workers..."
                      className={`min-w-0 w-[110px] lg:w-[100px] xl:w-[180px] focus:lg:w-[140px] focus:xl:w-[240px] bg-transparent text-sm outline-none font-medium transition-all duration-300 ${
                        searchValue.length > 0
                          ? 'text-ink placeholder:text-ink/40'
                          : heroMode
                          ? 'text-hero-dark placeholder:text-hero-dark/40'
                          : 'text-ink placeholder:text-ink/40'
                      }`}
                    />
                    {searchValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchValue('');
                          setSuggestions([]);
                        }}
                        className="text-ink/40 hover:text-ink transition-colors p-1 shrink-0"
                        aria-label="Clear search"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </form>

                  {/* Autocomplete Dropdown */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        className="absolute top-full left-0 right-0 mt-2 w-full bg-paper border border-ink/10 rounded-lg shadow-lg max-h-96 overflow-y-auto z-40"
                      >
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.type}-${suggestion._id}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-ink/5 border-b border-ink/5 last:border-b-0 transition-colors flex items-start gap-3"
                          >
                            {suggestion.image && (
                              <img
                                src={mediaUrl(suggestion.image)}
                                alt={suggestion.name}
                                className="h-10 w-10 rounded object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-ink truncate">
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-ink/50 truncate">
                                {suggestion.type === 'product' ? 'Product' : 'Service'}
                                {suggestion.price && ` • ₹${suggestion.price}`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* Mobile Search */}
              <div className="lg:hidden flex items-center">
                {searchOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-0 z-30 top-0"
                  >
                    <form
                      onSubmit={handleSearchSubmit}
                      className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 py-2 shadow-md"
                    >
                      <Search size={16} className="text-ink/50 shrink-0" />
                      <input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search service, price, location..."
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40 text-ink font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchValue('');
                          setSuggestions([]);
                        }}
                        className="text-ink/40 hover:text-ink transition-colors p-1 shrink-0"
                        aria-label="Close search"
                      >
                        <X size={16} />
                      </button>
                    </form>

                    {/* Autocomplete Dropdown */}
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-paper border border-ink/10 rounded-lg shadow-lg max-h-96 overflow-y-auto z-40"
                      >
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.type}-${suggestion._id}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-ink/5 border-b border-ink/5 last:border-b-0 transition-colors flex items-start gap-3"
                          >
                            {suggestion.image && (
                              <img
                                src={mediaUrl(suggestion.image)}
                                alt={suggestion.name}
                                className="h-10 w-10 rounded object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-ink truncate">
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-ink/50 truncate">
                                {suggestion.type === 'product' ? 'Product' : 'Service'}
                                {suggestion.price && ` • ₹${suggestion.price}`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className={`inline-flex transition-colors ${iconCls}`}
                    aria-label="search"
                  >
                    <Search size={20} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Favorites */}
            <button onClick={() => navigate('/favorites')} className={`relative hidden lg:inline-flex transition-colors ${iconCls}`} aria-label="favorites">
              <Heart size={20} strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Bell / Notifications — shown in hero mode, cart icon on other pages */}
            {heroMode ? (
              <button
                className="relative hidden lg:inline-flex items-center justify-center transition-colors text-hero-dark/70 hover:text-hero-dark"
                aria-label="notifications"
                /* TODO: wire to real notification state/context */
              >
                <Bell size={20} strokeWidth={1.5} />
              </button>
            ) : (
              <Link to="/cart" className={`relative inline-flex transition-colors ${iconCls}`} aria-label="bag">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className={`hidden lg:flex items-center gap-2 lg:gap-3 pl-2.5 lg:pl-3 border-l shrink-0 ${heroMode ? 'border-hero-border' : 'border-ink/10'}`}>
                {(user?.passportPhoto || user?.avatar) && (
                  <Link to={panelPath} className="shrink-0" aria-label={panelLabel}>
                    <img
                      src={mediaUrl(user.passportPhoto || user.avatar)}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover border border-ink/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Link>
                )}
                <Link
                  to={panelPath}
                  className={`hidden xl:inline-block text-sm font-medium transition-colors whitespace-nowrap ${heroMode ? 'text-hero-dark/70 hover:text-hero-dark' : 'text-ink/70 hover:text-ink'}`}
                >
                  {panelLabel}
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 rounded-pill px-4 py-1.5 text-xs font-medium tracking-tightish transition-all duration-300 ${
                    heroMode
                      ? 'border border-[#13294B] bg-white text-[#13294B] hover:bg-[#13294B]/5'
                      : 'pill-btn !py-1.5 !px-4'
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className={`hidden lg:flex items-center ${heroMode ? '' : 'pl-4 border-l border-ink/10'}`}>
                {heroMode ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-[#13294B] bg-white px-5 py-2 text-sm font-bold text-[#13294B] hover:bg-[#13294B]/5 transition-colors whitespace-nowrap"
                  >
                    Sign in
                  </Link>
                ) : (
                  <Link to="/login" aria-label="account" className={`inline-flex transition-colors ${iconCls}`}>
                    <UserIcon size={20} strokeWidth={1.5} />
                  </Link>
                )}
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center ml-1">
              <button
                type="button"
                className={`${iconCls} transition-colors flex items-center`}
                aria-label="menu"
                onClick={() => setOpen((o) => !o)}
              >
                {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Expansion — portaled to <body> so it escapes the
            navbar's backdrop-filter containing block and sizes to the viewport. */}
        {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Drawer Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-paper shadow-2xl"
                style={{
                  width: 'min(85vw, 380px)',
                  paddingTop: 'env(safe-area-inset-top)',
                }}
              >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-ink/5 bg-gradient-to-b from-paper to-paper/95 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-ink/5 transition-all duration-200 active:scale-95"
                      aria-label="close menu"
                    >
                      <X size={24} strokeWidth={1.5} />
                    </button>

                    {/* Logo in Drawer */}
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <img
                        src="/HELPER LOGO 02.png"
                        alt="Helper"
                        className="h-10 w-auto object-contain max-w-[130px]"
                      />
                    </div>

                    {/* Right Icons - Search and Cart */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setSearchOpen(true);
                        }}
                        className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-ink/5 transition-all duration-200 active:scale-95"
                        aria-label="search"
                      >
                        <Search size={20} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate('/cart');
                        }}
                        className="relative flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-ink/5 transition-all duration-200 active:scale-95"
                        aria-label="cart"
                      >
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        {cart.length > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                            {cart.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth drawer-scroll">
                  {/* Main Navigation */}
                  <nav className="px-3 py-4 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-ink px-3 py-2">Navigation</div>
                    {activeNavLinks.map((n) => {
                      const active = isNavActive(n);
                      
                      if (n.isCategoryDropdown) {
                        return (
                          <div key={n.label} className="w-full flex flex-col">
                            <button
                              type="button"
                              onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                              className={`no-underline w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-transparent border-0 cursor-pointer ${
                                active
                                  ? 'text-ink bg-ink/8'
                                  : 'text-ink hover:text-ink hover:bg-ink/5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all ${active ? 'bg-ink' : 'bg-ink/30'}`} />
                                {n.label}
                              </div>
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-300 ${
                                  mobileCategoriesOpen ? 'rotate-180 text-ink' : 'text-ink/40'
                                }`}
                              />
                            </button>
                            
                            <AnimatePresence initial={false}>
                              {mobileCategoriesOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden pl-7 pr-3 space-y-2 mt-1"
                                >
                                  <Link
                                    to="/services"
                                    onClick={() => {
                                      setOpen(false);
                                      setMobileCategoriesOpen(false);
                                    }}
                                    className="block py-1 text-xs font-bold text-[#13294B] hover:underline"
                                  >
                                    View All Categories
                                  </Link>
                                  
                                  {loadingCategories ? (
                                    <div className="py-2 text-xs text-ink/40 animate-pulse">Loading categories...</div>
                                  ) : categories.length === 0 ? (
                                    <div className="py-2 text-xs text-ink/40">No categories available</div>
                                  ) : (
                                    categories.map((cat) => (
                                      <Link
                                        key={cat._id}
                                        to={getCategoryLink(cat.slug)}
                                        onClick={() => {
                                          setOpen(false);
                                          setMobileCategoriesOpen(false);
                                        }}
                                        className="block py-1 text-xs font-semibold text-ink/80 hover:text-ink hover:translate-x-1 transition-all duration-200"
                                      >
                                        {cat.name}
                                      </Link>
                                    ))
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      if (n.hasChevron) {
                        return (
                          <div key={n.label} className="w-full flex flex-col">
                            <button
                              type="button"
                              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                              className={`no-underline w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-transparent border-0 cursor-pointer ${
                                active
                                  ? 'text-ink bg-ink/8'
                                  : 'text-ink hover:text-ink hover:bg-ink/5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all ${active ? 'bg-ink' : 'bg-ink/30'}`} />
                                {n.label}
                              </div>
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-300 ${
                                  mobileServicesOpen ? 'rotate-180 text-ink' : 'text-ink/40'
                                }`}
                              />
                            </button>
                            
                            <AnimatePresence initial={false}>
                              {mobileServicesOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden pl-7 pr-3 space-y-2 mt-1"
                                >
                                  <Link
                                    to="/services"
                                    onClick={() => {
                                      setOpen(false);
                                      setMobileServicesOpen(false);
                                    }}
                                    className="block py-1 text-xs font-bold text-[#13294B] hover:underline"
                                  >
                                    View All Services
                                  </Link>
                                  
                                  {loadingServices ? (
                                    <div className="py-2 text-xs text-ink/40">Loading services...</div>
                                  ) : services.length === 0 ? (
                                    <div className="py-2 text-xs text-ink/40">No services available</div>
                                  ) : (
                                    Object.entries(groupedServices).map(([catName, svcs]) => (
                                      <div key={catName} className="py-1">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40 py-1 truncate">
                                          {catName}
                                        </div>
                                        <div className="pl-2 border-l border-ink/5 space-y-1.5">
                                          {svcs.services.map((svc) => (
                                            <Link
                                              key={svc._id}
                                              to={`/services/${svc._id}`}
                                              onClick={() => {
                                                setOpen(false);
                                                setMobileServicesOpen(false);
                                              }}
                                              className="block py-1 text-xs text-ink/75 hover:text-ink truncate font-medium"
                                            >
                                              {svc.name}
                                            </Link>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={n.to}
                          to={n.to}
                          onClick={() => setOpen(false)}
                          className={`no-underline flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                            active
                              ? 'text-ink bg-ink/8'
                              : 'text-ink hover:text-ink hover:bg-ink/5'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full transition-all ${active ? 'bg-ink' : 'bg-ink/30'}`} />
                          {n.label}
                          {active && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-ink rounded-r-lg" />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                  {/* Location */}
                  <div className="px-3 py-2 mt-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        openLocationModal();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-ink hover:bg-ink/5 transition-all duration-200"
                    >
                      <MapPin size={18} className="flex-shrink-0 text-[#13294B]" />
                      <span className="flex-1 text-left text-ink truncate">
                        {location?.label || 'Select location'}
                      </span>
                      <ChevronDown size={14} className="text-ink/40 flex-shrink-0" />
                    </button>
                  </div>

                  {/* Favorites */}
                  <div className="px-3 py-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate('/favorites');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-ink hover:bg-ink/5 transition-all duration-200"
                    >
                      <Heart size={18} className="flex-shrink-0" />
                      <span className="flex-1 text-left text-ink">Saved Items</span>
                      {favorites.length > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink/10 px-1.5 text-[11px] font-semibold text-ink">
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-ink/0 via-ink/10 to-ink/0 my-3 mx-3" />

                  {/* Account Section */}
                  {isAuthenticated && (
                    <nav className="px-3 py-4 space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink px-3 py-2">Account</div>
                      <Link
                        to={panelPath}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-ink hover:bg-ink/5 transition-all duration-200"
                      >
                        <UserIcon size={18} className="flex-shrink-0" />
                        {panelLabel}
                      </Link>
                    </nav>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex-shrink-0 border-t border-ink/5 bg-gradient-to-t from-paper/95 to-paper px-3 py-3 space-y-2 safe-area-bottom-pad" style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}>
                  {isAuthenticated ? (
                    <button
                      onClick={async () => {
                        await logout();
                        setOpen(false);
                        navigate('/');
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-ink text-paper text-sm font-semibold hover:bg-ink/90 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                    >
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="w-full block py-2.5 px-3 rounded-lg text-center bg-ink text-paper text-sm font-semibold hover:bg-ink/90 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setOpen(false)}
                        className="w-full block py-2.5 px-3 rounded-lg text-center border border-ink/20 text-ink text-sm font-semibold hover:bg-ink/5 transition-all duration-200 active:scale-95"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
        )}
      </div>
    </header>
    <LocationModal />
    </>
  );
}
