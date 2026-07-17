import api from './axios.js';

// Admin master catalog the worker can pick from (+ which they've already added).
export const getServiceCatalog = () =>
  api.get('/worker/services/catalog').then((r) => r.data);

// The worker's own offered services with pricing.
export const getMyServices = () =>
  api.get('/worker/services').then((r) => r.data.services);

export const addWorkerService = (payload) =>
  api.post('/worker/services', payload).then((r) => r.data.service);

// Onboarding multi-select — enrol in several services at once (catalog price;
// the worker refines pricing per service afterwards).
export const bulkAddWorkerServices = (serviceIds) =>
  api.post('/worker/services/bulk', { serviceIds }).then((r) => r.data);

// ── Admin override on a worker's enrolments ─────────────────────────────────
export const adminGetWorkerServices = (workerId) =>
  api.get(`/users/workers/${workerId}/services`).then((r) => r.data);

export const adminAddWorkerService = (workerId, serviceId) =>
  api.post(`/users/workers/${workerId}/services`, { serviceId }).then((r) => r.data.service);

export const adminRemoveWorkerService = (workerId, serviceId) =>
  api.delete(`/users/workers/${workerId}/services/${serviceId}`).then((r) => r.data);

export const updateWorkerService = (id, payload) =>
  api.put(`/worker/services/${id}`, payload).then((r) => r.data.service);

export const deleteWorkerService = (id) =>
  api.delete(`/worker/services/${id}`).then((r) => r.data);
