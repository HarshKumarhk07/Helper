import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, MapPin, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import LocationModal from '../location/LocationModal.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/services?cat=home-services', label: 'Services' },
  { to: '/services?cat=cleaning-services', label: 'Cleaning' },
  { to: '/services?cat=beauty-wellness', label: 'Beauty' },
  { to: '/services?cat=appliance-services', label: 'Appliances' },
];

const PANEL_BY_ROLE = {
  admin: '/admin',
  manager: '/manager',
  worker: '/worker',
  user: '/me',
};

const PANEL_LABEL_BY_ROLE = {
  admin: 'Admin panel',
  manager: 'Manager panel',
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

  // Compute active link manually — pathname-only matching makes all
  // /services?cat=... links share the same active state, so we have to
  // compare the full path+query.
  const currentUrl = `${routerLocation.pathname}${routerLocation.search}`;
  const isNavActive = (to) => {
    if (to === '/') return routerLocation.pathname === '/';
    return currentUrl === to;
  };
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef(null);
  
  const panelPath = PANEL_BY_ROLE[user?.role] || '/dashboard';
  const panelLabel = PANEL_LABEL_BY_ROLE[user?.role] || 'Dashboard';

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
  };

  return (
    <>
    <header
      className={`fixed inset-x-0 z-50 transition-all duration-500 flex justify-center w-full px-4 md:px-10 ${
        scrolled ? 'top-3' : 'top-4'
      }`}
    >
      {/* Floating Glass Island */}
      <div
        className={`w-full max-w-[1400px] transition-all duration-500 rounded-[1.75rem] border overflow-visible ${
          scrolled
            ? 'bg-paper/95 backdrop-blur-2xl border-ink/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 px-5 md:px-7'
            : 'bg-paper/90 backdrop-blur-xl border-white/40 shadow-xl py-2.5 px-5 md:px-7'
        }`}
      >
        <div className="flex items-center justify-between gap-4 w-full h-full relative">
          
          {/* Desktop Navigation */}
          <nav className="hidden min-w-0 items-center gap-6 md:flex flex-1">
            {NAV.map((n) => {
              const active = isNavActive(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`no-underline text-sm font-medium tracking-tightish transition-colors duration-300 relative ${
                    active ? 'text-ink' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {n.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-ink rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex-1 md:hidden">
            <button
              type="button"
              className="text-ink/80 hover:text-ink transition-colors flex items-center"
              aria-label="menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>

          {/* Logo (Centered) */}
          <Link
            to="/"
            className="flex-shrink-0 flex justify-center items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-lg group-hover:bg-ink/80 transition-colors">U</div>
            <span className="font-semibold tracking-[0.15em] text-sm uppercase text-ink">UrbanEase</span>
          </Link>

          {/* Right Actions */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            {/* Select Location */}
            <button
              type="button"
              onClick={openLocationModal}
              className="hidden md:inline-flex items-center gap-2 max-w-[200px] pr-3 mr-1 border-r border-ink/10 text-ink/80 hover:text-ink transition-colors"
              aria-label="Select location"
            >
              <MapPin size={16} strokeWidth={1.75} className="shrink-0 text-[#6f5cff]" />
              <span
                className="text-sm font-medium tracking-tightish truncate max-w-[160px]"
                title={location?.address || location?.label || 'Select Location'}
              >
                {location?.label || 'Select Location'}
              </span>
              <ChevronDown size={14} strokeWidth={1.75} className="shrink-0 text-ink/40" />
            </button>

            {/* Mobile: compact pin */}
            <button
              type="button"
              onClick={openLocationModal}
              className="md:hidden inline-flex items-center justify-center text-ink/80 hover:text-ink transition-colors"
              aria-label="Select location"
            >
              <MapPin size={20} strokeWidth={1.5} className="text-[#6f5cff]" />
            </button>

            <div className="flex items-center">
              {searchOpen ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1.5 shadow-sm absolute right-32 z-10 md:static"
                >
                  <Search size={16} className="text-ink/50" />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search..."
                    className="w-32 md:w-48 bg-transparent text-sm outline-none placeholder:text-ink/40 text-ink font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchValue('');
                    }}
                    className="text-ink/40 hover:text-ink transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </motion.form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex text-ink/80 hover:text-ink transition-colors"
                  aria-label="search"
                >
                  <Search size={20} strokeWidth={1.5} />
                </button>
              )}
            </div>

            <button onClick={() => navigate('/favorites')} className="relative hidden md:inline-flex text-ink/80 hover:text-ink transition-colors" aria-label="favorites">
              <Heart size={20} strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                  {favorites.length}
                </span>
              )}
            </button>

            <Link to="/cart" className="relative inline-flex text-ink/80 hover:text-ink transition-colors" aria-label="bag">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper border border-paper">
                  {cart.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-ink/10">
                {(user?.passportPhoto || user?.avatar) && (
                  <img
                    src={user.passportPhoto || user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-ink/20"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <Link
                  to={panelPath}
                  className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
                >
                  {panelLabel}
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="pill-btn !py-1.5 !px-4 text-xs"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center pl-4 border-l border-ink/10">
                <Link to="/login" aria-label="account" className="inline-flex text-ink/80 hover:text-ink transition-colors">
                  <UserIcon size={20} strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Expansion */}
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
                className="fixed left-0 top-0 bottom-0 z-50 h-screen flex flex-col bg-paper shadow-2xl"
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
                      <div className="h-7 w-7 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-sm font-bold">U</div>
                      <span className="text-xs font-semibold tracking-widest uppercase text-ink">Velora</span>
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
                <div className="flex-1 overflow-y-auto scroll-smooth drawer-scroll">
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
                      <MapPin size={18} className="flex-shrink-0 text-[#6f5cff]" />
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
        </AnimatePresence>
      </div>
    </header>
    <LocationModal />
    </>
  );
}
