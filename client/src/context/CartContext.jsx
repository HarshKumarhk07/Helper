import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getProduct } from '../api/products.js';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('velora_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('velora_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let cancelled = false;

    const validateSavedCart = async () => {
      const productItems = cart.filter((item) => item.kind !== 'service');
      if (!productItems.length) return;

      const uniqueProductIds = [...new Set(productItems.map((item) => item.product).filter(Boolean))];
      const results = await Promise.allSettled(uniqueProductIds.map((productId) => getProduct(productId)));

      if (cancelled) return;

      const validProductIds = new Set(
        results
          .map((result, index) => (result.status === 'fulfilled' ? uniqueProductIds[index] : null))
          .filter(Boolean)
      );

      if (validProductIds.size !== uniqueProductIds.length) {
        setCart((current) => current.filter((item) => validProductIds.has(item.product)));
        toast.error('Removed unavailable items from your cart');
      }
    };

    validateSavedCart();

    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const itemKind = product.kind || 'product';
      const existing = prev.find((item) => item.product === product._id && item.kind === itemKind);
      if (existing) {
        return prev.map((item) =>
          item.product === product._id && item.kind === itemKind
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product: product._id, kind: itemKind, name: product.name, price: product.price, image: product.image, quantity: 1 }];
    });
    toast.success('Added to cart');
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.product === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
