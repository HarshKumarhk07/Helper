// Renames legacy "Velora" branding on existing user display names.
// Only touches the `name` field so login emails (identifiers) stay intact.
// Safe to run multiple times — no-op once names are migrated.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();

  const res1 = await User.updateMany(
    { name: /velora/i },
    [
      {
        $set: {
          name: {
            $replaceAll: {
              input: {
                $replaceAll: { input: '$name', find: 'Velora', replacement: 'Helper' },
              },
              find: 'velora',
              replacement: 'helper',
            },
          },
        },
      },
    ]
  );

  const res2 = await User.updateMany(
    { name: /urbanease/i },
    [
      {
        $set: {
          name: {
            $replaceAll: {
              input: {
                $replaceAll: { input: '$name', find: 'UrbanEase', replacement: 'Helper' },
              },
              find: 'urbanease',
              replacement: 'helper',
            },
          },
        },
      },
    ]
  );

  const modifiedCount = res1.modifiedCount + res2.modifiedCount;

  console.log(`[rename-brand] names updated: ${modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[rename-brand] failed:', err);
  process.exit(1);
});
