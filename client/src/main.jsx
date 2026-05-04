import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    fontFamily: 'Chivo Mono, monospace',
                    background: '#18181A',
                    color: '#FDFDFD',
                    borderRadius: '999px',
                    padding: '10px 18px',
                    fontSize: '13px',
                  },
                }}
              />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
