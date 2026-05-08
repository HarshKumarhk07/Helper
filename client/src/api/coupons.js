import api from './axios.js';

export const validateCoupon = (payload) =>
  api.post('/coupons/validate', payload).then((r) => r.data);

export const listEligibleCoupons = () =>
  api.get('/coupons/eligible').then((r) => r.data.coupons);

export const createCoupon = (payload) =>
  api.post('/coupons', payload).then((r) => r.data);

export const listCoupons = () =>
  api.get('/coupons').then((r) => r.data);

export const updateCoupon = (id, payload) =>
  api.patch(`/coupons/${id}`, payload).then((r) => r.data);

export const deleteCoupon = (id) =>
  api.delete(`/coupons/${id}`).then((r) => r.data);
