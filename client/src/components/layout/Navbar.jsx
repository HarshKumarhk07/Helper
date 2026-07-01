import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, MapPin, ChevronDown } from 'lucide-react';
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
import { mediaUrl } from '../../lib/catalogImage.js';

const NAV = [
  { to: '/services', label: 'Services' },
  { to: '/products', label: 'Products' },
  { to: '/join', label: 'Join us' },
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
  const isNavActive = (to) => {
    if (to === '/') return routerLocation.pathname === '/';
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

  const panelPath = PANEL_BY_ROLE[user?.role] || '/dashboard';
  const panelLabel = PANEL_LABEL_BY_ROLE[user?.role] || 'Dashboard';

  // Transparent navbar when on the home page and user hasn't scrolled yet.
  // Once they scroll past the hero, or on any other page, it becomes solid white.
  const isHome = routerLocation.pathname === '/';
  const heroMode = isHome && !scrolled;
  const iconCls = heroMode ? 'text-paper/90 hover:text-paper' : 'text-ink/80 hover:text-ink';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
        ].slice(0, 6);

        setSuggestions(combined);
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
          ? 'bg-transparent border-b border-transparent shadow-none'
          : 'bg-paper border-b border-ink/10 shadow-[0_2px_15px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div
        className="w-full max-w-[1400px] py-4 px-6 md:px-10"
      >
        <div className="flex items-center justify-between gap-4 w-full h-full relative">
          
          {/* Logo (Left) */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center gap-2 group mr-6"
          >
            <span className="transition-all">
              <img
                src="/HELPER LOGO 02.png"
                alt="Helper"
                className="w-auto object-contain transition-all h-12 max-w-[150px]"
              />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden min-w-0 items-center gap-6 md:flex flex-1">
            {NAV.map((n) => {
              const active = isNavActive(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`no-underline text-sm font-medium tracking-tightish transition-colors duration-300 relative ${
                    heroMode
                      ? active ? 'text-paper' : 'text-paper/70 hover:text-paper'
                      : active ? 'text-[#13294B]' : 'text-[#13294B]/60 hover:text-[#13294B]'
                  }`}
                >
                  {n.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full ${heroMode ? 'bg-paper' : 'bg-[#13294B]'}`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className={`${iconCls} transition-colors flex items-center`}
              aria-label="menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            {/* Select Location */}
            <button
              type="button"
              onClick={openLocationModal}
              className={`hidden md:inline-flex items-center gap-2 max-w-[200px] pr-3 mr-1 border-r transition-colors ${heroMode ? 'border-paper/25' : 'border-ink/10'} ${iconCls}`}
              aria-label="Select location"
            >
              <MapPin size={16} strokeWidth={1.75} className={`shrink-0 ${heroMode ? 'text-brand' : 'text-[#13294B]'}`} />
              <span
                className="text-sm font-medium tracking-tightish truncate max-w-[160px]"
                title={location?.address || location?.label || 'Select Location'}
              >
                {location?.label || 'Select Location'}
              </span>
              <ChevronDown size={14} strokeWidth={1.75} className={`shrink-0 ${heroMode ? 'text-paper/50' : 'text-ink/40'}`} />
            </button>

            {/* Mobile: compact pin */}
            <button
              type="button"
              onClick={openLocationModal}
              className={`md:hidden inline-flex items-center justify-center transition-colors ${iconCls}`}
              aria-label="Select location"
            >
              <MapPin size={20} strokeWidth={1.5} className={heroMode ? 'text-paper' : 'text-[#13294B]'} />
            </button>

            <div className="flex items-center relative">
              {/* Desktop Search - Always Visible */}
              <div className="hidden md:block relative mr-2">
                  <form
                    onSubmit={handleSearchSubmit}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition-all duration-300 ${
                      searchValue.length > 0
                        ? 'bg-paper border-ink/10'
                        : heroMode
                        ? 'bg-paper/20 backdrop-blur-md border-paper/30'
                        : 'bg-ink/5 border-ink/10'
                    }`}
                  >
                    <Search size={16} className={`shrink-0 transition-colors ${
                      searchValue.length > 0 ? 'text-ink/50' : heroMode ? 'text-paper/80' : 'text-ink/50'
                    }`} />
                    <input
                      ref={searchInputRef}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search services, products, workers..."
                      className={`min-w-0 w-[140px] lg:w-[220px] xl:w-[300px] bg-transparent text-sm outline-none font-medium transition-colors ${
                        searchValue.length > 0
                          ? 'text-ink placeholder:text-ink/40'
                          : heroMode
                          ? 'text-paper placeholder:text-paper/70'
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
              <div className="md:hidden flex items-center">
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

            <button onClick={() => navigate('/favorites')} className={`relative hidden md:inline-flex transition-colors ${iconCls}`} aria-label="favorites">
              <Heart size={20} strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                  {favorites.length}
                </span>
              )}
            </button>

            <Link to="/cart" className={`relative inline-flex transition-colors ${iconCls}`} aria-label="bag">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                  {cart.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className={`hidden md:flex items-center gap-3 lg:gap-4 pl-3 lg:pl-4 border-l shrink-0 ${heroMode ? 'border-paper/25' : 'border-ink/10'}`}>
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
                  className={`hidden lg:inline-block text-sm font-medium transition-colors whitespace-nowrap ${heroMode ? 'text-paper/80 hover:text-paper' : 'text-ink/70 hover:text-ink'}`}
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
                      ? 'border border-paper/30 bg-paper/15 backdrop-blur-md text-paper hover:bg-paper hover:text-ink'
                      : 'pill-btn !py-1.5 !px-4'
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className={`hidden md:flex items-center pl-4 border-l ${heroMode ? 'border-paper/25' : 'border-ink/10'}`}>
                <Link to="/login" aria-label="account" className={`inline-flex transition-colors ${iconCls}`}>
                  <UserIcon size={20} strokeWidth={1.5} />
                </Link>
              </div>
            )}
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
                    {NAV.map((n) => {
                      const active = isNavActive(n.to);
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
