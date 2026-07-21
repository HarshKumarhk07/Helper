import api from './axios.js';

// [CAR-TRIPS DISABLED] The "Car Trips" category (slug 'car-trips') is hidden from
// all public listings. Admin pages pass { includeHidden: true }. See CAR_TRIPS_DISABLED.md.
const HIDDEN_CATEGORY_SLUGS = ['car-trips'];

export const listCategories = ({ includeHidden, ...params } = {}) =>
  api.get('/categories', { params }).then((r) => {
    const categories = r.data.categories || [];
    return includeHidden
      ? categories
      : categories.filter((c) => !HIDDEN_CATEGORY_SLUGS.includes(c?.slug));
  });

export const getCategory = (idOrSlug) =>
  api.get(`/categories/${idOrSlug}`).then((r) => r.data.category);

export const createCategory = (payload) =>
  api.post('/categories', payload).then((r) => r.data.category);

export const updateCategory = (id, payload) =>
  api.patch(`/categories/${id}`, payload).then((r) => r.data.category);

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((r) => r.data);
