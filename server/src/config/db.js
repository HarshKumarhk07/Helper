import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[urbanease] mongo connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

export default connectDB;
