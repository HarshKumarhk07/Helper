import api from './axios.js';

export const getMyManagerCategories = () =>
  api.get('/manager/categories').then((r) => r.data.categories);

export const listScopedBookings = (params = {}) =>
  api.get('/manager/bookings', { params }).then((r) => r.data.bookings);

export const listScopedOrders = (params = {}) =>
  api.get('/manager/orders', { params }).then((r) => r.data.orders);

export const listScopedWorkers = (params = {}) =>
  api.get('/manager/workers', { params }).then((r) => r.data.workers);

export const getManagerStats = () =>
  api.get('/manager/stats').then((r) => r.data);
