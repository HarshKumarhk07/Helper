// Renames legacy "Velora" branding on existing user display names.
// Only touches the `name` field so login emails (identifiers) stay intact.
// Safe to run multiple times — no-op once names are migrated.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();

  const res = await User.updateMany(
    { name: /velora/i },
    [
      {
        $set: {
          name: {
            $replaceAll: {
              input: {
                $replaceAll: { input: '$name', find: 'Velora', replacement: 'UrbanEase' },
              },
              find: 'velora',
              replacement: 'urbanease',
            },
          },
        },
      },
    ]
  );

  console.log(`[rename-brand] names updated: ${res.modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[rename-brand] failed:', err);
  process.exit(1);
});
