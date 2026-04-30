import api from './axios.js';

export const listCategories = (params = {}) =>
  api.get('/categories', { params }).then((r) => r.data.categories);

export const getCategory = (idOrSlug) =>
  api.get(`/categories/${idOrSlug}`).then((r) => r.data.category);

export const createCategory = (payload) =>
  api.post('/categories', payload).then((r) => r.data.category);

export const updateCategory = (id, payload) =>
  api.patch(`/categories/${id}`, payload).then((r) => r.data.category);

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((r) => r.data);
