import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../src/models/Booking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGO_URI is required in .env');
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({ finalPayableAmount: null });
    console.log(`Found ${bookings.length} bookings to migrate`);

    let count = 0;
    for (const booking of bookings) {
      // Legacy bookings had amount = final amount.
      // Since the new schema dictates `amount` = Original Amount, we MUST update `amount` for legacy bookings to be `amount + discountAmount`,
      // AND set `finalPayableAmount = amount (the old one)`.
      
      const oldAmount = booking.amount || 0; // This was the final payable amount in legacy
      const discount = booking.discountAmount || 0;
      
      const newFinalPayableAmount = oldAmount;
      const newOriginalAmount = oldAmount + discount;

      await Booking.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            amount: newOriginalAmount,
            finalPayableAmount: newFinalPayableAmount 
          }
        }
      );
      count++;
    }

    console.log(`Successfully migrated ${count} bookings`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
