import { createContext, useContext, useEffect, useState } from 'react';

const LocationContext = createContext(null);

const STORAGE_KEY = 'helper.location';

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore quota / private-mode errors
    }
  }, [location]);

  const setLocation = (loc) => setLocationState(loc);
  const clearLocation = () => setLocationState(null);
  const openLocationModal = () => setModalOpen(true);
  const closeLocationModal = () => setModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        clearLocation,
        modalOpen,
        openLocationModal,
        closeLocationModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}
