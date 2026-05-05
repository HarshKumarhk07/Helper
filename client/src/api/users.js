import api from './axios.js';

export const listUsers = (params = {}) =>
  api.get('/users', { params }).then((r) => r.data.users);

export const adminCreateUser = (payload) =>
  api.post('/users', payload).then((r) => r.data.user);

export const updateUser = (id, payload) =>
  api.patch(`/users/${id}`, payload).then((r) => r.data.user);

export const setUserActive = (id, isActive) =>
  api.patch(`/users/${id}/active`, { isActive }).then((r) => r.data.user);
