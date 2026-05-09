import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
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
  const navigate = useNavigate();
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    navigate(`/services?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setSearchValue('');
  };

  return (
    <header 
      className={`fixed inset-x-0 z-50 transition-all duration-500 flex justify-center w-full px-4 md:px-10 ${
        scrolled ? 'top-4' : 'top-6'
      }`}
    >
      {/* Floating Glass Island */}
      <div 
        className={`w-full max-w-[1400px] transition-all duration-500 rounded-[2rem] border overflow-visible ${
          scrolled 
            ? 'bg-paper/95 backdrop-blur-2xl border-ink/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-3 px-6 md:px-8' 
            : 'bg-paper/90 backdrop-blur-xl border-white/40 shadow-2xl py-4 px-6 md:px-8'
        }`}
      >
        <div className="flex items-center justify-between gap-4 w-full h-full relative">
          
          {/* Desktop Navigation */}
          <nav className="hidden min-w-0 items-center gap-6 md:flex flex-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-tightish transition-colors duration-300 relative group ${
                    isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-ink rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
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
            <span className="font-semibold tracking-[0.15em] text-sm uppercase text-ink">Velora House</span>
          </Link>

          {/* Right Actions */}
          <div className="flex flex-1 items-center justify-end gap-4 md:gap-5">
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
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="md:hidden overflow-hidden border-t border-ink/5"
            >
              <div className="flex flex-col gap-4 py-4 px-2">
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/'}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-ink/80 hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-ink/5"
                  >
                    {n.label}
                  </NavLink>
                ))}
                
                <div className="flex gap-4 px-2 py-2">
                  <button onClick={() => { setOpen(false); navigate('/favorites'); }} className="flex items-center gap-2 text-ink/80 hover:text-ink">
                    <Heart size={18} /> <span className="text-sm font-medium">Favorites ({favorites.length})</span>
                  </button>
                </div>

                <div className="h-px w-full bg-ink/5 my-1"></div>
                
                {isAuthenticated ? (
                  <>
                    <Link to={panelPath} onClick={() => setOpen(false)} className="text-base font-medium text-ink/80 hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-ink/5">
                      {panelLabel}
                    </Link>
                    <button onClick={() => { logout(); setOpen(false); navigate('/'); }} className="text-left text-base font-medium text-ink/80 hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-ink/5">
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="text-base font-medium text-ink/80 hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-ink/5 flex items-center gap-2">
                    <UserIcon size={18} /> Account Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
