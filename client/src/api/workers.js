import api from './axios.js';

export const getFeaturedWorkers = async (params = {}) => {
  const { data } = await api.get('/users/featured', { params });
  return data.workers;
};
