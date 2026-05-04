import assert from 'node:assert/strict';
import { BOOKING_STATUS, BOOKING_TYPE, PAYMENT_MODE } from '../src/config/booking.js';
import { ROLES } from '../src/config/roles.js';
import { assertBookingTransition } from '../src/utils/bookingTransitionGuard.js';
import { generatePin } from '../src/utils/pin.js';

const userId = '64f111111111111111111111';
const workerId = '64f222222222222222222222';

const booking = {
  user: userId,
  worker: workerId,
  status: BOOKING_STATUS.ASSIGNED,
  type: BOOKING_TYPE.INSTANT,
  paymentMode: PAYMENT_MODE.COD,
  startPin: generatePin(6),
  endPin: generatePin(6),
};

assert.equal(booking.startPin.length, 6);
assert.equal(booking.endPin.length, 6);

assert.doesNotThrow(() =>
  assertBookingTransition({
    booking,
    to: BOOKING_STATUS.IN_PROGRESS,
    pin: booking.startPin,
    role: ROLES.WORKER,
    userId: workerId,
  })
);

booking.status = BOOKING_STATUS.IN_PROGRESS;

assert.doesNotThrow(() =>
  assertBookingTransition({
    booking,
    to: BOOKING_STATUS.COMPLETED,
    pin: booking.endPin,
    role: ROLES.WORKER,
    userId: workerId,
  })
);

assert.throws(
  () =>
    assertBookingTransition({
      booking,
      to: BOOKING_STATUS.COMPLETED,
      pin: '000000',
      role: ROLES.WORKER,
      userId: workerId,
    }),
  /Invalid end PIN/
);

const cancellableBooking = {
  ...booking,
  status: BOOKING_STATUS.PLACED,
  worker: null,
};

assert.doesNotThrow(() =>
  assertBookingTransition({
    booking: cancellableBooking,
    to: BOOKING_STATUS.CANCELLED,
    pin: undefined,
    role: ROLES.USER,
    userId,
  })
);

console.log('Slice C PIN validation passed');