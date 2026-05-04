import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';

const run = async () => {
  await connectDB();
  await Product.deleteMany({});
  console.log('[cleanup] all products deleted');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[cleanup] failed:', err);
  process.exit(1);
});
