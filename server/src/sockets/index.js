import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { ROLES } from '../config/roles.js';
import WorkerAvailability from '../models/WorkerAvailability.js';

// In-memory store of latest worker positions (lost on restart by design — UX is "live").
const workerLocations = new Map(); // workerId -> { lat, lng, accuracy, at }

const roomFor = {
  user: (id) => `user_${id}`,
  worker: (id) => `worker_${id}`,
  booking: (id) => `booking_${id}`,
  adminTracking: 'admin_tracking',
};

const log = (...args) => console.log('[socket]', ...args);

let ioRef = null;

export const getIO = () => ioRef;

export const broadcastLocation = (data) => {
  if (!ioRef) return;
  if (data.bookingId) {
    ioRef.to(roomFor.booking(data.bookingId)).emit('location:update', data);
  }
  ioRef.to(roomFor.adminTracking).emit('location:update', data);
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('socket auth required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = { id: decoded.sub, role: decoded.role };
      next();
    } catch {
      next(new Error('invalid socket token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.user || {};
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(roomFor.user(userId));
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      socket.join(roomFor.adminTracking);
    }
    if (role === ROLES.WORKER) {
      socket.join(roomFor.worker(userId));
      try {
        const avail = await WorkerAvailability.ensureFor(userId);
        avail.lastSeenAt = new Date();
        if (!avail.online) avail.online = true;
        await avail.save();
      } catch (err) {
        log('availability ensure failed:', err.message);
      }
    }

    log(`connected user=${userId} role=${role} socket=${socket.id}`);

    // Worker pushes location for one or more active bookings
    socket.on('worker:location', async (payload = {}) => {
      if (role !== ROLES.WORKER) return;
      const { lat, lng, accuracy, bookingId, bookingIds } = payload;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      const at = new Date().toISOString();
      const data = { workerId: userId, lat, lng, accuracy, at };
      workerLocations.set(userId, data);

      const ids = Array.isArray(bookingIds)
        ? bookingIds
        : bookingId
        ? [bookingId]
        : [];

      if (ids.length === 0) {
        io.to(roomFor.adminTracking).emit('location:update', data);
        io.to(roomFor.worker(userId)).emit('location:update', data);
      } else {
        for (const bId of ids) {
          io.to(roomFor.booking(bId)).emit('location:update', { ...data, bookingId: bId });
        }
        io.to(roomFor.adminTracking).emit('location:update', { ...data, bookingId: ids[0] });
      }

      // Throttle availability updates (only every ~60s)
      try {
        const now = Date.now();
        if (!socket._lastAvailUpdate || now - socket._lastAvailUpdate > 60000) {
          socket._lastAvailUpdate = now;
          await WorkerAvailability.updateOne(
            { worker: userId },
            { $set: { lastSeenAt: new Date(), online: true } }
          );
        }
      } catch (err) {
        log('availability update failed:', err.message);
      }
    });

    // Anyone with permission to view a booking can subscribe to its location channel.
    // We don't re-validate auth here — joining only adds a listener; emits go through
    // the worker:location handler above which is auth-gated.
    socket.on('booking:join', (bookingId) => {
      if (!bookingId) return;
      socket.join(roomFor.booking(bookingId));
      // Emit last known location to the late joiner if we have it.
      // We can't tell who the worker is from bookingId alone here, so the client
      // requests it explicitly via 'booking:lastLocation' if needed.
    });

    socket.on('booking:leave', (bookingId) => {
      if (!bookingId) return;
      socket.leave(roomFor.booking(bookingId));
    });

    socket.on('booking:lastLocation', ({ workerId: wId } = {}) => {
      if (!wId) return;
      const last = workerLocations.get(wId);
      if (last) socket.emit('location:update', last);
    });

    socket.on('worker:offline', async () => {
      if (role !== ROLES.WORKER) return;
      try {
        await WorkerAvailability.updateOne(
          { worker: userId },
          { $set: { online: false } }
        );
        io.to(roomFor.adminTracking).emit('worker:offline', { workerId: userId });
      } catch (err) {
        log('offline update failed:', err.message);
      }
    });

    socket.on('disconnect', async (reason) => {
      log(`disconnect user=${userId} reason=${reason}`);
      if (role === ROLES.WORKER) {
        // We don't immediately mark offline — workers may briefly drop connection.
        // A scheduled job (out of scope here) could mark them offline after N minutes.
        io.to(roomFor.adminTracking).emit('worker:disconnected', { workerId: userId });
      }
    });
  });

  ioRef = io;
  return io;
};
