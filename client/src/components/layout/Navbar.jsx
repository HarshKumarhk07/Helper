import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const NAV = [
  { to: '/', label: '{Home}' },
  { to: '/services?cat=men', label: 'Men' },
  { to: '/services?cat=women', label: 'Women' },
  { to: '/services?cat=sale', label: 'Sale' },
  { to: '/services?cat=lookbook', label: 'Lookbook' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-paper/10 dark:bg-[#0E0E10]/90">
      <div className="container-velora flex h-16 items-center justify-between gap-6">
        <nav className="hidden items-center gap-6 md:flex">
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
          className="md:hidden"
          aria-label="menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-[0.18em] text-ink dark:text-paper"
        >
          VELORA HOUSE
        </Link>

        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex" aria-label="search">
            <Search size={18} />
          </button>
          <button className="hidden md:inline-flex" aria-label="favorites">
            <Heart size={18} />
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
