import Booking from '../models/Booking.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/roles.js';
import { getRoute, buildEta } from '../utils/routing.js';
import { geocodeAddress } from '../utils/geocoding.js';
import WorkerAvailability from '../models/WorkerAvailability.js';
import {
  getCachedWorkerLocation,
  getCachedBookingRoute,
  setCachedWorkerLocation,
} from '../sockets/index.js';

const hasCoords = (lat, lng) =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  typeof lng === 'number' &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const buildAddressString = (address = {}) =>
  [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');

const populateBooking = (q) =>
  q
    .populate('service', 'name slug image durationMinutes')
    .populate('worker', 'name phone email avatar')
    .populate('user', 'name phone email');

// Returns everything the tracking page needs to paint immediately:
// booking detail, last-known worker location, latest cached route + ETA.
// If we don't have a cached route yet but the worker has a known position,
// we synchronously ask OSRM for one — kept short via the routing util's timeout.
export const getTrackingState = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id).select('+startPin +endPin'));
  if (!booking) throw new ApiError(404, 'Booking not found');

  // Authorization — the customer who made the booking, the assigned worker, or any admin/manager.
  const me = String(req.user._id);
  const isOwner = String(booking.user?._id) === me;
  const isWorker = booking.worker && String(booking.worker._id) === me;
  const isPrivileged = req.user.role === ROLES.ADMIN;
  if (!isOwner && !isWorker && !isPrivileged) {
    throw new ApiError(403, 'Forbidden');
  }

  let dest = hasCoords(booking.address?.lat, booking.address?.lng)
    ? { lat: booking.address.lat, lng: booking.address.lng }
    : null;

  if (!dest) {
    const inferred = await geocodeAddress(buildAddressString(booking.address));
    if (inferred) {
      dest = inferred;
      booking.address.lat = inferred.lat;
      booking.address.lng = inferred.lng;
      await booking.save();
      console.debug('[tracking] destination geocoded', {
        bookingId: String(booking._id),
        lat: inferred.lat,
        lng: inferred.lng,
      });
    }
  }

  let workerLocation = null;
  if (booking.worker?._id) {
    const qLat = parseFloat(req.query.lat);
    const qLng = parseFloat(req.query.lng);
    const isOwnWorker = String(booking.worker._id) === me;

    if (hasCoords(qLat, qLng) && isOwnWorker) {
      workerLocation = {
        lat: qLat,
        lng: qLng,
        accuracy: req.query.accuracy ? parseFloat(req.query.accuracy) : null,
        at: new Date().toISOString(),
        workerId: String(booking.worker._id),
      };
      // Cache this immediately in the socket manager
      setCachedWorkerLocation(booking.worker._id, workerLocation);
      
      // Update database availability last location asynchronously
      WorkerAvailability.updateOne(
        { worker: booking.worker._id },
        {
          $set: {
            lastSeenAt: new Date(),
            online: true,
            lastLocation: {
              lat: qLat,
              lng: qLng,
              accuracy: req.query.accuracy ? parseFloat(req.query.accuracy) : null,
              at: new Date(),
            },
          },
        }
      ).catch((err) => console.error('[tracking] failed to update worker availability location:', err.message));
    } else {
      // Look up cached socket location
      workerLocation = getCachedWorkerLocation(booking.worker._id);
      if (!workerLocation) {
        // Fall back to database last location
        const avail = await WorkerAvailability.findOne({ worker: booking.worker._id }).lean();
        if (avail?.lastLocation?.lat != null && avail?.lastLocation?.lng != null) {
          workerLocation = {
            lat: avail.lastLocation.lat,
            lng: avail.lastLocation.lng,
            accuracy: avail.lastLocation.accuracy,
            at: avail.lastLocation.at ? avail.lastLocation.at.toISOString() : new Date().toISOString(),
            workerId: String(booking.worker._id),
          };
        }
      }
    }
  }

  console.debug('[tracking] coordinates', {
    bookingId: String(booking._id),
    destination: dest,
    workerLocation,
  });

  // Prefer cache, otherwise compute fresh if we have both endpoints.
  let routePayload = getCachedBookingRoute(booking._id);
  if (!routePayload && workerLocation && dest) {
    const computed = await getRoute({
      from: { lat: workerLocation.lat, lng: workerLocation.lng },
      to: dest,
    });
    if (computed) {
      const eta = buildEta({ route: computed });
      console.debug('[tracking] route bootstrap', {
        bookingId: String(booking._id),
        pointCount: computed.coordinates?.length || 0,
        distanceMeters: eta?.distanceMeters,
        durationSeconds: eta?.durationSeconds,
        fallback: !!eta?.fallback,
      });
      routePayload = {
        route: { coordinates: computed.coordinates, fallback: !!computed.fallback },
        eta,
        workerLocation,
        destination: dest,
        at: new Date().toISOString(),
      };
    }
  }

  res.json({
    booking: {
      _id: booking._id,
      code: booking.code,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      assignedAt: booking.assignedAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      amount: booking.amount,
      service: booking.service,
      worker: booking.worker,
      user: booking.user,
      address: booking.address,
      startPin: isOwner || isPrivileged ? booking.startPin : undefined,
      endPin: isOwner || isPrivileged ? booking.endPin : undefined,
      hasStartPin: !!booking.startPin,
      hasEndPin: !!booking.endPin,
    },
    destination: dest,
    workerLocation,
    route: routePayload?.route || null,
    eta: routePayload?.eta || null,
    routeAt: routePayload?.at || null,
  });
});
