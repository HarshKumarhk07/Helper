import api from './axios.js';

export const createTicket = (payload) =>
  api.post('/support', payload).then((r) => r.data.ticket);

export const listMyTickets = (params = {}) =>
  api.get('/support/mine', { params }).then((r) => r.data.tickets);

export const listAllTickets = (params = {}) =>
  api.get('/support', { params }).then((r) => r.data.tickets);

export const getTicket = (id) =>
  api.get(`/support/${id}`).then((r) => r.data.ticket);

export const addMessage = (id, text) =>
  api.post(`/support/${id}/messages`, { text }).then((r) => r.data.ticket);

export const updateTicketStatus = (id, payload) =>
  api.patch(`/support/${id}/status`, payload).then((r) => r.data.ticket);
