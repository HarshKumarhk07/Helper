import api from './axios.js';

export const getAdminStats = () =>
  api.get('/admin/stats').then((r) => r.data);

// Notification badge counts for the admin console (new items per section).
export const getAdminBadges = () =>
  api.get('/admin/badges').then((r) => r.data.badges || {});

// Mark a section as opened. Resolves to the previous "seen" timestamp so a page
// can highlight rows that arrived since the admin last looked.
export const markAdminSeen = (key) =>
  api.post('/admin/badges/seen', { key }).then((r) => r.data);
