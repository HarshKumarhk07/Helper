import api from './axios.js';

export const getMyCart = () => api.get('/cart').then((r) => r.data.cart);

export const addCartItem = (productId, quantity = 1) =>
  api.post('/cart/items', { productId, quantity }).then((r) => r.data.cart);

export const updateCartItem = (productId, quantity) =>
  api.patch(`/cart/items/${productId}`, { quantity }).then((r) => r.data.cart);

export const removeCartItem = (productId) =>
  api.delete(`/cart/items/${productId}`).then((r) => r.data.cart);

export const clearCart = () => api.delete('/cart').then((r) => r.data.cart);

export const mergeCart = (items) =>
  api.post('/cart/merge', { items }).then((r) => r.data.cart);
