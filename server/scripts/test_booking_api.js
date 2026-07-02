import 'dotenv/config';

const main = async () => {
  // 1. Sign up a new user to ensure fresh environment
  const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Customer',
      email: `test_customer_${Date.now()}@example.com`,
      phone: '9999999999',
      password: 'Password123!',
    }),
  });

  const signupData = await signupRes.json();
  if (signupRes.status !== 201) {
    console.error('Signup failed:', signupData);
    return;
  }
  const token = signupData.accessToken;
  console.log('Signed up user successfully. Token obtained.');

  // Get a service from database to book
  // Let's connect to mongoose to find a service ID
  const mongoose = await import('mongoose');
  const Service = (await import('../src/models/Product.js')).default; // wait, let's use the actual Service model
  const ServiceModel = (await import('../src/models/Service.js')).default;
  await mongoose.connect(process.env.MONGO_URI);
  const serviceObj = await ServiceModel.findOne({ isActive: true });
  await mongoose.disconnect();

  if (!serviceObj) {
    console.error('No active services found in database');
    return;
  }
  console.log('Found service to book:', serviceObj.name, 'ID:', serviceObj._id);

  // 2. Call POST /api/bookings
  const bookingPayload = {
    service: serviceObj._id,
    type: 'instant',
    paymentMode: 'online',
    autoAssign: true,
    address: {
      line1: '123 Test St',
      city: 'Phagwara',
      state: 'Punjab',
      pincode: '144001',
      lat: 31.22,
      lng: 75.77
    }
  };

  const bookingRes = await fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingPayload)
  });

  console.log('POST /api/bookings status:', bookingRes.status);
  const bookingData = await bookingRes.json();
  console.log('POST /api/bookings response:', JSON.stringify(bookingData, null, 2));

  if (bookingRes.status !== 201) {
    return;
  }

  const booking = bookingData.booking;

  // 3. Call POST /api/payments/create-order
  const createRpRes = await fetch('http://localhost:5000/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: booking.amount,
      receipt: booking.code,
      type: 'booking'
    })
  });

  console.log('POST /api/payments/create-order status:', createRpRes.status);
  const createRpData = await createRpRes.json();
  console.log('POST /api/payments/create-order response:', JSON.stringify(createRpData, null, 2));
};

main().catch(console.error);
