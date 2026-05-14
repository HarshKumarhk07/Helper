import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import { getProduct } from '../api/products.js';
import { getService } from '../api/services.js';

const FavoritesContext = createContext();

const GUEST_KEY = 'velora_favorites_guest';
const userKey = (userId) => (userId ? `velora_favorites_user_${userId}` : GUEST_KEY);

const readKey = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const writeKey = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / disabled storage errors */
  }
};

const inferFavoriteKind = (item) => {
  if (item?.kind === 'service' || item?.durationMinutes != null) return 'service';
  return 'product';
};

const refreshFavorite = async (item) => {
  const kind = inferFavoriteKind(item);
  if (!item?._id) return null;
  const fresh = kind === 'service' ? await getService(item._id) : await getProduct(item._id);
  return { ...fresh, kind };
};

export function FavoritesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?._id || null;
  const currentKey = userKey(userId);

  const [favorites, setFavorites] = useState(() => readKey(currentKey));
  const lastKeyRef = useRef(currentKey);
  const validatedRef = useRef(new Set());

  // When the active user changes, reload favorites from THAT user's bucket so
  // one user's favorites never leak into another's session.
  useEffect(() => {
    if (lastKeyRef.current === currentKey) return;
    setFavorites(readKey(currentKey));
    lastKeyRef.current = currentKey;
  }, [currentKey]);

  // Persist on change to the appropriate per-user bucket.
  useEffect(() => {
    writeKey(currentKey, favorites);
  }, [favorites, currentKey]);

  // Validate favorites against the server once per key change — drop orphans
  // silently so stale-id navigation never 404s.
  useEffect(() => {
    if (validatedRef.current.has(currentKey)) return;
    if (favorites.length === 0) {
      validatedRef.current.add(currentKey);
      return;
    }
    let cancelled = false;
    Promise.allSettled(favorites.map((item) => refreshFavorite(item))).then((results) => {
      if (cancelled) return;
      const resolved = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);
      if (resolved.length !== favorites.length) {
        toast.error('Some favorites were removed because they are no longer available');
      }
      setFavorites(resolved);
      validatedRef.current.add(currentKey);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const isFavorite = useCallback(
    (productId) => favorites.some((item) => item._id === productId),
    [favorites]
  );

  const toggleFavorite = useCallback((product) => {
    if (!product?._id) return;
    const normalized = {
      ...product,
      kind: inferFavoriteKind(product),
    };
    setFavorites((prev) => {
      const exists = prev.some((item) => item._id === normalized._id);
      if (exists) {
        toast.success('Removed from favorites');
        return prev.filter((item) => item._id !== normalized._id);
      }
      toast.success('Added to favorites');
      return [...prev, normalized];
    });
  }, []);

  const reconcileFavorites = useCallback((validIds) => {
    const set = new Set(validIds);
    setFavorites((prev) => prev.filter((f) => set.has(f._id)));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      reconcileFavorites,
      clearFavorites,
      isAuthenticated,
    }),
    [favorites, isFavorite, toggleFavorite, reconcileFavorites, clearFavorites, isAuthenticated]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
