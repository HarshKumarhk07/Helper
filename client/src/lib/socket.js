import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios.js';

const URL = API_BASE_URL.replace(/\/api$/, '');

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    const token = localStorage.getItem('velora_access_token') || '';
    cb({ token });
  },
});

export const ensureSocket = () => {
  if (!socket.connected) socket.connect();
  return socket;
};

export const joinBookingRoom = (bookingId) => {
  ensureSocket();
  socket.emit('booking:join', bookingId);
};

export const leaveBookingRoom = (bookingId) => {
  if (!socket.connected) return;
  socket.emit('booking:leave', bookingId);
};

export const requestLastLocation = (workerId) => {
  ensureSocket();
  socket.emit('booking:lastLocation', { workerId });
};
