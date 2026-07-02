import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const users = await User.find({}, 'name email role password');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
};

main().catch(console.error);
