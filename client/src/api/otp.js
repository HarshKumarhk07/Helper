import api from './axios.js';

export const sendOtp = (phone) =>
  api.post('/auth/otp/send', { phone }).then((r) => r.data);

export const verifyOtp = ({ phone, code, name }) =>
  api.post('/auth/otp/verify', { phone, code, name }).then((r) => r.data);
