import api from './axios.js';

export const createBooking = (payload) =>
  api.post('/bookings', payload).then((r) => r.data.booking);

export const listMyBookings = (params = {}) =>
  api.get('/bookings/mine', { params }).then((r) => r.data.bookings);

export const listAllBookings = (params = {}) =>
  api.get('/bookings', { params }).then((r) => r.data.bookings);

export const listWorkerJobs = (params = {}) =>
  api.get('/bookings/worker/jobs', { params }).then((r) => r.data.bookings);

export const getBooking = (id) =>
  api.get(`/bookings/${id}`).then((r) => r.data.booking);

export const assignWorker = (id, workerId) =>
  api.post(`/bookings/${id}/assign`, { workerId }).then((r) => r.data.booking);

export const autoAssign = (id) =>
  api.post(`/bookings/${id}/auto-assign`).then((r) => r.data.booking);

export const transitionStatus = (id, to, note, pin) =>
  api.post(`/bookings/${id}/status`, { to, note, pin }).then((r) => r.data.booking);

export const getWorkerEarnings = () =>
  api.get('/bookings/worker/earnings').then((r) => r.data);
