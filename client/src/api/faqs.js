import api from './axios.js';

export const getPublicFaqs = async () => {
  const { data } = await api.get('/faqs/public');
  return data.faqs;
};

// Admin endpoints
export const getAllFaqs = async () => {
  const { data } = await api.get('/faqs');
  return data.faqs;
};

export const createFaq = async (payload) => {
  const { data } = await api.post('/faqs', payload);
  return data.faq;
};

export const updateFaq = async (id, payload) => {
  const { data } = await api.put(`/faqs/${id}`, payload);
  return data.faq;
};

export const deleteFaq = async (id) => {
  const { data } = await api.delete(`/faqs/${id}`);
  return data.success;
};
