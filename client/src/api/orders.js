import api from './axios.js';

export const createOrder = (payload) =>
  api.post('/orders', payload).then((r) => r.data.order);

export const listMyOrders = () =>
  api.get('/orders/mine').then((r) => r.data.orders);

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data.order);

export const listAllOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then((r) => r.data.order);

export const cancelMyOrder = (id) =>
  api.post(`/orders/${id}/cancel`).then((r) => r.data.order);

export const updateOrderNote = (id, note) =>
  api.patch(`/orders/${id}/note`, { note }).then((r) => r.data.order);
