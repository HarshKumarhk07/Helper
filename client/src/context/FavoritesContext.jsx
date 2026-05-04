import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('velora_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('velora_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (productId) => favorites.some((item) => item._id === productId);

  const toggleFavorite = (product) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) {
        toast.success('Removed from favorites');
        return prev.filter((item) => item._id !== product._id);
      }
      toast.success('Added to favorites');
      return [...prev, product];
    });
  };

  const clearFavorites = () => setFavorites([]);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, clearFavorites }),
    [favorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);