// Wipes Products and Services so the catalog can be rebuilt from scratch.
// Categories and users are untouched.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Service from '../models/Service.js';

const run = async () => {
  await connectDB();

  const beforeProducts = await Product.countDocuments();
  const beforeServices = await Service.countDocuments();

  const productResult = await Product.deleteMany({});
  const serviceResult = await Service.deleteMany({});

  console.log(
    `[cleanup-catalog] products: deleted ${productResult.deletedCount} of ${beforeProducts}`
  );
  console.log(
    `[cleanup-catalog] services: deleted ${serviceResult.deletedCount} of ${beforeServices}`
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[cleanup-catalog] failed:', err);
  process.exit(1);
});
