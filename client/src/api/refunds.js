import api from './axios.js';

export const refundPayment = ({ type, referenceId, amount, reason, target }) =>
  api
    .post('/payments/refund', { type, referenceId, amount, reason, target })
    .then((r) => r.data);
