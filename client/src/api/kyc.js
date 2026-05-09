import api from './axios.js';

export const getMyKyc = () => api.get('/kyc/me').then((r) => r.data);

export const submitKyc = (formData) =>
  api
    .post('/kyc/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.user);

export const listKycSubmissions = (params = {}) =>
  api.get('/kyc/submissions', { params }).then((r) => r.data.workers);

export const getKycSubmission = (id) =>
  api.get(`/kyc/submissions/${id}`).then((r) => r.data.worker);

export const approveKyc = (id) =>
  api.post(`/kyc/submissions/${id}/approve`).then((r) => r.data.worker);

export const rejectKyc = (id, reason) =>
  api.post(`/kyc/submissions/${id}/reject`, { reason }).then((r) => r.data.worker);

export const getWorkerProfile = (id) =>
  api.get(`/kyc/workers/${id}/profile`).then((r) => r.data);
