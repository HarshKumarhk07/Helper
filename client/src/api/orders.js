import api from './axios.js';

export const createOrder = (payload) =>
  api.post('/orders', payload).then((r) => r.data.order);

export const listMyOrders = () =>
  api.get('/orders/mine').then((r) => r.data.orders);

export const listAllOrders = () =>
  api.get('/orders').then((r) => r.data.orders);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then((r) => r.data.order);

export const updateOrderNote = (id, note) =>
  api.patch(`/orders/${id}/note`, { note }).then((r) => r.data.order);
