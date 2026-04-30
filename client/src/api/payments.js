import api from './axios.js';

export const createRazorpayOrder = (payload) =>
  api.post('/payments/create-order', payload).then((r) => r.data.razorpayOrder);

export const verifyRazorpayPayment = (payload) =>
  api.post('/payments/verify', payload).then((r) => r.data);
