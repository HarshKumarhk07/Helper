import 'dotenv/config';
import mongoose from 'mongoose';
import Address from '../src/models/Address.js';

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const addrs = await Address.find({ user: '6a45ed840b4f943f875eb296' });
  console.log(JSON.stringify(addrs, null, 2));
  await mongoose.disconnect();
};

main().catch(console.error);
