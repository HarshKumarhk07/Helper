import api from './axios.js';

export const getTrackingState = (bookingId, params = {}) =>
  api.get(`/tracking/booking/${bookingId}`, { params }).then((r) => r.data);
