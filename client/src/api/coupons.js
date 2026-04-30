import api from './axios.js';

export const validateCoupon = (payload) =>
  api.post('/coupons/validate', payload).then((r) => r.data);
