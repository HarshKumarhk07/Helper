import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    grossAmount: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 1 },
    commissionAmount: { type: Number, required: true, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'settled', 'voided'],
      default: 'pending',
      index: true,
    },
    completedAt: { type: Date, required: true, index: true },
    settledAt: { type: Date, default: null },
    payoutBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutBatch',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

earningSchema.index({ worker: 1, status: 1 });

const Earning = mongoose.model('Earning', earningSchema);
export default Earning;
