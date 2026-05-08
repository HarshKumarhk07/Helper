import api from './axios.js';

export const requestPasswordReset = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = ({ token, password }) =>
  api.post('/auth/reset-password', { token, password }).then((r) => r.data);
