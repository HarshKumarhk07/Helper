import User from '../models/User.js';

// Single source of truth for flipping a worker's availability. Both the
// booking-accept path and the service-completion (end PIN) path MUST go
// through these helpers — never set currentStatus/currentBooking inline in a
// controller, so the busy⇄free rule and the currentBooking back-link stay
// consistent everywhere.

// Worker accepted a booking → mark them busy and link the job that did it.
export const markWorkerUnavailable = async (workerId, bookingId) => {
  if (!workerId) return null;
  return User.updateOne(
    { _id: workerId },
    { $set: { currentStatus: 'busy', currentBooking: bookingId } }
  );
};

// Service finished (end PIN submitted) → free the worker and clear the link.
export const markWorkerAvailable = async (workerId) => {
  if (!workerId) return null;
  return User.updateOne(
    { _id: workerId },
    { $set: { currentStatus: 'free', currentBooking: null } }
  );
};
