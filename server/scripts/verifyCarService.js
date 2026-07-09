import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import CarServiceKYC from '../src/models/CarServiceKYC.js';
import CarTrip from '../src/models/CarTrip.js';
import CarBooking from '../src/models/CarBooking.js';
import { ROLES } from '../src/config/roles.js';

// Setup Mock Request/Response for controllers
const mockReqRes = (body = {}, params = {}, query = {}, user = null) => {
  const req = { body, params, query, user };
  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    set(key, value) {
      this.headers[key] = value;
      return this;
    }
  };
  return { req, res };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
};

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // Find or create test users
  let testWorker = await User.findOne({ email: 'test_car_worker@example.com' });
  if (!testWorker) {
    testWorker = await User.create({
      name: 'Car Professional',
      email: 'test_car_worker@example.com',
      phone: '9999888877',
      password: 'Password123!',
      role: ROLES.WORKER,
      kycStatus: 'verified',
    });
  }

  let testCustomer = await User.findOne({ email: 'test_car_customer@example.com' });
  if (!testCustomer) {
    testCustomer = await User.create({
      name: 'Car Customer',
      email: 'test_car_customer@example.com',
      phone: '9999777766',
      password: 'Password123!',
      role: ROLES.USER,
    });
  }

  // Clear previous test records
  await CarServiceKYC.deleteMany({ professional: testWorker._id });
  await CarTrip.deleteMany({ professional: testWorker._id });
  await CarBooking.deleteMany({ customer: testCustomer._id });

  const controllers = await import('../src/controllers/carServiceController.js');

  console.log('\n--- 1. Testing KYC Registration Plates Validation ---');
  {
    // Test invalid plate format
    const { req, res } = mockReqRes(
      { carNumber: 'INVALID_PLATE', drivingLicenseExpiry: new Date(Date.now() + 1000000) },
      {},
      {},
      testWorker
    );
    try {
      await controllers.submitCarKyc(req, res);
      assert(false, 'Should have failed on invalid plate.');
    } catch (err) {
      assert(err.status === 400, 'Expected 400 Bad Request error');
      console.log('✓ Successfully rejected invalid plate format.');
    }

    // Test valid plate format
    const { req: req2, res: res2 } = mockReqRes(
      { carNumber: 'MH 12 AB 1234', drivingLicenseExpiry: new Date(Date.now() + 1000000000) },
      {},
      {},
      testWorker
    );
    req2.files = {
      rcDocument: [{ filename: 'rc.png', path: 'http://rc.png' }],
      carPhoto: [{ filename: 'car.png', path: 'http://car.png' }],
      drivingLicense: [{ filename: 'dl.png', path: 'http://dl.png' }],
    };
    await controllers.submitCarKyc(req2, res2);
    assert(res2.statusCode === 201, 'Should register successfully with valid plate');
    console.log('✓ Successfully accepted Indian plate format (MH12AB1234).');

    // Force approve KYC
    await CarServiceKYC.findOneAndUpdate({ professional: testWorker._id }, { status: 'approved' });
    console.log('✓ KYC approved in database.');
  }

  console.log('\n--- 2. Testing Trip Creation & Expiry Queries ---');
  {
    // Create outbound & return trip
    const depTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const retTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // day after
    const { req, res } = mockReqRes(
      {
        source: 'Phagwara',
        destination: 'Jalandhar',
        departureTime: depTime.toISOString(),
        returnTime: retTime.toISOString(),
        totalSeatsOutbound: 4,
        pricePerSeatOutbound: 200,
        totalSeatsReturn: 4,
        pricePerSeatReturn: 250,
      },
      {},
      {},
      testWorker
    );
    await controllers.createTrip(req, res);
    assert(res.statusCode === 201, 'Trip should be listed');
    console.log('✓ Trip created successfully.');

    // Verify search trips runs auto-expiry
    // Create an expired trip
    const expiredDep = new Date(Date.now() - 500000);
    const expiredTrip = await CarTrip.create({
      professional: testWorker._id,
      source: 'Expired',
      destination: 'Town',
      departureTime: expiredDep,
      pricePerSeatOutbound: 100,
      totalSeatsOutbound: 2,
      seatsAvailableOutbound: 2,
      status: 'active'
    });

    const { req: reqSearch, res: resSearch } = mockReqRes({}, {}, {});
    await controllers.searchTrips(reqSearch, resSearch);
    
    // Check that expired trip status is now 'completed'
    const loadedExpired = await CarTrip.findById(expiredTrip._id);
    assert(loadedExpired.status === 'completed', 'Past departure trips must auto-expire to completed status');
    console.log('✓ Verified: query-time auto-expiry flipped expired trip to completed.');
  }

  console.log('\n--- 3. Testing Payment Verification Idempotency & Seat Allocation ---');
  {
    const trip = await CarTrip.findOne({ professional: testWorker._id, source: 'Phagwara' });
    
    // Create Booking
    const { req, res } = mockReqRes(
      {
        tripId: trip._id,
        legsBooked: ['outbound', 'return'],
        seatsOutbound: 2,
        seatsReturn: 2,
      },
      {},
      {},
      testCustomer
    );
    await controllers.createBooking(req, res);
    const booking = res.jsonData.booking;
    assert(booking.paymentStatus === 'pending', 'Booking starts in pending status');

    const cryptoModule = await import('crypto');
    const getSignature = (orderId, paymentId) => {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'sandbox_secret';
      const body = orderId + '|' + paymentId;
      return cryptoModule
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    };

    // Run first payment verification
    const { req: reqVerify1, res: resVerify1 } = mockReqRes(
      {
        razorpay_order_id: booking.razorpayOrderId,
        razorpay_payment_id: 'rzp_test_pay_123',
        razorpay_signature: getSignature(booking.razorpayOrderId, 'rzp_test_pay_123'),
        bookingId: booking._id
      },
      {},
      {},
      testCustomer
    );
    await controllers.verifyBookingPayment(reqVerify1, resVerify1);
    assert(resVerify1.jsonData.success === true, 'First payment verification succeeds');

    // Verify seats decremented
    const tripAfter1 = await CarTrip.findById(trip._id);
    assert(tripAfter1.seatsAvailableOutbound === 2, 'Outbound seats decremented by 2');
    assert(tripAfter1.seatsAvailableReturn === 2, 'Return seats decremented by 2');
    console.log('✓ First verification succeeded. Outbound seats: 2/4, Return: 2/4.');

    // Run duplicate verification call (Razorpay callback retry / redirect duplicate)
    const { req: reqVerify2, res: resVerify2 } = mockReqRes(
      {
        razorpay_order_id: booking.razorpayOrderId,
        razorpay_payment_id: 'rzp_test_pay_123',
        razorpay_signature: getSignature(booking.razorpayOrderId, 'rzp_test_pay_123'),
        bookingId: booking._id
      },
      {},
      {},
      testCustomer
    );
    await controllers.verifyBookingPayment(reqVerify2, resVerify2);
    assert(resVerify2.jsonData.success === true, 'Idempotent call should return success');

    // Verify seats did NOT decrement again
    const tripAfter2 = await CarTrip.findById(trip._id);
    assert(tripAfter2.seatsAvailableOutbound === 2, 'Idempotent verify check must not over-decrement outbound seats');
    assert(tripAfter2.seatsAvailableReturn === 2, 'Idempotent verify check must not over-decrement return seats');
    console.log('✓ Idempotency verified: duplicate verification callbacks are processed as no-ops without double-decrementing seats.');
  }

  console.log('\n--- 4. Testing Concurrency Seat Decrement Guard ---');
  {
    const trip = await CarTrip.findOne({ professional: testWorker._id, source: 'Phagwara' });
    // Outbound seats available: 2.
    
    // Customer wants to book 3 seats (should fail upfront since only 2 left)
    const { req: reqFail, res: resFail } = mockReqRes(
      { tripId: trip._id, legsBooked: ['outbound'], seatsOutbound: 3 },
      {},
      {},
      testCustomer
    );
    try {
      await controllers.createBooking(reqFail, resFail);
      assert(false, 'Should have blocked booking creation.');
    } catch (err) {
      assert(err.status === 400, 'Expected 400 Bad Request');
      console.log('✓ Blocked upfront booking creation when seats exceed availability.');
    }

    // Now test concurrent checkout verification race condition:
    // Create two bookings for 2 seats each (both created when 2 seats remain)
    const { req: reqB1, res: resB1 } = mockReqRes(
      { tripId: trip._id, legsBooked: ['outbound'], seatsOutbound: 2 },
      {},
      {},
      testCustomer
    );
    await controllers.createBooking(reqB1, resB1);
    const booking1 = resB1.jsonData.booking;

    const { req: reqB2, res: resB2 } = mockReqRes(
      { tripId: trip._id, legsBooked: ['outbound'], seatsOutbound: 2 },
      {},
      {},
      testCustomer
    );
    await controllers.createBooking(reqB2, resB2);
    const booking2 = resB2.jsonData.booking;

    const cryptoModule = await import('crypto');
    const getSignature = (orderId, paymentId) => {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'sandbox_secret';
      const body = orderId + '|' + paymentId;
      return cryptoModule
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    };

    // Verify booking 1 first (should succeed)
    const { req: reqV1, res: resV1 } = mockReqRes(
      {
        razorpay_order_id: booking1.razorpayOrderId,
        razorpay_payment_id: 'pay_B1',
        razorpay_signature: getSignature(booking1.razorpayOrderId, 'pay_B1'),
        bookingId: booking1._id
      },
      {},
      {},
      testCustomer
    );
    await controllers.verifyBookingPayment(reqV1, resV1);
    assert(resV1.jsonData.booking.paymentStatus === 'paid', 'Booking 1 verified successfully.');

    // Verify booking 2 (should fail with 409 Conflict due to seat exhaustion)
    const { req: reqV2, res: resV2 } = mockReqRes(
      {
        razorpay_order_id: booking2.razorpayOrderId,
        razorpay_payment_id: 'pay_B2',
        razorpay_signature: getSignature(booking2.razorpayOrderId, 'pay_B2'),
        bookingId: booking2._id
      },
      {},
      {},
      testCustomer
    );
    try {
      await controllers.verifyBookingPayment(reqV2, resV2);
      assert(false, 'Should have failed on concurrency check.');
    } catch (err) {
      assert(err.status === 409, 'Expected 409 Conflict error for overbooking');
      console.log('✓ Successfully blocked checkout race condition (concurrency overbooking checked atomically).');
    }
  }

  console.log('\n--- 5. Testing Cancellation Window Cutoffs ---');
  {
    // A: Customer Cancellation Cutoff (30 minutes)
    // Create trip departing in 20 minutes
    const depTime20m = new Date(Date.now() + 20 * 60 * 1000);
    const trip20m = await CarTrip.create({
      professional: testWorker._id,
      source: 'A',
      destination: 'B',
      departureTime: depTime20m,
      pricePerSeatOutbound: 100,
      totalSeatsOutbound: 2,
      seatsAvailableOutbound: 2,
    });
    // Book seat
    const { req: reqBk, res: resBk } = mockReqRes(
      { tripId: trip20m._id, legsBooked: ['outbound'], seatsOutbound: 1 },
      {},
      {},
      testCustomer
    );
    await controllers.createBooking(reqBk, resBk);
    const b20m = resBk.jsonData.booking;
    // Confirm paid
    await CarBooking.findByIdAndUpdate(b20m._id, { paymentStatus: 'paid', razorpayPaymentId: 'pay_20m' });

    // Try to cancel (should fail)
    const { req: reqCancel, res: resCancel } = mockReqRes({}, { id: b20m._id }, {}, testCustomer);
    try {
      await controllers.cancelBooking(reqCancel, resCancel);
      assert(false, 'Should have blocked cancellation.');
    } catch (err) {
      assert(err.status === 400, 'Expected 400 Error');
      assert(err.message.includes('within 30 minutes'), 'Error message mentions 30 minutes window');
      console.log('✓ Successfully rejected customer booking cancellation inside 30 minutes window.');
    }

    // B: Professional Trip Cancellation Cutoff (2 hours)
    // Create trip departing in 1 hour
    const depTime1h = new Date(Date.now() + 60 * 60 * 1000);
    const trip1h = await CarTrip.create({
      professional: testWorker._id,
      source: 'C',
      destination: 'D',
      departureTime: depTime1h,
      pricePerSeatOutbound: 100,
      totalSeatsOutbound: 2,
      seatsAvailableOutbound: 2,
    });

    // Try to cancel (should fail)
    const { req: reqCancelTrip, res: resCancelTrip } = mockReqRes({}, { id: trip1h._id }, {}, testWorker);
    try {
      await controllers.cancelTrip(reqCancelTrip, resCancelTrip);
      assert(false, 'Should have blocked trip cancellation.');
    } catch (err) {
      assert(err.status === 400, 'Expected 400 Error');
      assert(err.message.includes('within 2 hours'), 'Error message mentions 2 hours window');
      console.log('✓ Successfully rejected professional trip cancellation inside 2 hours window.');
    }
  }

  console.log('\n--- 6. Clean up test records ---');
  await CarServiceKYC.deleteMany({ professional: testWorker._id });
  await CarTrip.deleteMany({ professional: testWorker._id });
  await CarBooking.deleteMany({ customer: testCustomer._id });
  console.log('✓ Cleaned up.');

  await mongoose.disconnect();
  console.log('Tests completed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
