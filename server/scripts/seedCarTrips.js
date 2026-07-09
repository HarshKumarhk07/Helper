import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import CarServiceKYC from '../src/models/CarServiceKYC.js';
import CarTrip from '../src/models/CarTrip.js';
import { ROLES } from '../src/config/roles.js';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Find or create a professional worker to host the trips
  let driver = await User.findOne({ email: 'driver@helper.com' });
  if (!driver) {
    driver = await User.create({
      name: 'Rajesh Kumar',
      email: 'driver@helper.com',
      phone: '9876543210',
      password: 'Password123!',
      role: ROLES.WORKER,
      kycStatus: 'verified',
      experienceYears: 5,
      ratingAvg: 4.8,
      ratingCount: 15,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    });
    console.log('Created driver Rajesh Kumar (driver@helper.com)');
  } else {
    // Ensure driver has worker role and verified KYC status
    driver.role = ROLES.WORKER;
    driver.kycStatus = 'verified';
    await driver.save();
    console.log('Found existing driver Rajesh Kumar.');
  }

  // 2. Ensure driver has approved Car Service KYC
  let kyc = await CarServiceKYC.findOne({ professional: driver._id });
  if (!kyc) {
    kyc = await CarServiceKYC.create({
      professional: driver._id,
      rcDocument: 'https://res.cloudinary.com/dxn5nny8v/image/upload/v1720524419/helper/dummy_rc.png',
      carNumber: 'PB08AB1234',
      carPhoto: 'https://res.cloudinary.com/dxn5nny8v/image/upload/v1720524419/helper/dummy_car.png',
      drivingLicense: 'https://res.cloudinary.com/dxn5nny8v/image/upload/v1720524419/helper/dummy_dl.png',
      drivingLicenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'approved',
    });
    console.log('Seeded Car Service KYC: PB08AB1234 (Approved).');
  } else {
    kyc.status = 'approved';
    kyc.drivingLicenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await kyc.save();
    console.log('Driver Car KYC set to Approved.');
  }

  // 3. Clear out existing trips for this driver to avoid duplicate lists
  await CarTrip.deleteMany({ professional: driver._id });

  // 4. Create 3 new active future trips
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  const tripsToCreate = [
    {
      professional: driver._id,
      source: 'Phagwara',
      destination: 'Jalandhar',
      departureTime: tomorrow,
      pricePerSeatOutbound: 150,
      totalSeatsOutbound: 4,
      seatsAvailableOutbound: 4,
      status: 'active',
    },
    {
      professional: driver._id,
      source: 'Jalandhar',
      destination: 'Amritsar',
      departureTime: nextWeek,
      pricePerSeatOutbound: 350,
      totalSeatsOutbound: 6,
      seatsAvailableOutbound: 6,
      status: 'active',
    },
    {
      professional: driver._id,
      source: 'Phagwara',
      destination: 'Ludhiana',
      departureTime: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000), // tomorrow afternoon
      returnTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // tomorrow night
      pricePerSeatOutbound: 250,
      totalSeatsOutbound: 4,
      seatsAvailableOutbound: 4,
      pricePerSeatReturn: 300,
      totalSeatsReturn: 4,
      seatsAvailableReturn: 4,
      status: 'active',
    }
  ];

  await CarTrip.create(tripsToCreate);
  console.log('Seeded 3 active car trips:');
  console.log('  1. Phagwara → Jalandhar (Tomorrow 10:00 AM) - ₹150');
  console.log('  2. Jalandhar → Amritsar (Next Week 2:30 PM) - ₹350');
  console.log('  3. Phagwara ↔ Ludhiana (Tomorrow Round Trip) - ₹250 Outbound / ₹300 Return');

  await mongoose.disconnect();
  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
