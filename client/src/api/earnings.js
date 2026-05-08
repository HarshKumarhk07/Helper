import api from './axios.js';

export const getMyEarnings = () =>
  api.get('/bookings/worker/earnings').then((r) => r.data);

export const getMyEarningEntries = (params = {}) =>
  api.get('/bookings/worker/earnings/entries', { params }).then((r) => r.data.entries);
