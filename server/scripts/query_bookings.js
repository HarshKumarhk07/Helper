import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Service from '../src/models/Service.js';
import Booking from '../src/models/Booking.js';

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5).populate('user', 'email').populate('worker', 'name').populate('service', 'name');
  console.log(JSON.stringify(bookings, null, 2));
  await mongoose.disconnect();
};

main().catch(console.error);
