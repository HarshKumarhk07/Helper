import api from './axios.js';

export const listProducts = (params = {}) =>
  api.get('/products', { params }).then((r) => r.data);

export const getProduct = (id) =>
  api.get(`/products/${id}`).then((r) => r.data.product);

export const createProduct = (payload) =>
  api.post('/products', payload).then((r) => r.data.product);

export const updateProduct = (id, payload) =>
  api.put(`/products/${id}`, payload).then((r) => r.data.product);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);
