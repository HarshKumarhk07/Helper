import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getProduct } from '../api/products.js';
import { getService } from '../api/services.js';
import {
  getMyCart,
  mergeCart as mergeServerCart,
  addCartItem,
  updateCartItem as updateServerCartItem,
  removeCartItem as removeServerCartItem,
  clearCart as clearServerCart,
} from '../api/cart.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

// Per-user cart bucket — keeps one user's cart from leaking into another
// user's session on the same browser.
const GUEST_KEY = 'velora_cart_guest';
const userCartKey = (userId) =>
  userId ? `velora_cart_user_${userId}` : GUEST_KEY;

// Legacy migration: anything stored under the old single-bucket key gets
// pulled into the guest bucket once, then cleared.
const LEGACY_KEY = 'velora_cart';

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
    /* ignore */
  }
};

const loadInitial = () => {
  // Migrate legacy single-bucket cart into the guest bucket on first run.
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        writeKey(GUEST_KEY, parsed);
      }
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    /* ignore */
  }
  return readKey(GUEST_KEY);
};

// Merge server cart items (products) with local-only items (services).
const mergeServerWithLocal = (serverItems, localItems) => {
  // Server cart only stores products. Keep any service items from the local cart untouched.
  const localServices = (localItems || []).filter((it) => it.kind === 'service');
  return [...(serverItems || []), ...localServices];
};

const inferCartItemKind = (item) => {
  if (item?.kind === 'service' || item?.durationMinutes != null) return 'service';
  return 'product';
};

const refreshCartItem = async (item) => {
  if (!item?.product) return null;
  const kind = inferCartItemKind(item);
  const fresh = kind === 'service' ? await getService(item.product) : await getProduct(item.product);
  return {
    ...item,
    ...fresh,
    product: String(fresh._id),
    kind,
    name: fresh.name,
    price: fresh.price,
    image: fresh.image,
  };
};

export function CartProvider({ children }) {
  const { isAuthenticated, user, bootstrapping } = useAuth();
  const userId = user?._id || null;
  const currentKey = userCartKey(userId);

  const [cart, setCart] = useState(loadInitial);
  const syncedForUserRef = useRef(null);
  const lastKeyRef = useRef(currentKey);
  const validatedRef = useRef(new Set());

  // When the active user changes, swap to that user's cart bucket so one
  // user's cart never appears in another user's session. This runs during
  // render (not in an effect) so that `cart` already reflects the new bucket
  // by the time the validate/merge effects below read it — otherwise those
  // effects fire with the *previous* user's items still in the closure and
  // write them forward into the new bucket / new user's server cart.
  if (lastKeyRef.current !== currentKey) {
    lastKeyRef.current = currentKey;
    setCart(readKey(currentKey));
  }

  // Persist only when `cart` actually changes — never on currentKey change
  // alone. Listening to currentKey here would fire on logout with the
  // previous user's still-in-closure cart and write it into the new bucket,
  // leaking items across accounts.
  useEffect(() => {
    writeKey(currentKey, cart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // Validate the saved cart's items still exist on the server (drop ghosts).
  // Wait for AuthContext to finish bootstrapping so we validate the correct
  // bucket (user vs. guest), and re-run once per bucket on key change.
  useEffect(() => {
    if (bootstrapping) return;
    if (validatedRef.current.has(currentKey)) return;
    if (!cart.length) {
      validatedRef.current.add(currentKey);
      return;
    }
    let cancelled = false;
    const validate = async () => {
      const results = await Promise.allSettled(cart.map((item) => refreshCartItem(item)));
      if (cancelled) return;
      const refreshed = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);
      if (refreshed.length !== cart.length) {
        toast.error('Removed unavailable items from your cart');
      }
      setCart(refreshed);
      validatedRef.current.add(currentKey);
    };
    validate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, bootstrapping]);

  // On login, merge ONLY the guest bucket into the account, then read the
  // merged cart back. We deliberately never merge from `cart` / another
  // user's bucket — the guest bucket is the only cart that belongs to
  // "whoever just logged in". After merging we clear the guest bucket so a
  // subsequent login on a different account can't inherit these items.
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    if (syncedForUserRef.current === user._id) return;
    syncedForUserRef.current = user._id;

    let cancelled = false;
    const run = async () => {
      try {
        const guestItems = readKey(GUEST_KEY);
        const guestProducts = guestItems
          .filter((it) => it.kind !== 'service' && it.product)
          .map((it) => ({ productId: it.product, quantity: it.quantity }));
        const guestServices = guestItems.filter((it) => it.kind === 'service');

        const merged =
          guestProducts.length > 0
            ? await mergeServerCart(guestProducts)
            : await getMyCart();
        if (cancelled) return;

        // Server products (source of truth) + this user's own local services
        // + any guest services carried over on this login.
        setCart((current) => {
          const withGuestServices = mergeServerWithLocal(merged.items, current);
          const keys = new Set(withGuestServices.map((it) => `${it.kind}:${it.product}`));
          const carried = guestServices.filter(
            (gs) => !keys.has(`${gs.kind}:${gs.product}`)
          );
          return [...withGuestServices, ...carried];
        });

        // Guest items have been absorbed into this account — empty the guest
        // bucket so the next account to log in on this browser starts clean.
        writeKey(GUEST_KEY, []);
      } catch {
        // Best-effort; if server is unreachable we keep the local cart.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id]);

  // Reset sync sentinel on logout so a fresh login re-syncs.
  useEffect(() => {
    if (!isAuthenticated) {
      syncedForUserRef.current = null;
    }
  }, [isAuthenticated]);

  // Keep workers, admins, and brands from carrying/persisting any cart items.
  useEffect(() => {
    if (user && user.role !== 'user') {
      setCart([]);
    }
  }, [user]);

  const addToCart = useCallback(
    (product) => {
      if (user && user.role !== 'user') {
        toast.error('only accounts registered as customer are allowed to book services/order products');
        return;
      }
      const itemKind = product.kind || 'product';
      setCart((prev) => {
        const existing = prev.find(
          (it) => it.product === product._id && it.kind === itemKind
        );
        if (existing) {
          return prev.map((it) =>
            it.product === product._id && it.kind === itemKind
              ? { ...it, quantity: it.quantity + 1 }
              : it
          );
        }
        return [
          ...prev,
          {
            product: product._id,
            kind: itemKind,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
          },
        ];
      });
      toast.success('Added to cart');
      if (isAuthenticated && itemKind !== 'service') {
        addCartItem(product._id, 1).catch(() => null);
      }
    },
    [isAuthenticated, user]
  );

  const removeFromCart = useCallback(
    (productId) => {
      const removedItem = cart.find((it) => it.product === productId);
      setCart((prev) => prev.filter((it) => it.product !== productId));
      if (isAuthenticated && removedItem?.kind !== 'service') {
        removeServerCartItem(productId).catch(() => null);
      }
    },
    [isAuthenticated, cart]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      const item = cart.find((it) => it.product === productId);
      setCart((prev) =>
        prev.map((it) => (it.product === productId ? { ...it, quantity } : it))
      );
      if (isAuthenticated && item?.kind !== 'service') {
        updateServerCartItem(productId, quantity).catch(() => null);
      }
    },
    [isAuthenticated, cart, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    if (isAuthenticated) {
      clearServerCart().catch(() => null);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
