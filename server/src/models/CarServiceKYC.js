import mongoose from 'mongoose';

const carServiceKycSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    rcDocument: { type: String, required: true },
    carNumber: { type: String, required: true },
    carPhoto: { type: String, required: true },
    drivingLicense: { type: String, required: true },
    drivingLicenseExpiry: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const CarServiceKYC = mongoose.model('CarServiceKYC', carServiceKycSchema);
export default CarServiceKYC;
