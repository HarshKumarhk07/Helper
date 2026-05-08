import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
