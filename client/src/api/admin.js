import api from './axios.js';

export const getAdminStats = () =>
  api.get('/admin/stats').then((r) => r.data);
