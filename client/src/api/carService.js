import api from './axios.js';

export const submitCarKyc = (formData) => api.post('/car-service/kyc', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getMyCarKyc = () => api.get('/car-service/kyc/me');

export const listCarKycSubmissions = (status) => api.get('/car-service/admin/kyc', { params: { status } });

export const reviewCarKyc = (id, data) => api.patch(`/car-service/admin/kyc/${id}`, data);

export const createCarTrip = (data) => api.post('/car-service/trips', data);

export const searchCarTrips = (params) => api.get('/car-service/trips', { params });

export const getCarTripDetail = (id) => api.get(`/car-service/trips/${id}`);

export const cancelCarTrip = (id) => api.patch(`/car-service/trips/${id}/cancel`);

export const getMyCarTrips = () => api.get('/car-service/trips/me');

export const createCarBooking = (data) => api.post('/car-service/bookings', data);

export const verifyCarBookingPayment = (data) => api.post('/car-service/bookings/verify', data);

export const cancelCarBooking = (id) => api.patch(`/car-service/bookings/${id}/cancel`);

export const getMyCarBookings = () => api.get('/car-service/bookings/me');
