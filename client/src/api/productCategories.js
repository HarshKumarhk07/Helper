import api from './axios.js';

export const listProductCategories = (params = {}) =>
  api.get('/product-categories', { params }).then((r) => r.data.categories);

export const createProductCategory = (payload) =>
  api.post('/product-categories', payload).then((r) => r.data.category);

export const updateProductCategory = (id, payload) =>
  api.put(`/product-categories/${id}`, payload).then((r) => r.data.category);

export const deleteProductCategory = (id) =>
  api.delete(`/product-categories/${id}`).then((r) => r.data);
