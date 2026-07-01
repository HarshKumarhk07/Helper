import api from './axios.js';

// Admin master catalog the worker can pick from (+ which they've already added).
export const getServiceCatalog = () =>
  api.get('/worker/services/catalog').then((r) => r.data);

// The worker's own offered services with pricing.
export const getMyServices = () =>
  api.get('/worker/services').then((r) => r.data.services);

export const addWorkerService = (payload) =>
  api.post('/worker/services', payload).then((r) => r.data.service);

export const updateWorkerService = (id, payload) =>
  api.put(`/worker/services/${id}`, payload).then((r) => r.data.service);

export const deleteWorkerService = (id) =>
  api.delete(`/worker/services/${id}`).then((r) => r.data);
