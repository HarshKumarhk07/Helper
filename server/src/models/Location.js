import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, lowercase: true, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

const Location = mongoose.model('Location', locationSchema);
export default Location;
