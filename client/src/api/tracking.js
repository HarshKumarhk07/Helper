import api from './axios.js';

export const getTrackingState = (bookingId) =>
  api.get(`/tracking/booking/${bookingId}`).then((r) => r.data);
