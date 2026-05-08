import api from './axios.js';

export const getMyAvailability = () =>
  api.get('/availability/me').then((r) => r.data.availability);

export const updateMyAvailability = (payload) =>
  api.put('/availability/me', payload).then((r) => r.data.availability);

export const setOnline = (online) =>
  api.post('/availability/me/online', { online }).then((r) => r.data.availability);

export const adminListAvailability = () =>
  api.get('/availability').then((r) => r.data.availabilities);
