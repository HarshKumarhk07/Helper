import api from './axios.js';

export const getMyWallet = () => api.get('/wallet/me').then((r) => r.data);

export const getMyTransactions = (params = {}) =>
  api.get('/wallet/me/transactions', { params }).then((r) => r.data);

export const getUserWallet = (userId) =>
  api.get(`/wallet/users/${userId}`).then((r) => r.data);

export const adminCreditWallet = (userId, payload) =>
  api.post(`/wallet/users/${userId}/credit`, payload).then((r) => r.data);

export const adminDebitWallet = (userId, payload) =>
  api.post(`/wallet/users/${userId}/debit`, payload).then((r) => r.data);

export const adminToggleFreeze = (userId, freeze) =>
  api.post(`/wallet/users/${userId}/freeze`, { freeze }).then((r) => r.data.wallet);
