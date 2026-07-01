import api from './axios.js';

export const listUsers = (params = {}) =>
  api.get('/users', { params }).then((r) => r.data);

export const adminCreateUser = (payload) =>
  api.post('/users', payload).then((r) => r.data.user);

export const updateUser = (id, payload) =>
  api.patch(`/users/${id}`, payload).then((r) => r.data.user);

export const setUserActive = (id, isActive) =>
  api.patch(`/users/${id}/active`, { isActive }).then((r) => r.data.user);

export const getFeaturedWorkersPublic = (params = {}) =>
  api.get('/users/featured', { params }).then((r) => r.data.workers);
