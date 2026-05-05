import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Sun, Moon, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

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
  const { theme, toggle } = useTheme();
  const { cart } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef(null);
  const panelPath = PANEL_BY_ROLE[user?.role] || '/dashboard';
  const panelLabel = PANEL_LABEL_BY_ROLE[user?.role] || 'Dashboard';

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
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
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-[#0E0E10]/90">
      <div className="container-velora grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className="hidden min-w-0 items-center gap-5 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'text-ink dark:text-paper' : ''}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="justify-self-start md:hidden"
          aria-label="menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          to="/"
          className="justify-self-center text-base font-semibold tracking-[0.18em] text-ink dark:text-paper"
        >
          VELORA HOUSE
        </Link>

        <div className="flex items-center justify-self-end gap-3">
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-1.5 dark:border-paper/15 dark:bg-[#0E0E10]"
              >
                <Search size={16} className="text-ink/60 dark:text-paper/60" />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products or services"
                  className="w-56 bg-transparent text-sm outline-none placeholder:text-ink/40 dark:text-paper dark:placeholder:text-paper/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchValue('');
                  }}
                  className="text-xs uppercase tracking-widest text-ink/50 transition hover:text-ink dark:text-paper/50 dark:hover:text-paper"
                >
                  Close
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden md:inline-flex"
                aria-label="search"
              >
                <Search size={18} />
              </button>
            )}
          </div>
          <button type="button" onClick={() => navigate('/favorites')} className="relative hidden md:inline-flex" aria-label="favorites">
            <Heart size={18} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] text-paper dark:bg-paper dark:text-ink">
                {favorites.length}
              </span>
            )}
          </button>
          <Link to="/cart" className="relative hidden md:inline-flex" aria-label="bag">
            <ShoppingBag size={18} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-ink text-[8px] text-paper dark:bg-paper dark:text-ink">
                {cart.length}
              </span>
            )}
          </Link>
          <button onClick={toggle} aria-label="toggle theme" className="inline-flex">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={panelPath}
                className="hidden rounded-pill border border-ink/20 px-3 py-1.5 text-xs tracking-tightish transition hover:bg-ink hover:text-paper md:inline-flex dark:border-paper/25 dark:hover:bg-paper dark:hover:text-ink"
              >
                {panelLabel}
              </Link>
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden text-sm tracking-tightish md:inline-flex"
              >
                {user.name.split(' ')[0]}
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="pill-btn px-3 py-1.5 text-xs"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" aria-label="account" className="inline-flex">
              <UserIcon size={18} />
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="container-velora flex flex-col gap-3 py-4">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setOpen(false)}
                className="nav-link"
              >
                {n.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <Link to={panelPath} onClick={() => setOpen(false)} className="nav-link">
                {panelLabel}
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setOpen(false)} className="nav-link">
                Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
