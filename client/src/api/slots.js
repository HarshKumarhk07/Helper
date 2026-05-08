import api from './axios.js';

export const getServiceSlots = ({ serviceId, date }) =>
  api.get('/slots', { params: { serviceId, date } }).then((r) => r.data);
