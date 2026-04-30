import api from './axios.js';

export const listMyAddresses = () =>
  api.get('/addresses').then((r) => r.data.addresses);

export const createAddress = (payload) =>
  api.post('/addresses', payload).then((r) => r.data.address);

export const updateAddress = (id, payload) =>
  api.patch(`/addresses/${id}`, payload).then((r) => r.data.address);

export const deleteAddress = (id) =>
  api.delete(`/addresses/${id}`).then((r) => r.data);
