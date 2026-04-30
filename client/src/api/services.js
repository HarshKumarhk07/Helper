import api from './axios.js';

export const listServices = (params = {}) =>
  api.get('/services', { params }).then((r) => r.data.services);

export const getService = (id) =>
  api.get(`/services/${id}`).then((r) => r.data.service);

export const createService = (payload) =>
  api.post('/services', payload).then((r) => r.data.service);

export const updateService = (id, payload) =>
  api.patch(`/services/${id}`, payload).then((r) => r.data.service);

export const deleteService = (id) =>
  api.delete(`/services/${id}`).then((r) => r.data);
