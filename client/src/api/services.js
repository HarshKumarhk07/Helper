import api from './axios.js';

// [CAR-TRIPS DISABLED] The "Car Booking & Travel" service (slug 'car-trips') is
// hidden from all public listings. Admin pages pass { includeHidden: true } to
// keep managing it. See CAR_TRIPS_DISABLED.md.
const HIDDEN_SERVICE_SLUGS = ['car-trips'];

export const listServices = ({ includeHidden, ...params } = {}) =>
  api.get('/services', { params }).then((r) => {
    const services = r.data.services || [];
    return includeHidden
      ? services
      : services.filter((s) => !HIDDEN_SERVICE_SLUGS.includes(s?.slug));
  });

export const getService = (id) =>
  api.get(`/services/${id}`).then((r) => r.data.service);

export const getServiceWorkers = (id) =>
  api.get(`/services/${id}/workers`).then((r) => r.data.workers);

export const getServiceReviews = (id) =>
  api.get(`/services/${id}/reviews`).then((r) => r.data.reviews);

export const createService = (payload) =>
  api.post('/services', payload).then((r) => r.data.service);

export const updateService = (id, payload) =>
  api.patch(`/services/${id}`, payload).then((r) => r.data.service);

export const deleteService = (id) =>
  api.delete(`/services/${id}`).then((r) => r.data);
