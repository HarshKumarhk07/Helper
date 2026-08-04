import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Order = (await import('./src/models/Order.js')).default;
    const order = await Order.findOne();
    if (order) {
      await order.populate('user', 'name email');
      await order.populate('items.product', 'name slug image price brand');
      console.log('Populated user:', order.user);
      console.log('Populated product:', order.items[0]?.product);
    } else {
      console.log('No order found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};
run();
