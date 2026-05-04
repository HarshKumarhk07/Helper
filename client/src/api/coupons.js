import api from './axios.js';

export const validateCoupon = (payload) =>
  api.post('/coupons/validate', payload).then((r) => r.data);

export const createCoupon = (payload) =>
  api.post('/coupons', payload).then((r) => r.data);

export const listCoupons = () =>
  api.get('/coupons').then((r) => r.data);
