import api from './axios.js';

export const createBooking = (payload) =>
  api.post('/bookings', payload).then((r) => r.data.booking);

export const listMyBookings = (params = {}) =>
  api.get('/bookings/mine', { params }).then((r) => r.data.bookings);

export const listAllBookings = (params = {}) =>
  api.get('/bookings', { params }).then((r) => r.data);

export const listWorkerJobs = (params = {}) =>
  api.get('/bookings/worker/jobs', { params }).then((r) => r.data.bookings);

export const getBooking = (id) =>
  api.get(`/bookings/${id}`).then((r) => r.data.booking);

export const assignWorker = (id, workerId) =>
  api.post(`/bookings/${id}/assign`, { workerId }).then((r) => r.data.booking);

export const autoAssign = (id) =>
  api.post(`/bookings/${id}/auto-assign`).then((r) => r.data.booking);

export const transitionStatus = (id, to, note, pin) =>
  api.post(`/bookings/${id}/status`, { to, note, pin }).then((r) => r.data.booking);

// Worker declines an assigned job (before accepting) with a reason.
export const rejectJob = (id, reason) =>
  api.post(`/bookings/${id}/reject`, { reason }).then((r) => r.data);

// Worker taps "On the way" — stamps enRouteAt. This is NOT a status change:
// the booking stays `confirmed`. Live tracking gates on enRouteAt, so a booking
// scheduled days out never shows a bogus "worker en route" map.
export const markEnRoute = (id) =>
  api.post(`/bookings/${id}/en-route`).then((r) => r.data.booking);

// Customer picks a different professional. The booking is already paid, so this
// re-opens the SAME booking to pending_confirmation with a fresh window rather
// than cancelling + refunding.
export const changeWorker = (id, workerId) =>
  api.post(`/bookings/${id}/change-worker`, { workerId }).then((r) => r.data.booking);

// ── Variable pricing / quotes ────────────────────────────────────────────────
export const createQuoteRequest = (payload) =>
  api.post('/bookings/quote-request', payload).then((r) => r.data.booking);

export const sendQuote = (id, amount, note) =>
  api.post(`/bookings/${id}/quote`, { amount, note }).then((r) => r.data.booking);

export const getQuotes = (id) =>
  api.get(`/bookings/${id}/quotes`).then((r) => r.data);

export const acceptQuote = (id, qid) =>
  api.post(`/bookings/${id}/quotes/${qid}/accept`).then((r) => r.data.booking);

export const rejectQuote = (id, qid) =>
  api.post(`/bookings/${id}/quotes/${qid}/reject`).then((r) => r.data.booking);

export const getWorkerEarnings = () =>
  api.get('/bookings/worker/earnings').then((r) => r.data);
