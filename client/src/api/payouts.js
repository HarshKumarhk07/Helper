import api from './axios.js';

export const listPendingByWorker = () =>
  api.get('/payouts/pending').then((r) => r.data);

export const listWorkerPendingEntries = (workerId) =>
  api.get(`/payouts/workers/${workerId}/pending`).then((r) => r.data);

export const createPayoutBatch = (payload) =>
  api.post('/payouts', payload).then((r) => r.data.batch);

export const listPayoutBatches = (params = {}) =>
  api.get('/payouts', { params }).then((r) => r.data.batches);

export const getPayoutBatch = (id) =>
  api.get(`/payouts/${id}`).then((r) => r.data.batch);

export const getPayoutSummary = () =>
  api.get('/payouts/summary').then((r) => r.data);

export const backfillEarnings = () =>
  api.post('/payouts/backfill').then((r) => r.data);
