import api from './axios.js';

export const refundPayment = ({ type, referenceId, amount, reason }) =>
  api
    .post('/payments/refund', { type, referenceId, amount, reason })
    .then((r) => r.data);
