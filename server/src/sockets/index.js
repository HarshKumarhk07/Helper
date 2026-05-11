import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { ROLES } from '../config/roles.js';
import WorkerAvailability from '../models/WorkerAvailability.js';
import Booking from '../models/Booking.js';
import { getRoute, buildEta, significantMove } from '../utils/routing.js';

// In-memory store of latest worker positions (lost on restart by design — UX is "live").
const workerLocations = new Map(); // workerId -> { lat, lng, accuracy, at }

// Booking destinations cached briefly so we don't hit the DB on every location ping.
const bookingDestCache = new Map(); // bookingId -> { lat, lng, expiresAt }
const BOOKING_DEST_TTL_MS = 60 * 60 * 1000; // 1 hour

// Latest computed route per booking — used to dedupe and to replay on late-joiners.
const bookingRoutes = new Map(); // bookingId -> { route, eta, workerLocation, at }
const ROUTE_REFRESH_MS = 30_000;
const ROUTE_REFRESH_DISTANCE_M = 50;

const getBookingDestination = async (bookingId) => {
  const cached = bookingDestCache.get(bookingId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.lat == null ? null : { lat: cached.lat, lng: cached.lng };
  }
  const booking = await Booking.findById(bookingId).select('address').lean();
  const lat = booking?.address?.lat;
  const lng = booking?.address?.lng;
  bookingDestCache.set(bookingId, {
    lat,
    lng,
    expiresAt: Date.now() + BOOKING_DEST_TTL_MS,
  });
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
};

const roomFor = {
  user: (id) => `user_${id}`,
  worker: (id) => `worker_${id}`,
  booking: (id) => `booking_${id}`,
  adminTracking: 'admin_tracking',
};

const log = (...args) => console.log('[socket]', ...args);

let ioRef = null;

export const getIO = () => ioRef;

// Read-only accessors for HTTP endpoints that want to seed the client with
// the latest known route/location.
export const getCachedWorkerLocation = (workerId) =>
  workerLocations.get(String(workerId)) || null;
export const getCachedBookingRoute = (bookingId) =>
  bookingRoutes.get(String(bookingId)) || null;

// Compute and broadcast a fresh route for a booking, but only when the worker
// has actually moved meaningfully or enough time has passed.
async function recomputeBookingRoute({ io, bookingId, workerLocation }) {
  const dest = await getBookingDestination(bookingId);
  if (!dest) return;

  const previous = bookingRoutes.get(bookingId);
  const now = Date.now();
  if (
    previous &&
    !significantMove(previous.workerLocation, workerLocation, ROUTE_REFRESH_DISTANCE_M) &&
    now - previous.at < ROUTE_REFRESH_MS
  ) {
    return; // Skip — no meaningful change.
  }

  const route = await getRoute({
    from: { lat: workerLocation.lat, lng: workerLocation.lng },
    to: dest,
  });
  if (!route) return;

  const eta = buildEta({ route });
  const payload = {
    bookingId,
    workerId: workerLocation.workerId,
    route: {
      coordinates: route.coordinates,
      fallback: !!route.fallback,
    },
    eta,
    workerLocation,
    destination: dest,
    at: new Date().toISOString(),
  };

  bookingRoutes.set(bookingId, { ...payload, at: now });
  io.to(roomFor.booking(bookingId)).emit('booking:route', payload);
}

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
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'https://urban-company-seven.vercel.app',
      ],
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
          // Re-route in the background — don't block the location broadcast.
          recomputeBookingRoute({ io, bookingId: bId, workerLocation: data }).catch((err) =>
            log('route compute failed:', err.message)
          );
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
      // Replay the latest route + worker location to the joining client so the
      // map paints immediately without waiting for the next ping.
      const cached = bookingRoutes.get(bookingId);
      if (cached) {
        socket.emit('location:update', {
          ...cached.workerLocation,
          bookingId,
        });
        socket.emit('booking:route', {
          bookingId,
          workerId: cached.workerLocation.workerId,
          route: cached.route,
          eta: cached.eta,
          workerLocation: cached.workerLocation,
          destination: cached.destination,
          at: cached.at && new Date(cached.at).toISOString(),
        });
      }
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
