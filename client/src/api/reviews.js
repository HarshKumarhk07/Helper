import api from './axios.js';

export const createReview = (payload) =>
  api.post('/reviews', payload).then((r) => r.data.review);

export const getReviews = (params) =>
  api.get('/reviews', { params }).then((r) => r.data.reviews);
